import { getWorkspaceSettings, listLeads, upsertLeads } from "@/lib/database";
import { isCallablePhone, isOnDNC, normalise } from "@/lib/dnc";
import type { CampaignLane, LeadContactType, LeadStatus } from "@/lib/types";

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
  status?: LeadStatus;
  statusUpdatedAt?: string;
  callAttempts?: number;
  contactType?: LeadContactType;
  source?: string | null;
  consentNote?: string | null;
  serviceNeed?: string | null;
  serviceArea?: string | null;
  estimateValueCents?: number | null;
  campaignLane?: CampaignLane | null;
  playbook?: string | null;
}

export interface ScrapeResult {
  city: string;
  leads: Lead[];
  scrapedAt: string;
}

// ─── Yelp categories to search ────────────────────────────────────────────────

const DEFAULT_YELP_CATEGORIES = [
  "autorepair",
  "hair",
  "contractors",
  "chiropractors",
  "restaurants",
  "retail",
];

// Categories that score higher (high-value for web services)
const HIGH_VALUE_CATEGORIES = ["autorepair", "contractors", "chiropractors", "dentists", "lawyers"];

// User-facing category names → Yelp aliases. Onboarding lets users type
// freeform, so this normalises common variants. Anything unmapped passes
// through with whitespace stripped so genuine Yelp aliases still work.
const CATEGORY_ALIASES: Record<string, string> = {
  "auto repair": "autorepair",
  "auto repairs": "autorepair",
  automotive: "autorepair",
  "automotive repair": "autorepair",
  mechanics: "autorepair",
  salons: "hair",
  salon: "hair",
  "hair salon": "hair",
  "hair salons": "hair",
  barbers: "barbers",
  barbershops: "barbers",
  barbershop: "barbers",
  contractors: "contractors",
  contractor: "contractors",
  chiropractors: "chiropractors",
  chiropractor: "chiropractors",
  dentists: "dentists",
  dentist: "dentists",
  lawyers: "lawyers",
  attorneys: "lawyers",
  restaurants: "restaurants",
  restaurant: "restaurants",
  retail: "retail",
  shops: "retail",
  "retail stores": "retail",
};

function mapToYelpCategory(input: string): string {
  const k = input.trim().toLowerCase();
  return CATEGORY_ALIASES[k] ?? k.replace(/[^a-z0-9]/g, "");
}

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

async function readLeads(workspaceId?: string): Promise<Lead[]> {
  return listLeads(workspaceId);
}

async function persistLeads(leads: Lead[], workspaceId?: string): Promise<void> {
  upsertLeads(leads, workspaceId);
}

// ─── Score a lead ─────────────────────────────────────────────────────────────

function scoreLead(
  business: YelpBusiness,
  category: string,
  websiteStatus: Lead["websiteStatus"]
): number {
  let score = 5;

  // Website status — derived from a real fetch when possible
  if (websiteStatus === "none" && !business.is_claimed) score += 3;
  else if (websiteStatus === "none") score += 2;
  else if (websiteStatus === "outdated") score += 1;
  else if (websiteStatus === "modern") score -= 2; // probably has marketing already

  // High-value category bonus
  if (HIGH_VALUE_CATEGORIES.includes(category)) score += 1;

  // Low review count = less established online presence
  if (business.review_count < 20) score += 1;
  else if (business.review_count > 200) score -= 1;

  // Low rating might mean they need help, but don't target 1-star
  if (business.rating >= 3.5 && business.rating <= 4.2) score += 1;

  return Math.min(10, Math.max(1, score));
}

