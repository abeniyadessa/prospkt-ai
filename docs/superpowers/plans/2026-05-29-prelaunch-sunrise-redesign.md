# Prelaunch Sunrise Launch-Module Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/prelaunch` into one compact launch module on a full-page warm sunrise gradient with a liquid-glass voice orb, strictly black/frosted-white UI (no green), per `docs/superpowers/specs/2026-05-29-prelaunch-sunrise-redesign-design.md`.

**Architecture:** A new `GlassOrb` component isolates the liquid-glass refraction (SVG `feTurbulence`+`feDisplacementMap` backdrop-filter over a self-contained glassy base, so Safari — which ignores SVG backdrop-filters — still renders glass). `framer-motion` drives the volume-reactive pulse and status crossfades. `prelaunch-live-demo.tsx` swaps `GlowOrb`→`GlassOrb` and restyles its panels to the monochrome/frosted system. `page.tsx` gets the full-page gradient + monochrome layout. `prelaunch-email-form.tsx` becomes a frosted pill bar. No call-lifecycle or API changes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, `framer-motion@^12.40.0`, `@phosphor-icons/react`, `@vapi-ai/web`.

**Verification model:** No unit-test runner exists. Each task verifies with `npm run lint`, `npx tsc --noEmit`, and a manual browser check at `http://localhost:3000/prelaunch`. Commit after each task.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `components/marketing/glass-orb.tsx` | Liquid-glass orb: SVG filter, glassy base, rim, specular, volume pulse, idle button, a11y, reduced-motion | Create |
| `components/marketing/prelaunch-live-demo.tsx` | Call lifecycle (unchanged) + monochrome/frosted panels + honest status labels; uses `GlassOrb` | Modify |
| `components/marketing/prelaunch-email-form.tsx` | Waitlist logic (unchanged) restyled to frosted pill bar; monochrome success | Modify |
| `app/prelaunch/page.tsx` | Full-page gradient, centered monochrome launch module, white revolving headline line, frosted chips/footer | Modify |

---

## Task 1: Create the `GlassOrb` component

**Files:**
- Create: `components/marketing/glass-orb.tsx`

The orb refracts the gradient where SVG backdrop-filter is supported, and always renders a glassy base + rim so it never looks flat (Safari fallback is automatic — the refraction layer simply renders transparent there). Volume drives a framer-motion scale/halo pulse; the SVG displacement scale stays fixed for performance (animating the filter per volume frame janks).

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors referencing `glass-orb.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/marketing/glass-orb.tsx
git commit -m "Add liquid-glass orb component for prelaunch"
```

---

## Task 2: Swap `GlowOrb`→`GlassOrb` and monochrome the live-demo panels

**Files:**
- Modify: `components/marketing/prelaunch-live-demo.tsx`

Keep ALL call lifecycle code (Vapi handlers, timers, `finish`, mute/end) untouched. Only change: the import, the orb usage, panel/status/transcript/control styling, honest status copy, and delete the old `GlowOrb` function.

- [ ] **Step 1: Add the import**

At the top with the other imports, add:

```tsx
import { GlassOrb } from "@/components/marketing/glass-orb";
```

- [ ] **Step 2: Replace `CallPanel` (remove white card → transparent, frosted only where needed)**

Find the `CallPanel` function and replace its body with:

```tsx
function CallPanel({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[420px]">{children}</div>;
}
```

- [ ] **Step 3: Replace `IdleSurface` contents (frosted/monochrome, GlassOrb, sharper copy)**

Replace the `return (...)` block inside `IdleSurface` with:

```tsx
  return (
    <CallPanel>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-black/70">
          Live demo
        </span>

        <GlassOrb
          state={fetching ? "connecting" : "idle"}
          onClick={onStart}
          disabled={fetching}
        />

        <div className="space-y-1">
          <p className="text-[15px] font-semibold tracking-tight text-black">
            {fetching ? "Connecting…" : "Tap to talk to Max"}
          </p>
          <p className="mx-auto max-w-[320px] text-[12.5px] leading-[1.5] text-black/70">
            Ask Max how Prospkt would recover the calls your shop is missing.
          </p>
        </div>

        {dropped && !fetching ? (
          <p className="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-[11.5px] font-medium text-black/80">
            Call dropped — tap the orb to pick it back up.
          </p>
        ) : null}

        {errored ? (
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-[12px] text-black">
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
          <p className="text-[10.5px] text-black/55">
            Uses your mic · Up to {MAX_DURATION_SECONDS} sec · Not recorded
          </p>
        )}
      </div>
    </CallPanel>
  );
```

- [ ] **Step 4: Replace the `ActiveSession` `return` block (GlassOrb + frosted status + monochrome controls)**

Replace the `return (...)` block inside `ActiveSession` with:

```tsx
  return (
    <CallPanel>
      <div className="flex flex-col items-center gap-4 text-center">
        <GlassOrb
          state={
            callStatus === "error"
              ? "error"
              : callStatus === "connected"
                ? "connected"
                : callStatus === "connecting"
                  ? "connecting"
                  : "idle"
          }
          volume={volume}
        />

        <div className="flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-[12.5px]">
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

        <div className="flex items-center justify-center gap-4 border-t border-white/60 pt-3.5">
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
```

