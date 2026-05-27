import fsSync from "fs";
import fs from "fs/promises";
import { createRequire } from "node:module";
import path from "path";
import type { DatabaseSync as DatabaseSyncInstance } from "node:sqlite";
import type {
  AgentBudget,
  AgentEvent,
  AgentEventType,
  AgentMemoryStats,
  AgentRun,
  AgentRunMode,
  AgentRunStatus,
  AgentSettings,
  AgentStatusPayload,
  AppWorkspaceContext,
  Lead,
  LeadStatus,
  OnboardingProfile,
  PrelaunchEvent,
  ScriptSettings,
  WaitlistSignup,
  Workspace,
  WorkspaceSettings,
  WorkspaceUser,
} from "@/lib/types";
import { DEFAULT_WORKSPACE_ID, GLOBAL_DNC_WORKSPACE_ID, resolveWorkspaceId } from "@/lib/workspace-context";
import { getPlaybookById, inferDefaultPlaybook } from "@/lib/campaigns";
import {
  DEFAULT_OPENAI_REALTIME_VOICE_ID,
  OPENAI_REALTIME_MODEL,
  resolveOpenAIRealtimeModel,
  resolveOpenAIRealtimeVoiceId,
} from "@/lib/voice";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = process.env.PROSPKT_DB_PATH ?? path.join(DATA_DIR, "prospkt.sqlite");
const LEGACY_LEADS_FILE = path.join(DATA_DIR, "leads.json");
const LEGACY_DNC_FILE = path.join(DATA_DIR, "dnc.json");
const { DatabaseSync } = createRequire(path.join(process.cwd(), "package.json"))(
  "node:sqlite"
) as typeof import("node:sqlite");

type LeadRow = Omit<Lead, "yelpRating" | "yelpReviewCount" | "callAttempts"> & {
  workspaceId?: string;
  yelpRating: number | null;
  yelpReviewCount: number | null;
  callAttempts: number | null;
};

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string | null;
  timezone: string;
  onboardingCompleted: number;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceSettingsRow {
  workspaceId: string;
  companyName: string;
  timezone: string;
  bookingEmail: string | null;
  notificationEmail: string | null;
  targetCities: string | null;
  targetCategories: string | null;
  updatedAt: string;
}

