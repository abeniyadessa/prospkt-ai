"use client";

import { useEffect, useState } from "react";
import {
  UsersIcon,
  PhoneIcon,
  CalendarCheckIcon,
  PlayIcon,
  ArrowRightIcon,
  ClockIcon,
  PhoneCallIcon,
  PauseIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  TrendUpIcon,
  WarningCircleIcon,
  ArrowClockwiseIcon,
  CircleNotchIcon,
  PhoneOutgoingIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useWorkspaceContext } from "@/components/app/workspace-provider";
import type { AgentEvent, AgentRun, AgentStatusPayload, Analytics, Lead, NavKey, VapiCallRecord } from "@/lib/types";
import { CAMPAIGN_LANE_LABELS } from "@/lib/types";
import { getGreeting, formatRelativeTime, isInsideTcpaHours } from "@/lib/format";
import {
  Card,
  CardHeader,
  EmptyState,
  LoadingState,
  LifecycleBadge,
  ScorePill,
  WebsiteBadge,
  StatusDot,
  GhostButton,
  PrimaryButton,
} from "@/components/app/primitives";
import { TestCallDialog } from "@/components/app/test-call-dialog";

function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-[11.5px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[24px] font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {delta && (
        <p className="mt-1 text-[11.5px] text-muted-foreground">{delta}</p>
      )}
    </div>
  );
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function percent(used: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--muted)]">
      <div
        className="h-full rounded-full bg-foreground transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function VoiceDemoCard({ onOpen }: { onOpen: () => void }) {
  const traits = [
    "Sales-receptionist opener",
    "Human-paced turn taking",
    "Qualifies, then books",
  ];

  return (
    <Card>
      <CardHeader
        title="Voice demo"
        description="Hear the rep before a campaign goes live"
        action={<StatusDot color="#2E7D4F" label="Live test" className="text-[11.5px]" />}
      />
      <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <p className="text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
          Call your own phone with a missed-call, estimate follow-up, or commercial
          outreach scenario. The voice stays natural while clearly identifying as AI.
        </p>
        <div className="grid gap-2">
          {traits.map((trait) => (
            <div
              key={trait}
              className="flex items-center gap-2 text-[12.5px] text-foreground"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-[#2E7D4F]" aria-hidden />
              <span className="truncate">{trait}</span>
            </div>
          ))}
        </div>
        <PrimaryButton
          onClick={onOpen}
          iconLeft={<PhoneOutgoingIcon size={12} aria-hidden />}
          className="w-full justify-center"
        >
          Demo the voice
        </PrimaryButton>
      </div>
    </Card>
  );
}

function agentColor(status?: AgentStatusPayload["status"]) {
  if (status === "running") return "#2E7D4F";
  if (status === "paused") return "#B47A1F";
  if (status === "failed") return "#C2352C";
  if (status === "completed") return "#4B5FAE";
  return "#9F9F9E";
}

