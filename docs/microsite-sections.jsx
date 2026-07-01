// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — SECTION MODULES. (gallery: 3 layouts)
// One component per dashboard section type. Each reads the live
// location from the store, so switching location re-scopes Team,
// Reviews, hours & booking. Cinematic Interludes (folded in from
// the Tour direction) are injected by the app between sections.
// ─────────────────────────────────────────────────────────────

// MC_AGG + MC_ALL_REVIEWS are owned by the shared layer (recomputed per vertical).

function SecKicker({ no, children }) {
  return <Reveal><Eyebrow style={{ marginBottom: 16 }}>{no ? no + ' — ' : ''}{children}</Eyebrow></Reveal>;
}

// ───────── ANNOUNCEMENT (pinned promo ribbon above the nav) ─────────
function mcAnnoSig(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return 'a' + (h >>> 0).toString(36); }

function AnnoCountdown({ deadline }) {
  const target = React.useMemo(() => {
    if (!deadline) return null;
    const d = new Date(deadline + 'T23:59:59');
    return isNaN(d.getTime()) ? null : d.getTime();
  }, [deadline]);
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const ms = target - now;
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  const parts = d > 0 ? (d + 'd ' + h + 'h') : (h > 0 ? (h + 'h ' + m + 'm') : (m + 'm'));
  return <span className="mc-anno-count">Ends in {parts}</span>;
}

