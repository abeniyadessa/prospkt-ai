"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PhoneIcon,
  ArrowClockwiseIcon,
  TextAlignLeftIcon,
  DownloadIcon,
  RecordIcon,
} from "@phosphor-icons/react";
import type { VapiCallRecord } from "@/lib/types";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import {
  Card,
  EmptyState,
  GhostButton,
  LoadingState,
  PageHeader,
  SearchInput,
  Select,
  StatusDot,
} from "@/components/app/primitives";

type OutcomeFilter = "all" | "answered" | "voicemail" | "no-answer" | "error";

function outcomeBucket(call: VapiCallRecord): OutcomeFilter {
  const o = (call.endedReason ?? call.status ?? "").toLowerCase();
  if (o.includes("voicemail")) return "voicemail";
  if (o.includes("no-answer") || o.includes("busy")) return "no-answer";
  if (o.includes("error") || o.includes("failed")) return "error";
  return "answered";
}

function outcomeColor(bucket: OutcomeFilter): string {
  switch (bucket) {
    case "answered":
      return "#2E7D4F";
    case "voicemail":
      return "#B47A1F";
    case "no-answer":
      return "#9F9F9E";
    case "error":
      return "#C2352C";
    default:
      return "#9F9F9E";
  }
}

export function CallsView({
  onOpenTranscript,
}: {
  onOpenTranscript: (call: VapiCallRecord) => void;
}) {
  const [calls, setCalls] = useState<VapiCallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calls");
      const data = (await res.json()) as { calls: VapiCallRecord[] };
      setCalls(data.calls ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (outcomeFilter !== "all" && outcomeBucket(c) !== outcomeFilter)
        return false;
      if (q) {
        const biz = (c.metadata?.businessName ?? "").toLowerCase();
        const sum = (c.summary ?? "").toLowerCase();
        const tr = (c.transcript ?? "").toLowerCase();
        if (!biz.includes(q) && !sum.includes(q) && !tr.includes(q)) return false;
      }
      return true;
    });
  }, [calls, search, outcomeFilter]);

  const stats = useMemo(() => {
    return calls.reduce<Record<OutcomeFilter, number>>(
      (acc, c) => {
        const b = outcomeBucket(c);
        acc[b] = (acc[b] ?? 0) + 1;
        return acc;
      },
      { all: calls.length, answered: 0, voicemail: 0, "no-answer": 0, error: 0 }
    );
  }, [calls]);

  function exportCsv() {
    const rows = [
      ["Business", "Started", "Duration (s)", "Outcome", "Summary"].join(","),
      ...filtered.map((c) => {
        const dur =
          c.startedAt && c.endedAt
            ? Math.round(
                (new Date(c.endedAt).getTime() -
                  new Date(c.startedAt).getTime()) /
                  1000
              )
            : "";
        const business = (c.metadata?.businessName ?? "").replace(/"/g, '""');
        const summary = (c.summary ?? "").replace(/"/g, '""').replace(/\n/g, " ");
        const outcome = (c.endedReason ?? c.status ?? "").replace(/"/g, '""');
        return [
          `"${business}"`,
          c.startedAt ?? "",
          dur,
          `"${outcome}"`,
          `"${summary}"`,
        ].join(",");
      }),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospkt-calls-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calls"
        description={`${calls.length} ${
          calls.length === 1 ? "call" : "calls"
        } placed through Vapi`}
        actions={
          <>
            <GhostButton
              onClick={exportCsv}
              iconLeft={<DownloadIcon size={12} />}
              disabled={filtered.length === 0}
            >
              Export CSV
            </GhostButton>
            <GhostButton
              onClick={load}
              iconLeft={<ArrowClockwiseIcon size={12} />}
            >
              Refresh
            </GhostButton>
          </>
        }
      />

      {/* Outcome chips */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {(
          [
            { key: "all" as const, label: "All calls", color: "#0A0A0A" },
            { key: "answered" as const, label: "Answered", color: "#2E7D4F" },
            { key: "voicemail" as const, label: "Voicemail", color: "#B47A1F" },
            { key: "no-answer" as const, label: "No answer", color: "#9F9F9E" },
            { key: "error" as const, label: "Errors", color: "#C2352C" },
          ]
        ).map((chip) => {
          const active = outcomeFilter === chip.key;
          const count = stats[chip.key] ?? 0;
          return (
            <button
              key={chip.key}
              onClick={() => setOutcomeFilter(chip.key)}
              className={`card px-4 py-3 text-left transition-colors ${
                active
                  ? "border-foreground"
                  : "hover:border-[color:var(--border)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: chip.color }}
                  aria-hidden
                />
                <p className="truncate text-[11.5px] font-medium text-muted-foreground">
                  {chip.label}
                </p>
              </div>
              <p className="mt-2 text-[22px] font-semibold tabular-nums tracking-tight text-foreground">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by business, summary, or transcript…"
            className="min-w-[220px] flex-1 lg:max-w-md"
          />
          <Select
            value={outcomeFilter}
            onChange={(v) => setOutcomeFilter(v as OutcomeFilter)}
            options={[
              { value: "all" as const, label: "All outcomes" },
              { value: "answered" as const, label: "Answered" },
              { value: "voicemail" as const, label: "Voicemail" },
              { value: "no-answer" as const, label: "No answer" },
              { value: "error" as const, label: "Errors" },
            ]}
            label="Outcome filter"
          />
          <span className="ml-auto text-[11.5px] tabular-nums text-muted-foreground max-sm:ml-0">
            {filtered.length} / {calls.length}
          </span>
        </div>

        {loading ? (
          <LoadingState label="Loading calls…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PhoneIcon}
            title={calls.length === 0 ? "No calls yet" : "No matching calls"}
            description={
              calls.length === 0
                ? "Dial a CRM record to get started."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: "var(--elevated)" }}>
                  {["Business", "When", "Duration", "Outcome", "Summary", ""].map(
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
                {filtered.map((call) => {
                  const business =
                    call.metadata?.businessName ?? call.assistant?.name ?? "Unknown";
                  const bucket = outcomeBucket(call);
                  const color = outcomeColor(bucket);
                  const duration =
                    call.startedAt && call.endedAt
                      ? Math.round(
                          (new Date(call.endedAt).getTime() -
                            new Date(call.startedAt).getTime()) /
                            1000
                        )
                      : null;
                  const outcomeLabel = (call.endedReason ?? call.status ?? "—").replace(
                    /-/g,
                    " "
                  );
                  return (
                    <tr
                      key={call.id}
                      className="border-t border-hairline hover:bg-[color:var(--elevated)] transition-colors cursor-pointer"
                      onClick={() => onOpenTranscript(call)}
                    >
                      <td className="max-w-[18rem] px-4 py-3 font-medium text-foreground sm:px-5">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{business}</span>
                          {call.recordingUrl && (
                            <RecordIcon
                              size={11}
                              color="#C2352C"
                              weight="fill"
                              aria-label="Has recording"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] tabular-nums text-muted-foreground sm:px-5">
                        {call.startedAt ? formatRelativeTime(call.startedAt) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-muted-foreground sm:px-5">
                        {duration !== null ? formatDuration(duration) : "—"}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <StatusDot color={color} label={outcomeLabel} />
                      </td>
                      <td className="max-w-[20rem] px-4 py-3 sm:px-5">
                        <p className="text-[12px] truncate text-muted-foreground">
                          {call.summary ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
                          <TextAlignLeftIcon size={12} aria-hidden />
                          View
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
