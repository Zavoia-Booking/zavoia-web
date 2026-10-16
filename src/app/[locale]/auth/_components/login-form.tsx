"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { backendCode, transportErrorMessage } from "@/lib/api/error-messages";
import { getAccountLinkNeededDetails } from "@/lib/api/customer-auth";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { useAuth } from "@/lib/auth/useAuth";
import { authFlowHref, authRedirectTarget } from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { AuthField } from "./auth-field";
import { InlineError } from "@/components/ui/inline-error";

type Errors = Partial<Record<"email" | "password" | "form", string>>;

export function LoginForm({
  locale,
  onAccountLinkNeeded,
  onSubmittingChange,
  disabled = false,
}: {
  locale: Locale;
  onAccountLinkNeeded: (details: AccountLinkNeededDetails) => void;
  onSubmittingChange?: (pending: boolean) => void;
  disabled?: boolean;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showGoogleHint, setShowGoogleHint] = useState(false);
  const busy = submitting || disabled;
  // `submitting` state disables the button only after a re-render, so a
  // fast double activation can pass the check twice; the ref locks
  // synchronously on the first call.
  const submitLockRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      const target = authRedirectTarget(searchParams, locale);
      router.replace(target);
    }
  }, [status, locale, router, searchParams]);

  function validateField(key: "email" | "password", value: string) {
    if (key === "email") {
      if (!value.trim()) return dict.errors.emailRequired;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return dict.errors.emailInvalid;
      }
    } else if (!value) return dict.errors.passwordRequired;
    return undefined;
  }

  function setField(key: "email" | "password", value: string) {
    if (key === "email") setEmail(value);
    else setPassword(value);
    setErrors((previous) => ({
      ...previous,
      [key]: previous[key] ? validateField(key, value) : undefined,
      form: undefined,
    }));
    setShowGoogleHint(false);
  }

  function validate(): Errors {
    const next: Errors = {};
    const emailError = validateField("email", email);
    const passwordError = validateField("password", password);
    if (emailError) next.email = emailError;
    if (passwordError) next.password = passwordError;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current || busy) return;
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      const field = event.currentTarget.elements.namedItem(
        validation.email ? "email" : "password",
      );
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    onSubmittingChange?.(true);
    setShowGoogleHint(false);
    try {
      await login({ email: email.trim(), password });
      // Success: stay locked until the authenticated effect redirects.
    } catch (e) {
      if (!mountedRef.current) return;
      submitLockRef.current = false;
      setSubmitting(false);
      onSubmittingChange?.(false);
      const linkDetails = getAccountLinkNeededDetails(e);
      if (linkDetails) {
        onAccountLinkNeeded(linkDetails);
        return;
      }
      setErrors({
        form: authErrorMessage(e, dict.errors, dictionary.errors),
      });
      setShowGoogleHint(
        backendCode(e) === "CUSTOMER_AUTH.E38" &&
        !transportErrorMessage(e, dictionary.errors),
      );
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={busy} noValidate>
        <AuthField
          id="email"
          type="email"
          label={dict.fields.email}
          value={email}
          onChange={(value) => setField("email", value)}
          error={errors.email}
          showErrorIcon={false}
          autoComplete="email"
          disabled={busy}
          required
        />
        <AuthField
          id="password"
          type="password"
          label={dict.fields.password}
          value={password}
          onChange={(value) => setField("password", value)}
          error={errors.password}
          showErrorIcon={false}
          autoComplete="current-password"
          disabled={busy}
          required
          showPasswordLabel={dict.fields.showPassword}
          hidePasswordLabel={dict.fields.hidePassword}
        />

        {errors.form && (
          <div>
            <InlineError className="rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2">
              {errors.form}
            </InlineError>
            {GOOGLE_CLIENT_ID && showGoogleHint && (
              <p className="mt-2 text-sm text-c-600">
                {dict.errors.googleAccountHint}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          aria-label={dict.loginSubmit}
          aria-busy={submitting}
          className="relative mt-4 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
        >
          <span className={submitting ? "invisible" : undefined} aria-hidden={submitting || undefined}>
            {dict.loginSubmit}
          </span>
          {submitting && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <Spinner size={16} color="currentColor" />
            </span>
          )}
        </button>
        <span role="status" className="sr-only">
          {submitting ? dict.loginSubmitting : ""}
        </span>
      </form>

      <div className="mt-4 flex justify-center">
        <Link
          href={authFlowHref(locale, "forgot-password", searchParams)}
          scroll={false}
          aria-disabled={busy || undefined}
          tabIndex={busy ? -1 : undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
          onNavigate={(event) => {
            event.preventDefault();
            if (!busy) {
              window.history.pushState(null, "", authFlowHref(locale, "forgot-password", searchParams));
            }
          }}
          className="text-sm text-c-600 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {dict.forgotPasswordLink}
        </Link>
      </div>
    </div>
  );
}
