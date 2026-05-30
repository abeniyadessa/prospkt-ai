"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The conversation's visual state, shared by the orb and the bottom glow.
 *   idle       — before/after a call (calm pastel, soft drift)
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

// A soft hue the orb leans toward per state — layered as a centred blob over the
// free-form pastel body so the orb keeps its identity and just changes mood.
const TINT: Record<VoiceVisualState, { rgb: string; opacity: number }> = {
  idle: { rgb: "210, 205, 235", opacity: 0 },
  connecting: { rgb: "200, 205, 230", opacity: 0.2 },
  listening: { rgb: "120, 165, 240", opacity: 0.5 },
  agent: { rgb: "248, 168, 110", opacity: 0.5 },
  user: { rgb: "80, 200, 130", opacity: 0.5 },
  error: { rgb: "186, 186, 190", opacity: 0.5 },
};

/**
 * Prospkt's voice signature: a free-form luminous orb. No hard edge — soft,
 * feathered pastel color masses that drift, rotate and gently squash/stretch,
 * always settling back toward a circle. It dissolves into the white page rather
 * than sitting in a clipped circle. All motion is transform/opacity only and
 * respects prefers-reduced-motion.
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
      ? "80, 200, 130"
      : state === "agent"
        ? "248, 168, 110"
        : "120, 165, 240";

  // A feathered radial blob (no hard rim) — the building block of the body.
  const blob = (rgb: string, alpha: number, blur: number): React.CSSProperties => ({
    background: `radial-gradient(circle, rgba(${rgb},${alpha}) 0%, rgba(${rgb},0) 64%)`,
    filter: `blur(${blur}px)`,
  });

  const content = (
    <>
      {/* Overall breathing + volume swell */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        animate={
          reduceMotion
            ? { scale: 1 }
            : live
              ? { scale: 1 + energy * 0.07 }
              : { scale: [1, 1.04, 1] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : live
              ? { duration: 0.12, ease: "easeOut" }
              : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Free-form wobble — squash/stretch that always returns to a circle */}
        <motion.div
          className="absolute inset-0"
          style={{ willChange: "transform" }}
          animate={
            reduceMotion
              ? {}
              : { scaleX: [1, 1.1, 0.91, 1], scaleY: [1, 0.91, 1.1, 1] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Soft circular body — keeps the silhouette clearly round */}
          <span
            className="absolute inset-[6%] rounded-full"
            style={blob("250, 244, 252", 0.6, 12)}
          />

          {/* Rotating cluster of color masses */}
          <motion.div
            className="absolute inset-0"
            style={{ willChange: "transform" }}
            animate={reduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-[12%] top-[14%] size-[62%] rounded-full" style={blob("236,116,182", 0.8, 14)} />
            <span className="absolute right-[8%] top-[30%] size-[60%] rounded-full" style={blob("132,146,238", 0.72, 15)} />
            <span className="absolute bottom-[10%] left-[24%] size-[60%] rounded-full" style={blob("248,166,104", 0.74, 14)} />
            <span className="absolute left-[30%] top-[34%] size-[56%] rounded-full" style={blob("196,150,228", 0.66, 16)} />
          </motion.div>

          {/* Counter-drifting bright light for depth */}
          <motion.span
            className="absolute left-1/2 top-1/2 size-[56%] rounded-full"
            style={{ marginLeft: "-28%", marginTop: "-28%", ...blob("255,255,255", 0.6, 10), willChange: "transform" }}
            animate={
              reduceMotion
                ? {}
                : { x: [0, 22, -16, 0], y: [0, -18, 16, 0], scale: [1, 1.22, 0.86, 1] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Dense luminous core — anchors the circle */}
          <span
            className="absolute left-1/2 top-1/2 size-[46%] rounded-full"
            style={{ marginLeft: "-23%", marginTop: "-23%", ...blob("255,246,250", 0.7, 12) }}
          />

          {/* State tint */}
          <motion.span
            className="absolute left-1/2 top-1/2 size-[78%] rounded-full"
            style={{ marginLeft: "-39%", marginTop: "-39%" }}
            animate={{
              opacity: tint.opacity * (live ? 0.85 + energy * 0.5 : 1),
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="absolute inset-0 rounded-full" style={blob(tint.rgb, 0.85, 16)} />
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Sonar rings — soft energy radiating outward while live (no hard boundary) */}
      {live && !reduceMotion
        ? [0, 0.9, 1.8].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 132,
                height: 132,
                marginLeft: -66,
                marginTop: -66,
                border: `1.5px solid rgba(${ringRgb},0.4)`,
              }}
              initial={{ scale: 0.7, opacity: 0.45 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay }}
            />
          ))
        : null}

      {/* "you're talking" status dot */}
      <motion.span
        aria-hidden
        className="absolute bottom-[28%] right-[30%] size-2.5 rounded-full"
        style={{ background: "#34C36B", boxShadow: "0 0 8px rgba(52,195,107,0.7)" }}
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
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Tap to talk to Max"
        className="group relative mx-auto flex size-48 cursor-pointer sm:size-56 items-center justify-center rounded-full transition-transform duration-200 [-webkit-tap-highlight-color:transparent] hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-4"
      >
        {/* Hover affordance — signals the orb is pressable */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[-10%] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(140,150,235,0.22) 0%, rgba(140,150,235,0) 60%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        >
          <span
            className="orb-ripple-1 absolute left-1/2 top-1/2 size-[72%] rounded-full"
            style={{ marginLeft: "-36%", marginTop: "-36%", border: "1.5px solid rgba(130,140,225,0.5)" }}
          />
        </span>
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
      className="relative mx-auto flex size-48 items-center sm:size-56 justify-center"
    >
      {content}
    </div>
  );
}
