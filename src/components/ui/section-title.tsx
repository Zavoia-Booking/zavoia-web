"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./icon";
import { Kicker } from "./kicker";
import styles from "./section-title.module.css";

export interface SectionTitleProps {
  kicker?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  actionTitle?: string;
  href?: string;
  onAction?: () => void;
  className?: string;
  style?: CSSProperties;
}

const actionStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  cursor: "pointer",
  padding: "4px 0",
  color: "var(--c-700)",
  fontSize: 14,
  fontWeight: 600,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  textDecoration: "none",
};

// Editorial section header. Ported from ZwSectionTitle. Marked 'use client'
// because the optional action attaches an onClick handler.
export function SectionTitle({
  kicker,
  title,
  action,
  actionTitle,
  href,
  onAction,
  className,
  style,
}: SectionTitleProps) {
  const linkTitle = actionTitle ?? ([
    typeof action === "string" ? action : undefined,
    typeof title === "string" ? title : undefined,
  ].filter(Boolean).join(": ") || undefined);
  const actionContent = (
    <>
      {action}
      <Icon name="chevR" size={18} color="var(--p-500)" className={styles.chevron} />
    </>
  );

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 22,
        ...style,
      }}
    >
      <div>
        {kicker && <Kicker style={{ marginBottom: 8 }}>{kicker}</Kicker>}
        <h2
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: "clamp(22px, 2.4vw, 30px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            color: "var(--c-900)",
          }}
        >
          {title}
        </h2>
      </div>
      {action && (href ? (
        <Link href={href} title={linkTitle} prefetch={false} className={`tap ${styles.action}`} style={actionStyle}>
          {actionContent}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={`tap ${styles.action}`} style={actionStyle}>
          {actionContent}
        </button>
      ))}
    </div>
  );
}
