// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — SHARED layer.
// Motion engine (visible-at-rest, JS-tweened), location store,
// and the chrome: nav (w/ location switcher), footer, floating
// book pill, and the location/member-aware booking sheet.
// ─────────────────────────────────────────────────────────────

const { useState: useStateMC, useEffect: useEffectMC, useLayoutEffect: useLayoutEffectMC, useRef: useRefMC, useCallback: useCbMC } = React;

// rAF-driven motion: CSS keyframe/transition clocks can be frozen in embedded
// previews, so reveals are tweened in JS (inline styles). The resting state is
// always the VISIBLE end-state — if motion is off or JS never runs, content shows.
function mcReduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function mcEaseOut(p) { return 1 - Math.pow(1 - p, 3); }
function mcHide(el, v) {
  if (v === 'mask') { el.style.clipPath = 'inset(0 0 100% 0)'; return; }
  el.style.opacity = '0';
  if (v === 'up') el.style.transform = 'translateY(38px)';
  else if (v === 'scale') el.style.transform = 'scale(0.94)';
  else if (v === 'left') el.style.transform = 'translateX(-46px)';
  else if (v === 'right') el.style.transform = 'translateX(46px)';
}
function mcStep(el, v, e) {
  if (v === 'mask') { el.style.clipPath = 'inset(0 0 ' + (100 * (1 - e)).toFixed(2) + '% 0)'; return; }
  el.style.opacity = String(e);
  if (v === 'up') el.style.transform = 'translateY(' + (38 * (1 - e)).toFixed(2) + 'px)';
  else if (v === 'scale') el.style.transform = 'scale(' + (0.94 + 0.06 * e).toFixed(4) + ')';
  else if (v === 'left') el.style.transform = 'translateX(' + (-46 * (1 - e)).toFixed(2) + 'px)';
  else if (v === 'right') el.style.transform = 'translateX(' + (46 * (1 - e)).toFixed(2) + 'px)';
}
function mcClear(el, v) {
  el.style.opacity = ''; el.style.transform = ''; if (v === 'mask') el.style.clipPath = '';
}

// Shared time-based ticker. rAF can be throttled to ~0 in idle embedded previews,
// so tweens are driven by setInterval and read performance.now() for correct progress.
const MC_TICKS = new Set();
let __mcTicker = null;
function __mcRunTicks() {
  const now = performance.now();
  for (const fn of Array.prototype.slice.call(MC_TICKS)) {
    let done = false;
    try { done = fn(now); } catch (e) { done = true; }
    if (done) MC_TICKS.delete(fn);
  }
  if (MC_TICKS.size === 0 && __mcTicker) { clearInterval(__mcTicker); __mcTicker = null; }
}
function mcTween(step) { MC_TICKS.add(step); if (!__mcTicker) __mcTicker = setInterval(__mcRunTicks, 1000 / 60); return () => MC_TICKS.delete(step); }

// ── Data shortcuts (mutable — swapped by mcSetVertical for the vertical demo) ──
let MC_BIZ = window.MC_BUSINESS;
let MC_LOCS = window.MC_LOCATIONS;
let MC_MENU = window.MC_LOCATION_MENU;
let MC_SLOTS = window.MC_SLOTS;
function mcComputeAgg() { let n = 0, sum = 0; MC_LOCS.forEach(l => { n += l.reviewCount; sum += l.rating * l.reviewCount; }); return { rating: n ? +(sum / n).toFixed(1) : 0, count: n }; }
function mcComputeReviews() { return MC_LOCS.flatMap(l => l.reviews.map(r => ({ ...r, loc: l.name }))); }
let MC_AGG = mcComputeAgg();
let MC_ALL_REVIEWS = mcComputeReviews();
function mcLabels() { return MC_BIZ.labels || {}; }
function mcSetVertical(key) {
  window.MC_applyVertical(key);
  MC_BIZ = window.MC_BUSINESS; MC_LOCS = window.MC_LOCATIONS; MC_MENU = window.MC_LOCATION_MENU; MC_SLOTS = window.MC_SLOTS;
  MC_AGG = mcComputeAgg(); MC_ALL_REVIEWS = mcComputeReviews();
  MCLocStore.reset();
}
function mcLocMenuFlat(locId) {
  const groups = MC_MENU[locId] || [];
  const flat = []; groups.forEach(g => g.items.forEach(it => flat.push({ ...it, cat: g.cat }))); return flat;
}
function mcPriceFrom(locId) {
  const f = mcLocMenuFlat(locId); return f.length ? Math.min.apply(null, f.map(s => s.price)) : 0;
}

