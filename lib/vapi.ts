// Vapi.ai REST API helpers
// Docs: https://docs.vapi.ai

const VAPI_API = "https://api.vapi.ai";

function vapiHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VapiCall {
  id: string;
  status: "queued" | "ringing" | "in-progress" | "ended" | "failed";
  phoneNumberId: string;
  assistantId?: string;
  endedReason?: string;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface OutboundCallRequest {
  phoneNumber: string;       // E.164 format: +15551234567
  assistantId: string;
  assistantOverrides?: {
    variableValues?: Record<string, string>;
  };
  metadata?: Record<string, string>;
}

// ─── Initiate outbound call ───────────────────────────────────────────────────

export async function initiateCall(request: OutboundCallRequest): Promise<VapiCall> {
  const res = await fetch(`${VAPI_API}/call/phone`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify({
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: request.phoneNumber,
      },
      assistantId: request.assistantId,
      assistantOverrides: request.assistantOverrides,
      maxDurationSeconds: 180,
      metadata: request.metadata,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi call error ${res.status}: ${text}`);
  }

  return (await res.json()) as VapiCall;
}

// ─── Create / upsert assistant ────────────────────────────────────────────────

export interface AssistantConfig {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  voice?: {
    provider: "11labs" | "openai" | "deepgram";
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  tools?: VapiTool[];
}

export interface VapiTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
  server?: { url: string };
}

export async function createAssistant(config: AssistantConfig): Promise<{ id: string }> {
  const body = {
    name: config.name,
    model: {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      messages: [{ role: "system", content: config.systemPrompt }],
      // Tools live inside model for Vapi's Anthropic provider
      ...(config.tools && config.tools.length > 0 ? { tools: config.tools } : {}),
    },
    voice: config.voice ?? {
      provider: "11labs",
      voiceId: process.env.ELEVENLABS_VOICE_ID ?? "nPczCjzI2devNBz1zQrb", // Brian — natural conversational male
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.1,
      useSpeakerBoost: true,
    },
    firstMessage: config.firstMessage,
    endCallFunctionEnabled: true,
    recordingEnabled: true,
  };

  const res = await fetch(`${VAPI_API}/assistant`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi create assistant error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { id: string };
  return data;
}

// ─── Get call details ─────────────────────────────────────────────────────────

export async function getCall(callId: string): Promise<VapiCall> {
  const res = await fetch(`${VAPI_API}/call/${callId}`, {
    headers: vapiHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vapi get call error ${res.status}: ${text}`);
  }

  return (await res.json()) as VapiCall;
}
