import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, bookSlot, spreadSlots } from "@/lib/calendar";
import { sendOptOutConfirmation, sendBookingConfirmation } from "@/lib/sms";
import { addToDNC } from "@/lib/dnc";
import { sendBookingNotification } from "@/lib/email";
import {
  addActivity,
  getLead,
  getWorkspace,
  rememberLeadContact,
  recordCall,
  updateLeadFromCallOutcome,
  updateLeadLifecycle,
} from "@/lib/database";

type CallOutcome =
  | "booked"
  | "not-interested"
  | "no-answer"
  | "voicemail"
  | "failed";

export const runtime = "nodejs";

// POST /api/vapi/webhook
// Vapi fires this for two types of events:
//   1. Tool calls mid-call (check_availability, book_appointment)
//   2. Call status updates (call-ended, transcript ready)

interface VapiToolCallEvent {
  message: {
    type: "tool-calls";
    call?: {
      id?: string;
      metadata?: Record<string, string>;
    };
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
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!expectedSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "VAPI_WEBHOOK_SECRET not configured" },
      { status: 503 }
    );
  }
  if (expectedSecret) {
    const provided =
      request.headers.get("x-vapi-secret") ??
      request.headers.get("x-webhook-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
          const tz =
            event.message.call?.metadata?.timezone || "America/Detroit";
          const allSlots = await getAvailableSlots(5, { timeZone: tz });
          if (allSlots.length === 0) {
            results.push({
              toolCallId: toolCall.id,
              result:
                "There are no open slots in the next 5 days. Offer to send a booking link so they can pick a time later.",
            });
          } else {
            const picks = spreadSlots(allSlots, 2, 6);
            const labels = picks.map((s) => {
              const dt = new Date(s.start);
              return dt.toLocaleString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: tz,
              });
            });
            results.push({
              toolCallId: toolCall.id,
              result: `Open slots (offer 2-3 of these to the lead — don't read all of them): ${labels.join("; ")}. When they pick one, call book_appointment with the matching ISO start time.`,
            });
          }
        } catch (err) {
          console.error("[vapi/webhook] check_availability error:", err);
          results.push({
            toolCallId: toolCall.id,
            result:
              "I'm having trouble checking availability right now. Offer to text them a booking link or have a human follow up.",
          });
        }
      } else if (name === "book_appointment") {
        try {
          const meta = event.message.call?.metadata ?? {};
          const workspaceId = meta.workspaceId;
          if (!workspaceId || !getWorkspace(workspaceId)) {
            results.push({
              toolCallId: toolCall.id,
              result:
                "I can't book this right now because the workspace context is missing. Please have a human follow up.",
            });
            continue;
          }
          const leadId = args.leadId ?? meta.leadId;
          const businessName =
            args.businessName ?? meta.businessName ?? args.attendeeName ?? "Business";
          const phone = args.phone ?? meta.phone ?? "";
          const tz = meta.timezone || "America/Detroit";

          // Don't silently book against a fake email — Cal.com sends invites
          // there and the lead never hears back. Force the agent to retry.
          const email = (args.attendeeEmail ?? "").trim();
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            results.push({
              toolCallId: toolCall.id,
              result:
                "I need a valid email address to send the calendar invite. Ask the lead to spell out their email, then call book_appointment again with attendeeEmail set.",
            });
            continue;
          }
          if (!args.start) {
            results.push({
              toolCallId: toolCall.id,
              result:
                "I need the chosen time as an ISO datetime. Pick one of the slots from check_availability and call book_appointment again with start set.",
            });
            continue;
          }

          const booking = await bookSlot({
            name: args.attendeeName ?? "Business Owner",
            email,
            phone,
            start: args.start,
            timeZone: tz,
            notes: `Booked via Prospkt AI sales call for ${businessName}`,
          });

          if (leadId) {
            await updateLeadLifecycle(leadId, {
              status: "booked",
              notes: `Booked on Cal.com: ${booking.uid}`,
            }, workspaceId);
          }

          if (phone) {
            sendBookingConfirmation(phone, businessName).catch((e) =>
              console.error("[webhook] booking SMS error:", e)
            );
          }

          sendBookingNotification({
            businessName,
            attendeeName: args.attendeeName ?? "Business Owner",
            attendeeEmail: args.attendeeEmail ?? "",
            startTime: args.start,
            phone,
          }).catch((e) => console.error("[webhook] email error:", e));

          if (leadId) {
            try {
              addActivity({
                leadId,
                type: "booking",
                body: `Booked discovery call for ${new Date(booking.start).toLocaleString("en-US", { timeZone: tz })}`,
                metadata: {
                  calcomEventId: booking.uid,
                  bookedAt: booking.start,
                  vapiCallId: event.message.call?.id ?? null,
                },
              }, workspaceId);
            } catch (e) {
              console.error("[webhook] booked activity log error:", e);
            }
          }

          results.push({
            toolCallId: toolCall.id,
            result: `Booking confirmed! The discovery call is set for ${new Date(booking.start).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZone: tz,
            })}. A confirmation will be sent to ${email}.`,
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
    const callId = event.message.call?.id ?? "unknown";
    const meta = event.message.call?.metadata ?? {};
    const workspaceId = meta.workspaceId;
    if (!workspaceId || !getWorkspace(workspaceId)) {
      console.warn("[vapi/webhook] end-of-call-report missing or unknown workspaceId:", workspaceId);
      return NextResponse.json({ received: true, ignored: "unknown-workspace" });
    }
    const existingLead = meta.leadId ? await getLead(meta.leadId, workspaceId) : null;

    // Map Vapi end reason → our outcome type
    const outcome: CallOutcome =
      existingLead?.status === "booked" ? "booked"
      : endedReason.includes("voicemail") ? "voicemail"
      : endedReason.includes("no-answer") || endedReason.includes("busy") ? "no-answer"
      : endedReason.includes("customer-ended") || endedReason.includes("assistant-ended") ? "not-interested"
      : endedReason.includes("error") || endedReason.includes("failed") ? "failed"
      : "no-answer";

    // Calculate duration
    const startedAt = event.message.call?.startedAt;
    const endedAt = event.message.call?.endedAt;
    const duration =
      startedAt && endedAt
        ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
        : undefined;

    // ── Local CRM: record the call + a timeline activity ──────────────────────
    if (meta.leadId) {
      try {
        recordCall({
          leadId: meta.leadId,
          vapiCallId: callId,
          outcome,
          durationSeconds: duration ?? null,
          transcript: event.message.transcript ?? null,
          summary: event.message.summary ?? null,
          recordingUrl: event.message.recordingUrl ?? null,
          startedAt: startedAt ?? null,
          endedAt: endedAt ?? null,
        }, workspaceId);
        addActivity({
          leadId: meta.leadId,
          type: "call",
          body:
            event.message.summary
              ?? `Call ended: ${outcome.replace("-", " ")}${duration ? ` (${duration}s)` : ""}`,
          metadata: {
            vapiCallId: callId,
            outcome,
            durationSeconds: duration ?? null,
            endedReason,
          },
        }, workspaceId);
      } catch (err) {
        console.error("[vapi/webhook] local call log failed:", err);
      }
    }

    if (meta.leadId) {
      try {
        await updateLeadFromCallOutcome(meta.leadId, outcome, workspaceId);
        if (existingLead) {
          rememberLeadContact(existingLead, outcome, meta.timezone, workspaceId);
        }
      } catch (err) {
        console.error("[vapi/webhook] lifecycle update failed:", err);
      }
    }

    // Send SMS follow-up + DNC handling based on outcome (fire and forget)
    const phone = meta.phone;
    const businessName = meta.businessName ?? "there";
    const outcomeStr = outcome as string;
    if (phone && phone !== "—") {
      try {
        if (outcomeStr === "voicemail" || outcomeStr === "no-answer") {
          if (meta.leadId) {
            addActivity({
              leadId: meta.leadId,
              type: "note",
              body: "No-answer SMS skipped by V2 policy.",
              metadata: { outcome },
            }, workspaceId);
          }
          console.log("[vapi/webhook] No-answer SMS skipped by V2 policy for", phone);
        } else if (outcomeStr === "booked" && existingLead?.status !== "booked") {
          await sendBookingConfirmation(phone, businessName);
          console.log("[vapi/webhook] Booking confirmation SMS sent to", phone);
        } else if (outcomeStr === "not-interested") {
          // TCPA: add to DNC and send opt-out confirmation
          await addToDNC(phone, workspaceId);
          if (meta.leadId) {
            await updateLeadLifecycle(meta.leadId, { status: "dnc" }, workspaceId);
          }
          await sendOptOutConfirmation(phone, businessName);
          console.log("[vapi/webhook] Added to DNC + opt-out SMS sent to", phone);
        }
      } catch (err) {
        console.error("[vapi/webhook] SMS/DNC failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
