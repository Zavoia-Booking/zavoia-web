import "server-only";

import type { Locale } from "@/i18n/locales";
import { getIndustries, searchListings } from "@/lib/api/marketplace/public";
import type { ListingDetail } from "@/lib/api/marketplace/types";
import { BUSINESS_TAG, LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { getLocationCategoryTarget, hasLocationCategoryResult } from "./location-category";

/** Optional discovery must not make a usable location page fail or wait indefinitely. */
export async function getLocationCategoryHref(listing: ListingDetail, locale: Locale): Promise<string | null> {
  if (!listing.industry || !listing.location.city || !listing.location.addressComponents?.country) return null;

  async function resolve() {
    const industries = await getIndustries({ revalidate: LISTING_REVALIDATE_SECONDS, tags: [TAXONOMY_TAG] });
    const target = getLocationCategoryTarget(listing, industries, locale);
    if (!target) return null;
    const { locations } = await searchListings({
      city: target.cityName,
      industrySlug: target.industrySlug,
      strict: true,
      limit: 1,
    }, { revalidate: LISTING_REVALIDATE_SECONDS, tags: [BUSINESS_TAG, TAXONOMY_TAG] });
    return hasLocationCategoryResult(target, locations) ? target.href : null;
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
