"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { Icon } from "@/components/ui/icon";
import type { PublicWebsiteShowcaseCard } from "@/lib/api/marketplace/types";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { industryVisual } from "@/lib/marketplace/industry-visuals";
import { canOptimizePublicImage } from "@/lib/image-sources";
import type { Locale } from "@/i18n/locales";
import { WebsiteHeroPreview } from "./website-hero-preview";
import cardStyles from "./website-card.module.css";
import studioActions from "./studio-actions.module.css";
import styles from "./website-showcase.module.css";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/** Full-width backdrop; retain the native image ref used by the scroll animation. */
function BackdropImage({ src, title, initial, onImageRef }: {
  src: string;
  title: string;
  initial: boolean;
  onImageRef: (node: HTMLImageElement | null) => void;
}) {
  const [useOriginal, setUseOriginal] = useState(false);
  const optimized = !useOriginal && canOptimizePublicImage(src)
    ? getImageProps({ src, alt: "", fill: true, sizes: "100vw", loading: "lazy" }).props
    : null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      sizes={optimized?.sizes}
      loading="lazy"
      decoding="async"
      alt=""
      title={title}
      onError={() => { if (optimized?.srcSet) setUseOriginal(true); }}
      ref={(node) => {
        onImageRef(node);
        if (optimized?.srcSet && node?.complete && node.naturalWidth === 0 && node.currentSrc) setUseOriginal(true);
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "grayscale(1) brightness(0.46)",
        willChange: "opacity, transform",
        opacity: initial ? 1 : 0,
        transform: initial ? "scale(1)" : "scale(1.05)",
      }}
    />
  );
}

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

