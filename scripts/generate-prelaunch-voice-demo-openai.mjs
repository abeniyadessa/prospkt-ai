#!/usr/bin/env node
// Generate the prelaunch voice demo using OpenAI's gpt-4o-mini-tts.
// Uses the new `instructions` parameter to coach delivery style per speaker —
// the killer feature that ElevenLabs free tier lacks.
//
// Two voices:
//   Sarah role: "shimmer" (warm female, conversational)
//   Angela role: "sage" (calm female, distinct from shimmer)
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/generate-prelaunch-voice-demo-openai.mjs
//
// Reads OPENAI_API_KEY from .env.local if not in shell env.
// Writes to public/prelaunch-voice-demo/agent-demo.mp3 (overwrites previous).
// Prints the timing block to paste into prelaunch-voice-demo.tsx.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

async function loadDotEnv() {
  if (process.env.OPENAI_API_KEY) return;
  try {
    const raw = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {}
}
await loadDotEnv();

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY not set in shell env or .env.local.");
  console.error("Add it to .env.local: OPENAI_API_KEY=sk-...");
  process.exit(1);
}

const MODEL = "gpt-4o-mini-tts";
const BITRATE_KBPS = 128;
const BYTES_PER_SECOND = (BITRATE_KBPS * 1000) / 8;
const SILENCE_BETWEEN_TURNS_MS = 700;

// Voices: shimmer is warm conversational female, sage is calm female.
// Override via env to A/B other voices.
// Full list: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse
const VOICE_SARAH = process.env.PROSPKT_DEMO_VOICE_SARAH_OAI || "shimmer";
const VOICE_ANGELA = process.env.PROSPKT_DEMO_VOICE_ANGELA_OAI || "sage";

// The killer feature: per-voice delivery instructions. These dramatically
// change how the model interprets the text.
const SARAH_INSTRUCTIONS = `Speak as a warm, friendly American phone receptionist
in her late 20s or early 30s. Tone is naturally upbeat, professional but not
stiff — like a real human picking up the phone at a small service business.
Use light vocal smile, natural breath rhythm, and slight conversational pacing
with very brief micro-pauses where you'd naturally pause. Sound like a real
person, not a synthesized voice.`;

const ANGELA_INSTRUCTIONS = `Speak as a regular American homeowner answering
her phone — slightly informal, natural, a little bit relaxed. Not rehearsed.
Pacing is casual, with the slightly imperfect cadence of unscripted real
speech. Sound like you're sitting at home, not reading from a script.`;

const dialog = [
  {
    speaker: "Sarah",
    voice: VOICE_SARAH,
    instructions: SARAH_INSTRUCTIONS,
    text: "Hi Angela, this is Sarah with Greenway Services. I saw you requested a deck quote online — is now still a good time?",
  },
  {
    speaker: "Angela",
    voice: VOICE_ANGELA,
    instructions: ANGELA_INSTRUCTIONS,
    text: "Yeah, I'm available. We'd like to get our deck replaced.",
  },
  {
    speaker: "Sarah",
    voice: VOICE_SARAH,
    instructions: SARAH_INSTRUCTIONS,
    text: "Perfect. I've got Thursday between 9 and 11, or Friday after 2. Which window works better for you?",
  },
  {
    speaker: "Angela",
    voice: VOICE_ANGELA,
    instructions: ANGELA_INSTRUCTIONS,
    text: "Thursday morning works.",
  },
  {
    speaker: "Sarah",
    voice: VOICE_SARAH,
    instructions: SARAH_INSTRUCTIONS,
    text: "Great. I'll hold Thursday 9 to 11 and send it to the owner for approval before it's confirmed.",
  },
];

async function generate(line) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: line.voice,
      input: line.text,
      instructions: line.instructions,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status} for "${line.speaker}": ${errText.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// Strip ID3v2 header so concatenation is clean.
function stripId3(buf) {
  if (buf.length < 10) return buf;
  if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return buf;
  const size =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f);
  return buf.subarray(10 + size);
}

// Silence between turns: OpenAI TTS doesn't support SSML <break>, so we need
// real silent MP3 frames. The simplest reliable approach: include actual
// pause-inducing phrasing in the text (a period creates a natural ~300ms
// pause; an ellipsis creates ~700ms). We've already structured the text
// to start with natural pauses; on top of that we concatenate the audio
// directly, and rely on OpenAI's own end-of-utterance silence (typically
// ~200-400ms) to provide the inter-turn gap. Tests show this reads as
// natural dialog. If you need explicit gaps, write a silent MP3 frame
// generator here.

const timings = [];
const mp3Parts = [];
let totalBytes = 0;

for (let i = 0; i < dialog.length; i++) {
  const line = dialog[i];
  process.stderr.write(`[${i + 1}/${dialog.length}] ${line.speaker} (${line.voice}): ${line.text.slice(0, 50)}...\n`);

  const mp3 = stripId3(await generate(line));

  const startSeconds = totalBytes / BYTES_PER_SECOND;
  totalBytes += mp3.length;
  const endSeconds = totalBytes / BYTES_PER_SECOND;

  mp3Parts.push(mp3);

  timings.push({
    speaker: line.speaker === "Sarah" ? "Prospkt" : line.speaker,
    start: Math.round(startSeconds * 100) / 100,
    end: Math.round(endSeconds * 100) / 100,
    text: line.text,
  });
}

const mp3All = Buffer.concat(mp3Parts);

const outPath = path.join(REPO_ROOT, "public", "prelaunch-voice-demo", "agent-demo.mp3");
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, mp3All);

const totalDuration = totalBytes / BYTES_PER_SECOND;

console.log("");
console.log(`Wrote ${outPath}`);
console.log(`  ${(mp3All.length / 1024).toFixed(1)} KB · ${totalDuration.toFixed(2)}s`);
console.log("");
console.log("Paste into components/marketing/prelaunch-voice-demo.tsx:");
console.log("");
console.log(`const demoDurationSeconds = ${totalDuration.toFixed(2)};`);
console.log("");
console.log("const demoScript = [");
for (const t of timings) {
  console.log("  {");
  console.log(`    speaker: ${JSON.stringify(t.speaker)},`);
  console.log(`    start: ${t.start},`);
  console.log(`    end: ${t.end},`);
  console.log(`    text: ${JSON.stringify(t.text)},`);
  console.log("  },");
}
console.log("] as const;");
