"use client";

import { useEffect, useRef, useState } from "react";
import { searchListings } from "@/lib/api/marketplace/public";
import type {
  BusinessCard,
  LocationCard,
} from "@/lib/api/marketplace/types";

const DEBOUNCE_MS = 300;
const MIN_LEN = 2;
const PREVIEW_LIMIT = 8;

export interface SearchPreview {
  businesses: BusinessCard[];
  locations: LocationCard[];
  loading: boolean;
}

/**
 * Debounced "search-as-you-type" preview for the overlay's What section.
 *
 * - Debounces `query` by 300ms before firing a request.
 * - Only searches when the trimmed query has >= 2 chars; otherwise clears
 *   results and sets loading false (no request fired).
 * - `loading` covers the WHOLE search window: it flips true synchronously the
 *   moment a >= 2-char query arrives (before the debounce timer even starts)
 *   and stays true through debounce + fetch, only becoming false once the
 *   response for the LATEST query settles. This prevents a "No results" flash
 *   during the debounce gap, where results are empty but a search is pending.
 * - `searchListings` has no abort signal, so a monotonically-increasing
 *   request-id ref provides the latest-wins guard: a stale (superseded)
 *   response can never overwrite a newer query's results or flip `loading`.
 * - On error, results are treated as empty — never throws into render
 *   (matches the build-safe convention used elsewhere).
 * - The debounce timer is cleaned up on unmount / query change.
 */
export function useSearchPreview(query: string): SearchPreview {
  const [businesses, setBusinesses] = useState<BusinessCard[]>([]);
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Latest-issued request id. Each effect run claims the next id; async
  // callbacks only commit state when they are still the latest request.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    // Each effect run claims a fresh id up front — this is the search "epoch"
    // for the current query. Bumping it here also invalidates any in-flight
    // response from a previous query (latest-wins).
    const id = (requestIdRef.current += 1);

    // Below the minimum length: clear, no request, loading off. Defer the
    // state writes to a microtask so we never call setState synchronously in
    // the effect body.
    if (trimmed.length < MIN_LEN) {
      Promise.resolve().then(() => {
        if (id !== requestIdRef.current) return;
        setBusinesses([]);
        setLocations([]);
        setLoading(false);
      });
      return;
    }

    // A search is now pending for this query: show the loader immediately,
    // before the debounce timer starts, so there is no empty-but-not-loading
    // gap. Deferred to a microtask to avoid synchronous setState in the body.
    Promise.resolve().then(() => {
      if (id !== requestIdRef.current) return;
      setLoading(true);
    });

    const timer = setTimeout(() => {
      searchListings({ search: trimmed, limit: PREVIEW_LIMIT })
        .then((res) => {
          // Ignore results from a superseded request — only the latest may
          // commit results and flip loading off.
          if (id !== requestIdRef.current) return;
          setBusinesses(res.businesses);
          setLocations(res.locations);
          setLoading(false);
        })
        .catch(() => {
          // Build-safe: treat failure as empty results, never throw.
          if (id !== requestIdRef.current) return;
          setBusinesses([]);
          setLocations([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return { businesses, locations, loading };
}
