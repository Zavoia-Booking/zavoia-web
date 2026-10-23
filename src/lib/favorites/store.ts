"use client";

import { getAuthenticatedSessionId, subscribeSession } from "@/lib/auth/session-store";
import { getFavoriteLocations, getFavoriteProfessionals } from "@/lib/api/marketplace/customer";

export type FavoriteKind = "location" | "professional";
const KINDS: FavoriteKind[] = ["location", "professional"];
const FRESH_MS = 60_000;
const EMPTY: ReadonlySet<number> = new Set();
const fetchIds = {
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
  loadVersion: number;
  mutationVersions: Map<number, number>;
  // Retain local choices against reads started before settlement. A later
  // read is authoritative, including newer choices made on another client.
  intents: Map<number, { present: boolean; revision: number }>;
};
export interface FavoriteChange {
  kind: FavoriteKind;
  id: number;
  present: boolean;
  pending: boolean;
  session: number;
}
export interface FavoriteSnapshot {
  kind: FavoriteKind;
  ids: ReadonlySet<number>;
  session: number;
  source: "load" | "seed";
}
const entries = new Map<FavoriteKind, Entry>();
const listeners = new Map<FavoriteKind, Set<() => void>>();
const changeListeners = new Set<(change: FavoriteChange) => void>();
const snapshotListeners = new Set<(snapshot: FavoriteSnapshot) => void>();
let owner: number | null = null;
let unsubscribeSession: (() => void) | null = null;
let mutationVersion = 0;

function entryFor(kind: FavoriteKind): Entry {
  let entry = entries.get(kind);
  if (!entry) {
    entry = { ids: EMPTY, updatedAt: 0, attemptedAt: 0, failed: false, request: null, pending: new Set(), changes: new Map(), loadVersion: 0, mutationVersions: new Map(), intents: new Map() };
    entries.set(kind, entry);
  }
  return entry;
}
function emit(kind: FavoriteKind) { listeners.get(kind)?.forEach((listener) => listener()); }
function emitChange(entry: Entry, kind: FavoriteKind, id: number, session: number) {
  const change = { kind, id, present: entry.ids.has(id), pending: entry.pending.has(id), session };
  changeListeners.forEach((listener) => listener(change));
}
function releaseSessionSubscription() {
  if (changeListeners.size || snapshotListeners.size || [...listeners.values()].some((set) => set.size)) return;
  unsubscribeSession?.();
  unsubscribeSession = null;
}
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

/** Capture before starting a read; a newer local choice must win its response. */
export function getFavoriteRevision(): number { return mutationVersion; }

function acceptIds(entry: Entry, kind: FavoriteKind, ids: Iterable<number>, session: number, revision: number, source: FavoriteSnapshot["source"]) {
  const next = new Set(ids);
  for (const [id, intent] of entry.intents) {
    if (!entry.pending.has(id) && intent.revision <= revision) {
      entry.intents.delete(id);
    } else if (intent.present) next.add(id);
    else next.delete(id);
  }
  for (const id of entry.pending) {
    if (entry.ids.has(id)) next.add(id); else next.delete(id);
  }
  // A remotely observed choice invalidates an older queued Undo as well.
  for (const id of new Set([...entry.ids, ...next])) {
    if (entry.ids.has(id) !== next.has(id)) entry.mutationVersions.set(id, ++mutationVersion);
  }
  entry.ids = next;
  entry.updatedAt = Date.now();
  emit(kind);
  snapshotListeners.forEach((listener) => listener({ kind, ids: next, session, source }));
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
  const loadVersion = ++entry.loadVersion;
  const revision = getFavoriteRevision();
  const current = () => owns(entry, kind, session) && entry.loadVersion === loadVersion;
  const request = fetchIds[kind]().then((ids) => {
    if (!current()) return;
    const next = new Set(ids);
    // Include operations that started before this request and are still pending.
    for (const id of entry.pending) {
      if (entry.ids.has(id)) next.add(id); else next.delete(id);
    }
    for (const [id, present] of entry.changes) {
      if (present) next.add(id); else next.delete(id);
    }
    acceptIds(entry, kind, next, session, revision, "load");
  }).catch(() => {
    // Keep known hearts during a transient failure; entry/focus retries later.
    if (current()) {
      entry.failed = true;
      emit(kind);
    }
  }).finally(() => {
    if (current()) { entry.request = null; entry.changes.clear(); }
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
    releaseSessionSubscription();
  };
}

/** Explicit mutations, including optimistic updates and rollbacks, for Saved. */
export function subscribeFavoriteChanges(listener: (change: FavoriteChange) => void): () => void {
  changeListeners.add(listener);
  if (!unsubscribeSession) unsubscribeSession = subscribeSession(syncOwner);
  syncOwner();
  return () => {
    changeListeners.delete(listener);
    releaseSessionSubscription();
  };
}

/** Authoritative per-kind reads also reconcile an already-cached Saved list. */
export function subscribeFavoriteSnapshots(listener: (snapshot: FavoriteSnapshot) => void): () => void {
  snapshotListeners.add(listener);
  if (!unsubscribeSession) unsubscribeSession = subscribeSession(syncOwner);
  syncOwner();
  return () => {
    snapshotListeners.delete(listener);
    releaseSessionSubscription();
  };
}

export function getPendingFavoriteIds(kind: FavoriteKind): ReadonlySet<number> {
  if (owner === null || owner !== getAuthenticatedSessionId()) return EMPTY;
  return entries.get(kind)?.pending ?? EMPTY;
}

/** The unified Saved response also resolves hearts, without a read per kind.
 * Callers merge changes made during their request; active mutations always win.
 */
export function seedFavoriteIds(kind: FavoriteKind, ids: Iterable<number>, session: number, revision = getFavoriteRevision()): void {
  if (getAuthenticatedSessionId() !== session) return;
  syncOwner();
  const entry = entryFor(kind);
  const next = new Set(ids);
  for (const id of entry.pending) {
    if (entry.ids.has(id)) next.add(id); else next.delete(id);
  }
  // An older per-kind read cannot overwrite this newer unified response.
  entry.loadVersion += 1;
  entry.request = null;
  entry.changes.clear();
  entry.failed = false;
  acceptIds(entry, kind, next, session, revision, "seed");
  entry.attemptedAt = entry.updatedAt;
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
  entry.pending = new Set(entry.pending).add(id);
  let version = 0;
  let finished = false;
  const write = (value: boolean) => {
    if (!owns(entry, kind, session)) return;
    const next = new Set(entry.ids);
    if (value) next.add(id); else next.delete(id);
    entry.ids = next;
    version = ++mutationVersion;
    entry.mutationVersions.set(id, version);
    entry.intents.set(id, { present: value, revision: version });
    if (entry.request) entry.changes.set(id, value);
    emit(kind);
    emitChange(entry, kind, id, session);
  };
  write(present ?? !previous);
  return {
    previous,
    // A late response must not reverse a later choice made on another surface.
    isCurrent: () => owns(entry, kind, session) && entry.mutationVersions.get(id) === version,
    rollback: () => {
      if (!finished && entry.mutationVersions.get(id) === version) write(previous);
    },
    finish: () => {
      if (finished || !owns(entry, kind, session)) return;
      finished = true;
      entry.pending = new Set(entry.pending);
      entry.pending.delete(id);
      if (entry.mutationVersions.get(id) === version) {
        const intent = entry.intents.get(id);
        if (intent) intent.revision = ++mutationVersion;
      }
      emit(kind);
      emitChange(entry, kind, id, session);
    },
  };
}
