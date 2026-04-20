import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "data", "leads.json");
    const raw = await fs.readFile(file, "utf-8");
    const leads = JSON.parse(raw);
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ leads: [] });
  }
}
