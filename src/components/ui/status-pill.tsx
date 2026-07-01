"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";

export interface StatusPillProps {
  status: "open" | "closed" | "24-7" | string;
  closesAt?: string;
  dense?: boolean;
}

// Open/closed status indicator. Ported from ZwStatusPill. Labels are pulled
// from the i18n `common` namespace. Note: the prototype used "24/7" as the
// always-open value; the shared data shape uses "24-7" — both are accepted.
export function StatusPill({ status, closesAt, dense = false }: StatusPillProps) {
  const { dict } = useTranslation();
  const is247 = status === "24-7" || status === "24/7";
  const isOpen = status === "open" || is247;
  const color = isOpen ? "var(--s-success-600)" : "var(--c-500)";
  const label = is247 ? dict.common.open247 : isOpen ? dict.common.open : dict.common.closed;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dense ? 4 : 5,
        fontSize: dense ? 11.5 : 12.5,
        color: "var(--c-700)",
        letterSpacing: "-0.005em",
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }}
      />
      <span style={{ color, fontWeight: 600 }}>{label}</span>
      {isOpen && closesAt && (
        <span style={{ color: "var(--c-600)" }}>
          · {format(dict.common.closesAt, { time: closesAt })}
        </span>
      )}
    </span>
  );
}
