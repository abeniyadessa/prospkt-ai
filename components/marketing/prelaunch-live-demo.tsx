"use client";

import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Vapi from "@vapi-ai/web";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VoiceOrb, type VoiceVisualState } from "@/components/marketing/voice-orb";
import { VoiceGlow } from "@/components/marketing/voice-glow";

const MAX_DURATION_SECONDS = 240;

// Max says the brand phonetically ("Prospect") so ElevenLabs pronounces it right,
// but on screen that looks like a misspelling of "Prospkt". Fix it at the display
// layer only — the audio stays correct, the transcript shows the real brand.
function toBrandText(text: string) {
  return text.replace(/Prospect/g, "Prospkt");
}

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
  // True when the last call ended because it dropped/errored (vs. the caller or
  // Max ending it cleanly). Drives the "tap the orb to reconnect" affordance.
  const [dropped, setDropped] = useState(false);

  async function startSession() {
    setDropped(false);
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
    setDropped(false);
    setConfigState({ status: "idle" });
  }

  // ActiveSession reports WHY the call ended so we can either quietly return to
  // the start state (clean end) or invite a reconnect (drop/error).
  function handleSessionEnd(reason: "ended" | "dropped") {
    setDropped(reason === "dropped");
    setConfigState({ status: "idle" });
  }

  if (configState.status === "ready") {
    return (
      <ActiveSession
        publicKey={configState.publicKey}
        assistantId={configState.assistantId}
        assistantOverrides={configState.assistantOverrides}
        onEnd={handleSessionEnd}
      />
    );
  }

  return (
    <IdleSurface
      state={configState}
      dropped={dropped}
      onStart={startSession}
      onRetry={reset}
    />
  );
}

