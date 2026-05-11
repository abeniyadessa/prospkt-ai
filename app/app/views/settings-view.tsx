"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PhoneIcon,
  PhoneCallIcon,
  CalendarIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  RobotIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon,
  EnvelopeIcon,
  ClockIcon,
  FloppyDiskIcon,
  ShieldCheckIcon,
  PuzzlePieceIcon,
  ChatCenteredTextIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { TCPA_HOURS } from "@/lib/constants";
import {
  DEFAULT_OPENAI_REALTIME_VOICE_ID,
  OPENAI_REALTIME_MODEL,
  OPENAI_REALTIME_VOICE_OPTIONS,
  type OpenAIRealtimeVoiceId,
} from "@/lib/voice";
import {
  Card,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  PrimaryButton,
} from "@/components/app/primitives";

type Tab = "integrations" | "caller" | "compliance" | "script";

const integrations: {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  envVars: string[];
}[] = [
  {
    key: "anthropic",
    label: "AI script engine",
    desc: "Generates the personalized call script per lead",
    icon: RobotIcon,
    envVars: ["ANTHROPIC_API_KEY"],
  },
  {
    key: "vapi",
    label: "Vapi.ai",
    desc: "Outbound voice caller",
    icon: PhoneCallIcon,
    envVars: ["VAPI_API_KEY", "VAPI_PHONE_NUMBER_ID"],
  },
  {
    key: "calcom",
    label: "Cal.com",
    desc: "Books service appointments",
    icon: CalendarIcon,
    envVars: ["CALCOM_API_KEY", "CALCOM_EVENT_TYPE_ID"],
  },
  {
    key: "twilio",
    label: "Twilio",
    desc: "SMS follow-ups after a successful call",
    icon: PhoneIcon,
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
  },
  {
    key: "resend",
    label: "Resend",
    desc: "Email digest when a meeting is booked",
    icon: EnvelopeIcon,
    envVars: ["RESEND_API_KEY"],
  },
  {
    key: "yelp",
    label: "Yelp Fusion",
    desc: "Pulls local business data for the scraper",
    icon: MagnifyingGlassIcon,
    envVars: ["YELP_API_KEY"],
  },
  {
    key: "google_places",
    label: "Google Places",
    desc: "Optional enrichment for local business details",
    icon: MagnifyingGlassIcon,
    envVars: ["GOOGLE_PLACES_API_KEY"],
  },
];

