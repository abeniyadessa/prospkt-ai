#!/usr/bin/env node
// Generate the prelaunch voice demo using ElevenLabs (Multilingual v2).
// Two distinct voices — Sarah (Prospkt agent) and Angela (customer) — concatenated
// as a single MP3-44100-128k file with natural 700ms breaks before each turn.
//
// Free tier compatible (Pro tier required for PCM output, so we use MP3 CBR).
// Silence between turns is achieved via SSML <break time="0.7s"/> tags prepended
// to each line after the first, which ElevenLabs renders as real audio silence.
// Duration is derived from CBR byte math (file_size / 16000 bytes_per_second).
//
// Usage:
//   ELEVENLABS_API_KEY=... node scripts/generate-prelaunch-voice-demo.mjs
//
// Reads ELEVENLABS_API_KEY from .env.local if not in shell env.
// Writes to public/prelaunch-voice-demo/agent-demo.mp3
// Prints the timing table to paste into prelaunch-voice-demo.tsx.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// --- env loading -----------------------------------------------------------

async function loadDotEnv() {
  if (process.env.ELEVENLABS_API_KEY) return;
  const envPath = path.join(REPO_ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (key in process.env) continue;
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      process.env[key] = value;
    }
  } catch {
    /* no .env.local — rely on shell */
  }
}

await loadDotEnv();

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set (checked shell env + .env.local).");
  process.exit(1);
}

// --- voice config ----------------------------------------------------------

// Hardcoded public ElevenLabs voice IDs from the official voice library:
//   Sarah (warm professional female) — soft, friendly, receptionist-appropriate
//   Rachel (calm conversational female) — distinct enough to feel like a real
//   second person without sounding artificial
//
// Override via env if you want to A/B test other voices.
const VOICE_SARAH = process.env.PROSPKT_DEMO_VOICE_SARAH || "EXAVITQu4vr4xnSDxMaL"; // Sarah
const VOICE_ANGELA = process.env.PROSPKT_DEMO_VOICE_ANGELA || "21m00Tcm4TlvDq8ikWAM"; // Rachel
const MODEL = process.env.PROSPKT_DEMO_MODEL || "eleven_multilingual_v2";

const SAMPLE_RATE = 44100;
const BITRATE_KBPS = 128; // mp3_44100_128 — CBR
const BYTES_PER_SECOND = (BITRATE_KBPS * 1000) / 8; // 16000
const SILENCE_BETWEEN_TURNS_MS = 700;

// --- script ----------------------------------------------------------------

const dialog = [
  {
    speaker: "Sarah",
    voiceId: VOICE_SARAH,
    text: "Hi Angela, this is Sarah with Greenway Services. I saw you requested a deck quote online — is now still a good time?",
    // voice_settings tuned for warmth + natural delivery on a friendly opener
    settings: { stability: 0.45, similarity_boost: 0.78, style: 0.35, use_speaker_boost: true },
  },
  {
    speaker: "Angela",
    voiceId: VOICE_ANGELA,
    text: "Yeah, I'm available. We'd like to get our deck replaced.",
    settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
  },
  {
    speaker: "Sarah",
    voiceId: VOICE_SARAH,
    text: "Perfect. I've got Thursday between 9 and 11, or Friday after 2. Which window works better for you?",
    settings: { stability: 0.45, similarity_boost: 0.78, style: 0.35, use_speaker_boost: true },
  },
  {
    speaker: "Angela",
    voiceId: VOICE_ANGELA,
    text: "Thursday morning works.",
    settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
  },
  {
    speaker: "Sarah",
    voiceId: VOICE_SARAH,
    text: "Great. I'll hold Thursday 9 to 11 and send it to the owner for approval before it's confirmed.",
    settings: { stability: 0.45, similarity_boost: 0.78, style: 0.35, use_speaker_boost: true },
  },
];

// --- ElevenLabs call -------------------------------------------------------

async function generateLine(line) {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${line.voiceId}` +
    `?output_format=mp3_${SAMPLE_RATE}_${BITRATE_KBPS}`;

  const body = {
    text: line.text,
    model_id: MODEL,
    voice_settings: line.settings,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs ${res.status} for "${line.speaker}": ${errText.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// Strip ID3v2 header if present. ID3v2 headers start with "ID3" and the size is
// in bytes 6-9 (4 bytes, syncsafe-encoded 7 bits per byte). Without stripping,
// concatenating MP3 files can confuse some decoders.
function stripId3(buf) {
  if (buf.length < 10) return buf;
  if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return buf; // not "ID3"
  const size =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f);
  return buf.subarray(10 + size);
}

// --- main ------------------------------------------------------------------

const timings = [];
const mp3Parts = [];
let totalBytes = 0;

for (let i = 0; i < dialog.length; i++) {
  const line = dialog[i];
  process.stderr.write(`[${i + 1}/${dialog.length}] ${line.speaker}: ${line.text.slice(0, 60)}...\n`);

  // Prepend an SSML break before each line except the first to create natural
  // inter-turn silence inside the generated audio. ElevenLabs renders <break>
  // as real audio silence.
  const inputText =
    i === 0
      ? line.text
      : `<break time="${SILENCE_BETWEEN_TURNS_MS / 1000}s"/> ${line.text}`;

  const mp3 = stripId3(await generateLine({ ...line, text: inputText }));
  const segmentDuration = mp3.length / BYTES_PER_SECOND; // CBR: bytes / 16000

  const startSeconds = totalBytes / BYTES_PER_SECOND;
  totalBytes += mp3.length;
  const endSeconds = totalBytes / BYTES_PER_SECOND;

  mp3Parts.push(mp3);

  timings.push({
    speaker: line.speaker === "Sarah" ? "Prospkt" : line.speaker,
    start: Math.round(startSeconds * 100) / 100,
    end: Math.round(endSeconds * 100) / 100,
    text: line.text,
    duration: Math.round(segmentDuration * 100) / 100,
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
console.log("Paste this into components/marketing/prelaunch-voice-demo.tsx:");
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
