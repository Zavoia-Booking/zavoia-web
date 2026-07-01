// Zavoia Web — Featured businesses: the SPLIT SPOTLIGHT.
// A full-bleed band (dark by default — Tweaks → Spotlight tone): editorial
// intro + pager on the left, and a rail of Editor's-Pick cards on the right
// that bleeds off the screen edge. The active card's photo doubles as the
// band's cinematic b/w backdrop and crossfades/settles as you page.
//
// Micro-animation system:
//   · rail paging      — interruptible rAF tween (zwAnimateScroll), expo-out
//   · backdrop         — incoming photo fades in OVER the (still-opaque)
//                        outgoing one while settling 1.045 → 1, so there is
//                        never a dark dip mid-transition
//   · card emphasis    — clear size hierarchy: the in-view card is full
//                        size; peeking cards sit ~8% smaller, dimmer and
//                        slightly sunk, rising + growing as they arrive
//   · counter          — digits slide up on change (zw-num-in)
//   · stepper dot      — travels along the vertical track with the scroll

const { useState: useStateFT, useRef: useRefFT, useEffect: useEffectFT } = React;

function zwFeaturedList() {
  const all = window.ZV_BUSINESSES || [];
  return all.filter(b => b.rating >= 4.8).slice(0, 9);
}

const zwPad2 = (n) => String(n + 1).padStart(2, '0');

// Programmatic smooth scroll via rAF tween. We can't rely on native
// scrollBy({behavior:'smooth'}) — it's a no-op in sandboxed preview
// iframes — so we animate scrollLeft ourselves (works everywhere).
// Interruptible: a new call (or zwCancelScroll) kills any in-flight tween,
// so rapid paging re-targets smoothly instead of two loops fighting.
function zwCancelScroll(el) {
  if (el && el.__zwTween) { cancelAnimationFrame(el.__zwTween); el.__zwTween = 0; el.__zwTweenTo = null; }
}
function zwAnimateScroll(el, to, dur = 760) {
  if (!el) return;
  zwCancelScroll(el);
  const from = el.scrollLeft;
  const max = el.scrollWidth - el.clientWidth;
  const target = Math.max(0, Math.min(max, to));
  const dist = target - from;
  if (Math.abs(dist) < 1) { el.scrollLeft = target; return; }
  el.__zwTweenTo = target;
  const t0 = performance.now();
  // expo-out — fast launch, long velvety settle
  const ease = (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    el.scrollLeft = from + dist * ease(p);
    if (p < 1) { el.__zwTween = requestAnimationFrame(tick); }
    else { el.scrollLeft = target; el.__zwTween = 0; el.__zwTweenTo = null; }
  };
  el.__zwTween = requestAnimationFrame(tick);
}

// ── Editor's-Pick card (mirrors the app's ZvFeaturedSpotlight) ──
// Photo + category chip, white card overhanging below with location kicker,
// rating, name, blurb and a "View profile" link. Whole card → profile.
function ZwBizEditorialCard({ b, ctx }) {
  return (
    <article role="button" tabIndex={0}
             onClick={() => ctx.go('biz/' + b.id)}
             onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('biz/' + b.id); }}
             className="zw-hover-lift zw-zoom-parent"
             style={{ position: 'relative', cursor: 'pointer' }}>
      {/* Photo */}
      <div className="zw-zoom-wrap" style={{
        position: 'relative', width: '100%', aspectRatio: '4 / 3',
        borderRadius: 22, overflow: 'hidden',
        background: 'var(--c-300)', boxShadow: 'var(--sh-md)',
      }}>
        <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 32%)',
        }}></div>
        <span style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, color: 'var(--c-800)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <ZwCatDot cat={b.cat} size={6}></ZwCatDot>
          {b.catLabel}
        </span>
      </div>

      {/* Overhang card with type */}
      <div style={{
        margin: '-26px 14px 0', position: 'relative',
        background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
        borderRadius: 18, boxShadow: 'var(--sh-sm)', padding: '14px 17px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--p-600)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
          }}>{b.city}</div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
            fontSize: 13, fontWeight: 600, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums',
          }}>
            <ZIcon name="star" size={12} color="var(--p-500)"></ZIcon>
            {b.rating.toFixed(1)}
            <span style={{ color: 'var(--c-500)', fontWeight: 500 }}>({b.reviews})</span>
          </span>
        </div>
        <h3 className="txt-balance" style={{
          margin: '6px 0 0', fontSize: 'clamp(20px, 1.4vw, 22px)', fontWeight: 600,
          color: 'var(--c-900)', letterSpacing: '-0.028em', lineHeight: 1.06,
        }}>{b.name}</h3>
        <p className="txt-pretty" style={{
          margin: '6px 0 0', fontSize: 13.5, color: 'var(--c-600)',
          letterSpacing: '-0.005em', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{b.blurb}</p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12.5, fontWeight: 600, color: 'var(--p-700)',
          }}>
            View profile
            <span className="zw-card-cta-arrow" style={{ display: 'inline-flex' }}>
              <ZIcon name="chevR" size={13} color="var(--p-700)"></ZIcon>
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

