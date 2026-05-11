import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { getDNCList, addToDNC } from "@/lib/dnc";
import { removeDncEntry } from "@/lib/database";

export const runtime = "nodejs";

// GET /api/dnc — return the full DNC list
export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
    const list = await getDNCList(workspace.id);
    return NextResponse.json({ numbers: list });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/dnc — remove a number from the DNC list
export async function DELETE(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceForApi();
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone param" }, { status: 400 });
  }

  const removed = await removeDncEntry(phone, workspaceId);
  const updated = await getDNCList(workspaceId);

  return NextResponse.json({ removed, remaining: updated.length });
}

// POST /api/dnc — manually add a number
export async function POST(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceForApi();
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  const body = (await request.json()) as { phone?: string };
  if (!body.phone) {
    return NextResponse.json({ error: "Missing phone in body" }, { status: 400 });
  }
  await addToDNC(body.phone, workspaceId);
  return NextResponse.json({ added: body.phone });
}
