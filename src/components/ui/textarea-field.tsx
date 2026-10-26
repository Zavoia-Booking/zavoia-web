"use client";

import { useId, useState, type ComponentPropsWithRef } from "react";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import { plainTextErrorMessage, validatePlainText } from "@/lib/validation/free-text";
import { InlineError } from "./inline-error";
import styles from "./textarea-field.module.css";

export type TextareaFieldProps = Omit<ComponentPropsWithRef<"textarea">, "value" | "maxLength"> & {
  label: string;
  value: string;
  maxLength: number;
  /** Field-specific or server validation; request failures can remain beside the action. */
  error?: string | null;
};

/** Shared plain-text field. Recheck validatePlainText at submission boundaries too. */
export function TextareaField({
  label, value, maxLength, error, id, className, style, onBlur,
  required = false, rows = 4, "aria-describedby": describedBy,
  "aria-invalid": invalid, ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const countId = `${fieldId}-count`;
  const errorId = `${fieldId}-error`;
  const { dict, locale } = useTranslation();
  const [touched, setTouched] = useState(false);
  const reason = validatePlainText(value, { required, maxLength });
  const validation = reason === "required" && !touched ? null : reason;
  const message = error || plainTextErrorMessage(validation, dict.textarea, maxLength, locale);
  const ids = [describedBy, countId, message ? errorId : null].filter(Boolean).join(" ");

  return <div className={[styles.field, className].filter(Boolean).join(" ")}>
    <label className={styles.label} htmlFor={fieldId}>{label}</label>
    <textarea {...props} id={fieldId} value={value} maxLength={maxLength} rows={rows}
      required={required} className={styles.control}
      style={{ ...style, resize: "none", overflowY: "auto" }}
      aria-describedby={ids} aria-invalid={message ? true : invalid}
      onBlur={(event) => { setTouched(true); onBlur?.(event); }} />
    <span id={countId} className={styles.count}>
      {format(dict.textarea.characters, {
        count: new Intl.NumberFormat(locale).format(value.length),
        max: new Intl.NumberFormat(locale).format(maxLength),
      })}
    </span>
    {message && <InlineError id={errorId} className={styles.error}>{message}</InlineError>}
  </div>;
}
