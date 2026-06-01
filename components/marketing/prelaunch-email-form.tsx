"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackPrelaunchEvent } from "@/components/marketing/prelaunch-analytics";
import { cn } from "@/lib/utils";

type FormState = "idle" | "submitting" | "success" | "error";

// Clerk throws when the email is already on the waitlist; we treat that as a
// successful "you're already in" rather than an error the visitor has to fix.
function isAlreadyOnWaitlist(error: unknown): boolean {
  const errors = (error as { errors?: Array<{ code?: string; message?: string }> })
    ?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((e) => {
    const code = e.code?.toLowerCase() ?? "";
    const msg = e.message?.toLowerCase() ?? "";
    return (
      code.includes("duplicate") ||
      code.includes("already") ||
      msg.includes("already") ||
      msg.includes("exists")
    );
  });
}

function clerkErrorMessage(error: unknown): string {
  const first = (error as { errors?: Array<{ message?: string }> })?.errors?.[0];
  return first?.message || "Could not join the list. Try again in a moment.";
}

export function PrelaunchEmailForm() {
  const clerk = useClerk();
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("submitting");
    setError("");

    const form = new FormData(formElement);
    const emailValue = form.get("email");
    const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

    trackPrelaunchEvent("waitlist_submit", {
      email,
      metadata: { cta: "hero_waitlist" },
    });

    try {
      // Clerk's native waitlist — signups land in the Clerk dashboard and can be
      // invited straight into the app when the beta opens.
      await clerk.joinWaitlist({ emailAddress: email });

      formElement.reset();
      trackPrelaunchEvent("waitlist_success", {
        email,
        metadata: { cta: "hero_waitlist" },
      });
      setSubmittedEmail(email);
      setState("success");
    } catch (submitError) {
      // Already on the list? That's still a win — show success, not an error.
      if (isAlreadyOnWaitlist(submitError)) {
        formElement.reset();
        trackPrelaunchEvent("waitlist_success", {
          email,
          metadata: { cta: "hero_waitlist", duplicate: true },
        });
        setSubmittedEmail(email);
        setState("success");
        return;
      }

      const message = clerkErrorMessage(submitError);
      trackPrelaunchEvent("waitlist_error", {
        email,
        metadata: { cta: "hero_waitlist", message },
      });
      setError(message);
      setState("error");
    }
  }

  const submitting = state === "submitting";
  const success = state === "success";

  if (success) {
    return (
      <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-white text-center shadow-[0_18px_50px_-12px_rgba(70,50,110,0.22)]">
        {/* Pastel gradient header band — echoes the orb */}
        <div
          className="relative flex items-center justify-center py-9"
          style={{
            background:
              "radial-gradient(120% 140% at 50% 0%, #C4D2F2 0%, #F3C2D6 52%, #F8CDA4 100%)",
          }}
        >
          <div
            className="flex size-[68px] items-center justify-center rounded-full text-[#1E7A45]"
            style={{
              background:
                "radial-gradient(circle at 38% 32%, #ffffff 0%, #f4fbf6 60%, #e6f3ea 100%)",
              boxShadow:
                "0 10px 26px rgba(60,40,90,0.18), inset 0 1px 1px rgba(255,255,255,0.9)",
            }}
            aria-hidden
          >
            <CheckIcon size={30} weight="bold" />
          </div>
        </div>

        <div className="px-7 pb-8 pt-7 sm:px-8">
          <h2 className="text-balance text-[24px] font-semibold leading-[1.12] tracking-tight text-black sm:text-[26px]">
            You&apos;re on the list.
          </h2>
          <p className="mx-auto mt-2 max-w-[330px] text-pretty text-[14px] leading-6 text-black/60">
            You&apos;re locked in as{" "}
            <span className="font-medium text-black">{submittedEmail}</span>, with
            founder pricing reserved for early access.
          </p>

          <div className="mt-6 rounded-2xl border border-black/[0.06] bg-[#F7F8F9] p-5 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/45">
              What happens next
            </p>
            <ul className="mt-3 space-y-3 text-[13.5px] leading-5 text-black/70">
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon
                  size={16}
                  weight="fill"
                  className="mt-px shrink-0 text-black/70"
                  aria-hidden
                />
                <span>
                  You&apos;re among the first we&apos;ll reach out to when access
                  opens.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon
                  size={16}
                  weight="fill"
                  className="mt-px shrink-0 text-black/70"
                  aria-hidden
                />
                <span>Founder pricing is locked in for early members.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon
                  size={16}
                  weight="fill"
                  className="mt-px shrink-0 text-black/70"
                  aria-hidden
                />
                <span>Follow the build below to watch Prospkt come together.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2.5 text-[12.5px] font-medium text-black/55">
            <span>Follow the build</span>
            <a
              href="https://www.linkedin.com/company/prospktai"
              target="_blank"
              rel="noreferrer"
              aria-label="Follow Prospkt on LinkedIn"
              className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-black transition-colors hover:bg-black/[0.04]"
            >
              <LinkedinLogoIcon size={15} weight="fill" aria-hidden />
            </a>
            <a
              href="https://x.com/Prospktai"
              target="_blank"
              rel="noreferrer"
              aria-label="Follow Prospkt on X"
              className="inline-flex size-8 items-center justify-center rounded-full border border-black/[0.08] text-black transition-colors hover:bg-black/[0.04]"
            >
              <XLogoIcon size={14} weight="fill" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div
        className={cn(
          "group relative grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-full border bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.05)]",
          state === "error" ? "border-[#E3B5B0]" : "border-black/[0.08] focus-within:border-black/30"
        )}
      >
        <label className="sr-only" htmlFor="prelaunch-email">
          Work email
        </label>
        <Input
          id="prelaunch-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          aria-invalid={state === "error"}
          aria-describedby="prelaunch-form-message"
          disabled={submitting || success}
          className="h-11 rounded-full border-transparent bg-transparent px-4 text-[16px] text-black placeholder:text-black/45 focus-visible:border-transparent sm:text-[14.5px]"
        />
        <Button
          type="submit"
          disabled={submitting || success}
          className="h-11 rounded-full bg-black px-4 text-[13px] text-white hover:bg-black/85 sm:px-5"
        >
          {submitting ? (
            <CircleNotchIcon size={14} className="animate-spin" aria-hidden />
          ) : success ? (
            <CheckIcon size={14} weight="bold" aria-hidden />
          ) : (
            <ArrowRightIcon size={13} weight="bold" aria-hidden />
          )}
          <span>
            {success
              ? "You're in"
              : submitting
                ? "Joining"
                : "Join waitlist"}
          </span>
        </Button>
      </div>

      <p
        id="prelaunch-form-message"
        role={state === "error" ? "alert" : "status"}
        className={cn(
          "mt-3 min-h-5 text-center text-[12px] leading-5",
          state === "error"
            ? "text-black"
            : success
              ? "text-black"
              : "text-black/70"
        )}
      >
        {success
          ? (
              <>
                You&apos;re on the list. Early invites go out first.{" "}
                <a
                  href="https://www.linkedin.com/company/prospktai"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  Follow the build.
                </a>
              </>
            )
          : error ||
            "No spam. Just a short note when private beta opens."}
      </p>
    </form>
  );
}
