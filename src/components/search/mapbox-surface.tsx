"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { SEARCH_AREA_THRESHOLD_KM } from "./constants";

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
  /** Re-run the search anchored on the new map center (radius is fixed elsewhere). */
  onSearchArea?: (area: { lat: number; lng: number }) => void;
  searchAreaLabel: string;
  children?: ReactNode;
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
  children,
}: MapboxSurfaceProps) {
  const mapRef = useRef<MapRef>(null);

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
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    const first: [number, number] = [pins[0].lng, pins[0].lat];
    const bounds = new LngLatBounds(first, first);
    for (const p of pins) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, {
      padding: FIT_PADDING,
      maxZoom: FIT_MAX_ZOOM,
      duration: 600,
    });
    // fitKey captures the coordinate set; pins ref identity is incidental.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // User-driven moves carry `originalEvent` (mouse/touch/wheel); programmatic
  // camera moves (our fitBounds) leave it undefined — so this only fires for
  // real gestures. `originalEvent` lives on every member of the moveend event
  // shape but TS can't surface it across the union, so read it via a narrow cast.
  // Only offer "Search this area" once the user has panned ≥ threshold km from
  // the current anchor; with no anchor, show on any user move (prior behaviour).
  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    const original = (e as { originalEvent?: unknown }).originalEvent;
    if (!original) return;
    const center = mapRef.current?.getMap().getCenter();
    if (anchor && center) {
      const dist = haversineKm(center.lat, center.lng, anchor.lat, anchor.lng);
      setShowSearchHere(dist >= SEARCH_AREA_THRESHOLD_KM);
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
          Map unavailable
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
        mapStyle="mapbox://styles/mapbox/streets-v12"
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
              <span
                aria-label={p.name}
                onMouseEnter={onHover ? () => onHover(p.id) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
                style={{
                  display: "inline-flex",
                  cursor: "pointer",
                  transform: `scale(${isSelected ? 1.45 : 1})`,
                  transition: "transform .35s var(--ease-spring)",
                  opacity: isViewed ? 0.55 : 1,
                  filter: isViewed ? "saturate(0.5)" : "none",
                }}
              >
                <PinGlyph cat={p.cat} state={state} dropIndex={wave ? i : null} />
              </span>
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
