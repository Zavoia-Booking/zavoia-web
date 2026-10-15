"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { verifyEmail } from "@/lib/api/customer-auth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
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
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.verifyEmail;
  const e = dict.errors;
  const shared = dictionary.errors;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { status, error, run } = useRetainedAuthAction(`verify-email:${token ?? ""}`);
  const state: State = !token
    ? "invalid"
    : status === "success"
      ? "success"
      : status === "error"
        ? isOfflineError(error) || isTimeoutError(error) || isServerError(error)
          ? "transient"
          : "invalid"
        : "verifying";

  // Verification consumes the token, without establishing a session. Reuse its
  // pending/settled outcome on locale changes; a new URL token is a new action.
  useEffect(() => {
    if (token && status === "idle") {
      void run(async () => { await verifyEmail(token); }).catch(() => {});
    }
  }, [token, status, run]);

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
            onClick={() => {
              if (token) void run(async () => { await verifyEmail(token); }).catch(() => {});
            }}
            className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {shared.retry}
          </button>
        </div>
      )}
    </main>
  );
}
