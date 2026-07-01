"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { CSRF_COOKIE_NAME, readCookie } from "@/lib/auth/cookies";
import { useAuth } from "@/lib/auth/useAuth";

type Props = {
  locale: Locale;
};

export function AuthNav({ locale }: Props) {
  const { status, user } = useAuth();
  const dict = dictionaries[locale].header;
  // Client-side hint to render the right placeholder shape during hydration,
  // avoiding the "Authentication" → "Hi Andrei" jump for logged-in users.
  const [hasSessionHint, setHasSessionHint] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasSessionHint(Boolean(readCookie(CSRF_COOKIE_NAME)));
  }, []);

  if (status === "authenticated") {
    return (
      <Link
        href={localeHref(locale, "account")}
        aria-label={dict.accountAriaLabel}
        className="font-medium text-zinc-900 hover:underline"
      >
        {user?.firstName ? user.firstName : dict.account}
      </Link>
    );
  }

  if (status === "unauthenticated" || status === "error") {
    return (
      <Link
        href={`${localeHref(locale, "auth")}?mode=login`}
        className="rounded-md border border-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-900 hover:text-white"
      >
        {dict.authentication}
      </Link>
    );
  }

  // idle | loading — render shape of expected outcome to avoid layout flicker.
  if (hasSessionHint) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-5 w-20 animate-pulse rounded bg-zinc-100"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="inline-block h-8 w-28 animate-pulse rounded bg-zinc-100"
    />
  );
}
