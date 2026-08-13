"use client";

/*
  IMPECCABLE DIRECTION CONTRACT — /web-studio (seed e0b2c650, surface/persuade)

  THESIS: A website-builder page that refuses the SaaS-landing arrangement
  (hero screenshot → three feature cards → logos → pricing). This page IS the
  catalogue of what you can build: every part is a numbered specimen plate
  rendered live by the actual microsite renderer, with its real style count and
  real price. Browsing the inventory is the pitch.

  OWN-WORLD: Zavoia's warm-paper editorial system, unchanged — canvas ground,
  ink plates, one terracotta accent, Geist sans with mono catalogue marginalia.
  Catalogue devices only at composition level: № plate numbers, museum caption
  lines under every specimen, hairline spec strips, tabular figures.

  STORY: Your prices, hours, team, photos and reviews already live in Zavoia.
  Web Studio turns them into a real website, you pick styles rather than build
  pages, and after publishing the layout is frozen while the data stays live.

  FIRST VIEWPORT: Ink cover plate. Left, the mono catalogue kicker, a three-line
  display hook and the primary "start free trial" pill. Right, a real published
  site rendering live inside a specimen plate under a mono museum caption. A
  hairline spec strip (12 sections · 47 styles · 14 fonts · 30 accents) docks
  the fold.

  FORM: specimen catalogue — candidate 7 of the grounded list; seed e0b2c650.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, and DESIGN.md.
*/

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/dictionaries";
import { useTranslation } from "@/i18n/useTranslation";
import {
  getPricing,
  formatPrice,
  premiumStylePrices,
  TRIAL_DAYS,
} from "@/lib/marketing/pricing";
import { Kicker } from "@/components/ui/kicker";
import { Icon } from "@/components/ui/icon";
import { FaqList } from "@/components/ui/faq-list";
import { SpecimenPlate } from "./specimen-plate";
import {
  SECTION_META,
  SECTION_TYPES,
} from "@/features/website/components/builder/sectionCatalog";
import {
  BRAND_ACCENT_CATALOG,
  FONT_CATALOG,
} from "@/features/website/components/builder/theme";
import { createWebsiteT } from "@/features/website/i18n/translate";
import type { SectionType } from "@/features/website/types";
import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import { specimenData } from "./specimen-data";

// ── Catalogue constants, all derived from the real product registries ──────────
/** The two sections the backend catalogue ships with no free base variant. */
const NO_FREE_BASE = new Set<SectionType>(["announcement", "marquee"]);

const SECTION_COUNT = SECTION_TYPES.length;
const STYLE_COUNT = SECTION_TYPES.reduce(
  (total, type) => total + SECTION_META[type].variants.length,
  0,
);
/** Styles a business gets without paying extra: one free base per section. */
const INCLUDED_STYLE_COUNT = SECTION_TYPES.filter(
  (type) => !NO_FREE_BASE.has(type),
).length;
const FONT_COUNT = FONT_CATALOG.length;
// Every accent and every display face ships included (website_theme_asset is
// seeded isIncluded = true for all 30 colours and all 14 fonts). The `tier`
// field still on the theme registry is a leftover from when they were sold —
// do not resurrect it as a claim here.
const ACCENT_COUNT = BRAND_ACCENT_CATALOG.length;

const DEFAULT_ACCENT = "#C2552F";

/** DESIGN.md button geometry (lg), shared by the page's two link-pills. */
const PILL_BASE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "15px 28px",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  borderRadius: "var(--r-full)",
  textDecoration: "none",
} as const;

const PILL_ACCENT = {
  ...PILL_BASE,
  background: "var(--p-500)",
  color: "#fff",
  border: "1px solid var(--p-500)",
} as const;

const PILL_ON_INK = {
  ...PILL_BASE,
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.26)",
} as const;

/**
 * Catalogue reading order — the most visual sections lead. Every catalogued
 * section must appear (asserted below) or the spec strip's count would promise
 * more than the index shows.
 */
const STAGE_ORDER: SectionType[] = [
  "hero",
  "services",
  "gallery",
  "testimonials",
  "locations",
  "team",
  "about",
  "nav",
  "footer",
  "faq",
  "marquee",
  "announcement",
];

if (STAGE_ORDER.length !== SECTION_COUNT) {
  throw new Error(
    `Web Studio catalogue: STAGE_ORDER lists ${STAGE_ORDER.length} of ${SECTION_COUNT} sections.`,
  );
}

/**
 * One combined Google Fonts request for every remote display face in the
 * catalogue, so the type plate renders each specimen in its actual face
 * instead of a fallback — one stylesheet, not thirteen.
 */
