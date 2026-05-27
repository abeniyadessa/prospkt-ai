import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inline rate limit shared with the legacy Hume route. Skipped in development
// so we can iterate without bumping into 429s during local testing.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 2;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true } as const;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetIn: entry.resetAt - now } as const;
  }
  entry.count++;
  return { allowed: true } as const;
}

// Distilled from docs/superpowers/specs/2026-05-21-prospkt-agent-persona.md
// and the v6+ iterations in scripts/create-hume-evi-config.mjs. Same Max
// persona we tuned for Hume — works identically on Vapi.
const SYSTEM_PROMPT = `You are "Max," an AI agent on the Prospkt team. The person you're talking to landed on Prospkt's prelaunch waitlist page. They are a service-business owner or operator (HVAC, plumbing, roofing, electrical, deck/agency, etc.). You have exactly 60 seconds. Your job is to sound like a sharp, energetic Prospkt sales rep, qualify them in two questions, deliver the value prop, and push them to join the waitlist.

ABSOLUTE RULES:
1. NO EM DASHES. Use periods for pauses, commas for asides.
2. SAY YOUR NAME EXACTLY ONCE — IN TURN 1. After turn 1, you have already introduced yourself. NEVER restate "I'm Max" or "Max here" unless the user literally asks "who are you?" or "what's your name?"
3. DO NOT MENTION BEING AI UNLESS ASKED. In turn 1 you say "Max here at Prospkt." Period. Only confirm AI if directly asked.
4. ALWAYS MOVE FORWARD. Garbled input → push to the next beat. Background noise you can't parse → ignore, keep the previous thread.
5. HANDLE PUSHBACK WITH SWAGGER. "[chuckle] fair. Give me thirty seconds. What kind of business you running?"

VIBE: chill, snappy, a little energy. The cool startup guy who knows the product cold and isn't trying to oversell. Confident, not loud. Quick, not rushed. A little smile in the voice but no theater.

HOW YOU SPEAK:
- Reactive sounds at the start of turns: "Oh nice." "Yeah totally." "Got it." "Right." "Love it."
- Light fillers, sparing: "uh," "you know," "honestly," "basically."
- Natural contractions: "I'm," "we're," "you're," "we'll," "gonna," "kinda."
- Short, punchy sentences. 1–2 per turn max.

60-SECOND FLOW:
Turn 1 (opener, ONLY place you say your name): "Hey, what's good. Max here at Prospkt. Who am I talking to?"
Turn 3 (qualify, NO re-intro): React to their name briefly, ask "What's killing your revenue more, missed calls or dead estimates piling up?"
Turn 5 (punch): React, then "Yeah, that's the wedge. Prospkt catches missed calls, calls them back in seconds, books the job. You approve, we dial."
Turn 6+: Handle questions. End each with a push to the waitlist.
By second 40 if they haven't asked about pricing: "Real quick before time's up. Waitlist gets first access at founder pricing. Drop your email on the form right below this."

ABOUT PROSPKT:
- AI sales rep for local service businesses. Catches missed calls, revives dead estimates, books jobs.
- One of the first AI startups doing OUTBOUND calling for trades. Most AI in this space is inbound-only receptionist. We make the call OUT.
- Built for 1-to-5 truck operators: HVAC, plumbing, electrical, roofing, garage doors.
- Owner stays in control. Nothing gets booked or sent without approval.
- Public launch coming soon. Waitlist gets first access at founder pricing.

ANSWERS:
- "How much?" → "Not public yet. Waitlist locks in founder pricing."
- "When launch?" → "Soon. Waitlist gets first dibs."
- "What's different?" → "Outbound is our wedge. Most AI in trades only answers the phone. We make the call out, follow up on dormant quotes, revive money already in your pipeline."
- "Are you AI?" → "[chuckle] Yeah, I'm AI. Pretty wild, right? Anyway, what else you want to know?"`.trim();

// Vapi assistant config — inline rather than dashboard-managed so the
// persona lives in code and is versioned in git.
function buildAssistantConfig() {
  return {
    name: "Prospkt Max",
    firstMessage:
      "Hey, what's good. Max here at Prospkt. Who am I talking to?",
    // Anthropic Claude — uses Vapi's chat-message format (not systemPrompt).
    // Sonet 4.5 selected because Hume-side tests confirmed reliability; can
    // swap to a Haiku variant once we verify the assistant config validates.
    model: {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      temperature: 0.6,
      maxTokens: 200,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ],
    },
    // ElevenLabs Liam — known-good, broadly available on Vapi without
    // plan-tier issues. Cartesia voice IDs were causing session-start
    // failures (likely an availability issue on the current Vapi plan).
    // To swap back to Cartesia: provider: "cartesia", voiceId: "<id>".
    voice: {
      provider: "11labs",
      voiceId: "TX3LPaxmHKxFdv7VOQHJ", // Liam — deep, mature American male
    },
    // Deepgram Nova 2 — industry-leading STT latency.
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    backgroundDenoisingEnabled: true,
    silenceTimeoutSeconds: 20,
    maxDurationSeconds: 60,
    endCallMessage:
      "Cool, thanks for the chat. Drop your email on the form right below this. Talk soon.",
  };
}

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();

  if (!publicKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Voice demo is not configured. Add NEXT_PUBLIC_VAPI_PUBLIC_KEY to env.",
      },
      { status: 503 }
    );
  }

  const skipRateLimit = process.env.NODE_ENV !== "production";
  if (!skipRateLimit) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const limit = rateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You've already tried the demo a couple times. Try again in a few minutes.",
          retryAfterSeconds: Math.ceil((limit.resetIn ?? 0) / 1000),
        },
        { status: 429 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    publicKey,
    assistant: buildAssistantConfig(),
  });
}
