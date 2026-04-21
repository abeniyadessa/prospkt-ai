"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HouseIcon,
  UsersIcon,
  PhoneIcon,
  CalendarIcon,
  GearIcon,
  QuestionIcon,
  CrosshairIcon,
  TrendUpIcon,
  CalendarCheckIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CircleNotchIcon,
  WarningIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  RecordIcon,
  TrashIcon,
  PlusIcon,
  RobotIcon,
  PhoneCallIcon,
  LinkIcon,
  StarIcon,
  MapPinIcon,
  ArrowSquareOutIcon,
  TextAlignLeftIcon,
  XIcon,
  FloppyDiskIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
  websiteStatus: "none" | "outdated" | "modern";
  priorityScore: number;
  scrapedAt: string;
}

interface CallActivity {
  id: string;
  businessName: string;
  outcome: "Booked" | "No Answer" | "Not Interested";
  timeAgo: string;
}

interface Appointment {
  id: string;
  business: string;
  date: string;
  time: string;
}

interface VapiCallRecord {
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

interface CalBooking {
  id: number;
  uid: string;
  title: string;
  start: string;
  end: string;
  status: string;
  attendees: { name: string; email: string; timeZone: string }[];
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const mainNav = [
  { icon: HouseIcon, label: "Home" },
  { icon: UsersIcon, label: "Leads" },
  { icon: PhoneIcon, label: "Calls" },
  { icon: CalendarIcon, label: "Appointments" },
];

const settingsNav = [
  { icon: GearIcon, label: "Settings" },
  { icon: QuestionIcon, label: "Help" },
];

const MICHIGAN_CITIES = [
  "Detroit",
  "Grand Rapids",
  "Ann Arbor",
  "Lansing",
  "Flint",
  "Kalamazoo",
  "Sterling Heights",
  "Warren",
  "Dearborn",
  "Livonia",
  "Troy",
  "Westland",
  "Farmington Hills",
  "Rochester Hills",
  "Pontiac",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 8
      ? "bg-[#8B9E3E]/15 text-[#8B9E3E]"
      : score >= 5
      ? "bg-[#E8A030]/15 text-[#E8A030]"
      : "bg-[#E8706A]/15 text-[#E8706A]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        cls
      )}
    >
      {score}
    </span>
  );
}

function WebsiteBadge({ status }: { status: Lead["websiteStatus"] }) {
  const map = {
    none: { dot: "bg-[#E8706A]", label: "None" },
    outdated: { dot: "bg-[#E8A030]", label: "Outdated" },
    modern: { dot: "bg-[#8B9E3E]", label: "Modern" },
  };
  const { dot, label } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#6B6B6B" }}>
      <span className={cn("size-2 rounded-full shrink-0", dot)} role="img" aria-label={label} />
      {label}
    </span>
  );
}

