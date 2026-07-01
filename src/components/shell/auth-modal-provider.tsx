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
import { localeHref } from "@/i18n/routes";

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
  openAuthModal: (mode?: AuthMode) => void;
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

  const openAuthModal = useCallback(
    (m: AuthMode = "signin") => {
      const mode = m === "signup" ? "register" : "login";
      const base = localeHref(locale, "auth");
      const redirect =
        pathname && pathname !== "/"
          ? `&redirect=${encodeURIComponent(pathname)}`
          : "";
      router.push(`${base}?mode=${mode}${redirect}`);
    },
    [router, pathname, locale],
  );

  const api = useMemo<AuthModalApi>(() => ({ openAuthModal }), [openAuthModal]);

  return (
    <AuthModalContext.Provider value={api}>
      {children}
    </AuthModalContext.Provider>
  );
}
