"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { Kicker } from "@/components/ui/kicker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Img } from "@/components/ui/image";
import { CatDot } from "@/components/ui/cat-dot";
import type { BusinessCardData } from "@/components/business";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

// ── Interruptible rAF scroll tween (ported from docs/web-featured.jsx
// zwCancelScroll/zwAnimateScroll). We can't rely on native
// scrollTo({behavior:'smooth'}) for chained paging, so we animate scrollLeft
// ourselves with an expo-out ease. Tween bookkeeping lives in a module-level
// WeakMap keyed by the rail element — TS-safe, no untyped DOM expandos.
type TweenState = { raf: number; to: number | null };
const tweens = new WeakMap<HTMLElement, TweenState>();

function getTween(el: HTMLElement): TweenState {
  let t = tweens.get(el);
  if (!t) {
    t = { raf: 0, to: null };
    tweens.set(el, t);
  }
  return t;
}

function cancelScroll(el: HTMLElement | null) {
  if (!el) return;
  const t = tweens.get(el);
  if (t && t.raf) {
    cancelAnimationFrame(t.raf);
    t.raf = 0;
    t.to = null;
  }
}

function animateScroll(el: HTMLElement | null, to: number, dur = 760) {
  if (!el) return;
  cancelScroll(el);
  const t = getTween(el);
  const from = el.scrollLeft;
  const max = el.scrollWidth - el.clientWidth;
  const target = Math.max(0, Math.min(max, to));
  const dist = target - from;
  if (Math.abs(dist) < 1) {
    el.scrollLeft = target;
    return;
  }
  t.to = target;
  const t0 = performance.now();
  // expo-out — fast launch, long velvety settle
  const ease = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / dur);
    el.scrollLeft = from + dist * ease(p);
    if (p < 1) {
      t.raf = requestAnimationFrame(tick);
    } else {
      el.scrollLeft = target;
      t.raf = 0;
      t.to = null;
    }
  };
  t.raf = requestAnimationFrame(tick);
}

// ── Editor's-pick card (ported from docs/web-featured.jsx ZwBizEditorialCard) ──
// Photo + category chip, with a white card overhanging below: mono city kicker,
// star rating, name, and a "View profile →" chevron that nudges on hover. The
// whole card links to the business profile. No blurb (BusinessCardData has none).
function EditorsPickCard({
  b,
  viewProfileLabel,
}: {
  b: BusinessCardData;
  viewProfileLabel: string;
}) {
  const inner = (
    <>
      {/* Photo */}
      <div
        className="zw-zoom-wrap"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 4.2",
          borderRadius: 22,
          overflow: "hidden",
          background: "var(--c-300)",
          boxShadow: "var(--sh-md)",
        }}
      >
        <Img
          src={b.image}
          alt={b.name}
          label={b.catLabel ?? b.cat}
          style={{ width: "100%", height: "100%" }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 32%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "5px 11px",
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--c-800)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CatDot cat={b.cat} size={6} />
          {b.catLabel}
        </span>
      </div>

      {/* Overhang card */}
      <div
        style={{
          margin: "-26px 14px 0",
          position: "relative",
          background: "#fff",
          border: "1px solid rgba(28,28,26,0.06)",
          borderRadius: 18,
          boxShadow: "var(--sh-sm)",
          padding: "14px 17px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--p-600)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {b.city}
          </div>
          {b.rating != null && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--c-900)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <Icon name="star" size={12} color="var(--p-500)" />
              {b.rating.toFixed(1)}
              {b.reviews != null && (
                <span style={{ color: "var(--c-500)", fontWeight: 500 }}>
                  ({b.reviews})
                </span>
              )}
            </span>
          )}
        </div>
        <h3
          className="txt-balance"
          style={{
            margin: "6px 0 0",
            fontSize: "clamp(20px, 1.4vw, 22px)",
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.028em",
            lineHeight: 1.06,
          }}
        >
          {b.name}
        </h3>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--p-700)",
            }}
          >
            {viewProfileLabel}
            <span className="zw-card-cta-arrow" style={{ display: "inline-flex" }}>
              <Icon name="chevR" size={13} color="var(--p-700)" />
            </span>
          </span>
        </div>
      </div>
    </>
  );

  if (b.href) {
    return (
      <Link
        href={b.href}
        className="zw-hover-lift zw-zoom-parent"
        style={{ position: "relative", textDecoration: "none", display: "block" }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <article
      className="zw-hover-lift zw-zoom-parent"
      style={{ position: "relative" }}
    >
      {inner}
    </article>
  );
}

// Disabled/opacity/cursor/boxShadow are driven imperatively by the rAF loop;
// we only set sensible initial inline styles here (prev disabled-looking,
// next available). The ref lets the loop reach the live <button>.
function RailArrow({
  dir,
  onClick,
  ariaLabel,
  innerRef,
}: {
  dir: -1 | 1;
  onClick: () => void;
  ariaLabel: string;
  innerRef: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="tap"
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        cursor: dir < 0 ? "default" : "pointer",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.12)",
        boxShadow: dir < 0 ? "none" : "var(--sh-sm)",
        opacity: dir < 0 ? 0.55 : 1,
        transition:
          "opacity .25s var(--ease-soft), box-shadow .25s var(--ease-soft)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={dir < 0 ? "chevL" : "chevR"} size={17} color="var(--c-800)" />
    </button>
  );
}

