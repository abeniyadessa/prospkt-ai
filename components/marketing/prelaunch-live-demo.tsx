"use client";

import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_DURATION_SECONDS = 240;

type AssistantOverrides = Record<string, unknown>;

type ConfigState =
  | { status: "idle" }
  | { status: "fetching" }
  | {
      status: "ready";
      publicKey: string;
      assistantId: string;
      assistantOverrides?: AssistantOverrides;
    }
  | { status: "error"; message: string };

type CallStatus = "idle" | "connecting" | "connected" | "ended" | "error";

type TranscriptMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
};

export function PrelaunchLiveDemo() {
  const [configState, setConfigState] = useState<ConfigState>({ status: "idle" });

  async function startSession() {
    setConfigState({ status: "fetching" });
    try {
      const res = await fetch("/api/voice/vapi-config", { method: "POST" });
      const data = (await res.json()) as
        | {
            ok: true;
            publicKey: string;
            assistantId: string;
            assistantOverrides?: AssistantOverrides;
          }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        throw new Error(
          ("error" in data && data.error) || "Failed to start session."
        );
      }
      setConfigState({
        status: "ready",
        publicKey: data.publicKey,
        assistantId: data.assistantId,
        assistantOverrides: data.assistantOverrides,
      });
    } catch (error) {
      setConfigState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Could not start the voice demo.",
      });
    }
  }

  function reset() {
    setConfigState({ status: "idle" });
  }

  if (configState.status === "ready") {
    return (
      <ActiveSession
        publicKey={configState.publicKey}
        assistantId={configState.assistantId}
        assistantOverrides={configState.assistantOverrides}
        onEnd={reset}
      />
    );
  }

  return <IdleSurface state={configState} onStart={startSession} onRetry={reset} />;
}

