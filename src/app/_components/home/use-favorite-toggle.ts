"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { customerErrorMessage, isBenignCustomerError } from "@/lib/api/customer-error-messages";
import {
  addFavoriteBusiness, addFavoriteLocation, addFavoriteProfessional,
  removeFavoriteBusiness, removeFavoriteLocation, removeFavoriteProfessional,
} from "@/lib/api/marketplace/customer";
import {
  beginFavoriteChange, ensureFavoriteIds, getFavoriteIds, getServerFavoriteIds,
  subscribeFavoriteIds, type FavoriteKind,
} from "@/lib/favorites/store";

export type { FavoriteKind } from "@/lib/favorites/store";
const ADD = { business: addFavoriteBusiness, location: addFavoriteLocation, professional: addFavoriteProfessional };
const REMOVE = { business: removeFavoriteBusiness, location: removeFavoriteLocation, professional: removeFavoriteProfessional };

export interface FavoriteToggle {
  canFavorite: boolean;
  isFavorited: (id: number) => boolean;
  toggle: (id: string | number) => void;
}

/** Shared session-owned IDs survive translation; view copy stays locale-specific. */
export function useFavoriteToggle(kind: FavoriteKind): FavoriteToggle {
  const { status } = useAuth();
  const toast = useToast();
  const { dict } = useTranslation();
  const mounted = useRef(false);
  const subscribe = useCallback((listener: () => void) => subscribeFavoriteIds(kind, listener), [kind]);
  const snapshot = useCallback(() => getFavoriteIds(kind), [kind]);
  const favorited = useSyncExternalStore(subscribe, snapshot, getServerFavoriteIds);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (status !== "authenticated") return;
    const refresh = () => {
      if (document.visibilityState === "visible") void ensureFavoriteIds(kind);
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [kind, status]);

  const isFavorited = useCallback((id: number) => favorited.has(id), [favorited]);
  const toggle = useCallback((rawId: string | number) => {
    const id = typeof rawId === "number" ? rawId : Number(rawId);
    if (!Number.isFinite(id)) return;
    if (status !== "authenticated") {
      toast(dict.homeSections.favorites.savePrompt, "heart");
      return;
    }
    const change = beginFavoriteChange(kind, id);
    if (!change) return;
    const action = change.previous ? REMOVE[kind] : ADD[kind];
    void action(id).then(() => {
      if (!mounted.current || !change.isCurrent()) return;
      toast(change.previous ? dict.homeSections.favorites.removed : dict.homeSections.favorites.saved, "heart");
    }).catch((error: unknown) => {
      if (!change.isCurrent() || isBenignCustomerError(error)) return;
      change.rollback();
      if (mounted.current) toast(customerErrorMessage(error, dict.errors), "warn", undefined, "error");
    }).finally(change.finish);
  }, [status, kind, toast, dict]);

  return { canFavorite: status === "authenticated", isFavorited, toggle };
}
