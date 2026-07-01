"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/dictionaries";
import { getPricing, formatPrice, TRIAL_DAYS } from "@/lib/marketing/pricing";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/kicker";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
import { Avatar } from "@/components/ui/avatar";
import { Rating, Stars } from "@/components/ui/rating";

// ─────────────────────────────────────────────
// For Business — marketing page content. Client component because later
// slices add interactive sections (carousel, FAQ) and CTA toasts. Sections
// are rendered top-to-bottom; slices 2-4 append more below Industries.
// ─────────────────────────────────────────────
export function ForBusinessContent({ locale }: { locale: Locale }) {
  const { dict } = useTranslation();
  const toast = useToast();

  // Single reusable handler for every primary CTA (slices 2-4 reuse this).
  const onOpenDashboard = () => toast(dict.forBusiness.dashboardToast);

  return (
    <>
      <FbHero locale={locale} onOpenDashboard={onOpenDashboard} />
      <FbIndustries />
      <FbOverview />
      <FbSwitch onOpenDashboard={onOpenDashboard} />
      <FbSetup />
      <FbTestimonial />
      <FbPricingStrip locale={locale} onOpenDashboard={onOpenDashboard} />
      <FbFaq onOpenDashboard={onOpenDashboard} />
      <FbCtaBand locale={locale} onOpenDashboard={onOpenDashboard} />
    </>
  );
}

