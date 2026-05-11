import {
  addDncEntry,
  isDncEntry,
  listDncEntries,
  normalisePhone,
} from "@/lib/database";

// ─── DNC (Do Not Call) list ───────────────────────────────────────────────────
// Stores opted-out phone numbers in the built-in CRM database.
// Numbers are normalized to E.164 where possible: +15551234567.

/** Returns true if the number is on the DNC list. */
export async function isOnDNC(phone: string, workspaceId: string): Promise<boolean> {
  return isDncEntry(phone, workspaceId);
}

/** Adds a phone number to the DNC list (idempotent). */
export async function addToDNC(phone: string, workspaceId: string): Promise<void> {
  const normalised = addDncEntry(phone, "call", workspaceId);
  console.log("[dnc] Added to DNC list:", normalised);
}

/** Returns the current DNC list. */
export async function getDNCList(workspaceId: string): Promise<string[]> {
  return listDncEntries(workspaceId);
}

export const normalise = normalisePhone;

/** Returns true for US/Canada E.164 numbers the outbound dialer can safely call. */
export function isCallablePhone(phone: string): boolean {
  return /^\+1\d{10}$/.test(normalisePhone(phone));
}
