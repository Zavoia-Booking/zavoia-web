"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/dictionaries";
import { Kicker } from "@/components/ui/kicker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui";
import {
  BusinessRow,
  RowSkeleton,
  type BusinessCardData,
} from "@/components/business";
import {
  businessCardToData,
  locationCardToData,
} from "@/lib/marketplace/card-mappers";
import {
  buildSlugById,
  industrySlugOf,
} from "@/lib/marketplace/industry-visuals";
import { searchListings } from "@/lib/api/marketplace/public";
import { errorMessage } from "@/lib/api/error-messages";
import type {
  Industry,
  LocationCard,
  SearchListingsParams,
  SearchListingsResult,
} from "@/lib/api/marketplace/types";
import { useSearchOverlay } from "@/components/search/search-overlay-provider";
import {
  MapboxSurface,
  type GeoPin,
  type GeoPoint,
  type MapboxSurfaceHandle,
} from "@/components/search/mapbox-surface";
import {
  DEFAULT_ANCHOR,
  SEARCH_LIMIT,
  SEARCH_RADIUS_KM,
} from "@/components/search/constants";
import {
  applyMapFilters,
  countActiveFilters,
  EMPTY_FILTERS,
  filtersToParams,
  parseFilters,
  type MapFilters,
} from "@/lib/search/filters";
import { useVenueTags } from "@/lib/search/use-venue-tags";
import { FiltersPanel } from "./filters-panel";
import { LocationPermissionModal } from "@/components/search/location-permission-modal";
import { MapFloatingCard } from "@/components/search/map-floating-card";
import { getBrowserLocation, ipLocate } from "@/lib/geocoding";
import { getRecentViews } from "@/lib/recent-views";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { TagRail } from "@/components/search/tag-rail";
import {
  BottomSheet,
  type BottomSheetHandle,
  type SheetPosition,
} from "@/components/search/bottom-sheet";
import { MapSkeleton } from "@/components/search/map-skeleton";
import { SortMenu } from "./sort-menu";
import { FilterRow } from "./filter-row";

const MOBILE_MQ = "(max-width: 920px)";

// Desktop results panel geometry. Kept next to each other because three things
// depend on it staying in sync: the panel's own style, the map's camera-fit
// inset, and the floating card's left inset.
const PANEL_MAX_PX = 424;
const PANEL_VW = 0.36;
/** Gap between the viewport edge and the panel. */
const PANEL_EDGE_PX = 16;

// localStorage flag remembering a previous "Not now" so the priming modal
// doesn't reappear on later visits.
const LOC_SKIP_KEY = "zv-loc-skip";

/**
 * The shape of the search request derived from URL params.
 *
 * Refinement (sort, rating, distance cap, open-now, venue tags) is deliberately
 * NOT here: it never becomes a request param. It lives in `MapFilters` and is
 * applied client-side to whatever the search returned — the same split the
 * mobile app makes between `SearchQuery` and its filters store.
 */
type DerivedParams = SearchListingsParams;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function numParam(v: string | null): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function csvNums(v: string | null): number[] | undefined {
  if (!v) return undefined;
  const arr = v
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return arr.length ? arr : undefined;
}

export interface SearchContentProps {
  locale: Locale;
  industries: Industry[];
  initialResult: SearchListingsResult;
  // True when the SERVER-side initial fetch failed (page.tsx swallowed the
  // error into EMPTY_RESULT so the page itself stays render-safe). Lets the
  // empty state below tell "the backend is down" apart from "no places match".
  initialResultFailed: boolean;
}

