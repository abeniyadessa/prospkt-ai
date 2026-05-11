export const OPENAI_REALTIME_MODEL = "gpt-realtime-2025-08-28" as const;
export const DEFAULT_OPENAI_REALTIME_VOICE_ID = "marin" as const;

export const OPENAI_REALTIME_COMPATIBLE_VOICES = [
  "alloy",
  "echo",
  "shimmer",
  "marin",
  "cedar",
] as const;

export const OPENAI_REALTIME_VOICE_OPTIONS = [
  {
    id: "marin",
    label: "Marin",
    description: "Recommended for Prospkt: calm, human-paced, and polished for front-desk sales calls.",
  },
  {
    id: "cedar",
    label: "Cedar",
    description: "A warmer backup voice for owners who want a little more weight and steadiness.",
  },
] as const;

export type OpenAIRealtimeModel = typeof OPENAI_REALTIME_MODEL;
export type OpenAIRealtimeVoiceId = (typeof OPENAI_REALTIME_COMPATIBLE_VOICES)[number];

export function resolveOpenAIRealtimeModel(value?: string | null): OpenAIRealtimeModel {
  void value;
  return OPENAI_REALTIME_MODEL;
}

export function resolveOpenAIRealtimeVoiceId(value?: string | null): OpenAIRealtimeVoiceId {
  if (
    typeof value === "string" &&
    (OPENAI_REALTIME_COMPATIBLE_VOICES as readonly string[]).includes(value)
  ) {
    return value as OpenAIRealtimeVoiceId;
  }

  return DEFAULT_OPENAI_REALTIME_VOICE_ID;
}
