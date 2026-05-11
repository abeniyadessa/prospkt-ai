import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceSettings, listRunnableWorkspaces } from "@/lib/database";
import { scrapeAndSave } from "@/lib/scraper";

export const runtime = "nodejs";

// Vercel cron hits this every morning at 8am ET.
// Rotates through each workspace's configured target cities so multi-tenant
// installs aren't all stuck pulling Michigan leads.

const DEFAULT_CITY_ROTATION = [
  "Grand Rapids",
  "Detroit",
  "Ann Arbor",
  "Lansing",
  "Kalamazoo",
  "Flint",
  "Troy",
  "Farmington Hills",
];

function dayOfYear() {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = dayOfYear();

  try {
    const workspaces = listRunnableWorkspaces();
    const results = [];
    for (const workspace of workspaces) {
      const settings = getWorkspaceSettings(workspace.id);
      const cities =
        settings?.targetCities?.length
          ? settings.targetCities
          : DEFAULT_CITY_ROTATION;
      const city = cities[today % cities.length];

      try {
        const result = await scrapeAndSave(city, workspace.id);
        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          city,
          newLeads: result.leads.length,
        });
        console.log(
          `[cron] Scraped ${result.leads.length} new leads from ${city} for ${workspace.name}`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[cron] Scrape failed for workspace ${workspace.id} (${city}):`,
          message
        );
        results.push({
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          city,
          newLeads: 0,
          error: message,
        });
      }
    }
    return NextResponse.json({
      workspaces: results,
      scrapedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Scrape failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