// ─────────────────────────────────────────────
// Hero — ink band, pitch left, phone mock right, docked stat strip.
// Port of ZwFbHero (docs/web-for-business.jsx).
// ─────────────────────────────────────────────
function FbHero({
  locale,
  onOpenDashboard,
}: {
  locale: Locale;
  onOpenDashboard: () => void;
}) {
  const { dict } = useTranslation();
  const s = dict.forBusiness.hero;
  const phone = dict.forBusiness.phone;
  const stats = dict.forBusiness.stats;
  // The rating stat (3rd) gets the inline star.
  const STAR_INDEX = 2;
  const SELECTED_TIME = "15:30";

  return (
    <section
      style={{
        background: "var(--c-ink)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(70% 110% at 85% -10%, color-mix(in oklch, var(--p-500) 22%, transparent) 0%, transparent 65%)",
        }}
      />
      <div
        className="zw-container"
        data-hero-grid=""
        style={{
          position: "relative",
          display: "grid",
          gap: "clamp(36px, 5vw, 72px)",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          alignItems: "center",
          padding: "clamp(56px, 7vw, 110px) var(--gutter)",
        }}
      >
        <div>
          <Kicker color="var(--p-400)" style={{ marginBottom: 18 }}>
            {s.kicker}
          </Kicker>
          <h1
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(38px, 5vw, 66px)",
              fontWeight: 600,
              letterSpacing: "-0.045em",
              lineHeight: 0.97,
            }}
          >
            {s.titleLead}
            <br />
            <span style={{ color: "rgba(255,255,255,0.42)" }}>
              {s.titleMuted}
            </span>
          </h1>
          <p
            className="txt-pretty"
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(15.5px, 1.4vw, 18px)",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.68)",
              maxWidth: 480,
            }}
          >
            {s.subcopy}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 34,
            }}
          >
            <Button kind="accent" size="lg" onClick={onOpenDashboard}>
              {s.ctaPrimary}
              <Icon name="arrowR" size={17} color="#fff" />
            </Button>
            <Link
              href={localeHref(locale, "pricing")}
              className="tap zw-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "15px 28px",
                fontSize: 16,
                fontWeight: 600,
                borderRadius: "var(--r-full)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.28)",
                textDecoration: "none",
              }}
            >
              {s.ctaPricing}
            </Link>
          </div>
          <div
            style={{
              marginTop: 26,
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 18px",
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <span>{s.trust.noCommission}</span>
            <span aria-hidden="true">·</span>
            <span>{s.trust.noFees}</span>
            <span aria-hidden="true">·</span>
            <span>{s.trust.freeTrial}</span>
          </div>
        </div>

        {/* Phone mock — a client booking the business (demand side). */}
        <div
          className="zw-only-desktop"
          style={{
            position: "relative",
            minHeight: 460,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="fbphone fbfloat">
            <div className="fbphone-screen">
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 10",
                  background: "var(--c-300)",
                }}
              >
                <Img
                  src="https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=1200&q=80"
                  alt={phone.imgAlt}
                  style={{ width: "100%", height: "100%" }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.58))",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 15,
                    right: 15,
                    bottom: 12,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 16.5,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {phone.name}
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "var(--s-success-600)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="check" size={10} color="#fff" />
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <Icon name="star" size={11} color="var(--p-400)" />
                    {phone.rating}
                  </div>
                </div>
              </div>
              <div style={{ padding: "15px 15px 17px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--c-500)",
                  }}
                >
                  {phone.pickTime}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 7,
                    marginTop: 11,
                  }}
                >
                  {phone.times.map((tm) => {
                    const on = tm === SELECTED_TIME;
                    return (
                      <span
                        key={tm}
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          padding: "7px 12px",
                          borderRadius: 10,
                          background: on ? "var(--c-ink)" : "#fff",
                          color: on ? "#fff" : "var(--c-700)",
                          border: on
                            ? "1px solid var(--c-ink)"
                            : "1px solid rgba(28,28,26,0.14)",
                        }}
                      >
                        {tm}
                      </span>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    background: "var(--p-500)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "12px 0",
                    textAlign: "center",
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {phone.confirm}
                </div>
                <div
                  style={{
                    marginTop: 9,
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--c-500)",
                  }}
                >
                  {phone.footnote}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip — marketplace scale social proof. */}
      <div
        style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div
          className="zw-container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px clamp(28px, 5vw, 72px)",
            padding: "22px var(--gutter)",
            alignItems: "baseline",
          }}
        >
          {stats.map((stat, i) => (
            <span
              key={stat.label}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 9,
              }}
            >
              <span
                style={{
                  fontSize: 21,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {stat.value}
                {i === STAR_INDEX && (
                  <Icon
                    name="star"
                    size={13}
                    color="var(--p-400)"
                    style={{ transform: "translateY(-1px)" }}
                  />
                )}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {stat.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Industries — kicker + lead, then the category chip row. Port of
// ZwFbIndustries. Dot colours live here (not in i18n); they pair 1:1 with
// the ordered `industries.items` from the dictionary.
// ─────────────────────────────────────────────
const FB_INDUSTRY_COLORS = [
  "var(--cat-hair)",
  "var(--cat-brow)",
  "var(--cat-nails)",
  "var(--cat-massage)",
  "var(--cat-skin)",
  "var(--cat-auto)",
  "var(--cat-dental)",
  "var(--cat-fitness)",
  "var(--cat-pets)",
  "var(--cat-trades)",
];

function FbIndustries() {
  const { dict } = useTranslation();
  const s = dict.forBusiness.industries;

  return (
    <section
      className="zw-container"
      style={{ paddingTop: "clamp(56px, 7vw, 88px)" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: "clamp(18px, 2vw, 26px)",
        }}
      >
        <Kicker>{s.kicker}</Kicker>
        <span style={{ fontSize: 14.5, color: "var(--c-600)" }}>{s.lead}</span>
      </div>
      <div className="fbchips">
        {s.items.map((item, i) => (
          <span className="fbchip" key={item.label}>
            <span
              className="fbchip-dot"
              style={{
                background: FB_INDUSTRY_COLORS[i] ?? "var(--cat-hair)",
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Bento tile — mono caption (light, on the ink theatre) + white artifact.
// Hover lifts the art and tints the caption (CSS handles both). Port of
// ZwFbBentoTile.
// ─────────────────────────────────────────────
function FbTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fbtile">
      <div
        className="fbtile-cap"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: 9,
          paddingLeft: 2,
        }}
      >
        {label}
      </div>
      <div className="fbtile-art">{children}</div>
    </div>
  );
}

// Shared white-artifact card shell used by the six bento "moments".
const ART_CARD: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "var(--sh-md)",
};
const ART_HEAD: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  paddingBottom: 10,
  borderBottom: "1px solid rgba(28,28,26,0.07)",
};
const ART_HEAD_MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.1em",
  color: "var(--c-500)",
};

// Today's diary — calendar with live "Filling up" pulse + booked/open rows.
function FbMomentCalendar() {
  const { dict } = useTranslation();
  const c = dict.forBusiness.overview.calendar;
  return (
    <div style={{ ...ART_CARD, padding: "14px 16px" }}>
      <div style={ART_HEAD}>
        <span style={ART_HEAD_MONO}>{c.head}</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--s-success-600)",
          }}
        >
          <span className="fbpulse" aria-hidden="true" />
          {c.fillingUp}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10 }}>
        {c.rows.map((r) => (
          <div key={r.time} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--c-600)",
                width: 38,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r.time}
            </span>
            {r.state === "booked" ? (
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "var(--p-100)",
                  borderLeft: "3px solid var(--p-500)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--c-900)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.label}
              </span>
            ) : (
              <span
                style={{
                  flex: 1,
                  border: "1.5px dashed rgba(28,28,26,0.18)",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--c-500)",
                }}
              >
                {r.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// New-client demand — the business appearing in marketplace search.
function FbMomentSearch() {
  const { dict } = useTranslation();
  const s = dict.forBusiness.overview.search;
  return (
    <div style={{ ...ART_CARD, padding: "14px 16px" }}>
      <div style={ART_HEAD}>
        <span style={ART_HEAD_MONO}>{s.head}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--p-600)" }}>
          {s.topResult}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 11, paddingTop: 11 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "var(--c-shade)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "var(--c-700)",
            fontSize: 14,
          }}
        >
          {s.logo}
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.015em",
            }}
          >
            {s.name}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11.5,
              color: "var(--c-600)",
              marginTop: 1,
            }}
          >
            {s.meta} <Icon name="check" size={11} color="var(--s-success-600)" /> {s.verified}
          </span>
        </span>
        <span
          style={{
            background: "var(--c-ink)",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 13px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {s.book}
        </span>
      </div>
      <div
        style={{
          marginTop: 11,
          paddingTop: 10,
          borderTop: "1px dashed rgba(28,28,26,0.10)",
          fontSize: 12,
          color: "var(--c-600)",
          fontWeight: 500,
        }}
      >
        {s.note}
      </div>
    </div>
  );
}

