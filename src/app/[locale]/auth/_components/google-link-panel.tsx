"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { reauthForGoogleLink } from "@/lib/api/customer-auth";
import { ApiError } from "@/lib/api/http";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { AuthField } from "./auth-field";

export type GoogleLinkContext = {
  txId: string;
  /** Decoded from the Google ID token; may be empty if decode failed. */
  email: string;
};

/**
 * Shown after POST /marketplace/auth/google returns 409
 * `account_exists_unlinked_google`: an account with this email exists but has no
 * linked Google. The user proves ownership with their password
 * (POST /link/google/re-auth -> proof), then we complete linking
 * (POST /link/google) which auto-logs-in via linkGoogleAccount.
 */
export function GoogleLinkPanel({
  locale,
  context,
  onCancel,
  redirect,
}: {
  locale: Locale;
  context: GoogleLinkContext;
  onCancel: () => void;
  /** Post-auth target carried by the caller (e.g. the OAuth flow context on
   *  /auth/callback, where the URL has no ?redirect param of its own). */
  redirect?: string | null;
}) {
  const dict = dictionaries[locale].auth;
  const t = dict.googleLink;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, linkGoogleAccount } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once linkGoogleAccount establishes the session, redirect like the forms.
  useEffect(() => {
    if (status === "authenticated") {
      const target = safeRedirectTarget(
        redirect ?? searchParams.get("redirect"),
        locale,
        defaultPostAuthTarget(locale),
      );
      router.replace(target);
    }
  }, [status, locale, router, searchParams, redirect]);

  const explanation = context.email
    ? t.explanation.replace("{email}", context.email)
    : t.explanationNoEmail;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) {
      setError(dict.errors.passwordRequired);
      return;
    }
    if (!context.email) {
      // Without the email we cannot run re-auth; ask the user to retry.
      setError(t.error);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { proof } = await reauthForGoogleLink(context.email, password);
      await linkGoogleAccount(context.txId, proof);
      // Redirect handled by the effect once status flips to authenticated.
    } catch (e) {
      // Map known backend codes to friendly text; for anything else keep the
      // panel-specific fallback (a linking failure is usually a wrong password).
      const message =
        e instanceof ApiError ? authErrorMessage(e, dict.errors) : t.error;
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-4 text-sm text-zinc-600">{explanation}</p>

      {context.email && (
        <div className="mt-6">
          <span className="block text-sm font-medium text-zinc-800">
            {dict.fields.email}
          </span>
          <p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {context.email}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <AuthField
          id="google-link-password"
          type="password"
          label={dict.fields.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      <button
        type="button"
        onClick={onCancel}
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline"
      >
        {t.cancel}
      </button>
    </div>
  );
}
