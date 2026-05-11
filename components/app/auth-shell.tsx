import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  DatabaseIcon,
  LightningIcon,
  PhoneCallIcon,
} from "@phosphor-icons/react/dist/ssr";

export function AuthShell({
  children,
  mode,
}: {
  children: ReactNode;
  mode: "sign-in" | "sign-up";
}) {
  const isSignIn = mode === "sign-in";

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[1180px] items-center">
        <div className="grid w-full overflow-hidden rounded-[24px] border border-hairline bg-surface shadow-xl shadow-black/[0.06] lg:grid-cols-[minmax(0,1fr)_470px]">
          <section className="hidden min-h-[640px] bg-[#0A0A0A] p-8 text-white lg:block">
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <Link href="/" className="inline-flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white text-foreground">
                    <LightningIcon size={16} weight="fill" />
                  </span>
                  <span className="text-[14px] font-semibold">Prospkt</span>
                </Link>

                <div className="mt-16 max-w-[460px]">
                  <p className="text-[12px] font-medium text-white/55">Built by YALID</p>
                  <h1 className="mt-4 text-balance text-[44px] font-semibold leading-[0.98]">
                    {isSignIn
                      ? "Sign in to your Prospkt workspace."
                      : "Launch your guarded AI sales workspace."}
                  </h1>
                  <p className="mt-5 text-pretty text-[15px] leading-relaxed text-white/62">
                    Access your campaigns, CRM, calls, and booked jobs from one focused command
                    center.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <AgentRow icon={DatabaseIcon} title="CRM memory" detail="Every contact, call, and skip is logged." />
                <AgentRow icon={PhoneCallIcon} title="Guarded calling" detail="Daily caps, local hours, DNC, and pause state." />
                <AgentRow icon={CalendarCheckIcon} title="Booked jobs" detail="Interested contacts land in the calendar flow." />
              </div>
            </div>
          </section>

          <section className="flex min-h-[640px] flex-col justify-center px-5 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto mb-7 flex w-full max-w-[430px] items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-white">
                  <LightningIcon size={16} weight="fill" />
                </span>
                <span className="text-[15px] font-semibold text-foreground">Prospkt</span>
              </Link>
              <span className="text-[12px] font-medium text-muted-foreground">Built by YALID</span>
            </div>

            <div className="mx-auto w-full max-w-[430px]">
              {children}

              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to marketing
                <ArrowRightIcon size={12} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AgentRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-foreground">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">{detail}</p>
      </div>
    </div>
  );
}
