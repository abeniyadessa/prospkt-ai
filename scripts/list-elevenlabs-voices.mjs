#!/usr/bin/env node
// Lists all voices available to this ElevenLabs account.
// Reads ELEVENLABS_API_KEY from .env.local.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

async function loadDotEnv() {
  if (process.env.ELEVENLABS_API_KEY) return;
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

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const res = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: { "xi-api-key": apiKey },
});

if (!res.ok) {
  console.error(`API ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const voices = data.voices || [];
console.log(`Total: ${voices.length}\n`);

for (const v of voices) {
  const l = v.labels || {};
  const accent = l.accent || l.language || "?";
  const gender = l.gender || "?";
  const age = l.age || "?";
  const desc = l.descriptive || l.description || "";
  const use = l.use_case || "";
  console.log(
    `${v.voice_id} | ${v.name.padEnd(18)} | ${gender.padEnd(7)} | ${accent.padEnd(15)} | ${age.padEnd(14)} | ${desc.padEnd(22)} | ${use}`
  );
}
