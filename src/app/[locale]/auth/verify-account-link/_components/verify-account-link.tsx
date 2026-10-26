"use client";

import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { ArrowLeft, Link2Off, Mail, WifiOff } from "lucide-react";
import { VerificationLayout, VerificationLoading } from "./verification-layout";
import styles from "./verification.module.css";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { validateAccountLink } from "@/lib/api/customer-auth";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { backendCode } from "@/lib/api/error-messages";
import { defaultPostAuthTarget } from "@/lib/auth/redirects";
import { useAuth } from "@/lib/auth/useAuth";
import type { AccountLinkValidation } from "@/lib/auth/types";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { AuthField } from "../../_components/auth-field";
import { GoogleSignInButton } from "../../_components/google-signin-button";

// Only explicit token/account rejections prove this link is unusable. An
// unavailable backend, rate limit or unknown rejection must allow recovery.
const DEAD_LINK_CODES = new Set([
  "SYSTEM.E06", // Unknown token.
  "SYSTEM.E07", // Already used.
  "SYSTEM.E08", // Expired.
  "CUSTOMER_AUTH.E10", // Marketplace access is already enabled.
]);

function isDeadLinkError(error: unknown): boolean {
  const code = backendCode(error);
  return code !== null && DEAD_LINK_CODES.has(code);
}

type State =
  | { kind: "checking" }
  | { kind: "confirm"; info: AccountLinkValidation }
  | { kind: "success" }
  | { kind: "error" }
  | { kind: "transient"; error: unknown };

/**
 * Landing page of the account-link email. The emailed token alone must not
 * grant access: this page validates it (pre-flight, nothing consumed), then
 * asks the user to prove account ownership — password for password accounts,
 * "Continue with Google" for passwordless Google-only accounts. On success the
 * backend adds the CUSTOMER role and issues tokens, so the user ends up
 * signed in.
 */
