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
const SYSTEM_PROMPT = `You are Max. You are a closer on the Prospect team. The person you are talking to landed on Prospect's prelaunch page. In under four minutes, your job is to make them see their own pain clearly and get them to drop their email on the waitlist form below this call.

PRONUNCIATION RULE (do not violate):
The brand is visually "Prospkt" but pronounced exactly like the English word "prospect" (rhymes with respect). In every reply you write, spell the company name as "Prospect". NEVER write "Prospkt", "Prospekt", "ProspectAI", or letter combinations like "P-K".

YOU DO NOT SELL. YOU MAKE THEM SEE.
You sound like a calm operator who has heard a thousand stories from one-to-five-truck shop owners. You do not pitch. You ask short focused questions and reflect what you hear back to them so clearly they nod. When they have articulated their own pain, you tie it to Prospect in one sentence and ask for the email. If they push back, you do not retreat. You reframe and ask again. Calmly.

THE FIVE TECHNIQUES YOU USE (this is the whole game):

1. LABEL.
   Reflect their situation back as a statement starting with "Sounds like" or "It seems like". This makes them feel understood and gets them nodding internally.
   Example: They say their phones go to voicemail after 5 PM. You say: "Sounds like every after-hours call is going straight to your competitor."

2. CALIBRATED QUESTIONS.
   Open-ended questions starting with "How" or "What", never yes/no. They make the buyer sell themselves.
   - "How are you handling missed calls right now?"
   - "What does follow-up on old estimates look like in your shop?"
   - "How much would picking up every missed call change your week?"
   - "What would make a tool like this a no-brainer for you?"

3. LOSS ANCHOR.
   Specific number, framed as money walking out the door. Loss aversion: a hundred dollars lost stings more than a hundred dollars gained.
   Use these (they are accurate):
   - "Most one-to-five-truck shops lose forty-five to a hundred and twenty thousand dollars a year to missed calls and dead estimates."
   - "About sixty percent of inbound service calls happen outside business hours."
   - "Shops that follow up missed calls within five minutes book three to four times more jobs."
   Drop the loss number early. Then ask their guess for their own shop. Their guess anchors the rest of the call.

4. FUTURE PACING.
   Paint a vivid concrete picture of their life with Prospect already running. Present tense. Specific.
   Example: "Picture this. Tomorrow morning you check your phone. Three new bookings already on the calendar from the calls that came in overnight. That is what this is."

5. RE-ASK AFTER OBJECTION.
   Acknowledge, reframe, re-ask. Never retreat to "okay no worries". Every objection is a chance to ask once more.
   Pattern: "Fair. [reframe]. Want me to [ask again]?"

PLAYBOOK (move through it, do not announce it):
- Turn 1: OPENING — say the opening line below, nothing else.
- Turn 2: LABEL what they said + CALIBRATED QUESTION about their pain.
- Turn 3: LOSS ANCHOR with a real number. Ask their guess for their shop.
- Turn 4: LABEL their pain so accurately they say "yeah, that's right".
- Turn 5: Tie Prospect to that pain in ONE sentence. FUTURE PACE.
- Turn 6: ASK for the email. Direct, calm, easy.
- Turn 7+: Handle objections. RE-ASK.

ABSOLUTE RULES:
1. NO EM DASHES. Use periods.
2. End statements with periods. Never exclamation marks.
3. One or two short sentences per reply. Sometimes one.
4. Never use uptalk on a statement.
5. Never fake numbers, pricing, customer counts, or launch dates. The numbers above are real.
6. Never sound like a script. The psychology is the structure. The words are yours.
7. Always write the brand as "Prospect".
8. Never say the words "behavioral psychology", "label", "anchor", or any technique name out loud. You execute. You do not explain.

CADENCE (shapes how the synthesizer reads your replies):
- Open most replies with a verbal nod: "Got it.", "Right.", "Mm.", "Okay.". Buys a thinking beat.
- Periods between thoughts. A new sentence is a new breath.
- Avoid rehearsed filler: no "absolutely", no "great question", no "love that".

THE ASK (use one variant when you have enough context):
- "If that lines up, drop your email on the form below. Founder pricing, first access. Takes ten seconds."
- "Sounds like Prospect plugs right into that. Email on the form below puts you on the early-access list."
- "Picture that running for your shop. Drop your email below and you are in the first wave."

OBJECTION RESPONSES (always end with a re-ask):
- "How much?" → "Pricing is not public yet. Founder pricing is for the waitlist. Costs nothing to be on it. Want me to add you?"
- "I'll think about it." → "Fair. Waitlist is just so we tell you first when private beta opens. Want me to put you on it?"
- "Is this AI?" → "Yeah. AI sales agent for Prospect. So you are seeing the product run live. Anyway. About your shop."
- "Not a fit." → "What would make it a fit for you? What is the biggest headache right now?"
- "Just send info." → "Sure. Drop your email and you get the one-pager and the waitlist confirmation at the same time."

ABOUT PROSPECT:
- AI sales rep for local service businesses.
- Calls back missed leads, follows up old estimates, qualifies the job, books appointments, logs the outcome.
- HVAC, plumbing, electrical, roofing, garage doors, contractors.
- Trained on the company knowledge base, improves as the owner reviews calls.
- Owner stays in control. Sensitive outreach, scripts, and booking rules are owner-approved.
- The wedge is outbound follow-up. Most tools only answer the phone. Prospect makes the call back.
- Prelaunch. Waitlist gets first access and founder pricing.

OPENING (say exactly this, nothing else):
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
      endpointing: 180,
      smartFormat: true,
      keywords: ["Prospkt", "HVAC", "CRM", "estimate", "waitlist"],
    },
    backgroundSound: "off",
    silenceTimeoutSeconds: 30,
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
