import type { AllFavorites, FavoriteLocation, FavoriteProfessional } from "@/lib/api/marketplace/types";
import type { FavoriteChange, FavoriteKind, FavoriteSnapshot } from "./store";

const KINDS: FavoriteKind[] = ["location", "professional"];
type RecordValue = FavoriteLocation | FavoriteProfessional;
type RefreshReason = "mount" | "focus" | "reconnect" | "manual" | "retry" | "metadata" | "auto";
const identity = (kind: FavoriteKind, id: number) => `${kind}:${id}`;
// Like the app's query client: a first load that fails for a transient reason
// is retried twice before the error shows.
const RETRY_DELAYS_MS = [1000, 2000];

export interface FavoritesCollectionSnapshot {
  session: number | null;
  favorites: AllFavorites | null;
  loading: boolean;
  refreshing: boolean;
  retrying: boolean;
  error: boolean;
  offline: boolean;
  updatedAt: number | null;
  pendingIds: ReadonlySet<string>;
}

export const EMPTY_COLLECTION: FavoritesCollectionSnapshot = {
  session: null, favorites: null, loading: true, refreshing: false,
  retrying: false, error: false, offline: false, updatedAt: null, pendingIds: new Set(),
};

interface CollectionDependencies {
  getSession: () => number | null;
  subscribeSession: (listener: () => void) => () => void;
  isOffline: () => boolean;
  fetch: () => Promise<AllFavorites>;
  getIds: (kind: FavoriteKind) => ReadonlySet<number> | null | undefined;
  getPendingIds: (kind: FavoriteKind) => ReadonlySet<number>;
  getRevision: () => number;
  seedIds: (kind: FavoriteKind, ids: Iterable<number>, session: number, revision: number) => void;
  subscribeChanges: (listener: (change: FavoriteChange) => void) => () => void;
  subscribeSnapshots: (listener: (snapshot: FavoriteSnapshot) => void) => () => void;
  shouldRetry?: (error: unknown) => boolean;
  setTimer?: (run: () => void, ms: number) => () => void;
  now?: () => number;
}

/** Session-owned raw metadata. Views translate it without owning its lifetime.
 * Hidden records keep their position, so a failed removal returns to its place.
 * Nothing here is persisted to disk or shared between accounts.
 */
