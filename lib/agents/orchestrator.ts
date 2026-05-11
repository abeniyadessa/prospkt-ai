import {
  addAgentEvent,
  createAgentRun,
  getAgentSettings,
  getDailyAgentBudget,
  listAgentEvents,
  listLeads,
  rememberLeadSeen,
  updateAgentRun,
  updateAgentSettings,
} from "@/lib/database";
import { callLead } from "@/lib/agents/caller";
import { evaluateLeadGuardrails } from "@/lib/agents/guardrails";
import { rankLeadsForAgent } from "@/lib/agents/qualifier";
import type { AgentEvent, AgentRun, AgentRunMode } from "@/lib/types";

const ESTIMATED_CALL_COST_CENTS = 25;
const FAILURE_PAUSE_THRESHOLD = 3;

export interface AgentRunResult {
  run: AgentRun;
  events: AgentEvent[];
}

export async function runAgent(
  options: { dryRun?: boolean; workspaceId?: string } = {}
): Promise<AgentRunResult> {
  const workspaceId = options.workspaceId;
  const mode: AgentRunMode = options.dryRun ? "dry_run" : "live";
  const run = createAgentRun(mode, workspaceId);

  function log(input: Parameters<typeof addAgentEvent>[0]) {
    return addAgentEvent({ ...input, runId: run.id }, workspaceId);
  }

  try {
    const settings = getAgentSettings(workspaceId);
    log({
      type: "run_started",
      severity: "info",
      message: mode === "dry_run" ? "Agent dry run started" : "Guarded agent run started",
      metadata: { mode },
    });

    if (settings.paused) {
      log({
        type: "paused",
        severity: "warning",
        message: "Run stopped because automation is paused",
      });
      const pausedRun =
        updateAgentRun(
          run.id,
          {
            status: "paused",
            summary: "Automation is paused. No CRM records were evaluated.",
          },
          workspaceId
        ) ?? run;
      return { run: pausedRun, events: listAgentEvents(100, run.id, workspaceId) };
    }

    const budget = getDailyAgentBudget(new Date(), workspaceId);
    log({
      type: "budget_check",
      severity: budget.callsRemaining > 0 && budget.costRemainingCents > 0 ? "success" : "warning",
      message: `${budget.callsRemaining}/${budget.maxCalls} calls and $${(
        budget.costRemainingCents / 100
      ).toFixed(2)} left today`,
      metadata: { ...budget },
    });

    if (budget.callsRemaining <= 0 || budget.costRemainingCents < ESTIMATED_CALL_COST_CENTS) {
      const completed =
        updateAgentRun(
          run.id,
          {
            status: "completed",
            summary: "Daily call or cost cap already reached. No CRM records were dialed.",
          },
          workspaceId
        ) ?? run;
      log({
        type: "run_completed",
        severity: "warning",
        message: "Run completed without dialing because the daily cap was reached",
      });
      return { run: completed, events: listAgentEvents(100, run.id, workspaceId) };
    }

    const leads = rankLeadsForAgent(await listLeads(workspaceId));
    log({
      type: "qualify",
      severity: "info",
      message: `Qualified ${leads.length} active CRM records for guardrail review`,
      metadata: { activeLeadCount: leads.length },
    });

    let callsAttempted = 0;
    let callsSkipped = 0;
    let costCents = 0;
    let queued = 0;
    const selectable = Math.min(
      budget.callsRemaining,
      Math.floor(budget.costRemainingCents / ESTIMATED_CALL_COST_CENTS)
    );

    for (const lead of leads) {
      if (queued + callsAttempted >= selectable) {
        break;
      }

      const guardrail = await evaluateLeadGuardrails(
        lead,
        settings,
        mode,
        new Date(),
        workspaceId
      );
      rememberLeadSeen(lead, guardrail.timezone, workspaceId);

      if (!guardrail.eligible) {
        callsSkipped += 1;
        log({
          type: "skip",
          severity: "warning",
          message: `${lead.name} skipped: ${guardrail.reason ?? "Guardrail blocked call"}`,
          leadId: lead.id,
          metadata: { reason: guardrail.reason, timezone: guardrail.timezone },
        });
        continue;
      }

      if (mode === "dry_run") {
        queued += 1;
        log({
          type: "queue",
          severity: "success",
          message: `${lead.name} would be called in a live run`,
          leadId: lead.id,
          metadata: { phone: lead.phone, timezone: guardrail.timezone },
        });
        continue;
      }

      try {
        log({
          type: "call",
          severity: "info",
          message: `Calling ${lead.name}`,
          leadId: lead.id,
          metadata: { phone: lead.phone, timezone: guardrail.timezone },
        });
        const call = await callLead(lead, guardrail.timezone, workspaceId);
        callsAttempted += 1;
        costCents += ESTIMATED_CALL_COST_CENTS;
        log({
          type: "call",
          severity: "success",
          message: `${lead.name} call started`,
          leadId: lead.id,
          metadata: {
            callId: call.id,
            status: call.status,
            estimatedCostCents: ESTIMATED_CALL_COST_CENTS,
          },
        });
      } catch (err) {
        callsSkipped += 1;
        log({
          type: "error",
          severity: "error",
          message: `${lead.name} call failed: ${err instanceof Error ? err.message : String(err)}`,
          leadId: lead.id,
        });
      }
    }

    const summary =
      mode === "dry_run"
        ? `Dry run found ${queued} eligible CRM records and skipped ${callsSkipped}. No calls placed.`
        : `Live run started ${callsAttempted} calls and skipped ${callsSkipped}.`;
    const completed =
      updateAgentRun(
        run.id,
        {
          status: "completed",
          callsAttempted,
          callsSkipped,
          costCents,
          summary,
        },
        workspaceId
      ) ?? run;
    updateAgentSettings({ failureCount: 0 }, workspaceId);
    log({ type: "run_completed", severity: "success", message: summary });

    return { run: completed, events: listAgentEvents(100, run.id, workspaceId) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failed =
      updateAgentRun(
        run.id,
        {
          status: "failed",
          error: message,
          summary: "Agent run failed before completion.",
        },
        workspaceId
      ) ?? run;
    const settings = getAgentSettings(workspaceId);
    const nextFailureCount = settings.failureCount + 1;
    updateAgentSettings(
      {
        failureCount: nextFailureCount,
        paused: nextFailureCount >= FAILURE_PAUSE_THRESHOLD ? true : settings.paused,
      },
      workspaceId
    );
    log({
      type: "error",
      severity: "error",
      message:
        nextFailureCount >= FAILURE_PAUSE_THRESHOLD
          ? `Run failed and automation was paused: ${message}`
          : `Run failed: ${message}`,
      metadata: { failureCount: nextFailureCount },
    });
    return { run: failed, events: listAgentEvents(100, run.id, workspaceId) };
  }
}