interface OnboardingRow {
  workspaceId: string;
  companyName: string;
  userRole: string;
  timezone: string;
  offer: string;
  targetBuyer: string;
  pitch: string;
  targetCities: string | null;
  targetCategories: string | null;
  websiteStatuses: string | null;
  maxCallsPerDay: number;
  maxCostPerDayCents: number;
  weekendPause: number;
  bookingEmail: string | null;
  notificationEmail: string | null;
  complianceAcceptedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

interface AgentSettingsRow {
  id: string;
  workspaceId?: string;
  paused: number;
  maxCallsPerDay: number;
  maxCostPerDayCents: number;
  weekendPause: number;
  failureCount: number;
  updatedAt: string;
}

interface AgentRunRow {
  id: string;
  status: AgentRunStatus;
  mode: AgentRunMode;
  startedAt: string;
  completedAt: string | null;
  callsAttempted: number;
  callsSkipped: number;
  costCents: number;
  bookedCount: number;
  summary: string | null;
  error: string | null;
}

interface AgentEventRow {
  id: string;
  runId: string | null;
  type: AgentEventType;
  severity: AgentEvent["severity"];
  message: string;
  leadId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface WaitlistSignupRow {
  id: string;
  email: string;
  companyName: string | null;
  city: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface PrelaunchEventRow {
  id: string;
  name: string;
  source: string | null;
  path: string | null;
  referrer: string | null;
  email: string | null;
  metadata: string | null;
  createdAt: string;
}

const AGENT_SETTINGS_ID = "default";

declare global {
  var __prospktDb: DatabaseSyncInstance | undefined;
}

let initialized = false;
let seeded = false;

function getDb() {
  if (!globalThis.__prospktDb) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
    globalThis.__prospktDb = new DatabaseSync(DB_FILE);
  }
  if (!initialized) {
    initialize();
  }
  return globalThis.__prospktDb;
}

function ensureColumn(table: string, column: string, definition: string) {
  const database = globalThis.__prospktDb;
  if (!database) return;
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function initialize() {
  initialized = true;
  globalThis.__prospktDb?.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      imageUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Detroit',
      onboardingCompleted INTEGER NOT NULL DEFAULT 0,
      ownerUserId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      PRIMARY KEY (workspaceId, userId)
    );

    CREATE TABLE IF NOT EXISTS onboarding (
      workspaceId TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      userRole TEXT NOT NULL DEFAULT 'Owner',
      timezone TEXT NOT NULL DEFAULT 'America/Detroit',
      offer TEXT NOT NULL DEFAULT '',
      targetBuyer TEXT NOT NULL DEFAULT '',
      pitch TEXT NOT NULL DEFAULT '',
      targetCities TEXT,
      targetCategories TEXT,
      websiteStatuses TEXT,
      maxCallsPerDay INTEGER NOT NULL DEFAULT 20,
      maxCostPerDayCents INTEGER NOT NULL DEFAULT 500,
      weekendPause INTEGER NOT NULL DEFAULT 1,
      bookingEmail TEXT,
      notificationEmail TEXT,
      complianceAcceptedAt TEXT,
      completedAt TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_settings (
      workspaceId TEXT PRIMARY KEY,
      companyName TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/Detroit',
      bookingEmail TEXT,
      notificationEmail TEXT,
      targetCities TEXT,
      targetCategories TEXT,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS script_settings (
      workspaceId TEXT PRIMARY KEY,
      systemPromptSuffix TEXT NOT NULL DEFAULT '',
      firstMessageTemplate TEXT NOT NULL DEFAULT '',
      realtimeModel TEXT NOT NULL DEFAULT '${OPENAI_REALTIME_MODEL}',
      realtimeVoiceId TEXT NOT NULL DEFAULT '${DEFAULT_OPENAI_REALTIME_VOICE_ID}',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      companyName TEXT,
      city TEXT,
      source TEXT NOT NULL DEFAULT 'prelaunch',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prelaunch_events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT,
      path TEXT,
      referrer TEXT,
      email TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Business',
      city TEXT NOT NULL DEFAULT '',
      websiteStatus TEXT NOT NULL DEFAULT 'outdated',
      priorityScore INTEGER NOT NULL DEFAULT 5,
      scrapedAt TEXT NOT NULL,
      yelpUrl TEXT,
      yelpRating REAL,
      yelpReviewCount INTEGER,
      status TEXT NOT NULL DEFAULT 'new',
      statusUpdatedAt TEXT NOT NULL,
      lastCallAt TEXT,
      callAttempts INTEGER NOT NULL DEFAULT 0,
      nextFollowUpAt TEXT,
      notes TEXT,
      contactType TEXT NOT NULL DEFAULT 'business',
      source TEXT NOT NULL DEFAULT 'Lead scraper',
      consentNote TEXT,
      serviceNeed TEXT,
      serviceArea TEXT,
      estimateValueCents INTEGER,
      campaignLane TEXT NOT NULL DEFAULT 'cold_b2b',
      playbook TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dnc_entries (
      phone TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      createdAt TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS lead_activities (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      leadId TEXT NOT NULL,
      type TEXT NOT NULL,
      body TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      createdBy TEXT NOT NULL DEFAULT 'system',
      FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lead_calls (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      leadId TEXT NOT NULL,
      vapiCallId TEXT,
      outcome TEXT NOT NULL,
      durationSeconds INTEGER,
      transcript TEXT,
      summary TEXT,
      recordingUrl TEXT,
      startedAt TEXT,
      endedAt TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_settings (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      paused INTEGER NOT NULL DEFAULT 0,
      maxCallsPerDay INTEGER NOT NULL DEFAULT 20,
      maxCostPerDayCents INTEGER NOT NULL DEFAULT 500,
      weekendPause INTEGER NOT NULL DEFAULT 1,
      failureCount INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      status TEXT NOT NULL,
      mode TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT,
      callsAttempted INTEGER NOT NULL DEFAULT 0,
      callsSkipped INTEGER NOT NULL DEFAULT 0,
      costCents INTEGER NOT NULL DEFAULT 0,
      bookedCount INTEGER NOT NULL DEFAULT 0,
      summary TEXT,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_events (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      runId TEXT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      leadId TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lead_memory (
      workspaceId TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}',
      phone TEXT PRIMARY KEY,
      leadId TEXT,
      businessName TEXT,
      city TEXT,
      category TEXT,
      timezone TEXT,
      firstSeenAt TEXT NOT NULL,
      lastContactedAt TEXT,
      outcome TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  ensureColumn("leads", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("leads", "state", "TEXT");
  ensureColumn("leads", "timezone", "TEXT");
  ensureColumn("leads", "contactType", "TEXT NOT NULL DEFAULT 'business'");
  ensureColumn("leads", "source", "TEXT NOT NULL DEFAULT 'Lead scraper'");
  ensureColumn("leads", "consentNote", "TEXT");
  ensureColumn("leads", "serviceNeed", "TEXT");
  ensureColumn("leads", "serviceArea", "TEXT");
  ensureColumn("leads", "estimateValueCents", "INTEGER");
  ensureColumn("leads", "campaignLane", "TEXT NOT NULL DEFAULT 'cold_b2b'");
  ensureColumn("leads", "playbook", "TEXT");
  ensureColumn("dnc_entries", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("lead_activities", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("lead_calls", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("agent_settings", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("agent_runs", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("agent_events", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("lead_memory", "workspaceId", `TEXT NOT NULL DEFAULT '${DEFAULT_WORKSPACE_ID}'`);
  ensureColumn("script_settings", "realtimeModel", `TEXT NOT NULL DEFAULT '${OPENAI_REALTIME_MODEL}'`);
  ensureColumn(
    "script_settings",
    "realtimeVoiceId",
    `TEXT NOT NULL DEFAULT '${DEFAULT_OPENAI_REALTIME_VOICE_ID}'`
  );

  globalThis.__prospktDb?.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_workspace_status ON leads(workspaceId, status);
    CREATE INDEX IF NOT EXISTS idx_leads_workspace_priority ON leads(workspaceId, priorityScore DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_workspace_city ON leads(workspaceId, city);
    CREATE INDEX IF NOT EXISTS idx_dnc_workspace_phone ON dnc_entries(workspaceId, phone);
    CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(workspaceId, leadId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_calls_lead ON lead_calls(workspaceId, leadId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_calls_vapi ON lead_calls(workspaceId, vapiCallId);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_started ON agent_runs(workspaceId, startedAt DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(workspaceId, status);
    CREATE INDEX IF NOT EXISTS idx_agent_events_run ON agent_events(workspaceId, runId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(workspaceId, createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_lead_memory_contacted ON lead_memory(workspaceId, lastContactedAt);
    CREATE INDEX IF NOT EXISTS idx_lead_memory_outcome ON lead_memory(workspaceId, outcome);
  `);

  ensureDemoWorkspace();
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function stringifyArray(value: string[]) {
  return JSON.stringify(value.map((item) => item.trim()).filter(Boolean));
}

function ensureDemoWorkspace() {
  const now = new Date().toISOString();
  const database = getDb();
  database
    .prepare(`
      INSERT OR IGNORE INTO workspaces (
        id, name, slug, timezone, onboardingCompleted, ownerUserId, createdAt, updatedAt
      )
      VALUES (?, 'Prospkt Demo', 'demo', 'America/Detroit', 1, NULL, ?, ?)
    `)
    .run(DEFAULT_WORKSPACE_ID, now, now);
  database
    .prepare(`
      INSERT OR IGNORE INTO workspace_settings (
        workspaceId, companyName, timezone, bookingEmail, notificationEmail,
        targetCities, targetCategories, updatedAt
      )
      VALUES (?, 'Prospkt Demo', 'America/Detroit', NULL, NULL, '[]', '[]', ?)
    `)
    .run(DEFAULT_WORKSPACE_ID, now);
  database
    .prepare(`
      INSERT OR IGNORE INTO script_settings (
        workspaceId, systemPromptSuffix, firstMessageTemplate, updatedAt
      )
      VALUES (?, '', '', ?)
    `)
    .run(DEFAULT_WORKSPACE_ID, now);
}

function rowToWorkspace(row: WorkspaceRow, role?: string | null): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    onboardingCompleted: Boolean(row.onboardingCompleted),
    ownerUserId: row.ownerUserId,
    role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToWorkspaceSettings(row: WorkspaceSettingsRow): WorkspaceSettings {
  return {
    workspaceId: row.workspaceId,
    companyName: row.companyName,
    timezone: row.timezone,
    bookingEmail: row.bookingEmail,
    notificationEmail: row.notificationEmail,
    targetCities: parseJsonArray(row.targetCities),
    targetCategories: parseJsonArray(row.targetCategories),
    updatedAt: row.updatedAt,
  };
}

function rowToOnboarding(row: OnboardingRow): OnboardingProfile {
  return {
    workspaceId: row.workspaceId,
    companyName: row.companyName,
    userRole: row.userRole,
    timezone: row.timezone,
    offer: row.offer,
    targetBuyer: row.targetBuyer,
    pitch: row.pitch,
    targetCities: parseJsonArray(row.targetCities),
    targetCategories: parseJsonArray(row.targetCategories),
    websiteStatuses: parseJsonArray(row.websiteStatuses).filter(
      (status): status is Lead["websiteStatus"] =>
        status === "none" || status === "outdated" || status === "modern"
    ),
    maxCallsPerDay: row.maxCallsPerDay,
    maxCostPerDayCents: row.maxCostPerDayCents,
    weekendPause: Boolean(row.weekendPause),
    bookingEmail: row.bookingEmail,
    notificationEmail: row.notificationEmail,
    complianceAcceptedAt: row.complianceAcceptedAt,
    completedAt: row.completedAt,
    updatedAt: row.updatedAt,
  };
}

export function upsertWorkspaceUser(user: WorkspaceUser): WorkspaceUser {
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO app_users (id, email, name, imageUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        imageUrl = excluded.imageUrl,
        updatedAt = excluded.updatedAt
    `)
    .run(user.id, user.email, user.name, user.imageUrl ?? null, now, now);
  return user;
}

export function upsertWorkspace(input: {
  id: string;
  name: string;
  slug?: string | null;
  timezone?: string;
  ownerUserId?: string | null;
  role?: string | null;
}): Workspace {
  const workspaceId = resolveWorkspaceId(input.id);
  const now = new Date().toISOString();
  const current = getWorkspace(workspaceId);
  getDb()
    .prepare(`
      INSERT INTO workspaces (
        id, name, slug, timezone, onboardingCompleted, ownerUserId, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = CASE
          WHEN workspaces.onboardingCompleted = 1 THEN workspaces.name
          ELSE excluded.name
        END,
        slug = excluded.slug,
        timezone = COALESCE(workspaces.timezone, excluded.timezone),
        ownerUserId = COALESCE(workspaces.ownerUserId, excluded.ownerUserId),
        updatedAt = excluded.updatedAt
    `)
    .run(
      workspaceId,
      input.name,
      input.slug ?? null,
      input.timezone ?? "America/Detroit",
      input.ownerUserId ?? current?.ownerUserId ?? null,
      now,
      now
    );
  ensureWorkspaceDefaults(workspaceId);
  if (input.ownerUserId) {
    upsertWorkspaceMember(workspaceId, input.ownerUserId, input.role ?? "owner");
  }
  return getWorkspace(workspaceId, input.role) as Workspace;
}

export function upsertWorkspaceMember(workspaceId: string, userId: string, role = "member") {
  const id = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO workspace_members (workspaceId, userId, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(workspaceId, userId) DO UPDATE SET
        role = excluded.role,
        updatedAt = excluded.updatedAt
    `)
    .run(id, userId, role, now, now);
}

export function ensureWorkspaceDefaults(workspaceId: string) {
  const id = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  const workspace = getWorkspace(id);
  if (!workspace) return;
  getDb()
    .prepare(`
      INSERT OR IGNORE INTO workspace_settings (
        workspaceId, companyName, timezone, bookingEmail, notificationEmail,
        targetCities, targetCategories, updatedAt
      )
      VALUES (?, ?, ?, NULL, NULL, '[]', '[]', ?)
    `)
    .run(id, workspace.name, workspace.timezone, now);
  getDb()
    .prepare(`
      INSERT OR IGNORE INTO script_settings (
        workspaceId, systemPromptSuffix, firstMessageTemplate, updatedAt
      )
      VALUES (?, '', '', ?)
    `)
    .run(id, now);
  ensureAgentSettings(id);
}

export function getWorkspace(workspaceId: string, role?: string | null): Workspace | null {
  const id = resolveWorkspaceId(workspaceId);
  const row = getDb()
    .prepare("SELECT * FROM workspaces WHERE id = ?")
    .get(id) as WorkspaceRow | undefined;
  return row ? rowToWorkspace(row, role) : null;
}

export function listRunnableWorkspaces(): Workspace[] {
  const rows = getDb()
    .prepare("SELECT * FROM workspaces WHERE onboardingCompleted = 1 ORDER BY createdAt ASC")
    .all() as WorkspaceRow[];
  return rows.map((row) => rowToWorkspace(row));
}

export function getWorkspaceSettings(workspaceId: string): WorkspaceSettings | null {
  const id = resolveWorkspaceId(workspaceId);
  const row = getDb()
    .prepare("SELECT * FROM workspace_settings WHERE workspaceId = ?")
    .get(id) as WorkspaceSettingsRow | undefined;
  return row ? rowToWorkspaceSettings(row) : null;
}

export function updateWorkspaceSettings(
  workspaceId: string,
  patch: Partial<
    Pick<
      WorkspaceSettings,
      | "companyName"
      | "timezone"
      | "bookingEmail"
      | "notificationEmail"
      | "targetCities"
      | "targetCategories"
    >
  >
): WorkspaceSettings {
  const id = resolveWorkspaceId(workspaceId);
  const current =
    getWorkspaceSettings(id) ??
    ({
      workspaceId: id,
      companyName: getWorkspace(id)?.name ?? "Workspace",
      timezone: getWorkspace(id)?.timezone ?? "America/Detroit",
      bookingEmail: null,
      notificationEmail: null,
      targetCities: [],
      targetCategories: [],
      updatedAt: "",
    } satisfies WorkspaceSettings);
  const next = {
    companyName: patch.companyName ?? current.companyName,
    timezone: patch.timezone ?? current.timezone,
    bookingEmail: patch.bookingEmail !== undefined ? patch.bookingEmail : current.bookingEmail,
    notificationEmail:
      patch.notificationEmail !== undefined
        ? patch.notificationEmail
        : current.notificationEmail,
    targetCities: patch.targetCities ?? current.targetCities,
    targetCategories: patch.targetCategories ?? current.targetCategories,
    updatedAt: new Date().toISOString(),
  };
  getDb()
    .prepare(`
      INSERT INTO workspace_settings (
        workspaceId, companyName, timezone, bookingEmail, notificationEmail,
        targetCities, targetCategories, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspaceId) DO UPDATE SET
        companyName = excluded.companyName,
        timezone = excluded.timezone,
        bookingEmail = excluded.bookingEmail,
        notificationEmail = excluded.notificationEmail,
        targetCities = excluded.targetCities,
        targetCategories = excluded.targetCategories,
        updatedAt = excluded.updatedAt
    `)
    .run(
      id,
      next.companyName,
      next.timezone,
      next.bookingEmail,
      next.notificationEmail,
      stringifyArray(next.targetCities),
      stringifyArray(next.targetCategories),
      next.updatedAt
    );
  getDb()
    .prepare("UPDATE workspaces SET name = ?, timezone = ?, updatedAt = ? WHERE id = ?")
    .run(next.companyName, next.timezone, next.updatedAt, id);
  return getWorkspaceSettings(id) as WorkspaceSettings;
}

export function getOnboardingProfile(workspaceId: string): OnboardingProfile | null {
  const id = resolveWorkspaceId(workspaceId);
  const row = getDb()
    .prepare("SELECT * FROM onboarding WHERE workspaceId = ?")
    .get(id) as OnboardingRow | undefined;
  return row ? rowToOnboarding(row) : null;
}

export function completeOnboarding(
  input: Omit<OnboardingProfile, "workspaceId" | "completedAt" | "updatedAt" | "complianceAcceptedAt"> & {
    workspaceId: string;
    complianceAccepted: boolean;
  }
): OnboardingProfile {
  const workspaceId = resolveWorkspaceId(input.workspaceId);
  const now = new Date().toISOString();
  const complianceAcceptedAt = input.complianceAccepted ? now : null;
  getDb()
    .prepare(`
      INSERT INTO onboarding (
        workspaceId, companyName, userRole, timezone, offer, targetBuyer, pitch,
        targetCities, targetCategories, websiteStatuses, maxCallsPerDay,
        maxCostPerDayCents, weekendPause, bookingEmail, notificationEmail,
        complianceAcceptedAt, completedAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspaceId) DO UPDATE SET
        companyName = excluded.companyName,
        userRole = excluded.userRole,
        timezone = excluded.timezone,
        offer = excluded.offer,
        targetBuyer = excluded.targetBuyer,
        pitch = excluded.pitch,
        targetCities = excluded.targetCities,
        targetCategories = excluded.targetCategories,
        websiteStatuses = excluded.websiteStatuses,
        maxCallsPerDay = excluded.maxCallsPerDay,
        maxCostPerDayCents = excluded.maxCostPerDayCents,
        weekendPause = excluded.weekendPause,
        bookingEmail = excluded.bookingEmail,
        notificationEmail = excluded.notificationEmail,
        complianceAcceptedAt = excluded.complianceAcceptedAt,
        completedAt = excluded.completedAt,
        updatedAt = excluded.updatedAt
    `)
    .run(
      workspaceId,
      input.companyName,
      input.userRole,
      input.timezone,
      input.offer,
      input.targetBuyer,
      input.pitch,
      stringifyArray(input.targetCities),
      stringifyArray(input.targetCategories),
      stringifyArray(input.websiteStatuses),
      input.maxCallsPerDay,
      input.maxCostPerDayCents,
      input.weekendPause ? 1 : 0,
      input.bookingEmail ?? null,
      input.notificationEmail ?? null,
      complianceAcceptedAt,
      now,
      now
    );

  getDb()
    .prepare(`
      UPDATE workspaces
      SET name = ?, timezone = ?, onboardingCompleted = 1, updatedAt = ?
      WHERE id = ?
    `)
    .run(input.companyName, input.timezone, now, workspaceId);

  getDb()
    .prepare(`
      INSERT INTO workspace_settings (
        workspaceId, companyName, timezone, bookingEmail, notificationEmail,
        targetCities, targetCategories, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspaceId) DO UPDATE SET
        companyName = excluded.companyName,
        timezone = excluded.timezone,
        bookingEmail = excluded.bookingEmail,
        notificationEmail = excluded.notificationEmail,
        targetCities = excluded.targetCities,
        targetCategories = excluded.targetCategories,
        updatedAt = excluded.updatedAt
    `)
    .run(
      workspaceId,
      input.companyName,
      input.timezone,
      input.bookingEmail ?? null,
      input.notificationEmail ?? null,
      stringifyArray(input.targetCities),
      stringifyArray(input.targetCategories),
      now
    );
  updateAgentSettings(
    {
      maxCallsPerDay: input.maxCallsPerDay,
      maxCostPerDayCents: input.maxCostPerDayCents,
      weekendPause: input.weekendPause,
    },
    workspaceId
  );

  const playbookId = inferDefaultPlaybook({
    offer: input.offer,
    targetBuyer: input.targetBuyer,
    pitch: input.pitch,
  });
  const playbook = getPlaybookById(playbookId);
  if (playbook) {
    addAgentEvent(
      {
        type: "report",
        severity: "success",
        message: `Campaign activated: ${playbook.title}`,
        metadata: {
          playbookId,
          lane: playbook.lane,
          goal: playbook.goal,
          source: playbook.defaultSource,
        },
      },
      workspaceId
    );
  }

  return getOnboardingProfile(workspaceId) as OnboardingProfile;
}

function normalizeScriptSettings(row?: Partial<ScriptSettings> | null): ScriptSettings {
  return {
    systemPromptSuffix: row?.systemPromptSuffix ?? "",
    firstMessageTemplate: row?.firstMessageTemplate ?? "",
    realtimeModel: resolveOpenAIRealtimeModel(row?.realtimeModel),
    realtimeVoiceId: resolveOpenAIRealtimeVoiceId(row?.realtimeVoiceId),
    updatedAt: row?.updatedAt ?? "",
  };
}

export function getScriptSettings(workspaceId: string): ScriptSettings {
  const id = resolveWorkspaceId(workspaceId);
  ensureWorkspaceDefaults(id);
  const row = getDb()
    .prepare("SELECT * FROM script_settings WHERE workspaceId = ?")
    .get(id) as ScriptSettings | undefined;
  return normalizeScriptSettings(row);
}

export function updateScriptSettings(
  patch: Partial<
    Pick<
      ScriptSettings,
      "systemPromptSuffix" | "firstMessageTemplate" | "realtimeModel" | "realtimeVoiceId"
    >
  >,
  workspaceId: string
): ScriptSettings {
  const id = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  const current = getScriptSettings(id);
  const next = normalizeScriptSettings({
    ...current,
    ...patch,
    updatedAt: now,
  });
  getDb()
    .prepare(`
      INSERT INTO script_settings (
        workspaceId, systemPromptSuffix, firstMessageTemplate,
        realtimeModel, realtimeVoiceId, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(workspaceId) DO UPDATE SET
        systemPromptSuffix = excluded.systemPromptSuffix,
        firstMessageTemplate = excluded.firstMessageTemplate,
        realtimeModel = excluded.realtimeModel,
        realtimeVoiceId = excluded.realtimeVoiceId,
        updatedAt = excluded.updatedAt
    `)
    .run(
      id,
      next.systemPromptSuffix,
      next.firstMessageTemplate,
      next.realtimeModel,
      next.realtimeVoiceId,
      now
    );
  return getScriptSettings(id);
}

export function getAppWorkspaceContext(input: {
  user: WorkspaceUser;
  workspaceId?: string | null;
  workspaceName?: string | null;
  workspaceSlug?: string | null;
  role?: string | null;
}): AppWorkspaceContext {
  upsertWorkspaceUser(input.user);
  if (!input.workspaceId) {
    return {
      user: input.user,
      workspace: null,
      settings: null,
      onboarding: null,
    };
  }
  const workspace = upsertWorkspace({
    id: input.workspaceId,
    name: input.workspaceName ?? "New workspace",
    slug: input.workspaceSlug ?? null,
    ownerUserId: input.user.id,
    role: input.role ?? "member",
  });
  return {
    user: input.user,
    workspace,
    settings: getWorkspaceSettings(workspace.id),
    onboarding: getOnboardingProfile(workspace.id),
  };
}

function rowToWaitlistSignup(row: WaitlistSignupRow): WaitlistSignup {
  return {
    id: row.id,
    email: row.email,
    companyName: row.companyName,
    city: row.city,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToPrelaunchEvent(row: PrelaunchEventRow): PrelaunchEvent {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    path: row.path,
    referrer: row.referrer,
    email: row.email,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    createdAt: row.createdAt,
  };
}

export function createWaitlistSignup(input: {
  email: string;
  companyName?: string | null;
  city?: string | null;
  source?: string | null;
}): WaitlistSignup {
  const database = getDb();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName?.trim() || null;
  const city = input.city?.trim() || null;
  const source = input.source?.trim() || "prelaunch";
  const existing = database
    .prepare("SELECT * FROM waitlist_signups WHERE email = ?")
    .get(email) as WaitlistSignupRow | undefined;

  if (existing) {
    database
      .prepare(
        `UPDATE waitlist_signups
         SET companyName = COALESCE(?, companyName),
             city = COALESCE(?, city),
             source = ?,
             updatedAt = ?
         WHERE email = ?`
      )
      .run(companyName, city, source, now, email);

    return rowToWaitlistSignup(
      database
        .prepare("SELECT * FROM waitlist_signups WHERE email = ?")
        .get(email) as WaitlistSignupRow
    );
  }

  const signup: WaitlistSignupRow = {
    id: crypto.randomUUID(),
    email,
    companyName,
    city,
    source,
    createdAt: now,
    updatedAt: now,
  };

  database
    .prepare(
      `INSERT INTO waitlist_signups (
        id, email, companyName, city, source, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      signup.id,
      signup.email,
      signup.companyName,
      signup.city,
      signup.source,
      signup.createdAt,
      signup.updatedAt
    );

  return rowToWaitlistSignup(signup);
}

export function listWaitlistSignups(limit = 100): WaitlistSignup[] {
  const database = getDb();
  const rows = database
    .prepare(
      `SELECT * FROM waitlist_signups ORDER BY createdAt DESC LIMIT ?`
    )
    .all(limit) as WaitlistSignupRow[];
  return rows.map(rowToWaitlistSignup);
}

export function createPrelaunchEvent(input: {
  name: string;
  source?: string | null;
  path?: string | null;
  referrer?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}): PrelaunchEvent {
  const database = getDb();
  const event: PrelaunchEventRow = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    source: input.source?.trim() || null,
    path: input.path?.trim() || null,
    referrer: input.referrer?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date().toISOString(),
  };

  database
    .prepare(
      `INSERT INTO prelaunch_events (
        id, name, source, path, referrer, email, metadata, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      event.id,
      event.name,
      event.source,
      event.path,
      event.referrer,
      event.email,
      event.metadata,
      event.createdAt
    );

  return rowToPrelaunchEvent(event);
}

async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  await fs.mkdir(DATA_DIR, { recursive: true });
  const database = getDb();
  const count = database.prepare("SELECT COUNT(*) AS count FROM leads").get() as { count: number };
  if (count.count === 0) {
    try {
      const raw = await fs.readFile(LEGACY_LEADS_FILE, "utf-8");
      const leads = JSON.parse(raw) as Lead[];
      upsertLeads(leads, DEFAULT_WORKSPACE_ID);
    } catch {
      /* legacy file is optional */
    }
  }

  const dncCount = database.prepare("SELECT COUNT(*) AS count FROM dnc_entries").get() as { count: number };
  if (dncCount.count === 0) {
    try {
      const raw = await fs.readFile(LEGACY_DNC_FILE, "utf-8");
      const numbers = JSON.parse(raw) as string[];
      for (const phone of numbers) {
        addDncEntry(phone, "legacy", DEFAULT_WORKSPACE_ID);
      }
    } catch {
      /* legacy file is optional */
    }
  }
}

function rowToLead(row: LeadRow): Lead {
  return {
    ...row,
    yelpRating: row.yelpRating ?? undefined,
    yelpReviewCount: row.yelpReviewCount ?? undefined,
    callAttempts: row.callAttempts ?? 0,
    estimateValueCents: row.estimateValueCents ?? null,
  };
}

function rowToAgentSettings(row: AgentSettingsRow): AgentSettings {
  return {
    id: row.id,
    paused: Boolean(row.paused),
    maxCallsPerDay: row.maxCallsPerDay,
    maxCostPerDayCents: row.maxCostPerDayCents,
    weekendPause: Boolean(row.weekendPause),
    failureCount: row.failureCount,
    updatedAt: row.updatedAt,
  };
}

function rowToAgentRun(row: AgentRunRow): AgentRun {
  return { ...row };
}

function rowToAgentEvent(row: AgentEventRow): AgentEvent {
  return {
    id: row.id,
    runId: row.runId,
    type: row.type,
    severity: row.severity,
    message: row.message,
    leadId: row.leadId,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    createdAt: row.createdAt,
  };
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function startOfLocalDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function endOfLocalDay(date = new Date()) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export async function listLeads(workspaceId: string): Promise<Lead[]> {
  await ensureSeeded();
  const id = resolveWorkspaceId(workspaceId);
  const rows = getDb()
    .prepare("SELECT * FROM leads WHERE workspaceId = ? ORDER BY priorityScore DESC, scrapedAt DESC")
    .all(id) as LeadRow[];
  return rows.map(rowToLead);
}

export async function getLead(id: string, workspaceId: string): Promise<Lead | null> {
  await ensureSeeded();
  const scopeId = resolveWorkspaceId(workspaceId);
  const row = getDb()
    .prepare("SELECT * FROM leads WHERE id = ? AND workspaceId = ?")
    .get(id, scopeId) as LeadRow | undefined;
  return row ? rowToLead(row) : null;
}

export function upsertLeads(leads: Lead[], workspaceId: string) {
  const database = getDb();
  const scopeId = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  const statement = database.prepare(`
    INSERT INTO leads (
      id, workspaceId, name, phone, address, category, city, state, timezone,
      websiteStatus, priorityScore, scrapedAt, yelpUrl, yelpRating,
      yelpReviewCount, status, statusUpdatedAt, lastCallAt, callAttempts,
      nextFollowUpAt, notes, contactType, source, consentNote, serviceNeed,
      serviceArea, estimateValueCents, campaignLane, playbook, createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      workspaceId = excluded.workspaceId,
      name = excluded.name,
      phone = excluded.phone,
      address = excluded.address,
      category = excluded.category,
      city = excluded.city,
      state = excluded.state,
      timezone = excluded.timezone,
      websiteStatus = excluded.websiteStatus,
      priorityScore = excluded.priorityScore,
      scrapedAt = excluded.scrapedAt,
      yelpUrl = excluded.yelpUrl,
      yelpRating = excluded.yelpRating,
      yelpReviewCount = excluded.yelpReviewCount,
      contactType = excluded.contactType,
      source = excluded.source,
      consentNote = excluded.consentNote,
      serviceNeed = excluded.serviceNeed,
      serviceArea = excluded.serviceArea,
      estimateValueCents = excluded.estimateValueCents,
      campaignLane = excluded.campaignLane,
      playbook = excluded.playbook,
      updatedAt = excluded.updatedAt
  `);

  database.exec("BEGIN");
  try {
    for (const lead of leads) {
      const status = lead.status ?? "new";
      statement.run(
        lead.id,
        scopeId,
        lead.name,
        lead.phone,
        lead.address ?? "",
        lead.category,
        lead.city,
        lead.state ?? null,
        lead.timezone ?? null,
        lead.websiteStatus,
        lead.priorityScore,
        lead.scrapedAt || now,
        lead.yelpUrl ?? null,
        lead.yelpRating ?? null,
        lead.yelpReviewCount ?? null,
        status,
        lead.statusUpdatedAt ?? now,
        lead.lastCallAt ?? null,
        lead.callAttempts ?? 0,
        lead.nextFollowUpAt ?? null,
        lead.notes ?? null,
        lead.contactType ?? "business",
        lead.source ?? "Yelp business listing",
        lead.consentNote ?? "Public business listing; verify outreach basis before live dialing.",
        lead.serviceNeed ?? null,
        lead.serviceArea ?? lead.address ?? lead.city ?? null,
        lead.estimateValueCents ?? null,
        lead.campaignLane ?? "cold_b2b",
        lead.playbook ?? "new-customer-outreach",
        now,
        now
      );
      rememberLeadSeen(lead, scopeId);
    }
    database.exec("COMMIT");
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}

export async function updateLeadLifecycle(
  id: string,
  patch: Partial<
    Pick<
      Lead,
      | "status"
      | "lastCallAt"
      | "callAttempts"
      | "nextFollowUpAt"
      | "notes"
      | "contactType"
      | "source"
      | "consentNote"
      | "serviceNeed"
      | "serviceArea"
      | "estimateValueCents"
      | "campaignLane"
      | "playbook"
    >
  >,
  workspaceId: string
): Promise<Lead | null> {
  await ensureSeeded();
  const scopeId = resolveWorkspaceId(workspaceId);
  const current = await getLead(id, scopeId);
  if (!current) return null;

  const nextStatus = patch.status ?? current.status ?? "new";
  const statusChanged = nextStatus !== (current.status ?? "new");
  const followUpChanged =
    patch.nextFollowUpAt !== undefined &&
    patch.nextFollowUpAt !== current.nextFollowUpAt;
  const now = new Date().toISOString();
  const nextFollowUpAt =
    patch.nextFollowUpAt !== undefined
      ? patch.nextFollowUpAt
      : current.nextFollowUpAt ?? null;
  const nextNotes = patch.notes !== undefined ? patch.notes : current.notes ?? null;
  const nextContactType = patch.contactType ?? current.contactType ?? "business";
  const nextSource =
    patch.source !== undefined ? patch.source ?? "Manual" : current.source ?? "Lead scraper";
  const nextConsentNote =
    patch.consentNote !== undefined ? patch.consentNote : current.consentNote ?? null;
  const nextServiceNeed =
    patch.serviceNeed !== undefined ? patch.serviceNeed : current.serviceNeed ?? null;
  const nextServiceArea =
    patch.serviceArea !== undefined ? patch.serviceArea : current.serviceArea ?? null;
  const nextEstimateValueCents =
    patch.estimateValueCents !== undefined
      ? patch.estimateValueCents
      : current.estimateValueCents ?? null;
  const nextCampaignLane = patch.campaignLane ?? current.campaignLane ?? "cold_b2b";
  const nextPlaybook = patch.playbook !== undefined ? patch.playbook : current.playbook ?? null;
  const serviceProfileChanged = [
    "contactType",
    "source",
    "consentNote",
    "serviceNeed",
    "serviceArea",
    "estimateValueCents",
    "campaignLane",
    "playbook",
  ].some((key) => key in patch);

  getDb()
    .prepare(`
      UPDATE leads
      SET status = ?,
          statusUpdatedAt = ?,
          lastCallAt = ?,
          callAttempts = ?,
          nextFollowUpAt = ?,
          notes = ?,
          contactType = ?,
          source = ?,
          consentNote = ?,
          serviceNeed = ?,
          serviceArea = ?,
          estimateValueCents = ?,
          campaignLane = ?,
          playbook = ?,
          updatedAt = ?
      WHERE id = ? AND workspaceId = ?
    `)
    .run(
      nextStatus,
      statusChanged ? now : current.statusUpdatedAt ?? now,
      patch.lastCallAt ?? current.lastCallAt ?? null,
      patch.callAttempts ?? current.callAttempts ?? 0,
      nextFollowUpAt,
      nextNotes,
      nextContactType,
      nextSource,
      nextConsentNote,
      nextServiceNeed,
      nextServiceArea,
      nextEstimateValueCents,
      nextCampaignLane,
      nextPlaybook,
      now,
      id,
      scopeId
    );

  if (nextStatus === "dnc") {
    addDncEntry(current.phone, "crm", scopeId);
  }

  if (statusChanged) {
    addActivity({
      leadId: id,
      type: nextStatus === "dnc" ? "dnc_added" : "status_change",
      body: `Status changed to ${nextStatus}`,
      metadata: { from: current.status ?? "new", to: nextStatus },
    }, scopeId);
  }

  if (followUpChanged && patch.nextFollowUpAt) {
    addActivity({
      leadId: id,
      type: "follow_up_scheduled",
      body: `Follow-up scheduled for ${new Date(patch.nextFollowUpAt).toLocaleString()}`,
      metadata: { scheduledFor: patch.nextFollowUpAt },
    }, scopeId);
  }

  if (serviceProfileChanged) {
    addActivity({
      leadId: id,
      type: "note",
      body: "Service sales profile updated",
      metadata: {
        contactType: nextContactType,
        source: nextSource,
        serviceNeed: nextServiceNeed,
        serviceArea: nextServiceArea,
        campaignLane: nextCampaignLane,
        playbook: nextPlaybook,
      },
    }, scopeId);
  }

  return getLead(id, scopeId);
}

export async function markLeadCallStarted(
  id: string,
  workspaceId: string
): Promise<Lead | null> {
  const lead = await getLead(id, workspaceId);
  if (!lead) return null;
  return updateLeadLifecycle(id, {
    status: "called",
    lastCallAt: new Date().toISOString(),
    callAttempts: (lead.callAttempts ?? 0) + 1,
  }, workspaceId);
}

export async function updateLeadFromCallOutcome(
  id: string,
  outcome: string,
  workspaceId: string
): Promise<Lead | null> {
  const current = await getLead(id, workspaceId);
  if (current?.status === "booked" || current?.status === "dnc") {
    return current;
  }

  const status: LeadStatus =
    outcome === "booked"
      ? "booked"
      : outcome === "voicemail"
      ? "voicemail"
      : outcome === "not-interested"
      ? "not_interested"
      : outcome === "no-answer"
      ? "follow_up"
      : outcome === "failed"
      ? "follow_up"
      : "called";

  return updateLeadLifecycle(id, { status }, workspaceId);
}

export async function listDncEntries(workspaceId: string): Promise<string[]> {
  await ensureSeeded();
  const scopeId = resolveWorkspaceId(workspaceId);
  const rows = getDb()
    .prepare(
      "SELECT phone FROM dnc_entries WHERE workspaceId IN (?, ?) ORDER BY createdAt DESC"
    )
    .all(scopeId, GLOBAL_DNC_WORKSPACE_ID) as { phone: string }[];
  return rows.map((row) => row.phone);
}

export function addDncEntry(
  phone: string,
  source = "manual",
  workspaceId: string
) {
  const normalized = normalisePhone(phone);
  const scopeId = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT OR IGNORE INTO dnc_entries (phone, workspaceId, createdAt, source) VALUES (?, ?, ?, ?)"
    )
    .run(normalized, scopeId, now, source);
  return normalized;
}

export async function removeDncEntry(phone: string, workspaceId: string) {
  await ensureSeeded();
  const normalized = normalisePhone(phone);
  getDb()
    .prepare("DELETE FROM dnc_entries WHERE phone = ? AND workspaceId = ?")
    .run(normalized, resolveWorkspaceId(workspaceId));
  return normalized;
}

export async function isDncEntry(
  phone: string,
  workspaceId: string
): Promise<boolean> {
  await ensureSeeded();
  const normalized = normalisePhone(phone);
  const row = getDb()
    .prepare("SELECT phone FROM dnc_entries WHERE phone = ? AND workspaceId IN (?, ?)")
    .get(normalized, resolveWorkspaceId(workspaceId), GLOBAL_DNC_WORKSPACE_ID);
  return Boolean(row);
}

// ─── Activities ──────────────────────────────────────────────────────────────

export type ActivityType =
  | "note"
  | "call"
  | "status_change"
  | "booking"
  | "follow_up_scheduled"
  | "dnc_added";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string;
}

interface ActivityRow {
  id: string;
  leadId: string;
  type: ActivityType;
  body: string | null;
  metadata: string | null;
  createdAt: string;
  createdBy: string;
}

function rowToActivity(row: ActivityRow): LeadActivity {
  return {
    id: row.id,
    leadId: row.leadId,
    type: row.type,
    body: row.body,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export function addActivity(input: {
  leadId: string;
  type: ActivityType;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string;
}, workspaceId: string): LeadActivity {
  const scopeId = resolveWorkspaceId(workspaceId);
  const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO lead_activities (id, workspaceId, leadId, type, body, metadata, createdAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      scopeId,
      input.leadId,
      input.type,
      input.body ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      now,
      input.createdBy ?? "system"
    );
  return {
    id,
    leadId: input.leadId,
    type: input.type,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    createdAt: now,
    createdBy: input.createdBy ?? "system",
  };
}

export async function listLeadActivities(
  leadId: string,
  limit = 100,
  workspaceId: string
): Promise<LeadActivity[]> {
  await ensureSeeded();
  const rows = getDb()
    .prepare(
      "SELECT * FROM lead_activities WHERE leadId = ? AND workspaceId = ? ORDER BY createdAt DESC LIMIT ?"
    )
    .all(leadId, resolveWorkspaceId(workspaceId), limit) as ActivityRow[];
  return rows.map(rowToActivity);
}

// ─── Calls ───────────────────────────────────────────────────────────────────

export interface LeadCall {
  id: string;
  leadId: string;
  vapiCallId: string | null;
  outcome: string;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

interface CallRow {
  id: string;
  leadId: string;
  vapiCallId: string | null;
  outcome: string;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export function recordCall(input: {
  leadId: string;
  vapiCallId?: string | null;
  outcome: string;
  durationSeconds?: number | null;
  transcript?: string | null;
  summary?: string | null;
  recordingUrl?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}, workspaceId: string): LeadCall {
  const scopeId = resolveWorkspaceId(workspaceId);
  const id = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO lead_calls (
        id, workspaceId, leadId, vapiCallId, outcome, durationSeconds,
        transcript, summary, recordingUrl, startedAt, endedAt, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      scopeId,
      input.leadId,
      input.vapiCallId ?? null,
      input.outcome,
      input.durationSeconds ?? null,
      input.transcript ?? null,
      input.summary ?? null,
      input.recordingUrl ?? null,
      input.startedAt ?? null,
      input.endedAt ?? null,
      now
    );
  return {
    id,
    leadId: input.leadId,
    vapiCallId: input.vapiCallId ?? null,
    outcome: input.outcome,
    durationSeconds: input.durationSeconds ?? null,
    transcript: input.transcript ?? null,
    summary: input.summary ?? null,
    recordingUrl: input.recordingUrl ?? null,
    startedAt: input.startedAt ?? null,
    endedAt: input.endedAt ?? null,
    createdAt: now,
  };
}

export async function listLeadCalls(
  leadId: string,
  limit = 50,
  workspaceId: string
): Promise<LeadCall[]> {
  await ensureSeeded();
  const rows = getDb()
    .prepare(
      "SELECT * FROM lead_calls WHERE leadId = ? AND workspaceId = ? ORDER BY createdAt DESC LIMIT ?"
    )
    .all(leadId, resolveWorkspaceId(workspaceId), limit) as CallRow[];
  return rows;
}

// ─── Agent control ───────────────────────────────────────────────────────────

function ensureAgentSettings(workspaceId: string) {
  const scopeId = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT OR IGNORE INTO agent_settings (
        id, workspaceId, paused, maxCallsPerDay, maxCostPerDayCents,
        weekendPause, failureCount, updatedAt
      )
      VALUES (?, ?, 0, 20, 500, 1, 0, ?)
    `)
    .run(`${scopeId}:${AGENT_SETTINGS_ID}`, scopeId, now);
}

export function getAgentSettings(workspaceId: string): AgentSettings {
  const scopeId = resolveWorkspaceId(workspaceId);
  ensureAgentSettings(scopeId);
  const row = getDb()
    .prepare("SELECT * FROM agent_settings WHERE workspaceId = ?")
    .get(scopeId) as AgentSettingsRow;
  return rowToAgentSettings(row);
}

export function updateAgentSettings(
  patch: Partial<
    Pick<
      AgentSettings,
      "paused" | "maxCallsPerDay" | "maxCostPerDayCents" | "weekendPause" | "failureCount"
    >
  >,
  workspaceId: string
): AgentSettings {
  const scopeId = resolveWorkspaceId(workspaceId);
  const current = getAgentSettings(scopeId);
  const next = {
    paused: patch.paused ?? current.paused,
    maxCallsPerDay: patch.maxCallsPerDay ?? current.maxCallsPerDay,
    maxCostPerDayCents: patch.maxCostPerDayCents ?? current.maxCostPerDayCents,
    weekendPause: patch.weekendPause ?? current.weekendPause,
    failureCount: patch.failureCount ?? current.failureCount,
    updatedAt: new Date().toISOString(),
  };

  getDb()
    .prepare(`
      UPDATE agent_settings
      SET paused = ?,
          maxCallsPerDay = ?,
          maxCostPerDayCents = ?,
          weekendPause = ?,
          failureCount = ?,
          updatedAt = ?
      WHERE id = ?
    `)
    .run(
      next.paused ? 1 : 0,
      next.maxCallsPerDay,
      next.maxCostPerDayCents,
      next.weekendPause ? 1 : 0,
      next.failureCount,
      next.updatedAt,
      `${scopeId}:${AGENT_SETTINGS_ID}`
    );

  return getAgentSettings(scopeId);
}

export function createAgentRun(mode: AgentRunMode, workspaceId: string): AgentRun {
  const scopeId = resolveWorkspaceId(workspaceId);
  const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO agent_runs (
        id, workspaceId, status, mode, startedAt, completedAt, callsAttempted,
        callsSkipped, costCents, bookedCount, summary, error
      )
      VALUES (?, ?, 'running', ?, ?, NULL, 0, 0, 0, 0, NULL, NULL)
    `)
    .run(id, scopeId, mode, startedAt);

  return {
    id,
    status: "running",
    mode,
    startedAt,
    completedAt: null,
    callsAttempted: 0,
    callsSkipped: 0,
    costCents: 0,
    bookedCount: 0,
    summary: null,
    error: null,
  };
}

export function updateAgentRun(
  id: string,
  patch: Partial<
    Pick<
      AgentRun,
      "status" | "callsAttempted" | "callsSkipped" | "costCents" | "bookedCount" | "summary" | "error"
    >
  > & { completedAt?: string | null },
  workspaceId: string
): AgentRun | null {
  const scopeId = resolveWorkspaceId(workspaceId);
  const current = getAgentRun(id, scopeId);
  if (!current) return null;

  const next = {
    status: patch.status ?? current.status,
    completedAt:
      patch.completedAt !== undefined
        ? patch.completedAt
        : patch.status && patch.status !== "running"
        ? new Date().toISOString()
        : current.completedAt,
    callsAttempted: patch.callsAttempted ?? current.callsAttempted,
    callsSkipped: patch.callsSkipped ?? current.callsSkipped,
    costCents: patch.costCents ?? current.costCents,
    bookedCount: patch.bookedCount ?? current.bookedCount,
    summary: patch.summary !== undefined ? patch.summary : current.summary,
    error: patch.error !== undefined ? patch.error : current.error,
  };

  getDb()
    .prepare(`
      UPDATE agent_runs
      SET status = ?,
          completedAt = ?,
          callsAttempted = ?,
          callsSkipped = ?,
          costCents = ?,
          bookedCount = ?,
          summary = ?,
          error = ?
      WHERE id = ? AND workspaceId = ?
    `)
    .run(
      next.status,
      next.completedAt,
      next.callsAttempted,
      next.callsSkipped,
      next.costCents,
      next.bookedCount,
      next.summary,
      next.error,
      id,
      scopeId
    );

  return getAgentRun(id, scopeId);
}

export function getAgentRun(id: string, workspaceId: string): AgentRun | null {
  const row = getDb()
    .prepare("SELECT * FROM agent_runs WHERE id = ? AND workspaceId = ?")
    .get(id, resolveWorkspaceId(workspaceId)) as AgentRunRow | undefined;
  return row ? rowToAgentRun(row) : null;
}

export function getLatestAgentRun(workspaceId: string): AgentRun | null {
  const row = getDb()
    .prepare("SELECT * FROM agent_runs WHERE workspaceId = ? ORDER BY startedAt DESC LIMIT 1")
    .get(resolveWorkspaceId(workspaceId)) as AgentRunRow | undefined;
  return row ? rowToAgentRun(row) : null;
}

export function addAgentEvent(input: {
  runId?: string | null;
  type: AgentEventType;
  severity?: AgentEvent["severity"];
  message: string;
  leadId?: string | null;
  metadata?: Record<string, unknown> | null;
}, workspaceId: string): AgentEvent {
  const scopeId = resolveWorkspaceId(workspaceId);
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO agent_events (
        id, workspaceId, runId, type, severity, message, leadId, metadata, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      scopeId,
      input.runId ?? null,
      input.type,
      input.severity ?? "info",
      input.message,
      input.leadId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt
    );

  return {
    id,
    runId: input.runId ?? null,
    type: input.type,
    severity: input.severity ?? "info",
    message: input.message,
    leadId: input.leadId ?? null,
    metadata: input.metadata ?? null,
    createdAt,
  };
}

export function listAgentEvents(
  workspaceId: string,
  limit = 25,
  runId?: string,
): AgentEvent[] {
  const scopeId = resolveWorkspaceId(workspaceId);
  const rows = runId
    ? (getDb()
        .prepare(
          "SELECT * FROM agent_events WHERE workspaceId = ? AND runId = ? ORDER BY createdAt DESC LIMIT ?"
        )
        .all(scopeId, runId, limit) as AgentEventRow[])
    : (getDb()
        .prepare("SELECT * FROM agent_events WHERE workspaceId = ? ORDER BY createdAt DESC LIMIT ?")
        .all(scopeId, limit) as AgentEventRow[]);
  return rows.map(rowToAgentEvent);
}

export function getDailyAgentBudget(
  workspaceId: string,
  date = new Date(),
): AgentBudget {
  const scopeId = resolveWorkspaceId(workspaceId);
  const settings = getAgentSettings(scopeId);
  const row = getDb()
    .prepare(`
      SELECT
        COALESCE(SUM(callsAttempted), 0) AS callsUsed,
        COALESCE(SUM(costCents), 0) AS costUsedCents
      FROM agent_runs
      WHERE workspaceId = ? AND startedAt >= ? AND startedAt <= ?
    `)
    .get(scopeId, startOfLocalDay(date), endOfLocalDay(date)) as {
    callsUsed: number;
    costUsedCents: number;
  };

  return {
    date: dateKey(date),
    callsUsed: row.callsUsed,
    callsRemaining: Math.max(0, settings.maxCallsPerDay - row.callsUsed),
    maxCalls: settings.maxCallsPerDay,
    costUsedCents: row.costUsedCents,
    costRemainingCents: Math.max(0, settings.maxCostPerDayCents - row.costUsedCents),
    maxCostCents: settings.maxCostPerDayCents,
  };
}

export function rememberLeadSeen(
  lead: Lead,
  workspaceId: string,
  timezone?: string,
) {
  const phone = normalisePhone(lead.phone);
  if (!phone) return;
  const scopeId = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO lead_memory (
        workspaceId, phone, leadId, businessName, city, category, timezone,
        firstSeenAt, lastContactedAt, outcome, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET
        workspaceId = excluded.workspaceId,
        leadId = excluded.leadId,
        businessName = excluded.businessName,
        city = excluded.city,
        category = excluded.category,
        timezone = COALESCE(excluded.timezone, lead_memory.timezone),
        updatedAt = excluded.updatedAt
    `)
    .run(
      scopeId,
      phone,
      lead.id,
      lead.name,
      lead.city,
      lead.category,
      timezone ?? lead.timezone ?? null,
      lead.scrapedAt || now,
      now,
      now
    );
}

export function rememberLeadContact(
  lead: Lead,
  outcome: string,
  workspaceId: string,
  timezone?: string,
) {
  const phone = normalisePhone(lead.phone);
  if (!phone) return;
  const scopeId = resolveWorkspaceId(workspaceId);
  const now = new Date().toISOString();
  getDb()
    .prepare(`
      INSERT INTO lead_memory (
        workspaceId, phone, leadId, businessName, city, category, timezone,
        firstSeenAt, lastContactedAt, outcome, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET
        workspaceId = excluded.workspaceId,
        leadId = excluded.leadId,
        businessName = excluded.businessName,
        city = excluded.city,
        category = excluded.category,
        timezone = COALESCE(excluded.timezone, lead_memory.timezone),
        lastContactedAt = excluded.lastContactedAt,
        outcome = excluded.outcome,
        updatedAt = excluded.updatedAt
    `)
    .run(
      scopeId,
      phone,
      lead.id,
      lead.name,
      lead.city,
      lead.category,
      timezone ?? lead.timezone ?? null,
      lead.scrapedAt || now,
      now,
      outcome,
      now,
      now
    );
}

export async function hasContactedPhone(
  phone: string,
  workspaceId: string
): Promise<boolean> {
  await ensureSeeded();
  const normalized = normalisePhone(phone);
  const scopeId = resolveWorkspaceId(workspaceId);
  const memory = getDb()
    .prepare(
      "SELECT phone FROM lead_memory WHERE workspaceId = ? AND phone = ? AND lastContactedAt IS NOT NULL"
    )
    .get(scopeId, normalized);
  if (memory) return true;

  const call = getDb()
    .prepare(`
      SELECT lead_calls.id
      FROM lead_calls
      JOIN leads ON leads.id = lead_calls.leadId
      WHERE leads.workspaceId = ? AND lead_calls.workspaceId = ? AND leads.phone = ?
      LIMIT 1
    `)
    .get(scopeId, scopeId, phone);
  if (call) return true;

  const lifecycle = getDb()
    .prepare(`
      SELECT id
      FROM leads
      WHERE workspaceId = ? AND phone = ? AND (lastCallAt IS NOT NULL OR callAttempts > 0)
      LIMIT 1
    `)
    .get(scopeId, phone);
  return Boolean(lifecycle);
}

export function getAgentMemoryStats(workspaceId: string): AgentMemoryStats {
  const scopeId = resolveWorkspaceId(workspaceId);
  const totals = getDb()
    .prepare(`
      SELECT
        COUNT(*) AS totalKnown,
        SUM(CASE WHEN lastContactedAt IS NOT NULL THEN 1 ELSE 0 END) AS contacted,
        SUM(CASE WHEN outcome = 'booked' THEN 1 ELSE 0 END) AS booked
      FROM lead_memory
      WHERE workspaceId = ?
    `)
    .get(scopeId) as { totalKnown: number; contacted: number | null; booked: number | null };

  const dnc = getDb()
    .prepare("SELECT COUNT(*) AS count FROM dnc_entries WHERE workspaceId IN (?, ?)")
    .get(scopeId, GLOBAL_DNC_WORKSPACE_ID) as { count: number };

  const performer = getDb()
    .prepare(`
      SELECT
        COALESCE(NULLIF(category, ''), 'Unknown') AS category,
        COALESCE(NULLIF(city, ''), 'Unknown') AS city,
        COUNT(*) AS total,
        SUM(CASE WHEN outcome = 'booked' THEN 1 ELSE 0 END) AS booked
      FROM lead_memory
      WHERE workspaceId = ?
      GROUP BY category, city
      HAVING total > 0
      ORDER BY booked DESC, total DESC
      LIMIT 1
    `)
    .get(scopeId) as { category: string; city: string; total: number; booked: number | null } | undefined;

  return {
    totalKnown: totals.totalKnown,
    contacted: totals.contacted ?? 0,
    booked: totals.booked ?? 0,
    doNotCall: dnc.count,
    topPerformer: performer
      ? {
          label: `${performer.category} in ${performer.city}`,
          booked: performer.booked ?? 0,
          total: performer.total,
        }
      : null,
  };
}

export interface DailyDigestData {
  date: string;
  workspaceId: string;
  workspaceName: string;
  callsTotal: number;
  callsByOutcome: Record<string, number>;
  bookings: { businessName: string; startTime: string | null; phone: string }[];
  newLeads: number;
  topNewLeadCategory: { category: string; count: number } | null;
  dncAdded: number;
  agentRuns: { total: number; failed: number; lastError: string | null };
  costCents: number;
}

export function buildDailyDigest(
  workspaceId: string,
  date = new Date()
): DailyDigestData {
  const scopeId = resolveWorkspaceId(workspaceId);
  const workspace = getWorkspace(scopeId);
  const dayStart = startOfLocalDay(date);
  const dayEnd = endOfLocalDay(date);
  const db = getDb();

  const callRows = db
    .prepare(`
      SELECT outcome, COUNT(*) AS count
      FROM lead_calls
      WHERE workspaceId = ? AND createdAt >= ? AND createdAt <= ?
      GROUP BY outcome
    `)
    .all(scopeId, dayStart, dayEnd) as { outcome: string; count: number }[];

  const callsByOutcome: Record<string, number> = {};
  let callsTotal = 0;
  for (const row of callRows) {
    callsByOutcome[row.outcome] = row.count;
    callsTotal += row.count;
  }

  const bookingRows = db
    .prepare(`
      SELECT leads.name AS businessName, leads.phone AS phone, lead_activities.metadata AS metadata
      FROM lead_activities
      JOIN leads ON leads.id = lead_activities.leadId
      WHERE lead_activities.workspaceId = ?
        AND lead_activities.type = 'booking'
        AND lead_activities.createdAt >= ?
        AND lead_activities.createdAt <= ?
      ORDER BY lead_activities.createdAt ASC
    `)
    .all(scopeId, dayStart, dayEnd) as {
      businessName: string;
      phone: string;
      metadata: string | null;
    }[];
  const bookings = bookingRows.map((b) => {
    let startTime: string | null = null;
    if (b.metadata) {
      try {
        const meta = JSON.parse(b.metadata) as { bookedAt?: string };
        startTime = meta.bookedAt ?? null;
      } catch {
        // ignore malformed metadata
      }
    }
    return { businessName: b.businessName, phone: b.phone, startTime };
  });

  const newLeadsRow = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM leads
      WHERE workspaceId = ? AND scrapedAt >= ? AND scrapedAt <= ?
    `)
    .get(scopeId, dayStart, dayEnd) as { count: number };

  const topCatRow = db
    .prepare(`
      SELECT COALESCE(NULLIF(category, ''), 'Unknown') AS category, COUNT(*) AS count
      FROM leads
      WHERE workspaceId = ? AND scrapedAt >= ? AND scrapedAt <= ?
      GROUP BY category
      ORDER BY count DESC
      LIMIT 1
    `)
    .get(scopeId, dayStart, dayEnd) as { category: string; count: number } | undefined;

  const dncRow = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM dnc_entries
      WHERE workspaceId = ? AND createdAt >= ? AND createdAt <= ?
    `)
    .get(scopeId, dayStart, dayEnd) as { count: number };

  const runsRow = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        COALESCE(SUM(costCents), 0) AS costCents
      FROM agent_runs
      WHERE workspaceId = ? AND startedAt >= ? AND startedAt <= ?
    `)
    .get(scopeId, dayStart, dayEnd) as {
      total: number;
      failed: number | null;
      costCents: number;
    };

  const lastFailureRow = db
    .prepare(`
      SELECT error
      FROM agent_runs
      WHERE workspaceId = ? AND startedAt >= ? AND startedAt <= ? AND status = 'failed'
      ORDER BY startedAt DESC
      LIMIT 1
    `)
    .get(scopeId, dayStart, dayEnd) as { error: string | null } | undefined;

  return {
    date: dateKey(date),
    workspaceId: scopeId,
    workspaceName: workspace?.name ?? "Workspace",
    callsTotal,
    callsByOutcome,
    bookings,
    newLeads: newLeadsRow.count,
    topNewLeadCategory: topCatRow ? { category: topCatRow.category, count: topCatRow.count } : null,
    dncAdded: dncRow.count,
    agentRuns: {
      total: runsRow.total,
      failed: runsRow.failed ?? 0,
      lastError: lastFailureRow?.error ?? null,
    },
    costCents: runsRow.costCents,
  };
}

export async function getAgentStatusPayload(
  workspaceId: string
): Promise<AgentStatusPayload> {
  await ensureSeeded();
  const scopeId = resolveWorkspaceId(workspaceId);
  const settings = getAgentSettings(scopeId);
  const latestRun = getLatestAgentRun(scopeId);
  const status =
    settings.paused
      ? "paused"
      : latestRun?.status === "running"
      ? "running"
      : latestRun?.status === "failed"
      ? "failed"
      : latestRun?.status === "completed"
      ? "completed"
      : "idle";

  return {
    status,
    settings,
    latestRun,
    budget: getDailyAgentBudget(scopeId, new Date()),
    memory: getAgentMemoryStats(scopeId),
    recentEvents: listAgentEvents(scopeId, 25),
  };
}

// ─── Phone helpers ───────────────────────────────────────────────────────────

export function normalisePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length > 0) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return trimmed.replace(/[\s\-().]/g, "");
}
