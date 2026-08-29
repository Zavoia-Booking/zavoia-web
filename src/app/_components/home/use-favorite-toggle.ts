"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import {
  customerErrorMessage,
  isBenignCustomerError,
} from "@/lib/api/customer-error-messages";
import {
  addFavoriteBusiness,
  addFavoriteLocation,
  addFavoriteProfessional,
  getFavoriteBusinesses,
  getFavoriteLocations,
  getFavoriteProfessionals,
  removeFavoriteBusiness,
  removeFavoriteLocation,
  removeFavoriteProfessional,
} from "@/lib/api/marketplace/customer";

/**
 * Which entity kind a card's id refers to. This decides WHICH favorite
 * endpoint is called:
 *  - "business"     → business-sourced cards (latest listings) → favorite/business/:id
 *  - "location"     → location-sourced cards (near-you, recently-viewed) → favorite/location/:id
 *  - "professional" → team-member profiles → favorite/professional/:id
 */
export type FavoriteKind = "business" | "location" | "professional";

const FETCH_IDS: Record<FavoriteKind, () => Promise<number[]>> = {
  business: () =>
    getFavoriteBusinesses().then((rows) => rows.map((r) => r.business.id)),
  location: () =>
    getFavoriteLocations().then((rows) => rows.map((r) => r.location.id)),
  professional: () =>
    getFavoriteProfessionals().then((rows) =>
      rows.map((r) => r.professional.id),
    ),
};

const ADD: Record<FavoriteKind, (id: number) => Promise<unknown>> = {
  business: addFavoriteBusiness,
  location: addFavoriteLocation,
  professional: addFavoriteProfessional,
};

const REMOVE: Record<FavoriteKind, (id: number) => Promise<unknown>> = {
  business: removeFavoriteBusiness,
  location: removeFavoriteLocation,
  professional: removeFavoriteProfessional,
};

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
    FETCH_IDS[kind]()
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

  // Ids with an add/remove mutation in flight — guards against a rapid
  // double-click firing two mutations against the same entity. The
  // optimistic update + rollback below is unchanged; this only gates
  // re-entrancy.
  const inFlightRef = useRef<Set<number>>(new Set());

  const toggle = useCallback(
    (rawId: string | number) => {
      const id = typeof rawId === "number" ? rawId : Number(rawId);
      if (!Number.isFinite(id)) return;

      if (status !== "authenticated") {
        toast(dict.homeSections.favorites.savePrompt, "heart");
        return;
      }

      if (inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);

      const wasFavorited = favorited.has(id);
      // Optimistic update.
      setFavorited((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(id);
        else next.add(id);
        return next;
      });

      const action = wasFavorited ? REMOVE[kind] : ADD[kind];

      action(id)
        .then(() => {
          toast(
            wasFavorited
              ? dict.homeSections.favorites.removed
              : dict.homeSections.favorites.saved,
            "heart",
          );
        })
        .catch((e) => {
          // "Already a favorite" / "favorite not found" mean the optimistic
          // update already left the set in the state the user wanted — stay
          // quiet rather than roll back a change that was actually correct.
          if (isBenignCustomerError(e)) return;
          // Revert on failure.
          setFavorited((prev) => {
            const next = new Set(prev);
            if (wasFavorited) next.add(id);
            else next.delete(id);
            return next;
          });
          toast(customerErrorMessage(e, dict.errors), "warn", undefined, "error");
        })
        .finally(() => {
          inFlightRef.current.delete(id);
        });
    },
    [status, favorited, kind, toast, dict],
  );

  return { canFavorite: status === "authenticated", isFavorited, toggle };
}
