"use client";

/**
 * Notification inbox state, shared between the header's unread badge and the
 * panel that lists the rows.
 *
 * Both need the same `unreadCount`, and marking one row read has to move the
 * badge — so the state lives in one module-level store the two subscribe to,
 * rather than each holding its own copy. (The app has no query client; this is
 * the same shape `useVenueTags` uses, plus mutations and a subscriber set.)
 *
 * There is no push channel on the web, so the count is refreshed on sign-in and
 * whenever the panel is opened. That is enough for a page that is usually
 * opened fresh, and it costs one cheap COUNT query.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  getNotificationsInbox,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/marketplace/customer";
import type { CustomerNotification } from "@/lib/api/marketplace/types";
import {
  getAuthenticatedSessionId,
  subscribeSession,
} from "@/lib/auth/session-store";

const PAGE_SIZE = 20;

export interface NotificationsState {
  items: CustomerNotification[];
  unreadCount: number;
  /** A missing or failed first response is not a confirmed zero. */
  unreadLoaded: boolean;
  unreadLoading: boolean;
  unreadFailed: boolean;
  /** First-page load only — "load more" uses `loadingMore`. */
  loading: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  hasMore: boolean;
  nextCursor?: string;
  /** Set when the last request failed; the panel offers a retry. */
  failed: boolean;
  /** False until a first page has been loaded at least once. */
  loaded: boolean;
}

const INITIAL: NotificationsState = {
  items: [],
  unreadCount: 0,
  unreadLoaded: false,
  unreadLoading: false,
  unreadFailed: false,
  loading: false,
  loadingMore: false,
  moreFailed: false,
  hasMore: false,
  failed: false,
  loaded: false,
};

const UNREAD_MAX_AGE_MS = 60_000;
let state: NotificationsState = INITIAL;
let owner: number | null = null;
let generation = 0;
let unreadUpdatedAt = 0;
let unreadRequest: Promise<void> | null = null;
let firstPageRequest: Promise<void> | null = null;
let pageGeneration = 0;
// Count responses share one ordering across badge and inbox endpoints. A read
// mutation invalidates already-started snapshots, including their row flags.
let countRevision = 0;
let pendingMutations = new Set<Promise<void>>();
let unsubscribeAuth: (() => void) | null = null;
const subscribers = new Set<() => void>();

const currentOwner = getAuthenticatedSessionId;

function setState(patch: Partial<NotificationsState>): void {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn());
}

function resetFor(nextOwner: number | null): void {
  owner = nextOwner;
  generation += 1;
  pageGeneration += 1;
  countRevision += 1;
  pendingMutations = new Set();
  unreadUpdatedAt = 0;
  unreadRequest = null;
  firstPageRequest = null;
  state = INITIAL;
  subscribers.forEach((fn) => fn());
}

function syncOwner(): void {
  const next = currentOwner();
  if (owner === next) return;
  resetFor(next);
  if (next !== null) void ensureUnreadCount();
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  if (!unsubscribeAuth) unsubscribeAuth = subscribeSession(syncOwner);
  syncOwner();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      unsubscribeAuth?.();
      unsubscribeAuth = null;
    }
  };
}

/** Drop cached state and invalidate every outstanding response or rollback. */
export function resetNotifications(): void {
  resetFor(null);
}

function beginRequest(): (() => boolean) | null {
  syncOwner();
  if (owner === null) return null;
  const requestOwner = owner;
  const requestGeneration = generation;
  return () =>
    generation === requestGeneration &&
    owner === requestOwner &&
    currentOwner() === requestOwner;
}

/** Reuse a fresh badge across locale remounts; opening the inbox remains fresh. */
function ensureUnreadCount(): Promise<void> {
  if (unreadUpdatedAt && Date.now() - unreadUpdatedAt < UNREAD_MAX_AGE_MS)
    return Promise.resolve();
  return refreshUnreadCount();
}

/** Cheap badge refresh, shared by concurrent consumers. Failures remain silent. */
export function refreshUnreadCount(): Promise<void> {
  const isCurrent = beginRequest();
  if (!isCurrent) return Promise.resolve();
  if (unreadRequest) return unreadRequest;
  const requestCount = ++countRevision;
  setState({ unreadLoading: true, unreadFailed: false });
  const request = Promise.resolve().then(async () => {
    try {
      await Promise.all(pendingMutations);
      if (!isCurrent() || requestCount !== countRevision) return;
      const unreadCount = await getUnreadNotificationCount();
      if (!isCurrent() || requestCount !== countRevision) return;
      unreadUpdatedAt = Date.now();
      setState({
        unreadCount, unreadLoaded: true, unreadLoading: false, unreadFailed: false,
      });
    } catch {
      // Keep the previous count, but never write into another session.
      if (isCurrent() && requestCount === countRevision)
        setState({ unreadLoading: false, unreadFailed: true });
    } finally {
      if (unreadRequest === request) unreadRequest = null;
    }
  });
  unreadRequest = request;
  return request;
}

