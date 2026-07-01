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
  toCat,
} from "@/lib/marketplace/card-mappers";
import { searchListings } from "@/lib/api/marketplace/public";
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
} from "@/components/search/mapbox-surface";
import { isOpenNow } from "@/components/search/open-now";
import {
  DEFAULT_ANCHOR,
  SEARCH_LIMIT,
  SEARCH_RADIUS_KM,
} from "@/components/search/constants";
import { LocationPermissionModal } from "@/components/search/location-permission-modal";
import { MapFloatingCard } from "@/components/search/map-floating-card";
import { ipLocate } from "@/lib/geocoding";
import { SortMenu, type SortId } from "./sort-menu";
import { FilterRow } from "./filter-row";

const MOBILE_MQ = "(max-width: 920px)";

// localStorage flag remembering a previous "Not now" so the priming modal
// doesn't reappear on later visits.
const LOC_SKIP_KEY = "zv-loc-skip";

// The shape of the search request derived from URL params (sort is client-side
// only, so it lives outside SearchListingsParams).
interface DerivedParams extends SearchListingsParams {
  sort: SortId;
}

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
}

export function SearchContent({
  locale,
  industries,
  initialResult,
}: SearchContentProps) {
  const { dict } = useTranslation();
  const t = dict.search;
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const { openSearch } = useSearchOverlay();

  // ── Derive the request from URL params ──────────────────────────────────
  const derived: DerivedParams = useMemo(() => {
    const sortRaw = sp.get("sort");
    const sort: SortId =
      sortRaw === "rating" || sortRaw === "near" ? sortRaw : "rec";
    return {
      search: sp.get("search") ?? undefined,
      industrySlug: sp.get("industry") ?? undefined,
      tagIds: csvNums(sp.get("tagIds")),
      city: sp.get("city") ?? undefined,
      date: sp.get("date") ?? undefined,
      lat: numParam(sp.get("lat")),
      lng: numParam(sp.get("lng")),
      radius: numParam(sp.get("radius")),
      offset: 0,
      limit: SEARCH_LIMIT,
      sort,
    };
  }, [sp]);

  const hasGeo = derived.lat != null && derived.lng != null;

  // A stable key for the current request (excludes client-only sort), used to
  // trigger a fresh single fetch when any geo/filter param changes.
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
        derived.radius ?? "",
      ].join("|"),
    [derived],
  );

  // ── Result state (one fetch replaces the whole set; no pagination) ──────
  const [locations, setLocations] = useState<LocationCard[]>(
    initialResult.locations,
  );
  const [businesses, setBusinesses] = useState(initialResult.businesses);
  const [fallback, setFallback] = useState(initialResult.fallback);
  const [loading, setLoading] = useState(false);

  // Skip the very first fetch when the server already provided a matching
  // result for the initial request key.
  const firstRun = useRef(true);
  const lastKey = useRef(requestKey);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [isMobile, setIsMobile] = useState(false);

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

  // ── Responsive flag (window.matchMedia) ─────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── Fetch on param change ───────────────────────────────────────────────
  // Single fixed-radius call (limit 300, offset 0) that REPLACES results — no
  // pagination. Held in a ref so the retry-toast callback can re-invoke the
  // latest fetch without referencing `runFetch` before its own declaration.
  const runFetchRef = useRef<() => Promise<void>>(async () => {});

  const runFetch = useCallback(async () => {
    const params: SearchListingsParams = {
      search: derived.search,
      industrySlug: derived.industrySlug,
      tagIds: derived.tagIds,
      city: derived.city,
      date: derived.date,
      lat: derived.lat,
      lng: derived.lng,
      // Fixed 20km radius whenever we have an anchor; omit otherwise.
      radius:
        derived.lat != null && derived.lng != null
          ? SEARCH_RADIUS_KM
          : undefined,
      limit: SEARCH_LIMIT,
      offset: 0,
    };
    setLoading(true);
    try {
      const res = await searchListings(params);
      // keepPreviousData: only swap in the new set on success, so previous rows
      // + pins stay visible while refetching.
      // TODO(i18n slice): if res.total > res.locations.length, show a
      // "showing first 300" note. Deferred — no new i18n keys this slice.
      setFallback(res.fallback);
      setLocations(res.locations);
      setBusinesses(res.businesses);
      setSelectedId(null);
    } catch {
      // Keep prior results visible on failure; just offer a retry.
      toast(t.retryError, "warn", {
        label: t.retry,
        onClick: () => void runFetchRef.current(),
      });
    } finally {
      setLoading(false);
    }
  }, [derived, t.retry, t.retryError, toast]);

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

  // ── Client-side sort ─────────────────────────────────────────────────────
  const sortLocations = useCallback(
    (list: LocationCard[]): LocationCard[] => {
      const out = list.slice();
      if (derived.sort === "rating") {
        out.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      } else if (derived.sort === "near" && hasGeo) {
        out.sort(
          (a, b) =>
            (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY),
        );
      }
      return out;
    },
    [derived.sort, hasGeo],
  );

  // ── Open-now is a purely client-side refinement (best-effort) ───────────
  const openNow = sp.get("openNow") === "1";

  const visibleLocations = useMemo(() => {
    let list = locations;
    if (openNow) list = list.filter((l) => isOpenNow(l));
    return sortLocations(list);
  }, [locations, openNow, sortLocations]);

  // ── Geographic pins (over the FULL accumulated visible set) ─────────────
  // Locations without coordinates are skipped (no marker) but still list-rendered.
  const pins: GeoPin[] = useMemo(() => {
    const out: GeoPin[] = [];
    for (const l of visibleLocations) {
      if (l.latitude == null || l.longitude == null) continue;
      out.push({
        id: l.id,
        name: l.name,
        cat: toCat(l.industry),
        lat: l.latitude,
        lng: l.longitude,
      });
    }
    return out;
  }, [visibleLocations]);

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
        data: locationCardToData(l, locale),
      })),
    [visibleLocations, locale],
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
      data: businessCardToData(b, locale),
    }));
  }, [businesses, derived.search, locale]);

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
  const onPinSelect = useCallback((id: number) => setSelectedId(id), []);

  // "Search this area" — re-anchor on the new map center; radius stays fixed.
  // updateParams triggers the fetch via the requestKey effect, so no separate
  // fetch is needed here.
  const onSearchArea = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
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

  const clearFilters = useCallback(() => {
    updateParams({
      industry: null,
      tagIds: null,
      openNow: null,
      date: null,
    });
  }, [updateParams]);

  const requestLocation = useCallback(() => {
    // Geolocation unsupported/blocked → route to the priming modal (its
    // "Use my location" gracefully falls back to IP/Bucharest).
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationModalOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setDeviceLocation(loc);
        updateParams({
          lat: String(loc.lat),
          lng: String(loc.lng),
          radius: String(SEARCH_RADIUS_KM),
        });
        toast(t.centeredOnLocation, "nav");
      },
      () => {
        // Permission denied / unavailable → reopen the modal instead of toasting.
        setLocationModalOpen(true);
      },
      { timeout: 8000 },
    );
  }, [toast, t.centeredOnLocation, updateParams]);

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

  const queryLabel = derived.search || t.allServices;
  const wave = `${requestKey}|${derived.sort}|${openNow ? 1 : 0}|${locations.length}`;

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
          sort={derived.sort}
          setSort={(s) => updateParams({ sort: s === "rec" ? null : s })}
          allowNearest={hasGeo}
        />
      </div>
      <FilterRow
        industries={industries}
        activeSlug={derived.industrySlug ?? null}
        onSelectIndustry={(slug) => updateParams({ industry: slug })}
        openNow={openNow}
        onToggleOpenNow={() =>
          updateParams({ openNow: openNow ? null : "1" })
        }
        availableToday={derived.date === todayIso()}
        onToggleAvailableToday={() =>
          updateParams({
            date: derived.date === todayIso() ? null : todayIso(),
          })
        }
      />
      {fallback.applied && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--c-600)",
            background: "var(--c-100)",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: 12,
            padding: "9px 12px",
          }}
        >
          {format(t.fallbackNotice, { reason: fallback.reason ?? "" })}
        </div>
      )}
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
              marginBottom: 6,
            }}
          >
            {t.emptyTitle}
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--c-600)",
              marginBottom: 18,
            }}
          >
            {t.emptyBody}
          </div>
          <Button kind="secondary" size="sm" onClick={clearFilters}>
            {t.clearFilters}
          </Button>
        </div>
      ) : (
        <>
          {locationRows.map(({ id, data }) => (
            <div key={`loc-${id}`} data-biz={id}>
              <BusinessRow
                b={data}
                selected={id === selectedId || id === hoverId}
                onHover={() => setHoverId(id)}
                onLeave={() => setHoverId(null)}
              />
            </div>
          ))}
          {businessRows.map(({ id, data }) => (
            <div key={`biz-${id}`}>
              <BusinessRow b={data} />
            </div>
          ))}
        </>
      )}
    </div>
  );

  // ── Map ──────────────────────────────────────────────────────────────────
  const mapSurface = (
    <MapboxSurface
      pins={pins}
      selectedId={selectedId ?? hoverId}
      wave={wave}
      userPos={deviceLocation}
      onSelect={onPinSelect}
      onHover={isMobile ? undefined : setHoverId}
      onRecenter={requestLocation}
      recenterAria={t.recenterAria}
      anchor={searchAnchor}
      onSearchArea={onSearchArea}
      searchAreaLabel={t.searchThisArea}
    >
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
      {selectedCardData ? (
        <MapFloatingCard
          key={selectedCardData.id}
          data={selectedCardData}
          onClose={() => setSelectedId(null)}
          closeAria={t.closePinCard}
          bottomOffset={isMobile ? 150 : 28}
          insetLeft={isMobile ? "0px" : "calc(32px + min(424px, 36vw))"}
          insetRight="0px"
        />
      ) : null}
    </MapboxSurface>
  );

  // ── Mobile: list/map toggle ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <main
        style={{
          position: "relative",
          height: "calc(100vh - var(--nav-h))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {mobileView === "map" ? (
          <div style={{ position: "relative", flex: 1 }}>{mapSurface}</div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--c-canvas)",
            }}
          >
            {panelHeader}
            {resultList}
          </div>
        )}
        <button
          type="button"
          className="tap"
          onClick={() =>
            setMobileView((v) => (v === "map" ? "list" : "map"))
          }
          style={{
            position: "absolute",
            bottom: 86,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "var(--c-ink)",
            color: "#fff",
            border: 0,
            cursor: "pointer",
            padding: "12px 22px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "var(--sh-lg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon
            name={mobileView === "map" ? "list" : "pin"}
            size={15}
            color="#fff"
          />
          {mobileView === "map" ? t.showList : t.showOnMap}
        </button>
      </main>
    );
  }

  // ── Desktop: full-bleed map + floating panel ─────────────────────────────
  return (
    <main
      style={{
        position: "relative",
        height: "calc(100vh - var(--nav-h))",
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
          zIndex: 35,
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

// Promise-wrapped browser geolocation (8s timeout). Resolves to {lat,lng} on
// success, or null when unavailable/denied/timed-out — so callers can chain an
// IP fallback. SSR-safe: returns null when there's no navigator.geolocation.
function getBrowserLocation(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });
}
