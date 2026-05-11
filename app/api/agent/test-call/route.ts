import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireWorkspaceRole } from "@/lib/auth";
import { placeAdHocCall } from "@/lib/agents/caller";
import { isOnDNC } from "@/lib/dnc";

export const runtime = "nodejs";

const E164 = /^\+[1-9]\d{6,14}$/;

const testCallSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(E164, "Phone must be E.164 format, e.g. +15551234567"),
  businessName: z.string().trim().min(1).max(120).default("Test contact"),
  category: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  websiteStatus: z.enum(["none", "outdated", "modern"]).optional(),
  contactType: z.enum(["business", "consumer"]).optional(),
  source: z.string().trim().max(160).optional(),
  consentNote: z.string().trim().max(240).optional(),
  serviceNeed: z.string().trim().max(160).optional(),
  serviceArea: z.string().trim().max(160).optional(),
  campaignLane: z.enum(["warm_recovery", "cold_b2b", "cold_consumer"]).optional(),
  playbook: z.string().trim().max(100).optional(),
  skipDnc: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceRole(["owner", "admin"]);
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  let body: z.infer<typeof testCallSchema>;
  try {
    const raw = await request.json();
    body = testCallSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.skipDnc) {
    const blocked = await isOnDNC(body.phone, workspaceId);
    if (blocked) {
      return NextResponse.json(
        {
          error:
            "This number is on the Do-Not-Call list. Tick 'I own this number' if you're calling your own phone for testing.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const call = await placeAdHocCall({
      phone: body.phone,
      businessName: body.businessName,
      category: body.category,
      city: body.city,
      websiteStatus: body.websiteStatus,
      contactType: body.contactType,
      source: body.source,
      consentNote: body.consentNote,
      serviceNeed: body.serviceNeed,
      serviceArea: body.serviceArea,
      campaignLane: body.campaignLane,
      playbook: body.playbook,
      workspaceId,
    });
    return NextResponse.json({ callId: call.id, status: call.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/test-call] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