// ── Location store — robust cross-component selection (avoids prop drilling) ──
const MCLocStore = (() => {
  let idx = 0; const subs = new Set();
  return { get: () => idx, set: (i) => { if (i === idx) return; idx = i; subs.forEach(f => f(i)); }, reset: () => { idx = 0; subs.forEach(f => f(0)); }, sub: (f) => { subs.add(f); return () => subs.delete(f); } };
})();
function useMCLocation() {
  const [i, setI] = useStateMC(MCLocStore.get());
  useEffectMC(() => MCLocStore.sub(setI), []);
  return [MC_LOCS[i], i, (n) => MCLocStore.set(n)];
}

// ── Footer logo store — an "uploaded logo" preview. Persisted to localStorage
// (NOT the tweak block) so a base64 image never bloats the source file. ──
const MCLogoStore = (() => {
  let url = '';
  try { url = localStorage.getItem('mc-footer-logo') || ''; } catch (e) {}
  const subs = new Set();
  return {
    get: () => url,
    set: (u) => { url = u || ''; try { url ? localStorage.setItem('mc-footer-logo', url) : localStorage.removeItem('mc-footer-logo'); } catch (e) {} subs.forEach(f => f(url)); },
    sub: (f) => { subs.add(f); return () => subs.delete(f); },
  };
})();
function useMCLogo() {
  const [u, setU] = useStateMC(MCLogoStore.get());
  useEffectMC(() => MCLogoStore.sub(setU), []);
  return u;
}

// ── Booking bus — open() may carry { serviceId, memberId } ──
const MCBus = (() => {
  const subs = new Set();
  return { open(opts) { subs.forEach(f => f(true, opts || {})); }, close() { subs.forEach(f => f(false, {})); }, sub(f) { subs.add(f); return () => subs.delete(f); } };
})();
// ── Location-picker bus ──
window.MCLocPicker = (() => {
  const subs = new Set();
  return { open() { subs.forEach(f => f(true)); }, close() { subs.forEach(f => f(false)); }, sub(f) { subs.add(f); return () => subs.delete(f); } };
})();

// ── Parallax registry + reveal manager ──
// Reveals are SCROLL-POSITION driven (geometry only — no animation clock),
// so they can never get stuck hidden waiting on a frozen timer. Resting
// state is always visible; below-fold elements hide pre-paint and reveal as
// they scroll up into view. Print / reduced-motion never hide (CSS forces 1).
const MICRO_PAR = [];
const MC_REVEALS = [];
const MC_MARQUEES = [];
function mcRegisterReveal(entry) {
  MC_REVEALS.push(entry);
  return () => { const i = MC_REVEALS.indexOf(entry); if (i >= 0) MC_REVEALS.splice(i, 1); };
}
const MC_REV_START = () => window.innerHeight * 0.94;   // begins revealing here
const MC_REV_END = () => window.innerHeight * 0.64;     // fully revealed here

function useMicroEngine(rootRef, motion) {
  useEffectMC(() => {
    const root = rootRef.current;
    if (!root) return;
    const prog = root.querySelector('.mc-progress');
    let lastFootH = -1;
    const update = () => {
      const sc = window.scrollY || document.documentElement.scrollTop || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (max > 0 ? (sc / max) * 100 : 0) + '%';
      root.classList.toggle('past-hero', sc > window.innerHeight * 0.6);
      const vh = window.innerHeight;
      // ── Footer reveal: the page content lifts up to uncover the pinned footer.
      // Keep the content's bottom spacer synced to the live footer height so the
      // reveal lands exactly, and expose 0→1 progress for the scrim + parallax.
      const footEl = root.querySelector('.mc-footer');
      const content = root.querySelector('.mc-content');
      if (footEl && content) {
        if (window.innerWidth <= 860) {
          // narrow screens: footer is a normal in-flow block (no fixed reveal)
          if (lastFootH !== -2) { content.style.marginBottom = ''; lastFootH = -2; }
          root.style.setProperty('--mc-reveal', '1');
        } else {
          const fh = footEl.offsetHeight;
          if (fh && fh !== lastFootH) { content.style.marginBottom = fh + 'px'; lastFootH = fh; }
          const max2 = document.documentElement.scrollHeight - vh;
          const rp = fh > 0 ? Math.max(0, Math.min(1, (sc - (max2 - fh)) / fh)) : 0;
          root.style.setProperty('--mc-reveal', (Math.round(rp * 1000) / 1000) + '');
        }
      }
      if (motion) {
        for (const p of MICRO_PAR) {
          const r = p.el.getBoundingClientRect();
          const d = (r.top + r.height / 2) - vh / 2;
          p.el.style.transform = 'translate3d(0,' + (-d * p.speed).toFixed(1) + 'px,0)';
        }
      } else { for (const p of MICRO_PAR) p.el.style.transform = ''; }
      if (motion) {
        const drift = (typeof performance !== 'undefined' ? performance.now() : 0) * 0.018;
        for (const m of MC_MARQUEES) { if (!m.w) m.measure(); const off = m.w ? -(((sc * m.speed) + drift) % m.w) : 0; m.el.style.transform = 'translateX(' + off.toFixed(1) + 'px)'; }
      } else { for (const m of MC_MARQUEES) m.el.style.transform = ''; }
      for (let i = MC_REVEALS.length - 1; i >= 0; i--) { if (MC_REVEALS[i].tick()) MC_REVEALS.splice(i, 1); }
      __mcRunTicks();
    };
    const onScroll = () => update();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const poll = setInterval(update, 200);
    // Magnetic CTAs — pointer-fine only, gated on motion
    let magEl = null;
    const fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    const onPM = () => {};
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); clearInterval(poll); if (fine) document.removeEventListener('pointermove', onPM); if (magEl) magEl.style.transform = ''; };
  }, [motion]);
}

