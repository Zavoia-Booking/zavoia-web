"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { getAccountLinkNeededDetails } from "@/lib/api/customer-auth";
import { useAuth } from "@/lib/auth/useAuth";
import {
  defaultPostAuthTarget,
  safeRedirectTarget,
} from "@/lib/auth/redirects";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { AuthField } from "./auth-field";

type FieldKey = "email" | "password" | "firstName" | "lastName" | "phone";
type Errors = Partial<Record<FieldKey | "form", string>>;

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{6,}$/;

export function RegisterForm({
  locale,
  onAccountLinkNeeded,
}: {
  locale: Locale;
  onAccountLinkNeeded: (details: AccountLinkNeededDetails) => void;
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

  function setField<K extends FieldKey>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!values.email.trim()) next.email = dict.errors.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = dict.errors.emailInvalid;
    if (!values.password) next.password = dict.errors.passwordRequired;
    else if (values.password.length < 8)
      next.password = dict.errors.passwordTooShort;
    else if (!PASSWORD_REGEX.test(values.password))
      next.password = dict.errors.passwordWeak;
    if (!values.firstName.trim())
      next.firstName = dict.errors.firstNameRequired;
    if (!values.lastName.trim())
      next.lastName = dict.errors.lastNameRequired;
    if (values.phone.trim() && !PHONE_REGEX.test(values.phone.trim()))
      next.phone = dict.errors.phoneInvalid;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || undefined,
      });
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
        {dict.registerHeading}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">{dict.registerSubtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            id="firstName"
            label={dict.fields.firstName}
            value={values.firstName}
            onChange={(v) => setField("firstName", v)}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <AuthField
            id="lastName"
            label={dict.fields.lastName}
            value={values.lastName}
            onChange={(v) => setField("lastName", v)}
            error={errors.lastName}
            autoComplete="family-name"
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
        />
        <AuthField
          id="phone"
          type="tel"
          label={dict.fields.phoneOptional}
          value={values.phone}
          onChange={(v) => setField("phone", v)}
          error={errors.phone}
          autoComplete="tel"
        />
        <AuthField
          id="password"
          type="password"
          label={dict.fields.password}
          value={values.password}
          onChange={(v) => setField("password", v)}
          error={errors.password}
          autoComplete="new-password"
        />

        {errors.form && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? dict.registerSubmitting : dict.registerSubmit}
        </button>
      </form>
    </div>
  );
}