function CallPanel({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[420px]">{children}</div>;
}

function IdleSurface({
  state,
  dropped,
  onStart,
  onRetry,
}: {
  state: ConfigState;
  dropped: boolean;
  onStart: () => void;
  onRetry: () => void;
}) {
  const fetching = state.status === "fetching";
  const errored = state.status === "error";

  return (
    <CallPanel>
      <VoiceGlow state={fetching ? "connecting" : "idle"} />
      <div className="flex flex-col items-center gap-4 text-center">
        <VoiceOrb
          state={fetching ? "connecting" : "idle"}
          onClick={onStart}
          disabled={fetching}
        />

        <div className="space-y-1">
          <p className="text-[15px] font-semibold tracking-tight text-black">
            {fetching ? "Connecting…" : "Tap to talk to Max"}
          </p>
          <p className="mx-auto max-w-[320px] text-[12.5px] leading-[1.5] text-black/60">
            Not a recording. Talk to Max live and hear it close.
          </p>
        </div>

        {dropped && !fetching ? (
          <p className="rounded-full border border-black/[0.07] bg-white px-3 py-1 text-[11.5px] font-medium text-black/70">
            Call dropped. Tap the orb to pick it back up.
          </p>
        ) : null}

        {errored ? (
          <div className="flex items-center gap-2 rounded-full border border-[#EBD6D3] bg-[#FBF4F3] px-3 py-2 text-[12px] text-[#A23A30]">
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
        ) : (
          <p className="text-[10.5px] text-black/45">
            Uses your mic · Up to {Math.round(MAX_DURATION_SECONDS / 60)} min · Not recorded
          </p>
        )}
      </div>
    </CallPanel>
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
  onEnd: (reason: "ended" | "dropped") => void;
}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("connecting");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(MAX_DURATION_SECONDS);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  // Who is mid-sentence right now, from Vapi `speech-update` events. Drives the
  // green "you're talking" vs warm "Max is talking" treatment.
  const [speaker, setSpeaker] = useState<"user" | "assistant" | null>(null);
  const startedRef = useRef(false);
  // Vapi can emit both `error` and `call-end` for one teardown; this guard makes
  // sure we report the end exactly once, keeping the first (truer) reason.
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });
  const finish = useCallback((reason: "ended" | "dropped") => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndRef.current(reason);
  }, []);

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
        finish("ended");
      });
      vapi.on("volume-level", (v: number) => setVolume(v));
      vapi.on(
        "message",
        (msg: {
          type?: string;
          role?: string;
          status?: string;
          transcript?: string;
          transcriptType?: string;
        }) => {
          if (msg.type === "speech-update") {
            const who = msg.role === "user" ? "user" : "assistant";
            if (msg.status === "started") {
              setSpeaker(who);
            } else if (msg.status === "stopped") {
              setSpeaker((cur) => (cur === who ? null : cur));
            }
            return;
          }
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
        // Don't strand the caller in a dead "error" view — fall back to the orb
        // so they can tap to reconnect.
        finish("dropped");
      });

      const startArgs: unknown[] = assistantOverrides
        ? [assistantId, assistantOverrides]
        : [assistantId];
      (
        vapi.start as unknown as (...args: unknown[]) => Promise<unknown>
      )(...startArgs).catch((err: unknown) => {
        console.error("[vapi] start failed", err);
        setCallStatus("error");
        finish("dropped");
      });
    }, 80);

    return () => clearTimeout(handle);
  }, [publicKey, assistantId, assistantOverrides, finish]);

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
      finish("ended");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [callStatus, secondsLeft, finish]);

  const handleEnd = useCallback(() => {
    try {
      vapiRef.current?.stop();
    } catch {
      /* noop */
    }
    finish("ended");
  }, [finish]);

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

  const agentSpeaking = speaker === "assistant" || volume > 0.06;
  const userSpeaking = speaker === "user";

  const statusLabel =
    callStatus === "connecting"
      ? "Connecting…"
      : callStatus === "connected"
        ? userSpeaking
          ? "Listening to you…"
          : agentSpeaking
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

  const live = callStatus === "connected";

  const visualState: VoiceVisualState =
    callStatus === "error"
      ? "error"
      : callStatus === "connecting"
        ? "connecting"
        : callStatus === "connected"
          ? userSpeaking
            ? "user"
            : agentSpeaking
              ? "agent"
              : "listening"
          : "idle";

  return (
    <CallPanel>
      <VoiceGlow state={visualState} volume={volume} />
      <div className="flex flex-col items-center gap-4 text-center">
        <VoiceOrb state={visualState} volume={volume} />

        <div className="flex items-center justify-center gap-2 rounded-full border border-black/[0.07] bg-white px-3.5 py-1.5 text-[12.5px]">
          <span
            className={cn(
              "size-1.5 rounded-full bg-black",
              live ? "animate-pulse" : "opacity-40"
            )}
            aria-hidden
          />
          <span className="font-medium text-black">{statusLabel}</span>
          <span className="text-black/40">·</span>
          <span className="tabular-nums text-black/70">{timeLeftLabel}</span>
        </div>

        <Transcript transcript={transcript} />

        <div className="flex items-center justify-center gap-4 border-t border-black/10 pt-3.5">
          <button
            type="button"
            onClick={handleToggleMute}
            className={cn(
              "press inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors",
              isMuted ? "text-black" : "text-black/65 hover:text-black"
            )}
          >
            {isMuted ? (
              <MicrophoneSlashIcon size={13} weight="fill" />
            ) : (
              <MicrophoneIcon size={13} weight="fill" />
            )}
            {isMuted ? "Muted" : "Mute"}
          </button>

          <span className="size-1 rounded-full bg-black/30" aria-hidden />

          <button
            type="button"
            onClick={handleEnd}
            className="press inline-flex items-center gap-1.5 text-[12.5px] font-medium text-black/65 transition-colors hover:text-black"
          >
            <PhoneDisconnectIcon size={13} weight="fill" />
            End call
          </button>
        </div>
      </div>
    </CallPanel>
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
      <div className="mx-auto flex h-[150px] w-full max-w-[300px] items-center justify-center">
        <p className="text-center text-[12.5px] italic text-black/55">
          Say hi to get started. Max takes it from there.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mx-auto h-[150px] w-full max-w-[300px] overflow-y-auto px-1 py-1"
    >
      <ol className="space-y-2.5">
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
                  "flex max-w-[80%] flex-col gap-1",
                  isMax ? "items-start" : "items-end"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.08em] leading-none",
                    isMax ? "text-black" : "text-black/55"
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
                      ? "bg-black text-white"
                      : "bg-[#F1F2F4] text-black ring-1 ring-inset ring-black/[0.05]"
                  )}
                >
                  <CardContent className="px-3.5 py-2 text-left text-[13.5px] leading-[1.45]">
                    {toBrandText(m.text)}
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

