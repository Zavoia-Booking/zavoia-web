"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Close as DialogClose } from "@radix-ui/react-dialog";
import { ActionModal } from "@/app/[locale]/appointments/_components/actions/action-modal";
import { Button, Icon } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { TextareaField } from "@/components/ui/textarea-field";
import { useToast, type ToastHandle } from "@/components/ui/toast";
import { type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { createGuestTicket } from "@/lib/api/marketplace/support";
import { ApiError } from "@/lib/api/http";
import type { CreateTicketContext } from "@/lib/api/marketplace/types";
import { isValidEmail } from "@/lib/validation";
import {
  getPlainTextApiError,
  plainTextErrorMessage,
  SUPPORT_MESSAGE_MAX_LENGTH,
  validatePlainText,
} from "@/lib/validation/free-text";
import styles from "./report-issue.module.css";

type ReportDict = Dictionary["help"]["report"];

// The guest API receives the title and body together as one message.
const GUEST_MESSAGE_MAX_LENGTH = 10000;

function isDismissalTarget(target: EventTarget | null): boolean {
  return target instanceof Element &&
    target.closest("[data-action-modal-close], [data-report-dismiss]") !== null;
}

/** Guest reporting for the help centre and contextual listing reports. */
export function ReportIssue({ t, locale, context, triggerLabel, className }: {
  t: ReportDict;
  locale: Locale;
  context?: CreateTicketContext;
  triggerLabel?: string;
  className?: string;
}) {
  const { dict } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<{ email: string } | null>(null);
  const [title, setTitle] = useState(context?.label ?? "");
  const [titleTouched, setTitleTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const formId = useId();
  const titleErrorId = useId();
  const emailErrorId = useId();
  const successDescriptionId = useId();
  const inFlight = useRef(false);
  const closing = useRef(false);
  const notification = useRef<ToastHandle | null>(null);

  useEffect(() => () => notification.current?.dismiss(), []);
  useEffect(() => { if (sent) successRef.current?.focus({ preventScroll: true }); }, [sent]);

  // Context labels can exceed the title's typing limit, but remain valid in
  // the API's combined message. Preserve that existing context verbatim.
  const titleIssue = validatePlainText(title, { required: true, maxLength: GUEST_MESSAGE_MAX_LENGTH });
  const titleError = titleIssue === "required"
    ? titleTouched ? t.modal.titleRequired : null
    : plainTextErrorMessage(titleIssue, dict.textarea, GUEST_MESSAGE_MAX_LENGTH, locale);
  const emailValid = isValidEmail(email);
  const emailError = emailTouched && !emailValid
    ? email.trim() ? dict.auth.errors.emailInvalid : dict.auth.errors.emailRequired
    : null;
  const canSubmit = !submitting && title.trim().length > 0 && emailValid &&
    validatePlainText(message, { required: true, maxLength: SUPPORT_MESSAGE_MAX_LENGTH }) === null &&
    titleIssue === null;

  const clearFeedback = () => {
    notification.current?.dismiss();
    notification.current = null;
    setMessageError(null);
  };

  const submit = async () => {
    if (inFlight.current || closing.current) return;
    setTitleTouched(true);
    setEmailTouched(true);
    const messageIssue = validatePlainText(message, {
      required: true,
      maxLength: SUPPORT_MESSAGE_MAX_LENGTH,
    });
    if (titleIssue || messageIssue || !emailValid) {
      if (titleIssue) titleRef.current?.focus();
      else if (!emailValid) emailRef.current?.focus();
      else messageRef.current?.focus();
      return;
    }
    if (!canSubmit) return;
    const fullMessage = `${title.trim()}\n\n${message.trim()}`;
    const payloadIssue = validatePlainText(fullMessage, {
      required: true,
      maxLength: GUEST_MESSAGE_MAX_LENGTH,
    });
    if (payloadIssue) {
      setMessageError(plainTextErrorMessage(payloadIssue, dict.textarea, GUEST_MESSAGE_MAX_LENGTH, locale));
      messageRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    clearFeedback();
    const cleanEmail = email.trim().toLowerCase();
    try {
      // The API has no title column: the CRM previews its first message line.
      await createGuestTicket({
        email: cleanEmail,
        locale,
        category: "bug",
        ...(context ? { context } : {}),
        message: fullMessage,
      });
      setSent({ email: cleanEmail });
      setTitle(context?.label ?? "");
      setTitleTouched(false);
      setEmail("");
      setEmailTouched(false);
      setMessage("");
    } catch (err) {
      const validationIssue = getPlainTextApiError(err);
      if (validationIssue) {
        setMessageError(plainTextErrorMessage(validationIssue, dict.textarea, GUEST_MESSAGE_MAX_LENGTH, locale));
        messageRef.current?.focus();
      } else {
        notification.current = toast(
          err instanceof ApiError && err.status === 429 ? t.modal.errorRateLimit : t.modal.error,
          "warn", undefined, "error",
        );
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const close = () => {
    if (inFlight.current) return;
    closing.current = true;
    clearFeedback();
    setOpen(false);
    setSent(null);
  };

  const show = () => {
    closing.current = false;
    setTitleTouched(false);
    setEmailTouched(false);
    clearFeedback();
    setOpen(true);
  };

  return (
    <div className={triggerLabel ? undefined : styles.support}>
      {triggerLabel ? (
        <button type="button" className={className} onClick={show}>
          {triggerLabel}<Icon name="arrowUR" size={13} />
        </button>
      ) : (
        <>
          <h2 className={styles.supportTitle}>{t.title}</h2>
          <p className={styles.supportCopy}>{t.sub}</p>
          <Button kind="primary" onClick={show} className={styles.supportButton}>
            {t.cta}<Icon name="arrowR" size={17} />
          </Button>
        </>
      )}

      {open && (
        <ActionModal
          title={sent ? t.modal.success.title : t.modal.title}
          subtitle={sent ? undefined : t.modal.intro}
          width={sent ? 520 : 620}
          className={styles.modal}
          initialFocusRef={titleRef}
          dismissible={!submitting}
          onClosing={() => { closing.current = true; clearFeedback(); }}
          onClose={close}
          footer={<div className={styles.actions}>
            {sent ? (
              <DialogClose asChild>
                <Button kind="primary" className={styles.actionButton}>
                  {t.modal.success.done}
                </Button>
              </DialogClose>
            ) : (
              <>
                <DialogClose asChild>
                  <Button kind="secondary" disabled={submitting} className={styles.actionButton} data-report-dismiss="">
                    {t.modal.cancel}
                  </Button>
                </DialogClose>
                <Button kind="accent" type="submit" form={formId} disabled={!canSubmit} loading={submitting}
                  className={styles.actionButton} style={{ border: 0 }}>
                  {t.modal.submit}
                </Button>
              </>
            )}
          </div>}
        >
          {sent ? (
            <div ref={successRef} className={styles.success} tabIndex={-1} role="group"
              aria-label={t.modal.success.title} aria-describedby={successDescriptionId}>
              <span className={styles.successIcon} aria-hidden="true"><Icon name="check" size={24} /></span>
              <div className={styles.successCopy} id={successDescriptionId}>
                <p>{t.modal.success.body}</p>
                <p className={styles.successEmail}>{sent.email}</p>
              </div>
            </div>
          ) : (
            <form id={formId} className={styles.form} noValidate aria-busy={submitting || undefined}
              onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              <div>
                <label className={styles.label}>
                  <span>{t.modal.titleLabel}</span>
                  <input ref={titleRef} value={title}
                    name="title" required
                    onChange={(event) => { setTitle(event.target.value); clearFeedback(); }}
                    onBlur={(event) => {
                      if (!closing.current && !isDismissalTarget(event.relatedTarget)) setTitleTouched(true);
                    }}
                    placeholder={t.modal.titlePlaceholder} maxLength={200} disabled={submitting}
                    aria-invalid={Boolean(titleError) || undefined}
                    aria-describedby={titleError ? titleErrorId : undefined}
                    className={styles.input} />
                </label>
                {titleError && <InlineError id={titleErrorId} className={styles.fieldError}>{titleError}</InlineError>}
              </div>
              <div>
                <label className={styles.label}>
                  <span>{t.modal.emailLabel}</span>
                  <input ref={emailRef} type="email" value={email}
                    name="email" required
                    onChange={(event) => { setEmail(event.target.value); clearFeedback(); }}
                    onBlur={(event) => {
                      if (!closing.current && !isDismissalTarget(event.relatedTarget)) setEmailTouched(true);
                    }}
                    placeholder={t.modal.emailPlaceholder} maxLength={254} disabled={submitting}
                    autoComplete="email" inputMode="email" className={styles.input}
                    aria-invalid={Boolean(emailError) || undefined}
                    aria-describedby={emailError ? emailErrorId : undefined} />
                </label>
                {emailError && <InlineError id={emailErrorId} className={styles.fieldError}>{emailError}</InlineError>}
              </div>
              <TextareaField ref={messageRef} label={t.modal.messageLabel} value={message}
                name="message"
                onChange={(event) => { setMessage(event.target.value); clearFeedback(); }}
                placeholder={t.modal.messagePlaceholder} rows={5} maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
                error={messageError} required disabled={submitting} />
            </form>
          )}
        </ActionModal>
      )}
    </div>
  );
}