- [ ] **Step 5: Honest status labels — replace the `statusLabel` definition**

Find the `const statusLabel =` block and replace with (drops nothing real; just confirms the honest set):

```tsx
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
```

- [ ] **Step 6: Monochrome the `Transcript` bubbles**

In `Transcript`, replace the empty-state `<p>` className and the `Card` block. Empty state:

```tsx
        <p className="text-center text-[12.5px] italic text-black/55">
          Say hi to get started. Max takes it from there.
        </p>
```

Card (the `<Card size="sm" ...>` element) — replace its `className` with:

```tsx
                  className={cn(
                    "gap-0 rounded-2xl border-0 py-0 ring-0",
                    isMax
                      ? "bg-black text-white"
                      : "bg-white/75 text-black ring-1 ring-inset ring-white/80"
                  )}
```

And the role label spans: replace `text-foreground`/`text-subtle` with `text-black`/`text-black/55` respectively.

- [ ] **Step 7: Delete the old `GlowOrb` function**

Delete the entire `GlowOrb` function (the JSDoc block + `function GlowOrb(...) { ... }`, ~lines 489–622). `GlassOrb` fully replaces it.

- [ ] **Step 8: Lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors; no remaining references to `GlowOrb`.

Run: `grep -n "GlowOrb" components/marketing/prelaunch-live-demo.tsx`
Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add components/marketing/prelaunch-live-demo.tsx
git commit -m "Swap GlowOrb for liquid-glass orb; monochrome demo panels"
```

---

## Task 3: Restyle the waitlist into a frosted pill bar

**Files:**
- Modify: `components/marketing/prelaunch-email-form.tsx`

Keep all logic/state/handlers. Restyle the form shell and the success card to frosted/monochrome. Remove the green hexes (`#2E7D4F`, `#E8F3EC`) and red brand hexes — use black/white/neutral.

- [ ] **Step 1: Replace the form shell (the non-success `return`)**

Replace the `<div className={cn("group relative grid ...")}>` wrapper className with:

```tsx
        className={cn(
          "group relative grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-full border bg-white/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur",
          state === "error" ? "border-black/40" : "border-white focus-within:border-black/50"
        )}
```

- [ ] **Step 2: Restyle the `Input`**

Replace the `Input` className with:

```tsx
          className="h-11 rounded-full border-transparent bg-transparent px-4 text-[14.5px] text-black placeholder:text-black/45 focus-visible:border-transparent"
```

- [ ] **Step 3: Restyle the submit `Button`**

Replace the `Button` className with:

```tsx
          className="h-11 rounded-full bg-black px-4 text-[13px] text-white hover:bg-black/85 sm:px-5"
```

- [ ] **Step 4: Monochrome the helper message colors**

In the helper `<p id="prelaunch-form-message">`, replace the conditional color classes:

```tsx
          state === "error"
            ? "text-black"
            : success
              ? "text-black"
              : "text-black/70"
```

- [ ] **Step 5: Monochrome the success card**

In the `if (success)` block: replace the outer card className `border-border bg-surface ... shadow-lg` with `border-white bg-white/85 ... shadow-[0_8px_30px_rgba(0,0,0,0.14)] backdrop-blur`; replace the check-circle inline `style={{ backgroundColor: "#E8F3EC", color: "#2E7D4F" }}` with `style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#000" }}`; and change the `<a>` link `Follow the build.` color from `text-[#2E7D4F]`/green to inherit black (already uses underline — ensure no green class remains). Replace the success status text color `text-[#2E7D4F]` with `text-black` and error `text-[#C2352C]` with `text-black`.

- [ ] **Step 6: Lint + typecheck + grep for stray brand hexes**

Run: `npm run lint && npx tsc --noEmit`
Run: `grep -nE "#2E7D4F|#E8F3EC|#16823D|#C2352C" components/marketing/prelaunch-email-form.tsx`
Expected: no output from grep.

- [ ] **Step 7: Commit**

```bash
git add components/marketing/prelaunch-email-form.tsx
git commit -m "Restyle prelaunch waitlist as frosted pill bar (monochrome)"
```

---

## Task 4: Full-page gradient + monochrome launch-module layout

**Files:**
- Modify: `app/prelaunch/page.tsx`

- [ ] **Step 1: Apply the full-page gradient and tighten the layout**

Replace the `<main>` opening tag and its inner wrapper. Change `<main className="min-h-dvh overflow-x-hidden bg-canvas text-foreground">` to:

```tsx
    <main
      className="min-h-dvh overflow-x-hidden text-black"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 101%, rgba(245,87,2,1) 10.5%, rgba(245,120,2,1) 16%, rgba(245,140,2,1) 17.5%, rgba(245,170,100,1) 25%, rgba(238,174,202,1) 40%, rgba(202,179,214,1) 65%, rgba(148,201,233,1) 100%)",
      }}
    >
```

