"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import Map, {
  Marker,
  type MapRef,
  type MarkerEvent,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import type { CategoryKey } from "@/components/ui/cat-dot";
import { Icon } from "@/components/ui/icon";
import { MAPBOX_TOKEN } from "@/lib/env";
import { PinGlyph, type PinState } from "./pin";
import { UserDotGlyph } from "./user-dot";
import { MapControls } from "./map-controls";
import {
  RE_ANCHOR_VIEWPORT_FRACTION,
  SEARCH_AREA_THRESHOLD_KM,
  SEARCH_RADIUS_KM,
} from "./constants";

// Default view when there are no pins to fit — central Bucharest.
export const DEFAULT_CENTER_LNG = 26.1025;
export const DEFAULT_CENTER_LAT = 44.4268;
export const DEFAULT_ZOOM = 11;

const FIT_PADDING = 48;
const FIT_MAX_ZOOM = 15;

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
  cat: CategoryKey | string;
  lat: number;
  lng: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Imperative camera commands — lets the page fly the map (e.g. recenter). */
export interface MapboxSurfaceHandle {
  flyTo: (point: GeoPoint) => void;
}

// Camera target when flying to the user's position: keep their zoom if they
// are already closer, otherwise come down to a neighbourhood-level view.
const RECENTER_MIN_ZOOM = 14;

export interface MapboxSurfaceProps {
  pins: GeoPin[];
  selectedId: number | null;
  viewedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
  onRecenter?: () => void;
  /** Re-keys the markers so they re-drop when the result set changes. */
  wave?: string;
  userPos?: GeoPoint | null;
  recenterAria: string;
  /** Current search anchor (URL lat/lng) — pan distance is measured from here. */
  anchor?: GeoPoint | null;
  /**
   * Re-run the search anchored on the new map center (radius is fixed
   * elsewhere). `visibleWidthKm` is the map's current viewport width, used by
   * the caller for nothing — the zoom-aware threshold is applied here.
   */
  onSearchArea?: (area: { lat: number; lng: number }) => void;
  searchAreaLabel: string;
  /**
   * Pixels along each edge that a floating overlay covers. The desktop results
   * panel sits ON TOP of the map's left edge, so fitting the camera to the pin
   * bounds with uniform padding parks part of every result set underneath it.
   */
  fitInset?: { left?: number; right?: number; top?: number; bottom?: number };
  /** Shown in place of the map when no Mapbox token is configured. */
  unavailableLabel: string;
  children?: ReactNode;
  ref?: Ref<MapboxSurfaceHandle>;
}

