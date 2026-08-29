"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { verifyEmail } from "@/lib/api/customer-auth";
import {
  isOfflineError,
  isServerError,
  isTimeoutError,
} from "@/lib/api/error-messages";
import { ResendVerification } from "../../_components/resend-verification";

// "invalid": the backend rejected the token itself (not found / already used
// / expired, or anything else it validated) — the dead-link copy is correct
// and a retry can never help. "transient": the request never reliably
// reached the backend at all (offline / client timeout / 5xx) — the token
// might still be perfectly good, so we offer a retry instead of telling the
// user their link is dead.
type State = "verifying" | "success" | "invalid" | "transient";

export function VerifyEmail({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const t = dict.verifyEmail;
  const e = dict.errors;
  const shared = dictionaries[locale].errors;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // A missing token is a render-time fact (no async needed), so derive the
  // initial state instead of calling setState in the effect.
  const [state, setState] = useState<State>(token ? "verifying" : "invalid");
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  // The backend marks the email verified and returns the user but does NOT
  // issue tokens, so there is no session to adopt here — on success we
  // instruct the user to sign in. Shared between the initial auto-run and the
  // transient-failure retry button.
  const runVerify = useCallback(async () => {
    if (!token) return;
    setState("verifying");
    try {
      await verifyEmail(token);
      if (mountedRef.current) setState("success");
    } catch (err) {
      if (!mountedRef.current) return;
      const transient =
        isOfflineError(err) || isTimeoutError(err) || isServerError(err);
      setState(transient ? "transient" : "invalid");
    }
  }, [token]);

  // Verify once on mount.
  useEffect(() => {
    mountedRef.current = true;
    if (token && !startedRef.current) {
      startedRef.current = true;
      void runVerify();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [token, runVerify]);

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

      {state === "invalid" && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.errorHeading}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{t.errorBody}</p>
          {/* A dead link is exactly when a replacement is needed, so the resend
              form is the primary action here — "back to login" only strands the
              user with the same unverified account. */}
          <ResendVerification />
          <Link
            href={loginHref}
            className="mt-6 inline-block text-sm font-medium text-zinc-600 underline underline-offset-2 transition hover:text-zinc-900"
          >
            {t.backToLogin}
          </Link>
        </div>
      )}

      {state === "transient" && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {e.linkCheckFailedHeading}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{e.linkCheckFailedBody}</p>
          <button
            type="button"
            onClick={() => void runVerify()}
            className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {shared.retry}
          </button>
        </div>
      )}
    </main>
  );
}
