"use client";

import { type CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { LOCALES, type Locale } from "@/i18n/locales";

// Port of ZwFooter (docs/web-shell.jsx). All labels i18n'd.
// Language switch lives in the bottom bar (en/ro via localeHref).

export function Footer({ locale }: { locale: Locale }) {
  const { dict } = useTranslation();
  const t = dict.footer;

  const col: CSSProperties = { display: "flex", flexDirection: "column", gap: 11 };
  const head: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--c-500)",
    marginBottom: 4,
  };
  const link: CSSProperties = {
    background: "transparent",
    border: 0,
    padding: 0,
    fontSize: 14,
    color: "var(--c-700)",
    textAlign: "left",
    letterSpacing: "-0.01em",
    textDecoration: "none",
  };
  const monoLink: CSSProperties = {
    ...link,
    fontFamily: "var(--font-mono)",
    fontSize: 11.5,
    color: "var(--c-500)",
  };

  const fLink = (label: string, style: CSSProperties, ...segments: string[]) => (
    <Link
      href={localeHref(locale, ...segments)}
      className="zw-link"
      style={style}
    >
      {label}
    </Link>
  );

  return (
    <footer style={{ background: "var(--c-shade)", marginTop: 72 }}>
      <div className="zw-container" style={{ padding: "52px var(--gutter) 36px" }}>
        <div className="zw-footer-grid">
          <div style={{ ...col, gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wordmark-cropped.png"
              alt="Zavoia"
              style={{ height: 28, width: "auto", alignSelf: "flex-start" }}
            />
            <p
              className="txt-pretty"
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--c-600)",
                maxWidth: 300,
              }}
            >
              {t.tagline}
            </p>
          </div>

          <div style={col}>
            <div style={head}>{t.explore}</div>
            {fLink(t.offers, link, "offers")}
            {fLink(t.catHair, link, "l", "london", "hair")}
            {fLink(t.catNails, link, "l", "london", "nails")}
            {fLink(t.catMassage, link, "l", "london", "massage")}
            {fLink(t.catDental, link, "l", "london", "dental")}
            {fLink(t.catAuto, link, "l", "london", "auto")}
            {fLink(t.catCleaning, link, "l", "london", "cleaning")}
          </div>

          <div style={col}>
            <div style={head}>{t.zavoia}</div>
            {fLink(t.about, link, "about")}
            {fLink(t.journal, link, "blog")}
            {fLink(t.forBusiness, link, "for-business")}
            {fLink(t.pricing, link, "pricing")}
            {fLink(t.businessDashboard, link, "for-business")}
          </div>

          <div style={col}>
            <div style={head}>{t.support}</div>
            {fLink(t.helpCentre, link, "help")}
            {fLink(t.myTickets, link, "support")}
            {fLink(t.cancellation, link, "legal", "cancellation")}
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            paddingTop: 22,
            borderTop: "1px solid rgba(28,28,26,0.08)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 18,
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--c-500)",
          }}
        >
          <span>{t.rights}</span>
          {fLink(t.privacy.toUpperCase(), monoLink, "legal", "privacy")}
          {fLink(t.terms.toUpperCase(), monoLink, "legal", "terms")}
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="globe" size={13} color="var(--c-500)" />
              {t.langLine}
            </span>
            <span style={{ display: "inline-flex", gap: 8 }}>
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  href={localeHref(l)}
                  hrefLang={l}
                  className="zw-link"
                  style={{
                    ...monoLink,
                    color: l === locale ? "var(--c-800)" : "var(--c-500)",
                    fontWeight: l === locale ? 700 : 600,
                  }}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
