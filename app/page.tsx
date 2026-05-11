import type { ReactNode } from "react";
import Link from "next/link";
import { ActivityLogTicker, type ActivityEvent } from "@/components/marketing/activity-log-ticker";
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
          <AuthRouteButton
            href="/sign-in"
            className="hidden h-8 items-center rounded-lg px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-[color:var(--elevated)] sm:inline-flex"
          >
            Sign in
          </AuthRouteButton>
          <AuthRouteButton
            href="/sign-up"
            className="press inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
          >
            Start free
            <ArrowRightIcon size={12} />
          </AuthRouteButton>
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
    <section className="hero-shell relative overflow-hidden">
      <div className="hero-right-field" aria-hidden />
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <div className="fade-up motion-delay-1">
              <Eyebrow>Live in private beta</Eyebrow>
            </div>
            <h1 className="fade-up motion-delay-2 mt-5 max-w-[680px] text-balance text-[42px] font-semibold leading-[1.05] text-foreground md:text-[58px] lg:text-[68px]">
              <span className="block">Turn service leads</span>
              <span className="block">into booked jobs</span>
              <span className="block text-subtle">with an AI sales rep</span>
              <span className="block">that follows up.</span>
            </h1>
            <p className="fade-up motion-delay-3 mt-6 max-w-[560px] text-pretty text-[16px] leading-relaxed text-muted-foreground md:text-[17px]">
              Prospkt finds, calls, follows up, books, and logs revenue opportunities for
              service businesses while the owner keeps control of campaigns, budgets, opt-outs,
              and every next step.
            </p>
            <div className="fade-up motion-delay-4 mt-9 flex flex-wrap items-center gap-3">
              <AuthRouteButton
                href="/sign-up"
                className="press inline-flex h-11 items-center gap-1.5 rounded-lg bg-foreground px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
              >
                Start building for free
                <ArrowRightIcon size={13} />
              </AuthRouteButton>
              <Link
                href="#chapters"
                className="press inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-5 text-[14px] font-medium transition-colors hover:bg-[color:var(--elevated)]"
              >
                See how it works
              </Link>
            </div>

            <div className="fade-up motion-delay-5 mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <RatingBadge label="G2" value="4.9" />
              <RatingBadge label="Operator NPS" value="72" />
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <ShieldCheckIcon size={12} color="#2E7D4F" weight="fill" />
                Guardrails enforced before every call
              </span>
            </div>
          </div>

          <div className="fade-up motion-delay-3 relative lg:col-span-6">
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
      title: "Campaigns",
      label: "Choose playbook",
      icon: MagnifyingGlassIcon,
      className: "left-4 top-6 sm:left-6 md:left-10 md:top-9",
      tone: { bg: "#FFE5DB", fg: "#D55B50" },
    },
    {
      title: "Qualifier",
      label: "Check source",
      icon: FunnelIcon,
      className: "right-4 top-6 sm:right-6 md:right-10 md:top-9",
      tone: { bg: "#EFE7FA", fg: "#7752B8" },
    },
    {
      title: "Caller",
      label: "Follow up",
      icon: PhoneCallIcon,
      className: "bottom-6 left-4 sm:left-6 md:bottom-9 md:left-10",
      tone: { bg: "#E8F0DC", fg: "#5C7A2E" },
    },
    {
      title: "Booking",
      label: "Book jobs",
      icon: CalendarCheckIcon,
      className: "bottom-6 right-4 sm:right-6 md:bottom-9 md:right-10",
      tone: { bg: "#FCEFD1", fg: "#B47A1F" },
    },
  ];

  const events: ActivityEvent[] = [
    ["08:31", "Found 14 missed-call records", "Warm recovery"],
    ["08:32", "A1 Roofing estimate queued", "$4.2k"],
    ["08:33", "Skipped consumer cold record", "Consent missing"],
    ["08:34", "Miller HVAC answered", "Interested"],
    ["08:35", "Service job booked", "Tue, 10:30 AM"],
    ["08:36", "CRM memory updated", "Follow-up saved"],
  ];

  const eventSlots: ActivityEvent[][] = [
    [events[0], events[2], events[4]],
    [events[1], events[3], events[5]],
  ];

  const guardrails = ["20 call cap", "$5 spend cap", "DNC scrub", "Source notes", "CRM memory"];

  return (
    <div className="agent-visual relative overflow-visible px-1 py-2">
      <div className="absolute inset-x-[-24px] top-[-16px] h-[540px] agent-grid" aria-hidden />
      <div className="relative z-10">
        <div className="relative h-[420px] overflow-visible sm:h-[450px] md:h-[486px]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 640 500"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            <path className="agent-flow-line agent-flow-a" d="M320 250 C250 154 176 82 84 70" />
            <path className="agent-flow-line agent-flow-b" d="M320 250 C390 154 464 82 556 70" />
            <path className="agent-flow-line agent-flow-c" d="M320 250 C248 342 176 420 84 430" />
            <path className="agent-flow-line agent-flow-d" d="M320 250 C392 342 464 420 556 430" />
          </svg>

          <div className="absolute left-1/2 top-1/2 z-10 flex size-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white/88 shadow-lg md:size-48">
            <span className="agent-orbit agent-orbit-one" aria-hidden />
            <span className="agent-orbit agent-orbit-two" aria-hidden />
            <div className="text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-foreground text-white">
                <LightningIcon size={18} weight="fill" />
              </span>
              <p className="mt-3 text-[14px] font-medium text-foreground">
                Prospkt Agent
              </p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Guarded AI rep
              </p>
              <span className="mt-2 inline-flex rounded-md bg-[color:var(--elevated)] px-2 py-1 text-[10px] text-muted-foreground">
                20 calls / $5 cap
              </span>
            </div>
          </div>

          {agents.map((agent, index) => (
            <AgentNode key={agent.title} index={index} {...agent} />
          ))}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
          <div className="rounded-xl border border-hairline bg-white/86 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-medium text-muted-foreground">Activity log</p>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10.5px] text-[#2E7D4F]">
                <span className="agent-live-dot size-1.5 rounded-full bg-[#2E7D4F]" aria-hidden />
                Live
              </span>
            </div>
            <ActivityLogTicker slots={eventSlots} />
          </div>

          <div className="rounded-xl border border-hairline bg-white/86 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-medium text-muted-foreground">Guardrails</p>
              <CheckIcon size={13} weight="bold" color="#2E7D4F" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {guardrails.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-md bg-[color:var(--elevated)] px-2.5 py-1 text-[10.5px] text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
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
    <div className={`absolute z-20 ${className}`}>
      <div
        data-motion={index % 4}
        className="agent-node flex w-[144px] items-center gap-3 rounded-xl border border-hairline bg-white/86 p-3 shadow-sm backdrop-blur-md sm:w-[164px] md:w-[184px]"
        style={{ animationDelay: `${index * -900}ms` }}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
          <Icon size={16} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-medium text-foreground">
            {title}
          </span>
          <span className="block truncate text-[10.5px] text-muted-foreground">{label}</span>
        </span>
      </div>
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
  {
    name: "Vapi",
    role: "Voice infrastructure",
    logo: "https://img.logokit.com/vapi.ai",
  },
  {
    name: "OpenAI",
    role: "Realtime voice model",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/openai.svg",
  },
  {
    name: "Cal.com",
    role: "Bookings",
    logo: null,
  },
  {
    name: "Twilio",
    role: "SMS follow-ups",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/twilio.svg",
  },
  {
    name: "Prospkt CRM",
    role: "Activity log + pipeline",
    logo: null,
  },
  {
    name: "Yelp",
    role: "Lead source",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/yelp.svg",
  },
];

function PoweredBy() {
  return (
    <section className="border-y border-hairline" style={{ backgroundColor: "var(--surface)" }}>
      <div className="mx-auto max-w-[1240px] px-6 py-7">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Powered by best-in-class infrastructure
        </p>
        <div className="scroll-reveal mx-auto grid max-w-[980px] grid-cols-2 justify-items-center gap-x-5 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {stack.map((s) => (
            <PartnerLogo key={s.name} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({
  name,
  role,
  logo,
}: {
  name: string;
  role: string;
  logo: string | null;
}) {
  return (
    <div
      className="flex h-10 w-[148px] items-center justify-center text-muted-foreground opacity-78 transition-opacity hover:opacity-100"
      aria-label={`${name}: ${role}`}
    >
      <span className="inline-flex items-center gap-2.5">
        {logo ? (
          <span
            className="size-6 bg-current"
            style={{
              maskImage: `url(${logo})`,
              WebkitMaskImage: `url(${logo})`,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
              maskSize: "contain",
              WebkitMaskSize: "contain",
            }}
            aria-hidden
          />
        ) : name === "Prospkt CRM" ? (
          <LightningIcon size={18} weight="fill" aria-hidden />
        ) : (
          null
        )}
        <span className="block truncate text-[16px] font-semibold leading-none">
          {name}
        </span>
      </span>
    </div>
  );
}

/* Stats */

const stats = [
  { value: "3 lanes", label: "Warm recovery, cold B2B, guarded consumer" },
  { value: "20/day", label: "Default live-call cap per workspace" },
  { value: "100%", label: "Calls logged back to CRM memory" },
  { value: "24/7", label: "Webhook-driven booking and activity sync" },
];

function Stats() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-[1240px] px-6">
        <div
          className="scroll-reveal grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-hairline md:grid-cols-4"
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
          title="The revenue layer service businesses are missing."
          description="Jobber, ServiceTitan, and Housecall Pro can run the operation. Prospkt owns the sales motion around it: campaigns, calls, follow-up, booking, CRM memory, and owner control."
        />

        <div className="mt-16 space-y-6">
          <Chapter
            number="01"
            eyebrow="Campaign playbooks"
            title="Run the follow-up your team never gets to."
            body="Choose a lane: missed call recovery, estimate follow-up, past customer reactivation, booking confirmation, review request, or sourced cold B2B. Prospkt applies the right script, source rules, and guardrails before anything dials."
            bullets={[
              "Warm recovery for missed calls, forms, quotes, and past customers",
              "Cold B2B for property managers, commercial accounts, and partners",
              "Cold consumer is locked behind stricter compliance controls",
            ]}
            mockup={<LeadsMockup />}
            tone={{ bg: "#FFE5DB", fg: "#D55B50" }}
            imageRight
          />

          <Chapter
            number="02"
            eyebrow="Built-in CRM"
            title="A service-sales workspace that remembers every opportunity."
            body="Every contact has one CRM record with contact type, source, consent note, service need, service area, estimate value, lifecycle status, notes, calls, transcripts, follow-ups, DNC state, and booking context."
            bullets={[
              "Service records for consumers, businesses, past customers, and commercial accounts",
              "Lead drawer with source, service need, estimate value, notes, and call history",
              "Pipeline, calls, bookings, and memory all read from the same record",
            ]}
            mockup={<CrmMockup />}
            tone={{ bg: "#E2E7F5", fg: "#4B5FAE" }}
          />

          <Chapter
            number="03"
            eyebrow="Agent control"
            title="Let the AI rep work without losing control."
            body="Home is the command center. Owners can see active campaigns, calls today, booked jobs, spend, skipped reasons, and pause all automation before a campaign crosses a line."
            bullets={[
              "Daily caps: 20 calls and $5 spend by default",
              "Pause-all, dry-run, refresh, and status visibility in one place",
              "Activity log records calls, skips, bookings, opt-outs, and failures",
            ]}
            mockup={<AgentControlMockup />}
            tone={{ bg: "#E8F3EC", fg: "#2E7D4F" }}
            imageRight
          />

          <Chapter
            number="04"
            eyebrow="AI caller"
            title="A voice rep that follows up like a human operator."
            body="Prospkt opens with the right disclosure, follows your service script, asks qualifying questions, handles voicemail, accepts opt-outs gracefully, and books an appointment when the lead is ready."
            bullets={[
              "Works for missed-call recovery, estimates, reactivation, and B2B outreach",
              "Live transcripts streamed back via Vapi webhooks",
              "Mid-call booking with verbal confirmation and CRM write-back",
            ]}
            mockup={<TranscriptMockup />}
            tone={{ bg: "#E8F0DC", fg: "#5C7A2E" }}
          />

          <Chapter
            number="05"
            eyebrow="Campaign dialer"
            title="Run a campaign. Watch the revenue motion."
            body="Filter by playbook, source, contact type, service area, value, status, or city and let the dialer pace through eligible records. It respects local hours, DNC, duplicate prevention, daily caps, and owner pause."
            bullets={[
              "Warm campaigns can prioritize highest-value estimates and missed calls",
              "Cold B2B respects source labels, call caps, DNC, and local hours",
              "Consumer campaigns stay blocked unless all compliance fields are present",
            ]}
            mockup={<DialerMockup />}
            tone={{ bg: "#FCEFD1", fg: "#B47A1F" }}
            imageRight
          />

          <Chapter
            number="06"
            eyebrow="Booking & follow-up"
            title="Booked jobs, confirmations, and follow-ups stay tied to the record."
            body="The moment a lead says yes, Prospkt confirms a slot, sends allowed SMS only after interest or booking, updates the CRM lifecycle, and emails the owner a summary. Future touchpoints stay attached to the same memory."
            bullets={[
              "Cal.com bookings with timezone-correct confirmations",
              "SMS only after interest, booking, or opt-out",
              "Owner digest and CRM activity the moment a job opportunity is booked",
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
    <div className="lg:p-3">
      <div className="flex items-center gap-3">
        <span
          className="rounded-md px-2.5 py-1 text-[11px] font-medium tabular-nums"
          style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
          {number}
        </span>
        <p className="label-caps">{eyebrow}</p>
      </div>
      <h3 className="mt-5 text-balance text-[25px] font-medium leading-[1.08] text-foreground md:text-[31px]">
        {title}
      </h3>
      <p className="mt-4 max-w-[500px] text-pretty text-[14px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <ul className="mt-6 space-y-2.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground"
          >
            <CheckIcon
              size={12}
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
      className="lift scroll-reveal overflow-hidden rounded-3xl border border-hairline"
      style={{ backgroundColor: "var(--surface)" }}
    >
      <div className="grid items-center gap-8 p-5 lg:grid-cols-2 lg:gap-10 lg:p-9">
        <div className={imageRight ? undefined : "lg:order-2"}>{text}</div>
        <div className={imageRight ? undefined : "lg:order-1"}>{mockup}</div>
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
      className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm"
      style={{
        fontSize: compact ? "0.92em" : undefined,
      }}
    >
      <div className="flex h-8 items-center gap-1.5 border-b border-hairline px-3.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: "#E3E3E1" }} />
        <span className="ml-3 truncate text-[10.5px] text-subtle tabular-nums">
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
      name: "Missed call: Miller HVAC",
      city: "Warm recovery",
      score: 9,
      status: "Queued",
      website: "$1.8k",
      websiteColor: "#2E7D4F",
    },
    {
      name: "Old estimate: A1 Roofing",
      city: "Estimate follow-up",
      score: 8,
      status: "Called",
      website: "$4.2k",
      websiteColor: "#B47A1F",
    },
    {
      name: "Past customer: Westside Plumbing",
      city: "Reactivation",
      score: 8,
      status: "Voicemail",
      website: "$650",
      websiteColor: "#B47A1F",
    },
    {
      name: "Property manager list",
      city: "Cold B2B",
      score: 7,
      status: "New",
      website: "B2B",
      websiteColor: "#C2352C",
    },
    {
      name: "Booking confirmation",
      city: "Warm recovery",
      score: 7,
      status: "Booked",
      website: "Job",
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
            <p className="text-[12px] font-medium text-foreground">
              Campaign queue
            </p>
            <p className="text-[10.5px] text-muted-foreground">Warm first, B2B next</p>
          </div>
          <span className="rounded-md bg-[color:var(--elevated)] px-2 py-1 text-[10.5px] text-muted-foreground">
            Live
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-hairline">
          <div className="grid grid-cols-[1.4fr_0.7fr_0.5fr_0.8fr] border-b border-hairline bg-[color:var(--elevated)] px-3 py-2 text-[10px] font-medium text-muted-foreground">
            <span>Record</span>
            <span>Score</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1.4fr_0.7fr_0.5fr_0.8fr] items-center gap-2 border-b border-hairline px-3 py-2.5 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] text-foreground">{row.name}</p>
                <p className="truncate text-[10.5px] text-muted-foreground">{row.city}</p>
              </div>
              <span className="text-[12px] font-medium tabular-nums text-foreground">
                {row.score}/10
              </span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: row.websiteColor }}
                aria-label={row.website}
              />
              <span
                className="w-fit rounded-md px-1.5 py-1 text-[10px]"
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

function CrmMockup({ compact = false }: { compact?: boolean }) {
  const records = [
    ["Eastbrook Auto Care", "Interested", "9/10", "#E8F3EC", "#2E7D4F"],
    ["Detroit Chiropractic Co.", "Booked", "8/10", "#E8F3EC", "#2E7D4F"],
    ["J & H Automotive", "DNC", "6/10", "#FAE3E0", "#A32A22"],
  ];
  const fields = [
    ["Owner", "Jamie Rivera"],
    ["Phone", "(313) 555-0148"],
    ["Source", "Yelp / no website"],
    ["Follow-up", "Tomorrow 10:00 AM"],
  ];
  const stages = ["New", "Interested", "Follow up", "Booked"];
  const activities = [
    ["Call", "Answered, asked for pricing", "2m ago"],
    ["Note", "Prefers Tuesday mornings", "4m ago"],
    ["Task", "Send audit recap", "Tomorrow"],
  ];

  return (
    <MockupFrame label="CRM / Eastbrook Auto Care" compact={compact}>
      <div className="bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-hairline p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--elevated)] text-[10px] font-medium text-muted-foreground">
              EA
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-foreground">
                Eastbrook Auto Care
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                Grand Rapids / Auto repair / No website
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10px] text-[#2E7D4F]">
            Follow up
          </span>
        </div>

        <div className="grid sm:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="border-b border-hairline p-3 sm:border-b-0 sm:border-r">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10.5px] font-medium text-muted-foreground">Leads</p>
              <span className="text-[10px] tabular-nums text-subtle">188</span>
            </div>
            <div className="space-y-1.5">
              {records.map(([name, status, score, bg, fg], index) => (
                <div
                  key={name}
                  className={`rounded-lg border p-2 ${
                    index === 0
                      ? "border-[#A8D3B9] bg-[#F4FAF6]"
                      : "border-hairline bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[10.5px] text-foreground">{name}</p>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9.5px]"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-[9.5px] tabular-nums text-muted-foreground">
                    Score {score} / 3 touches
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="border-b border-hairline p-3">
              <p className="mb-2 text-[10.5px] font-medium text-muted-foreground">Pipeline stage</p>
              <div className="grid grid-cols-4 gap-1">
                {stages.map((stage, index) => (
                  <div key={stage} className="min-w-0">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: index < 3 ? "#2E7D4F" : "var(--elevated)",
                      }}
                    />
                    <p className="mt-1 truncate text-[9.5px] text-muted-foreground">{stage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-px bg-[color:var(--hairline)] md:grid-cols-[0.92fr_1.08fr]">
              <div className="bg-surface p-3">
                <p className="text-[10.5px] font-medium text-muted-foreground">Contact fields</p>
                <div className="mt-2 space-y-1.5">
                  {fields.map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-[color:var(--elevated)] px-2.5 py-2">
                      <p className="text-[9.5px] text-subtle">{label}</p>
                      <p className="mt-0.5 truncate text-[10.5px] text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10.5px] font-medium text-muted-foreground">Activity timeline</p>
                  <span className="rounded-md bg-[color:var(--elevated)] px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                    Live
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {activities.map(([type, text, time]) => (
                    <div key={`${type}-${text}`} className="flex gap-2 rounded-lg bg-[color:var(--elevated)] p-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#2E7D4F]" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] text-foreground">
                          {type}: {text}
                        </p>
                        <p className="mt-0.5 text-[9.5px] text-muted-foreground">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-lg border border-hairline bg-white p-2">
                  <p className="text-[9.5px] text-subtle">Internal note</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                    Owner asked for pricing and a website audit recap.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MockupFrame>
  );
}

function AgentControlMockup({ compact = false }: { compact?: boolean }) {
  const events = [
    ["Skipped consumer cold record", "Consent missing"],
    ["Queued A1 Roofing estimate", "$4.2k"],
    ["Budget check passed", "$0.42 / $5"],
  ];

  return (
    <MockupFrame label="Agent command center" compact={compact}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-foreground">Agent control</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Guarded service-sales campaigns, budget, and bookings
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10.5px] text-[#2E7D4F]">
            <span className="size-1.5 rounded-full bg-[#2E7D4F]" aria-hidden />
            Ready
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["0/20", "Calls"],
            ["$0.00/$5", "Spend"],
            ["0/3", "Failures"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-hairline bg-white p-2.5">
              <p className="text-[13px] font-medium tabular-nums text-foreground">{value}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Run agent", "Dry run", "Pause"].map((label, index) => (
            <span
              key={label}
              className={`rounded-md px-2.5 py-1.5 text-[10.5px] ${
                index === 0
                  ? "bg-foreground text-white"
                  : "border border-hairline bg-white text-foreground"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {events.map(([message, detail]) => (
            <div key={message} className="flex items-center justify-between gap-3 rounded-lg bg-[color:var(--elevated)] px-3 py-2">
              <span className="truncate text-[11px] text-foreground">{message}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>
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
      text: "Quick heads up, I'm an AI assistant calling on behalf of Miller HVAC.",
    },
    {
      who: "Lead",
      text: "Okay. What is this about?",
    },
    {
      who: "Alex",
      text: "You requested an estimate last month. Want me to find a time for the owner to review it with you?",
    },
  ];

  return (
    <MockupFrame label="Live call transcript" compact={compact}>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8F3EC] px-2 py-1 text-[10.5px] text-[#2E7D4F]">
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
            <p className="text-[10.5px] text-muted-foreground">{line.who}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-foreground">{line.text}</p>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function DialerMockup({ compact = false }: { compact?: boolean }) {
  const steps = [
    { label: "DNC scrub", done: true },
    { label: "Local-hour window", done: true },
    { label: "Dialing batch", done: false },
  ];

  return (
    <MockupFrame label="Auto-dialer batch" compact={compact}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-foreground">Estimate follow-up campaign</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">18 service records queued</p>
          </div>
          <span className="rounded-full bg-[#FCEFD1] px-2.5 py-1 text-[10.5px] text-[#B47A1F]">
            In progress
          </span>
        </div>
        <div className="mt-4 space-y-2.5">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center justify-between rounded-lg border border-hairline p-2.5">
              <span className="text-[11.5px] text-muted-foreground">{step.label}</span>
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
              <p className="text-[16px] font-medium tabular-nums text-foreground">{value}</p>
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
    ["Tue, 10:30 AM", "Miller HVAC", "Estimate review"],
    ["Wed, 2:00 PM", "A1 Roofing", "Roof inspection"],
    ["Fri, 9:00 AM", "Northline Property", "Commercial walkthrough"],
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
                <p className="text-[11px] text-foreground">{business}</p>
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
    <div className="scroll-reveal mx-auto max-w-[720px] text-center">
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
  { icon: WrenchIcon, label: "HVAC & plumbing" },
  { icon: HammerIcon, label: "Roofing & contractors" },
  { icon: ScissorsIcon, label: "Salons & wellness" },
  { icon: HeartbeatIcon, label: "Clinics & care" },
  { icon: StorefrontIcon, label: "Commercial service" },
  { icon: ForkKnifeIcon, label: "Restaurants & hospitality" },
];

function Industries() {
  return (
    <section id="industries" className="border-t border-hairline py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="label-caps">Use cases</p>
            <h2 className="mt-4 text-balance text-[32px] font-semibold tracking-tight leading-[1.05] text-foreground md:text-[46px]">
              Built for service businesses where speed-to-lead turns into revenue.
            </h2>
            <p className="mt-5 max-w-[470px] text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Prospkt is strongest when calls, estimates, old customers, and commercial accounts
              need consistent follow-up. It is the AI revenue layer beside the systems that already
              handle dispatch, invoices, and field operations.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {industries.map((item) => (
              <div
                key={item.label}
                className="lift scroll-reveal flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4"
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
            <article key={item.title} className="lift scroll-reveal rounded-2xl border border-hairline bg-surface p-5">
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
      <div className="scroll-reveal mx-auto grid max-w-[1240px] gap-8 px-6 md:grid-cols-[0.6fr_1.4fr] md:items-center">
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
          &quot;It feels like hiring a follow-up rep who never forgets an estimate, logs every call,
          respects the rules, and knows when to hand a booked job back to the owner.&quot;
        </blockquote>
      </div>
    </section>
  );
}

function Pricing() {
  const included = [
    "Warm recovery, estimate follow-up, reactivation, and B2B playbooks",
    "Service CRM with source, consent notes, service need, and estimate value",
    "Agent command center with dry run and pause",
    "AI voice calls with transcripts and call history",
    "Calendar booking, SMS confirmation, and owner summaries",
    "DNC management, budgets, and lifecycle analytics",
  ];

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="mx-auto max-w-[920px] px-6">
        <div className="scroll-reveal overflow-hidden rounded-[28px] border border-hairline bg-surface">
          <div className="grid gap-px bg-[color:var(--hairline)] md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-surface p-8 md:p-10">
              <p className="label-caps">Pricing</p>
              <h2 className="mt-4 text-[34px] font-semibold tracking-tight leading-none text-foreground md:text-[48px]">
                Start with recovery. Scale into outbound.
              </h2>
              <p className="mt-5 text-pretty text-[14.5px] leading-relaxed text-muted-foreground">
                Built for service businesses and agencies that want booked jobs from missed calls,
                old estimates, past customers, and carefully sourced commercial outreach.
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
              <AuthRouteButton
                href="/sign-up"
                className="press mt-8 inline-flex h-11 items-center gap-1.5 rounded-lg bg-foreground px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1F1F1F]"
              >
                Request access
                <ArrowRightIcon size={13} />
              </AuthRouteButton>
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
      "Service-based businesses and agencies serving them. The first practical wedge is home services: missed calls, estimates, reactivation, and commercial account outreach.",
    ],
    [
      "Does the AI disclose itself?",
      "Yes. The call script includes an AI disclosure, and the product is designed around compliant calling windows and opt-outs.",
    ],
    [
      "Can I use my own leads?",
      "Yes. The CRM is designed for warm records like missed calls, form fills, old estimates, past customers, and sourced cold B2B accounts.",
    ],
    [
      "Does Prospkt include a CRM?",
      "Yes. Contact type, source, consent note, service need, service area, estimate value, status, notes, calls, transcripts, follow-ups, DNC entries, and bookings live on one record.",
    ],
    [
      "How much control do I have over the AI rep?",
      "The app is built around guarded auto: run, dry-run, pause, daily call caps, spend caps, calling-window checks, DNC checks, and visible skip reasons.",
    ],
    [
      "Does Prospkt replace Jobber or ServiceTitan?",
      "No. Prospkt is not trying to own dispatch, invoicing, or field operations. It owns the revenue layer: follow-up, calling, booking, CRM memory, and campaign control.",
    ],
    [
      "What happens after signup?",
      "You go through onboarding for company basics, offer positioning, target markets, daily limits, booking identity, and compliance acknowledgement before the app runs outreach.",
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
        <div className="scroll-reveal mt-12 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
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
      <div className="scroll-reveal mx-auto max-w-[1240px] overflow-hidden rounded-[32px] border border-hairline bg-foreground p-8 text-white md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11.5px] font-medium text-white/70">
              <SparkleIcon size={12} weight="fill" />
              Private beta access
            </span>
            <h2 className="mt-6 max-w-[760px] text-balance text-[34px] font-semibold tracking-tight leading-[1.04] md:text-[58px]">
              Recover missed revenue before it goes cold.
            </h2>
            <p className="mt-5 max-w-[620px] text-pretty text-[15px] leading-relaxed text-white/65">
              Start with missed calls, old estimates, and past customers. Then expand into sourced
              B2B campaigns once the controls, scripts, and booking handoff are dialed in.
            </p>
          </div>
          <AuthRouteButton
            href="/sign-up"
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[14px] font-medium text-foreground transition-colors hover:bg-[#F0F0EF]"
          >
            Open the app
            <ArrowRightIcon size={14} />
          </AuthRouteButton>
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
          <AuthRouteButton
            href="/sign-in"
            className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            App <ArrowSquareOutIcon size={11} />
          </AuthRouteButton>
          <span>YALID LLC</span>
        </div>
      </div>
    </footer>
  );
}

function AuthRouteButton({
  href,
  className,
  children,
}: {
  href: "/sign-in" | "/sign-up";
  className: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
