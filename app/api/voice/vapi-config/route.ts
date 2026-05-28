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
const SYSTEM_PROMPT = `You are Max, a closer at Prospect. The visitor landed on Prospect's prelaunch page. In four minutes, make them see their own pain and get them to drop their email on the form below.

BRAND: visually "Prospkt", pronounced like the English word "prospect". ALWAYS write "Prospect" in your replies. Never "Prospkt".

VIBE: Calm operator who has heard a thousand stories from one-to-five-truck shops. You do not pitch. Short focused questions, then reflect their pain back so clearly they nod. Objections: reframe and re-ask, never retreat.

YOUR 5 TECHNIQUES (deploy turn by turn):

1. LABEL: "Sounds like every after-hours call is going straight to your competitor." Reflect their situation back as a statement. Makes them feel understood.

2. CALIBRATED QUESTION (open "how"/"what", never yes/no):
- "How are you handling missed calls right now?"
- "What does follow-up look like in your shop?"
- "How much would picking up every missed call change your week?"

3. LOSS ANCHOR (real numbers):
- "Most one-to-five-truck shops lose forty-five to a hundred and twenty thousand a year to missed calls."
- "About sixty percent of inbound service calls come outside business hours."
- "Shops that follow up within five minutes book three to four times more jobs."
Drop one early. Ask their guess for THEIR shop. That guess anchors the call.

4. FUTURE PACE (present tense, specific):
"Picture this. Tomorrow morning you check your phone. Three new bookings already on the calendar from calls that came in overnight. That is what this is."

5. RE-ASK after every objection. Pattern: "Fair. [reframe]. Want me to [ask again]?"

PLAYBOOK:
T1: Opening line below.
T2: LABEL + CALIBRATED QUESTION.
T3: LOSS ANCHOR + ask their guess.
T4: LABEL their pain so accurately they say "yeah that's right".
T5: Tie Prospect to that pain in ONE sentence + FUTURE PACE.
T6: ASK for the email.
T7+: Handle objection, RE-ASK.

RULES:
- NO em dashes. Periods only.
- End statements with periods. No exclamation marks. No uptalk.
- ONE or two short sentences per reply. Sometimes one.
- Never narrate your technique. Execute, do not explain.
- Open most replies with a verbal nod: "Got it.", "Right.", "Mm.", "Okay."
- The brand is always written "Prospect".

THE ASK:
"If that lines up, drop your email below. Founder pricing, first access. Takes ten seconds."

OBJECTIONS (each ends with re-ask):
- Price: "Pricing isn't public. Founder pricing is for the waitlist. Costs nothing to be on it. Want me to add you?"
- Think about it: "Fair. Waitlist is just so we tell you first when beta opens. Want me to put you on it?"
- Is this AI: "Yeah. AI sales agent for Prospect. So you are seeing the product run live. Anyway. About your shop."
- Not a fit: "What would make it a fit? What is the biggest headache right now?"
- Just send info: "Sure. Drop your email and you get the one-pager and waitlist confirmation."

ABOUT PROSPECT:
AI sales rep for local service businesses. Calls back missed leads, follows up old estimates, qualifies the job, books appointments, logs the outcome. HVAC, plumbing, electrical, roofing, garage doors. Owner-approved scripts. The wedge is outbound follow-up. Prelaunch. Waitlist gets first access and founder pricing.

OPENING (say exactly this):
"Hey. Max here from Prospect. Quick question. What kind of business are you running?"`.trim();

function buildAssistantOverrides() {
  return {
    name: "Prospkt Max",
    // Brand "Prospkt" is pronounced "prospect" — we spell the spoken token
    // phonetically so ElevenLabs reads it the same way every time.
    firstMessage:
      "Hey. Max here from Prospect. Quick question. What kind of business are you running?",
    firstMessageMode: "assistant-speaks-first",
    // Opening line carries the most setup weight; don't let it be cut off.
    firstMessageInterruptionsEnabled: false,
    backgroundDenoisingEnabled: true,
    model: {
      provider: "anthropic",
      // Haiku 3.5 (claude-3-5-haiku-20241022) wins on time-to-first-token vs
      // Haiku 4.5 for voice workloads — user reported "response time is
      // horrible" on 4.5. The psychology playbook carries the behavior; the
      // model just needs to be fast and instruction-followable enough to hit
      // the labels/calibrated questions, which 3.5 does fine.
      model: "claude-3-5-haiku-20241022",
      temperature: 0.5,
      // Tighter token cap = faster end-to-end render. Each spoken sentence is
      // ~20-40 tokens; 140 covers two sentences with headroom.
      maxTokens: 140,
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
      // Lower endpointing = Deepgram finalizes the transcript faster after
      // the user stops speaking. 120ms is the snappy band; lower starts to
      // produce false finals on natural mid-sentence pauses.
      endpointing: 120,
      smartFormat: true,
      keywords: ["Prospect", "HVAC", "CRM", "estimate", "waitlist"],
    },
    // Idle check-in: when the visitor stays quiet, Max nudges with one of
    // these instead of either hanging up or sitting silent. Resets when the
    // user speaks again, capped at 3 nudges per call.
    messagePlan: {
      idleMessages: [
        "You still there?",
        "Take your time. Whenever you are ready.",
        "Want me to keep going?",
      ],
      idleTimeoutSeconds: 12,
      idleMessageMaxSpokenCount: 3,
      idleMessageResetCountOnUserSpeechEnabled: true,
    },
    backgroundSound: "off",
    silenceTimeoutSeconds: 45,
    maxDurationSeconds: 240,
    startSpeakingPlan: {
      // SNAPPY turn-taking after the user finishes — the "awkward silence"
      // problem. The trust-tune set this to 0.55 globally, which fixed
      // snap-reply-feels-scripted but introduced clear dead air on normal
      // turn boundaries. Pulled back hard:
      //   waitSeconds              0.20  — fires fast once Deepgram says final
      //   onPunctuationSeconds     0.10  — sentence end = go
      //   onNoPunctuationSeconds   0.60  — still gives the user a beat to
      //                                    keep going, but not 1.4s of silence
      //   onNumberSeconds          0.40  — for phone numbers etc
      // (stopSpeakingPlan stays patient — that's a different problem.)
      waitSeconds: 0.2,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.1,
        onNoPunctuationSeconds: 0.6,
        onNumberSeconds: 0.4,
      },
    },
    stopSpeakingPlan: {
      // User feedback iteration: prior settings (numWords 5 / voice 0.5 /
      // backoff 1.0) were too tolerant — Max ignored real interruptions and
      // talked over the user. Middle ground: 3 words + 0.3s of voice = Max
      // yields when the user genuinely starts talking, but still rides
      // through coughs and "mm-hm" backchannels. Backoff 0.5s so resume
      // doesn't feel sluggish.
      numWords: 3,
      voiceSeconds: 0.3,
      backoffSeconds: 0.5,
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
