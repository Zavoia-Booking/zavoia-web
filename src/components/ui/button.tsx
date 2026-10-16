"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { Spinner } from "./spinner";

export type ButtonKind = "primary" | "accent" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  children?: ReactNode;
  /** Keep the action's label and geometry while its request is pending. */
  loading?: boolean;
  spinnerSize?: number;
}

const LOOKS: Record<ButtonKind, CSSProperties> = {
  primary: { background: "var(--c-ink)", color: "#fff", border: "1px solid var(--c-ink)" },
  accent: { background: "var(--p-500)", color: "#fff", border: "1px solid var(--p-500)" },
  secondary: { background: "#fff", color: "var(--c-900)", border: "1px solid rgba(28,28,26,0.14)" },
  ghost: { background: "transparent", color: "var(--c-800)", border: "1px solid transparent" },
};

export function Button({
  kind = "primary",
  size = "md",
  children,
  disabled = false,
  loading,
  spinnerSize = 16,
  className,
  style,
  type = "button",
  ...rest
}: ButtonProps) {
  const pad = size === "lg" ? "15px 28px" : size === "sm" ? "8px 14px" : "11px 20px";
  const fs = size === "lg" ? 16 : size === "sm" ? 13 : 14.5;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={["tap", "zw-btn", className].filter(Boolean).join(" ")}
      style={{
        ...LOOKS[kind],
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        borderRadius: "var(--r-full)",
        cursor: disabled || loading ? "default" : "pointer",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        opacity: disabled || loading ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        position: loading !== undefined ? "relative" : undefined,
        ...style,
      }}
      {...rest}
      aria-busy={loading || rest["aria-busy"] || undefined}
    >
      {loading !== undefined ? (
        <>
          {/* Opacity preserves the accessible action name as well as its size. */}
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "inherit", opacity: loading ? 0 : 1 }}>
            {children}
          </span>
          {loading && (
            <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <Spinner size={spinnerSize} color="currentColor" />
            </span>
          )}
        </>
      ) : children}
    </button>
  );
}
