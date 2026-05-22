"use client";

import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { cn } from "@/lib/utils";

const MAX_DURATION_SECONDS = 60;

type FetchTokenState =
  | { status: "idle" }
  | { status: "fetching" }
  | { status: "ready"; token: string; configId?: string }
  | { status: "error"; message: string };

export function PrelaunchLiveDemo() {
  const [tokenState, setTokenState] = useState<FetchTokenState>({ status: "idle" });

  async function startSession() {
    setTokenState({ status: "fetching" });
    try {
      const res = await fetch("/api/voice/hume-token", { method: "POST" });
      const data = (await res.json()) as
        | { ok: true; accessToken: string; configId?: string }
        | { ok: false; error: string };
      if (!res.ok || !data.ok) {
        throw new Error(("error" in data && data.error) || "Failed to start session.");
      }
      setTokenState({
        status: "ready",
        token: data.accessToken,
        configId: data.configId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start the voice demo.";
      setTokenState({ status: "error", message });
    }
  }

  function reset() {
    setTokenState({ status: "idle" });
  }

  if (tokenState.status === "ready") {
    return (
      <VoiceProvider
        onOpen={() => console.log("[hume] socket opened")}
        onClose={(event) => console.log("[hume] socket closed", event)}
        onError={(err) => console.error("[hume] voice error", err)}
        onMessage={(msg) => console.log("[hume] message:", msg.type, msg)}
        onAudioStart={(clipId) => console.log("[hume] audio start", clipId)}
        onAudioEnd={(clipId) => console.log("[hume] audio end", clipId)}
      >
        <ActiveSession
          token={tokenState.token}
          configId={tokenState.configId}
          onEnd={reset}
        />
      </VoiceProvider>
    );
  }

  return (
    <IdleSurface
      tokenState={tokenState}
      onStart={startSession}
      onRetry={reset}
    />
  );
}

function IdleSurface({
  tokenState,
  onStart,
  onRetry,
}: {
  tokenState: FetchTokenState;
  onStart: () => void;
  onRetry: () => void;
}) {
  const fetching = tokenState.status === "fetching";
  const errored = tokenState.status === "error";

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-white">
        <MicrophoneIcon size={22} weight="fill" />
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-foreground">
          Talk to Prospkt yourself.
        </p>
        <p className="max-w-[380px] text-[13px] leading-5 text-muted-foreground">
          Have a real 60-second conversation. Tell it about a project you&apos;d
          want quoted and see how it qualifies and books.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={fetching}
        className={cn(
          "press inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-70"
        )}
      >
        <MicrophoneIcon size={14} weight="fill" />
        {fetching ? "Connecting…" : "Start conversation"}
      </button>

      <p className="text-[11px] text-subtle">
        Uses your microphone · Up to {MAX_DURATION_SECONDS} seconds · Not recorded
      </p>

      {errored ? (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-[#E5B6B1] bg-[#FFF5F3] px-3 py-2 text-[12px] text-[#9F2A22]">
          <WarningCircleIcon size={14} weight="fill" />
          <span>{tokenState.message}</span>
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

type TranscriptMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
};

function ActiveSession({
  token,
  configId,
  onEnd,
}: {
  token: string;
  configId?: string;
  onEnd: () => void;
}) {
  const voice = useVoice();
  const { status, messages, isMuted, fft } = voice;
  const [secondsLeft, setSecondsLeft] = useState(MAX_DURATION_SECONDS);

  // Hold all of Hume's hook-returned functions in a ref so effects never
  // re-fire when those references change between renders (which they do
  // every render — Hume returns fresh closures). This is the cure for the
  // "Maximum update depth exceeded" loop. Ref values get synced in an
  // effect (not during render) per React 19 rules.
  const voiceRef = useRef(voice);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    voiceRef.current = voice;
    onEndRef.current = onEnd;
  });

  const isConnected = status.value === "connected";
  const connectAttempted = useRef(false);

  // Auto-connect on mount. Depends only on `token` so we run it exactly once
  // per session — never re-runs because Hume's connect/disconnect references
  // changed.
  useEffect(() => {
    if (connectAttempted.current) return;
    connectAttempted.current = true;
    voiceRef.current
      .connect({
        auth: { type: "accessToken", value: token },
        ...(configId ? { configId } : {}),
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Could not connect.";
        console.error("[hume] connect failed", err);
        window.alert(message);
        onEndRef.current();
      });
  }, [token, configId]);

  // Countdown timer — depends only on whether we're connected and the
  // current seconds. No function refs in deps.
  useEffect(() => {
    if (!isConnected) return;
    if (secondsLeft <= 0) {
      voiceRef.current.disconnect();
      onEndRef.current();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isConnected, secondsLeft]);

  // Cleanup on unmount only. Empty deps — disconnect comes from ref.
  useEffect(() => {
    return () => {
      voiceRef.current.disconnect();
    };
  }, []);

  function handleEnd() {
    voice.disconnect();
    onEnd();
  }

  function handleToggleMute() {
    if (isMuted) {
      voice.unmute();
    } else {
      voice.mute();
    }
  }

  // Distill the messages stream into a clean transcript.
  const transcript: TranscriptMessage[] = [];
  for (const message of messages) {
    if (
      message.type === "user_message" ||
      message.type === "assistant_message"
    ) {
      const role: TranscriptMessage["role"] =
        message.type === "user_message" ? "user" : "agent";
      const text = message.message?.content?.toString() ?? "";
      if (text.trim().length > 0) {
        transcript.push({
          id: `${message.type}-${transcript.length}`,
          role,
          text,
        });
      }
    }
  }

  const isAgentSpeaking = status.value === "connected" && Boolean(fft?.length);
  const statusLabel =
    status.value === "connecting"
      ? "Connecting…"
      : status.value === "connected"
        ? isAgentSpeaking
          ? "Prospkt is speaking…"
          : "Listening…"
        : status.value === "error"
          ? "Connection error"
          : "Disconnected";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 text-left shadow-sm sm:p-6">
      {/* Header — status + countdown */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              status.value === "connected"
                ? "animate-pulse bg-[#2E7D4F]"
                : "bg-subtle"
            )}
            aria-hidden
          />
          <span className="text-[12.5px] font-medium text-foreground">
            {statusLabel}
          </span>
        </div>
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {Math.max(0, secondsLeft)}s left
        </span>
      </div>

      {/* Voice activity visualization */}
      <VoiceActivity fft={fft} active={status.value === "connected"} />

      {/* Transcript */}
      <div className="min-h-[120px] max-h-[200px] overflow-y-auto rounded-lg border border-hairline bg-background p-3">
        {transcript.length === 0 ? (
          <p className="text-[12.5px] text-subtle">
            Say hi to get started — Prospkt will pick up the missed-call thread.
          </p>
        ) : (
          <ul className="space-y-2">
            {transcript.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "flex flex-col gap-0.5",
                  m.role === "user" ? "items-end text-right" : "items-start"
                )}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-subtle">
                  {m.role === "user" ? "You" : "Prospkt"}
                </span>
                <span
                  className={cn(
                    "max-w-[88%] rounded-md px-2.5 py-1.5 text-[12.5px] leading-snug",
                    m.role === "user"
                      ? "bg-foreground text-white"
                      : "bg-[color:var(--elevated)] text-foreground"
                  )}
                >
                  {m.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMute}
          className={cn(
            "press inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors",
            isMuted
              ? "border-[#E5B6B1] bg-[#FFF5F3] text-[#9F2A22]"
              : "border-hairline bg-surface text-foreground hover:bg-elevated"
          )}
        >
          {isMuted ? (
            <MicrophoneSlashIcon size={13} weight="fill" />
          ) : (
            <MicrophoneIcon size={13} weight="fill" />
          )}
          {isMuted ? "Muted" : "Mute"}
        </button>

        <button
          type="button"
          onClick={handleEnd}
          className="press ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#9F2A22] px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[#8B221B]"
        >
          <PhoneDisconnectIcon size={13} weight="fill" />
          End call
        </button>
      </div>
    </div>
  );
}

function VoiceActivity({
  fft,
  active,
}: {
  fft: number[] | undefined;
  active: boolean;
}) {
  // Render a simple 24-bar visualizer from the FFT data. If there's no FFT
  // data (mic not yet active), show a flat baseline so the UI doesn't jump.
  const bars = 24;
  const heights: number[] = [];
  if (fft && fft.length > 0) {
    const step = Math.floor(fft.length / bars);
    for (let i = 0; i < bars; i++) {
      const slice = fft.slice(i * step, (i + 1) * step);
      const max = slice.length > 0 ? Math.max(...slice) : 0;
      heights.push(Math.min(1, max));
    }
  } else {
    for (let i = 0; i < bars; i++) heights.push(0.1);
  }

  return (
    <div className="flex h-12 items-center justify-center gap-[3px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-[height] duration-75",
            active ? "bg-foreground" : "bg-subtle/40"
          )}
          style={{ height: `${Math.max(8, h * 44)}px` }}
          aria-hidden
        />
      ))}
    </div>
  );
}
