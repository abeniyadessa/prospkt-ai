<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


<claude-mem-context>
# Memory Context

# [prospkt.ai] recent context, 2026-05-11 2:09pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,641t read) | 324,888t work | 95% savings

### May 11, 2026
S8 Research ways to use open-source models or alternatives to make receptionist and sales rep voices sound as humanly as possible (May 11 at 1:44 PM)
S9 Implement scrape-first onboarding CTA on home view empty state; commit feature to main branch (May 11 at 1:54 PM)
S10 Complete 6-task milestone: implement scrape-first onboarding CTA and verify end-to-end flow; decision point on next work (May 11 at 1:54 PM)
S11 Select optimal voice model and configuration for Prospkt receptionist and sales rep voices; decide between production-ready and open-source options (May 11 at 1:56 PM)
S12 Fix silent-empty scrape UX issue (#4 from watch list); surface failures and zero-result feedback across API, scraper, and home view (May 11 at 1:57 PM)
S13 Harden database layer against silent data-routing to default workspace; address DEFAULT_WORKSPACE_ID parameter defaults that allow implicit fallback behavior (May 11 at 1:58 PM)
197 1:59p 🔵 Next.js Route Handlers Documentation Path Not Found
198 " 🔵 Vapi Integration Uses OpenAI Realtime with Marin Voice as Default
199 " 🔵 Settings UI Includes Caller Configuration Tab with Voice Options
200 " 🔵 Voice Configuration Infrastructure in Place: voiceId Parameter and Database Settings
202 " 🔵 Database layer uses DEFAULT_WORKSPACE_ID extensively as fallback
203 " 🔵 Every data access function in database.ts defaults to DEFAULT_WORKSPACE_ID
204 " 🔵 Route Handlers Documentation: Caching, HTTP Methods, and GET-Only Static Prerendering
206 " 🔵 Route Handler API Reference: NextRequest, Context Params, and Type Safety with RouteContext
205 " ✅ Database functions converted from optional to required workspaceId parameters
207 2:00p 🔵 Script Settings Database Operations: getScriptSettings and updateScriptSettings
209 " 🔵 Breaking change: 42 required workspaceId params cause 30+ TypeScript errors across codebase
208 " 🔵 Ad Hoc Call Flow: Voice Assistant Created Without voiceId Parameter
210 " 🔵 Settings Script API Endpoint: GET/POST for Script Configuration
212 " 🔵 Database init functions call upsertLeads and addDncEntry without workspaceId
211 " 🔵 ScriptSettings Type Definition: Current Fields
213 " ✅ Legacy data migration now explicitly passes DEFAULT_WORKSPACE_ID to upsertLeads
214 " ✅ Legacy DNC migration now explicitly passes DEFAULT_WORKSPACE_ID to addDncEntry
S14 Continue implementation of database layer hardening for prospkt.ai — fix TypeScript compilation errors from converting 33+ database functions to require explicit workspaceId parameter positioning (May 11 at 2:00 PM)
215 2:02p 🔵 Production Call Flow: callLead() Creates Assistant Without voiceId
216 " 🔵 Complete Vapi Integration: AssistantConfig voiceId Parameter Fully Supported
217 " 🔵 Database Schema: scriptSettings Table Structure with No Voice Field
218 2:03p 🔵 Settings Script Tab: Current UI Limited to systemPromptSuffix and firstMessageTemplate
219 " 🔵 ScriptSettings Usage Map: getScriptSettings Called in generateCallScript Flow
220 " 🔵 Database Initialization: script_settings Table Definition with SQL
221 " 🔵 Workspace Initialization: ensureWorkspaceDefaults() Initializes script_settings with Defaults
222 " 🔵 Database Schema Evolution Pattern: ensureColumn() Used for Backward Compatibility
223 " 🔵 Drizzle ORM Migrations: script_settings Table in Migration Files
224 " 🔵 Documentation and Marketing Claim: README Lists ElevenLabs as Voice Provider, Not Implemented
225 2:04p 🔵 Voice Demo Entry Point: /api/agent/test-call Calls placeAdHocCall()
226 " 🔵 Voice Demo Card UI: Three Demo Scenarios Without Voice Selection
227 " 🔵 Drizzle Migration Snapshot: script_settings Columns Confirmed
228 " 🔵 Test Call Endpoint: POST /api/agent/test-call with Zod Schema, No voiceId Parameter
229 " 🔵 Voice Demo Card Wiring: VoiceDemoCard Opens TestCallDialog on "Demo the voice" Click
230 " 🔵 Home View Layout: Voice Demo Card Positioned in Right Sidebar with Agent Controls
231 " 🔵 TestCallDialog: Three Demo Scenarios, Phone Input, No Voice Selection UI
232 " 🔵 Call Script Generation: getScriptSettings() Used to Override AI-Generated Script
233 " 🔵 Settings Status Endpoint: /api/settings/status Returns Integration Readiness and Caller Config
234 2:05p 🔵 README Stack Claims ElevenLabs Voice Support; Implementation Uses Only OpenAI Realtime
235 " ✅ Created lib/voice.ts: OpenAI Realtime Voice Constants and Utilities
236 " ✅ Updated ScriptSettings Type: Added realtimeModel and realtimeVoiceId Fields
237 " ✅ Updated lib/vapi.ts: Use Typed Voice Resolvers and Support model Parameter
238 " ✅ Updated lib/database.ts: Added realtimeModel and realtimeVoiceId Columns to script_settings
239 2:06p ✅ Updated getScriptSettings() and updateScriptSettings(): Handle realtimeModel and realtimeVoiceId
240 " ✅ Updated POST /api/settings/script: Handle realtimeModel and realtimeVoiceId in Request Body
241 " ✅ Refined POST /api/settings/script: Preserve Voice Settings on Partial Updates
242 " ✅ Updated lib/agents/caller.ts: Thread Voice Settings Through Call Creation
245 2:07p ✅ Updated Settings View: Add Voice Selection State and saveVoice() Handler
243 " 🔵 Database functions already have workspaceId as required string parameter in signatures
244 " ✅ listAgentEvents parameter reordered: workspaceId moved to first position
S15 Continue database layer hardening — resolve remaining 30 TS errors from function signature parameter reordering across orchestrator, caller, guardrails, dnc, scraper, and database internal call sites (May 11 at 2:07 PM)
S17 Create a LinkedIn-ready infographic for YALID Prospkt that showcases app features and highlights key areas, with accompanying post copy (May 11 at 2:08 PM)
246 2:08p ✅ Added Voice Selection UI to Caller Tab in Settings View
S16 Continue fixing database layer hardening: resolve remaining ~35 TypeScript errors from converting 33+ database functions to require explicit workspaceId parameters (May 11 at 2:08 PM)
247 2:09p ✅ LinkedIn infographic messaging refined for feature-focused presentation

Access 325k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>