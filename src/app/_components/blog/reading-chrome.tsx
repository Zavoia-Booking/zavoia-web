"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";

// Single rAF-throttled scroll-progress hook (0..1 of the article read).
// Ported from zwUseScrollProgress (web-blog.jsx:18-36). The SSR guard lives
// inside the effect — `window`/`document` are only touched after mount.
function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}

const R = 17;
const C = 2 * Math.PI * R;

// Reading chrome — owns the one scroll-progress value and feeds BOTH the top
// hairline bar (ZwReadProgress, web-blog.jsx:39-51) and the left share rail
// (ZwShareRail, web-blog.jsx:438-471). The `.zw-share-rail` is auto-hidden
// below 1380px by globals.css. The byline/avatar from the prototype is absent
// here by design — this component carries no author data.
export function ReadingChrome({ title }: { title: string }) {
  const progress = useScrollProgress();
  const { dict } = useTranslation();
  const toast = useToast();

  const copy = () => {
    if (typeof window === "undefined") return;
    try {
      void navigator.clipboard?.writeText(window.location.href);
    } catch {
      // clipboard may be unavailable; the toast still confirms intent
    }
    toast(dict.blog.linkCopied, "check");
  };

  const share = () => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => {});
    } else {
      copy();
    }
  };

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Top progress hairline (mobile + safety net) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "var(--nav-h)",
          left: 0,
          right: 0,
          height: 2,
          zIndex: 120,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "var(--p-500)",
            transform: `scaleX(${progress.toFixed(4)})`,
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* Left share rail — reading ring + actions */}
      <div className="zw-share-rail" aria-label={dict.blog.shareLabel}>
        <div
          style={{
            position: "relative",
            width: 42,
            height: 42,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 42 42"
            style={{ transform: "rotate(-90deg)" }}
            aria-hidden="true"
          >
            <circle
              className="zw-ring-track"
              cx="21"
              cy="21"
              r={R}
              fill="none"
              strokeWidth="2.5"
            />
            <circle
              className="zw-ring-fill"
              cx="21"
              cy="21"
              r={R}
              fill="none"
              strokeWidth="2.5"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <span
            style={{
              position: "absolute",
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--c-700)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(progress * 100)}
          </span>
        </div>
        <span
          style={{ width: 1, height: 14, background: "rgba(28,28,26,0.12)" }}
        />
        <button
          className="zw-share-btn"
          onClick={copy}
          aria-label={dict.blog.copyLink}
          data-tip={dict.blog.copyLink}
        >
          <Icon name="link" size={17} />
        </button>
        <button
          className="zw-share-btn"
          onClick={share}
          aria-label={dict.blog.shareLabel}
          data-tip={dict.blog.shareLabel}
        >
          <Icon name="share" size={16} />
        </button>
        <button
          className="zw-share-btn"
          onClick={toTop}
          aria-label={dict.blog.backToTop}
          data-tip={dict.blog.backToTop}
          style={{
            opacity: progress > 0.08 ? 1 : 0,
            pointerEvents: progress > 0.08 ? "auto" : "none",
            transition: "opacity .3s var(--ease-soft)",
          }}
        >
          <Icon name="arrowU" size={16} />
        </button>
      </div>
    </>
  );
}
