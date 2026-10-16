"use client";

import { useAuthMessages } from "@/app/[locale]/auth/_components/auth-messages";
import { useEffect, useId, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { errorMessage } from "@/lib/api/error-messages";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/useAuth";
import { useRetainedAuthAction } from "@/lib/auth/retained-flow";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { Spinner } from "@/components/ui/spinner";
import type { AccountLinkNeededDetails } from "@/lib/auth/types";

/**
 * Shown when login/register/Google hits the 409
 * `account_exists_needs_marketplace_access`. Access is enabled ONLY through
 * the emailed link (which then asks for password or Google confirmation), so the sole
 * action here is requesting that email — there is deliberately no instant
 * "enable access" path.
 */
export function EnableAccessPanel({
  locale,
  details,
  onCancel,
  flowKey,
}: {
  locale: Locale;
  details: AccountLinkNeededDetails;
  onCancel: () => void;
  /** Callback identity keeps a sent email/pending request across locale changes. */
  flowKey?: string;
}) {
  const dictionary = useAuthMessages();
  const dict = dictionary.auth;
  const t = dict.enableAccess;
  const { sendAccountLink } = useAuth();

  const instance = useId();
  const headingId = `${instance}-heading`;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const action = useRetainedAuthAction(
    JSON.stringify(["enable-access", flowKey ?? instance, details.email]),
  );
  const sending = action.status === "pending";
  const sent = action.status === "success";
  const alreadyRequested =
    action.status === "error" &&
    action.error instanceof ApiError &&
    action.error.status === 429 &&
    action.error.code === "token_already_sent";
  const view = alreadyRequested ? "existing" : sent ? "sent" : "request";
  const showConfirmation = view !== "request";
  const heading = alreadyRequested
    ? t.alreadyRequestedHeading
    : sent
      ? t.sentHeading
      : t.heading;
  const confirmationBody = alreadyRequested ? t.alreadyRequestedBody : t.sentBody;

  // The focused form is replaced by this panel. Orient keyboard users on entry
  // and on completion. Native focus also reveals the heading if the longer
  // registration form had been scrolled down before it was replaced.
  useEffect(() => {
    headingRef.current?.focus();
  }, [view]);

  function handleSendLink() {
    void action.run(async () => {
      // The API returns a neutral success for unknown/existing accounts. A
      // rejected request is a real failure and must remain retryable.
      await sendAccountLink(details.email, locale);
    }).catch(() => {}); // The retained action exposes the failure below.
  }

  return (
    <section
      className="auth-access-panel"
      aria-labelledby={headingId}
      aria-busy={sending}
    >
      <span role="status" className="sr-only">
        {showConfirmation ? `${confirmationBody} ${t.spamHint}` : ""}
      </span>
      <div key={view} className="auth-access-state">
        <header className="auth-access-header">
          <h1
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="auth-access-heading"
          >
            {heading}
          </h1>
          {!showConfirmation && (
            <p className="auth-access-intro">{t.explanation}</p>
          )}
        </header>

        <div className="auth-access-details">
          <div className="auth-access-identity">
            <p className="auth-access-label">{t.emailLabel}</p>
            <p className="auth-access-email">{details.email}</p>
          </div>

          <div className="auth-access-copy">
            {showConfirmation ? (
              <>
                <p>{confirmationBody}</p>
                <p className="auth-access-hint">{t.spamHint}</p>
              </>
            ) : (
              <p>{t.nextStep}</p>
            )}
          </div>
        </div>

        <div className="auth-access-footer">
          {action.status === "error" && !alreadyRequested && (
            <InlineError>
              {errorMessage(action.error, dictionary.errors, t.error)}
            </InlineError>
          )}

          <div className="auth-access-actions">
            {!showConfirmation && (
              <Button
                onClick={handleSendLink}
                disabled={sending}
                className="auth-access-button"
                style={{ whiteSpace: "normal", paddingBlock: 10, lineHeight: 1.4 }}
              >
                {sending && (
                  <span aria-hidden="true">
                    <Spinner size={16} color="currentColor" />
                  </span>
                )}
                {sending ? t.sending : t.sendLink}
              </Button>
            )}

            <Button
              kind="secondary"
              onClick={onCancel}
              disabled={sending}
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
