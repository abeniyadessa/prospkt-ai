import { generateCallScript } from "@/lib/claude";
import type { LeadContext } from "@/lib/claude";
import { createAssistant, initiateCall, type VapiCall, type VapiTool } from "@/lib/vapi";
import { DEMO_OPENAI_REALTIME_VOICE_ID } from "@/lib/voice";
import {
  getScriptSettings,
  getWorkspaceSettings,
  markLeadCallStarted,
  rememberLeadContact,
} from "@/lib/database";
import type { Lead } from "@/lib/types";
import { getNormalizedLeadPhone } from "@/lib/agents/guardrails";

function leadToContext(lead: Lead, workspaceId: string): LeadContext {
  const settings = workspaceId ? getWorkspaceSettings(workspaceId) : null;
  return {
    name: lead.name,
    workspaceName: settings?.companyName ?? null,
    category: lead.category,
    city: lead.city,
    websiteStatus: lead.websiteStatus,
    priorityScore: lead.priorityScore,
    contactType: lead.contactType,
    source: lead.source,
    consentNote: lead.consentNote,
    serviceNeed: lead.serviceNeed,
    serviceArea: lead.serviceArea,
    estimateValueCents: lead.estimateValueCents,
    campaignLane: lead.campaignLane,
    playbook: lead.playbook,
  };
}

function buildBookingTools(webhookBase: string): VapiTool[] {
  return [
    {
      type: "function",
      function: {
        name: "check_availability",
        description:
          "Check available appointment slots. Call this when the contact is ready to schedule or wants to know what times are open.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      server: { url: `${webhookBase}/api/vapi/webhook` },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description:
          "Book the appointment once the contact confirms a specific time slot.",
        parameters: {
          type: "object",
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
            leadId: {
              type: "string",
              description: "The leadId variable provided in the call context.",
            },
            businessName: {
              type: "string",
              description: "The businessName variable provided in the call context.",
            },
            phone: {
              type: "string",
              description: "The lead phone number variable provided in the call context.",
            },
          },
          required: ["start", "attendeeName", "attendeeEmail"],
        },
      },
      server: { url: `${webhookBase}/api/vapi/webhook` },
    },
  ];
}

export async function callLead(
  lead: Lead,
  workspaceId: string,
  timezone?: string,
): Promise<VapiCall> {
  const phone = getNormalizedLeadPhone(lead);
  const leadContext = leadToContext(lead, workspaceId);
  const script = await generateCallScript(leadContext, workspaceId);
  const voiceSettings = getScriptSettings(workspaceId);
  const webhookBase =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const assistant = await createAssistant({
    name: `Prospkt-${lead.id.slice(-8)}`,
    model: voiceSettings.realtimeModel,
    voiceId: voiceSettings.realtimeVoiceId,
    systemPrompt: script.systemPrompt,
    firstMessage: script.firstMessage,
    tools: buildBookingTools(webhookBase),
  });

  const call = await initiateCall({
    phoneNumber: phone,
    assistantId: assistant.id,
    assistantOverrides: {
      variableValues: {
        leadId: lead.id,
        workspaceId: workspaceId ?? "",
        businessName: lead.name,
        phone,
        city: lead.city,
        category: lead.category,
        serviceNeed: lead.serviceNeed ?? "",
        serviceArea: lead.serviceArea ?? "",
        campaignLane: lead.campaignLane ?? "",
        playbook: lead.playbook ?? "",
      },
    },
    metadata: {
      leadId: lead.id,
      workspaceId: workspaceId ?? "",
      businessName: lead.name,
      phone,
      city: lead.city,
      category: lead.category,
      serviceNeed: lead.serviceNeed ?? "",
      serviceArea: lead.serviceArea ?? "",
      campaignLane: lead.campaignLane ?? "",
      playbook: lead.playbook ?? "",
      timezone: timezone ?? lead.timezone ?? "",
    },
  });

  await markLeadCallStarted(lead.id, workspaceId);
  rememberLeadContact(lead, "called", workspaceId, timezone);
  return call;
}

export interface AdHocCallInput {
  phone: string;
  businessName: string;
  category?: string;
  city?: string;
  websiteStatus?: "none" | "outdated" | "modern";
  contactType?: "business" | "consumer";
  source?: string;
  consentNote?: string;
  serviceNeed?: string;
  serviceArea?: string;
  campaignLane?: "warm_recovery" | "cold_b2b" | "cold_consumer";
  playbook?: string;
  workspaceId: string;
}

// One-off call to an arbitrary number (e.g. testing with your own phone).
// Skips DB persistence — does not pollute leads, lead_calls, or memory tables.
export async function placeAdHocCall(input: AdHocCallInput): Promise<VapiCall> {
  const phone = input.phone.trim();
  const settings = input.workspaceId ? getWorkspaceSettings(input.workspaceId) : null;
  const leadContext: LeadContext = {
    name: input.businessName,
    workspaceName: settings?.companyName ?? null,
    category: input.category ?? "local business",
    city: input.city ?? "",
    websiteStatus: input.websiteStatus ?? "outdated",
    priorityScore: 7,
    contactType: input.contactType,
    source: input.source,
    consentNote: input.consentNote,
    serviceNeed: input.serviceNeed,
    serviceArea: input.serviceArea ?? input.city,
    campaignLane: input.campaignLane,
    playbook: input.playbook,
    demoMode: true,
  };
  const script = await generateCallScript(leadContext, input.workspaceId);
  const voiceSettings = getScriptSettings(input.workspaceId);
  const adHocId = `adhoc_${Date.now().toString(36)}`;
  const assistant = await createAssistant({
    name: `Prospkt-test-${adHocId.slice(-6)}`,
    model: voiceSettings.realtimeModel,
    voiceId: DEMO_OPENAI_REALTIME_VOICE_ID,
    systemPrompt: script.systemPrompt,
    firstMessage: script.firstMessage,
    tools: [],
  });
  return initiateCall({
    phoneNumber: phone,
    assistantId: assistant.id,
    assistantOverrides: {
      variableValues: {
        leadId: adHocId,
        workspaceId: input.workspaceId ?? "",
        businessName: input.businessName,
        phone,
        city: input.city ?? "",
        category: input.category ?? "",
      },
    },
    metadata: {
      adHoc: "true",
      leadId: adHocId,
      workspaceId: input.workspaceId ?? "",
      businessName: input.businessName,
      phone,
      city: input.city ?? "",
      category: input.category ?? "",
    },
  });
}
