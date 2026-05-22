#!/usr/bin/env node
// Generate the prelaunch voice demo using Hume AI's Octave TTS.
// Octave is specifically trained on emotional and conversational speech,
// generally rated more "human-sounding" than ElevenLabs for dialog.
//
// Uses voice descriptions (ad-hoc voice generation) rather than preset voice
// IDs — describe the persona and Hume builds a matching voice on the fly.
//
// Usage:
//   HUME_API_KEY=... node scripts/generate-prelaunch-voice-demo-hume.mjs
//
// Reads HUME_API_KEY from .env.local if not in shell env.
// Writes to public/prelaunch-voice-demo/agent-demo.mp3 (overwrites previous).
// Prints the timing block to paste into prelaunch-voice-demo.tsx.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

async function loadDotEnv() {
  if (process.env.HUME_API_KEY) return;
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

const API_KEY = process.env.HUME_API_KEY;
if (!API_KEY) {
  console.error("HUME_API_KEY not set in shell env or .env.local.");
  process.exit(1);
}

const BITRATE_KBPS = 128;
const BYTES_PER_SECOND = (BITRATE_KBPS * 1000) / 8;

// Hume Octave voice descriptions — these drive ad-hoc voice generation.
// Hume reads the description and produces a matching voice persona.
// Persona aligns with docs/superpowers/specs/2026-05-21-prospkt-agent-persona.md
const SARAH_DESCRIPTION = `A warm, friendly American woman in her late twenties working as a phone receptionist at a small home-services business. She speaks in short, punchy, conversational fragments — never in long structured sentences. Uses natural contractions, light vocal smile, and the kind of natural micro-pauses, breath, and energy of an actual person catching a missed call back. Subtle smile in her voice, professional but never stiff. Real speech rhythm — slight imperfections, NOT robotic perfection.`;

const ANGELA_DESCRIPTION = `A relaxed American homeowner in her mid thirties answering her phone at home. Casual, slightly informal, slightly distracted in the way real people are when they pick up the phone. Natural pacing, not rehearsed. Conversational rhythm with the slightly imperfect cadence of unscripted speech.`;

// Dialog rewritten per the Prospkt persona rules: fragments, contractions,
// fillers, inline atmospheric markers. Scenario reframed as a missed-call
// callback (the V1 product) rather than the old form-fill scenario.
const dialog = [
  {
    speaker: "Sarah",
    description: SARAH_DESCRIPTION,
    text: "[warmly] Hey Angela! Sarah from Greenway here — caught your missed call a sec ago. Did I catch you at a bad time?",
  },
  {
    speaker: "Angela",
    description: ANGELA_DESCRIPTION,
    text: "Oh, no, you're good. Yeah, we're looking at getting our deck replaced.",
  },
  {
    speaker: "Sarah",
    description: SARAH_DESCRIPTION,
    text: "[warmly] Gotcha — that's exactly what we do. Got two spots open this week: Thursday 9 to 11, or Friday after 2. Which works better?",
  },
  {
    speaker: "Angela",
    description: ANGELA_DESCRIPTION,
    text: "Thursday morning. Definitely.",
  },
  {
    speaker: "Sarah",
    description: SARAH_DESCRIPTION,
    text: "Perfect. [warmly] I'll hold that Thursday slot for you — sending it over for owner approval right now. You'll have a confirmation in a few minutes.",
  },
];

// Generate ALL utterances in one API call. Hume's /v0/tts/file endpoint
// accepts an array of utterances and returns a single concatenated MP3,
// which gives Octave context about the surrounding turns and produces
// more natural dialog flow than generating each line in isolation.
async function generateAll() {
  const utterances = dialog.map((line, i) => ({
    text: line.text,
    description: line.description,
    // Add small trailing silence to inter-turn pauses (last utterance gets none).
    trailing_silence: i === dialog.length - 1 ? 0 : 0.5,
  }));

  const res = await fetch("https://api.hume.ai/v0/tts/file", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      utterances,
      format: { type: "mp3" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Hume ${res.status}: ${errText.slice(0, 400)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

process.stderr.write(`Generating ${dialog.length} utterances via Hume Octave...\n`);
for (let i = 0; i < dialog.length; i++) {
  process.stderr.write(`  [${i + 1}] ${dialog[i].speaker}: ${dialog[i].text.slice(0, 50)}...\n`);
}

const mp3All = await generateAll();

const outPath = path.join(REPO_ROOT, "public", "prelaunch-voice-demo", "agent-demo.mp3");
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, mp3All);

// CBR duration estimate. Hume returns MP3 at 128kbps by default which gives
// us 16000 bytes/sec for the math. Verify by listening.
const totalDuration = mp3All.length / BYTES_PER_SECOND;

console.log("");
console.log(`Wrote ${outPath}`);
console.log(`  ${(mp3All.length / 1024).toFixed(1)} KB · ~${totalDuration.toFixed(2)}s estimated`);
console.log("");
console.log("Note: Hume returns a single concatenated MP3 with all 5 utterances.");
console.log("Estimated per-segment timings based on character-rate average (~14 chars/sec):");
console.log("");

// Rough timing estimate based on character count (no per-segment API in /file mode).
// You'll want to verify these by playing the audio and adjusting if drift is visible.
let cursor = 0;
const CHARS_PER_SECOND = 14;
const INTER_TURN_PAUSE = 0.5;
const timings = [];

for (let i = 0; i < dialog.length; i++) {
  const dur = dialog[i].text.length / CHARS_PER_SECOND;
  const start = cursor;
  const end = cursor + dur;
  cursor = end + (i < dialog.length - 1 ? INTER_TURN_PAUSE : 0);
  timings.push({
    speaker: dialog[i].speaker === "Sarah" ? "Prospkt" : "Angela",
    start: Math.round(start * 100) / 100,
    end: Math.round(end * 100) / 100,
    text: dialog[i].text,
  });
}

// Normalize estimated total to match actual file duration
const estimatedTotal = cursor;
const scale = totalDuration / estimatedTotal;
const scaledTimings = timings.map(t => ({
  ...t,
  start: Math.round(t.start * scale * 100) / 100,
  end: Math.round(t.end * scale * 100) / 100,
}));

console.log(`const demoDurationSeconds = ${totalDuration.toFixed(2)};`);
console.log("");
console.log("const demoScript = [");
for (const t of scaledTimings) {
  console.log("  {");
  console.log(`    speaker: ${JSON.stringify(t.speaker)},`);
  console.log(`    start: ${t.start},`);
  console.log(`    end: ${t.end},`);
  console.log(`    text: ${JSON.stringify(t.text)},`);
  console.log("  },");
}
console.log("] as const;");
