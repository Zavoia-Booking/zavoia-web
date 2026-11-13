"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { useAuthMessages } from "../../../_components/auth-messages";
import { AuthCard } from "../../../_components/auth-card";
import { AuthShell } from "../../../_components/auth-shell";

/** "You can close this window" for a Sign in with Apple popup that stayed open. */
export function AppleCallback({ locale }: { locale: Locale }) {
  const dict = useAuthMessages().auth;
  const t = dict.appleCallback;

  useEffect(() => {
    // Browsers only let a script close a window that a script opened, which
    // is exactly the popup case (even when Apple severed `window.opener`).
    // Otherwise this is a no-op and the copy stays.
    window.close();
  }, []);

  return (
    <AuthShell>
      <AuthCard
        mode="login"
        loginHref={`${localeHref(locale, "auth")}?mode=login`}
        registerHref={`${localeHref(locale, "auth")}?mode=register`}
        tabLoginLabel={dict.tabLogin}
        tabRegisterLabel={dict.tabRegister}
        tablistLabel={dict.pageTitle}
        hideHeader
        compact
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
          <p className="mt-4 text-sm text-zinc-600">{t.body}</p>
          <Link
            href={localeHref(locale)}
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t.continueCta}
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