const TYPE_SPECIMEN_HREF = (() => {
  const families = FONT_CATALOG.flatMap((font) => {
    if (font.loading.source !== "google-fonts") return [];
    const url = new URL(font.loading.stylesheetUrl);
    return url.searchParams.getAll("family");
  });
  const unique = Array.from(new Set(families));
  return `https://fonts.googleapis.com/css2?${unique
    .map((family) => `family=${encodeURIComponent(family)}`)
    .join("&")}&display=swap`;
})();

// ── Small shared catalogue primitives ─────────────────────────────────────────

/** Mono museum label under a specimen plate. */
function PlateCaption({
  children,
  tone = "canvas",
  live = false,
}: {
  children: React.ReactNode;
  tone?: "canvas" | "ink";
  /** Announce changes — the specimen itself is inert and aria-hidden, so this
   *  caption is the only thing that can narrate a style switch. */
  live?: boolean;
}) {
  return (
    <div
      aria-live={live ? "polite" : undefined}
      style={{
        marginTop: 12,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        fontVariantNumeric: "tabular-nums",
        color: tone === "ink" ? "rgba(255,255,255,0.52)" : "var(--c-600)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px 10px",
      }}
    >
      {children}
    </div>
  );
}

/**
 * A caption segment introduced by a "·". The separator is fused into the same
 * nowrap span as the text it introduces, so a wrap can never strand a dot at
 * the end of a line (DESIGN.md's joinDot rule).
 */
function CapSeg({
  children,
  tone = "canvas",
}: {
  children: React.ReactNode;
  tone?: "canvas" | "ink";
}) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span
        aria-hidden="true"
        style={{
          color: tone === "ink" ? "rgba(255,255,255,0.28)" : "var(--c-400)",
          marginRight: 10,
        }}
      >
        ·
      </span>
      {children}
    </span>
  );
}

/** № 04 — the catalogue's plate index mark. */
function PlateNo({ n, tone = "canvas" }: { n: number; tone?: "canvas" | "ink" }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        color: tone === "ink" ? "rgba(255,255,255,0.5)" : "var(--p-600)",
      }}
    >
      № {String(n).padStart(2, "0")}
    </span>
  );
}

/** The primary CTA — a real link wearing the accent pill, never <a><button>. */
function TrialLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="tap zw-btn" style={PILL_ACCENT}>
      {label}
      <Icon name="arrowR" size={17} />
    </Link>
  );
}

/** The secondary in-page jump, as a link on the ink ground. */
function CatalogueLink({ label }: { label: string }) {
  return (
    <a href="#catalogue" className="tap zw-btn" style={PILL_ON_INK}>
      {label}
    </a>
  );
}

