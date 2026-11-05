import "server-only";

import { getBrand } from "@/lib/api/marketplace/public";
import type { BrandLocation, ListingDetail } from "@/lib/api/marketplace/types";
import { BRAND_TAG, LISTING_REVALIDATE_SECONDS, brandTag } from "@/lib/cache/tags";

/** What the brand page knows about a location's brand and its other places. */
export interface LocationBrandSummary {
  averageRating: number | null;
  totalReviews: number;
  /** The brand page's card data for the other locations, keyed by location id. */
  locations: Record<number, BrandLocation>;
}

/**
 * The brand page's rating and location cards, read through its
 * own cache so a brand webhook refreshes both pages. Only a brand with other
 * locations needs them. Optional details must not make a usable location page
 * fail or wait indefinitely, so any failure keeps the listing's own names.
 */
export async function getLocationBrand(listing: ListingDetail): Promise<LocationBrandSummary | null> {
  const others = Array.isArray(listing.otherLocations) ? listing.otherLocations : [];
  if (others.length === 0) return null;
  const slug = listing.businessSlug?.trim() || String(listing.businessId);

  async function resolve(): Promise<LocationBrandSummary> {
    const brand = await getBrand(slug, { revalidate: LISTING_REVALIDATE_SECONDS, tags: [BRAND_TAG, brandTag(slug)] });
    const wanted = new Set(others.map((other) => other.id));
    const locations: Record<number, BrandLocation> = {};
    for (const location of Array.isArray(brand.locations) ? brand.locations : []) {
      if (wanted.has(location.id)) locations[location.id] = location;
    }
    return {
      averageRating: brand.averageRating ?? null,
      totalReviews: brand.totalReviews ?? 0,
      locations,
    };
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Keep the shared fetch/cache lifecycle intact; only bound this optional wait.
    return await Promise.race([
      resolve().catch(() => null),
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), 2000); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
