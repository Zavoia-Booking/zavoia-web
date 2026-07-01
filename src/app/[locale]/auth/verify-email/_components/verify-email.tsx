"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { verifyEmail } from "@/lib/api/customer-auth";

type State = "verifying" | "success" | "error";

export function VerifyEmail({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].auth.verifyEmail;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // A missing token is a render-time fact (no async needed), so derive the
  // initial state instead of calling setState in the effect.
  const [state, setState] = useState<State>(token ? "verifying" : "error");
  const startedRef = useRef(false);

  // Verify once on mount. The backend marks the email verified and returns the
  // user but does NOT issue tokens, so there is no session to adopt here — on
  // success we instruct the user to sign in.
  useEffect(() => {
    if (!token) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        await verifyEmail(token);
        if (!cancelled) setState("success");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loginHref = `${localeHref(locale, "auth")}?mode=login`;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      {state === "verifying" && (
        <p role="status" className="text-sm text-zinc-600">
          {t.verifying}
        </p>
      )}

      {state === "success" && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.successHeading}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{t.successBody}</p>
          <Link
            href={loginHref}
            className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {t.goToLogin}
          </Link>
        </div>
      )}

      {state === "error" && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.errorHeading}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{t.errorBody}</p>
          <Link
            href={loginHref}
            className="mt-6 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            {t.backToLogin}
          </Link>
        </div>
      )}
    </main>
  );
}
