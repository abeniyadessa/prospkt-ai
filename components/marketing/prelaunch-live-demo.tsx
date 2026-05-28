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
    <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-foreground">
          Talk to Max, one of Prospkt&apos;s AI agents.
        </p>
        <p className="max-w-[400px] text-[13px] leading-5 text-muted-foreground">
          Ask anything about Prospkt and how it fits your business. He will
          answer in real time.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={fetching}
        aria-label={fetching ? "Connecting" : "Start conversation"}
        className="press group relative flex h-24 w-24 items-center justify-center rounded-full bg-foreground text-white shadow-lg ring-1 ring-black/10 transition-transform hover:scale-[1.02] disabled:opacity-70"
      >
        <span
          className="pointer-events-none absolute -z-10 h-32 w-32 rounded-full opacity-50 transition-opacity group-hover:opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(96,165,250,0.45) 0%, rgba(96,165,250,0) 65%)",
            filter: "blur(20px)",
          }}
          aria-hidden
        />
        <MicrophoneIcon size={32} weight="fill" aria-hidden />
      </button>

      <div className="text-center">
        <p className="text-[13.5px] font-medium text-foreground">
          {fetching ? "Connecting…" : "Tap to start"}
        </p>
        <p className="mt-1 text-[11px] text-subtle">
          Uses your mic · Up to {Math.round(MAX_DURATION_SECONDS / 60)} min · Not recorded
        </p>
      </div>

      {errored ? (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-[#E5B6B1] bg-[#FFF5F3] px-3 py-2 text-[12px] text-[#9F2A22]">
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

      // Pass assistantId (persistent assistant) + per-call overrides.
      // This is Vapi's preferred pattern for browser sessions vs inline configs.
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

  return (
    <div className="flex flex-col items-center gap-6">
      <PulseOrb volume={volume} active={callStatus === "connected"} />

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
        <span className="tabular-nums">
          {(() => {
            const s = Math.max(0, secondsLeft);
            const m = Math.floor(s / 60);
            const r = s % 60;
            return `${m}:${r.toString().padStart(2, "0")} left`;
          })()}
        </span>
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
                    isMax ? "text-foreground" : "text-subtle"
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
                      ? "bg-foreground text-white"
                      : "bg-muted text-foreground ring-1 ring-inset ring-hairline"
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

function PulseOrb({ volume, active }: { volume: number; active: boolean }) {
  const energy = Math.min(1, Math.max(0, volume));

  return (
    <div
      className="relative mx-auto flex h-44 w-44 items-center justify-center"
      role="img"
      aria-label={energy > 0.05 ? "Voice active" : "Quiet"}
    >
      <div
        className="pointer-events-none absolute h-44 w-44 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.45) 0%, rgba(96,165,250,0) 65%)",
          transform: `scale(${1.1 + energy * 1.1})`,
          opacity: active ? 0.55 + energy * 0.4 : 0,
          filter: "blur(28px)",
          transition: "transform 90ms ease-out, opacity 120ms ease-out",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute h-36 w-36 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(59,130,246,0) 60%)",
          transform: `scale(${1 + energy * 0.8})`,
          opacity: active ? 0.7 : 0,
          filter: "blur(14px)",
          transition: "transform 70ms ease-out, opacity 120ms ease-out",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute h-28 w-28 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(147,197,253,0.85) 0%, rgba(147,197,253,0) 70%)",
          transform: `scale(${0.95 + energy * 0.45})`,
          opacity: active ? 0.85 : 0,
          filter: "blur(6px)",
          transition: "transform 50ms ease-out",
        }}
        aria-hidden
      />
      <div
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-foreground text-white shadow-lg ring-1 ring-black/10"
        style={{
          transform: `scale(${1 + energy * 0.05})`,
          transition: "transform 60ms ease-out",
        }}
      >
        <MicrophoneIcon size={32} weight="fill" aria-hidden />
      </div>
    </div>
  );
}
