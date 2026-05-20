"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  ArrowSquareOutIcon,
  ClockIcon,
  ChatTeardropIcon,
  RecordIcon,
  XIcon,
  ArrowsClockwiseIcon,
  CalendarPlusIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import type { CampaignLane, Lead, LeadContactType, LeadStatus } from "@/lib/types";
import {
  CAMPAIGN_LANE_LABELS,
  CONTACT_TYPE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/types";
import { campaignPlaybooks, type CampaignPlaybookId } from "@/lib/campaigns";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import {
  AccentButton,
  GhostButton,
  LifecycleBadge,
  Select,
  ScorePill,
  WebsiteBadge,
} from "./primitives";

// ─── Types matching the API ──────────────────────────────────────────────────

interface LeadActivity {
  id: string;
  leadId: string;
  type: "note" | "call" | "status_change" | "booking" | "follow_up_scheduled" | "dnc_added";
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string;
}

interface LeadCallRow {
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

type Tab = "overview" | "activity" | "calls" | "notes";
type LeadPatch = {
  status?: LeadStatus;
  nextFollowUpAt?: string | null;
  contactType?: LeadContactType;
  source?: string | null;
  consentNote?: string | null;
  serviceNeed?: string | null;
  serviceArea?: string | null;
  estimateValueCents?: number | null;
  campaignLane?: CampaignLane | null;
  playbook?: CampaignPlaybookId | null;
};

type PlaybookSelectValue = CampaignPlaybookId | "none";

// ─── Drawer ──────────────────────────────────────────────────────────────────

export function LeadDrawer({
  lead,
  onClose,
  onCall,
  onChange,
}: {
  lead: Lead | null;
  onClose: () => void;
  onCall: (lead: Lead) => void;
  /** Called whenever the drawer mutates the lead (status, follow-up, etc.) */
  onChange?: (lead: Lead) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [calls, setCalls] = useState<LeadCallRow[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leadId = lead?.id;

  const fetchActivities = useCallback(async () => {
    if (!leadId) return;
    setError(null);
    setLoadingActivities(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/activities`);
      if (!res.ok) {
        throw new Error("Could not load activity.");
      }
      const data = (await res.json()) as { activities: LeadActivity[] };
      setActivities(data.activities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activity.");
    } finally {
      setLoadingActivities(false);
    }
  }, [leadId]);

  const fetchCalls = useCallback(async () => {
    if (!leadId) return;
    setError(null);
    setLoadingCalls(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/calls`);
      if (!res.ok) {
        throw new Error("Could not load calls.");
      }
      const data = (await res.json()) as { calls: LeadCallRow[] };
      setCalls(data.calls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load calls.");
    } finally {
      setLoadingCalls(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    setTab("overview");
    setActiveCallId(null);
    setNoteDraft("");
    setError(null);
    fetchActivities();
    fetchCalls();
  }, [leadId, fetchActivities, fetchCalls]);

  async function patchLead(patch: LeadPatch) {
    if (!lead) return;
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, ...patch }),
      });
      const data = (await res.json()) as { lead?: Lead; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Lead could not be updated.");
      }
      if (data.lead) {
        onChange?.(data.lead);
        fetchActivities();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead could not be updated.");
    }
  }

  async function saveNote() {
    if (!lead || !noteDraft.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteDraft.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? "Note could not be saved.");
      }
      setNoteDraft("");
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note could not be saved.");
    } finally {
      setSavingNote(false);
    }
  }

  if (!lead) return null;

  return (
    <DialogPrimitive.Root open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/30 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[560px] flex-col",
            "bg-[color:var(--surface)] shadow-[-24px_0_48px_-16px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)]",
            "outline-none duration-200 ease-out",
            "data-open:animate-in data-open:slide-in-from-right",
            "data-closed:animate-out data-closed:slide-out-to-right"
          )}
        >
          <DrawerHeader lead={lead} onClose={onClose} onCall={onCall} />

          <Tabs tab={tab} onChange={setTab} counts={{ activity: activities.length, calls: calls.length }} />

          <div className="flex-1 overflow-y-auto">
            {error && (
              <div
                className="mx-6 mt-4 rounded-lg border border-[color:var(--danger)]/20 bg-[#FAE3E0] px-4 py-3 text-[13px] text-[#A32A22]"
                role="status"
                aria-live="polite"
              >
                {error}
              </div>
            )}
            {tab === "overview" && (
              <OverviewTab lead={lead} onPatch={patchLead} onAddDnc={() => patchLead({ status: "dnc" })} />
            )}
            {tab === "activity" && (
              <ActivityTab
                activities={activities}
                loading={loadingActivities}
                onRefresh={fetchActivities}
              />
            )}
            {tab === "calls" && (
              <CallsTab
                calls={calls}
                loading={loadingCalls}
                activeCallId={activeCallId}
                onSelect={setActiveCallId}
                onRefresh={fetchCalls}
              />
            )}
            {tab === "notes" && (
              <NotesTab
                activities={activities.filter((a) => a.type === "note")}
                draft={noteDraft}
                onDraftChange={setNoteDraft}
                onSave={saveNote}
                saving={savingNote}
              />
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function DrawerHeader({
  lead,
  onClose,
  onCall,
}: {
  lead: Lead;
  onClose: () => void;
  onCall: (lead: Lead) => void;
}) {
  return (
    <div className="border-b border-hairline px-4 pb-4 pt-5 sm:px-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps mb-1">Lead</p>
          <DialogPrimitive.Title className="truncate text-[20px] font-semibold leading-tight text-foreground">
            {lead.name}
          </DialogPrimitive.Title>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="press shrink-0 inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-[color:var(--elevated)] hover:text-foreground transition-colors"
        >
          <XIcon size={14} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ScorePill score={lead.priorityScore} />
        <LifecycleBadge status={lead.status ?? "new"} />
        <WebsiteBadge status={lead.websiteStatus} />
        <span className="inline-flex items-center rounded-md bg-[color:var(--elevated)] text-muted-foreground text-[11.5px] px-2 py-0.5 font-medium">
          {lead.category}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <AccentButton
          onClick={() => onCall(lead)}
          iconLeft={<PhoneIcon size={12} weight="fill" />}
          className="flex-1 h-9 justify-center text-[13px]"
        >
          Call now
        </AccentButton>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

function Tabs({
  tab,
  onChange,
  counts,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  counts: { activity: number; calls: number };
}) {
  const items: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity", count: counts.activity },
    { key: "calls", label: "Calls", count: counts.calls },
    { key: "notes", label: "Notes" },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-hairline px-3 sm:px-4">
      {items.map((item) => {
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative h-10 inline-flex items-center gap-1.5 px-3 text-[13px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {typeof item.count === "number" && item.count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--elevated)] text-[10.5px] font-semibold tabular-nums">
                {item.count}
              </span>
            )}
            {active && (
              <span
                className="absolute left-0 right-0 -bottom-px h-[2px] bg-foreground"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({
  lead,
  onPatch,
  onAddDnc,
}: {
  lead: Lead;
  onPatch: (patch: LeadPatch) => void;
  onAddDnc: () => void;
}) {
  const followUpLocal = lead.nextFollowUpAt
    ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16)
    : "";
  const safeLeadId = lead.id.replace(/[^a-zA-Z0-9_-]/g, "-");
  const statusId = `lead-status-${safeLeadId}`;
  const followUpId = `lead-follow-up-${safeLeadId}`;

  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      {/* Contact info */}
      <ul className="rounded-xl border border-hairline divide-y divide-hairline">
        <li className="flex items-center gap-3 px-4 py-3">
          <PhoneIcon size={14} color="#9F9F9E" aria-hidden />
          <a
            href={`tel:${lead.phone.replace(/\D/g, "")}`}
            className="text-[13.5px] font-mono tabular-nums text-foreground hover:underline"
          >
            {lead.phone}
          </a>
        </li>
        <li className="flex items-start gap-3 px-4 py-3">
          <MapPinIcon size={14} color="#9F9F9E" aria-hidden className="mt-0.5" />
          <span className="text-[13.5px] text-foreground">
            {lead.address || lead.city}
          </span>
        </li>
        {lead.yelpRating && (
          <li className="flex items-center gap-3 px-4 py-3">
            <StarIcon size={14} color="#B47A1F" weight="fill" aria-hidden />
            <span className="text-[13.5px] tabular-nums text-foreground">
              {lead.yelpRating}{" "}
              <span className="text-muted-foreground">
                · {lead.yelpReviewCount} reviews
              </span>
            </span>
          </li>
        )}
        {lead.yelpUrl && (
          <li className="flex items-center gap-3 px-4 py-3">
            <ArrowSquareOutIcon size={14} color="#9F9F9E" aria-hidden />
            <a
              href={lead.yelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13.5px] font-medium text-[color:var(--accent)] hover:underline"
            >
              View on Yelp
            </a>
          </li>
        )}
        {lead.scrapedAt && (
          <li className="flex items-center gap-3 px-4 py-3">
            <ClockIcon size={14} color="#9F9F9E" aria-hidden />
            <span className="text-[13.5px] text-muted-foreground">
              Scraped {formatRelativeTime(lead.scrapedAt)}
            </span>
          </li>
        )}
      </ul>

      {/* Lifecycle controls */}
      <section className="space-y-3">
        <h3 className="label-caps">Pipeline</h3>
        <div className="rounded-xl border border-hairline divide-y divide-hairline">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <label
              htmlFor={statusId}
              className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1.5"
            >
              <ArrowsClockwiseIcon size={12} aria-hidden />
              Status
            </label>
            <Select
              id={statusId}
              value={lead.status ?? "new"}
              onChange={(status) => onPatch({ status })}
              options={Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
                value: value as LeadStatus,
                label,
              }))}
              label={`Update ${lead.name} status`}
              className="h-7 min-w-36 rounded-md text-[12px]"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <label
              htmlFor={followUpId}
              className="text-[12.5px] text-muted-foreground inline-flex items-center gap-1.5"
            >
              <CalendarPlusIcon size={12} aria-hidden />
              Follow-up
            </label>
            <input
              id={followUpId}
              type="datetime-local"
              value={followUpLocal}
              onChange={(e) =>
                onPatch({
                  nextFollowUpAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              className="h-8 rounded-md border border-border bg-surface px-2 text-[12px] font-medium text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[12.5px] text-muted-foreground">Last call</span>
            <span className="text-[12.5px] text-foreground tabular-nums">
              {lead.lastCallAt ? formatRelativeTime(lead.lastCallAt) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[12.5px] text-muted-foreground">Attempts</span>
            <span className="text-[12.5px] text-foreground tabular-nums">
              {lead.callAttempts ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[12.5px] text-muted-foreground">DNC state</span>
            <span
              className={cn(
                "text-[12.5px] font-medium",
                (lead.status ?? "new") === "dnc"
                  ? "text-[#A32A22]"
                  : "text-[#2E7D4F]"
              )}
            >
              {(lead.status ?? "new") === "dnc" ? "Blocked from calls" : "Callable with guardrails"}
            </span>
          </div>
        </div>

        {(lead.status ?? "new") !== "dnc" && (
          <button
            onClick={onAddDnc}
            className="press inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg border border-[rgba(194,53,44,0.3)] text-[#C2352C] hover:bg-[rgba(194,53,44,0.06)] transition-colors"
          >
            Add to Do Not Call
          </button>
        )}
      </section>

      <ServiceProfileEditor key={lead.id} lead={lead} onPatch={onPatch} />
    </div>
  );
}

function ServiceProfileEditor({
  lead,
  onPatch,
}: {
  lead: Lead;
  onPatch: (patch: LeadPatch) => void;
}) {
  const currentPlaybook = resolvePlaybookValue(lead.playbook);
  const [contactType, setContactType] = useState<LeadContactType>(
    lead.contactType ?? "business"
  );
  const [campaignLane, setCampaignLane] = useState<CampaignLane>(
    lead.campaignLane ?? "cold_b2b"
  );
  const [source, setSource] = useState(lead.source ?? "");
  const [serviceNeed, setServiceNeed] = useState(lead.serviceNeed ?? "");
  const [serviceArea, setServiceArea] = useState(
    lead.serviceArea ?? lead.address ?? lead.city ?? ""
  );
  const [estimateValue, setEstimateValue] = useState(
    lead.estimateValueCents != null
      ? String(Math.round(lead.estimateValueCents / 100))
      : ""
  );
  const [consentNote, setConsentNote] = useState(lead.consentNote ?? "");
  const [playbook, setPlaybook] = useState<PlaybookSelectValue>(currentPlaybook);

  const playbooksForLane = campaignPlaybooks.filter(
    (candidate) => candidate.lane === campaignLane
  );

  function updateCampaignLane(nextLane: CampaignLane) {
    setCampaignLane(nextLane);
    if (
      playbook !== "none" &&
      campaignPlaybooks.find((candidate) => candidate.id === playbook)?.lane !== nextLane
    ) {
      setPlaybook("none");
    }
  }

  const dirty =
    contactType !== (lead.contactType ?? "business") ||
    campaignLane !== (lead.campaignLane ?? "cold_b2b") ||
    source !== (lead.source ?? "") ||
    serviceNeed !== (lead.serviceNeed ?? "") ||
    serviceArea !== (lead.serviceArea ?? lead.address ?? lead.city ?? "") ||
    estimateValue !==
      (lead.estimateValueCents != null
        ? String(Math.round(lead.estimateValueCents / 100))
        : "") ||
    consentNote !== (lead.consentNote ?? "") ||
    playbook !== currentPlaybook;

  function save() {
    const trimmedEstimate = estimateValue.trim();
    const numericEstimate =
      trimmedEstimate.length > 0 ? Number(trimmedEstimate.replace(/[$,]/g, "")) : null;
    onPatch({
      contactType,
      campaignLane,
      source: source.trim() || null,
      serviceNeed: serviceNeed.trim() || null,
      serviceArea: serviceArea.trim() || null,
      estimateValueCents:
        numericEstimate != null && Number.isFinite(numericEstimate)
          ? Math.max(0, Math.round(numericEstimate * 100))
          : null,
      consentNote: consentNote.trim() || null,
      playbook: playbook === "none" ? null : playbook,
    });
  }

  const complianceCopy =
    campaignLane === "cold_consumer"
      ? "Cold consumer outreach is locked by default. Before a live campaign, this record needs source proof, consent context, DNC checks, local-hour limits, AI disclosure, and opt-out handling."
      : contactType === "consumer"
      ? "Consumer records need a clear source and consent note before the rep should call. Keep warm recovery as the default lane unless the contact explicitly opted in."
      : campaignLane === "cold_b2b"
      ? "B2B outreach still runs through DNC, local-hour, source, and disclosure guardrails before any call."
      : "Warm recovery is the safest lane: missed calls, forms, estimates, and past customer follow-up should still keep source notes current.";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="label-caps">Service sales profile</h3>
        {lead.estimateValueCents != null && (
          <span className="rounded-md bg-[color:var(--elevated)] px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {formatMoney(lead.estimateValueCents)}
          </span>
        )}
      </div>
      <div className="rounded-xl border border-hairline p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              Contact type
            </span>
            <Select
              value={contactType}
              onChange={setContactType}
              options={[
                { value: "business" as const, label: CONTACT_TYPE_LABELS.business },
                { value: "consumer" as const, label: CONTACT_TYPE_LABELS.consumer },
              ]}
              label="Contact type"
              className="h-9 w-full"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              Campaign lane
            </span>
            <Select
              value={campaignLane}
              onChange={updateCampaignLane}
              options={[
                { value: "warm_recovery" as const, label: CAMPAIGN_LANE_LABELS.warm_recovery },
                { value: "cold_b2b" as const, label: CAMPAIGN_LANE_LABELS.cold_b2b },
                { value: "cold_consumer" as const, label: CAMPAIGN_LANE_LABELS.cold_consumer },
              ]}
              label="Campaign lane"
              className="h-9 w-full"
            />
          </label>
          <ProfileInput
            label="Source"
            value={source}
            onChange={setSource}
            placeholder="Missed call, Yelp, old estimate"
          />
          <ProfileInput
            label="Service need"
            value={serviceNeed}
            onChange={setServiceNeed}
            placeholder="Roof repair, quote follow-up, commercial account"
          />
          <ProfileInput
            label="Service area"
            value={serviceArea}
            onChange={setServiceArea}
            placeholder="Address, city, or service area"
          />
          <ProfileInput
            label="Estimate value"
            value={estimateValue}
            onChange={setEstimateValue}
            placeholder="2500"
            inputMode="decimal"
          />
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              Playbook
            </span>
            <Select
              value={playbook}
              onChange={setPlaybook}
              options={[
                { value: "none" as const, label: "No playbook selected" },
                ...playbooksForLane.map((candidate) => ({
                  value: candidate.id,
                  label: candidate.title,
                })),
              ]}
              label="Campaign playbook"
              className="h-9 w-full"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-[11.5px] font-medium text-muted-foreground">
              Consent / source note
            </span>
            <textarea
              value={consentNote}
              onChange={(event) => setConsentNote(event.target.value)}
              placeholder="Why is this record safe to contact? Warm lead, business listing, opt-in form, prior customer, etc."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
            />
          </label>
        </div>
        <div className="mt-3 rounded-lg border border-[#F0D6A6] bg-[#FFF8EA] px-3 py-2 text-[12px] leading-relaxed text-[#8A5A12]">
          {complianceCopy}
        </div>
        <div className="mt-4 flex justify-end">
          <GhostButton
            onClick={save}
            disabled={!dirty}
            className="h-8 px-3 text-[12px]"
          >
            Save profile
          </GhostButton>
        </div>
      </div>
    </section>
  );
}

function resolvePlaybookValue(value?: string | null): PlaybookSelectValue {
  return campaignPlaybooks.some((candidate) => candidate.id === value)
    ? (value as CampaignPlaybookId)
    : "none";
}

function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  className?: string;
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
      />
    </label>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Activity tab ────────────────────────────────────────────────────────────

function ActivityTab({
  activities,
  loading,
  onRefresh,
}: {
  activities: LeadActivity[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && activities.length === 0) {
    return <div className="px-6 py-10 text-center text-[12.5px] text-muted-foreground">Loading…</div>;
  }
  if (activities.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[13px] text-muted-foreground">No activity yet.</p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Calls and status changes will appear here automatically.
        </p>
      </div>
    );
  }
  return (
    <div className="px-4 py-5 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="label-caps">Timeline</h3>
        <GhostButton onClick={onRefresh} className="h-7 px-2 text-[11.5px]">
          Refresh
        </GhostButton>
      </div>
      <ol className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-hairline">
        {activities.map((act) => (
          <ActivityRow key={act.id} activity={act} />
        ))}
      </ol>
    </div>
  );
}

function ActivityRow({ activity }: { activity: LeadActivity }) {
  const meta = activity.metadata ?? {};
  const dotColor =
    activity.type === "call"
      ? "#0A0A0A"
      : activity.type === "booking"
      ? "#2E7D4F"
      : activity.type === "dnc_added"
      ? "#C2352C"
      : activity.type === "follow_up_scheduled"
      ? "#B47A1F"
      : activity.type === "note"
      ? "#4B5FAE"
      : "#9F9F9E";

  return (
    <li className="relative">
      <span
        className="absolute -left-[19px] top-1.5 size-2.5 rounded-full ring-2 ring-[color:var(--surface)]"
        style={{ backgroundColor: dotColor }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-foreground capitalize">
            {activityLabel(activity.type)}
          </p>
          {activity.body && (
            <p className="mt-0.5 text-[12.5px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {activity.body}
            </p>
          )}
          {activity.type === "call" && typeof meta.durationSeconds === "number" && (
            <p className="mt-1 text-[11.5px] text-muted-foreground tabular-nums">
              {formatDuration(meta.durationSeconds as number)}
            </p>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {formatRelativeTime(activity.createdAt)}
        </span>
      </div>
    </li>
  );
}

function activityLabel(type: LeadActivity["type"]): string {
  switch (type) {
    case "note":
      return "Note added";
    case "call":
      return "Call";
    case "status_change":
      return "Status updated";
    case "booking":
      return "Booking confirmed";
    case "follow_up_scheduled":
      return "Follow-up scheduled";
    case "dnc_added":
      return "Added to DNC";
  }
}

// ─── Calls tab ───────────────────────────────────────────────────────────────

function CallsTab({
  calls,
  loading,
  activeCallId,
  onSelect,
  onRefresh,
}: {
  calls: LeadCallRow[];
  loading: boolean;
  activeCallId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}) {
  if (loading && calls.length === 0) {
    return <div className="px-6 py-10 text-center text-[12.5px] text-muted-foreground">Loading…</div>;
  }
  if (calls.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[13px] text-muted-foreground">No calls yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <h3 className="label-caps">Call history</h3>
        <GhostButton onClick={onRefresh} className="h-7 px-2 text-[11.5px]">
          Refresh
        </GhostButton>
      </div>
      <ul className="space-y-2">
        {calls.map((call) => {
          const open = activeCallId === call.id;
          return (
            <li
              key={call.id}
              className="rounded-xl border border-hairline overflow-hidden"
            >
              <button
                onClick={() => onSelect(open ? null : call.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[color:var(--elevated)] transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-foreground capitalize">
                    {call.outcome.replace(/-/g, " ")}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 tabular-nums">
                    {call.startedAt ? formatRelativeTime(call.startedAt) : formatRelativeTime(call.createdAt)}
                    {call.durationSeconds != null && (
                      <>
                        {" · "}
                        {formatDuration(call.durationSeconds)}
                      </>
                    )}
                  </p>
                </div>
                {call.recordingUrl && (
                  <a
                    href={call.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 inline-flex items-center gap-1 text-[11.5px] font-medium text-[color:var(--accent)] hover:underline"
                  >
                    <RecordIcon size={11} aria-hidden />
                    Listen
                  </a>
                )}
              </button>
              {open && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-hairline bg-[color:var(--elevated)]/40">
                  {call.summary && (
                    <div>
                      <p className="label-caps mb-1">Summary</p>
                      <p className="text-[12.5px] text-foreground leading-relaxed">
                        {call.summary}
                      </p>
                    </div>
                  )}
                  {call.transcript ? (
                    <div>
                      <p className="label-caps mb-1">Transcript</p>
                      <div className="rounded-lg border border-hairline bg-surface p-3 space-y-2 max-h-[300px] overflow-y-auto">
                        {call.transcript
                          .split("\n")
                          .filter((l) => l.trim())
                          .map((line, i) => {
                            const isAi =
                              line.toLowerCase().startsWith("ai:") ||
                              line.toLowerCase().startsWith("assistant:");
                            return (
                              <p
                                key={i}
                                className="text-[12px] leading-relaxed"
                                style={{ color: isAi ? "#0A0A0A" : "#6B6B6B" }}
                              >
                                {line}
                              </p>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">No transcript captured.</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Notes tab ───────────────────────────────────────────────────────────────

function NotesTab({
  activities,
  draft,
  onDraftChange,
  onSave,
  saving,
}: {
  activities: LeadActivity[];
  draft: string;
  onDraftChange: (s: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5 px-4 py-5 sm:px-6">
      <section>
        <label htmlFor="lead-note-draft" className="label-caps mb-2 block">
          Add note
        </label>
        <textarea
          id="lead-note-draft"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="What did the lead say? Any next steps?"
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 resize-none"
        />
        <div className="mt-2 flex justify-end">
          <AccentButton
            onClick={onSave}
            disabled={!draft.trim() || saving}
            iconLeft={<PlusIcon size={11} weight="bold" />}
            className="h-8 text-[12px]"
          >
            {saving ? "Saving…" : "Add note"}
          </AccentButton>
        </div>
      </section>

      <section>
        <h3 className="label-caps mb-3">Past notes</h3>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <ChatTeardropIcon size={20} color="#9F9F9E" className="mx-auto mb-2" />
            <p className="text-[12.5px] text-muted-foreground">No notes yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {activities.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-hairline px-4 py-3 bg-surface"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {n.createdBy === "system" ? "System" : "You"}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
