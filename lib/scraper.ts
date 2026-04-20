import fs from "fs/promises";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: string;
  city: string;
  websiteStatus: "none" | "outdated" | "modern";
  priorityScore: number; // 1–10
  yelpUrl?: string;
  yelpRating?: number;
  yelpReviewCount?: number;
  scrapedAt: string;
}

export interface ScrapeResult {
  city: string;
  leads: Lead[];
  scrapedAt: string;
}

// ─── Yelp categories to search ────────────────────────────────────────────────

const YELP_CATEGORIES = [
  "autorepair",
  "hair",
  "contractors",
  "chiropractors",
  "restaurants",
  "retail",
];

// Categories that score higher (high-value for web services)
const HIGH_VALUE_CATEGORIES = ["autorepair", "contractors", "chiropractors"];

// ─── Yelp business type ───────────────────────────────────────────────────────

interface YelpBusiness {
  id: string;
  name: string;
  phone: string;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  categories: { alias: string; title: string }[];
  url: string;
  rating: number;
  review_count: number;
  is_claimed: boolean;
  website?: string;
}

interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

async function readLeadsFile(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf-8");
    return JSON.parse(raw) as Lead[];
  } catch {
    return [];
  }
}

async function writeLeadsFile(leads: Lead[]): Promise<void> {
  await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

// ─── Score a lead ─────────────────────────────────────────────────────────────

function scoreLead(business: YelpBusiness, category: string): number {
  let score = 5;

  // No website = highest priority
  if (!business.website && !business.is_claimed) score += 3;
  else if (!business.website) score += 2;

  // High-value category bonus
  if (HIGH_VALUE_CATEGORIES.includes(category)) score += 1;

  // Low review count = less established online presence
  if (business.review_count < 20) score += 1;
  else if (business.review_count > 200) score -= 1;

  // Low rating might mean they need help, but don't target 1-star
  if (business.rating >= 3.5 && business.rating <= 4.2) score += 1;

  return Math.min(10, Math.max(1, score));
}

function inferWebsiteStatus(business: YelpBusiness): Lead["websiteStatus"] {
  if (!business.website && !business.is_claimed) return "none";
  if (!business.website) return "none";
  return "outdated"; // We can't check the actual site, default to outdated
}

// ─── Fetch from Yelp ──────────────────────────────────────────────────────────

async function searchYelp(
  city: string,
  category: string,
  limit = 10
): Promise<YelpBusiness[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) throw new Error("YELP_API_KEY is not set");

  const params = new URLSearchParams({
    location: `${city}, MI`,
    categories: category,
    limit: String(limit),
    sort_by: "rating",
  });

  const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yelp API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as YelpSearchResponse;
  return data.businesses ?? [];
}

// ─── Core scraper ─────────────────────────────────────────────────────────────

export async function scrapeCity(city: string): Promise<Lead[]> {
  const allBusinesses: { business: YelpBusiness; category: string }[] = [];

  // Fetch each category (run sequentially to respect rate limits)
  for (const category of YELP_CATEGORIES) {
    try {
      const businesses = await searchYelp(city, category, 8);
      for (const b of businesses) {
        allBusinesses.push({ business: b, category });
      }
    } catch (err) {
      console.error(`[scraper] Yelp error for ${category} in ${city}:`, err);
    }
  }

  const now = new Date().toISOString();

  // Deduplicate by Yelp ID
  const seen = new Set<string>();
  const leads: Lead[] = [];

  for (const { business: b, category } of allBusinesses) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);

    // Skip if no phone number
    if (!b.phone) continue;

    const address = [b.location.address1, b.location.city, b.location.state, b.location.zip_code]
      .filter(Boolean)
      .join(", ");

    leads.push({
      id: `yelp-${b.id}`,
      name: b.name,
      phone: b.phone,
      address,
      category: b.categories[0]?.title ?? category,
      city: b.location.city || city,
      websiteStatus: inferWebsiteStatus(b),
      priorityScore: scoreLead(b, category),
      yelpUrl: b.url,
      yelpRating: b.rating,
      yelpReviewCount: b.review_count,
      scrapedAt: now,
    });
  }

  // Sort by priority descending
  leads.sort((a, b) => b.priorityScore - a.priorityScore);

  return leads;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scrapeAndSave(city: string): Promise<ScrapeResult> {
  const newLeads = await scrapeCity(city);

  const existing = await readLeadsFile();
  const existingKeys = new Set(existing.map((l) => l.id));
  const deduped = newLeads.filter((l) => !existingKeys.has(l.id));
  const merged = [...existing, ...deduped];

  await writeLeadsFile(merged);

  return {
    city,
    leads: deduped,
    scrapedAt: new Date().toISOString(),
  };
}
