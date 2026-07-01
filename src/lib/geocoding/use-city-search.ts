"use client";

import { useEffect, useRef, useState } from "react";
import { searchCities, type CityResult } from "./maptiler";

const DEBOUNCE_MS = 250;
const MIN_LEN = 2;

export interface UseCitySearch {
  query: string;
  setQuery: (q: string) => void;
  results: CityResult[];
  loading: boolean;
}

/**
 * Debounced city autocomplete.
 *
 * - Debounces `query` by 250ms before firing a request.
 * - Only searches when the trimmed query has >= 2 chars; otherwise clears
 *   results and sets loading false.
 * - Cancels the in-flight request (AbortController) whenever the query
 *   changes or the component unmounts.
 * - State is only set inside the timeout / async callback, never synchronously
 *   in the effect body (matches the repo's set-state-in-effect convention).
 */
export function useCitySearch(): UseCitySearch {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);

  // The controller for the request belonging to the latest effect run.
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    // Below the minimum length: clear, no request. Defer to a microtask so we
    // never call setState synchronously in the effect body.
    if (trimmed.length < MIN_LEN) {
      Promise.resolve().then(() => {
        setResults([]);
        setLoading(false);
      });
      return;
    }

    const timer = setTimeout(() => {
      // Abort any previous in-flight request before starting a new one.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      searchCities(query, controller.signal)
        .then((cities) => {
          // Ignore results from a superseded request.
          if (controller.signal.aborted) return;
          setResults(cities);
          setLoading(false);
        })
        .catch(() => {
          // searchCities never throws, but stay defensive.
          if (controller.signal.aborted) return;
          setResults([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [query]);

  return { query, setQuery, results, loading };
}
