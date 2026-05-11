import { NextResponse } from "next/server";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { addAgentEvent, getAgentStatusPayload, updateAgentSettings } from "@/lib/database";

export const runtime = "nodejs";

export async function POST() {
  try {
    const workspace = await requireWorkspaceRole(["owner", "admin"]);
    updateAgentSettings({ paused: true }, workspace.id);
    addAgentEvent(
      {
        type: "paused",
        severity: "warning",
        message: "Automation paused by owner",
      },
      workspace.id
    );
    return NextResponse.json(await getAgentStatusPayload(workspace.id));
  } catch (error) {
    return apiError(error);
  }
}
