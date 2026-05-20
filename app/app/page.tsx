"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lead, NavKey, VapiCallRecord } from "@/lib/types";
import type { CampaignFilter } from "@/lib/campaigns";
import { Sidebar } from "@/components/app/sidebar";
import { DialDialog } from "@/components/app/dial-dialog";
import { TranscriptDialog } from "@/components/app/transcript-dialog";
import { LeadDrawer } from "@/components/app/lead-drawer";
import { HomeView } from "./views/home-view";
import { CampaignsView } from "./views/campaigns-view";
import { LeadsView } from "./views/leads-view";
import { PipelineView } from "./views/pipeline-view";
import { CallsView } from "./views/calls-view";
import { AppointmentsView } from "./views/appointments-view";
import { SettingsView } from "./views/settings-view";
import { HelpView } from "./views/help-view";
import {
  BookOpenIcon,
  CalendarIcon,
  ChatCircleIcon,
  HouseIcon,
  PhoneIcon,
  SparkleIcon,
  UsersIcon,
  LightningIcon,
  KanbanIcon,
} from "@phosphor-icons/react";

const mobileNavItems: { key: NavKey; label: string; icon: React.ElementType }[] = [
  { key: "Home", label: "Home", icon: HouseIcon },
  { key: "Campaigns", label: "Campaigns", icon: LightningIcon },
  { key: "CRM", label: "CRM", icon: UsersIcon },
  { key: "Pipeline", label: "Pipeline", icon: KanbanIcon },
  { key: "Calls", label: "Calls", icon: PhoneIcon },
  { key: "Bookings", label: "Bookings", icon: CalendarIcon },
];

export default function Dashboard() {
  const [active, setActiveState] = useState<NavKey>("Home");
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter | null>(null);

  const setActive = useCallback((next: NavKey) => {
    setActiveState((prev) => {
      if (prev === next) return prev;
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const transition = (
          document as Document & {
            startViewTransition: (cb: () => void) => {
              finished: Promise<void>;
              ready: Promise<void>;
            };
          }
        ).startViewTransition(() => setActiveState(next));
        // Swallow AbortError when a new transition supersedes this one
        transition.finished.catch(() => {});
        transition.ready.catch(() => {});
        return prev;
      }
      return next;
    });
  }, []);

  const [counts, setCounts] = useState({
    leads: 0,
    calls: 0,
    appointments: 0,
  });

  const [refreshTick, setRefreshTick] = useState(0);
  const refreshCounts = useCallback(() => setRefreshTick((t) => t + 1), []);
  const [leadRefreshTick, setLeadRefreshTick] = useState(0);
  const refreshLeadViews = useCallback(() => setLeadRefreshTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const [l, c, a] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()).catch(() => ({ leads: [] })),
        fetch("/api/calls").then((r) => r.json()).catch(() => ({ calls: [] })),
        fetch("/api/appointments").then((r) => r.json()).catch(() => ({ appointments: [] })),
      ]);
      if (cancelled) return;
      setCounts({
        leads: (l.leads ?? []).length,
        calls: (c.calls ?? []).length,
        appointments: (a.appointments ?? []).length,
      });
    }
    run();
    const interval = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshTick]);

  const [dialLead, setDialLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [transcriptCall, setTranscriptCall] = useState<VapiCallRecord | null>(null);

  const openCampaignView = useCallback(
    (filter: CampaignFilter, destination: Extract<NavKey, "CRM" | "Pipeline">) => {
      setCampaignFilter(filter);
      setActive(destination);
    },
    [setActive]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.tagName === "SELECT" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "1":
          setActive("Home");
          break;
        case "2":
          setActive("Campaigns");
          break;
        case "3":
          setActive("CRM");
          break;
        case "4":
          setActive("Pipeline");
          break;
        case "5":
          setActive("Calls");
          break;
        case "6":
          setActive("Bookings");
          break;
        case ",":
          setActive("Settings");
          break;
        case "?":
          setActive("Help");
          break;
        case "/":
          e.preventDefault();
          const input = document.querySelector<HTMLInputElement>(
            'input[type="search"]'
          );
          input?.focus();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActive]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar active={active} onChange={setActive} counts={counts} />

      <main
        className="flex min-w-0 flex-1 flex-col overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0"
        id="main-content"
        style={{ backgroundColor: "var(--canvas)" }}
      >
        <TopBar breadcrumb={active} onNavigate={setActive} />

        <div className="flex-1">
          <div
            className="view-crossfade mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
            key={active}
          >
            {active === "Home" && (
              <HomeView onNavigate={setActive} onCall={setDialLead} />
            )}
            {active === "Campaigns" && (
              <CampaignsView
                onNavigate={setActive}
                onOpenCampaign={openCampaignView}
              />
            )}
            {active === "CRM" && (
              <LeadsView
                onOpenLead={setDetailLead}
                onCall={setDialLead}
                refreshKey={leadRefreshTick}
                campaignFilter={campaignFilter}
                onClearCampaignFilter={() => setCampaignFilter(null)}
              />
            )}
            {active === "Pipeline" && (
              <PipelineView
                onOpenLead={setDetailLead}
                onCall={setDialLead}
                refreshKey={leadRefreshTick}
                campaignFilter={campaignFilter}
                onClearCampaignFilter={() => setCampaignFilter(null)}
              />
            )}
            {active === "Calls" && (
              <CallsView onOpenTranscript={setTranscriptCall} />
            )}
            {active === "Bookings" && <AppointmentsView />}
            {active === "Settings" && <SettingsView />}
            {active === "Help" && <HelpView />}
          </div>
        </div>
      </main>

      <DialDialog
        lead={dialLead}
        onClose={() => setDialLead(null)}
        onInitiated={() => {
          refreshCounts();
          refreshLeadViews();
        }}
      />
      <LeadDrawer
        lead={detailLead}
        onClose={() => setDetailLead(null)}
        onCall={(l) => setDialLead(l)}
        onChange={(updated) => {
          setDetailLead(updated);
          refreshLeadViews();
          refreshCounts();
        }}
      />
      <TranscriptDialog
        call={transcriptCall}
        onClose={() => setTranscriptCall(null)}
      />
      {!dialLead && !detailLead && !transcriptCall && (
        <MobileNav active={active} onChange={setActive} counts={counts} />
      )}
    </div>
  );
}

