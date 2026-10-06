import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALES } from "@/i18n/locales";
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
 * Ordinary content updates use background revalidation. Website publication
 * changes use immediate expiration so a previously cached unavailable page or
 * published website cannot be served on the next server request.
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
 * invalidates each internal locale route plus the sitemap. `{ "all": true }`
 * marks every listing, brand and website page stale for a taxonomy-wide change.
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

function slugList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, MAX_ENTRIES);
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
  const websites = slugList(body.websites);
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

  for (const slug of locations) {
    const tag = businessTag(slug);
    revalidateTag(tag, "max");
    revalidated.push(tag);
  }
  for (const slug of brands) {
    // One payload key, two pages: the brand page and the microsite.
    for (const tag of [brandTag(slug), websiteTag(slug)]) {
      // A lifecycle request must expire this tag only once, below.
      if (lifecycleWebsiteTags.has(tag)) continue;
      revalidateTag(tag, "max");
      revalidated.push(tag);
    }
  }

  const revalidatedPaths: string[] = [];
  for (const slug of websites) {
    const tag = websiteTag(slug);
    revalidateTag(tag, { expire: 0 });
    revalidated.push(tag);

    // English URLs are rewritten to /en/<slug>; invalidate the destination.
    for (const locale of LOCALES) {
      const path = `/${locale}/${encodeURIComponent(slug)}`;
      revalidatePath(path);
      revalidatedPaths.push(path);
    }
  }
  if (websites.length) {
    revalidatePath("/sitemap.xml");
    revalidatedPaths.push("/sitemap.xml");
  }

  return NextResponse.json({ revalidated, revalidatedPaths });
}
