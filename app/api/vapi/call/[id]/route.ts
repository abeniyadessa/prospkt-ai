import { NextRequest, NextResponse } from "next/server";

// GET /api/vapi/call/[id] — poll a single Vapi call's status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VAPI_API_KEY not set" }, { status: 500 });
  }

  const res = await fetch(`https://api.vapi.ai/call/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch call" }, { status: res.status });
  }

  const call = await res.json();
  return NextResponse.json(call);
}
