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
import { format } from "@/i18n/format";
import { Kicker } from "@/components/ui/kicker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { InlineError } from "@/components/ui/inline-error";
import { useToast } from "@/components/ui";
import { MAPBOX_TOKEN } from "@/lib/env";
import { SearchPageSkeleton } from "@/components/ui/page-skeletons";
import searchStyles from "@/components/search/search-layout.module.css";
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
import { getIndustries, searchListings } from "@/lib/api/marketplace/public";
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
import { getBrowserLocation, ipLocate, resolveCity } from "@/lib/geocoding";
import { CITY_ENTRIES, slugifyRo } from "@/data/seo";
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

function deriveSearchParams(params: Pick<URLSearchParams, "get">): DerivedParams {
  return {
    search: params.get("search") ?? undefined,
    industrySlug: params.get("industry") ?? undefined,
    tagIds: csvNums(params.get("tagIds")),
    city: params.get("city") ?? undefined,
    date: params.get("date") ?? undefined,
    lat: numParam(params.get("lat")),
    lng: numParam(params.get("lng")),
    offset: 0,
    limit: SEARCH_LIMIT,
  };
}

function searchRequestKey(params: DerivedParams): string {
  return JSON.stringify([
    params.search, params.industrySlug, params.tagIds,
    params.city, params.date, params.lat, params.lng,
  ]);
}

function cameraRequestKey(params: DerivedParams, filters: MapFilters, focus: number | null): string {
  return JSON.stringify([
    searchRequestKey(params), { ...filters, sort: EMPTY_FILTERS.sort }, focus,
  ]);
}

export interface SearchContentProps {
  locale: Locale;
  industries: Industry[];
  initialIndustriesFailed: boolean;
  initialResult: SearchListingsResult;
  // True when the SERVER-side initial fetch failed (page.tsx swallowed the
  // error into EMPTY_RESULT so the page itself stays render-safe). Lets the
  // empty state below tell "the backend is down" apart from "no places match".
  initialResultFailed: boolean;
}

