"use client";

import { useEffect, useState } from "react";
import { getVenueTags } from "@/lib/api/marketplace/public";
import type { VenueTagDictionaries } from "@/lib/api/marketplace/types";

const EMPTY: VenueTagDictionaries = { amenities: [], paymentMethods: [], languages: [] };
let cached: VenueTagDictionaries | null = null;
let request: Promise<VenueTagDictionaries> | null = null;
function load() {
  if (cached) return Promise.resolve(cached);
  request ??= getVenueTags().then(data => { cached = data; return data; }).finally(() => { request = null; });
  return request;
}

export function useVenueTags() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ dictionaries: cached ?? EMPTY, loading: !cached, failed: false, loaded: !!cached });
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => { if (alive && !cached) setState(previous => ({ ...previous, loading: true })); });
    void load().then(dictionaries => {
      if (alive) setState({ dictionaries, loading: false, failed: false, loaded: true });
    }).catch(() => {
      if (alive) setState(previous => ({ ...previous, loading: false, failed: true }));
    });
    return () => { alive = false; };
  }, [attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