export function SettingsView() {
  const [tab, setTab] = useState<Tab>("integrations");

  const [integrationsStatus, setIntegrationsStatus] = useState<Record<string, boolean>>({});
  const [caller, setCaller] = useState<Record<string, string | null>>({});
  const [dnc, setDnc] = useState<string[]>([]);
  const [scriptSuffix, setScriptSuffix] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [realtimeModel, setRealtimeModel] = useState(OPENAI_REALTIME_MODEL);
  const [realtimeVoiceId, setRealtimeVoiceId] = useState<OpenAIRealtimeVoiceId>(
    DEFAULT_OPENAI_REALTIME_VOICE_ID
  );
  const [loading, setLoading] = useState(true);

  const [newDncPhone, setNewDncPhone] = useState("");
  const [dncAdding, setDncAdding] = useState(false);
  const [scriptSaving, setScriptSaving] = useState(false);
  const [scriptSaved, setScriptSaved] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, dncRes, scriptRes] = await Promise.all([
        fetch("/api/settings/status"),
        fetch("/api/dnc"),
        fetch("/api/settings/script"),
      ]);
      const statusData = (await statusRes.json()) as {
        integrations: Record<string, boolean>;
        caller: Record<string, string | null>;
        workflow?: Record<string, boolean>;
      };
      const dncData = (await dncRes.json()) as { numbers: string[] };
      const scriptData = (await scriptRes.json()) as {
        systemPromptSuffix: string;
        firstMessageTemplate: string;
        realtimeModel?: typeof OPENAI_REALTIME_MODEL;
        realtimeVoiceId?: OpenAIRealtimeVoiceId;
      };
      setIntegrationsStatus(statusData.integrations ?? {});
      setCaller(statusData.caller ?? {});
      setDnc(dncData.numbers ?? []);
      setScriptSuffix(scriptData.systemPromptSuffix ?? "");
      setFirstMessage(scriptData.firstMessageTemplate ?? "");
      setRealtimeModel(scriptData.realtimeModel ?? OPENAI_REALTIME_MODEL);
      setRealtimeVoiceId(scriptData.realtimeVoiceId ?? DEFAULT_OPENAI_REALTIME_VOICE_ID);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addDnc(phone: string) {
    if (!phone.trim() || dncAdding) return;
    setDncAdding(true);
    try {
      await fetch("/api/dnc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      setDnc((p) => Array.from(new Set([...p, phone.trim()])));
      setNewDncPhone("");
    } finally {
      setDncAdding(false);
    }
  }

  async function removeDnc(phone: string) {
    await fetch(`/api/dnc?phone=${encodeURIComponent(phone)}`, { method: "DELETE" });
    setDnc((p) => p.filter((n) => n !== phone));
  }

  async function saveScript() {
    setScriptSaving(true);
    try {
      await fetch("/api/settings/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPromptSuffix: scriptSuffix,
          firstMessageTemplate: firstMessage,
          realtimeModel,
          realtimeVoiceId,
        }),
      });
      setScriptSaved(true);
      setTimeout(() => setScriptSaved(false), 2400);
    } finally {
      setScriptSaving(false);
    }
  }

  async function saveVoice() {
    setVoiceSaving(true);
    try {
      await fetch("/api/settings/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPromptSuffix: scriptSuffix,
          firstMessageTemplate: firstMessage,
          realtimeModel,
          realtimeVoiceId,
        }),
      });
      setVoiceSaved(true);
      setTimeout(() => setVoiceSaved(false), 2400);
    } finally {
      setVoiceSaving(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "integrations", label: "Integrations", icon: PuzzlePieceIcon },
    { key: "caller", label: "Caller", icon: SlidersHorizontalIcon },
    { key: "compliance", label: "Compliance", icon: ShieldCheckIcon },
    { key: "script", label: "Script", icon: ChatCenteredTextIcon },
  ];

  const workflowSteps = [
    {
      title: "Lead engine",
      desc: "Yelp source, phone validation, and DNC pre-scrub before queueing.",
      ready: Boolean(integrationsStatus.yelp),
      checks: [
        { label: "Yelp Fusion connected", ready: Boolean(integrationsStatus.yelp) },
        { label: "Phone validation active", ready: true },
        { label: "DNC pre-scrub active", ready: true },
      ],
    },
    {
      title: "AI caller",
      desc: "AI-generated call scripts and Vapi outbound voice infrastructure.",
      ready: Boolean(integrationsStatus.anthropic && integrationsStatus.vapi),
      checks: [
        { label: "Script engine connected", ready: Boolean(integrationsStatus.anthropic) },
        { label: "Vapi connected", ready: Boolean(integrationsStatus.vapi) },
        { label: "AI disclosure in base script", ready: true },
      ],
    },
    {
      title: "Booking",
      desc: "Mid-call Cal.com availability checks and booked-call lifecycle updates.",
      ready: Boolean(integrationsStatus.calcom),
      checks: [
        { label: "Cal.com connected", ready: Boolean(integrationsStatus.calcom) },
        { label: "CRM record marked booked on tool call", ready: true },
        { label: "Bookings board active", ready: true },
      ],
    },
    {
      title: "Post-call handoff",
      desc: "SMS confirmations, built-in CRM activity log, and email digest workflow.",
      ready: Boolean(integrationsStatus.twilio && integrationsStatus.resend),
      checks: [
        { label: "Twilio connected", ready: Boolean(integrationsStatus.twilio) },
        { label: "Built-in CRM active", ready: true },
        { label: "Resend connected", ready: Boolean(integrationsStatus.resend) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage integrations, caller configuration, TCPA compliance, and call scripts."
      />

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-border">
        <nav className="flex min-w-max items-center gap-1" role="tablist">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={13} weight={active ? "fill" : "regular"} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <Card>
          <LoadingState label="Loading settings…" />
        </Card>
      ) : (
        <div className="space-y-5">
          {tab === "integrations" && (
            <>
              <Card>
                <CardHeader
                  title="Workflow readiness"
                  description="The same product chain promised on the marketing page, mapped to the live app."
                />
                <div className="grid gap-px bg-[color:var(--hairline)] md:grid-cols-2">
                  {workflowSteps.map((step) => (
                    <div key={step.title} className="bg-surface p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold text-foreground">
                            {step.title}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                            {step.desc}
                          </p>
                        </div>
                        <span
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium"
                          style={{
                            backgroundColor: step.ready ? "#E8F3EC" : "var(--muted)",
                            color: step.ready ? "#2E7D4F" : "#6B6B6B",
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor: step.ready ? "#2E7D4F" : "#9F9F9E",
                            }}
                            aria-hidden
                          />
                          {step.ready ? "Ready" : "Needs setup"}
                        </span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {step.checks.map((check) => (
                          <li
                            key={check.label}
                            className="flex items-center justify-between gap-3 text-[12px]"
                          >
                            <span className="truncate text-muted-foreground">
                              {check.label}
                            </span>
                            <span
                              className="shrink-0 text-[11px] font-medium"
                              style={{ color: check.ready ? "#2E7D4F" : "#9F9F9E" }}
                            >
                              {check.ready ? "On" : "Missing"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Integrations"
                  description="Environment keys connected to the outbound workflow."
                />
                <ul className="divide-y divide-hairline">
                  {integrations.map(({ key, label, desc, icon: Icon, envVars }) => {
                    const connected = integrationsStatus[key];
                    return (
                      <li key={key} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-5">
                        <div
                          className="size-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "var(--muted)" }}
                        >
                          <Icon size={16} color="#0A0A0A" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-foreground">
                            {label}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {desc}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {envVars.map((v) => (
                              <code
                                key={v}
                                className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-[color:var(--muted)] text-muted-foreground"
                              >
                                {v}
                              </code>
                            ))}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                          style={{
                            color: connected ? "#2E7D4F" : "#9F9F9E",
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor: connected ? "#2E7D4F" : "#9F9F9E",
                            }}
                          />
                          {connected ? "Connected" : "Not set"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}

          {tab === "caller" && (
            <>
              <Card>
                <CardHeader
                  title="Realtime voice"
                  description="Production calls and voice demos use this model and voice."
                  action={
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--muted)] px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      OpenAI Realtime
                    </span>
                  }
                />
                <div className="space-y-4 px-4 pb-5 sm:px-5">
                  <div className="rounded-xl border border-hairline bg-[color:var(--elevated)] p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Model
                    </p>
                    <p className="mt-1 font-mono text-[12.5px] text-foreground">
                      {realtimeModel}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                      Speech-to-speech model for lower latency, interruptions, and more natural turn taking.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {OPENAI_REALTIME_VOICE_OPTIONS.map((voice) => {
                      const active = realtimeVoiceId === voice.id;
                      return (
                        <button
                          key={voice.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setRealtimeVoiceId(voice.id);
                            setVoiceSaved(false);
                          }}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            active
                              ? "border-foreground bg-[color:var(--elevated)]"
                              : "border-border bg-surface hover:bg-[color:var(--elevated)]"
                          )}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-[13px] font-semibold text-foreground">
                              {voice.label}
                            </span>
                            {active && (
                              <CheckCircleIcon
                                size={14}
                                weight="fill"
                                color="#2E7D4F"
                                aria-hidden
                              />
                            )}
                          </span>
                          <span className="mt-1.5 block text-[11.5px] leading-relaxed text-muted-foreground">
                            {voice.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <PrimaryButton
                      onClick={saveVoice}
                      loading={voiceSaving}
                      iconLeft={!voiceSaving ? <FloppyDiskIcon size={12} /> : undefined}
                    >
                      {voiceSaving ? "Saving…" : "Save voice"}
                    </PrimaryButton>
                    {voiceSaved && (
                      <span
                        className="inline-flex items-center gap-1 text-[12px] font-medium"
                        style={{ color: "#2E7D4F" }}
                      >
                        <CheckCircleIcon size={13} weight="fill" aria-hidden />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Caller infrastructure"
                  description="Environment-backed calling and booking IDs."
                />
                <ul className="divide-y divide-hairline">
                  {(
                    [
                      {
                        label: "Outbound phone number",
                        value: caller.phoneNumber,
                        icon: PhoneIcon,
                        envVar: "TWILIO_PHONE_NUMBER",
                      },
                      {
                        label: "Vapi phone number ID",
                        value: caller.vapiPhoneNumberId,
                        icon: LinkIcon,
                        envVar: "VAPI_PHONE_NUMBER_ID",
                      },
                      {
                        label: "Cal.com event type ID",
                        value: caller.calcomEventTypeId,
                        icon: CalendarIcon,
                        envVar: "CALCOM_EVENT_TYPE_ID",
                      },
                    ]
                  ).map(({ label, value, icon: Icon, envVar }) => (
                    <li
                      key={label}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--muted)" }}>
                        <Icon size={14} color="#6B6B6B" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground">
                          {label}
                        </p>
                        <code className="text-[10.5px] font-mono text-muted-foreground">
                          {envVar}
                        </code>
                      </div>
                      <span
                        className={cn(
                          "text-[12.5px] font-mono tabular-nums truncate max-w-[20rem]",
                          value ? "text-foreground" : "text-[color:var(--subtle)]"
                        )}
                      >
                        {value ?? "Set via env"}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {tab === "compliance" && (
            <>
              <Card>
                <CardHeader
                  title="TCPA calling hours"
                  description="Calls outside this window are blocked automatically."
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--muted)" }}>
                      <ClockIcon size={14} color="#6B6B6B" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">
                        {TCPA_HOURS.label}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground">
                        America/Detroit (Michigan local time)
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                    style={{ color: "#2E7D4F" }}
                  >
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: "#2E7D4F" }} />
                    Enforced
                  </span>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="Do Not Call list"
                  description="Numbers are auto-added when a lead opts out on-call."
                  count={dnc.length}
                />
                <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3 sm:px-5">
                  <input
                    type="tel"
                    placeholder="+15551234567"
                    value={newDncPhone}
                    onChange={(e) => setNewDncPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addDnc(newDncPhone);
                    }}
                    className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-[13px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 sm:max-w-xs"
                    aria-label="Add phone number to DNC list"
                  />
                  <PrimaryButton
                    onClick={() => addDnc(newDncPhone)}
                    loading={dncAdding}
                    disabled={!newDncPhone.trim()}
                    iconLeft={!dncAdding ? <PlusIcon size={11} /> : undefined}
                  >
                    Add
                  </PrimaryButton>
                </div>
                {dnc.length === 0 ? (
                  <EmptyState
                    icon={CheckCircleIcon}
                    title="DNC list is empty"
                    description="No blocked numbers. Opt-outs will be added here automatically."
                    compact
                  />
                ) : (
                  <ul className="divide-y divide-hairline">
                    {dnc.map((phone) => (
                      <li
                        key={phone}
                        className="flex items-center justify-between px-5 py-2.5"
                      >
                        <span className="text-[13px] font-mono tabular-nums text-foreground">
                          {phone}
                        </span>
                        <button
                          onClick={() => removeDnc(phone)}
                          className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-[rgba(194,53,44,0.08)] hover:text-[#C2352C] transition-colors"
                          aria-label={`Remove ${phone}`}
                        >
                          <TrashIcon size={13} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {tab === "script" && (
            <Card>
              <CardHeader
                title="Call script editor"
                description="The AI engine generates the base script — these fields layer on top for every call."
              />
                <div className="space-y-5 px-4 py-5 sm:px-5">
                <div className="space-y-1.5">
                  <label htmlFor="first-msg" className="text-[11.5px] font-medium text-muted-foreground block">
                    Opening message override
                  </label>
                  <input
                    id="first-msg"
                    type="text"
                    value={firstMessage}
                    onChange={(e) => {
                      setFirstMessage(e.target.value);
                      setScriptSaved(false);
                    }}
                    placeholder='e.g. "Hi, this is an automated AI calling {businessName}…"'
                    className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-[13.5px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                  />
                  <p className="text-[11.5px] text-muted-foreground">
                    Variables:{" "}
                    <code className="font-mono">{"{businessName}"}</code>,{" "}
                    <code className="font-mono">{"{city}"}</code>,{" "}
                    <code className="font-mono">{"{category}"}</code>. Leave blank to use AI-generated copy.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="script-suffix" className="text-[11.5px] font-medium text-muted-foreground block">
                    Extra instructions
                  </label>
                  <textarea
                    id="script-suffix"
                    rows={5}
                    value={scriptSuffix}
                    onChange={(e) => {
                      setScriptSuffix(e.target.value);
                      setScriptSaved(false);
                    }}
                    placeholder="e.g. Always mention we offer a free website audit. Never discuss pricing on the call."
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[13.5px] outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10 resize-none"
                  />
                  <p className="text-[11.5px] text-muted-foreground">
                    Appended to every generated system prompt.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <PrimaryButton
                    onClick={saveScript}
                    loading={scriptSaving}
                    iconLeft={
                      !scriptSaving ? <FloppyDiskIcon size={12} /> : undefined
                    }
                  >
                    {scriptSaving ? "Saving…" : "Save script"}
                  </PrimaryButton>
                  {scriptSaved && (
                    <span
                      className="inline-flex items-center gap-1 text-[12px] font-medium"
                      style={{ color: "#2E7D4F" }}
                    >
                      <CheckCircleIcon size={13} weight="fill" aria-hidden />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
