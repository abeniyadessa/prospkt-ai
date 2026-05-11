"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  PhoneIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react";
import type { Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import {
  GhostButton,
  LoadingState,
  PageHeader,
  ScorePill,
  WebsiteBadge,
} from "@/components/app/primitives";

// Active columns shown by default. Closed states hidden behind toggle.
const ACTIVE_COLUMNS: LeadStatus[] = [
  "new",
  "queued",
  "called",
  "voicemail",
  "interested",
  "booked",
  "follow_up",
];
const CLOSED_COLUMNS: LeadStatus[] = ["not_interested", "dnc"];

// Whisper-soft column tints — barely-there hue on a near-white base.
const COLUMN_TINT: Record<LeadStatus, { body: string; header: string; border: string }> = {
  new:            { body: "#F7FAFD", header: "#EEF3FA", border: "#E4ECF6" }, // sky
  queued:         { body: "#F9F7FC", header: "#F1ECF8", border: "#E8E1F2" }, // lavender
  called:         { body: "#F8F8F7", header: "#F1F1F0", border: "#E8E8E6" }, // warm gray
  voicemail:      { body: "#FCF8F1", header: "#F8F0E1", border: "#EFE4D0" }, // peach
  interested:     { body: "#F4F9F5", header: "#EAF2EC", border: "#DCE8DF" }, // mint
  booked:         { body: "#F0F7F1", header: "#E2EFE4", border: "#D0E5D3" }, // green
  follow_up:      { body: "#FCFAEF", header: "#F8F4DE", border: "#EFE9C8" }, // soft yellow
  not_interested: { body: "#F6F6F6", header: "#EEEEEE", border: "#E4E4E4" }, // cool gray
  dnc:            { body: "#FCF4F3", header: "#F8E8E6", border: "#EFD6D2" }, // rose
};

export function PipelineView({
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
  const [error, setError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) {
        throw new Error("Pipeline could not refresh.");
      }
      const data = (await res.json()) as { leads: Lead[] };
      setLeads(data.leads ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline could not refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  const grouped = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      queued: [],
      called: [],
      voicemail: [],
      interested: [],
      booked: [],
      follow_up: [],
      not_interested: [],
      dnc: [],
    };
    for (const lead of leads) {
      const status = (lead.status ?? "new") as LeadStatus;
      map[status]?.push(lead);
    }
    // Sort each column by priority desc
    for (const key of Object.keys(map) as LeadStatus[]) {
      map[key].sort((a, b) => b.priorityScore - a.priorityScore);
    }
    return map;
  }, [leads]);

  async function moveLead(leadId: string, nextStatus: LeadStatus) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || (lead.status ?? "new") === nextStatus) return;
    setError(null);

    // Optimistic update
    setLeads((current) =>
      current.map((l) =>
        l.id === leadId
          ? { ...l, status: nextStatus, statusUpdatedAt: new Date().toISOString() }
          : l
      )
    );

    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: nextStatus }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Lead status could not be updated.");
        await fetchLeads();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lead status could not be updated.");
      await fetchLeads();
    }
  }

  const visibleColumns = showClosed ? [...ACTIVE_COLUMNS, ...CLOSED_COLUMNS] : ACTIVE_COLUMNS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description={`${leads.length} service-sales records across ${visibleColumns.length} stages`}
        actions={
          <>
            <GhostButton
              onClick={() => setShowClosed((s) => !s)}
              iconLeft={
                showClosed ? <EyeSlashIcon size={12} /> : <EyeIcon size={12} />
              }
            >
              {showClosed ? "Hide closed" : "Show closed"}
            </GhostButton>
            <GhostButton
              onClick={fetchLeads}
              iconLeft={<ArrowClockwiseIcon size={12} />}
            >
              Refresh
            </GhostButton>
          </>
        }
      />

      {loading && leads.length === 0 ? (
        <LoadingState label="Loading pipeline…" />
      ) : (
        <>
          {error && (
            <div
              className="rounded-lg border border-[color:var(--danger)]/20 bg-[#FAE3E0] px-4 py-3 text-[13px] text-[#A32A22]"
              role="status"
              aria-live="polite"
            >
              {error}
            </div>
          )}
          <div className="-mx-4 overflow-x-auto overflow-y-hidden pb-4 sm:-mx-6 lg:-mx-8">
            <div className="flex min-w-max gap-3 px-4 sm:px-6 lg:px-8">
              {visibleColumns.map((status) => (
                <Column
                  key={status}
                  status={status}
                  leads={grouped[status]}
                  isDropTarget={dragOverColumn === status}
                  onDragEnter={() => draggingId && setDragOverColumn(status)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(leadId) => {
                    setDragOverColumn(null);
                    setDraggingId(null);
                    moveLead(leadId, status);
                  }}
                >
                  {grouped[status].map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggingId === lead.id}
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverColumn(null);
                      }}
                      onOpen={() => onOpenLead(lead)}
                      onCall={() => onCall(lead)}
                    />
                  ))}
                </Column>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Column ─────────────────────────────────────────────────────────────────

