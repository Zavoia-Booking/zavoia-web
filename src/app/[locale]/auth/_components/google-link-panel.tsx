"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { reauthForGoogleLink } from "@/lib/api/customer-auth";
import { ApiError } from "@/lib/api/http";
import {
  authRedirectTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
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
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.googleLink;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, linkGoogleAccount } = useAuth();

  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState<"password" | "email" | null>(null);
  const action = useRetainedAuthAction(`google-link:${context.txId}`);
  const submitting = action.status === "pending" || action.status === "success";
  const error = validation === "password"
    ? dict.errors.passwordRequired
    : validation === "email"
      ? t.error
      : action.status === "error"
        ? action.error instanceof ApiError
          ? authErrorMessage(action.error, dict.errors, dictionary.errors)
          : t.error
        : null;

  // Once linkGoogleAccount establishes the session, redirect like the forms.
  useEffect(() => {
    if (status === "authenticated") {
      const target = safeRedirectTarget(
        redirect ?? null,
        locale,
        authRedirectTarget(searchParams, locale),
      );
      router.replace(target);
    }
  }, [status, locale, router, searchParams, redirect]);

  const explanation = context.email
    ? t.explanation.replace("{email}", context.email)
    : t.explanationNoEmail;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!password) {
      setValidation("password");
      return;
    }
    if (!context.email) {
      setValidation("email");
      return;
    }
    setValidation(null);
    void action.run(async () => {
      const { proof } = await reauthForGoogleLink(context.email, password);
      await linkGoogleAccount(context.txId, proof);
      // Password/proof live only in this request, never in retained flow data.
    }).catch(() => {});
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
          showPasswordLabel={dict.fields.showPassword}
          hidePasswordLabel={dict.fields.hidePassword}
        />

        {error && (
          <p
            role="alert"
            className="rounded-md border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2 text-sm text-[var(--s-error-600)]"
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
