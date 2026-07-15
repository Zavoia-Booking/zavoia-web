"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import {
  addFavoriteBusiness,
  addFavoriteLocation,
  getFavoriteBusinesses,
  getFavoriteLocations,
  removeFavoriteBusiness,
  removeFavoriteLocation,
} from "@/lib/api/marketplace/customer";

/**
 * Which entity kind a card's id refers to. This decides WHICH favorite
 * endpoint is called:
 *  - "business"  → business-sourced cards (latest listings) → favorite/business/:id
 *  - "location"  → location-sourced cards (near-you, recently-viewed) → favorite/location/:id
 */
export type FavoriteKind = "business" | "location";

export interface FavoriteToggle {
  /**
   * True once the visitor is an authenticated customer. Hearts are hidden for
   * signed-out visitors — pass `onFavorite` to a card only when this is true.
   */
  canFavorite: boolean;
  /** Whether the given (numeric) id is currently favorited. */
  isFavorited: (id: number) => boolean;
  /** Optimistic toggle wired to the card's `onFavorite(id)` callback. */
  toggle: (id: string | number) => void;
}

/**
 * Auth-aware favorite toggling for a home section.
 *
 * Authenticated: the set is seeded from the customer's existing favorites
 * (`kind` picks the endpoint family), then optimistic Set updates + the
 * correct endpoint per toggle; toast on success, revert + generic toast on
 * failure. Unauthenticated: `canFavorite` is false and callers hide the heart
 * (the toast branch below is a safety net for stray calls).
 */
export function useFavoriteToggle(kind: FavoriteKind): FavoriteToggle {
  const { status } = useAuth();
  const toast = useToast();
  const { dict } = useTranslation();
  const [favorited, setFavorited] = useState<Set<number>>(new Set());

  // Seed from the API so already-saved items render active and toggling them
  // removes instead of re-adding. Merged into (not replacing) the current set
  // so an optimistic add made while the seed is in flight survives.
  useEffect(() => {
    let cancelled = false;
    if (status !== "authenticated") {
      // Signed out (or logged out mid-session) → drop any stale hearts.
      // Deferred to a microtask (same pattern as NearYouSection) so the
      // effect body has no synchronous setState.
      Promise.resolve().then(() => {
        if (!cancelled) {
          setFavorited((prev) => (prev.size ? new Set<number>() : prev));
        }
      });
      return () => {
        cancelled = true;
      };
    }
    const fetchIds =
      kind === "business"
        ? () => getFavoriteBusinesses().then((rows) => rows.map((r) => r.business.id))
        : () => getFavoriteLocations().then((rows) => rows.map((r) => r.location.id));
    fetchIds()
      .then((ids) => {
        if (cancelled || ids.length === 0) return;
        setFavorited((prev) => new Set([...prev, ...ids]));
      })
      .catch(() => {
        // Seeding is best-effort; toggling still works from an empty set.
      });
    return () => {
      cancelled = true;
    };
  }, [status, kind]);

  const isFavorited = useCallback(
    (id: number) => favorited.has(id),
    [favorited],
  );

  const toggle = useCallback(
    (rawId: string | number) => {
      const id = typeof rawId === "number" ? rawId : Number(rawId);
      if (!Number.isFinite(id)) return;

      if (status !== "authenticated") {
        toast(dict.homeSections.favorites.savePrompt, "heart");
        return;
      }

      const wasFavorited = favorited.has(id);
      // Optimistic update.
      setFavorited((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(id);
        else next.add(id);
        return next;
      });

      const add = kind === "business" ? addFavoriteBusiness : addFavoriteLocation;
      const remove =
        kind === "business" ? removeFavoriteBusiness : removeFavoriteLocation;
      const action = wasFavorited ? remove : add;

      action(id)
        .then(() => {
          toast(
            wasFavorited
              ? dict.homeSections.favorites.removed
              : dict.homeSections.favorites.saved,
            "heart",
          );
        })
        .catch(() => {
          // Revert on failure.
          setFavorited((prev) => {
            const next = new Set(prev);
            if (wasFavorited) next.add(id);
            else next.delete(id);
            return next;
          });
          toast(dict.auth.errors.generic, "warn");
        });
    },
    [status, favorited, kind, toast, dict],
  );

  return { canFavorite: status === "authenticated", isFavorited, toggle };
}
