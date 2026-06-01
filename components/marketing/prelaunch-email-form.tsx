"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  ArrowRightIcon,
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
      <div className="mx-auto w-full max-w-[400px] rounded-[1.5rem] border border-black/[0.07] bg-white px-8 py-9 text-center shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
        <div
          className="mx-auto flex size-11 items-center justify-center rounded-full text-[#1E7A45]"
          style={{ backgroundColor: "#EAF5EE" }}
          aria-hidden
        >
          <CheckIcon size={20} weight="bold" />
        </div>

        <h2 className="mt-5 text-[22px] font-semibold tracking-tight text-black">
          You&apos;re on the list.
        </h2>
        <p className="mx-auto mt-1.5 max-w-[300px] text-[14px] leading-6 text-black/55">
          We&apos;ll reach out to{" "}
          <span className="font-medium text-black">{submittedEmail}</span> when early
          access opens.
        </p>

        <div className="mt-7 flex items-center justify-center gap-2.5 text-[12.5px] text-black/45">
          <span>Follow the build</span>
          <a
            href="https://www.linkedin.com/company/prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on LinkedIn"
            className="inline-flex size-8 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/[0.05] hover:text-black"
          >
            <LinkedinLogoIcon size={15} weight="fill" aria-hidden />
          </a>
          <a
            href="https://x.com/Prospktai"
            target="_blank"
            rel="noreferrer"
            aria-label="Follow Prospkt on X"
            className="inline-flex size-8 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/[0.05] hover:text-black"
          >
            <XLogoIcon size={14} weight="fill" aria-hidden />
          </a>
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