// ── Reveal — scroll-position driven; visible at rest ──
function Reveal({ variant = 'up', delay = 0, dur = 900, as = 'div', className = '', style = {}, children, ...rest }) {
  const ref = useRefMC(null);
  useLayoutEffectMC(() => {
    const el = ref.current;
    if (!el || window.__microNoMotion || mcReduced()) return;
    let done = false;
    if (el.getBoundingClientRect().top >= MC_REV_START()) mcHide(el, variant); else { done = true; }
    const tick = () => {
      if (done) return true;
      const top = el.getBoundingClientRect().top;
      const s = MC_REV_START(), e = MC_REV_END();
      const p = Math.max(0, Math.min(1, (s - top) / (s - e)));
      mcStep(el, variant, mcEaseOut(p));
      if (p >= 1) { mcClear(el, variant); done = true; return true; }
      return false;
    };
    return mcRegisterReveal({ tick });
  }, []);
  const Tag = as;
  return <Tag ref={ref} className={'mc-rev' + (className ? ' ' + className : '')} style={style} {...rest}>{children}</Tag>;
}

// ── SplitReveal — per-word rise, scroll-position driven ──
function SplitReveal({ text, as = 'div', className = '', style = {}, step = 46, base = 0, dur = 920 }) {
  const ref = useRefMC(null);
  useLayoutEffectMC(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.prototype.slice.call(el.querySelectorAll('.sr-word > span'));
    if (window.__microNoMotion || mcReduced()) { spans.forEach(s => { s.style.transform = 'none'; }); return; }
    const n = spans.length || 1;
    const seg = Math.min(0.5, 0.55 / n);     // stagger window between words
    const denom = 1 - (n - 1) * seg || 1;
    const apply = (p) => {
      spans.forEach((s, i) => {
        const local = Math.max(0, Math.min(1, (p - i * seg) / denom));
        s.style.transform = 'translateY(' + (118 * (1 - mcEaseOut(local))).toFixed(2) + '%)';
      });
    };
    let done = false;
    if (el.getBoundingClientRect().top >= MC_REV_START()) apply(0); else { done = true; }
    const tick = () => {
      if (done) return true;
      const top = el.getBoundingClientRect().top;
      const s = MC_REV_START(), e = MC_REV_END();
      const p = Math.max(0, Math.min(1, (s - top) / (s - e)));
      apply(p);
      if (p >= 1) { spans.forEach(s => { s.style.transform = 'none'; }); done = true; return true; }
      return false;
    };
    return mcRegisterReveal({ tick });
  }, [text]);
  const Tag = as;
  const words = String(text).split(' ');
  return (
    <Tag ref={ref} className={'sr' + (className ? ' ' + className : '')} style={style}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="sr-word"><span>{w}</span></span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </Tag>
  );
}