// No-show defence — reminder card with bell + reschedule/confirm pills.
function FbMomentReminder() {
  const { dict } = useTranslation();
  const r = dict.forBusiness.overview.reminder;
  return (
    <div style={{ ...ART_CARD, padding: "15px 16px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--c-ink)",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bell" size={16} color="#fff" />
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.01em",
            }}
          >
            {r.title}
          </span>
          <span
            style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--c-600)" }}
          >
            {r.sub}
          </span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            border: "1px solid rgba(28,28,26,0.14)",
            borderRadius: 999,
            padding: "7px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--c-800)",
          }}
        >
          {r.reschedule}
        </span>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            background: "var(--c-ink)",
            borderRadius: 999,
            padding: "7px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          {r.confirm}
        </span>
      </div>
    </div>
  );
}

// Verified reviews — avatar + 5 stars + green ✓ VERIFIED + quote.
function FbMomentReview() {
  const { dict } = useTranslation();
  const r = dict.forBusiness.overview.review;
  return (
    <div style={{ ...ART_CARD, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar name={r.name} size={38} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.01em",
            }}
          >
            {r.name}
          </span>
          <Stars value={5} size={12} />
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--s-success-600)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="check" size={11} color="var(--s-success-600)" />
          {r.verified}
        </span>
      </div>
      <p
        className="txt-pretty"
        style={{ margin: "11px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--c-700)" }}
      >
        {r.quote}
      </p>
    </div>
  );
}

// Team profiles — avatar with ring + rating + "Book {name}" pill.
function FbMomentTeam() {
  const { dict } = useTranslation();
  const t = dict.forBusiness.overview.teamCard;
  return (
    <div style={{ ...ART_CARD, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={t.name} size={44} ring />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.015em",
            }}
          >
            {t.name}
          </span>
          <span
            style={{ display: "block", fontSize: 12, color: "var(--c-600)", marginTop: 1 }}
          >
            {t.meta}
          </span>
        </span>
        <Rating rating={4.9} reviews={87} size={12.5} />
      </div>
      <div
        style={{
          marginTop: 13,
          paddingTop: 12,
          borderTop: "1px dashed rgba(28,28,26,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "var(--c-500)",
          }}
        >
          {t.nextFree}
        </span>
        <span
          style={{
            background: "var(--p-500)",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 13px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {t.book}
        </span>
      </div>
    </div>
  );
}

// Every location — location rows with status dots + chevrons.
function FbMomentLocations() {
  const { dict } = useTranslation();
  const l = dict.forBusiness.overview.locationsCard;
  return (
    <div style={{ ...ART_CARD, padding: "14px 16px" }}>
      <div style={ART_HEAD}>
        <span style={{ ...ART_HEAD_MONO, letterSpacing: "0.1em" }}>{l.head}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--c-700)" }}>
          {l.branches}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 6 }}>
        {l.rows.map((r) => (
          <div
            key={r.name}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: r.on ? "var(--p-500)" : "var(--c-400)",
              }}
            />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--c-900)",
                  letterSpacing: "-0.01em",
                }}
              >
                {r.name}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 11.5,
                  color: "var(--c-600)",
                  marginTop: 1,
                }}
              >
                {r.sub}
              </span>
            </span>
            <Icon name="chevR" size={14} color="var(--c-400)" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Overview — "One workspace" bento: heading block + ink theatre wrapping a
