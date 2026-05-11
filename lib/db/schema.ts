import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  timezone: text("timezone").notNull().default("America/Detroit"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  ownerUserId: text("owner_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.userId] })]
);

export const onboarding = pgTable("onboarding", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  userRole: text("user_role").notNull().default("Owner"),
  timezone: text("timezone").notNull().default("America/Detroit"),
  offer: text("offer").notNull().default(""),
  targetBuyer: text("target_buyer").notNull().default(""),
  pitch: text("pitch").notNull().default(""),
  targetCities: jsonb("target_cities").$type<string[]>().notNull().default([]),
  targetCategories: jsonb("target_categories").$type<string[]>().notNull().default([]),
  websiteStatuses: jsonb("website_statuses").$type<string[]>().notNull().default([]),
  maxCallsPerDay: integer("max_calls_per_day").notNull().default(20),
  maxCostPerDayCents: integer("max_cost_per_day_cents").notNull().default(500),
  weekendPause: boolean("weekend_pause").notNull().default(true),
  bookingEmail: text("booking_email"),
  notificationEmail: text("notification_email"),
  complianceAcceptedAt: timestamp("compliance_accepted_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceSettings = pgTable("workspace_settings", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  timezone: text("timezone").notNull().default("America/Detroit"),
  bookingEmail: text("booking_email"),
  notificationEmail: text("notification_email"),
  targetCities: jsonb("target_cities").$type<string[]>().notNull().default([]),
  targetCategories: jsonb("target_categories").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scriptSettings = pgTable("script_settings", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  systemPromptSuffix: text("system_prompt_suffix").notNull().default(""),
  firstMessageTemplate: text("first_message_template").notNull().default(""),
  realtimeModel: text("realtime_model").notNull().default("gpt-realtime-2025-08-28"),
  realtimeVoiceId: text("realtime_voice_id").notNull().default("marin"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull().default(""),
    category: text("category").notNull().default("Business"),
    city: text("city").notNull().default(""),
    state: text("state"),
    timezone: text("timezone"),
    websiteStatus: text("website_status").notNull().default("outdated"),
    priorityScore: integer("priority_score").notNull().default(5),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull(),
    yelpUrl: text("yelp_url"),
    yelpRating: real("yelp_rating"),
    yelpReviewCount: integer("yelp_review_count"),
    status: text("status").notNull().default("new"),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).notNull(),
    lastCallAt: timestamp("last_call_at", { withTimezone: true }),
    callAttempts: integer("call_attempts").notNull().default(0),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    notes: text("notes"),
    contactType: text("contact_type").notNull().default("business"),
    source: text("source").notNull().default("Lead scraper"),
    consentNote: text("consent_note"),
    serviceNeed: text("service_need"),
    serviceArea: text("service_area"),
    estimateValueCents: integer("estimate_value_cents"),
    campaignLane: text("campaign_lane").notNull().default("cold_b2b"),
    playbook: text("playbook"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_leads_workspace_status").on(table.workspaceId, table.status),
    index("idx_leads_workspace_priority").on(table.workspaceId, table.priorityScore),
    index("idx_leads_workspace_city").on(table.workspaceId, table.city),
  ]
);

export const dncEntries = pgTable(
  "dnc_entries",
  {
    workspaceId: text("workspace_id").notNull(),
    phone: text("phone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    source: text("source").notNull().default("manual"),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.phone] }),
    index("idx_dnc_phone").on(table.phone),
  ]
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    leadId: text("lead_id").notNull(),
    type: text("type").notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull().default("system"),
  },
  (table) => [index("idx_activities_workspace_lead").on(table.workspaceId, table.leadId, table.createdAt)]
);

export const leadCalls = pgTable(
  "lead_calls",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    leadId: text("lead_id").notNull(),
    vapiCallId: text("vapi_call_id"),
    outcome: text("outcome").notNull(),
    durationSeconds: integer("duration_seconds"),
    transcript: text("transcript"),
    summary: text("summary"),
    recordingUrl: text("recording_url"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_calls_workspace_lead").on(table.workspaceId, table.leadId, table.createdAt),
    uniqueIndex("idx_calls_workspace_vapi").on(table.workspaceId, table.vapiCallId),
  ]
);

export const agentSettings = pgTable("agent_settings", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  paused: boolean("paused").notNull().default(false),
  maxCallsPerDay: integer("max_calls_per_day").notNull().default(20),
  maxCostPerDayCents: integer("max_cost_per_day_cents").notNull().default(500),
  weekendPause: boolean("weekend_pause").notNull().default(true),
  failureCount: integer("failure_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    status: text("status").notNull(),
    mode: text("mode").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    callsAttempted: integer("calls_attempted").notNull().default(0),
    callsSkipped: integer("calls_skipped").notNull().default(0),
    costCents: integer("cost_cents").notNull().default(0),
    bookedCount: integer("booked_count").notNull().default(0),
    summary: text("summary"),
    error: text("error"),
  },
  (table) => [
    index("idx_agent_runs_workspace_started").on(table.workspaceId, table.startedAt),
    index("idx_agent_runs_workspace_status").on(table.workspaceId, table.status),
  ]
);

export const agentEvents = pgTable(
  "agent_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    runId: text("run_id"),
    type: text("type").notNull(),
    severity: text("severity").notNull().default("info"),
    message: text("message").notNull(),
    leadId: text("lead_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_agent_events_workspace_run").on(table.workspaceId, table.runId, table.createdAt),
    index("idx_agent_events_workspace_created").on(table.workspaceId, table.createdAt),
  ]
);

export const leadMemory = pgTable(
  "lead_memory",
  {
    workspaceId: text("workspace_id").notNull(),
    phone: text("phone").notNull(),
    leadId: text("lead_id"),
    businessName: text("business_name"),
    city: text("city"),
    category: text("category"),
    timezone: text("timezone"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    outcome: text("outcome"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.phone] }),
    index("idx_lead_memory_workspace_contacted").on(table.workspaceId, table.lastContactedAt),
    index("idx_lead_memory_workspace_outcome").on(table.workspaceId, table.outcome),
  ]
);
