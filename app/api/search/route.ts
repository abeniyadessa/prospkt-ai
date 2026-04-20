import { NextRequest, NextResponse } from "next/server";

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
  error?: { description: string };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "Michigan";

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter: q" }, { status: 400 });
  }

  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YELP_API_KEY not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    term: q,
    location: city.toLowerCase().includes("michigan") ? city : `${city}, MI`,
    limit: "10",
    sort_by: "best_match",
  });

  try {
    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = (await res.json()) as YelpSearchResponse;

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.description ?? "Yelp API error" },
        { status: 500 }
      );
    }

    // Shape results the same as leads
    const results = (data.businesses ?? [])
      .filter((b) => b.phone)
      .map((b) => ({
        id: `yelp-${b.id}`,
        name: b.name,
        phone: b.phone,
        address: [b.location.address1, b.location.city, b.location.state]
          .filter(Boolean)
          .join(", "),
        category: b.categories[0]?.title ?? "Business",
        city: b.location.city,
        websiteStatus: (!b.website && !b.is_claimed ? "none" : "outdated") as
          | "none"
          | "outdated"
          | "modern",
        priorityScore: !b.website ? 9 : 6,
        yelpUrl: b.url,
        yelpRating: b.rating,
        yelpReviewCount: b.review_count,
        scrapedAt: new Date().toISOString(),
      }));

    return NextResponse.json({ results, total: data.total });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
