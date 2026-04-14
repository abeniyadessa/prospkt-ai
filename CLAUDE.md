# Prospkt — AI Sales Rep by YALID LLC

## Project Overview
Prospkt is an autonomous AI sales rep dashboard. It finds local businesses with weak websites, calls them using AI voice, and books discovery calls automatically.

## Tech Stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Rules
- Always use shadcn/ui components — never raw HTML divs for layout
- Dark mode is default — always
- Color scheme: dark navy #0D1B2A background, accent blue #00C2FF, white text
- API routes go in /app/api/
- Vapi.ai calls go in /app/api/vapi/
- Cal.com booking logic goes in /lib/calendar.ts
- Lead scraping logic goes in /lib/scraper.ts
- Claude API calls go in /lib/claude.ts
- ClickUp logging goes in /lib/clickup.ts
- Environment variables go in .env.local — never hardcode API keys
- UI should feel like a premium startup dashboard — bold, clean, data-forward
- This will eventually be productized and sold to other businesses under YALID LLC

## Design Philosophy
Follow these rules for ALL UI work:

- Typography: Use distinctive, characterful fonts — NOT Inter, Arial, or Roboto. Import from Google Fonts. Pair a bold display font with a clean body font.
- Colors: Commit hard to the palette — #0D1B2A background, #00C2FF accent, #FFFFFF text, #0A1628 card backgrounds. Sharp contrast only.
- Motion: Add subtle animations on page load — staggered card reveals, fade-ins. Use CSS transitions on hover states.
- Backgrounds: Add depth — subtle grid patterns, noise textures, or gradient meshes on the background. Not flat solid color.
- Layout: Bold asymmetry where possible. Large numbers. Generous spacing. Data-forward.
- Cards: Subtle border with slight glow on hover using accent color. Dark glass-morphism feel.
- Buttons: Accent blue with slight glow effect. Sharp corners. Bold text.
- Empty states: Make them feel intentional — not generic. Custom messaging.
- Overall vibe: Think Linear.app meets a Bloomberg terminal. Premium, fast, serious, bold.
- NEVER use generic AI dashboard aesthetics. Every screen should feel like it was designed by a senior product designer.

## Next.js Skills
- Always use Next.js 14 App Router patterns — never pages directory
- Use server components by default, client components only when needed (mark with "use client")
- API routes use the new route.ts format with GET/POST exports
- Use next/image for all images

## shadcn/ui Skills
- Always install components via: npx shadcn@latest add [component]
- Never manually create shadcn components from scratch
- Use the cn() utility for conditional classNames
- Respect the component's built-in variants — extend don't override

## TypeScript Skills
- Always define interfaces for all data shapes
- Lead interface: { id, name, phone, category, city, websiteStatus, priorityScore, createdAt }
- Call interface: { id, leadId, status, outcome, duration, bookedAt, calcomEventId }
- Never use 'any' type

## API Skills
- All external API calls go through /lib/ files
- Always handle errors with try/catch
- Always return typed responses
- Log errors to console in development

## Tailwind Skills
- Use Tailwind for ALL styling — no inline styles
- Custom colors already set in CLAUDE.md — use them via arbitrary values like bg-[#0D1B2A]
- Use gap- for spacing in flex/grid layouts
- Responsive: mobile-first always