export function SearchContent({
  locale,
  industries: initialIndustries,
  initialIndustriesFailed,
  initialResult,
  initialResultFailed,
}: SearchContentProps) {
  const { dict } = useTranslation();
  const t = dict.search;
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { openSearch } = useSearchOverlay();
  const [industries, setIndustries] = useState(initialIndustries);
  const [industriesFailed, setIndustriesFailed] = useState(initialIndustriesFailed);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const retryIndustries = async () => {
    setIndustriesLoading(true);
    try {
      setIndustries(await getIndustries());
      setIndustriesFailed(false);
    } catch {
      setIndustriesFailed(true);
    } finally {
      setIndustriesLoading(false);
    }
  };
  // Result rows are location-sourced; the supplementary business rows use the
  // business endpoint family. Hearts hide entirely when signed out.
  const locFav = useFavoriteToggle("location");
  const bizFav = useFavoriteToggle("business");

  // ── Derive the request from URL params ──────────────────────────────────
  // `radius` is NOT read from the URL: like the mobile app, every point-anchored
  // query uses one fixed radius, and "show me somewhere smaller" is the
  // client-side `maxDistanceKm` filter instead. Reading it here while sending a
  // fixed radius is how a shared ?radius=5 link used to return 20km of results.
  const derived = useMemo(() => deriveSearchParams(sp), [sp]);

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
  const requestKey = searchRequestKey(derived);
  const focusId = numParam(sp.get("focus")) ?? null;
  // Sorting changes row order, not the set of places the camera should reveal.
  const cameraKey = cameraRequestKey(derived, filters, focusId);
  const handledCameraKey = useRef<string | null>(null);
  const cameraArrived = useRef(false);
  const lastCameraAnchor = useRef("");

  // ── Result state (one fetch replaces the whole set; no pagination) ──────
  const [locations, setLocations] = useState<LocationCard[]>(
    initialResult.locations,
  );
  const [businesses, setBusinesses] = useState(initialResult.businesses);
  const [loading, setLoading] = useState(false);
  // Previous results remain visible while fetching; never aim a new search at them.
  const [resultsKey, setResultsKey] = useState(requestKey);

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
  const [selectedId, setSelectedId] = useState<number | null>(focusId);
  const [selectionContext, setSelectionContext] = useState({ requestKey, focusId });
  if (selectionContext.requestKey !== requestKey || selectionContext.focusId !== focusId) {
    setSelectionContext({ requestKey, focusId });
    setSelectedId(focusId);
  }
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The venue-tag vocabulary behind the panel's FEATURES sections. Fetched once
  // per page load and shared; failed requests have a local retry in the panel.
  const venueTags = useVenueTags();
  const venueTagDictionaries = venueTags.dictionaries;

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
  const [sheetGeometry, setSheetGeometry] = useState<{
    height: number;
    position: SheetPosition;
  } | null>(null);
  const onSheetHeightChange = useCallback((height: number, position: SheetPosition) => {
    setSheetGeometry({ height, position });
  }, []);

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

  // Keep the map covered until its first real paint. A timeout offers recovery
  // instead of pretending an unresolved canvas has loaded.
  const [mapPainted, setMapPainted] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const onMapFirstPaint = useCallback(() => { setMapPainted(true); setMapFailed(false); }, []);

  // ── Responsive flag (window.matchMedia) ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => { setIsMobile(mq.matches); setViewportReady(true); };
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
      setResultsKey(requestKey);
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
  }, [derived, hasGeo, requestKey, dict.errors, t.retry, t.retryError, toast]);

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
    (patch: Record<string, string | null>, options?: { preserveCamera: boolean }) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      // No pagination — strip any stale offset param from older URLs.
      if (!("offset" in patch)) next.delete("offset");
      const nextDerived = deriveSearchParams(next);
      const nextFilters = parseFilters(next);
      // A new search replaces a business deep link; sorting alone preserves it.
      if (!("focus" in patch) &&
          cameraRequestKey(nextDerived, nextFilters, null) !==
          cameraRequestKey(derived, filters, null)) {
        next.delete("focus");
      }
      if (options?.preserveCamera) {
        handledCameraKey.current = cameraRequestKey(
          nextDerived, nextFilters, numParam(next.get("focus")) ?? null,
        );
      }
      const qs = next.toString();
      router.replace(localeHref(locale, "search") + (qs ? `?${qs}` : ""));
    },
    [sp, router, locale, derived, filters],
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

  // City-only links deliberately search the whole city. Resolve a camera
  // target separately: adding these coordinates to the URL/API would turn that
  // into a city AND radius search and could exclude legitimate results.
  const cameraCity = !hasGeo ? derived.city?.trim() || null : null;
  const [cityCamera, setCityCamera] = useState<{
    city: string;
    point: GeoPoint | null;
  } | null>(null);
  useEffect(() => {
    if (!cameraCity) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let active = true;
    const knownCity = CITY_ENTRIES.find((entry) =>
      Object.values(entry.name).some((name) => slugifyRo(name) === slugifyRo(cameraCity)),
    );
    void resolveCity(cameraCity, controller.signal, {
      countryCode: knownCity?.countryCode,
      aliases: knownCity ? Object.values(knownCity.name) : undefined,
    }).then((point) => {
      if (active) setCityCamera({ city: cameraCity, point });
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cameraCity]);
  const cityCameraPending = !!cameraCity && cityCamera?.city !== cameraCity;
  const resolvedCityPoint = cityCamera?.city === cameraCity ? cityCamera?.point : null;
  const mapEnabled = !cameraCity || !!resolvedCityPoint;
  useEffect(() => {
    if (mapPainted || !mapMounted || !mapEnabled || !MAPBOX_TOKEN) return;
    const timer = window.setTimeout(() => setMapFailed(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [mapPainted, mapMounted, mapEnabled, mapAttempt]);

  // Camera and "Search this area" origin, never the user dot. `hasGeo` and
  // distance filters still depend only on actual coordinates in the URL.
  const searchAnchor: GeoPoint | null = useMemo(
    () => hasGeo && derived.lat != null && derived.lng != null
      ? { lat: derived.lat, lng: derived.lng }
      : resolvedCityPoint ?? null,
    [hasGeo, derived.lat, derived.lng, resolvedCityPoint],
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

  // A gesture takes ownership even when search results are still arriving.
  const onUserMoveStart = useCallback(() => {
    handledCameraKey.current = cameraKey;
    sheetRef.current?.snapTo("down");
  }, [cameraKey]);

  // The visitor has already positioned the camera for "Search this area".
  const onSearchArea = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      updateParams({
        city: null,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
      }, { preserveCamera: true });
    },
    [updateParams],
  );

  // ── Location-permission resolution ───────────────────────────────────────
  // Writing lat/lng makes `hasGeo` true (modal won't reopen) and triggers the
  // existing requestKey fetch. Always fixed 20km radius.
  const applyAnchor = useCallback(
    (p: GeoPoint) => {
      updateParams({
        city: null,
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
      // This explicit destination owns the camera, including after its fetch.
      mapHandleRef.current?.flyTo(loc);
      updateParams({
        city: null,
        lat: loc.lat.toFixed(6),
        lng: loc.lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
      }, { preserveCamera: true });
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

  // One camera intent per search/refinement, after matching results and the
  // map are ready. Like the app, reveal off-screen matches without zooming in;
  // background renders, sorting and manually searched areas leave the view alone.
  const anchorKey = searchAnchor ? `${searchAnchor.lat},${searchAnchor.lng}` : "";
  useEffect(() => {
    const map = mapHandleRef.current;
    if (
      !mapMounted || !mapEnabled || !map || loading || resultsFailed || lastError ||
      resultsKey !== requestKey ||
      (isMobile && (
        !sheetGeometry || sheetGeometry.position !== sheetPosition || sheetPosition === "top"
      ))
    ) return;
    const anchorChanged = lastCameraAnchor.current !== anchorKey;
    lastCameraAnchor.current = anchorKey;
    if (handledCameraKey.current === cameraKey) return;

    const focusedPin = focusId == null ? undefined : pins.find((pin) => pin.id === focusId);
    const duration = cameraArrived.current ? 450 : 0;
    if (focusedPin) {
      map.flyTo(focusedPin, { zoom: 14, duration });
    } else if (pins.length) {
      map.revealPins(pins, { duration });
    } else if (searchAnchor && (anchorChanged || !cameraArrived.current)) {
      map.flyTo(searchAnchor, { duration });
    }
    handledCameraKey.current = cameraKey;
    cameraArrived.current = true;
  }, [mapMounted, mapEnabled, loading, resultsFailed, lastError, resultsKey,
    requestKey, cameraKey, focusId, pins, searchAnchor, anchorKey,
    isMobile, sheetGeometry, sheetPosition]);

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
    <div className={searchStyles.header}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <Kicker style={{ marginBottom: 5 }}>{t.inThisArea}</Kicker>
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <div
            aria-busy={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 21,
              minWidth: 166,
              flexShrink: 0,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--c-900)",
            }}
          >
            {loading && locations.length === 0 && businesses.length === 0 ? (
              <div aria-hidden="true" style={{ height: "1.5em", display: "flex", alignItems: "center" }}><Skeleton w={144} h={21} /></div>
            ) : (
              format(resultCount === 1 ? t.resultCountOne : t.resultCount, {
                count: String(resultCount),
              })
            )}
            <span aria-hidden="true" style={{ width: 14, height: 14 }}>
              {loading && <Spinner size={14} color="var(--c-600)" />}
            </span>
          </div>
          <span role="status" aria-atomic="true" className="sr-only">
            {loading ? t.updating : ""}
          </span>
          <button
            type="button"
            className="tap"
            onClick={editSearch}
            aria-label={`${t.editSearch}: ${queryLabel}`}
            title={queryLabel}
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
              minWidth: 0,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{queryLabel}</span>
            <Icon name="pencil" size={12} color="var(--c-500)" style={{ flexShrink: 0 }} />
          </button>
          </div>
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
      {industriesFailed && <div style={{ display: "grid", gap: 8 }}>
        <InlineError>{dict.searchOverlay.industriesError}</InlineError>
        <Button kind="secondary" size="sm" loading={industriesLoading} onClick={() => void retryIndustries()} style={{ justifySelf: "start" }}>{t.retry}</Button>
      </div>}
    </div>
  );

  // ── Result list ─────────────────────────────────────────────────────────
  const resultList = (
    <div
      ref={listRef}
      data-locale-scroll="search-results"
      className="zw-scroll-y"
      style={{ flex: 1, padding: "4px 10px 16px", position: "relative" }}
    >
      {loading && locations.length === 0 && businesses.length === 0 && !resultsFailed ? (
        <div aria-label={t.updating}>
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
            <Button kind="secondary" size="sm" loading={loading} onClick={() => void runFetch()}>
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
      key={mapAttempt}
      reuseMap={mapAttempt === 0}
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
      enabled={mapEnabled}
      unavailableLabel={cityCameraPending ? (
        <>
          <MapSkeleton railInsetLeft={isMobile ? 0 : panelInsetPx + 16} controlsBottom={isMobile ? 200 : selectedCardData ? 128 : 24} showRail={industries.length > 0 && !searchActive && !(isMobile && sheetPosition === "top")} showControls={!(isMobile && sheetPosition === "top")} />
          <span role="status" className="sr-only">{t.updating}</span>
        </>
      ) : t.mapUnavailable}
      fitInset={{
        left: panelInsetPx,
        top: searchActive ? 16 : 64,
        bottom: isMobile ? (sheetGeometry?.height ?? 0) : 16,
      }}
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
        dictionariesLoading={venueTags.loading}
        dictionariesFailed={venueTags.failed}
        dictionariesLoaded={venueTags.loaded}
        onRetryDictionaries={venueTags.retry}
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
      {mapFailed && <div style={{ position: "absolute", inset: 0, left: isMobile ? 0 : panelInsetPx + 16, zIndex: 41, background: "#EEEAE0", display: "grid", alignContent: "start", justifyItems: "center", gap: 12, padding: "80px 24px" }}>
        <p style={{ margin: 0, color: "var(--c-700)" }}>{t.mapUnavailable}</p>
        <Button kind="secondary" size="sm" onClick={() => { setMapFailed(false); setMapPainted(false); setMapAttempt(value => value + 1); }}>{t.retry}</Button>
      </div>}
      {!mapPainted && !mapFailed && !!MAPBOX_TOKEN && mapEnabled && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            // Above the map's own chrome (controls 30, rail 36, pill 40) and
            // below the results surfaces (sheet 42, card 45, panel 47), which
            // already have real rows to show while the tiles arrive.
            zIndex: 41,
            pointerEvents: "none",
          }}
        >
          <MapSkeleton railInsetLeft={isMobile ? 0 : panelInsetPx + 16} controlsBottom={isMobile ? 200 : selectedCardData ? 128 : 24} showRail={industries.length > 0 && !searchActive && !(isMobile && sheetPosition === "top")} showControls={!(isMobile && sheetPosition === "top")} />
        </div>
      )}
    </>
  );

  // Use the same CSS-responsive shell during hydration; never flash the
  // desktop layout before matchMedia resolves on a phone.
  if (!viewportReady || (isMobile && tabBarH === 0)) return <SearchPageSkeleton showRail={industries.length > 0 && !searchActive} desktopControlsBottom={selectedCardData ? 128 : 24} />;

  // ── Mobile: the map, with the results on a sheet over it ────────────────
  if (isMobile) {
    return (
      <main className={searchStyles.shell} style={{ height: `calc(100dvh - var(--nav-h) - ${tabBarH}px)` }}>
        {mapSurface}
        <BottomSheet
          ref={sheetRef}
          initialPosition="mid"
          onPositionChange={setSheetPosition}
          onVisibleHeightChange={onSheetHeightChange}
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
    <main className={searchStyles.shell}>
      {mapSurface}
      <div className={searchStyles.panel}>
        {panelHeader}
        {resultList}
      </div>
    </main>
  );
}
