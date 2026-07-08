import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { Kicker } from "@/components/ui/kicker";
import { Icon, type IconName } from "@/components/ui/icon";

// ─────────────────────────────────────────────
// Trust band — quiet three-up reassurance row. Editorial (i18n only).
// ─────────────────────────────────────────────
export function TrustBand({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.trust;
  const icons: IconName[] = ["pin", "cal", "wallet"];

  return (
    <section className="zw-container" style={{ paddingTop: 76 }}>
      <div
        style={{
          borderTop: "1px solid rgba(28,28,26,0.10)",
          paddingTop: 40,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "clamp(24px, 4vw, 56px)",
        }}
      >
        {s.items.map((it, i) => (
          <div
            key={it.title}
            style={{ display: "flex", gap: 15, alignItems: "flex-start" }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                background: "#fff",
                border: "1px solid rgba(28,28,26,0.08)",
                boxShadow: "var(--sh-sm)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={icons[i] ?? "shield"} size={17} color="var(--p-600)" />
            </span>
            <span>
              <span
                style={{
                  display: "block",
                  fontSize: 15.5,
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  color: "var(--c-900)",
                }}
              >
                {it.title}
              </span>
              <span
                className="txt-pretty"
                style={{
                  display: "block",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: "var(--c-600)",
                  marginTop: 4,
                  maxWidth: 300,
                }}
              >
                {it.sub}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// App band — two-column copy + a simple phone mock. Editorial (i18n only).
// ─────────────────────────────────────────────
export function AppBand({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.app;

  return (
    <section className="zw-container" style={{ paddingTop: 76 }}>
      <div
        data-feature-grid="1"
        style={{
          background: "var(--c-mist)",
          borderRadius: "var(--r-2xl)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 6fr) minmax(0, 5fr)",
          gap: "clamp(28px, 4vw, 64px)",
          alignItems: "center",
          padding: "clamp(36px, 5vw, 56px)",
        }}
      >
        <div>
          <Kicker style={{ marginBottom: 14 }}>{s.kicker}</Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(26px, 3vw, 38px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: "var(--c-900)",
            }}
          >
            {s.title}
          </h2>
          <p
            className="txt-pretty"
            style={{
              margin: "16px 0 26px",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--c-700)",
              maxWidth: 420,
            }}
          >
            {s.sub}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[s.appStore, s.googlePlay].map((label) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--c-ink)",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "var(--r-full)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                <Icon name="phone" size={16} color="#fff" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Lightweight phone/app mock placeholder. */}
          <div
            aria-hidden="true"
            style={{
              width: 220,
              aspectRatio: "9 / 18",
              borderRadius: 36,
              background: "#0d0d0c",
              padding: 9,
              boxShadow: "var(--sh-xl)",
            }}
          >
            <div
              className="zv-stripe"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--c-600)",
                }}
              >
                {s.mockLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// For-business strip — slim ink CTA closer. Editorial (i18n only).
// ─────────────────────────────────────────────
export function BizStrip({ locale }: { locale: Locale }) {
  const s = dictionaries[locale].homeSections.bizStrip;

  return (
    <section className="zw-container" style={{ paddingTop: 64 }}>
      <div
        style={{
          background: "var(--c-ink)",
          color: "#fff",
          borderRadius: "var(--r-2xl)",
          padding: "clamp(26px, 3vw, 40px) clamp(24px, 3.5vw, 48px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "18px 28px",
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
              "radial-gradient(60% 140% at 100% 0%, color-mix(in oklch, var(--p-500) 22%, transparent) 0%, transparent 60%)",
          }}
        />
        <div style={{ position: "relative", flex: "1 1 320px", minWidth: 0 }}>
          <Kicker color="var(--p-400)" style={{ marginBottom: 8 }}>
            {s.kicker}
          </Kicker>
          <div
            className="txt-balance"
            style={{
              fontSize: "clamp(20px, 2.2vw, 27px)",
              fontWeight: 700,
              letterSpacing: "-0.028em",
              lineHeight: 1.12,
            }}
          >
            {s.title}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {s.meta}
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href={localeHref(locale, "for-business")}
            className="tap zw-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--p-500)",
              color: "#fff",
              border: "1px solid var(--p-500)",
              padding: "11px 20px",
              borderRadius: "var(--r-full)",
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            {s.cta}
            <Icon name="arrowR" size={15} color="#fff" />
          </Link>
          <Link
            href={localeHref(locale, "pricing")}
            className="tap zw-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.28)",
              padding: "11px 20px",
              borderRadius: "var(--r-full)",
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            {s.pricing}
          </Link>
        </div>
      </div>
    </section>
  );
}
