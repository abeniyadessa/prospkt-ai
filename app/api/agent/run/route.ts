import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { getAgentStatusPayload } from "@/lib/database";
import { runAgent } from "@/lib/agents/orchestrator";
import { isCampaignLane } from "@/lib/types";
import type { CampaignLane } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceRole(["owner", "admin"]);
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  let body: { dryRun?: boolean; campaignLane?: unknown; playbook?: unknown } = {};
  try {
    body = (await request.json()) as {
      dryRun?: boolean;
      campaignLane?: unknown;
      playbook?: unknown;
    };
  } catch {
    body = {};
  }

  let campaignLane: CampaignLane | undefined;
  if (body.campaignLane !== undefined) {
    if (!isCampaignLane(body.campaignLane)) {
      return NextResponse.json({ error: "Invalid campaign lane" }, { status: 400 });
    }
    campaignLane = body.campaignLane;
  }

  let playbook: string | undefined;
  if (body.playbook !== undefined) {
    if (typeof body.playbook !== "string" || !body.playbook.trim()) {
      return NextResponse.json({ error: "Invalid playbook" }, { status: 400 });
    }
    playbook = body.playbook.trim();
  }

  const defaultDryRun = process.env.AGENT_DRY_RUN !== "false";
  const result = await runAgent({
    dryRun: body.dryRun ?? defaultDryRun,
    workspaceId,
    campaignLane,
    playbook,
  });
  return NextResponse.json({
    runId: result.run.id,
    run: result.run,
    events: result.events,
    status: await getAgentStatusPayload(workspaceId),
  });
}
