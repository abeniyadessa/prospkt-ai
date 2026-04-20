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

  // Appointments page
  const [calBookings, setCalBookings] = useState<CalBooking[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

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
    if (activeNav === "Leads") fetchLeads();
    if (activeNav === "Calls") fetchCalls();
    if (activeNav === "Appointments") fetchAppointments();
  }, [activeNav, fetchLeads, fetchCalls, fetchAppointments]);

  // Dial dialog
  const [dialLead, setDialLead] = useState<Lead | null>(null);
  const [dialPhone, setDialPhone] = useState("");
  const [dialing, setDialing] = useState(false);
  const [dialResult, setDialResult] = useState<{ callId: string } | null>(null);
  const [dialError, setDialError] = useState<string | null>(null);

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
        <div className="flex items-center px-5 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Prospkt" width={130} height={44} />
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
                </div>
              </div>

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
                          <tr key={call.id} className="border-t hover:bg-[#FAFAFA] transition-colors" style={{ borderColor: "#F0F0F0" }}>
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
                              {call.recordingUrl && (
                                <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "#E8706A" }}
                                  aria-label="Listen to recording">
                                  <RecordIcon size={12} aria-hidden="true" />Listen
                                </a>
                              )}
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

        {/* ── Home view ──────────────────────────────────────────────────── */}
        {(activeNav === "Home" || activeNav === "Settings" || activeNav === "Help") && (<>

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
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/70">
                  Total Leads
                </p>
                <CrosshairIcon size={18} color="rgba(255,255,255,0.5)" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums text-white">
                {leads.length}
              </p>
              <p className="mt-2 text-xs text-white/60">
                {lastScrapedCity ? `Last: ${lastScrapedCity}` : "No scrapes yet"}
              </p>
            </div>

            {/* Calls Today — coral */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#E8706A" }}>
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-white/70">
                  Calls Today
                </p>
                <PhoneIcon size={18} color="rgba(255,255,255,0.5)" weight="regular" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[56px] leading-none font-bold tabular-nums text-white">
                {calls.length}
              </p>
              <p className="mt-2 text-xs text-white/60">+0 from yesterday</p>
            </div>

            {/* Booked — white */}
            <div className="rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <p
                  className="text-[11px] font-semibold tracking-widest uppercase"
                  style={{ color: "#ABABAB" }}
                >
                  Booked
                </p>
                <CalendarCheckIcon size={18} color="#E8706A" weight="regular" aria-hidden="true" />
              </div>
              <p
                className="mt-3 text-[56px] leading-none font-bold tabular-nums"
                style={{ color: "#0A0A0A" }}
              >
                {bookedCount}
              </p>
              <p className="mt-2 text-xs" style={{ color: "#ABABAB" }}>
                +0 this week
              </p>
            </div>

            {/* Conversion — white */}
            <div className="rounded-2xl p-5 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <p
                  className="text-[11px] font-semibold tracking-widest uppercase"
                  style={{ color: "#ABABAB" }}
                >
                  Conversion
                </p>
                <TrendUpIcon size={18} color="#8B9E3E" weight="regular" aria-hidden="true" />
              </div>
              <p
                className="mt-3 text-[56px] leading-none font-bold tabular-nums"
                style={{ color: "#0A0A0A" }}
              >
                {conversionPct}%
              </p>
              <p className="mt-2 text-xs" style={{ color: "#ABABAB" }}>
                {bookedCount} / {calls.length} calls
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
    </div>
  );
}
