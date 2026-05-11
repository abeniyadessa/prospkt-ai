import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { completeOnboarding } from "@/lib/database";

export const runtime = "nodejs";

const onboardingSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  userRole: z.string().trim().min(2).max(80).default("Owner"),
  timezone: z.string().trim().min(3).default("America/Detroit"),
  offer: z.string().trim().min(6).max(1200),
  targetBuyer: z.string().trim().min(2).max(240),
  pitch: z.string().trim().max(1200).default(""),
  targetCities: z.array(z.string().trim().min(1)).min(1).max(30),
  targetCategories: z.array(z.string().trim().min(1)).max(30).default([]),
  websiteStatuses: z
    .array(z.enum(["none", "outdated", "modern"]))
    .min(1)
    .default(["none", "outdated"]),
  maxCallsPerDay: z.number().int().min(1).max(100).default(20),
  maxCostPerDayCents: z.number().int().min(100).max(100_000).default(500),
  weekendPause: z.boolean().default(true),
  bookingEmail: z.string().trim().email().nullable().optional(),
  notificationEmail: z.string().trim().email().nullable().optional(),
  complianceAccepted: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireWorkspaceForApi();
    const raw = await request.json();
    const body = onboardingSchema.parse(raw);
    const onboarding = completeOnboarding({
      ...body,
      workspaceId: workspace.id,
      bookingEmail: body.bookingEmail ?? null,
      notificationEmail: body.notificationEmail ?? null,
    });
    return NextResponse.json({ onboarding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid onboarding payload" },
        { status: 400 }
      );
    }
    return apiError(error);
  }
}
