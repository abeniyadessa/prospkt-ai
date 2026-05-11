import { NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";

export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
    const res = await fetch("https://api.vapi.ai/call?limit=50&sortOrder=DESC", {
      headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Vapi error: ${text}` }, { status: 500 });
    }

    const data = (await res.json()) as { metadata?: Record<string, string> }[];
    const calls = data.filter((call) => call.metadata?.workspaceId === workspace.id);
    return NextResponse.json({ calls });
  } catch (err) {
    return apiError(err);
  }
}
