"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { backendCode } from "@/lib/api/error-messages";
import { defaultPostAuthTarget, safeRedirectTarget } from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";
import { AuthField } from "./auth-field";

/**
 * Shown when login/register/Google/Apple hits the 409
 * `account_exists_needs_marketplace_access`: the email belongs to a business
 * account. The user confirms it's theirs with the account password right here
 * (POST /marketplace/auth/enable-access) — no emailed link — and is signed in
 * with marketplace access. Passwordless accounts are pointed back to Google /
 * Apple sign-in, whose own confirm step needs no password.
 */
export function EnableAccessPanel({
  locale,
  details,
  onCancel,
  flowKey,
  redirect,
}: {
  locale: Locale;
  details: AccountLinkNeededDetails;
  onCancel: () => void;
  /** Callback identity keeps a pending request across locale changes. */
  flowKey?: string;
  /** Post-auth target; defaults to the locale home. */
  redirect?: string | null;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.enableAccess;
  const router = useRouter();
  const { status, enableMarketplaceAccess } = useAuth();

  const instance = useId();
  const headingId = `${instance}-heading`;
  const termsId = `${instance}-terms`;
  const errorId = `${instance}-error`;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const action = useRetainedAuthAction(
    JSON.stringify(["enable-access", flowKey ?? instance, details.email]),
  );
  const submitting = action.status === "pending" || action.status === "success";

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [providerOnly, setProviderOnly] = useState<"google" | "apple" | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // The focused form is replaced by this panel. Orient keyboard users on entry.
  // Native focus also reveals the heading if the longer registration form had
  // been scrolled down before it was replaced.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    // An invalid field can receive focus only after the pending state has released it.
    if (passwordError && !submitting) {
      const field = formRef.current?.elements.namedItem("password");
      if (field instanceof HTMLElement) field.focus();
    }
  }, [passwordError, submitting]);

  // Once the session is established, redirect like the sign-in forms.
  useEffect(() => {
    if (action.status === "success" && status === "authenticated") {
      router.replace(safeRedirectTarget(redirect ?? null, locale, defaultPostAuthTarget(locale)));
    }
  }, [action.status, status, locale, router, redirect]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !termsAccepted) return;
    setActionError(null);
    if (!password) {
      setPasswordError(t.passwordRequired);
      return;
    }
    // This confirms an existing password. Never trim, normalize or apply
    // new-password strength rules: the server needs the exact value.
    setPasswordError(null);
    void action.run(async () => {
      await enableMarketplaceAccess(details.email, password, locale);
    }).catch((error: unknown) => {
      const code = backendCode(error);
      if (code === "CUSTOMER_AUTH.E38") {
        setPasswordError(t.wrongPassword);
      } else if (code === "GOOGLE_LOGIN_REQUIRED") {
        setProviderOnly("google");
        setPassword("");
      } else if (code === "APPLE_LOGIN_REQUIRED") {
        setProviderOnly("apple");
        setPassword("");
      } else {
        setActionError(error);
      }
    });
  }

  const body = providerOnly === "google"
    ? t.googleOnly
    : providerOnly === "apple"
      ? t.appleOnly
      : t.nextStep;

  return (
    <section
      className="auth-access-panel"
      aria-labelledby={headingId}
      aria-busy={submitting}
    >
      <span role="status" className="sr-only">
        {submitting ? t.confirming : ""}
      </span>
      <div className="auth-access-state">
        <header className="auth-access-header">
          <h1
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="auth-access-heading"
          >
            {t.heading}
          </h1>
          <p className="auth-access-intro">{t.explanation}</p>
        </header>

        <div className="auth-access-details">
          <div className="auth-access-identity">
            <p className="auth-access-label">{t.emailLabel}</p>
            <p className="auth-access-email">{details.email}</p>
          </div>

          <div className="auth-access-copy">
            <p>{body}</p>
          </div>
        </div>

        {!providerOnly && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 flex flex-col gap-4"
            aria-describedby={actionError ? errorId : undefined}
          >
            <AuthField
              id="password"
              type="password"
              label={t.passwordLabel}
              value={password}
              onChange={(value) => {
                setPassword(value);
                setPasswordError(null);
                setActionError(null);
              }}
              error={passwordError ?? undefined}
              autoComplete="current-password"
              disabled={submitting}
              required
              showPasswordLabel={dict.fields.showPassword}
              hidePasswordLabel={dict.fields.hidePassword}
            />
            {/* Confirming adds the customer role, so it waits for the box. */}
            <div className="flex items-start gap-2.5">
              <input
                id={termsId}
                name="acceptTerms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={submitting}
                required
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--p-500)] disabled:cursor-not-allowed"
              />
              <label
                htmlFor={termsId}
                className="cursor-pointer text-sm text-c-600 select-none"
              >
                {dict.terms.agreementPrefix}{" "}
                <a
                  href={localeHref(locale, "terms", "customer-terms")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {dict.terms.customerTermsLink}
                </a>
                . {dict.terms.privacyPrefix}{" "}
                <a
                  href={localeHref(locale, "terms", "privacy-policy")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {dict.terms.privacyNoticeLink}
                </a>
                .
              </label>
            </div>
            {actionError !== null && (
              <InlineError id={errorId}>
                {authErrorMessage(actionError, dict.errors, dictionary.errors) || t.error}
              </InlineError>
            )}
            <Button
              type="submit"
              loading={submitting}
              disabled={!termsAccepted}
              className="auth-access-button"
              style={{ whiteSpace: "normal", paddingBlock: 10, lineHeight: 1.4 }}
            >
              {t.confirm}
            </Button>
          </form>
        )}

        <div className="auth-access-footer">
          <div className="auth-access-actions">
            <Button
              kind="secondary"
              onClick={onCancel}
              disabled={submitting}
              className="auth-access-button"
              style={{ whiteSpace: "normal", paddingBlock: 10, lineHeight: 1.4 }}
            >
              <ArrowLeft size={16} aria-hidden="true" className="shrink-0" />
              <span>{t.cancel}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