// ── MarqueeBand — kinetic strip, driven by scroll position (no clock) ──
function MarqueeBand({ items, speed = 0.35, sep = '·' }) {
  const ref = useRefMC(null);
  useEffectMC(() => {
    const el = ref.current; if (!el) return;
    const entry = { el, speed, w: 0, measure: () => { entry.w = el.scrollWidth / 3; } };
    entry.measure(); MC_MARQUEES.push(entry);
    const onR = () => entry.measure();
    window.addEventListener('resize', onR);
    return () => { const i = MC_MARQUEES.indexOf(entry); if (i >= 0) MC_MARQUEES.splice(i, 1); window.removeEventListener('resize', onR); el.style.transform = ''; };
  }, []);
  const seq = items.concat(items, items);
  return (
    <div className="mc-band">
      <div className="mc-band-track" ref={ref}>
        {seq.map((it, i) => (
          <span key={i} className="mc-band-item">{it}<span className="mc-band-sep">{sep}</span></span>
        ))}
      </div>
    </div>
  );
}

// ── SectionDots — right-rail wayfinding, geometry-driven active state ──
function SectionDots({ items }) {
  const [active, setActive] = useStateMC(0);
  useEffectMC(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const mid = window.innerHeight * 0.42;
      let best = 0, bestD = Infinity;
      items.forEach((it, i) => { const el = document.getElementById(it.id); if (!el) return; const r = el.getBoundingClientRect(); const d = Math.abs(r.top - mid); if (r.top - 80 <= mid && d < bestD) { bestD = d; best = i; } });
      setActive(best);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    const poll = setInterval(compute, 250);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); clearInterval(poll); if (raf) cancelAnimationFrame(raf); };
  }, [items.length]);
  const go = (id) => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 50, behavior: 'smooth' }); };
  return (
    <div className="mc-dots" aria-hidden="false">
      {items.map((it, i) => (
        <button key={it.id} className="mc-dot" data-on={active === i ? '1' : '0'} onClick={() => go(it.id)} aria-label={it.label}>
          <span className="mc-dot-lbl">{it.label}</span><i></i>
        </button>
      ))}
    </div>
  );
}

// ── Counter — counts up by scroll position; shows target at rest ──
function Counter({ to, dur = 1300, decimals = 0, prefix = '', suffix = '', className = '', style = {} }) {
  const ref = useRefMC(null);
  const [val, setVal] = useStateMC(to);
  useLayoutEffectMC(() => {
    const el = ref.current;
    if (!el || window.__microNoMotion || mcReduced()) return;
    let done = false;
    if (el.getBoundingClientRect().top >= MC_REV_START()) setVal(0); else { done = true; }
    const tick = () => {
      if (done) return true;
      const top = el.getBoundingClientRect().top;
      const s = MC_REV_START(), e = MC_REV_END();
      const p = Math.max(0, Math.min(1, (s - top) / (s - e)));
      setVal(to * mcEaseOut(p));
      if (p >= 1) { setVal(to); done = true; return true; }
      return false;
    };
    return mcRegisterReveal({ tick });
  }, [to]);
  return <span ref={ref} className={className} style={style}>{prefix}{val.toFixed(decimals)}{suffix}</span>;
}

// ── Eyebrow ──
function Eyebrow({ children, className = '', style = {} }) {
  return <span className={'mc-eyebrow' + (className ? ' ' + className : '')} style={style}><span className="dot"></span>{children}</span>;
}

// ── MicroImg ──
function MicroImg({ src, alt = '', label = 'photo', zoom = true, parallax = false, speed = 0.1, radius = 4, style = {}, className = '', wrapStyle = {} }) {
  const ref = useRefMC(null);
  useEffectMC(() => {
    if (!parallax) return;
    const el = ref.current; if (!el) return;
    const entry = { el, speed }; MICRO_PAR.push(entry);
    return () => { const i = MICRO_PAR.indexOf(entry); if (i >= 0) MICRO_PAR.splice(i, 1); el.style.transform = ''; };
  }, [parallax, speed]);
  if (parallax) {
    return (
      <div className={'mc-par-host' + (className ? ' ' + className : '')} style={{ borderRadius: radius, ...wrapStyle }}>
        <div className="mc-par" ref={ref}><ZImg src={src} alt={alt} label={label} style={{ width: '100%', height: '100%', ...style }}></ZImg></div>
      </div>
    );
  }
  return (
    <div className={'mc-imgwrap ' + (zoom ? 'zoom ' : '') + className} style={{ borderRadius: radius, ...wrapStyle }}>
      <ZImg src={src} alt={alt} label={label} style={{ width: '100%', height: '100%', ...style }}></ZImg>
    </div>
  );
}

// ─────────────────────── CHROME ───────────────────────

function LocationSwitcher() {
  const [loc] = useMCLocation();
  if (MC_LOCS.length <= 1) return null;
  return (
    <button className="mc-locsel-btn" onClick={() => window.MCLocPicker.open()} aria-label="Change location">
      <ZIcon name="pin" size={13}></ZIcon>
      <span className="mc-locsel-city">{loc.name}</span>
    </button>
  );
}

