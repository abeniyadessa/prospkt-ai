import { NextResponse } from "next/server";

// GET /api/settings/status
// Returns which integrations have API keys configured.

export async function GET() {
  return NextResponse.json({
    integrations: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      vapi: !!process.env.VAPI_API_KEY && !!process.env.VAPI_PHONE_NUMBER_ID,
      calcom: !!process.env.CALCOM_API_KEY && !!process.env.CALCOM_EVENT_TYPE_ID,
      clickup: !!process.env.CLICKUP_API_KEY && !!process.env.CLICKUP_LIST_ID,
      twilio: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
      yelp: !!process.env.YELP_API_KEY,
    },
    caller: {
      phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? null,
      vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID ?? null,
      calcomEventTypeId: process.env.CALCOM_EVENT_TYPE_ID ?? null,
    },
  });
}
