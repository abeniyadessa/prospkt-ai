import { NextRequest, NextResponse } from "next/server";
import { getDNCList, addToDNC } from "@/lib/dnc";
import fs from "fs/promises";
import path from "path";

const DNC_FILE = path.join(process.cwd(), "data", "dnc.json");

// GET /api/dnc — return the full DNC list
export async function GET() {
  const list = await getDNCList();
  return NextResponse.json({ numbers: list });
}

// DELETE /api/dnc — remove a number from the DNC list
export async function DELETE(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Missing phone param" }, { status: 400 });
  }

  const list = await getDNCList();
  const updated = list.filter((n) => n !== phone);
  await fs.mkdir(path.dirname(DNC_FILE), { recursive: true });
  await fs.writeFile(DNC_FILE, JSON.stringify(updated, null, 2), "utf-8");

  return NextResponse.json({ removed: phone, remaining: updated.length });
}

// POST /api/dnc — manually add a number
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { phone?: string };
  if (!body.phone) {
    return NextResponse.json({ error: "Missing phone in body" }, { status: 400 });
  }
  await addToDNC(body.phone);
  return NextResponse.json({ added: body.phone });
}
