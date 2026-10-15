"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getBrowserLocation,
  ipLocate,
  reverseGeocode,
  type BrowserCoords,
} from "@/lib/geocoding";

export interface HomeLocation {
  coords: BrowserCoords | null;
  /** Locality name, or null while it resolves / if it cannot be determined. */
  city: string | null;
  countryCode: string | null;
  resolving: boolean;
}

const INITIAL: HomeLocation = {
  coords: null, city: null, countryCode: null, resolving: true,
};
let state: HomeLocation = INITIAL;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: HomeLocation): void {
  state = next;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const snapshot = () => state;
const serverSnapshot = () => INITIAL;

async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One geolocation → IP lookup per document, shared by both home feeds. Publish
 * coordinates before reverse-geocoding; city/country also inform footer links.
 * The store is populated in an effect, never during SSR, and immediately gives
 * locale remounts the same resolved location instead of restarting their spinner.
 */
async function resolve(): Promise<void> {
  try {
    const coords = await getBrowserLocation({
      timeout: 8000, maximumAge: 5 * 60_000,
    }).catch(() => null);
    if (coords) {
      publish({ coords, city: null, countryCode: null, resolving: false });
      const match = await withTimeout((signal) => reverseGeocode(coords.lat, coords.lng, signal));
      if (match) publish({
        coords, city: match.city || null,
        countryCode: match.countryCode ?? null, resolving: false,
      });
      return;
    }
    const ip = await withTimeout(ipLocate);
    publish({
      coords: ip ? { lat: ip.lat, lng: ip.lng } : null,
      city: ip?.city || null,
      countryCode: ip?.countryCode ?? null,
      resolving: false,
    });
  } catch {
    // A failed optional lookup must settle, not leave both feeds spinning.
    publish({ ...state, resolving: false });
  }
}

/** Read the existing result without starting a lookup or a permission prompt. */
export function useHomeLocationSnapshot(): HomeLocation {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function useHomeCoords(): HomeLocation {
  const location = useHomeLocationSnapshot();
  useEffect(() => { pending ??= resolve(); }, []);
  return location;
}
