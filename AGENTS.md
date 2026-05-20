<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [prospkt.ai] recent context, 2026-05-20 4:43pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,454t read) | 111,913t work | 86% savings

### May 20, 2026
S56 Clarify validation strategy and market access approach for Stage-A pre-launch Prospkt positioning. Determine whether to pursue aggressive niche validation with direct operator access or cold-outreach model. (May 20 at 3:55 PM)
S57 Develop Stage-A product strategy for Prospkt under D-path constraints (no customer interviews, market research via public signals only). Evaluate three positioning directions and recommend optimal direction for self-serve, lead-magnet-first GTM. (May 20 at 3:57 PM)
S58 Strategic direction decision for Prospkt V1: AI receptionist for trades service businesses, with outbound revival as expansion play. (May 20 at 3:59 PM)
S59 Polish prelaunch page mobile responsiveness and deploy to production (May 20 at 4:06 PM)
S60 Build animated prelaunch email collection page with rotating headline phrases; maintain brand colors, voice, and UI components from projustc; separate from current marketing page (May 20 at 4:06 PM)
S61 Market validation research: mine operator pain signals, audit AI receptionist competitors, map trade-specific AI players, quantify missed-call economic impact, synthesize findings into sharpenedV1 positioning for prospkt.ai (May 20 at 4:14 PM)
730 4:26p 🔵 Solo HVAC/plumbing operators reject enterprise tools; manage via phone/notebook or seek lightweight alternatives
731 " ✅ Reverted PrelaunchEmailForm to fixed two-column layout with rounded-[1.75rem]
732 " ✅ Patch applied to PrelaunchEmailForm component
733 " 🔵 Avoca AI targets $3M+ revenue with 5+ CSRs on ServiceTitan; explicitly excludes solo/small operators
734 " 🔵 HVAC owner preference: AI subscription ($49–$199/mo) over hiring dispatcher ($47K/yr) or human service ($235–$700/mo)
735 " 🔵 Baseline UI constraints reviewed for prelaunch design compliance
736 4:27p 🔵 Git status confirms both prelaunch files modified and staged
S62 Voice quality vs. cost trade-off for V1 product: assess open-source TTS viability vs. premium providers (Cartesia, ElevenLabs, OpenAI) for real-time phone call scenarios (May 20 at 4:27 PM)
737 " 🔵 Reverted prelaunch page now has AnimatedHeadline preserved with restored spacing and layout
738 " 🔵 Reverted PrelaunchEmailForm has fixed two-column layout with rounded-full input/button
739 " 🔵 Reverted ProductPreview with fixed three-column PreviewRow and responsive Stat sizing
740 " ✅ Git diff shows complete reversion of prelaunch page and email form to previous design
741 4:28p 🔵 Git status shows working directory with 13 modified files including prelaunch design changes
742 " 🔵 Build process initiated with Next.js 16.2.3 Turbopack
743 " 🔵 Next.js compilation successful in 4.4 seconds
744 " 🔵 TypeScript type checking passed, now collecting page data for static generation
745 " 🔵 Next.js build completed successfully with prelaunch page static generation
746 " 🔵 ESLint linting started with no immediate output
747 " 🔵 ESLint linting completed with 1 warning (no errors)
748 " 🔵 Browser skill documentation reviewed for in-app browser automation
749 " 🔵 Browser skill full API documentation reviewed for automation capabilities
750 4:29p 🔵 Browser session error: variable redeclaration in Node REPL
751 " 🔵 Browser session timeout: Page.captureScreenshot CDP command timed out
752 " 🔵 Prelaunch page DOM inspection: AnimatedHeadline animation active with rotating phrases
753 " 🔵 Browser screenshot capture consistently times out on CDP Page.captureScreenshot command
754 " 🔵 Computer Use MCP tool restricted from Codex app access
755 4:30p 🔵 Project dependencies include @playwright/test version 1.51.1
756 " 🔵 Git diff whitespace check passed for both prelaunch files
758 4:31p ✅ Staged two prelaunch files for commit
759 " 🔵 Git staging complete: two prelaunch files staged, 11 files unstaged
760 " 🔵 Staged changes summary: 24 insertions, 36 deletions across 2 files
761 " ✅ Commit created: "Restore prelaunch mobile layout" (e01bc03)
762 " ✅ Git push initiated to origin main
763 " ✅ Commit e01bc03 pushed successfully to origin main
765 " 🔵 Vercel project configuration present in temporary deployment directory
766 " 🔵 Git checkout failed: permission denied on worktree index lock
767 " ✅ Temporary deployment directory updated to reversion commit e01bc03
768 4:32p 🔵 Build failure: next command not found in deployment directory
769 " ✅ Vercel production deployment initiated for prelaunch reversion
770 " ✅ Vercel production build underway: Next.js compilation starting
771 " 🔵 Next.js compilation completed successfully in 22.9 seconds
S63 Restore prelaunch phone design while keeping animated headline: revert to previous layout, preserve AnimatedHeadline rotating phrase animation (May 20 at 4:32 PM)
772 " ✅ Vercel build completed successfully in 41 seconds total
773 4:33p ✅ Vercel deployment phase: uploading built outputs to CDN
774 " ✅ Vercel production deployment completed successfully
775 " 🔵 Production prelaunch page responding with HTTP 200, prerendered static content
777 " 🔵 Production prelaunch page HTML contains AnimatedHeadline with three rotating phrases and reverted layout
S64 Write and commit V1 design spec for Prospkt; document strategic pivot from outbound AI sales rep to inbound AI receptionist for 1–5 truck operators (May 20 at 4:34 PM)
781 4:34p ✅ Project documentation structure initialized
782 " ⚖️ Prospkt V1 product direction finalized: AI receptionist for 1–5 truck operators
783 4:36p ✅ V1 design spec margin target corrected for internal consistency
784 " ✅ V1 design spec staged for commit
785 4:37p ✅ V1 design spec committed to git repository
S65 Assess whether to create new AGENTS.md or update existing project documentation; clarify agent file standards vs. project context files (May 20 at 4:39 PM)
**Investigated**: Current AGENTS.md (82 lines, auto-managed by claude-mem plugin with Next.js version warning); CLAUDE.md (112 lines, project-specific rules); agentsfile.org standard for cross-tool AI portability; relationship between claude-mem context management and hand-edited project docs

