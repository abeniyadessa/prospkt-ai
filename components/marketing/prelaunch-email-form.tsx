"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackPrelaunchEvent } from "@/components/marketing/prelaunch-analytics";
import { cn } from "@/lib/utils";

type FormState = "idle" | "submitting" | "success" | "error";

export function PrelaunchEmailForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

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

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div
        className={cn(
          "group relative grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-[1.75rem] border bg-surface p-1.5 shadow-lg",
          state === "error"
            ? "border-[#E5B6B1]"
            : "border-border focus-within:border-foreground"
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
          className="h-11 rounded-full border-transparent bg-canvas px-4 text-[14.5px] placeholder:text-subtle focus-visible:border-border"
        />
        <Button
          type="submit"
          disabled={submitting || success}
          className="h-11 rounded-full px-4 text-[13px] sm:px-5"
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
            ? "text-[#C2352C]"
            : success
              ? "text-[#2E7D4F]"
              : "text-muted-foreground"
        )}
      >
        {success
          ? (
              <>
                You&apos;re on the list. Early invites go out first.{" "}
                <a
                  href="https://www.linkedin.com/company/prospkt"
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
