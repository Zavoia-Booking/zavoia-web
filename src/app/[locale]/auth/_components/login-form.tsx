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
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          showPasswordLabel={dict.fields.showPassword}
          hidePasswordLabel={dict.fields.hidePassword}
        />

        {errors.form && (
          <div role="alert">
            <p className="rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2 text-sm text-[var(--s-error-600)]">
              {errors.form}
            </p>
            {GOOGLE_CLIENT_ID && (
              <p className="mt-2 text-sm text-c-600">
                {dict.errors.googleAccountHint}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
        >
          {submitting ? dict.loginSubmitting : dict.loginSubmit}
        </button>
      </form>

      <div className="mt-4 flex justify-center">
        <Link
          href={localeHref(locale, "auth", "forgot-password")}
          className="text-sm text-c-600 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {dict.forgotPasswordLink}
        </Link>
      </div>
    </div>
  );
}
