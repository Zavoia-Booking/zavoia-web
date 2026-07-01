"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SearchOverlay,
  EMPTY_QUERY,
  type InitialQuery,
  type SearchStep,
} from "./search-overlay";

export interface OpenSearchOpts {
  /** Which accordion card to open first. Defaults to "what". */
  step?: SearchStep;
  /** Prefill the overlay's query state (legacy flat city/lat/lng accepted). */
  initial?: InitialQuery;
}

interface SearchOverlayContextValue {
  openSearch: (opts?: OpenSearchOpts) => void;
  closeSearch: () => void;
}

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(
  null,
);

// Provider mounts a single <SearchOverlay/> and exposes openSearch/closeSearch.
// The overlay's open/step/initial state lives here so any consumer (nav pill,
// hero, search page) can drive it.
export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SearchStep>("what");
  const [initial, setInitial] = useState<InitialQuery>(EMPTY_QUERY);
  // Bumped on every open so the overlay remounts with fresh useState seeds
  // (its step/initial are read once, at mount) — no re-seed effect required.
  const [openSeq, setOpenSeq] = useState(0);

  const openSearch = useCallback((opts?: OpenSearchOpts) => {
    setStep(opts?.step ?? "what");
    setInitial(opts?.initial ?? {});
    setOpenSeq((n) => n + 1);
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openSearch, closeSearch }),
    [openSearch, closeSearch],
  );

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
      <SearchOverlay
        key={openSeq}
        open={open}
        initialStep={step}
        initial={initial}
        onClose={closeSearch}
      />
    </SearchOverlayContext.Provider>
  );
}

// Consumer hook. Falls back to no-ops when no provider is mounted, so callers
// (e.g. isolated previews) never crash.
export function useSearchOverlay(): SearchOverlayContextValue {
  const ctx = useContext(SearchOverlayContext);
  if (ctx) return ctx;
  return { openSearch: () => {}, closeSearch: () => {} };
}