// EDITOR'S PICK — full-bleed dark band. Left: intro + CTA + vertical stepper +
// pager + progress thumb. Right: a rail of editorial cards that bleeds off the
// screen edge. Faithful port of the prototype's (docs/web-featured.jsx
// ZwFeatSplit) imperative motion engine: one rAF loop reads the rail's live
// scrollLeft and drives EVERYTHING — fade-over backdrop, card emphasis,
// stepper dot, progress thumb, counter (WAAPI slide-up) and arrow availability
// — with NO React state updates during scroll (no re-renders). The loop
// self-parks ~10 idle frames after motion settles and wakes on input/resize.
// Reduced-motion safe. Tone is DARK (the home band).
export function EditorsPick({ cards }: { cards: BusinessCardData[] }) {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.editorsPick;

  const railRef = useRef<HTMLDivElement>(null);
  const backdropRefs = useRef<(HTMLElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const n = cards.length;

  // Page in PROGRESS space so each click advances the selected card by one and
  // the final click lands exactly at max scroll (last card selected, N/N) — the
  // bleeding rail's leftmost-card index can't reach the last card on its own.
  // Basis is measured from where the tween is HEADED (tween.to) if mid-flight,
  // so rapid clicks chain cleanly. Under reduced motion we jump instantly.
  const step = useCallback(
    (dir: -1 | 1) => {
      const el = railRef.current;
      if (!el || n <= 1) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const stride = max / (n - 1); // scroll distance per selected-card step
      const tween = tweens.get(el);
      const basis = tween && tween.to != null ? tween.to : el.scrollLeft;
      const cur = Math.round(Math.min(1, Math.max(0, basis / max)) * (n - 1));
      const next = Math.max(0, Math.min(n - 1, cur + dir));
      const target = next * stride;
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        cancelScroll(el);
        el.scrollLeft = target;
      } else {
        animateScroll(el, target);
      }
    },
    [n],
  );

  // The single imperative rAF loop. Deps = [n] (cards.length): the only React
  // value it closes over. No setState here → no re-renders during scroll.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = false;
    let idle = 0;
    let lastSL = -1;
    let lastCount = -1;

    const frame = () => {
      const sl = rail.scrollLeft;
      const max = rail.scrollWidth - rail.clientWidth;
      // When every card fits without scrolling (few cards / wide viewport)
      // there is nothing to page: hide the pager + progress thumb and show
      // all cards at full emphasis. Re-evaluated live (ResizeObserver wakes
      // the loop), so shrinking the window brings the pager back.
      const noScroll = max <= 2;
      if (pagerRef.current)
        pagerRef.current.style.display = noScroll ? "none" : "flex";
      if (progressRef.current)
        progressRef.current.style.display = noScroll ? "none" : "block";
      const frac = max > 0 ? Math.min(1, Math.max(0, sl / max)) : 0;
      const thumb = Math.min(1, rail.clientWidth / Math.max(1, rail.scrollWidth));
      // Active position in [0, n-1], driven by scroll PROGRESS rather than the
      // leftmost-card index. In a bleeding rail several cards are visible at max
      // scroll, so a card-width index caps a couple short of the last card and
      // it could never become the selected one (the reported "stuck at 9/10").
      // Mapping `frac` across [0, n-1] guarantees the FIRST card is selected at
      // the start and the LAST card at the very end — backdrop, card emphasis
      // and counter all stay in lockstep.
      const p = n > 1 ? frac * (n - 1) : 0;

      // Backdrop — fade-OVER, not cross-dissolve: the outgoing photo stays
      // fully opaque while the incoming one fades in on top (later sibling
      // stacks above), so the band never dips dark mid-transition. The
      // incoming photo also settles from a faint zoom + slight translateX.
      const bd = backdropRefs.current;
      const base = Math.max(0, Math.min(bd.length - 1, Math.floor(p)));
      const f = Math.max(0, Math.min(1, p - base));
      const t = f * f * (3 - 2 * f); // smoothstep
      for (let i = 0; i < bd.length; i++) {
        const img = bd[i];
        if (!img) continue;
        let o = 0;
        let sc = 1;
        let dx = 0;
        if (i === base) {
          o = 1;
        } else if (i === base + 1) {
          o = t;
          sc = 1 + 0.045 * (1 - t);
          dx = 1.4 * (1 - t);
        }
        img.style.opacity = o.toFixed(3);
        img.style.transform =
          reduce || (sc === 1 && dx === 0)
            ? "scale(1)"
            : `translateX(${dx.toFixed(3)}%) scale(${sc.toFixed(4)})`;
      }

      // Cards — pronounced hierarchy: the in-view card reads full size;
      // neighbours sit ~8% smaller, dimmer and slightly sunk, easing up into
      // full size as they arrive (smoothstep on distance from active).
      const cr = cardRefs.current;
      for (let i = 0; i < cr.length; i++) {
        const el = cr[i];
        if (!el) continue;
        const d = noScroll ? 0 : Math.min(1, Math.abs(i - p));
        const e = d * d * (3 - 2 * d);
        el.style.opacity = (1 - 0.3 * e).toFixed(3);
        el.style.transform = reduce
          ? "none"
          : `translateY(${(10 * e).toFixed(2)}px) scale(${(1 - 0.075 * e).toFixed(4)})`;
      }

      // Stepper dot travels the vertical track; progress thumb width + left.
      if (dotRef.current) dotRef.current.style.top = `${(6 + frac * 88).toFixed(2)}%`;
      if (barRef.current) {
        barRef.current.style.width = `${Math.max(14, thumb * 100).toFixed(2)}%`;
        barRef.current.style.left = `${(frac * (1 - thumb) * 100).toFixed(2)}%`;
      }

      // Counter tracks the same progress-based active position (reaches N/N at
      // the very end). Replay the slide-up only when the integer changes (skip
      // the first paint + reduced motion).
      const ci = Math.round(p);
      if (ci !== lastCount && counterRef.current) {
        const first = lastCount === -1;
        lastCount = ci;
        counterRef.current.textContent = pad2(ci);
        if (!first && !reduce && counterRef.current.animate) {
          counterRef.current.getAnimations().forEach((a) => a.cancel());
          counterRef.current.animate(
            [
              { transform: "translateY(70%)", opacity: 0 },
              { transform: "none", opacity: 1 },
            ],
            { duration: 320, easing: "cubic-bezier(.2,.7,.3,1)" },
          );
        }
      }

      // Arrow availability (imperative — no re-render).
      const atStart = sl <= 2;
      const atEnd = sl >= max - 2;
      const setArrow = (b: HTMLButtonElement | null, off: boolean) => {
        if (!b) return;
        b.disabled = off;
        b.style.opacity = off ? "0.55" : "1";
        b.style.cursor = off ? "default" : "pointer";
        b.style.boxShadow = off ? "none" : "var(--sh-sm)";
      };
      setArrow(prevRef.current, atStart);
      setArrow(nextRef.current, atEnd);

      if (Math.abs(sl - lastSL) < 0.4) idle++;
      else idle = 0;
      lastSL = sl;
      // Never park while a tween is in flight — expo-out's sub-pixel tail
      // would otherwise trip the idle counter and freeze the scene a beat.
      const tween = tweens.get(rail);
      if (idle < 10 || (tween && tween.raf)) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    const ensure = () => {
      if (!running) {
        running = true;
        idle = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    // Manual input takes over instantly — kill any in-flight tween so the
    // user's wheel/drag never fights the programmatic scroll.
    const takeOver = () => {
      cancelScroll(rail);
      ensure();
    };

    frame();
    rail.addEventListener("scroll", ensure, { passive: true });
    rail.addEventListener("wheel", takeOver, { passive: true });
    rail.addEventListener("touchstart", takeOver, { passive: true });
    const ro = new ResizeObserver(ensure);
    ro.observe(rail);
    window.addEventListener("resize", ensure);
    return () => {
      cancelAnimationFrame(raf);
      cancelScroll(rail);
      rail.removeEventListener("scroll", ensure);
      rail.removeEventListener("wheel", takeOver);
      rail.removeEventListener("touchstart", takeOver);
      ro.disconnect();
      window.removeEventListener("resize", ensure);
    };
  }, [n]);

  if (n === 0) return null;

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: 64,
        background: "var(--c-ink)",
      }}
    >
      {/* Cinematic backdrop — the active card's photo, b/w + dimmed, fading
          over its neighbour. Images guarded for missing src (slot → null;
          the rAF loop null-checks bd[i]); array indices stay aligned. */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
        {cards.map((b, i) =>
          b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={b.id ?? i}
              src={b.image}
              alt=""
              ref={(el) => {
                backdropRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(1) brightness(0.46)",
                willChange: "opacity, transform",
                opacity: i === 0 ? 1 : 0,
                transform: i === 0 ? "scale(1)" : "scale(1.05)",
              }}
            />
          ) : null,
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(14,13,11,0.94) 0%, rgba(14,13,11,0.78) 34%, rgba(14,13,11,0.40) 60%, rgba(14,13,11,0.50) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            background:
              "linear-gradient(180deg, rgba(14,13,11,0) 0%, rgba(14,13,11,0.55) 100%)",
          }}
        />
      </div>

      <div
        className="zw-split"
        style={{
          position: "relative",
          padding: "clamp(48px, 6vw, 92px) 0",
          minHeight: "70vh",
        }}
      >
        {/* Intro + pager */}
        <div className="zw-split-left">
          <div style={{ display: "flex", gap: "clamp(20px, 2.2vw, 32px)" }}>
            {/* Vertical stepper track */}
            <div
              aria-hidden="true"
              className="zw-only-desktop"
              style={{
                width: 1,
                alignSelf: "stretch",
                position: "relative",
                flexShrink: 0,
                background: "rgba(255,255,255,0.20)",
              }}
            >
              <span
                ref={dotRef}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "6%",
                  transform: "translate(-50%, -50%)",
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--p-400)",
                  boxShadow: "0 0 0 4px rgba(255,255,255,0.14)",
                }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <Kicker
                color="color-mix(in oklch, var(--p-400) 78%, #fff)"
                style={{ marginBottom: 16 }}
              >
                {s.kicker}
              </Kicker>
              <h2
                className="txt-balance"
                style={{
                  margin: 0,
                  fontSize: "clamp(34px, 3.4vw, 54px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                  color: "#fff",
                  textShadow: "0 2px 24px rgba(0,0,0,0.35)",
                }}
              >
                {s.title}
              </h2>
              <p
                className="txt-pretty"
                style={{
                  margin: "20px 0 30px",
                  fontSize: "clamp(15px, 1.3vw, 17px)",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.76)",
                  maxWidth: 380,
                }}
              >
                {s.sub}
              </p>
              <Link
                href={localeHref(locale, "search")}
                style={{ textDecoration: "none" }}
              >
                <Button kind="secondary" size="lg">
                  {s.cta}
                </Button>
              </Link>

              {/* Pager (hidden by the rAF loop when the rail has no overflow) */}
              <div
                ref={pagerRef}
                style={{
                  marginTop: "clamp(30px, 3.2vw, 44px)",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <div style={{ display: "flex", gap: 9 }}>
                  <RailArrow
                    dir={-1}
                    onClick={() => step(-1)}
                    ariaLabel={s.prev}
                    innerRef={prevRef}
                  />
                  <RailArrow
                    dir={1}
                    onClick={() => step(1)}
                    ariaLabel={s.next}
                    innerRef={nextRef}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.90)",
                    fontVariantNumeric: "tabular-nums",
                    display: "inline-flex",
                    overflow: "hidden",
                  }}
                >
                  <span
                    ref={counterRef}
                    style={{ display: "inline-block", opacity: 1 }}
                  >
                    {pad2(0)}
                  </span>
                  <span style={{ opacity: 0.45 }}>&nbsp;/ {pad2(n - 1)}</span>
                </span>
              </div>

              {/* Progress thumb (hidden alongside the pager when no overflow) */}
              <div
                ref={progressRef}
                style={{
                  marginTop: 18,
                  height: 3,
                  borderRadius: 999,
                  maxWidth: 240,
                  background: "rgba(255,255,255,0.22)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  ref={barRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: "#fff",
                    width: "30%",
                    left: "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card rail — bleeds off the right edge */}
        <div className="zw-split-right">
          <div ref={railRef} className="zw-carousel-rail zw-rail-split">
            {cards.map((b, i) => (
              <div
                key={b.id ?? i}
                data-card
                className="zw-carousel-card"
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{
                  transformOrigin: "left center",
                  willChange: "transform, opacity",
                  opacity: i === 0 ? 1 : 0.7,
                  transform:
                    i === 0 ? "none" : "translateY(10px) scale(0.925)",
                }}
              >
                <EditorsPickCard b={b} viewProfileLabel={s.viewProfile} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
