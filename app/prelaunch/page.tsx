import type { Metadata } from "next";
import {
  LightningIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PrelaunchAnalytics } from "@/components/marketing/prelaunch-analytics";
import { PrelaunchEmailForm } from "@/components/marketing/prelaunch-email-form";
import { PrelaunchDemo } from "@/components/marketing/prelaunch-demo";
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

const headlinePhrases = [
  "Leads pick up.",
  "Jobs get booked.",
  "You stay in control.",
] as const;

export default function PrelaunchPage() {
  return (
    // NOTE: The bottom "voice glow" (components/marketing/voice-glow.tsx) is a
    // deliberate prelaunch-only exception to the CLAUDE.md "no gradients" rule:
    // a soft light anchored low on an otherwise near-white page. Keep <main>
    // transparent so the fixed -z-10 glow shows over the body background.
    <main className="relative min-h-dvh overflow-x-hidden text-black">
      <PrelaunchAnalytics />
      <div className="relative mx-auto flex min-h-dvh max-w-[1120px] flex-col px-5 sm:px-6 lg:px-8">
        <section
          className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center py-12 text-center"
        >
          <Brand />

          <h1 className="mx-auto mt-7 text-balance text-[34px] font-semibold leading-[1.06] text-black sm:text-[50px] lg:text-[56px]">
            <span className="block">Your AI agent calls.</span>
            <AnimatedOutcome />
          </h1>

          <p className="mx-auto mt-4 max-w-[480px] text-pretty text-[14.5px] leading-6 text-black/75 sm:text-[15px]">
            Hear how Prospkt turns a missed call into a booked job.
          </p>

          <div className="mx-auto mt-7 w-full max-w-[420px]">
            <PrelaunchDemo />

            <div className="mt-4 w-full">
              <PrelaunchEmailForm />
            </div>
          </div>

          <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2 text-[12px]">
            {proofItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-black/65 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
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
      <span className="ml-2 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.04em] text-black/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
        className="prelaunch-outcome-rotator mx-auto block h-[1.32em] overflow-hidden"
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
          background-image: linear-gradient(
            100deg,
            #6e86e8 0%,
            #9e73da 32%,
            #e06a9e 64%,
            #e2722e 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        /* Keep selected text legible — don't show the gradient under selection */
        .prelaunch-outcome-rotator::selection,
        .prelaunch-outcome-rotator *::selection {
          -webkit-text-fill-color: #16181d;
          color: #16181d;
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

function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-black/[0.08] py-6">
      <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <p className="text-pretty text-[12.5px] leading-5 text-black/70">
          Prospkt is launching in public. Follow the build.
        </p>

        <div className="flex items-center gap-1">
          <a
            href="https://www.linkedin.com/company/prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on LinkedIn"
            className="inline-flex size-8 items-center justify-center text-black/70 transition-colors hover:text-black"
          >
            <LinkedinLogoIcon size={16} weight="fill" aria-hidden />
          </a>
          <a
            href="https://x.com/Prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on X"
            className="inline-flex size-8 items-center justify-center text-black/70 transition-colors hover:text-black"
          >
            <XLogoIcon size={15} weight="fill" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
