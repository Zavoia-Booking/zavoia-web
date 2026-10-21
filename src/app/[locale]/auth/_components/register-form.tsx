"use client";

import { Spinner } from "@/components/ui/spinner";
import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { getAccountLinkNeededDetails } from "@/lib/api/customer-auth";
import { useAuth } from "@/lib/auth/useAuth";
import { authRedirectTarget } from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { InlineError } from "@/components/ui/inline-error";
import { AuthField } from "./auth-field";
import { PasswordStrength } from "./password-strength";
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_REGEX,
  isValidPersonName,
  isValidPhone,
  normalizePhone,
  sanitizeName,
} from "@/lib/validation";

const FIELD_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
type Errors = Partial<Record<FieldKey | "form", string>>;

export function RegisterForm({
  locale,
  onAccountLinkNeeded,
  termsAccepted,
  termsError,
  onTermsChange,
  onTermsInvalid,
  onSubmittingChange,
  disabled = false,
}: {
  locale: Locale;
  onAccountLinkNeeded: (details: AccountLinkNeededDetails) => void;
  /**
   * Terms consent is lifted to AuthTabs: the Google register button rendered
   * there must gate on the same checkbox, so the form only renders it and
   * reports validity.
   */
  termsAccepted: boolean;
  termsError: boolean;
  onTermsChange: (accepted: boolean) => void;
  onTermsInvalid: () => void;
  onSubmittingChange?: (pending: boolean) => void;
  disabled?: boolean;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, register } = useAuth();

  const [values, setValues] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || disabled;
  // `submitting` state disables the button only after a re-render, so a
  // fast double activation can pass the check twice; the ref locks
  // synchronously on the first call.
  const submitLockRef = useRef(false);
  const mountedRef = useRef(true);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

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

  const validateField = useCallback(
    (key: FieldKey, rawValue: string): string | undefined => {
      const value = rawValue.trim();
      switch (key) {
        case "email":
          if (!value) return dict.errors.emailRequired;
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return dict.errors.emailInvalid;
          return undefined;
        case "password":
          if (!rawValue) return dict.errors.passwordRequired;
          if (rawValue.length < 8) return dict.errors.passwordTooShort;
          if (!PASSWORD_REGEX.test(rawValue)) return dict.errors.passwordWeak;
          return undefined;
        case "firstName":
          if (!value) return dict.errors.firstNameRequired;
          if (value.length < NAME_MIN_LENGTH) return dict.errors.nameTooShort;
          if (value.length > NAME_MAX_LENGTH) return dict.errors.nameTooLong;
          if (!isValidPersonName(value)) return dict.errors.nameNeedsLetter;
          return undefined;
        case "lastName":
          if (!value) return dict.errors.lastNameRequired;
          if (value.length < NAME_MIN_LENGTH) return dict.errors.nameTooShort;
          if (value.length > NAME_MAX_LENGTH) return dict.errors.nameTooLong;
          if (!isValidPersonName(value)) return dict.errors.nameNeedsLetter;
          return undefined;
        case "phone":
          return value && !isValidPhone(value)
            ? dict.errors.phoneInvalid
            : undefined;
      }
    },
    [dict],
  );

  // Same model as the admin-dashboard register (react-hook-form
  // mode: 'onChange'): a field validates on every keystroke from the first
  // one, untouched fields stay silent, and submit is disabled until the
  // whole form is valid.
  function setField<K extends FieldKey>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({
      ...prev,
      [key]: validateField(key, value),
      form: undefined,
    }));
  }

  const formValid =
    termsAccepted &&
    FIELD_KEYS.every((key) => !validateField(key, values[key]));

  function validateAll(): Errors {
    const next: Errors = {};
    for (const key of FIELD_KEYS) {
      const error = validateField(key, values[key]);
      if (error) next[key] = error;
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current || busy) return;
    const validation = validateAll();
    setErrors(validation);
    if (!termsAccepted) onTermsInvalid();
    if (Object.keys(validation).length > 0 || !termsAccepted) {
      const firstInvalid = FIELD_KEYS.find((key) => validation[key]);
      const field = firstInvalid
        ? event.currentTarget.elements.namedItem(firstInvalid)
        : event.currentTarget.elements.namedItem("acceptTerms");
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    onSubmittingChange?.(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: normalizePhone(values.phone).trim() || undefined,
        locale,
      });
      // Success: stay locked. The authenticated effect is about to
      // redirect, and re-enabling here would open a window for a second
      // submission with an already-registered email.
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
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3" aria-busy={busy} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <AuthField
            id="firstName"
            label={dict.fields.firstName}
            value={values.firstName}
            onChange={(v) => setField("firstName", sanitizeName(v))}
            error={errors.firstName}
            showErrorIcon
            autoComplete="given-name"
            disabled={busy}
            required
          />
          <AuthField
            id="lastName"
            label={dict.fields.lastName}
            value={values.lastName}
            onChange={(v) => setField("lastName", sanitizeName(v))}
            error={errors.lastName}
            showErrorIcon
            autoComplete="family-name"
            disabled={busy}
            required
          />
        </div>
        <AuthField
          id="email"
          type="email"
          label={dict.fields.email}
          value={values.email}
          onChange={(v) => setField("email", v)}
          error={errors.email}
          showErrorIcon
          autoComplete="email"
          disabled={busy}
          required
        />
        <AuthField
          id="phone"
          type="tel"
          label={dict.fields.phoneOptional}
          value={values.phone}
          onChange={(v) => setField("phone", v)}
          error={errors.phone}
          showErrorIcon
          autoComplete="tel"
          disabled={busy}
        />
        <div>
          <AuthField
            id="password"
            type="password"
            label={dict.fields.password}
            value={values.password}
            onChange={(v) => setField("password", v)}
            onFocus={() => setShowPasswordRules(true)}
            error={errors.password}
            showErrorIcon
            autoComplete="new-password"
            showPasswordLabel={dict.fields.showPassword}
            hidePasswordLabel={dict.fields.hidePassword}
            describedBy="password-requirements"
            disabled={busy}
            required
          />
          <PasswordStrength
            id="password-requirements"
            password={values.password}
            dict={dict.passwordStrength}
            variant="inline"
            expanded={showPasswordRules}
            onExpandedChange={setShowPasswordRules}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onTermsChange(e.target.checked)}
              disabled={busy}
              required
              aria-invalid={termsError}
              aria-describedby={termsError ? "acceptTerms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--p-500)] disabled:cursor-not-allowed"
            />
            {/* Clicking the links follows them (browsers skip label→checkbox
                forwarding on interactive children); new tab so the half-filled
                form isn't lost. */}
            <label
              htmlFor="acceptTerms"
              className="cursor-pointer text-sm text-c-600 select-none"
            >
              {dict.terms.agreementPrefix}{" "}
              <a
                href={localeHref(locale, "terms", "customer-terms")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.termsLink}
              </a>
              ,{" "}
              <a
                href={localeHref(locale, "terms", "cookie-policy")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.cookiesLink}
              </a>{" "}
              {dict.terms.and}{" "}
              <a
                href={localeHref(locale, "terms", "privacy-policy")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.privacyLink}
              </a>
            </label>
          </div>
          {termsError && (
            <InlineError
              id="acceptTerms-error"
              className="mt-1"
            >
              {dict.terms.required}
            </InlineError>
          )}
        </div>

        {errors.form && (
          <InlineError
            className="rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2"
          >
            {errors.form}
          </InlineError>
        )}

        <button
          type="submit"
          disabled={busy || !formValid}
          aria-label={dict.registerSubmit}
          aria-busy={submitting}
          className="relative mt-2 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
        >
          <span className={submitting ? "invisible" : undefined} aria-hidden={submitting || undefined}>
            {dict.registerSubmit}
          </span>
          {submitting && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <Spinner size={16} color="currentColor" />
            </span>
          )}
        </button>
        <span role="status" className="sr-only">
          {submitting ? dict.registerSubmitting : ""}
        </span>
      </form>
    </div>
  );
}
