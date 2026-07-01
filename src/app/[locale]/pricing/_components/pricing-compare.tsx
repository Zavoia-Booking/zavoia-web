"use client";

import type { CSSProperties } from "react";
import { CheckRow, Kicker } from "@/components/ui";
import { currencyForLocale, formatPrice } from "@/lib/marketing/pricing";
import { useTranslation } from "@/i18n/useTranslation";

export interface PricingCompareCopy {
  kicker: string;
  title: string;
  blurb: string;
  checks: string[];
  receiptHeader: string;
  lineService: string;
  lineTip: string;
  lineVisitTotal: string;
  lineFee: string;
  lineYouKeep: string;
  footnoteLine1: string;
  footnoteLine2: string;
}

// "The difference" — no-commission story told as a receipt. Ported from
// ZwPricingCompare (docs/web-pricing.jsx:167-235). Presentational only.
// The receipt amounts are illustrative demo magnitudes; the currency is
// locale-derived (RON for `ro`, EUR otherwise) via formatPrice so it matches
// the rest of the pricing page. The labels come from i18n.
export function PricingCompare({ copy }: { copy: PricingCompareCopy }) {
  const { locale } = useTranslation();
  const currency = currencyForLocale(locale);
  const money = (amount: number) => formatPrice(amount, currency);

  const mono: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
  };

  const lineItems: [string, string][] = [
    [copy.lineService, money(168)],
    [copy.lineTip, money(20)],
  ];

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 96px)" }}>
      <div
        data-feature-grid=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: "clamp(32px, 5vw, 80px)",
          alignItems: "center",
        }}
      >
        <div>
          <Kicker style={{ marginBottom: 12 }}>{copy.kicker}</Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(24px, 2.8vw, 34px)",
              fontWeight: 600,
              letterSpacing: "-0.032em",
              lineHeight: 1.05,
              color: "var(--c-900)",
            }}
          >
            {copy.title}
          </h2>
          <p
            className="txt-pretty"
            style={{
              margin: "18px 0 0",
              fontSize: 15.5,
              lineHeight: 1.65,
              color: "var(--c-700)",
              maxWidth: 480,
            }}
          >
            {copy.blurb}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 13,
              marginTop: 24,
            }}
          >
            {copy.checks.map((c) => (
              <CheckRow key={c}>{c}</CheckRow>
            ))}
          </div>
        </div>

        {/* The receipt */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="zw-receipt"
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#fff",
              borderRadius: 14,
              boxShadow: "var(--sh-lg)",
              border: "1px solid rgba(28,28,26,0.06)",
              padding: "24px 26px 22px",
            }}
          >
            <div
              style={{
                ...mono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "var(--c-500)",
                textAlign: "center",
              }}
            >
              {copy.receiptHeader}
            </div>
            <div
              style={{
                borderBottom: "1.5px dashed rgba(28,28,26,0.16)",
                margin: "16px 0",
              }}
            />
            {lineItems.map(([l, v]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "5px 0",
                  fontSize: 14,
                  color: "var(--c-700)",
                }}
              >
                <span>{l}</span>
                <span style={mono}>{v}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "5px 0",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--c-900)",
              }}
            >
              <span>{copy.lineVisitTotal}</span>
              <span style={mono}>{money(188)}</span>
            </div>
            <div
              style={{
                borderBottom: "1.5px dashed rgba(28,28,26,0.16)",
                margin: "16px 0",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--c-900)" }}>
                {copy.lineFee}
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--s-success-600)",
                  letterSpacing: "-0.02em",
                }}
              >
                {money(0)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--c-900)" }}>
                {copy.lineYouKeep}
              </span>
              <span
                style={{
                  ...mono,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--c-900)",
                  letterSpacing: "-0.02em",
                }}
              >
                {money(188)}
              </span>
            </div>
            <div
              style={{
                borderBottom: "1.5px dashed rgba(28,28,26,0.16)",
                margin: "16px 0",
              }}
            />
            <div
              style={{
                ...mono,
                fontSize: 10.5,
                fontWeight: 500,
                letterSpacing: "0.06em",
                color: "var(--c-500)",
                textAlign: "center",
                lineHeight: 1.7,
              }}
            >
              {copy.footnoteLine1}
              <br />
              {copy.footnoteLine2}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
