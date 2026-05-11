"use client";

import { useEffect, useState } from "react";
import {
  PhoneIcon,
  CheckCircleIcon,
  WarningIcon,
  ClockIcon,
  ShieldWarningIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isInsideTcpaHours } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AccentButton, GhostButton } from "./primitives";

const E164 = /^\+[1-9]\d{6,14}$/;

const demoScenarios = [
  {
    id: "missed-call",
    label: "Missed call",
    description: "Warm callback, qualify need, book the next slot.",
    contactName: "Test homeowner",
    category: "Home service",
    city: "Detroit",
    serviceNeed: "missed call follow-up",
    source: "Voice demo / missed call",
    consentNote: "User-owned demo number for voice testing.",
    campaignLane: "warm_recovery",
    contactType: "consumer",
    playbook: "missed-call-recovery",
    websiteStatus: "modern",
  },
  {
    id: "estimate",
    label: "Estimate follow-up",
    description: "Revive an open quote without sounding pushy.",
    contactName: "Open estimate contact",
    category: "Roofing",
    city: "Grand Rapids",
    serviceNeed: "open estimate follow-up",
    source: "Voice demo / open estimate",
    consentNote: "User-owned demo number for voice testing.",
    campaignLane: "warm_recovery",
    contactType: "consumer",
    playbook: "estimate-follow-up",
    websiteStatus: "modern",
  },
  {
    id: "commercial",
    label: "Commercial B2B",
    description: "Polite outbound to a property or business buyer.",
    contactName: "Northline Property Group",
    category: "Property management",
    city: "Lansing",
    serviceNeed: "commercial service outreach",
    source: "Voice demo / sourced business list",
    consentNote: "User-owned demo number for voice testing.",
    campaignLane: "cold_b2b",
    contactType: "business",
    playbook: "new-customer-outreach",
    websiteStatus: "outdated",
  },
] as const;

