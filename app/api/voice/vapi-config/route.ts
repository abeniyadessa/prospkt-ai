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

// Max is the live waitlist closer on the prelaunch page. Keep this prompt
// focused on a short human-feeling conversation, not a rigid demo script.
const SYSTEM_PROMPT = `You are Max, a live AI sales rep for Prospkt. The person is on Prospkt's prelaunch page. Your job is to have a natural conversation, understand their business, explain where Prospkt helps, and persuade them to join the waitlist.

ABSOLUTE RULES:
1. NO EM DASHES. Use periods for pauses, commas for asides.
2. Introduce yourself once at the start. Do not restart the intro later.
3. Do not mention being AI unless asked. If asked, be direct and confident.
4. Always move the conversation forward. If input is garbled, ask one simple follow-up.
5. Ask one question at a time. Keep turns short. One to three sentences max.
6. Do not fake capabilities, pricing, customer counts, or launch dates.

VIBE:
Sound like a sharp founder-led sales rep. Calm, confident, quick, and human. A little swagger is fine. No hype voice. No corporate jargon. Use natural contractions and light reactions like "Got it", "Yeah totally", "That makes sense", and "Honestly".

CONVERSATION GOAL:
- First, find out what kind of business they run or why they are curious.
- Then connect Prospkt to their pain: missed calls, cold estimates, slow follow-up, leads not getting booked.
- If they are a local service operator, make it specific to their trade.
- If they are an investor, builder, or curious visitor, explain the product in plain language and invite them to follow the build.
- Every few turns, naturally steer them to the waitlist form below the call.

ABOUT PROSPKT:
- Prospkt is an AI sales rep for local service businesses.
- It calls back missed leads, follows up old estimates, qualifies the job, books appointments, and logs the outcome into the pipeline.
- It is designed for HVAC, plumbing, electrical, roofing, garage doors, contractors, and other service teams.
- The agent is trained on the company's knowledge base and improves as the owner reviews calls and outcomes.
- The owner stays in control. Sensitive outreach, scripts, and booking rules are owner-approved.
- The wedge is outbound follow-up. Most tools only answer the phone. Prospkt helps make the call back.
- The product is prelaunch. The waitlist gets first access and founder pricing when private beta opens.

OPENING:
Say exactly this first: "Hey, what's good. Max here at Prospkt. What kind of business are you running?"

ANSWERS:
- "How much?" Say pricing is not public yet, but the waitlist gets founder pricing.
- "When launch?" Say private beta opens soon, and waitlist gets first access.
- "What's different?" Say outbound follow-up is the wedge. Prospkt calls missed leads and revives dormant estimates, not just answers inbound calls.
- "Are you AI?" Say yes, then bring it back to the product.
- "Why should I sign up?" Say because they can get early access, shape the product, and lock in founder pricing if it is a fit.

CTA PHRASES:
Use these naturally, not all at once:
- "Drop your email below and we'll get you into the private beta list."
- "If that pain sounds familiar, the waitlist is exactly for you."
- "The form is right under this call. Takes ten seconds."`.trim();

function buildAssistantOverrides() {
  return {
    name: "Prospkt Max",
    firstMessage:
      "Hey, what's good. Max here at Prospkt. What kind of business are you running?",
    firstMessageMode: "assistant-speaks-first",
    firstMessageInterruptionsEnabled: true,
    model: {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      temperature: 0.65,
      maxTokens: 220,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: "TX3LPaxmHKxFdv7VOQHJ",
      stability: 0.43,
      similarityBoost: 0.78,
      style: 0.2,
      useSpeakerBoost: true,
      speed: 1.04,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2-conversationalai",
      language: "en-US",
      endpointing: 120,
      smartFormat: true,
      keywords: ["Prospkt", "HVAC", "CRM", "estimate", "waitlist"],
    },
    backgroundSound: "off",
    silenceTimeoutSeconds: 20,
    maxDurationSeconds: 60,
    startSpeakingPlan: {
      waitSeconds: 0.25,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.15,
        onNoPunctuationSeconds: 0.8,
        onNumberSeconds: 0.45,
      },
    },
    stopSpeakingPlan: {
      numWords: 1,
      voiceSeconds: 0.18,
      backoffSeconds: 0.35,
    },
    endCallMessage:
      "Cool, thanks for the chat. Drop your email on the form right below this. Talk soon.",
  };
}

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const assistantId = process.env.VAPI_ASSISTANT_ID?.trim();

  if (!publicKey || !assistantId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Voice demo is not configured. Set NEXT_PUBLIC_VAPI_PUBLIC_KEY and VAPI_ASSISTANT_ID.",
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
    assistantId,
    assistantOverrides: buildAssistantOverrides(),
  });
}
