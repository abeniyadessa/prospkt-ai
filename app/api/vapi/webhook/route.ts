import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, bookSlot } from "@/lib/calendar";
import { logCall, type CallOutcome } from "@/lib/clickup";
import { sendVoicemailFollowUp, sendOptOutConfirmation, sendBookingConfirmation } from "@/lib/sms";

// POST /api/vapi/webhook
// Vapi fires this for two types of events:
//   1. Tool calls mid-call (check_availability, book_appointment)
//   2. Call status updates (call-ended, transcript ready)

interface VapiToolCallEvent {
  message: {
    type: "tool-calls";
    toolCallList: {
      id: string;
      function: {
        name: string;
        arguments: string; // JSON string
      };
    }[];
  };
}

interface VapiStatusEvent {
  message: {
    type: "end-of-call-report" | "status-update";
    call?: {
      id: string;
      endedReason?: string;
      metadata?: Record<string, string>;
      startedAt?: string;
      endedAt?: string;
    };
    transcript?: string;
    summary?: string;
    recordingUrl?: string;
  };
}

type VapiEvent = VapiToolCallEvent | VapiStatusEvent;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VapiEvent;
  const { type } = body.message;

  // ── Tool calls ──────────────────────────────────────────────────────────────
  if (type === "tool-calls") {
    const event = body as VapiToolCallEvent;
    const results: { toolCallId: string; result: string }[] = [];

    for (const toolCall of event.message.toolCallList) {
      const { name, arguments: argsJson } = toolCall.function;
      let args: Record<string, string> = {};
      try {
        args = JSON.parse(argsJson) as Record<string, string>;
      } catch {
        // empty args is fine for check_availability
      }

      if (name === "check_availability") {
        try {
          const slots = await getAvailableSlots(5);
          const top5 = slots.slice(0, 5).map((s) => {
            const dt = new Date(s.start);
            return dt.toLocaleString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/Detroit",
            });
          });
          results.push({
            toolCallId: toolCall.id,
            result: `Available slots: ${top5.join("; ")}. Ask the lead which one works best.`,
          });
        } catch (err) {
          results.push({
            toolCallId: toolCall.id,
            result: "I'm having trouble checking availability right now. Can I call you back to confirm a time?",
          });
        }
      } else if (name === "book_appointment") {
        try {
          const booking = await bookSlot({
            name: args.attendeeName ?? "Business Owner",
            email: args.attendeeEmail ?? "noreply@example.com",
            start: args.start,
            timeZone: "America/Detroit",
            notes: "Booked via Prospkt AI sales call",
          });
          results.push({
            toolCallId: toolCall.id,
            result: `Booking confirmed! The discovery call is set for ${new Date(booking.start).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/Detroit",
            })}. A confirmation will be sent to ${args.attendeeEmail}.`,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[vapi/webhook] book_appointment error:", message);
          results.push({
            toolCallId: toolCall.id,
            result: "I wasn't able to complete the booking right now. Can I have someone from the team follow up with you directly?",
          });
        }
      } else {
        results.push({
          toolCallId: toolCall.id,
          result: "Tool not recognized.",
        });
      }
    }

    // Vapi expects this exact shape to continue the conversation
    return NextResponse.json({ results });
  }

  // ── End of call report ──────────────────────────────────────────────────────
  if (type === "end-of-call-report") {
    const event = body as VapiStatusEvent;
    const endedReason = event.message.call?.endedReason ?? "";

    // Map Vapi end reason → our outcome type
    const outcome: CallOutcome =
      endedReason.includes("voicemail") ? "voicemail"
      : endedReason.includes("no-answer") || endedReason.includes("busy") ? "no-answer"
      : endedReason.includes("customer-ended") || endedReason.includes("assistant-ended") ? "not-interested"
      : endedReason.includes("error") || endedReason.includes("failed") ? "failed"
      : "no-answer";

    const callId = event.message.call?.id ?? "unknown";
    const meta = event.message.call?.metadata ?? {};

    // Calculate duration
    const startedAt = event.message.call?.startedAt;
    const endedAt = event.message.call?.endedAt;
    const duration =
      startedAt && endedAt
        ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        : undefined;

    try {
      await logCall({
        leadId: meta.leadId ?? callId,
        businessName: meta.businessName ?? "Unknown Business",
        phone: meta.phone ?? "—",
        city: meta.city ?? "Michigan",
        category: meta.category ?? "—",
        outcome,
        vapiCallId: callId,
        duration,
        summary: event.message.summary,
        transcript: event.message.transcript,
      });
      console.log("[vapi/webhook] Logged to ClickUp:", outcome, callId);
    } catch (err) {
      console.error("[vapi/webhook] ClickUp log failed:", err);
    }

    // Send SMS follow-up based on outcome (fire and forget)
    const phone = meta.phone;
    const businessName = meta.businessName ?? "there";
    const outcomeStr = outcome as string;
    if (phone && phone !== "—") {
      try {
        if (outcomeStr === "voicemail" || outcomeStr === "no-answer") {
          await sendVoicemailFollowUp(phone, businessName);
          console.log("[vapi/webhook] Voicemail follow-up SMS sent to", phone);
        } else if (outcomeStr === "booked") {
          await sendBookingConfirmation(phone, businessName);
          console.log("[vapi/webhook] Booking confirmation SMS sent to", phone);
        } else if (outcomeStr === "not-interested") {
          await sendOptOutConfirmation(phone, businessName);
          console.log("[vapi/webhook] Opt-out SMS sent to", phone);
        }
      } catch (err) {
        console.error("[vapi/webhook] SMS failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