function SectionCard({
  title,
  count,
  children,
  action,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#F0F0F0" }}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[15px] text-balance" style={{ color: "#0A0A0A" }}>
            {title}
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
            style={{ backgroundColor: "#F5F0E8", color: "#6B6B6B" }}
          >
            {count}
          </span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptySlate({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <Icon size={22} color="#ABABAB" weight="regular" aria-hidden="true" />
      <p className="text-xs" style={{ color: "#ABABAB" }}>
        {label}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Home");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls] = useState<CallActivity[]>([]);
  const [appointments] = useState<Appointment[]>([]);
  const [selectedCity, setSelectedCity] = useState("Grand Rapids");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [lastScrapedCity, setLastScrapedCity] = useState<string | null>(null);

  // Leads page — server data
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");

  // Business search
  const [bizQuery, setBizQuery] = useState("");
  const [bizCity, setBizCity] = useState("Grand Rapids");
  const [bizResults, setBizResults] = useState<Lead[]>([]);
  const [bizSearching, setBizSearching] = useState(false);
  const [bizError, setBizError] = useState<string | null>(null);

  // Calls page
  const [vapiCalls, setVapiCalls] = useState<VapiCallRecord[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<{
    totalLeads: number;
    callsToday: number;
    bookedThisWeek: number;
    conversionRate: number;
  } | null>(null);

  // Auto-dialer
  const [autoDialing, setAutoDialing] = useState(false);
  const [autoDialStop, setAutoDialStop] = useState(false);
  const [autoDialProgress, setAutoDialProgress] = useState<{ current: number; total: number; lead: string; status: string } | null>(null);

  // Transcript viewer
  const [transcriptCall, setTranscriptCall] = useState<VapiCallRecord | null>(null);

  // Lead detail drawer
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  // Script editor (Settings)
  const [scriptSuffix, setScriptSuffix] = useState("");
  const [firstMsgTemplate, setFirstMsgTemplate] = useState("");
  const [scriptSaving, setScriptSaving] = useState(false);
  const [scriptSaved, setScriptSaved] = useState(false);

  // Appointments page
  const [calBookings, setCalBookings] = useState<CalBooking[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Settings page
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});
  const [callerInfo, setCallerInfo] = useState<Record<string, string | null>>({});
  const [dncList, setDncList] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [newDncPhone, setNewDncPhone] = useState("");
  const [dncAdding, setDncAdding] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = (await res.json()) as { leads: Lead[] };
      setAllLeads(data.leads ?? []);
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    setCallsLoading(true);
    try {
      const res = await fetch("/api/calls");
      const data = (await res.json()) as { calls: VapiCallRecord[] };
      setVapiCalls(data.calls ?? []);
    } finally {
      setCallsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json() as { totalLeads: number; callsToday: number; bookedThisWeek: number; conversionRate: number };
      setAnalytics(data);
    } catch {
      // non-fatal
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const [statusRes, dncRes, scriptRes] = await Promise.all([
        fetch("/api/settings/status"),
        fetch("/api/dnc"),
        fetch("/api/settings/script"),
      ]);
      const statusData = (await statusRes.json()) as { integrations: Record<string, boolean>; caller: Record<string, string | null> };
      const dncData = (await dncRes.json()) as { numbers: string[] };
      const scriptData = (await scriptRes.json()) as { systemPromptSuffix: string; firstMessageTemplate: string };
      setIntegrations(statusData.integrations ?? {});
      setCallerInfo(statusData.caller ?? {});
      setDncList(dncData.numbers ?? []);
      setScriptSuffix(scriptData.systemPromptSuffix ?? "");
      setFirstMsgTemplate(scriptData.firstMessageTemplate ?? "");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = (await res.json()) as { appointments: CalBooking[] };
      setCalBookings(data.appointments ?? []);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeNav === "Home") fetchAnalytics();
    if (activeNav === "Leads") fetchLeads();
    if (activeNav === "Calls") fetchCalls();
    if (activeNav === "Appointments") fetchAppointments();
    if (activeNav === "Settings") fetchSettings();
  }, [activeNav, fetchAnalytics, fetchLeads, fetchCalls, fetchAppointments, fetchSettings]);

  // Dial dialog
  const [dialLead, setDialLead] = useState<Lead | null>(null);
  const [dialPhone, setDialPhone] = useState("");
  const [dialing, setDialing] = useState(false);
  const [dialResult, setDialResult] = useState<{ callId: string } | null>(null);
  const [dialError, setDialError] = useState<string | null>(null);

  async function startAutoDial(leads: Lead[]) {
    if (leads.length === 0) return;
    setAutoDialing(true);
    setAutoDialStop(false);

    const queue = [...leads].sort((a, b) => b.priorityScore - a.priorityScore);

    for (let i = 0; i < queue.length; i++) {
      if (autoDialStop) break;

      const lead = queue[i];
      setAutoDialProgress({ current: i + 1, total: queue.length, lead: lead.name, status: "Dialing…" });

      try {
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
          setAutoDialProgress((p) => p && ({ ...p, status: `Skipped — ${data.error ?? "error"}` }));
          await delay(3000);
          continue;
        }

        // Poll until the call ends (max 3 min + 30s buffer)
        setAutoDialProgress((p) => p && ({ ...p, status: "In call…" }));
        const callId = data.callId;
        const deadline = Date.now() + 210_000; // 3.5 min

        while (Date.now() < deadline) {
          await delay(8000);
          if (autoDialStop) break;
          try {
            const statusRes = await fetch(`/api/vapi/call/${callId}`);
            const callData = (await statusRes.json()) as { status?: string; endedReason?: string };
            if (callData.status === "ended" || callData.endedReason) break;
          } catch {
            break;
          }
        }

        setAutoDialProgress((p) => p && ({ ...p, status: "Done — waiting…" }));
        await delay(5000); // brief gap between calls
      } catch {
        setAutoDialProgress((p) => p && ({ ...p, status: "Error — skipping" }));
        await delay(3000);
      }
    }

    setAutoDialing(false);
    setAutoDialProgress(null);
    setAutoDialStop(false);
  }

  function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  async function searchBusinesses() {
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

  async function runScraper() {
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch(`/api/scrape?city=${encodeURIComponent(selectedCity)}`);
      const data = (await res.json()) as { leads?: Lead[]; error?: string };
      if (!res.ok || data.error) {
        setScrapeError(data.error ?? "Unknown error");
        return;
      }
      if (data.leads) {
        setLeads((prev) => {
          const existingKeys = new Set(prev.map((l) => `${l.name}|${l.city}`));
          const newOnes = data.leads!.filter((l) => !existingKeys.has(`${l.name}|${l.city}`));
          return [...prev, ...newOnes].sort((a, b) => b.priorityScore - a.priorityScore);
        });
        setLastScrapedCity(selectedCity);
      }
    } catch {
      setScrapeError("Network error — is the dev server running?");
    } finally {
      setScraping(false);
    }
  }

  function openDialDialog(lead: Lead) {
    setDialLead(lead);
    setDialPhone(lead.phone);
    setDialResult(null);
    setDialError(null);
  }

  async function startCall() {
    if (!dialLead) return;
    setDialing(true);
    setDialError(null);
    setDialResult(null);
    try {
      const res = await fetch("/api/vapi/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: dialLead.id,
          name: dialLead.name,
          category: dialLead.category,
          city: dialLead.city,
          websiteStatus: dialLead.websiteStatus,
          priorityScore: dialLead.priorityScore,
          phone: dialPhone,
        }),
      });
      const data = (await res.json()) as { callId?: string; error?: string };
      if (!res.ok || data.error) {
        setDialError(data.error ?? "Unknown error");
      } else {
        setDialResult({ callId: data.callId! });
      }
    } catch {
      setDialError("Network error — check your connection");
    } finally {
      setDialing(false);
    }
  }

  const bookedCount = appointments.length;
  const conversionPct =
    calls.length > 0 ? Math.round((bookedCount / calls.length) * 100) : 0;

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "#F5F0E8" }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col w-60 shrink-0 overflow-y-auto"
        style={{ backgroundColor: "#0A0A0A" }}
      >
        {/* Logo */}
        <div className="flex items-center px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Prospkt"
            style={{ width: 140, mixBlendMode: "screen" }}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-6" aria-label="Main navigation">
          <div>
            <p
              className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#444" }}
            >
              Main
            </p>
            <ul role="list" className="space-y-0.5">
              {mainNav.map(({ icon: Icon, label }) => {
                const active = activeNav === label;
                return (
                  <li key={label}>
                    <button
                      onClick={() => setActiveNav(label)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left",
                        active
                          ? "text-white font-medium"
                          : "text-[#888] hover:text-white hover:bg-[#1A1A1A]"
                      )}
                      style={active ? { backgroundColor: "#1F1F1F" } : undefined}
                    >
                      <Icon size={18} weight={active ? "fill" : "regular"} />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p
              className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#444" }}
            >
              Settings
            </p>
            <ul role="list" className="space-y-0.5">
              {settingsNav.map(({ icon: Icon, label }) => {
                const active = activeNav === label;
                return (
                  <li key={label}>
                    <button
                      onClick={() => setActiveNav(label)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left",
                        active
                          ? "text-white font-medium"
                          : "text-[#888] hover:text-white hover:bg-[#1A1A1A]"
                      )}
                      style={active ? { backgroundColor: "#1F1F1F" } : undefined}
                    >
                      <Icon size={18} weight={active ? "fill" : "regular"} />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User footer */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-t"
          style={{
            borderColor: "#1F1F1F",
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="size-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "#E8706A" }}
            aria-hidden="true"
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Abeni</p>
            <p className="text-[11px] truncate" style={{ color: "#555" }}>
              YALID LLC
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" id="main-content">
        <div className="p-8 max-w-[1200px] space-y-6">

        {/* ── Leads view ─────────────────────────────────────────────────── */}
        {activeNav === "Leads" && (
          <>
            <div>
              <h1 className="text-[32px] font-bold leading-tight" style={{ color: "#0A0A0A" }}>Lead Queue</h1>
              <p className="mt-1 text-sm" style={{ color: "#ABABAB" }}>{allLeads.length} leads scraped</p>
            </div>

            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                <div className="relative flex-1 max-w-xs">
                  <MagnifyingGlassIcon size={15} color="#ABABAB" className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search leads…"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    className="w-full rounded-full border pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={scraping}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium appearance-none cursor-pointer disabled:opacity-50"
                    style={{ borderColor: "#E0E0E0", color: "#6B6B6B", backgroundColor: "#fff" }}
                    aria-label="Select city"
                  >
                    {MICHIGAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}, MI</option>
                    ))}
                  </select>
                  <button
                    onClick={runScraper}
                    disabled={scraping}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-60"
                    style={{ backgroundColor: "#0A0A0A" }}
                  >
                    {scraping ? <><CircleNotchIcon size={11} className="animate-spin" aria-hidden="true" />Scraping…</> : <>Run Scraper <ArrowRightIcon size={11} aria-hidden="true" /></>}
                  </button>
                  <button onClick={fetchLeads} className="rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: "#E0E0E0", color: "#6B6B6B" }}>Refresh</button>
                  <button
                    onClick={() => {
                      if (autoDialing) { setAutoDialStop(true); return; }
                      const filtered = allLeads.filter(l => l.name.toLowerCase().includes(leadsSearch.toLowerCase()) || l.city.toLowerCase().includes(leadsSearch.toLowerCase()) || l.category.toLowerCase().includes(leadsSearch.toLowerCase()));
                      startAutoDial(filtered);
                    }}
                    disabled={allLeads.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 text-white"
                    style={{ backgroundColor: autoDialing ? "#E8706A" : "#8B9E3E" }}
                  >
                    {autoDialing
                      ? <><CircleNotchIcon size={11} className="animate-spin" aria-hidden="true" />Stop Dialer</>
                      : <><PhoneCallIcon size={11} aria-hidden="true" />Auto-Dial Queue</>}
                  </button>
                </div>
              </div>

              {/* Auto-dial progress bar */}
              {autoDialProgress && (
                <div className="px-6 py-3 border-b flex items-center gap-4" style={{ borderColor: "#F0F0F0", backgroundColor: "#F9F9F9" }}>
                  <CircleNotchIcon size={14} className="animate-spin shrink-0" color="#8B9E3E" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: "#0A0A0A" }}>
                        {autoDialProgress.lead} — {autoDialProgress.status}
                      </span>
                      <span className="text-xs tabular-nums shrink-0 ml-3" style={{ color: "#ABABAB" }}>
                        {autoDialProgress.current} / {autoDialProgress.total}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#E0E0E0" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: "#8B9E3E", width: `${(autoDialProgress.current / autoDialProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {leadsLoading ? (
                <div className="flex items-center justify-center py-16 gap-2" style={{ color: "#ABABAB" }}>
                  <CircleNotchIcon size={18} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm">Loading leads…</span>
                </div>
              ) : allLeads.filter(l => l.name.toLowerCase().includes(leadsSearch.toLowerCase()) || l.city.toLowerCase().includes(leadsSearch.toLowerCase()) || l.category.toLowerCase().includes(leadsSearch.toLowerCase())).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                    <UsersIcon size={22} color="#ABABAB" aria-hidden="true" />
                  </div>
                  <p className="text-sm" style={{ color: "#ABABAB" }}>No leads yet — run the scraper above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F5F0E8" }}>
                        {["Business", "Category", "City", "Phone", "Website", "Score", ""].map((h) => (
                          <th key={h} scope="col" className="text-left px-6 py-3 text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allLeads
                        .filter(l => l.name.toLowerCase().includes(leadsSearch.toLowerCase()) || l.city.toLowerCase().includes(leadsSearch.toLowerCase()) || l.category.toLowerCase().includes(leadsSearch.toLowerCase()))
                        .map((lead) => (
                        <tr key={lead.id} className="border-t hover:bg-[#FAFAFA] transition-colors cursor-pointer" style={{ borderColor: "#F0F0F0" }} onClick={() => setDetailLead(lead)}>
                          <td className="px-6 py-4 font-medium" style={{ color: "#0A0A0A" }}>{lead.name}</td>
                          <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>{lead.category}</td>
                          <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>{lead.city}</td>
                          <td className="px-6 py-4 tabular-nums text-xs" style={{ color: "#6B6B6B" }}>{lead.phone}</td>
                          <td className="px-6 py-4"><WebsiteBadge status={lead.websiteStatus} /></td>
                          <td className="px-6 py-4"><ScorePill score={lead.priorityScore} /></td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openDialDialog(lead)}
                              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]"
                              style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                            >
                              Call <ArrowRightIcon size={10} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Business Search ─────────────────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0A0A0A" }}>Search Any Business</h2>
              <p className="text-sm mb-4" style={{ color: "#ABABAB" }}>Find a business by name and have the AI call them directly.</p>

              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon size={15} color="#ABABAB" className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="e.g. Joe's Auto Repair"
                      value={bizQuery}
                      onChange={(e) => setBizQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchBusinesses()}
                      className="w-full rounded-full border pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2"
                      style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                      aria-label="Business name search"
                    />
                  </div>
                  <select
                    value={bizCity}
                    onChange={(e) => setBizCity(e.target.value)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium appearance-none cursor-pointer"
                    style={{ borderColor: "#E0E0E0", color: "#6B6B6B", backgroundColor: "#fff" }}
                    aria-label="Select city for search"
                  >
                    {MICHIGAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}, MI</option>
                    ))}
                  </select>
                  <button
                    onClick={searchBusinesses}
                    disabled={bizSearching || !bizQuery.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: "#E8706A" }}
                  >
                    {bizSearching
                      ? <><CircleNotchIcon size={11} className="animate-spin" aria-hidden="true" />Searching…</>
                      : <>Search <ArrowRightIcon size={11} aria-hidden="true" /></>}
                  </button>
                </div>

                {bizError && (
                  <div className="flex items-center gap-2 px-6 py-3 text-sm" style={{ color: "#E8706A", borderBottom: "1px solid #F0F0F0" }}>
                    <WarningIcon size={15} aria-hidden="true" />
                    {bizError}
                  </div>
                )}

                {bizSearching ? (
                  <div className="flex items-center justify-center py-12 gap-2" style={{ color: "#ABABAB" }}>
                    <CircleNotchIcon size={18} className="animate-spin" aria-hidden="true" />
                    <span className="text-sm">Searching Yelp…</span>
                  </div>
                ) : bizResults.length === 0 && !bizError ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <MagnifyingGlassIcon size={22} color="#ABABAB" aria-hidden="true" />
                    <p className="text-sm" style={{ color: "#ABABAB" }}>Enter a business name above and press Search</p>
                  </div>
                ) : bizResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: "#F5F0E8" }}>
                          {["Business", "Category", "City", "Phone", "Website", "Score", ""].map((h) => (
                            <th key={h} scope="col" className="text-left px-6 py-3 text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bizResults.map((lead) => (
                          <tr key={lead.id} className="border-t hover:bg-[#FAFAFA] transition-colors" style={{ borderColor: "#F0F0F0" }}>
                            <td className="px-6 py-4 font-medium" style={{ color: "#0A0A0A" }}>{lead.name}</td>
                            <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>{lead.category}</td>
                            <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>{lead.city}</td>
                            <td className="px-6 py-4 tabular-nums text-xs" style={{ color: "#6B6B6B" }}>{lead.phone}</td>
                            <td className="px-6 py-4"><WebsiteBadge status={lead.websiteStatus} /></td>
                            <td className="px-6 py-4"><ScorePill score={lead.priorityScore} /></td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => openDialDialog(lead)}
                                className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[#E8706A] hover:text-white hover:border-[#E8706A]"
                                style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                              >
                                Call <ArrowRightIcon size={10} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-6 py-3 text-xs" style={{ color: "#ABABAB" }}>
                      {bizResults.length} result{bizResults.length !== 1 ? "s" : ""} with phone numbers
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        {/* ── Calls view ─────────────────────────────────────────────────── */}
        {activeNav === "Calls" && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[32px] font-bold leading-tight" style={{ color: "#0A0A0A" }}>Call History</h1>
                <p className="mt-1 text-sm" style={{ color: "#ABABAB" }}>{vapiCalls.length} calls total</p>
              </div>
              <button onClick={fetchCalls} className="rounded-full border px-3 py-1.5 text-xs font-medium mt-2" style={{ borderColor: "#E0E0E0", color: "#6B6B6B" }}>Refresh</button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              {callsLoading ? (
                <div className="flex items-center justify-center py-16 gap-2" style={{ color: "#ABABAB" }}>
                  <CircleNotchIcon size={18} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm">Loading calls…</span>
                </div>
              ) : vapiCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                    <PhoneIcon size={22} color="#ABABAB" aria-hidden="true" />
                  </div>
                  <p className="text-sm" style={{ color: "#ABABAB" }}>No calls yet — dial a lead to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F5F0E8" }}>
                        {["Business", "Date", "Duration", "Outcome", "Summary", ""].map((h) => (
                          <th key={h} scope="col" className="text-left px-6 py-3 text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vapiCalls.map((call) => {
                        const businessName = call.metadata?.businessName ?? call.assistant?.name ?? "Unknown";
                        const startDate = call.startedAt ? new Date(call.startedAt) : null;
                        const duration = call.startedAt && call.endedAt
                          ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
                          : null;
                        const outcome = call.endedReason ?? call.status;
                        const outcomeColor =
                          outcome?.includes("voicemail") ? "#E8A030"
                          : outcome?.includes("no-answer") || outcome?.includes("busy") ? "#ABABAB"
                          : outcome?.includes("error") || outcome?.includes("failed") ? "#E8706A"
                          : "#8B9E3E";

                        return (
                          <tr
                            key={call.id}
                            className="border-t hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                            style={{ borderColor: "#F0F0F0" }}
                            onClick={() => setTranscriptCall(call)}
                          >
                            <td className="px-6 py-4 font-medium" style={{ color: "#0A0A0A" }}>{businessName}</td>
                            <td className="px-6 py-4 tabular-nums text-xs" style={{ color: "#6B6B6B" }}>
                              {startDate ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                            </td>
                            <td className="px-6 py-4 tabular-nums text-xs" style={{ color: "#6B6B6B" }}>
                              {duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: outcomeColor }} aria-hidden="true" />
                                {outcome?.replace(/-/g, " ") ?? "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-xs truncate" style={{ color: "#6B6B6B" }}>{call.summary ?? "—"}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#ABABAB" }}>
                                <TextAlignLeftIcon size={12} aria-hidden="true" />View
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Appointments view ───────────────────────────────────────────── */}
        {activeNav === "Appointments" && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[32px] font-bold leading-tight" style={{ color: "#0A0A0A" }}>Appointments</h1>
                <p className="mt-1 text-sm" style={{ color: "#ABABAB" }}>{calBookings.length} upcoming discovery calls</p>
              </div>
              <button onClick={fetchAppointments} className="rounded-full border px-3 py-1.5 text-xs font-medium mt-2" style={{ borderColor: "#E0E0E0", color: "#6B6B6B" }}>Refresh</button>
            </div>

            <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-16 gap-2" style={{ color: "#ABABAB" }}>
                  <CircleNotchIcon size={18} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm">Loading appointments…</span>
                </div>
              ) : calBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="size-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F0E8" }}>
                    <CalendarCheckIcon size={22} color="#ABABAB" aria-hidden="true" />
                  </div>
                  <p className="text-sm" style={{ color: "#ABABAB" }}>No upcoming appointments — bookings appear here after a successful call</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#F0F0F0" }}>
                  {calBookings.map((booking) => {
                    const start = new Date(booking.start);
                    const end = new Date(booking.end);
                    const attendee = booking.attendees?.[0];
                    return (
                      <div key={booking.uid} className="flex items-center justify-between px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ backgroundColor: "#F5F0E8" }}>
                            <p className="text-[10px] font-semibold uppercase tabular-nums" style={{ color: "#ABABAB" }}>
                              {start.toLocaleDateString("en-US", { month: "short" })}
                            </p>
                            <p className="text-lg font-bold leading-none tabular-nums" style={{ color: "#0A0A0A" }}>
                              {start.getDate()}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "#0A0A0A" }}>{attendee?.name ?? "Discovery Call"}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>{attendee?.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <ClockIcon size={11} color="#ABABAB" aria-hidden="true" />
                              <p className="text-xs tabular-nums" style={{ color: "#ABABAB" }}>
                                {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: attendee?.timeZone ?? "America/Detroit" })}
                                {" – "}
                                {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: attendee?.timeZone ?? "America/Detroit" })}
                                {" EST"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: booking.status === "accepted" ? "rgba(139,158,62,0.12)" : "#F5F0E8",
                            color: booking.status === "accepted" ? "#8B9E3E" : "#6B6B6B",
                          }}
                        >
                          {booking.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Settings view ──────────────────────────────────────────────── */}
        {activeNav === "Settings" && (
          <>
            <div>
              <h1 className="text-[32px] font-bold leading-tight" style={{ color: "#0A0A0A" }}>Settings</h1>
              <p className="mt-1 text-sm" style={{ color: "#ABABAB" }}>Manage integrations, compliance, and caller config</p>
            </div>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-24 gap-2" style={{ color: "#ABABAB" }}>
                <CircleNotchIcon size={18} className="animate-spin" aria-hidden="true" />
                <span className="text-sm">Loading settings…</span>
              </div>
            ) : (
              <div className="space-y-6">

                {/* ── Integrations ─────────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <h2 className="font-semibold text-[15px]" style={{ color: "#0A0A0A" }}>Integrations</h2>
                    <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>API keys are set in .env.local</p>
                  </div>
                  <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: "#F0F0F0" }}>
                    {([
                      { key: "anthropic", label: "Anthropic Claude", desc: "AI call script generation", icon: RobotIcon },
                      { key: "vapi",      label: "Vapi.ai",          desc: "AI voice caller",           icon: PhoneCallIcon },
                      { key: "calcom",    label: "Cal.com",           desc: "Appointment booking",       icon: CalendarIcon },
                      { key: "clickup",   label: "ClickUp",           desc: "CRM logging",               icon: CheckCircleIcon },
                      { key: "twilio",    label: "Twilio",            desc: "SMS follow-ups",            icon: PhoneIcon },
                      { key: "yelp",      label: "Yelp Fusion",       desc: "Lead scraping",             icon: MagnifyingGlassIcon },
                    ] as { key: string; label: string; desc: string; icon: React.ElementType }[]).map(({ key, label, desc, icon: Icon }) => {
                      const connected = integrations[key];
                      return (
                        <div key={key} className="bg-white px-6 py-5 flex items-start gap-4">
                          <div
                            className="size-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: connected ? "rgba(139,158,62,0.1)" : "#F5F5F5" }}
                          >
                            <Icon size={18} color={connected ? "#8B9E3E" : "#ABABAB"} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate" style={{ color: "#0A0A0A" }}>{label}</p>
                              <span
                                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  backgroundColor: connected ? "rgba(139,158,62,0.12)" : "rgba(171,171,171,0.12)",
                                  color: connected ? "#8B9E3E" : "#ABABAB",
                                }}
                              >
                                <span className={`size-1.5 rounded-full ${connected ? "bg-[#8B9E3E]" : "bg-[#ABABAB]"}`} />
                                {connected ? "Connected" : "Not set"}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5 truncate" style={{ color: "#ABABAB" }}>{desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Caller Info ───────────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <h2 className="font-semibold text-[15px]" style={{ color: "#0A0A0A" }}>Caller Configuration</h2>
                    <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>Active phone numbers and event types</p>
                  </div>
                  <div className="divide-y" style={{ borderColor: "#F0F0F0" }}>
                    {([
                      { label: "Outbound Phone Number", value: callerInfo.phoneNumber, icon: PhoneIcon },
                      { label: "Vapi Phone Number ID",  value: callerInfo.vapiPhoneNumberId, icon: LinkIcon },
                      { label: "Cal.com Event Type ID", value: callerInfo.calcomEventTypeId, icon: CalendarIcon },
                    ] as { label: string; value: string | null; icon: React.ElementType }[]).map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-4 px-6 py-4">
                        <Icon size={16} color="#ABABAB" aria-hidden="true" />
                        <span className="text-sm flex-1" style={{ color: "#6B6B6B" }}>{label}</span>
                        <span className="text-sm font-mono tabular-nums" style={{ color: value ? "#0A0A0A" : "#ABABAB" }}>
                          {value ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── TCPA / DNC List ───────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <div>
                      <h2 className="font-semibold text-[15px]" style={{ color: "#0A0A0A" }}>Do Not Call List</h2>
                      <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>Numbers are auto-added when a lead opts out</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium tabular-nums" style={{ backgroundColor: "#F5F0E8", color: "#6B6B6B" }}>
                      {dncList.length} number{dncList.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Add number manually */}
                  <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <input
                      type="tel"
                      placeholder="+15551234567"
                      value={newDncPhone}
                      onChange={(e) => setNewDncPhone(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newDncPhone.trim() && !dncAdding) {
                          setDncAdding(true);
                          await fetch("/api/dnc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: newDncPhone.trim() }) });
                          setDncList((p) => [...new Set([...p, newDncPhone.trim()])]);
                          setNewDncPhone("");
                          setDncAdding(false);
                        }
                      }}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                      style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                      aria-label="Add phone number to DNC list"
                    />
                    <button
                      disabled={dncAdding || !newDncPhone.trim()}
                      onClick={async () => {
                        if (!newDncPhone.trim()) return;
                        setDncAdding(true);
                        await fetch("/api/dnc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: newDncPhone.trim() }) });
                        setDncList((p) => [...new Set([...p, newDncPhone.trim()])]);
                        setNewDncPhone("");
                        setDncAdding(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: "#0A0A0A" }}
                    >
                      {dncAdding ? <CircleNotchIcon size={13} className="animate-spin" aria-hidden="true" /> : <PlusIcon size={13} aria-hidden="true" />}
                      Add
                    </button>
                  </div>

                  {dncList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <CheckCircleIcon size={22} color="#8B9E3E" aria-hidden="true" />
                      <p className="text-sm" style={{ color: "#ABABAB" }}>DNC list is empty — no blocked numbers</p>
                    </div>
                  ) : (
                    <ul role="list" className="divide-y" style={{ borderColor: "#F0F0F0" }}>
                      {dncList.map((phone) => (
                        <li key={phone} className="flex items-center justify-between px-6 py-3">
                          <span className="text-sm font-mono tabular-nums" style={{ color: "#0A0A0A" }}>{phone}</span>
                          <button
                            onClick={async () => {
                              await fetch(`/api/dnc?phone=${encodeURIComponent(phone)}`, { method: "DELETE" });
                              setDncList((p) => p.filter((n) => n !== phone));
                            }}
                            className="rounded-lg p-1.5 transition-colors hover:bg-[#FEF2F2]"
                            aria-label={`Remove ${phone} from DNC list`}
                          >
                            <TrashIcon size={14} color="#E8706A" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── TCPA Calling Hours ────────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <h2 className="font-semibold text-[15px]" style={{ color: "#0A0A0A" }}>TCPA Calling Hours</h2>
                    <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>Calls outside this window are automatically blocked</p>
                  </div>
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ClockIcon size={18} color="#ABABAB" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>8:00 AM – 9:00 PM</p>
                        <p className="text-xs" style={{ color: "#ABABAB" }}>America/Detroit (Michigan local time)</p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: "rgba(139,158,62,0.12)", color: "#8B9E3E" }}
                    >
                      <span className="size-1.5 rounded-full bg-[#8B9E3E]" />
                      Enforced
                    </span>
                  </div>
                </div>

                {/* ── Call Script Editor ───────────────────────────────────── */}
                <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b" style={{ borderColor: "#F0F0F0" }}>
                    <h2 className="font-semibold text-[15px]" style={{ color: "#0A0A0A" }}>Call Script Editor</h2>
                    <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>Customise what the AI says — Claude still generates the base script, these are applied on top</p>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>
                        Opening Message Override
                      </label>
                      <input
                        type="text"
                        value={firstMsgTemplate}
                        onChange={(e) => { setFirstMsgTemplate(e.target.value); setScriptSaved(false); }}
                        placeholder='e.g. "Hi, this is an automated AI calling from Prospkt about {businessName}…"'
                        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                      />
                      <p className="text-[11px]" style={{ color: "#ABABAB" }}>Variables: {"{businessName}"}, {"{city}"}, {"{category}"}. Leave blank to use AI-generated message.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>
                        Extra Instructions
                      </label>
                      <textarea
                        rows={4}
                        value={scriptSuffix}
                        onChange={(e) => { setScriptSuffix(e.target.value); setScriptSaved(false); }}
                        placeholder="e.g. Always mention we offer a free website audit. Never discuss pricing on the call."
                        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none"
                        style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                      />
                      <p className="text-[11px]" style={{ color: "#ABABAB" }}>Appended to every generated system prompt.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setScriptSaving(true);
                          await fetch("/api/settings/script", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ systemPromptSuffix: scriptSuffix, firstMessageTemplate: firstMsgTemplate }),
                          });
                          setScriptSaving(false);
                          setScriptSaved(true);
                        }}
                        disabled={scriptSaving}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: "#0A0A0A" }}
                      >
                        {scriptSaving
                          ? <><CircleNotchIcon size={13} className="animate-spin" aria-hidden="true" />Saving…</>
                          : <><FloppyDiskIcon size={13} aria-hidden="true" />Save Script</>}
                      </button>
                      {scriptSaved && (
                        <span className="text-xs font-medium" style={{ color: "#8B9E3E" }}>
                          <CheckCircleIcon size={13} className="inline mr-1" aria-hidden="true" />Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* ── Home view ──────────────────────────────────────────────────── */}
        {(activeNav === "Home" || activeNav === "Help") && (<>

          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-[32px] font-bold leading-tight text-balance"
                style={{ color: "#0A0A0A" }}
              >
                {getGreeting()}, Abeni! 👋
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#ABABAB" }}>
                {getFormattedDate()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium bg-white"
                style={{ color: "#6B6B6B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
              >
                Leads ({leads.length})
                <ArrowUpRightIcon size={13} aria-hidden="true" />
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium bg-white"
                style={{ color: "#6B6B6B", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
              >
                Calls ({calls.length})
                <ArrowUpRightIcon size={13} aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total Leads — olive */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#8B9E3E" }}>
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/70">Total Leads</p>
                <CrosshairIcon size={18} color="rgba(255,255,255,0.5)" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums text-white">
                {analytics?.totalLeads ?? leads.length}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {lastScrapedCity ? `Last: ${lastScrapedCity}` : "Scraped from Yelp"}
              </p>
            </div>

            {/* Calls Today — coral */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#E8706A" }}>
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/70">Calls Today</p>
                <PhoneIcon size={18} color="rgba(255,255,255,0.5)" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums text-white">
                {analytics?.callsToday ?? 0}
              </p>
              <p className="mt-2 text-xs text-white/60">{analytics?.callsToday === 1 ? "1 call placed" : `${analytics?.callsToday ?? 0} calls placed`}</p>
            </div>

            {/* Booked — white */}
            <div className="rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>Booked</p>
                <CalendarCheckIcon size={18} color="#E8706A" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums" style={{ color: "#0A0A0A" }}>
                {analytics?.bookedThisWeek ?? 0}
              </p>
              <p className="mt-2 text-xs" style={{ color: "#ABABAB" }}>This week</p>
            </div>

            {/* Conversion — white */}
            <div className="rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#ABABAB" }}>Conversion</p>
                <TrendUpIcon size={18} color="#8B9E3E" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums" style={{ color: "#0A0A0A" }}>
                {analytics?.conversionRate ?? 0}%
              </p>
              <p className="mt-2 text-xs" style={{ color: "#ABABAB" }}>
                {analytics ? `${analytics.bookedThisWeek} booked this week` : "No calls yet"}
              </p>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "65fr 35fr" }}>

            {/* Lead Queue */}
            <SectionCard
              title="Lead Queue"
              count={leads.length}
              action={
                <div className="flex items-center gap-2">
                  {/* City selector */}
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={scraping}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium appearance-none cursor-pointer disabled:opacity-50"
                    style={{
                      borderColor: "#E0E0E0",
                      color: "#6B6B6B",
                      backgroundColor: "#fff",
                    }}
                    aria-label="Select Michigan city to scrape"
                  >
                    {MICHIGAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}, MI
                      </option>
                    ))}
                  </select>

                  {/* Run button */}
                  <button
                    onClick={runScraper}
                    disabled={scraping}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-60"
                    style={{ backgroundColor: "#0A0A0A" }}
                  >
                    {scraping ? (
                      <>
                        <CircleNotchIcon
                          size={11}
                          aria-hidden="true"
                          className="animate-spin"
                        />
                        Scraping…
                      </>
                    ) : (
                      <>
                        Run Scraper
                        <ArrowRightIcon size={11} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              }
            >
              {/* Error banner */}
              {scrapeError && (
                <div
                  className="flex items-center gap-2 px-6 py-3 text-sm border-b"
                  style={{
                    backgroundColor: "rgba(232,112,106,0.08)",
                    borderColor: "rgba(232,112,106,0.2)",
                    color: "#E8706A",
                  }}
                  role="alert"
                >
                  <WarningIcon size={15} weight="fill" aria-hidden="true" />
                  {scrapeError}
                </div>
              )}

              {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "#F5F0E8" }}
                  >
                    <UsersIcon size={22} color="#ABABAB" weight="regular" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: "#6B6B6B" }}>
                      No leads yet
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>
                      Select a Michigan city and run the scraper
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#F5F0E8" }}>
                        {["Business", "Category", "City", "Website", "Score", ""].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="text-left px-6 py-3 text-[11px] font-semibold tracking-widest uppercase"
                            style={{ color: "#ABABAB" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-t hover:bg-[#FAFAFA] transition-colors"
                          style={{ borderColor: "#F0F0F0" }}
                        >
                          <td className="px-6 py-4 font-medium" style={{ color: "#0A0A0A" }}>
                            {lead.name}
                          </td>
                          <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>
                            {lead.category}
                          </td>
                          <td className="px-6 py-4" style={{ color: "#6B6B6B" }}>
                            {lead.city}
                          </td>
                          <td className="px-6 py-4">
                            <WebsiteBadge status={lead.websiteStatus} />
                          </td>
                          <td className="px-6 py-4">
                            <ScorePill score={lead.priorityScore} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openDialDialog(lead)}
                              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]"
                              style={{ borderColor: "#E0E0E0", color: "#0A0A0A" }}
                            >
                              Call
                              <ArrowRightIcon size={10} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            {/* Right column */}
            <div className="space-y-4">

              {/* Recent Calls */}
              <SectionCard title="Recent Calls" count={calls.length}>
                {calls.length === 0 ? (
                  <EmptySlate icon={PhoneIcon} label="No calls yet" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "#F0F0F0" }}>
                    {calls.map((call) => (
                      <li
                        key={call.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#0A0A0A" }}>
                            {call.businessName}
                          </p>
                          <p className="text-xs" style={{ color: "#ABABAB" }}>
                            {call.timeAgo}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor:
                              call.outcome === "Booked"
                                ? "rgba(139,158,62,0.12)"
                                : call.outcome === "No Answer"
                                ? "#F5F0E8"
                                : "rgba(232,112,106,0.12)",
                            color:
                              call.outcome === "Booked"
                                ? "#8B9E3E"
                                : call.outcome === "No Answer"
                                ? "#6B6B6B"
                                : "#E8706A",
                          }}
                        >
                          {call.outcome}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              {/* Upcoming Appointments */}
              <SectionCard title="Upcoming" count={appointments.length}>
                {appointments.length === 0 ? (
                  <EmptySlate icon={CalendarCheckIcon} label="No appointments yet" />
                ) : (
                  <ul className="divide-y" style={{ borderColor: "#F0F0F0" }}>
                    {appointments.map((appt) => (
                      <li key={appt.id} className="px-5 py-3">
                        <p className="text-sm font-medium" style={{ color: "#0A0A0A" }}>
                          {appt.business}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>
                          {appt.date} · {appt.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        </>)}

        </div>
      </main>

      {/* ── Dial dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={dialLead !== null}
        onOpenChange={(open) => { if (!open) setDialLead(null); }}
      >
        <DialogContent className="max-w-sm rounded-2xl" style={{ fontFamily: "'Switzer', sans-serif" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold" style={{ color: "#0A0A0A" }}>
              Call {dialLead?.name}
            </DialogTitle>
          </DialogHeader>

          {dialResult ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="size-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(139,158,62,0.12)" }}
              >
                <CheckCircleIcon size={24} color="#8B9E3E" weight="fill" aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "#0A0A0A" }}>
                  Call initiated
                </p>
                <p className="text-xs mt-1" style={{ color: "#ABABAB" }}>
                  ID: {dialResult.callId}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#ABABAB" }}>
                  The AI is dialing {dialLead?.name} now.
                </p>
              </div>
              <button
                onClick={() => setDialLead(null)}
                className="mt-2 rounded-full px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "#0A0A0A" }}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div
                className="rounded-xl px-4 py-3 text-sm space-y-1"
                style={{ backgroundColor: "#F5F0E8" }}
              >
                <p style={{ color: "#6B6B6B" }}>
                  <span className="font-medium" style={{ color: "#0A0A0A" }}>
                    {dialLead?.category}
                  </span>{" "}
                  · {dialLead?.city}, MI
                </p>
                <p style={{ color: "#6B6B6B" }}>
                  Website:{" "}
                  <span
                    style={{
                      color:
                        dialLead?.websiteStatus === "none"
                          ? "#E8706A"
                          : dialLead?.websiteStatus === "outdated"
                          ? "#E8A030"
                          : "#8B9E3E",
                    }}
                  >
                    {dialLead?.websiteStatus === "none"
                      ? "None"
                      : dialLead?.websiteStatus === "outdated"
                      ? "Outdated"
                      : "Modern"}
                  </span>
                  {" "}· Score:{" "}
                  <span className="font-semibold tabular-nums" style={{ color: "#0A0A0A" }}>
                    {dialLead?.priorityScore}/10
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dial-phone"
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "#ABABAB" }}
                >
                  Phone Number
                </label>
                <input
                  id="dial-phone"
                  type="tel"
                  value={dialPhone}
                  onChange={(e) => setDialPhone(e.target.value)}
                  placeholder="+15551234567"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#E0E0E0", color: "#0A0A0A", backgroundColor: "#fff" }}
                  aria-describedby={dialError ? "dial-error" : undefined}
                />
                <p className="text-[11px]" style={{ color: "#ABABAB" }}>
                  Must be E.164 format: +1XXXXXXXXXX
                </p>
              </div>

              {/* TCPA calling hours warning */}
              {(() => {
                const hour = new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Detroit" });
                const h = Number(hour);
                return (h < 8 || h >= 21) ? (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                    style={{ backgroundColor: "rgba(232,160,48,0.1)", color: "#E8A030" }}
                    role="alert"
                  >
                    <ClockIcon size={13} weight="fill" aria-hidden="true" />
                    Outside TCPA calling hours (8am–9pm ET). The call will be blocked.
                  </div>
                ) : null;
              })()}

              {dialError && (
                <div
                  id="dial-error"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                  style={{ backgroundColor: "rgba(232,112,106,0.08)", color: "#E8706A" }}
                  role="alert"
                >
                  <WarningIcon size={13} weight="fill" aria-hidden="true" />
                  {dialError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDialLead(null)}
                  className="flex-1 rounded-full border py-2 text-sm font-medium transition-colors hover:bg-[#F5F0E8]"
                  style={{ borderColor: "#E0E0E0", color: "#6B6B6B" }}
                >
                  Cancel
                </button>
                <button
                  onClick={startCall}
                  disabled={dialing || !dialPhone.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: "#E8706A" }}
                >
                  {dialing ? (
                    <>
                      <CircleNotchIcon size={13} className="animate-spin" aria-hidden="true" />
                      Dialing…
                    </>
                  ) : (
                    <>
                      <PhoneIcon size={13} weight="fill" aria-hidden="true" />
                      Start Call
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Transcript viewer ──────────────────────────────────────────────── */}
      <Dialog open={!!transcriptCall} onOpenChange={(o) => !o && setTranscriptCall(null)}>
        <DialogContent className="max-w-2xl rounded-2xl" style={{ fontFamily: "'Switzer', sans-serif" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold" style={{ color: "#0A0A0A" }}>
              {transcriptCall?.metadata?.businessName ?? "Call"} — Transcript
            </DialogTitle>
          </DialogHeader>
          {transcriptCall && (
            <div className="space-y-4 mt-1 max-h-[70vh] overflow-y-auto pr-1">
              {/* Meta row */}
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#6B6B6B" }}>
                {transcriptCall.startedAt && (
                  <span>{new Date(transcriptCall.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                )}
                {transcriptCall.startedAt && transcriptCall.endedAt && (
                  <span>{Math.round((new Date(transcriptCall.endedAt).getTime() - new Date(transcriptCall.startedAt).getTime()) / 1000)}s</span>
                )}
                {transcriptCall.endedReason && (
                  <span className="capitalize">{transcriptCall.endedReason.replace(/-/g, " ")}</span>
                )}
                {transcriptCall.recordingUrl && (
                  <a href={transcriptCall.recordingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium" style={{ color: "#E8706A" }}>
                    <RecordIcon size={11} aria-hidden="true" />Listen to recording
                    <ArrowSquareOutIcon size={11} aria-hidden="true" />
                  </a>
                )}
              </div>
              {/* Summary */}
              {transcriptCall.summary && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F5F0E8" }}>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#ABABAB" }}>Summary</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#0A0A0A" }}>{transcriptCall.summary}</p>
                </div>
              )}
              {/* Full transcript */}
              {transcriptCall.transcript ? (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: "#ABABAB" }}>Full Transcript</p>
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#E0E0E0" }}>
                    {transcriptCall.transcript.split("\n").filter(Boolean).map((line, i) => {
                      const isAI = line.toLowerCase().startsWith("ai:") || line.toLowerCase().startsWith("assistant:");
                      return (
                        <p key={i} className="text-sm leading-relaxed" style={{ color: isAI ? "#0A0A0A" : "#E8706A" }}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <TextAlignLeftIcon size={22} color="#ABABAB" aria-hidden="true" />
                  <p className="text-sm" style={{ color: "#ABABAB" }}>No transcript available for this call</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Lead detail drawer ─────────────────────────────────────────────── */}
      <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <DialogContent className="max-w-md rounded-2xl" style={{ fontFamily: "'Switzer', sans-serif" }}>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold" style={{ color: "#0A0A0A" }}>
              {detailLead?.name}
            </DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-5 mt-1">
              {/* Score + status row */}
              <div className="flex items-center gap-3">
                <ScorePill score={detailLead.priorityScore} />
                <WebsiteBadge status={detailLead.websiteStatus} />
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#F5F0E8", color: "#6B6B6B" }}>
                  {detailLead.category}
                </span>
              </div>

              {/* Info rows */}
              <div className="rounded-xl border divide-y" style={{ borderColor: "#E0E0E0" }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <PhoneIcon size={15} color="#ABABAB" aria-hidden="true" />
                  <span className="text-sm font-mono tabular-nums" style={{ color: "#0A0A0A" }}>{detailLead.phone}</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPinIcon size={15} color="#ABABAB" aria-hidden="true" />
                  <span className="text-sm" style={{ color: "#0A0A0A" }}>{detailLead.address || detailLead.city}</span>
                </div>
                {(detailLead as Lead & { yelpRating?: number; yelpReviewCount?: number }).yelpRating && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <StarIcon size={15} color="#E8A030" weight="fill" aria-hidden="true" />
                    <span className="text-sm tabular-nums" style={{ color: "#0A0A0A" }}>
                      {(detailLead as Lead & { yelpRating?: number; yelpReviewCount?: number }).yelpRating} · {(detailLead as Lead & { yelpRating?: number; yelpReviewCount?: number }).yelpReviewCount} reviews
                    </span>
                  </div>
                )}
                {(detailLead as Lead & { yelpUrl?: string }).yelpUrl && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <ArrowSquareOutIcon size={15} color="#ABABAB" aria-hidden="true" />
                    <a
                      href={(detailLead as Lead & { yelpUrl?: string }).yelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm truncate"
                      style={{ color: "#E8706A" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on Yelp
                    </a>
                  </div>
                )}
              </div>

              {/* Call button */}
              <button
                onClick={() => { setDetailLead(null); openDialDialog(detailLead); }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "#E8706A" }}
              >
                <PhoneIcon size={14} weight="fill" aria-hidden="true" />
                Call {detailLead.name}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
