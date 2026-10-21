"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Locale } from "@/i18n/locales";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
import { InlineError } from "@/components/ui/inline-error";

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
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.confirmAccess;
  const router = useRouter();
  const { status, confirmMarketplaceAccess } = useAuth();

  const action = useRetainedAuthAction(`confirm-access:${context.txId}`);
  const submitting = action.status === "pending" || action.status === "success";

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

  function handleConfirm() {
    void action.run(async () => {
      await confirmMarketplaceAccess(context.txId, locale);
      // Redirect follows the session in the currently mounted locale.
    }).catch(() => {});
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

      {action.status === "error" && (
        <InlineError
          className="mt-4 rounded-md border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2"
        >
          {t.error}
        </InlineError>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        aria-label={t.confirm}
        aria-busy={submitting}
        className="relative mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={submitting ? "invisible" : undefined} aria-hidden={submitting || undefined}>
          {t.confirm}
        </span>
        {submitting && (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <Spinner size={16} color="currentColor" />
          </span>
        )}
      </button>
      <span role="status" className="sr-only">
        {submitting ? t.confirming : ""}
      </span>

      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.cancel}
      </button>
    </div>
  );
}
