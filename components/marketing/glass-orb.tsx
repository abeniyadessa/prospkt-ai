"use client";

import { motion, useReducedMotion } from "framer-motion";

type OrbState = "idle" | "connecting" | "connected" | "ended" | "error";

/**
 * Liquid-glass orb — Prospkt's voice signature on the prelaunch hero.
 *
 * Composition (back to front):
 *   1. Halo        — soft white radial glow, opacity reacts to voice volume
 *   2. Glass base  — translucent radial fill so the orb reads as glass even
 *                    where SVG backdrop-filter is unsupported (Safari)
 *   3. Refraction  — backdrop-filter: url(#prospkt-orb-glass) bends the
 *                    gradient behind the orb (Chrome/FF); no-op in Safari
 *   4. Rim         — layered inset shadows for the glass edge
 *   5. Specular    — bright top-left highlight
 *
 * Idle = tap-to-call button. Live = passive visualizer; scale + halo pulse
 * with `volume`. Respects prefers-reduced-motion.
 */
export function GlassOrb({
  state,
  volume = 0,
  onClick,
  disabled = false,
}: {
  state: OrbState;
  volume?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const energy = Math.min(1, Math.max(0, volume));
  const interactive = state === "idle" && !disabled;
  const live = state === "connected";

  const haloOpacity = live ? 0.55 + energy * 0.35 : state === "error" ? 0.25 : 0.45;
  const orbScale = reduceMotion ? 1 : live ? 1 + energy * 0.07 : 1;

  const content = (
    <>
      {/* SVG refraction filter — defined once, referenced by backdrop-filter */}
      <svg aria-hidden className="pointer-events-none absolute size-0">
        <defs>
          <filter
            id="prospkt-orb-glass"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.012"
              numOctaves="2"
              seed="4"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="bn" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="bn"
              scale="56"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      {/* 1. Halo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-40 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(22px)",
        }}
        animate={{ opacity: haloOpacity, scale: reduceMotion ? 1 : 1 + energy * 0.12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />

      {/* 2-5. The glass ball */}
      <motion.div
        aria-hidden
        className="relative size-32 rounded-full"
        animate={{ scale: orbScale }}
        transition={{ duration: 0.09, ease: "easeOut" }}
      >
        {/* glassy base (always visible) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 36% 30%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.32) 38%, rgba(255,255,255,0.08) 72%, rgba(255,255,255,0.02) 100%)",
          }}
        />
        {/* refraction (Chrome/FF; transparent no-op in Safari) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backdropFilter: "url(#prospkt-orb-glass) blur(1px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
        {/* rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "inset 3px 3px 0.5px -3px rgba(255,255,255,0.92), inset -3px -3px 0.5px -3px rgba(255,255,255,0.7), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(0,0,0,0.28), inset 0 0 8px 6px rgba(255,255,255,0.10), 0 10px 34px rgba(0,0,0,0.20), 0 0 14px rgba(255,255,255,0.22)",
          }}
        />
        {/* specular highlight */}
        <div
          className="absolute left-[20%] top-[14%] h-[34%] w-[42%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.97), rgba(255,255,255,0) 70%)",
            filter: "blur(2px)",
          }}
        />
      </motion.div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Start conversation with Max"
        className="group relative mx-auto flex size-40 items-center justify-center rounded-full transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role={live ? "img" : undefined}
      aria-label={
        live ? (energy > 0.05 ? "Max is speaking" : "Listening") : undefined
      }
      className="relative mx-auto flex size-40 items-center justify-center"
    >
      {content}
    </div>
  );
}
