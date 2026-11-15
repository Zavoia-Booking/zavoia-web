import "server-only";

import { cache } from "react";
import { ApiError } from "@/lib/api/http";
import { getBrand } from "@/lib/api/marketplace/public";
import { BRAND_TAG, LISTING_REVALIDATE_SECONDS, brandTag } from "@/lib/cache/tags";

/** Share one public lookup between the availability guard, metadata and body. */
export const getBrandPageData = cache(async (idOrSlug: string) => {
  try {
    return await getBrand(idOrSlug, {
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [BRAND_TAG, brandTag(idOrSlug)],
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) return null;
    // An outage must reach recovery, never become a cached missing brand.
    throw error;
  }
});
