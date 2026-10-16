"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { InlineError } from "@/components/ui/inline-error";
import "./auth-field.css";

/* Inline eye / eye-off glyphs for the password visibility toggle — the
   shared Icon set has no eye, and these are only used here. */
function EyeGlyph({ off }: { off?: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function AuthField({
  id,
  type = "text",
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  showErrorIcon = true,
  autoComplete,
  disabled = false,
  required = false,
  describedBy,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
}: {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  showErrorIcon?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  describedBy?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const isEmail = type === "email";
  const inputType = isPassword && showPassword ? "text" : type;
  const hasAdornment = isPassword || isEmail;
  const description = [describedBy, error ? `${id}-error` : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  const errorNode = error ? (
    <InlineError
      id={`${id}-error`}
      showIcon={showErrorIcon}
      className="mt-1"
    >
      {error}
    </InlineError>
  ) : null;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={description}
          className={`zv-auth-input h-12 w-full rounded-[10px] border px-3 text-[15px] text-ink shadow-[var(--sh-sm)] outline-none disabled:cursor-not-allowed disabled:bg-c-100 disabled:text-c-600 md:h-11 ${
            hasAdornment ? "pr-11" : ""
          } ${
            error
              ? "border-[var(--s-error-600)] bg-[var(--s-error-100)] focus:border-[var(--s-error-600)]"
              : "border-c-500 bg-white enabled:hover:border-c-600 focus:border-primary"
          }`}
        />
        {isEmail && (
          <span
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
            aria-hidden="true"
          >
            <Icon name="email" size={16} color="var(--p-500)" />
          </span>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={showPassword}
            aria-controls={id}
            className="zv-auth-eye absolute top-1/2 right-0 flex min-h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[10px] text-primary hover:text-p-600 disabled:cursor-not-allowed disabled:text-c-600"
          >
            <EyeGlyph off={showPassword} />
          </button>
        )}
      </div>
      {errorNode}
    </div>
  );
}
