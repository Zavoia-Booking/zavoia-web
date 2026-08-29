"use client";

/**
 * The 3 venue-tag dictionaries behind the filter panel's tag sections.
 *
 * Served unauthenticated by GET /marketplace/public/venue-tags. The mobile app
 * caches this with react-query (30 min stale time); the web has no query
 * client, so the equivalent here is a module-level promise: the request is made
 * at most once per page load and every consumer shares it. A failure resolves
 * to empty dictionaries — the filter panel then simply renders no tag sections,
 * which is a degraded panel rather than a broken one.
 */

import { useEffect, useState } from "react";
import { getVenueTags } from "@/lib/api/marketplace/public";
import type { VenueTagDictionaries } from "@/lib/api/marketplace/types";

const EMPTY: VenueTagDictionaries = {
  amenities: [],
  paymentMethods: [],
  languages: [],
};

let cached: Promise<VenueTagDictionaries> | null = null;

function load(): Promise<VenueTagDictionaries> {
  // A rejected promise must not be memoised, or one blip disables the tag
  // sections for the rest of the session.
  cached ??= getVenueTags().catch(() => {
    cached = null;
    return EMPTY;
  });
  return cached;
}

export function useVenueTags(): {
  dictionaries: VenueTagDictionaries;
  loading: boolean;
} {
  const [dictionaries, setDictionaries] = useState<VenueTagDictionaries>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void load().then((d) => {
      if (cancelled) return;
      setDictionaries(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { dictionaries, loading };
}
