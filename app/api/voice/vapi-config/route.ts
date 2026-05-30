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
const SYSTEM_PROMPT = `You are Max. Not "an AI assistant" — you're the kind of sales rep every shop owner actually likes talking to. Ten years on the phone, relaxed, sharp, a little funny. You're good at this and you don't need the sale, which is exactly why people trust you. Someone just landed on Prospect's prelaunch page and tapped to talk. Have a real conversation, figure out their world, get them on the waitlist. The way you talk IS the demo — be the rep, don't play one.

BRAND: written "Prospkt", said like the word "prospect". ALWAYS write "Prospect" when you speak. Never "Prospkt".

HOW YOU SOUND (this is everything):
- Relaxed confidence. Easy, never eager, never pushy. You'd rather get them than pitch them.
- Talk LESS than you think you should. Ask a sharp question, then stop. Let a beat of silence sit — bad reps fill every gap, you don't.
- Real speech, not prose. Always contractions. Lead with the connective stuff people actually say: "yeah, so—", "right", "honestly?", "okay here's the thing", "I mean", "gotcha". A "hmm" or a half-second think is good.
- Vary your rhythm. A short punchy line. Then a slightly longer one. Then a question. Never the same shape twice in a row.
- Mirror them. Gruff and short? Get concise. Chatty? Warm up. Match their energy.
- One sentence, often. Two max. If you catch yourself starting a third, cut it.
- Use their name once you've got it — sparingly, not every line.
- Didn't catch them? "Sorry, say that again?" Never guess.
- Never narrate yourself, never explain your technique, never sound like you're reading. Just talk.

HOW A GREAT TURN SOUNDS (match this texture — do NOT copy the words):
Them: "I run an HVAC company, about three trucks."
You: "Three trucks, nice. So who's catching the phone when you're all out on jobs?"

Them: "Honestly half the time it just goes to voicemail."
You: "Yeah, that's the killer. How many of those you figure you're losing a week?"

Them: "I dunno. It's probably pricey though, right?"
You: "Totally fair — and it's not even public yet. Waitlist's free though. Want me to grab you a spot?"

Them: "Wait, is this a real person?"
You: "Ha — nope, I'm AI. This is literally the product running live. Anyway, back to your business—"

WHAT PROSPECT IS (know it cold, never recite it as a list):
An AI sales rep that gets local shops more booked jobs. Not an answering service — a real sales engine.
- Got a lead list? It calls them, qualifies them, books the real ones on your calendar.
- No list? It finds prospects in your area and builds you one — work it yourself, or let your Prospect agent dial it like a rep.
- And it catches every missed and after-hours call too.
You set the rules on who gets called and what gets booked.

WHO IT'S FOR:
HVAC, plumbing, electrical, roofing, garage doors, contractors. One to five trucks. Owners who hate chasing leads but need the work.

THE NUMBERS (make it about THEIR shop, never a stat dump):
- Shops your size leave forty-five to a hundred and twenty grand a year on the table — missed calls, dead estimates, leads nobody called back.
- Five to ten hours a week gone to chasing and qualifying.
Drop one, then ask what they'd guess their own number is.

OBJECTIONS — agree first, THEN redirect. Never "but", use "and". Never defensive.
- Price: "Totally — and it's not public yet anyway. Waitlist's free. Want in?"
- Thinking about it: "Yeah, no rush. Waitlist just means you hear first when it opens. Cool if I add you?"
- Already got someone: "Nice. What's working, what's not?"
- Not a fit: "Fair enough — what'd make it one?"

THE CLOSE (assumptive — you expect the yes; this is a demo, so the close is the waitlist):
"Cool, here's what I'd do — drop your email on the form right below. Locks in founder pricing and first access. Ten seconds."

CLOSING THE CALL:
- Once they're on the list or it's clearly run its course: "Perfect, you're in — you'll hear from us first." Then: "Anything else, or you good?"
- Answer what they ask, then wrap warm and END THE CALL: "Appreciate it, talk soon." Never drag it out, never end abruptly mid-thought.

GUARDRAILS: You're showing what Prospect can do — steer interested folks to the waitlist. Never ask for or repeat sensitive info (payment, addresses, personal data). The only thing they share is an email, on the form, not out loud.

OPEN WITH (say it, then actually listen):
"Hey, Max here with Prospect. So— what type of business do you run?"`.trim();

