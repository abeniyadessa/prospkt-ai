import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { listLeads, updateLeadLifecycle } from "@/lib/database";
import { isCampaignLane, isLeadContactType, isLeadStatus } from "@/lib/types";
import type { CampaignLane, LeadContactType, LeadStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
    const leads = await listLeads(workspace.id);
    return NextResponse.json({ leads });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceForApi();
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  let body: {
    id?: unknown;
    status?: unknown;
    nextFollowUpAt?: unknown;
    notes?: unknown;
    contactType?: unknown;
    source?: unknown;
    consentNote?: unknown;
    serviceNeed?: unknown;
    serviceArea?: unknown;
    estimateValueCents?: unknown;
    campaignLane?: unknown;
    playbook?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.id !== "string" || !body.id.trim()) {
    return NextResponse.json({ error: "Missing lead id" }, { status: 400 });
  }

  let status: LeadStatus | undefined;
  if (body.status !== undefined) {
    if (!isLeadStatus(body.status)) {
      return NextResponse.json({ error: "Invalid lead status" }, { status: 400 });
    }
    status = body.status;
  }

  let nextFollowUpAt: string | null | undefined;
  if (body.nextFollowUpAt !== undefined) {
    if (body.nextFollowUpAt !== null && typeof body.nextFollowUpAt !== "string") {
      return NextResponse.json(
        { error: "nextFollowUpAt must be a string or null" },
        { status: 400 }
      );
    }
    nextFollowUpAt = body.nextFollowUpAt;
  }

  let notes: string | null | undefined;
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return NextResponse.json(
        { error: "notes must be a string or null" },
        { status: 400 }
      );
    }
    notes = body.notes;
  }

  let contactType: LeadContactType | undefined;
  if (body.contactType !== undefined) {
    if (!isLeadContactType(body.contactType)) {
      return NextResponse.json({ error: "Invalid contact type" }, { status: 400 });
    }
    contactType = body.contactType;
  }

  let source: string | null | undefined;
  if (body.source !== undefined) {
    if (body.source !== null && typeof body.source !== "string") {
      return NextResponse.json({ error: "source must be a string or null" }, { status: 400 });
    }
    source = body.source;
  }

  let consentNote: string | null | undefined;
  if (body.consentNote !== undefined) {
    if (body.consentNote !== null && typeof body.consentNote !== "string") {
      return NextResponse.json({ error: "consentNote must be a string or null" }, { status: 400 });
    }
    consentNote = body.consentNote;
  }

  let serviceNeed: string | null | undefined;
  if (body.serviceNeed !== undefined) {
    if (body.serviceNeed !== null && typeof body.serviceNeed !== "string") {
      return NextResponse.json({ error: "serviceNeed must be a string or null" }, { status: 400 });
    }
    serviceNeed = body.serviceNeed;
  }

  let serviceArea: string | null | undefined;
  if (body.serviceArea !== undefined) {
    if (body.serviceArea !== null && typeof body.serviceArea !== "string") {
      return NextResponse.json({ error: "serviceArea must be a string or null" }, { status: 400 });
    }
    serviceArea = body.serviceArea;
  }

  let estimateValueCents: number | null | undefined;
  if (body.estimateValueCents !== undefined) {
    if (
      body.estimateValueCents !== null &&
      (typeof body.estimateValueCents !== "number" ||
        !Number.isInteger(body.estimateValueCents) ||
        body.estimateValueCents < 0)
    ) {
      return NextResponse.json(
        { error: "estimateValueCents must be a positive integer or null" },
        { status: 400 }
      );
    }
    estimateValueCents = body.estimateValueCents;
  }

  let campaignLane: CampaignLane | null | undefined;
  if (body.campaignLane !== undefined) {
    if (body.campaignLane !== null && !isCampaignLane(body.campaignLane)) {
      return NextResponse.json({ error: "Invalid campaign lane" }, { status: 400 });
    }
    campaignLane = body.campaignLane ?? null;
  }

  let playbook: string | null | undefined;
  if (body.playbook !== undefined) {
    if (body.playbook !== null && typeof body.playbook !== "string") {
      return NextResponse.json({ error: "playbook must be a string or null" }, { status: 400 });
    }
    playbook = body.playbook;
  }

  const lead = await updateLeadLifecycle(
    body.id.trim(),
    {
      status,
      nextFollowUpAt,
      notes,
      contactType,
      source,
      consentNote,
      serviceNeed,
      serviceArea,
      estimateValueCents,
      campaignLane,
      playbook,
    },
    workspaceId
  );

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
