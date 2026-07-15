"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";

export type ConfirmAccessContext = {
  /** Single-use tx (10 min TTL) from the 409, consumed by confirm-access. */
  txId: string;
  email: string;
  firstName?: string;
};

/**
 * Shown after POST /marketplace/auth/google/web returns 409
 * `account_exists_needs_marketplace_access` with suggestedNext
 * `confirm_enable_marketplace`: the Google sign-in matched a business
 * account's LINKED Google identity, so ownership is already proven — no
 * password or emailed link needed. But adding marketplace access to that
 * account must be the user's explicit choice, so nothing happens until they
 * click confirm (which completes via POST /google/web/confirm-access and
 * auto-logs-in).
 */
export function ConfirmAccessPanel({
  locale,
  context,
  redirect,
  onCancel,
}: {
  locale: Locale;
  context: ConfirmAccessContext;
  onCancel: () => void;
  /** Post-auth target carried by the OAuth flow context on /auth/callback. */
  redirect?: string | null;
}) {
  const dict = dictionaries[locale].auth;
  const t = dict.confirmAccess;
  const router = useRouter();
  const { status, confirmMarketplaceAccess } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Once confirmMarketplaceAccess establishes the session, redirect like the
  // sign-in forms.
  useEffect(() => {
    if (status === "authenticated") {
      const target = safeRedirectTarget(
        redirect ?? null,
        locale,
        defaultPostAuthTarget(locale),
      );
      router.replace(target);
    }
  }, [status, locale, router, redirect]);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await confirmMarketplaceAccess(context.txId);
      // Redirect handled by the effect once status flips to authenticated.
    } catch {
      // The tx is single-use with a short TTL, so the actionable advice is
      // always the same: run the Google sign-in again.
      setError(t.error);
      setSubmitting(false);
    }
  }

  const greeting = context.firstName
    ? t.greeting.replace("{name}", context.firstName)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      {greeting && <p className="mt-4 text-sm text-zinc-600">{greeting}</p>}
      <p className={`${greeting ? "mt-2" : "mt-4"} text-sm text-zinc-600`}>
        {t.explanation.replace("{email}", context.email)}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t.confirming : t.confirm}
      </button>

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
