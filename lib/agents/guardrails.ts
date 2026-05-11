import type { AgentRunMode, AgentSettings, Lead } from "@/lib/types";
import { isCallablePhone, isOnDNC } from "@/lib/dnc";
import { hasContactedPhone, normalisePhone } from "@/lib/database";

const DEFAULT_TIMEZONE = "America/Detroit";

const STATE_TIMEZONES: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DC: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  IA: "America/Chicago",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  MA: "America/New_York",
  MD: "America/New_York",
  ME: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MO: "America/Chicago",
  MS: "America/Chicago",
  MT: "America/Denver",
  NC: "America/New_York",
  ND: "America/Chicago",
  NE: "America/Chicago",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NV: "America/Los_Angeles",
  NY: "America/New_York",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VA: "America/New_York",
  VT: "America/New_York",
  WA: "America/Los_Angeles",
  WI: "America/Chicago",
  WV: "America/New_York",
  WY: "America/Denver",
};

const CITY_TIMEZONES: Record<string, string> = {
  detroit: "America/Detroit",
  "grand rapids": "America/Detroit",
  "ann arbor": "America/Detroit",
  lansing: "America/Detroit",
  flint: "America/Detroit",
  warren: "America/Detroit",
  "mount clemens": "America/Detroit",
  "byron center": "America/Detroit",
};

export interface LeadCallingWindow {
  timezone: string;
  localHour: number;
  localLabel: string;
  isWeekend: boolean;
  allowed: boolean;
  reason?: string;
}

export interface GuardrailResult {
  eligible: boolean;
  timezone: string;
  reason?: string;
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function extractState(lead: Lead) {
  if (lead.state && /^[A-Z]{2}$/i.test(lead.state)) {
    return lead.state.toUpperCase();
  }

  const match = lead.address.match(/,\s*([A-Z]{2})(?:\s+\d{5})?\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

export function inferLeadTimezone(lead: Lead) {
  if (lead.timezone && isValidTimezone(lead.timezone)) {
    return lead.timezone;
  }

  const state = extractState(lead);
  if (state && STATE_TIMEZONES[state]) {
    return STATE_TIMEZONES[state];
  }

  const cityTimezone = CITY_TIMEZONES[lead.city.trim().toLowerCase()];
  return cityTimezone ?? DEFAULT_TIMEZONE;
}

export function getLeadCallingWindow(
  lead: Lead,
  settings: Pick<AgentSettings, "weekendPause">,
  now = new Date()
): LeadCallingWindow {
  const timezone = inferLeadTimezone(lead);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(now);
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: timezone,
  })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;
  const localHour = Number(hourPart ?? "0") % 24;
  const localLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(now);
  const isWeekend = weekday === "Sat" || weekday === "Sun";

  if (settings.weekendPause && isWeekend) {
    return {
      timezone,
      localHour,
      localLabel,
      isWeekend,
      allowed: false,
      reason: `Weekend paused in ${timezone}`,
    };
  }

  if (localHour < 8 || localHour >= 21) {
    return {
      timezone,
      localHour,
      localLabel,
      isWeekend,
      allowed: false,
      reason: `Outside 8am-9pm local window (${localLabel})`,
    };
  }

  return { timezone, localHour, localLabel, isWeekend, allowed: true };
}

function hasLiveCallingIntegration() {
  return Boolean(
    process.env.ANTHROPIC_API_KEY &&
      process.env.VAPI_API_KEY &&
      process.env.VAPI_PHONE_NUMBER_ID
  );
}

export async function evaluateLeadGuardrails(
  lead: Lead,
  settings: AgentSettings,
  mode: AgentRunMode,
  now = new Date(),
  workspaceId?: string
): Promise<GuardrailResult> {
  const timezone = inferLeadTimezone(lead);
  const lane = lead.campaignLane ?? "cold_b2b";
  const contactType = lead.contactType ?? "business";
  const hasSource = Boolean(lead.source?.trim());
  const hasConsentNote = Boolean(lead.consentNote?.trim());

  if (settings.paused) {
    return { eligible: false, timezone, reason: "Agent is paused" };
  }

  if (lane === "cold_consumer") {
    return {
      eligible: false,
      timezone,
      reason: "Cold consumer campaigns are locked until compliance acknowledgement is configured",
    };
  }

  if (lane === "cold_b2b" && contactType !== "business") {
    return { eligible: false, timezone, reason: "Cold B2B requires a business contact type" };
  }

  if (!hasSource) {
    return { eligible: false, timezone, reason: "Missing source label" };
  }

  if (contactType === "consumer" && !hasConsentNote) {
    return { eligible: false, timezone, reason: "Consumer record is missing a consent/source note" };
  }

  if (lane === "warm_recovery" && !hasConsentNote) {
    return { eligible: false, timezone, reason: "Warm recovery requires a source note" };
  }

  if (!isCallablePhone(lead.phone)) {
    return { eligible: false, timezone, reason: "Missing callable US phone number" };
  }

  if (await isOnDNC(lead.phone, workspaceId)) {
    return { eligible: false, timezone, reason: "Number is on internal DNC" };
  }

  if (await hasContactedPhone(lead.phone, workspaceId)) {
    return { eligible: false, timezone, reason: "Already contacted before" };
  }

  const window = getLeadCallingWindow(lead, settings, now);
  if (!window.allowed) {
    return { eligible: false, timezone: window.timezone, reason: window.reason };
  }

  if (mode === "live" && !hasLiveCallingIntegration()) {
    return { eligible: false, timezone, reason: "Missing live calling integration" };
  }

  return { eligible: true, timezone };
}

export function getNormalizedLeadPhone(lead: Lead) {
  return normalisePhone(lead.phone);
}
