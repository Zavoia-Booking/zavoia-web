"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
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
import { Spinner } from "@/components/ui/spinner";
import { industryAccent, resolveIndustrySlug } from "@/lib/marketplace/industry-visuals";
import { PinGlyphs, pinGlyphKey, SAVED_PIN_GLYPH } from "./pin-glyphs";
import { UserDotGlyph } from "./user-dot";
import { MapControls } from "./map-controls";
import { SEARCH_RADIUS_KM } from "./constants";
import { DEFAULT_ZOOM, RECENTER_ZOOM, MIN_BADGE_GAP, choosePinHit, searchAreaOffered, usableFitArea, viewportRadiusKm } from "./map-behavior";

export { DEFAULT_ZOOM, PLACE_ZOOM, RECENTER_ZOOM } from "./map-behavior";

// Default view when there is no anchor to open on — central Bucharest, at the
// same wider discovery zoom the mobile app opens at.
export const DEFAULT_CENTER_LNG = 26.1025;
export const DEFAULT_CENTER_LAT = 44.4268;
// ── Pin geometry ────────────────────────────────────────────────────────────

/** Badge↔dot and select↔deselect ease over this window instead of flashing. */
const MODE_ANIM_MS = 160;
/** Pointer target around a pin centre, so a 16px dot is still clickable. */
const HIT_RADIUS = 22;
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
  /** Reveal matches hidden outside the exposed map without zooming in. */
  revealPins: (points: GeoPoint[], opts?: { duration?: number }) => void;
}

type CameraIntent =
  | { kind: "fly"; point: GeoPoint; options?: { zoom?: number; duration?: number } }
  | { kind: "reveal"; points: GeoPoint[]; options?: { duration?: number } };

