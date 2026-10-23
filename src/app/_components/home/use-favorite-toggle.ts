"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { customerErrorMessage, isBenignCustomerError } from "@/lib/api/customer-error-messages";
import {
  addFavoriteLocation, addFavoriteProfessional,
  removeFavoriteLocation, removeFavoriteProfessional,
} from "@/lib/api/marketplace/customer";
import {
  beginFavoriteChange, ensureFavoriteIds, getFavoriteIds, getServerFavoriteIds,
  subscribeFavoriteIds, type FavoriteKind,
} from "@/lib/favorites/store";

export type { FavoriteKind } from "@/lib/favorites/store";
const ADD = { location: addFavoriteLocation, professional: addFavoriteProfessional };
const REMOVE = { location: removeFavoriteLocation, professional: removeFavoriteProfessional };

export interface FavoriteToggle {
  /** undefined is pending; null is unavailable; only a boolean is actionable. */
  isFavorited: (id: number) => boolean | null | undefined;
  toggle: (id: string | number) => void;
}

/** Shared session-owned IDs survive translation; view copy stays locale-specific.
 * Like the app, hearts show for everyone: signed out, a tap asks to sign in.
 */
export function useFavoriteToggle(kind: FavoriteKind): FavoriteToggle {
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();
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

  const isFavorited = useCallback((id: number) => {
    // Signed out, nothing is saved: the heart stays actionable and asks to sign
    // in. An unverifiable session is "unavailable", never a false "not saved".
    if (status === "unauthenticated") return false;
    if (status === "error") return null;
    return favorited == null ? favorited : favorited.has(id);
  }, [favorited, status]);
  const toggle = useCallback((rawId: string | number) => {
    const id = typeof rawId === "number" ? rawId : Number(rawId);
    if (!Number.isFinite(id)) return;
    if (status === "unauthenticated") {
      toast(dict.homeSections.favorites.savePrompt, "heart", {
        label: dict.common.signIn,
        onClick: () => openAuthModal("signin"),
      });
      return;
    }
    if (status !== "authenticated") return;
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
  }, [status, kind, toast, dict, openAuthModal]);

  return { isFavorited, toggle };
}
