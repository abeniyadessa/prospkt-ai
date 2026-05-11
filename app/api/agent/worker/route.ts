import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/orchestrator";
import { getAgentStatusPayload, listRunnableWorkspaces } from "@/lib/database";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shouldRun(status: Awaited<ReturnType<typeof getAgentStatusPayload>>) {
  if (status.status === "paused" || status.status === "running") return false;
  const latestStartedAt = status.latestRun?.startedAt;
  if (latestStartedAt && todayKey(new Date(latestStartedAt)) === todayKey()) {
    return false;
  }
  return status.budget.callsRemaining > 0 && status.budget.costRemainingCents > 0;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dryRun?: boolean } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean };
  } catch {
    body = {};
  }

  const workspaces = listRunnableWorkspaces();
  const results = [];

  for (const workspace of workspaces) {
    const status = await getAgentStatusPayload(workspace.id);
    if (!shouldRun(status)) {
      results.push({ workspaceId: workspace.id, skipped: true, status: status.status });
      continue;
    }
    const result = await runAgent({
      dryRun: body.dryRun ?? process.env.AGENT_DRY_RUN !== "false",
      workspaceId: workspace.id,
    });
    results.push({
      workspaceId: workspace.id,
      skipped: false,
      runId: result.run.id,
      summary: result.run.summary,
    });
  }

  return NextResponse.json({ workspaces: results });
}
