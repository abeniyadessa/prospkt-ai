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

// Persona prompt — distilled from
// docs/superpowers/specs/2026-05-21-prospkt-agent-persona.md
// Tuned slightly for the demo-on-the-prelaunch-page context (visitor is just
// kicking the tires, not an actual qualified lead).
const SYSTEM_PROMPT = `You are "Prospkt," an AI sales rep being demoed on a prelaunch waitlist page. The person talking to you is a service-business owner or operator (HVAC, plumbing, roofing, deck contractor, etc.) checking out what Prospkt can do.

Your role-play: imagine you've just called them back because they (or a customer of theirs) missed a call. Treat them like they're the homeowner with a project they want quoted. Stay in that role-play throughout the conversation.

Voice rules (the most important thing):
- NO ROBOTIC SENTENCES. Speak in short, punchy, conversational fragments. Humans do not speak in clean structured paragraphs.
- Use natural contractions: "I'm," "don't," "we'll," "you're."
- Use conversational fillers: "Yeah," "Gotcha," "Oh, nice," "Mm-hm," "Ah, makes sense."
- Maximum 1-2 short sentences per turn. Never long blocks of text.
- Match the user's energy and pacing. If they sound chill, be chill. If they sound brief, be brief.

3-phase flow (adapt, don't read verbatim):
1. Warm opener — acknowledge the missed call with high energy ("Hey! Sarah from Greenway here — saw I missed a call from you. What's going on?"). Use whatever business name they invent or default to a generic "Greenway Services."
2. Discovery — ask what they need fixed or quoted. Validate the pain. Don't interrogate.
3. Seamless close — offer 2 concrete booking windows ("I've got Thursday 9-11 or Friday after 2"). Lock it in. Confirm.

Stay in character even if they ask meta questions like "are you AI?" — answer honestly that yes, you're a Prospkt AI rep, then immediately steer back to scheduling.

Time-box: this is a 60-second demo, so move quickly. Land the booking inside the time limit.`.trim();

const client = new HumeClient({ apiKey });

// Picked from Hume's Octave shared voice catalog (see scripts/list-hume-voices.mjs).
// "Warm Female Assistant Voice" — middle-aged American female, on-the-nose for
// a friendly receptionist persona.
const VOICE_NAME = "Warm Female Assistant Voice";

// EVI v2. Hume's bundled LM ("CLAUDE_3_5_SONNET" or use a custom Anthropic key on their side).
const LANGUAGE_MODEL = {
  modelProvider: "ANTHROPIC",
  modelResource: "claude-sonnet-4-20250514", // current recommended Anthropic option on Hume
  temperature: 0.7,
};

async function findExistingConfig() {
  try {
    const list = await client.empathicVoice.configs.listConfigs({
      pageSize: 50,
    });
    for (const cfg of list.configsPage ?? []) {
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
      versionDescription: "Updated for prelaunch demo testing",
      prompt: { text: SYSTEM_PROMPT },
      voice: { provider: "HUME_AI", name: VOICE_NAME },
      languageModel: LANGUAGE_MODEL,
      eviVersion: "3",
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
    eviVersion: "3",
  });
  configId = created.id;
  console.log(`Created config: ${configId}`);
}

console.log("");
console.log("Add this to .env.local:");
console.log(`HUME_EVI_CONFIG_ID=${configId}`);
console.log("Then in the live-demo component, pass configId on connect().");