> NOTE: This gradient is a deliberate prelaunch-only exception to the `CLAUDE.md` "no gradients" rule. Do not propagate to the app/dashboard.

Change the centered section to vertically center the compact module: replace the `<section>` className with:

```tsx
        <section className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center py-12 text-center">
```

- [ ] **Step 2: Recolor the headline (static black, revolving white)**

In `AnimatedOutcome`, change the rotator wrapper color from `text-[#16823D]` to `text-white` and add a legibility shadow. Replace the `<span aria-hidden ... className="prelaunch-outcome-rotator ...">` className with:

```tsx
        className="prelaunch-outcome-rotator mx-auto block h-[1.32em] overflow-hidden text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.12)]"
```

The static `<h1>` already uses `text-foreground`; change it to `text-black`.

- [ ] **Step 3: Recolor subhead + frosted proof chips**

Subhead `<p>`: change `text-muted-foreground` to `text-black/75`.

Proof chips: replace the chip `<span>` className with frosted-white + drop the green dot:

```tsx
              className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-black/80"
```

and remove the inner `<span className="size-1.5 rounded-full bg-success" />` dot line entirely (no colored dot in monochrome).

- [ ] **Step 4: Frosted brand chip ("Early access") — drop the green**

In `Brand`, replace the `Early access` chip className with:

```tsx
      <span className="ml-2 rounded-full border border-white/75 bg-white/60 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.04em] text-black">
        Early access
      </span>
```

The `<span>Prospkt</span>` and `LogoMark` stay unchanged (logo = black mark, white bolt).

- [ ] **Step 5: Frosted footer (keep both socials, tightened)**

Replace the `Footer` `<footer>` className `border-t border-hairline` with `border-t border-white/50`, and the copy `<p>` color `text-muted-foreground` with `text-black/70`. Replace each social `<a>` color `text-muted-foreground ... hover:text-foreground` with `text-black/70 hover:text-black`. Keep both LinkedIn + X; ensure the icon cluster is `flex items-center gap-1` right-aligned (already is).

- [ ] **Step 6: Lint + typecheck + grep for stray tokens**

Run: `npm run lint && npx tsc --noEmit`
Run: `grep -nE "#16823D|bg-success|bg-canvas|text-muted-foreground|text-foreground" app/prelaunch/page.tsx`
Expected: no output (all replaced with black/frosted equivalents).

- [ ] **Step 7: Commit**

```bash
git add app/prelaunch/page.tsx
git commit -m "Prelaunch: full-page sunrise gradient, monochrome launch module"
```

---

## Task 5: End-to-end visual verification

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (background) and open `http://localhost:3000/prelaunch`.

- [ ] **Step 2: Visual checklist (against spec Success Criteria)**

Confirm, in Chrome:
- One compact centered module on the full-page sunrise gradient; no tall empty card; no mid-section scroll landing.
- Orb is visibly glassy and refracts the gradient.
- Tapping the orb starts a call; while Max talks the orb pulses; status pill shows Connecting → Listening → "Max is speaking…" + countdown.
- Zero green anywhere; logo unchanged (black mark, white bolt); revolving headline line is white, static line black.
- Waitlist pill sits directly under the demo and submits (success state renders monochrome).

- [ ] **Step 3: Safari fallback check**

Open the same URL in Safari. Confirm the orb still looks glassy (base + rim + specular), not flat or broken, even though refraction is absent.

- [ ] **Step 4: Reduced-motion check**

Enable "Reduce Motion" (macOS System Settings → Accessibility → Display) and reload. Confirm the orb does not pulse/scale and the headline rotator is static (single phrase).

- [ ] **Step 5: Production build**

Run: `npm run build`
Expected: build succeeds with no type/lint errors.

- [ ] **Step 6: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "Prelaunch redesign: verification tweaks"
```

---

## Self-Review

**Spec coverage:**
- Full-page gradient → Task 4 Step 1 ✓
- Monochrome / no green → Tasks 2,3,4 (+ grep guards) ✓
- Logo unchanged → Task 4 Step 4 (explicit) ✓
- White revolving headline → Task 4 Step 2 ✓
- Liquid-glass orb + Safari fallback + volume pulse + a11y + reduced-motion → Task 1, verified Task 5 Steps 3–4 ✓
- Honest live status → Task 2 Step 5 ✓
- Frosted waitlist pill attached under demo → Task 3 + page layout Task 4 ✓
- Footer both socials tightened → Task 4 Step 5 ✓
- framer-motion for animation → Task 1 (motion + useReducedMotion) ✓
- No lucide-react → only `@phosphor-icons/react` + `framer-motion` imported ✓
- No call-lifecycle/API changes → Tasks 2–4 touch styling/import/labels only ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code.

**Type consistency:** `GlassOrb` props (`state: OrbState`, `volume`, `onClick`, `disabled`) match the call sites in Task 2 Steps 3–4. `OrbState` union matches the values passed (`idle|connecting|connected|error`). `statusLabel`/`timeLeftLabel`/`live`/`volume` referenced in Task 2 already exist in the unchanged `ActiveSession` body.
