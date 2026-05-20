"use client";

import { useEffect } from "react";

type PrelaunchEventName =
  | "prelaunch_view"
  | "waitlist_submit"
  | "waitlist_success"
  | "waitlist_error";

type PrelaunchEventPayload = {
  source?: string;
  path?: string;
  referrer?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    __prospktPrelaunchViewTracked?: boolean;
  }
}

export function trackPrelaunchEvent(
  name: PrelaunchEventName,
  payload: PrelaunchEventPayload = {}
) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    name,
    source: payload.source ?? "prelaunch",
    path: payload.path ?? window.location.pathname,
    referrer: payload.referrer ?? document.referrer,
    email: payload.email,
    metadata: payload.metadata,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/prelaunch/events", blob)) return;
  }

  void fetch("/api/prelaunch/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function PrelaunchAnalytics() {
  useEffect(() => {
    if (window.__prospktPrelaunchViewTracked) return;
    window.__prospktPrelaunchViewTracked = true;

    trackPrelaunchEvent("prelaunch_view", {
      metadata: {
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      },
    });
  }, []);

  return null;
}
