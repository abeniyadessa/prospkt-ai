import { NextRequest, NextResponse } from "next/server";
import { addAgentEvent, addDncEntry } from "@/lib/database";
import { GLOBAL_DNC_WORKSPACE_ID } from "@/lib/workspace-context";

export const runtime = "nodejs";

const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

function twiml(message?: string) {
  const body = message
    ? `<Message>${message.replace(/[<>&'"]/g, (char) => {
        const map: Record<string, string> = {
          "<": "&lt;",
          ">": "&gt;",
          "&": "&amp;",
          "'": "&apos;",
          '"': "&quot;",
        };
        return map[char];
      })}</Message>`
    : "";
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim().toUpperCase();
  const firstWord = body.split(/\s+/)[0];

  if (from && STOP_WORDS.has(firstWord)) {
    const normalized = addDncEntry(from, "sms_stop", GLOBAL_DNC_WORKSPACE_ID);
    addAgentEvent({
      type: "sms",
      severity: "success",
      message: "SMS opt-out received and added to DNC",
      metadata: { phone: normalized, keyword: firstWord },
    }, GLOBAL_DNC_WORKSPACE_ID);
    return twiml("You have been opted out. Prospkt will not call or text this number again.");
  }

  return twiml();
}
