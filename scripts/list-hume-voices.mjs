#!/usr/bin/env node
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

const client = new HumeClient({ apiKey: process.env.HUME_API_KEY });

// Try the raw REST endpoint that the EVI config lookup hits.
const apiKey = process.env.HUME_API_KEY;
const endpoints = [
  "https://api.hume.ai/v0/tts/voices?provider=HUME_AI&page_size=100",
  "https://api.hume.ai/v0/evi/prompts?page_size=100",
];
for (const url of endpoints) {
  console.log(`\n=== ${url} ===`);
  try {
    const res = await fetch(url, { headers: { "X-Hume-Api-Key": apiKey } });
    console.log(`  status=${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`  ${JSON.stringify(data, null, 2).slice(0, 2000)}`);
    } else {
      console.log(`  ${(await res.text()).slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`  Error: ${e.message ?? e}`);
  }
}

// Also try the EVI custom voices endpoint
console.log(`\n=== EVI custom voices ===`);
try {
  const list = await client.empathicVoice.customVoices.listCustomVoices({
    pageSize: 50,
  });
  console.log(`  Total: ${list.customVoicesPage?.length ?? 0}`);
  for (const v of list.customVoicesPage ?? []) {
    console.log(`  ${(v.name ?? "?").padEnd(24)} | id=${v.id ?? "?"}`);
  }
} catch (e) {
  console.log(`  Error: ${e.message ?? e}`);
}
