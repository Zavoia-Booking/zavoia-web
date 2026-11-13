"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useTranslation } from "@/i18n/useTranslation";
import { Button, Icon, InlineError, useToast } from "@/components/ui";
import { authErrorMessage } from "@/lib/api/auth-error-messages";
import { useAuth } from "@/lib/auth/useAuth";
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from "@/lib/validation";
import styles from "./account-content.module.css";
import disclosure from "@/components/ui/disclosure-motion.module.css";

type AcctDict = Dictionary["account"];
type Field = "next" | "confirm";

const ERROR_ID = "create-password-error";

/**
 * Login & security → "Create password", shown instead of the change-password
 * card when the account has no password (Google- or Apple-only). Posts to
 * POST /marketplace/auth/set-password, which applies the register password
 * rule (min 8 + PASSWORD_REGEX) and keeps the current session. Once it
 * succeeds `user.hasPassword` is true and the change-password card returns.
 */
export function CreatePasswordCard({
  t,
  open,
  onOpenChange,
}: {
  t: AcctDict;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dictionary = useTranslation().dict;
  const toast = useToast();
  const { createPassword } = useAuth();
  const c = t.createPassword;

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<Field | null>(null);
  const [saving, setSaving] = useState(false);
  const nextRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);
  const lockRef = useRef(false);

  function fail(message: string, field: Field) {
    setError(message);
    setInvalidField(field);
    (field === "next" ? nextRef : confirmRef).current?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (lockRef.current) return;
    setError(null);
    setInvalidField(null);
    if (next.length < PASSWORD_MIN_LENGTH) return fail(t.password.tooShort, "next");
    if (!PASSWORD_REGEX.test(next)) return fail(t.password.weak, "next");
    if (next !== confirm) return fail(t.password.mismatch, "confirm");
    lockRef.current = true;
    setSaving(true);
    try {
      await createPassword(next);
      setNext("");
      setConfirm("");
      toast(c.createdToast, "check");
      onOpenChange(false);
    } catch (err) {
      fail(authErrorMessage(err, dictionary.auth.errors, dictionary.errors), "next");
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (value: string) => void,
    ref: React.RefObject<HTMLInputElement | null>,
    invalid: boolean,
  ) => (
    <label htmlFor={id} style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--c-700)",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        id={id}
        ref={ref}
        type="password"
        value={value}
        autoComplete="new-password"
        disabled={saving}
        onChange={(event) => set(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? ERROR_ID : undefined}
        style={{
          width: "100%",
          maxWidth: 360,
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 10,
          border: invalid
            ? "1px solid var(--s-error-600)"
            : "1px solid var(--account-field-border, rgba(28,28,26,0.18))",
          fontSize: 16,
          color: "var(--c-900)",
          background: "#fff",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </label>
  );

  return (
    <div className={styles.settingsGroup}>
      <button
        type="button"
        className="tap zw-hover-row"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls="account-create-password-fields"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          textAlign: "left",
          padding: "20px 0",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <Icon name="lock" size={20} color="var(--c-700)" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.012em",
              color: "var(--c-900)",
            }}
          >
            {c.title}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              color: "var(--c-600)",
              marginTop: 2,
            }}
          >
            {c.caption}
          </span>
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--c-900)",
            textDecoration: "underline",
            flexShrink: 0,
          }}
        >
          {c.action}
        </span>
      </button>
      <Collapsible.Root open={open} className={disclosure.root}>
        <Collapsible.Content
          id="account-create-password-fields"
          className={styles.formReveal}
          inert={!open}
          aria-hidden={!open}
        >
          <div className={styles.formRevealBody}>
            <div style={{ padding: "20px 0", borderTop: "1px solid rgba(28,28,26,0.06)" }}>
              <form
                onSubmit={submit}
                style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 360 }}
              >
                {field("create-password-new", c.new, next, setNext, nextRef, invalidField === "next")}
                {field(
                  "create-password-confirm",
                  c.confirm,
                  confirm,
                  setConfirm,
                  confirmRef,
                  invalidField === "confirm",
                )}
                <div style={{ fontSize: 13.5, color: "var(--c-600)" }}>{t.password.rules}</div>
                {error && (
                  <InlineError id={ERROR_ID} style={{ marginTop: 4 }}>
                    {error}
                  </InlineError>
                )}
                <div>
                  <Button
                    loading={saving}
                    kind="primary"
                    size="md"
                    type="submit"
                    disabled={saving || !next || !confirm}
                  >
                    {c.submit}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
