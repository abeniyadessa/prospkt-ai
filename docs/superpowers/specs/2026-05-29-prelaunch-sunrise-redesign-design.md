# Prelaunch "Sunrise Launch Module" Redesign

**Date:** 2026-05-29
**Status:** Approved (design)
**Scope:** `app/prelaunch/page.tsx` + `components/marketing/prelaunch-live-demo.tsx` (+ minor: `prelaunch-demo.tsx`, `prelaunch-email-form.tsx`)

## Goal

Rebuild the prelaunch page into a single, compact, premium "launch module" on a full-page
warm sunrise gradient, with a liquid-glass voice orb. Resolve the critique points: card too
tall / empty, awkward scroll, generic orb, demo lacks live utility, CTA feels detached, messy
footer, soft copy.

## Design Decisions

### Background — full-page sunrise gradient
The warm radial gradient from the reference `ai-prompt-box` demo, applied to the whole
viewport (footer included):

```css
background: radial-gradient(125% 125% at 50% 101%,
  rgba(245,87,2,1) 10.5%, rgba(245,120,2,1) 16%, rgba(245,140,2,1) 17.5%,
  rgba(245,170,100,1) 25%, rgba(238,174,202,1) 40%, rgba(202,179,214,1) 65%,
  rgba(148,201,233,1) 100%);
```

**This is a deliberate, marketing-only exception** to the `CLAUDE.md` "no gradients / no
glow / no dark" rules. The authenticated app + dashboard stay light editorial. Document the
exception inline where the gradient is defined so a future reader doesn't "fix" it.

### Color — monochrome UI, gradient is the only color
- All UI is **pure black (`#000`) or frosted-white** (`rgba(255,255,255,0.55–0.94)` + white hairline).
- **No green anywhere.** Remove the existing `#16823D` / `#16823D`-family accents, the green
  "Early access" chip border, the success-dot green, and the green headline accent.
- Headline line 1: black. Headline revolving line: **white** (with a faint
  `text-shadow: 0 1px 14px rgba(0,0,0,.12)` for legibility on the bright lower gradient).
- Subhead: near-black (`#1a1d22`).

### Logo — unchanged
Keep the existing `LogoMark` exactly: black rounded-square mark, white `LightningIcon` (fill).
Do not tint it to the gradient.

### Layout — one centered launch module
Single vertically-centered column, tight spacing, no oversized demo card. Order:

1. Brand row (logo + "Prospkt" + frosted "Early access" chip)
2. Headline (static black line + white revolving outcome line — keep existing rotator animation/copy)
3. Subhead — sharper, outcome-driven copy (see Copy)
4. Glass orb demo (idle: tap-to-call; live: visualizer + status + transcript + controls)
5. Live status pill (see Live Status)
6. Waitlist pill bar — attached directly beneath the demo
7. Proof chips (frosted white)
8. Footer (frosted, on gradient)

The demo no longer sits in a tall white card floating in empty space — the gradient fills the
hero intentionally. The orb sits directly on the gradient (frosted containers only for text
elements that need legibility).

### Orb — liquid glass
Replace the current cool-blue radial-gradient orb with a **liquid-glass orb** using the
refraction technique from the pasted `liquid-glass-button`:

- An SVG filter (`feTurbulence` fractalNoise → `feGaussianBlur` → `feDisplacementMap`) applied
  as `backdrop-filter` so the orb refracts/distorts the gradient behind it.
- Layered inset box-shadow "rim" for the glass edge + a soft specular highlight (top-left).
- **Idle:** tap-to-call button (preserve existing `onClick` → `startSession`), gentle breathing.
- **Live:** passive visualizer. The displacement `scale` and orb scale rise with Vapi
  `volume-level` (reuse existing `volume` state). Higher volume = more refraction/pulse.
- **Safari fallback:** Safari ignores SVG `backdrop-filter`. Detect or use `@supports`; fall
  back to a layered translucent radial gradient + `backdrop-filter: blur()` that still reads as
  glass. The orb must look glassy in all browsers, never broken/flat.
