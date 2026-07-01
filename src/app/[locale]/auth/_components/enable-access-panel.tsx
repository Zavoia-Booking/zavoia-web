"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { useAuth } from "@/lib/auth/useAuth";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, confirmAccountLink, sendAccountLink } = useAuth();

  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  // After confirmAccountLink establishes the session, redirect like the forms.
  useEffect(() => {
    if (status === "authenticated") {
      const target = safeRedirectTarget(
        searchParams.get("redirect"),
        locale,
        defaultPostAuthTarget(locale),
      );
      router.replace(target);
    }
  }, [status, locale, router, searchParams]);

  const fullName = `${details.firstName} ${details.lastName}`.trim();
  const greeting = t.greeting.replace("{name}", fullName || details.email);

  async function handleConfirm() {
    setError(null);
    setSentMessage(null);
    setConfirming(true);
    try {
      await confirmAccountLink(details.confirmationToken);
      // Redirect handled by the effect once status flips to authenticated.
    } catch {
      // confirmationToken missing/expired (ApiError) — show the email fallback.
      setError(t.error);
      setConfirming(false);
    }
  }

  async function handleSendLink() {
    setError(null);
    setSending(true);
    try {
      const message = await sendAccountLink(details.email, locale);
      setSentMessage(message || t.sentFallback);
    } catch {
      // Keep UX resilient: show the neutral fallback message.
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

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {sentMessage && (
        <p
          role="status"
          className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {sentMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirming}
        className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {confirming ? t.confirming : t.confirm}
      </button>

      <div className="mt-6 border-t border-zinc-200 pt-6">
        <p className="text-sm text-zinc-600">{t.sendLinkPrompt}</p>
        <button
          type="button"
          onClick={handleSendLink}
          disabled={sending}
          className="mt-3 w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? t.sending : t.sendLink}
        </button>
      </div>

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
