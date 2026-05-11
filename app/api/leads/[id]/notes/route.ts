import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { addActivity, getLead } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
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

  let body: { body?: string; createdBy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }

  const lead = await getLead(id, workspaceId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const activity = addActivity({
    leadId: id,
    type: "note",
    body: text,
    createdBy: body.createdBy ?? "user",
  }, workspaceId);

  return NextResponse.json({ activity });
}
