import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { addAgentEvent, addDncEntry } from "@/lib/database";
import { GLOBAL_DNC_WORKSPACE_ID } from "@/lib/workspace-context";

export const runtime = "nodejs";

const STOP_WORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);

function verifyTwilioSignature(
  request: NextRequest,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    return process.env.NODE_ENV !== "production";
  }
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;
  const url = `${request.nextUrl.origin}${request.nextUrl.pathname}`;
  return twilio.validateRequest(authToken, signature, url, params);
}

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
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    params[key] = String(value);
  }

  if (!verifyTwilioSignature(request, params)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = params["From"] ?? "";
  const body = (params["Body"] ?? "").trim().toUpperCase();
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
