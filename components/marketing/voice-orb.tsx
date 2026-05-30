"use client";

import { LightningIcon } from "@phosphor-icons/react";
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
  const showBolt = !live; // idle / connecting / error show the brand mark

  const tint = TINT[state];
  const ringRgb =
    state === "user"
      ? "120, 200, 150"
      : state === "agent"
        ? "248, 188, 148"
        : "150, 185, 235";

  const content = (
    <>
      {/* Soft contact shadow under the sphere */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[8%] left-1/2 h-5 w-[62%] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(120,118,150,0.34), rgba(120,118,150,0) 75%)",
          filter: "blur(6px)",
        }}
      />

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
            "0 24px 36px -14px rgba(132,128,165,0.5)",
            "0 6px 14px -6px rgba(132,128,165,0.32)",
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

        {/* embossed brand bolt (H) at rest */}
        <motion.span
          aria-hidden
          className="absolute inset-0 grid place-items-center"
          animate={{ opacity: showBolt ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <LightningIcon
            size={34}
            weight="fill"
            style={{
              color: "rgba(255,255,255,0.78)",
              filter: "drop-shadow(0 1px 0.5px rgba(120,110,150,0.45))",
            }}
          />
        </motion.span>

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
