"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

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
  error,
  autoComplete,
  showPasswordLabel = "Show password",
  hidePasswordLabel = "Hide password",
}: {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const isEmail = type === "email";
  const inputType = isPassword && showPassword ? "text" : type;
  const hasAdornment = isPassword || isEmail;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-[10px] border bg-white px-3 text-[15px] text-ink shadow-[var(--sh-sm)] outline-none transition-all md:h-11 ${
            hasAdornment ? "pr-11" : ""
          } ${
            error
              ? "border-[var(--s-error-300)] bg-[var(--s-error-100)] focus:border-[var(--s-error-600)]"
              : "border-[rgba(28,28,26,0.14)] hover:border-[rgba(28,28,26,0.26)] focus:border-primary"
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
            tabIndex={-1}
            aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
            className="absolute top-1/2 right-3 flex -translate-y-1/2 cursor-pointer items-center justify-center text-primary transition-colors hover:text-p-600"
          >
            <EyeGlyph off={showPassword} />
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-[var(--s-error-600)]">
          {error}
        </p>
      )}
    </div>
  );
}
