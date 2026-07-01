"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import {
  addFavoriteBusiness,
  addFavoriteLocation,
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
  /** Whether the given (numeric) id is currently favorited. */
  isFavorited: (id: number) => boolean;
  /** Optimistic toggle wired to the card's `onFavorite(id)` callback. */
  toggle: (id: string | number) => void;
}

/**
 * Auth-aware favorite toggling for a home section.
 *
 * Authenticated: optimistic Set update + the correct endpoint by `kind`; toast
 * on success, revert + nothing-loud on failure. Unauthenticated: a "Sign in to
 * save" toast and no state change.
 *
 * TODO(later slice): wire the header auth modal here so an unauthenticated tap
 * opens sign-in instead of only toasting.
 */
export function useFavoriteToggle(kind: FavoriteKind): FavoriteToggle {
  const { status } = useAuth();
  const toast = useToast();
  const { dict } = useTranslation();
  const [favorited, setFavorited] = useState<Set<number>>(new Set());

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

  return { isFavorited, toggle };
}
