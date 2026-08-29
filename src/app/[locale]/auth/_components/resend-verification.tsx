"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { ApiError } from "@/lib/api/http";
import { resendVerificationEmail } from "@/lib/api/customer-auth";
import { errorMessage } from "@/lib/api/error-messages";
import { AuthField } from "./auth-field";

export interface ResendVerificationProps {
  /**
   * Known address — renders the one-tap form (no input). Omit on the
   * verification-link page, where the visitor arrives from a dead link and the
   * address has to be asked for.
   */
  email?: string;
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
export function ResendVerification({ email: knownEmail }: ResendVerificationProps) {
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
        const res = await resendVerificationEmail(address);
        // Surface the backend's own neutral wording when it sends one, so the
        // enumeration-safe phrasing stays owned in one place.
        setSentMessage(res.message || t.sent);
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          startCooldown(err.retryAfterSeconds ?? 60);
          setError(null);
        } else {
          setError(errorMessage(err, dict.errors, t.failed));
        }
      } finally {
        setSending(false);
      }
    },
    [knownEmail, email, sending, cooldown, t.sent, t.failed, dict.errors, startCooldown],
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
      >
        {sending ? <Spinner size={16} color="#fff" /> : label}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
