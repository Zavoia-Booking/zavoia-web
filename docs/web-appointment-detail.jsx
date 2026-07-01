// Zavoia Web — Appointment detail. Sectioned layout: a strong hero, then
// distinct, refined cards (Where · Service · With · About) down the left,
// with ONE consolidated sticky action panel on the right. Editorial
// business/About card restored. Pay-at-venue throughout.
//
// Reads the flat ZV_RECENT_APPTS shape used by the list, enriched via
// ZV_BIZ_PROFILES (by bizId) and ZV_STAFF_PROFILES (by provider name).

const { useState: useStateAD2, useEffect: useEffectAD2 } = React;

const ZW_CARD = '1px solid rgba(28,28,26,0.07)';
const ZW_CARD_R = 18;

// ── Time / series helpers (ported from the app, flat-shape) ──
const ZW_MON = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 };
function zwAdNow() {
  const t = window.ZV_TODAY || { year: 2026, month: 4, day: 18 };
  return new Date(t.year, t.month, t.day, 11, 15);
}
function zwAdStart(a) {
  const today = window.ZV_TODAY || { year: 2026, month: 4, day: 18 };
  const m = ZW_MON[a.dateMon] != null ? ZW_MON[a.dateMon] : today.month;
  const [hh, mm] = (a.time || '00:00').split(':').map(Number);
  return new Date(a.dateYear || today.year, m, a.dateDay || 1, hh || 0, mm || 0);
}
function zwAdEnd(a) {
  const start = zwAdStart(a);
  if (!a.endTime) return new Date(start.getTime() + (a.durationMin || 30) * 60000);
  const [hh, mm] = a.endTime.split(':').map(Number);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), hh, mm);
}
function zwLiveProgress(a) {
  const s = zwAdStart(a).getTime(), e = zwAdEnd(a).getTime(), now = zwAdNow().getTime();
  return Math.max(0, Math.min(1, (now - s) / Math.max(1, e - s)));
}
function zwMinsLeft(a) {
  return Math.max(0, Math.floor((zwAdEnd(a).getTime() - zwAdNow().getTime()) / 60000));
}
function zwSeriesDates(a) {
  if (!a.recurring) return [];
  const { index, total, cadence } = a.recurring;
  const m = (cadence || '').toLowerCase().match(/(\d+)\s+(week|month|day)/);
  if (!m) return [];
  const n = parseInt(m[1], 10), unit = m[2], cur = zwAdStart(a), out = [];
  for (let i = 1; i <= total; i++) {
    const d = new Date(cur), off = i - index;
    if (unit === 'week') d.setDate(d.getDate() + off * n * 7);
    if (unit === 'day') d.setDate(d.getDate() + off * n);
    if (unit === 'month') d.setMonth(d.getMonth() + off * n);
    out.push(d);
  }
  return out;
}
function zwNextRecurring(a) {
  if (!a.recurring || a.recurring.index >= a.recurring.total) return null;
  const m = (a.recurring.cadence || '').toLowerCase().match(/(\d+)\s+(week|month|day)/);
  if (!m) return null;
  const n = parseInt(m[1], 10), unit = m[2], d = new Date(zwAdStart(a));
  if (unit === 'week') d.setDate(d.getDate() + n * 7);
  if (unit === 'day') d.setDate(d.getDate() + n);
  if (unit === 'month') d.setMonth(d.getMonth() + n);
  return d;
}
function zwFmtSeriesDate(d) {
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
}
function zwRelDate(d) {
  const days = Math.floor((d.getTime() - zwAdNow().getTime()) / 86400000);
  if (days < 0) return `${-days} day${-days === 1 ? '' : 's'} ago`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'in a week';
  if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
  if (days < 60) return 'in a month';
  return `in ${Math.floor(days / 30)} months`;
}
function zwFmtStamp(s, fallbackYear) {
  if (!s) return null;
  const day = s.day, mon = (s.mon || '').charAt(0) + (s.mon || '').slice(1).toLowerCase();
  return `${day} ${mon}`;
}