function MCWord({ text }) {
  const t = String(text == null ? '' : text);
  return (
    <span className="mc-word" aria-label={t}>
      {Array.prototype.map.call(t, (ch, i) => (
        <span key={i} className="mc-ch" aria-hidden="true" style={{ '--d': (i * 24) + 'ms' }}>
          <span className="mc-ch-a">{ch}</span>
          <span className="mc-ch-b">{ch}</span>
        </span>
      ))}
    </span>
  );
}

function MCArrow({ size = 16, color }) {
  return (
    <span className="mc-arrow" style={{ width: size, height: size }}>
      <span className="mc-arrow-a"><ZIcon name="arrowR" size={size} color={color}></ZIcon></span>
      <span className="mc-arrow-b"><ZIcon name="arrowR" size={size} color={color}></ZIcon></span>
    </span>
  );
}

function MicroNav({ links }) {
  return (
    <nav className="mc-nav">
      <a href="#top" className="mc-mast">
        <span className="mc-mast-mark" aria-hidden="true">{(MC_BIZ.name || '').trim().charAt(0)}</span>
        <span className="mc-mast-tx">
          <span className="mc-wordmark">{MC_BIZ.name}</span>
          <span className="mc-mast-sub">Est. {MC_BIZ.established}</span>
        </span>
      </a>
      <div className="mc-nav-mid">
        {links.map(([href, label]) => <a key={href} href={href} className="mc-nav-link">{label}</a>)}
      </div>
      <div className="mc-nav-right">
        <button className="mc-btn" onClick={() => MCBus.open()}><MCWord text="Get started" /></button>
      </div>
    </nav>
  );
}

function BookPill() {
  const [loc] = useMCLocation();
  const ref = useRefMC(null);
  useEffectMC(() => {
    const el = ref.current; if (!el) return;
    el.style.transition = 'none';
    let shown = null;
    const setState = (show) => { if (show === shown) return; shown = show; el.style.transform = show ? 'translate(-50%,0%)' : 'translate(-50%,130%)'; el.style.opacity = show ? '1' : '0'; el.style.pointerEvents = show ? 'auto' : 'none'; };
    setState(false);
    const check = () => setState((window.scrollY || 0) > window.innerHeight * 0.6);
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const poll = setInterval(check, 200);
    return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); clearInterval(poll); };
  }, []);
  return (
    <div className="mc-float" ref={ref}>
      <button className="mc-btn" onClick={() => MCBus.open()}>
        <span className="mc-float-dot"></span>
        <MCWord text={(mcLabels().book || 'Book') + ' · ' + loc.name} />
        <MCArrow size={16}></MCArrow>
      </button>
    </div>
  );
}

// Social platforms — render order; only keys present in MC_BIZ.social show.
const MC_SOCIALS = [
  ['instagram', 'ig',    'Instagram', (h) => 'https://instagram.com/' + h.replace(/^@/, '')],
  ['tiktok',    'tt',    'TikTok',    (h) => 'https://www.tiktok.com/@' + h.replace(/^@/, '')],
  ['facebook',  'fb',    'Facebook',  (h) => 'https://facebook.com/' + h],
  ['x',         'xLogo', 'X',         (h) => 'https://x.com/' + h.replace(/^@/, '')],
  ['youtube',   'yt',    'YouTube',   (h) => 'https://youtube.com/@' + h.replace(/^@/, '')],
  ['pinterest', 'pint',  'Pinterest', (h) => 'https://pinterest.com/' + h],
  ['linkedin',  'lin',   'LinkedIn',  (h) => 'https://linkedin.com/company/' + h],
];

function MicroSocials() {
  const social = MC_BIZ.social || {};
  const items = MC_SOCIALS.filter(([k]) => social[k]);
  if (!items.length) return null;
  return (
    <div className="mc-foot-social">
      {items.map(([k, icon, label, url]) => (
        <a key={k} className="mc-foot-soc" href={url(String(social[k]))}
           target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <ZIcon name={icon} size={17}></ZIcon>
        </a>
      ))}
    </div>
  );
}