function SpecCell({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ padding: "18px 0" }}>
      <div
        style={{
          fontSize: "clamp(28px, 3.4vw, 40px)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: "#fff",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function WebStudioContent({
  locale,
  showcase,
  showcaseName,
}: {
  locale: Locale;
  showcase: PreviewData | null;
  showcaseName: string | null;
}) {
  const { dict } = useTranslation();
  const w = dict.webStudio;
  const pricing = getPricing(locale);
  const premium = premiumStylePrices(locale);

  // The visitor drives the accent + face from the type plate, and every live
  // specimen on the page re-renders in their choice — the theme controls are
  // the product's own two knobs, not a decorative colour picker.
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [fontKey, setFontKey] = useState("modern");

  const authored = useMemo(
    () => specimenData(locale, accent, fontKey),
    [locale, accent, fontKey],
  );

  // A real published site drives the plates when one resolves; otherwise the
  // authored specimen does, and the caption says so.
  const live = showcase !== null;
  const specimen: PreviewData = useMemo(
    () =>
      showcase
        ? { ...showcase, brandColor: accent, fontKey, locale }
        : authored,
    [showcase, authored, accent, fontKey, locale],
  );
  const specimenName = showcaseName ?? authored.businessName;

  const registerHref = localeHref(locale, "register");
  const trialLabel = format(w.cover.ctaPrimary, { days: String(TRIAL_DAYS) });

  return (
    <>
      {/* Renders each type specimen in its real face (see TYPE_SPECIMEN_HREF). */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={TYPE_SPECIMEN_HREF} precedence="default" />

      <Cover
        w={w}
        specimen={specimen}
        specimenName={specimenName}
        live={live}
        registerHref={registerHref}
        trialLabel={trialLabel}
      />
      <Wired w={w} specimen={specimen} />
      <Stage w={w} locale={locale} specimen={specimen} specimenName={specimenName} live={live} />
      <TypePlate
        w={w}
        accent={accent}
        setAccent={setAccent}
        fontKey={fontKey}
        setFontKey={setFontKey}
      />
      <Ships w={w} />
      <PricePlate
        w={w}
        pricing={pricing}
        premium={premium}
        registerHref={registerHref}
        trialLabel={trialLabel}
        locale={locale}
      />
      <Faq w={w} />
      <Close w={w} registerHref={registerHref} trialLabel={trialLabel} />
    </>
  );
}

type W = ReturnType<typeof useTranslation>["dict"]["webStudio"];

// ── PLATE 00 · Cover ──────────────────────────────────────────────────────────

function Cover({
  w,
  specimen,
  specimenName,
  live,
  registerHref,
  trialLabel,
}: {
  w: W;
  specimen: PreviewData;
  specimenName: string;
  live: boolean;
  registerHref: string;
  trialLabel: string;
}) {
  const heroVariant = "cinematic";
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
            "radial-gradient(65% 100% at 88% -8%, color-mix(in oklch, var(--p-500) 26%, transparent) 0%, transparent 62%)",
        }}
      />
      <div
        className="zw-container"
        data-ws-cover=""
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.02fr)",
          gap: "clamp(32px, 4.4vw, 68px)",
          alignItems: "center",
          padding: "clamp(52px, 6.4vw, 96px) var(--gutter) clamp(28px, 3vw, 44px)",
        }}
      >
        <div>
          <Kicker color="var(--p-400)" style={{ marginBottom: 20 }}>
            {w.cover.kicker}
          </Kicker>
          <h1
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(40px, 5.4vw, 76px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 0.94,
            }}
          >
            {w.cover.titleA}
            <br />
            {w.cover.titleB}
            <br />
            <span style={{ color: "var(--p-400)" }}>{w.cover.titleC}</span>
          </h1>
          <p
            className="txt-pretty"
            style={{
              margin: "26px 0 0",
              fontSize: "clamp(15.5px, 1.35vw, 18px)",
              lineHeight: 1.62,
              color: "rgba(255,255,255,0.68)",
              maxWidth: 470,
            }}
          >
            {w.cover.sub}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 30,
            }}
          >
            <TrialLink href={registerHref} label={trialLabel} />
            <CatalogueLink label={w.cover.ctaSecondary} />
          </div>
        </div>

        {/* The specimen plate: a real site, rendered by the real renderer. */}
        <div>
          <div
            style={{
              position: "relative",
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "var(--c-canvas)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.34)",
            }}
          >
            <SpecimenPlate
              layout={[
                { type: "nav", variant: "default", visible: true },
                { type: "hero", variant: heroVariant, visible: true },
                // The cover shows the top of a site, so the chrome footer is
                // switched off rather than cropped at the plate's edge.
                { type: "footer", variant: "directory", visible: false },
              ]}
              data={specimen}
              chrome
              virtualWidth={1240}
              minHeight={150}
              maxHeight={470}
            />
          </div>
          <PlateCaption tone="ink">
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: live ? "var(--s-success-600)" : "var(--p-500)",
              }}
            />
            <span>{live ? w.cover.liveBadge : w.cover.demoBadge}</span>
            <CapSeg tone="ink">{specimenName}</CapSeg>
            <CapSeg tone="ink">{w.cover.plateCaption}</CapSeg>
          </PlateCaption>
        </div>
      </div>

      {/* Spec strip — the catalogue's own measurements. */}
      <div
        className="zw-container"
        style={{ position: "relative", padding: "0 var(--gutter)" }}
      >
        <div
          data-ws-spec=""
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "clamp(12px, 3vw, 44px)",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingBottom: "clamp(24px, 3vw, 40px)",
          }}
        >
          <SpecCell value={String(SECTION_COUNT)} label={w.spec.sections} />
          <SpecCell value={String(STYLE_COUNT)} label={w.spec.styles} />
          <SpecCell value={String(FONT_COUNT)} label={w.spec.fonts} />
          <SpecCell value={String(ACCENT_COUNT)} label={w.spec.accents} />
        </div>
      </div>
    </section>
  );
}

// ── PLATE 01 · Wired to the data you already keep ─────────────────────────────

