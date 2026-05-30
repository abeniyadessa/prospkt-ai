"use client";

import { MicrophoneIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * The conversation's visual state, shared by the orb and the bottom glow.
 *   idle       — before/after a call (neutral, soft breathing)
 *   connecting — dialing Max
 *   listening  — connected, no one mid-sentence (cool blue)
 *   agent      — Max is speaking (warm)
 *   user       — the caller is speaking (green)
 *   error      — dropped/failed (faded neutral)
 */
export type VoiceVisualState =
  | "idle"
  | "connecting"
  | "listening"
  | "agent"
  | "user"
  | "error";

// Each state tints the orb's aura — never the core. The core stays matte black
// (brand: sharp, operator-focused) so the orb reads as one object that changes
// mood, not a different object per state.
const AURA: Record<VoiceVisualState, string> = {
  idle: "120, 140, 170",
  connecting: "120, 140, 170",
  listening: "56, 132, 224",
  agent: "245, 140, 43",
  user: "46, 168, 110",
  error: "150, 150, 150",
};

const HALO_BASE: Record<VoiceVisualState, number> = {
  idle: 0.4,
  connecting: 0.45,
  listening: 0.6,
  agent: 0.68,
  user: 0.66,
  error: 0.22,
};

/**
 * Prospkt's voice signature. Matte black core (the "presence") wrapped in a
 * state-colored halo and, when live, expanding sonar rings. All motion is
 * transform/opacity only and respects prefers-reduced-motion.
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
  const showMic = state === "idle" || state === "error";

  const aura = AURA[state];
  const haloOpacity = HALO_BASE[state] * (live ? 0.78 + energy * 0.5 : 1);

  const content = (
    <>
      {/* Halo — soft colored light behind the core */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-44 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(${aura},0.85) 0%, rgba(${aura},0) 68%)`,
          filter: "blur(20px)",
        }}
        animate={{
          opacity: Math.min(1, haloOpacity),
          scale: reduceMotion ? 1 : live ? 1 + energy * 0.14 : 1,
        }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      />

      {/* Sonar rings — only while live, never under reduced motion */}
      {live && !reduceMotion
        ? [0, 0.8, 1.6].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                width: 116,
                height: 116,
                border: `1.5px solid rgba(${aura},0.5)`,
              }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.95, opacity: 0 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeOut",
                delay,
              }}
            />
          ))
        : null}

      {/* Core — matte black presence */}
      <motion.div
        aria-hidden
        className="relative grid size-28 place-items-center rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 30%, #303338 0%, #16181c 46%, #090a0c 100%)",
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.14), inset 0 -8px 18px rgba(0,0,0,0.55), 0 10px 30px rgba(10,12,16,0.32), 0 0 0 1px rgba(${aura},0.22), 0 0 26px rgba(${aura},${live ? 0.35 + energy * 0.3 : 0.16})`,
        }}
        animate={
          reduceMotion
            ? { scale: 1 }
            : live
              ? { scale: 1 + energy * 0.06 }
              : { scale: [1, 1.03, 1] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : live
              ? { duration: 0.12, ease: "easeOut" }
              : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* top specular sheen — subtle, matte not glossy */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-[24%] top-[16%] h-[26%] w-[40%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0) 72%)",
            filter: "blur(3px)",
          }}
        />
        <motion.span
          aria-hidden
          animate={{ opacity: showMic ? 0.92 : 0 }}
          transition={{ duration: 0.25 }}
          className="relative text-white"
        >
          <MicrophoneIcon size={26} weight="fill" />
        </motion.span>
      </motion.div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Tap to talk to Max"
        className="group relative mx-auto flex size-44 items-center justify-center rounded-full transition-transform duration-200 [-webkit-tap-highlight-color:transparent] hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2"
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
