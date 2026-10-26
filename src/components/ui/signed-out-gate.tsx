"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon, type IconName } from "./icon";
import { Button } from "./button";
import styles from "./signed-out-gate.module.css";

export interface SignedOutGateProps {
  icon?: IconName;
  /** Optional decorative illustration for the centered, full-height layout. */
  artwork?: ReactNode;
  title: ReactNode;
  body: ReactNode;
  cta?: string;
  onCta?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

// Shared lock screen for personal pages. Pure presentational port of
// ZwSignedOutGate — no window.* / app-global coupling. The default CTA
// label comes from i18n common.signIn.
export function SignedOutGate({
  icon = "user",
  artwork,
  title,
  body,
  cta,
  onCta,
  secondaryLabel,
  onSecondary,
}: SignedOutGateProps) {
  const { dict } = useTranslation();
  const ctaLabel = cta ?? dict.common.signIn;
  if (artwork) {
    return (
      <div className={styles.illustrated}>
        <div className={`zw-container ${styles.inner}`}>
          <div className={styles.artwork} aria-hidden="true">{artwork}</div>
          <div className={styles.copy}>
            <h1>{title}</h1>
            <p>{body}</p>
          </div>
          <div className={styles.actions}>
            <Button kind="primary" size="lg" onClick={onCta}>{ctaLabel}</Button>
            {secondaryLabel && (
              <Button kind="secondary" size="lg" onClick={onSecondary}>{secondaryLabel}</Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="zw-container"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(80px, 12vw, 150px) var(--gutter)",
      }}
    >
      <span
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--c-mist)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={26} color="var(--c-700)" />
      </span>
      <h1
        className="txt-balance"
        style={{
          margin: "22px 0 0",
          fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color: "var(--c-900)",
        }}
      >
        {title}
      </h1>
      <p
        className="txt-pretty"
        style={{
          margin: "14px 0 26px",
          fontSize: 15.5,
          lineHeight: 1.6,
          color: "var(--c-600)",
          maxWidth: 400,
        }}
      >
        {body}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Button kind="primary" size="lg" onClick={onCta}>
          {ctaLabel}
        </Button>
        {secondaryLabel && (
          <Button kind="secondary" size="lg" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
