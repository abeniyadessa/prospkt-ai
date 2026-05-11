"use client";

import {
  TextAlignLeftIcon,
  RecordIcon,
  ArrowSquareOutIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { VapiCallRecord } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { StatusDot } from "./primitives";

function getOutcomeColor(outcome?: string): string {
  if (!outcome) return "#9F9F9E";
  if (outcome.includes("voicemail")) return "#B47A1F";
  if (outcome.includes("no-answer") || outcome.includes("busy")) return "#9F9F9E";
  if (outcome.includes("error") || outcome.includes("failed")) return "#C2352C";
  return "#2E7D4F";
}

export function TranscriptDialog({
  call,
  onClose,
}: {
  call: VapiCallRecord | null;
  onClose: () => void;
}) {
  if (!call) return null;

  const duration =
    call.startedAt && call.endedAt
      ? Math.round(
          (new Date(call.endedAt).getTime() -
            new Date(call.startedAt).getTime()) /
            1000
        )
      : null;

  const outcome = call.endedReason ?? call.status;
  const businessName = call.metadata?.businessName ?? "Unknown business";

  return (
    <Dialog open={!!call} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl rounded-2xl p-6"
        style={{ fontFamily: "'Switzer', sans-serif" }}
      >
        <DialogHeader>
          <p className="label-caps mb-1.5">Call transcript</p>
          <DialogTitle className="text-[18px] font-semibold text-foreground">
            {businessName}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            {call.startedAt && (
              <span className="tabular-nums">
                {new Date(call.startedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
            {duration && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <ClockIcon size={11} aria-hidden />
                  {formatDuration(duration)}
                </span>
              </>
            )}
            {outcome && (
              <>
                <span>·</span>
                <StatusDot
                  color={getOutcomeColor(outcome)}
                  label={outcome.replace(/-/g, " ")}
                />
              </>
            )}
            {call.recordingUrl && (
              <a
                href={call.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 font-medium text-[color:var(--accent)] hover:underline"
              >
                <RecordIcon size={12} aria-hidden />
                Listen
                <ArrowSquareOutIcon size={11} aria-hidden />
              </a>
            )}
          </div>

          {/* Summary */}
          {call.summary && (
            <div className="rounded-xl border border-hairline bg-[color:var(--elevated)] p-4">
              <p className="label-caps mb-2">Summary</p>
              <p className="text-[13.5px] leading-relaxed text-foreground">
                {call.summary}
              </p>
            </div>
          )}

          {/* Transcript */}
          {call.transcript ? (
            <div>
              <p className="label-caps mb-2">Full transcript</p>
              <div className="rounded-xl border border-hairline p-4 space-y-3 bg-surface">
                {call.transcript
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, i) => {
                    const lower = line.toLowerCase();
                    const isAI =
                      lower.startsWith("ai:") || lower.startsWith("assistant:");
                    return (
                      <p
                        key={i}
                        className="text-[13px] leading-relaxed"
                        style={{
                          color: isAI ? "#0A0A0A" : "#6B6B6B",
                        }}
                      >
                        {line}
                      </p>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 border border-dashed border-border rounded-xl">
              <TextAlignLeftIcon
                size={22}
                color="#9F9F9E"
                aria-hidden
              />
              <p className="text-[13px] text-muted-foreground">
                No transcript available for this call
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
