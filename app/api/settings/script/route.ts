import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SCRIPT_FILE = path.join(process.cwd(), "data", "script-override.json");

interface ScriptOverride {
  systemPromptSuffix: string; // appended to the generated system prompt
  firstMessageTemplate: string; // if set, replaces Claude-generated firstMessage
  updatedAt: string;
}

export async function GET() {
  try {
    const raw = await fs.readFile(SCRIPT_FILE, "utf-8");
    return NextResponse.json(JSON.parse(raw) as ScriptOverride);
  } catch {
    return NextResponse.json({
      systemPromptSuffix: "",
      firstMessageTemplate: "",
      updatedAt: "",
    });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<ScriptOverride>;
  const override: ScriptOverride = {
    systemPromptSuffix: body.systemPromptSuffix ?? "",
    firstMessageTemplate: body.firstMessageTemplate ?? "",
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(SCRIPT_FILE), { recursive: true });
  await fs.writeFile(SCRIPT_FILE, JSON.stringify(override, null, 2));
  return NextResponse.json({ saved: true, updatedAt: override.updatedAt });
}
