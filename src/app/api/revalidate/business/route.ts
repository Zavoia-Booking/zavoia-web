import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALES } from "@/i18n/locales";
import { REVALIDATE_SECRET } from "@/lib/env";
import {
  BRAND_TAG,
  DISCOVERY_TAG,
  TAXONOMY_TAG,
  BUSINESS_TAG,
  SITEMAP_TAG,
  WEBSITE_TAG,
  brandTag,
  businessTag,
  websiteTag,
} from "@/lib/cache/tags";

/**
 * Cache invalidation hook for admin-api.
 *
 * Location keys expire immediately. The existing backend contract uses the
 * same payload for content edits and visibility changes, so background refresh
 * cannot safely distinguish a stale description from a now-private location.
 * Brand-only content and ordinary website updates retain background refresh.
 *
 *   POST /api/revalidate/business
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *   { "locations": ["salon-x", "412"], "brands": ["glow-atelier"] }
 *   { "websites": ["glow-atelier"] }
 *
 * `locations` are the LOCATION slugs (or numeric ids) that appear in
 * /business/<slug> URLs — a business with three locations has three pages and
 * should send all three. `brands` are businessSlugs, and each one flushes BOTH
 * pages addressed by that slug: /brand/<slug> and the published Website Builder
 * microsite at /<slug>. `websites` also names businessSlugs and is used for
 * publish, unpublish and deletion: it expires website data immediately and
 * invalidates each internal locale route. Every accepted payload also expires
 * the sitemap inventory. `{ "all": true }` expires location/brand data and
 * marks website data stale for a taxonomy-wide change.
 *
 * The response acknowledges cache invalidation; it does not warm pages or
 * invalidate copies already held by a visitor's browser or social platform.
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

function slugList(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ENTRIES
    || value.some(v => typeof v !== "string" || !v.trim())) return null;
  return [...new Set(value.map((v: string) => v.trim()))];
}

type Payload = {
  locations?: unknown;
  brands?: unknown;
  websites?: unknown;
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

  if (!body || typeof body !== "object" || Array.isArray(body)
    || (body.all !== undefined && typeof body.all !== "boolean")) {
    return NextResponse.json({ error: "Invalid revalidation payload" }, { status: 400 });
  }

  const locations = slugList(body.locations);
  const brands = slugList(body.brands);
  const websites = slugList(body.websites);
  if (!locations || !brands || !websites) {
    return NextResponse.json({ error: `Keys must be arrays of at most ${MAX_ENTRIES} nonempty strings` }, { status: 400 });
  }

  const revalidated: string[] = [];
  const revalidatedPaths: string[] = [];
  const invalidatePath = (path: string) => {
    revalidatePath(path);
    revalidatedPaths.push(path);
  };
  const invalidateSitemap = () => {
    revalidateTag(SITEMAP_TAG, { expire: 0 });
    revalidated.push(SITEMAP_TAG);
    invalidatePath("/sitemap.xml");
  };

  if (body.all === true) {
    revalidateTag(BUSINESS_TAG, { expire: 0 });
    revalidateTag(BRAND_TAG, { expire: 0 });
    revalidateTag(WEBSITE_TAG, "max");
    revalidateTag(DISCOVERY_TAG, { expire: 0 });
    revalidateTag(TAXONOMY_TAG, { expire: 0 });
    revalidated.push(BUSINESS_TAG, BRAND_TAG, WEBSITE_TAG, DISCOVERY_TAG, TAXONOMY_TAG);
    // Include cached unavailable routes whose upstream 404 had no data entry.
    revalidatePath("/[locale]/business/[slug]", "page");
    revalidatePath("/[locale]/brand/[slug]", "page");
    revalidatedPaths.push("/[locale]/business/[slug]", "/[locale]/brand/[slug]");
    invalidateSitemap();
    return NextResponse.json({ revalidated, revalidatedPaths });
  }

  const lifecycleWebsiteTags = new Set(websites.map(websiteTag));

  if (!locations.length && !brands.length && !websites.length) {
    return NextResponse.json(
      {
        error:
          "Nothing to revalidate: send `locations`, `brands`, `websites`, or `all`",
      },
      { status: 400 },
    );
  }

  // Membership, visibility, ratings and identity can affect either home feed.
  // Expire immediately so the next request cannot reuse a now-hidden listing.
  revalidateTag(DISCOVERY_TAG, { expire: 0 });
  revalidated.push(DISCOVERY_TAG);

  for (const slug of locations) {
    const tag = businessTag(slug);
    revalidateTag(tag, { expire: 0 });
    revalidated.push(tag);
    // English public URLs are rewritten to the internal /en route.
    for (const locale of LOCALES) invalidatePath(`/${locale}/business/${encodeURIComponent(slug)}`);
  }
  for (const slug of brands) {
    const tag = brandTag(slug);
    // Locations also use brand data for sibling cards. Visibility changes must
    // not keep advertising the removed branch through a stale brand response.
    revalidateTag(tag, locations.length ? { expire: 0 } : "max");
    revalidated.push(tag);
    if (locations.length) {
      for (const locale of LOCALES) invalidatePath(`/${locale}/brand/${encodeURIComponent(slug)}`);
    }
    const website = websiteTag(slug);
    if (!lifecycleWebsiteTags.has(website)) {
      revalidateTag(website, "max");
      revalidated.push(website);
    }
  }

  for (const slug of websites) {
    const tag = websiteTag(slug);
    revalidateTag(tag, { expire: 0 });
    revalidated.push(tag);

    // English URLs are rewritten to /en/<slug>; invalidate the destination.
    for (const locale of LOCALES) {
      const path = `/${locale}/${encodeURIComponent(slug)}`;
      invalidatePath(path);
    }
  }
  invalidateSitemap();

  return NextResponse.json({ revalidated, revalidatedPaths });
}
