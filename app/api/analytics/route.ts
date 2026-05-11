import { NextResponse } from "next/server";
import { apiError, requireWorkspaceForApi } from "@/lib/auth";
import { listLeads } from "@/lib/database";

export const runtime = "nodejs";

interface VapiCall {
  id: string;
  status: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  metadata?: Record<string, string>;
}

export async function GET() {
  try {
    const workspace = await requireWorkspaceForApi();
  const apiKey = process.env.VAPI_API_KEY;

  // Fetch Vapi calls (last 100)
  let calls: VapiCall[] = [];
  if (apiKey) {
    try {
      const res = await fetch("https://api.vapi.ai/call?limit=100&sortOrder=DESC", {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: 0 },
      });
      if (res.ok) {
        calls = (await res.json()) as VapiCall[];
      }
    } catch {
      // ignore — return zeros
    }
  }

  const leads = await listLeads(workspace.id);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endedCalls = calls.filter((c) => c.status === "ended" || c.endedReason);
  const callsToday = calls.filter((c) => c.startedAt && new Date(c.startedAt) >= startOfToday);
  const callsThisWeek = calls.filter((c) => c.startedAt && new Date(c.startedAt) >= startOfWeek);

  const bookedCalls = endedCalls.filter((c) =>
    c.endedReason?.includes("customer-ended") === false &&
    c.metadata?.outcome === "booked"
  );

  // Count booked by checking endedReason patterns that indicate booking
  const bookedThisWeek = callsThisWeek.filter(
    (c) => c.endedReason && !c.endedReason.includes("no-answer") && !c.endedReason.includes("voicemail") && !c.endedReason.includes("error") && !c.endedReason.includes("failed")
  ).length;

  const conversionRate =
    endedCalls.length > 0
      ? Math.round((bookedCalls.length / endedCalls.length) * 100)
      : 0;

  return NextResponse.json({
    totalLeads: leads.length,
    activeLeads: leads.filter((lead) => !["booked", "not_interested", "dnc"].includes(lead.status ?? "new")).length,
    bookedLeads: leads.filter((lead) => lead.status === "booked").length,
    followUpLeads: leads.filter((lead) => lead.status === "follow_up" || lead.status === "voicemail").length,
    callsToday: callsToday.length,
    callsThisWeek: callsThisWeek.length,
    totalCalls: calls.length,
    bookedThisWeek,
    bookedTotal: bookedCalls.length,
    conversionRate,
    endedCalls: endedCalls.length,
  });
  } catch (error) {
    return apiError(error);
  }
}
