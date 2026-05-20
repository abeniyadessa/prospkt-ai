import type { Metadata } from "next";
import {
  CalendarCheckIcon,
  LightningIcon,
  LinkedinLogoIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PrelaunchAnalytics } from "@/components/marketing/prelaunch-analytics";
import { PrelaunchEmailForm } from "@/components/marketing/prelaunch-email-form";
import { cn } from "@/lib/utils";

const pageTitle = "Prospkt Private Beta - AI Sales Rep for Local Service Teams";
const pageDescription =
  "Join the Prospkt waitlist for an AI sales rep that calls back leads, follows up on estimates, and books jobs with owner control.";

export const metadata: Metadata = {
  metadataBase: new URL("https://prospkt.ai"),
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "https://prospkt.ai/prelaunch",
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "https://prospkt.ai/prelaunch",
    siteName: "Prospkt",
    type: "website",
    images: [
      {
        url: "https://prospkt.ai/prelaunch/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Prospkt private beta waitlist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["https://prospkt.ai/prelaunch/opengraph-image"],
  },
};

const orbitItems = [
  {
    title: "Missed calls",
    icon: PhoneCallIcon,
    className: "left-0 top-[23%]",
  },
  {
    title: "Estimate follow-up",
    icon: WrenchIcon,
    className: "right-0 top-[20%]",
  },
  {
    title: "Owner approval",
    icon: ShieldCheckIcon,
    className: "left-10 bottom-[22%]",
  },
  {
    title: "Booked jobs",
    icon: CalendarCheckIcon,
    className: "right-10 bottom-[24%]",
  },
] as const;

const proofItems = [
  "Private beta",
  "Open source",
  "Owner-approved outreach",
];

const previewRows = [
  {
    title: "Missed call callback",
    detail: "AI rep calls back while the lead is still warm.",
    status: "Calling",
    icon: PhoneCallIcon,
    tone: "dark",
  },
  {
    title: "Estimate follow-up",
    detail: "$4,800 quote revived with an owner-approved script.",
    status: "Ready",
    icon: WrenchIcon,
    tone: "warm",
  },
  {
    title: "Booking confirmed",
    detail: "Customer chooses a service window and the job is logged.",
    status: "Booked",
    icon: CalendarCheckIcon,
    tone: "green",
  },
] as const;

export default function PrelaunchPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-canvas text-foreground">
      <PrelaunchAnalytics />
      <div className="relative mx-auto flex min-h-dvh max-w-[1180px] flex-col px-5 sm:px-6 lg:px-8">
        <header className="relative z-10 flex h-20 shrink-0 items-center justify-center">
          <Brand />
        </header>

        <section className="relative isolate pb-12 pt-5 sm:pb-16 sm:pt-8">
          <OrbitField />

          {orbitItems.map((item) => (
            <OrbitBadge key={item.title} {...item} />
          ))}

          <div className="relative z-10 mx-auto w-full max-w-[860px] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Private beta for local service teams
            </span>

            <AnimatedHeadline />

            <p className="mx-auto mt-6 max-w-[580px] text-pretty text-[15.5px] leading-relaxed text-muted-foreground sm:text-[16.5px]">
              Prospkt calls back missed leads, follows up on old estimates, and
              keeps you in control of every script, approval, and handoff.
            </p>

            <div className="mx-auto mt-8 max-w-[530px]">
              <PrelaunchEmailForm />
            </div>

            <div className="mx-auto mt-5 flex max-w-[680px] flex-wrap justify-center gap-1.5 text-[12px] text-muted-foreground">
              {proofItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1"
                >
                  <span className="size-1 rounded-full bg-subtle" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <ProductPreview />
        <Footer />
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="inline-flex items-center justify-center gap-2.5">
      <LogoMark className="size-9 rounded-xl" />
      <span className="text-[17px] font-semibold leading-none">Prospkt</span>
    </div>
  );
}