function IdleSurface({
  state,
  onStart,
  onRetry,
}: {
  state: ConfigState;
  onStart: () => void;
  onRetry: () => void;
}) {
  const fetching = state.status === "fetching";
  const errored = state.status === "error";

  return (
    <div className="flex flex-col items-center gap-7 px-2 py-8 text-center">
      <GlowOrb
        state={fetching ? "connecting" : "idle"}
        onClick={onStart}
        disabled={fetching}
      />

      <div className="space-y-1.5">
        <p className="text-[16px] font-semibold tracking-tight text-foreground">
          Talk to Max
        </p>
        <p className="max-w-[420px] text-[13.5px] leading-[1.5] text-muted-foreground">
          Prospect&apos;s AI sales rep. Ask anything about how this would fit in your business.
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-[13.5px] font-medium text-foreground">
          {fetching ? "Connecting…" : "Tap the orb to start"}
        </p>
        <p className="text-[11px] text-subtle">
          Uses your mic · Up to {Math.round(MAX_DURATION_SECONDS / 60)} min · Not
          recorded
        </p>
      </div>

      {errored ? (
        <div className="flex items-center gap-2 rounded-md border border-[#E5B6B1] bg-[#FFF5F3] px-3 py-2 text-[12px] text-[#9F2A22]">
          <WarningCircleIcon size={14} weight="fill" />
          <span>{state.message}</span>
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ActiveSession({
  publicKey,
  assistantId,
  assistantOverrides,
  onEnd,
}: {
  publicKey: string;
  assistantId: string;
  assistantOverrides?: AssistantOverrides;
  onEnd: () => void;
}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("connecting");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(MAX_DURATION_SECONDS);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const startedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (startedRef.current) return;
    const handle = setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;

      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => setCallStatus("connected"));
      vapi.on("call-end", () => {
        setCallStatus("ended");
        onEndRef.current();
      });
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on(
        "message",
        (msg: {
          type?: string;
          role?: string;
          transcript?: string;
          transcriptType?: string;
        }) => {
          if (
            msg.type === "transcript" &&
            msg.transcriptType === "final" &&
            msg.transcript
          ) {
            const role = msg.role === "assistant" ? "agent" : "user";
            setTranscript((prev) => [
              ...prev,
              { id: `${role}-${prev.length}`, role, text: msg.transcript! },
            ]);
          }
        }
      );
      vapi.on("error", (err: unknown) => {
        const e = err as Record<string, unknown> | null | undefined;
        console.error("[vapi] error", {
          toString: e ? String(e) : null,
          ownProps: e ? Object.getOwnPropertyNames(e) : null,
          message: (e as { message?: string })?.message,
          type: (e as { type?: string })?.type,
          raw: err,
        });
        setCallStatus("error");
      });

      const startArgs: unknown[] = assistantOverrides
        ? [assistantId, assistantOverrides]
        : [assistantId];
      (
        vapi.start as unknown as (...args: unknown[]) => Promise<unknown>
      )(...startArgs).catch((err: unknown) => {
        console.error("[vapi] start failed", err);
        setCallStatus("error");
        onEndRef.current();
      });
    }, 80);

    return () => clearTimeout(handle);
  }, [publicKey, assistantId, assistantOverrides]);

  useEffect(() => {
    return () => {
      try {
        vapiRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus !== "connected") return;
    if (secondsLeft <= 0) {
      try {
        vapiRef.current?.stop();
      } catch {
        /* noop */
      }
      onEndRef.current();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [callStatus, secondsLeft]);

  const handleEnd = useCallback(() => {
    try {
      vapiRef.current?.stop();
    } catch {
      /* noop */
    }
    onEnd();
  }, [onEnd]);

  const handleToggleMute = useCallback(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;
    const next = !isMuted;
    try {
      vapi.setMuted(next);
      setIsMuted(next);
    } catch (err) {
      console.error("[vapi] mute toggle failed", err);
    }
  }, [isMuted]);

  const statusLabel =
    callStatus === "connecting"
      ? "Connecting…"
      : callStatus === "connected"
        ? volume > 0.05
          ? "Max is speaking…"
          : "Listening…"
        : callStatus === "error"
          ? "Connection error"
          : "Disconnected";

  const timeLeftLabel = (() => {
    const s = Math.max(0, secondsLeft);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")} left`;
  })();

  return (
    <div className="flex flex-col items-center gap-6 px-2 py-8 text-center">
      <GlowOrb
        state={
          callStatus === "error"
            ? "error"
            : callStatus === "connected"
              ? "connected"
              : callStatus === "connecting"
                ? "connecting"
                : "idle"
        }
        volume={volume}
      />

      <div className="flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground">
        <span
          className={cn(
            "size-1.5 rounded-full",
            callStatus === "connected" ? "animate-pulse bg-[#2E7D4F]" : "bg-subtle"
          )}
          aria-hidden
        />
        <span className="text-foreground">{statusLabel}</span>
        <span className="text-subtle">·</span>
        <span className="tabular-nums">{timeLeftLabel}</span>
      </div>

      <Transcript transcript={transcript} />

      <div className="flex items-center justify-center gap-4 pt-1">
        <button
          type="button"
          onClick={handleToggleMute}
          className={cn(
            "press inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors",
            isMuted
              ? "text-[#9F2A22] hover:text-[#7e1e16]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isMuted ? (
            <MicrophoneSlashIcon size={13} weight="fill" />
          ) : (
            <MicrophoneIcon size={13} weight="fill" />
          )}
          {isMuted ? "Muted" : "Mute"}
        </button>

        <span className="size-1 rounded-full bg-subtle/40" aria-hidden />

        <button
          type="button"
          onClick={handleEnd}
          className="press inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#9F2A22] transition-colors hover:text-[#7e1e16]"
        >
          <PhoneDisconnectIcon size={13} weight="fill" />
          End call
        </button>
      </div>
    </div>
  );
}

function Transcript({ transcript }: { transcript: TranscriptMessage[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [transcript.length]);

  if (transcript.length === 0) {
    return (
      <p className="text-center text-[12.5px] italic text-subtle">
        Say hi to get started. Max will take it from there.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[480px] max-h-[220px] overflow-y-auto px-1 py-1"
    >
      <ol className="space-y-3">
        {transcript.map((m) => {
          const isMax = m.role === "agent";
          return (
            <li
              key={m.id}
              className={cn(
                "flex w-full",
                isMax ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[85%] flex-col gap-1",
                  isMax ? "items-start" : "items-end"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.08em] leading-none",
                    isMax ? "text-[#1E3A8A]" : "text-subtle"
                  )}
                  aria-hidden
                >
                  {isMax ? "Max" : "You"}
                </span>
                <Card
                  size="sm"
                  className={cn(
                    "gap-0 rounded-2xl border-0 py-0 ring-0",
                    isMax
                      ? "bg-[#1E3A8A] text-white"
                      : "bg-[#F1F5F9] text-foreground ring-1 ring-inset ring-[#E2E8F0]"
                  )}
                >
                  <CardContent className="px-3.5 py-2 text-left text-[13.5px] leading-[1.45]">
                    {m.text}
                  </CardContent>
                </Card>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The Max orb — the AI's visual signature on the prelaunch page.
 *
 * Brand decisions:
 *   Palette  — cool monochrome blue (sky/blue/ice + brand-success green pip).
 *              Reads B2B + trustworthy + AI, without the consumer purple
 *              connotation Prospkt's trades audience would distrust.
 *   Motion   — ripple/sonar metaphor (concentric expanding rings) instead of
 *              rotating shimmer. Functional: "AI listening." Futuristic
 *              without flashy.
 *   Layers   — softer than the prior purple. Single-family blue.
 *
 * Composition (back to front):
 *   1. Outer halo   — radial blue glow, heavy blur, slow drift (orbDrift)
 *   2. Ripple rings — 3 concentric expanding rings, staggered 1.2s each
 *   3. Inner orb    — chrome/ice glassy ball, breathing + volume-reactive
 *   4. Status pip   — brand-green, only when connected
 *
 * On idle the orb is a button. On active it's a passive visualizer driven by
 * the call's `volume-level` events.
 */
function GlowOrb({
  state,
  volume = 0,
  onClick,
  disabled = false,
}: {
  state: "idle" | "connecting" | "connected" | "ended" | "error";
  volume?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const energy = Math.min(1, Math.max(0, volume));
  const interactive = state === "idle" && !disabled;
  const isActive = state === "connected" || state === "connecting";
  const haloOpacity =
    state === "connected"
      ? 0.78 + energy * 0.2
      : state === "error"
        ? 0.35
        : state === "idle"
          ? 0.7
          : 0.6;

  const content = (
    <>
      <div
        className="orb-drift pointer-events-none absolute h-60 w-60 rounded-full"
        style={{
          background: `radial-gradient(circle at center,
            rgba(96, 165, 250, 0.55) 0%,
            rgba(59, 130, 246, 0.32) 38%,
            rgba(30, 64, 175, 0.0) 78%
          )`,
          filter: "blur(32px)",
          opacity: haloOpacity,
          transform: `scale(${1.0 + energy * 0.16})`,
          transition: "opacity 240ms ease-out, transform 90ms ease-out",
        }}
        aria-hidden
      />

      {isActive ? (
        <>
          <span
            className="orb-ripple-1 pointer-events-none absolute h-32 w-32 rounded-full border"
            style={{ borderColor: "rgba(59, 130, 246, 0.55)", borderWidth: "1.5px" }}
            aria-hidden
          />
          <span
            className="orb-ripple-2 pointer-events-none absolute h-32 w-32 rounded-full border"
            style={{ borderColor: "rgba(96, 165, 250, 0.45)", borderWidth: "1.5px" }}
            aria-hidden
          />
          <span
            className="orb-ripple-3 pointer-events-none absolute h-32 w-32 rounded-full border"
            style={{ borderColor: "rgba(125, 211, 252, 0.4)", borderWidth: "1.5px" }}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className="orb-breath pointer-events-none relative h-32 w-32 rounded-full"
        style={{
          background: `radial-gradient(circle at 36% 30%,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(224, 240, 254, 0.88) 26%,
            rgba(159, 202, 234, 0.7) 62%,
            rgba(96, 142, 200, 0.55) 100%
          )`,
          boxShadow: `
            inset 0 -10px 30px rgba(30, 64, 175, 0.38),
            inset 0 10px 24px rgba(255, 255, 255, 0.78),
            0 14px 44px rgba(59, 130, 246, 0.22)
          `,
          transform: `scale(${1 + energy * 0.06})`,
          transition: "transform 70ms ease-out",
        }}
        aria-hidden
      />

      {state === "connected" ? (
        <span
          className="pointer-events-none absolute bottom-3 right-3 size-2.5 animate-pulse rounded-full bg-[#2E7D4F] ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Start conversation with Max"
        className="group relative mx-auto flex h-60 w-60 items-center justify-center rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role={state === "connected" ? "img" : undefined}
      aria-label={
        state === "connected"
          ? energy > 0.05
            ? "Max is speaking"
            : "Listening"
          : undefined
      }
      className="relative mx-auto flex h-60 w-60 items-center justify-center"
    >
      {content}
    </div>
  );
}
