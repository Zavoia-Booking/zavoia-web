"use client";

import { useCallback, useEffect, useState } from "react";
import { searchCities, type CityResult } from "./maptiler";

const DEBOUNCE_MS = 250;
const MIN_LEN = 2;

export interface UseCitySearch {
  query: string;
  setQuery: (q: string) => void;
  results: CityResult[];
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

/** City autocomplete: pending includes debounce, and only the latest attempt settles. */
export function useCitySearch(): UseCitySearch {
  const [state, setState] = useState({
    query: "",
    attempt: 0,
    settledAttempt: 0,
    results: [] as CityResult[],
    failed: false,
  });
  const { query, attempt, settledAttempt, results, failed } = state;
  const trimmed = query.trim();
  const loading = trimmed.length >= MIN_LEN && attempt !== settledAttempt;

  const setQuery = useCallback((nextQuery: string) => {
    setState((previous) => {
      if (nextQuery === previous.query) return previous;
      if (nextQuery.trim() === previous.query.trim()) {
        return { ...previous, query: nextQuery };
      }
      return {
        ...previous,
        query: nextQuery,
        attempt: previous.attempt + 1,
        results: nextQuery.trim().length < MIN_LEN ? [] : previous.results,
        failed: false,
      };
    });
  }, []);

  const retry = useCallback(() => {
    setState((previous) => previous.query.trim().length < MIN_LEN
      ? previous
      : { ...previous, attempt: previous.attempt + 1 });
  }, []);

  useEffect(() => {
    if (trimmed.length < MIN_LEN) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchCities(trimmed, controller.signal, { throwOnError: true })
        .then((cities) => {
          if (controller.signal.aborted) return;
          setState((previous) => previous.attempt === attempt
            ? { ...previous, results: cities, failed: false, settledAttempt: attempt }
            : previous);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          // Keep any successful results visible when a refresh fails.
          setState((previous) => previous.attempt === attempt
            ? { ...previous, failed: true, settledAttempt: attempt }
            : previous);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, attempt]);

  return { query, setQuery, results, loading, failed, retry };
}