function Wired({ w, specimen }: { w: W; specimen: PreviewData }) {
  const serviceCount = new Set(
    specimen.locations.flatMap((l) => l.services.map((s) => s.id)),
  ).size;
  const teamCount = new Set(
    specimen.locations.flatMap((l) => l.teamMembers.map((m) => m.id)),
  ).size;
  const photoCount = specimen.locations.reduce(
    (n, l) => n + l.portfolioImages.length,
    0,
  );
  const reviewCount = specimen.locations.reduce(
    (n, l) => n + (l.totalReviews ?? 0),
    0,
  );

  const rows: { label: string; value: string }[] = [
    { label: w.wired.rows.services, value: String(serviceCount) },
    { label: w.wired.rows.hours, value: format(w.wired.perWeek, { n: "7" }) },
    { label: w.wired.rows.team, value: String(teamCount) },
    { label: w.wired.rows.locations, value: String(specimen.locations.length) },
    { label: w.wired.rows.photos, value: String(photoCount) },
    { label: w.wired.rows.reviews, value: String(reviewCount) },
  ];

  return (
    <section
      className="zw-container"
      style={{ padding: "clamp(64px, 8vw, 112px) var(--gutter) 0" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{w.wired.kicker}</Kicker>
      <h2
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.6vw, 46px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
          color: "var(--c-900)",
          maxWidth: 720,
        }}
      >
        {w.wired.title}
      </h2>
      <p
        className="txt-pretty"
        style={{
          margin: "16px 0 0",
          fontSize: "clamp(15px, 1.25vw, 17px)",
          lineHeight: 1.65,
          color: "var(--c-700)",
          maxWidth: 620,
        }}
      >
        {w.wired.sub}
      </p>

      <div
        data-ws-wired=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.72fr) minmax(0, 1fr)",
          gap: "clamp(20px, 3vw, 40px)",
          alignItems: "stretch",
          marginTop: "clamp(28px, 3.4vw, 48px)",
        }}
      >
        {/* The ledger — what Zavoia already holds. */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: "var(--card-r, 18px)",
            padding: "22px 22px 8px",
            boxShadow: "var(--sh-sm)",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--c-600)",
              paddingBottom: 14,
              borderBottom: "1px solid rgba(28,28,26,0.08)",
            }}
          >
            {w.wired.ledgerTitle}
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "13px 0",
                borderBottom: "1px solid rgba(28,28,26,0.06)",
              }}
            >
              <span style={{ fontSize: 14.5, color: "var(--c-800)" }}>
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--c-900)",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 0 16px",
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--p-700)",
              fontWeight: 600,
            }}
          >
            <Icon name="arrowR" size={15} color="var(--p-600)" />
            {w.wired.note}
          </div>
        </div>

        {/* The same rows, rendered. */}
        <div>
          <div
            style={{
              borderRadius: "var(--card-r, 18px)",
              overflow: "hidden",
              border: "1px solid rgba(28,28,26,0.08)",
              boxShadow: "var(--sh-md)",
              background: "#fff",
            }}
          >
            <SpecimenPlate
              layout={[{ type: "services", variant: "feature", visible: true }]}
              data={specimen}
              virtualWidth={1180}
              minHeight={150}
              maxHeight={440}
            />
          </div>
          <PlateCaption>
            <span>{w.wired.plateCaption}</span>
          </PlateCaption>
        </div>
      </div>

      {/* The published-state mechanic — three facts, no claims. */}
      <div
        data-ws-tri=""
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "clamp(14px, 2vw, 24px)",
          marginTop: "clamp(28px, 3.4vw, 44px)",
        }}
      >
        {[
          { icon: "lock" as const, t: w.wired.frozenTitle, b: w.wired.frozenBody },
          { icon: "flash" as const, t: w.wired.liveTitle, b: w.wired.liveBody },
          { icon: "check" as const, t: w.wired.oneTitle, b: w.wired.oneBody },
        ].map((card) => (
          <div
            key={card.t}
            style={{
              background: "var(--c-shade)",
              borderRadius: "var(--r-lg)",
              padding: "20px 20px 22px",
            }}
          >
            <Icon name={card.icon} size={18} color="var(--p-600)" />
            <h3
              style={{
                margin: "12px 0 0",
                fontSize: 16.5,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--c-900)",
              }}
            >
              {card.t}
            </h3>
            <p
              className="txt-pretty"
              style={{
                margin: "7px 0 0",
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--c-700)",
              }}
            >
              {card.b}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PLATE 02 · The specimen stage (signature interaction) ─────────────────────

function Stage({
  w,
  locale,
  specimen,
  specimenName,
  live,
}: {
  w: W;
  locale: Locale;
  specimen: PreviewData;
  specimenName: string;
  live: boolean;
}) {
  const t = useMemo(() => createWebsiteT(locale), [locale]);
  const [type, setType] = useState<SectionType>("hero");
  const [chosen, setChosen] = useState<Partial<Record<SectionType, string>>>({});

  const meta = SECTION_META[type];
  const variant = chosen[type] ?? meta.variants[0].id;
  const variantIndex = Math.max(
    0,
    meta.variants.findIndex((v) => v.id === variant),
  );
  const plateNo = STAGE_ORDER.indexOf(type) + 1;

  return (
    <section
      id="catalogue"
      style={{
        scrollMarginTop: "calc(var(--nav-h) + 12px)",
        padding: "clamp(64px, 8vw, 116px) 0 0",
      }}
    >
      <div className="zw-container" style={{ padding: "0 var(--gutter)" }}>
        <Kicker style={{ marginBottom: 10 }}>{w.stage.kicker}</Kicker>
        <h2
          className="txt-balance"
          style={{
            margin: 0,
            fontSize: "clamp(28px, 3.6vw, 46px)",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.04,
            color: "var(--c-900)",
            maxWidth: 760,
          }}
        >
          {w.stage.title}
        </h2>
        <p
          className="txt-pretty"
          style={{
            margin: "16px 0 0",
            fontSize: "clamp(15px, 1.25vw, 17px)",
            lineHeight: 1.65,
            color: "var(--c-700)",
            maxWidth: 620,
          }}
        >
          {w.stage.sub}
        </p>

        <div
          data-ws-stage=""
          style={{
            display: "grid",
            gridTemplateColumns: "228px minmax(0, 1fr)",
            gap: "clamp(20px, 2.6vw, 36px)",
            marginTop: "clamp(26px, 3.2vw, 44px)",
            alignItems: "start",
          }}
        >
          {/* Catalogue index */}
          <nav aria-label={w.stage.indexLabel} data-ws-index="">
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--c-600)",
                padding: "0 0 12px",
                borderBottom: "1px solid rgba(28,28,26,0.10)",
              }}
            >
              {w.stage.indexLabel}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {STAGE_ORDER.map((sectionType, i) => {
                const on = sectionType === type;
                const sm = SECTION_META[sectionType];
                return (
                  <li key={sectionType}>
                    <button
                      type="button"
                      className="tap"
                      onClick={() => setType(sectionType)}
                      aria-current={on ? "true" : undefined}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: 0,
                        borderBottom: "1px solid rgba(28,28,26,0.06)",
                        padding: "11px 2px",
                        cursor: "pointer",
                        color: on ? "var(--c-900)" : "var(--c-600)",
                        transition: "color 0.18s var(--ease-soft)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: on ? "var(--p-600)" : "var(--c-400)",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 14.5,
                          fontWeight: on ? 600 : 500,
                          letterSpacing: "-0.012em",
                        }}
                      >
                        {t(sm.labelKey)}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          color: on ? "var(--c-700)" : "var(--c-600)",
                        }}
                      >
                        {sm.variants.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* The stage */}
          <div>
            <div
              data-ws-chips=""
              role="group"
              aria-label={w.stage.stylesLabel}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {meta.variants.map((v) => {
                const on = v.id === variant;
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="tap zw-chip-lift"
                    onClick={() =>
                      setChosen((prev) => ({ ...prev, [type]: v.id }))
                    }
                    aria-pressed={on}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "var(--r-full)",
                      fontSize: 13.5,
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      background: on ? "var(--c-ink)" : "#fff",
                      color: on ? "#fff" : "var(--c-800)",
                      border: on
                        ? "1px solid var(--c-ink)"
                        : "1px solid rgba(28,28,26,0.12)",
                      transition:
                        "background 0.18s var(--ease-soft), color 0.18s var(--ease-soft), border-color 0.18s var(--ease-soft)",
                    }}
                  >
                    {t(v.labelKey)}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                borderRadius: "var(--r-xl)",
                overflow: "hidden",
                border: "1px solid rgba(28,28,26,0.10)",
                background: "#fff",
                boxShadow: "var(--sh-md)",
              }}
            >
              <SpecimenPlate
                key={`${type}-${variant}`}
                layout={[
                  {
                    type,
                    variant,
                    visible: true,
                    config: { ...meta.defaultConfig },
                  },
                ]}
                data={specimen}
                virtualWidth={1240}
                minHeight={150}
                maxHeight={600}
              />
            </div>

            <PlateCaption live>
              <PlateNo n={plateNo} />
              <CapSeg>{t(meta.labelKey)}</CapSeg>
              <CapSeg>{t(meta.variants[variantIndex].labelKey)}</CapSeg>
              <CapSeg>
                {format(w.stage.ofStyles, {
                  n: String(variantIndex + 1),
                  total: String(meta.variants.length),
                })}
              </CapSeg>
              <CapSeg>{live ? specimenName : w.stage.demoNote}</CapSeg>
            </PlateCaption>

            <p
              className="txt-pretty"
              style={{
                margin: "18px 0 0",
                fontSize: 14.5,
                lineHeight: 1.62,
                color: "var(--c-700)",
                maxWidth: 620,
              }}
            >
              {t(meta.descriptionKey)}
            </p>

            {/* Having just switched one section's styles, the natural next
                question is what the whole site looks like — /try answers it. */}
            <Link
              href={localeHref(locale, "try")}
              className="tap zw-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                marginTop: 20,
                padding: "13px 22px",
                borderRadius: "var(--r-full)",
                background: "var(--c-ink)",
                color: "#fff",
                border: "1px solid var(--c-ink)",
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                textDecoration: "none",
              }}
            >
              <Icon name="rebook" size={16} />
              {w.stage.tryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PLATE 03 · Type and colour specimens ──────────────────────────────────────

function TypePlate({
  w,
  accent,
  setAccent,
  fontKey,
  setFontKey,
}: {
  w: W;
  accent: string;
  setAccent: (hex: string) => void;
  fontKey: string;
  setFontKey: (key: string) => void;
}) {
  return (
    <section
      className="zw-container"
      style={{ padding: "clamp(64px, 8vw, 116px) var(--gutter) 0" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{w.type.kicker}</Kicker>
      <h2
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.6vw, 46px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
          color: "var(--c-900)",
          maxWidth: 760,
        }}
      >
        {w.type.title}
      </h2>
      <p
        className="txt-pretty"
        style={{
          margin: "16px 0 0",
          fontSize: "clamp(15px, 1.25vw, 17px)",
          lineHeight: 1.65,
          color: "var(--c-700)",
          maxWidth: 620,
        }}
      >
        {w.type.sub}
      </p>

      <div
        data-ws-type=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.82fr)",
          gap: "clamp(20px, 3vw, 40px)",
          marginTop: "clamp(26px, 3.2vw, 44px)",
          alignItems: "start",
        }}
      >
        {/* Font specimens, set in their real faces. */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--c-600)",
              paddingBottom: 12,
              borderBottom: "1px solid rgba(28,28,26,0.10)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{w.type.fontsLabel}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {FONT_COUNT}
            </span>
          </div>
          <div>
            {FONT_CATALOG.map((font) => {
              const on = font.key === fontKey;
              return (
                <button
                  key={font.key}
                  type="button"
                  className="tap"
                  onClick={() => setFontKey(font.key)}
                  aria-pressed={on}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    width: "100%",
                    textAlign: "left",
                    background: on
                      ? "color-mix(in oklch, var(--p-500) 7%, transparent)"
                      : "transparent",
                    border: 0,
                    borderBottom: "1px solid rgba(28,28,26,0.06)",
                    padding: "12px 12px 13px",
                    cursor: "pointer",
                    transition: "background 0.18s var(--ease-soft)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: font.stack,
                      fontWeight: font.weight,
                      letterSpacing: font.tracking,
                      fontSize: "clamp(20px, 2.1vw, 28px)",
                      lineHeight: 1.1,
                      color: on ? "var(--p-700)" : "var(--c-900)",
                    }}
                  >
                    {font.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: on ? "var(--p-600)" : "var(--c-600)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {on ? w.type.inUse : font.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent specimens. */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--c-600)",
              paddingBottom: 12,
              borderBottom: "1px solid rgba(28,28,26,0.10)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{w.type.accentsLabel}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {ACCENT_COUNT}
            </span>
          </div>
          <div
            data-ws-swatches=""
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gap: 10,
              paddingTop: 16,
            }}
          >
            {BRAND_ACCENT_CATALOG.map((option) => {
              const on = option.hex.toLowerCase() === accent.toLowerCase();
              return (
                <button
                  key={option.key}
                  type="button"
                  className="tap"
                  onClick={() => setAccent(option.hex)}
                  aria-pressed={on}
                  aria-label={option.name}
                  title={option.name}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "var(--r-md)",
                    background: option.hex,
                    border: 0,
                    cursor: "pointer",
                    // Selection is an inset ink ring, never `outline` —
                    // an inline `outline: none` would beat the global
                    // :focus-visible rule and blind keyboard users here.
                    boxShadow: on
                      ? "inset 0 0 0 3px var(--c-ink), inset 0 0 0 4px #fff"
                      : "inset 0 0 0 1px rgba(28,28,26,0.10)",
                  }}
                />
              );
            })}
          </div>
          <p
            className="txt-pretty"
            style={{
              margin: "18px 0 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--c-700)",
            }}
          >
            {format(w.type.note, { total: String(ACCENT_COUNT) })}
          </p>
          <div
            style={{
              marginTop: 18,
              padding: "14px 16px",
              borderRadius: "var(--r-lg)",
              background: "var(--c-shade)",
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--c-800)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Icon name="sparkle" size={16} color="var(--p-600)" />
            <span>{w.type.hint}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PLATE 04 · How it ships ───────────────────────────────────────────────────

function Ships({ w }: { w: W }) {
  return (
    <section
      className="zw-container"
      style={{ padding: "clamp(64px, 8vw, 116px) var(--gutter) 0" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{w.ships.kicker}</Kicker>
      <h2
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.6vw, 46px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
          color: "var(--c-900)",
          maxWidth: 700,
        }}
      >
        {w.ships.title}
      </h2>

      <div
        data-ws-tri=""
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "clamp(16px, 2.4vw, 30px)",
          marginTop: "clamp(26px, 3.2vw, 44px)",
        }}
      >
        {w.ships.steps.map((step, i) => (
          <div
            key={step.title}
            style={{
              borderTop: "1px solid rgba(28,28,26,0.26)",
              paddingTop: 18,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: "0.14em",
                fontVariantNumeric: "tabular-nums",
                color: "var(--p-600)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(18px, 1.8vw, 22px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "var(--c-900)",
              }}
            >
              {step.title}
            </h3>
            <p
              className="txt-pretty"
              style={{
                margin: "8px 0 0",
                fontSize: 14.5,
                lineHeight: 1.62,
                color: "var(--c-700)",
              }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div
        data-ws-gets=""
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "clamp(12px, 2vw, 22px)",
          marginTop: "clamp(28px, 3.4vw, 46px)",
          paddingTop: "clamp(24px, 3vw, 36px)",
          borderTop: "1px solid rgba(28,28,26,0.10)",
        }}
      >
        {w.ships.gets.map((get) => (
          <div key={get.title}>
            <Icon name="check" size={16} color="var(--p-600)" />
            <h3
              style={{
                margin: "10px 0 0",
                fontSize: 15.5,
                fontWeight: 600,
                letterSpacing: "-0.018em",
                color: "var(--c-900)",
              }}
            >
              {get.title}
            </h3>
            <p
              className="txt-pretty"
              style={{
                margin: "6px 0 0",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--c-700)",
              }}
            >
              {get.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PLATE 05 · Price plate ────────────────────────────────────────────────────

function PricePlate({
  w,
  pricing,
  premium,
  registerHref,
  trialLabel,
  locale,
}: {
  w: W;
  pricing: ReturnType<typeof getPricing>;
  premium: { min: string; range: string };
  registerHref: string;
  trialLabel: string;
  locale: Locale;
}) {
  return (
    <section
      className="zw-container"
      style={{ padding: "clamp(64px, 8vw, 116px) var(--gutter) 0" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{w.price.kicker}</Kicker>
      <h2
        className="txt-balance"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.6vw, 46px)",
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
          color: "var(--c-900)",
          maxWidth: 700,
        }}
      >
        {w.price.title}
      </h2>

      <div
        data-ws-price=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 0.86fr)",
          gap: "clamp(18px, 2.6vw, 32px)",
          marginTop: "clamp(26px, 3.2vw, 44px)",
          alignItems: "start",
        }}
      >
        {/* The plan */}
        <div
          style={{
            background: "var(--c-ink)",
            color: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "clamp(26px, 3vw, 40px)",
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
                "radial-gradient(80% 120% at 100% 0%, color-mix(in oklch, var(--p-500) 24%, transparent) 0%, transparent 66%)",
            }}
          />
          <div style={{ position: "relative" }}>
            <Kicker color="var(--p-400)">{w.price.planLabel}</Kicker>
            <div
              style={{
                marginTop: 14,
                fontSize: "clamp(30px, 3.4vw, 42px)",
                fontWeight: 600,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
              }}
            >
              {w.price.planName}
            </div>
            <p
              className="txt-pretty"
              style={{
                margin: "14px 0 0",
                fontSize: 15,
                lineHeight: 1.62,
                color: "rgba(255,255,255,0.7)",
                maxWidth: 420,
              }}
            >
              {w.price.planBody}
            </p>

            {/* Commercial claim we do not have: marked, not invented. */}
            <div
              style={{
                marginTop: 22,
                padding: "14px 16px",
                borderRadius: "var(--r-lg)",
                border: "1px dashed rgba(255,255,255,0.32)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--p-400)",
                }}
              >
                {w.price.placeholderLabel}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {format(w.price.placeholderBody, {
                  base: formatPrice(pricing.monthly, pricing.currency),
                })}
              </div>
            </div>

            <ul
              style={{
                listStyle: "none",
                margin: "22px 0 0",
                padding: 0,
                display: "grid",
                gap: 11,
              }}
            >
              {w.price.bullets.map((bullet) => (
                <li
                  key={bullet}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.86)",
                  }}
                >
                  <Icon name="check" size={16} color="var(--p-400)" />
                  {bullet}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 26 }}>
              <TrialLink href={registerHref} label={trialLabel} />
            </div>
          </div>
        </div>

        {/* The à-la-carte styles */}
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: "var(--r-2xl)",
            padding: "clamp(24px, 2.6vw, 34px)",
            boxShadow: "var(--sh-sm)",
          }}
        >
          <Kicker>{w.price.stylesLabel}</Kicker>
          <div
            style={{
              marginTop: 14,
              fontSize: "clamp(22px, 2.3vw, 28px)",
              fontWeight: 600,
              letterSpacing: "-0.028em",
              lineHeight: 1.1,
              color: "var(--c-900)",
            }}
          >
            {format(w.price.stylesTitle, { min: premium.min })}
          </div>
          <p
            className="txt-pretty"
            style={{
              margin: "12px 0 0",
              fontSize: 14.5,
              lineHeight: 1.62,
              color: "var(--c-700)",
            }}
          >
            {w.price.stylesBody}
          </p>

          <div
            style={{
              marginTop: 20,
              borderTop: "1px solid rgba(28,28,26,0.08)",
            }}
          >
            {[
              { k: w.price.rowIncluded, v: format(w.price.rowIncludedV, { n: String(INCLUDED_STYLE_COUNT) }) },
              {
                k: w.price.rowPremium,
                v: format(w.price.rowPremiumV, {
                  n: String(STYLE_COUNT - INCLUDED_STYLE_COUNT),
                  range: premium.range,
                }),
              },
              { k: w.price.rowFonts, v: format(w.price.rowAllIncluded, { n: String(FONT_COUNT) }) },
              {
                k: w.price.rowAccents,
                v: format(w.price.rowAllIncluded, { n: String(ACCENT_COUNT) }),
              },
            ].map((row) => (
              <div
                key={row.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "13px 0",
                  borderBottom: "1px solid rgba(28,28,26,0.06)",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--c-800)" }}>{row.k}</span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--c-900)",
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                  }}
                >
                  {row.v}
                </span>
              </div>
            ))}
          </div>

          <Link
            href={localeHref(locale, "pricing")}
            className="tap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              marginTop: 20,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--p-700)",
              textDecoration: "none",
            }}
          >
            {w.price.pricingLink}
            <Icon name="arrowR" size={15} color="var(--p-600)" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── PLATE 06 · Questions ──────────────────────────────────────────────────────

