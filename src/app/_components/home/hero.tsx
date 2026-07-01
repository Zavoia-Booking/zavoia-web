"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { useSearchOverlay } from "@/components/search/search-overlay-provider";

// Live typewriter placeholder — cycles the i18n prompts, typing then
// deleting. Pauses at the end of each phrase. Cleans up on unmount.
function useTypewriter(prompts: string[]): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!prompts.length) return;
    let pi = 0;
    let ci = 0;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = prompts[pi] ?? "";
      ci += dir;
      setText(full.slice(0, Math.max(0, ci)));
      if (dir > 0 && ci >= full.length) {
        dir = -1;
        timer = setTimeout(tick, 1700);
        return;
      }
      if (dir < 0 && ci <= 0) {
        dir = 1;
        pi = (pi + 1) % prompts.length;
        timer = setTimeout(tick, 360);
        return;
      }
      timer = setTimeout(tick, dir > 0 ? 52 : 26);
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [prompts]);

  return text;
}

// Editorial hero — radial gradient band, giant faded ZAVOIA backdrop word,
// headline + subcopy, and a command-search pill with animated placeholder.
// Clicking opens the command-search overlay at the "what" step. The pill is a
// decorative typewriter (no real input), so there is no typed text to carry.
export function Hero() {
  const { dict } = useTranslation();
  const { openSearch } = useSearchOverlay();
  const h = dict.homeSections.hero;
  // `prompts` comes from the module-level dictionary, so its identity is stable
  // for a given locale — the typewriter effect only restarts on locale change.
  const tw = useTypewriter(h.prompts);

  const go = () => openSearch({ step: "what" });

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(135% 95% at 50% -12%, #FDFCF8 0%, #F4F1E8 48%, var(--c-shade) 100%)",
        borderBottom: "1px solid rgba(28,28,26,0.05)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: "clamp(180px, 28vw, 420px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            color: "rgba(28,28,26,0.027)",
            whiteSpace: "nowrap",
            lineHeight: 1,
            userSelect: "none",
            transform: "translateY(8%)",
          }}
        >
          ZAVOIA
        </span>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "62%",
          transform: "translate(-50%, -50%)",
          width: 760,
          height: 360,
          borderRadius: "50%",
          pointerEvents: "none",
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--p-400) 9%, transparent) 0%, transparent 100%)",
        }}
      />
      <div
        className="zw-container"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "clamp(76px, 10vw, 148px) var(--gutter)",
        }}
      >
        <h1
          className="txt-balance zw-rise"
          style={{
            margin: 0,
            fontSize: "clamp(48px, 6.6vw, 88px)",
            fontWeight: 600,
            letterSpacing: "-0.052em",
            lineHeight: 0.93,
            color: "var(--c-900)",
            maxWidth: 1000,
          }}
        >
          {h.headlineLead}
          <br />
          <span style={{ color: "var(--c-400)" }}>{h.headlineAccent}</span>
        </h1>
        <p
          className="txt-pretty zw-rise"
          data-d="1"
          style={{
            margin: "26px 0 48px",
            fontSize: "clamp(16px, 1.5vw, 19px)",
            lineHeight: 1.55,
            color: "var(--c-600)",
            maxWidth: 540,
          }}
        >
          {h.subcopy}
        </p>
        <div
          className="zw-rise"
          data-d="2"
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={go}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go();
              }
            }}
            className="zw-hover-lift"
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: 640,
              cursor: "text",
              background: "#fff",
              borderRadius: 999,
              border: "1px solid rgba(28,28,26,0.07)",
              boxShadow:
                "0 1px 2px rgba(28,28,26,0.04), 0 8px 24px rgba(28,28,26,0.07), 0 24px 56px rgba(28,28,26,0.09)",
              padding: "9px 9px 9px 22px",
            }}
          >
            <Icon name="search" size={20} color="var(--c-500)" />
            <span
              style={{
                flex: 1,
                minWidth: 0,
                marginLeft: 14,
                fontSize: 17,
                fontWeight: 500,
                color: "var(--c-500)",
                letterSpacing: "-0.015em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textAlign: "left",
              }}
            >
              {h.searchTryPrefix} “{tw}”
              <span
                className="zw-caret"
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1.05em",
                  background: "var(--p-500)",
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                }}
              />
            </span>
            <button
              type="button"
              className="tap"
              aria-label={h.searchAria}
              onClick={(e) => {
                e.stopPropagation();
                go();
              }}
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                border: 0,
                cursor: "pointer",
                flexShrink: 0,
                background:
                  "radial-gradient(125% 125% at 32% 24%, color-mix(in oklch, var(--p-400) 55%, var(--p-500)) 0%, var(--p-600) 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 2px rgba(28,28,26,0.10), 0 8px 22px color-mix(in oklch, var(--p-500) 42%, transparent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="search" size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
