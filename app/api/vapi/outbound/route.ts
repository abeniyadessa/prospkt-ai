import { NextRequest, NextResponse } from "next/server";
import { generateCallScript } from "@/lib/claude";
import { createAssistant, initiateCall } from "@/lib/vapi";
import { isOnDNC } from "@/lib/dnc";
import type { LeadContext } from "@/lib/claude";

// ─── TCPA helpers ─────────────────────────────────────────────────────────────

/** Returns true if the current time in Michigan (America/Detroit) is within
 *  the TCPA-safe window of 8:00 AM – 9:00 PM local time. */
function isWithinCallingHours(): boolean {
  const now = new Date();
  const hour = Number(
    now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Detroit" })
  );
  return hour >= 8 && hour < 21; // 8am–9pm
}

// POST /api/vapi/outbound
// Body: LeadContext + phone number
// Creates a one-off assistant with a personalized script and dials the lead.

interface OutboundRequest extends LeadContext {
  phone: string; // E.164 format: +15551234567
  leadId: string;
}

export async function POST(request: NextRequest) {
  let body: OutboundRequest;
  try {
    body = (await request.json()) as OutboundRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phone, leadId, ...leadContext } = body;

  if (!phone || !leadId) {
    return NextResponse.json(
      { error: "Missing required fields: phone, leadId" },
      { status: 400 }
    );
  }

  try {
    // ── TCPA gate 1: calling hours (8am–9pm Michigan time) ────────────────────
    if (!isWithinCallingHours()) {
      return NextResponse.json(
        { error: "Outside calling hours. TCPA permits calls 8am–9pm local time only." },
        { status: 403 }
      );
    }

    // ── TCPA gate 2: DNC (Do Not Call) check ─────────────────────────────────
    if (await isOnDNC(phone)) {
      return NextResponse.json(
        { error: "This number is on the Do Not Call list." },
        { status: 403 }
      );
    }

    // 1. Generate personalized script via Claude
    const script = await generateCallScript(leadContext);

    // 2. Build Vapi tool definitions — these fire mid-call
    const webhookBase = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "check_availability",
          description:
            "Check available discovery call slots. Call this when the lead says they are interested and wants to know what times are available.",
          parameters: {
            type: "object" as const,
            properties: {} as Record<string, { type: string; description: string }>,
            required: [] as string[],
          },
        },
        server: { url: `${webhookBase}/api/vapi/webhook` },
      },
      {
        type: "function" as const,
        function: {
          name: "book_appointment",
          description:
            "Book the discovery call once the lead confirms a specific time slot.",
          parameters: {
            type: "object" as const,
            properties: {
              start: {
                type: "string",
                description: "ISO 8601 datetime of the chosen slot, e.g. 2026-04-17T14:00:00Z",
              },
              attendeeName: {
                type: "string",
                description: "Full name of the person being booked",
              },
              attendeeEmail: {
                type: "string",
                description: "Email address of the person being booked",
              },
            },
            required: ["start", "attendeeName", "attendeeEmail"],
          },
        },
        server: { url: `${webhookBase}/api/vapi/webhook` },
      },
    ];

    // 3. Create a fresh assistant with this lead's script + tools
    // Vapi enforces max 40 char name
    const shortName = `Prospkt-${leadId.slice(-8)}`;
    const assistant = await createAssistant({
      name: shortName,
      systemPrompt: script.systemPrompt,
      firstMessage: script.firstMessage,
      tools: tools as import("@/lib/vapi").VapiTool[],
    });

    // 4. Dial the lead — pass metadata so the webhook can log it to ClickUp
    const call = await initiateCall({
      phoneNumber: phone,
      assistantId: assistant.id,
      assistantOverrides: {
        variableValues: { leadId, businessName: leadContext.name },
      },
      metadata: {
        leadId,
        businessName: leadContext.name,
        phone,
        city: leadContext.city,
        category: leadContext.category,
      },
    });

    return NextResponse.json({ callId: call.id, assistantId: assistant.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[vapi/outbound] FULL ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
