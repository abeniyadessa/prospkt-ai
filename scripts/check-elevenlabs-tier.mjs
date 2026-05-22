#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const raw = await fs.readFile(envPath, "utf8");
const apiKey = raw.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim();

const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
  headers: { "xi-api-key": apiKey },
});

if (!res.ok) {
  console.log(`Status: ${res.status}`);
  console.log(await res.text());
  process.exit(1);
}

const sub = await res.json();
console.log(`Tier: ${sub.tier || "?"}`);
console.log(`Status: ${sub.status || "?"}`);
console.log(`Characters used: ${sub.character_count || 0} / ${sub.character_limit || "?"}`);
console.log(`Models enabled: ${(sub.allowed_to_extend_character_limit ?? "?")}`);
if (sub.available_models) {
  console.log("\nAvailable models:");
  for (const m of sub.available_models) {
    console.log(`  - ${m.model_id} (${m.display_name || "?"})`);
  }
}
