"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { localizedPathname } from "@/i18n/routes";
import { useLocaleAlternates } from "@/i18n/locale-navigation";
import { authEntryHref, safeRedirectTarget } from "@/lib/auth/redirects";

// ─────────────────────────────────────────────
// Auth-entry context — any client component (the header account menu, the
// booking drawer's sign-in gate, the account-page gate, …) can send a
// signed-out user to the dedicated /auth route. There is no in-app sign-in
// modal anymore; authentication happens on the /auth page (login/register
// tabs). The current path is forwarded as ?redirect= so the user returns here
// after signing in.
//
// useAuthModal() returns a safe no-op API when no provider is mounted, so call
// sites never throw in isolation. (Name kept for call-site compatibility.)
// ─────────────────────────────────────────────

export type AuthMode = "signin" | "signup";

export interface AuthModalApi {
  openAuthModal: (mode?: AuthMode, returnTo?: string) => void;
}

const NOOP: AuthModalApi = {
  openAuthModal: () => {},
};

const AuthModalContext = createContext<AuthModalApi | null>(null);

/** Access the auth-entry API. Safe to call outside a provider (returns no-ops). */
export function useAuthModal(): AuthModalApi {
  return useContext(AuthModalContext) ?? NOOP;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useTranslation();
  const alternates = useLocaleAlternates(pathname ?? "/");

  const openAuthModal = useCallback(
    (m: AuthMode = "signin", returnTo?: string) => {
      const mode = m === "signup" ? "register" : "login";
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const target = safeRedirectTarget(returnTo ?? null, locale, current);
      const targetUrl = new URL(target, window.location.origin);
      // Only attach the active page's authoritative map when returning to it.
      // An explicit returnTo may instead point at an account or appointment.
      const returnsHere = localizedPathname(targetUrl.pathname, locale) === localizedPathname(window.location.pathname, locale);
      router.push(authEntryHref(locale, mode, target, returnsHere ? alternates : undefined));
    },
    [router, locale, alternates],
  );

  const api = useMemo<AuthModalApi>(() => ({ openAuthModal }), [openAuthModal]);

  return (
    <AuthModalContext.Provider value={api}>
      {children}
    </AuthModalContext.Provider>
  );
}
