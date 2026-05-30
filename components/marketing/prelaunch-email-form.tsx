"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  LinkedinLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackPrelaunchEvent } from "@/components/marketing/prelaunch-analytics";
import { cn } from "@/lib/utils";

type FormState = "idle" | "submitting" | "success" | "error";

export function PrelaunchEmailForm() {
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
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "prelaunch",
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not join the list.");
      }

      formElement.reset();
      trackPrelaunchEvent("waitlist_success", {
        email,
        metadata: { cta: "hero_waitlist" },
      });
      setSubmittedEmail(email);
      setState("success");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not join the list.";

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
      <div className="mx-auto w-full max-w-[460px] rounded-[1.75rem] border border-black/[0.08] bg-white p-7 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)] sm:p-8">
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "#E8F3EC", color: "#1E7A45" }}
          aria-hidden
        >
          <CheckIcon size={22} weight="bold" />
        </div>
        <h2 className="mt-5 text-balance text-[22px] font-semibold leading-[1.15] text-black sm:text-[24px]">
          You&apos;re on the list.
        </h2>
        <p className="mt-2 text-pretty text-[14px] leading-6 text-black/70">
          We just sent a confirmation to{" "}
          <span className="font-medium text-black">{submittedEmail}</span>.
        </p>
        <div className="mt-5 rounded-xl border border-black/[0.07] bg-[#F7F8F9] p-4 text-left text-[13px] leading-5 text-black/70">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-black/55">
            What happens next
          </p>
          <ul className="mt-2 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/40" aria-hidden />
              <span>You&apos;ll get an email the second waitlist invites go out.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/40" aria-hidden />
              <span>You&apos;re locked in at founder pricing when we launch.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/40" aria-hidden />
              <span>Want in faster? Reply to the email and tell us about your business.</span>
            </li>
          </ul>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3 text-[12.5px] text-black/70">
          <span>Follow the build</span>
          <span className="text-black/40">·</span>
          <a
            href="https://www.linkedin.com/company/prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on LinkedIn"
            className="inline-flex size-7 items-center justify-center rounded-md text-black transition-colors hover:bg-black/[0.04]"
          >
            <LinkedinLogoIcon size={14} weight="fill" aria-hidden />
          </a>
          <a
            href="https://x.com/Prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on X"
            className="inline-flex size-7 items-center justify-center rounded-md text-black transition-colors hover:bg-black/[0.04]"
          >
            <XLogoIcon size={13} weight="fill" aria-hidden />
          </a>
        </div>
        <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-[11.5px] text-black/55">
          <EnvelopeSimpleIcon size={11} weight="fill" />
          Check your inbox (and spam, just in case).
        </p>
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