export function createFavoritesCollection(deps: CollectionDependencies) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((run: () => void, ms: number) => {
    const timer = setTimeout(run, ms);
    return () => clearTimeout(timer);
  });
  const listeners = new Set<() => void>();
  let owner = deps.getSession();
  let records = new Map<string, RecordValue>();
  let order: Record<FavoriteKind, number[]> = { location: [], professional: [] };
  let presence: Record<FavoriteKind, ReadonlySet<number>> = { location: new Set(), professional: new Set() };
  let loaded = false;
  let request: Promise<void> | null = null;
  let changes = new Map<string, FavoriteChange>();
  let snapshots = new Map<FavoriteKind, ReadonlySet<number>>();
  let followup = false;
  let autoRetries = 0;
  let cancelRetry: (() => void) | null = null;
  let lastStarted = -Infinity;
  let started = false;
  let retrying = false;
  let error = false;
  let updatedAt: number | null = null;
  let snapshot: FavoritesCollectionSnapshot = { ...EMPTY_COLLECTION, session: owner, offline: deps.isOffline() };

  function publish() {
    const pendingIds = new Set<string>();
    for (const kind of KINDS) {
      for (const id of deps.getPendingIds(kind)) pendingIds.add(identity(kind, id));
    }
    const visible = (kind: FavoriteKind) => order[kind].flatMap((id) => {
      const row = records.get(identity(kind, id));
      return row && presence[kind].has(id) ? [row] : [];
    });
    const offline = deps.isOffline();
    snapshot = {
      session: owner,
      favorites: loaded ? {
        locations: visible("location") as FavoriteLocation[],
        professionals: visible("professional") as FavoriteProfessional[],
      } : null,
      loading: owner !== null && !loaded && !error && !offline,
      refreshing: loaded && request !== null,
      retrying, error, offline, updatedAt, pendingIds,
    };
    listeners.forEach((listener) => listener());
  }

  function syncSession() {
    const next = deps.getSession();
    if (next === owner) return;
    owner = next;
    records = new Map();
    order = { location: [], professional: [] };
    presence = { location: new Set(), professional: new Set() };
    loaded = false;
    request = null;
    changes = new Map();
    snapshots = new Map();
    followup = false;
    cancelRetry?.();
    cancelRetry = null;
    autoRetries = 0;
    lastStarted = -Infinity;
    error = false;
    retrying = false;
    updatedAt = null;
    publish();
  }

  const hasMissingMetadata = (kind: FavoriteKind) => [...presence[kind]].some((id) =>
    !records.has(identity(kind, id)) && !deps.getPendingIds(kind).has(id));

  function requestMetadata() {
    if (request) followup = true;
    else if (loaded) void refresh("metadata");
  }

  function start() {
    if (started) return;
    started = true;
    // These subscriptions intentionally survive a Saved view unmount. The
    // singleton is browser-only and a session change immediately drops data.
    deps.subscribeChanges((change) => {
      if (change.session !== owner || change.session !== deps.getSession()) return;
      const next = new Set(presence[change.kind]);
      if (change.present) next.add(change.id); else next.delete(change.id);
      presence[change.kind] = next;
      if (request) changes.set(identity(change.kind, change.id), change);
      publish();
      if (change.present && !change.pending && hasMissingMetadata(change.kind)) requestMetadata();
    });
    deps.subscribeSnapshots((value) => {
      if (value.session !== owner || value.session !== deps.getSession() || value.source === "seed") return;
      presence[value.kind] = value.ids;
      if (request) {
        snapshots.set(value.kind, value.ids);
        // This snapshot already includes local mutations up to this point.
        for (const [key, change] of changes) if (change.kind === value.kind) changes.delete(key);
      }
      publish();
      if (hasMissingMetadata(value.kind)) requestMetadata();
    });
    deps.subscribeSession(syncSession);
    syncSession();
  }

  function refresh(reason: RefreshReason = "manual"): Promise<void> {
    start();
    syncSession();
    if (owner === null || deps.isOffline()) { publish(); return Promise.resolve(); }
    if (request) return request;
    // A single return to a browser tab can fire focus and visibility together.
    if (reason === "focus" && now() - lastStarted < 1000) return Promise.resolve();
    const session = owner;
    const revision = deps.getRevision();
    lastStarted = now();
    retrying = reason === "retry";
    changes = new Map();
    snapshots = new Map();
    // Any new read replaces a scheduled retry; only automatic ones use up the budget.
    cancelRetry?.();
    cancelRetry = null;
    if (reason !== "auto") autoRetries = 0;
    let retryIn: number | null = null;
    const current = () => owner === session && deps.getSession() === session && request === work;
    const work = Promise.resolve().then(() => {
      if (!current()) return null;
      return deps.fetch();
    }).then((favorites) => {
      if (!favorites || !current()) return;
      const incoming: Record<FavoriteKind, Array<[number, RecordValue]>> = {
        location: favorites.locations.map((row) => [row.location.id, row]),
        professional: favorites.professionals.map((row) => [row.professional.id, row]),
      };
      for (const kind of KINDS) {
        const nextOrder = [...new Set(incoming[kind].map(([id]) => id))];
        const incomingIds = new Set(nextOrder);
        for (const [id, row] of incoming[kind]) records.set(identity(kind, id), row);
        // Keep hidden metadata at its old position, so a failed removal returns to its place.
        order[kind].forEach((id, index) => {
          if (!incomingIds.has(id)) nextOrder.splice(Math.min(index, nextOrder.length), 0, id);
        });
        order[kind] = nextOrder;
        const ids = new Set(snapshots.get(kind) ?? incomingIds);
        for (const change of changes.values()) {
          if (change.kind !== kind) continue;
          if (change.present) ids.add(change.id); else ids.delete(change.id);
        }
        deps.seedIds(kind, ids, session, revision);
        presence[kind] = deps.getIds(kind) ?? ids;
      }
      loaded = true;
      error = false;
      updatedAt = now();
    }).catch((cause: unknown) => {
      if (!current()) return;
      // Nothing is shown yet: retry a transient failure before reporting it.
      if (!loaded && autoRetries < RETRY_DELAYS_MS.length && (deps.shouldRetry?.(cause) ?? true)) {
        retryIn = RETRY_DELAYS_MS[autoRetries++];
      } else {
        error = true;
      }
    }).finally(() => {
      if (!current()) return;
      request = null;
      retrying = false;
      changes.clear();
      snapshots.clear();
      publish();
      if (retryIn !== null) {
        cancelRetry = setTimer(() => {
          cancelRetry = null;
          void refresh("auto");
        }, retryIn);
        return;
      }
      const needsFollowup = followup;
      followup = false;
      if (needsFollowup && (error || KINDS.some(hasMissingMetadata))) void refresh("metadata");
    });
    request = work;
    publish();
    return work;
  }

  return {
    getSnapshot: () => deps.getSession() === owner ? snapshot : EMPTY_COLLECTION,
    subscribe(listener: () => void) {
      start();
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    refresh,
    connectivityChanged() {
      syncSession();
      publish();
      if (!deps.isOffline() && listeners.size) {
        if (request) followup = true;
        else void refresh("reconnect");
      }
    },
    focus() { if (listeners.size) void refresh("focus"); },
  };
}
