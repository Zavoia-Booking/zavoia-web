"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { resetPassword } from "@/lib/api/customer-auth";
import { ApiError } from "@/lib/api/http";
import { AuthField } from "../../_components/auth-field";

// Same strong-password rule used in register-form.tsx — keep these in sync.
// Mirrors admin-api's PASSWORD_REGEX: any non-alphanumeric counts as the
// special character (so # or - work, not just @$!%*?&).
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

type Errors = Partial<Record<"password" | "confirm" | "form", string>>;

// Backend token-validation failures (invalid / already used / expired) — the
// token itself is dead, so retrying the form is pointless; offer a fresh link.
const TOKEN_ERROR_CODES = new Set(["SYSTEM.E06", "SYSTEM.E07", "SYSTEM.E08"]);

function isDeadTokenError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const code = error.code ?? error.message;
  return typeof code === "string" && TOKEN_ERROR_CODES.has(code.toUpperCase());
}

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale].auth;
  const t = dict.resetPassword;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenDead, setTokenDead] = useState(false);
  // `submitting` state disables the button only after a re-render, so a
  // fast double activation can pass the check twice; the ref locks
  // synchronously on the first call. Critical here: the reset token is
  // single-use, so a duplicate call errors with "link invalid" right after
  // the password was actually reset.
  const submitLockRef = useRef(false);

  const loginHref = `${localeHref(locale, "auth")}?mode=login`;
  const forgotPasswordHref = localeHref(locale, "auth", "forgot-password");

  function validate(): Errors {
    const next: Errors = {};
    if (!password) next.password = dict.errors.passwordRequired;
    else if (password.length < 8)
      next.password = dict.errors.passwordTooShort;
    else if (!PASSWORD_REGEX.test(password))
      next.password = dict.errors.passwordWeak;
    if (!confirm) next.confirm = t.confirmRequired;
    else if (confirm !== password) next.confirm = t.mismatch;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || submitLockRef.current) return;
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      // Success: stay locked — the success screen replaces the form.
      setSuccess(true);
    } catch (e) {
      submitLockRef.current = false;
      setSubmitting(false);
      setErrors({ form: authErrorMessage(e, dict.errors) });
      setTokenDead(isDeadTokenError(e));
    }
  }

  // A missing token is a render-time fact — show the error state with no form.
  if (!token) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.missingTokenHeading}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">{t.missingTokenBody}</p>
        <Link
          href={loginHref}
          className="mt-6 inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
        >
          {t.backToLogin}
        </Link>
      </main>
    );
  }

  if (success) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.successHeading}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">{t.successBody}</p>
        <Link
          href={loginHref}
          className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          {t.goToLogin}
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
          id="password"
          type="password"
          label={t.newPassword}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
        />
        <AuthField
          id="confirm-password"
          type="password"
          label={t.confirmPassword}
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
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

        {tokenDead && (
          <Link
            href={forgotPasswordHref}
            className="inline-block rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            {t.requestNewLink}
          </Link>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>
    </main>
  );
}