**Learned**: AGENTS.md is auto-rotated by claude-mem plugin and contains mostly memory dumps + framework warnings; not suitable for hand-editing project conventions. CLAUDE.md is the canonical source for project rules (tech stack, folder conventions, TypeScript interfaces, TCPA compliance, roadmap). Agentsfile.org AGENTS.md format useful only for multi-tool portability (Cursor, Aider, Codex CLI, Gemini CLI); currently low ROI for Claude-only project. Post-pivot, CLAUDE.md contains stale context: describes old outbound positioning, references Vapi-based routes, assumes outbound Call interface, targets wrong ICP (Michigan, no-website shops vs. 1–5 truck national), and outdated TCPA rules

**Completed**: Identified that CLAUDE.md is now misaligned with V1 spec and acts as a centripetal force pulling future context in wrong direction. Documented specific staleness: Project Overview (outbound vs. inbound), Folder Conventions (vapi/* vs. twilio/+voice/*), TypeScript Interfaces (outbound Call vs. inbound receptionist), Phase 1 Target (Michigan web-weak vs. 1–5 truck HVAC/plumbing/electrical/roofing), TCPA rules (outbound vs. inbound recording disclosure)

**Next Steps**: Await user decision on CLAUDE.md refresh. Proposed scope: (1) rewrite Project Overview to inbound receptionist positioning, (2) add V1 Tech Stack section (Twilio, Pipecat, Cartesia, Whisper-Groq, Haiku, Vercel AI Gateway, Cal.com, Stripe), (3) update TypeScript Interfaces for inbound concepts (caller, transcript, captured fields, booking status), (4) rewrite Build Roadmap to reference V1 spec as canonical source, (5) update Phase 1 Target to new ICP, (6) refresh TCPA Compliance for inbound-specific rules + recording disclosure. If approved, update CLAUDE.md (~15 min) before invoking writing-plans skill


Access 112k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>