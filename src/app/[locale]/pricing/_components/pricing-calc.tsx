"use client";

import { useState } from "react";
import { Button, CheckRow, Icon, Kicker } from "@/components/ui";
import { format } from "@/i18n/dictionaries";
import { formatPrice, getPricing } from "@/lib/marketing/pricing";
import { useTranslation } from "@/i18n/useTranslation";

export interface PricingCalcCopy {
  plan: {
    trialBadge: string;
    perMember: string;
    perMonth: string;
    blurb: string;
    features: string[];
    cta: string;
  };
  calc: {
    kicker: string;
    title: string;
    membersLabel: string;
    trackSolo: string;
    trackMax: string;
    total: string;
    perMonth: string;
  };
}

// Plan card + team-size calculator. Ported from ZwPricingCalc
// (docs/web-pricing.jsx:9-159). State: members (1–25, default 4). Monthly-only:
// the rate and currency come from the active locale via getPricing. The "Start
// your free trial" CTA is inert by design.
export function PricingCalc({ copy }: { copy: PricingCalcCopy }) {
  const { locale } = useTranslation();
  const pricing = getPricing(locale);
  const [members, setMembers] = useState(4);

  const rate = pricing.monthly;
  const monthlyTotal = rate * members;

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(40px, 5vw, 64px)" }}>
      <div
        data-feature-grid=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "clamp(24px, 3vw, 40px)",
          alignItems: "stretch",
        }}
      >
        {/* The plan */}
        <div
          style={{
            background: "var(--c-ink)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "clamp(28px, 3.5vw, 44px)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(85% 120% at 100% -20%, color-mix(in oklch, var(--p-500) 24%, transparent) 0%, transparent 65%)",
            }}
          />
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Kicker color="var(--p-400)">{pricing.name}</Kicker>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.66)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  padding: "5px 11px",
                }}
              >
                {format(copy.plan.trialBadge, { trial: String(pricing.trialDays) })}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginTop: 26,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(54px, 6vw, 76px)",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPrice(rate, pricing.currency)}
              </span>
              <span
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.62)",
                  fontWeight: 500,
                }}
              >
                {copy.plan.perMember}
                <br />
                {copy.plan.perMonth}
              </span>
            </div>
            <p
              className="txt-pretty"
              style={{
                margin: "20px 0 0",
                fontSize: 15,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.68)",
                maxWidth: 400,
              }}
            >
              {copy.plan.blurb}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 26,
              }}
            >
              {copy.plan.features.map((f) => (
                <CheckRow key={f} dark size={14.5}>
                  {f}
                </CheckRow>
              ))}
            </div>
            <div style={{ marginTop: "auto", paddingTop: 30 }}>
              <Button kind="accent" size="lg" style={{ width: "100%" }}>
                {copy.plan.cta}
                <Icon name="arrowR" size={17} color="#fff" />
              </Button>
            </div>
          </div>
        </div>

        {/* The calculator */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: "var(--r-2xl)",
            boxShadow: "var(--sh-md)",
            padding: "clamp(28px, 3.5vw, 44px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Kicker style={{ marginBottom: 6 }}>{copy.calc.kicker}</Kicker>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(22px, 2.2vw, 28px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--c-900)",
            }}
          >
            {copy.calc.title}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 32,
            }}
          >
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: "var(--c-800)",
                letterSpacing: "-0.01em",
              }}
            >
              {copy.calc.membersLabel}
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--c-900)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {members}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={members}
            className="zw-range"
            aria-label={copy.calc.membersLabel}
            onChange={(e) => setMembers(parseInt(e.target.value, 10))}
            style={{ marginTop: 14 }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--c-500)",
              letterSpacing: "0.06em",
            }}
          >
            <span>{copy.calc.trackSolo}</span>
            <span>{copy.calc.trackMax}</span>
          </div>

          {/* Team dots — one dot per bookable member */}
          <div
            aria-hidden="true"
            style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 18 }}
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: i < members ? "var(--c-ink)" : "rgba(28,28,26,0.10)",
                  transform: i < members ? "scale(1)" : "scale(0.72)",
                  transition:
                    "background-color .25s var(--ease-soft), transform .3s var(--ease-spring, var(--ease-out))",
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 30 }}>
            <div
              style={{
                borderTop: "1px dashed rgba(28,28,26,0.14)",
                paddingTop: 22,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--c-500)",
                  }}
                >
                  {copy.calc.total}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 44,
                      fontWeight: 700,
                      letterSpacing: "-0.045em",
                      lineHeight: 1,
                      color: "var(--c-900)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatPrice(monthlyTotal, pricing.currency)}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--c-600)", fontWeight: 500 }}>
                    {copy.calc.perMonth}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--c-500)",
                  letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {members} × {formatPrice(rate, pricing.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
