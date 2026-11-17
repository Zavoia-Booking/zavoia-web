"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getBrowserLocation,
  ipLocate,
  reverseGeocode,
  type BrowserCoords,
} from "@/lib/geocoding";
import { withHomeDeadline } from "./request-deadline";

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
  return withHomeDeadline(request, { timeoutMs: 8000 });
}

/** Device coordinates first, then their locality once reverse-geocoded. */
async function publishDevice(coords: BrowserCoords): Promise<void> {
  publish({ coords, city: null, countryCode: null, resolving: false });
  const match = await withTimeout((signal) => reverseGeocode(coords.lat, coords.lng, signal));
  if (match) publish({
    coords, city: match.city || null,
    countryCode: match.countryCode ?? null, resolving: false,
  });
}

/**
 * One geolocation → IP lookup per document, shared by both home feeds. Publish
 * coordinates before reverse-geocoding; the directory can reuse the same
 * location for searches without assigning a different city.
 * The store is populated in an effect, never during SSR, and immediately gives
 * locale remounts the same resolved location instead of restarting their spinner.
 */
async function resolve(): Promise<void> {
  // A native geolocation timeout does not guarantee the browser invokes a
  // callback (for example, while a permission prompt remains unanswered), so
  // the feeds stop waiting at the deadline. The request itself stays open.
  const device = getBrowserLocation({ timeout: 8000, maximumAge: 5 * 60_000 });
  let deviceLate = false;
  try {
    const coords = await withTimeout(() => device).catch(() => null);
    if (coords) {
      await publishDevice(coords);
      return;
    }
    // An "Allow" given after the deadline still settles that same request:
    // the real position then replaces the IP estimate, and a slower IP answer
    // must not overwrite it.
    void device.then((late) => {
      if (!late) return;
      deviceLate = true;
      return publishDevice(late);
    }).catch(() => {
      // The position is already published; only its locality lookup failed.
    });
    const ip = await withTimeout(ipLocate);
    if (deviceLate) return;
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
