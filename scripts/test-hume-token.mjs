#!/usr/bin/env node
// Quick sanity test for the Hume token exchange flow.
// Reads HUME_API_KEY + HUME_SECRET_KEY from .env.local, calls fetchAccessToken,
// prints whether it succeeded.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAccessToken } from "hume";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const raw = await fs.readFile(path.join(REPO_ROOT, ".env.local"), "utf8");
for (const line of raw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

try {
  const token = await fetchAccessToken({
    apiKey: process.env.HUME_API_KEY,
    secretKey: process.env.HUME_SECRET_KEY,
  });
  console.log(`Token length: ${token.length}`);
  console.log(`Token prefix: ${token.slice(0, 24)}...`);
  console.log("SUCCESS — token exchange works");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}
