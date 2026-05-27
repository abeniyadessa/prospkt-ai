import { Pool } from "pg";
import type { PrelaunchEvent, WaitlistSignup } from "@/lib/types";

type WaitlistInput = {
  email: string;
  companyName?: string | null;
  city?: string | null;
  source?: string | null;
};

type PrelaunchEventInput = {
  name: string;
  source?: string | null;
  path?: string | null;
  referrer?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
};

type WaitlistSignupRow = {
  id: string;
  email: string;
  company_name: string | null;
  city: string | null;
  source: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type PrelaunchEventRow = {
  id: string;
  name: string;
  source: string | null;
  path: string | null;
  referrer: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
};

type ResendContactResponse = {
  object?: string;
  id?: string;
};

let pool: Pool | undefined;
let tablesReady: Promise<void> | undefined;

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

function getPool() {
  const connectionString = databaseUrl();
  if (!connectionString) return null;

  if (!pool) {
    const ssl =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1")
        ? undefined
        : { rejectUnauthorized: false };

    pool = new Pool({ connectionString, ssl });
  }

  return pool;
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapWaitlistSignup(row: WaitlistSignupRow): WaitlistSignup {
  return {
    id: row.id,
    email: row.email,
    companyName: row.company_name,
    city: row.city,
    source: row.source,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapPrelaunchEvent(row: PrelaunchEventRow): PrelaunchEvent {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    path: row.path,
    referrer: row.referrer,
    email: row.email,
    metadata: row.metadata,
    createdAt: toIso(row.created_at),
  };
}

export function waitlistStorageMode() {
  if (databaseUrl()) return "database";
  if (process.env.VERCEL && process.env.RESEND_API_KEY) return "resend_contacts";
  return "local";
}

async function ensurePgTables() {
  const activePool = getPool();
  if (!activePool) return;
  if (tablesReady) return tablesReady;

  tablesReady = activePool.query(`
    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      company_name TEXT,
      city TEXT,
      source TEXT NOT NULL DEFAULT 'prelaunch',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prelaunch_events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT,
      path TEXT,
      referrer TEXT,
      email TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_prelaunch_events_name_created_at
      ON prelaunch_events (name, created_at DESC);
  `).then(() => undefined);

  return tablesReady;
}

async function createPgWaitlistSignup(input: WaitlistInput): Promise<WaitlistSignup> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensurePgTables();

  const now = new Date();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName?.trim() || null;
  const city = input.city?.trim() || null;
  const source = input.source?.trim() || "prelaunch";

  const result = await activePool.query<WaitlistSignupRow>(
    `INSERT INTO waitlist_signups (
      id, email, company_name, city, source, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $6)
    ON CONFLICT (email) DO UPDATE
      SET company_name = COALESCE(EXCLUDED.company_name, waitlist_signups.company_name),
          city = COALESCE(EXCLUDED.city, waitlist_signups.city),
          source = EXCLUDED.source,
          updated_at = EXCLUDED.updated_at
    RETURNING id, email, company_name, city, source, created_at, updated_at`,
    [crypto.randomUUID(), email, companyName, city, source, now]
  );

  return mapWaitlistSignup(result.rows[0]);
}

async function createPgPrelaunchEvent(
  input: PrelaunchEventInput
): Promise<PrelaunchEvent> {
  const activePool = getPool();
  if (!activePool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensurePgTables();

  const result = await activePool.query<PrelaunchEventRow>(
    `INSERT INTO prelaunch_events (
      id, name, source, path, referrer, email, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, source, path, referrer, email, metadata, created_at`,
    [
      crypto.randomUUID(),
      input.name.trim(),
      input.source?.trim() || null,
      input.path?.trim() || null,
      input.referrer?.trim() || null,
      input.email?.trim().toLowerCase() || null,
      input.metadata ?? null,
      new Date(),
    ]
  );

  return mapPrelaunchEvent(result.rows[0]);
}

async function createResendContact(input: WaitlistInput): Promise<WaitlistSignup> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName?.trim() || null;
  const city = input.city?.trim() || null;
  const source = input.source?.trim() || "prelaunch";

  const response = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      properties: {
        company_name: companyName ?? "",
        city: city ?? "",
        source,
        joined_from: "prospkt_prelaunch",
        joined_at: now,
      },
    }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(await response.text());
  }

  const body = response.ok
    ? ((await response.json()) as ResendContactResponse)
    : null;

  return {
    id: body?.id ?? email,
    email,
    companyName,
    city,
    source,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createWaitlistSignupRecord(
  input: WaitlistInput
): Promise<WaitlistSignup> {
  if (databaseUrl()) return createPgWaitlistSignup(input);
  if (process.env.VERCEL && process.env.RESEND_API_KEY) {
    return createResendContact(input);
  }

  const { createWaitlistSignup } = await import("@/lib/database");
  return createWaitlistSignup(input);
}

export type WaitlistListResult = {
  signups: WaitlistSignup[];
  total: number;
  mode: ReturnType<typeof waitlistStorageMode> | "unavailable";
  reason?: string;
};

async function listPgWaitlistSignups(limit: number): Promise<WaitlistListResult> {
  const activePool = getPool();
  if (!activePool) {
    return { signups: [], total: 0, mode: "unavailable", reason: "no_pool" };
  }
  await ensurePgTables();

  const [rowsResult, countResult] = await Promise.all([
    activePool.query<WaitlistSignupRow>(
      `SELECT id, email, company_name, city, source, created_at, updated_at
       FROM waitlist_signups
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    ),
    activePool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM waitlist_signups`
    ),
  ]);

  return {
    signups: rowsResult.rows.map(mapWaitlistSignup),
    total: Number(countResult.rows[0]?.count ?? 0),
    mode: "database",
  };
}

export async function listWaitlistSignups(limit = 100): Promise<WaitlistListResult> {
  if (databaseUrl()) {
    try {
      return await listPgWaitlistSignups(limit);
    } catch (error) {
      return {
        signups: [],
        total: 0,
        mode: "unavailable",
        reason: error instanceof Error ? error.message : "postgres_error",
      };
    }
  }

  if (process.env.VERCEL && process.env.RESEND_API_KEY) {
    // Resend Contacts API does not expose a portable list endpoint by audience here,
    // and signup records are not stored in a queryable shape we control. Surface this
    // as unavailable so the admin UI can prompt the founder to connect Postgres.
    return {
      signups: [],
      total: 0,
      mode: "resend_contacts",
      reason:
        "Listing signups from Resend Contacts is not supported. Connect Neon Postgres for a queryable source of truth.",
    };
  }

  try {
    const { listWaitlistSignups: listLocal } = await import("@/lib/database");
    const signups = listLocal(limit);
    return { signups, total: signups.length, mode: "local" };
  } catch (error) {
    return {
      signups: [],
      total: 0,
      mode: "unavailable",
      reason: error instanceof Error ? error.message : "local_db_error",
    };
  }
}

export async function createPrelaunchEventRecord(
  input: PrelaunchEventInput
): Promise<PrelaunchEvent> {
  if (databaseUrl()) return createPgPrelaunchEvent(input);
  if (process.env.VERCEL) {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      source: input.source ?? null,
      path: input.path ?? null,
      referrer: input.referrer ?? null,
      email: input.email ?? null,
      metadata: input.metadata ?? null,
      createdAt: new Date().toISOString(),
    };
  }

  const { createPrelaunchEvent } = await import("@/lib/database");
  return createPrelaunchEvent(input);
}
