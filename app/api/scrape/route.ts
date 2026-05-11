import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { scrapeAndSave } from "@/lib/scraper";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceRole(["owner", "admin"]);
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();

  if (!city) {
    return NextResponse.json(
      { error: "Missing required query parameter: city" },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const result = await scrapeAndSave(city, workspaceId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