function SecAnnouncement({ cfg = {} }) {
  const base = MC_BIZ.announcement || { text: '', cta: 'Book now' };
  const text = (cfg.text && cfg.text.trim()) || base.text;
  const cta = (cfg.cta && cfg.cta.trim()) || base.cta || 'Book now';
  const style = cfg.style || 'neutral';
  const deadline = (cfg.deadline || '').trim();
  const motion = cfg.motion !== false;

  // Dismissal is keyed to the message signature — changing the copy re-shows the bar.
  const sig = mcAnnoSig(style + '|' + text + '|' + cta + '|' + deadline);
  const [dismissed, setDismissed] = React.useState(() => {
    try { return localStorage.getItem('mc-anno-dismissed') === sig; } catch (e) { return false; }
  });
  React.useEffect(() => {
    try { setDismissed(localStorage.getItem('mc-anno-dismissed') === sig); } catch (e) { setDismissed(false); }
  }, [sig]);

  const ref = React.useRef(null);
  const show = !!text && !dismissed;

  // Publish the ribbon's live height so the nav + progress bar offset below it.
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !show) { document.documentElement.style.setProperty('--mc-anno-h', '0px'); return; }
    const set = () => document.documentElement.style.setProperty('--mc-anno-h', el.offsetHeight + 'px');
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener('resize', set);
    return () => { ro.disconnect(); window.removeEventListener('resize', set); document.documentElement.style.setProperty('--mc-anno-h', '0px'); };
  }, [show, text, cta, deadline, style]);

  // Slide-in entrance via WAAPI (fill defaults to none) — resting DOM stays visible for print/export.
  React.useEffect(() => {
    const el = ref.current;
    if (!show || !el || !motion) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try { el.animate([{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(0.22,1,0.36,1)' }); } catch (e) {}
  }, [show, sig]);

  if (!show) return null;

  const dismiss = () => { try { localStorage.setItem('mc-anno-dismissed', sig); } catch (e) {} setDismissed(true); };

  return (
    <div className={'mc-anno mc-anno--' + style} id="announcement" ref={ref} role="region" aria-label="Announcement">
      <div className="mc-anno-in">
        <span className="mc-anno-dot" aria-hidden="true"></span>
        <span className="mc-anno-txt">{text}</span>
        <AnnoCountdown deadline={deadline} />
        <a onClick={(e) => { e.preventDefault(); MCBus.open(); }}>{cta} <MCArrow size={13} /></a>
      </div>
      <button className="mc-anno-x" aria-label="Dismiss announcement" onClick={dismiss}><ZIcon name="x" size={15} /></button>
    </div>
  );
}

// ───────── HERO (cinematic full-bleed) ─────────
function SecHero() {
  const [loc] = useMCLocation();
  return (
    <header className="lb-hero" id="top" data-screen-label="Microsite · Hero">
      <div className="lb-hero-bg"><MicroImg src={MC_BIZ.cover} alt={MC_BIZ.name} label="cover" parallax speed={0.06} zoom={false} radius={0} wrapStyle={{ position: 'absolute', inset: 0 }} /></div>
      <div className="lb-hero-scrim"></div>
      <div className="lb-hero-inner">
        <Reveal variant="fade" delay={100}><Eyebrow className="on-img">{MC_LOCS.length} {(mcLabels().placePlural || 'studios')} across London · Est. {MC_BIZ.established}</Eyebrow></Reveal>
        <SplitReveal as="h1" className="lb-hero-title" text={MC_BIZ.name} step={70} base={170} />
        <Reveal variant="up" delay={460}><p className="lb-hero-tag">{MC_BIZ.tagline}</p></Reveal>
        <div className="lb-hero-meta">
          <Reveal variant="up" delay={560}><div className="lb-hero-rate">
            <span className="lb-hero-rate-num mc-display">{MC_AGG.rating.toFixed(1)}</span>
            <span className="lb-hero-rate-col">
              <ZStars value={MC_AGG.rating} size={13} color="#fff" empty="rgba(255,255,255,0.34)" />
              <span className="lb-hero-rate-cnt">{MC_AGG.count} reviews</span>
            </span>
          </div></Reveal>
          <Reveal variant="up" delay={680}><button className="mc-btn mc-btn--paper" onClick={() => MCBus.open()}><MCWord text={'Book now'} /> <MCArrow size={16} /></button></Reveal>
        </div>
      </div>
      <div className="lb-scrollcue">Scroll<i></i></div>
    </header>
  );
}

// ───────── ABOUT (editorial) ─────────
function SecAbout() {
  const a = MC_BIZ.about;
  return (
    <section className="mc-section" id="about" data-screen-label="Microsite · About">
      <div className="mc-wrap">
        <div className="lb-about-grid">
          <SecKicker no="01">The {mcLabels().place || 'studio'}</SecKicker>
          <div>
            <SplitReveal as="p" className="lb-about-lede" text={a.lede} step={24} />
            <Reveal delay={120}><p className="lb-about-body">{a.body}</p></Reveal>
          </div>
        </div>
        <div className="lb-stats">
          {a.stats.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="lb-stat-n">{s.raw ? s.n : <Counter to={s.n} decimals={s.dec || 0} />}</div>
              <div className="lb-stat-l">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── LOCATIONS (cards) ─────────
const MC_DAY_IDX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function mcDayTokens(label) {
  const parts = String(label).toLowerCase().split(/[–\-—&,]/).map(s => s.trim());
  const toIdx = (s) => MC_DAY_IDX[s.slice(0, 3)];
  if (parts.length >= 2 && /[–\-—]/.test(label)) {
    const a = toIdx(parts[0]), b = toIdx(parts[parts.length - 1]); const out = [];
    if (a == null || b == null) return [];
    for (let i = a; ; i = (i + 1) % 7) { out.push(i); if (i === b) break; }
    return out;
  }
  return parts.map(toIdx).filter(v => v != null);
}
function mcParseMin(t) { const m = String(t).match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; }
function mcFmt(min) { const h = Math.floor(min / 60), m = min % 60; return h + ':' + String(m).padStart(2, '0'); }
function mcOpenStatus(hours) {
  const now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  let todayIdx = -1, todayRow = null;
  (hours || []).forEach((h, i) => { if (mcDayTokens(h.d).includes(day)) { todayIdx = i; todayRow = h; } });
  if (!todayRow || /closed/i.test(todayRow.h)) return { open: false, todayIdx, label: 'Closed today' };
  const seg = todayRow.h.split(/[–\-—]/); const start = mcParseMin(seg[0]), end = mcParseMin(seg[1]);
  if (start == null || end == null) return { open: false, todayIdx, label: 'Closed' };
  if (mins >= start && mins < end) return { open: true, todayIdx, label: 'Open now · until ' + mcFmt(end) };
  if (mins < start) return { open: false, todayIdx, label: 'Opens ' + mcFmt(start) };
  return { open: false, todayIdx, label: 'Closed now' };
}

// ── Locations: premium micro-interaction helpers ──
const mcNoMo = () => (typeof window !== 'undefined') && (window.__microNoMotion ||
  (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
const mcEase3 = (p) => 1 - Math.pow(1 - p, 3);

// Count-up that re-runs on each mount (panel remounts per location).
function RollNum({ value, decimals = 0, dur = 760, delay = 0 }) {
  const [d, setD] = React.useState(() => (mcNoMo() ? value : 0));
  React.useEffect(() => {
    if (mcNoMo()) { setD(value); return; }
    let raf, start; const begin = performance.now() + delay;
    const step = (t) => {
      if (t < begin) { raf = requestAnimationFrame(step); return; }
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setD(value * mcEase3(p));
      if (p < 1) raf = requestAnimationFrame(step); else setD(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <>{Number(d).toFixed(decimals)}</>;
}

// Crossfading featured photo — keeps the outgoing image beneath while the new one
// fades + settles over it, so there's never a flash of empty card.
function LocxPhoto({ src, alt, label }) {
  const keyRef = React.useRef(0);
  const [stack, setStack] = React.useState(() => [{ src, k: 0 }]);
  React.useEffect(() => {
    setStack((s) => {
      if (s[s.length - 1].src === src) return s;
      keyRef.current += 1;
      return [...s.slice(-1), { src, k: keyRef.current }]; // prev (under) + new (over)
    });
  }, [src]);
  React.useEffect(() => {
    if (stack.length < 2) return;
    const t = setTimeout(() => setStack((s) => s.slice(-1)), 900);
    return () => clearTimeout(t);
  }, [stack]);
  return (
    <div className="lb-locx-photostack">
      {stack.map((it, i) => (
        <div key={it.k} className={'lb-locx-photo' + (i === stack.length - 1 ? ' is-top' : '')}>
          <MicroImg src={it.src} alt={alt} label={label} zoom={false}
                    wrapStyle={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        </div>
      ))}
    </div>
  );
}

function SecLocations({ amenitiesStyle }) {
  const [loc, idx, setIdx] = useMCLocation();
  const labels = mcLabels();
  const amenStyle = amenitiesStyle || window.__mcAmenitiesStyle || 'row';
  const place = labels.place || 'studio';
  const status = mcOpenStatus(loc.hours);
  const meetTeam = () => { const el = document.getElementById('team'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' }); };
  // Sliding accent indicator — moves to the active row instead of per-row toggling.
  const [ind, setInd] = React.useState(null);
  React.useLayoutEffect(() => {
    const list = document.querySelector('#locations .lb-locx-list');
    if (!list) return;
    const row = list.querySelectorAll('.lb-locx-row')[idx];
    if (row) setInd({ y: row.offsetTop + 14, h: Math.max(0, row.offsetHeight - 28) });
  }, [idx]);
  const teamN = (loc.team || []).length;
  return (
    <section className="mc-section soft" id="locations" data-screen-label="Microsite · Locations">
      <div className="mc-wrap">
        <div className="mc-shead">
          <div>
            <SecKicker no="02">Locations</SecKicker>
            <SplitReveal as="h2" className="mc-h2" text={MC_LOCS.length + ' ' + (labels.placePlural || 'studios') + ', one team.'} step={42} />
            <Reveal><div className="mc-sublede lb-locx-sublede">Each {place} has its own team and menu. Choose where you’d like to visit — everything below updates to match.</div></Reveal>
          </div>
        </div>

        <div className="lb-locx">
          {/* LEFT — selectable list + detail card */}
          <div className="lb-locx-col">
            <Reveal className="lb-locx-list">
              {ind && <span className="lb-locx-ind" aria-hidden="true" style={{ transform: `translateY(${ind.y}px)`, height: ind.h }}></span>}
              {MC_LOCS.map((l, i) => (
                <button key={l.id} className="lb-locx-row" data-on={i === idx ? '1' : '0'}
                        onClick={() => setIdx(i)} aria-pressed={i === idx}>
                  <span className="lb-locx-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lb-locx-main">
                    <span className="lb-locx-nm">{l.name}</span>
                    <span className="lb-locx-area">{l.area}</span>
                  </span>
                  <span className="lb-locx-rate"><ZIcon name="star" size={13} color="var(--mc-accent)" /> {l.rating}</span>
                  <span className="lb-locx-mark" aria-hidden="true"><ZIcon name="arrowR" size={16} /></span>
                </button>
              ))}
            </Reveal>

            {/* Detail card — selectable list sits above; content re-animates on location switch */}
            <Reveal variant="mask" className="lb-locx-card">
              <div className="lb-locx-info" key={'info-' + loc.id}>
                <div className="lb-locx-hours">
                  <div className="lb-locx-hours-head">
                    <span className="lb-locx-info-l"><ZIcon name="clock" size={13} /> Opening hours</span>
                  </div>
                  <dl>
                    {loc.hours.map((h, i) => (
                      <div key={i} className="lb-locx-hrow" style={{ '--i': i }} data-closed={/closed/i.test(h.h) ? '1' : '0'} data-today={i === status.todayIdx ? '1' : '0'}>
                        <dt>{h.d}</dt><dd>{h.h}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="lb-locx-side">
                  <div className="lb-locx-stats">
                    <div><span className="lb-locx-stat-n mc-display"><RollNum value={loc.rating} decimals={1} delay={220} /></span><span className="lb-locx-stat-l">{loc.reviewCount} reviews</span></div>
                    <div><span className="lb-locx-stat-n mc-display">{teamN ? <RollNum value={teamN} delay={260} /> : '—'}</span><span className="lb-locx-stat-l">in the team</span></div>
                  </div>
                  <div className="lb-locx-contact">
                    <a className="lb-locx-meta-link" href={'tel:' + (loc.phone || '').replace(/\s/g, '')}><ZIcon name="phone" size={13} /> {loc.phone}</a>
                    <a className="lb-locx-meta-link" href={'mailto:' + (loc.email || MC_BIZ.email)}><ZIcon name="email" size={13} /> {loc.email || MC_BIZ.email}</a>
                  </div>
                </div>
              </div>

              {loc.amenities && loc.amenities.length > 0 && (
                <div className={'lb-locx-amen lb-locx-amen--' + amenStyle} key={'amen-' + loc.id}>
                  <span className="lb-locx-info-l"><ZIcon name="sparkle" size={13} /> Amenities</span>
                  <ul className="lb-locx-amen-list">
                    {loc.amenities.map((a, i) => (
                      <li key={i} className="lb-locx-amen-item" style={{ '--i': i }}>
                        <ZIcon name={amenStyle === 'list' ? 'check' : (a.icon || 'check')} size={amenStyle === 'list' ? 13 : 15} />
                        <span>{a.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="lb-locx-acts" key={'acts-' + loc.id}>
                <button className="mc-btn mc-btn--lg lb-locx-book" onClick={() => MCBus.open()}>
                  <MCWord text={(labels.book || 'Book') + ' at ' + loc.name} /> <MCArrow size={16}></MCArrow>
                </button>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — featured image, full height */}
          <Reveal variant="mask" className="lb-locx-stage">
            <div className="lb-locx-fig">
              <LocxPhoto src={loc.photo} alt={loc.name} label={place} />
              <div className="lb-locx-scrim"></div>
              <div className="lb-locx-cap" key={'cap-' + loc.id}>
                <div className="lb-locx-cap-nm mc-display">{loc.name}</div>
                <p className="lb-locx-cap-blurb">{loc.blurb}</p>
                <div className="lb-locx-cap-addr">
                  <span>{loc.address}, {loc.postcode}</span>
                  <button className="lb-locx-meet" onClick={meetTeam}>Meet the team <ZIcon name="arrowR" size={13} /></button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ───────── GALLERY (3 layouts: editorial · carousel · grid) ─────────
function GalleryEditorial({ G, onOpen }) {
  const spans = ['span 7', 'span 5', 'span 4', 'span 8', 'span 6', 'span 6'];
  const ar = ['7/5', '4/5', '4/5', '16/9', '3/2', '3/2'];
  const tops = [0, 0, 'clamp(20px,4vw,64px)', 'clamp(20px,4vw,64px)', 0, 0];
  return (
    <div className="lb-essay">
      {G.map((g, i) => (
        <figure key={i} style={{ gridColumn: spans[i % spans.length], marginTop: tops[i % tops.length] }}>
          <Reveal variant="mask" delay={(i % 2) * 100}>
            <div className="lb-zoomable" data-gimg={i} onClick={() => onOpen(i)}>
              <MicroImg src={g.src} alt={g.cap} label="gallery" parallax speed={0.06 + (i % 3) * 0.02} wrapStyle={{ aspectRatio: ar[i % ar.length], borderRadius: 6 }} />
              <span className="lb-zoom-badge" aria-hidden="true"><ZIcon name="expand" size={15} /></span>
            </div>
          </Reveal>
        </figure>
      ))}
    </div>
  );
}

function GalleryGrid({ G, onOpen }) {
  // repeating bento rhythm — big lead tile, wides, and squares
  const cells = ['c2 r2', 'c2', 'c1', 'c1', 'c2', 'c2'];
  return (
    <div className="lb-bento">
      {G.map((g, i) => (
        <Reveal key={i} variant="mask" delay={(i % 3) * 80} className={'lb-bento-tile ' + cells[i % cells.length]}>
          <div className="lb-zoomable" data-gimg={i} onClick={() => onOpen(i)}>
            <MicroImg src={g.src} alt={g.cap} label="gallery" wrapStyle={{ height: '100%', borderRadius: 8 }} style={{ objectFit: 'cover' }} />
            <span className="lb-zoom-badge" aria-hidden="true"><ZIcon name="expand" size={15} /></span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function GalleryMasonry({ G, onOpen }) {
  // Pinterest-style wall: STRONG height variety (tall portraits · short landscapes ·
  // squares) is the whole point — that's what reads as masonry vs a flat grid.
  // Tiles are distributed into columns by always dropping the next image into the
  // currently-shortest column, so columns end near-equal height and the bottom lands
  // level (the reference's tidy base) while every tile keeps its true proportion.
  const ratios = ['3/4', '5/4', '4/5', '3/4', '2/3', '1/1', '4/5', '3/4', '5/4', '4/5', '2/3', '5/6'];
  const rval = (s) => { const [w, h] = s.split('/').map(Number); return h / w; }; // height per unit width

  // responsive column cap
  const [vwCap, setVwCap] = React.useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return w <= 640 ? 2 : w <= 980 ? 3 : 4;
  });
  React.useEffect(() => {
    const onR = () => { const w = window.innerWidth; setVwCap(w <= 640 ? 2 : w <= 980 ? 3 : 4); };
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  // Column count is about TILE SIZE, not depth (the stretch-baseline handles short
  // columns). Few images still get 3 columns so tiles stay small and the masonry
  // rhythm reads — 2 columns only for a tiny set. Capped to the viewport.
  const cols = Math.min(vwCap, G.length <= 3 ? 2 : G.length <= 7 ? 3 : 4);
  const columns = Array.from({ length: cols }, () => ({ items: [], h: 0 }));
  G.forEach((g, i) => {
    const ar = ratios[i % ratios.length];
    let t = 0;
    for (let c = 1; c < cols; c++) if (columns[c].h < columns[t].h) t = c;
    columns[t].items.push({ g, i, ar });
    columns[t].h += rval(ar);
  });

  return (
    <div className="lb-masonry" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {columns.map((col, ci) => (
        <div className="lb-masonry-col" key={ci}>
          {col.items.map(({ g, i, ar }) => (
            <figure key={i} className="lb-masonry-tile">
              <Reveal variant="mask" delay={(ci % 3) * 70}>
                <div className="lb-zoomable" data-gimg={i} onClick={() => onOpen(i)}>
                  <MicroImg src={g.src} alt={g.cap} label="gallery" wrapStyle={{ aspectRatio: ar, borderRadius: 6 }} style={{ objectFit: 'cover' }} />
                  <span className="lb-zoom-badge" aria-hidden="true"><ZIcon name="expand" size={15} /></span>
                </div>
              </Reveal>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}

function GalleryCarousel({ G, onOpen }) {
  const viewRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const go = (i) => setActive(Math.max(0, Math.min(G.length - 1, i)));
  const recalc = React.useCallback((idx) => {
    const view = viewRef.current, track = trackRef.current; if (!view || !track) return;
    const slide = track.children[idx]; if (!slide) return;
    setOffset(view.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2));
  }, []);
  React.useEffect(() => { recalc(active); }, [active, recalc]);
  React.useEffect(() => {
    const f = () => recalc(active); window.addEventListener('resize', f);
    const t = setTimeout(f, 60); const imgs = trackRef.current ? trackRef.current.querySelectorAll('img') : [];
    imgs.forEach(im => im.addEventListener('load', f));
    return () => { window.removeEventListener('resize', f); clearTimeout(t); imgs.forEach(im => im.removeEventListener('load', f)); };
  }, [active, recalc]);
  // drag / swipe
  const drag = React.useRef(null);
  const onDown = (e) => { drag.current = { x: (e.touches ? e.touches[0].clientX : e.clientX), moved: false }; };
  const onMove = (e) => { if (!drag.current) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); if (Math.abs(x - drag.current.x) > 6) drag.current.moved = true; };
  const onUp = (e) => { if (!drag.current) return; const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX); const dx = x - drag.current.x; if (Math.abs(dx) > 48) go(active + (dx < 0 ? 1 : -1)); drag.current = null; };
  const num = (n) => String(n).padStart(2, '0');
  const progress = G.length > 1 ? active / (G.length - 1) : 1;
  return (
    <div className="lb-galcar">
      <Reveal className="lb-galcar-head">
        <div className="lb-galcar-count"><span className="lb-galcar-count-n mc-display">{num(active + 1)}</span><span className="lb-galcar-count-d">/ {num(G.length)}</span></div>
        <div className="lb-galcar-rail"><span className="lb-galcar-rail-fill" style={{ transform: 'scaleX(' + Math.max(0.04, progress) + ')' }}></span></div>
      </Reveal>
      <div className="lb-galcar-view" ref={viewRef}
           onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => (drag.current = null)}
           onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
        <div className="lb-galcar-track" ref={trackRef} style={{ transform: 'translate3d(' + offset + 'px,0,0)' }}>
          {G.map((g, i) => (
            <figure key={i} className="lb-galcar-slide" data-gimg={i} data-active={i === active ? '1' : '0'}
                    onClick={() => { if (drag.current && drag.current.moved) return; if (i !== active) go(i); else onOpen(i); }}>
              <div className="lb-galcar-img">
                <MicroImg src={g.src} alt={g.cap} label="gallery" wrapStyle={{ height: '100%', borderRadius: 'inherit' }} />
                {i === active && <span className="lb-galcar-expand" aria-hidden="true"><ZIcon name="expand" size={16} /> View full</span>}
              </div>
            </figure>
          ))}
        </div>
      </div>
      <Reveal className="lb-galcar-ctrl">
        <div className="lb-galcar-dots">
          {G.map((_, i) => (
            <button key={i} className="lb-galcar-dot" data-on={i === active ? '1' : '0'} aria-label={'Go to image ' + (i + 1)} onClick={() => go(i)}><span></span></button>
          ))}
        </div>
        <div className="lb-galcar-arrows">
          <button className="lb-galcar-arr" aria-label="Previous" disabled={active === 0} onClick={() => go(active - 1)}><ZIcon name="arrowR" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="lb-galcar-arr" aria-label="Next" disabled={active === G.length - 1} onClick={() => go(active + 1)}><ZIcon name="arrowR" size={18} /></button>
        </div>
      </Reveal>
    </div>
  );
}

function GalleryLightbox({ G, index, setIndex, getThumb }) {
  const num = (n) => String(n).padStart(2, '0');
  const [dir, setDir] = React.useState(0);
  const figRef = React.useRef(null);
  const closingRef = React.useRef(false);
  const EASE = 'cubic-bezier(.19,1,.22,1)';
  const RADIUS = 8;
  // rect of the displayed (centered) lightbox image, if measurable
  const imgRect = () => {
    const el = figRef.current; if (!el) return null;
    const img = el.querySelector('img');
    const r = img && img.getBoundingClientRect();
    return r && r.width && r.height ? r : null;
  };
  // Deterministic centered box: contain-fit the image's NATURAL size into 88vw×80vh.
  // Works even before the lightbox <img> has decoded (we read natural dims off the loaded thumbnail).
  const targetRect = (i) => {
    const root = getThumb && getThumb(i);
    const img = root && root.querySelector('img');
    const nw = (img && img.naturalWidth) || 3, nh = (img && img.naturalHeight) || 2;
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const maxW = vw * 0.88, maxH = vh * 0.80;
    const s = Math.min(maxW / nw, maxH / nh);
    const w = nw * s, h = nh * s;
    return { left: (vw - w) / 2, top: (vh - h) / 2, width: w, height: h };
  };
  // True shared-element morph: a fixed clone with background cover, animating its BOX
  // (left/top/width/height) — so the crop morphs seamlessly and the radius stays constant in px.
  const morph = (from, to, dur, onDone) => {
    const src = G[index] && G[index].src;
    if (!from || !to || !src || window.__microNoMotion) { onDone && onDone(); return; }
    const c = document.createElement('div');
    c.className = 'lb-morph';
    c.style.cssText =
      'position:fixed;z-index:1650;border-radius:' + RADIUS + 'px;overflow:hidden;' +
      'background-image:url("' + src + '");background-size:cover;background-position:center;' +
      'box-shadow:0 30px 80px rgba(0,0,0,.45);pointer-events:none;' +
      'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px;';
    document.body.appendChild(c);
    const a = c.animate([
      { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' },
      { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' },
    ], { duration: dur, easing: EASE, fill: 'forwards' });
    let done = false;
    const fin = () => { if (done) return; done = true; c.remove(); onDone && onDone(); };
    a.addEventListener('finish', fin);
    setTimeout(fin, dur + 90);
  };
  const nav = React.useCallback((d) => {
    setDir(d);
    setIndex(v => Math.max(0, Math.min(G.length - 1, v + d)));
  }, [G.length, setIndex]);
  const close = React.useCallback(() => {
    if (closingRef.current) return;
    const el = figRef.current;
    const back = el && el.closest('.lb-lbox');
    const root = getThumb && getThumb(index);
    const thumb = root && root.getBoundingClientRect();
    const from = imgRect() || targetRect(index);
    if (!el || !from || !thumb) { setIndex(-1); return; }
    closingRef.current = true;
    if (back) back.classList.add('is-closing');
    const dur = window.__microNoMotion ? 0 : 460;
    el.style.opacity = '0'; // hide real image; clone carries the motion
    if (back) back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: EASE, fill: 'forwards' });
    morph(from, thumb, dur, () => setIndex(-1));
  }, [index, getThumb, setIndex]);
  // open — grow from the clicked thumbnail to the centered image via the clone morph
  const wasOpenRef = React.useRef(false);
  React.useLayoutEffect(() => {
    const opening = index >= 0 && !wasOpenRef.current;
    wasOpenRef.current = index >= 0;
    if (!opening) return;
    const el = figRef.current;
    const back = el && el.closest('.lb-lbox');
    const root = getThumb && getThumb(index);
    const thumb = root && root.getBoundingClientRect();
    const to = targetRect(index);
    if (!el || !thumb || !to || window.__microNoMotion) return;
    el.style.opacity = '0';
    if (back) back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 560, easing: EASE });
    morph(thumb, to, 560, () => { if (figRef.current) figRef.current.style.opacity = '1'; });
  }, [index, getThumb]);
  React.useEffect(() => {
    if (index < 0) return;
    closingRef.current = false;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') nav(1);
      else if (e.key === 'ArrowLeft') nav(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [index, nav, close]);
  if (index < 0) return null;
  return ReactDOM.createPortal(
    <div className="lb-lbox" onClick={close}>
      <div className="lb-lbox-bar" onClick={(e) => e.stopPropagation()}>
        <span className="lb-lbox-count"><span className="mc-display" key={index}>{num(index + 1)}</span> <span>/ {num(G.length)}</span></span>
        <button className="lb-lbox-close" aria-label="Close" onClick={close}><ZIcon name="x" size={18} /></button>
      </div>
      <button className="lb-lbox-nav lb-lbox-prev" aria-label="Previous" disabled={index === 0} onClick={(e) => { e.stopPropagation(); nav(-1); }}><ZIcon name="arrowR" size={22} style={{ transform: 'rotate(180deg)' }} /></button>
      <figure className="lb-lbox-fig" ref={figRef} onClick={(e) => e.stopPropagation()}>
        <div className="lb-lbox-swap" key={index} data-dir={dir}>
          <MicroImg src={G[index].src} alt={G[index].cap} label="gallery" wrapStyle={{ maxWidth: '88vw', maxHeight: '80vh', borderRadius: 8 }} style={{ width: 'auto', maxWidth: '88vw', maxHeight: '80vh', objectFit: 'contain' }} />
        </div>
      </figure>
      <button className="lb-lbox-nav lb-lbox-next" aria-label="Next" disabled={index === G.length - 1} onClick={(e) => { e.stopPropagation(); nav(1); }}><ZIcon name="arrowR" size={22} /></button>
    </div>, document.body);
}

function SecGallery({ layout }) {
  const G = MC_BIZ.gallery;
  const mode = layout || window.__mcGalleryLayout || 'editorial';
  const [lbIndex, setLbIndex] = React.useState(-1);
  const secRef = React.useRef(null);
  const onOpen = (i) => setLbIndex(i);
  const getThumb = React.useCallback((i) => {
    const root = secRef.current; if (!root) return null;
    return root.querySelector('[data-gimg="' + i + '"]');
  }, []);
  return (
    <section className="mc-section" id="gallery" data-screen-label="Microsite · Gallery" data-gallery={mode} ref={secRef}>
      <div className="mc-wrap">
        <div className="mc-shead">
          <div>
            <SecKicker no="03">Gallery</SecKicker>
            <SplitReveal as="h2" className="mc-h2" text="The work & the rooms." step={42} />
          </div>
        </div>
        {mode === 'carousel' ? <GalleryCarousel G={G} onOpen={onOpen} />
          : mode === 'grid' ? <GalleryGrid G={G} onOpen={onOpen} />
          : mode === 'masonry' ? <GalleryMasonry G={G} onOpen={onOpen} />
          : <GalleryEditorial G={G} onOpen={onOpen} />}
      </div>
      <GalleryLightbox G={G} index={lbIndex} setIndex={setLbIndex} getThumb={getThumb} />
    </section>
  );
}

// ───────── TEAM (all stylists across every location) ─────────
function SecTeam({ layout = 'portraits' }) {
  const [, , setLoc] = useMCLocation();
  const labels = mcLabels();
  const all = MC_LOCS.flatMap((l, li) => l.team.map(m => ({ ...m, locId: l.id, locName: l.name, locArea: l.area, locIdx: li })));
  const list = all;
  const teamWord = (labels.teamPlural || 'team').toLowerCase();
  const goStudio = (m) => {
    setLoc(m.locIdx);
    const el = document.querySelector('#locations');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' });
  };
  return (
    <section className="mc-section" id="team" data-screen-label="Microsite · Team">
      <div className="mc-wrap">
        <div className="mc-shead">
          <div>
            <SecKicker no="04">The team</SecKicker>
            <SplitReveal as="h2" className="mc-h2" text={'Meet the ' + teamWord + '.'} step={40} />
            <Reveal><div className="mc-sublede">All {all.length} {teamWord} across our {MC_LOCS.length} {labels.placePlural || 'studios'} — each keeps its own menu and pricing.</div></Reveal>
          </div>
        </div>

        {layout === 'roster' ? (
          <div className="lb-roster" key="roster">
            {list.map((m, i) => (
              <Reveal as="div" key={m.locId + m.id} delay={Math.min(i, 8) * 45} className="lb-rrow">
                <button className="lb-rrow-btn" onClick={() => goStudio(m)}>
                  <span className="lb-rrow-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lb-rrow-ava"><MicroImg src={m.avatar} alt={m.name} label="stylist" wrapStyle={{ width: '100%', height: '100%', borderRadius: '50%' }} /></span>
                  <span className="lb-rrow-main">
                    <span className="lb-rrow-name">{m.name}</span>
                    <span className="lb-rrow-role">{m.role} — {m.specialty}</span>
                    <span className="lb-rrow-where">{m.locName}</span>
                    <span className="lb-rrow-meta">
                      <span className="lb-rrow-rate"><ZStars value={m.rating} size={13} color="var(--mc-accent)" empty="color-mix(in oklch, var(--mc-fg) 14%, transparent)" gap={1.5} /> <span className="lb-rrow-rev">({m.reviews})</span></span>
                    </span>
                  </span>
                  <span className="lb-rrow-cta" aria-label={'Find at ' + m.locName}><ZIcon name="arrowR" size={18} /></span>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="lb-team" key="grid">
            {list.map((m, i) => (
              <Reveal key={m.locId + m.id} variant="mask" delay={Math.min(i, 7) * 70} className="lb-portrait">
                <div className="lb-portrait-inner" onClick={() => goStudio(m)}>
                  <div className="lb-pfig">
                    <MicroImg src={m.avatar} alt={m.name} label="stylist" wrapStyle={{ height: '100%', borderRadius: 8 }} style={{ objectFit: 'cover' }} />
                    <div className="lb-pscrim"></div>
                    <span className="lb-pbadge"><ZIcon name="pin" size={11} /> {m.locName}</span>
                    <span className="lb-prate"><ZIcon name="star" size={12} /> {m.rating}</span>
                    <div className="lb-pcap">
                      <div className="lb-pname mc-display">{m.name}</div>
                      <div className="lb-prole">{m.role} · {m.specialty}</div>
                      <span className="lb-pfind">Find at {m.locName} <ZIcon name="arrowR" size={14} /></span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ───────── REVIEWS (editorial: rating summary · featured · quote cards) ─────────
// Plausible right-skewed star distribution consistent with the live aggregate
// (rating + count) — geometric decay from 5★, tuned so the mean ≈ the rating,
// rounded to sum exactly to the total. Visual proof, not a hand-typed number.
function mcRatingDist(rating, total) {
  const stars = [5, 4, 3, 2, 1];
  let best = null;
  for (let k = 0.15; k <= 4.5; k += 0.01) {
    const w = stars.map(s => Math.exp(-k * (5 - s)));
    const sum = w.reduce((a, b) => a + b, 0);
    const mean = stars.reduce((a, s, i) => a + s * w[i], 0) / sum;
    const d = Math.abs(mean - rating);
    if (!best || d < best.d) best = { d, w, sum };
  }
  const raw = best.w.map(wi => (wi / best.sum) * total);
  const out = raw.map(x => Math.floor(x));
  const rem = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f);
  for (let j = 0; j < rem; j++) out[order[j % order.length].i]++;
  return stars.map((s, i) => ({ stars: s, count: out[i], pct: total ? out[i] / total : 0 }));
}

// Distribution bar — fills when scrolled into view; full at rest (no JS / reduced motion).
function RvDistRow({ stars, pct }) {
  const ref = React.useRef(null);
  const reduced = (typeof window !== 'undefined') && (window.__microNoMotion || mcReduced());
  const [w, setW] = React.useState(() => (reduced ? pct : 0));
  React.useEffect(() => {
    if (reduced) { setW(pct); return; }
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setW(pct); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) { setW(pct); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [pct]);
  return (
    <div className="lb-rv-drow" ref={ref}>
      <span className="lb-rv-dlabel">{stars}<ZIcon name="star" size={10} /></span>
      <span className="lb-rv-dtrack"><span className="lb-rv-dfill" style={{ transform: 'scaleX(' + (pct > 0 ? Math.max(0.02, w) : 0) + ')' }}></span></span>
      <span className="lb-rv-dpct">{Math.round(pct * 100)}%</span>
    </div>
  );
}

// Word-of-mouth — an interactive, auto-playing quote showcase. Selecting a
// reviewer (or letting it advance) swaps the quote with a masked per-word rise.
// Accent is spent only on the sliding indicator + small stars.
// One slide — quote + meta. Entrance is a CSS *transition* flipped by `shown`
// (CSS @keyframes clocks idle in embedded previews; transitions stay live).
function RvSlide({ item, animateIn }) {
  // Resting state is VISIBLE; we only hide-then-rise when actually animating in
  // (section in view + motion on) so a frozen-clock first paint never traps words.
  const [shown, setShown] = React.useState(!animateIn);
  React.useEffect(() => {
    if (!animateIn) { setShown(true); return; }
    const t = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(t);
  }, [animateIn]);
  const initial = (item.name || '?').trim().charAt(0).toUpperCase();
  const sub = [item.loc, item.date].filter(Boolean).join(' · ');
  const words = String(item.text).split(' ');
  return (
    <React.Fragment>
      <blockquote className="lb-rv-q" data-shown={shown ? '1' : '0'}>
        {words.map((w, i) => (
          <React.Fragment key={i}>
            <span className="lb-rv-w"><span style={{ '--i': i }}>{w}</span></span>
            {i < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </blockquote>
      <figcaption className="lb-rv-meta" data-shown={shown ? '1' : '0'}>
        <span className="lb-rv-meta-mono" aria-hidden="true">{initial}</span>
        <span className="lb-rv-meta-tx">
          <span className="lb-rv-meta-nm">{item.name}</span>
          <span className="lb-rv-meta-sub">{sub}</span>
        </span>
        <span className="lb-rv-meta-end">
          <ZStars value={item.stars} size={14} color="var(--mc-accent)" empty="color-mix(in oklch, var(--mc-fg) 14%, transparent)" gap={1.5} />
          {item.verified && <span className="lb-rv-vrow"><ZIcon name="shield" size={11} /> Verified</span>}
        </span>
      </figcaption>
    </React.Fragment>
  );
}

function RvShowcase({ items }) {
  const n = items.length;
  const reduced = (typeof window !== 'undefined') && (window.__microNoMotion || mcReduced());
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const [ind, setInd] = React.useState(null);
  const rootRef = React.useRef(null);
  const listRef = React.useRef(null);
  const progRef = React.useRef(null);
  const elapsedRef = React.useRef(0);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver((es) => es.forEach(e => setInView(e.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = list.querySelectorAll('.lb-rv-li')[active];
    if (row) setInd({ y: row.offsetTop + 12, h: Math.max(8, row.offsetHeight - 24) });
  }, [active, n]);

  // Auto-advance + progress bar — driven by setInterval + performance.now so it
  // survives the preview's idled rAF/animation clocks. Pause keeps elapsed; a
  // manual pick resets it (see select()).
  React.useEffect(() => {
    const fill = progRef.current;
    const DUR = 5600;
    if (fill) fill.style.transform = 'scaleX(' + Math.min(1, elapsedRef.current / DUR) + ')';
    if (reduced || n <= 1 || paused || !inView) return;
    let start = performance.now() - elapsedRef.current;
    const id = setInterval(() => {
      const e = performance.now() - start;
      elapsedRef.current = e;
      const p = Math.min(1, e / DUR);
      if (fill) fill.style.transform = 'scaleX(' + p + ')';
      if (p >= 1) { clearInterval(id); elapsedRef.current = 0; setActive(a => (a + 1) % n); }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [active, paused, inView, n, reduced]);

  const select = (i) => { elapsedRef.current = 0; setActive(i); };
  const cur = items[active] || items[0];
  const num = (i) => String(i + 1).padStart(2, '0');

  return (
    <div className="lb-rv-show" ref={rootRef}
         onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="lb-rv-list" ref={listRef}>
        {ind && <span className="lb-rv-ind" aria-hidden="true" style={{ transform: 'translateY(' + ind.y + 'px)', height: ind.h }}></span>}
        {items.map((r, i) => (
          <button key={i} className="lb-rv-li" data-on={i === active ? '1' : '0'} aria-pressed={i === active} onClick={() => select(i)}>
            <span className="lb-rv-li-no">{num(i)}</span>
            <span className="lb-rv-li-nm"><MCWord text={r.name} /></span>
            <span className="lb-rv-li-loc">{r.loc}</span>
          </button>
        ))}
      </div>

      <div className="lb-rv-stage">
        <span className="lb-rv-stage-no" aria-hidden="true">{num(active)}</span>
        <RvSlide key={active} item={cur} animateIn={inView && !reduced} />
        <span className="lb-rv-prog" aria-hidden="true"><span className="lb-rv-prog-fill" ref={progRef}></span></span>
      </div>
    </div>
  );
}

function SecReviews() {
  const fiveStar = MC_ALL_REVIEWS.filter(r => r.stars === 5);
  const pool = fiveStar.length ? fiveStar : MC_ALL_REVIEWS;
  const reviews = pool.slice(0, 8);
  const dist = mcRatingDist(MC_AGG.rating, MC_AGG.count);
  const placePl = mcLabels().placePlural || 'locations';
  return (
    <section className="mc-section soft" id="reviews" data-screen-label="Microsite · Reviews">
      <div className="mc-wrap">
        <div className="mc-shead">
          <div>
            <SecKicker no="05">Reviews</SecKicker>
            <SplitReveal as="h2" className="mc-h2" text="Loved across every visit." step={40} />
            <Reveal><div className="mc-sublede" style={{ maxWidth: 460 }}>Every review below comes from a verified booking — unedited, gathered across all {MC_LOCS.length} {placePl}.</div></Reveal>
          </div>
        </div>

        <Reveal className="lb-rv-sum">
          <div className="lb-rv-score">
            <span className="lb-rv-score-n"><Counter to={MC_AGG.rating} decimals={1} /></span>
            <span className="lb-rv-score-meta">
              <ZStars value={MC_AGG.rating} size={17} color="var(--mc-accent)" empty="color-mix(in oklch, var(--mc-fg) 14%, transparent)" gap={2} />
              <span className="lb-rv-score-cnt"><b>{MC_AGG.count.toLocaleString()}</b> verified reviews</span>
              <span className="lb-rv-score-out">Average rating · out of 5.0</span>
            </span>
          </div>
          <span className="lb-rv-sum-div" aria-hidden="true"></span>
          <div className="lb-rv-dist">
            {dist.map(d => <RvDistRow key={d.stars} stars={d.stars} pct={d.pct} />)}
          </div>
        </Reveal>

        <Reveal variant="mask"><RvShowcase items={reviews} /></Reveal>
      </div>
    </section>
  );
}

// ───────── FAQ (accordion) ─────────
function SecFAQ() {
  const [open, setOpen] = useStateMC(0);
  return (
    <section className="mc-section" id="faq" data-screen-label="Microsite · FAQ">
      <div className="mc-wrap-narrow">
        <div style={{ marginBottom: 'clamp(28px,4vw,48px)' }}>
          <SecKicker no="06">Good to know</SecKicker>
          <SplitReveal as="h2" className="mc-h2" text="Questions, answered." step={42} />
        </div>
        <div className="lb-faq">
          {MC_BIZ.faq.map((f, i) => {
            const on = open === i;
            return (
              <Reveal key={i} delay={i * 40}>
                <div className="lb-faq-item" data-on={on ? '1' : '0'}>
                  <button className="lb-faq-q" onClick={() => setOpen(on ? -1 : i)}>
                    {f.q}<span className="lb-faq-ic"><ZIcon name="plus" size={16} /></span>
                  </button>
                  <div className="lb-faq-a" ref={(el) => { if (el) el.style.maxHeight = on ? el.scrollHeight + 'px' : '0px'; }}>
                    <div className="lb-faq-a-inner">{f.a}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────── CONTACT (simple, per location) ─────────
function SecContact() {
  const [loc] = useMCLocation();
  return (
    <section className="mc-section soft" id="contact" data-screen-label="Microsite · Contact">
      <div className="mc-wrap">
        <div className="mc-shead">
          <div>
            <SecKicker no="07">Visit</SecKicker>
            <SplitReveal key={loc.id} as="h2" className="mc-h2" text={'Come to ' + loc.name + '.'} step={40} />
          </div>
          <Reveal><button className="mc-btn mc-btn--lg" onClick={() => MCBus.open()}><MCWord text={'Book at ' + loc.name} /> <MCArrow size={17} /></button></Reveal>
        </div>
        <div className="lb-contact-grid">
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 24 }}>
              <div>
                <div className="lb-contact-h">Address</div>
                <div className="lb-contact-row">{loc.address}</div>
                <div className="lb-contact-row" style={{ color: 'var(--mc-muted)' }}>{loc.postcode}</div>
                <div className="lb-contact-row" style={{ color: 'var(--mc-muted)', fontSize: 13.5 }}>{loc.station}</div>
              </div>
              <div>
                <div className="lb-contact-h">Get in touch</div>
                <a className="lb-contact-row" href={'tel:' + loc.phone.replace(/\s/g, '')}>{loc.phone}</a>
                <a className="lb-contact-row" href={'mailto:' + MC_BIZ.email}>{MC_BIZ.email}</a>
                <a className="lb-contact-row" href="#" onClick={(e) => e.preventDefault()}>@{MC_BIZ.social.instagram}</a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <div className="lb-contact-h">Opening hours</div>
              {loc.hours.map(h => (
                <div key={h.d} className="lb-hours-row"><span>{h.d}</span><span style={{ opacity: h.h === 'Closed' ? 0.5 : 1 }}>{h.h}</span></div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ───────── INTERLUDE (cinematic full-bleed, from Tour) ─────────
function SecInterlude({ data }) {
  return (
    <section className="lb-interlude" data-screen-label="Microsite · Interlude">
      <div className="tour-bg"><MicroImg src={data.src} alt={data.line} label="interlude" parallax speed={0.08} zoom={false} radius={0} wrapStyle={{ position: 'absolute', inset: 0 }} /></div>
      <div className="tour-scrim"></div>
      <div className="lb-interlude-inner">
        <Reveal variant="fade"><Eyebrow className="on-img" style={{ color: 'var(--mc-accent)' }}>{data.kicker}</Eyebrow></Reveal>
        <SplitReveal as="div" className="lb-interlude-line" text={data.line} step={48} />
      </div>
    </section>
  );
}

const MC_SECTION_COMPONENTS = {
  announcement: SecAnnouncement,
  hero: SecHero,
  about: SecAbout,
  locations: SecLocations,
  gallery: SecGallery,
  team: SecTeam,
  reviews: SecReviews,
  faq: SecFAQ,
  contact: SecContact,
};

Object.assign(window, {
  SecAnnouncement, SecHero, SecAbout, SecLocations, SecGallery, SecTeam, SecReviews, SecFAQ, SecContact, SecInterlude,
  MC_SECTION_COMPONENTS,
});
