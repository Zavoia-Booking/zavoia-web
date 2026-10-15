"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Industry } from "@/lib/api/marketplace/types";
import { DEFAULT_LOCALE } from "@/i18n/locales";
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
  /** Scope the category browser; empty string opens all, undefined opens normal search. */
  browseIndustry?: string;
  /** Reuse taxonomy already loaded by the opening page. */
  industries?: Industry[];
}

interface SearchOverlayContextValue {
  openSearch: (opts?: OpenSearchOpts) => void;
  closeSearch: () => void;
}

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(
  null,
);

interface SearchPageData {
  /** Canonical pathname resolved by the server page, including its locale. */
  pathname: string;
  /** Localized service or industry name; never used as free-text filtering. */
  label: string;
  initial: InitialQuery;
  industries: Industry[];
}

interface SearchPageRegistration {
  key: string;
  token: symbol;
  page: SearchPageData;
}

const SearchPageRegistrationContext = createContext<{
  registration: SearchPageRegistration | undefined;
  register: (page: SearchPageData) => () => void;
} | null>(null);

// Match the default-locale rewrite and decoded segments, as locale navigation
// does. Locale-prefixed paths remain distinct, so labels cannot leak across them.
function pageRouteIdentity(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === DEFAULT_LOCALE) segments.shift();
  return JSON.stringify(segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }));
}

/** Share the active server page's resolved filters with the persistent header.
 * This is deliberately separate from the overlay actions context: registering
 * a page does not invalidate every openSearch consumer.
 */
export function SearchPageContext({ pathname, label, initial, industries }: SearchPageData) {
  const register = useContext(SearchPageRegistrationContext)?.register;
  useEffect(
    () => register?.({ pathname, label, initial, industries }),
    [register, pathname, label, initial, industries],
  );
  return null;
}

/** Ignore a departed page immediately, before its effect cleanup runs. */
export function useSearchPageContext(pathname: string): SearchPageData | undefined {
  const registration = useContext(SearchPageRegistrationContext)?.registration;
  return registration?.key === pageRouteIdentity(pathname)
    ? registration.page
    : undefined;
}

// Provider mounts a single <SearchOverlay/> and exposes openSearch/closeSearch.
// The overlay's open/step/initial state lives here so any consumer (nav pill,
// hero, search page) can drive it.
export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<SearchPageRegistration>();
  const register = useCallback((page: SearchPageData) => {
    const token = Symbol("search-page");
    setRegistration({ key: pageRouteIdentity(page.pathname), token, page });
    return () => {
      setRegistration((current) => current?.token === token ? undefined : current);
    };
  }, []);
  const pageContext = useMemo(
    () => ({ registration, register }),
    [registration, register],
  );

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SearchStep>("what");
  const [initial, setInitial] = useState<InitialQuery>(EMPTY_QUERY);
  const [browseIndustry, setBrowseIndustry] = useState<string>();
  const [industries, setIndustries] = useState<Industry[]>();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Bumped on every open so the overlay remounts with fresh useState seeds
  // (its step/initial are read once, at mount) — no re-seed effect required.
  const [openSeq, setOpenSeq] = useState(0);

  const openSearch = useCallback((opts?: OpenSearchOpts) => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setBrowseIndustry(opts?.browseIndustry);
    setIndustries(opts?.industries);
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
      <SearchPageRegistrationContext.Provider value={pageContext}>
        {children}
      </SearchPageRegistrationContext.Provider>
      <SearchOverlay
        key={openSeq}
        open={open}
        initialStep={step}
        initial={initial}
        browseIndustry={browseIndustry}
        initialIndustries={industries}
        returnFocusRef={returnFocusRef}
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
