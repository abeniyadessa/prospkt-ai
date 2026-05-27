import { NextResponse } from "next/server";
import { fetchAccessToken } from "hume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coarse in-memory rate limit so a single visitor can't burn the Hume free
// tier on the prelaunch page. Keyed by IP + 5-min window. Resets on cold
// start, which is fine for this scale.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 2; // 2 conversations per IP per 5 min

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

function rateLimit(ip: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(request: Request) {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { ok: false, error: "Voice demo is not configured." },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Skip rate limit in development so we can iterate freely. The limit only
  // exists to protect the free tier from public-page abuse in production.
  const skipRateLimit = process.env.NODE_ENV !== "production";

  if (!skipRateLimit) {
    const limit = rateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "You've already tried the demo a couple times. Try again in a few minutes.",
          retryAfterSeconds: Math.ceil((limit.resetIn ?? 0) / 1000),
        },
        { status: 429 }
      );
    }
  }

  try {
    const accessToken = await fetchAccessToken({ apiKey, secretKey });
    const configId = process.env.HUME_EVI_CONFIG_ID;
    return NextResponse.json({ ok: true, accessToken, configId });
  } catch (error) {
    console.error("Hume token exchange failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not start the voice demo. Try again in a moment." },
      { status: 502 }
    );
  }
}
