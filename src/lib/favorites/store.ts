"use client";

import { getAuthenticatedSessionId, subscribeSession } from "@/lib/auth/session-store";
import {
  getFavoriteBusinesses, getFavoriteLocations, getFavoriteProfessionals,
} from "@/lib/api/marketplace/customer";

export type FavoriteKind = "business" | "location" | "professional";
const KINDS: FavoriteKind[] = ["business", "location", "professional"];
const FRESH_MS = 60_000;
const EMPTY: ReadonlySet<number> = new Set();
const fetchIds = {
  business: () => getFavoriteBusinesses().then((rows) => rows.map((row) => row.business.id)),
  location: () => getFavoriteLocations().then((rows) => rows.map((row) => row.location.id)),
  professional: () => getFavoriteProfessionals().then((rows) => rows.map((row) => row.professional.id)),
};
type Entry = {
  ids: ReadonlySet<number>;
  updatedAt: number;
  attemptedAt: number;
  failed: boolean;
  request: Promise<void> | null;
  pending: Set<number>;
  // Changes made while a list is loading take precedence over that response.
  changes: Map<number, boolean>;
};
const entries = new Map<FavoriteKind, Entry>();
const listeners = new Map<FavoriteKind, Set<() => void>>();
let owner: number | null = null;
let unsubscribeSession: (() => void) | null = null;

function entryFor(kind: FavoriteKind): Entry {
  let entry = entries.get(kind);
  if (!entry) {
    entry = { ids: EMPTY, updatedAt: 0, attemptedAt: 0, failed: false, request: null, pending: new Set(), changes: new Map() };
    entries.set(kind, entry);
  }
  return entry;
}
function emit(kind: FavoriteKind) { listeners.get(kind)?.forEach((listener) => listener()); }
function syncOwner(): void {
  const next = getAuthenticatedSessionId();
  if (next === owner) return;
  owner = next;
  entries.clear();
  for (const kind of KINDS) {
    emit(kind);
    if (next !== null && listeners.get(kind)?.size) void ensureFavoriteIds(kind);
  }
}
function owns(entry: Entry, kind: FavoriteKind, session: number): boolean {
  return getAuthenticatedSessionId() === session && owner === session && entries.get(kind) === entry;
}

/** Freshness and ownership apply to raw IDs; labels are translated by each view. */
// undefined means unresolved; null means the first request failed. Neither is
// an empty saved list. Successful IDs remain usable during background refresh.
export function getFavoriteIds(kind: FavoriteKind): ReadonlySet<number> | null | undefined {
  if (owner === null || owner !== getAuthenticatedSessionId()) return undefined;
  const entry = entries.get(kind);
  return entry?.updatedAt ? entry.ids : entry?.failed ? null : undefined;
}
export const getServerFavoriteIds = () => undefined;

export function ensureFavoriteIds(kind: FavoriteKind): Promise<void> {
  syncOwner();
  const session = owner;
  if (session === null) return Promise.resolve();
  const entry = entryFor(kind);
  if (entry.request) return entry.request;
  if (Date.now() - Math.max(entry.updatedAt, entry.attemptedAt) < FRESH_MS) return Promise.resolve();
  entry.attemptedAt = Date.now();
  entry.failed = false;
  entry.changes.clear();
  const request = fetchIds[kind]().then((ids) => {
    if (!owns(entry, kind, session)) return;
    const next = new Set(ids);
    // Include operations that started before this request and are still pending.
    for (const id of entry.pending) {
      if (entry.ids.has(id)) next.add(id); else next.delete(id);
    }
    for (const [id, present] of entry.changes) {
      if (present) next.add(id); else next.delete(id);
    }
    entry.ids = next;
    entry.updatedAt = Date.now();
    emit(kind);
  }).catch(() => {
    // Keep known hearts during a transient failure; entry/focus retries later.
    if (owns(entry, kind, session)) {
      entry.failed = true;
      emit(kind);
    }
  }).finally(() => {
    if (owns(entry, kind, session)) { entry.request = null; entry.changes.clear(); }
  });
  entry.request = request;
  emit(kind);
  return request;
}

export function subscribeFavoriteIds(kind: FavoriteKind, listener: () => void): () => void {
  const subscribers = listeners.get(kind) ?? new Set<() => void>();
  listeners.set(kind, subscribers);
  subscribers.add(listener);
  if (!unsubscribeSession) unsubscribeSession = subscribeSession(syncOwner);
  syncOwner();
  return () => {
    subscribers.delete(listener);
    if (![...listeners.values()].some((set) => set.size)) {
      unsubscribeSession?.();
      unsubscribeSession = null;
    }
  };
}

/** Reserve an ID across views and locale remounts; stale completions are ignored. */
export function beginFavoriteChange(kind: FavoriteKind, id: number, present?: boolean) {
  syncOwner();
  const session = owner;
  if (session === null) return null;
  const entry = entryFor(kind);
  if (!entry.updatedAt) return null;
  if (entry.pending.has(id)) return null;
  const previous = entry.ids.has(id);
  entry.pending.add(id);
  const write = (value: boolean) => {
    if (!owns(entry, kind, session)) return;
    const next = new Set(entry.ids);
    if (value) next.add(id); else next.delete(id);
    entry.ids = next;
    if (entry.request) entry.changes.set(id, value);
    emit(kind);
  };
  write(present ?? !previous);
  return {
    previous,
    isCurrent: () => owns(entry, kind, session),
    rollback: () => write(previous),
    finish: () => { entry.pending.delete(id); },
  };
}

/** Saved-page mutations use their own undo UI but update these shared hearts. */
export function recordFavoriteChange(kind: FavoriteKind, id: number, present: boolean, session: number | null): void {
  if (session === null || getAuthenticatedSessionId() !== session) return;
  syncOwner();
  const entry = entryFor(kind);
  const next = new Set(entry.ids);
  if (present) next.add(id); else next.delete(id);
  entry.ids = next;
  if (entry.request) entry.changes.set(id, present);
  // Do not mark the whole list fresh based on one mutation.
  emit(kind);
}
