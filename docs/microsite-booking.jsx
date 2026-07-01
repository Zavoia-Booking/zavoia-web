// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — BOOKING FLOW + LOCATION PICKER.
// Mirrors the mobile app's order: Services → Date → Time → Staff
// → Confirm, scoped to the selected location, themed by accent +
// font, with the booking verb adapting per vertical.
// ─────────────────────────────────────────────────────────────

const { useState: useStateBK, useEffect: useEffectBK, useMemo: useMemoBK, useRef: useRefBK } = React;

// ── date helpers ──
const BK_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const BK_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const BK_DOW_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function bkYmd(d) { return d.year + '-' + String(d.month + 1).padStart(2, '0') + '-' + String(d.day).padStart(2, '0'); }
function bkDow(d) { return new Date(d.year, d.month, d.day).getDay(); }
function bkDaysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
function bkBefore(a, b) { if (a.year !== b.year) return a.year < b.year; if (a.month !== b.month) return a.month < b.month; return a.day < b.day; }
function bkSame(a, b) { return a && b && a.year === b.year && a.month === b.month && a.day === b.day; }
function bkShort(d) { return BK_DOW[bkDow(d)] + ', ' + BK_MONTHS[d.month].slice(0, 3) + ' ' + d.day; }
function bkLong(d) { return BK_DOW_FULL[bkDow(d)] + ', ' + BK_MONTHS[d.month] + ' ' + d.day; }
function bkMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function bkFmt(t) { const [h, m] = t.split(':').map(Number); const p = h < 12 ? 'AM' : 'PM'; const hh = ((h + 11) % 12) + 1; return hh + ':' + String(m).padStart(2, '0') + ' ' + p; }
function bkAdd(t, mins) { const tot = bkMins(t) + mins; return String(Math.floor(tot / 60)).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0'); }
function bkHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

// ── deterministic availability per location (the real funnel reads live data) ──
const BK_TODAY = { year: 2026, month: 5, day: 18 };
function bkAvail(locId) {
  const seed = bkHash(locId);
  const grid = []; for (let h = 9; h <= 18; h++) { grid.push(h + ':00'); if (h < 18) grid.push(h + ':30'); }
  const slots = {}, sold = {}, busy = {}, disabled = new Set();
  for (let i = 0; i < 40; i++) {
    const dt = new Date(2026, 5, 18 + i);
    const k = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    const dow = dt.getDay();
    if (dow === 0) { disabled.add(k); continue; }
    if ((i + seed) % 12 === 0) { slots[k] = []; busy[k] = 3; continue; }
    const open = grid.filter((t, gi) => ((gi * 7 + i * 3 + seed) % 10) >= 4);
    slots[k] = open;
    sold[k] = grid.filter(t => !open.includes(t)).slice(0, 4);
    busy[k] = open.length > 13 ? 1 : open.length > 9 ? 2 : 3;
  }
  return { slots, sold, busy, disabled };
}

// ── imperative open/close with a JS-tweened scale-in pop ──
// CSS transition/animation clocks freeze in this preview, so the entrance
// is hand-tweened with setTimeout + Date.now() (both advance reliably).
function useSnapOpen(ref, onOpen) {
  useEffectBK(() => {
    const el = ref.current; if (!el) return;
    const isPanel = el.classList.contains('mc-bk') || el.classList.contains('mc-lp');
    if (isPanel) el.style.transformOrigin = 'center center';
    el.style.transition = 'none'; el.style.animation = 'none';
    let timer = 0, token = 0;
    const apply = (e) => {
      el.style.opacity = String(e);
      if (isPanel) {
        const s = (0.95 + 0.05 * e).toFixed(4);
        const y = (14 * (1 - e)).toFixed(2);
        el.style.transform = 'translate(-50%, calc(-50% + ' + y + 'px)) scale(' + s + ')';
      }
    };
    const set = (open) => {
      token++; const my = token; clearTimeout(timer);
      if (open) {
        el.style.pointerEvents = 'auto';
        const dur = 460, t0 = Date.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
        apply(0);
        const tick = () => {
          if (my !== token) return;
          const p = Math.min(1, (Date.now() - t0) / dur);
          apply(ease(p));
          if (p < 1) timer = setTimeout(tick, 16);
        };
        timer = setTimeout(tick, 16);
      } else {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
        if (isPanel) el.style.transform = 'translate(-50%, calc(-50% + 16px)) scale(0.95)';
      }
    };
    set(false);
    const unsub = onOpen(set);
    return () => { clearTimeout(timer); if (unsub) unsub(); };
  }, []);
}

// ─────────────────────── LOCATION PICKER ───────────────────────
function LocationPicker() {
  const [loc, idx, setIdx] = useMCLocation();
  const [open, setOpen] = useStateBK(false);
  const backRef = useRefBK(null), panelRef = useRefBK(null);
  useSnapOpen(backRef, (set) => window.MCLocPicker.sub((v) => { setOpen(v); set(v); }));
  useSnapOpen(panelRef, (set) => window.MCLocPicker.sub((v) => set(v)));
  useEffectBK(() => {
    const onKey = (e) => { if (e.key === 'Escape') window.MCLocPicker.close(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  const openNow = (l) => { const h = l.hours.find(x => x.h !== 'Closed'); return !!h; };
  return (
    <>
      <div ref={backRef} className="mc-lp-back" onClick={() => window.MCLocPicker.close()}></div>
      <div ref={panelRef} className="mc-lp" role="dialog" aria-modal="true" aria-label="Choose a location">
        <div className="mc-lp-hd">
          <div>
            <div className="mc-lp-ttl mc-display">Choose your {mcLabels().place || 'location'}</div>
            <div className="mc-lp-sub">{MC_LOCS.length} {(mcLabels().placePlural || 'locations')} · the page updates to match</div>
          </div>
          <button className="mc-bk-x" onClick={() => window.MCLocPicker.close()} aria-label="Close"><ZIcon name="x" size={16} /></button>
        </div>
        <div className="mc-lp-body">
          {MC_LOCS.map((l, i) => (
            <button key={l.id} className="mc-lp-row" data-on={i === idx ? '1' : '0'}
                    onClick={() => { setIdx(i); window.MCLocPicker.close(); }}>
              <span className="mc-lp-thumb"><ZImg src={l.photo} alt={l.name} label="studio" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="mc-lp-nm">{l.name}{l.flagship && <span className="lb-loc-flag">Flagship</span>}</span>
                <span className="mc-lp-addr">{l.address}, {l.postcode}<br />{l.station}</span>
                <span className="mc-lp-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600 }}><ZIcon name="star" size={12} color="var(--mc-accent)" /> {l.rating} <span style={{ color: 'var(--mc-muted)', fontWeight: 400 }}>· {l.reviewCount}</span></span>
                  <span className="mc-lp-open"><i></i> Open today</span>
                </span>
              </span>
              <span className="mc-lp-check"><ZIcon name="check" size={15} /></span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────────────────── BOOKING FLOW ───────────────────────
function StepHead({ no, title, done, summary, active, locked, onClick }) {
  return (
    <button className={'mc-step-hd' + (active ? ' is-active' : '') + (locked ? ' is-locked' : '')} onClick={onClick} disabled={locked} aria-expanded={active ? 'true' : 'false'}>
      <span className="mc-step-no" data-done={done ? '1' : '0'}>{done ? <ZIcon name="check" size={14} /> : no}</span>
      <span className="mc-step-ttl mc-display">{title}</span>
      {summary && !active && <span className="mc-step-sum">{summary}</span>}
      {locked ? <span className="mc-step-chev mc-step-lock"><ZIcon name="lock" size={13} /></span> : <span className="mc-step-chev"><ZIcon name="chevD" size={16} /></span>}
    </button>
  );
}

// JS-tweened expand/collapse (CSS transition clocks freeze in previews)
function StepBody({ open, children }) {
  const wrap = useRefBK(null), inner = useRefBK(null), timer = useRefBK(0), first = useRefBK(true);
  useEffectBK(() => {
    const el = wrap.current, ic = inner.current; if (!el || !ic) return;
    clearTimeout(timer.current);
    if (first.current) {
      first.current = false;
      el.style.height = open ? 'auto' : '0px';
      el.style.opacity = open ? '1' : '0';
      return;
    }
    const startH = el.getBoundingClientRect().height;
    const startO = parseFloat(getComputedStyle(el).opacity) || 0;
    const endH = open ? ic.offsetHeight : 0;
    const endO = open ? 1 : 0;
    const dur = 300, t0 = Date.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    el.style.height = startH + 'px';
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      const e = ease(p);
      el.style.height = (startH + (endH - startH) * e) + 'px';
      el.style.opacity = (startO + (endO - startO) * e) + '';
      if (p < 1) timer.current = setTimeout(tick, 16);
      else if (open) el.style.height = 'auto';
    };
    tick();
    return () => clearTimeout(timer.current);
  }, [open]);
  return <div ref={wrap} className="mc-step-anim"><div ref={inner}>{children}</div></div>;
}

function BookingFlow() {
  const [loc, locIdx, setLocIdx] = useMCLocation();
  const groups = MC_MENU[loc.id] || [];
  const flat = useMemoBK(() => mcLocMenuFlat(loc.id), [loc.id]);
  const avail = useMemoBK(() => bkAvail(loc.id), [loc.id]);

  const [picked, setPicked] = useStateBK([]);       // service ids
  const [date, setDate] = useStateBK(null);
  const [calM, setCalM] = useStateBK({ year: BK_TODAY.year, month: BK_TODAY.month });
  const [time, setTime] = useStateBK(null);
  const [staff, setStaff] = useStateBK({});          // svcId -> memberId | 'any'
  const [confirmed, setConfirmed] = useStateBK(false);
  const [openStaff, setOpenStaff] = useStateBK(null);
  const [pillExp, setPillExp] = useStateBK(false);
  const [active, setActive] = useStateBK(1);
  const [phase, setPhase] = useStateBK(MC_LOCS.length > 1 ? 'location' : 'services');
  const backRef = useRefBK(null), panelRef = useRefBK(null);
  const dateRef = useRefBK(null), timeRef = useRefBK(null), staffRef = useRefBK(null);

  useSnapOpen(backRef, (set) => MCBus.sub((v) => set(v)));
  useSnapOpen(panelRef, (set) => MCBus.sub((v, opts) => {
    set(v);
    if (v) {
      setConfirmed(false); setActive(1); setPhase(MC_LOCS.length > 1 ? 'location' : 'services');
      if (opts && opts.serviceId && flat.find(s => s.id === opts.serviceId)) {
        setPicked([opts.serviceId]);
        if (opts.memberId) setStaff({ [opts.serviceId]: opts.memberId });
      }
    }
  }));
  useEffectBK(() => {
    const onKey = (e) => { if (e.key === 'Escape') MCBus.close(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  // reset when location changes
  useEffectBK(() => { setPicked([]); setDate(null); setTime(null); setStaff({}); setConfirmed(false); }, [loc.id]);

  const items = picked.map(id => flat.find(s => s.id === id)).filter(Boolean);
  const eff = (s) => { const mId = staff[s.id]; const m = mId && mId !== 'any' ? loc.team.find(t => t.id === mId) : null; const o = m && m.rates && m.rates[s.id]; return { ...s, price: o && o.price != null ? o.price : s.price, dur: o && o.dur != null ? o.dur : s.dur, member: m }; };
  const effItems = items.map(eff);
  const total = effItems.reduce((a, x) => a + x.price, 0);
  const totalDur = effItems.reduce((a, x) => a + x.dur, 0);
  const daySlots = date ? (avail.slots[bkYmd(date)] || []) : [];
  const earliest = daySlots[0];
  const daySold = date ? (avail.sold[bkYmd(date)] || []) : [];
  const ready = items.length > 0 && !!date && !!time;
  const step = ready ? 4 : time ? 3 : date ? 2 : items.length ? 1 : 0;
  const verb = mcLabels().book || 'Book';
  const multiLoc = MC_LOCS.length > 1;
  const sSvc = multiLoc ? 2 : 1, sDate = multiLoc ? 3 : 2, sTime = multiLoc ? 4 : 3, sStaff = multiLoc ? 5 : 4;

  const toggleSvc = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : p.concat(id));
  const bkScrollEl = (el) => { const sc = panelRef.current && panelRef.current.querySelector('.mc-bk-scroll'); if (!sc || !el) return; const r = el.getBoundingClientRect(), sr = sc.getBoundingClientRect(); sc.scrollTo({ top: sc.scrollTop + (r.top - sr.top) - 16, behavior: 'smooth' }); };
  const goStep = (n) => { setActive(n); setTimeout(() => bkScrollEl(document.getElementById('bkstep-' + n)), 80); };
  const continueToDate = () => {
    if (!date) { for (let i = 0; i < 14; i++) { const dt = new Date(BK_TODAY.year, BK_TODAY.month, BK_TODAY.day + i); const d = { year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() }; if (!avail.disabled.has(bkYmd(d))) { setDate(d); setCalM({ year: d.year, month: d.month }); break; } } }
    goPhase('schedule');
  };
  const onDate = (d) => { setDate(d); setTime(null); setCalM({ year: d.year, month: d.month }); setTimeout(() => bkScrollEl(timeRef.current), 90); };
  const onTime = (t) => { setTime(t); setTimeout(() => bkScrollEl(staffRef.current), 140); };
  const phaseList = multiLoc ? ['location', 'services', 'schedule'] : ['services', 'schedule'];
  const phaseIdx = phaseList.indexOf(phase);
  const svcSing = (mcLabels().services || 'service').toLowerCase().replace(/s$/, '');
  const goPhase = (p) => { setPhase(p); setOpenStaff(null); setTimeout(() => { const sc = panelRef.current && panelRef.current.querySelector('.mc-bk-scroll'); if (sc) sc.scrollTo({ top: 0, behavior: 'smooth' }); }, 20); };
  const nextPhase = () => { if (phaseIdx < phaseList.length - 1) goPhase(phaseList[phaseIdx + 1]); };
  const prevPhase = () => { if (phaseIdx > 0) goPhase(phaseList[phaseIdx - 1]); };
  const monthShift = (delta) => setCalM(m => { let mm = m.month + delta, yy = m.year; if (mm < 0) { mm = 11; yy--; } if (mm > 11) { mm = 0; yy++; } return { year: yy, month: mm }; });

  // 14-day strip
  const strip = []; for (let i = 0; i < 14; i++) { const dt = new Date(BK_TODAY.year, BK_TODAY.month, BK_TODAY.day + i); strip.push({ year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() }); }

  // slot buckets
  const buckets = useMemoBK(() => {
    const m = [], a = [], e = [];
    const merged = daySlots.map(t => ({ t, sold: false })).concat(daySold.map(t => ({ t, sold: true }))).sort((x, y) => bkMins(x.t) - bkMins(y.t));
    merged.forEach(s => { const h = bkMins(s.t) / 60; if (h < 12) m.push(s); else if (h < 17) a.push(s); else e.push(s); });
    return [{ label: 'Morning', items: m }, { label: 'Afternoon', items: a }, { label: 'Evening', items: e }].filter(g => g.items.length);
  }, [date, loc.id]);

  // calendar cells
  const firstDow = new Date(calM.year, calM.month, 1).getDay();
  const cells = []; for (let i = 0; i < firstDow; i++) cells.push(null); for (let d = 1; d <= bkDaysIn(calM.year, calM.month); d++) cells.push(d);
  const canPrev = !(calM.year === BK_TODAY.year && calM.month === BK_TODAY.month);

  const teamSing = (mcLabels().teamPlural || 'specialists').toLowerCase().replace(/s$/, '');
  const openId = openStaff || (items[0] && items[0].id);
  const refCode = date ? 'ZV-' + (((date.year + date.month * 31 + date.day) * 7919) % 1000000).toString(36).toUpperCase() : 'ZV-000';
  let cursor = time, sumCursor = time;

  return (
    <>
      <div ref={backRef} className="mc-bk-back" onClick={() => MCBus.close()}></div>
      <div ref={panelRef} className="mc-bk" role="dialog" aria-modal="true" aria-label={verb + ' at ' + MC_BIZ.name}>
        <div className="mc-bk-head">
          <div className="mc-bk-head-tx">
            <span className="mc-bk-head-ttl mc-display">{MC_BIZ.name}</span>
            <span className="mc-bk-head-sub">{verb} · {MC_LOCS.length > 1 ? (MC_LOCS.length + ' locations') : loc.name}</span>
          </div>
          <button className="mc-bk-x" onClick={() => MCBus.close()} aria-label="Close"><ZIcon name="x" size={16} /></button>
        </div>

        {!confirmed && <div className="mc-bk-prog"><i style={{ width: (((items.length > 0 ? 1 : 0) + (date ? 1 : 0) + (time ? 1 : 0) + (ready ? 1 : 0)) / 4 * 100) + '%' }}></i></div>}

        {confirmed ? (
          <div className="mc-bk-scroll" style={{ paddingBottom: 24 }}>
            <div className="mc-tkt-wrap">
              <div className="mc-tkt-eyebrow"><span className="lbl">Confirmed</span><span className="ref">#{refCode}</span></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <h2 className="mc-tkt-h" style={{ flex: 1 }}>You’re<br />booked.</h2>
                <span className="mc-tkt-check"><ZIcon name="check" size={30} /></span>
              </div>
              <p style={{ fontSize: 15, color: 'var(--mc-muted)', lineHeight: 1.5, margin: '14px 0 0', maxWidth: 400 }}>
                See you {date && BK_DOW_FULL[bkDow(date)]} at {time && bkFmt(time)}. This is where Zavoia’s checkout takes over.
              </p>
              <div className="mc-tkt">
                <div className="mc-tkt-brand">
                  <span className="mc-tkt-brand-logo">{MC_BIZ.name[0]}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{MC_BIZ.name} · {loc.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--mc-muted)', marginTop: 1 }}>{loc.address}, {loc.postcode}</div>
                  </div>
                </div>
                <div className="mc-tkt-dash"></div>
                <div className="mc-tkt-row">
                  <div><div className="mc-tkt-k">Date</div><div className="mc-tkt-v">{date && BK_MONTHS[date.month]} {date && date.day}</div><div style={{ fontSize: 12.5, color: 'var(--mc-muted)' }}>{date && BK_DOW_FULL[bkDow(date)]}</div></div>
                  <div><div className="mc-tkt-k">Time</div><div className="mc-tkt-v">{time && bkFmt(time)}</div><div style={{ fontSize: 12.5, color: 'var(--mc-muted)' }}>{time && 'Until ' + bkFmt(bkAdd(time, totalDur))} · {totalDur} min</div></div>
                </div>
                <div className="mc-tkt-dash"></div>
                <div className="mc-tkt-svcs">
                  <div className="mc-tkt-k" style={{ marginBottom: 8 }}>{mcLabels().services || 'Services'}</div>
                  {effItems.map((s) => {
                    const st = cursor; const en = time ? bkAdd(st, s.dur) : null; cursor = en || cursor;
                    const m = s.member;
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid var(--mc-line)' }}>
                        <span><span style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</span><span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--mc-muted)', marginTop: 2 }}>{time && bkFmt(st) + ' – ' + bkFmt(en)} · {s.dur}m{m ? ' · ' + m.name.split(' ')[0] : ''}</span></span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{MC_BIZ.currency}{s.price}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mc-tkt-total"><span className="mc-tkt-k">Total</span><span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{MC_BIZ.currency}{total}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13, color: 'var(--mc-muted)' }}>
                <ZIcon name="shield" size={16} color="var(--s-success-600)" /> Free cancellation up to 24h before.
              </div>
              <button className="mc-btn mc-btn--lg mc-btn--ink" style={{ marginTop: 22, width: '100%', justifyContent: 'center' }} onClick={() => MCBus.close()}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mc-bk-prog2">
              {phaseList.map((p, i) => (
                <span key={p} className="mc-bk-dot" data-on={i === phaseIdx ? '1' : '0'} data-done={i < phaseIdx ? '1' : '0'}></span>
              ))}
              <span className="mc-bk-prog2-now">{phase === 'location' ? 'Location' : phase === 'services' ? (mcLabels().services || 'Services') : 'Date & time'}</span>
            </div>

            <div className="mc-bk-scroll" key={phase}>
              {phase === 'location' && (
                <div className="mc-step-body" style={{ paddingTop: 18 }}>
                  <div className="mc-bk-locgrid">
                    {MC_LOCS.map((l, i) => (
                      <button key={l.id} className="mc-bk-loccard" data-on={i === locIdx ? '1' : '0'} onClick={() => { setLocIdx(i); goPhase('services'); }}>
                        <span className="mc-bk-loccard-radio"><span className="dot"></span></span>
                        <span className="mc-bk-loccard-tx">
                          <span className="mc-bk-loccard-top">
                            <span className="mc-bk-loccard-nm">{l.name}</span>
                            <span className="mc-bk-loccard-rate"><ZIcon name="star" size={11} color="var(--mc-accent)" /> {l.rating}</span>
                          </span>
                          {l.blurb && <span className="mc-bk-loccard-desc">{l.blurb}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'services' && (
                <div className="mc-step-body" style={{ paddingTop: 14 }}>
                  <div className="mc-card2">
                    {groups.map(g => (
                      <div key={g.cat} id={'bkcat-' + g.cat}>
                        <div className="mc-bk-cat">{g.cat}</div>
                        {g.items.map(it => {
                          const on = picked.includes(it.id);
                          return (
                            <div key={it.id} className={'mc-bk-svc' + (it.isBundle ? ' is-bundle' : '')} data-on={on ? '1' : '0'} onClick={() => toggleSvc(it.id)}>
                              <span className="mc-bk-box">{on && <ZIcon name="check" size={14} />}</span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span className="mc-bk-svc-nm">{it.isBundle && <span className="mc-bk-tag">Package</span>}{it.name}</span>
                                <span className="mc-bk-svc-meta">{it.dur} min{it.desc ? ' · ' + it.desc : ''}</span>
                                {it.isBundle && it.includes && <span className="mc-bk-incl">{it.includes.map((x, ii) => <span key={ii}>{x}</span>)}</span>}
                              </span>
                              <span className="mc-bk-svc-price">{MC_BIZ.currency}{it.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'schedule' && (
                <div style={{ padding: '6px 0 0' }}>
                  <div className="mc-wsec">
                    <div className="mc-wsec-h">When works for you?</div>
                    <div className="mc-step-body">
                      <div className="mc-card2 pad">
                        <div className="mc-strip">
                          {strip.map((d, i) => { const dis = avail.disabled.has(bkYmd(d)); return (
                            <button key={i} className="mc-strip-day" data-sel={bkSame(d, date) ? '1' : '0'} data-today={bkSame(d, BK_TODAY) ? '1' : '0'} disabled={dis} onClick={() => !dis && onDate(d)}>
                              <span className="mc-strip-dow">{BK_DOW[bkDow(d)]}</span>
                              <span className="mc-strip-num">{d.day}</span>
                            </button>
                          ); })}
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <div className="mc-cal-nav">
                            <button disabled={!canPrev} onClick={() => canPrev && monthShift(-1)} aria-label="Previous month"><ZIcon name="chevL" size={15} /></button>
                            <span className="mc-cal-mon">{BK_MONTHS[calM.month]} {calM.year}</span>
                            <button onClick={() => monthShift(1)} aria-label="Next month"><ZIcon name="chevR" size={15} /></button>
                          </div>
                          <div className="mc-cal-grid">
                            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="mc-cal-dow">{d}</div>)}
                            {cells.map((day, i) => {
                              if (day === null) return <div key={i}></div>;
                              const d = { year: calM.year, month: calM.month, day };
                              const past = bkBefore(d, BK_TODAY);
                              const dis = past || avail.disabled.has(bkYmd(d));
                              const busy = avail.busy[bkYmd(d)];
                              return (
                                <button key={i} className="mc-cal-cell" disabled={dis} data-sel={bkSame(d, date) ? '1' : '0'} data-today={bkSame(d, BK_TODAY) ? '1' : '0'} onClick={() => !dis && onDate(d)} aria-label={bkLong(d)}>
                                  <span className="pip">{day}</span>
                                  {!dis && !bkSame(d, date) && busy >= 2 && <span className="mc-cal-busy">{[0,1,2].map(b => <i key={b} style={{ opacity: b < busy ? 0.6 : 0.16 }}></i>)}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mc-wsec" ref={timeRef}>
                    <div className="mc-wsec-h">Choose a time{date ? ' · ' + bkShort(date) : ''}</div>
                    <div className="mc-step-body">
                      {!date ? (
                        <div className="mc-card2 pad" style={{ fontSize: 13.5, color: 'var(--mc-muted)', textAlign: 'center', padding: '22px' }}>Pick a day to see available times.</div>
                      ) : buckets.length === 0 ? (
                        <div className="mc-card2 pad" style={{ textAlign: 'center', padding: '26px 18px' }}>
                          <ZIcon name="clock" size={22} color="var(--mc-muted)" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontWeight: 600 }}>Fully booked on {bkShort(date)}</div>
                          <div style={{ fontSize: 13, color: 'var(--mc-muted)', marginTop: 3 }}>Try another day.</div>
                        </div>
                      ) : (
                        <div className="mc-card2 pad">
                          {buckets.map(g => (
                            <div key={g.label}>
                              <div className="mc-slotgroup-h"><span className="lbl">{g.label}</span><span className="cnt">{g.items.filter(s => !s.sold).length} open</span></div>
                              <div className="mc-slotgrid">
                                {g.items.map(s => <button key={s.t} className="mc-bk-slot" data-sel={time === s.t ? '1' : '0'} data-soon={!s.sold && s.t === earliest ? '1' : '0'} disabled={s.sold} onClick={() => !s.sold && onTime(s.t)} aria-label={bkFmt(s.t) + (s.t === earliest ? ', soonest available' : '')}>{bkFmt(s.t)}</button>)}
                              </div>
                            </div>
                          ))}
                          {time && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mc-muted)', marginTop: 14 }}>Runs <b style={{ color: 'var(--mc-fg)' }}>{bkFmt(time)}</b> – <b style={{ color: 'var(--mc-fg)' }}>{bkFmt(bkAdd(time, totalDur || 30))}</b> · {totalDur} min</div>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mc-wsec" ref={staffRef}>
                    <div className="mc-wsec-h">Choose your {teamSing}</div>
                    <div className="mc-step-body">
                      {items.length === 0 ? (
                        <div className="mc-card2 pad" style={{ fontSize: 13.5, color: 'var(--mc-muted)', textAlign: 'center', padding: '22px' }}>No {svcSing} selected.</div>
                      ) : items.map(s => {
                        const doers = loc.team.filter(m => m.does.includes(s.id));
                        const cur = staff[s.id] || 'any';
                        if (s.isBundle || doers.length === 0) {
                          return (
                            <div key={s.id} className="mc-staffsvc">
                              <div className="mc-staffsvc-h" style={{ cursor: 'default' }}>
                                <span className="mc-staffsvc-av"><ZIcon name="sparkle" size={16} /></span>
                                <span style={{ flex: 1, minWidth: 0 }}><span className="mc-staffsvc-nm">{s.name}</span><span className="mc-staffsvc-meta">Team allocated by the {mcLabels().place || 'studio'}</span></span>
                                <span className="mc-staffsvc-price">{MC_BIZ.currency}{s.price}</span>
                              </div>
                            </div>
                          );
                        }
                        const chosen = cur !== 'any' ? doers.find(m => m.id === cur) : null;
                        const er = eff(s);
                        const open = openId === s.id;
                        return (
                          <div key={s.id} className="mc-staffsvc" data-open={open ? '1' : '0'}>
                            <button className="mc-staffsvc-h" onClick={() => setOpenStaff(open ? '__none' : s.id)}>
                              {chosen ? <img className="mc-staffsvc-av" src={chosen.avatar} alt={chosen.name} /> : <span className="mc-staffsvc-av"><ZIcon name="sparkle" size={16} /></span>}
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span className="mc-staffsvc-nm">{s.name}</span>
                                <span className="mc-staffsvc-meta">{chosen ? chosen.name.split(' ')[0] : 'Any available'} · {er.dur}m</span>
                              </span>
                              <span className="mc-staffsvc-price">{MC_BIZ.currency}{er.price}</span>
                              <span className="mc-staffsvc-chev"><ZIcon name="chevD" size={18} /></span>
                            </button>
                            {open && (
                              <div className="mc-staffsvc-body">
                                <button className="mc-staffany" data-on={cur === 'any' ? '1' : '0'} onClick={() => setStaff(p => ({ ...p, [s.id]: 'any' }))}>
                                  <span className="ic"><ZIcon name="sparkle" size={16} /></span>
                                  <span style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>Any available</span>
                                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--mc-muted)', marginTop: 1 }}>Fastest match · {MC_BIZ.currency}{s.price} · {s.dur}m</span>
                                  </span>
                                  <span className="mc-staffany-radio">{cur === 'any' && <ZIcon name="check" size={12} />}</span>
                                </button>
                                <div className="mc-staffdivider">Or choose a {teamSing}</div>
                                <div className="mc-staffgrid">
                                  {doers.map(m => {
                                    const o = m.rates && m.rates[s.id]; const price = o && o.price != null ? o.price : s.price; const dur = o && o.dur != null ? o.dur : s.dur;
                                    const dP = price - s.price, dD = dur - s.dur; const sel = cur === m.id;
                                    return (
                                      <button key={m.id} className="mc-staffcard" data-on={sel ? '1' : '0'} onClick={() => setStaff(p => ({ ...p, [s.id]: m.id }))}>
                                        <span className="mc-staffcard-radio">{sel && <ZIcon name="check" size={11} />}</span>
                                        <span className="mc-staffcard-top">
                                          <img className="mc-staffcard-av" src={m.avatar} alt={m.name} />
                                          <span style={{ minWidth: 0 }}>
                                            <span className="mc-staffcard-nm">{m.name.split(' ')[0]}</span>
                                            <span className="mc-staffcard-rt"><ZIcon name="star" size={10} color="var(--mc-accent)" /> {m.rating} · {m.reviews}</span>
                                          </span>
                                        </span>
                                        <span className="mc-staffcard-foot">
                                          <span className="mc-staffcard-spec">{m.specialty}</span>
                                          <span className="mc-staffcard-pr">
                                            <b>{MC_BIZ.currency}{price}</b>
                                            {(dP !== 0 || dD !== 0) && <span className="dl">{dP > 0 ? '+' + MC_BIZ.currency + dP : dP < 0 ? '−' + MC_BIZ.currency + Math.abs(dP) : ''}{dD ? (dP ? ' · ' : '') + (dD > 0 ? '+' : '−') + Math.abs(dD) + 'm' : ''}</span>}
                                          </span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ height: 20 }}></div>
            </div>

            <div className="mc-bk-foot">
              <div className="mc-bk-nav">
                {phaseIdx > 0 && <button className="mc-bk-backbtn" onClick={prevPhase}><ZIcon name="chevL" size={16} /> Back</button>}
                {phase !== 'schedule' ? (
                  <button className="mc-bk-go mc-bk-go--wide" disabled={phase === 'services' && items.length === 0} onClick={nextPhase}>
                    {phase === 'location' ? 'Continue' : items.length === 0 ? ('Pick a ' + svcSing) : ('Continue · ' + MC_BIZ.currency + total)}
                    <ZIcon name="arrowR" size={16} />
                  </button>
                ) : (
                  <button className="mc-bk-go mc-bk-go--wide" disabled={!ready} onClick={() => setConfirmed(true)}>
                    {ready ? (verb + ' · ' + MC_BIZ.currency + total) : !date ? 'Pick a day' : 'Choose a time'}
                    {ready && <ZIcon name="arrowR" size={16} />}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

Object.assign(window, { BookingFlow, LocationPicker });