// Real Mapbox GL map for the /search page. Pins come from the same
// LocationCard result set as before, now placed by real lat/lng. Falls back to
// a neutral panel when no token is configured so `next build` (token-less)
// never instantiates mapbox-gl (which throws on an empty token).
export function MapboxSurface({
  pins,
  selectedId,
  viewedIds,
  onSelect,
  onHover,
  onRecenter,
  wave = "",
  userPos,
  recenterAria,
  anchor,
  onSearchArea,
  searchAreaLabel,
  fitInset,
  unavailableLabel,
  children,
  ref,
}: MapboxSurfaceProps) {
  const mapRef = useRef<MapRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (point: GeoPoint) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: [point.lng, point.lat],
        zoom: Math.max(map.getZoom(), RECENTER_MIN_ZOOM),
        duration: 900,
      });
    },
  }));

  // Shown after a USER-initiated pan/zoom; hidden again once new results load.
  const [showSearchHere, setShowSearchHere] = useState(false);

  // A stable signature of the current pin coordinates — re-fits the viewport
  // only when the actual set of points changes.
  const fitKey = pins
    .map((p) => `${p.lng},${p.lat}`)
    .join("|");

  // A new/updated result set just loaded (fitKey changed) → dismiss the
  // "Search this area" prompt. React's "adjust state when a prop changes"
  // pattern: store the previous fitKey IN state and reset during render, which
  // re-renders immediately without a cascading effect. The fitBounds call below
  // fires `moveend` WITHOUT an originalEvent, so the onMoveEnd guard won't
  // re-show the button afterwards.
  const [lastFitKey, setLastFitKey] = useState(fitKey);
  if (lastFitKey !== fitKey) {
    setLastFitKey(fitKey);
    setShowSearchHere(false);
  }

  // Fit the viewport to the current pins on mount and whenever they change.
  // Padding is per-side so pins never land under a floating overlay (the
  // desktop results panel); each side is at least FIT_PADDING.
  const insetLeft = fitInset?.left ?? 0;
  const insetRight = fitInset?.right ?? 0;
  const insetTop = fitInset?.top ?? 0;
  const insetBottom = fitInset?.bottom ?? 0;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    const first: [number, number] = [pins[0].lng, pins[0].lat];
    const bounds = new LngLatBounds(first, first);
    for (const p of pins) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, {
      padding: {
        left: FIT_PADDING + insetLeft,
        right: FIT_PADDING + insetRight,
        top: FIT_PADDING + insetTop,
        bottom: FIT_PADDING + insetBottom,
      },
      maxZoom: FIT_MAX_ZOOM,
      duration: 600,
    });
    // fitKey captures the coordinate set; pins ref identity is incidental.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, insetLeft, insetRight, insetTop, insetBottom]);

  /** Width of the currently visible map, in km — the zoom half of the threshold. */
  function visibleWidthKm(): number | undefined {
    const map = mapRef.current?.getMap();
    if (!map) return undefined;
    const b = map.getBounds();
    if (!b) return undefined;
    const west = b.getWest();
    const east = b.getEast();
    const lat = b.getCenter().lat;
    return haversineKm(lat, west, lat, east);
  }

  // User-driven moves carry `originalEvent` (mouse/touch/wheel); programmatic
  // camera moves (our fitBounds) leave it undefined — so this only fires for
  // real gestures. `originalEvent` lives on every member of the moveend event
  // shape but TS can't surface it across the union, so read it via a narrow cast.
  //
  // The offer is zoom-aware, matching the mobile app: the pan must move the
  // centre by most of a screen width at the CURRENT zoom, clamped between a
  // floor (a sub-2km wiggle is never a new area, however far in you are) and
  // the searched radius (zoomed right out a small drag sweeps huge distances,
  // and past the radius the offer is always warranted). A fixed 2km threshold
  // offered "search this area" on a nudge at street zoom and demanded a
  // continent-sized pan at country zoom.
  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    const original = (e as { originalEvent?: unknown }).originalEvent;
    if (!original) return;
    const center = mapRef.current?.getMap().getCenter();
    if (anchor && center) {
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
    } else {
      setShowSearchHere(true);
    }
  };

  const handleSearchArea = () => {
    const map = mapRef.current?.getMap();
    if (!map || !onSearchArea) return;
    const center = map.getCenter();
    onSearchArea({ lat: center.lat, lng: center.lng });
    setShowSearchHere(false);
  };

  // Controls overlay (recenter) + arbitrary children — shared by the real map
  // and the no-token fallback so behaviour matches in both states.
  const overlay = (
    <>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 56,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 30,
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <MapControls onRecenter={onRecenter} recenterAria={recenterAria} />
        </div>
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
      <Map
        ref={mapRef}
        // Pool & reuse the mapbox-gl instance across soft-navigation remounts so
        // returning to /search doesn't re-initialize the map (a billed map load).
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: pins[0]?.lng ?? DEFAULT_CENTER_LNG,
          latitude: pins[0]?.lat ?? DEFAULT_CENTER_LAT,
          zoom: pins.length ? FIT_MAX_ZOOM : DEFAULT_ZOOM,
        }}
        // mapStyle="mapbox://styles/mapbox/streets-v12"
        mapStyle="mapbox://styles/zavoia/cmphvlj8p002c01sgdl3q3kpb"
        style={{ width: "100%", height: "100%" }}
        onMoveEnd={handleMoveEnd}
      >
        {pins.map((p, i) => {
          const isSelected = p.id === selectedId;
          const isViewed = !isSelected && (viewedIds?.has(p.id) ?? false);
          const state: PinState = isSelected
            ? "selected"
            : isViewed
              ? "viewed"
              : "default";
          return (
            <Marker
              key={`${wave}:${p.id}`}
              longitude={p.lng}
              latitude={p.lat}
              anchor="bottom"
              onClick={(e: MarkerEvent<MouseEvent>) => {
                e.originalEvent?.stopPropagation();
                onSelect?.(p.id);
              }}
            >
              {/* A real button, so the map's results are reachable by keyboard
                  and announced as actionable — a <span aria-label> is neither.
                  Marker's own onClick handles pointer input; Enter/Space fire
                  this element's click, which Marker does not intercept. */}
              <button
                type="button"
                aria-label={p.name}
                aria-pressed={isSelected}
                onClick={() => onSelect?.(p.id)}
                onFocus={onHover ? () => onHover(p.id) : undefined}
                onBlur={onHover ? () => onHover(null) : undefined}
                onMouseEnter={onHover ? () => onHover(p.id) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
                style={{
                  display: "inline-flex",
                  cursor: "pointer",
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  transform: `scale(${isSelected ? 1.45 : 1})`,
                  transition: "transform .35s var(--ease-spring)",
                  opacity: isViewed ? 0.55 : 1,
                  filter: isViewed ? "saturate(0.5)" : "none",
                }}
              >
                <PinGlyph cat={p.cat} state={state} dropIndex={wave ? i : null} />
              </button>
            </Marker>
          );
        })}

        {userPos && (
          <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
            <UserDotGlyph />
          </Marker>
        )}
      </Map>

      {showSearchHere && onSearchArea && (
        <button
          type="button"
          className="tap"
          onClick={handleSearchArea}
          style={{
            position: "absolute",
            top: 16,
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
