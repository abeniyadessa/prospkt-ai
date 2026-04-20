// ClickUp API v2 — CRM logging for every Prospkt call

const CLICKUP_API = "https://api.clickup.com/api/v2";

function clickupHeaders() {
  return {
    Authorization: process.env.CLICKUP_API_KEY ?? "",
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallOutcome =
  | "booked"
  | "not-interested"
  | "no-answer"
  | "voicemail"
  | "failed";

export interface CallLogEntry {
  leadId: string;
  businessName: string;
  phone: string;
  city: string;
  category: string;
  outcome: CallOutcome;
  vapiCallId: string;
  duration?: number; // seconds
  transcript?: string;
  summary?: string;
  bookedAt?: string; // ISO — if outcome is "booked"
  calcomEventId?: string;
}

// ClickUp priority: 1=urgent, 2=high, 3=normal, 4=low
const OUTCOME_PRIORITY: Record<CallOutcome, number> = {
  booked: 2,
  voicemail: 3,
  "no-answer": 3,
  "not-interested": 4,
  failed: 1,
};

// ClickUp status names — must match what's in your list
const OUTCOME_STATUS: Record<CallOutcome, string> = {
  booked: "BOOKED",
  voicemail: "VOICEMAIL",
  "no-answer": "NO ANSWER",
  "not-interested": "NOT INTERESTED",
  failed: "FAILED",
};

// ─── Log a call to ClickUp ────────────────────────────────────────────────────

export async function logCall(entry: CallLogEntry): Promise<{ id: string; url: string }> {
  const listId = process.env.CLICKUP_LIST_ID;
  if (!listId) throw new Error("CLICKUP_LIST_ID is not set");

  const durationStr = entry.duration
    ? `${Math.floor(entry.duration / 60)}m ${entry.duration % 60}s`
    : "—";

  const description = [
    `**Business:** ${entry.businessName}`,
    `**Phone:** ${entry.phone}`,
    `**City:** ${entry.city}, MI`,
    `**Category:** ${entry.category}`,
    `**Outcome:** ${entry.outcome.replace("-", " ").toUpperCase()}`,
    `**Duration:** ${durationStr}`,
    `**Vapi Call ID:** ${entry.vapiCallId}`,
    entry.bookedAt ? `**Booked At:** ${new Date(entry.bookedAt).toLocaleString("en-US", { timeZone: "America/Detroit" })}` : null,
    entry.calcomEventId ? `**Cal.com Event:** ${entry.calcomEventId}` : null,
    entry.summary ? `\n**Summary:**\n${entry.summary}` : null,
    entry.transcript ? `\n**Transcript:**\n${entry.transcript.slice(0, 2000)}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const body = {
    name: `${entry.businessName} — ${entry.outcome.replace("-", " ").toUpperCase()}`,
    description,
    priority: OUTCOME_PRIORITY[entry.outcome],
    status: OUTCOME_STATUS[entry.outcome],
    due_date: Date.now(),
    custom_fields: [],
  };

  const res = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
    method: "POST",
    headers: clickupHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp log error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

// ─── Update an existing task ──────────────────────────────────────────────────

export async function updateCallLog(
  taskId: string,
  updates: Partial<{ status: string; description: string }>
): Promise<void> {
  const res = await fetch(`${CLICKUP_API}/task/${taskId}`, {
    method: "PUT",
    headers: clickupHeaders(),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp update error ${res.status}: ${text}`);
  }
}
