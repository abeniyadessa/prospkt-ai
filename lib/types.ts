import type { OpenAIRealtimeModel, OpenAIRealtimeVoiceId } from "@/lib/voice";

export const LEAD_STATUSES = [
  "new",
  "queued",
  "called",
  "voicemail",
  "interested",
  "booked",
  "follow_up",
  "not_interested",
  "dnc",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadContactType = "business" | "consumer";
export type CampaignLane = "warm_recovery" | "cold_b2b" | "cold_consumer";

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}

export function isLeadContactType(value: unknown): value is LeadContactType {
  return value === "business" || value === "consumer";
}

export function isCampaignLane(value: unknown): value is CampaignLane {
  return (
    value === "warm_recovery" ||
    value === "cold_b2b" ||
    value === "cold_consumer"
  );
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
  state?: string;
  timezone?: string;
  websiteStatus: "none" | "outdated" | "modern";
  priorityScore: number;
  scrapedAt: string;
  yelpUrl?: string;
  yelpRating?: number;
  yelpReviewCount?: number;
  status?: LeadStatus;
  statusUpdatedAt?: string;
  lastCallAt?: string | null;
  callAttempts?: number;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  contactType?: LeadContactType;
  source?: string | null;
  consentNote?: string | null;
  serviceNeed?: string | null;
  serviceArea?: string | null;
  estimateValueCents?: number | null;
  campaignLane?: CampaignLane | null;
  playbook?: string | null;
}

export interface VapiCallRecord {
  id: string;
  status: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  metadata?: Record<string, string>;
  assistant?: { name?: string };
}

export interface CalBooking {
  id: number;
  uid: string;
  title: string;
  start: string;
  end: string;
  status: string;
  attendees: { name: string; email: string; timeZone: string }[];
}

export interface Analytics {
  totalLeads: number;
  activeLeads?: number;
  bookedLeads?: number;
  followUpLeads?: number;
  callsToday: number;
  callsThisWeek?: number;
  totalCalls?: number;
  bookedThisWeek: number;
  bookedTotal?: number;
  conversionRate: number;
  endedCalls?: number;
}

export type AgentStatus = "idle" | "running" | "paused" | "failed" | "completed";
export type AgentRunStatus = "running" | "completed" | "failed" | "paused";
export type AgentRunMode = "dry_run" | "live";

export type AgentEventType =
  | "run_started"
  | "paused"
  | "resumed"
  | "budget_check"
  | "scrape"
  | "qualify"
  | "skip"
  | "queue"
  | "call"
  | "booking"
  | "sms"
  | "report"
  | "error"
  | "run_completed";

export interface AgentSettings {
  id: string;
  paused: boolean;
  maxCallsPerDay: number;
  maxCostPerDayCents: number;
  weekendPause: boolean;
  failureCount: number;
  updatedAt: string;
}

export interface AgentRun {
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

export interface AgentEvent {
  id: string;
  runId: string | null;
  type: AgentEventType;
  severity: "info" | "warning" | "error" | "success";
  message: string;
  leadId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AgentBudget {
  date: string;
  callsUsed: number;
  callsRemaining: number;
  maxCalls: number;
  costUsedCents: number;
  costRemainingCents: number;
  maxCostCents: number;
}

export interface AgentMemoryStats {
  totalKnown: number;
  contacted: number;
  booked: number;
  doNotCall: number;
  topPerformer: {
    label: string;
    booked: number;
    total: number;
  } | null;
}

export interface AgentStatusPayload {
  status: AgentStatus;
  settings: AgentSettings;
  latestRun: AgentRun | null;
  budget: AgentBudget;
  memory: AgentMemoryStats;
  recentEvents: AgentEvent[];
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string | null;
  timezone: string;
  onboardingCompleted: boolean;
  ownerUserId?: string | null;
  role?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  companyName: string;
  timezone: string;
  bookingEmail: string | null;
  notificationEmail: string | null;
  targetCities: string[];
  targetCategories: string[];
  updatedAt: string;
}

export interface WaitlistSignup {
  id: string;
  email: string;
  companyName: string | null;
  city: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrelaunchEvent {
  id: string;
  name: string;
  source: string | null;
  path: string | null;
  referrer: string | null;
  email: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OnboardingProfile {
  workspaceId: string;
  companyName: string;
  userRole: string;
  timezone: string;
  offer: string;
  targetBuyer: string;
  pitch: string;
  targetCities: string[];
  targetCategories: string[];
  websiteStatuses: Lead["websiteStatus"][];
  maxCallsPerDay: number;
  maxCostPerDayCents: number;
  weekendPause: boolean;
  bookingEmail: string | null;
  notificationEmail: string | null;
  complianceAcceptedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

export interface AppWorkspaceContext {
  user: WorkspaceUser;
  workspace: Workspace | null;
  settings: WorkspaceSettings | null;
  onboarding: OnboardingProfile | null;
}

export interface ScriptSettings {
  systemPromptSuffix: string;
  firstMessageTemplate: string;
  realtimeModel: OpenAIRealtimeModel;
  realtimeVoiceId: OpenAIRealtimeVoiceId;
  updatedAt: string;
}

export type NavKey =
  | "Home"
  | "Campaigns"
  | "CRM"
  | "Pipeline"
  | "Calls"
  | "Bookings"
  | "Settings"
  | "Help";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  queued: "Queued",
  called: "Called",
  voicemail: "Voicemail",
  interested: "Interested",
  booked: "Booked",
  follow_up: "Follow up",
  not_interested: "Not interested",
  dnc: "DNC",
};

export const CONTACT_TYPE_LABELS: Record<LeadContactType, string> = {
  business: "Business",
  consumer: "Consumer",
};

export const CAMPAIGN_LANE_LABELS: Record<CampaignLane, string> = {
  warm_recovery: "Warm recovery",
  cold_b2b: "Cold B2B",
  cold_consumer: "Cold consumer",
};
