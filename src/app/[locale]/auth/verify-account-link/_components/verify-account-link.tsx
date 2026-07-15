"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { validateAccountLink } from "@/lib/api/customer-auth";
import { ApiError } from "@/lib/api/http";
import { defaultPostAuthTarget } from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import type { AccountLinkValidation } from "@/lib/auth/types";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { AuthField } from "../../_components/auth-field";
import { GoogleSignInButton } from "../../_components/google-signin-button";

type State =
  | { kind: "checking" }
  | { kind: "confirm"; info: AccountLinkValidation }
  | { kind: "success" }
  | { kind: "error" };

/**
 * Landing page of the account-link email. The emailed token alone must not
 * grant access: this page validates it (pre-flight, nothing consumed), then
 * asks the user to prove account ownership — password for password accounts,
 * "Continue with Google" for passwordless Google-only accounts. On success the
 * backend adds the CUSTOMER role and issues tokens, so the user ends up
 * signed in.
 */
export function VerifyAccountLink({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const t = dict.verifyLink;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { completeAccountLink } = useAuth();

  // A missing token is a render-time fact (no async needed), so derive the
  // initial state instead of calling setState in the effect.
  const [state, setState] = useState<State>(
    token ? { kind: "checking" } : { kind: "error" },
  );
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);

  // Validate the token once on mount WITHOUT consuming it, to learn how the
  // user can confirm account ownership.
  useEffect(() => {
    if (!token) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const info = await validateAccountLink(token);
        if (!cancelled) setState({ kind: "confirm", info });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || state.kind !== "confirm") return;
    if (!password) {
      setPasswordError(t.passwordRequired);
      return;
    }
    setPasswordError(null);
    setSubmitting(true);
    try {
      await completeAccountLink(token, password);
      setState({ kind: "success" });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // Wrong password — keep the form so the user can retry.
        setPasswordError(t.wrongPassword);
      } else if (e instanceof ApiError && e.code === "google_login_required") {
        // Passwordless (Google-only) account — only Google can confirm it.
        setState({
          kind: "confirm",
          info: { ...state.info, hasPassword: false, googleLinked: true },
        });
      } else {
        // Token consumed/expired or anything unexpected — dead end.
        setState({ kind: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Google path: full-page redirect through /auth/callback. The backend
  // instant-links business accounts whose Google identity is already bound
  // (sub match) and signs them in; the emailed token stays unused. Any
  // collision or failure is handled by the callback page's panels.

  const loginHref = `${localeHref(locale, "auth")}?mode=login`;

  if (state.kind === "checking") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <p role="status" className="text-sm text-zinc-600">
          {t.verifying}
        </p>
      </main>
    );
  }

  if (state.kind === "success") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.successHeading}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">{t.successBody}</p>
        <Link
          href={defaultPostAuthTarget(locale)}
          className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          {t.continueCta}
        </Link>
      </main>
    );
  }

  if (state.kind === "error") {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
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
      </main>
    );
  }

  const { info } = state;
  const body = info.hasPassword ? t.confirmBody : t.googleOnlyBody;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t.confirmHeading}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        {body.replace("{email}", info.email)}
      </p>

      {info.hasPassword ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <AuthField
            id="password"
            type="password"
            label={t.passwordLabel}
            value={password}
            onChange={setPassword}
            error={passwordError ?? undefined}
            autoComplete="current-password"
            showPasswordLabel={dict.fields.showPassword}
            hidePasswordLabel={dict.fields.hidePassword}
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t.confirming : t.confirm}
          </button>

          {GOOGLE_CLIENT_ID && info.googleLinked && (
            <div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs text-zinc-500">{t.orDivider}</span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>
              <div className="mt-4">
                <GoogleSignInButton intent="login" locale={locale} />
              </div>
            </div>
          )}
        </form>
      ) : (
        <div className="mt-8">
          <GoogleSignInButton intent="login" locale={locale} />
        </div>
      )}
    </main>
  );
}
