import fs from "fs/promises";
import path from "path";

// ─── DNC (Do Not Call) list ───────────────────────────────────────────────────
// Stores opted-out phone numbers in data/dnc.json.
// Numbers are stored in E.164 format: +15551234567

const DNC_FILE = path.join(process.cwd(), "data", "dnc.json");

async function readDNC(): Promise<string[]> {
  try {
    const raw = await fs.readFile(DNC_FILE, "utf-8");
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function writeDNC(numbers: string[]): Promise<void> {
  await fs.mkdir(path.dirname(DNC_FILE), { recursive: true });
  await fs.writeFile(DNC_FILE, JSON.stringify(numbers, null, 2), "utf-8");
}

/** Returns true if the number is on the DNC list. */
export async function isOnDNC(phone: string): Promise<boolean> {
  const list = await readDNC();
  return list.includes(normalise(phone));
}

/** Adds a phone number to the DNC list (idempotent). */
export async function addToDNC(phone: string): Promise<void> {
  const normalised = normalise(phone);
  const list = await readDNC();
  if (!list.includes(normalised)) {
    list.push(normalised);
    await writeDNC(list);
    console.log("[dnc] Added to DNC list:", normalised);
  }
}

/** Returns the current DNC list. */
export async function getDNCList(): Promise<string[]> {
  return readDNC();
}

// Strip spaces/dashes and ensure E.164-ish normalisation
function normalise(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}
