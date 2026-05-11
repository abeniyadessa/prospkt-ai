"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  PhoneCallIcon,
  CircleNotchIcon,
  StopIcon,
  WarningIcon,
  PhoneIcon,
  ArrowClockwiseIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import type { Lead, LeadStatus } from "@/lib/types";
import {
  CAMPAIGN_LANE_LABELS,
  CONTACT_TYPE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/types";
import { MICHIGAN_CITIES } from "@/lib/constants";
import {
  Card,
  EmptyState,
  GhostButton,
  LifecycleBadge,
  LoadingState,
  PrimaryButton,
  PageHeader,
  ScorePill,
  SearchInput,
  Select,
  WebsiteBadge,
} from "@/components/app/primitives";

type WebsiteFilter = "all" | "none" | "outdated" | "modern";
type ScoreFilter = "all" | "high" | "mid" | "low";
type StatusFilter = "active" | "all" | LeadStatus;

const terminalStatuses = new Set<LeadStatus>(["booked", "not_interested", "dnc"]);

export function LeadsView({
  onOpenLead,
  onCall,
  refreshKey = 0,
}: {
  onOpenLead: (lead: Lead) => void;
  onCall: (lead: Lead) => void;
  refreshKey?: number;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>("all");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const [scrapeCity, setScrapeCity] = useState<string>("Grand Rapids");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [lastScraped, setLastScraped] = useState<{ city: string; count: number } | null>(null);

  const [autoDialing, setAutoDialing] = useState(false);
  const [autoDialStop, setAutoDialStop] = useState(false);
  const [autoDialProgress, setAutoDialProgress] = useState<{
    current: number;
    total: number;
    lead: string;
    status: string;
  } | null>(null);

  const [bizQuery, setBizQuery] = useState("");
  const [bizCity, setBizCity] = useState<string>("Grand Rapids");
  const [bizResults, setBizResults] = useState<Lead[]>([]);
  const [bizSearching, setBizSearching] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = (await res.json()) as { leads: Lead[] };
      setLeads(data.leads ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  const categories = useMemo(() => {
    const set = new Set(leads.map((l) => l.category));
    return ["all", ...Array.from(set).sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (websiteFilter !== "all" && l.websiteStatus !== websiteFilter) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      const status = l.status ?? "new";
      if (statusFilter === "active" && terminalStatuses.has(status)) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && status !== statusFilter) return false;
      if (scoreFilter === "high" && l.priorityScore < 8) return false;
      if (scoreFilter === "mid" && (l.priorityScore < 5 || l.priorityScore >= 8)) return false;
      if (scoreFilter === "low" && l.priorityScore >= 5) return false;
      if (q) {
        const hay = `${l.name} ${l.category} ${l.city} ${l.phone} ${l.source ?? ""} ${
          l.serviceNeed ?? ""
        } ${l.serviceArea ?? ""} ${l.campaignLane ? CAMPAIGN_LANE_LABELS[l.campaignLane] : ""} ${
          LEAD_STATUS_LABELS[status]
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, websiteFilter, categoryFilter, scoreFilter, statusFilter]);

  const callableFiltered = useMemo(
    () => filtered.filter((lead) => !terminalStatuses.has(lead.status ?? "new")),
    [filtered]
  );

  async function updateLeadStatus(lead: Lead, status: LeadStatus) {
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? { ...item, status, statusUpdatedAt: new Date().toISOString() }
          : item
      )
    );
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status }),
      });
      if (!res.ok) await fetchLeads();
    } catch {
      await fetchLeads();
    }
  }

  async function runScraper() {
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch(
        `/api/scrape?city=${encodeURIComponent(scrapeCity)}`
      );
      const data = (await res.json()) as { leads?: Lead[]; error?: string };
      if (!res.ok || data.error) {
        setScrapeError(data.error ?? "Unknown error");
        return;
      }
      await fetchLeads();
      setLastScraped({ city: scrapeCity, count: data.leads?.length ?? 0 });
    } catch {
      setScrapeError("Network error — is the dev server running?");
    } finally {
      setScraping(false);
    }
  }

  async function startAutoDial() {
    if (callableFiltered.length === 0) return;
    setAutoDialing(true);
    setAutoDialStop(false);
    const queue = [...callableFiltered].sort((a, b) => b.priorityScore - a.priorityScore);

    for (let i = 0; i < queue.length; i++) {
      if (autoDialStop) break;
      const lead = queue[i];
      setAutoDialProgress({
        current: i + 1,
        total: queue.length,
        lead: lead.name,
        status: "Queued...",
      });

      try {
        await updateLeadStatus(lead, "queued");
        setAutoDialProgress((p) => (p ? { ...p, status: "Dialing..." } : p));

        const res = await fetch("/api/vapi/outbound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            phone: lead.phone,
            name: lead.name,
            category: lead.category,
            city: lead.city,
            websiteStatus: lead.websiteStatus,
            priorityScore: lead.priorityScore,
          }),
        });
        const data = (await res.json()) as { callId?: string; error?: string };
        if (!res.ok || !data.callId) {
          setAutoDialProgress((p) =>
            p ? { ...p, status: `Skipped — ${data.error ?? "error"}` } : p
          );
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        setAutoDialProgress((p) => (p ? { ...p, status: "In call…" } : p));
        const deadline = Date.now() + 210_000;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 8000));
          if (autoDialStop) break;
          try {
            const sRes = await fetch(`/api/vapi/call/${data.callId}`);
            const sData = (await sRes.json()) as {
              status?: string;
              endedReason?: string;
            };
            if (sData.status === "ended" || sData.endedReason) break;
          } catch {
            break;
          }
        }
        setAutoDialProgress((p) => (p ? { ...p, status: "Done — waiting…" } : p));
        await new Promise((r) => setTimeout(r, 5000));
      } catch {
        setAutoDialProgress((p) =>
          p ? { ...p, status: "Error — skipping" } : p
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    setAutoDialing(false);
    setAutoDialProgress(null);
    setAutoDialStop(false);
  }

  async function searchBusiness() {
    if (!bizQuery.trim()) return;
    setBizSearching(true);
    setBizError(null);
    setBizResults([]);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(bizQuery)}&city=${encodeURIComponent(bizCity)}`
      );
      const data = (await res.json()) as { results?: Lead[]; error?: string };
      if (!res.ok || data.error) {
        setBizError(data.error ?? "Search failed");
        return;
      }
      setBizResults(data.results ?? []);
    } catch (err) {
      setBizError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBizSearching(false);
    }
  }

  const activeFilters =
    (websiteFilter !== "all" ? 1 : 0) +
    (scoreFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "active" ? 1 : 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description={
          <>
            {leads.length} service-sales records
            {lastScraped && (
              <>
                {" · "}
                <span style={{ color: "#2E7D4F" }}>
                  {lastScraped.count} new business records from {lastScraped.city}
                </span>
              </>
            )}
          </>
        }
        actions={
          <>
            <Select
              value={scrapeCity}
              onChange={setScrapeCity}
              options={MICHIGAN_CITIES.map((c) => ({ value: c, label: `${c}, MI` }))}
              label="Scrape city"
              disabled={scraping}
            />
            <PrimaryButton
              onClick={runScraper}
              loading={scraping}
              iconLeft={!scraping ? <SparkleIcon size={11} weight="fill" /> : undefined}
            >
              {scraping ? "Finding…" : "Find businesses"}
            </PrimaryButton>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search contact, service need, source, phone…"
            className="min-w-[220px] flex-1 lg:max-w-md"
          />

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <SlidersHorizontalIcon size={13} color="#9F9F9E" aria-hidden />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={[
                { value: "active" as const, label: "Active records" },
                { value: "all" as const, label: "All statuses" },
                ...Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
                  value: value as LeadStatus,
                  label,
                })),
              ]}
              label="Status filter"
            />
            <Select
              value={websiteFilter}
              onChange={(v) => setWebsiteFilter(v as WebsiteFilter)}
              options={[
                { value: "all" as const, label: "All website fits" },
                { value: "none" as const, label: "No website" },
                { value: "outdated" as const, label: "Outdated" },
                { value: "modern" as const, label: "Modern" },
              ]}
              label="Website filter"
            />
            <Select
              value={scoreFilter}
              onChange={(v) => setScoreFilter(v as ScoreFilter)}
              options={[
                { value: "all" as const, label: "All scores" },
                { value: "high" as const, label: "High (8–10)" },
                { value: "mid" as const, label: "Medium (5–7)" },
                { value: "low" as const, label: "Low (1–4)" },
              ]}
              label="Score filter"
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map((c) => ({
                value: c,
                label: c === "all" ? "All services" : c,
              }))}
              label="Category filter"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5 max-lg:ml-0">
            <GhostButton
              onClick={fetchLeads}
              iconLeft={<ArrowClockwiseIcon size={12} />}
              aria-label="Refresh leads"
            >
              Refresh
            </GhostButton>
            {autoDialing ? (
              <button
                onClick={() => setAutoDialStop(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(194,53,44,0.3)] bg-[rgba(194,53,44,0.04)] px-3 text-[12.5px] font-medium text-[#C2352C] transition-colors hover:bg-[rgba(194,53,44,0.08)]"
              >
                <StopIcon size={11} weight="fill" />
                Stop dialer
              </button>
            ) : (
              <PrimaryButton
                onClick={startAutoDial}
                disabled={callableFiltered.length === 0}
                iconLeft={<PhoneCallIcon size={11} weight="fill" />}
              >
                Dial {callableFiltered.length} {callableFiltered.length === 1 ? "record" : "records"}
              </PrimaryButton>
            )}
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-2 text-[12px] text-muted-foreground" style={{ backgroundColor: "var(--elevated)" }}>
            <span>
              Showing{" "}
              <span className="text-foreground font-medium tabular-nums">
                {filtered.length}
              </span>{" "}
              of {leads.length}
            </span>
            <button
              onClick={() => {
                setWebsiteFilter("all");
                setScoreFilter("all");
                setCategoryFilter("all");
                setStatusFilter("active");
              }}
              className="text-foreground font-medium hover:underline"
            >
              Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
            </button>
          </div>
        )}

        {scrapeError && (
          <div
            className="flex items-center gap-2 px-5 py-3 text-[12.5px] border-b border-hairline"
            style={{
              backgroundColor: "rgba(194,53,44,0.05)",
              color: "#A32A22",
            }}
            role="alert"
          >
            <WarningIcon size={13} weight="fill" aria-hidden />
            {scrapeError}
          </div>
        )}

        {autoDialProgress && (
          <div className="flex items-center gap-4 border-b border-hairline px-4 py-3 sm:px-5" style={{ backgroundColor: "var(--elevated)" }}>
            <CircleNotchIcon
              size={14}
              className="animate-spin shrink-0"
              color="#0A0A0A"
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-medium text-foreground truncate">
                  {autoDialProgress.lead}{" "}
                  <span className="text-muted-foreground">
                    — {autoDialProgress.status}
                  </span>
                </span>
                <span className="text-[11.5px] tabular-nums text-muted-foreground ml-3 shrink-0">
                  {autoDialProgress.current} / {autoDialProgress.total}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--hairline)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: "#0A0A0A",
                    width: `${(autoDialProgress.current / autoDialProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading CRM records…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={leads.length === 0 ? "No CRM records yet" : "No matching records"}
            description={
              leads.length === 0
                ? "Add warm records or find businesses for a campaign lane."
                : "Try adjusting your filters or search."
            }
          />
        ) : (
          <LeadsTable
            leads={filtered}
            onOpenLead={onOpenLead}
            onCall={onCall}
            onStatusChange={updateLeadStatus}
          />
        )}
      </Card>

      {/* Business search */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground">
            Find a business record
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Pull a specific service business from Yelp and save source context before outreach.
          </p>
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
            <div className="relative min-w-[220px] flex-1 lg:max-w-md">
              <MagnifyingGlassIcon
                size={14}
                color="#9F9F9E"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden
              />
              <input
                type="search"
                placeholder="e.g. Joe's Auto Repair"
                value={bizQuery}
                onChange={(e) => setBizQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBusiness()}
                className="w-full h-8 rounded-lg border border-border bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
              />
            </div>
            <Select
              value={bizCity}
              onChange={setBizCity}
              options={MICHIGAN_CITIES.map((c) => ({
                value: c,
                label: `${c}, MI`,
              }))}
              label="Search city"
            />
            <PrimaryButton
              onClick={searchBusiness}
              loading={bizSearching}
              disabled={!bizQuery.trim()}
              iconRight={!bizSearching ? <ArrowRightIcon size={11} /> : undefined}
            >
              {bizSearching ? "Searching…" : "Search"}
            </PrimaryButton>
          </div>

          {bizError && (
            <div
              className="flex items-center gap-2 px-5 py-3 text-[12.5px]"
              style={{
                backgroundColor: "rgba(194,53,44,0.05)",
                color: "#A32A22",
              }}
              role="alert"
            >
              <WarningIcon size={13} weight="fill" aria-hidden />
              {bizError}
            </div>
          )}

          {bizSearching ? (
            <LoadingState label="Searching Yelp…" />
          ) : bizResults.length === 0 && !bizError ? (
            <EmptyState
              icon={MagnifyingGlassIcon}
              title="Enter a business name"
              description="Press Search to pull phone numbers and start a business CRM record."
              compact
            />
          ) : bizResults.length > 0 ? (
            <>
              <LeadsTable leads={bizResults} onOpenLead={onOpenLead} onCall={onCall} />
              <p className="px-5 py-3 text-[11.5px] text-muted-foreground border-t border-hairline">
                {bizResults.length} result
                {bizResults.length !== 1 ? "s" : ""} with phone numbers
              </p>
            </>
          ) : null}
        </Card>
      </section>
    </div>
  );
}

/* ─── CRM table ───────────────────────────────────────────────────────────── */

function LeadsTable({
  leads,
  onOpenLead,
  onCall,
  onStatusChange,
}: {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onCall: (lead: Lead) => void;
  onStatusChange?: (lead: Lead, status: LeadStatus) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ backgroundColor: "var(--elevated)" }}>
            {["Contact", "Status", "Lane", "Service need", "Area", "Phone", "Web", "Score", ""].map(
              (h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-2 text-left text-[11px] font-medium text-muted-foreground sm:px-5"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-t border-hairline hover:bg-[color:var(--elevated)] transition-colors cursor-pointer"
              onClick={() => onOpenLead(lead)}
            >
              <td className="max-w-[18rem] px-4 py-3 font-medium text-foreground sm:px-5">
                <span className="block truncate">{lead.name}</span>
                <span className="mt-0.5 block truncate text-[11.5px] font-normal text-muted-foreground">
                  {CONTACT_TYPE_LABELS[lead.contactType ?? "business"]}
                  {lead.source ? ` / ${lead.source}` : ""}
                </span>
              </td>
              <td className="px-4 py-3 sm:px-5">
                {onStatusChange ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status ?? "new"}
                      onChange={(status) => onStatusChange(lead, status)}
                      options={Object.entries(LEAD_STATUS_LABELS).map(
                        ([value, label]) => ({
                          value: value as LeadStatus,
                          label,
                        })
                      )}
                      className="h-7 min-w-36 rounded-md text-[11.5px]"
                      label={`Update ${lead.name} status`}
                    />
                  </div>
                ) : (
                  <LifecycleBadge status={lead.status ?? "new"} />
                )}
              </td>
              <td className="max-w-[11rem] px-4 py-3 text-muted-foreground sm:px-5">
                <span className="block truncate">
                  {lead.campaignLane ? CAMPAIGN_LANE_LABELS[lead.campaignLane] : "Cold B2B"}
                </span>
              </td>
              <td className="max-w-[14rem] px-4 py-3 text-muted-foreground sm:px-5">
                <span className="block truncate">{lead.serviceNeed ?? lead.category}</span>
                <span className="mt-0.5 block truncate text-[11px] text-subtle">
                  {lead.estimateValueCents != null
                    ? formatMoney(lead.estimateValueCents)
                    : lead.category}
                </span>
              </td>
              <td className="max-w-[12rem] px-4 py-3 text-muted-foreground sm:px-5">
                <span className="block truncate">{lead.serviceArea ?? lead.city}</span>
              </td>
              <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-muted-foreground sm:px-5">
                {lead.phone}
              </td>
              <td className="px-4 py-3 sm:px-5">
                <WebsiteBadge status={lead.websiteStatus} />
              </td>
              <td className="px-4 py-3 sm:px-5">
                <ScorePill score={lead.priorityScore} />
              </td>
              <td className="px-4 py-3 text-right sm:px-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall(lead);
                  }}
                  className="inline-flex items-center gap-1 h-7 rounded-md border border-border px-2.5 text-[11.5px] font-medium text-foreground hover:bg-foreground hover:text-[color:var(--primary-foreground)] hover:border-foreground transition-colors"
                >
                  <PhoneIcon size={11} aria-hidden />
                  Call
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