function AnimatedHeadline() {
  const phrases = [
    "calls back leads.",
    "follows up fast.",
    "books jobs.",
  ];

  return (
    <>
      <h1 className="mx-auto mt-6 max-w-[760px] text-balance text-[40px] font-semibold leading-[1.05] text-foreground sm:text-[60px] lg:text-[72px]">
        <span className="sr-only">
          An AI sales rep that calls back leads, follows up fast, and books jobs.
        </span>
        <span aria-hidden="true" className="block">
          An AI sales rep that
        </span>
        <span
          aria-hidden="true"
          className="prelaunch-headline-rotator mx-auto mt-1 block h-[1.08em] max-w-full overflow-hidden text-center"
        >
          {phrases.map((phrase, index) => (
            <span
              key={phrase}
              className="prelaunch-headline-phrase"
              style={{ animationDelay: `${index * 2.8}s` }}
            >
              {phrase}
            </span>
          ))}
        </span>
      </h1>
      <style>{`
        .prelaunch-headline-rotator {
          display: grid;
        }

        .prelaunch-headline-phrase {
          grid-area: 1 / 1;
          opacity: 0;
          transform: translateY(0.28em);
          animation: prelaunchHeadlineSwap 8.4s ease-out infinite;
        }

        @keyframes prelaunchHeadlineSwap {
          0%,
          6% {
            opacity: 0;
            transform: translateY(0.28em);
          }

          11%,
          31% {
            opacity: 1;
            transform: translateY(0);
          }

          37%,
          100% {
            opacity: 0;
            transform: translateY(-0.28em);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .prelaunch-headline-phrase {
            animation: none;
            transform: none;
          }

          .prelaunch-headline-phrase:first-child {
            opacity: 1;
          }

          .prelaunch-headline-phrase:not(:first-child) {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

function LogoMark({
  className,
  iconColor = "#FFFFFF",
}: {
  className?: string;
  iconColor?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-foreground text-white shadow-sm",
        className
      )}
      aria-hidden
    >
      <LightningIcon size="46%" weight="fill" color={iconColor} />
    </span>
  );
}

function OrbitField() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 hidden size-[820px] -translate-x-1/2 -translate-y-1/2 md:block"
      aria-hidden
    >
      <div className="absolute inset-[14%] rounded-full border border-hairline" />
      <div className="absolute inset-0 rounded-full border border-hairline" />
      <div className="absolute -inset-[18%] rounded-full border border-hairline" />
      <div className="absolute left-[16%] top-[30%] size-1 rounded-full bg-border" />
      <div className="absolute right-[20%] top-[38%] size-1 rounded-full bg-border" />
      <div className="absolute bottom-[23%] left-[25%] size-1 rounded-full bg-border" />
      <div className="absolute bottom-[27%] right-[18%] size-1 rounded-full bg-border" />
    </div>
  );
}

function OrbitBadge({
  title,
  icon: Icon,
  className,
}: (typeof orbitItems)[number]) {
  return (
    <div
      className={cn(
        "absolute z-10 hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left shadow-md lg:flex",
        className
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-canvas">
        <Icon size={13} weight="fill" aria-hidden />
      </span>
      <span className="block truncate text-[12px] font-medium">{title}</span>
    </div>
  );
}

function ProductPreview() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[920px] pb-14">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-foreground px-4 py-3 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <LogoMark
              className="size-8 rounded-lg bg-white text-foreground"
              iconColor="#0A0A0A"
            />
            <div className="min-w-0 text-left">
              <p className="truncate text-[13px] font-semibold">
                Today&apos;s sales rep queue
              </p>
              <p className="text-[12px] text-white/65">
                Calls, follow-ups, approvals, bookings
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-foreground">
            Private preview
          </span>
        </div>

        <div className="grid gap-px bg-hairline md:grid-cols-[1fr_0.42fr]">
          <div className="bg-surface">
            <div className="grid grid-cols-3 gap-px bg-hairline">
              <Stat label="Callbacks" value="18" />
              <Stat label="Follow-ups" value="42" />
              <Stat label="Booked" value="7" />
            </div>

            <ul className="divide-y divide-hairline">
              {previewRows.map((row) => (
                <PreviewRow key={row.title} {...row} />
              ))}
            </ul>
          </div>

          <div className="hidden bg-canvas p-4 md:block">
            <div className="rounded-xl border border-hairline bg-surface p-4 text-left">
              <p className="text-[12px] font-semibold">Owner controls</p>
              <div className="mt-4 space-y-3">
                <ControlRow label="Approve before outreach" value="On" />
                <ControlRow label="Daily call cap" value="20" />
                <ControlRow label="Consumer cold calls" value="Locked" />
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-hairline bg-[#F4F8F5] p-4 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon size={15} weight="fill" color="#2E7D4F" aria-hidden />
                <p className="text-[12px] font-semibold">Guardrails built in</p>
              </div>
              <p className="mt-2 text-pretty text-[11.5px] leading-5 text-muted-foreground">
                Source, DNC, local-hour, disclosure, and owner pause checks sit
                in the loop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({
  title,
  detail,
  status,
  icon: Icon,
  tone,
}: (typeof previewRows)[number]) {
  const toneClass = {
    dark: "bg-foreground text-white",
    warm: "bg-[#F7ECD8] text-[#9A6619]",
    green: "bg-[#E8F3EC] text-[#2E7D4F]",
  }[tone];

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 text-left sm:px-5 sm:py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas sm:size-10">
        <Icon size={15} weight="fill" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold">{title}</p>
        <p className="mt-1 truncate text-[12px] text-muted-foreground">
          {detail}
        </p>
      </div>
      <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", toneClass)}>
        {status}
      </span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-3 text-left sm:px-5 sm:py-4">
      <p className="truncate text-[11.5px] font-medium text-muted-foreground sm:text-[12px]">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums sm:mt-2 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

function ControlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium">
        {value}
      </span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-hairline py-6">
      <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="text-pretty text-[12.5px] leading-5 text-muted-foreground">
          Prospkt is open source and launching in public.
        </p>

        <a
          href="https://www.linkedin.com/company/prospkt"
          target="_blank"
          rel="noreferrer"
          aria-label="Follow Prospkt on LinkedIn"
          className="inline-flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          <LinkedinLogoIcon size={16} weight="fill" aria-hidden />
        </a>
      </div>
    </footer>
  );
}
