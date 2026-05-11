import { NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { getAgentStatusPayload } from "@/lib/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
    return NextResponse.json(await getAgentStatusPayload(workspace.id));
  } catch (error) {
    return apiError(error);
  }
}
