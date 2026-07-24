"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { getAccountLinkNeededDetails } from "@/lib/api/customer-auth";
import { useAuth } from "@/lib/auth/useAuth";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { Icon } from "@/components/ui/icon";
import { AuthField } from "./auth-field";
import { PasswordStrength } from "./password-strength";

const FIELD_KEYS = [
  "email",
  "password",
  "firstName",
  "lastName",
  "phone",
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
type Errors = Partial<Record<FieldKey | "form", string>>;

// Mirrors admin-api's PASSWORD_REGEX: any non-alphanumeric counts as the
// special character (so # or - work, not just @$!%*?&).
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{6,}$/;

// Same as admin-dashboard's sanitizeName: names accept letters (incl.
// diacritics), apostrophes, hyphens and spaces; anything else is stripped
// as the user types.
const sanitizeName = (value: string) => value.replace(/[^A-Za-zÀ-ÿ'\-\s]/g, "");

export function RegisterForm({
  locale,
  onAccountLinkNeeded,
  termsAccepted,
  termsError,
  onTermsChange,
  onTermsInvalid,
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
}) {
  const dict = dictionaries[locale].auth;
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
  // `submitting` state disables the button only after a re-render, so a
  // fast double activation can pass the check twice; the ref locks
  // synchronously on the first call.
  const submitLockRef = useRef(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [pwInteracted, setPwInteracted] = useState(false);

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
          if (value.length < 2) return dict.errors.nameTooShort;
          if (value.length > 50) return dict.errors.nameTooLong;
          return undefined;
        case "lastName":
          if (!value) return dict.errors.lastNameRequired;
          if (value.length < 2) return dict.errors.nameTooShort;
          if (value.length > 50) return dict.errors.nameTooLong;
          return undefined;
        case "phone":
          return value && !PHONE_REGEX.test(value)
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
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
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
    if (submitLockRef.current) return;
    const validation = validateAll();
    setErrors(validation);
    if (!termsAccepted) onTermsInvalid();
    if (Object.keys(validation).length > 0 || !termsAccepted) return;

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || undefined,
        locale,
      });
      // Success: stay locked. The authenticated effect is about to
      // redirect, and re-enabling here would open a window for a second
      // submission with an already-registered email.
    } catch (e) {
      submitLockRef.current = false;
      setSubmitting(false);
      const linkDetails = getAccountLinkNeededDetails(e);
      if (linkDetails) {
        onAccountLinkNeeded(linkDetails);
        return;
      }
      setErrors({ form: authErrorMessage(e, dict.errors) });
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            id="firstName"
            label={dict.fields.firstName}
            value={values.firstName}
            onChange={(v) => setField("firstName", sanitizeName(v))}
            error={errors.firstName}
            autoComplete="given-name"
            reserveErrorSpace
          />
          <AuthField
            id="lastName"
            label={dict.fields.lastName}
            value={values.lastName}
            onChange={(v) => setField("lastName", sanitizeName(v))}
            error={errors.lastName}
            autoComplete="family-name"
            reserveErrorSpace
          />
        </div>
        <AuthField
          id="email"
          type="email"
          label={dict.fields.email}
          value={values.email}
          onChange={(v) => setField("email", v)}
          error={errors.email}
          autoComplete="email"
          reserveErrorSpace
        />
        <AuthField
          id="phone"
          type="tel"
          label={dict.fields.phoneOptional}
          value={values.phone}
          onChange={(v) => setField("phone", v)}
          error={errors.phone}
          autoComplete="tel"
          reserveErrorSpace
        />
        <div>
          <div className="relative">
            <AuthField
              id="password"
              type="password"
              label={dict.fields.password}
              value={values.password}
              onChange={(v) => setField("password", v)}
              onFocus={() => {
                setPwFocused(true);
                setPwInteracted(true);
              }}
              onBlur={() => setPwFocused(false)}
              error={errors.password}
              autoComplete="new-password"
              showPasswordLabel={dict.fields.showPassword}
              hidePasswordLabel={dict.fields.hidePassword}
              suppressErrorText
            />
            {pwFocused && (
              <div className="absolute bottom-full left-0 z-20 mb-2">
                <PasswordStrength
                  password={values.password}
                  dict={dict.passwordStrength}
                  variant="panel"
                />
              </div>
            )}
          </div>
          <div className="mt-2 h-8">
            {pwInteracted ? (
              <PasswordStrength
                password={values.password}
                dict={dict.passwordStrength}
                variant="bar"
              />
            ) : (
              <span
                className="invisible block text-xs leading-normal"
                aria-hidden="true"
              >
                0
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-start gap-2.5">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onTermsChange(e.target.checked)}
              aria-invalid={termsError}
              aria-describedby={termsError ? "acceptTerms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--p-500)]"
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
                href={localeHref(locale, "legal", "terms")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.termsLink}
              </a>
              ,{" "}
              <a
                href={localeHref(locale, "legal", "cookies")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.cookiesLink}
              </a>{" "}
              {dict.terms.and}{" "}
              <a
                href={localeHref(locale, "legal", "privacy")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {dict.terms.privacyLink}
              </a>
            </label>
          </div>
          <div className="h-5">
            {termsError && (
              <p
                id="acceptTerms-error"
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs text-[var(--s-error-600)]"
              >
                <Icon name="warn" size={13} />
                <span>{dict.terms.required}</span>
              </p>
            )}
          </div>
        </div>

        {errors.form && (
          <p
            role="alert"
            className="rounded-[10px] border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2 text-sm text-[var(--s-error-600)]"
          >
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !formValid}
          className="mt-2 h-12 w-full cursor-pointer rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition hover:bg-p-600 disabled:cursor-not-allowed disabled:opacity-60 md:h-11"
        >
          {submitting ? dict.registerSubmitting : dict.registerSubmit}
        </button>
      </form>
    </div>
  );
}
