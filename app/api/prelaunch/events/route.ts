import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrelaunchEventRecord } from "@/lib/prelaunch-storage";

export const runtime = "nodejs";

const prelaunchEventSchema = z.object({
  name: z.enum([
    "prelaunch_view",
    "waitlist_submit",
    "waitlist_success",
    "waitlist_error",
  ]),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  path: z.string().trim().max(240).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  email: z.email().optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = prelaunchEventSchema.parse(await request.json());

    await createPrelaunchEventRecord({
      name: payload.name,
      source: payload.source || "prelaunch",
      path: payload.path || null,
      referrer: payload.referrer || request.headers.get("referer"),
      email: payload.email || null,
      metadata: payload.metadata ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid event payload." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Could not track prelaunch event." },
      { status: 500 }
    );
  }
}