// 3-column bento of the six product moments. Port of ZwFbOverview. Column
// grouping matches the prototype (col1: diary+search, col2: reminder+review,
// col3: team+locations).
// ─────────────────────────────────────────────
function FbOverview() {
  const { dict } = useTranslation();
  const s = dict.forBusiness.overview;

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
      <div style={{ maxWidth: 660, marginBottom: "clamp(24px, 3vw, 40px)" }}>
        <Kicker style={{ marginBottom: 14 }}>{s.kicker}</Kicker>
        <h2
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: "clamp(28px, 3.4vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.038em",
            lineHeight: 1.04,
            color: "var(--c-900)",
          }}
        >
          {s.title}
        </h2>
        <p
          className="txt-pretty"
          style={{
            margin: "16px 0 0",
            fontSize: "clamp(15px, 1.4vw, 17px)",
            lineHeight: 1.6,
            color: "var(--c-600)",
            maxWidth: 560,
          }}
        >
          {s.subcopy}
        </p>
      </div>
      <div className="fbtheatre">
        <div className="fbtheatre-glow" aria-hidden="true" />
        <div className="fbbento">
          <div className="fbbento-col">
            <FbTile label={s.tiles.diary}>
              <FbMomentCalendar />
            </FbTile>
            <FbTile label={s.tiles.demand}>
              <FbMomentSearch />
            </FbTile>
          </div>
          <div className="fbbento-col">
            <FbTile label={s.tiles.defence}>
              <FbMomentReminder />
            </FbTile>
            <FbTile label={s.tiles.reviews}>
              <FbMomentReview />
            </FbTile>
          </div>
          <div className="fbbento-col">
            <FbTile label={s.tiles.team}>
              <FbMomentTeam />
            </FbTile>
            <FbTile label={s.tiles.locations}>
              <FbMomentLocations />
            </FbTile>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Switch — "Why owners switch" comparison table. Port of ZwFbSwitch +
// ZW_FB_COMPARE. The win/bad/ok tone per cell is visual (not localized), so
// it lives here paired 1:1 with the ordered `switch.rows` from the dictionary.
// ─────────────────────────────────────────────
type FbTone = "win" | "bad" | "ok";

// [zav, market, soft] tone per row — same order as `forBusiness.switch.rows`.
const FB_COMPARE_TONES: [FbTone, FbTone, FbTone][] = [
  ["win", "bad", "ok"],
  ["win", "ok", "bad"],
  ["win", "bad", "ok"],
  ["win", "ok", "ok"],
  ["win", "bad", "ok"],
  ["win", "ok", "bad"],
];

