import { NextResponse } from "next/server";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { getTodayCallCount } from "@/lib/vapi";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireWorkspaceRole(["owner", "admin"]);
  } catch (error) {
    return apiError(error);
  }

  try {
    const usage = await getTodayCallCount();
    return NextResponse.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
