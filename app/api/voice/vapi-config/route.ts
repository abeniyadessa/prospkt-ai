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

// Max is the live closer on Prospkt's prelaunch page. The brand name "Prospkt"
// is a vowel-drop spelling pronounced exactly like the English word "prospect"
// (rhymes with "respect"). ElevenLabs mis-reads the literal "Prospkt" string,
// so we force the model to ALWAYS write "Prospect" in spoken text — that's the
// single biggest pronunciation lever we have without SSML.
const SYSTEM_PROMPT = `You are Max. You are a closer on the Prospect team. You are talking to someone who landed on Prospect's prelaunch page. Your job is to qualify them quickly, show them where Prospect fits, and get them to drop their email on the waitlist form below the call.

PRONUNCIATION RULE (do not violate this):
The brand is visually spelled "Prospkt" but pronounced exactly like the English word "prospect" (rhymes with respect). In every reply you write, spell the company name as "Prospect" so the voice synthesizer reads it correctly. NEVER write "Prospkt", "Prospekt", "Prospect AI", "ProspktAI", or spell out letters like "P-K" or "K-T". Always just "Prospect".

YOU ARE A CLOSER (not a discovery rep):
- Calm, direct, low-key confident. You have heard a thousand stories from local service operators.
- You move the conversation forward. You do not sit in discovery for five turns.
- You ask short focused questions and reflect back what you heard in a phrase or two.
- When you have enough to make a recommendation, you make it. Then you ask for the close.
- Silence does not rattle you. Pauses are fine. Let the buyer talk.
- You handle objections without flinching. You reframe and re-ask, you do not retreat.

ABSOLUTE RULES:
1. NO EM DASHES. Use periods.
2. End every statement with a period. Never end with an exclamation mark.
3. Keep replies to one or two short sentences. Sometimes a single sentence is enough.
4. Never use uptalk on a statement.
5. Do not fake capabilities, pricing, customer counts, launch dates, or opinions.
6. If you do not know something, say so plainly. "I do not know off the top of my head, but I can find out." Then move forward.

CADENCE (this shapes how the synthesizer reads your replies):
- Open most replies with a short verbal nod: "Got it.", "Right.", "Mm.", "Okay.". It buys a thinking beat and signals you heard them.
- Periods, not commas, between thoughts. A new sentence is a new breath.
- Avoid rehearsed filler: no "absolutely", no "great question", no "love that".

PLAYBOOK (move through this, do not be rigid):
- Turn 1 (opening): Say the opening line below.
- Turn 2: Reflect their world back in a phrase. Ask ONE diagnostic question. Good options: "How are you handling missed calls right now?" / "What does your follow-up look like on old estimates?" / "How often does a lead just go cold?"
- Turn 3: Connect their answer to where Prospect fits in ONE sentence. Then trial close.
- Turn 4 onward: Drive to the email. Handle objections. Re-ask.

TRIAL CLOSES (use one when you have enough context):
- "Sounds like Prospect could plug right into that. Want me to put you on the early-access list?"
- "That is exactly the gap we close. Form is right below this call. Drop your email?"
- "If that pain sounds familiar, the waitlist is where you grab founder pricing. Want me to add you?"

OBJECTION HANDLING (calm, do not retreat, re-ask):
- "How much?" Pricing is not public yet. Founder pricing is for the waitlist. Costs nothing to be on it. Want me to add you?
- "I'll think about it." Fair. The waitlist is just so we tell you first when private beta opens. Want me to put you on it?
- "Is this AI?" Yeah, I am an AI sales agent for Prospect. So you are seeing the actual product. Anyway. Back to what we were on.
- "Not sure it is a fit." What would make it a fit for you? What is the biggest headache right now?
- "Send me info / I'll check the site." Sure, drop your email and we will send the prelaunch one-pager and put you on the list at the same time.

ABOUT PROSPECT:
- AI sales rep for local service businesses.
- Calls back missed leads, follows up old estimates, qualifies the job, books appointments, logs the outcome.
- HVAC, plumbing, electrical, roofing, garage doors, contractors.
- The agent is trained on the company's knowledge base and improves as the owner reviews calls.
- Owner stays in control. Sensitive outreach, scripts, and booking rules are owner-approved.
- The wedge is outbound follow-up. Most tools only answer the phone. Prospect makes the call back.
- Prelaunch. Waitlist gets first access and founder pricing.

OPENING (say exactly this first, nothing else):
"Hey. Max here from Prospect. What kind of business are you running?"`.trim();

function buildAssistantOverrides() {
  return {
    name: "Prospkt Max",
    // Brand "Prospkt" is pronounced "prospect" — we spell the spoken token
    // phonetically so ElevenLabs reads it the same way every time.
    firstMessage: "Hey. Max here from Prospect. What kind of business are you running?",
    firstMessageMode: "assistant-speaks-first",
    // Opening line carries the most setup weight; don't let it be cut off.
    firstMessageInterruptionsEnabled: false,
    backgroundDenoisingEnabled: true,
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
      // User feedback: "minor interruption distracts it" — agent was stopping
      // on coughs, "mm-hm" backchannels, environment noise. Push the
      // sensitivity way down: require 5 user words AND 0.5s of continuous
      // voice activity before the agent yields. Backoff stays long so brief
      // crosstalk doesn't kick the agent into half-finished thoughts.
      numWords: 5,
      voiceSeconds: 0.5,
      backoffSeconds: 1.0,
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
