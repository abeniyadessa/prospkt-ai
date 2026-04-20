import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  return twilio(sid, token);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmsResult {
  sid: string;
  status: string;
}

// ─── Message templates ────────────────────────────────────────────────────────

function voicemailFollowUp(businessName: string, bookingUrl: string): string {
  return `Hi! This is Prospkt — we just tried calling ${businessName} about getting more customers online. Sorry we missed you! Book a free 30-min call here: ${bookingUrl} — no pressure, just ideas.`;
}

function bookedConfirmation(businessName: string, bookingUrl: string): string {
  return `Hi ${businessName}! Your discovery call is confirmed. Here's your booking link in case you need to reschedule: ${bookingUrl}. Talk soon!`;
}

function notInterestedOptOut(businessName: string): string {
  return `Hi ${businessName} — thanks for your time. We won't call again. Reply STOP anytime to opt out permanently.`;
}

// ─── Send SMS ─────────────────────────────────────────────────────────────────

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) throw new Error("TWILIO_PHONE_NUMBER is not configured");

  const client = getClient();
  const message = await client.messages.create({ to, from, body });

  return { sid: message.sid, status: message.status };
}

// ─── Follow-up templates ──────────────────────────────────────────────────────

const BOOKING_URL = "https://cal.com/abe-yadessa-zdeerb/30min";

export async function sendVoicemailFollowUp(
  to: string,
  businessName: string
): Promise<SmsResult> {
  return sendSms(to, voicemailFollowUp(businessName, BOOKING_URL));
}

export async function sendBookingConfirmation(
  to: string,
  businessName: string
): Promise<SmsResult> {
  return sendSms(to, bookedConfirmation(businessName, BOOKING_URL));
}

export async function sendOptOutConfirmation(
  to: string,
  businessName: string
): Promise<SmsResult> {
  return sendSms(to, notInterestedOptOut(businessName));
}
