import { NextResponse } from "next/server";
import { apiError, getCurrentWorkspaceContext } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getCurrentWorkspaceContext());
  } catch (error) {
    return apiError(error);
  }
}
