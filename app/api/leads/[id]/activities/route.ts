import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { listLeadActivities } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceForApi();
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }
  const { id } = await params;
  const activities = await listLeadActivities(id, 100, workspaceId);
  return NextResponse.json({ activities });
}
