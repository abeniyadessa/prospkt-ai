// Vapi.ai REST API helpers
// Docs: https://docs.vapi.ai

import {
  resolveOpenAIRealtimeModel,
  resolveOpenAIRealtimeVoiceId,
  type OpenAIRealtimeModel,
  type OpenAIRealtimeVoiceId,
} from "@/lib/voice";

const VAPI_API = "https://api.vapi.ai";

function vapiHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Vapi returns errors as JSON or plain text — surface a one-line, human-readable
// message instead of dumping the raw payload into the UI.
function humanizeVapiError(status: number, body: string): string {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    /* leave as text */
  }
  const message =
    (parsed && typeof parsed === "object" && parsed !== null
      ? ((parsed as { message?: unknown }).message as string | string[] | undefined)
      : undefined) ?? body;
  const text = (Array.isArray(message) ? message.join(" ") : message ?? "").toString();
  const lower = text.toLowerCase();

  if (lower.includes("daily outbound call limit") || lower.includes("daily call limit")) {
    return "Vapi daily call limit reached (10/day on free accounts). Import a Twilio number in Vapi to remove the cap, or wait until tomorrow.";
  }
  if (status === 401 || lower.includes("unauthorized") || lower.includes("invalid api key")) {
    return "Vapi rejected the API key. Check VAPI_API_KEY in your environment.";
  }
  if (status === 402 || lower.includes("insufficient") || lower.includes("balance")) {
    return "Vapi account balance is too low. Add credits in the Vapi dashboard.";
  }
  if (status === 403) {
    return text || "Vapi blocked this call (403). Check phone number permissions.";
  }
  if (status === 429 || lower.includes("rate limit")) {
    return "Vapi rate limit hit. Wait a moment and try again.";
  }
  if (lower.includes("phone number") && lower.includes("not found")) {
    return "Vapi phone number ID is invalid. Check VAPI_PHONE_NUMBER_ID.";
  }
  // Fallback — short, no JSON dump.
  if (text && text.length < 200) return text;
  return `Vapi error ${status}`;
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
    console.error(`[vapi] call error ${res.status}: ${text}`);
    throw new Error(humanizeVapiError(res.status, text));
  }

  return (await res.json()) as VapiCall;
}

// ─── Create / upsert assistant ────────────────────────────────────────────────

export interface AssistantConfig {
  name: string;
  systemPrompt: string;
  firstMessage: string;
  model?: OpenAIRealtimeModel;
  voiceId?: OpenAIRealtimeVoiceId;
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
  // OpenAI Realtime: speech-to-speech (no STT→LLM→TTS hop). Gives the
  // sales receptionist natural turn-taking and interruptions. Voice is bundled
  // with the model — only certain voices are compatible.
  const model = resolveOpenAIRealtimeModel(config.model ?? process.env.OPENAI_REALTIME_MODEL);
  const voiceId = resolveOpenAIRealtimeVoiceId(config.voiceId ?? process.env.OPENAI_REALTIME_VOICE);

  const body = {
    name: config.name,
    model: {
      provider: "openai",
      model,
      messages: [{ role: "system", content: config.systemPrompt }],
      temperature: 0.7,
      ...(config.tools && config.tools.length > 0 ? { tools: config.tools } : {}),
    },
    voice: {
      provider: "openai",
      voiceId,
    },
    firstMessage: config.firstMessage,
    firstMessageMode: "assistant-speaks-first",

    // ── Receptionist-like conversational feel ─────────────────────────────
    backchannelingEnabled: true,         // light "mhm", "sure", "got it" while listening
    backgroundDenoisingEnabled: true,
    responseDelaySeconds: 0.65,          // calm front-desk beat before responding
    llmRequestDelaySeconds: 0.1,
    silenceTimeoutSeconds: 35,           // give them room to think
    maxDurationSeconds: 360,             // 6 min — real conversations need time

    // Smart turn-taking: wait until they're actually done before replying.
    startSpeakingPlan: {
      waitSeconds: 0.65,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.2,
        onNoPunctuationSeconds: 1.6,
        onNumberSeconds: 0.5,
      },
    },
    // Stop talking gracefully when interrupted.
    stopSpeakingPlan: {
      numWords: 2,
      voiceSeconds: 0.2,
      backoffSeconds: 1.0,
    },
    // Easy interruption = natural conversation.
    numWordsToInterruptAssistant: 2,

    // CRITICAL: Vapi's default voicemail detection misclassifies real humans
    // and ends the call. Disable it — the prompt handles voicemail instead.
    voicemailDetection: {
      provider: "twilio",
      enabled: false,
    },
    voicemailMessage:
      "Hey — this is Alex, the AI sales receptionist calling on behalf of the service team. Please give us a call back when you get a chance. Thanks.",

    // Don't let the model unilaterally end calls — too eager to hang up
    // on mild hesitation. Calls end on customer hangup or max duration.
    endCallFunctionEnabled: false,
    recordingEnabled: true,
  };

  const res = await fetch(`${VAPI_API}/assistant`, {
    method: "POST",
    headers: vapiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[vapi] create assistant error ${res.status}: ${text}`);
    throw new Error(humanizeVapiError(res.status, text));
  }

  const data = (await res.json()) as { id: string };
  return data;
}

// ─── Today's call count (pre-flight for free-tier daily limit) ───────────────
// Vapi free accounts cap outbound calls at 10/day. There's no usage endpoint,
// but /call?createdAtGe=<midnight> lets us count what we've already placed.

export async function getTodayCallCount(): Promise<{ used: number; limit: number }> {
  const limit = Number(process.env.VAPI_DAILY_LIMIT ?? "10");
  const midnightUtc = new Date();
  midnightUtc.setUTCHours(0, 0, 0, 0);
  const url = `${VAPI_API}/call?createdAtGe=${encodeURIComponent(
    midnightUtc.toISOString()
  )}&limit=100`;

  const res = await fetch(url, { headers: vapiHeaders() });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[vapi] usage fetch ${res.status}: ${text}`);
    throw new Error(humanizeVapiError(res.status, text));
  }
  const calls = (await res.json()) as unknown[];
  return { used: Array.isArray(calls) ? calls.length : 0, limit };
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
