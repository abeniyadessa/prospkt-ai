"use client";

import {
  ArrowRightIcon,
  CheckCircleIcon,
  LockIcon,
  MegaphoneIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { campaignLaneSummaries, campaignPlaybooks } from "@/lib/campaigns";
import { CAMPAIGN_LANE_LABELS, type CampaignLane, type NavKey } from "@/lib/types";
import {
  Card,
  CardHeader,
  GhostButton,
  LifecycleBadge,
  PageHeader,
} from "@/components/app/primitives";

const laneOrder: CampaignLane[] = ["warm_recovery", "cold_b2b", "cold_consumer"];

function statusLabel(status: "ready" | "guarded" | "setup") {
  if (status === "ready") return "Ready";
  if (status === "guarded") return "Guarded";
  return "Setup needed";
}

function statusTone(status: "ready" | "guarded" | "setup") {
  if (status === "ready") return "bg-[#E8F3EC] text-[#2E7D4F]";
  if (status === "guarded") return "bg-[#F7ECD8] text-[#9A6619]";
  return "bg-[color:var(--elevated)] text-muted-foreground";
}

export function CampaignsView({
  onNavigate,
}: {
  onNavigate: (key: NavKey) => void;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Playbooks for turning service leads into booked jobs: warm recovery, cold B2B, and guarded consumer outreach."
        actions={
          <GhostButton
            onClick={() => onNavigate("CRM")}
            iconRight={<ArrowRightIcon size={11} aria-hidden />}
          >
            Open CRM
          </GhostButton>
        }
      />

      <section className="grid gap-3 lg:grid-cols-3">
        {laneOrder.map((lane) => {
          const summary = campaignLaneSummaries[lane];
          const locked = lane === "cold_consumer";
          return (
            <Card key={lane} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface"
                  aria-hidden
                >
                  {locked ? (
                    <LockIcon size={16} className="text-muted-foreground" />
                  ) : lane === "warm_recovery" ? (
                    <PhoneCallIcon size={16} className="text-muted-foreground" />
                  ) : (
                    <MegaphoneIcon size={16} className="text-muted-foreground" />
                  )}
                </div>
                <span className="rounded-md bg-[color:var(--elevated)] px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {CAMPAIGN_LANE_LABELS[lane]}
                </span>
              </div>
              <h2 className="mt-4 text-balance text-[15px] font-semibold text-foreground">
                {summary.title}
              </h2>
              <p className="mt-1 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                {summary.description}
              </p>
              <div className="mt-4 rounded-lg border border-hairline bg-[color:var(--elevated)] p-3">
                <div className="flex items-start gap-2">
                  <ShieldCheckIcon
                    size={14}
                    weight="fill"
                    color={locked ? "#B47A1F" : "#2E7D4F"}
                    className="mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                    {summary.guardrail}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader
          title="Service-sales playbooks"
          description="These are the campaign templates Prospkt will use to choose source rules, scripts, guardrails, and CRM outcomes."
        />
        <div className="grid gap-px bg-[color:var(--hairline)] sm:grid-cols-2 xl:grid-cols-3">
          {campaignPlaybooks.map((playbook) => (
            <article key={playbook.id} className="bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-foreground">
                    {playbook.title}
                  </p>
                  <p className="mt-1 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                    {playbook.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[10.5px] font-semibold ${statusTone(
                    playbook.status
                  )}`}
                >
                  {statusLabel(playbook.status)}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="text-right font-medium text-foreground">
                    {playbook.defaultSource}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Goal</dt>
                  <dd className="max-w-[12rem] text-right font-medium text-foreground">
                    {playbook.goal}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Guardrail</dt>
                  <dd className="max-w-[12rem] text-right font-medium text-foreground">
                    {playbook.complianceMode}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Consumer outreach lock"
          description="Cold consumer campaigns are not the default path. They require stricter controls before live dialing."
          action={<LifecycleBadge status="follow_up" />}
        />
        <ul className="grid gap-px bg-[color:var(--hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Source and consent note",
            "DNC and opt-out enforcement",
            "AI disclosure on every call",
            "Owner pause and daily caps",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 bg-surface px-4 py-3">
              <CheckCircleIcon size={14} color="#2E7D4F" weight="fill" aria-hidden />
              <span className="text-[12.5px] font-medium text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
