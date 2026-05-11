"use client";

import { useEffect, useState } from "react";
import {
  PhoneIcon,
  CheckCircleIcon,
  WarningIcon,
  ClockIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lead } from "@/lib/types";
import { isInsideTcpaHours } from "@/lib/format";
import { AccentButton, GhostButton, ScorePill, WebsiteBadge } from "./primitives";

export function DialDialog({
  lead,
  onClose,
  onInitiated,
}: {
  lead: Lead | null;
  onClose: () => void;
  onInitiated?: (callId: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [dialing, setDialing] = useState(false);
  const [result, setResult] = useState<{ callId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setPhone(lead.phone);
      setResult(null);
      setError(null);
    }
  }, [lead]);

  async function startCall() {
    if (!lead || !phone.trim()) return;
    setDialing(true);
    setError(null);
    try {
      const res = await fetch("/api/vapi/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          category: lead.category,
          city: lead.city,
          websiteStatus: lead.websiteStatus,
          priorityScore: lead.priorityScore,
          phone,
        }),
      });
      const data = (await res.json()) as { callId?: string; error?: string };
      if (!res.ok || data.error || !data.callId) {
        setError(data.error ?? "Unknown error");
        return;
      }
      setResult({ callId: data.callId });
      onInitiated?.(data.callId);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setDialing(false);
    }
  }

  const outsideHours = !isInsideTcpaHours();

  return (
    <Dialog open={lead !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md rounded-2xl p-6"
        style={{ fontFamily: "'Switzer', sans-serif" }}
      >
        <DialogHeader>
          <p className="label-caps mb-1.5">Outbound call</p>
          <DialogTitle className="text-[18px] font-semibold text-foreground">
            {lead?.name}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-6">
            <div
              className="size-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(46,125,79,0.12)" }}
            >
              <CheckCircleIcon size={26} color="#2E7D4F" weight="fill" aria-hidden />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-foreground">
                Call initiated
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                The AI is dialing {lead?.name} now.
              </p>
              <p className="text-[11px] font-mono text-[color:var(--subtle)] mt-1">
                {result.callId}
              </p>
            </div>
            <AccentButton onClick={onClose} className="mt-2">
              Done
            </AccentButton>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Lead summary */}
            <div className="rounded-xl border border-hairline bg-[color:var(--elevated)] px-4 py-3 space-y-1.5">
              <p className="text-[13px] text-foreground">
                <span className="font-medium">{lead?.category}</span>
                <span className="text-muted-foreground"> · {lead?.city}, MI</span>
              </p>
              <div className="flex items-center gap-3">
                {lead && <WebsiteBadge status={lead.websiteStatus} />}
                <span className="text-muted-foreground text-[12.5px]">·</span>
                <span className="text-[12.5px] text-muted-foreground">
                  Priority
                </span>
                {lead && <ScorePill score={lead.priorityScore} />}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="dial-phone"
                className="label-caps block"
              >
                Phone number
              </label>
              <input
                id="dial-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[14px] font-mono tabular-nums outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !dialing && phone.trim()) startCall();
                }}
              />
              <p className="text-[11.5px] text-muted-foreground">
                E.164 format · <kbd>Enter</kbd> to dial
              </p>
            </div>

            {/* TCPA warning */}
            {outsideHours && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px]"
                style={{
                  backgroundColor: "rgba(180,122,31,0.1)",
                  color: "#9A6619",
                }}
                role="alert"
              >
                <ClockIcon size={13} weight="fill" aria-hidden className="mt-px" />
                <span>
                  Outside TCPA hours (8 AM – 9 PM ET). The call will be blocked.
                </span>
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px]"
                style={{
                  backgroundColor: "rgba(194,53,44,0.08)",
                  color: "#A32A22",
                }}
                role="alert"
              >
                <WarningIcon size={13} weight="fill" aria-hidden className="mt-px" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <GhostButton onClick={onClose} className="flex-1 justify-center">
                Cancel
              </GhostButton>
              <AccentButton
                onClick={startCall}
                disabled={!phone.trim()}
                loading={dialing}
                iconLeft={!dialing ? <PhoneIcon size={13} weight="fill" /> : undefined}
                className="flex-1 justify-center"
              >
                {dialing ? "Dialing…" : "Start call"}
              </AccentButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