const SUPPORT_EMAIL = "agency@yalid.co";

function mailto(subject: string, body: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function TopBar({
  breadcrumb,
  onNavigate,
}: {
  breadcrumb: NavKey;
  onNavigate: (key: NavKey) => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-hairline px-4 sm:px-6"
      style={{ backgroundColor: "var(--canvas)" }}
    >
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium text-foreground">
          {breadcrumb}
        </span>
      </nav>
      <div className="hidden items-center gap-1 sm:flex">
        <TopBarLink
          icon={ChatCircleIcon}
          label="Feedback"
          href={mailto(
            "Prospkt feedback",
            "Hey Prospkt team,\n\nI have feedback about:\n\n"
          )}
          title={`Send feedback to ${SUPPORT_EMAIL}`}
        />
        <TopBarLink
          icon={BookOpenIcon}
          label="Docs"
          onClick={() => onNavigate("Help")}
          title="Open Prospkt docs and setup guide"
        />
        <TopBarLink
          icon={SparkleIcon}
          label="Ask"
          href={mailto(
            "Question about Prospkt",
            "Hey Prospkt team,\n\nQuestion:\n\n"
          )}
          title={`Ask a question via ${SUPPORT_EMAIL}`}
        />
      </div>
    </header>
  );
}

function TopBarLink({
  icon: Icon,
  label,
  href,
  onClick,
  title,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  title?: string;
}) {
  const className =
    "inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12.5px] font-medium text-muted-foreground hover:bg-[color:var(--elevated)] hover:text-foreground transition-colors";
  const content = (
    <>
      <Icon size={13} aria-hidden />
      {label}
    </>
  );
  return href ? (
    <a href={href} className={className} title={title} aria-label={title ?? label}>
      {content}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title={title}
      aria-label={title ?? label}
    >
      {content}
    </button>
  );
}

function MobileNav({
  active,
  onChange,
  counts,
}: {
  active: NavKey;
  onChange: (key: NavKey) => void;
  counts: { leads: number; calls: number; appointments: number };
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface px-2 pt-1.5 md:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-6 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.key;
          const badge =
            item.key === "CRM"
              ? counts.leads
              : item.key === "Calls"
              ? counts.calls
              : item.key === "Bookings"
              ? counts.appointments
              : undefined;

          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onChange(item.key)}
                aria-current={selected ? "page" : undefined}
                className={`relative flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-lg text-[10.5px] font-medium transition-colors ${
                  selected
                    ? "bg-[color:var(--elevated)] text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Icon size={17} weight={selected ? "fill" : "regular"} aria-hidden />
                <span>{item.label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <span className="absolute right-3 top-1.5 min-w-4 rounded-full bg-foreground px-1 text-[9px] leading-4 text-white tabular-nums">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