// Resolve an appointment by id across session bookings + seed data.
function zwFindAppt(id) {
  const session = (window.ZW_SESSION_BOOKINGS || []).map(s => ({
    id: s.id, bizId: s.biz.id, business: s.biz.name,
    service: s.services.join(' + '), services: s.services,
    provider: s.pro === 'any' ? null : s.pro,
    photo: s.biz.photo, cat: s.biz.cat,
    day: window.zwFmtShort(s.date).split(',')[0],
    date: window.zwFmtShort(s.date).split(', ')[1],
    time: window.zwFmtTime(s.slot), rel: 'Just booked',
    status: 'Confirmed', statusTone: 'success', tense: 'future',
    price: s.total, currency: s.currency, durationMin: s.durationMin,
    booked: 'Just now',
  }));
  return window.zwApplyApptOverrides([...session, ...(window.ZV_RECENT_APPTS || [])].find(a => a.id === id) || null);
}

// Status stamp descriptor.
function zwApptStamp(a) {
  if (a.tense === 'now' || a.statusTone === 'live') return { label: 'In progress', color: 'var(--s-success-600)', pulse: true };
  if (a.statusTone === 'warning') return { label: a.status || 'Cancelled', color: 'var(--s-warning-600)' };
  if (a.statusTone === 'error') return { label: a.status || 'No-show', color: 'var(--s-error-600)' };
  if (a.tense === 'past') return { label: a.status || 'Completed', color: 'var(--c-600)' };
  if (a.statusTone === 'pending') return { label: 'Pending', color: 'var(--c-900)' };
  return { label: a.status || 'Confirmed', color: 'var(--p-600)' };
}

function ZwApptStampPill({ a }) {
  const s = zwApptStamp(a);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '5px 11px 5px 9px', border: '1.5px dashed ' + s.color, borderRadius: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase', color: s.color,
      background: '#fff', whiteSpace: 'nowrap', lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, position: 'relative', display: 'inline-block' }}>
        {s.pulse && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: s.color, animation: 'zv-pulse 1.6s ease-out infinite' }}></span>}
      </span>
      {s.label}
    </span>
  );
}

function ZwApptEyebrow({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 13 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)' }}>{children}</span>
      {action}
    </div>
  );
}

function ZwApptSection({ label, action, children, style = {} }) {
  return (
    <section style={{ marginTop: 36, ...style }}>
      <ZwApptEyebrow action={action}>{label}</ZwApptEyebrow>
      {children}
    </section>
  );
}

// ── WHERE — two-zone venue ticket: photo (business name overlay) +
//    location detail (name · address · distance · rating) ──
function ZwApptWhere({ a, ctx }) {
  const profile = (window.ZV_BIZ_PROFILES || {})[a.bizId] || {};
  const biz = (window.ZV_BUSINESSES || []).find(x => x.id === a.bizId);
  const photo = profile.photo || a.photo;
  const title = a.locationName || (biz ? biz.name : a.business);
  const address = a.locationAddress;
  const distance = a.distance;
  const rating = a.locationRating != null ? a.locationRating : (biz && biz.rating);
  const reviews = a.locationReviews != null ? a.locationReviews : (profile.reviews != null ? profile.reviews : (biz && biz.reviews));
  return (
    <div className="zw-hover-lift" role="button" tabIndex={0}
         onClick={() => ctx.go('biz/' + (a.bizId || 'glow-soho'))}
         style={{ display: 'flex', background: '#fff', cursor: 'pointer', border: ZW_CARD, borderRadius: ZW_CARD_R, overflow: 'hidden', boxShadow: 'var(--sh-sm)', minHeight: 150 }}>
      <div className="zw-zoom-wrap" style={{ width: 150, flexShrink: 0, background: 'var(--c-300)', position: 'relative' }}>
        <ZImg src={photo} alt={a.business} label={a.cat}
              style={{ width: '100%', height: '100%', filter: a.statusTone === 'warning' ? 'saturate(0.3)' : a.tense === 'past' ? 'saturate(0.85)' : 'none' }}></ZImg>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.06) 56%, rgba(0,0,0,0.78) 100%)' }}></div>
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 11, fontSize: 13.5, fontWeight: 700, color: '#fff', letterSpacing: '-0.014em', lineHeight: 1.18, textShadow: '0 1px 3px rgba(0,0,0,0.45)' }} className="txt-pretty">{a.business}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7, borderLeft: '1px dashed rgba(28,28,26,0.10)' }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.028em', color: 'var(--c-900)', lineHeight: 1.16 }} className="txt-pretty">{title}</div>
        {address && <div style={{ fontSize: 13, color: 'var(--c-600)', lineHeight: 1.4 }} className="txt-pretty">{address}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
          {rating != null && <ZwRating rating={rating} reviews={reviews} size={12.5}></ZwRating>}
          {distance && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--c-600)' }}>
              <ZIcon name="nav" size={11} color="var(--c-500)"></ZIcon>{distance}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-700)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
          View venue <ZIcon name="chevR" size={13} color="var(--p-700)"></ZIcon>
        </span>
      </div>
    </div>
  );
}