function LiveActivityStrip({
  busy,
  status,
  latestEvent,
  latestRun,
}: {
  busy: boolean;
  status?: AgentStatusPayload["status"];
  latestEvent: AgentEvent | null;
  latestRun: AgentRun | null;
}) {
  const isActive = busy || status === "running";
  if (!isActive && !latestEvent) return null;

  const headline = isActive
    ? latestEvent?.message ?? "Starting agent run…"
    : latestRun?.summary ?? latestEvent?.message ?? "Last run finished";

  const calls = latestRun?.callsAttempted ?? 0;
  const skipped = latestRun?.callsSkipped ?? 0;
  const booked = latestRun?.bookedCount ?? 0;

  const tone = isActive
    ? "border-[#C7DCE7] bg-[#EEF6FA] text-[#1F4F66]"
    : "border-hairline bg-[color:var(--elevated)] text-foreground";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-[12.5px] ${tone}`}
    >
      <div className="flex items-center gap-2">
        {isActive ? (
          <CircleNotchIcon
            size={13}
            weight="bold"
            className="animate-spin shrink-0"
            aria-hidden
          />
        ) : (
          <ShieldCheckIcon size={13} aria-hidden className="shrink-0" />
        )}
        <span className="font-medium truncate">{headline}</span>
      </div>
      {isActive && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-5 text-[11.5px] tabular-nums opacity-90">
          <span>{calls} call{calls === 1 ? "" : "s"} placed</span>
          <span>{skipped} skipped</span>
          <span>{booked} booked</span>
        </div>
      )}
    </div>
  );
}

function AgentEventIcon({ event }: { event: AgentEvent }) {
  if (event.severity === "error") {
    return <WarningCircleIcon size={13} aria-hidden />;
  }
  if (event.type === "budget_check" || event.type === "queue") {
    return <ShieldCheckIcon size={13} aria-hidden />;
  }
  if (event.type === "sms" || event.type === "report") {
    return <CalendarCheckIcon size={13} aria-hidden />;
  }
  return <ClockIcon size={13} aria-hidden />;
}

function AgentEventRow({ event }: { event: AgentEvent }) {
  const tone =
    event.severity === "error"
      ? "text-[#A32A22] bg-[#FAE3E0]"
      : event.severity === "warning"
      ? "text-[#9A6619] bg-[#F7ECD8]"
      : event.severity === "success"
      ? "text-[#2E7D4F] bg-[#E8F3EC]"
      : "text-[#4B5FAE] bg-[#E8ECFA]";

  return (
    <li className="flex gap-3 px-5 py-3">
      <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <AgentEventIcon event={event} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{event.message}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          {formatRelativeTime(event.createdAt)}
        </p>
      </div>
    </li>
  );
}

export function HomeView({
  onNavigate,
  onCall,
}: {
  onNavigate: (key: NavKey) => void;
  onCall: (lead: Lead) => void;
}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [topLeads, setTopLeads] = useState<Lead[]>([]);
  const [recentCalls, setRecentCalls] = useState<VapiCallRecord[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatusPayload | null>(null);
  const [agentBusy, setAgentBusy] = useState<"live" | "dry" | "pause" | "resume" | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testCallOpen, setTestCallOpen] = useState(false);
  const [scrapeBusy, setScrapeBusy] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const workspaceContext = useWorkspaceContext();
  const firstTargetCity = workspaceContext.onboarding?.targetCities?.[0] ?? null;

  async function runFirstScrape() {
    if (!firstTargetCity) {
      setScrapeError("Add a target city in settings before scraping.");
      return;
    }
    setScrapeBusy(true);
    setScrapeError(null);
    try {
      const res = await fetch(`/api/scrape?city=${encodeURIComponent(firstTargetCity)}`);
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
        leads?: Lead[];
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `Scrape failed (${res.status})`);
      }
      const leadsRes = await fetch("/api/leads").then((r) => r.json()).catch(() => ({ leads: [] }));
      const next = (leadsRes.leads ?? [])
        .filter((lead: Lead) => !["booked", "not_interested", "dnc"].includes(lead.status ?? "new"))
        .slice()
        .sort((x: Lead, y: Lead) => y.priorityScore - x.priorityScore)
        .slice(0, 6);
      setTopLeads(next);
      if (next.length === 0) {
        const fresh = payload.leads?.length ?? 0;
        setScrapeError(
          fresh === 0
            ? `Yelp returned no new businesses in ${firstTargetCity}. Try a different city or broaden target categories.`
            : null
        );
      }
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScrapeBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [a, l, c, agent] = await Promise.all([
        fetch("/api/analytics").then((r) => r.json()).catch(() => null),
        fetch("/api/leads").then((r) => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/calls").then((r) => r.json()).catch(() => ({ calls: [] })),
        fetch("/api/agent/status").then((r) => r.json()).catch(() => null),
      ]);
      if (cancelled) return;
      setAnalytics(a);
      setTopLeads(
        (l.leads ?? [])
          .filter((lead: Lead) => !["booked", "not_interested", "dnc"].includes(lead.status ?? "new"))
          .slice()
          .sort((x: Lead, y: Lead) => y.priorityScore - x.priorityScore)
          .slice(0, 6)
      );
      setRecentCalls((c.calls ?? []).slice(0, 5));
      setAgentStatus(agent);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tcpaOK = isInsideTcpaHours();
  const budget = agentStatus?.budget;
  const latestRun = agentStatus?.latestRun;
  const memory = agentStatus?.memory;
  const isPaused = agentStatus?.status === "paused";

  async function refreshAgentStatus() {
    const next = await fetch("/api/agent/status").then((r) => r.json());
    setAgentStatus(next);
  }

  // Poll for live updates while the agent is running or while a run/dry-run is in flight.
  // This is what surfaces "Calling X", "Skipped Y", "Booked Z" events in real time —
  // without it, the button just spins and the user has no idea what's happening.
  useEffect(() => {
    const isInFlight = agentBusy === "live" || agentBusy === "dry";
    const isRunning = agentStatus?.status === "running";
    if (!isInFlight && !isRunning) return;

    const interval = setInterval(() => {
      refreshAgentStatus().catch(() => {});
    }, 1500);
    return () => clearInterval(interval);
  }, [agentBusy, agentStatus?.status]);

  async function postAgentAction(
    url: string,
    busy: typeof agentBusy,
    body?: Record<string, unknown>
  ) {
    setAgentBusy(busy);
    setAgentError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Agent action failed");
      }
      const nextStatus = data?.settings && data?.budget ? data : data?.status;
      if (nextStatus?.settings && nextStatus?.budget) {
        setAgentStatus(nextStatus);
      } else {
        await refreshAgentStatus();
      }
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Agent action failed");
    } finally {
      setAgentBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <header>
        <p className="text-[12.5px] text-muted-foreground">Abeni&rsquo;s Workspace</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <h1 className="text-balance text-[28px] font-semibold text-foreground">
            {getGreeting("Abeni")}
          </h1>
          <div className="flex items-center gap-2 sm:pb-1.5">
            <StatusDot
              color={tcpaOK ? "#2E7D4F" : "#B47A1F"}
              label={tcpaOK ? "Within calling hours" : "Outside calling hours"}
              className="text-[12px]"
            />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader
            title="Sales rep control"
            description="AI sales rep for service records, campaigns, booking, and follow-up"
            divided={false}
            action={
              <StatusDot
                color={agentColor(agentStatus?.status)}
                label={agentStatus?.status ?? "loading"}
                className="text-[12px]"
              />
            }
          />
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-[color:var(--elevated)] p-3">
                <p className="text-[11.5px] font-medium text-muted-foreground">
                  Latest run
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-foreground">
                  {latestRun?.summary ?? "No agent run yet"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {latestRun?.startedAt ? formatRelativeTime(latestRun.startedAt) : "Ready when you are"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-[color:var(--elevated)] p-3">
                <p className="text-[11.5px] font-medium text-muted-foreground">
                  Guardrails
                </p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">
                  8am-9pm, DNC, source
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Consumer cold calls require source and consent notes
                </p>
              </div>
              <div className="rounded-lg border border-border bg-[color:var(--elevated)] p-3">
                <p className="text-[11.5px] font-medium text-muted-foreground">
                  Failure lockout
                </p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">
                  {agentStatus?.settings.failureCount ?? 0}/3 failures
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Auto-pauses if repeated runs fail
                </p>
              </div>
            </div>

            {agentError && (
              <div className="rounded-lg border border-[#E9B8B3] bg-[#FAE3E0] px-3 py-2 text-[12px] font-medium text-[#A32A22]">
                {agentError}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <PrimaryButton
                onClick={() =>
                  postAgentAction("/api/agent/run", "live", { dryRun: false })
                }
                loading={agentBusy === "live"}
                disabled={agentStatus?.status === "running" || agentBusy !== null}
                iconLeft={<PlayIcon size={12} aria-hidden />}
                className="max-sm:flex-1"
              >
                {agentBusy === "live" ? "Running…" : "Run agent"}
              </PrimaryButton>
              <GhostButton
                onClick={() =>
                  postAgentAction("/api/agent/run", "dry", { dryRun: true })
                }
                loading={agentBusy === "dry"}
                disabled={agentStatus?.status === "running" || agentBusy !== null}
                iconLeft={<ShieldCheckIcon size={12} aria-hidden />}
                className="max-sm:flex-1"
              >
                {agentBusy === "dry" ? "Checking…" : "Dry run"}
              </GhostButton>
              {isPaused ? (
                <GhostButton
                  onClick={() => postAgentAction("/api/agent/resume", "resume")}
                  loading={agentBusy === "resume"}
                  iconLeft={<PlayIcon size={12} aria-hidden />}
                  className="max-sm:flex-1"
                >
                  Resume
                </GhostButton>
              ) : (
                <GhostButton
                  onClick={() => postAgentAction("/api/agent/pause", "pause")}
                  loading={agentBusy === "pause"}
                  iconLeft={<PauseIcon size={12} aria-hidden />}
                  className="max-sm:flex-1"
                >
                  Pause
                </GhostButton>
              )}
              <GhostButton
                onClick={() => setTestCallOpen(true)}
                iconLeft={<PhoneOutgoingIcon size={12} aria-hidden />}
                className="max-sm:flex-1"
              >
                Voice demo
              </GhostButton>
              <GhostButton
                onClick={refreshAgentStatus}
                iconLeft={<ArrowClockwiseIcon size={12} aria-hidden />}
                className="max-sm:flex-1"
              >
                Refresh
              </GhostButton>
            </div>

            <LiveActivityStrip
              busy={agentBusy === "live" || agentBusy === "dry"}
              status={agentStatus?.status}
              latestEvent={agentStatus?.recentEvents?.[0] ?? null}
              latestRun={agentStatus?.latestRun ?? null}
            />
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader title="Daily budget" description="Default cap: 20 calls / $5" />
            <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-foreground">Calls</span>
                  <span className="tabular-nums text-muted-foreground">
                    {budget?.callsUsed ?? 0}/{budget?.maxCalls ?? 20}
                  </span>
                </div>
                <ProgressBar value={percent(budget?.callsUsed ?? 0, budget?.maxCalls ?? 20)} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-foreground">Spend</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCents(budget?.costUsedCents ?? 0)}/{formatCents(budget?.maxCostCents ?? 500)}
                  </span>
                </div>
                <ProgressBar
                  value={percent(budget?.costUsedCents ?? 0, budget?.maxCostCents ?? 500)}
                />
              </div>
            </div>
          </Card>

          <VoiceDemoCard onOpen={() => setTestCallOpen(true)} />

          <Card>
            <CardHeader title="CRM memory" description="Every service lead, call, and next step" />
            <div className="grid grid-cols-3 gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
              <div>
                <p className="text-[20px] font-semibold tabular-nums text-foreground">
                  {memory?.totalKnown ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Known</p>
              </div>
              <div>
                <p className="text-[20px] font-semibold tabular-nums text-foreground">
                  {memory?.contacted ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Contacted</p>
              </div>
              <div>
                <p className="text-[20px] font-semibold tabular-nums text-foreground">
                  {memory?.doNotCall ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">DNC</p>
              </div>
              <div className="col-span-3 flex items-start gap-2 rounded-lg border border-border bg-[color:var(--elevated)] p-3">
                <TrendUpIcon size={15} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-foreground">
                    {memory?.topPerformer?.label ?? "No performer yet"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {memory?.topPerformer
                      ? `${memory.topPerformer.booked}/${memory.topPerformer.total} booked`
                      : "Bookings will surface the best city/category pair."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Active campaigns"
          value={3}
          delta="Warm, B2B, consumer locked"
        />
        <StatCard
          label="Booked jobs"
          value={analytics?.bookedLeads ?? analytics?.bookedThisWeek ?? 0}
          delta="Written back to CRM"
        />
        <StatCard
          label="Revenue recovery"
          value="$0"
          delta="Estimate values unlock this"
        />
      </section>

      <Card>
        <CardHeader
          title="Agent activity"
          description="Every campaign run, skip, budget check, call, booking, and opt-out lands here"
          action={
            <GhostButton
              onClick={() => onNavigate("Campaigns")}
              iconRight={<ArrowRightIcon size={11} />}
            >
              Campaigns
            </GhostButton>
          }
        />
        {loading ? (
          <LoadingState label="Loading agent log…" />
        ) : !agentStatus?.recentEvents.length ? (
          <EmptyState
            icon={DatabaseIcon}
            title="No agent events yet"
            description="Run a dry run to see which CRM records pass or fail guardrails."
            compact
          />
        ) : (
          <ul className="divide-y divide-hairline">
            {agentStatus.recentEvents.slice(0, 6).map((event) => (
              <AgentEventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </Card>

      {/* Stat row */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CRM records"
          value={analytics?.totalLeads ?? 0}
          delta="Service contacts and prospects"
        />
        <StatCard
          label="Calls today"
          value={analytics?.callsToday ?? 0}
          delta={`${analytics?.callsToday ?? 0} outbound`}
        />
        <StatCard
          label="Booked jobs"
          value={analytics?.bookedThisWeek ?? 0}
          delta="On the calendar"
        />
        <StatCard
          label="Conversion"
          value={`${analytics?.conversionRate ?? 0}%`}
          delta={
            analytics?.endedCalls
              ? `${analytics.endedCalls} completed calls`
              : "No calls yet"
          }
        />
      </section>

      {/* Two-col */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        {/* Priority queue */}
        <Card>
          <CardHeader
            title="Priority service queue"
            description="Highest-scoring opportunities ready for the rep"
            action={
              <GhostButton
                onClick={() => onNavigate("CRM")}
                iconRight={<ArrowRightIcon size={11} />}
              >
                CRM
              </GhostButton>
            }
          />
          {loading ? (
            <LoadingState />
          ) : topLeads.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No service leads yet"
              description={
                firstTargetCity
                  ? `Scrape your first batch of businesses in ${firstTargetCity} to populate the queue.`
                  : "Add a target city in settings, then scrape your first batch to populate the queue."
              }
              action={
                <div className="flex flex-col items-center gap-2">
                  <PrimaryButton
                    onClick={runFirstScrape}
                    loading={scrapeBusy}
                    disabled={scrapeBusy || !firstTargetCity}
                    iconLeft={<MagnifyingGlassIcon size={12} aria-hidden />}
                  >
                    {scrapeBusy
                      ? "Scraping…"
                      : firstTargetCity
                      ? `Scrape ${firstTargetCity}`
                      : "Add a city in settings"}
                  </PrimaryButton>
                  {scrapeError && (
                    <p className="text-[11.5px] text-[#A32A22]">{scrapeError}</p>
                  )}
                </div>
              }
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {topLeads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 row-hover transition-colors sm:px-5"
                >
                  <ScorePill score={lead.priorityScore} />
                  <div className="min-w-[12rem] flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {lead.name}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground truncate">
                      {lead.category} · {lead.city}
                      {lead.campaignLane ? ` · ${CAMPAIGN_LANE_LABELS[lead.campaignLane]}` : ""}
                    </p>
                  </div>
                  <WebsiteBadge status={lead.websiteStatus} />
                  <LifecycleBadge status={lead.status ?? "new"} />
                  <button
                    onClick={() => onCall(lead)}
                    className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border px-2.5 text-[11.5px] font-medium text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-[color:var(--primary-foreground)]"
                  >
                    <PhoneIcon size={11} aria-hidden />
                    Call
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent calls */}
        <Card>
          <CardHeader
            title="Recent calls"
            count={recentCalls.length}
            action={
              <GhostButton
                onClick={() => onNavigate("Calls")}
                iconRight={<ArrowRightIcon size={11} />}
              >
                All
              </GhostButton>
            }
          />
          {recentCalls.length === 0 ? (
            <EmptyState
              icon={PhoneCallIcon}
              title="No calls yet"
              description="Run a campaign or call a CRM record to see it here."
              compact
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {recentCalls.map((call) => {
                const outcome = call.endedReason ?? call.status;
                const color = outcome?.includes("voicemail")
                  ? "#B47A1F"
                  : outcome?.includes("no-answer") || outcome?.includes("busy")
                  ? "#9F9F9E"
                  : outcome?.includes("error") || outcome?.includes("failed")
                  ? "#C2352C"
                  : "#2E7D4F";
                return (
                  <li
                    key={call.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {call.metadata?.businessName ?? "Unknown"}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ClockIcon size={10} aria-hidden />
                        {call.startedAt
                          ? formatRelativeTime(call.startedAt)
                          : "—"}
                      </p>
                    </div>
                    <StatusDot
                      color={color}
                      label={outcome?.replace(/-/g, " ")}
                      className="text-[11.5px] shrink-0"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <TestCallDialog
        open={testCallOpen}
        onClose={() => setTestCallOpen(false)}
      />
    </div>
  );
}
