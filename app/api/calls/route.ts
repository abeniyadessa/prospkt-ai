import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.vapi.ai/call?limit=50&sortOrder=DESC", {
      headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Vapi error: ${text}` }, { status: 500 });
    }

    const data = (await res.json()) as unknown[];
    return NextResponse.json({ calls: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
