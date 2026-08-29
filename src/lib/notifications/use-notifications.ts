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

const PAGE_SIZE = 20;

export interface NotificationsState {
  items: CustomerNotification[];
  unreadCount: number;
  /** First-page load only — "load more" uses `loadingMore`. */
  loading: boolean;
  loadingMore: boolean;
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
  loading: false,
  loadingMore: false,
  hasMore: false,
  failed: false,
  loaded: false,
};

let state: NotificationsState = INITIAL;
const subscribers = new Set<() => void>();

function setState(patch: Partial<NotificationsState>): void {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Drop everything on sign-out — one user's inbox must never outlive their session. */
export function resetNotifications(): void {
  state = INITIAL;
  subscribers.forEach((fn) => fn());
}

/** Cheap badge refresh: a COUNT, no rows. Silent on failure — a stale badge is
 *  a better outcome than an error toast the user did not ask for. */
export async function refreshUnreadCount(): Promise<void> {
  try {
    setState({ unreadCount: await getUnreadNotificationCount() });
  } catch {
    // keep the previous count
  }
}

/** Load (or reload) the first page. */
export async function loadFirstPage(): Promise<void> {
  setState({ loading: true, failed: false });
  try {
    const page = await getNotificationsInbox({ limit: PAGE_SIZE });
    setState({
      items: page.notifications,
      unreadCount: page.unreadCount,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      loading: false,
      loaded: true,
      failed: false,
    });
  } catch {
    setState({ loading: false, failed: true });
  }
}

export async function loadNextPage(): Promise<void> {
  if (!state.hasMore || state.loadingMore || !state.nextCursor) return;
  setState({ loadingMore: true });
  try {
    const page = await getNotificationsInbox({
      cursor: state.nextCursor,
      limit: PAGE_SIZE,
    });
    // Append, de-duplicating on id: a row inserted between two page fetches
    // shifts the cursor window and can otherwise repeat an item.
    const seen = new Set(state.items.map((n) => n.id));
    setState({
      items: [
        ...state.items,
        ...page.notifications.filter((n) => !seen.has(n.id)),
      ],
      unreadCount: page.unreadCount,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      loadingMore: false,
    });
  } catch {
    // Keep what's loaded; `hasMore` stays true so the button can be retried.
    setState({ loadingMore: false });
  }
}

/** Optimistic: the row greys out immediately and reverts if the call fails. */
export async function markRead(id: number): Promise<void> {
  const row = state.items.find((n) => n.id === id);
  if (!row || row.read) return;
  setState({
    items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    unreadCount: Math.max(0, state.unreadCount - 1),
  });
  try {
    await markNotificationRead(id);
  } catch {
    setState({
      items: state.items.map((n) => (n.id === id ? { ...n, read: false } : n)),
      unreadCount: state.unreadCount + 1,
    });
  }
}

export async function markAllRead(): Promise<void> {
  const previous = state.items;
  const previousCount = state.unreadCount;
  if (previousCount === 0) return;
  setState({
    items: previous.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  });
  try {
    await markAllNotificationsRead();
  } catch {
    setState({ items: previous, unreadCount: previousCount });
  }
}

function getSnapshot(): NotificationsState {
  return state;
}

/** Server render has no session and no inbox — always the empty state. */
function getServerSnapshot(): NotificationsState {
  return INITIAL;
}

export function useNotifications(): NotificationsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Keeps the header's unread badge in sync with the session: loads the count
 * once the user is authenticated, and clears everything on sign-out.
 */
export function useUnreadBadge(isAuthenticated: boolean): number {
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!isAuthenticated) {
      resetNotifications();
      return;
    }
    void refreshUnreadCount();
  }, [isAuthenticated]);

  return isAuthenticated ? unreadCount : 0;
}

/** Loads the first page when the panel opens (and on an explicit retry). */
export function useInboxLoader(open: boolean): () => void {
  const reload = useCallback(() => void loadFirstPage(), []);
  useEffect(() => {
    if (open) void loadFirstPage();
  }, [open]);
  return reload;
}
