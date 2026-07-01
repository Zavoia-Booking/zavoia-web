"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { forgotPassword } from "@/lib/api/customer-auth";
import { AuthField } from "../../_components/auth-field";

type Errors = Partial<Record<"email", string>>;

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const t = dict.forgotPassword;

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const loginHref = `${localeHref(locale, "auth")}?mode=login`;

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = dict.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = dict.errors.emailInvalid;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await forgotPassword(email.trim(), locale);
    } catch {
      // Intentionally swallow: never reveal whether the account exists. The UI
      // always shows the same neutral confirmation regardless of the outcome.
    } finally {
      setSubmitting(false);
      // Always show the neutral success state — no account enumeration.
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.sentHeading}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">{t.sentBody}</p>
        <Link
          href={loginHref}
          className="mt-6 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          {t.backToLogin}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <AuthField
          id="email"
          type="email"
          label={dict.fields.email}
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      <Link
        href={loginHref}
        className="mt-6 inline-block text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
      >
        {t.backToLogin}
      </Link>
    </main>
  );
}