// The compact caption identifies the website. The inert hero is only a preview;
// the outer link is the card's single action and opens the published website.
function WebsiteCard({
  site,
  locale,
  viewWebsiteLabel,
  industryLabel,
}: {
  site: PublicWebsiteShowcaseCard;
  locale: Locale;
  viewWebsiteLabel: string;
  industryLabel: string | null;
}) {
  const visual = site.industry ? industryVisual(toCat(site.industry)) : null;

  return (
    <Link
      href={localeHref(locale, site.slug)}
      prefetch={false}
      draggable={false}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${viewWebsiteLabel}: ${site.name}`}
      title={`${viewWebsiteLabel}: ${site.name}`}
      className={`${cardStyles.card} zw-hover-lift zw-zoom-parent`}
    >
      <WebsiteHeroPreview site={site} locale={locale} />
      <div className={cardStyles.caption}>
        <div className={cardStyles.identity}>
          <h3 title={site.name} className={cardStyles.name}>{site.name}</h3>
        </div>
        {visual && industryLabel && (
          <div className={cardStyles.industry}>
            <Icon name={visual.icon} size={16} color={visual.accent} />
            <span title={industryLabel} className={cardStyles.industryLabel}>
              {industryLabel}
            </span>
          </div>
        )}
      </div>
    </Link>
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

// WEBSITE SHOWCASE — full-bleed dark band. Left: intro + CTA + vertical stepper +
// pager + progress thumb. Right: a rail of editorial cards that bleeds off the
// screen edge. Faithful port of the prototype's (docs/web-featured.jsx
// ZwFeatSplit) imperative motion engine: one rAF loop reads the rail's live
// scrollLeft and drives EVERYTHING — fade-over backdrop, card emphasis,
// stepper dot, progress thumb, counter (WAAPI slide-up) and arrow availability
// — with NO React state updates during scroll (no re-renders). The loop
// self-parks ~10 idle frames after motion settles and wakes on input/resize.
// Reduced-motion safe. Tone is DARK (the home band).
export function WebsiteShowcase({ cards }: { cards: PublicWebsiteShowcaseCard[] }) {
  const { locale, dict } = useTranslation();
  const s = dict.homeSections.websiteShowcase;

  const railRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const backdropRefs = useRef<(HTMLElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
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
    let drag: { id: number; x: number; y: number; scrollLeft: number; moved: boolean } | null = null;
    let suppressClick = false;

    const frame = () => {
      const sl = rail.scrollLeft;
      const max = rail.scrollWidth - rail.clientWidth;
      // When every card fits without scrolling (few cards / wide viewport)
      // there is nothing to page: hide the controls while preserving their
      // layout footprint, and show all cards at full emphasis. Re-evaluated live (ResizeObserver wakes
      // the loop), so shrinking the window brings the pager back.
      const noScroll = max <= 2;
      rail.dataset.scrollable = noScroll ? "false" : "true";
      if (controlsRef.current)
        controlsRef.current.dataset.scrollable = noScroll ? "false" : "true";
      if (pagerRef.current)
        pagerRef.current.style.visibility = noScroll ? "hidden" : "visible";
      if (progressRef.current)
        progressRef.current.style.visibility = noScroll ? "hidden" : "visible";
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

      // Cards stay fully opaque; size and position distinguish the active card.
      // Neighbours ease into full size as they arrive.
      const cr = cardRefs.current;
      for (let i = 0; i < cr.length; i++) {
        const el = cr[i];
        if (!el) continue;
        const d = noScroll ? 0 : Math.min(1, Math.abs(i - p));
        const e = d * d * (3 - 2 * d);
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
      if (previewRef.current) {
        previewRef.current.dataset.edgeStart = !noScroll && !atStart ? "true" : "false";
        previewRef.current.dataset.edgeEnd = !noScroll && !atEnd ? "true" : "false";
      }
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

    const finishDrag = () => {
      const current = drag;
      drag = null;
      delete rail.dataset.dragging;
      if (current && rail.hasPointerCapture(current.id)) rail.releasePointerCapture(current.id);
    };
    const pointerDown = (event: PointerEvent) => {
      if (drag) return;
      suppressClick = false;
      // Keep native touch panning, modified clicks and secondary buttons intact.
      if (!event.isPrimary || event.button !== 0 || event.pointerType === "touch" ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          rail.scrollWidth - rail.clientWidth <= 2) return;
      takeOver();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scrollLeft: rail.scrollLeft, moved: false };
    };
    const pointerMove = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if ((event.buttons & 1) === 0) { finishDrag(); return; }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= 5) return;
        if (Math.abs(dy) > Math.abs(dx)) { finishDrag(); return; }
        drag.moved = true;
        suppressClick = true;
        rail.dataset.dragging = "true";
        // Capture only after movement, so ordinary clicks retain their link target.
        try {
          rail.setPointerCapture(event.pointerId);
        } catch {
          // Window listeners also keep tracking when capture is unavailable.
        }
      }
      event.preventDefault();
      rail.scrollLeft = drag.scrollLeft - dx;
      ensure();
    };
    const pointerEnd = (event: PointerEvent) => {
      if (drag?.id === event.pointerId) finishDrag();
    };
    const click = (event: MouseEvent) => {
      if (!suppressClick || event.detail === 0) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const preventNativeDrag = (event: DragEvent) => event.preventDefault();

    frame();
    rail.addEventListener("scroll", ensure, { passive: true });
    rail.addEventListener("wheel", takeOver, { passive: true });
    rail.addEventListener("touchstart", takeOver, { passive: true });
    rail.addEventListener("pointerdown", pointerDown);
    rail.addEventListener("lostpointercapture", pointerEnd);
    rail.addEventListener("click", click, true);
    rail.addEventListener("dragstart", preventNativeDrag);
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", pointerEnd);
    window.addEventListener("pointercancel", pointerEnd);
    window.addEventListener("blur", finishDrag);
    const ro = new ResizeObserver(ensure);
    ro.observe(rail);
    window.addEventListener("resize", ensure);
    return () => {
      cancelAnimationFrame(raf);
      cancelScroll(rail);
      finishDrag();
      rail.removeEventListener("scroll", ensure);
      rail.removeEventListener("wheel", takeOver);
      rail.removeEventListener("touchstart", takeOver);
      rail.removeEventListener("pointerdown", pointerDown);
      rail.removeEventListener("lostpointercapture", pointerEnd);
      rail.removeEventListener("click", click, true);
      rail.removeEventListener("dragstart", preventNativeDrag);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerEnd);
      window.removeEventListener("pointercancel", pointerEnd);
      window.removeEventListener("blur", finishDrag);
      ro.disconnect();
      window.removeEventListener("resize", ensure);
    };
  }, [n]);

  if (n === 0) return null;

  return (
    <section
      id="website-showcase"
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
          b.heroImageUrl ? (
            <BackdropImage
              key={`${b.businessId}:${b.heroImageUrl}`}
              src={b.heroImageUrl}
              title={`${s.viewWebsite}: ${b.name}`}
              initial={i === 0}
              onImageRef={(el) => {
                backdropRefs.current[i] = el;
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

      <div className={`zw-container ${styles.layout}`}>
        {/* Vertical stepper track */}
        <div aria-hidden="true" className={`zw-only-desktop ${styles.stepper}`}>
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

        <div className={styles.intro}>
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
            className={`txt-pretty ${styles.description}`}
            style={{
              fontSize: "clamp(15px, 1.3vw, 17px)",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.76)",
              maxWidth: 380,
            }}
          >
            {s.sub}
          </p>
        </div>

        {/* Mobile reading and keyboard order: preview, pager, then Web Studio actions. */}
        <div ref={previewRef} className={styles.preview}>
          <div
            ref={railRef}
            className={`zw-carousel-rail zw-rail-split ${styles.rail}`}
          >
            {cards.map((b, i) => (
              <div
                key={b.businessId}
                data-card
                className={`zw-carousel-card ${styles.railCard}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{
                  transformOrigin: "left center",
                  willChange: "transform",
                  transform: i === 0 ? "none" : "translateY(10px) scale(0.925)",
                }}
              >
                <WebsiteCard
                  site={b}
                  locale={locale}
                  viewWebsiteLabel={s.viewWebsite}
                  industryLabel={
                    b.industry
                      ? taxonomyLabel(b.industry, locale, dict.industries)
                      : null
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div
          ref={controlsRef}
          className={styles.controls}
          data-scrollable={n > 1 ? "true" : "false"}
        >
          {/* Pager (hidden by the rAF loop when the rail has no overflow) */}
          <div
            ref={pagerRef}
            className={styles.pager}
            style={{
              visibility: n <= 1 ? "hidden" : "visible",
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
            className={styles.progress}
            style={{
              marginTop: 18,
              visibility: n <= 1 ? "hidden" : "visible",
              height: 3,
              borderRadius: 999,
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

        <div className={`${studioActions.actions} ${styles.actions}`}>
          <Link
            href={localeHref(locale, "web-studio")}
            title={s.cta}
            className={`tap zw-btn ${styles.primary}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              background: "#fff",
              color: "var(--c-900)",
              border: "1px solid rgba(28,28,26,0.14)",
              borderRadius: "var(--r-full)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {s.cta}
          </Link>
          <Link
            className={`${studioActions.secondary} ${styles.secondary}`}
            href={{
              pathname: localeHref(locale, "web-studio", "demo"),
              query: { returnTo: `${localeHref(locale)}#website-showcase` },
            }}
          >
            {dict.webStudio.hero.demoCta}
            <span className={styles.demoArrow}>
              <Icon name="arrowR" size={16} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