export function SearchContent({
  locale,
  industries,
  initialResult,
  initialResultFailed,
}: SearchContentProps) {
  const { dict } = useTranslation();
  const t = dict.search;
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { openSearch } = useSearchOverlay();
  // Result rows are location-sourced; the supplementary business rows use the
  // business endpoint family. Hearts hide entirely when signed out.
  const locFav = useFavoriteToggle("location");
  const bizFav = useFavoriteToggle("business");

  // ── Derive the request from URL params ──────────────────────────────────
  // `radius` is NOT read from the URL: like the mobile app, every point-anchored
  // query uses one fixed radius, and "show me somewhere smaller" is the
  // client-side `maxDistanceKm` filter instead. Reading it here while sending a
  // fixed radius is how a shared ?radius=5 link used to return 20km of results.
  const derived: DerivedParams = useMemo(
    () => ({
      search: sp.get("search") ?? undefined,
      industrySlug: sp.get("industry") ?? undefined,
      tagIds: csvNums(sp.get("tagIds")),
      city: sp.get("city") ?? undefined,
      date: sp.get("date") ?? undefined,
      lat: numParam(sp.get("lat")),
      lng: numParam(sp.get("lng")),
      offset: 0,
      limit: SEARCH_LIMIT,
    }),
    [sp],
  );

  // Client-side refinement of whatever the search returned. Persisted in the
  // URL (the web's equivalent of the mobile filters store) so a filtered search
  // stays shareable and survives a reload.
  const filters: MapFilters = useMemo(
    () => parseFilters(new URLSearchParams(sp.toString())),
    [sp],
  );
  const activeFilterCount = countActiveFilters(filters);

  // industry id → slug, so a card's slug-less `IndustryRef` resolves exactly
  // against the visual registry instead of being guessed from its name.
  const slugById = useMemo(() => buildSlugById(industries), [industries]);

  const hasGeo = derived.lat != null && derived.lng != null;

  // A stable key for the current request (excludes the client-only filters),
  // used to trigger a fresh single fetch when any query/geo param changes.
  const requestKey = useMemo(
    () =>
      [
        derived.search ?? "",
        derived.industrySlug ?? "",
        (derived.tagIds ?? []).join(","),
        derived.city ?? "",
        derived.date ?? "",
        derived.lat ?? "",
        derived.lng ?? "",
      ].join("|"),
    [derived],
  );

  // ── Result state (one fetch replaces the whole set; no pagination) ──────
  const [locations, setLocations] = useState<LocationCard[]>(
    initialResult.locations,
  );
  const [businesses, setBusinesses] = useState(initialResult.businesses);
  const [loading, setLoading] = useState(false);

  // "No data" vs. "the request failed" — resultsFailed drives which empty
  // state renders; lastError is the underlying error (null for the SSR
  // failure, which page.tsx already reduced to a boolean) fed through
  // errorMessage() so offline/timeout/5xx text wins over the generic copy.
  const [resultsFailed, setResultsFailed] = useState(initialResultFailed);
  const [lastError, setLastError] = useState<unknown>(null);
  // Whether the currently-displayed set has any rows — read (not written) by
  // the catch branch below to decide whether a refetch failure should flip
  // the panel to the failure state or just toast (prior rows stay visible).
  const hasDataRef = useRef(
    initialResult.locations.length > 0 || initialResult.businesses.length > 0,
  );

  // Skip the very first fetch when the server already provided a matching
  // result for the initial request key.
  const firstRun = useRef(true);
  const lastKey = useRef(requestKey);

  // Seeded from the "See on map" deep link (?focus=<locationId>) so the
  // focused location's pin arrives already selected (card + list highlight).
  const [selectedId, setSelectedId] = useState<number | null>(
    () => numParam(sp.get("focus")) ?? null,
  );
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The venue-tag vocabulary behind the panel's FEATURES sections. Fetched once
  // per page load and shared; an empty result just renders no tag sections.
  const { dictionaries: venueTagDictionaries } = useVenueTags();

  // The resolved device/IP position — drives the pulsing user DOT only. Stays
  // null for the Bucharest fallback and for shared-link place searches (no dot).
  const [deviceLocation, setDeviceLocation] = useState<GeoPoint | null>(null);

  // Location-permission priming modal. Starts CLOSED (SSR-safe, no hydration
  // mismatch); the mount effect below decides whether to open it based on the
  // persisted geolocation permission + a "Not now" localStorage flag, and
  // otherwise silently auto-resolves the anchor for returning users.
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  // Guards the one-shot resolution effect against React 19 dev double-invoke.
  const resolvedOnce = useRef(false);

  const listRef = useRef<HTMLDivElement>(null);
  const mapHandleRef = useRef<MapboxSurfaceHandle>(null);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>("mid");

  // The mobile tab bar is fixed to the bottom of the viewport, so the map
  // region has to stop above it or the sheet's peek — and the last result row
  // — sit underneath it. Measured rather than assumed: the bar's height is
  // content-driven and grows by the device's bottom safe area.
  const [tabBarH, setTabBarH] = useState(0);
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("nav.zw-only-mobile");
    if (!nav) return;
    const ro = new ResizeObserver(() =>
      setTabBarH(nav.getBoundingClientRect().height),
    );
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // ── First-load shell ─────────────────────────────────────────────────────
  // Two-phase mount: the first commit paints the skeleton alone, and mapbox-gl
  // — by far the heaviest thing on the page — is mounted on the next idle
  // callback. Mounting both together gates the skeleton on constructing the
  // very view it exists to mask.
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    if (w.requestIdleCallback) {
      const h = w.requestIdleCallback(() => setMapMounted(true));
      return () => w.cancelIdleCallback?.(h);
    }
    const h = window.setTimeout(() => setMapMounted(true), 0);
    return () => window.clearTimeout(h);
  }, []);

  // The skeleton lifts on the map's first IDLE — tiles actually on screen,
  // which is later than "the style loaded". A safety net lifts it regardless,
  // so a missed event can never leave the page covered.
  const [mapPainted, setMapPainted] = useState(false);
  const [skeletonMounted, setSkeletonMounted] = useState(true);
  const onMapFirstPaint = useCallback(() => setMapPainted(true), []);
  useEffect(() => {
    if (mapPainted) return;
    const h = window.setTimeout(() => setMapPainted(true), 4000);
    return () => window.clearTimeout(h);
  }, [mapPainted]);
  useEffect(() => {
    if (!mapPainted || !skeletonMounted) return;
    const h = window.setTimeout(() => setSkeletonMounted(false), 320);
    return () => window.clearTimeout(h);
  }, [mapPainted, skeletonMounted]);

  // ── Responsive flag (window.matchMedia) ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // The desktop panel's rendered width, in px. The stylesheet expresses it as
  // `min(424px, 36vw)`; the camera fit needs the resolved number, so resolve
  // the same expression here rather than guessing a constant.
  const [panelWidthPx, setPanelWidthPx] = useState(PANEL_MAX_PX);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () =>
      setPanelWidthPx(Math.min(PANEL_MAX_PX, window.innerWidth * PANEL_VW));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Places the visitor has already opened, dimmed on the map so a repeated
  // search reads as "these are the ones you've seen". Read once on mount:
  // localStorage is not reactive and the rail on the home page uses the same
  // snapshot semantics.
  const [viewedIds, setViewedIds] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    // Deferred a microtask past the effect body: localStorage is only readable
    // on the client, so this cannot be a useState initializer without risking a
    // hydration mismatch, and a synchronous setState here would cascade. Same
    // idiom as NearYouSection's loading flag.
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setViewedIds(new Set(getRecentViews()));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch on param change ───────────────────────────────────────────────
  // Single fixed-radius call (limit 300, offset 0) that REPLACES results — no
  // pagination. Held in a ref so the retry-toast callback can re-invoke the
  // latest fetch without referencing `runFetch` before its own declaration.
  const runFetchRef = useRef<() => Promise<void>>(async () => {});

  // Latest-issued request id (mirrors useSearchPreview's guard) — searchListings
  // takes no AbortSignal, so a monotonically-increasing id is what lets a
  // superseded response ("Search this area" fired twice, filters flipped
  // quickly) lose against whichever request is actually the latest.
  const requestIdRef = useRef(0);

  const runFetch = useCallback(async () => {
    const id = (requestIdRef.current += 1);
    // Two mutually exclusive scopes, matching the mobile app: whole-city (from a
    // home rail's "see all" — city NAME only, so the query can't inherit the
    // rail's radius), or point + fixed radius.
    const cityScoped =
      derived.city != null && derived.lat == null && derived.lng == null;
    const params: SearchListingsParams = {
      search: derived.search,
      industrySlug: derived.industrySlug,
      tagIds: derived.tagIds,
      city: derived.city,
      date: derived.date,
      lat: cityScoped ? undefined : derived.lat,
      lng: cityScoped ? undefined : derived.lng,
      // Fixed radius whenever we have an anchor; omitted in city scope.
      radius: cityScoped || !hasGeo ? undefined : SEARCH_RADIUS_KM,
      // ALWAYS strict — the same contract the mobile app holds. Without it the
      // server climbs its relaxation ladder on an empty result (dropping the
      // date, the tags, then widening the radius to 50km and dropping the
      // industry) and returns places from far outside what the map is showing,
      // flagged only by a `fallback` field. An area with nothing in it must
      // read as empty, and a filter the user set must not be silently discarded.
      strict: true,
      limit: SEARCH_LIMIT,
      offset: 0,
    };
    setLoading(true);
    try {
      const res = await searchListings(params);
      // Stale-response guard: a slower response for an earlier query must
      // never overwrite a newer one's results.
      if (id !== requestIdRef.current) return;
      // keepPreviousData: only swap in the new set on success, so previous rows
      // + pins stay visible while refetching.
      // TODO(i18n slice): if res.total > res.locations.length, show a
      // "showing first 300" note. Deferred — no new i18n keys this slice.
      setLocations(res.locations);
      setBusinesses(res.businesses);
      setSelectedId(null);
      setResultsFailed(false);
      setLastError(null);
      hasDataRef.current = res.locations.length > 0 || res.businesses.length > 0;
    } catch (err) {
      if (id !== requestIdRef.current) return;
      // Keep prior results visible on failure; just offer a retry — unless
      // there was nothing to keep, in which case the empty state below must
      // say "the request failed", not "no places match".
      setResultsFailed(!hasDataRef.current);
      setLastError(err);
      toast(errorMessage(err, dict.errors, t.retryError), "warn", {
        label: t.retry,
        onClick: () => void runFetchRef.current(),
      }, "error");
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, [derived, hasGeo, dict.errors, t.retry, t.retryError, toast]);

  // Keep the ref pointing at the latest fetch for retry callbacks.
  useEffect(() => {
    runFetchRef.current = runFetch;
  }, [runFetch]);

  useEffect(() => {
    // First mount: trust the server-provided initialResult unless the URL key
    // differs (e.g. client navigated straight to /search?... via a Link).
    if (firstRun.current) {
      firstRun.current = false;
      lastKey.current = requestKey;
      return;
    }
    if (lastKey.current === requestKey) return;
    lastKey.current = requestKey;
    void runFetch();
  }, [requestKey, runFetch]);

  // ── URL param updates (shareable, no reload) ────────────────────────────
  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      // No pagination — strip any stale offset param from older URLs.
      if (!("offset" in patch)) next.delete("offset");
      const qs = next.toString();
      router.replace(localeHref(locale, "search") + (qs ? `?${qs}` : ""));
    },
    [sp, router, locale],
  );

  // ── Per-result distance (sorting + the distance cap) ────────────────────
  // Prefer the server's `distanceKm`; without an anchor there is none, and the
  // distance-based sort/filter simply have nothing to work with.
  const distanceFor = useCallback(
    (l: LocationCard): number | undefined => l.distanceKm ?? undefined,
    [],
  );

  // ── The single refinement stage ─────────────────────────────────────────
  // Both the result list and the map pins read this, so a filtered-out place
  // can never linger as a pin (filtering only one of them is how a map ends up
  // showing markers the list excluded).
  const visibleLocations = useMemo(
    () => applyMapFilters(locations, filters, distanceFor),
    [locations, filters, distanceFor],
  );

  // ── Geographic pins (over the FULL accumulated visible set) ─────────────
  // Locations without coordinates are skipped (no marker) but still list-rendered.
  // `cat` is the canonical industry slug, resolved through the loaded taxonomy —
  // the cards only carry an industry id and an English name.
  const pins: GeoPin[] = useMemo(() => {
    const out: GeoPin[] = [];
    for (const l of visibleLocations) {
      if (l.latitude == null || l.longitude == null) continue;
      out.push({
        id: l.id,
        name: l.name,
        cat: industrySlugOf(l.industry, slugById),
        lat: l.latitude,
        lng: l.longitude,
      });
    }
    return out;
  }, [visibleLocations, slugById]);

  // The SEARCH anchor — the current URL lat/lng. Drives the 2km "Search this
  // area" pan threshold. NOT the user dot (that's `deviceLocation`).
  const searchAnchor: GeoPoint | null = useMemo(
    () =>
      hasGeo && derived.lat != null && derived.lng != null
        ? { lat: derived.lat, lng: derived.lng }
        : null,
    [hasGeo, derived.lat, derived.lng],
  );

  // ── Row data ────────────────────────────────────────────────────────────
  const locationRows: { id: number; data: BusinessCardData }[] = useMemo(
    () =>
      visibleLocations.map((l) => ({
        id: l.id,
        data: locationCardToData(l, locale, slugById),
      })),
    [visibleLocations, locale, slugById],
  );

  // Floating-card data for the selected pin — pulled from already-loaded rows
  // (no fetch). Driven by `selectedId` (pin click), not hover.
  const selectedCardData: BusinessCardData | null =
    selectedId != null
      ? (locationRows.find((r) => r.id === selectedId)?.data ?? null)
      : null;

  // Supplementary business rows only when a text search is present.
  const businessRows: { id: number; data: BusinessCardData }[] = useMemo(() => {
    if (!derived.search) return [];
    return businesses.map((b) => ({
      id: b.id,
      data: businessCardToData(b, locale, slugById),
    }));
  }, [businesses, derived.search, locale, slugById]);

  const resultCount = visibleLocations.length + businessRows.length;

  // ── Selecting a pin scrolls its row near the top of the list ────────────
  // Rect-delta (not offsetTop, whose offsetParent is this positioned container)
  // so the selected row lands ~12px below the top of the list viewport.
  useEffect(() => {
    if (selectedId == null || !listRef.current) return;
    const container = listRef.current;
    const el = container.querySelector<HTMLElement>(
      `[data-biz="${selectedId}"]`,
    );
    if (!el) return;
    const delta =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
    container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
  }, [selectedId]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const onPinSelect = useCallback((id: number) => {
    setSelectedId(id);
    // Get the sheet out of the way so the pin's card is actually on screen.
    sheetRef.current?.snapTo("down");
  }, []);

  // The instant a real gesture starts moving the map, collapse the sheet to its
  // peek — the map is what the user reached for.
  const onUserMoveStart = useCallback(() => {
    sheetRef.current?.snapTo("down");
  }, []);

  // ── "See on map" deep link (?focus=<locationId>) ────────────────────────
  // Selection is seeded in useState above; this flies the camera to the
  // focused location once it is present in the result set. One-shot per mount
  // so later searches and pin clicks are never overridden.
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (focusedOnce.current) return;
    const focusId = numParam(sp.get("focus"));
    if (focusId == null) return;
    const loc = locations.find((l) => l.id === focusId);
    if (!loc || loc.latitude == null || loc.longitude == null) return;
    focusedOnce.current = true;
    // An "arrival" — place the camera, don't animate a fly across the country.
    mapHandleRef.current?.flyTo(
      { lat: loc.latitude, lng: loc.longitude },
      { zoom: 14, duration: 0 },
    );
  }, [sp, locations]);

  // "Search this area" — re-anchor on the new map center; radius stays fixed.
  // updateParams triggers the fetch via the requestKey effect, so no separate
  // fetch is needed here.
  // The camera is ALREADY on the panned centre — re-anchoring must not move it
  // again, which is what the old fit-to-results did: pick an area, get panned
  // straight back off it. The flag is consumed by the anchor-follow effect.
  const skipAnchorFly = useRef(false);
  const onSearchArea = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      skipAnchorFly.current = true;
      updateParams({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
      });
    },
    [updateParams],
  );

  // ── Location-permission resolution ───────────────────────────────────────
  // Writing lat/lng makes `hasGeo` true (modal won't reopen) and triggers the
  // existing requestKey fetch. Always fixed 20km radius.
  const applyAnchor = useCallback(
    (p: GeoPoint) => {
      updateParams({
        lat: p.lat.toFixed(6),
        lng: p.lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
      });
    },
    [updateParams],
  );

  // Resolve an anchor: optionally try device geolocation → IP fallback →
  // Bucharest. The user DOT only shows the real device/IP position (not the
  // Bucharest fallback). `tryGeo=false` skips the native prompt entirely.
  const resolveAndApply = useCallback(
    async (tryGeo: boolean) => {
      let loc: GeoPoint | null = null;
      if (tryGeo) loc = await getBrowserLocation();
      if (!loc) {
        const ip = await ipLocate();
        if (ip) loc = { lat: ip.lat, lng: ip.lng };
      }
      if (loc) {
        setDeviceLocation(loc);
        applyAnchor(loc);
      } else {
        applyAnchor(DEFAULT_ANCHOR);
      }
    },
    [applyAnchor],
  );

  // "Use my location" → geolocation, then IP, then Bucharest. The browser
  // persists the grant/deny, so the next visit auto-resolves (no modal).
  const handleAllow = useCallback(async () => {
    setLocationBusy(true);
    try {
      await resolveAndApply(true);
    } finally {
      setLocationModalOpen(false);
      setLocationBusy(false);
    }
  }, [resolveAndApply]);

  // "Not now" → remember the skip (so the modal won't reappear), then IP,
  // then Bucharest. No geolocation prompt.
  const handleSkip = useCallback(async () => {
    setLocationBusy(true);
    try {
      localStorage.setItem(LOC_SKIP_KEY, "1");
    } catch {
      // localStorage unavailable (private mode / blocked) — non-fatal.
    }
    try {
      await resolveAndApply(false);
    } finally {
      setLocationModalOpen(false);
      setLocationBusy(false);
    }
  }, [resolveAndApply]);

  // ── One-shot auto-resolution on a fresh empty landing ────────────────────
  // Consults the persisted geolocation permission + the "Not now" flag to
  // decide whether to prime (show modal) or silently resolve. All setState is
  // post-await inside an async IIFE — no synchronous setState in the effect
  // body — keeping it lint-clean. The ran-once ref guards React 19 dev
  // double-invoke.
  useEffect(() => {
    if (resolvedOnce.current) return;
    resolvedOnce.current = true;
    // Not an empty landing (shared link with a place/search) — do nothing.
    if (hasGeo || derived.city || derived.search) return;
    let cancelled = false;
    void (async () => {
      let perm: PermissionState = "prompt";
      try {
        if (typeof navigator !== "undefined" && navigator.permissions?.query) {
          const status = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });
          perm = status.state;
        }
      } catch {
        // Permissions API unavailable/blocked — treat as "prompt".
      }
      if (cancelled) return;
      if (perm === "granted") {
        await resolveAndApply(true);
        return;
      }
      if (perm === "denied") {
        await resolveAndApply(false);
        return;
      }
      // "prompt" — honour a previous "Not now", else show the modal.
      let skipped = false;
      try {
        skipped = localStorage.getItem(LOC_SKIP_KEY) === "1";
      } catch {
        // localStorage unavailable — treat as not-skipped.
      }
      if (cancelled) return;
      if (skipped) {
        await resolveAndApply(false);
        return;
      }
      setLocationModalOpen(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Applying a filter set writes every key it owns (nulls included), so a reset
  // can't leave a stale param behind. See `filtersToParams`.
  const applyFilters = useCallback(
    (next: MapFilters) => updateParams(filtersToParams(next)),
    [updateParams],
  );

  const clearFilters = useCallback(() => {
    updateParams({
      industry: null,
      tagIds: null,
      date: null,
      ...filtersToParams(EMPTY_FILTERS),
    });
  }, [updateParams]);

  // ── "My location" (the crosshair) ────────────────────────────────────────
  // The ladder the mobile app uses, in order: the position the map ALREADY
  // holds for the blue dot, then a fresh fix, then the stored anchor. A fresh
  // `getCurrentPosition` can take many seconds and fail indoors, so it never
  // gates the common path — when there is already a dot, the camera moves at
  // once and the fix refreshes behind it.
  //
  // Raw coordinates only: no reverse geocode on this path. The button recentres
  // and re-anchors; it does not rename where the user is.
  const [locating, setLocating] = useState(false);
  const locatingRef = useRef(false);

  const recenterTo = useCallback(
    (loc: GeoPoint) => {
      setDeviceLocation(loc);
      // Fly the camera ourselves: when the URL is already anchored on this
      // position, updateParams is a no-op and no refetch follows — and when it
      // is not, the flag stops the anchor-follow effect flying a second time.
      skipAnchorFly.current = true;
      mapHandleRef.current?.flyTo(loc);
      updateParams({
        lat: loc.lat.toFixed(6),
        lng: loc.lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
      });
    },
    [updateParams],
  );

  const requestLocation = useCallback(() => {
    if (locatingRef.current) return;
    // Geolocation unsupported/blocked → route to the priming modal (its
    // "Use my location" gracefully falls back to IP/Bucharest).
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationModalOpen(true);
      return;
    }
    // A dot on the map already means a position we can trust enough to move to.
    if (deviceLocation) {
      recenterTo(deviceLocation);
      toast(t.centeredOnLocation, "nav");
      // Refresh it quietly for next time; a failure changes nothing on screen.
      void getBrowserLocation().then((fresh) => {
        if (fresh) setDeviceLocation(fresh);
      });
      return;
    }
    locatingRef.current = true;
    setLocating(true);
    void getBrowserLocation()
      .then((loc) => {
        if (loc) {
          recenterTo(loc);
          toast(t.centeredOnLocation, "nav");
          return;
        }
        // No fix. Fall back to the anchor the results are already using, so the
        // button still does something rather than silently failing — and only
        // reopen the priming modal when there is nowhere at all to go.
        if (searchAnchor) mapHandleRef.current?.flyTo(searchAnchor);
        else setLocationModalOpen(true);
      })
      .finally(() => {
        locatingRef.current = false;
        setLocating(false);
      });
  }, [deviceLocation, recenterTo, searchAnchor, toast, t.centeredOnLocation]);

  // ── The camera follows the anchor ────────────────────────────────────────
  // Picking a place (overlay, city chip, "use my location") re-anchors the
  // results, and the map has to agree — searching Cluj while the camera sits
  // over Bucharest shows an empty map over the wrong city.
  //
  // What this deliberately does NOT do is fit the camera to the results on
  // every fetch: that fought the user after a "Search this area", and re-framed
  // the map behind their back whenever a filter changed the pin set. The mobile
  // app never auto-fits either.
  const anchorKey = searchAnchor
    ? `${searchAnchor.lat},${searchAnchor.lng}`
    : "";
  const lastAnchorKey = useRef(anchorKey);
  useEffect(() => {
    if (lastAnchorKey.current === anchorKey) return;
    lastAnchorKey.current = anchorKey;
    if (skipAnchorFly.current) {
      skipAnchorFly.current = false;
      return;
    }
    if (searchAnchor) mapHandleRef.current?.flyTo(searchAnchor);
    // searchAnchor is derived from anchorKey; keying on the string keeps a
    // fresh object identity from re-flying to the same coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey]);

  // ── Edit search — reopen the overlay prefilled from the active URL params ──
  const editSearch = useCallback(() => {
    openSearch({
      step: "what",
      initial: {
        what: derived.search ?? "",
        industry: derived.industrySlug ?? "",
        tagIds: derived.tagIds ?? [],
        city: derived.city ?? "",
        when: derived.date ? `date:${derived.date}` : "",
        lat: derived.lat,
        lng: derived.lng,
      },
    });
  }, [openSearch, derived]);

  // Transport failures (offline/timeout/rate-limited/5xx) win over the plain
  // "couldn't load results" copy; falls back to it when there's no error to
  // read (the SSR-side failure only carried a boolean, not the ApiError).
  const failureMessage = errorMessage(lastError, dict.errors, t.retryError);

  const queryLabel = derived.search || t.allServices;

  // ── Header ──────────────────────────────────────────────────────────────
  const panelHeader = (
    <div
      style={{
        padding: "18px 18px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <Kicker style={{ marginBottom: 5 }}>{t.inThisArea}</Kicker>
          <span
            className={loading ? "zv-updating-pulse" : undefined}
            style={{
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--c-900)",
            }}
          >
            {loading
              ? t.updating
              : format(resultCount === 1 ? t.resultCountOne : t.resultCount, {
                  count: String(resultCount),
                })}
          </span>
          <button
            type="button"
            className="tap"
            onClick={editSearch}
            aria-label={t.editSearch}
            style={{
              marginLeft: 8,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              color: "var(--c-600)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {queryLabel}
            <Icon name="pencil" size={12} color="var(--c-500)" />
          </button>
        </div>
        <SortMenu
          sort={filters.sort}
          setSort={(sort) => applyFilters({ ...filters, sort })}
          allowClosest={hasGeo}
        />
      </div>
      <FilterRow
        industries={industries}
        activeSlug={derived.industrySlug ?? null}
        onSelectIndustry={(slug) => updateParams({ industry: slug })}
        openNow={filters.openNow}
        onToggleOpenNow={() =>
          applyFilters({ ...filters, openNow: !filters.openNow })
        }
        availableToday={derived.date === todayIso()}
        onToggleAvailableToday={() =>
          updateParams({
            date: derived.date === todayIso() ? null : todayIso(),
          })
        }
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFiltersOpen(true)}
      />
    </div>
  );

  // ── Result list ─────────────────────────────────────────────────────────
  const resultList = (
    <div
      ref={listRef}
      className="zw-scroll-y"
      style={{ flex: 1, padding: "4px 10px 16px", position: "relative" }}
    >
      {loading && locations.length === 0 ? (
        <div className="zv-fade" aria-label={t.updating}>
          {[0, 1, 2, 3, 4].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : resultCount === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--c-800)",
              marginBottom: resultsFailed ? 18 : 6,
            }}
          >
            {resultsFailed ? failureMessage : t.emptyTitle}
          </div>
          {!resultsFailed && (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--c-600)",
                marginBottom: 18,
              }}
            >
              {t.emptyBody}
            </div>
          )}
          {resultsFailed ? (
            <Button kind="secondary" size="sm" onClick={() => void runFetch()}>
              {t.retry}
            </Button>
          ) : (
            <Button kind="secondary" size="sm" onClick={clearFilters}>
              {t.clearFilters}
            </Button>
          )}
        </div>
      ) : (
        <>
          {locationRows.map(({ id, data }) => (
            <div key={`loc-${id}`} data-biz={id}>
              <BusinessRow
                b={data}
                selected={id === selectedId || id === hoverId}
                favorited={locFav.isFavorited(id)}
                onFavorite={locFav.canFavorite ? locFav.toggle : undefined}
                onHover={() => setHoverId(id)}
                onLeave={() => setHoverId(null)}
              />
            </div>
          ))}
          {businessRows.map(({ id, data }) => (
            <div key={`biz-${id}`}>
              <BusinessRow
                b={data}
                favorited={bizFav.isFavorited(id)}
                onFavorite={bizFav.canFavorite ? bizFav.toggle : undefined}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );

  // ── The floating browse rail ─────────────────────────────────────────────
  // A search is running once something names the query. A date alone is a
  // detail of the search bar, not a search — same rule the mobile app applies.
  const searchActive =
    !!derived.search || !!derived.industrySlug || !!derived.tagIds?.length;

  const onPickTag = useCallback(
    (industry: Industry, tagId: number) => {
      // A jump, not an added filter: the chip replaces whatever was typed.
      updateParams({
        search: null,
        industry: industry.slug,
        tagIds: String(tagId),
      });
    },
    [updateParams],
  );

  // ── Map ──────────────────────────────────────────────────────────────────
  // The desktop results panel floats OVER the map's left edge, so the camera
  // fit has to know about it or every result set puts pins underneath it. The
  // number mirrors the panel's own geometry below: 16px inset + its width.
  const panelInsetPx = isMobile ? 0 : PANEL_EDGE_PX + panelWidthPx;

  const mapSurfaceInner = (
    <MapboxSurface
      ref={mapHandleRef}
      pins={pins}
      selectedId={selectedId}
      hoverId={hoverId}
      userPos={deviceLocation}
      onSelect={onPinSelect}
      onDismiss={() => setSelectedId(null)}
      onHover={isMobile ? undefined : setHoverId}
      onRecenter={requestLocation}
      recenterAria={t.recenterAria}
      pinListLabel={t.pinListLabel}
      language={locale}
      loading={loading}
      locating={locating}
      anchor={searchAnchor}
      onSearchArea={onSearchArea}
      searchAreaLabel={t.searchThisArea}
      onUserMoveStart={onUserMoveStart}
      onFirstPaint={onMapFirstPaint}
      chromeHidden={isMobile && sheetPosition === "top"}
      unavailableLabel={t.mapUnavailable}
      fitInset={{ left: panelInsetPx }}
      // Clear the browse rail while it is up; reclaim the space once it steps
      // aside, so the "Search this area" pill sits where the eye expects it.
      topInset={searchActive ? 16 : 64}
      // Above the floating card, and above the mobile sheet's peek.
      controlsBottom={isMobile ? 200 : selectedCardData ? 128 : 24}
      viewedIds={viewedIds}
    >
      {/* Browse rail — floats over the map, clear of the desktop results
          panel. Steps aside the moment a search names the query. */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: isMobile ? 0 : panelInsetPx + 16,
          right: 0,
          zIndex: 36,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <TagRail
            industries={industries}
            onPick={onPickTag}
            onMore={editSearch}
            hidden={searchActive || (isMobile && sheetPosition === "top")}
          />
        </div>
      </div>
      <LocationPermissionModal
        open={locationModalOpen}
        onAllow={() => void handleAllow()}
        onSkip={() => void handleSkip()}
        busy={locationBusy}
        title={t.locationModalTitle}
        body={t.locationModalBody}
        allowLabel={t.locationModalAllow}
        skipLabel={t.locationModalSkip}
      />
      <FiltersPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={applyFilters}
        listings={locations}
        distanceFor={distanceFor}
        dictionaries={venueTagDictionaries}
      />
      {selectedCardData ? (
        // On mobile the card and the sheet compete for the same strip of
        // screen, so the card fades and slides out as the sheet is dragged up
        // — on the sheet's own clock, published as CSS vars, so following it
        // costs no re-render per frame. Inert on desktop: no sheet, no vars.
        <div
          style={{
            opacity: "calc(1 - var(--zv-sheet-raise, 0))",
            transform: "translateY(calc(var(--zv-sheet-raise, 0) * 24px))",
            transition: "var(--zv-sheet-t, none)",
            pointerEvents: sheetPosition === "down" ? "auto" : "none",
          }}
        >
          <MapFloatingCard
            key={selectedCardData.id}
            data={selectedCardData}
            favorited={locFav.isFavorited(Number(selectedCardData.id))}
            onFavorite={locFav.canFavorite ? locFav.toggle : undefined}
            onClose={() => setSelectedId(null)}
            closeAria={t.closePinCard}
            bottomOffset={isMobile ? 128 : 28}
            insetLeft={isMobile ? "0px" : "calc(32px + min(424px, 36vw))"}
            insetRight="0px"
          />
        </div>
      ) : null}
    </MapboxSurface>
  );

  const mapSurface = (
    <>
      {mapMounted && mapSurfaceInner}
      {skeletonMounted && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            // Above the map's own chrome (controls 30, rail 36, pill 40) and
            // below the results surfaces (sheet 42, card 45, panel 47), which
            // already have real rows to show while the tiles arrive.
            zIndex: 41,
            opacity: mapPainted ? 0 : 1,
            transition: "opacity .3s var(--ease-out)",
            pointerEvents: "none",
          }}
        >
          <MapSkeleton railInsetLeft={isMobile ? 0 : panelInsetPx} />
        </div>
      )}
    </>
  );

  // ── Mobile: the map, with the results on a sheet over it ────────────────
  if (isMobile) {
    return (
      <main
        style={{
          position: "relative",
          height: `calc(100dvh - var(--nav-h) - ${tabBarH}px)`,
          overflow: "hidden",
        }}
      >
        {mapSurface}
        <BottomSheet
          ref={sheetRef}
          initialPosition="mid"
          onPositionChange={setSheetPosition}
          handleAria={t.sheetHandleAria}
          header={panelHeader}
        >
          {resultList}
        </BottomSheet>
      </main>
    );
  }

  // ── Desktop: full-bleed map + floating panel ─────────────────────────────
  return (
    <main
      style={{
        position: "relative",
        height: "calc(100dvh - var(--nav-h))",
        overflow: "hidden",
      }}
    >
      {mapSurface}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          bottom: 16,
          zIndex: 47,
          width: "min(424px, 36vw)",
          background: "rgba(255,255,255,0.97)",
          borderRadius: 22,
          boxShadow: "var(--sh-xl)",
          border: "1px solid rgba(28,28,26,0.07)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {panelHeader}
        {resultList}
      </div>
    </main>
  );
}
