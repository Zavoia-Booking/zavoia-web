"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export type ButtonKind = "primary" | "accent" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  children?: ReactNode;
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
      disabled={disabled}
      className={["tap", "zw-btn", className].filter(Boolean).join(" ")}
      style={{
        ...LOOKS[kind],
        padding: pad,
        fontSize: fs,
        fontWeight: 600,
        borderRadius: "var(--r-full)",
        cursor: disabled ? "default" : "pointer",
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
