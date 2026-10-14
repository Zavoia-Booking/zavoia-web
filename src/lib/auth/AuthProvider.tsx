"use client";

import { createContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { AuthContextValue } from "@/lib/auth/types";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  sessionActions,
  startSession,
  subscribeSession,
  subscribeSessionExpired,
} from "@/lib/auth/session-store";

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Mounted inside the locale/toast providers; session lifetime is independent. */
export function SessionExpiredToast({ locale }: { locale: Locale }) {
  const toast = useToast();
  const router = useRouter();
  const {
    dict: { errors: dict },
  } = useTranslation();

  useEffect(
    () =>
      subscribeSessionExpired(() => {
        toast(
          dict.sessionExpired,
          "lock",
          {
            label: dict.signIn,
            onClick: () =>
              router.push(`${localeHref(locale, "auth")}?mode=login`),
          },
          "error",
        );
      }),
    [dict, locale, toast, router],
  );

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  // Strict Mode and locale remounts share one browser bootstrap. A full
  // document load still verifies the HttpOnly-cookie session with the server.
  useEffect(startSession, []);
  const value = useMemo<AuthContextValue>(
    () => ({ ...snapshot, ...sessionActions }),
    [snapshot],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