// ── SERVICE — line items + pay-at-venue total ──
function ZwApptTreatment({ a }) {
  const items = (a.serviceItems && a.serviceItems.length) ? a.serviceItems : null;
  const services = (a.services && a.services.length ? a.services : [a.service]).filter(Boolean);
  const rows = items || services.map(s => ({ name: s }));
  const total = a.price != null ? a.price : a.total;
  const isBundle = a.bookingType === 'bundle';
  const multi = rows.length > 1;
  const cur = a.currency || '£';
  const subtotal = rows.reduce((n, s) => n + (s.price || 0), 0);
  const discount = Math.max(0, subtotal - (total || 0));
  const free = total === 0;
  return (
    <div style={{ background: '#fff', border: ZW_CARD, borderRadius: ZW_CARD_R, boxShadow: 'var(--sh-sm)', padding: '6px 20px 18px' }}>
      {isBundle && a.bundleName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 0 13px', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--p-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ZIcon name="sparkle" size={13} color="var(--p-600)"></ZIcon>
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)' }}>{a.bundleName}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--p-600)' }}>Bundle</span>
        </div>
      )}
      {isBundle && a.bundleDescription && (
        <p className="txt-pretty" style={{ margin: 0, padding: '14px 0 12px', borderBottom: '1px solid rgba(28,28,26,0.06)', fontSize: 13.5, color: 'var(--c-700)', lineHeight: 1.45 }}>{a.bundleDescription}</p>
      )}
      {rows.map((s, i) => {
        const price = s.price != null ? s.price : null;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 0', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              {multi && <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.10)', color: 'var(--c-600)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{s.name}</span>
                {s.durationMin != null && <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 2 }}>{zwFmtDur(s.durationMin)}</span>}
              </span>
            </span>
            {price != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--c-800)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{price === 0 ? 'Free' : zwFmtPrice(price, cur)}</span>}
          </div>
        );
      })}
      {/* Subtotal + bundle discount (multi-line bookings) */}
      {!free && (multi || discount > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0 3px' }}>
          <span style={{ fontSize: 13, color: 'var(--c-600)' }}>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--c-700)', fontVariantNumeric: 'tabular-nums' }}>{zwFmtPrice(subtotal, cur)}</span>
        </div>
      )}
      {!free && discount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0' }}>
          <span style={{ fontSize: 13, color: 'var(--c-600)' }}>Bundle discount</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--s-success-600)', fontVariantNumeric: 'tabular-nums' }}>− {zwFmtPrice(discount, cur)}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingTop: 14, marginTop: (!free && (multi || discount > 0)) ? 6 : 0, borderTop: (!free && (multi || discount > 0)) ? '1px dashed rgba(28,28,26,0.18)' : 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>Total at venue</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-500)' }}>Pay directly with {a.business}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{free ? 'Free' : zwFmtPrice(total, cur)}</span>
      </div>
    </div>
  );
}

function ZwApptPendingBanner({ a }) {
  if (a.statusTone !== 'pending') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 20, background: 'var(--s-warning-100)', border: '1px solid color-mix(in oklch, var(--s-warning-600) 22%, transparent)', borderRadius: 14, padding: '14px 16px' }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ZIcon name="clock" size={15} color="var(--s-warning-600)"></ZIcon>
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>Awaiting confirmation</div>
        <div className="txt-pretty" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--c-700)', marginTop: 2 }}>{a.business} usually confirms within a few hours. We'll notify you the moment they do — nothing's charged until then.</div>
      </div>
    </div>
  );
}

