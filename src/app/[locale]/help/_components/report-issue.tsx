"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon, Spinner } from "@/components/ui";
import { format, type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { createGuestTicket } from "@/lib/api/marketplace/support";
import { ApiError } from "@/lib/api/http";

type ReportDict = Dictionary["help"]["report"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(28,28,26,0.18)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14.5,
  color: "var(--c-900)",
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--c-800)",
  marginBottom: 6,
};

// "Report an issue" — Help Centre aside card + guest report modal. Works
// signed out: the report goes to the PUBLIC guest ticket endpoint with the
// visitor's email as the only return channel (confirmation + replies arrive
// by email; there is no in-app thread for guests).
export function ReportIssue({ t, locale }: { t: ReportDict; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<{ email: string; reference: string } | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Escape closes + body scroll lock while the dialog is up (same recipe as
  // the search overlay — inline fixed backdrop, no portal).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const canSubmit =
    !submitting &&
    title.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    message.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    try {
      // The backend has no title column — the title travels as the first line
      // of the message, which is also what the CRM shows as the preview.
      const receipt = await createGuestTicket({
        email: cleanEmail,
        locale,
        category: "bug",
        message: `${title.trim()}\n\n${message.trim()}`,
      });
      setSent({ email: cleanEmail, reference: receipt.uuid });
      setTitle("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? t.modal.errorRateLimit
          : t.modal.error,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setError(null);
    setSent(null);
  };

  return (
    <div className="zw-help-card">
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--c-900)",
        }}
      >
        {t.title}
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={{ fontSize: 12.5, color: "var(--c-600)" }}>{t.sub}</span>
      </div>
      <Button
        kind="primary"
        size="md"
        onClick={() => setOpen(true)}
        style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
      >
        {t.cta}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="zw-report-issue-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(28,28,26,0.42)",
          }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="zv-fade"
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "var(--sh-lg)",
              padding: "24px 24px 20px",
              maxWidth: 480,
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            {sent ? (
              <div style={{ textAlign: "center", padding: "8px 4px 4px" }}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--p-600)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="check" size={22} color="#fff" />
                </span>
                <h2
                  id="zw-report-issue-title"
                  style={{
                    margin: "16px 0 0",
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--c-900)",
                  }}
                >
                  {t.modal.success.title}
                </h2>
                <p
                  className="txt-pretty"
                  style={{
                    margin: "10px 0 0",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    color: "var(--c-600)",
                  }}
                >
                  {format(t.modal.success.body, { email: sent.email })}
                </p>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    color: "var(--c-500)",
                    wordBreak: "break-all",
                  }}
                >
                  {t.modal.success.reference}: {sent.reference}
                </div>
                <div style={{ marginTop: 20 }}>
                  <Button kind="primary" size="md" onClick={close}>
                    {t.modal.success.done}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2
                  id="zw-report-issue-title"
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--c-900)",
                  }}
                >
                  {t.modal.title}
                </h2>
                <p
                  className="txt-pretty"
                  style={{
                    margin: "8px 0 18px",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: "var(--c-600)",
                  }}
                >
                  {t.modal.intro}
                </p>

                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={labelStyle}>{t.modal.titleLabel}</span>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.modal.titlePlaceholder}
                    maxLength={200}
                    disabled={submitting}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 14 }}>
                  <span style={labelStyle}>{t.modal.emailLabel}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.modal.emailPlaceholder}
                    maxLength={254}
                    disabled={submitting}
                    autoComplete="email"
                    inputMode="email"
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 18 }}>
                  <span style={labelStyle}>{t.modal.messageLabel}</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.modal.messagePlaceholder}
                    rows={5}
                    maxLength={9500}
                    disabled={submitting}
                    style={{ ...fieldStyle, resize: "vertical" }}
                  />
                </label>

                {error && (
                  <p
                    role="alert"
                    style={{
                      margin: "0 0 14px",
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "var(--err, #B3261E)",
                    }}
                  >
                    {error}
                  </p>
                )}

                <div
                  style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
                >
                  <Button
                    kind="secondary"
                    size="md"
                    onClick={close}
                    disabled={submitting}
                  >
                    {t.modal.cancel}
                  </Button>
                  <Button
                    kind="primary"
                    size="md"
                    onClick={submit}
                    disabled={!canSubmit}
                  >
                    {submitting ? (
                      <Spinner size={16} color="#fff" />
                    ) : (
                      t.modal.submit
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
