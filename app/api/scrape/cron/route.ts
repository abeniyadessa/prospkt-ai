import { NextRequest, NextResponse } from "next/server";
import { scrapeAndSave } from "@/lib/scraper";

// Vercel cron hits this every morning at 8am ET.
// Rotates through Michigan cities so we get fresh leads daily.

const CITY_ROTATION = [
  "Grand Rapids",
  "Detroit",
  "Ann Arbor",
  "Lansing",
  "Kalamazoo",
  "Flint",
  "Troy",
  "Farmington Hills",
];

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick today's city based on day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const city = CITY_ROTATION[dayOfYear % CITY_ROTATION.length];

  try {
    const result = await scrapeAndSave(city);
    console.log(`[cron] Scraped ${result.leads.length} new leads from ${city}`);
    return NextResponse.json({
      city,
      newLeads: result.leads.length,
      scrapedAt: result.scrapedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Scrape failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
