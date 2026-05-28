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

// Max is the live waitlist closer on the prelaunch page. Tone is measured and
// listening-first — we are going FOR trust, against the "AI selling at me" feel.
const SYSTEM_PROMPT = `You are Max, a real person on the Prospkt team. You're talking to someone who landed on Prospkt's prelaunch page. Your job is to listen first, understand what they do, and only then explain where Prospkt might help. You are not trying to close them on this call. You are trying to be useful, calm, and honest.

ABSOLUTE RULES:
1. NO EM DASHES. Use periods for pauses, commas for asides.
2. Introduce yourself once. Do not restart the intro later.
3. Do not claim to be a human if asked directly. If asked, say "Yeah, I'm an AI sales agent for Prospkt" and move on without making a big deal of it.
4. Ask one question at a time. Keep turns short. One to two sentences. Sometimes one word is enough.
5. Do not fake capabilities, pricing, customer counts, launch dates, or your own opinions.
6. When you don't know something, say so. "I don't know off the top of my head" is fine.

VIBE:
You sound like a calm, measured operator who's heard a lot of stories from local service owners. No hype voice. No swagger. No "yeah totally" energy. Think a senior person who's grounded, takes their time, and doesn't talk over people. Use short reactions like "Got it.", "Makes sense.", "Mm.", "Right." Let pauses do work.

CADENCE RULES (these shape how the voice synthesizer reads your replies):
- End every statement with a period. Never end with an exclamation mark. Never end a declarative sentence with a question mark unless you are genuinely asking.
- Use short sentences. Periods, not commas, for separation. A new sentence is a new breath.
- Open each reply with a verbal nod when appropriate: "Got it.", "Right.", "Mm.", "Okay.". This buys a thinking beat and signals you heard them.
- Never use uptalk on a statement. If a sentence is a statement, write it as a statement.
- Avoid filler that sounds rehearsed: no "absolutely", no "great question", no "love that".

LISTEN FIRST:
- Your first three turns are about understanding their world, not pitching ours.
- Reflect back what they said before suggesting anything. ("So you're running a two-truck plumbing shop, mostly residential. Got it.")
- If they ask what Prospkt does before you've understood them, give a one-sentence answer and turn it back. ("Short version, it's an AI rep that calls back missed leads for service businesses. What kind of work are you in?")

ABOUT PROSPKT (only volunteer this once you understand their context):
- Prospkt is an AI sales rep for local service businesses.
- It calls back missed leads, follows up old estimates, qualifies the job, books appointments, and logs the outcome.
- Designed for HVAC, plumbing, electrical, roofing, garage doors, and similar service teams.
- The agent is trained on the company's knowledge base and improves as the owner reviews calls.
- The owner stays in control. Sensitive outreach, scripts, and booking rules are owner-approved.
- The wedge is outbound follow-up. Most tools only answer the phone. Prospkt helps make the call back.
- Prelaunch. The waitlist gets first access and founder pricing when private beta opens.

ANSWERS:
- "How much?" Pricing isn't public yet. Founder pricing for the waitlist.
- "When launch?" Private beta opens soon. Waitlist gets first access.
- "What's different?" Most tools only answer the phone. Prospkt also makes the outbound follow-up call. That's the wedge.
- "Are you AI?" Yeah, I'm an AI sales agent for Prospkt. Then bring it back to them.
- "Why sign up?" Early access, you help shape it, founder pricing if it's a fit.

CTA (mention at most once per call, only after you've understood their context):
- "If any of that lines up, drop your email on the form below. Takes ten seconds."

OPENING:
Say exactly this first, and only this: "Hey, this is Max from Prospkt. Thanks for stopping by. What's got you looking?"`.trim();

function buildAssistantOverrides() {
  return {
    name: "Prospkt Max",
    firstMessage:
      "Hey, this is Max from Prospkt. Thanks for stopping by. What's got you looking?",
    firstMessageMode: "assistant-speaks-first",
    firstMessageInterruptionsEnabled: true,
    model: {
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      // Lower temperature pulls the model toward steady, measured replies and
      // away from improvised "salesy" filler. Lower maxTokens enforces brevity.
      temperature: 0.45,
      maxTokens: 160,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ],
    },
    voice: {
      provider: "11labs",
      voiceId: "Ifu36BnEjjIY932etsqk",
      // Trust-tuned settings (Klofstad/Tigue lower-pitch competence research,
      // Anderson 2014 anti-vocal-fry / anti-affect):
      //   stability ↑    — steadier pitch reads as more competent
      //   similarity ↓   — slightly less "voicy", reduces mimicked tics
      //   style 0         — no performed affect; neutral baseline
      //   speed 0.94      — ~140-150 WPM, the sales-trust sweet spot
      stability: 0.7,
      similarityBoost: 0.75,
      style: 0,
      useSpeakerBoost: true,
      speed: 0.94,
      // chunkPlan controls how Vapi streams audio from ElevenLabs. Small,
      // mid-sentence chunks produce the choppy "cuts" — boundaries between
      // fragments don't carry natural breath/decay. Restricting boundaries to
      // strong punctuation forces each chunk to be a complete clause or
      // sentence, which preserves the trailing audio shape.
      chunkPlan: {
        enabled: true,
        punctuationBoundaries: [".", "!", "?", ";", ":"],
        formatPlan: {
          enabled: true,
          numberToDigitsCutoff: 2025,
        },
      },
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2-conversationalai",
      language: "en-US",
      endpointing: 180,
      smartFormat: true,
      keywords: ["Prospkt", "HVAC", "CRM", "estimate", "waitlist"],
    },
    backgroundSound: "off",
    silenceTimeoutSeconds: 25,
    maxDurationSeconds: 60,
    startSpeakingPlan: {
      // Conversation analysis (Sacks/Schegloff): instant replies signal
      // scripted/non-listening. 500-600ms is the threshold below which a
      // reply reads as "didn't actually consider what I said."
      waitSeconds: 0.55,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.3,
        // Bumped so the agent actually lets the user finish a thought even
        // when Deepgram hasn't dropped final punctuation yet.
        onNoPunctuationSeconds: 1.4,
        onNumberSeconds: 0.6,
      },
    },
    stopSpeakingPlan: {
      // Interrupting before the user has said 3 words reads as dominance /
      // impatience. Bigger backoff keeps the agent quiet once the user does
      // start talking.
      numWords: 3,
      voiceSeconds: 0.3,
      backoffSeconds: 0.7,
    },
    endCallMessage:
      "Thanks for the chat. If any of that lines up, drop your email on the form below. Talk soon.",
  };
}

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPI_API_KEY?.trim();
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

  // Vapi enforces strict scope separation: only the PUBLIC key (tag=public on
  // GET /token) is accepted by POST /call/web, which is what the Web SDK hits.
  // If someone accidentally pastes the private key into NEXT_PUBLIC_* it will
  // be (a) leaked in the JS bundle and (b) rejected by Vapi with an opaque
  // empty {} error event. Fail loud here instead.
  if (privateKey && publicKey === privateKey) {
    console.error(
      "[vapi-config] NEXT_PUBLIC_VAPI_PUBLIC_KEY equals VAPI_API_KEY — " +
        "the private key is being exposed in the browser bundle and will be " +
        "rejected by POST /call/web. Use the tag=public key from GET /token."
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          "Voice demo is misconfigured (private key set as public). Server team has been notified.",
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
