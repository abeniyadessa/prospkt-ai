"use client";

import { useEffect, useRef, useState } from "react";
import {
  LightningIcon,
  PauseIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Cache-buster — bump this whenever we regenerate the audio so the browser
// doesn't keep serving an old cached MP3.
const demoAudioSrc = "/prelaunch-voice-demo/agent-demo.mp3?v=hume-persona-1";
const demoDurationSeconds = 35.14;

const demoScript = [
  {
    speaker: "Prospkt",
    start: 0,
    end: 7.66,
    text: "Hey Angela! Sarah from Greenway here — caught your missed call a sec ago. Did I catch you at a bad time?",
  },
  {
    speaker: "Angela",
    start: 8.14,
    end: 12.89,
    text: "Oh, no, you're good. Yeah, we're looking at getting our deck replaced.",
  },
  {
    speaker: "Prospkt",
    start: 13.36,
    end: 22.25,
    text: "Gotcha — that's exactly what we do. Got two spots open this week: Thursday 9 to 11, or Friday after 2. Which works better?",
  },
  {
    speaker: "Angela",
    start: 22.72,
    end: 24.69,
    text: "Thursday morning. Definitely.",
  },
  {
    speaker: "Prospkt",
    start: 25.16,
    end: 35.14,
    text: "Perfect. I'll hold that Thursday slot for you — sending it over for owner approval right now. You'll have a confirmation in a few minutes.",
  },
] as const;

const transcriptCards = [
  {
    speaker: "Prospkt",
    time: "00:00",
    text: "AI rep calls back while the lead is still warm.",
  },
  {
    speaker: "Booked",
    time: "00:25",
    text: "A job window is held, then sent for owner approval.",
  },
] as const;

const waveformBars = [
  10, 14, 20, 16, 28, 38, 24, 44, 18, 34, 48, 26, 58, 42, 30, 52, 36, 22, 46,
  62, 34, 18, 40, 54, 28, 50, 36, 24, 44, 32, 16, 26,
] as const;

export function PrelaunchVoiceDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      audio?.pause();
    };
  }, []);

  const currentLine = activeIndex === null ? null : demoScript[activeIndex];

  function startDemo() {
    const audio = audioRef.current;

    if (!audio) {
      setError("Audio preview is still loading. Try again in a second.");
      return;
    }

    if (audio.ended || audio.currentTime >= demoDurationSeconds - 0.2) {
      audio.currentTime = 0;
    }

    setError("");
    setCurrentTime(audio.currentTime);
    setActiveIndex(getActiveScriptIndex(audio.currentTime) ?? 0);
    void audio.play().catch(() => {
      setIsPlaying(false);
      setActiveIndex(null);
      setError(
        "Audio preview could not start. Check browser sound permissions and try again."
      );
    });
  }

  function stopDemo() {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setCurrentTime(0);
    setIsPlaying(false);
    setActiveIndex(null);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextTime = audio.currentTime;
    setCurrentTime(nextTime);
    setActiveIndex(getActiveScriptIndex(nextTime));
  }

  function handleEnded() {
    setCurrentTime(demoDurationSeconds);
    setIsPlaying(false);
    setActiveIndex(null);
  }

  function handleAudioError() {
    setIsPlaying(false);
    setActiveIndex(null);
    setError("Audio preview stopped. Tap play to try again.");
  }

  return (
    <div className="prelaunch-voice-demo mx-auto mt-9 w-full max-w-[720px] rounded-2xl border border-border bg-surface p-4 text-left shadow-lg sm:p-6">
      <audio
        ref={audioRef}
        src={demoAudioSrc}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:contents">
          <VoiceEndpoint
            label="AI rep"
            name="Prospkt"
            time={formatTimestamp(Math.floor(currentTime))}
            withLogo
            className="sm:col-start-1 sm:row-start-1"
          />
          <VoiceEndpoint
            label="Demo call"
            name="Angela"
            time={formatTimestamp(demoDurationSeconds)}
            align="right"
            className="sm:col-start-3 sm:row-start-1"
          />
        </div>

        <div className="prelaunch-audio-strip flex min-w-0 items-center gap-2.5 rounded-2xl border border-hairline bg-canvas px-3 py-3 sm:col-start-2 sm:row-start-1 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-1 sm:py-0">
          <Waveform active={isPlaying} />
          <button
            type="button"
            aria-label={isPlaying ? "Stop voice demo" : "Play voice demo"}
            aria-pressed={isPlaying}
            onClick={isPlaying ? stopDemo : startDemo}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-[0.98] sm:size-12"
          >
            {isPlaying ? (
              <PauseIcon size={17} weight="fill" aria-hidden />
            ) : (
              <PlayIcon size={17} weight="fill" className="ml-0.5" aria-hidden />
            )}
          </button>
          <Waveform active={isPlaying} reverse />
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-canvas p-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full bg-success",
                isPlaying && "animate-pulse"
              )}
              aria-hidden
            />
            {isPlaying ? currentLine?.speaker : "Voice preview"}
          </span>
          <span className="text-[11px] tabular-nums text-subtle">
            {isPlaying
              ? formatTimestamp(Math.floor(currentTime))
              : formatTimestamp(demoDurationSeconds)}
          </span>
        </div>
        <p className="mt-2 min-h-10 text-pretty text-[12.5px] leading-5 text-foreground">
          {currentLine?.text ??
            "Tap play to hear Prospkt qualify a missed lead and hold a booking window."}
        </p>
        {error ? (
          <p className="mt-2 text-[12px] leading-5 text-[#C2352C]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 min-[520px]:grid-cols-2">
        {transcriptCards.map((line, index) => (
          <TranscriptCard
            key={`${line.speaker}-${line.time}`}
            active={
              isPlaying &&
              (index === 0
                ? currentLine?.speaker === "Prospkt"
                : activeIndex === demoScript.length - 1)
            }
            {...line}
          />
        ))}
      </div>

      <style>{`
        .prelaunch-waveform-active rect {
          animation: prelaunchWaveformPulse 760ms ease-in-out infinite alternate;
          transform-box: fill-box;
          transform-origin: center;
        }

        @keyframes prelaunchWaveformPulse {
          from {
            opacity: 0.5;
            transform: scaleY(0.72);
          }

          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .prelaunch-waveform-active rect {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

function VoiceEndpoint({
  label,
  name,
  time,
  align = "left",
  withLogo = false,
  className,
}: {
  label: string;
  name: string;
  time: string;
  align?: "left" | "right";
  withLogo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        align === "right" && "justify-end text-right",
        className
      )}
    >
      {withLogo ? <LogoMark className="size-9 shrink-0 rounded-xl" /> : null}
      <div className="min-w-0">
        <p className="truncate text-[12px] text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-semibold">{name}</p>
        <p className="mt-0.5 text-[11px] tabular-nums text-subtle">{time}</p>
      </div>
    </div>
  );
}

function LogoMark({
  className,
  iconColor = "#FFFFFF",
}: {
  className?: string;
  iconColor?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-foreground text-white shadow-sm",
        className
      )}
      aria-hidden
    >
      <LightningIcon size="46%" weight="fill" color={iconColor} />
    </span>
  );
}

function Waveform({
  active = false,
  reverse = false,
}: {
  active?: boolean;
  reverse?: boolean;
}) {
  const bars = reverse ? [...waveformBars].reverse() : waveformBars;
  const barWidth = 3;
  const gap = 5;
  const viewBoxWidth = bars.length * barWidth + (bars.length - 1) * gap;

  return (
    <div className="prelaunch-waveform min-w-0 flex-1">
      <svg
        className={cn("h-9 w-full sm:h-10", active && "prelaunch-waveform-active")}
        viewBox={`0 0 ${viewBoxWidth} 72`}
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
        aria-hidden
      >
        <line
          x1="0"
          x2={viewBoxWidth}
          y1="36"
          y2="36"
          stroke="#E6E6E6"
          strokeWidth="1"
        />
        {bars.map((height, index) => (
          <rect
            key={`${height}-${index}`}
            x={index * (barWidth + gap)}
            y={(72 - height) / 2}
            width={barWidth}
            height={height}
            rx="2"
            fill={active ? "#16823D" : "#C7C7C7"}
            style={{ animationDelay: active ? `${index * 18}ms` : undefined }}
          />
        ))}
      </svg>
    </div>
  );
}

function TranscriptCard({
  speaker,
  time,
  text,
  active = false,
}: (typeof transcriptCards)[number] & { active?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-transparent bg-canvas p-4 transition-colors duration-150 ease-out",
        active && "border-[#BFE8CA] bg-[#F6FCF7]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium text-muted-foreground">
          {speaker}
        </p>
        <p className="text-[11px] tabular-nums text-subtle">{time}</p>
      </div>
      <p className="mt-2 text-pretty text-[12px] leading-5 text-foreground">
        {text}
      </p>
    </div>
  );
}

function getActiveScriptIndex(currentTime: number) {
  const activeIndex = demoScript.findIndex(
    (line) => currentTime >= line.start && currentTime < line.end
  );

  return activeIndex === -1 ? null : activeIndex;
}

function formatTimestamp(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}
