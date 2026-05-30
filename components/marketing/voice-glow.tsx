"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { VoiceVisualState } from "@/components/marketing/voice-orb";

/**
 * Atmospheric light rising from the bottom of the viewport. Mostly-white page;
 * this is the only color, anchored low and fading up into white well before the
 * fold. Four soft hue layers cross-fade by voice state (opacity only — no
 * gradient morphing), and the whole field breathes / swells with `volume`.
 *
 * Anchored below the bottom edge (50% 118%) so it reads as a glow rising up,
 * never a hard band. All motion is transform/opacity and respects
 * prefers-reduced-motion.
 */
const HUES = {
  blue: "120, 170, 225",
  pink: "238, 174, 202",
  warm: "245, 150, 70",
  green: "60, 178, 120",
} as const;

type Hue = keyof typeof HUES;

// Per-state target opacity for each hue. Idle is a calm warm/blue/pink dawn;
// each live state pushes one hue forward.
const LAYER_OPACITY: Record<Hue, Record<VoiceVisualState, number>> = {
  blue: {
    idle: 0.16,
    connecting: 0.18,
    listening: 0.46,
    agent: 0.12,
    user: 0.3,
    error: 0.05,
  },
  pink: {
    idle: 0.15,
    connecting: 0.12,
    listening: 0.14,
    agent: 0.3,
    user: 0.1,
    error: 0.04,
  },
  warm: {
    idle: 0.18,
    connecting: 0.14,
    listening: 0.06,
    agent: 0.46,
    user: 0.05,
    error: 0.05,
  },
  green: {
    idle: 0,
    connecting: 0,
    listening: 0.05,
    agent: 0,
    user: 0.46,
    error: 0,
  },
};

export function VoiceGlow({
  state,
  volume = 0,
}: {
  state: VoiceVisualState;
  volume?: number;
}) {
  const reduceMotion = useReducedMotion();
  const energy = Math.min(1, Math.max(0, volume));
  const live = state === "listening" || state === "agent" || state === "user";
  // Volume swells the active hue and lifts the whole field slightly.
  const gain = live ? 0.82 + energy * 0.4 : 1;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[clamp(320px,46vh,560px)] overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "50% 100%", willChange: "transform, opacity" }}
        animate={
          reduceMotion
            ? { scale: 1, opacity: 1 }
            : live
              ? { scaleY: 1 + energy * 0.07, opacity: 1 }
              : { scaleY: [1, 1.04, 1], opacity: [0.92, 1, 0.92] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : live
              ? { duration: 0.14, ease: "easeOut" }
              : { duration: 7.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {(Object.keys(HUES) as Hue[]).map((hue) => (
          <motion.div
            key={hue}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(125% 78% at 50% 118%, rgba(${HUES[hue]},1) 0%, rgba(${HUES[hue]},0.55) 26%, rgba(${HUES[hue]},0) 62%)`,
              mixBlendMode: "multiply",
            }}
            animate={{
              opacity: Math.min(0.6, LAYER_OPACITY[hue][state] * gain),
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    </div>
  );
}
