"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import { useConsent } from "@/lib/consent/ConsentProvider";

// GDPR-compliant first-layer consent banner: Accept and Reject are equally
// prominent one-click actions (required — reject must be as easy as accept),
// nothing is pre-selected, and GA does not load until "granted". Reopened
// any time via the footer "Cookies" link (settingsOpen).

export function CookieBanner({ locale }: { locale: Locale }) {
  const { consent, ready, settingsOpen, grant, deny, closeSettings } = useConsent();
  const { dict } = useTranslation();
  const t = dict.consent;

  // Undecided visitors must choose; deciders only see it again on demand.
  const visible = ready && (consent === null || settingsOpen);
  if (!visible) return null;

  return (
    <aside className="zw-cookie-banner" role="dialog" aria-modal="false" aria-label={t.title}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--c-900)",
            flex: 1,
          }}
        >
          {t.title}
        </div>
        {consent !== null && (
          <button
            type="button"
            className="tap"
            onClick={closeSettings}
            aria-label={t.close}
            style={{
              background: "transparent",
              border: 0,
              padding: 2,
              cursor: "pointer",
              color: "var(--c-500)",
              lineHeight: 0,
            }}
          >
            <Icon name="x" size={16} color="currentColor" />
          </button>
        )}
      </div>

      <p
        className="txt-pretty"
        style={{
          margin: "8px 0 0",
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "var(--c-600)",
        }}
      >
        {t.body}{" "}
        <Link
          href={localeHref(locale, "terms", "cookie-policy")}
          className="zw-link"
          style={{ color: "var(--c-800)", fontWeight: 600, textDecoration: "underline" }}
        >
          {t.policyLink}
        </Link>
        .
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button kind="secondary" size="sm" onClick={deny} style={{ flex: 1 }}>
          {t.reject}
        </Button>
        <Button kind="primary" size="sm" onClick={grant} style={{ flex: 1 }}>
          {t.accept}
        </Button>
      </div>
    </aside>
  );
}