function ZwRailArrow({ dir, onClick, light = false, innerRef }) {
  return (
    <button ref={innerRef} onClick={onClick} className="tap"
            aria-label={dir < 0 ? 'Previous' : 'Next'}
            style={{
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              background: '#fff', border: '1px solid rgba(28,28,26,0.12)',
              boxShadow: 'var(--sh-sm)', opacity: dir < 0 ? (light ? 0.55 : 0.4) : 1,
              transition: 'opacity .25s var(--ease-soft), box-shadow .25s var(--ease-soft)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
      <ZIcon name={dir < 0 ? 'chevL' : 'chevR'} size={17} color="var(--c-800)"></ZIcon>
    </button>
  );
}

function ZwFeatSplit({ ctx, list, tone = 'dark',
                      kicker = "Editor's picks",
                      title = 'The standouts near you',
                      sub = 'The highest-rated studios and pros in your area, hand-picked. Open a profile to see services and book.',
                      ctaLabel = 'See all businesses',
                      onCta }) {
  const railRef = useRefFT(null);
  const backdropRefs = useRefFT([]);
  const cardRefs = useRefFT([]);
  const dotRef = useRefFT(null);
  const barRef = useRefFT(null);
  const counterRef = useRefFT(null);
  const prevRef = useRefFT(null);
  const nextRef = useRefFT(null);
  const dark = tone === 'dark';
  const n = list.length;

  const step = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const gap = parseFloat(getComputedStyle(el).columnGap) || 22;
    const w = card ? card.offsetWidth + gap : el.clientWidth * 0.8;
    // Page by logical card index — if a tween is mid-flight, advance from
    // where it's HEADED, so rapid clicks chain cleanly card-to-card.
    const basis = el.__zwTweenTo != null ? el.__zwTweenTo : el.scrollLeft;
    const idx = Math.round(basis / w) + dir;
    zwAnimateScroll(el, idx * w);
  };

  // One rAF loop drives the whole scene off the rail's live scroll position
  // — continuous crossfade, card emphasis, stepper, progress and counter.
  // No React state updates during scroll → no re-renders → buttery + cheap.
  // The loop self-parks ~10 frames after motion settles and wakes on scroll.
  useEffectFT(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, running = false, idle = 0, lastSL = -1, lastCount = -1;

    const frame = () => {
      const sl = rail.scrollLeft;
      const card = rail.querySelector('[data-card]');
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 22;
      const stepW = card ? card.offsetWidth + gap : 1;
      const max = rail.scrollWidth - rail.clientWidth;
      const p = stepW ? sl / stepW : 0;
      const frac = max > 0 ? Math.min(1, sl / max) : 0;
      const thumb = Math.min(1, rail.clientWidth / Math.max(1, rail.scrollWidth));

      // Backdrop — fade-OVER, not cross-dissolve: the outgoing photo stays
      // fully opaque while the incoming one fades in on top (later sibling
      // stacks above), so the band never dips dark mid-transition. The
      // incoming photo also settles from a faint zoom.
      const bd = backdropRefs.current;
      const base = Math.max(0, Math.min(bd.length - 1, Math.floor(p)));
      const f = Math.max(0, Math.min(1, p - base));
      const t = f * f * (3 - 2 * f); // smoothstep
      for (let i = 0; i < bd.length; i++) {
        const img = bd[i];
        if (!img) continue;
        let o = 0, s = 1, dx = 0;
        if (i === base) { o = 1; }
        else if (i === base + 1) { o = t; s = 1 + 0.045 * (1 - t); dx = 1.4 * (1 - t); }
        img.style.opacity = o.toFixed(3);
        img.style.transform = (reduce || (s === 1 && dx === 0)) ? 'scale(1)'
          : `translateX(${dx.toFixed(3)}%) scale(${s.toFixed(4)})`;
      }
      // Cards — pronounced hierarchy: the in-view card reads a clear size
      // up; neighbours sit smaller, dimmer and slightly sunk, and ease up
      // into full size as they arrive (smoothstep, not linear).
      const cr = cardRefs.current;
      for (let i = 0; i < cr.length; i++) {
        const el = cr[i];
        if (!el) continue;
        const d = Math.min(1, Math.abs(i - p));
        const e = d * d * (3 - 2 * d);
        el.style.opacity = (1 - 0.3 * e).toFixed(3);
        el.style.transform = reduce ? 'none'
          : `translateY(${(10 * e).toFixed(2)}px) scale(${(1 - 0.075 * e).toFixed(4)})`;
      }
      // Stepper dot + progress thumb
      if (dotRef.current) dotRef.current.style.top = `${(6 + frac * 88).toFixed(2)}%`;
      if (barRef.current) {
        barRef.current.style.width = `${Math.max(14, thumb * 100).toFixed(2)}%`;
        barRef.current.style.left = `${(frac * (1 - thumb) * 100).toFixed(2)}%`;
      }
      // Counter — replay the slide-up only when the integer changes
      const ci = Math.max(0, Math.min(n - 1, Math.round(p)));
      if (ci !== lastCount && counterRef.current) {
        const first = lastCount === -1;
        lastCount = ci;
        counterRef.current.textContent = zwPad2(ci);
        if (!first && !reduce && counterRef.current.animate) {
          counterRef.current.getAnimations().forEach((a) => a.cancel());
          counterRef.current.animate(
            [{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 320, easing: 'cubic-bezier(.2,.7,.3,1)' }
          );
        }
      }
      // Arrow availability (imperative — no re-render)
      const atStart = sl <= 2, atEnd = sl >= max - 2;
      const setArrow = (b, off) => {
        if (!b) return;
        b.disabled = off;
        b.style.opacity = off ? (dark ? '0.55' : '0.4') : '1';
        b.style.cursor = off ? 'default' : 'pointer';
        b.style.boxShadow = off ? 'none' : 'var(--sh-sm)';
      };
      setArrow(prevRef.current, atStart);
      setArrow(nextRef.current, atEnd);

      if (Math.abs(sl - lastSL) < 0.4) idle++; else idle = 0;
      lastSL = sl;
      // Never park while a tween is in flight — expo-out's sub-pixel tail
      // would otherwise trip the idle counter and freeze the scene a beat.
      if (idle < 10 || rail.__zwTween) { raf = requestAnimationFrame(frame); } else { running = false; }
    };
    const ensure = () => { if (!running) { running = true; idle = 0; raf = requestAnimationFrame(frame); } };

    // Manual input takes over instantly — kill any in-flight tween so the
    // user's wheel/drag never fights the programmatic scroll.
    const takeOver = () => { zwCancelScroll(rail); ensure(); };

    frame();
    rail.addEventListener('scroll', ensure, { passive: true });
    rail.addEventListener('wheel', takeOver, { passive: true });
    rail.addEventListener('touchstart', takeOver, { passive: true });
    const ro = new ResizeObserver(ensure);
    ro.observe(rail);
    window.addEventListener('resize', ensure);
    return () => {
      cancelAnimationFrame(raf);
      zwCancelScroll(rail);
      rail.removeEventListener('scroll', ensure);
      rail.removeEventListener('wheel', takeOver);
      rail.removeEventListener('touchstart', takeOver);
      ro.disconnect();
      window.removeEventListener('resize', ensure);
    };
  }, [n, dark]);

  return (
    <section style={{
      position: 'relative', overflow: 'hidden', marginTop: 64,
      background: dark ? 'var(--c-ink)' : 'var(--c-mist)',
    }}>
      {/* Cinematic backdrop — the active card's photo, b/w + dimmed */}
      {dark && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          {list.map((b, i) => (
            <img key={b.id} src={b.photo} alt=""
                 ref={(el) => { backdropRefs.current[i] = el; }}
                 style={{
                   position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                   filter: 'grayscale(1) brightness(0.46)', willChange: 'opacity, transform',
                   opacity: i === 0 ? 1 : 0, transform: i === 0 ? 'scale(1)' : 'scale(1.05)',
                 }} />
          ))}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(14,13,11,0.94) 0%, rgba(14,13,11,0.78) 34%, rgba(14,13,11,0.40) 60%, rgba(14,13,11,0.50) 100%)',
          }}></div>
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 120,
            background: 'linear-gradient(180deg, rgba(14,13,11,0) 0%, rgba(14,13,11,0.55) 100%)',
          }}></div>
        </div>
      )}

      <div className="zw-split" style={{ position: 'relative', padding: 'clamp(48px, 6vw, 92px) 0' }}>
        {/* Intro + pager */}
        <div className="zw-split-left">
          <div style={{ display: 'flex', gap: 'clamp(20px, 2.2vw, 32px)' }}>
            {/* Vertical stepper track */}
            <div aria-hidden="true" className="zw-only-desktop" style={{
              width: 1, alignSelf: 'stretch', position: 'relative', flexShrink: 0,
              background: dark ? 'rgba(255,255,255,0.20)' : 'rgba(28,28,26,0.15)',
            }}>
              <span ref={dotRef} style={{
                position: 'absolute', left: '50%', top: '6%', transform: 'translate(-50%, -50%)',
                width: 9, height: 9, borderRadius: '50%', background: 'var(--p-400)',
                boxShadow: dark ? '0 0 0 4px rgba(255,255,255,0.14)' : '0 0 0 4px rgba(28,28,26,0.08)',
              }}></span>
            </div>

            <div style={{ minWidth: 0 }}>
              <ZwKicker color={dark ? 'color-mix(in oklch, var(--p-400) 78%, #fff)' : undefined}
                        style={{ marginBottom: 16 }}>{kicker}</ZwKicker>
              <h2 className="txt-balance" style={{
                margin: 0, fontSize: 'clamp(34px, 3.4vw, 54px)', fontWeight: 600,
                letterSpacing: '-0.04em', lineHeight: 1.0,
                color: dark ? '#fff' : 'var(--c-900)',
                textShadow: dark ? '0 2px 24px rgba(0,0,0,0.35)' : 'none',
              }}>{title}</h2>
              <p className="txt-pretty" style={{
                margin: '20px 0 30px', fontSize: 'clamp(15px, 1.3vw, 17px)',
                lineHeight: 1.55, color: dark ? 'rgba(255,255,255,0.76)' : 'var(--c-600)', maxWidth: 380,
              }}>{sub}</p>
              <ZwButton kind="secondary" size="lg" onClick={onCta || (() => ctx.go('all'))}>{ctaLabel}</ZwButton>

              {/* Pager */}
              <div style={{ marginTop: 'clamp(30px, 3.2vw, 44px)', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', gap: 9 }}>
                  <ZwRailArrow dir={-1} onClick={() => step(-1)} light={dark} innerRef={prevRef}></ZwRailArrow>
                  <ZwRailArrow dir={1} onClick={() => step(1)} light={dark} innerRef={nextRef}></ZwRailArrow>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                  color: dark ? 'rgba(255,255,255,0.90)' : 'var(--c-700)', fontVariantNumeric: 'tabular-nums',
                  display: 'inline-flex', overflow: 'hidden',
                }}>
                  <span ref={counterRef} style={{ display: 'inline-block', opacity: 1 }}>{zwPad2(0)}</span>
                  <span style={{ opacity: 0.45 }}>&nbsp;/ {zwPad2(n - 1)}</span>
                </span>
              </div>
              <div style={{
                marginTop: 18, height: 3, borderRadius: 999, maxWidth: 240,
                background: dark ? 'rgba(255,255,255,0.22)' : 'rgba(28,28,26,0.12)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div ref={barRef} style={{
                  position: 'absolute', top: 0, bottom: 0, borderRadius: 999,
                  background: dark ? '#fff' : 'var(--c-ink)', width: '30%', left: '0%',
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card rail — bleeds off the right edge */}
        <div className="zw-split-right">
          <div ref={railRef} className="zw-carousel-rail zw-rail-split">
            {list.map((b, i) => (
              <div key={b.id} data-card className="zw-carousel-card"
                   ref={(el) => { cardRefs.current[i] = el; }}
                   style={{
                     transformOrigin: 'left center', willChange: 'transform, opacity',
                     opacity: i === 0 ? 1 : 0.7,
                     transform: i === 0 ? 'none' : 'translateY(10px) scale(0.925)',
                   }}>
                <ZwBizEditorialCard b={b} ctx={ctx}></ZwBizEditorialCard>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ZwFeaturedSection({ ctx }) {
  const list = zwFeaturedList();
  if (list.length === 0) return null;
  return <ZwFeatSplit ctx={ctx} list={list} tone={ctx.spotlightTone || 'dark'}></ZwFeatSplit>;
}

Object.assign(window, { ZwFeaturedSection, ZwBizEditorialCard, ZwFeatSplit });
