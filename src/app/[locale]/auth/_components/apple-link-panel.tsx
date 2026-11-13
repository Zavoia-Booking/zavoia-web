"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { Spinner } from "@/components/ui/spinner";
import type { Locale } from "@/i18n/locales";
import { appleErrorMessage } from "@/lib/api/auth-error-messages";
import { appleSendLinkCode } from "@/lib/api/customer-auth";
import { backendCode } from "@/lib/api/error-messages";
import { defaultPostAuthTarget, safeRedirectTarget } from "@/lib/auth/redirects";
import { useRetainedAuthAction, useRetainedAuthState } from "@/lib/auth/retained-flow";
import type { AppleUnlinkedDetails } from "@/lib/auth/types";
import { useAuth } from "@/lib/auth/useAuth";
import { appleOutcomeFromError, type AppleOutcome } from "./apple-outcome";
import { AuthField } from "./auth-field";
import { useAuthMessages } from "./auth-messages";

const CODE_RE = /^\d{6}$/;

function isStepExpired(error: unknown): boolean {
  return backendCode(error) === "APPLE_STEP_EXPIRED";
}

/**
 * Shown after POST /marketplace/auth/apple returned 409
 * `account_exists_unlinked_apple`: Apple shared an email that already has a
 * Zavoia account, which must be proven before Apple is connected — its
 * password, or (accounts without one) a 6-digit code emailed to it. POST
 * /apple/link/verify then signs in, or returns the confirm-access 409 for a
 * business account, which `onOutcome` hands back to the caller.
 */
export function AppleLinkPanel({
  locale,
  details,
  redirect,
  onOutcome,
  onCancel,
}: {
  locale: Locale;
  details: AppleUnlinkedDetails;
  /** Post-auth target; validated again before navigating. */
  redirect?: string | null;
  onOutcome: (outcome: AppleOutcome) => void;
  onCancel: () => void;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.appleLink;
  const router = useRouter();
  const { status, verifyAppleLink } = useAuth();
  const usesPassword = details.proofs.includes("password");

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const action = useRetainedAuthAction(`apple-link:${details.txId}`);
  const submitting = action.status === "pending" || action.status === "success";

  // Only "a code was sent to …" survives a locale remount; never the code.
  const [sentTo, setSentTo] = useRetainedAuthState<string>(`apple-link-sent:${details.txId}`);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<unknown>(null);
  const sendLockRef = useRef(false);
  const mountedRef = useRef(true);

  const verifyError = action.status === "error" ? action.error : null;
  const expired = isStepExpired(verifyError) || isStepExpired(sendError);
  const busy = submitting || sending;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(
        safeRedirectTarget(redirect ?? null, locale, defaultPostAuthTarget(locale)),
      );
    }
  }, [status, locale, router, redirect]);

  async function handleSendCode() {
    if (sendLockRef.current || submitting || expired) return;
    sendLockRef.current = true;
    setSending(true);
    setSendError(null);
    try {
      const result = await appleSendLinkCode(details.txId, locale);
      setSentTo(result.email || details.email);
    } catch (error) {
      if (mountedRef.current) setSendError(error);
    } finally {
      sendLockRef.current = false;
      if (mountedRef.current) setSending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || expired) return;
    if (usesPassword && !password) {
      setValidation(dict.errors.passwordRequired);
      return;
    }
    if (!usesPassword && !CODE_RE.test(code)) {
      setValidation(t.codeInvalid);
      return;
    }
    setValidation(null);
    const proof = usesPassword ? { password } : { code };
    void action.run(async () => {
      try {
        // The password/code lives only in this request, never in retained data.
        await verifyAppleLink(details.txId, proof, locale);
      } catch (error) {
        const outcome = appleOutcomeFromError(error);
        if (!outcome) throw error;
        onOutcome(outcome);
      }
    }).catch(() => {});
  }

  const error =
    validation ??
    (verifyError !== null
      ? appleErrorMessage(verifyError, dict.errors, dictionary.errors)
      : sendError !== null
        ? appleErrorMessage(sendError, dict.errors, dictionary.errors)
        : null);

  const submitButton = expired ? (
    <button
      type="button"
      onClick={onCancel}
      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
    >
      {t.startAgain}
    </button>
  ) : (
    <button
      type="submit"
      disabled={busy}
      aria-label={t.submit}
      aria-busy={submitting}
      className="relative w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={submitting ? "invisible" : undefined} aria-hidden={submitting || undefined}>
        {t.submit}
      </span>
      {submitting && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <Spinner size={16} color="currentColor" />
        </span>
      )}
    </button>
  );

  const errorNode = error ? (
    <InlineError className="rounded-md border border-[var(--s-error-300)] bg-[var(--s-error-100)] px-3 py-2">
      {error}
    </InlineError>
  ) : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-4 text-sm text-zinc-600">
        {(usesPassword ? t.passwordExplanation : t.codeExplanation).replace("{email}", details.email)}
      </p>

      <div className="mt-6">
        <span className="block text-sm font-medium text-zinc-800">{dict.fields.email}</span>
        <p className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {details.email}
        </p>
      </div>

      {usesPassword || sentTo ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
          {usesPassword ? (
            <AuthField
              id="apple-link-password"
              type="password"
              label={dict.fields.password}
              value={password}
              onChange={(value) => {
                setPassword(value);
                setValidation(null);
              }}
              autoComplete="current-password"
              showPasswordLabel={dict.fields.showPassword}
              hidePasswordLabel={dict.fields.hidePassword}
              disabled={busy}
            />
          ) : (
            <>
              <p className="text-sm text-zinc-600" role="status">
                {t.codeSent.replace("{email}", sentTo ?? details.email)}
              </p>
              <AuthField
                id="apple-link-code"
                label={t.codeLabel}
                value={code}
                onChange={(value) => {
                  setCode(value.replace(/\D/g, "").slice(0, 6));
                  setValidation(null);
                }}
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={busy}
              />
            </>
          )}

          {errorNode}
          {submitButton}
          <span role="status" className="sr-only">
            {submitting ? t.submitting : sending ? t.sendingCode : ""}
          </span>

          {!usesPassword && !expired && (
            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={busy}
              className="w-full text-center text-sm font-medium text-zinc-700 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t.resendCode}
            </button>
          )}
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          {errorNode}
          {expired ? (
            submitButton
          ) : (
            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={sending}
              aria-label={t.sendCode}
              aria-busy={sending}
              className="relative w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={sending ? "invisible" : undefined} aria-hidden={sending || undefined}>
                {t.sendCode}
              </span>
              {sending && (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  <Spinner size={16} color="currentColor" />
                </span>
              )}
            </button>
          )}
          <span role="status" className="sr-only">{sending ? t.sendingCode : ""}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="mt-6 w-full text-center text-sm text-zinc-500 underline-offset-2 transition hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t.cancel}
      </button>
    </div>
  );
}
