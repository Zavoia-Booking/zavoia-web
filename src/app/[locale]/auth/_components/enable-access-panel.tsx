"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useId } from "react";
import type { Locale } from "@/i18n/locales";
import { errorMessage } from "@/lib/api/error-messages";
import { useAuth } from "@/lib/auth/useAuth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
import { InlineError } from "@/components/ui/inline-error";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";

/**
 * Shown when login/register/Google hits the 409
 * `account_exists_needs_marketplace_access`. Access is enabled ONLY through
 * the emailed link (which then asks for the account password), so the sole
 * action here is requesting that email — there is deliberately no instant
 * "enable access" path.
 */
export function EnableAccessPanel({
  locale,
  details,
  onCancel,
  flowKey,
}: {
  locale: Locale;
  details: AccountLinkNeededDetails;
  onCancel: () => void;
  /** Callback identity keeps a sent email/pending request across locale changes. */
  flowKey?: string;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.enableAccess;
  const { sendAccountLink } = useAuth();

  const instance = useId();
  const action = useRetainedAuthAction(
    JSON.stringify(["enable-access", flowKey ?? instance, details.email]),
  );
  const sending = action.status === "pending";
  const sent = action.status === "success";

  // The register-path 409 carries no name (nothing is verified there), so the
  // greeting falls back to the email the user typed.
  const fullName =
    `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim();
  const greeting = t.greeting.replace("{name}", fullName || details.email);

  function handleSendLink() {
    void action.run(async () => {
      // The API returns a neutral success for unknown/existing accounts. A
      // rejected request is a real failure and must remain retryable.
      await sendAccountLink(details.email, locale);
    }).catch(() => {}); // The retained action exposes the failure below.
  }

  return (
    <div aria-busy={sending}>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-4 text-sm text-zinc-800">{greeting}</p>
      <p className="mt-2 text-sm text-zinc-600">{t.explanation}</p>

      {action.status === "error" && (
        <InlineError className="mt-4">
          {errorMessage(action.error, dictionary.errors, t.error)}
        </InlineError>
      )}

      {sent ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {t.sentFallback}
        </p>
      ) : (
        <button
          type="button"
          onClick={handleSendLink}
          disabled={sending}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? t.sending : t.sendLink}
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={sending}
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.cancel}
      </button>
    </div>
  );
}