function FbMark({ tone }: { tone: FbTone }) {
  if (tone === "win") return <Icon name="check" size={14} color="var(--p-600)" />;
  if (tone === "bad") return <Icon name="x" size={13} color="var(--c-400)" />;
  return (
    <span
      aria-hidden="true"
      style={{
        width: 11,
        height: 2,
        background: "var(--c-400)",
        display: "inline-block",
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}

function FbSwitch({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const { dict } = useTranslation();
  const s = dict.forBusiness.switch;

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
      <div style={{ maxWidth: 680, marginBottom: "clamp(24px, 3vw, 40px)" }}>
        <Kicker style={{ marginBottom: 14 }}>{s.kicker}</Kicker>
        <h2
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: "clamp(28px, 3.4vw, 44px)",
            fontWeight: 600,
            letterSpacing: "-0.038em",
            lineHeight: 1.04,
            color: "var(--c-900)",
          }}
        >
          {s.title}
        </h2>
        <p
          className="txt-pretty"
          style={{
            margin: "16px 0 0",
            fontSize: "clamp(15px, 1.4vw, 17px)",
            lineHeight: 1.6,
            color: "var(--c-600)",
            maxWidth: 560,
          }}
        >
          {s.subcopyLead}
          <em>{s.subcopyEm}</em>
          {s.subcopyTail}
        </p>
      </div>
      <div className="fbcompare-wrap">
        <div className="fbcompare">
          <div className="fbcompare-row fbcompare-head">
            <div className="fbcompare-rowlabel" />
            <div className="fbcompare-cell fbcompare-zav">
              <span className="fbcompare-colname">{s.colZavoia}</span>
            </div>
            <div className="fbcompare-cell">
              <span className="fbcompare-colname">{s.colMarket}</span>
            </div>
            <div className="fbcompare-cell">
              <span className="fbcompare-colname">{s.colSoft}</span>
            </div>
          </div>
          {s.rows.map((r, i) => {
            const [zavTone, marketTone, softTone] = FB_COMPARE_TONES[i];
            const cells: { key: string; text: string; tone: FbTone; zav: boolean }[] = [
              { key: "zav", text: r.zav, tone: zavTone, zav: true },
              { key: "market", text: r.market, tone: marketTone, zav: false },
              { key: "soft", text: r.soft, tone: softTone, zav: false },
            ];
            return (
              <div className="fbcompare-row" key={r.label}>
                <div className="fbcompare-rowlabel">{r.label}</div>
                {cells.map((cell) => (
                  <div
                    key={cell.key}
                    className={"fbcompare-cell" + (cell.zav ? " fbcompare-zav" : "")}
                  >
                    <FbMark tone={cell.tone} />
                    <span
                      className="fbcompare-txt"
                      style={{
                        color: cell.zav ? "var(--c-900)" : "var(--c-600)",
                        fontWeight: cell.zav ? 600 : 500,
                      }}
                    >
                      {cell.text}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="fbswitch-cta">
        <Button kind="primary" onClick={onOpenDashboard}>
          {s.cta}
          <Icon name="arrowR" size={15} color="#fff" />
        </Button>
        <span className="fbswitch-cta-note">{s.ctaNote}</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Setup strip — "live in an afternoon" reassurance. Tinted card with an
// H2 + mono trial badge, then a 3-step strip (each step: ink top border,
// mono number, title, body). Port of ZwFbSetup. `.fbsetup` collapses to a
// single column ≤760px. The trial length comes from the canonical TRIAL_DAYS
// constant so it matches the real pricing page.
// ─────────────────────────────────────────────
function FbSetup() {
  const { dict } = useTranslation();
  const s = dict.forBusiness.setup;

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(56px, 7vw, 92px)" }}>
      <div
        style={{
          background: "var(--c-shade)",
          borderRadius: "var(--r-2xl)",
          padding: "clamp(28px, 3.6vw, 48px) clamp(24px, 3.4vw, 48px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: "clamp(22px, 2.6vw, 34px)",
          }}
        >
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(21px, 2.3vw, 28px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--c-900)",
            }}
          >
            {s.title}
          </h2>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--c-500)",
            }}
          >
            {format(s.trialBadge, { trial: String(TRIAL_DAYS) })}
          </span>
        </div>
        <div className="fbsetup">
          {s.steps.map((step) => (
            <div key={step.n} style={{ borderTop: "2px solid var(--c-ink)", paddingTop: 16 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "var(--p-600)",
                }}
              >
                {step.n}
              </span>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--c-900)",
                }}
              >
                {step.title}
              </div>
              <p
                className="txt-pretty"
                style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--c-600)" }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Testimonials — centered, paged pull-quote carousel. Port of
// ZwFbTestimonial. `idx` state drives the visible item; prev/next circle
// arrows wrap around via modulo. Each page change re-keys the inner block so
// the `zw-page-in` animation re-triggers, and the mono counter shows
// "0{idx+1} / 0{n}".
// ─────────────────────────────────────────────
function FbTestimonial() {
  const { dict } = useTranslation();
  const s = dict.forBusiness.testimonials;
  const [idx, setIdx] = useState(0);
  const n = s.items.length;
  const t = s.items[idx];
  const page = (d: number) => setIdx((idx + d + n) % n);

  const arrow = (d: number, label: string) => (
    <button
      type="button"
      className="tap"
      onClick={() => page(d)}
      aria-label={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        cursor: "pointer",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.14)",
        boxShadow: "var(--sh-sm)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={d < 0 ? "chevL" : "chevR"} size={17} color="var(--c-800)" />
    </button>
  );

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
        <Kicker style={{ marginBottom: 22 }}>{s.kicker}</Kicker>
        <div key={idx} style={{ animation: "zw-page-in .42s var(--ease-out)" }}>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              fontFamily: "Georgia, serif",
              fontSize: 64,
              lineHeight: 0.6,
              color: "var(--p-500)",
              height: 30,
            }}
          >
            &ldquo;
          </span>
          <blockquote
            className="txt-balance"
            style={{
              margin: "0 auto",
              maxWidth: 720,
              fontSize: "clamp(22px, 2.7vw, 34px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.3,
              color: "var(--c-900)",
            }}
          >
            {t.quote}
          </blockquote>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 13,
              marginTop: "clamp(24px, 3vw, 36px)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                boxShadow: "var(--sh-sm)",
              }}
            >
              <Img src={t.photo} alt={t.biz} style={{ width: "100%", height: "100%" }} />
            </div>
            <span style={{ textAlign: "left" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--c-900)",
                }}
              >
                {t.name} · {t.biz}
              </span>
              <span
                style={{ display: "block", fontSize: 12.5, color: "var(--c-600)", marginTop: 2 }}
              >
                {t.role} · {t.context}
              </span>
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginTop: "clamp(28px, 3.4vw, 40px)",
          }}
        >
          {arrow(-1, s.prevLabel)}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--c-700)",
              fontVariantNumeric: "tabular-nums",
              minWidth: 56,
              textAlign: "center",
            }}
          >
            0{idx + 1}
            <span style={{ opacity: 0.45 }}> / 0{n}</span>
          </span>
          {arrow(1, s.nextLabel)}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Pricing strip — single-line pricing teaser. Port of ZwFbPricingStrip. The
