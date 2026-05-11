"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheckIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  StorefrontIcon,
  TargetIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { AppWorkspaceContext, Lead } from "@/lib/types";
import {
  Card,
  CardHeader,
  GhostButton,
  PrimaryButton,
  Select,
  TextInput,
} from "@/components/app/primitives";

const WEBSITE_OPTIONS: { value: Lead["websiteStatus"]; label: string }[] = [
  { value: "none", label: "No website" },
  { value: "outdated", label: "Outdated site" },
  { value: "modern", label: "Modern site" },
];

const TIMEZONES = [
  { value: "America/Detroit", label: "Eastern - Detroit" },
  { value: "America/New_York", label: "Eastern - New York" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific" },
] as const;

const SERVICE_PRESETS = [
  {
    label: "Home services",
    offer: "Booked service appointments for homeowners and property managers.",
    targetBuyer: "Homeowners, property managers, and local commercial property contacts",
    pitch:
      "We help recover missed calls, follow up on old estimates, reactivate past customers, and book new service jobs.",
    categories: "HVAC, Plumbing, Roofing, Electrical, Landscaping",
  },
  {
    label: "Commercial service",
    offer: "Recurring service contracts and commercial account appointments.",
    targetBuyer: "Property managers, facility managers, office managers, and local business owners",
    pitch:
      "We help service companies open B2B conversations, follow up consistently, and turn interested accounts into booked walkthroughs.",
    categories: "Janitorial, Security, HVAC, Pest control, Commercial cleaning",
  },
  {
    label: "Agency for services",
    offer: "Website, SEO, and booked-call growth services for local service businesses.",
    targetBuyer: "Owner-operated service businesses with missed calls, open estimates, or inconsistent follow-up",
    pitch:
      "We help local service businesses turn missed demand and weak web presence into booked sales conversations.",
    categories: "Auto repair, Chiropractors, Contractors, Salons, Restaurants",
  },
] as const;

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function OnboardingForm({ context }: { context: AppWorkspaceContext }) {
  const router = useRouter();
  const workspace = context.workspace;
  const [companyName, setCompanyName] = useState(
    context.onboarding?.companyName ?? workspace?.name ?? ""
  );
  const [userRole, setUserRole] = useState(context.onboarding?.userRole ?? "Owner");
  const [timezone, setTimezone] = useState(
    context.onboarding?.timezone ?? workspace?.timezone ?? "America/Detroit"
  );
  const [offer, setOffer] = useState(context.onboarding?.offer ?? "");
  const [targetBuyer, setTargetBuyer] = useState(context.onboarding?.targetBuyer ?? "");
  const [pitch, setPitch] = useState(context.onboarding?.pitch ?? "");
  const [targetCities, setTargetCities] = useState(
    context.onboarding?.targetCities.join(", ") ?? ""
  );
  const [targetCategories, setTargetCategories] = useState(
    context.onboarding?.targetCategories.join(", ") ?? ""
  );
  const [websiteStatuses, setWebsiteStatuses] = useState<Lead["websiteStatus"][]>(
    context.onboarding?.websiteStatuses.length
      ? context.onboarding.websiteStatuses
      : ["none", "outdated"]
  );
  const [maxCallsPerDay, setMaxCallsPerDay] = useState(
    String(context.onboarding?.maxCallsPerDay ?? 20)
  );
  const [maxCostPerDay, setMaxCostPerDay] = useState(
    String(((context.onboarding?.maxCostPerDayCents ?? 500) / 100).toFixed(2))
  );
  const [weekendPause, setWeekendPause] = useState(
    context.onboarding?.weekendPause ?? true
  );
  const [bookingEmail, setBookingEmail] = useState(
    context.onboarding?.bookingEmail ?? context.user.email
  );
  const [notificationEmail, setNotificationEmail] = useState(
    context.onboarding?.notificationEmail ?? context.user.email
  );
  const [complianceAccepted, setComplianceAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<{ title: string; hint: string } | null>(null);

  const readiness = useMemo(
    () => [
      { label: "Workspace", ready: companyName.trim().length > 1 },
      { label: "Offer", ready: offer.trim().length > 5 && targetBuyer.trim().length > 2 },
      { label: "Targets", ready: splitList(targetCities).length > 0 },
      { label: "Campaign rules", ready: splitList(targetCategories).length > 0 },
      { label: "Compliance", ready: complianceAccepted },
    ],
    [companyName, offer, targetBuyer, targetCities, targetCategories, complianceAccepted]
  );

  function clientValidationError(): { title: string; hint: string } | null {
    if (companyName.trim().length < 2) {
      return {
        title: "Add your company name",
        hint: "We use this to identify your workspace across the CRM and on outbound calls.",
      };
    }
    if (offer.trim().length < 6) {
      return {
        title: "Tell the agent what you sell",
        hint: "A sentence or two is enough — the AI uses it to explain why a lead should care.",
      };
    }
    if (targetBuyer.trim().length < 2) {
      return {
        title: "Describe your best buyer",
        hint: "Who is this offer for? Industries, business size, or anything that helps the agent qualify.",
      };
    }
    if (splitList(targetCities).length === 0) {
      return {
        title: "Add at least one target city",
        hint: "Type cities separated by commas — e.g. Detroit, Royal Oak, Birmingham.",
      };
    }
    if (websiteStatuses.length === 0) {
      return {
        title: "Pick at least one website fit",
        hint: "Choose which kinds of sites you want to call into — none, outdated, or modern.",
      };
    }
    if (!complianceAccepted) {
      return {
        title: "Confirm the compliance rules",
        hint: "Tick the box at the bottom — Prospkt won't dial anyone until guardrails are acknowledged.",
      };
    }
    return null;
  }

  function humanize(message: string): { title: string; hint: string } {
    const lower = message.toLowerCase();
    if (lower.includes("unauthorized") || lower.includes("sign in")) {
      return {
        title: "Your session expired",
        hint: "Refresh the page and sign in again, then come back to finish setup.",
      };
    }
    if (lower.includes("workspace") && lower.includes("not")) {
      return {
        title: "We couldn't find your workspace",
        hint: "Refresh the page — if it persists, sign out and back in to recreate the workspace.",
      };
    }
    if (lower.includes("email")) {
      return {
        title: "One of the email fields looks off",
        hint: "Double-check the booking email and notification email are valid addresses.",
      };
    }
    if (lower.includes("network") || lower.includes("fetch")) {
      return {
        title: "Couldn't reach the server",
        hint: "Check your connection and try again — nothing was saved.",
      };
    }
    if (lower.includes("must contain") || lower.includes("at least") || lower.includes("invalid")) {
      return {
        title: "One of the fields needs another look",
        hint: message.charAt(0).toUpperCase() + message.slice(1),
      };
    }
    return {
      title: "We couldn't finish setup",
      hint: "Try again in a moment. If it keeps happening, refresh the page.",
    };
  }

  function applyPreset(preset: (typeof SERVICE_PRESETS)[number]) {
    setOffer(preset.offer);
    setTargetBuyer(preset.targetBuyer);
    setPitch(preset.pitch);
    setTargetCategories(preset.categories);
  }

  async function submit() {
    if (!workspace || saving) return;
    const localIssue = clientValidationError();
    if (localIssue) {
      setFormError(localIssue);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          userRole,
          timezone,
          offer,
          targetBuyer,
          pitch,
          targetCities: splitList(targetCities),
          targetCategories: splitList(targetCategories),
          websiteStatuses,
          maxCallsPerDay: Number(maxCallsPerDay),
          maxCostPerDayCents: Math.round(Number(maxCostPerDay) * 100),
          weekendPause,
          bookingEmail,
          notificationEmail,
          complianceAccepted,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setFormError(humanize(data.error ?? "Could not complete onboarding"));
        return;
      }
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setFormError(humanize(err instanceof Error ? err.message : "network error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            {context.user.name}&apos;s workspace
          </p>
          <h1 className="mt-2 text-balance text-[34px] font-semibold leading-tight text-foreground">
            Set up your service-sales agent before it touches a lead.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground">
            This becomes the source of truth for campaign lanes, CRM memory,
            scripts, daily caps, booking handoff, and compliance behavior.
          </p>
        </div>

        <Card>
          <CardHeader
            title="Workspace"
            description="Company identity and timezone used across CRM, reports, and calling windows."
            divided={false}
          />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <TextInput
              label="Company name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Roofing"
            />
            <TextInput
              label="Your role"
              value={userRole}
              onChange={(event) => setUserRole(event.target.value)}
              placeholder="Owner"
            />
            <div className="space-y-1.5">
              <p className="text-[11.5px] font-medium text-muted-foreground">
                Primary timezone
              </p>
              <Select
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES}
                className="h-10 w-full"
                label="Primary timezone"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Service positioning"
            description="Start from a preset, then tune the offer and buyer language for your market."
            divided={false}
          />
          <div className="grid gap-4 px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {SERVICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium text-foreground transition hover:bg-[color:var(--elevated)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <TextArea
              label="What do you sell?"
              value={offer}
              onChange={setOffer}
              placeholder="Booked service appointments for homeowners and property managers."
            />
            <TextInput
              label="Best buyer"
              value={targetBuyer}
              onChange={(event) => setTargetBuyer(event.target.value)}
              placeholder="Homeowners, property managers, local business owners"
            />
            <TextArea
              label="Preferred positioning"
              value={pitch}
              onChange={setPitch}
              placeholder="We recover missed calls, follow up on estimates, and book qualified service jobs."
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Targeting"
            description="Comma-separated values are fine for now; they become structured target rules."
            divided={false}
          />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <TextInput
              label="Target cities"
              value={targetCities}
              onChange={(event) => setTargetCities(event.target.value)}
              placeholder="Detroit, Grand Rapids, Ann Arbor"
            />
            <TextInput
              label="Target categories"
              value={targetCategories}
              onChange={(event) => setTargetCategories(event.target.value)}
              placeholder="HVAC, Plumbing, Roofing, Electrical"
            />
            <div className="sm:col-span-2">
              <p className="mb-2 text-[11.5px] font-medium text-muted-foreground">
                Website fit
              </p>
              <div className="flex flex-wrap gap-2">
                {WEBSITE_OPTIONS.map((option) => {
                  const active = websiteStatuses.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setWebsiteStatuses((current) =>
                          active
                            ? current.filter((value) => value !== option.value)
                            : [...current, option.value]
                        )
                      }
                      className={cn(
                        "inline-flex h-8 items-center rounded-lg border px-3 text-[12.5px] font-medium transition-colors",
                        active
                          ? "border-foreground bg-foreground text-white"
                          : "border-border bg-surface text-foreground hover:bg-[color:var(--elevated)]"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Limits and handoff"
            description="Guardrails are strict by default: warm first, 20 calls, $5, local 8am-9pm, no weekends."
            divided={false}
          />
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <TextInput
              label="Daily calls"
              type="number"
              min={1}
              max={100}
              value={maxCallsPerDay}
              onChange={(event) => setMaxCallsPerDay(event.target.value)}
            />
            <TextInput
              label="Daily spend"
              type="number"
              min={1}
              step="0.01"
              value={maxCostPerDay}
              onChange={(event) => setMaxCostPerDay(event.target.value)}
            />
            <TextInput
              label="Booking email"
              type="email"
              value={bookingEmail}
              onChange={(event) => setBookingEmail(event.target.value)}
            />
            <TextInput
              label="Owner notification email"
              type="email"
              value={notificationEmail}
              onChange={(event) => setNotificationEmail(event.target.value)}
            />
            <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] font-medium text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={weekendPause}
                onChange={(event) => setWeekendPause(event.target.checked)}
                className="size-4 accent-foreground"
              />
              Pause outbound calls on weekends
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Compliance"
            description="Required before Prospkt can run live calls, SMS handoffs, or consumer outreach."
            divided={false}
          />
          <div className="space-y-4 px-5 pb-5">
            <label className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <input
                type="checkbox"
                checked={complianceAccepted}
                onChange={(event) => setComplianceAccepted(event.target.checked)}
                className="mt-0.5 size-4 accent-foreground"
              />
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  I understand Prospkt follows guarded outbound rules.
                </span>
                <span className="mt-1 block text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                  The agent will enforce internal DNC, STOP opt-outs, local
                  calling windows, daily caps, weekend pause, and SMS only after
                  interest, booking, or opt-out. Cold consumer outreach is not
                  enabled by default and requires source/consent context.
                </span>
              </span>
            </label>
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-[color:var(--danger)]/25 bg-[#FAE3E0] px-3 py-2.5 text-[color:var(--danger)]"
              >
                <p className="text-[12.5px] font-semibold leading-tight">
                  {formError.title}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-[color:var(--danger)]/85">
                  {formError.hint}
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <GhostButton type="button" onClick={() => router.push("/")}>
                Back to site
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={submit}
                loading={saving}
              >
                Finish setup
              </PrimaryButton>
            </div>
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-6">
        <Card>
          <CardHeader
            title="Setup checklist"
            description="These gates keep the agent controlled."
            divided={false}
          />
          <div className="space-y-2 px-5 pb-5">
            {readiness.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-[12.5px] font-medium text-foreground">
                  {item.label}
                </span>
                <CheckCircleIcon
                  size={16}
                  weight={item.ready ? "fill" : "regular"}
                  color={item.ready ? "#2E7D4F" : "#9F9F9E"}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-4 grid gap-2">
          <MiniStep icon={StorefrontIcon} label="Workspace memory" />
          <MiniStep icon={TargetIcon} label="Campaign lanes" />
          <MiniStep icon={SlidersHorizontalIcon} label="Daily budgets" />
          <MiniStep icon={CalendarCheckIcon} label="Booking handoff" />
          <MiniStep icon={ShieldCheckIcon} label="Compliance lock" />
        </div>
      </aside>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[11.5px] font-medium text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] leading-relaxed outline-none transition focus:border-foreground focus:ring-2 focus:ring-foreground/10"
      />
    </label>
  );
}

function MiniStep({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2">
      <Icon size={14} color="#6B6B6B" aria-hidden />
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
