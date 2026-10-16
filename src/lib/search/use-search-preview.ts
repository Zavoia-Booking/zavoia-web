"use client";

import { useEffect, useRef, useState } from "react";
import { searchListings } from "@/lib/api/marketplace/public";
import type { BusinessCard, LocationCard } from "@/lib/api/marketplace/types";

export interface SearchPreview {
  businesses: BusinessCard[];
  locations: LocationCard[];
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

// Keep the last successful suggestions while the next query settles. A failed
// request is recoverable and must never be presented as a successful empty set.
export function useSearchPreview(query: string): SearchPreview {
  const trimmed = query.trim();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    query: "", attempt: 0, businesses: [] as BusinessCard[],
    locations: [] as LocationCard[], loading: false, failed: false,
  });
  const requestId = useRef(0);
  const eligible = trimmed.length >= 2;
  const current = state.query === trimmed && state.attempt === attempt;

  useEffect(() => {
    const id = ++requestId.current;
    let active = true;
    if (!eligible) return;
    Promise.resolve().then(() => {
      if (!active || id !== requestId.current) return;
      setState(previous => ({ ...previous, query: trimmed, attempt, loading: true,
        failed: previous.query === trimmed && previous.failed }));
    });
    const timer = setTimeout(() => {
      void searchListings({ search: trimmed, limit: 8 }).then(result => {
        if (!active || id !== requestId.current) return;
        setState({ query: trimmed, attempt, businesses: result.businesses,
          locations: result.locations, loading: false, failed: false });
      }).catch(() => {
        if (!active || id !== requestId.current) return;
        setState(previous => ({ ...previous, query: trimmed, attempt, loading: false, failed: true }));
      });
    }, 300);
    return () => { clearTimeout(timer); active = false; };
  }, [trimmed, attempt, eligible]);

  return {
    businesses: eligible ? state.businesses : [],
    locations: eligible ? state.locations : [],
    loading: eligible && (!current || state.loading),
    failed: eligible && state.query === trimmed && state.failed,
    retry: () => setAttempt(value => value + 1),
  };
}
