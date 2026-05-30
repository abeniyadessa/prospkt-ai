"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The conversation's visual state, shared by the orb and the bottom glow.
 *   idle       — before/after a call (calm pastel, soft breathing)
 *   connecting — dialing Max
 *   listening  — connected, no one mid-sentence (leans cool)
 *   agent      — Max is speaking (leans warm)
 *   user       — the caller is speaking (green accent + status dot)
 *   error      — dropped/failed (desaturated)
 */
export type VoiceVisualState =
  | "idle"
  | "connecting"
  | "listening"
  | "agent"
  | "user"
  | "error";

// A soft hue the base pastel leans toward per state — never a full recolor, so
// the orb keeps its iridescent identity and just changes mood.
const TINT: Record<VoiceVisualState, { rgb: string; opacity: number }> = {
  idle: { rgb: "210, 205, 235", opacity: 0 },
  connecting: { rgb: "200, 205, 230", opacity: 0.18 },
  listening: { rgb: "150, 185, 235", opacity: 0.34 },
  agent: { rgb: "248, 188, 148", opacity: 0.36 },
  user: { rgb: "120, 200, 150", opacity: 0.34 },
  error: { rgb: "186, 186, 190", opacity: 0.4 },
};

/**
 * Prospkt's voice signature: a soft, matte, iridescent pastel sphere
 * (cool top → pink core → peach base) with a state tint, an embossed brand
 * bolt at rest, and sonar rings + a green "you're talking" dot when live.
 * All motion is transform/opacity only and respects prefers-reduced-motion.
 *
 * Idle = the tap-to-talk control. Live = a passive visualizer driven by `volume`.
 */
export function VoiceOrb({
  state,
  volume = 0,
  onClick,
  disabled = false,
}: {
  state: VoiceVisualState;
  volume?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const energy = Math.min(1, Math.max(0, volume));
  const interactive = (state === "idle" || state === "error") && !disabled;
  const live = state === "listening" || state === "agent" || state === "user";

  const tint = TINT[state];
  const ringRgb =
    state === "user"
      ? "120, 200, 150"
      : state === "agent"
        ? "248, 188, 148"
        : "150, 185, 235";

  const content = (
    <>
      {/* The sphere */}
      <motion.div
        aria-hidden
        className="relative size-36 overflow-hidden rounded-full"
        style={{
          // Soft matte pastel sphere (reference A): cool top, pink core, peach
          // base — gentle and iridescent, the clean default.
          background: [
            "radial-gradient(120% 120% at 50% 6%, rgba(196,210,242,0.95) 0%, rgba(196,210,242,0) 46%)",
            "radial-gradient(120% 115% at 50% 102%, rgba(248,205,164,0.97) 0%, rgba(248,205,164,0) 50%)",
            "radial-gradient(100% 100% at 50% 56%, rgba(243,194,214,0.9) 0%, rgba(243,194,214,0) 62%)",
            "linear-gradient(180deg, #e7ecf8 0%, #f3e8f0 52%, #fcefdf 100%)",
          ].join(","),
          boxShadow: [
            "inset 0 13px 22px rgba(255,255,255,0.58)",
            "inset 0 -20px 32px rgba(150,120,142,0.26)",
            "inset -10px -8px 22px rgba(120,112,152,0.2)",
            "inset 9px 6px 20px rgba(255,255,255,0.22)",
          ].join(","),
        }}
        animate={
          reduceMotion
            ? { scale: 1 }
            : live
              ? { scale: 1 + energy * 0.05 }
              : { scale: [1, 1.02, 1] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : live
              ? { duration: 0.14, ease: "easeOut" }
              : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Flowing interior — a slowly rotating cluster of saturated color blobs
            plus an independent drifting light, clipped to the sphere. The blobs
            are deeper than the base so the motion actually reads. Transform-only;
            off under reduced motion. */}
        {!reduceMotion ? (
          <>
            <motion.span
              aria-hidden
              className="absolute inset-[-24%]"
              style={{ willChange: "transform" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            >
              <span
                className="absolute left-[14%] top-[18%] size-[58%] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(236,116,182,0.78) 0%, rgba(236,116,182,0) 65%)",
                  filter: "blur(11px)",
                }}
              />
              <span
                className="absolute right-[10%] top-[36%] size-[54%] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(132,146,238,0.7) 0%, rgba(132,146,238,0) 67%)",
                  filter: "blur(12px)",
                }}
              />
              <span
                className="absolute bottom-[12%] left-[28%] size-[52%] rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(248,166,104,0.74) 0%, rgba(248,166,104,0) 65%)",
                  filter: "blur(11px)",
                }}
              />
            </motion.span>
            <motion.span
              aria-hidden
              className="absolute left-1/2 top-1/2 size-[58%] rounded-full"
              style={{
                marginLeft: "-29%",
                marginTop: "-29%",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
                filter: "blur(9px)",
                willChange: "transform",
              }}
              animate={{ x: [0, 18, -13, 0], y: [0, -15, 13, 0], scale: [1, 1.2, 0.88, 1] }}
              transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : null}

        {/* state tint — keeps the pastel, just leans it */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 60%, rgba(${tint.rgb},0.95) 0%, rgba(${tint.rgb},0) 68%)`,
            mixBlendMode: "soft-light",
          }}
          animate={{ opacity: tint.opacity * (live ? 0.85 + energy * 0.45 : 1) }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />

        {/* soft specular highlight (matte, not glossy) */}
        <span
          aria-hidden
          className="absolute left-[22%] top-[14%] h-[30%] w-[44%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 32%, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)",
            filter: "blur(5px)",
          }}
        />

        {/* sonar rings (G) — clipped to the sphere, only while live */}
        {live && !reduceMotion
          ? [0, 0.9, 1.8].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: 44,
                  height: 44,
                  marginLeft: -22,
                  marginTop: -22,
                  border: `1.5px solid rgba(${ringRgb},0.55)`,
                }}
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 3.4, opacity: 0 }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay,
                }}
              />
            ))
          : null}

        {/* "you're talking" status dot (F) */}
        <motion.span
          aria-hidden
          className="absolute bottom-[24%] right-[26%] size-2.5 rounded-full"
          style={{
            background: "#34C36B",
            boxShadow: "0 0 8px rgba(52,195,107,0.7)",
          }}
          animate={{
            opacity: state === "user" ? 1 : 0,
            scale: state === "user" && !reduceMotion ? [1, 1.25, 1] : 1,
          }}
          transition={
            state === "user" && !reduceMotion
              ? { opacity: { duration: 0.2 }, scale: { duration: 1.1, repeat: Infinity, ease: "easeInOut" } }
              : { duration: 0.2 }
          }
        />
      </motion.div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Tap to talk to Max"
        className="group relative mx-auto flex size-44 items-center justify-center rounded-full transition-transform duration-200 [-webkit-tap-highlight-color:transparent] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="img"
      aria-label={
        state === "agent"
          ? "Max is speaking"
          : state === "user"
            ? "Listening to you"
            : state === "listening"
              ? "Listening"
              : "Connecting"
      }
      className="relative mx-auto flex size-44 items-center justify-center"
    >
      {content}
    </div>
  );
}
