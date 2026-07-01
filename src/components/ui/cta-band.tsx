import type { ReactNode } from "react";
import { Kicker } from "./kicker";
import { Button } from "./button";

export interface CtaBandProps {
  kicker?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  primaryLabel?: ReactNode;
  secondaryLabel?: ReactNode;
  /** "ink" = dark panel (default), otherwise the mist panel. */
  tone?: "ink" | "mist";
}

// Closing CTA band for marketing pages. Ported verbatim from ZwCtaBand
// (docs/web-marketing.jsx:101-143). The prototype's onPrimary/onSecondary
// handlers have no real targets here, so the CTAs are rendered styled
// exactly per the design but inert (type="button", no handler / no nav).
export function CtaBand({
  kicker,
  title,
  sub,
  primaryLabel,
  secondaryLabel,
  tone = "ink",
}: CtaBandProps) {
  const ink = tone === "ink";
  return (
    <section className="zw-container" style={{ marginTop: "clamp(64px, 8vw, 104px)" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--r-2xl)",
          background: ink ? "var(--c-ink)" : "var(--c-mist)",
          color: ink ? "#fff" : "var(--c-900)",
          padding: "clamp(44px, 6vw, 76px) clamp(24px, 5vw, 72px)",
          textAlign: "center",
        }}
      >
        {ink && (
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
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {kicker && (
            <Kicker
              color={ink ? "var(--p-400)" : "var(--p-600)"}
              style={{ marginBottom: 14 }}
            >
              {kicker}
            </Kicker>
          )}
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
            {title}
          </h2>
          {sub && (
            <p
              className="txt-pretty"
              style={{
                margin: "16px 0 0",
                fontSize: 16,
                lineHeight: 1.6,
                color: ink ? "rgba(255,255,255,0.66)" : "var(--c-600)",
                maxWidth: 480,
              }}
            >
              {sub}
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            {primaryLabel && (
              <Button
                kind={ink ? "accent" : "primary"}
                size="lg"
                style={{ border: "1px solid transparent" }}
              >
                {primaryLabel}
              </Button>
            )}
            {secondaryLabel && (
              <Button
                kind="secondary"
                size="lg"
                style={
                  ink
                    ? {
                        background: "transparent",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.28)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--c-900)",
                        border: "1px solid rgba(28,28,26,0.22)",
                      }
                }
              >
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