type DemoScenario = (typeof demoScenarios)[number];
type DemoScenarioId = DemoScenario["id"];

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export function TestCallDialog({
  open,
  onClose,
  onInitiated,
}: {
  open: boolean;
  onClose: () => void;
  onInitiated?: (callId: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [scenarioId, setScenarioId] = useState<DemoScenarioId>("missed-call");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [serviceNeed, setServiceNeed] = useState("");
  const [skipDnc, setSkipDnc] = useState(false);
  const [dialing, setDialing] = useState(false);
  const [result, setResult] = useState<{ callId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setUsage(null);
    let cancelled = false;
    fetch("/api/agent/vapi-usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.used !== "number") return;
        setUsage({ used: data.used, limit: data.limit ?? 10 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const normalized = normalizePhone(phone);
  const phoneValid = E164.test(normalized);
  const phoneTouched = phone.trim().length > 0;
  const selectedScenario =
    demoScenarios.find((scenario) => scenario.id === scenarioId) ?? demoScenarios[0];

  async function startCall() {
    if (!phoneValid) {
      setError("Enter a phone number with country code, e.g. +15551234567.");
      return;
    }
    setDialing(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalized,
          businessName: businessName.trim() || selectedScenario.contactName,
          category: category.trim() || selectedScenario.category,
          city: city.trim() || selectedScenario.city,
          websiteStatus: selectedScenario.websiteStatus,
          serviceNeed: serviceNeed.trim() || selectedScenario.serviceNeed,
          source: selectedScenario.source,
          consentNote: selectedScenario.consentNote,
          campaignLane: selectedScenario.campaignLane,
          contactType: selectedScenario.contactType,
          playbook: selectedScenario.playbook,
          skipDnc,
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
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md rounded-2xl p-6"
        style={{ fontFamily: "'Switzer', sans-serif" }}
      >
        <DialogHeader>
          <p className="label-caps mb-1.5">Voice demo</p>
          <DialogTitle className="text-[18px] font-semibold text-foreground">
            Hear the sales receptionist
          </DialogTitle>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Run a live demo to your own phone or a sandbox line. The rep uses the
            same human-paced sales and front-desk behavior as production calls.
          </p>
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
                The sales receptionist is dialing {phone} now.
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
            <div className="space-y-2">
              <p className="label-caps">Demo scenario</p>
              <div className="grid gap-2">
                {demoScenarios.map((scenario) => {
                  const active = scenario.id === scenarioId;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setScenarioId(scenario.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-foreground bg-[color:var(--elevated)]"
                          : "border-border bg-surface hover:bg-[color:var(--elevated)]"
                      )}
                    >
                      <span className="block text-[12.5px] font-semibold text-foreground">
                        {scenario.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground">
                        {scenario.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="test-phone" className="label-caps block">
                Your phone number
              </label>
              <input
                id="test-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[14px] font-mono tabular-nums outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !dialing && phoneValid) startCall();
                }}
              />
              {phoneTouched && phoneValid && normalized !== phone.trim() ? (
                <p className="text-[11.5px] text-[#2E7D4F]">
                  Will dial <span className="font-mono">{normalized}</span>
                </p>
              ) : phoneTouched && !phoneValid ? (
                <p className="text-[11.5px] text-[#9A6619]">
                  Add country code, e.g. <span className="font-mono">+1{phone.replace(/\D/g, "").slice(0, 10) || "5551234567"}</span>
                </p>
              ) : (
                <p className="text-[11.5px] text-muted-foreground">
                  E.164 format · 10-digit US numbers auto-prefix with +1
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="test-name" className="label-caps block">
                  Contact / business
                </label>
                <input
                  id="test-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={selectedScenario.contactName}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="test-city" className="label-caps block">
                  City
                </label>
                <input
                  id="test-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={selectedScenario.city}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="test-category" className="label-caps block">
                  Service category
                </label>
                <input
                  id="test-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={selectedScenario.category}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="test-service-need" className="label-caps block">
                  Call reason
                </label>
                <input
                  id="test-service-need"
                  type="text"
                  value={serviceNeed}
                  onChange={(e) => setServiceNeed(e.target.value)}
                  placeholder={selectedScenario.serviceNeed}
                  className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-border bg-[color:var(--elevated)] px-3 py-2.5 text-[12.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={skipDnc}
                onChange={(e) => setSkipDnc(e.target.checked)}
                className="mt-0.5 accent-foreground"
              />
              <span className="text-foreground">
                I own this number — skip the Do-Not-Call check
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Required for a realistic voice demo to your own phone or a test line.
                </span>
              </span>
            </label>

            {usage && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px]"
                style={
                  usage.used >= usage.limit
                    ? { backgroundColor: "rgba(194,53,44,0.08)", color: "#A32A22" }
                    : usage.used >= Math.max(1, usage.limit - 2)
                    ? { backgroundColor: "rgba(180,122,31,0.1)", color: "#9A6619" }
                    : { backgroundColor: "rgba(75,95,174,0.08)", color: "#3F4E8C" }
                }
                role="status"
              >
                <PhoneIcon size={13} weight="fill" aria-hidden className="mt-px" />
                <span>
                  {usage.used >= usage.limit ? (
                    <>
                      Vapi daily limit reached ({usage.used}/{usage.limit}). Import a
                      Twilio number in Vapi to remove the cap.
                    </>
                  ) : (
                    <>
                      Vapi usage today: <span className="font-mono">{usage.used}/{usage.limit}</span>{" "}
                      calls placed.
                    </>
                  )}
                </span>
              </div>
            )}

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
                  Outside TCPA hours (8 AM – 9 PM local). Carriers may still place the
                  call but compliance flags will fire.
                </span>
              </div>
            )}

            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px]"
              style={{
                backgroundColor: "rgba(75,95,174,0.08)",
                color: "#3F4E8C",
              }}
            >
              <ShieldWarningIcon size={13} weight="fill" aria-hidden className="mt-px" />
              <span>
                The rep will identify as AI naturally and offer an opt-out, per TCPA.
              </span>
            </div>

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
                disabled={!phoneValid || (usage !== null && usage.used >= usage.limit)}
                loading={dialing}
                iconLeft={!dialing ? <PhoneIcon size={13} weight="fill" /> : undefined}
                className="flex-1 justify-center"
              >
                {dialing ? "Dialing…" : "Call my phone"}
              </AccentButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
