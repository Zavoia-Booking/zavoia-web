"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { forgotPassword } from "@/lib/api/customer-auth";
import { errorMessage } from "@/lib/api/error-messages";
import { authFlowHref } from "@/lib/auth/redirects";
import { AuthCard } from "../../_components/auth-card";
import { AuthField } from "../../_components/auth-field";
import { AuthShell } from "../../_components/auth-shell";
import { InlineError } from "@/components/ui/inline-error";

type Errors = Partial<Record<"email", string>>;

const outlineButtonClass =
  "flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-[rgba(28,28,26,0.14)] bg-white px-4 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-c-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 md:h-11";

export function ForgotPasswordForm({
  locale,
  embedded = false,
  onSubmittingChange,
}: {
  locale: Locale;
  embedded?: boolean;
  onSubmittingChange?: (pending: boolean) => void;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.forgotPassword;
  const shared = dictionary.errors;
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Set only on a genuine transport/server failure; the backend keeps unknown
  // email addresses indistinguishable from successful requests.
  const [failure, setFailure] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loginHref = authFlowHref(locale, "login", searchParams);
  const registerHref = authFlowHref(locale, "register", searchParams);
  const title = sent ? t.sentHeading : t.heading;
  const subtitle = sent ? undefined : t.subtitle;

  function handleBackNavigation(event: { preventDefault: () => void }) {
    if (submitting) {
      event.preventDefault();
      return;
    }
    if (embedded) {
      event.preventDefault();
      window.history.pushState(null, "", loginHref);
    }
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!email.trim()) next.email = dict.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = dict.errors.emailInvalid;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    onSubmittingChange?.(true);
    setFailure(null);
    try {
      await forgotPassword(email.trim(), locale);
      // The backend already returns this SAME success response for a
      // non-existent email — anti-enumeration happens server-side (see
      // CustomerAuthService.forgotPassword), so every rejection that reaches
      // this catch is a genuine transport/server failure, never "no such
      // account". Only a real failure may skip the neutral confirmation.
      setSent(true);
    } catch (err) {
      setFailure(errorMessage(err, shared));
    } finally {
      // Browser Back can open another auth view before this request finishes.
      if (mountedRef.current) {
        setSubmitting(false);
        onSubmittingChange?.(false);
      }
    }
  }

  const content = sent ? (
    <div className="flex w-full flex-col gap-4">
      <div role="status" className="rounded-[10px] bg-shade p-4 text-sm text-c-700">
        {t.sentBody}
      </div>
      <Link
        href={loginHref}
        scroll={false}
        className={outlineButtonClass}
        onNavigate={handleBackNavigation}
      >
        {t.backToLogin}
      </Link>
    </div>
  ) : (
    <div className="flex w-full flex-col gap-4">
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting} noValidate>
        <AuthField
          id="email"
          type="email"
          label={dict.fields.email}
          value={email}
          onChange={(value) => {
            setEmail(value);
            setErrors({});
            setFailure(null);
          }}
          error={errors.email}
          autoComplete="email"
          disabled={submitting}
          required
        />

        {failure && (
          <InlineError
            className="rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2"
          >
            {failure}
          </InlineError>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      <Link
        href={loginHref}
        scroll={false}
        className={outlineButtonClass}
        aria-disabled={submitting || undefined}
        onNavigate={handleBackNavigation}
      >
        {t.backToLogin}
      </Link>
    </div>
  );

  if (embedded) {
    return (
      <>
        <div className="auth-card-heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {content}
      </>
    );
  }

  return (
    <AuthShell>
      <AuthCard
        mode="login"
        title={title}
        subtitle={subtitle}
        loginHref={loginHref}
        registerHref={registerHref}
        tabLoginLabel={dict.tabLogin}
        tabRegisterLabel={dict.tabRegister}
        tablistLabel={dict.pageTitle}
        navigationDisabled={submitting}
      >
        {content}
      </AuthCard>
    </AuthShell>
  );
}
