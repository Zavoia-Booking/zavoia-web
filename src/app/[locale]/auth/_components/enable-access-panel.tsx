"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { useAuth } from "@/lib/auth/useAuth";
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
}: {
  locale: Locale;
  details: AccountLinkNeededDetails;
  onCancel: () => void;
}) {
  const dict = dictionaries[locale].auth;
  const t = dict.enableAccess;
  const { sendAccountLink } = useAuth();

  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  // The register-path 409 carries no name (nothing is verified there), so the
  // greeting falls back to the email the user typed.
  const fullName =
    `${details.firstName ?? ""} ${details.lastName ?? ""}`.trim();
  const greeting = t.greeting.replace("{name}", fullName || details.email);

  async function handleSendLink() {
    setSending(true);
    try {
      const message = await sendAccountLink(details.email, locale);
      setSentMessage(message || t.sentFallback);
    } catch {
      // Keep UX resilient (and enumeration-safe): show the neutral fallback.
      setSentMessage(t.sentFallback);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-4 text-sm text-zinc-800">{greeting}</p>
      <p className="mt-2 text-sm text-zinc-600">{t.explanation}</p>

      {sentMessage ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {sentMessage}
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
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline"
      >
        {t.cancel}
      </button>
    </div>
  );
}
