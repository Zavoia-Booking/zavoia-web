"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/format";
import { Kicker } from "@/components/ui/kicker";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
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
  taxonomyLabel,
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
  SearchListingsResult,
} from "@/lib/api/marketplace/types";
import { useServiceCatalog } from "@/components/search/service-catalog-provider";
import {
  MapboxSurface,
  DEFAULT_ZOOM,
  PLACE_ZOOM,
  RECENTER_ZOOM,
  type GeoPin,
  type GeoPoint,
  type MapboxSurfaceHandle,
} from "@/components/search/mapbox-surface";
import {
  DEFAULT_ANCHOR,
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
import { deriveSearchParams, hasLocationRefinements, numberParam as numParam, patchSearchParams, searchRequestKey, toSearchListingsParams, type SearchQuery } from "@/lib/search/query";
import { useFavoriteToggle } from "@/app/_components/home/use-favorite-toggle";
import { TagRail } from "@/components/search/tag-rail";
import {
  BottomSheet,
  type BottomSheetHandle,
  type SheetPosition,
} from "@/components/search/bottom-sheet";
import { MapSkeleton } from "@/components/search/map-skeleton";

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
type DerivedParams = SearchQuery;

function cameraRequestKey(params: DerivedParams, filters: MapFilters, focus: number | null): string {
  return JSON.stringify([
    searchRequestKey(params), { ...filters, sort: EMPTY_FILTERS.sort }, focus, params.mapZoom,
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
  const { openCatalog } = useServiceCatalog();
  const [industries, setIndustries] = useState(initialIndustries);
  const [industriesFailed, setIndustriesFailed] = useState(initialIndustriesFailed);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const retryIndustries = async () => {
    setIndustriesLoading(true);
    try {
      setIndustries(await getIndustries({ order: "api" }));
      setIndustriesFailed(false);
    } catch {
      setIndustriesFailed(true);
    } finally {
      setIndustriesLoading(false);
    }
  };
  // Result rows are location-sourced. The supplementary business rows carry no
  // heart: customers save locations and people only. Signed out, a heart asks
  // the user to sign in.
  const locFav = useFavoriteToggle("location");
  const isLocationFavorited = locFav.isFavorited;

  // Server and client share parsing, including the 20–50km area-search radius.
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
  const anchorZoom = derived.mapZoom ?? (hasGeo && derived.city ? PLACE_ZOOM : DEFAULT_ZOOM);

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
  const [totalLocations, setTotalLocations] = useState(initialResult.total);
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
  const measureResultPhotosRef = useRef<(() => void) | null>(null);
  const lastScrolledSelectionRef = useRef<{ id: number; list: HTMLDivElement } | null>(null);
  const initialFocusScrollPendingRef = useRef(true);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const mapHandleRef = useRef<MapboxSurfaceHandle>(null);
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>("mid");
  const [sheetGeometry, setSheetGeometry] = useState<{
    height: number;
    position: SheetPosition;
    containerHeight: number;
  } | null>(null);
  const onSheetHeightChange = useCallback((height: number, position: SheetPosition) => {
    setSheetGeometry({ height, position, containerHeight: listRef.current?.closest("main")?.clientHeight ?? 0 });
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

  // ── Fetch on param change ───────────────────────────────────────────────
  // Single area-scoped call (limit 300, offset 0) that REPLACES results — no
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
    // Coordinate searches use their radius; a city-only search uses its name.
    // A point's human-readable city label must not become an extra API filter.
    const params = toSearchListingsParams(derived);
    setLoading(true);
    try {
      const res = await searchListings(params);
      // Stale-response guard: a slower response for an earlier query must
      // never overwrite a newer one's results.
      if (id !== requestIdRef.current) return;
      // keepPreviousData: only swap in the new set on success, so previous rows
      // + pins stay visible while refetching.
      setLocations(res.locations);
      setBusinesses(res.businesses);
      setTotalLocations(res.total);
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
  }, [derived, requestKey, dict.errors, t.retry, t.retryError, toast]);

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
      const next = patchSearchParams(new URLSearchParams(sp.toString()), patch);
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
  const favoriteIds = useMemo(
    () => new Set(locations.filter(location => isLocationFavorited(location.id) === true).map(location => location.id)),
    [locations, isLocationFavorited],
  );

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

  // Brand summaries are separate from places and cannot satisfy location-only
  // refinements (hours, distance or features). Never inflate the place count.
  const businessRows: { id: number; data: BusinessCardData }[] = useMemo(() => {
    if (!derived.search || derived.date || derived.industrySlug || derived.tagIds?.length || hasLocationRefinements(filters)) return [];
    return businesses.map((b) => ({
      id: b.id,
      data: businessCardToData(b, locale, slugById),
    }));
  }, [businesses, derived.search, derived.date, derived.industrySlug, derived.tagIds, filters, locale, slugById]);

  const resultCount = visibleLocations.length;
  const resultsLimited = totalLocations > locations.length;
  const [eagerResultPhotos, setEagerResultPhotos] = useState<Set<string>>(() => new Set());
  const firstResultPhotoKey = eagerResultPhotos.values().next().value;
  // Reused assets share one request and Next's LCP bookkeeping. Keep their
  // loading policy consistent when any occurrence is visible or selected.
  const eagerResultPhotoSources = useMemo(() => {
    const sources = new Set<string>();
    for (const { id, data } of locationRows) {
      if (data.image && eagerResultPhotos.has(`loc-${id}`)) sources.add(data.image);
    }
    for (const { id, data } of businessRows) {
      if (data.image && eagerResultPhotos.has(`biz-${id}`)) sources.add(data.image);
    }
    if (selectedCardData?.image) sources.add(selectedCardData.image);
    return sources;
  }, [locationRows, businessRows, eagerResultPhotos, selectedCardData]);

  // Promote only photos in the actual visible list viewport before paint.
  // Measuring the DOM handles different screen heights, localized headers,
  // missing photos and supplementary business rows without a fixed row count.
  useLayoutEffect(() => {
    const list = listRef.current;
    const main = list?.closest("main");
    if (!list || !main) return;
    const measure = () => {
      const listBounds = list.getBoundingClientRect();
      const mainBounds = main.getBoundingClientRect();
      let visibleTop = Math.max(listBounds.top, mainBounds.top, 0);
      let visibleBottom = Math.min(listBounds.bottom, mainBounds.bottom, window.innerHeight);
      if (isMobile) {
        const sheet = list.closest<HTMLElement>("[data-sheet-position]");
        if (!sheet || !sheetGeometry || sheetGeometry.position !== sheetPosition) return;
        // The sheet moves with a transform, so its content height alone also
        // includes rows below the clipped map. Use its measured resting overlap
        // to promote the destination's visible photos during a snap as well.
        const headerHeight = listBounds.top - sheet.getBoundingClientRect().top;
        visibleTop = listBounds.top;
        visibleBottom = listBounds.top + Math.max(0, Math.min(listBounds.height, sheetGeometry.height - headerHeight));
      }
      const visible = new Set<string>();
      for (const row of list.querySelectorAll<HTMLElement>("[data-result-key]")) {
        const photo = row.querySelector<HTMLImageElement>("img[data-result-photo]");
        if (!photo) continue;
        const bounds = photo.getBoundingClientRect();
        if (bounds.bottom > visibleTop && bounds.top < visibleBottom && visibleBottom > visibleTop) {
          visible.add(row.dataset.resultKey!);
        }
      }
      const keys = [...visible];
      setEagerResultPhotos(previous => previous.size === visible.size && [...previous].every((key, index) => key === keys[index]) ? previous : visible);
    };
    measureResultPhotosRef.current = measure;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(main);
    list.addEventListener("scrollend", measure);
    return () => {
      observer.disconnect();
      list.removeEventListener("scrollend", measure);
      if (measureResultPhotosRef.current === measure) measureResultPhotosRef.current = null;
    };
  }, [locationRows, businessRows, viewportReady, isMobile, tabBarH, sheetPosition, sheetGeometry]);

  // ── Selecting a pin scrolls its row near the top of the list ────────────
  // Rect-delta (not offsetTop, whose offsetParent is this positioned container)
  // so the selected row lands ~12px below the top of the list viewport.
  useLayoutEffect(() => {
    const container = listRef.current;
    if (!container) return;
    if (selectedId == null) {
      lastScrolledSelectionRef.current = null;
      initialFocusScrollPendingRef.current = false;
      return;
    }
    const previous = lastScrolledSelectionRef.current;
    if (previous?.id === selectedId && previous.list === container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-biz="${selectedId}"]`,
    );
    if (!el) return;
    const initialFocus = initialFocusScrollPendingRef.current && selectedId === focusId;
    initialFocusScrollPendingRef.current = false;
    lastScrolledSelectionRef.current = { id: selectedId, list: container };
    const delta =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
    // The first pass can run while only the page skeleton exists. Once the
    // real list mounts, settle a deep link before paint; later pin selections
    // retain their normal smooth scroll and do not re-anchor on data refreshes.
    container.scrollTo({ top: container.scrollTop + delta, behavior: initialFocus || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    measureResultPhotosRef.current?.();
  }, [selectedId, focusId, viewportReady, isMobile, tabBarH, locationRows]);

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
    ({ lat, lng, radiusKm, zoom }: { lat: number; lng: number; radiusKm: number; zoom: number }) => {
      updateParams({
        city: null,
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        radius: String(radiusKm),
        mapZoom: String(zoom),
      }, { preserveCamera: true });
    },
    [updateParams],
  );

  // ── Location-permission resolution ───────────────────────────────────────
  // Writing lat/lng makes `hasGeo` true (modal won't reopen) and triggers the
  // existing requestKey fetch. A fresh location starts at the 20km base radius.
  const applyAnchor = useCallback(
    (p: GeoPoint) => {
      updateParams({
        city: null,
        lat: p.lat.toFixed(6),
        lng: p.lng.toFixed(6),
        radius: String(SEARCH_RADIUS_KM),
        mapZoom: String(RECENTER_ZOOM),
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
        mapZoom: String(RECENTER_ZOOM),
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
    } else {
      if (searchAnchor && (anchorChanged || !cameraArrived.current)) {
        map.flyTo(searchAnchor, { zoom: anchorZoom, duration: 0 });
      }
      if (pins.length) map.revealPins(pins, { duration });
    }
    handledCameraKey.current = cameraKey;
    cameraArrived.current = true;
  }, [mapMounted, mapEnabled, loading, resultsFailed, lastError, resultsKey,
    requestKey, cameraKey, focusId, pins, searchAnchor, anchorKey,
    isMobile, sheetGeometry, sheetPosition, anchorZoom]);

  // Transport failures (offline/timeout/rate-limited/5xx) win over the plain
  // "couldn't load results" copy; falls back to it when there's no error to
  // read (the SSR-side failure only carried a boolean, not the ApiError).
  const failureMessage = errorMessage(lastError, dict.errors, t.retryError);

  // ── Header ──────────────────────────────────────────────────────────────
  const panelHeader = (
    <div className={searchStyles.header} data-explore-results-header>
      <div className={searchStyles.headerRow}>
        <div className={searchStyles.summary}>
          <Kicker style={{ marginBottom: 5 }}>{t.inThisArea}</Kicker>
          <div className={searchStyles.resultLine}>
            <div aria-busy={loading} className={searchStyles.count}>
              {loading && locations.length === 0 && businesses.length === 0 ? (
                <div aria-hidden="true" style={{ height: "1.5em", display: "flex", alignItems: "center" }}><Skeleton w={114} h={21} /></div>
              ) : (
                format(resultCount === 1 ? t.resultCountOne : t.resultCount, {
                  count: String(resultCount),
                })
              )}
              <span aria-hidden="true" style={{ width: 14, height: 14, flexShrink: 0 }}>
                {loading && <Spinner size={14} color="var(--c-600)" />}
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                className={`${searchStyles.clearButton} tap`}
                onClick={() => {
                  applyFilters(EMPTY_FILTERS);
                  filtersTriggerRef.current?.focus({ preventScroll: true });
                }}
              >
                {t.clearFilters}
              </button>
            )}
          </div>
          <span role="status" aria-atomic="true" className="sr-only">
            {loading ? t.updating : ""}
          </span>
        </div>
        <button
          ref={filtersTriggerRef}
          type="button"
          className={`${searchStyles.filtersButton} tap`}
          aria-label={activeFilterCount > 0 ? format(t.filters.activeLabel, { count: String(activeFilterCount) }) : t.filters.title}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(true)}
        >
          <Icon name="sliders" size={16} />
          {t.filters.title}
          {activeFilterCount > 0 && <span aria-hidden="true" className={searchStyles.filterCount}>{activeFilterCount}</span>}
        </button>
      </div>
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
      className={`${searchStyles.results} ${searchStyles.resultsFrame}`}
      aria-busy={loading}
    >
      {resultsLimited && <p className={searchStyles.limitNote}>{format(t.resultsLimited, { count: String(locations.length), total: String(totalLocations) })}</p>}
      {loading && locations.length === 0 && businesses.length === 0 && !resultsFailed ? (
        <div className={searchStyles.resultItems} aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : resultCount === 0 && businessRows.length === 0 ? (
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
        <div className={searchStyles.resultItems}>
          {locationRows.map(({ id, data }) => (
            <div key={`loc-${id}`} data-biz={id} data-result-key={`loc-${id}`}>
              <BusinessRow
                b={data}
                imageLoading={data.image && eagerResultPhotoSources.has(data.image) ? "eager" : "lazy"}
                imageFetchPriority={`loc-${id}` === firstResultPhotoKey ? "high" : undefined}
                favorited={locFav.isFavorited(id)}
                onFavorite={locFav.toggle}
              />
            </div>
          ))}
          {businessRows.length > 0 && <section className={searchStyles.resultItems} aria-label={t.matchingBusinesses}>
            <h2 className={searchStyles.businessHeading}>{t.matchingBusinesses}</h2>
            {businessRows.map(({ id, data }) => (
            <div key={`biz-${id}`} data-result-key={`biz-${id}`}>
              <BusinessRow
                b={data}
                imageLoading={data.image && eagerResultPhotoSources.has(data.image) ? "eager" : "lazy"}
                imageFetchPriority={`biz-${id}` === firstResultPhotoKey ? "high" : undefined}
              />
            </div>
            ))}
          </section>}
        </div>
      )}
    </div>
  );

  // ── The floating browse rail ─────────────────────────────────────────────
  // A search is running once something names the query. A date alone is a
  // detail of the search bar, not a search — same rule the mobile app applies.
  const searchActive =
    !!derived.search || !!derived.industrySlug || !!derived.tagIds?.length;
  const activeSelection = useMemo(() => {
    if (!searchActive) return undefined;
    const industry = industries.find(item => item.slug === derived.industrySlug)
      ?? industries.find(item => item.tags.some(tag => derived.tagIds?.includes(tag.id)));
    const tags = (derived.tagIds ?? []).flatMap(id => {
      const tag = industries.flatMap(item => item.tags).find(item => item.id === id);
      return tag ? [taxonomyLabel(tag, locale, dict.industryTags)] : [];
    });
    const tagLabel = tags.length === derived.tagIds?.length ? tags.join(", ") : "";
    return {
      label: derived.search || tagLabel || taxonomyLabel(industry ?? { name: t.selectedServices, slug: derived.industrySlug }, locale, dict.industries),
      industrySlug: derived.search ? undefined : industry?.slug ?? derived.industrySlug,
    };
  }, [searchActive, industries, derived.search, derived.industrySlug, derived.tagIds, locale, dict.industryTags, dict.industries, t.selectedServices]);

  const onClearSelection = useCallback(() => {
    updateParams({ search: null, industry: null, tagIds: null });
  }, [updateParams]);

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
  // The collapsed sheet's measured header, rather than a guessed fixed offset,
  // owns the space under the card and controls. Card height matches its scene.
  const collapsedSheetHeight = sheetGeometry?.position === "down" ? sheetGeometry.height : 0;
  const selectedCardHeight = isMobile && collapsedSheetHeight && sheetGeometry?.containerHeight
    ? Math.min(220, Math.max(156, sheetGeometry.containerHeight - collapsedSheetHeight - 12 - 44 - 12 - 12))
    : 220;
  const selectedCardBottom = isMobile ? collapsedSheetHeight + 12 : 28;
  const mapControlsBottom = isMobile
    ? (sheetGeometry?.height ?? 0) + 12 + (selectedCardData && sheetPosition === "down" ? selectedCardHeight + 12 : 0)
    : 24;
  const reserveRailControls = isMobile && !!sheetGeometry?.containerHeight
    && sheetGeometry.containerHeight - mapControlsBottom - 44 < 64;
  const mapChromeInset = {
    left: isMobile ? 0 : panelInsetPx + 16,
    right: reserveRailControls ? 60 : 0,
  };
  const cardHidden = isMobile && sheetPosition !== "down";
  const mapTopInset = (industries.length > 0 || searchActive) && !(isMobile && sheetPosition === "top") ? 64 : 16;

  const mapSurfaceInner = (
    <MapboxSurface
      key={mapAttempt}
      reuseMap={mapAttempt === 0}
      ref={mapHandleRef}
      pins={pins}
      selectedId={selectedId}
      userPos={deviceLocation}
      onSelect={onPinSelect}
      onDismiss={() => setSelectedId(null)}
      onRecenter={requestLocation}
      recenterAria={t.recenterAria}
      pinListLabel={t.pinListLabel}
      language={locale}
      loading={loading}
      locating={locating}
      anchor={searchAnchor}
      anchorZoom={derived.mapZoom}
      searchRadiusKm={derived.radius ?? SEARCH_RADIUS_KM}
      onSearchArea={onSearchArea}
      searchAreaLabel={t.searchThisArea}
      onUserMoveStart={onUserMoveStart}
      onFirstPaint={onMapFirstPaint}
      chromeHidden={isMobile && sheetPosition === "top"}
      enabled={mapEnabled}
      unavailableLabel={cityCameraPending ? (
        <>
          <MapSkeleton showRail={false} showControls={false} />
          <span role="status" className="sr-only">{t.updating}</span>
        </>
      ) : t.mapUnavailable}
      fitInset={{
        left: panelInsetPx,
        top: mapTopInset,
        bottom: isMobile ? (sheetGeometry?.height ?? 0) : 16,
      }}
      // Both discovery chips and the removable selection occupy this row.
      topInset={mapTopInset}
      chromeInset={mapChromeInset}
      // Above the floating card, and above the mobile sheet's peek.
      controlsBottom={mapControlsBottom}
      favoriteIds={favoriteIds}
    >
      {/* Browse or clear the current service, above the usable map area. */}
      <div
        style={{
          position: "absolute",
          top: 12,
          ...mapChromeInset,
          zIndex: 36,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <TagRail
            industries={industries}
            onPick={onPickTag}
            activeSelection={activeSelection}
            onClear={onClearSelection}
            onMore={() => openCatalog({
              industries,
              onSelect: (industry, tag) => onPickTag(industry, tag.id),
            })}
            hidden={isMobile && sheetPosition === "top"}
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
          inert={cardHidden}
          aria-hidden={cardHidden || undefined}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 45,
            opacity: cardHidden ? 0 : "calc(1 - var(--zv-sheet-raise, 0))",
            transform: "translateY(calc(var(--zv-sheet-raise, 0) * 24px))",
            transition: "var(--zv-sheet-t, none)",
            pointerEvents: "none",
            "--zv-selected-card-height": `${selectedCardHeight}px`,
          } as CSSProperties}
        >
          <MapFloatingCard
            key={selectedCardData.id}
            data={selectedCardData}
            favorited={locFav.isFavorited(Number(selectedCardData.id))}
            onFavorite={locFav.toggle}
            onClose={() => setSelectedId(null)}
            closeAria={t.closePinCard}
            bottomOffset={selectedCardBottom}
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
          data-explore-map-loading
          style={{
            position: "absolute",
            inset: 0,
            // Cover only unresolved tiles. Keep the already-resolved browse
            // rail, recenter control and result surfaces visible and usable.
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <MapSkeleton showRail={false} showControls={false} />
        </div>
      )}
    </>
  );

  // Use the same CSS-responsive shell during hydration; never flash the
  // desktop layout before matchMedia resolves on a phone.
  if (!viewportReady || (isMobile && tabBarH === 0)) return (
    <SearchPageSkeleton
      showRail={industries.length > 0 || searchActive}
      activeFilterCount={activeFilterCount}
    />
  );

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
