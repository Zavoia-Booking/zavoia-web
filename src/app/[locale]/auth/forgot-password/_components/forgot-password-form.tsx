"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { forgotPassword } from "@/lib/api/customer-auth";
import { AuthCard } from "../../_components/auth-card";
import { AuthField } from "../../_components/auth-field";

type Errors = Partial<Record<"email", string>>;

const outlineButtonClass =
  "flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[rgba(28,28,26,0.14)] bg-white px-4 text-[15px] font-semibold text-ink transition hover:bg-c-100 md:h-11";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const t = dict.forgotPassword;

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const authHref = localeHref(locale, "auth");
  const loginHref = `${authHref}?mode=login`;
  const registerHref = `${authHref}?mode=register`;

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

  return (
    <main
      className="flex flex-col items-center justify-center px-4 py-10"
      style={{ minHeight: "calc(100svh - var(--nav-h))" }}
    >
      <div className="w-full max-w-sm md:max-w-[62.5rem]">
        <AuthCard
          mode="login"
          title={sent ? t.sentHeading : t.heading}
          subtitle={sent ? undefined : t.subtitle}
          loginHref={loginHref}
          registerHref={registerHref}
          tabLoginLabel={dict.tabLogin}
          tabRegisterLabel={dict.tabRegister}
          tablistLabel={dict.pageTitle}
          isForgotMode
        >
          {sent ? (
            <div className="flex w-full flex-col gap-4">
              <div className="rounded-[10px] bg-shade p-4 text-sm text-c-700">
                {t.sentBody}
              </div>
              <Link href={loginHref} className={outlineButtonClass}>
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4">
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </form>

              <Link href={loginHref} className={outlineButtonClass}>
                {t.backToLogin}
              </Link>
            </div>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