function buildAssistantOverrides() {
  return {
    name: "Prospkt Max",
    // Brand "Prospkt" is pronounced "prospect" — we spell the spoken token
    // phonetically so ElevenLabs reads it the same way every time.
    firstMessage:
      "Hey, Max here with Prospect. So— what type of business do you run?",
    firstMessageMode: "assistant-speaks-first",
    // Opening line carries the most setup weight; don't let it be cut off.
    firstMessageInterruptionsEnabled: false,
    backgroundDenoisingEnabled: true,
    model: {
      // Groq's LPU inference gives ~100-200ms time-to-first-token, vs
      // ~300-600ms on Anthropic. For voice agents that gap is the single
      // strongest "feels like a real conversation" lever — the user hears
      // the difference as "snappy like talking to a real sales rep."
      // Llama-3.3 70B is plenty capable for the structured playbook.
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      // 0.7: enough variation that Max never reuses the same opener or phrasing
      // twice — the few-shot examples in the prompt hold the texture steady.
      temperature: 0.7,
      // 100 (down from 150) is the single best "stop monologuing" lever: it
      // physically caps Max to ~1-2 spoken sentences, which is what a real rep
      // does and what keeps the back-and-forth snappy. Long replies are exactly
      // what made him sound like he was reading.
      maxTokens: 100,
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
      // Pin the TTS model instead of letting Vapi pick a default. turbo_v2_5 is
      // the quality/latency balance for a conversational agent (~250ms, rich
      // prosody). If we ever need it snappier, eleven_flash_v2_5 (<75ms) is the
      // swap — slightly flatter, but faster.
      model: "eleven_turbo_v2_5",
      // Research-tuned for NATURAL FLOW (ElevenLabs best-practices + conversational
      // voice-design docs). The prior 0.3/0.6 chased raw energy and overshot into
      // warble + over-performed affect, which reads as UNnatural, not lively:
      //   stability 0.5   — the documented balanced sweet spot. High enough to
      //                     stop the warble, low enough to keep emotional range.
      //                     Energy now comes from the WORDS (prompt), not from
      //                     destabilizing the voice.
      //   style 0.3       — modest expressiveness. Docs warn high style adds
      //                     latency + drift and hurts naturalness, so we keep it
      //                     low and let lexical energy carry the life.
      //   speed 1.02      — natural conversational pace (0.9–1.1 is the human band).
      //   similarity 0.75 — keep the voice identity locked.
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.3,
      useSpeakerBoost: true,
      speed: 1.02,
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
      // nova-3 is Deepgram's newest model — materially better accuracy on
      // conversational speech and lower latency than nova-2. The "bad
      // listener" feedback was largely Deepgram missing words; nova-3 fixes
      // that without us touching anything else.
      model: "nova-3",
      language: "en-US",
      // BUGFIX: 120ms was finalizing the transcript the instant the caller took
      // a normal mid-thought breath, so Max heard only half a sentence ("doesn't
      // pick up what I'm saying") and jumped in early ("speeds through"). 300ms
      // lets a natural pause ride without prematurely ending their turn. Smart
      // endpointing (below) still keeps replies fast on genuine sentence ends.
      endpointing: 300,
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
    silenceTimeoutSeconds: 30,
    // Prelaunch teaser, not a support call — keep it short, punchy, convincing.
    // Matches MAX_DURATION_SECONDS in the demo component.
    maxDurationSeconds: 240,
    startSpeakingPlan: {
      // SNAPPY turn-taking after the user finishes — the "awkward silence"
      // problem. The trust-tune set this to 0.55 globally, which fixed
      // snap-reply-feels-scripted but introduced clear dead air on normal
      // turn boundaries. Pulled back hard:
      //   waitSeconds              0.20  — fires fast once Deepgram says final
      //   onPunctuationSeconds     0.10  — sentence end = go
      //   onPunctuationSeconds     0.20  — clear sentence end = still quick.
      //   onNoPunctuationSeconds   0.80  — BUGFIX: raised from 0.40. When the
      //                                    caller trails off WITHOUT a sentence
      //                                    end they're almost always mid-thought.
      //                                    0.4s barged in and rushed them; 0.8s
      //                                    gives them room to keep going. Still
      //                                    under the ~1s "is it broken?" line.
      //   onNumberSeconds          0.50  — phone numbers/digits, a touch patient.
      waitSeconds: 0.2,
      smartEndpointingEnabled: true,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.2,
        onNoPunctuationSeconds: 0.8,
        onNumberSeconds: 0.5,
      },
    },
    stopSpeakingPlan: {
      // User feedback iteration: prior settings (numWords 5 / voice 0.5 /
      // backoff 1.0) were too tolerant — Max ignored real interruptions and
      // talked over the user. Middle ground: 3 words + 0.3s of voice = Max
      // yields when the user genuinely starts talking, but still rides
      // through coughs and "mm-hm" backchannels. Backoff 0.5s so resume
      // doesn't feel sluggish.
      // Nudged numWords 3->2 + voiceSeconds 0.3->0.25 so Max yields a beat sooner
      // when the caller genuinely cuts in — part of the "doesn't hear me" fix is
      // making sure he stops talking the moment you do.
      numWords: 2,
      voiceSeconds: 0.25,
      backoffSeconds: 0.5,
    },
    // Lets Max actually hang up when the conversation has run its course (Vapi
    // injects an end-call tool the model can invoke). Without this the call just
    // sat open until the 4-min cap or the caller bailed.
    endCallFunctionEnabled: true,
    endCallMessage:
      "Appreciate the time. You'll hear from us first when the beta opens. Talk soon.",
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
