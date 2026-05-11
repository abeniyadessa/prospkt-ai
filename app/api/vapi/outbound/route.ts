import { NextRequest, NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { callLead } from "@/lib/agents/caller";
import { evaluateLeadGuardrails } from "@/lib/agents/guardrails";
import { getAgentSettings, getLead, updateLeadLifecycle } from "@/lib/database";
import type { Lead } from "@/lib/types";
import type { LeadContext } from "@/lib/claude";

export const runtime = "nodejs";

interface OutboundRequest extends LeadContext {
  phone: string;
  leadId: string;
  address?: string;
  state?: string;
  timezone?: string;
}

function requestToLead(body: OutboundRequest, stored: Lead | null): Lead {
  return {
    id: body.leadId,
    name: body.name,
    phone: body.phone,
    address: body.address ?? stored?.address ?? "",
    category: body.category,
    city: body.city,
    state: body.state ?? stored?.state,
    timezone: body.timezone ?? stored?.timezone,
    websiteStatus: body.websiteStatus,
    priorityScore: body.priorityScore,
    scrapedAt: stored?.scrapedAt ?? new Date().toISOString(),
    yelpUrl: stored?.yelpUrl,
    yelpRating: stored?.yelpRating,
    yelpReviewCount: stored?.yelpReviewCount,
    status: stored?.status ?? "new",
    statusUpdatedAt: stored?.statusUpdatedAt,
    lastCallAt: stored?.lastCallAt,
    callAttempts: stored?.callAttempts,
    nextFollowUpAt: stored?.nextFollowUpAt,
    notes: stored?.notes,
  };
}

export async function POST(request: NextRequest) {
  let workspaceId: string;
  try {
    const workspace = await requireWorkspaceForApi();
    workspaceId = workspace.id;
  } catch (error) {
    return apiError(error);
  }

  let body: OutboundRequest;
  try {
    body = (await request.json()) as OutboundRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.phone || !body.leadId) {
    return NextResponse.json(
      { error: "Missing required fields: phone, leadId" },
      { status: 400 }
    );
  }

  try {
    const stored = await getLead(body.leadId, workspaceId);
    const lead = requestToLead(body, stored);
    const guardrail = await evaluateLeadGuardrails(
      lead,
      getAgentSettings(workspaceId),
      "live",
      new Date(),
      workspaceId
    );

    if (!guardrail.eligible) {
      if (guardrail.reason?.toLowerCase().includes("dnc")) {
        await updateLeadLifecycle(body.leadId, { status: "dnc" }, workspaceId);
      }
      return NextResponse.json(
        { error: guardrail.reason ?? "Guardrail blocked this call" },
        { status: 403 }
      );
    }

    const call = await callLead(lead, guardrail.timezone, workspaceId);
    return NextResponse.json({ callId: call.id, status: call.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[vapi/outbound] FULL ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
