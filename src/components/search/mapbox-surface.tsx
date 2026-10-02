"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
// Aliased: the default export would otherwise shadow the global `Map`, which
// this module uses for its pin lookups.
import MapGL, {
  Layer,
  Marker,
  Source,
  type MapRef,
  type MapMouseEvent,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import type { ExpressionSpecification } from "mapbox-gl";
import type { Feature, FeatureCollection } from "geojson";
import { MAPBOX_TOKEN } from "@/lib/env";
import { Icon } from "@/components/ui/icon";
import { industryAccent, resolveIndustrySlug } from "@/lib/marketplace/industry-visuals";
import { PinGlyphs, pinGlyphKey } from "./pin-glyphs";
import { UserDotGlyph } from "./user-dot";
import { MapControls } from "./map-controls";
import {
  RE_ANCHOR_VIEWPORT_FRACTION,
  SEARCH_AREA_THRESHOLD_KM,
  SEARCH_RADIUS_KM,
} from "./constants";

// Default view when there is no anchor to open on — central Bucharest, at the
// same neighbourhood-scale zoom the mobile app opens at.
export const DEFAULT_CENTER_LNG = 26.1025;
export const DEFAULT_CENTER_LAT = 44.4268;
export const DEFAULT_ZOOM = 13;

/** Camera target for "my location" and for a newly-picked place. */
const RECENTER_ZOOM = DEFAULT_ZOOM;
// ── Pin geometry ────────────────────────────────────────────────────────────

/**
 * Two badge centres closer than this (px) can't both show — the lower-ranked
 * pin drops to a dot. Covers two street-zoom badges (42px) plus breathing room.
 */
const MIN_BADGE_GAP = 48;
/** Badge↔dot and select↔deselect ease over this window instead of flashing. */
const MODE_ANIM_MS = 160;
/** Pointer target around a pin centre, so a 16px dot is still clickable. */
const HIT_RADIUS = 22;
/** How far a pin the visitor has already opened is faded back. */
const VIEWED_FADE = 0.45;
/** Hover's share of the selected treatment — enough to answer "this one?",
 *  never enough to outrank a real selection. */
const HOVER_WEIGHT = 0.55;

// ── Helpers ─────────────────────────────────────────────────────────────────

// Great-circle distance in kilometres. Used to measure how far the user has
// panned the map center from the current search anchor (the "Search this area"
// threshold). LngLat.distanceTo is not part of the public mapbox-gl API, so we
// compute it ourselves.
function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** A pin placed by real geographic coordinates. */
export interface GeoPin {
  id: number;
  name: string;
  /** Canonical industry slug — drives the badge colour and glyph. */
  cat: string;
  lat: number;
  lng: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Imperative camera commands — lets the page fly the map (e.g. recenter). */
export interface MapboxSurfaceHandle {
  flyTo: (point: GeoPoint, opts?: { zoom?: number; duration?: number }) => void;
}

const EMPTY_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export interface MapboxSurfaceProps {
  pins: GeoPin[];
  selectedId: number | null;
  /** Pointer/keyboard focus. Reads as a weaker selection: it lifts the pin in
   *  the draw order and hints the ring, but it never claims the sticky badge
   *  slot — mousing across the map would otherwise leave a trail of pins
   *  swapping between badge and dot. */
  hoverId?: number | null;
  viewedIds?: Set<number>;
  onSelect?: (id: number) => void;
  /** Fires when the selection should be dismissed — re-clicking the selected
   *  pin, or clicking an empty part of the map. */
  onDismiss?: () => void;
  onHover?: (id: number | null) => void;
  onRecenter?: () => void;
  /** Shows the loading-dots overlay while results are in flight. */
  loading?: boolean;
  /** Spinner in the recenter button while a fix is being resolved. */
  locating?: boolean;
  userPos?: GeoPoint | null;
  recenterAria: string;
  /** BCP-47 tag for basemap labels, so street names match the UI language. */
  language?: string;
  /** Current search anchor (URL lat/lng) — pan distance is measured from here. */
  anchor?: GeoPoint | null;
  /**
   * Re-run the search anchored on the new map center (radius is fixed
   * elsewhere). The zoom-aware pan threshold is applied here.
   */
  onSearchArea?: (area: { lat: number; lng: number }) => void;
  searchAreaLabel: string;
  /** Fires the instant a USER gesture starts moving the map — never a
   *  programmatic camera move. Lets the page get out of the way (collapse the
   *  mobile sheet) while the drag is still happening. */
  onUserMoveStart?: () => void;
  /** Fires once the map's tiles are actually on screen (the first idle, which
   *  is later than style-load) — the moment the first-load skeleton can lift
   *  without revealing a blank canvas. */
  onFirstPaint?: () => void;
  /**
   * Pixels along each edge that a floating overlay covers. The desktop results
   * panel sits ON TOP of the map's left edge, so a camera move aimed at the
   * true centre parks its target underneath the panel.
   */
  fitInset?: { left?: number; right?: number; top?: number; bottom?: number };
  /**
   * Pixels of chrome floating over the TOP of the map (the browse rail), so
   * the "Search this area" pill and the loading dots clear it instead of
   * landing on top of it.
   */
  topInset?: number;
  /** Distance from the bottom for the control stack — kept above the floating
   *  card and, on mobile, the results sheet. */
  controlsBottom?: number;
  /** Hide the map's own chrome (controls, re-anchor pill, loading dots) while
   *  something else owns the screen — the mobile sheet at its full height. */
  chromeHidden?: boolean;
  /** Shown in place of the map when no Mapbox token is configured. */
  unavailableLabel: string;
  /** Labels the off-screen list that makes the pins keyboard-reachable. */
  pinListLabel: string;
  children?: ReactNode;
  ref?: Ref<MapboxSurfaceHandle>;
}

// Real Mapbox GL map for the /search page.
//
// Every pin lives in ONE GeoJSON source drawn by two circle layers and a symbol
// layer, the same shape the RN app uses. Selection and badge-vs-dot ride along
// as animated per-feature properties (`s` / `t`), so a state change is a data
// update — never a marker being torn down and rebuilt, which is what made the
// old DOM markers flicker and re-drop on every refetch.
//
// Falls back to a neutral panel when no token is configured so `next build`
// (token-less) never instantiates mapbox-gl (which throws on an empty token).
export function MapboxSurface({
  pins,
  selectedId,
  hoverId,
  viewedIds,
  onSelect,
  onDismiss,
  onHover,
  onRecenter,
  loading,
  locating,
  userPos,
  recenterAria,
  language,
  anchor,
  onSearchArea,
  searchAreaLabel,
  onUserMoveStart,
  onFirstPaint,
  fitInset,
  topInset = 16,
  controlsBottom = 24,
  chromeHidden = false,
  unavailableLabel,
  pinListLabel,
  children,
  ref,
}: MapboxSurfaceProps) {
  const mapRef = useRef<MapRef>(null);
  const insetLeft = fitInset?.left ?? 0;

  useImperativeHandle(ref, () => ({
    flyTo: (point: GeoPoint, opts) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      map.flyTo({
        center: [point.lng, point.lat],
        zoom: opts?.zoom ?? RECENTER_ZOOM,
        duration: opts?.duration ?? 900,
        // Keep the target clear of the floating results panel.
        offset: [insetLeft / 2, 0],
      });
    },
  }));

  // ── Camera state the pin layout depends on ──────────────────────────────
  // Badge-vs-dot is decided in Mercator pixels, which depend only on zoom.
  // Refreshed on idle (the camera has settled), matching the RN app.
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  // ── When the map object actually exists ─────────────────────────────────
  // react-map-gl constructs the mapbox Map in its own effect, so `mapRef` is
  // still empty when this component's effects first run. Everything that has to
  // talk to the map directly — glyph registration, label language, gesture
  // config — waits on this rather than on the `load` EVENT, which fires exactly
  // once and which a pooled map (`reuseMaps`) has already fired before we
  // mount. Each of those then handles style reloads on its own.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    let raf = 0;
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      if (mapRef.current?.getMap()) setMapReady(true);
      else raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Shown after a USER-initiated pan/zoom; hidden again once new results load.
  const [showSearchHere, setShowSearchHere] = useState(false);

  // A stable signature of the current pin coordinates. A new/updated result set
  // just loaded → dismiss the "Search this area" prompt. React's "adjust state
  // when a prop changes" pattern: store the previous key IN state and reset
  // during render, which re-renders immediately without a cascading effect.
  const fitKey = pins.map((p) => `${p.lng},${p.lat}`).join("|");
  const [lastFitKey, setLastFitKey] = useState(fitKey);
  if (lastFitKey !== fitKey) {
    setLastFitKey(fitKey);
    setShowSearchHere(false);
  }

  // ── Badge-vs-dot ────────────────────────────────────────────────────────
  // Decided here rather than by the symbol engine: circle layers never collide,
  // and the engine's own collision detection hides badges against basemap
  // labels — neither gives "the highest-ranked pin in a cluster keeps its
  // badge". Walk in rank order (selected first, then the sticky promotion, then
  // result order) and drop any pin whose badge would land within MIN_BADGE_GAP
  // of one already kept.
  //
  // A pin promoted to a badge BY SELECTION keeps its slot after the card
  // closes: demoting it — and re-growing the neighbour it displaced — reads as
  // two unrelated pins swapping for no reason. A new selection, a zoom change
  // or a new result set re-evaluates naturally.
  // Tracked with the "adjust state when a prop changes" pattern rather than an
  // effect, so the promotion is already correct in the render that reads it —
  // a frame of the wrong pin wearing the badge is exactly the swap this exists
  // to prevent.
  const [promo, setPromo] = useState<{
    id: number | null;
    sel: number | null;
    key: string;
  }>(() => ({ id: selectedId, sel: selectedId, key: fitKey }));

  let promotedId = promo.id;
  if (promo.key !== fitKey) {
    // Fresh results — rank decides again.
    promotedId = null;
    setPromo({ id: null, sel: selectedId, key: fitKey });
  } else if (promo.sel !== selectedId) {
    promotedId = selectedId ?? promo.id;
    setPromo({ id: promotedId, sel: selectedId, key: fitKey });
  }

  const pinById = useMemo(() => {
    const m = new Map<number, GeoPin>();
    for (const p of pins) m.set(p.id, p);
    return m;
  }, [pins]);

  const pinTargets = useMemo(() => {
    const ordered = [...pinById.values()];
    const first = selectedId ?? promotedId;
    const selIdx = ordered.findIndex((p) => p.id === first);
    if (selIdx > 0) ordered.unshift(ordered.splice(selIdx, 1)[0]);

    const world = 512 * 2 ** zoom;
    const mx = (lng: number) => ((lng + 180) / 360) * world;
    const my = (lat: number) => {
      const sin = Math.sin((lat * Math.PI) / 180);
      return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world;
    };

    const kept: [number, number][] = [];
    return ordered.map((pin) => {
      const x = mx(pin.lng);
      const y = my(pin.lat);
      const hidden = kept.some(
        ([kx, ky]) => (kx - x) ** 2 + (ky - y) ** 2 < MIN_BADGE_GAP ** 2,
      );
      if (!hidden) kept.push([x, y]);
      const slug = resolveIndustrySlug(pin.cat);
      return {
        pin,
        t: hidden ? 0 : 1,
        s:
          pin.id === selectedId
            ? 1
            : pin.id === hoverId
              ? HOVER_WEIGHT
              : 0,
        v: !viewedIds || pin.id === selectedId || !viewedIds.has(pin.id) ? 0 : 1,
        accent: industryAccent(slug),
        glyph: pinGlyphKey(slug),
      };
    });
  }, [pinById, selectedId, hoverId, promotedId, zoom, viewedIds]);

  // ── Per-pin animation ───────────────────────────────────────────────────
  // `t` 0→1 morphs dot→badge, `s` 0→1 morphs deselected→selected. Slot and
  // selection changes ease the affected pins over MODE_ANIM_MS; Mapbox cannot
  // transition data-driven paint itself, so each frame is a data update. Pins
  // new to the source appear already settled.
  const animRef = useRef(new Map<number, { t: number; s: number }>());
  const rafRef = useRef<number | null>(null);
  const [shape, setShape] = useState<FeatureCollection>(EMPTY_COLLECTION);

  useEffect(() => {
    const anim = animRef.current;
    const ids = new Set(pinTargets.map((pt) => pt.pin.id));
    for (const id of [...anim.keys()]) if (!ids.has(id)) anim.delete(id);

    const starts = new Map<number, { t: number; s: number }>();
    let settled = true;
    for (const pt of pinTargets) {
      const cur = anim.get(pt.pin.id) ?? { t: pt.t, s: pt.s };
      starts.set(pt.pin.id, cur);
      anim.set(pt.pin.id, cur);
      if (Math.abs(cur.t - pt.t) > 0.001 || Math.abs(cur.s - pt.s) > 0.001) {
        settled = false;
      }
    }

    const build = (): FeatureCollection => ({
      type: "FeatureCollection",
      features: pinTargets.map((pt): Feature => {
        const v = anim.get(pt.pin.id)!;
        return {
          type: "Feature",
          id: pt.pin.id,
          geometry: { type: "Point", coordinates: [pt.pin.lng, pt.pin.lat] },
          properties: {
            id: pt.pin.id,
            accent: pt.accent,
            glyph: pt.glyph,
            v: pt.v,
            t: v.t,
            s: v.s,
          },
        };
      }),
    });

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (settled) {
      setShape(build());
    } else {
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / MODE_ANIM_MS);
        const e = 1 - (1 - k) ** 4; // ease-out-quart: fast start, clean settle
        for (const pt of pinTargets) {
          const from = starts.get(pt.pin.id)!;
          anim.set(pt.pin.id, {
            t: from.t + (pt.t - from.t) * e,
            s: from.s + (pt.s - from.s) * e,
          });
        }
        setShape(build());
        rafRef.current = k < 1 ? requestAnimationFrame(step) : null;
      };
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [pinTargets]);

  // ── Map events ──────────────────────────────────────────────────────────

  // Rotation and pitch are off: a two-finger twist can never leave the map
  // crooked, and there is nothing on it that reads better tilted. Disabling
  // `touchZoomRotate` wholesale would take pinch-zoom with it, so only its
  // rotation half goes. Applied on mount rather than from `load`, which a
  // pooled map (`reuseMaps`) has already fired by the time we get here.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map) return;
    map.touchZoomRotate?.disableRotation();
  }, [mapReady]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.touchZoomRotate?.disableRotation();
    setZoom(map.getZoom());
  }, []);

  // Basemap labels follow the UI language. `setLanguage` only exists on
  // mapbox-gl v3+, and throws on a style that has not finished loading — which
  // is why this applies on the current state AND on every later `style.load`
  // rather than trusting a one-shot `load` event that a pooled map may have
  // fired before this component ever mounted.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map || !language) return;
    const apply = () => {
      try {
        map.setLanguage?.(language);
      } catch {
        // Style not ready for a language swap — labels stay as authored.
      }
    };
    if (map.isStyleLoaded()) apply();
    map.on("style.load", apply);
    return () => {
      map.off("style.load", apply);
    };
  }, [mapReady, language]);

  /** Width of the currently visible map, in km — the zoom half of the threshold. */
  const visibleWidthKm = useCallback((): number | undefined => {
    const map = mapRef.current?.getMap();
    const b = map?.getBounds();
    if (!b) return undefined;
    const lat = b.getCenter().lat;
    return haversineKm(lat, b.getWest(), lat, b.getEast());
  }, []);

  // User-driven moves carry `originalEvent` (mouse/touch/wheel); programmatic
  // camera moves leave it undefined — so this only fires for real gestures.
  //
  // The offer is zoom-aware, matching the mobile app: the pan must move the
  // centre by most of a screen width at the CURRENT zoom, clamped between a
  // floor (a sub-2km wiggle is never a new area, however far in you are) and
  // the searched radius (zoomed right out a small drag sweeps huge distances,
  // and past the radius the offer is always warranted).
  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const original = (e as { originalEvent?: unknown }).originalEvent;
      if (!original) return;
      const center = mapRef.current?.getMap().getCenter();
      if (!anchor || !center) {
        setShowSearchHere(true);
        return;
      }
      const width = visibleWidthKm();
      const threshold = Math.min(
        SEARCH_RADIUS_KM,
        Math.max(
          SEARCH_AREA_THRESHOLD_KM,
          (width ?? Number.POSITIVE_INFINITY) * RE_ANCHOR_VIEWPORT_FRACTION,
        ),
      );
      const dist = haversineKm(center.lat, center.lng, anchor.lat, anchor.lng);
      setShowSearchHere(dist >= threshold);
    },
    [anchor, visibleWidthKm],
  );

  // Zoom drives the declutter, so it is read once the camera has settled. The
  // FIRST idle also means tiles are painted — later than `load`, which is only
  // style-loaded, and the right moment to lift a first-load skeleton.
  const firstPaintRef = useRef(false);
  const handleIdle = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) setZoom(map.getZoom());
    if (!firstPaintRef.current) {
      firstPaintRef.current = true;
      onFirstPaint?.();
    }
  }, [onFirstPaint]);

  // A gesture STARTED. mapbox fires `movestart` for programmatic camera moves
  // too, and those carry no `originalEvent` — which is the only thing that
  // tells a user drag apart from a fly-to, and so the only thing that keeps a
  // recenter from collapsing the sheet it just opened.
  const handleMoveStart = useCallback(
    (e: ViewStateChangeEvent) => {
      if ((e as { originalEvent?: unknown }).originalEvent) onUserMoveStart?.();
    },
    [onUserMoveStart],
  );

  const handleSearchArea = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onSearchArea) return;
    const center = map.getCenter();
    onSearchArea({ lat: center.lat, lng: center.lng });
    setShowSearchHere(false);
  }, [onSearchArea]);

  // A click anywhere on the map. The hit layer can catch several pins at once
  // (a badge plus the dots it covers), so take the one nearest the pointer
  // rather than whichever the engine lists first — and when the hitbox holds a
  // badge, nearby dots don't compete: the user clicks what they can see.
  // Nothing under the pointer means "dismiss", which is how the RN app's map
  // closes a card.
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const feats = e.features ?? [];
      if (feats.length === 0) {
        onDismiss?.();
        return;
      }
      const hasBadge = feats.some((f) => Number(f.properties?.t) >= 0.5);
      const kx = Math.cos((e.lngLat.lat * Math.PI) / 180);
      let picked: number | undefined;
      let best = Infinity;
      for (const f of feats) {
        if (hasBadge && Number(f.properties?.t) < 0.5) continue;
        const id = Number(f.properties?.id);
        const p = pinById.get(id);
        if (!p) continue;
        const d =
          (p.lat - e.lngLat.lat) ** 2 + ((p.lng - e.lngLat.lng) * kx) ** 2;
        if (d < best) {
          best = d;
          picked = id;
        }
      }
      if (picked == null) {
        onDismiss?.();
        return;
      }
      if (picked === selectedId) onDismiss?.();
      else onSelect?.(picked);
    },
    [pinById, selectedId, onSelect, onDismiss],
  );

  const hoveredRef = useRef<number | null>(null);
  const handleMouseMove = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      const feats = e.features ?? [];
      const id = feats.length ? Number(feats[0].properties?.id) : null;
      if (map) map.getCanvas().style.cursor = id != null ? "pointer" : "";
      if (id === hoveredRef.current) return;
      hoveredRef.current = id;
      onHover?.(id);
    },
    [onHover],
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "";
    if (hoveredRef.current == null) return;
    hoveredRef.current = null;
    onHover?.(null);
  }, [onHover]);

  // ── Layer styles ────────────────────────────────────────────────────────
  // Per-feature animated inputs: `t` dot→badge, `s` selection, `v` viewed.
  // Zoom may only sit in an OUTERMOST interpolate, so each zoom stop mixes
  // dot + (badge − dot) · t inline.
  const layers = useMemo(() => {
    const T = ["get", "t"] as unknown as ExpressionSpecification;
    const S = ["get", "s"] as unknown as ExpressionSpecification;
    const stop = (dot: number, badge: number) =>
      ["+", dot, ["*", badge - dot, T]] as unknown as ExpressionSpecification;
    /** 1 at full strength, VIEWED_FADE lower for a place already opened. */
    const dim = ["-", 1, ["*", VIEWED_FADE, ["get", "v"]]] as unknown as ExpressionSpecification;
    // Selected on top, badges above dots. `round` keeps the sort key stable
    // while `t` animates — a per-frame re-sort is a visible jank source.
    const sortKey = [
      "+",
      ["*", 2, S],
      ["round", T],
    ] as unknown as ExpressionSpecification;

    return { T, S, stop, dim, sortKey };
  }, []);

  // Controls overlay (recenter) + arbitrary children — shared by the real map
  // and the no-token fallback so behaviour matches in both states.
  // Bottom-right, in thumb reach — and out of the way of the browse rail,
  // which now owns the top of the map.
  const overlay = (
    <>
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: controlsBottom,
          zIndex: 30,
          opacity: chromeHidden ? 0 : 1,
          pointerEvents: chromeHidden ? "none" : "auto",
          transition: "opacity .16s var(--ease-out)",
        }}
      >
        <MapControls
          onRecenter={onRecenter}
          recenterAria={recenterAria}
          busy={locating}
        />
      </div>
      {children}
    </>
  );

  // No token: render a neutral fallback (do NOT instantiate <Map>).
  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: "#EEEAE0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "var(--c-500)",
          }}
        >
          {unavailableLabel}
        </div>
        {overlay}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#EEEAE0",
      }}
    >
      <MapGL
        ref={mapRef}
        // Pool & reuse the mapbox-gl instance across soft-navigation remounts so
        // returning to /search doesn't re-initialize the map (a billed map load).
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: anchor?.lng ?? pins[0]?.lng ?? DEFAULT_CENTER_LNG,
          latitude: anchor?.lat ?? pins[0]?.lat ?? DEFAULT_CENTER_LAT,
          zoom: DEFAULT_ZOOM,
        }}
        mapStyle="mapbox://styles/zavoia/cmphvlj8p002c01sgdl3q3kpb"
        style={{ width: "100%", height: "100%" }}
        // The map never rotates or tilts — see handleLoad for the touch half.
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        interactiveLayerIds={["zv-pin-hit"]}
        onLoad={handleLoad}
        onIdle={handleIdle}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseLeave}
      >
        {/* All pins in one data-driven source. Industry colour, badge-vs-dot
            (`t`), selection (`s`) and viewed-ness (`v`) are feature properties;
            the styles below are static expressions over them, so animating is
            pure data updates. */}
        <Source id="zv-pins" type="geojson" data={shape}>
          {/* Soft ambient shadow, fading in with badge-ness so dots stay flat. */}
          <Layer
            id="zv-pin-shadow"
            type="circle"
            paint={{
              "circle-color": "rgba(28,28,26,0.22)",
              "circle-opacity": ["*", layers.T, layers.dim] as never,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                layers.stop(6.5, 19.5),
                14,
                layers.stop(8, 22.5),
              ] as never,
              "circle-blur": 1,
              "circle-translate": [0, 1],
              "circle-pitch-alignment": "viewport",
            }}
          />
          {/* One accent disc per pin — the dot IS the collapsed badge (t=0).
              Badge 36px at city zoom → 42px from street zoom; dot 13→16px with
              the thicker 2px ring. */}
          <Layer
            id="zv-pin-badge"
            type="circle"
            paint={{
              "circle-color": ["get", "accent"] as never,
              "circle-opacity": layers.dim as never,
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                layers.stop(6.5, 18),
                14,
                layers.stop(8, 21),
              ] as never,
              // 2px ring, thinning to 1.5 as a dot grows into a badge, then
              // widening again with `s` — the halo that says "this one". The
              // phone has no equivalent because it has no hover and its card
              // covers half the screen; a pointer needs the cue on the pin.
              "circle-stroke-width": [
                "+",
                ["-", 2, ["*", 0.5, layers.T]],
                ["*", 2.5, layers.S],
              ] as never,
              "circle-stroke-color": "#FEFBF9",
              "circle-stroke-opacity": layers.dim as never,
              "circle-pitch-alignment": "viewport",
            }}
            layout={{ "circle-sort-key": layers.sortKey as never }}
          />
          <Layer
              id="zv-pin-glyph"
              type="symbol"
              layout={{
                "icon-image": ["get", "glyph"] as never,
                // Static size: animating icon-size forces an async symbol
                // re-layout every frame that stutters against the circles. The
                // glyph fades instead, quadratically, so it is gone before the
                // disc gets small.
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  11,
                  0.21,
                  14,
                  0.245,
                ] as never,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "symbol-sort-key": layers.sortKey as never,
              }}
              paint={{
                "icon-opacity": [
                  "*",
                  layers.T,
                  layers.T,
                  layers.dim,
                ] as never,
              }}
            />
          {/* Invisible pointer target: a 16px dot is too small to click, and
              circle layers hit-test to their painted radius. Declared last, so
              the stack is shadow → badge → glyph → hit in mount order. */}
          <Layer
            id="zv-pin-hit"
            type="circle"
            paint={{
              "circle-color": "#000",
              "circle-opacity": 0,
              "circle-radius": HIT_RADIUS,
            }}
          />
        </Source>

        {userPos && (
          <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
            <UserDotGlyph />
          </Marker>
        )}
      </MapGL>

      <PinGlyphs mapRef={mapRef} mapReady={mapReady} />

      {/* The map's results have to be reachable without a pointer. The canvas
          cannot hold focus per pin, so the pins are mirrored as an off-screen
          button list: focusing one highlights it, activating one selects it —
          the same two callbacks the pointer path uses. */}
      <ul
        aria-label={pinListLabel}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
          listStyle: "none",
        }}
      >
        {pins.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={p.id === selectedId}
              onClick={() =>
                p.id === selectedId ? onDismiss?.() : onSelect?.(p.id)
              }
              onFocus={onHover ? () => onHover(p.id) : undefined}
              onBlur={onHover ? () => onHover(null) : undefined}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Results are in flight. The map says so itself — the panel's own pulse
          is invisible on the mobile map view. */}
      {loading && !chromeHidden && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: topInset,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 38,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 12px",
              borderRadius: 16,
              background: "#fff",
              boxShadow: "var(--sh-md)",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="zv-map-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: "var(--p-400)",
                  // Staggered, so the three read as one travelling pulse.
                  animationDelay: `${i * 0.14}s`,
                }}
              />
            ))}
          </span>
        </div>
      )}

      {showSearchHere && onSearchArea && !chromeHidden && (
        <button
          type="button"
          className="tap"
          onClick={handleSearchArea}
          style={{
            position: "absolute",
            top: topInset,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            background: "#fff",
            color: "var(--c-900)",
            border: 0,
            cursor: "pointer",
            padding: "10px 18px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "var(--sh-lg)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="search" size={15} />
          {searchAreaLabel}
        </button>
      )}

      {overlay}
    </div>
  );
}
