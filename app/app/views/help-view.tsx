"use client";

import {
  LightningIcon,
  PhoneIcon,
  ShieldCheckIcon,
  KeyIcon,
  BookOpenIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { Card, CardHeader, PageHeader } from "@/components/app/primitives";

type Shortcut = { keys: string[]; description: string };
type EnvRow = { key: string; purpose: string };

const shortcuts: Shortcut[] = [
  { keys: ["1"], description: "Jump to Home" },
  { keys: ["2"], description: "Jump to Campaigns" },
  { keys: ["3"], description: "Jump to CRM" },
  { keys: ["4"], description: "Jump to Pipeline" },
  { keys: ["5"], description: "Jump to Calls" },
  { keys: ["6"], description: "Jump to Bookings" },
  { keys: [","], description: "Open Settings" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["Esc"], description: "Close dialog" },
  { keys: ["Enter"], description: "Confirm in dialog" },
];

const envVars: EnvRow[] = [
  { key: "ANTHROPIC_API_KEY", purpose: "AI script generation" },
  { key: "VAPI_API_KEY", purpose: "Vapi voice calls" },
  { key: "VAPI_PHONE_NUMBER_ID", purpose: "Outbound Vapi number" },
  { key: "CALCOM_API_KEY", purpose: "Cal.com booking creation" },
  { key: "CALCOM_EVENT_TYPE_ID", purpose: "Discovery call event type" },
  { key: "YELP_API_KEY", purpose: "Lead scraping" },
  { key: "TWILIO_ACCOUNT_SID", purpose: "SMS follow-ups" },
  { key: "TWILIO_AUTH_TOKEN", purpose: "SMS auth" },
  { key: "TWILIO_PHONE_NUMBER", purpose: "SMS sender" },
  { key: "ELEVENLABS_API_KEY", purpose: "Premium voice (optional)" },
];

const steps: { n: number; title: string; body: string }[] = [
  {
    n: 1,
    title: "Fill in your .env.local",
    body: "Copy the env var names below into .env.local at the repo root. Restart the dev server after.",
  },
  {
    n: 2,
    title: "Choose a campaign lane",
    body: "Start with warm recovery when you have missed calls, form fills, old estimates, or past customers. Cold B2B is available for sourced business contacts.",
  },
  {
    n: 3,
    title: "Review the CRM",
    body: "Each record stores contact type, source, service need, area, estimate value, next follow-up, and consent/source notes.",
  },
  {
    n: 4,
    title: "Run the sales rep",
    body: "Use Home to dry-run, launch, pause, and inspect skip reasons before the AI sales rep calls a batch.",
  },
  {
    n: 5,
    title: "Book jobs and log memory",
    body: "Bookings land in the Bookings tab, while every call, skip, opt-out, note, transcript, and follow-up stays on the CRM record.",
  },
];

export function HelpView() {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="How Prospkt works"
        description="A guarded AI sales rep for service businesses: it follows up, calls, books, and logs revenue opportunities while the owner stays in control."
      />

      <Card>
          <CardHeader
            title="Quick start"
            description="Get from service-business setup to your first controlled campaign in five steps."
        />
        <ol className="divide-y divide-hairline">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4 px-5 py-4">
              <div
                className="size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: "var(--muted)",
                  border: "1px solid var(--hairline)",
                }}
              >
                <span className="text-[11.5px] font-semibold tabular-nums text-foreground">
                  {s.n}
                </span>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-foreground">
                  {s.title}
                </p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5 max-w-prose">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Keyboard shortcuts"
            description="Move through Prospkt without a mouse."
          />
          <ul className="divide-y divide-hairline">
            {shortcuts.map((sh) => (
              <li
                key={sh.description}
                className="flex items-center justify-between px-5 py-2.5"
              >
                <span className="text-[13px] text-foreground">
                  {sh.description}
                </span>
                <div className="flex items-center gap-1">
                  {sh.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Compliance pillars"
            description="TCPA and DNC are enforced end-to-end."
          />
          <ul className="divide-y divide-hairline">
            <li className="flex items-start gap-3 px-5 py-4">
              <ShieldCheckIcon
                size={15}
                color="#2E7D4F"
                weight="fill"
                aria-hidden
                className="mt-0.5"
              />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  AI announces itself
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Every call opens with an automated-caller disclosure.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <ShieldCheckIcon
                size={15}
                color="#2E7D4F"
                weight="fill"
                aria-hidden
                className="mt-0.5"
              />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Opt-out honored instantly
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Numbers are added to the DNC list on-call.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <ShieldCheckIcon
                size={15}
                color="#2E7D4F"
                weight="fill"
                aria-hidden
                className="mt-0.5"
              />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  8am – 9pm ET only
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Outbound calls outside TCPA hours are blocked.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <ShieldCheckIcon
                size={15}
                color="#2E7D4F"
                weight="fill"
                aria-hidden
                className="mt-0.5"
              />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Consumer cold outreach is gated
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Consumer campaigns require source context, consent notes, DNC checks, disclosure, and owner acknowledgement.
                </p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Environment variables"
          description="Configure these in .env.local. Status indicators on the Settings tab show what's wired up."
        />
        <ul className="divide-y divide-hairline">
          {envVars.map((e) => (
            <li key={e.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5">
              <KeyIcon size={13} color="#9F9F9E" aria-hidden />
              <code className="min-w-[14rem] font-mono text-[12px] text-foreground">
                {e.key}
              </code>
              <span className="text-[12.5px] text-muted-foreground">
                {e.purpose}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ResourceLink
          icon={LightningIcon}
          title="Vapi docs"
          href="https://docs.vapi.ai"
          description="Voice API reference"
        />
        <ResourceLink
          icon={PhoneIcon}
          title="Cal.com API"
          href="https://cal.com/docs/api-reference"
          description="Booking endpoints"
        />
        <ResourceLink
          icon={BookOpenIcon}
          title="TCPA overview"
          href="https://www.fcc.gov/general/telemarketing-and-robocalls"
          description="FCC guidelines"
        />
      </div>
    </div>
  );
}

function ResourceLink({
  icon: Icon,
  title,
  href,
  description,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-4 hover:border-foreground/40 transition-colors flex items-start gap-3 group"
    >
      <span
        className="size-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--muted)" }}
      >
        <Icon size={14} color="#0A0A0A" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground inline-flex items-center gap-1">
          {title}
          <ArrowSquareOutIcon
            size={11}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition"
            aria-hidden
          />
        </p>
        <p className="text-[11.5px] text-muted-foreground">{description}</p>
      </span>
    </a>
  );
}
