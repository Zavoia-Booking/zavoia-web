"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { ApiError } from "@/lib/api/http";
import {
  resendAccountVerificationEmail,
  resendVerificationEmail,
} from "@/lib/api/customer-auth";
import { backendCode, errorMessage } from "@/lib/api/error-messages";
import { AuthField } from "./auth-field";
import { InlineError } from "@/components/ui/inline-error";

export interface ResendVerificationProps {
  /**
   * Known address — renders the one-tap form (no input). Omit on the
   * verification-link page, where the visitor arrives from a dead link and the
   * address has to be asked for.
   */
  email?: string;
  /**
   * Signed-in account screen: resend through the session's endpoint, which
   * enforces the shared 2-per-24h budget and reports when it's used up.
   */
  signedIn?: boolean;
}

/**
 * "Send me a new link" — POST /marketplace/auth/resend-verification.
 *
 * The backend answers with one neutral message in every case (unknown address,
 * already verified, actually re-sent) to avoid account enumeration, so this
 * shows that message verbatim on success and never claims an email was sent to
 * a specific address.
 *
 * The endpoint is rate-limited to 5 sends per 15 minutes; a 429 carries
 * `retryAfterSeconds`, which becomes a live countdown rather than a bare "try
 * again later".
 */
export function ResendVerification({ email: knownEmail, signedIn = false }: ResendVerificationProps) {
  const { dict } = useTranslation();
  const t = dict.auth.resendVerification;

  const [email, setEmail] = useState(knownEmail ?? "");
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((n) => {
        if (n <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }, []);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const address = (knownEmail ?? email).trim();
      if (!address || sending || cooldown > 0) return;
      setSending(true);
      setError(null);
      try {
        if (signedIn) await resendAccountVerificationEmail();
        else await resendVerificationEmail(address);
        // NOT `res.message || …`: the backend always returns a message code
        // (CUSTOMER_AUTH.S16), so the localized, equally neutral copy is used.
        setSentMessage(t.sent);
      } catch (err) {
        if (signedIn && backendCode(err) === "AUTH.E39") {
          // Shared resend budget used up — a short countdown would only fail again.
          setError(t.limitReached);
        } else if (err instanceof ApiError && err.status === 429) {
          startCooldown(err.retryAfterSeconds ?? 60);
          setError(null);
        } else {
          setError(errorMessage(err, dict.errors, t.failed));
        }
      } finally {
        setSending(false);
      }
    },
    [knownEmail, signedIn, email, sending, cooldown, t.sent, t.failed, t.limitReached, dict.errors, startCooldown],
  );

  if (sentMessage) {
    return (
      <p role="status" className="mt-4 text-sm text-zinc-600">
        {sentMessage}
      </p>
    );
  }

  const disabled = sending || cooldown > 0;
  const label = cooldown > 0
    ? format(t.retryIn, { seconds: String(cooldown) })
    : t.action;

  return (
    <form onSubmit={submit} className="mt-6" noValidate>
      {knownEmail == null && (
        <AuthField
          id="resend-email"
          type="email"
          label={dict.auth.fields.email}
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
      )}
      <Button
        kind="primary"
        size="md"
        type="submit"
        disabled={disabled || (knownEmail == null && email.trim() === "")}
        aria-label={label}
        aria-busy={sending}
        className="relative"
      >
        <span className={sending ? "invisible" : undefined} aria-hidden={sending || undefined}>
          {label}
        </span>
        {sending && (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <Spinner size={16} color="currentColor" />
          </span>
        )}
      </Button>
      {error && (
        <InlineError className="mt-2">
          {error}
        </InlineError>
      )}
    </form>
  );
}
