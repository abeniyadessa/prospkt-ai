import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { getScriptSettings, updateScriptSettings } from "@/lib/database";
import type { ScriptSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
    return NextResponse.json(getScriptSettings(workspace.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireWorkspaceForApi();
    const body = (await request.json()) as Partial<ScriptSettings>;
    const settings = updateScriptSettings(
      {
        systemPromptSuffix: body.systemPromptSuffix ?? "",
        firstMessageTemplate: body.firstMessageTemplate ?? "",
      },
      workspace.id
    );
    return NextResponse.json({ saved: true, ...settings });
  } catch (error) {
    return apiError(error);
  }
}