/** Load (or reload) the first page, with one request per open session. */
export function loadFirstPage(): Promise<void> {
  const isCurrent = beginRequest();
  if (!isCurrent) return Promise.resolve();
  if (firstPageRequest) return firstPageRequest;
  const pageOwner = ++pageGeneration;
  const requestCount = ++countRevision;
  setState({
    loading: true, loadingMore: false, moreFailed: false,
    unreadLoading: true, unreadFailed: false,
  });
  const request = Promise.resolve().then(async () => {
    try {
      await Promise.all(pendingMutations);
      if (!isCurrent() || pageOwner !== pageGeneration) return;
      const page = await getNotificationsInbox({ limit: PAGE_SIZE });
      if (!isCurrent() || pageOwner !== pageGeneration) return;
      const countIsCurrent = requestCount === countRevision;
      if (countIsCurrent) unreadUpdatedAt = Date.now();
      setState({
        items: page.notifications,
        ...(countIsCurrent ? {
          unreadCount: page.unreadCount, unreadLoaded: true,
          unreadLoading: false, unreadFailed: false,
        } : {}),
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
        loading: false,
        loaded: true,
        failed: false,
      });
    } catch {
      if (isCurrent() && pageOwner === pageGeneration)
        setState({
          loading: false, failed: true,
          ...(requestCount === countRevision ? { unreadLoading: false, unreadFailed: true } : {}),
        });
    } finally {
      if (firstPageRequest === request) firstPageRequest = null;
    }
  });
  firstPageRequest = request;
  return request;
}

export async function loadNextPage(): Promise<void> {
  const isCurrent = beginRequest();
  if (!isCurrent || !state.hasMore || state.loading || state.loadingMore || !state.nextCursor)
    return;
  const pageOwner = pageGeneration;
  const requestCount = ++countRevision;
  setState({ loadingMore: true, unreadLoading: true, unreadFailed: false });
  try {
    await Promise.all(pendingMutations);
    if (!isCurrent() || pageOwner !== pageGeneration) return;
    const page = await getNotificationsInbox({
      cursor: state.nextCursor,
      limit: PAGE_SIZE,
    });
    if (!isCurrent() || pageOwner !== pageGeneration) return;
    const seen = new Set(state.items.map((n) => n.id));
    const countIsCurrent = requestCount === countRevision;
    if (countIsCurrent) unreadUpdatedAt = Date.now();
    setState({
      items: [
        ...state.items,
        ...page.notifications.filter((n) => !seen.has(n.id)),
      ],
      ...(countIsCurrent ? {
        unreadCount: page.unreadCount, unreadLoaded: true,
        unreadLoading: false, unreadFailed: false,
      } : {}),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      loadingMore: false,
      moreFailed: false,
    });
  } catch {
    if (isCurrent() && pageOwner === pageGeneration)
      setState({
        loadingMore: false, moreFailed: true,
        ...(requestCount === countRevision ? { unreadLoading: false, unreadFailed: true } : {}),
      });
  }
}

/** Reads started before a mutation may contain its previous count/read flags. */
function invalidateReads(): void {
  countRevision += 1;
  pageGeneration += 1;
  unreadRequest = null;
  firstPageRequest = null;
  unreadUpdatedAt = 0;
  setState({ loading: false, loadingMore: false, unreadLoading: false });
}

/** Optimistic changes and their rollback belong to the initiating session. */
export async function markRead(id: number): Promise<void> {
  const isCurrent = beginRequest();
  if (!isCurrent) return;
  const row = state.items.find((n) => n.id === id);
  if (!row || row.read) return;
  const countDelta = state.unreadCount > 0 ? 1 : 0;
  invalidateReads();
  setState({
    items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    unreadCount: state.unreadCount - countDelta,
  });
  const mutations = pendingMutations;
  const request = (async () => {
    try {
      await markNotificationRead(id);
    } catch {
      if (!isCurrent()) return;
      setState({
        items: state.items.map((n) => (n.id === id ? { ...n, read: false } : n)),
        unreadCount: state.unreadCount + countDelta,
      });
    }
  })();
  mutations.add(request);
  try {
    await request;
  } finally {
    mutations.delete(request);
  }
}

export async function markAllRead(): Promise<void> {
  const isCurrent = beginRequest();
  if (!isCurrent) return;
  // Settle row mutations first, so a failed row rollback cannot undo a
  // successful read-all. Incoming reads also wait for these writes to settle.
  while (pendingMutations.size > 0) {
    await Promise.all(pendingMutations);
    if (!isCurrent()) return;
  }
  if (!isCurrent()) return;
  const previous = state.items;
  const previousCount = state.unreadCount;
  if (previousCount === 0) return;
  invalidateReads();
  setState({
    items: previous.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  });
  const mutations = pendingMutations;
  const request = (async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      if (isCurrent()) setState({ items: previous, unreadCount: previousCount });
    }
  })();
  mutations.add(request);
  try {
    await request;
  } finally {
    mutations.delete(request);
  }
}

function getSnapshot(): NotificationsState {
  // Hide old data immediately, before effects run, including a return from a
  // route that had no notification subscriber while the account changed.
  return owner === currentOwner() ? state : INITIAL;
}

function getServerSnapshot(): NotificationsState {
  return INITIAL;
}

export function useNotifications(): NotificationsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Unknown counts stay distinct from a successful zero. */
export function useUnreadBadge(isAuthenticated: boolean): number | null {
  const { unreadCount, unreadLoaded } = useNotifications();
  useEffect(() => {
    if (!isAuthenticated) {
      resetNotifications();
      return;
    }
    syncOwner();
    void ensureUnreadCount();
  }, [isAuthenticated]);
  return isAuthenticated && unreadLoaded ? unreadCount : null;
}

/** Loads the first page when the panel opens (and on an explicit retry). */
export function useInboxLoader(open: boolean): () => void {
  const sessionId = useSyncExternalStore(
    subscribeSession,
    getAuthenticatedSessionId,
    () => null,
  );
  const reload = useCallback(() => void loadFirstPage(), []);
  useEffect(() => {
    if (open && sessionId !== null) void loadFirstPage();
  }, [open, sessionId]);
  return reload;
}