- Clear glass, no brand tint (refracts the gradient — chameleon).
- Preserve all existing accessibility: `aria-label` ("Start conversation with Max" idle;
  "Max is speaking"/"Listening" live), `prefers-reduced-motion` (no ripple/animation).

### Live status — honest states only
Frosted-white pill, black pulsing dot, driven by real call state (reuse existing logic):
`Connecting…` → `Listening…` → `Max is speaking…`, plus `m:ss left` countdown.

**Do not invent** "Qualifying lead" / "Booking intent detected" — we have no reliable signal
for those from the Vapi transcript stream today. If a future signal exists (e.g. booking
keyword detection), it can be added then. Keeping it honest now.

Error/dropped states keep current behavior (orb error state + "Call dropped — tap to pick it
back up" affordance), restyled to the frosted/monochrome system (replace the amber/red brand
hexes with monochrome + a single neutral-danger treatment that reads on the gradient).

### Waitlist — frosted pill bar, attached
Reuse `PrelaunchEmailForm`'s existing submit logic and states. Restyle the shell to a frosted
rounded-full pill bar: translucent-white background, white hairline, soft shadow; transparent
email input + black "Join waitlist" pill button. Sits directly under the demo with tight
spacing so it reads as the next step, not a detached block.

### Footer
Frosted, on the gradient. Keep both LinkedIn + X but tighten alignment (single right-aligned
cluster, consistent sizing). Copy stays minimal.

### Geometry / type borrowed from `ai-prompt-box`
Take only the *feel*, not the component: large border-radius (rounded-2xl/3xl on the module
and pill bars, rounded-full on the waitlist/CTA), tight tracking on the headline
(`-0.022em`), the input-bar pill form factor. **Do not install** the dark `ai-prompt-box` or
`liquid-glass-button` components — extract the gradient + the SVG glass filter only.

## Components Touched

| File | Change |
|---|---|
| `app/prelaunch/page.tsx` | Full-page gradient bg; monochrome restyle; white revolving line; frosted chips/footer; tighter centered layout; remove green |
| `components/marketing/prelaunch-live-demo.tsx` | `GlowOrb` → liquid-glass orb (SVG filter + Safari fallback); monochrome restyle of panels/status/transcript/controls; honest status labels; remove green/amber brand hexes |
| `components/marketing/prelaunch-demo.tsx` | Pass-through wrapper — adjust only if needed for new layout |
| `components/marketing/prelaunch-email-form.tsx` | Restyle to frosted pill bar (logic unchanged) |

## Copy

- Subhead: **"Hear how Prospkt turns a missed call into a booked job."** (current is close;
  keep or tighten — outcome-driven, not "ask how it fits").
- Orb idle label: "Tap to talk to Max" / support line outcome-driven, e.g.
  "Ask Max how Prospkt would recover the calls your shop is missing."
- Brand text fix preserved: `toBrandText` ("Prospect" → "Prospkt") stays for transcript display.

## Constraints / Non-Goals

- **No new npm dependencies.** `framer-motion` is NOT installed and is NOT needed — all
  animation is CSS + SVG. Do not add it.
- Phosphor icons only (no `lucide-react`), per `CLAUDE.md`.
- Do not touch the Vapi call lifecycle, the `/api/voice/vapi-config` route, or the email
  waitlist API — visual/layout layer only.
- Preserve `prefers-reduced-motion` handling and all `aria-label`s.
- The gradient + glow are a prelaunch-only exception; do not propagate to app/dashboard.

## Success Criteria

1. Prelaunch page renders as one compact module on the full-page sunrise gradient, no tall
   empty demo card, no mid-section scroll landing.
2. Orb is visibly glassy (refracts gradient) in Chrome AND has a non-broken glassy fallback in
   Safari; pulses with Max's voice when live.
3. Zero green on the page; all UI black/frosted-white; logo unchanged.
4. Revolving headline line is white; static line black.
5. Live status pill shows real Connecting/Listening/Speaking states + countdown.
6. Waitlist pill sits directly under the demo and submits exactly as today.
7. No new dependencies; no `lucide-react`; reduced-motion + a11y preserved.
