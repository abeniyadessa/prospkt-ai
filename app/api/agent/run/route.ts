import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { getAgentStatusPayload } from "@/lib/database";
import { runAgent } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceRole(["owner", "admin"]);
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  let body: { dryRun?: boolean } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean };
  } catch {
    body = {};
  }

  const defaultDryRun = process.env.AGENT_DRY_RUN !== "false";
  const result = await runAgent({ dryRun: body.dryRun ?? defaultDryRun, workspaceId });
  return NextResponse.json({
    runId: result.run.id,
    run: result.run,
    events: result.events,
    status: await getAgentStatusPayload(workspaceId),
  });
}