// big monthly price is locale-derived via getPricing/formatPrice and the trial
// length comes from TRIAL_DAYS so the teaser matches the real /pricing page.
// Monthly only — no annual price. "See full pricing"
// links to the pricing route; "Start free trial" fires the dashboard toast.
// ─────────────────────────────────────────────
function FbPricingStrip({
  locale,
  onOpenDashboard,
}: {
  locale: Locale;
  onOpenDashboard: () => void;
}) {
  const { dict } = useTranslation();
  const s = dict.forBusiness.pricingStrip;
  const pricing = getPricing(locale);

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
      <div
        style={{
          border: "1px solid rgba(28,28,26,0.08)",
          borderRadius: "var(--r-2xl)",
          background: "#fff",
          boxShadow: "var(--sh-md)",
          padding: "clamp(26px, 3vw, 40px) clamp(24px, 3.5vw, 48px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "20px 36px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexShrink: 0 }}>
          <span
            style={{
              fontSize: "clamp(42px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "var(--c-900)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatPrice(pricing.monthly, pricing.currency)}
          </span>
          <span style={{ fontSize: 13.5, color: "var(--c-600)", fontWeight: 500, lineHeight: 1.35 }}>
            {s.perMember}
            <br />
            {s.perMonth}
          </span>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: "var(--c-900)",
            }}
          >
            {s.onePlan}
          </div>
          <div style={{ marginTop: 4, fontSize: 13.5, color: "var(--c-600)" }}>
            {format(s.monthlyLine, { trial: String(TRIAL_DAYS) })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={localeHref(locale, "pricing")}
            className="tap zw-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 20px",
              fontSize: 14.5,
              fontWeight: 600,
              borderRadius: "var(--r-full)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              background: "var(--c-ink)",
              color: "#fff",
              border: "1px solid var(--c-ink)",
              textDecoration: "none",
            }}
          >
            {s.ctaPricing}
            <Icon name="arrowR" size={15} color="#fff" />
          </Link>
          <Button kind="secondary" onClick={onOpenDashboard}>
            {s.ctaTrial}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ — two-column section: a sticky aside (kicker + heading + inline
// "Talk to the team" text button → dashboard toast) and a single-open
// accordion of the six owner questions. Port of ZwFbFaq + the shared
// ZwFaqList. The "get started" answer interpolates the canonical trial
// length so it matches the real pricing page. `.fbfaq-grid` collapses to a
// single column ≤820px (aside un-sticks).
// ─────────────────────────────────────────────
function FbFaq({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const { dict } = useTranslation();
  const s = dict.forBusiness.faq;
  // Single-open accordion: `open` holds the active index; the first item
  // (index 0) is open by default; clicking the open row collapses all (-1).
  const [open, setOpen] = useState(0);

  return (
    <section className="zw-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
      <div className="fbfaq-grid">
        <div className="fbfaq-aside">
          <Kicker style={{ marginBottom: 14 }}>{s.kicker}</Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(24px, 2.8vw, 34px)",
              fontWeight: 600,
              letterSpacing: "-0.032em",
              lineHeight: 1.06,
              color: "var(--c-900)",
            }}
          >
            {s.title}
          </h2>
          <p
            className="txt-pretty"
            style={{
              margin: "16px 0 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--c-600)",
              maxWidth: 320,
            }}
          >
            {s.asideLead}
            <button
              type="button"
              onClick={onOpenDashboard}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                color: "var(--p-700)",
                fontWeight: 600,
              }}
            >
              {s.asideCta}
            </button>
            {s.asideTail}
          </p>
        </div>
        <div>
          <div style={{ borderTop: "1px solid rgba(28,28,26,0.08)" }}>
            {s.items.map((it, i) => {
              const on = open === i;
              const answer =
                i === FB_FAQ_TRIAL_INDEX
                  ? format(it.a, { trial: String(TRIAL_DAYS) })
                  : it.a;
              return (
                <div
                  key={it.q}
                  style={{ borderBottom: "1px solid rgba(28,28,26,0.08)" }}
                >
                  <button
                    type="button"
                    className="tap"
                    onClick={() => setOpen(on ? -1 : i)}
                    aria-expanded={on}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      padding: "20px 2px",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16.5,
                        fontWeight: 600,
                        letterSpacing: "-0.018em",
                        color: "var(--c-900)",
                        lineHeight: 1.3,
                      }}
                    >
                      {it.q}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: "1px solid rgba(28,28,26,0.14)",
                        background: on ? "var(--c-ink)" : "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background-color .2s var(--ease-soft)",
                      }}
                    >
                      <Icon
                        name={on ? "chevU" : "chevD"}
                        size={14}
                        color={on ? "#fff" : "var(--c-700)"}
                      />
                    </span>
                  </button>
                  {on && (
                    <p
                      className="zv-fade txt-pretty"
                      style={{
                        margin: "0 0 22px",
                        maxWidth: 640,
                        fontSize: 15,
                        lineHeight: 1.65,
                        color: "var(--c-600)",
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Index of the FAQ item whose answer interpolates the trial length
// ("How do we get started?" — 5th item, index 4).
const FB_FAQ_TRIAL_INDEX = 4;

// ─────────────────────────────────────────────
// CTA band — the closing ink panel that ends the page. Port of ZwCtaBand as
// invoked from web-for-business.jsx (ink tone). Radial terracotta glow,
// centered kicker/heading/sub, primary accent "Get started free" → dashboard
// toast, secondary transparent-bordered "See pricing" → /pricing link. The
// sub interpolates the canonical trial length.
// ─────────────────────────────────────────────
function FbCtaBand({
  locale,
  onOpenDashboard,
}: {
  locale: Locale;
  onOpenDashboard: () => void;
}) {
  const { dict } = useTranslation();
  const s = dict.forBusiness.ctaBand;

  return (
    <section className="zw-container" style={{ marginTop: "clamp(64px, 8vw, 104px)" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--r-2xl)",
          background: "var(--c-ink)",
          color: "#fff",
          padding: "clamp(44px, 6vw, 76px) clamp(24px, 5vw, 72px)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(80% 130% at 50% -30%, color-mix(in oklch, var(--p-500) 26%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Kicker color="var(--p-400)" style={{ marginBottom: 14 }}>
            {s.kicker}
          </Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(28px, 3.6vw, 44px)",
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
              maxWidth: 640,
            }}
          >
            {s.title}
          </h2>
          <p
            className="txt-pretty"
            style={{
              margin: "16px 0 0",
              fontSize: 16,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.66)",
              maxWidth: 480,
            }}
          >
            {format(s.sub, { trial: String(TRIAL_DAYS) })}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            <Button
              kind="accent"
              size="lg"
              onClick={onOpenDashboard}
              style={{ border: "1px solid transparent" }}
            >
              {s.ctaPrimary}
            </Button>
            <Link
              href={localeHref(locale, "pricing")}
              className="tap zw-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "15px 28px",
                fontSize: 16,
                fontWeight: 600,
                borderRadius: "var(--r-full)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                background: "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.28)",
                textDecoration: "none",
              }}
            >
              {s.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