export function VerifyAccountLink({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // A different emailed link is a different form, including password draft,
  // errors and in-flight validation. Late results from its predecessor cannot
  // replace this token's identity or confirmation state.
  return <AccountLinkConfirmation key={token ?? ""} token={token} locale={locale} />;
}

function AccountLinkConfirmation({ locale, token }: { locale: Locale; token: string | null }) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.verifyLink;
  const { completeAccountLink } = useAuth();

  // A missing token is a render-time fact (no async needed), so derive the
  // initial state instead of calling setState in the effect.
  const [state, setState] = useState<State>(
    token ? { kind: "checking" } : { kind: "error" },
  );
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);
  const submitLockRef = useRef(false);
  const validateLockRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Validate the token once on mount WITHOUT consuming it, to learn how the
  // user can confirm account ownership. Shared between the initial auto-run
  // and the transient-failure retry button.
  const runValidate = useCallback(async (retry = false) => {
    if (!token || validateLockRef.current) return;
    validateLockRef.current = true;
    if (retry) setRetrying(true);
    else setState({ kind: "checking" });
    try {
      const info = await validateAccountLink(token);
      if (mountedRef.current) setState({ kind: "confirm", info });
    } catch (err) {
      if (!mountedRef.current) return;
      setState(isDeadLinkError(err)
        ? { kind: "error" }
        : { kind: "transient", error: err });
    } finally {
      validateLockRef.current = false;
      if (mountedRef.current) setRetrying(false);
    }
  }, [token]);

  useEffect(() => {
    mountedRef.current = true;
    if (token && !startedRef.current) {
      startedRef.current = true;
      void runValidate();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [token, runValidate]);

  useEffect(() => {
    // An invalid field can receive focus only after the pending state has
    // released it. Use the same named-control lookup as the sign-in form.
    if (passwordError && !submitting) {
      const field = formRef.current?.elements.namedItem("password");
      if (field instanceof HTMLElement) field.focus();
    }
  }, [passwordError, submitting]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || state.kind !== "confirm" || submitLockRef.current || submitting) return;
    setActionError(null);
    if (!password) {
      setPasswordError(t.passwordRequired);
      const field = event.currentTarget.elements.namedItem("password");
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    // This confirms an existing password. Never trim, normalize, sanitize or
    // apply new-password strength rules: the server needs the exact value.
    // The ref locks synchronously before React disables the controls; the
    // emailed token is single-use and must never be submitted twice at once.
    submitLockRef.current = true;
    setPasswordError(null);
    setSubmitting(true);
    try {
      await completeAccountLink(token, password);
      if (mountedRef.current) {
        setPassword("");
        setState({ kind: "success" });
      }
    } catch (e) {
      if (!mountedRef.current) return;
      const code = backendCode(e);
      if (code === "CUSTOMER_AUTH.E38") {
        // Wrong password — keep the form so the user can retry.
        setPasswordError(t.wrongPassword);
      } else if (code === "GOOGLE_LOGIN_REQUIRED") {
        // Passwordless (Google-only) account — only Google can confirm it.
        setState({
          kind: "confirm",
          info: { ...state.info, hasPassword: false, googleLinked: true },
        });
        setPassword("");
      } else if (isDeadLinkError(e)) {
        setState({ kind: "error" });
        setPassword("");
      } else {
        // Transport failures, 429, SESSION_CHANGED and unknown errors do not
        // prove a bad password or dead link. Preserve the form for recovery.
        setActionError(e);
      }
    } finally {
      submitLockRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  }

  // Google path: full-page redirect through /auth/callback. The backend
  // checks the bound Google identity; the callback owns any marketplace-access
  // confirmation, collision or failure panels. The emailed token stays unused.

  const loginHref = `${localeHref(locale, "auth")}?mode=login`;

  if (state.kind === "checking") return <VerificationLoading />;

  if (state.kind === "success") {
    return (
      <VerificationLayout title={t.successHeading} body={<p>{t.successBody}</p>}>
        <div className={styles.resultActions}>
          <Link href={defaultPostAuthTarget(locale)} className={`${styles.primaryLink} tap zw-btn`}>
            {t.continueCta}
          </Link>
        </div>
      </VerificationLayout>
    );
  }

  if (state.kind === "error") {
    return (
      <VerificationLayout title={t.errorHeading} body={<p>{t.errorBody}</p>}
        icon={<Link2Off size={28} strokeWidth={1.6} />} tone="warning">
        <div className={styles.resultActions}>
          <Link href={loginHref} className={`${styles.primaryLink} tap zw-btn`}>
            {t.backToLogin}
          </Link>
        </div>
      </VerificationLayout>
    );
  }

  if (state.kind === "transient") {
    return (
      <VerificationLayout title={dict.errors.linkCheckFailedHeading}
        body={<p>{dict.errors.linkCheckFailedBody}</p>}
        icon={<WifiOff size={28} strokeWidth={1.6} />} tone="warning">
        <div className={styles.resultActions}>
          <InlineError>{authErrorMessage(state.error, dict.errors, dictionary.errors)}</InlineError>
          <Button size="lg" loading={retrying} onClick={() => void runValidate(true)} className={styles.submit}>
            {dictionary.errors.retry}
          </Button>
          <span role="status" className="sr-only">{retrying ? t.verifying : ""}</span>
        </div>
      </VerificationLayout>
    );
  }

  const { info } = state;
  const backLink = (
    <Link href={loginHref} className={styles.back}
      aria-disabled={submitting || undefined} tabIndex={submitting ? -1 : undefined}
      onNavigate={(event) => { if (submitting) event.preventDefault(); }}>
      <ArrowLeft size={16} aria-hidden="true" />
      {t.backToLogin}
    </Link>
  );

  return (
    <VerificationLayout title={t.confirmHeading}
      body={<p>{info.hasPassword ? t.confirmBody : t.googleOnlyBody}</p>}>
      <div className={styles.identity}>
        <Mail size={20} strokeWidth={1.6} aria-hidden="true" />
        <div className={styles.identityCopy}>
          <p className={styles.accountLabel}>{t.accountLabel}</p>
          <p className={styles.email}>{info.email}</p>
        </div>
      </div>

      {info.hasPassword ? (
        <form ref={formRef} onSubmit={handleSubmit} className={styles.form} aria-busy={submitting}
          aria-describedby={actionError ? "account-link-error" : undefined} noValidate>
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
          {actionError !== null && (
            <InlineError id="account-link-error">
              {authErrorMessage(actionError, dict.errors, dictionary.errors)}
            </InlineError>
          )}
          <Button type="submit" size="lg" loading={submitting} className={styles.submit}
            style={{ whiteSpace: "normal", lineHeight: 1.4 }}>
            {t.confirm}
          </Button>
          <span role="status" className="sr-only">{submitting ? t.confirming : ""}</span>

          {GOOGLE_CLIENT_ID && info.googleLinked && (
            <div>
              <div className={styles.divider}>{t.orDivider}</div>
              <GoogleSignInButton intent="login" locale={locale} disabled={submitting} />
            </div>
          )}
          {backLink}
        </form>
      ) : (
        <div className={styles.googleOnly}>
          <GoogleSignInButton intent="login" locale={locale} />
          {backLink}
        </div>
      )}
    </VerificationLayout>
  );
}