// ── Live progress meter — ticks for in-progress appointments ──
function ZwApptLiveStrip({ a }) {
  const [, force] = useStateAD2(0);
  useEffectAD2(() => {
    if (a.tense !== 'now') return;
    const id = setInterval(() => force(n => n + 1), 30000);
    return () => clearInterval(id);
  }, [a.tense]);
  if (a.tense !== 'now') return null;
  const p = zwLiveProgress(a);
  const mins = zwMinsLeft(a);
  const label = mins <= 0 ? 'Ending now' : mins === 1 ? '1 min left' : `${mins} min left`;
  const color = 'var(--s-success-600)';
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color }}>
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: color, position: 'relative', display: 'inline-block' }}>
            <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: 'zv-pulse 1.6s ease-out infinite' }}></span>
          </span>
          In progress
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-600)', fontVariantNumeric: 'tabular-nums' }}>{label}</span>
      </div>
      <div style={{ position: 'relative', height: 4, borderRadius: 999, background: 'rgba(28,28,26,0.08)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(p * 100)}%`, background: color, borderRadius: 999, transition: 'width .8s var(--ease-out)' }}></div>
      </div>
    </div>
  );
}

// ── Recurring series — dot timeline with real visit dates ──
function ZwApptSeriesNote({ a }) {
  if (!a.recurring) return null;
  const { index, total, cadence } = a.recurring;
  const cancelled = a.statusTone === 'warning' || a.statusTone === 'error';
  const dates = zwSeriesDates(a);
  const next = zwNextRecurring(a);
  const isFinal = index >= total;
  let sub = null;
  if (cancelled || a.tense === 'past') sub = null;
  else if (isFinal) sub = 'Final visit in this series';
  else if (next) sub = `Next on ${zwFmtSeriesDate(next)} · ${zwRelDate(next)}`;
  const active = cancelled ? 'var(--c-500)' : 'var(--p-500)';
  const lineDone = cancelled ? 'rgba(28,28,26,0.25)' : 'var(--p-500)';

  return (
    <div style={{ marginTop: 16, padding: '15px 18px', background: '#fff', border: ZW_CARD, borderRadius: 14, boxShadow: 'var(--sh-sm)' }}>
      {dates.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 14 }}>
          {dates.map((d, i) => {
            const isPast = i < index - 1, isCurrent = i === index - 1;
            const day = d.getDate(), mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return (
              <React.Fragment key={i}>
                {i > 0 && <span aria-hidden="true" style={{ flex: 1, height: 2, marginTop: isCurrent ? 6 : 4, minWidth: 8, background: i <= index - 1 ? lineDone : 'rgba(28,28,26,0.12)' }}></span>}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0, paddingTop: isCurrent ? 0 : 1 }}>
                  <span aria-hidden="true" style={{
                    width: isCurrent ? 12 : 10, height: isCurrent ? 12 : 10, borderRadius: '50%', boxSizing: 'border-box', flexShrink: 0,
                    background: isCurrent ? '#fff' : isPast ? active : 'rgba(28,28,26,0.14)',
                    border: isCurrent ? `2.5px solid ${active}` : 'none',
                  }}></span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', color: isCurrent ? (cancelled ? 'var(--c-700)' : 'var(--p-700)') : 'var(--c-600)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{day} {mon}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 14.5, fontWeight: 600, color: cancelled ? 'var(--c-600)' : 'var(--c-900)', letterSpacing: '-0.014em', lineHeight: 1.25 }}>
        Visit {index} of {total}{cadence ? <span style={{ color: 'var(--c-500)', fontWeight: 500 }}> · {cadence.toLowerCase()}</span> : null}
      </div>
      {sub && <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--c-600)', lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function ZwApptNotes({ a }) {
  return (
    <div style={{ background: '#fff', border: ZW_CARD, borderRadius: ZW_CARD_R, boxShadow: 'var(--sh-sm)', padding: '16px 20px', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
      <ZIcon name="reply" size={17} color="var(--c-500)" style={{ marginTop: 2, flexShrink: 0 }}></ZIcon>
      <p className="txt-pretty" style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--c-700)', fontStyle: 'italic' }}>"{a.notes}"</p>
    </div>
  );
}

function ZwApptOnline({ a }) {
  const upcoming = a.tense !== 'past';
  return (
    <div style={{ background: 'var(--c-ink)', color: '#fff', borderRadius: ZW_CARD_R, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--sh-md)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 130% at 100% 0%, color-mix(in oklch, var(--p-500) 26%, transparent), transparent 60%)' }}></div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ZIcon name="globe" size={17} color="#fff"></ZIcon>
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em' }}>{a.locationName || 'Online session'}</div>
          {a.locationAddress && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.66)', marginTop: 1 }}>{a.locationAddress}</div>}
        </div>
      </div>
      {upcoming && (
        <div style={{ position: 'relative' }}>
          <ZwButton kind="accent" size="lg" onClick={() => window.zwToast('Opening your online session', 'globe')} style={{ width: '100%' }}>
            <ZIcon name="globe" size={16} color="#fff"></ZIcon>Join online
          </ZwButton>
        </div>
      )}
    </div>
  );
}

function ZwApptReviewCard({ a }) {
  const r = a.review;
  return (
    <div style={{ background: '#fff', border: ZW_CARD, borderRadius: ZW_CARD_R, boxShadow: 'var(--sh-sm)', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <ZStars value={r.rating} size={17}></ZStars>
        <button className="tap" onClick={() => window.zwOpenReview(a.id)} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--p-700)' }}>Edit</button>
      </div>
      {r.comment && <p className="txt-pretty" style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--c-700)' }}>"{r.comment}"</p>}
    </div>
  );
}

// ── WITH — provider card ──
function ZwApptWith({ a, ctx }) {
  const p = (window.ZV_STAFF_PROFILES || {})[a.provider] || {};
  const isMara = a.provider === 'Mara Voinescu';
  const meta = [];
  if (a.providerRole) meta.push(a.providerRole);
  if (p.years) meta.push(p.years + ' yrs on the team');
  return (
    <div className="zw-hover-lift" role={isMara ? 'button' : undefined} tabIndex={isMara ? 0 : undefined}
         onClick={isMara ? () => ctx.go('pro') : undefined}
         style={{ display: 'flex', alignItems: 'flex-start', gap: 15, background: '#fff', border: ZW_CARD, borderRadius: ZW_CARD_R, boxShadow: 'var(--sh-sm)', padding: '18px 20px', cursor: isMara ? 'pointer' : 'default' }}>
      <ZAvatar src={p.avatar} name={a.provider} size={54}></ZAvatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>{a.provider}</span>
          {p.rating != null && <ZwRating rating={p.rating} reviews={p.reviews} size={12.5}></ZwRating>}
        </div>
        {meta.length > 0 && <div style={{ fontSize: 13, color: 'var(--c-600)', marginTop: 3 }}>{meta.join(' · ')}</div>}
        {p.specialties && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
            {p.specialties.slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--c-700)', padding: '4px 10px', background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.06)', borderRadius: 999, whiteSpace: 'nowrap' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      {isMara && <ZIcon name="chevR" size={15} color="var(--c-400)"></ZIcon>}
    </div>
  );
}

// ── ABOUT — editorial business card (image + overlapping info) ──
function ZwApptAbout({ a, ctx }) {
  const profile = (window.ZV_BIZ_PROFILES || {})[a.bizId] || {};
  if (!profile.photo || !profile.blurb) return null;
  return (
    <button className="tap" onClick={() => ctx.go('biz/' + (a.bizId || 'glow-soho'))}
            style={{ width: '100%', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block' }}>
      <div className="zw-zoom-parent" style={{ position: 'relative', height: 220, borderRadius: ZW_CARD_R, overflow: 'hidden', background: 'var(--c-300)', boxShadow: 'var(--sh-md)' }}>
        <div className="zw-zoom-wrap" style={{ position: 'absolute', inset: 0 }}>
          <ZImg src={profile.photo} alt={a.business} style={{ width: '100%', height: '100%' }}></ZImg>
        </div>
        {profile.catLabel && (
          <span style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', padding: '5px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--c-800)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {profile.cat && <ZwCatDot cat={profile.cat}></ZwCatDot>}
            {profile.catLabel}
          </span>
        )}
      </div>
      <div style={{ margin: '-30px 18px 0', position: 'relative', background: '#fff', border: '1px solid rgba(28,28,26,0.06)', borderRadius: 16, boxShadow: 'var(--sh-sm)', padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--c-900)' }}>{a.business}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-700)', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            View profile <ZIcon name="chevR" size={12} color="var(--p-700)"></ZIcon>
          </span>
        </div>
        <p className="txt-pretty" style={{ margin: '7px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--c-700)' }}>{profile.blurb}</p>
      </div>
    </button>
  );
}

// ── Action buttons (rail) ──
function ZwApptActions({ a, ctx }) {
  const isUpcoming = a.tense === 'future' || a.tense === 'today';
  const isNow = a.tense === 'now';
  const isPast = a.tense === 'past';
  const cancelled = a.statusTone === 'warning' || a.statusTone === 'error';
  const Btn = ({ kind, icon, children, onClick }) => (
    <ZwButton kind={kind} size="lg" onClick={onClick} style={{ width: '100%' }}>
      {icon && <ZIcon name={icon} size={16} color={kind === 'primary' || kind === 'accent' ? '#fff' : 'var(--c-800)'}></ZIcon>}
      {children}
    </ZwButton>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(isUpcoming || isNow) && !cancelled && a.isRemote && (
        <React.Fragment>
          <Btn kind="primary" icon="globe" onClick={() => window.zwToast('Opening your online session', 'globe')}>Join online</Btn>
          <Btn kind="secondary" icon="cal" onClick={() => window.zwToast('Added to your calendar', 'cal')}>Add to calendar</Btn>
        </React.Fragment>
      )}
      {(isUpcoming || isNow) && !cancelled && !a.isRemote && (
        <React.Fragment>
          <Btn kind="primary" icon="nav" onClick={() => window.zwToast('Opening directions', 'nav')}>Get directions</Btn>
          <Btn kind="secondary" icon="phone" onClick={() => window.zwToast('Calling ' + a.business, 'phone')}>Call venue</Btn>
        </React.Fragment>
      )}
      {isPast && !cancelled && (
        <React.Fragment>
          {a.reviewable && <Btn kind="accent" icon="star" onClick={() => window.zwOpenReview(a.id)}>Leave a review</Btn>}
          <Btn kind={a.reviewable ? 'secondary' : 'accent'} icon="rebook" onClick={() => ctx.openBooking({ bizId: a.bizId })}>Book again</Btn>
        </React.Fragment>
      )}
      {cancelled && <Btn kind="accent" icon="rebook" onClick={() => ctx.openBooking({ bizId: a.bizId })}>Book again</Btn>}
    </div>
  );
}

// ── Manage rows ──
function ZwApptManage({ a }) {
  if (a.tense === 'past' || a.statusTone === 'warning' || a.statusTone === 'error') return null;
  const policy = a.policy || {};
  const canReschedule = policy.canReschedule !== false;
  const canCancel = policy.canCancel !== false;
  const Row = ({ icon, label, danger, disabled, onClick }) => (
    <button className={'tap' + (disabled ? '' : ' zw-hover-row')} onClick={disabled ? undefined : onClick} disabled={disabled}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'transparent', border: 0, cursor: disabled ? 'default' : 'pointer', textAlign: 'left', padding: '12px 14px', borderRadius: 11, fontSize: 14, fontWeight: 500, opacity: disabled ? 0.4 : 1, color: danger ? 'var(--s-warning-600)' : 'var(--c-800)' }}>
      <ZIcon name={icon} size={16} color={danger ? 'var(--s-warning-600)' : 'var(--c-600)'}></ZIcon>{label}
    </button>
  );
  return (
    <React.Fragment>
      <Row icon="clock" label={canReschedule ? 'Reschedule' : 'Reschedule unavailable'} disabled={!canReschedule} onClick={() => window.zwOpenReschedule(a.id)}></Row>
      <Row icon="cal" label="Add to calendar" onClick={() => window.zwToast('Added to calendar', 'cal')}></Row>
      <Row icon="x" label="Cancel appointment" danger={true} disabled={!canCancel} onClick={() => window.zwOpenCancel(a.id)}></Row>
    </React.Fragment>
  );
}

// ── Page ──
function ZwApptDetailPage({ ctx }) {
  window.zwUseApptsVersion();
  const a = zwFindAppt(ctx.route.id);

  const ownSession = (window.ZW_SESSION_BOOKINGS || []).some(s => s.id === ctx.route.id);
  if (ctx.userState === 'new' && !ownSession) {
    return (
      <ZwSignedOutGate ctx={ctx} icon="cal"
        title="Sign in to view this appointment."
        body="Your bookings are private. Sign in to see the details, reschedule or get directions."
        secondaryLabel="Explore places" onSecondary={() => ctx.go('search')}></ZwSignedOutGate>
    );
  }
  if (!a) {
    return (
      <div className="zw-container" style={{ paddingTop: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--c-900)', marginBottom: 14 }}>Appointment not found</div>
        <ZwButton kind="primary" onClick={() => ctx.go('appointments')}>Back to appointments</ZwButton>
      </div>
    );
  }

  const services = (a.services && a.services.length ? a.services : [a.service]).filter(Boolean);
  const cancelled = a.statusTone === 'warning' || a.statusTone === 'error';
  const profile = (window.ZV_BIZ_PROFILES || {})[a.bizId] || {};
  const upcoming = a.tense === 'future' || a.tense === 'today' || a.tense === 'now';
  const showManage = upcoming && !cancelled && (a.policy ? (a.policy.canCancel !== false || a.policy.canReschedule !== false) : true);

  return (
    <div data-screen-label={'Appointment · ' + a.business} className="zw-container" style={{ paddingTop: 22, width: '100%' }}>
      <button className="tap" onClick={() => ctx.go('appointments')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 22, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--c-600)', padding: '4px 0' }}>
        <ZIcon name="back" size={14} color="var(--c-600)"></ZIcon>Appointments
      </button>

      {/* HERO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <ZwApptStampPill a={a}></ZwApptStampPill>
        {a.rel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--c-600)', letterSpacing: '0.02em' }}>{a.rel}</span>}
        <span style={{ flex: 1 }}></span>
        <button className="tap" onClick={() => ctx.go('biz/' + (a.bizId || 'glow-soho'))}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-600)' }}>
          at {a.business}
        </button>
      </div>
      <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: '-0.038em', lineHeight: 1.04, color: cancelled ? 'var(--c-700)' : 'var(--c-900)' }} className="txt-balance">
        {services[0]}
      </h1>
      {services.slice(1).map((s, i) => (
        <div key={i} style={{ fontSize: 'clamp(19px, 2.2vw, 26px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--c-600)', marginTop: 4, lineHeight: 1.15 }}>
          <span style={{ color: 'var(--c-400)', fontWeight: 400 }}>+ </span>{s}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 15, fontWeight: 600, color: 'var(--c-900)' }}>
          <ZIcon name="cal" size={16} color="var(--p-600)"></ZIcon>
          {a.day} {a.date} · {a.time}{a.endTime ? ' – ' + a.endTime : ''}
        </span>
        {(a.durationMin || a.price != null) && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--c-600)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {a.durationMin ? zwFmtDur(a.durationMin) : ''}{a.durationMin && a.price != null ? ' · ' : ''}{a.price != null ? (a.price === 0 ? 'Free' : zwFmtPrice(a.price, a.currency)) : ''}
          </span>
        )}
      </div>
      <ZwApptPendingBanner a={a}></ZwApptPendingBanner>
      <ZwApptLiveStrip a={a}></ZwApptLiveStrip>
      <ZwApptSeriesNote a={a}></ZwApptSeriesNote>

      <div style={{ height: 28 }}></div>
      <div style={{ height: 1, background: 'rgba(28,28,26,0.08)' }}></div>

      {/* BODY */}
      <div data-biz-cols="1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 'clamp(28px, 4vw, 56px)', alignItems: 'start', marginTop: 4 }}>
        <div style={{ minWidth: 0 }}>
          {a.isRemote
            ? <ZwApptSection label="Online access"><ZwApptOnline a={a}></ZwApptOnline></ZwApptSection>
            : <ZwApptSection label="Where"><ZwApptWhere a={a} ctx={ctx}></ZwApptWhere></ZwApptSection>}
          <ZwApptSection label={services.length > 1 ? 'Services' : 'Service'}><ZwApptTreatment a={a}></ZwApptTreatment></ZwApptSection>
          {a.notes && <ZwApptSection label="Your note to the venue"><ZwApptNotes a={a}></ZwApptNotes></ZwApptSection>}
          {a.provider && <ZwApptSection label="With"><ZwApptWith a={a} ctx={ctx}></ZwApptWith></ZwApptSection>}
          {a.review && <ZwApptSection label="Your review"><ZwApptReviewCard a={a}></ZwApptReviewCard></ZwApptSection>}
          {profile.blurb && <ZwApptSection label="About the venue"><ZwApptAbout a={a} ctx={ctx}></ZwApptAbout></ZwApptSection>}

          {/* Closer */}
          {cancelled ? (() => {
            const who = a.cancelledBy === 'business' ? 'the venue' : a.cancelledBy === 'customer' ? 'you' : a.cancelledBy === 'admin' ? 'support' : null;
            const heading = a.statusTone === 'error' ? 'You missed this appointment' : who ? `Cancelled by ${who}` : 'Cancelled';
            const dateLabel = zwFmtStamp(a.cancelledAt);
            let detail = null;
            if (a.cancellationReason) {
              const parts = a.cancellationReason.split('·').map(s => s.trim()).filter(Boolean);
              const tail = parts.length > 1 ? parts.slice(1).join(' · ') : (parts[0] || '');
              if (/refund|no fee|no charge/i.test(tail)) detail = null;
              else if (parts.length > 1) detail = tail;
              else if (!/^cancelled by|^you didn/i.test(tail)) detail = tail;
            }
            return (
              <div style={{ marginTop: 36, paddingTop: 22, borderTop: '1px solid rgba(28,28,26,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 500, color: 'var(--c-800)' }}>
                  <ZIcon name={a.statusTone === 'error' ? 'warn' : 'x'} size={15} color={a.statusTone === 'error' ? 'var(--s-error-600)' : 'var(--s-warning-600)'}></ZIcon>
                  <span>{heading}{dateLabel && <span style={{ color: 'var(--c-500)' }}>, on {dateLabel}</span>}</span>
                </span>
                {detail && <span style={{ maxWidth: 320, fontSize: 13, color: 'var(--c-600)', lineHeight: 1.45 }} className="txt-pretty">{detail.charAt(0).toUpperCase() + detail.slice(1)}</span>}
                {a.cancelledBy === 'business' && a.rebookSuggested && <span style={{ fontSize: 13, color: 'var(--c-600)' }} className="txt-pretty">The venue couldn't make it work — they've invited you to rebook at no charge.</span>}
              </div>
            );
          })() : (() => {
            const bookedLabel = zwFmtStamp(a.bookedAt);
            const src = a.bookingSource === 'marketplace' ? 'via Zavoia' : a.bookingSource === 'direct' ? 'directly with the venue' : a.bookingSource === 'admin' ? 'by support' : 'via Zavoia';
            const bookedLine = bookedLabel ? `Booked ${bookedLabel} · ${src}` : `Booked ${src}`;
            return (
              <div style={{ marginTop: 36, paddingTop: 22, borderTop: '1px solid rgba(28,28,26,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, textAlign: 'center' }}>
                {(a.tense === 'future' || a.tense === 'today') && (a.policy ? a.policy.canCancel !== false : true) && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 500, color: 'var(--c-800)' }}>
                    <ZIcon name="shield" size={15} color="var(--s-success-600)"></ZIcon>
                    Free cancellation up to {(a.policy && a.policy.cancelWindowHours) || 24}h before
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-500)' }}>
                  {bookedLine}{a.refNo ? ` · Ref ${a.refNo}` : ''}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Right rail — one consolidated sticky panel */}
        <div className="zw-only-desktop" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 18px)' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(28,28,26,0.09)', borderRadius: 20, boxShadow: 'var(--sh-md)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--c-shade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ZIcon name="cal" size={18} color="var(--p-600)"></ZIcon>
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>{a.day} {a.date}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--c-600)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{a.time}{a.endTime ? ` – ${a.endTime}` : ''}</div>
                </div>
              </div>
              <ZwApptActions a={a} ctx={ctx}></ZwApptActions>
            </div>
            {showManage && (
              <React.Fragment>
                <div style={{ height: 1, background: 'rgba(28,28,26,0.08)' }}></div>
                <div style={{ padding: 6 }}><ZwApptManage a={a}></ZwApptManage></div>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="zw-only-mobile zv-frost" style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(58px + env(safe-area-inset-bottom))', zIndex: 80, borderTop: '1px solid rgba(28,28,26,0.08)', padding: '10px var(--gutter)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>{a.day} {a.date} · {a.time}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 1 }}>{a.business}</div>
        </div>
        {a.tense === 'past' || cancelled
          ? <ZwButton kind="accent" onClick={() => ctx.openBooking({ bizId: a.bizId })}>Book again</ZwButton>
          : <ZwButton kind="primary" onClick={() => window.zwToast('Opening directions', 'nav')}>Directions</ZwButton>}
      </div>
      <div className="zw-only-mobile" style={{ height: 64 }}></div>
    </div>
  );
}

window.ZW_PAGES.appt = ZwApptDetailPage;
Object.assign(window, { zwFindAppt, zwApptStamp });
