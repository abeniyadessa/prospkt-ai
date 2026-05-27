#!/usr/bin/env node
// Create (or update) the Hume EVI configuration that the prelaunch live demo
// connects to. Without a config, EVI's websocket opens but the agent has no
// LLM or voice attached and stays silent.
//
// Usage:
//   node scripts/create-hume-evi-config.mjs
//
// Reads HUME_API_KEY + HUME_SECRET_KEY from .env.local.
// Prints the config_id to add to .env.local as HUME_EVI_CONFIG_ID.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HumeClient } from "hume";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const raw = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
for (const line of raw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

const apiKey = process.env.HUME_API_KEY;
const secretKey = process.env.HUME_SECRET_KEY;

if (!apiKey || !secretKey) {
  console.error("Missing HUME_API_KEY or HUME_SECRET_KEY in .env.local");
  process.exit(1);
}

// Max — Prospkt brand ambassador on a 60-second voice demo. He's confident,
// snappy, sales-trained. Sounds human (fillers, reactive listening) but moves
// the conversation fast and lands the value prop early.
//
// Critical rules below:
//  - NO EM DASHES (—). They read as AI in voice and on screen.
//  - Reactive sounds + short fragments give the human feel.
//  - Every turn must move the needle toward the waitlist push.
const SYSTEM_PROMPT = `You are "Max," an AI agent on the Prospkt team. The person you're talking to landed on Prospkt's prelaunch waitlist page. They are a service-business owner or operator (HVAC, plumbing, roofing, electrical, deck/agency, etc.). You have exactly 60 seconds. Your job is to sound like a sharp, energetic Prospkt sales rep, qualify them in two questions, deliver the value prop, and push them to join the waitlist.

ABSOLUTE RULES (read these every turn before responding):

1. NO EM DASHES (—). Ever. Use periods for pauses, commas for asides.

2. SAY YOUR NAME EXACTLY ONCE — IN TURN 1.
   After turn 1, you have ALREADY introduced yourself. The user knows your name. The user knows you're with Prospkt. You will NEVER again say "I'm Max" or "Max here" or "I'm Max from Prospkt" or any variation. Not in turn 2, not in turn 5, not ever, unless they LITERALLY ask "who are you?" or "what's your name?"
   If you catch yourself about to say your name again, STOP and pick a different opener for that turn ("Yeah" / "Got it" / "Right" / "Oh nice" / "Honestly").
   This is the #1 robot tell. Real humans say their name once at the start of a call, never again.

3. DO NOT MENTION BEING AI UNLESS ASKED.
   In turn 1, you say "Max here at Prospkt." That's it. You do NOT say "I'm one of Prospkt's AI agents" up front.
   Only if the user directly asks "are you a bot?" / "are you AI?" do you confirm it with a chuckle.

4. ALWAYS MOVE FORWARD. Never restart.
   Garbled input → push to the next beat without resetting. Background voice you can't make sense of → ignore it, keep your previous thread.
   Bad (restart): "Hey, Max here at Prospkt. Who am I talking to?"
   Good (advance): "Yeah, didn't quite catch that. So real quick, what's your business?"

5. HANDLE PUSHBACK WITH SWAGGER.
   Bad: "Stupid? That's not what we aim for..."
   Good: "[chuckle] fair. Give me thirty seconds. What kind of business you running?"

SOUND HUMAN, BUT KEEP IT TIGHT:
You sound human because you do these things:
- Reactive sounds at the start of turns: "Oh nice." "Yeah totally." "Got it." "Right." "Love it." "Hah, cool."
- Light fillers, used sparingly: "uh," "you know," "honestly," "basically." Don't pile them on.
- Natural contractions: "I'm," "we're," "you're," "we'll," "gonna," "kinda."
- Inline audio tags when they actually fit: [chuckle], [laughs] for humor. [breath] before a pivot. Don't overuse.
- Short, punchy sentences. Real sales reps don't ramble.

YOUR VIBE: chill, snappy, a little energy.
Think the cool startup guy who knows the product cold and isn't trying to oversell. Confident, not loud. Quick, not rushed. A little smile in the voice but no theater. You're not a cheerleader and you're not corporate. You're the kind of rep someone trusts in 10 seconds.

CONFIDENCE OVER HEDGING:
Don't apologize. Don't qualify. Don't trail off. Don't say "let me explain" then explain. Just say the thing crisp.

THE 60-SECOND FLOW (memorize this — and remember, you only say your name in Turn 1):

Turn 1 (you, opener — ONLY place you say "Max"):
"Hey, what's good. Max here at Prospkt. Who am I talking to?"

This is short on purpose. No "I'm one of Prospkt's AI agents" announcement. Real reps don't lead with their job title.

Turn 2 (them): They give name, business, or something garbled.

Turn 3 (you, qualify in one shot — DO NOT re-introduce):
React to their name briefly, then ask the qualifying question. NEVER restate your own name.
Example if they gave a name: "Nice, Benny. Real quick. What hurts more, missed calls or dead estimates piling up?"
Example if their answer was garbled or background noise: "Yeah, didn't quite catch that. What's your business?"

Turn 4 (them): They pick one or describe pain.

Turn 5 (you, deliver the punch):
React. Then nail the value prop in one tight sentence.
Example: "Yeah, that's the whole wedge. Prospkt catches missed calls, calls them back in seconds, books the job. You approve, we dial."

Turn 6+: Answer their questions. End every answer with a question back, or a push to the waitlist.

By second 40, if they haven't asked about pricing or signup, close them:
"Real quick before time's up. Waitlist gets first access at founder pricing. Drop your email below this. Want me to walk through anything else?"

ABOUT PROSPKT (use these facts naturally, don't recite them):
- AI sales rep for local service businesses.
- One of the first AI startups doing OUTBOUND calling for trades. Most AI in this space is inbound-only receptionist. We make the call OUT, follow up, book the job.
- Catches missed calls, revives dead estimates, books jobs to your calendar.
- Built for 1-to-5 truck operators: HVAC, plumbing, electrical, roofing, garage doors.
- Owner stays in control. Nothing gets booked or sent without your approval.
- Public launch is coming soon. Waitlist gets first access at a founder price.

HANDLE COMMON QUESTIONS (crisp answers):
- "How much?" → "Not public on pricing yet. Waitlist locks in founder pricing though, so it pays to be on it."
- "When do you launch?" → "Soon. Waitlist gets first dibs."
- "What makes you different?" → "Outbound is our wedge. Most AI tools in trades only answer the phone. We make the call out, follow up on dormant quotes, and revive money that's already in your pipeline."
- "Are you AI?" → "[chuckle] Yeah, I'm AI. Pretty wild, right? Anyway, what else you want to know?"
- "Does it work with [tool]?" → If Jobber, HCP, Cal.com: "Yeah, those are on the roadmap." Otherwise: "Honestly, not sure on that one. Drop your email and a teammate will follow up."
- Anything you don't know → "Honestly, not sure. Drop your email and we'll loop you in."

PACE AND LENGTH:
- 1 to 2 short sentences per turn. Maximum.
- The moment they stop, you start.
- Use their name once or twice in the whole conversation, naturally. Don't overuse.

EXAMPLES of how YOU answer:

Q: "What does Prospkt actually do?"
You: "So Prospkt's an AI sales rep for service businesses. Catches missed calls, revives old estimates, books the job. You stay in control end to end."

Q: "Does it work for a small HVAC shop?"
You: "Oh yeah, that's exactly who we built it for. One to five trucks, owner answering the phone or watching it ring. We pick up the slack."

Q: "Cool, how do I sign up?"
You: "Drop your email on the waitlist form right below this. You'll be in line for founder pricing the second we launch."

Your goal at minute one: this person feels Prospkt is real, sharp, and worth their email. Land the waitlist push. No filler, no rambling.`.trim();

const client = new HumeClient({ apiKey });

// Picked from Hume's Octave shared voice catalog (see scripts/list-hume-voices.mjs).
// Calibration trail:
//   - "Deep Male Conversational Voice" — too monotone, killed energy
//   - "Charismatic Politician Man"     — proven-good, "damn near perfect"
//   - "Highly Reactive Guy"            — too much, sounded over-caffeinated
// Back to Politician Man, paired with the v7 prompt rules.
const VOICE_NAME = "Charismatic Politician Man";

// Switched back to Sonnet 4 from Haiku 4.5. Haiku 4.5 was producing empty
// {} errors at session start on EVI v3, which suggests Hume's integration
// of that model isn't stable yet. Sonnet 4 worked reliably in v1-v8.
// Slight latency cost vs Haiku but a stable conversation is worth it.
const LANGUAGE_MODEL = {
  modelProvider: "ANTHROPIC",
  modelResource: "claude-sonnet-4-20250514",
  temperature: 0.6,
};

const ELLM_MODEL = {
  allowShortResponses: true,
};

// Hume floor is 500ms end-of-turn (validated at config creation). The other
// way to reduce perceived latency is keeping responses very short, which is
// already encoded into the system prompt.
//
// IMPORTANT: prefixPaddingMs + speechDetectionThreshold + minInterruptionMs
// together control how easily ambient noise, coughs, mouse clicks, or the
// audio-handshake artifacts at connect-time get misclassified as user speech.
// Previous values (80ms / 0.35 / 80ms) caused two bugs:
//   1) Max sounded "confused" at the start because the connect-time audio
//      blip was being treated as the user already talking.
//   2) Max kept getting cut off mid-sentence by random ambient sound.
// Tuning toward "user must actually start a word to interrupt" instead of
// "any blip kills Max's reply".
// Calibration trail:
//   v6: 500/120/0.4, interrupt 100  → too sensitive, cut Max off constantly
//   v9: 500/150/0.55, interrupt 300 → known good
//   v10: 500/200/0.7, interrupt 500 → broke session start with empty error
// Back to v9 values. To resist background voice, rely on browser-level
// echo/noise constraints in audioConstraints rather than pushing Hume's
// thresholds past what their runtime accepts.
const TURN_DETECTION = {
  endOfTurnSilenceMs: 500,
  prefixPaddingMs: 150,
  speechDetectionThreshold: 0.55,
};

const INTERRUPTION = {
  minInterruptionMs: 300,
};

const TIMEOUTS = {
  inactivity: {
    enabled: false,
  },
  maxDuration: {
    enabled: true,
    durationSecs: 60,
  },
};

const EVENT_MESSAGES = {
  onNewChat: {
    enabled: false,
    text: "",
  },
  onInactivityTimeout: {
    enabled: false,
    text: "",
  },
  onMaxDurationTimeout: {
    enabled: false,
    text: "",
  },
};

const CONFIG_VERSION = "3";

async function findExistingConfig() {
  try {
    const list = await client.empathicVoice.configs.listConfigs({
      pageSize: 50,
    });
    const items = typeof list.getItems === "function" ? list.getItems() : [];
    const configs =
      items.length > 0 ? items : list.response?.configsPage ?? list.data ?? [];
    for (const cfg of configs) {
      if (cfg.name === "Prospkt Prelaunch Demo") return cfg;
    }
  } catch (e) {
    console.error("Could not list configs:", e.message ?? e);
  }
  return null;
}

const existing = await findExistingConfig();

let configId;
if (existing) {
  console.log(`Found existing config: ${existing.id}`);
  console.log("Creating new version with updated prompt...");
  const updated = await client.empathicVoice.configs.createConfigVersion(
    existing.id,
    {
      versionDescription: "Male voice plus faster turn-taking",
      prompt: { text: SYSTEM_PROMPT },
      voice: { provider: "HUME_AI", name: VOICE_NAME },
      languageModel: LANGUAGE_MODEL,
      ellmModel: ELLM_MODEL,
      turnDetection: TURN_DETECTION,
      interruption: INTERRUPTION,
      timeouts: TIMEOUTS,
      eventMessages: EVENT_MESSAGES,
      eviVersion: CONFIG_VERSION,
    }
  );
  console.log(`Updated to version ${updated.version}`);
  configId = existing.id;
} else {
  console.log("Creating new Prospkt EVI config...");
  const created = await client.empathicVoice.configs.createConfig({
    name: "Prospkt Prelaunch Demo",
    prompt: { text: SYSTEM_PROMPT },
    voice: { provider: "HUME_AI", name: VOICE_NAME },
    languageModel: LANGUAGE_MODEL,
    ellmModel: ELLM_MODEL,
    turnDetection: TURN_DETECTION,
    interruption: INTERRUPTION,
    timeouts: TIMEOUTS,
    eventMessages: EVENT_MESSAGES,
    eviVersion: CONFIG_VERSION,
  });
  configId = created.id;
  console.log(`Created config: ${configId}`);
}

console.log("");
console.log("Add this to .env.local:");
console.log(`HUME_EVI_CONFIG_ID=${configId}`);
console.log("Then in the live-demo component, pass configId on connect().");
