<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [prospkt.ai] recent context, 2026-05-15 4:20pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (18,911t read) | 428,120t work | 96% savings

### May 12, 2026
S24 Audit shadcn/ui integration in Prospkt.ai project and assess design system uniformity across application UI (May 12 at 11:39 AM)
S25 Add missing shadcn/ui components to foundation and integrate TooltipProvider into root layout (May 12 at 11:49 AM)
S26 Fix voice demo dialog cutoff on small viewports when pressing the demo button (May 12 at 12:41 PM)
304 4:08p 🔴 Fix dialog overflow by adding max-height and overflow constraints
305 4:10p 🔴 Fix voice demo dialog overflow and improve mobile layout
306 4:11p ✅ Add TooltipProvider to app layout
307 4:12p ✅ Verify dialog overflow fix changes
S27 Improve voice demo calls to sound natural, interactive, and receptionist-like with faster response times, early interruption, silence handling, and a distinct demo voice (May 12 at 4:14 PM)
308 4:18p 🔵 Vapi voice calling architecture integrated with realtime OpenAI models
309 " 🔵 Script generation pipeline: Claude API generates system prompt and first message per lead
310 " 🔵 Database schema for calls and script settings
311 " 🔵 OpenAI realtime voice model and voice ID configuration
312 " 🔵 Test call API endpoint with DNC enforcement and lead context capture
313 4:19p 🔵 Vapi call orchestration with conversational UX tuning and voicemail safeguards
314 " 🔵 Vapi call status and webhook contract
315 " 🔵 Vapi webhook handler maps call outcomes and stores transcripts
316 " 🔵 Test call scenarios pre-configure demo context for voice testing
317 " 🔵 Call transcript display with speaker attribution
318 " 🔵 Claude-generated system prompt with hardcoded receptionist persona and customizable overrides
319 " 🔵 Call orchestration with lead context transformation and booking tool injection
320 " 🔵 Settings UI with four tabs: Integrations, Caller, Compliance, Script
321 4:20p 🔵 SQLite database with DatabaseSync (Node.js native) and workspace-scoped tables
323 " 🔵 Lead calls table schema: id, leadId, vapiCallId, outcome, transcript, summary, recording, timestamps
324 4:23p ✅ Voice options expanded from 2 to 5 user-selectable voices
325 " 🟣 Demo mode added to script generation with special system prompt and first message
326 4:24p ✅ Ad-hoc test calls now use demo mode with Coral voice
327 " ✅ Vapi assistant tuned for faster response, interruption on first word, silence handling hooks
328 4:25p ✅ Demo mode instruction added to handle booking role-play without live calendar
329 " ✅ Demo calls disabled from invoking booking tools
330 " ✅ First message placeholder updated to show natural AI disclosure example
331 " ✅ First message template variables documentation updated to include {companyName}
333 4:26p ✅ Removed unused webhookBase variable from placeAdHocCall
336 4:27p 🔴 Voice agent tuning for natural demo calls: voices, timing, interruption, silence handling
S28 Fix horrible illustration for Prospkt.ai launch post by removing decorative elements and simplifying the design (May 12 at 4:27 PM)
### May 13, 2026
337 5:02p ✅ Brand Asset Illustration Refined with Typography and Visual Hierarchy Adjustments
338 5:03p ✅ Brand Asset SVG Rendering Executed Successfully
339 " ✅ Launch Post SVG Brand Asset Rendered and Visually Verified
S29 Redesign launch card for Prospkt.ai with darker halftone/AI poster aesthetic while maintaining simplicity and brand focus (May 13 at 5:03 PM)
340 5:10p ✅ Launch Post SVG Completely Redesigned with Dark Theme and Radial Glow Effects
341 " 🔴 SVG XML Parse Error Discovered in Brand Asset Rendering
342 5:11p 🔵 Root Cause of XML Parse Error Identified in SVG Template
343 " 🔴 XML Tag Mismatch Corrected in SVG Gradient Definition
344 " 🔵 Additional XML Tag Mismatch Found in SVG Gradient Definitions
345 5:12p 🔵 Multiple Structural Problems Found in SVG Template File
346 " 🔵 Root Cause Confirmed: Mismatched Closing Tag in launchPostSvg() defs Section
347 5:13p 🔴 Multiple SVG Gradient Tag Mismatches Corrected
348 " ✅ Brand Asset Rendering Script Executed Successfully
S30 Verify file format of redesigned launch card asset for Prospkt.ai (May 13 at 5:14 PM)
349 5:16p ✅ Launch card asset finalized as PNG image
S31 Rebuild Prospkt.ai "launching soon" LinkedIn social image with reference design improvements (May 13 at 5:17 PM)
350 5:19p 🔵 Root layout authentication and branding configuration examined
351 " 🔵 Design system and color palette configuration established
352 " 🔵 Font usage discrepancy between app and brand assets
353 " 🔵 Switzer and Inter fonts not installed locally on system
354 " 🔵 Launch post SVG uses complex gradient and halftone effects
355 5:20p ✅ Launch card SVG redesigned with Switzer font and enhanced visual effects
356 5:21p ✅ Launch post SVG design finalized and committed
357 " ✅ Brand assets rendered successfully with updated design
S32 Create a detailed JSON file describing the LinkedIn launch graphic design for Prospkt.ai (May 13 at 5:22 PM)
S33 Copy refinement for Prospkt.ai launch announcement — integrate lead scraper into core messaging (May 13 at 6:32 PM)
**Investigated**: User's existing launch copy mentioning: AI sales rep/receptionist, follow-up automation, CRM, revenue loss problem due to missed follow-up

**Learned**: Two refined versions provided: tighter version (natural lead scraper integration) and more polished founder version (expanded CRM context, emphasizes consistency challenge)

**Completed**: Two launch copy variants delivered — tighter and polished — both incorporating lead generation + follow-up + CRM + job booking into cohesive narrative

**Next Steps**: User to select preferred copy variant for public launch announcement or request further refinement


Access 428k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>