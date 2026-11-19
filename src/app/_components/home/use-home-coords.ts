"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getBrowserLocation,
  ipLocate,
  isLocationAllowed,
  reverseGeocode,
  type BrowserCoords,
} from "@/lib/geocoding";
import { withHomeDeadline } from "./request-deadline";

export interface HomeLocation {
  coords: BrowserCoords | null;
  /** Locality name, or null while it resolves / if it cannot be determined. */
  city: string | null;
  countryCode: string | null;
  /** True when coords/city are the IP estimate rather than the device's position. */
  approximate: boolean;
  resolving: boolean;
}

const INITIAL: HomeLocation = {
  coords: null, city: null, countryCode: null, approximate: false, resolving: true,
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
  publish({ coords, city: null, countryCode: null, approximate: false, resolving: false });
  const match = await withTimeout((signal) => reverseGeocode(coords.lat, coords.lng, signal));
  if (match) publish({
    coords, city: match.city || null,
    countryCode: match.countryCode ?? null, approximate: false, resolving: false,
  });
}

/**
 * One location lookup per document, shared by both home feeds and the
 * industries page. These pages never show the browser's location dialog: that
 * is asked when the map opens. A position is read only when the visitor has
 * already allowed it; everyone else gets the IP estimate straight away.
 * Publish coordinates before reverse-geocoding; the directory can reuse the
 * same location for searches without assigning a different city.
 * The store is populated in an effect, never during SSR, and immediately gives
 * locale remounts the same resolved location instead of restarting their spinner.
 */
async function resolve(): Promise<void> {
  try {
    if (await isLocationAllowed()) {
      const coords = await withTimeout(
        () => getBrowserLocation({ timeout: 8000, maximumAge: 5 * 60_000 }),
      ).catch(() => null);
      if (coords) {
        await publishDevice(coords);
        return;
      }
    }
    const ip = await withTimeout(ipLocate);
    publish({
      coords: ip ? { lat: ip.lat, lng: ip.lng } : null,
      city: ip?.city || null,
      countryCode: ip?.countryCode ?? null,
      approximate: ip != null,
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
