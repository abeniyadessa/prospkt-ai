import { NextRequest, NextResponse } from "next/server";
import { buildDailyDigest, getWorkspaceSettings, listRunnableWorkspaces } from "@/lib/database";
import { sendDailyDigest } from "@/lib/email";

export const runtime = "nodejs";

// Vercel cron hits this once a day to send each workspace its daily digest.
// Recipient resolves to workspace_settings.notificationEmail, falling back to
// PROSPKT_NOTIFICATION_EMAIL so single-tenant installs always get a copy.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fallbackRecipient = process.env.PROSPKT_NOTIFICATION_EMAIL?.trim();
  const sentDate = new Date();
  const results: {
    workspaceId: string;
    workspaceName: string;
    sent: boolean;
    reason?: string;
    bookings: number;
    callsTotal: number;
  }[] = [];

  try {
    const workspaces = listRunnableWorkspaces();
    for (const workspace of workspaces) {
      const settings = getWorkspaceSettings(workspace.id);
      const recipient = settings?.notificationEmail?.trim() || fallbackRecipient || "";
      const digest = buildDailyDigest(workspace.id, sentDate);
      try {
        const result = await sendDailyDigest(
          recipient,
          digest,
          settings?.timezone ?? workspace.timezone ?? "America/Detroit"
        );
        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          sent: result.sent,
          reason: result.reason,
          bookings: digest.bookings.length,
          callsTotal: digest.callsTotal,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[cron/digest] send failed for workspace ${workspace.id}:`,
          message
        );
        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          sent: false,
          reason: message,
          bookings: digest.bookings.length,
          callsTotal: digest.callsTotal,
        });
      }
    }
    return NextResponse.json({ workspaces: results, sentAt: sentDate.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/digest] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
