"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ACTION_TOAST_HOLD_MS, useToast, type ToastHandle } from "@/components/ui";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { customerErrorMessage, isBenignCustomerError } from "@/lib/api/customer-error-messages";
import { removeFavoriteLocation, removeFavoriteProfessional } from "@/lib/api/marketplace/customer";
import { getAuthenticatedSessionId, subscribeSession } from "@/lib/auth/session-store";
import {
  getSavedCollectionSnapshot, getServerSavedCollectionSnapshot,
  refreshSavedCollection, subscribeSavedCollection,
} from "@/lib/favorites/collection-cache";
import { beginFavoriteChange, getFavoriteIds, type FavoriteKind } from "@/lib/favorites/store";
import { buildSavedItems, type SavedItem } from "./saved-model";

const REMOVE = { location: removeFavoriteLocation, professional: removeFavoriteProfessional };
const NO_KEYS: ReadonlySet<string> = new Set();
const serverSession = () => null;
const favoriteKind = (item: SavedItem): FavoriteKind => item.kind === "person" ? "professional" : "location";

type PendingRemoval = {
  item: SavedItem;
  session: number;
  toast: ToastHandle;
  timer: ReturnType<typeof setTimeout>;
};

/** Views own translation; the session cache owns records and refresh.
 * Removal follows the marketplace app: the row hides at once and the delete is
 * sent only when its Undo window closes, another item is removed, or Saved
 * unmounts. Undo is local, so it never re-saves the item or resets its date.
 * Closing the tab inside the window leaves the item saved.
 */
export function useSavedFavorites(locale: Locale) {
  const session = useSyncExternalStore(subscribeSession, getAuthenticatedSessionId, serverSession);
  const state = useSyncExternalStore(subscribeSavedCollection, getSavedCollectionSnapshot, getServerSavedCollectionSnapshot);
  const toast = useToast();
  const { dict } = useTranslation();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(NO_KEYS);
  const pending = useRef<PendingRemoval | null>(null);
  const owned = session !== null && state.session === session;
  const favorites = owned ? state.favorites : null;
  const items = useMemo(() => favorites
    ? buildSavedItems(favorites, locale, dict.saved.unnamedPerson).filter((item) => !hidden.has(item.key))
    : null, [favorites, locale, dict.saved.unnamedPerson, hidden]);
  const pendingKeys = useMemo(() => {
    if (!items) return NO_KEYS;
    return new Set(items.filter((item) => state.pendingIds.has(`${favoriteKind(item)}:${item.entityId}`)).map((item) => item.key));
  }, [items, state.pendingIds]);

  useEffect(() => {
    if (session !== null) void refreshSavedCollection("mount");
  }, [session]);

  const setKeyHidden = useCallback((key: string, value: boolean) => setHidden((previous) => {
    if (previous.has(key) === value) return previous;
    const next = new Set(previous);
    if (value) next.add(key); else next.delete(key);
    return next;
  }), []);

  // Send one delete. From here the shared store hides the row everywhere, so
  // the local key is released; a failure puts the row back with Retry.
  const commitRef = useRef<(item: SavedItem, owner: number) => void>(() => {});
  const commit = useCallback((item: SavedItem, owner: number) => {
    const kind = favoriteKind(item);
    const change = getAuthenticatedSessionId() === owner && getFavoriteIds(kind)?.has(item.entityId)
      ? beginFavoriteChange(kind, item.entityId, false)
      : null;
    setKeyHidden(item.key, false);
    if (!change) return;
    void REMOVE[kind](item.entityId).catch((cause: unknown) => {
      if (!change.isCurrent() || isBenignCustomerError(cause)) return;
      change.rollback();
      toast(
        customerErrorMessage(cause, dict.errors, dict.saved.removeError),
        "warn",
        { label: dict.errors.retry, onClick: () => commitRef.current(item, owner) },
        "error",
      );
    }).finally(change.finish);
  }, [setKeyHidden, toast, dict]);
  useEffect(() => { commitRef.current = commit; }, [commit]);

  const settle = useCallback(() => {
    const removal = pending.current;
    if (!removal) return;
    pending.current = null;
    clearTimeout(removal.timer);
    removal.toast.dismiss();
    commitRef.current(removal.item, removal.session);
  }, []);
  // Leaving Saved sends a pending delete instead of dropping it.
  useEffect(() => settle, [settle]);

  // Reports whether the row was hidden, so a view's exit animation can undo itself.
  const remove = useCallback((item: SavedItem): boolean => {
    if (session === null || getAuthenticatedSessionId() !== session) return false;
    if (pending.current?.item.key === item.key) return false;
    // One pending removal at a time: the previous one is sent now.
    settle();
    setKeyHidden(item.key, true);
    const undo = () => {
      const removal = pending.current;
      if (removal?.item.key !== item.key) return;
      pending.current = null;
      clearTimeout(removal.timer);
      setKeyHidden(item.key, false);
    };
    const handle = toast(
      format(dict.saved.removed, { name: item.title }),
      "heartO",
      { label: dict.saved.undo, onClick: undo },
      "default",
      { interrupt: true, hold: null },
    );
    pending.current = { item, session, toast: handle, timer: setTimeout(settle, ACTION_TOAST_HOLD_MS) };
    return true;
  }, [session, settle, setKeyHidden, toast, dict]);

  const retry = useCallback(() => {
    if (session !== null && getAuthenticatedSessionId() === session) void refreshSavedCollection("retry");
  }, [session]);

  return {
    items,
    loading: owned ? state.loading : true,
    error: owned && state.error,
    retrying: owned && state.retrying,
    refreshing: owned && state.refreshing,
    offline: owned && state.offline,
    pendingKeys,
    retry, remove,
  };
}