function Column({
  status,
  leads,
  children,
  isDropTarget,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  status: LeadStatus;
  leads: Lead[];
  children: React.ReactNode;
  isDropTarget: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (leadId: string) => void;
}) {
  const tint = COLUMN_TINT[status];
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={onDragEnter}
      onDragLeave={(e) => {
        const nextTarget = e.relatedTarget;
        if (nextTarget instanceof Node && e.currentTarget.contains(nextTarget)) {
          return;
        }
        onDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("text/plain");
        if (leadId) onDrop(leadId);
      }}
      className={cn(
        "w-[260px] shrink-0 rounded-xl border transition-colors sm:w-[280px]",
        isDropTarget && "ring-2 ring-foreground/40"
      )}
      style={{
        backgroundColor: tint.body,
        borderColor: tint.border,
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-3 py-2.5"
        style={{ backgroundColor: tint.header, borderColor: tint.border }}
      >
        <h3 className="text-[12.5px] font-semibold text-foreground flex-1 truncate">
          {LEAD_STATUS_LABELS[status]}
        </h3>
        <span className="tabular-nums text-[11px] text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <ul className="min-h-[120px] space-y-2 p-2">
        {leads.length === 0 ? (
          <li className="px-3 py-6 text-center text-[11.5px] text-muted-foreground">
            No records here
          </li>
        ) : (
          children
        )}
      </ul>
    </div>
  );
}

// ─── Lead card ──────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onCall,
}: {
  lead: Lead;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onCall: () => void;
}) {
  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`Open ${lead.name}`}
      aria-grabbed={isDragging}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group cursor-grab rounded-lg border border-hairline bg-surface p-3 outline-none transition-all",
        "hover:border-foreground/30 hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.06)]",
        "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/10",
        "active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="flex-1 truncate text-[12.5px] font-semibold leading-tight text-foreground">
          {lead.name}
        </p>
        <ScorePill score={lead.priorityScore} />
      </div>

      <p className="text-[11.5px] text-muted-foreground truncate">
        {lead.category} · {lead.city}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <WebsiteBadge status={lead.websiteStatus} />
        {lead.lastCallAt && (
          <span className="text-[10.5px] text-muted-foreground tabular-nums">
            {formatRelativeTime(lead.lastCallAt)}
          </span>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
          className="press inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border border-hairline bg-[color:var(--elevated)] px-2 text-[11.5px] font-medium text-foreground opacity-100 transition-opacity hover:border-foreground hover:bg-foreground hover:text-[color:var(--primary-foreground)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label={`Call ${lead.name}`}
        >
          <PhoneIcon size={11} aria-hidden />
          Call
        </button>
      </div>
    </li>
  );
}
