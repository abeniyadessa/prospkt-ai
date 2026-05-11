import type { ReactNode } from "react";
import Link from "next/link";
import {
  LightningIcon,
  ArrowRightIcon,
  CalendarIcon,
  CalendarCheckIcon,
  ShieldCheckIcon,
  CheckIcon,
  RecordIcon,
  StarIcon,
  ArrowSquareOutIcon,
  CircleNotchIcon,
  WaveformIcon,
  SparkleIcon,
  WrenchIcon,
  ScissorsIcon,
  StorefrontIcon,
  HeartbeatIcon,
  HammerIcon,
  ForkKnifeIcon,
  StackIcon,
  LockIcon,
  PlugsIcon,
  QuotesIcon,
  PhoneCallIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DatabaseIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function MarketingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <PoweredBy />
        <Stats />
        <Chapters />
        <Industries />
        <Trust />
        <Testimonial />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}

/* Top nav */

function SiteNav() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-hairline backdrop-blur-md"
      style={{ backgroundColor: "color-mix(in srgb, var(--canvas) 88%, transparent)" }}
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span
            className="flex size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: "#0A0A0A" }}
            aria-hidden
          >
            <LightningIcon size={13} weight="fill" color="#FFFFFF" />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            Prospkt
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink href="#chapters">Product</NavLink>
          <NavLink href="#industries">Use cases</NavLink>
          <NavLink href="#trust">Compliance</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden h-8 items-center rounded-lg px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-[color:var(--elevated)] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="press inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
          >
            Start free
            <ArrowRightIcon size={12} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

/* Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <Eyebrow>Live in private beta</Eyebrow>
            <h1 className="mt-5 text-balance text-[44px] font-semibold tracking-[-0.025em] leading-[0.98] text-foreground md:text-[60px] lg:text-[72px]">
              Go to market with <span style={{ color: "#9F9F9E" }}>a guarded AI rep</span> that
              calls, qualifies, and books for you.
            </h1>
            <p className="mt-7 max-w-[560px] text-pretty text-[16px] leading-relaxed text-muted-foreground md:text-[17.5px]">
              Prospkt is a guarded autopilot for local service outbound. It finds prospects with
              broken websites, qualifies the best fit, calls inside strict limits, and drops booked
              calls onto your Cal.com with every action logged.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="press inline-flex h-11 items-center gap-1.5 rounded-lg bg-foreground px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
              >
                Start building for free
                <ArrowRightIcon size={13} />
              </Link>
              <Link
                href="#chapters"
                className="press inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium transition-colors hover:bg-[color:var(--elevated)]"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <RatingBadge label="G2" value="4.9" />
              <RatingBadge label="Operator NPS" value="72" />
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <ShieldCheckIcon size={12} color="#2E7D4F" weight="fill" />
                TCPA enforced at the API layer
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <AgentSystemVisual />
          </div>
        </div>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ backgroundColor: "var(--hairline)" }}
        aria-hidden
      />
    </section>
  );
}

function AgentSystemVisual() {
  const agents = [
    {
      title: "Discovery",
      label: "Find leads",
      icon: MagnifyingGlassIcon,
      className: "left-4 top-8 md:left-8",
      tone: { bg: "#FFE5DB", fg: "#D55B50" },
    },
    {
      title: "Qualifier",
      label: "Score fit",
      icon: FunnelIcon,
      className: "right-3 top-12 md:right-8",
      tone: { bg: "#EFE7FA", fg: "#7752B8" },
    },
    {
      title: "Caller",
      label: "Dial safely",
      icon: PhoneCallIcon,
      className: "left-2 bottom-24 md:left-10",
      tone: { bg: "#E8F0DC", fg: "#5C7A2E" },
    },
    {
      title: "Booking",
      label: "Cal.com sync",
      icon: CalendarCheckIcon,
      className: "right-5 bottom-24 md:right-12",
      tone: { bg: "#FCEFD1", fg: "#B47A1F" },
    },
    {
      title: "CRM memory",
      label: "Log outcome",
      icon: DatabaseIcon,
      className: "left-1/2 top-[78%] -translate-x-1/2",
      tone: { bg: "#E2E7F5", fg: "#4B5FAE" },
    },
  ];

  const events = [
    ["08:31", "Skipped J&H Automotive", "Weekend paused"],
    ["08:32", "Queued Eastbrook Auto", "9/10 fit"],
    ["08:35", "Called Detroit Chiropractic", "Booked"],
  ];

  return (
    <div className="agent-visual relative min-h-[520px] overflow-hidden rounded-[28px] border border-hairline bg-surface p-5 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.28)]">
      <div className="absolute inset-0 agent-grid" aria-hidden />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 560 520"
        fill="none"
        aria-hidden
      >
        <path className="agent-flow-line agent-flow-a" d="M280 250 C190 160 150 115 84 88" />
        <path className="agent-flow-line agent-flow-b" d="M280 250 C365 150 405 112 484 94" />
        <path className="agent-flow-line agent-flow-c" d="M280 250 C180 285 112 335 72 404" />
        <path className="agent-flow-line agent-flow-d" d="M280 250 C378 286 438 340 490 398" />
        <path className="agent-flow-line agent-flow-e" d="M280 250 C278 336 278 404 280 468" />
      </svg>

      <div className="absolute left-1/2 top-1/2 z-10 flex size-44 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-surface shadow-[0_22px_70px_-34px_rgba(0,0,0,0.45)]">
        <span className="agent-orbit agent-orbit-one" aria-hidden />
        <span className="agent-orbit agent-orbit-two" aria-hidden />
        <div className="text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-foreground text-white">
            <LightningIcon size={18} weight="fill" />
          </span>
          <p className="mt-3 text-[15px] font-semibold tracking-tight text-foreground">
            Guarded agent
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            20 calls / $5 cap
          </p>
        </div>
      </div>

      {agents.map((agent, index) => (
        <AgentNode key={agent.title} index={index} {...agent} />
      ))}

      <div className="absolute bottom-5 left-5 right-5 z-20 grid gap-3 md:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-hairline bg-white/88 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11.5px] font-semibold text-foreground">Activity log</p>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10.5px] font-medium text-[#2E7D4F]">
              <span className="agent-live-dot size-1.5 rounded-full bg-[#2E7D4F]" aria-hidden />
              Live
            </span>
          </div>
          <div className="space-y-1.5">
            {events.map(([time, message, detail], index) => (
              <div
                key={`${time}-${message}`}
                className="agent-event-row grid grid-cols-[42px_1fr_auto] items-center gap-2 rounded-lg bg-[color:var(--elevated)] px-2.5 py-2"
                style={{ animationDelay: `${index * 900}ms` }}
              >
                <span className="text-[10px] tabular-nums text-muted-foreground">{time}</span>
                <span className="truncate text-[11.5px] font-medium text-foreground">
                  {message}
                </span>
                <span className="text-[10px] text-muted-foreground">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-white/88 p-3 backdrop-blur-md">
          <p className="text-[11.5px] font-semibold text-foreground">Guardrails</p>
          <div className="mt-3 space-y-2">
            {["DNC scrub", "Local 8am-9pm", "SMS policy"].map((label) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-muted-foreground">{label}</span>
                <CheckIcon size={13} weight="bold" color="#2E7D4F" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentNode({
  title,
  label,
  icon: Icon,
  className,
  tone,
  index,
}: {
  title: string;
  label: string;
  icon: typeof LightningIcon;
  className: string;
  tone: { bg: string; fg: string };
  index: number;
}) {
  return (
    <div
      className={`agent-node absolute z-20 flex w-[154px] items-center gap-3 rounded-xl border border-hairline bg-white/90 p-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.4)] backdrop-blur-md ${className}`}
      style={{ animationDelay: `${index * 180}ms` }}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-semibold text-foreground">
          {title}
        </span>
        <span className="block truncate text-[10.5px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: "var(--success)" }}
        aria-hidden
      />
      {children}
    </span>
  );
}

function RatingBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[18px] font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <StarIcon size={11} weight="fill" color="#B47A1F" aria-hidden />
    </span>
  );
}

/* Powered by */

