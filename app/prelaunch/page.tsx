import type { Metadata } from "next";
import {
  LightningIcon,
  LinkedinLogoIcon,
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

const proofItems = [
  "Private beta",
  "Open source",
  "Owner-approved outreach",
];

const transcriptLines = [
  {
    speaker: "Prospkt",
    time: "00:07",
    text: "Hi Angela, this is Sarah with Greenway Services. I saw you requested a quote online. Is now still a good time?",
  },
  {
    speaker: "Angela",
    time: "00:11",
    text: "Yes, I'm available. We'd like to get our deck replaced.",
  },
] as const;

const headlinePhrases = [
  "Leads pick up.",
  "Jobs get booked.",
  "You stay in control.",
] as const;

const waveformBars = [
  10, 14, 20, 16, 28, 38, 24, 44, 18, 34, 48, 26, 58, 42, 30, 52, 36, 22, 46,
  62, 34, 18, 40, 54, 28, 50, 36, 24, 44, 32, 16, 26,
] as const;

export default function PrelaunchPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-canvas text-foreground">
      <PrelaunchAnalytics />
      <div className="relative mx-auto flex min-h-dvh max-w-[1120px] flex-col px-5 sm:px-6 lg:px-8">
        <section className="relative mx-auto flex w-full flex-1 flex-col items-center pb-12 pt-10 text-center sm:pb-16 sm:pt-16">
          <Brand />

          <h1 className="mx-auto mt-9 max-w-[820px] text-balance text-[36px] font-semibold leading-[1.06] text-foreground sm:text-[56px] lg:text-[62px]">
            <span className="block">Your AI agent calls.</span>
            <AnimatedOutcome />
          </h1>

          <p className="mx-auto mt-5 max-w-[520px] text-pretty text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
            Hear how Prospkt turns a missed call into a booked job.
          </p>

          <VoiceDemo />

          <div className="mx-auto mt-8 w-full max-w-[530px]">
            <PrelaunchEmailForm />
          </div>

          <div className="mx-auto mt-5 flex max-w-[680px] flex-wrap justify-center gap-2 text-[12px] text-muted-foreground">
            {proofItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5"
              >
                <span className="size-1.5 rounded-full bg-success" aria-hidden />
                {item}
              </span>
            ))}
          </div>
        </section>

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
      <span className="ml-2 rounded-full border border-[#BFE8CA] bg-[#F2FBF4] px-2.5 py-1 text-[10.5px] font-medium text-[#16823D]">
        Early access
      </span>
    </div>
  );
}

function AnimatedOutcome() {
  return (
    <>
      <span className="sr-only">
        Leads pick up. Jobs get booked. You stay in control.
      </span>
      <span
        aria-hidden="true"
        className="prelaunch-outcome-rotator mx-auto block h-[1.32em] overflow-hidden text-[#16823D]"
      >
        <span className="prelaunch-outcome-track">
          {[...headlinePhrases, headlinePhrases[0]].map((phrase, index) => (
            <span key={`${phrase}-${index}`} className="prelaunch-outcome-row">
              {phrase}
            </span>
          ))}
        </span>
      </span>
      <style>{`
        .prelaunch-outcome-rotator {
          display: block;
        }

        .prelaunch-outcome-track {
          display: flex;
          flex-direction: column;
          animation: prelaunchOutcomeRoll 8.4s ease-in-out infinite;
        }

        .prelaunch-outcome-row {
          display: flex;
          min-height: 1.32em;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        @keyframes prelaunchOutcomeRoll {
          0%,
          22% {
            transform: translate3d(0, 0, 0);
          }

          32%,
          54% {
            transform: translate3d(0, -25%, 0);
          }

          64%,
          86% {
            transform: translate3d(0, -50%, 0);
          }

          100% {
            transform: translate3d(0, -75%, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .prelaunch-outcome-track {
            animation: none;
            transform: none;
          }

          .prelaunch-outcome-row:not(:first-child) {
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

function VoiceDemo() {
  return (
    <div className="prelaunch-voice-demo mx-auto mt-9 w-full max-w-[720px] rounded-2xl border border-border bg-surface p-4 text-left shadow-lg sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:contents">
          <VoiceEndpoint
            label="AI rep"
            name="Prospkt"
            time="00:00"
            withLogo
            className="sm:col-start-1 sm:row-start-1"
          />
          <VoiceEndpoint
            label="Caller"
            name="Angela"
            time="02:14"
            align="right"
            className="sm:col-start-3 sm:row-start-1"
          />
        </div>

        <div className="prelaunch-audio-strip flex min-w-0 items-center gap-2.5 rounded-2xl border border-hairline bg-canvas px-3 py-3 sm:col-start-2 sm:row-start-1 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-1 sm:py-0">
          <Waveform />
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-white shadow-sm sm:size-12">
            <span
              className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-white"
              aria-hidden
            />
          </span>
          <Waveform reverse />
        </div>
      </div>

      <div className="mt-5 grid gap-3 min-[520px]:grid-cols-2 sm:mt-6">
        {transcriptLines.map((line) => (
          <TranscriptCard key={`${line.speaker}-${line.time}`} {...line} />
        ))}
      </div>
    </div>
  );
}

function VoiceEndpoint({
  label,
  name,
  time,
  align = "left",
  withLogo = false,
  className,
}: {
  label: string;
  name: string;
  time: string;
  align?: "left" | "right";
  withLogo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" && "justify-end text-right",
        className
      )}
    >
      {withLogo ? <LogoMark className="size-9 shrink-0 rounded-xl" /> : null}
      <div className="min-w-0">
        <p className="truncate text-[12px] text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-semibold">{name}</p>
        <p className="mt-0.5 text-[11px] tabular-nums text-subtle">{time}</p>
      </div>
    </div>
  );
}

function Waveform({ reverse = false }: { reverse?: boolean }) {
  const bars = reverse ? [...waveformBars].reverse() : waveformBars;
  const barWidth = 3;
  const gap = 5;
  const viewBoxWidth = bars.length * barWidth + (bars.length - 1) * gap;

  return (
    <div className="prelaunch-waveform min-w-0 flex-1">
      <svg
        className="h-9 w-full sm:h-10"
        viewBox={`0 0 ${viewBoxWidth} 72`}
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
        aria-hidden
      >
        <line
          x1="0"
          x2={viewBoxWidth}
          y1="36"
          y2="36"
          stroke="#E6E6E6"
          strokeWidth="1"
        />
        {bars.map((height, index) => (
          <rect
            key={`${height}-${index}`}
            x={index * (barWidth + gap)}
            y={(72 - height) / 2}
            width={barWidth}
            height={height}
            rx="2"
            fill="#C7C7C7"
          />
        ))}
      </svg>
    </div>
  );
}

function TranscriptCard({
  speaker,
  time,
  text,
}: (typeof transcriptLines)[number]) {
  return (
    <div className="rounded-xl bg-canvas p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-muted-foreground">
          {speaker}
        </p>
        <p className="text-[11px] tabular-nums text-subtle">{time}</p>
      </div>
      <p className="mt-2 text-pretty text-[12px] leading-5 text-foreground">
        {text}
      </p>
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
