import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { REVALIDATE_SECRET } from "@/lib/env";
import {
  BRAND_TAG,
  BUSINESS_TAG,
  WEBSITE_TAG,
  brandTag,
  businessTag,
  websiteTag,
} from "@/lib/cache/tags";

/**
 * Cache invalidation hook for admin-api.
 *
 * The listing, brand and website pages are ISR with a 600s floor, so this is
 * an ACCELERATOR, not a correctness requirement: a missed or failed call costs
 * at most one revalidate window of staleness. That is deliberate — it means
 * admin-api can add call sites incrementally (publish first, content edits
 * later) without any of them being load-bearing.
 *
 *   POST /api/revalidate/business
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "locations": ["salon-x", "412"], "brands": ["glow-atelier"] }
 *
 * `locations` are the LOCATION slugs (or numeric ids) that appear in
 * /business/<slug> URLs — a business with three locations has three pages and
 * should send all three. `brands` are businessSlugs, and each one flushes BOTH
 * pages addressed by that slug: /brand/<slug> and the published Website Builder
 * microsite at /<slug>. They share a key, so they can never drift apart and
 * admin-api needs no second array. `{ "all": true }` flushes every listing,
 * brand and website page; use it for a taxonomy-wide change, not per business.
 *
 * Revalidation uses the "max" profile: tagged entries are marked stale and
 * refreshed in the background on next visit, so a publish never causes a
 * thundering herd of blocking rebuilds.
 */

const MAX_ENTRIES = 200;

function authorized(req: NextRequest): boolean {
  if (!REVALIDATE_SECRET) return false;
  const provided = req.headers.get("x-revalidate-secret");
  if (!provided) return false;
  // Hash both sides so the compare is over equal-length buffers and the
  // secret's length isn't leaked by the timing of a length check.
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(REVALIDATE_SECRET).digest();
  return timingSafeEqual(a, b);
}

function slugList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, MAX_ENTRIES);
}

type Payload = {
  locations?: unknown;
  brands?: unknown;
  all?: unknown;
};

export async function POST(req: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET not configured" },
      { status: 500 },
    );
  }

  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const revalidated: string[] = [];

  if (body.all === true) {
    revalidateTag(BUSINESS_TAG, "max");
    revalidateTag(BRAND_TAG, "max");
    revalidateTag(WEBSITE_TAG, "max");
    revalidated.push(BUSINESS_TAG, BRAND_TAG, WEBSITE_TAG);
    return NextResponse.json({ revalidated });
  }

  const locations = slugList(body.locations);
  const brands = slugList(body.brands);

  if (!locations.length && !brands.length) {
    return NextResponse.json(
      { error: "Nothing to revalidate: send `locations`, `brands`, or `all`" },
      { status: 400 },
    );
  }

  for (const slug of locations) {
    const tag = businessTag(slug);
    revalidateTag(tag, "max");
    revalidated.push(tag);
  }
  for (const slug of brands) {
    // One payload key, two pages: the brand page and the microsite.
    for (const tag of [brandTag(slug), websiteTag(slug)]) {
      revalidateTag(tag, "max");
      revalidated.push(tag);
    }
  }

  return NextResponse.json({ revalidated });
}