// Selected-location detail — its own component so each location change remounts it
// (key) and replays the entrance. Renders in the hidden state on the FIRST frame,
// then releases on the next so the rows transition UP to the visible resting state.
// Transitions (unlike @keyframes / the tween loop) advance reliably in embedded
// previews, and the resting state has no class, so it can only ever end visible.
function FootDetail({ here, mapHref }) {
  const [entering, setEntering] = useStateMC(!window.__microNoMotion && !mcReduced());
  useEffectMC(() => {
    if (!entering) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setEntering(false)); });
    const to = setTimeout(() => setEntering(false), 120);   // fallback if rAF is throttled
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(to); };
  }, []);
  return (
    <div className={'mc-foot-col mc-foot-detail' + (entering ? ' is-entering' : '')}>
      <div className="lb-contact-h">{here.name}</div>
      <a className="mc-foot-row mc-foot-link" href={mapHref(here)} target="_blank" rel="noopener noreferrer">{here.address}</a>
      <a className="mc-foot-row mc-foot-link" href={'tel:' + here.phone.replace(/\s/g, '')}>{here.phone}</a>
      <div className="mc-foot-hours-wrap">
        {here.hours.map(h => (
          <div key={h.d} className="mc-foot-hours"><span>{h.d}</span><span style={{ opacity: h.h === 'Closed' ? 0.5 : 1 }}>{h.h}</span></div>
        ))}
      </div>
    </div>
  );
}

function MicroFooter() {
  const [loc, locIdx, setLoc] = useMCLocation();
  const uploaded = useMCLogo();
  const [sel, setSel] = useStateMC(locIdx);
  const nameRef = useRefMC(null);
  const locsRef = useRefMC(null);
  const [ind, setInd] = useStateMC(null);
  // Footer-local "browse" selection drives the address/hours panel without moving
  // the whole site (which would reflow content above and jog the reveal). Starts on
  // the live location and follows it if it's changed elsewhere (nav / preview tweak).
  useEffectMC(() => { setSel(locIdx); }, [locIdx]);

  // Sliding accent indicator glides to the active row (mirrors the Locations section).
  useLayoutEffectMC(() => {
    const measure = () => {
      const list = locsRef.current; if (!list) return;
      const row = list.querySelectorAll('.mc-foot-loc')[sel];
      if (row) setInd({ y: row.offsetTop + 7, h: Math.max(0, row.offsetHeight - 14) });
      else setInd(null);
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, [sel, MC_BIZ.name]);

  const labels = MC_BIZ.labels || {};
  const placePlural = labels.placePlural || 'studios';
  const placeOne = labels.place || 'studio';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const multi = MC_LOCS.length > 1;
  // Many locations: cap the footer list and link the rest to the Locations section
  // (keeps this column short so it never collides with the giant wordmark below).
  const LOC_CAP = 4;
  const shownLocs = MC_LOCS.length > LOC_CAP + 1 ? MC_LOCS.slice(0, LOC_CAP) : MC_LOCS;
  const moreLocs = MC_LOCS.length - shownLocs.length;
  const logo = MC_BIZ.logo || uploaded || null;
  const here = MC_LOCS[sel] || loc;
  const mapHref = (l) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(MC_BIZ.name + ', ' + l.address + ', ' + l.postcode);
  const scrollToLocations = (e) => {
    e.preventDefault();
    const el = document.getElementById('locations'); if (!el) return;
    const nav = document.querySelector('.mc-nav');
    const y = el.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0) - 12;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };

  // Fit the giant closing wordmark edge-to-edge; refit on resize, font load and font-style swap.
  useLayoutEffectMC(() => {
    const el = nameRef.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = '120px';
      el.style.width = '';                 // block fills the padded footer width
      const avail = el.clientWidth;
      el.style.width = 'max-content';      // shrink-wrap to measure intrinsic text width
      const textW = el.offsetWidth;
      el.style.width = '';
      if (!avail || !textW) return;
      const size = Math.max(40, Math.min(120 * avail / textW, 360));
      el.style.fontSize = size.toFixed(1) + 'px';
    };
    fit();
    const raf = requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const mo = new MutationObserver(fit);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-micro-font'] });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); mo.disconnect(); };
  }, [MC_BIZ.name]);

  return (
    <footer className="mc-footer" data-screen-label="Microsite · Footer">
      <div className="mc-foot-pad">
        <div className="mc-foot-top">
          <div className="mc-foot-cta">
            <div className="mc-foot-headline mc-display">{multi ? 'Come find us.' : 'Come to ' + loc.name + '.'}</div>
          </div>
          <button className="mc-btn mc-btn--lg" onClick={() => { setLoc(sel); MCBus.open(); }}>
            <MCWord text={(labels.book || 'Book') + ' at ' + here.name} /> <MCArrow size={17}></MCArrow>
          </button>
        </div>

        <div className="mc-foot-cols">
          {/* Brand — logo when provided, else wordmark; tagline; socials */}
          <div className="mc-foot-col mc-foot-brand">
            {logo
              ? <img className="mc-foot-logo" src={logo} alt={MC_BIZ.name} />
              : <div className="mc-foot-lockup">
                  <span className="mc-mast-mark" aria-hidden="true">{(MC_BIZ.name || '').trim().charAt(0)}</span>
                  <span className="mc-wordmark">{MC_BIZ.name}</span>
                </div>}
            {MC_BIZ.tagline && <p className="mc-foot-tag">{MC_BIZ.tagline}</p>}
            <MicroSocials />
          </div>

          {/* Locations — dense, selectable list; caps + "more" link when there are many */}
          <div className="mc-foot-col">
            <div className="lb-contact-h">{multi ? cap(placePlural) : 'Where'}</div>
            <div className="mc-foot-locs" ref={locsRef}>
              {ind && <span className="mc-foot-loc-ind" aria-hidden="true" style={{ transform: `translateY(${ind.y}px)`, height: ind.h }}></span>}
              {shownLocs.map((l, i) => (
                <button key={l.id} type="button" className="mc-foot-loc" data-on={i === sel ? '1' : '0'}
                        aria-pressed={i === sel} onClick={() => setSel(i)}>
                  <span className="mc-foot-loc-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mc-foot-loc-name">{l.name}</span>
                  <span className="mc-foot-loc-mark" aria-hidden="true"><ZIcon name="arrowR" size={14}></ZIcon></span>
                </button>
              ))}
              {moreLocs > 0 && (
                <a className="mc-foot-more" href="#locations" onClick={scrollToLocations}>
                  <span className="mc-foot-more-no">+{moreLocs}</span>
                  <span className="mc-foot-more-tx">more {placePlural}</span>
                  <span className="mc-foot-more-mark" aria-hidden="true"><ZIcon name="arrowR" size={14}></ZIcon></span>
                </a>
              )}
            </div>
          </div>

          {/* Selected location — address + hours; remounts per location to replay the rise */}
          <FootDetail key={here.id} here={here} mapHref={mapHref} />

          {/* Get in touch — shared business contact */}
          <div className="mc-foot-col">
            <div className="lb-contact-h">Get in touch</div>
            <a className="mc-foot-row mc-foot-link" href={'mailto:' + MC_BIZ.email}>{MC_BIZ.email}</a>
            {(MC_BIZ.social || {}).web && (
              <a className="mc-foot-row mc-foot-link" href={'https://' + MC_BIZ.social.web} target="_blank" rel="noopener noreferrer">{MC_BIZ.social.web}</a>
            )}
          </div>
        </div>
      </div>

      <div className="mc-foot-pad mc-foot-bottom">
        <div ref={nameRef} className="mc-foot-name mc-display">{MC_BIZ.name}</div>
        <div className="mc-foot-base">
          <span>© 2026 {MC_BIZ.name}.</span>
          <span className="mc-foot-zav">Powered by Zavoia</span>
        </div>
      </div>
    </footer>
  );
}

