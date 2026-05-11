import { NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";

// GET /api/settings/status
// Returns which integrations have API keys configured.

export async function GET() {
  try {
    await requireWorkspaceForApi();
    const integrations = {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      vapi: !!process.env.VAPI_API_KEY && !!process.env.VAPI_PHONE_NUMBER_ID,
      calcom: !!process.env.CALCOM_API_KEY && !!process.env.CALCOM_EVENT_TYPE_ID,
      twilio:
        !!process.env.TWILIO_ACCOUNT_SID &&
        !!process.env.TWILIO_AUTH_TOKEN &&
        !!process.env.TWILIO_PHONE_NUMBER,
      resend: !!process.env.RESEND_API_KEY,
      yelp: !!process.env.YELP_API_KEY,
      google_places: !!process.env.GOOGLE_PLACES_API_KEY,
    };

    return NextResponse.json({
      integrations,
      caller: {
        phoneNumber: process.env.TWILIO_PHONE_NUMBER ?? null,
        vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID ?? null,
        calcomEventTypeId: process.env.CALCOM_EVENT_TYPE_ID ?? null,
      },
      workflow: {
        leadEngine: integrations.yelp,
        voiceCaller: integrations.anthropic && integrations.vapi,
        booking: integrations.calcom,
        postCallHandoff: integrations.twilio && integrations.resend,
        compliance: true,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