function Faq({ w }: { w: W }) {
  return (
    <section
      className="zw-container"
      style={{ padding: "clamp(64px, 8vw, 116px) var(--gutter) 0" }}
    >
      <div
        data-ws-faq=""
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.62fr) minmax(0, 1fr)",
          gap: "clamp(20px, 3vw, 48px)",
          alignItems: "start",
        }}
      >
        <div>
          <Kicker style={{ marginBottom: 10 }}>{w.faq.kicker}</Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(26px, 3vw, 38px)",
              fontWeight: 700,
              letterSpacing: "-0.032em",
              lineHeight: 1.06,
              color: "var(--c-900)",
            }}
          >
            {w.faq.title}
          </h2>
        </div>
        <FaqList items={w.faq.items} />
      </div>
    </section>
  );
}

// ── PLATE 07 · Close ──────────────────────────────────────────────────────────

function Close({
  w,
  registerHref,
  trialLabel,
}: {
  w: W;
  registerHref: string;
  trialLabel: string;
}) {
  return (
    <section
      className="zw-container"
      style={{
        marginTop: "clamp(64px, 8vw, 112px)",
        marginBottom: "clamp(48px, 6vw, 88px)",
        padding: "0 var(--gutter)",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--r-2xl)",
          background: "var(--c-ink)",
          color: "#fff",
          padding: "clamp(44px, 6vw, 84px) clamp(24px, 5vw, 72px)",
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
        <div style={{ position: "relative" }}>
          <Kicker color="var(--p-400)" style={{ marginBottom: 16 }}>
            {w.close.kicker}
          </Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: "0 auto",
              maxWidth: 760,
              fontSize: "clamp(30px, 4vw, 54px)",
              fontWeight: 600,
              letterSpacing: "-0.042em",
              lineHeight: 1.02,
            }}
          >
            {w.close.title}
          </h2>
          <p
            className="txt-pretty"
            style={{
              margin: "18px auto 0",
              maxWidth: 540,
              fontSize: "clamp(15px, 1.3vw, 17px)",
              lineHeight: 1.62,
              color: "rgba(255,255,255,0.68)",
            }}
          >
            {w.close.sub}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              marginTop: 30,
            }}
          >
            <TrialLink href={registerHref} label={trialLabel} />
            <CatalogueLink label={w.close.secondary} />
          </div>
        </div>
      </div>
    </section>
  );
}