function isValidPoint(point: GeoPoint): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng)
    && Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
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
  /** Saving changes only the glyph, never pin opacity or badge ranking. */
  favoriteIds?: ReadonlySet<number>;
  onSelect?: (id: number) => void;
  /** Fires when the selection should be dismissed — re-clicking the selected
   *  pin, or clicking an empty part of the map. */
  onDismiss?: () => void;
  onHover?: (id: number | null) => void;
  onRecenter?: () => void;
  /** Shows pending feedback while results are in flight. */
  loading?: boolean;
  /** Spinner in the recenter button while a fix is being resolved. */
  locating?: boolean;
  userPos?: GeoPoint | null;
  recenterAria: string;
  /** BCP-47 tag for basemap labels, so street names match the UI language. */
  language?: string;
  /** Camera/search origin (URL point or resolved city) for the pan threshold. */
  anchor?: GeoPoint | null;
  /** Initial camera zoom persisted with a place or area-search URL. */
  anchorZoom?: number;
  /** Radius of the currently loaded query; city/discovery defaults to 20km. */
  searchRadiusKm?: number;
  /** Re-run around the current viewport, widening only up to the API's 50km cap. */
  onSearchArea?: (area: { lat: number; lng: number; radiusKm: number; zoom: number }) => void;
  searchAreaLabel: string;
  /** Fires the instant a USER gesture starts moving the map — never a
   *  programmatic camera move. Lets the page get out of the way (collapse the
   *  mobile sheet) while the drag is still happening. */
  onUserMoveStart?: () => void;
  /** Fires once the map's tiles are actually on screen (the first idle, which
   *  is later than style-load) — the moment the first-load skeleton can lift
   *  without revealing a blank canvas. */
  onFirstPaint?: () => void;
  /** Keep successful maps pooled; explicit retries need a fresh instance. */
  reuseMap?: boolean;
  /**
   * Pixels along each edge that a floating overlay covers. The desktop results
   * panel sits ON TOP of the map's left edge, so a camera move aimed at the
   * true centre parks its target underneath the panel.
   */
  fitInset?: { left?: number; right?: number; top?: number; bottom?: number };
  /**
   * Pixels of chrome floating over the TOP of the map (the browse rail), so
   * the "Search this area" pill and the loading indicator clear it instead of
   * landing on top of it.
   */
  topInset?: number;
  /** Horizontal bounds shared with the service rail above the map actions. */
  chromeInset?: { left?: number; right?: number };
  /** Distance from the bottom for the control stack — kept above the floating
   *  card and, on mobile, the results sheet. */
  controlsBottom?: number;
  /** Hide the map's own chrome (controls, re-anchor pill, pending feedback) while
   *  something else owns the screen — the mobile sheet at its full height. */
  chromeHidden?: boolean;
  /** Wait for an explicit city's camera target instead of showing another city. */
  enabled?: boolean;
  /** Shown when the map cannot be displayed or its city is still resolving. */
  unavailableLabel: ReactNode;
  /** Labels the keyboard pin controls, which become visible on focus. */
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
  favoriteIds,
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
  anchorZoom,
  searchRadiusKm = SEARCH_RADIUS_KM,
  onSearchArea,
  searchAreaLabel,
  onUserMoveStart,
  onFirstPaint,
  reuseMap = true,
  fitInset,
  topInset = 16,
  chromeInset,
  controlsBottom = 24,
  chromeHidden = false,
  enabled = true,
  unavailableLabel,
  pinListLabel,
  children,
  ref,
}: MapboxSurfaceProps) {
  const mapRef = useRef<MapRef>(null);
  const insetLeft = fitInset?.left ?? 0;
  const insetRight = fitInset?.right ?? 0;
  const insetTop = fitInset?.top ?? 0;
  const insetBottom = fitInset?.bottom ?? 0;
  const chromeLeft = chromeInset?.left ?? insetLeft;
  const chromeRight = chromeInset?.right ?? insetRight;
  const userMovingRef = useRef(false);
  const userInputPendingRef = useRef(false);
  const activePointersRef = useRef(new Set<number>());
  const searchViewportRef = useRef<{ key: string; zoom: number | null; offered: boolean }>({
    key: "", zoom: null, offered: false,
  });
  const [focusedPinId, setFocusedPinId] = useState<number | null>(null);

  // A single queue means a newer focus/reveal replaces an earlier arrival.
  // Camera commands can arrive before react-map-gl has constructed its map.
  const pendingCamera = useRef<CameraIntent | null>(null);
  const applyCamera = useCallback((intent: CameraIntent) => {
    const map = mapRef.current?.getMap();
    if (!map) {
      pendingCamera.current = intent;
      return;
    }
    pendingCamera.current = null;
    userMovingRef.current = false;
    userInputPendingRef.current = false;
    if (intent.kind === "fly") {
      if (!isValidPoint(intent.point)) return;
      map.flyTo({
        center: [intent.point.lng, intent.point.lat],
        zoom: intent.options?.zoom ?? RECENTER_ZOOM,
        duration: intent.options?.duration ?? 900,
        offset: [(insetLeft - insetRight) / 2, (insetTop - insetBottom) / 2],
        // Let Mapbox honor the visitor's reduced-motion preference.
        essential: false,
      });
      return;
    }

    const points = intent.points.filter(isValidPoint);
    if (!points.length) return;
    // A newer reveal supersedes an earlier programmatic flight. Measure after
    // stopping it so an old destination cannot move visible matches away.
    map.stop();
    const container = map.getContainer();
    const padding = {
      left: insetLeft + 32,
      right: insetRight + 32,
      top: insetTop + 32,
      bottom: insetBottom + 32,
    };
    const area = usableFitArea(container.clientWidth, container.clientHeight, padding);
    // Keep the current discovery camera when the sheet/chrome leaves no useful
    // map viewport. A barely-positive strip must never trigger a globe fit.
    if (!area) return;
    const allVisible = points.every((point) => {
      const projected = map.project([point.lng, point.lat]);
      return projected.x >= area.left && projected.x <= area.right
        && projected.y >= area.top && projected.y <= area.bottom;
    });
    // Filtering an already-visible set must leave the visitor's view alone.
    if (allVisible) return;

    let west = points[0].lng;
    let east = west;
    let south = points[0].lat;
    let north = south;
    for (const point of points) {
      west = Math.min(west, point.lng);
      east = Math.max(east, point.lng);
      south = Math.min(south, point.lat);
      north = Math.max(north, point.lat);
    }
    map.fitBounds([[west, south], [east, north]], {
      padding,
      maxZoom: map.getZoom(),
      retainPadding: false,
      linear: true,
      duration: intent.options?.duration ?? 450,
      essential: false,
    });
  }, [insetLeft, insetRight, insetTop, insetBottom]);
  const flyTo: MapboxSurfaceHandle["flyTo"] = useCallback((point, options) => {
    applyCamera({ kind: "fly", point, options });
  }, [applyCamera]);
  const revealPins: MapboxSurfaceHandle["revealPins"] = useCallback((points, options) => {
    applyCamera({ kind: "reveal", points, options });
  }, [applyCamera]);
  useImperativeHandle(ref, () => ({ flyTo, revealPins }), [flyTo, revealPins]);

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
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    setMapReady(false);
  }
  useEffect(() => {
    if (!MAPBOX_TOKEN || !enabled) return;
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
  }, [enabled]);
  useEffect(() => {
    if (mapReady && pendingCamera.current) applyCamera(pendingCamera.current);
  }, [mapReady, applyCamera]);

  // Shown after a USER-initiated pan/zoom; hidden again once new results load.
  const [showSearchHere, setShowSearchHere] = useState(false);

  // A new search/result set dismisses the previous offer. Baseline zoom is
  // captured before the next real gesture, after any programmatic results fit.
  const fitKey = pins.map((p) => `${p.lng},${p.lat}`).join("|");
  const searchContextKey = `${anchor?.lat},${anchor?.lng}|${anchorZoom}|${searchRadiusKm}|${fitKey}`;
  const [lastSearchContext, setLastSearchContext] = useState(searchContextKey);
  if (lastSearchContext !== searchContextKey) {
    setLastSearchContext(searchContextKey);
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
        accent: industryAccent(slug),
        glyph: pinGlyphKey(slug),
      };
    });
  }, [pinById, selectedId, hoverId, promotedId, zoom]);

  // ── Per-pin animation ───────────────────────────────────────────────────
  // `t` 0→1 morphs dot→badge, `s` 0→1 morphs deselected→selected. Slot and
  // selection changes ease the affected pins over MODE_ANIM_MS; Mapbox cannot
  // transition data-driven paint itself, so each frame is a data update. Pins
  // new to the source appear already settled.
  const animRef = useRef(new Map<number, { t: number; s: number; f: number }>());
  const rafRef = useRef<number | null>(null);
  const [shape, setShape] = useState<FeatureCollection>(EMPTY_COLLECTION);

  useEffect(() => {
    const anim = animRef.current;
    const ids = new Set(pinTargets.map((pt) => pt.pin.id));
    for (const id of [...anim.keys()]) if (!ids.has(id)) anim.delete(id);

    const targets = pinTargets.map((pt) => ({ ...pt, f: favoriteIds?.has(pt.pin.id) ? 1 : 0 }));
    const starts = new Map<number, { t: number; s: number; f: number }>();
    let settled = true;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const pt of targets) {
      const cur = anim.get(pt.pin.id) ?? { t: pt.t, s: pt.s, f: pt.f };
      starts.set(pt.pin.id, cur);
      anim.set(pt.pin.id, cur);
      if (Math.abs(cur.t - pt.t) > 0.001 || Math.abs(cur.s - pt.s) > 0.001 || Math.abs(cur.f - pt.f) > 0.001) {
        settled = false;
      }
    }

    const build = (): FeatureCollection => ({
      type: "FeatureCollection",
      features: targets.map((pt): Feature => {
        const v = anim.get(pt.pin.id)!;
        return {
          type: "Feature",
          id: pt.pin.id,
          geometry: { type: "Point", coordinates: [pt.pin.lng, pt.pin.lat] },
          properties: {
            id: pt.pin.id,
            accent: pt.accent,
            glyph: pt.glyph,
            t: v.t,
            s: v.s,
            f: v.f,
          },
        };
      }),
    });

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (settled || reducedMotion) {
      for (const pt of targets) anim.set(pt.pin.id, { t: pt.t, s: pt.s, f: pt.f });
      setShape(build());
    } else {
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / MODE_ANIM_MS);
        const e = 1 - (1 - k) ** 4; // ease-out-quart: fast start, clean settle
        for (const pt of targets) {
          const from = starts.get(pt.pin.id)!;
          anim.set(pt.pin.id, {
            t: from.t + (pt.t - from.t) * e,
            s: from.s + (pt.s - from.s) * e,
            f: from.f + (pt.f - from.f) * e,
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
  }, [pinTargets, favoriteIds]);

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

  const syncSearchViewport = useCallback((currentZoom: number) => {
    const viewport = searchViewportRef.current;
    if (viewport.key !== searchContextKey) {
      viewport.key = searchContextKey;
      viewport.zoom = currentZoom;
      viewport.offered = false;
    }
    viewport.zoom ??= currentZoom;
    return viewport;
  }, [searchContextKey]);

  // Report actual user movement on every frame. Panning back hides immediately;
  // a new offer waits for release, including the first momentum frame.
  const reportUserViewport = useCallback((gestureActive: boolean) => {
    if (!userMovingRef.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const currentZoom = map.getZoom();
    const viewport = syncSearchViewport(currentZoom);
    const center = map.getCenter();
    const offered = anchor ? searchAreaOffered({
      distanceKm: haversineKm(center.lat, center.lng, anchor.lat, anchor.lng),
      visibleWidthKm: visibleWidthKm(),
      zoom: currentZoom,
      anchorZoom: viewport.zoom ?? currentZoom,
      radiusKm: searchRadiusKm,
      offered: viewport.offered,
      gestureActive,
    }) : viewport.offered || !gestureActive;
    viewport.offered = offered;
    setShowSearchHere(offered);
  }, [anchor, searchRadiusKm, syncSearchViewport, visibleWidthKm]);

  useLayoutEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map) return;
    const canvas = map.getCanvas();
    const pointers = activePointersRef.current;
    // Mapbox wheel camera events do not consistently preserve originalEvent.
    // Capture real input and its starting zoom before the SDK's first frame.
    const input = () => {
      userInputPendingRef.current = true;
      pendingCamera.current = null;
      syncSearchViewport(map.getZoom());
    };
    const moveInput = () => {
      input();
      if (!userMovingRef.current) {
        userMovingRef.current = true;
        onUserMoveStart?.();
      }
    };
    const keyInput = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-", "="].includes(event.key)) moveInput();
    };
    const press = (event: PointerEvent) => { pointers.add(event.pointerId); input(); };
    const release = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (!pointers.size) reportUserViewport(false);
    };
    const cancel = () => { pointers.clear(); reportUserViewport(false); };
    canvas.addEventListener("pointerdown", press);
    canvas.addEventListener("wheel", moveInput, { passive: true, capture: true });
    canvas.addEventListener("keydown", keyInput, true);
    canvas.addEventListener("dblclick", moveInput, true);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", cancel);
    return () => {
      canvas.removeEventListener("pointerdown", press);
      canvas.removeEventListener("wheel", moveInput, true);
      canvas.removeEventListener("keydown", keyInput, true);
      canvas.removeEventListener("dblclick", moveInput, true);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", cancel);
      pointers.clear();
    };
  }, [mapReady, reportUserViewport, syncSearchViewport, onUserMoveStart]);

  const handleMove = useCallback(() => {
    reportUserViewport(activePointersRef.current.size > 0);
  }, [reportUserViewport]);

  const handleMoveEnd = useCallback(() => {
    reportUserViewport(false);
    userMovingRef.current = false;
    userInputPendingRef.current = false;
    const map = mapRef.current?.getMap();
    if (map) setZoom(map.getZoom());
  }, [reportUserViewport]);

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

  // Native input arms wheel/keyboard moves whose Mapbox camera event omits
  // originalEvent. Camera commands clear that intent before moving the map.
  const handleMoveStart = useCallback(
    (e: ViewStateChangeEvent) => {
      if ((e as { originalEvent?: unknown }).originalEvent || userInputPendingRef.current) {
        userInputPendingRef.current = false;
        pendingCamera.current = null;
        const wasMoving = userMovingRef.current;
        userMovingRef.current = true;
        const map = mapRef.current?.getMap();
        if (map) syncSearchViewport(map.getZoom());
        if (!wasMoving) onUserMoveStart?.();
      }
    },
    [onUserMoveStart, syncSearchViewport],
  );

  const handleSearchArea = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onSearchArea) return;
    const center = map.getCenter().wrap();
    const currentZoom = map.getZoom();
    const viewport = syncSearchViewport(currentZoom);
    viewport.zoom = currentZoom;
    viewport.offered = false;
    onSearchArea({
      lat: Math.round(center.lat * 1000) / 1000,
      lng: Math.round(center.lng * 1000) / 1000,
      radiusKm: viewportRadiusKm(visibleWidthKm()),
      zoom: currentZoom,
    });
    setShowSearchHere(false);
  }, [onSearchArea, syncSearchViewport, visibleWidthKm]);

  // A click anywhere on the map. The hit layer can catch several pins at once
  // (a badge plus the dots it covers), so take the one nearest the pointer
  // rather than whichever the engine lists first — and when the hitbox holds a
  // badge, nearby dots don't compete: the user clicks what they can see.
  // Nothing under the pointer means "dismiss", which is how the RN app's map
  // closes a card.
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const picked = choosePinHit(e.features ?? [], e.lngLat, pinById);
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
      const id = choosePinHit(e.features ?? [], e.lngLat, pinById);
      if (map) map.getCanvas().style.cursor = id != null ? "pointer" : "";
      if (id === hoveredRef.current) return;
      hoveredRef.current = id;
      onHover?.(id);
    },
    [onHover, pinById],
  );

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "";
    if (hoveredRef.current == null) return;
    hoveredRef.current = null;
    onHover?.(null);
  }, [onHover]);

  // ── Layer styles ────────────────────────────────────────────────────────
  // Per-feature animated inputs: `t` dot→badge, `s` selection, `f` saved.
  // Zoom may only sit in an OUTERMOST interpolate, so each zoom stop mixes
  // dot + (badge − dot) · t inline.
  const layers = useMemo(() => {
    const T = ["get", "t"] as unknown as ExpressionSpecification;
    const S = ["get", "s"] as unknown as ExpressionSpecification;
    const F = ["get", "f"] as unknown as ExpressionSpecification;
    const stop = (dot: number, badge: number) =>
      ["+", dot, ["*", badge - dot, T]] as unknown as ExpressionSpecification;
    // Selected on top, badges above dots. `round` keeps the sort key stable
    // while `t` animates — a per-frame re-sort is a visible jank source.
    const sortKey = [
      "+",
      ["*", 2, S],
      ["round", T],
    ] as unknown as ExpressionSpecification;

    return { T, S, F, stop, sortKey };
  }, []);

  // Controls overlay (recenter) + arbitrary children — shared by the real map
  // and the no-token fallback so behaviour matches in both states.
  // Bottom-right, in thumb reach — and out of the way of the browse rail,
  // which now owns the top of the map.
  const overlay = (
    <>
      <div
        inert={chromeHidden}
        aria-hidden={chromeHidden || undefined}
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

  // Preserve controls/overlays while a city's camera is unresolved.
  if (!MAPBOX_TOKEN || !enabled) {
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
      inert={chromeHidden}
      data-map-zoom={zoom}
      data-map-ready={mapReady}
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
        reuseMaps={reuseMap}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: anchor?.lng ?? pins[0]?.lng ?? DEFAULT_CENTER_LNG,
          latitude: anchor?.lat ?? pins[0]?.lat ?? DEFAULT_CENTER_LAT,
          zoom: anchorZoom ?? DEFAULT_ZOOM,
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
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseLeave}
      >
        {/* All pins in one data-driven source. Industry colour, badge-vs-dot
            (`t`), selection (`s`) and saved status (`f`) are feature properties;
            the styles below are static expressions over them, so animating is
            pure data updates. */}
        <Source id="zv-pins" type="geojson" data={shape}>
          {/* Soft ambient shadow, fading in with badge-ness so dots stay flat. */}
          <Layer
            id="zv-pin-shadow"
            type="circle"
            paint={{
              "circle-color": "rgba(28,28,26,0.22)",
              "circle-opacity": layers.T as never,
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
                  ["-", 1, layers.F],
                  layers.T,
                  layers.T,
                ] as never,
              }}
            />
          <Layer
            id="zv-pin-saved"
            type="symbol"
            filter={[">", ["get", "t"], 0]}
            layout={{
              "icon-image": SAVED_PIN_GLYPH,
              "icon-size": ["interpolate", ["linear"], ["zoom"], 11, (24 * 36) / 42 / 96, 14, 24 / 96] as never,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "symbol-sort-key": layers.sortKey as never,
            }}
            paint={{ "icon-opacity": ["*", layers.F, layers.T, layers.T] as never }}
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

      {/* Canvas pins have real keyboard controls. A focused control becomes a
          visible label above the map and highlights its corresponding pin. */}
      <ul
        aria-label={pinListLabel}
        inert={chromeHidden}
        style={{
          position: "absolute", top: topInset, left: insetLeft + 16, right: insetRight + 16,
          margin: 0, padding: 0, border: 0, listStyle: "none", zIndex: 45, pointerEvents: "none",
        }}
      >
        {pins.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              aria-pressed={p.id === selectedId}
              title={p.name}
              data-saved={favoriteIds?.has(p.id) || undefined}
              style={focusedPinId === p.id ? {
                position: "relative", display: "block", maxWidth: "100%", padding: "10px 14px",
                borderRadius: 12, border: "1px solid var(--c-300)", background: "var(--c-0, #fff)",
                color: "var(--c-900)", fontSize: 14, fontWeight: 600, boxShadow: "var(--sh-sm)",
                pointerEvents: "auto", textAlign: "left",
              } : {
                position: "absolute", width: 1, height: 1, margin: -1, padding: 0,
                overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0,
              }}
              onClick={() => p.id === selectedId ? onDismiss?.() : onSelect?.(p.id)}
              onFocus={() => { setFocusedPinId(p.id); onHover?.(p.id); }}
              onBlur={() => { setFocusedPinId(null); onHover?.(null); }}
            >
              {p.name}
              {favoriteIds?.has(p.id) && <Icon name="heart" size={14} style={{ marginLeft: 8, color: "var(--p-500)" }} />}
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
            left: chromeLeft,
            right: chromeRight,
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
              padding: "8px 12px",
              borderRadius: 16,
              background: "#fff",
              boxShadow: "var(--sh-md)",
            }}
          >
            <Spinner size={16} color="var(--p-400)" />
          </span>
        </div>
      )}

      {showSearchHere && onSearchArea && !chromeHidden && (
        <div style={{
          position: "absolute",
          top: topInset,
          left: chromeLeft,
          right: chromeRight,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 40,
        }}>
          <button
            type="button"
            className="tap"
            onClick={handleSearchArea}
            style={{
              pointerEvents: "auto",
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
        </div>
      )}

      {overlay}
    </div>
  );
}