// Fetch the URL with a tight timeout and grade it on a few signals. We're
// not trying to lighthouse-score these sites — we just need a coarse signal
// of whether the business has a serious modern web presence (skip them) or
// something old/broken (target them).
async function checkWebsiteQuality(url: string): Promise<Lead["websiteStatus"]> {
  if (!url) return "none";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ProspktBot/1.0; +https://prospkt.ai/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return "none";
    const html = (await res.text()).slice(0, 200_000); // cap at 200KB
    const lower = html.toLowerCase();

    let modern = 0;
    let outdated = 0;

    if (/<meta[^>]+name=["']?viewport/.test(lower)) modern++;
    if (/<link[^>]+rel=["']?manifest/.test(lower)) modern++;
    if (
      /(react|vue|next\.js|astro|sveltekit|gatsby|nuxt|webflow|squarespace|shopify)/.test(
        lower
      )
    )
      modern++;
    if (/<picture[\s>]|srcset=/.test(lower)) modern++;
    if (/<script[^>]+type=["']?module/.test(lower)) modern++;

    if (/<frameset|<frame[\s>]/.test(lower)) outdated += 2;
    if (/<font[\s>]|<center>|<marquee/.test(lower)) outdated++;
    if (/application\/x-shockwave-flash/.test(lower)) outdated += 2;
    if (/jquery-1\.[0-9]\.|prototype\.js|mootools/.test(lower)) outdated++;
    // No charset meta in first 500 chars suggests a very old or template-built site
    if (!/<meta[^>]+charset/i.test(html.slice(0, 500))) outdated++;

    if (outdated >= modern && outdated >= 2) return "outdated";
    if (modern >= 3) return "modern";
    return "outdated"; // ambiguous → treat as outdated; still a valid sales target
  } catch {
    return "none"; // unreachable, blocked, or timeout = no functional web presence
  }
}

function preliminaryWebsiteStatus(business: YelpBusiness): Lead["websiteStatus"] {
  if (!business.website) return "none";
  return "outdated"; // placeholder until checkWebsiteQuality runs
}

// ─── Fetch from Yelp ──────────────────────────────────────────────────────────

async function searchYelp(
  location: string,
  category: string,
  limit = 10
): Promise<YelpBusiness[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) throw new Error("YELP_API_KEY is not set");

  const params = new URLSearchParams({
    location,
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

export interface ScrapeOptions {
  /** Yelp categories (user-friendly names ok); falls back to workspace settings or defaults. */
  categories?: string[];
  /** Two-letter state code; defaults to "MI" for backwards compat. */
  state?: string;
  /** Per-category result count from Yelp. */
  perCategoryLimit?: number;
}

export async function scrapeCity(
  city: string,
  workspaceId?: string,
  options: ScrapeOptions = {}
): Promise<Lead[]> {
  // Resolve category list: explicit → workspace settings → default
  const settings = workspaceId ? getWorkspaceSettings(workspaceId) : null;
  const sourceCategories =
    options.categories?.length
      ? options.categories
      : settings?.targetCategories?.length
      ? settings.targetCategories
      : DEFAULT_YELP_CATEGORIES;
  const yelpCategories = Array.from(
    new Set(sourceCategories.map(mapToYelpCategory).filter(Boolean))
  );

  const state = options.state ?? "MI";
  const location = `${city}, ${state}`;
  const perCategoryLimit = options.perCategoryLimit ?? 8;

  const allBusinesses: { business: YelpBusiness; category: string }[] = [];

  // Fetch each category (run sequentially to respect rate limits)
  for (const category of yelpCategories) {
    try {
      const businesses = await searchYelp(location, category, perCategoryLimit);
      for (const b of businesses) {
        allBusinesses.push({ business: b, category });
      }
    } catch (err) {
      console.error(`[scraper] Yelp error for ${category} in ${location}:`, err);
    }
  }

  const now = new Date().toISOString();

  // Deduplicate by Yelp ID *and* normalised phone — same business sometimes
  // appears under multiple categories with different IDs.
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const candidates: {
    business: YelpBusiness;
    category: string;
    phone: string;
  }[] = [];

  for (const { business: b, category } of allBusinesses) {
    if (seenIds.has(b.id)) continue;
    seenIds.add(b.id);

    const phone = normalise(b.phone);
    if (!isCallablePhone(phone) || seenPhones.has(phone)) continue;
    if (await isOnDNC(phone, workspaceId)) continue;
    seenPhones.add(phone);

    candidates.push({ business: b, category, phone });
  }

  // Run website-quality checks concurrently — these are network-bound and
  // unrelated to each other, so awaiting them sequentially would dominate
  // total scrape time.
  const websiteStatuses = await Promise.all(
    candidates.map(({ business }) =>
      business.website
        ? checkWebsiteQuality(business.website)
        : Promise.resolve(preliminaryWebsiteStatus(business))
    )
  );

  const leads: Lead[] = candidates.map(({ business: b, category, phone }, i) => {
    const address = [b.location.address1, b.location.city, b.location.state, b.location.zip_code]
      .filter(Boolean)
      .join(", ");
    const websiteStatus = websiteStatuses[i];

    return {
      id: `yelp-${b.id}`,
      name: b.name,
      phone,
      address,
      category: b.categories[0]?.title ?? category,
      city: b.location.city || city,
      websiteStatus,
      priorityScore: scoreLead(b, category, websiteStatus),
      yelpUrl: b.url,
      yelpRating: b.rating,
      yelpReviewCount: b.review_count,
      scrapedAt: now,
      status: "new",
      statusUpdatedAt: now,
      callAttempts: 0,
      contactType: "business",
      source: "Yelp business listing",
      consentNote: "Public business listing; verify outreach basis before live dialing.",
      serviceNeed: "New customer outreach",
      serviceArea: address,
      estimateValueCents: null,
      campaignLane: "cold_b2b",
      playbook: "new-customer-outreach",
    };
  });

  // Sort by priority descending
  leads.sort((a, b) => b.priorityScore - a.priorityScore);

  return leads;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scrapeAndSave(
  city: string,
  workspaceId?: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const newLeads = await scrapeCity(city, workspaceId, options);

  const existing = await readLeads(workspaceId);
  const existingIds = new Set(existing.map((l) => l.id));
  const existingPhones = new Set(existing.map((l) => l.phone));
  const deduped = newLeads.filter(
    (l) => !existingIds.has(l.id) && !existingPhones.has(l.phone)
  );
  const merged = [...existing, ...deduped];

  await persistLeads(merged, workspaceId);

  return {
    city,
    leads: deduped,
    scrapedAt: new Date().toISOString(),
  };
}
