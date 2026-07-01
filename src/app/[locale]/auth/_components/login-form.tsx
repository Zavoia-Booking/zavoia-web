"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { getAccountLinkNeededDetails } from "@/lib/api/customer-auth";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { useAuth } from "@/lib/auth/useAuth";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { AuthField } from "./auth-field";

type Errors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginForm({
  locale,
  onAccountLinkNeeded,
}: {
  locale: Locale;
  onAccountLinkNeeded: (details: AccountLinkNeededDetails) => void;
}) {
  const dict = dictionaries[locale].auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

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

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = dict.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = dict.errors.emailInvalid;
    if (!password) next.password = dict.errors.passwordRequired;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      const linkDetails = getAccountLinkNeededDetails(e);
      if (linkDetails) {
        onAccountLinkNeeded(linkDetails);
        return;
      }
      setErrors({ form: authErrorMessage(e, dict.errors) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {dict.loginHeading}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">{dict.loginSubtitle}</p>

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
        <AuthField
          id="password"
          type="password"
          label={dict.fields.password}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="text-right">
          <Link
            href={localeHref(locale, "auth", "forgot-password")}
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            {dict.forgotPasswordLink}
          </Link>
        </div>

        {errors.form && (
          <div role="alert">
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.form}
            </p>
            {GOOGLE_CLIENT_ID && (
              <p className="mt-2 text-sm text-zinc-500">
                {dict.errors.googleAccountHint}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? dict.loginSubmitting : dict.loginSubmit}
        </button>
      </form>
    </div>
  );
}
