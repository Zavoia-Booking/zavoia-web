import "server-only";

import { cache } from "react";
import { ApiError } from "@/lib/api/http";
import { getListing } from "@/lib/api/marketplace/public";
import { BUSINESS_TAG, LISTING_REVALIDATE_SECONDS, businessTag } from "@/lib/cache/tags";

/** Share one public lookup between the availability guard, metadata and body. */
export const getLocationPageListing = cache(async (idOrSlug: string) => {
  try {
    return await getListing(idOrSlug, {
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [BUSINESS_TAG, businessTag(idOrSlug)],
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) return null;
    // Operational failures must reach recovery, never become a cached absence.
    throw error;
  }
});
