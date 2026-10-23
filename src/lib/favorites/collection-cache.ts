"use client";

import { ApiError } from "@/lib/api/http";
import { getFavorites } from "@/lib/api/marketplace/customer";
import { getAuthenticatedSessionId, subscribeSession } from "@/lib/auth/session-store";
import { createFavoritesCollection, EMPTY_COLLECTION } from "./collection";
import {
  getFavoriteIds, getFavoriteRevision, getPendingFavoriteIds, seedFavoriteIds,
  subscribeFavoriteChanges, subscribeFavoriteSnapshots,
} from "./store";

let cache: ReturnType<typeof createFavoritesCollection> | undefined;

/** Construct only in the browser; private records never enter an SSR singleton. */
function collection() {
  if (typeof window === "undefined") throw new Error("Saved cache accessed on the server");
  if (!cache) {
    cache = createFavoritesCollection({
      getSession: getAuthenticatedSessionId,
      subscribeSession,
      isOffline: () => navigator.onLine === false,
      fetch: getFavorites,
      getIds: getFavoriteIds,
      getPendingIds: getPendingFavoriteIds,
      getRevision: getFavoriteRevision,
      seedIds: seedFavoriteIds,
      subscribeChanges: subscribeFavoriteChanges,
      subscribeSnapshots: subscribeFavoriteSnapshots,
      // Network failures and server errors can recover; a refusal (4xx) cannot.
      shouldRetry: (error) => !(error instanceof ApiError) || error.status === 0 || error.status >= 500,
    });
    const focus = () => { if (document.visibilityState !== "hidden") cache?.focus(); };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    window.addEventListener("online", () => cache?.connectivityChanged());
    window.addEventListener("offline", () => cache?.connectivityChanged());
  }
  return cache;
}

export const getSavedCollectionSnapshot = () => collection().getSnapshot();
export const getServerSavedCollectionSnapshot = () => EMPTY_COLLECTION;
export const subscribeSavedCollection = (listener: () => void) => collection().subscribe(listener);
export const refreshSavedCollection = (reason: "mount" | "manual" | "retry" = "manual") => collection().refresh(reason);
