"use client";

import { useEffect, useState } from "react";
import {
  getBrowserLocation,
  ipLocate,
  reverseGeocode,
  type BrowserCoords,
} from "@/lib/geocoding";

/**
 * Resolve the visitor's position ONCE per page load and share it across every home feed.
 *
 * The ladder: ask the browser (the permission prompt the user already sees), and if that is
 * denied, unavailable, or times out, fall back to the coarse IP estimate — "the city itself,
 * as best we can". Only a total miss yields null.
 *
 * The city NAME is resolved separately and reported late. It is needed only for the "see all"
 * link (which opens the map scoped to that city), never for the feeds themselves — so coords
 * are published the moment they land and the reverse-geocode never delays a fetch.
 *
 * Both promises are cached at module scope so "Near you" and "In your city" mounting together
 * trigger one resolution, not two: one prompt, one IP call, one reverse-geocode.
 */
interface Resolved {
  coords: BrowserCoords | null;
  /** Non-null only on the IP path, which returns a name for free. */
  city: string | null;
}

let pendingBase: Promise<Resolved> | null = null;
let pendingCity: Promise<string | null> | null = null;

function resolveBase(): Promise<Resolved> {
  pendingBase ??= (async () => {
    const point = await getBrowserLocation({
      timeout: 8000,
      maximumAge: 5 * 60 * 1000,
    });
    // Geolocation gives coordinates only — the name is looked up afterwards.
    if (point) return { coords: point, city: null };
    const ip = await ipLocate();
    return ip
      ? { coords: { lat: ip.lat, lng: ip.lng }, city: ip.city || null }
      : { coords: null, city: null };
  })();
  return pendingBase;
}

export interface HomeLocation {
  coords: BrowserCoords | null;
  /** Locality name, or null while it resolves / if it cannot be determined. */
  city: string | null;
  /** True until the coords ladder settles — feeds should show a spinner, not an empty state. */
  resolving: boolean;
}

export function useHomeCoords(): HomeLocation {
  const [state, setState] = useState<HomeLocation>({
    coords: null,
    city: null,
    resolving: true,
  });

  useEffect(() => {
    let cancelled = false;

    void resolveBase().then((base) => {
      if (cancelled) return;
      setState({ coords: base.coords, city: base.city, resolving: false });
      // Geolocation path: name the place in the background, purely for the map link.
      if (base.coords && !base.city) {
        pendingCity ??= reverseGeocode(base.coords.lat, base.coords.lng).then(
          (match) => match?.city ?? null,
        );
        void pendingCity.then((city) => {
          if (!cancelled && city) setState((prev) => ({ ...prev, city }));
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
