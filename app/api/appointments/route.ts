import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.cal.com/v2/bookings?status=upcoming&limit=50",
      {
        headers: {
          Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
          "cal-api-version": "2024-08-13",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Cal.com error: ${text}` }, { status: 500 });
    }

    const data = (await res.json()) as { data: unknown[] };
    return NextResponse.json({ appointments: data.data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