const stack = [
  { name: "Vapi", role: "Voice infrastructure" },
  { name: "OpenAI Realtime", role: "Speech-to-speech model" },
  { name: "Cal.com", role: "Bookings" },
  { name: "Twilio", role: "SMS follow-ups" },
  { name: "Built-in CRM", role: "Activity log + pipeline" },
  { name: "Yelp", role: "Lead source" },
];

function PoweredBy() {
  return (
    <section className="border-y border-hairline" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-[1240px] px-6 py-7">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Powered by best-in-class infrastructure
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {stack.map((s) => (
            <span key={s.name} className="inline-flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                {s.name}
              </span>
              <span className="hidden text-[10.5px] text-muted-foreground md:inline">
                {s.role}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Stats */

const stats = [
  { value: "40-60", label: "Leads per city, per scrape run" },
  { value: "<2 min", label: "Average call duration" },
  { value: "100%", label: "TCPA-compliant by default" },
  { value: "24/7", label: "Webhook-driven booking sync" },
];

function Stats() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-[1240px] px-6">
        <div
          className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-hairline md:grid-cols-4"
          style={{ backgroundColor: "var(--hairline)" }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="px-7 py-8"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <p className="text-[32px] font-semibold tracking-tight text-foreground tabular-nums md:text-[40px]">
                {s.value}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Chapters */

function Chapters() {
  return (
    <section id="chapters" className="border-t border-hairline py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <SectionHeader
          eyebrow="Product"
          title="Every part of outbound, in one workspace."
          description="Most teams stitch together a scraper, a dialer, a calendar, and a CRM. Prospkt collapses the entire stack into one product, and one operator can run it."
        />

        <div className="mt-16 space-y-6">
          <Chapter
            number="01"
            eyebrow="Lead engine"
            title="A self-replenishing pipeline of low-hanging local leads."
            body="Pick a city, hit Run scraper. Prospkt pulls verified Yelp businesses, scores each one 1-10 on website quality, review velocity, and category fit, then queues the high scorers for outreach. New status filters let you track the entire lifecycle."
            bullets={[
              "Yelp Fusion + Google enrichment on every record",
              "Phone validation and DNC scrub before queueing",
              "Lifecycle pipeline: new to queued to called to booked",
            ]}
            mockup={<LeadsMockup />}
            tone={{ bg: "#FFE5DB", fg: "#D55B50" }}
            imageRight
          />

          <Chapter
            number="02"
            eyebrow="AI caller"
            title="Natural-sounding voice that qualifies in real time."
            body="Prospkt opens with a federally-compliant disclosure, then runs your script through a state-of-the-art AI script engine and an ElevenLabs voice. It handles voicemail, accepts opt-outs gracefully, and books a Cal.com slot without leaving the call."
            bullets={[
              "ElevenLabs voice auto-upgrades when a key is configured",
              "Live transcripts streamed back via Vapi webhooks",
              "Mid-call Cal.com booking with verbal confirmation",
            ]}
            mockup={<TranscriptMockup />}
            tone={{ bg: "#E8F0DC", fg: "#5C7A2E" }}
          />

          <Chapter
            number="03"
            eyebrow="Auto-dialer"
            title="Run a batch. Watch it work."
            body="Filter your queue down by high-priority, no-website, or a specific city and let the dialer pace through it. It respects TCPA hours, throttles concurrency, and surfaces every outcome live so you can intervene the moment something's off."
            bullets={[
              "TCPA hour gating from 8 AM to 9 PM local",
              "Pause, resume, or skip mid-batch",
              "Live status: dialing, ringing, in call, voicemail, booked",
            ]}
            mockup={<DialerMockup />}
            tone={{ bg: "#FCEFD1", fg: "#B47A1F" }}
            imageRight
          />

          <Chapter
            number="04"
            eyebrow="Calendar & CRM"
            title="Booked calls show up where you already work."
            body="The moment a lead says yes, Prospkt confirms a Cal.com slot, fires a Twilio confirmation SMS, logs the call to the built-in CRM, and emails you a summary with the recording. Nothing falls through the cracks."
            bullets={[
              "Cal.com v2 bookings with timezone-correct confirmations",
              "Built-in CRM activity log with transcript per call",
              "Email digest the moment a meeting is booked",
            ]}
            mockup={<AppointmentsMockup />}
            tone={{ bg: "#E2E7F5", fg: "#4B5FAE" }}
          />
        </div>
      </div>
    </section>
  );
}

function Chapter({
  number,
  eyebrow,
  title,
  body,
  bullets,
  mockup,
  tone,
  imageRight = false,
}: {
  number: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  mockup: ReactNode;
  tone: { bg: string; fg: string };
  imageRight?: boolean;
}) {
  const text = (
    <div className="md:p-4">
      <div className="flex items-center gap-3">
        <span
          className="rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums"
          style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
          {number}
        </span>
        <p className="label-caps">{eyebrow}</p>
      </div>
      <h3 className="mt-5 text-balance text-[26px] font-semibold tracking-tight leading-[1.05] text-foreground md:text-[34px]">
        {title}
      </h3>
      <p className="mt-4 max-w-[460px] text-pretty text-[14.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <ul className="mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-foreground"
          >
            <CheckIcon
              size={13}
              weight="bold"
              color="#2E7D4F"
              className="mt-1 shrink-0"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <article
      className="overflow-hidden rounded-[28px] border border-hairline"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-10">
        {imageRight ? (
          <>
            {text}
            <div>{mockup}</div>
          </>
        ) : (
          <>
            <div>{mockup}</div>
            {text}
          </>
        )}
      </div>
    </article>
  );
}

/* Mockups */

function MockupFrame({
  children,
  label,
  compact = false,
}: {
  children: ReactNode;
  label: string;
  compact?: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-hairline"
      style={{
        backgroundColor: "var(--surface)",
        boxShadow:
          "0 18px 40px -20px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        fontSize: compact ? "0.92em" : undefined,
      }}
    >
      <div className="flex h-8 items-center gap-1.5 border-b border-hairline px-3.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="ml-3 truncate text-[10.5px] text-muted-foreground tabular-nums">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function LeadsMockup({ compact = false }: { compact?: boolean }) {
  const rows = [
    {
      name: "Eastbrook Auto Care",
      city: "Grand Rapids",
      score: 9,
      status: "Queued",
      website: "No site",
      websiteColor: "#C2352C",
    },
    {
      name: "Riverside General Contracting",
      city: "Lansing",
      score: 8,
      status: "Called",
      website: "Outdated",
      websiteColor: "#B47A1F",
    },
    {
      name: "Northside Salon & Spa",
      city: "Ann Arbor",
      score: 8,
      status: "Voicemail",
      website: "Outdated",
      websiteColor: "#B47A1F",
    },
    {
      name: "Capitol City Auto",
      city: "Lansing",
      score: 7,
      status: "New",
      website: "No site",
      websiteColor: "#C2352C",
    },
    {
      name: "Detroit Chiropractic Co.",
      city: "Detroit",
      score: 7,
      status: "Booked",
      website: "Modern",
      websiteColor: "#2E7D4F",
    },
  ];
  const statusTone: Record<string, { bg: string; fg: string }> = {
    Queued: { bg: "#EFE7FA", fg: "#7752B8" },
    Called: { bg: "#F0F0EF", fg: "#5F5F5E" },
    Voicemail: { bg: "#F7ECD8", fg: "#9A6619" },
    New: { bg: "#E8ECFA", fg: "#4B5FAE" },
    Booked: { bg: "#E8F3EC", fg: "#2E7D4F" },
  };

  return (
    <MockupFrame label="Lead engine / Michigan queue" compact={compact}>
      <div className="p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold tracking-tight text-foreground">
              Priority leads
            </p>
            <p className="text-[10.5px] text-muted-foreground">No website + high intent</p>
          </div>
          <span className="rounded-md bg-[color:var(--elevated)] px-2 py-1 text-[10.5px] text-muted-foreground">
            Live
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-hairline">
          <div className="grid grid-cols-[1.4fr_0.7fr_0.5fr_0.8fr] border-b border-hairline bg-[color:var(--elevated)] px-3 py-2 text-[10px] font-medium text-muted-foreground">
            <span>Business</span>
            <span>Score</span>
            <span>Web</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1.4fr_0.7fr_0.5fr_0.8fr] items-center gap-2 border-b border-hairline px-3 py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-foreground">{row.name}</p>
                <p className="truncate text-[10.5px] text-muted-foreground">{row.city}</p>
              </div>
              <span className="text-[12px] font-semibold tabular-nums text-foreground">
                {row.score}/10
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: row.websiteColor }}
                aria-label={row.website}
              />
              <span
                className="w-fit rounded-md px-1.5 py-1 text-[10px] font-medium"
                style={{
                  backgroundColor: statusTone[row.status].bg,
                  color: statusTone[row.status].fg,
                }}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function TranscriptMockup({ compact = false }: { compact?: boolean }) {
  const lines = [
    {
      who: "Alex",
      text: "Quick heads up, I'm actually an AI calling on behalf of Prospkt.",
    },
    {
      who: "Lead",
      text: "Okay. What is this about?",
    },
    {
      who: "Alex",
      text: "I noticed your site is hard to find on mobile. Want me to book a quick audit?",
    },
  ];

  return (
    <MockupFrame label="Live call transcript" compact={compact}>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10.5px] font-medium text-[#2E7D4F]">
            <RecordIcon size={10} weight="fill" />
            Recording
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <WaveformIcon size={12} />
            01:42
          </span>
        </div>
        {lines.map((line) => (
          <div key={`${line.who}-${line.text}`} className="rounded-lg bg-[color:var(--elevated)] p-3">
            <p className="text-[10.5px] font-medium text-muted-foreground">{line.who}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-foreground">{line.text}</p>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function DialerMockup({ compact = false }: { compact?: boolean }) {
  const steps = [
    { label: "DNC scrub", done: true },
    { label: "TCPA window", done: true },
    { label: "Dialing batch", done: false },
  ];

  return (
    <MockupFrame label="Auto-dialer batch" compact={compact}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold text-foreground">Lansing no-website list</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">18 leads queued</p>
          </div>
          <span className="rounded-full bg-[#FCEFD1] px-2.5 py-1 text-[10.5px] font-medium text-[#B47A1F]">
            In progress
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center justify-between rounded-lg border border-hairline p-2.5">
              <span className="text-[11.5px] text-foreground">{step.label}</span>
              {step.done ? (
                <CheckIcon size={13} weight="bold" color="#2E7D4F" />
              ) : (
                <CircleNotchIcon size={13} color="#B47A1F" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["12", "Called"],
            ["4", "Answered"],
            ["2", "Booked"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-[color:var(--elevated)] p-2.5">
              <p className="text-[17px] font-semibold tabular-nums text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

function AppointmentsMockup() {
  const appointments = [
    ["Tue, 10:30 AM", "Detroit Chiropractic Co.", "Discovery call"],
    ["Wed, 2:00 PM", "Eastbrook Auto Care", "Website audit"],
    ["Fri, 9:00 AM", "Capitol City Auto", "Lead gen review"],
  ];

  return (
    <MockupFrame label="Bookings and CRM sync">
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 21 }).map((_, index) => (
            <span
              key={index}
              className="aspect-square rounded-md border border-hairline bg-[color:var(--elevated)]"
              style={{
                backgroundColor: [9, 15, 18].includes(index) ? "#E8F3EC" : undefined,
                borderColor: [9, 15, 18].includes(index) ? "#A8D3B9" : undefined,
              }}
            />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {appointments.map(([time, business, label]) => (
            <div key={`${time}-${business}`} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-foreground">{business}</p>
                <CalendarIcon size={13} color="#4B5FAE" />
              </div>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {time} / {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}

/* Content sections */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-[720px] text-center">
      <p className="label-caps">{eyebrow}</p>
      <h2 className="mt-4 text-balance text-[34px] font-semibold tracking-tight leading-[1.05] text-foreground md:text-[48px]">
        {title}
      </h2>
      <p className="mt-5 text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
        {description}
      </p>
    </div>
  );
}

const industries = [
  { icon: WrenchIcon, label: "Auto repair" },
  { icon: HammerIcon, label: "Contractors" },
  { icon: ScissorsIcon, label: "Salons & spas" },
  { icon: HeartbeatIcon, label: "Chiropractors" },
  { icon: ForkKnifeIcon, label: "Restaurants" },
  { icon: StorefrontIcon, label: "Local retail" },
];

function Industries() {
  return (
    <section id="industries" className="border-t border-hairline py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="label-caps">Use cases</p>
            <h2 className="mt-4 text-balance text-[32px] font-semibold tracking-tight leading-[1.05] text-foreground md:text-[46px]">
              Built for local service businesses that still answer the phone.
            </h2>
            <p className="mt-5 max-w-[470px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Prospkt is strongest when the buyer is local, the problem is obvious, and the next
              step is a simple discovery call. That makes it perfect for agencies, website shops,
              local SEO teams, and appointment setters.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {industries.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--elevated)]">
                  <item.icon size={18} color="#0A0A0A" />
                </span>
                <span className="text-[14px] font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const trustItems = [
  {
    icon: ShieldCheckIcon,
    title: "TCPA guardrails",
    copy: "The dialer checks local calling windows, enforces AI disclosure, and keeps opt-outs out of the queue.",
  },
  {
    icon: LockIcon,
    title: "DNC by default",
    copy: "Every contact is scrubbed before outreach and can be blocked permanently from the dashboard.",
  },
  {
    icon: StackIcon,
    title: "One record per lead",
    copy: "Calls, transcripts, bookings, and follow-ups are written back to the same lifecycle record.",
  },
  {
    icon: PlugsIcon,
    title: "Workflow-ready",
    copy: "Cal.com bookings, Twilio SMS, and email notifications wire around the booked-call handoff.",
  },
];

function Trust() {
  return (
    <section id="trust" className="border-t border-hairline py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <SectionHeader
          eyebrow="Compliance"
          title="Trust is built into the call flow."
          description="The product is opinionated about outbound rules because a useful AI sales rep needs more than a nice voice. It needs restraint, auditability, and clean handoffs."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <article key={item.title} className="rounded-2xl border border-hairline bg-surface p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--elevated)]">
                <item.icon size={18} color="#0A0A0A" />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="border-y border-hairline bg-surface py-16 md:py-20">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-6 md:grid-cols-[0.6fr_1.4fr] md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[color:var(--elevated)]">
            <QuotesIcon size={22} color="#0A0A0A" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Private beta operator</p>
            <p className="text-[12px] text-muted-foreground">Detroit web studio</p>
          </div>
        </div>
        <blockquote className="text-pretty text-[22px] font-medium tracking-tight leading-snug text-foreground md:text-[32px]">
          &quot;It feels like hiring a junior SDR who never forgets to log the call, respects the
          rules, and already knows which leads are worth touching.&quot;
        </blockquote>
      </div>
    </section>
  );
}

function Pricing() {
  const included = [
    "Lead scraping and enrichment",
    "AI voice calls with live transcripts",
    "Calendar booking and SMS confirmation",
    "DNC management and lifecycle analytics",
  ];

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-[920px] px-6">
        <div className="overflow-hidden rounded-[28px] border border-hairline bg-surface">
          <div className="grid gap-px bg-[color:var(--hairline)] md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-surface p-8 md:p-10">
              <p className="label-caps">Pricing</p>
              <h2 className="mt-4 text-[34px] font-semibold tracking-tight leading-none text-foreground md:text-[48px]">
                Start lean. Scale when the calls work.
              </h2>
              <p className="mt-5 text-pretty text-[14.5px] leading-relaxed text-muted-foreground">
                Built for early teams that need to prove an outbound motion before hiring more
                reps or stitching together a stack of tools.
              </p>
            </div>
            <div className="bg-surface p-8 md:p-10">
              <div className="flex items-end gap-2">
                <span className="text-[48px] font-semibold tracking-tight text-foreground">$0</span>
                <span className="pb-3 text-[13px] text-muted-foreground">during private beta</span>
              </div>
              <ul className="mt-7 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-foreground">
                    <CheckIcon size={14} weight="bold" color="#2E7D4F" className="mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="press mt-8 inline-flex h-11 items-center gap-1.5 rounded-lg bg-foreground px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
              >
                Request access
                <ArrowRightIcon size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    [
      "Who is Prospkt for?",
      "Agencies, local SEO shops, website studios, and operators who sell simple services to local businesses.",
    ],
    [
      "Does the AI disclose itself?",
      "Yes. The call script includes an AI disclosure, and the product is designed around compliant calling windows and opt-outs.",
    ],
    [
      "Can I use my own leads?",
      "Yes. The lead table can be fed by scraped results now, and the lifecycle model is ready for imported lead sources.",
    ],
  ];

  return (
    <section className="border-t border-hairline py-20">
      <div className="mx-auto max-w-[920px] px-6">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions before the first batch."
          description="A few quick answers for teams evaluating whether autonomous outbound fits their sales motion."
        />
        <div className="mt-12 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
          {faqs.map(([question, answer]) => (
            <details key={question} className="group p-5 open:bg-[color:var(--elevated)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {question}
                <ArrowRightIcon
                  size={14}
                  className="shrink-0 transition-transform group-open:rotate-90"
                />
              </summary>
              <p className="mt-3 max-w-[680px] text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[32px] border border-hairline bg-foreground p-8 text-white md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-white/70">
              <SparkleIcon size={12} weight="fill" />
              Private beta access
            </span>
            <h2 className="mt-6 max-w-[760px] text-balance text-[34px] font-semibold tracking-tight leading-[1.04] md:text-[58px]">
              Run your first autonomous outbound batch this week.
            </h2>
            <p className="mt-5 max-w-[620px] text-pretty text-[15px] leading-relaxed text-white/65">
              Connect a city, define the offer, and let Prospkt handle the first touch. You stay in
              control of scripts, queues, opt-outs, and bookings.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-foreground transition-colors hover:bg-[#F0F0EF]"
          >
            Open the app
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <span
            className="flex size-6 items-center justify-center rounded-md"
            style={{ backgroundColor: "#0A0A0A" }}
            aria-hidden
          >
            <LightningIcon size={13} weight="fill" color="#FFFFFF" />
          </span>
          <span className="text-[14px] font-semibold tracking-tight text-foreground">
            Prospkt
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
          <a href="#chapters" className="inline-flex items-center gap-1 hover:text-foreground">
            Product <ArrowSquareOutIcon size={11} />
          </a>
          <a href="#trust" className="inline-flex items-center gap-1 hover:text-foreground">
            Compliance <ArrowSquareOutIcon size={11} />
          </a>
          <Link href="/sign-in" className="inline-flex items-center gap-1 hover:text-foreground">
            App <ArrowSquareOutIcon size={11} />
          </Link>
          <span>YALID LLC</span>
        </div>
      </div>
    </footer>
  );
}