// ── Booking sheet — location & member aware ──
function BookingSheet() {
  const [loc] = useMCLocation();
  const team = loc.team;
  const allSvcs = mcLocMenuFlat(loc.id);
  const [member, setMember] = useStateMC(null);   // memberId or null = anyone
  const [svc, setSvc] = useStateMC(null);
  const [slot, setSlot] = useStateMC(null);
  const [done, setDone] = useStateMC(false);
  const sheetRef = useRefMC(null);
  const backRef = useRefMC(null);
  const onClose = useCbMC(() => MCBus.close(), []);

  useEffectMC(() => {
    const sheet = sheetRef.current, back = backRef.current;
    if (!sheet || !back) return;
    sheet.style.transition = 'none'; back.style.transition = 'none';
    const setState = (open) => { sheet.style.transform = open ? 'translate(-50%,0%)' : 'translate(-50%,100%)'; back.style.opacity = open ? '1' : '0'; back.style.pointerEvents = open ? 'auto' : 'none'; };
    setState(false);
    const unsub = MCBus.sub((v, opts) => {
      if (v) {
        setDone(false);
        if (opts && opts.memberId) setMember(opts.memberId);
        if (opts && opts.serviceId) { const s = allSvcs.find(x => x.id === opts.serviceId); if (s) setSvc(s); }
      }
      setState(v);
    });
    const onKey = (e) => { if (e.key === 'Escape') MCBus.close(); };
    window.addEventListener('keydown', onKey);
    return () => { unsub(); window.removeEventListener('keydown', onKey); };
  }, [loc.id]);

  // service list filtered by chosen member
  const mObj = member ? team.find(t => t.id === member) : null;
  const visibleSvcs = mObj ? allSvcs.filter(s => mObj.does.includes(s.id)) : allSvcs;
  // keep selection valid
  useEffectMC(() => { if (svc && !visibleSvcs.find(s => s.id === svc.id)) setSvc(null); }, [member, loc.id]);

  return (
    <>
      <div ref={backRef} className="mc-sheet-back" onClick={onClose}></div>
      <div ref={sheetRef} className="mc-sheet" role="dialog" aria-modal="true" aria-label={'Book at ' + MC_BIZ.name}>
        {done ? (
          <div className="mc-sheet-ok">
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: '#1C1C1A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <ZIcon name="check" size={26} color="#fff"></ZIcon>
            </span>
            <div className="mc-display" style={{ fontSize: 28 }}>Slot held for 10 minutes</div>
            <p style={{ fontSize: 14.5, color: '#6B6862', lineHeight: 1.6, maxWidth: 380, margin: '12px auto 24px' }}>
              {svc ? svc.name : 'Your service'}{mObj ? ' with ' + mObj.name : ''} · {loc.name} · {slot || MC_SLOTS[0]}. Confirm and pay on Zavoia — this is where the booking funnel takes over.
            </p>
            <button className="mc-btn mc-btn--lg mc-btn--ink" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="mc-sheet-hd">
              <div>
                <div className="mc-display" style={{ fontSize: 22, color: '#1C1C1A' }}>{(mcLabels().book || 'Book') + ' · ' + MC_BIZ.name}</div>
                <div style={{ fontSize: 13, color: '#6B6862', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ZIcon name="pin" size={13} color="#6B6862"></ZIcon> {loc.name} · {loc.address}
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: '50%', border: 0, cursor: 'pointer', background: 'rgba(28,28,26,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ZIcon name="x" size={16} color="#1C1C1A"></ZIcon>
              </button>
            </div>
            <div className="mc-sheet-body">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6862', margin: '8px 0 2px' }}>{mcLabels().teamPlural || 'Team'}</div>
              <div className="mc-seg">
                <button data-on={member === null ? '1' : '0'} onClick={() => setMember(null)}>Anyone</button>
                {team.slice(0, 3).map(t => (
                  <button key={t.id} data-on={member === t.id ? '1' : '0'} onClick={() => setMember(t.id)}>{t.name.split(' ')[0]}</button>
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6862', margin: '16px 0 4px' }}>
                Service{mObj ? ' · ' + mObj.name.split(' ')[0] + '’s menu' : ''}
              </div>
              {visibleSvcs.map(it => {
                const on = svc && svc.id === it.id;
                return (
                  <div key={it.id} className="mc-svc" data-on={on ? '1' : '0'} onClick={() => setSvc(it)}>
                    <span className="mc-svc-radio">{on && <ZIcon name="check" size={12} color="#fff"></ZIcon>}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1C1C1A' }}>{it.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B6862', marginTop: 2 }}>{it.cat} · {it.dur}m</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600, color: '#1C1C1A' }}>{MC_BIZ.currency}{it.price}</div>
                  </div>
                );
              })}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6862', margin: '18px 0 10px' }}>Next available</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MC_SLOTS.map(s => <button key={s} className="mc-slot" data-on={slot === s ? '1' : '0'} onClick={() => setSlot(s)}>{s}</button>)}
              </div>
            </div>
            <div className="mc-sheet-foot">
              <button className="mc-btn mc-btn--lg mc-btn--ink" style={{ width: '100%', justifyContent: 'center', opacity: svc ? 1 : 0.5 }} disabled={!svc} onClick={() => setDone(true)}>
                {svc ? 'Hold ' + svc.name + (slot ? ' · ' + slot : '') : 'Select a service'}
                <ZIcon className="mc-btn-ic" name="arrowR" size={16} color="#fff"></ZIcon>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

Object.assign(window, {
  MCBus, MCLocStore, MICRO_PAR, MC_REVEALS, mcSetVertical, mcLabels,
  mcLocMenuFlat, mcPriceFrom, useMCLocation, useMCLogo, MCLogoStore, useMicroEngine,
  Reveal, SplitReveal, MarqueeBand, SectionDots, Counter, Eyebrow, MicroImg,
  LocationSwitcher, MicroNav, BookPill, MicroFooter, MicroSocials, BookingSheet,
  MCWord, MCArrow,
});
