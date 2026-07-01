// Zavoia Web — Appointments. Faithful web port of the mobile Schedule:
// receipt/ticket cards (status dot + time range, service title,
// duration·price, dashed perforation + side notches, stub with business
// logo + staff), date-pill timeline rail, status filter chips, and
// collapsible Upcoming / Past sections.
//
// Desktop adaptation: the page fills the standard content width via a
// responsive 2-column grid of timeline rows (date pill + ticket), so it
// sits consistently next to the other full-width pages while keeping the
// app's exact card anatomy and data. Reads the rich ZV_APPOINTMENTS
// shape directly (same source the mobile app uses), merged with any
// in-session bookings, with session overrides (review / reschedule /
// cancel) applied on top.

const { useState: useStateAP, useMemo: useMemoAP } = React;

// ── Format helpers (ported from the app) ──
function zwSchedPrice(v, c = '£') {
  if (v == null) return '';
  const val = Number.isInteger(v) ? v : v.toFixed(2);
  return ['€', 'kr', 'zł', 'Kč', 'Ft'].includes(c) ? `${val} ${c}` : `${c}${val}`;
}
function zwSchedDur(min) {
  if (min == null) return '';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
const ZW_MON_IX = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 };
function zwApptDow(a) {
  const today = window.ZV_TODAY || { year: 2026 };
  const y = a.dateYear ?? today.year, m = ZW_MON_IX[a.dateMon] ?? 0, d = a.dateDay ?? 1;
  return new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}
function zwApptNow() {
  const t = window.ZV_TODAY || { year: 2026, month: 4, day: 18 };
  return new Date(t.year, t.month, t.day, 11, 15);
}
function zwApptStart(a) {
  const today = window.ZV_TODAY || { year: 2026, month: 4, day: 18 };
  const m = ZW_MON_IX[a.dateMon] ?? today.month;
  const [hh, mm] = (a.startTime || '00:00').split(':').map(Number);
  let y = a.dateYear ?? today.year;
  return new Date(y, m, a.dateDay, hh || 0, mm || 0);
}

// Time-until pill text — Live / in 6h / Tomorrow / in 4 days
function zwTimeUntil(a) {
  if (a.tense === 'now')      return { label: 'Live', kind: 'live' };
  if (a.status === 'pending') return { label: 'Awaiting', kind: 'pending' };
  if (a.status !== 'confirmed') return null;
  const diff = Math.round((zwApptStart(a) - zwApptNow()) / 60000);
  const pl = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  if (diff <= 0) return { label: 'Starting', kind: 'soon' };
  if (diff < 60) return { label: `in ${diff}m`, kind: 'soon' };
  if (diff < 1440) return { label: `in ${Math.floor(diff / 60)}h`, kind: 'today' };
  const days = Math.floor(diff / 1440);
  if (days === 1) return { label: 'Tomorrow', kind: 'future' };
  if (days < 7) return { label: `in ${pl(days, 'day', 'days')}`, kind: 'future' };
  if (days < 30) return { label: `in ${pl(Math.floor(days / 7), 'week', 'weeks')}`, kind: 'future' };
  return { label: `in ${pl(Math.floor(days / 30), 'month', 'months')}`, kind: 'future' };
}

const ZW_STATUS_COLOR = {
  confirmed: 'var(--s-info-600)',
  pending:   'var(--c-900)',
  completed: 'var(--s-success-600)',
  cancelled: 'var(--s-warning-600)',
  no_show:   'var(--s-error-600)',
};

function zwServicesLine(a) {
  if (a.bookingType === 'bundle' && a.bundleName) return a.bundleName;
  const s = a.services || [];
  if (s.length === 0) return a.service || '';
  if (s.length === 1) return s[0].name || s[0];
  if (s.length === 2) return `${s[0].name || s[0]} + ${s[1].name || s[1]}`;
  return `${s[0].name || s[0]} + ${s.length - 1} more`;
}

function zwStampFor(a) {
  if (a.status === 'cancelled') return { label: 'Cancelled', color: 'var(--s-warning-600)' };
  if (a.status === 'no_show')   return { label: 'No-show',   color: 'var(--s-error-600)' };
  if (a.status === 'pending')   return { label: 'Pending',   color: 'var(--c-900)' };
  if (a.tense === 'now')        return { label: 'Live', color: 'var(--s-success-600)', pulse: true };
  return null;
}

// ── Rich model + overrides ──
// Build the rich card model from a ZV_APPOINTMENTS entry, applying any
// in-session review / reschedule / cancel the user made this session.
function zwRichModel(a) {
  const out = { ...a };
  const rev = (window.ZW_SESSION_REVIEWS || {})[a.uuid];
  const res = (window.ZW_RESCHEDULED || {})[a.uuid];
  const can = (window.ZW_CANCELLED || {})[a.uuid];
  if (rev) { out.review = rev; out.reviewable = false; }
  if (res) {
    // res.date like "May 19" → MON + day
    const parts = (res.date || '').split(' ');
    if (parts.length === 2) { out.dateMon = parts[0].slice(0, 3).toUpperCase(); out.dateDay = parseInt(parts[1], 10); }
    if (res.time) out.startTime = res.time;
    out.endTime = null;
  }
  if (can) { out.status = 'cancelled'; out.tense = 'past'; out.cancelledBy = 'customer'; }
  return out;
}

// Convert an in-session booking into the rich card model.
function zwSessionToRich(s) {
  const d = s.date instanceof Date ? s.date : new Date();
  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return {
    uuid: s.id,
    status: 'confirmed', tense: 'future',
    dateYear: d.getFullYear(), dateMon: MON[d.getMonth()], dateDay: d.getDate(),
    startTime: window.zwFmtTime ? window.zwFmtTime(s.slot) : '',
    endTime: null, durationMin: s.durationMin || null,
    totalPrice: s.total, currency: s.currency || '£',
    bookingType: (s.services && s.services.length > 1) ? 'multi' : 'single',
    services: (s.services || []).map(n => ({ name: n })),
    business: { id: s.biz.id, name: s.biz.name, logo: s.biz.photo },
    staff: (s.pro && s.pro !== 'any') ? { name: s.pro } : null,
    policy: { canCancel: true, canReschedule: true, cancelWindowHours: 24 },
    reviewable: false,
    __session: true,
  };
}

// ─────────────────────────────────────────────
// Status dot
// ─────────────────────────────────────────────
function ZwSchedDot({ status }) {
  return <span aria-hidden="true" style={{
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: ZW_STATUS_COLOR[status] || ZW_STATUS_COLOR.confirmed,
  }}></span>;
}

// ─────────────────────────────────────────────
// Date pill — terracotta today, ink upcoming, white past
// ─────────────────────────────────────────────
function ZwDatePill({ dow, mon, day, tense = 'future' }) {
  const isToday = tense === 'now' || tense === 'today';
  const isPast = tense === 'past';
  const pal = isToday
    ? { bg: 'var(--p-500)', fg: '#fff', sub: 'rgba(255,255,255,0.80)', border: 'none', shadow: '0 6px 18px rgba(201,74,42,0.22), 0 1px 2px rgba(28,28,26,0.06)' }
    : isPast
    ? { bg: '#fff', fg: 'var(--c-700)', sub: 'var(--c-500)', border: '1px solid rgba(28,28,26,0.10)', shadow: 'none' }
    : { bg: 'var(--c-ink)', fg: '#fff', sub: 'rgba(255,255,255,0.65)', border: 'none', shadow: '0 1px 2px rgba(28,28,26,0.06)' };
  return (
    <div style={{
      width: 50, height: 64, borderRadius: 13, flexShrink: 0,
      background: pal.bg, color: pal.fg, border: pal.border, boxShadow: pal.shadow,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: pal.sub, lineHeight: 1 }}>{dow}</span>
      <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{day}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: pal.sub, lineHeight: 1, marginTop: 3 }}>{mon}</span>
    </div>
  );
}

// ── Right-hand time-until chip ──
function ZwSchedChip({ a }) {
  const tu = zwTimeUntil(a);
  if (!tu) return null;
  const pal = tu.kind === 'live'
    ? { bg: 'color-mix(in oklch, var(--s-success-600) 12%, #fff)', fg: 'var(--s-success-600)' }
    : tu.kind === 'pending'
    ? { bg: 'color-mix(in oklch, var(--c-900) 8%, #fff)', fg: 'var(--c-900)' }
    : { bg: 'var(--c-100)', fg: 'var(--c-700)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 10px',
      borderRadius: 999, background: pal.bg, color: pal.fg, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {tu.kind === 'live' && (
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'currentColor', animation: 'zv-pulse 1.6s ease-out infinite' }}></span>
        </span>
      )}
      {tu.label}
    </span>
  );
}

// ── Ticket stamp (rotated dashed) ──
function ZwTicketStamp({ stamp }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px',
      border: `1.5px dashed ${stamp.color}`, borderRadius: 4, background: '#fff',
      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: stamp.color, transform: 'rotate(-2deg)', lineHeight: 1,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {stamp.pulse && (
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'currentColor', animation: 'zv-pulse 1.6s ease-out infinite' }}></span>
        </span>
      )}
      {stamp.label}
    </div>
  );
}

// ─────────────────────────────────────────────
// Receipt / ticket card — faithful port of ZvAppointmentCardSlim
// ─────────────────────────────────────────────
function ZwTicketCard({ a, ctx }) {
  const isCancelled = a.status === 'cancelled' || a.status === 'no_show';
  const title = zwServicesLine(a);
  const stamp = zwStampFor(a);
  const hasTime = !!a.startTime;
  const staff = a.staff && a.staff.name && !a.staff.any && (a.staff.name.toLowerCase() !== 'any') ? a.staff : null;
  const perfY = 104;

  return (
    <div role="button" tabIndex={0} className="tap zw-hover-lift"
         onClick={() => ctx.go('appt/' + a.uuid)}
         onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('appt/' + a.uuid); }}
         style={{
           position: 'relative', flex: 1, minWidth: 0,
           background: isCancelled ? 'var(--c-100)' : '#fff',
           border: '1px solid rgba(28,28,26,0.07)', borderRadius: 16,
           boxShadow: 'var(--sh-sm)', cursor: 'pointer', overflow: 'visible',
         }}>
      {/* TOP — when + what */}
      <div style={{ padding: '15px 18px' }}>
        {(hasTime || stamp || a.status === 'confirmed') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
              <ZwSchedDot status={a.status}></ZwSchedDot>
              {hasTime && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600,
                  color: isCancelled ? 'var(--c-500)' : 'var(--c-900)', letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>{a.startTime}{a.endTime ? ` – ${a.endTime}` : ''}</span>
              )}
            </div>
            {stamp ? <ZwTicketStamp stamp={stamp}></ZwTicketStamp>
              : a.status === 'confirmed' ? <ZwSchedChip a={a}></ZwSchedChip> : null}
          </div>
        )}

        <div style={{
          marginTop: 9, fontSize: 18, fontWeight: 600, letterSpacing: '-0.022em', lineHeight: 1.22,
          color: isCancelled ? 'var(--c-600)' : 'var(--c-900)',
        }}>{title}</div>

        <div style={{
          marginTop: 7, display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--c-600)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {a.durationMin != null && <React.Fragment><ZIcon name="clock" size={12} color="var(--c-500)"></ZIcon><span>{zwSchedDur(a.durationMin)}</span></React.Fragment>}
          {a.totalPrice != null && (
            <React.Fragment>
              {a.durationMin != null && <span style={{ color: 'var(--c-400)' }}>·</span>}
              <span>{a.totalPrice === 0 ? 'Free' : zwSchedPrice(a.totalPrice, a.currency)}</span>
            </React.Fragment>
          )}
          {a.recurring && (
            <React.Fragment>
              <span style={{ color: 'var(--c-400)' }}>·</span>
              <span>{a.recurring.index}/{a.recurring.total}</span>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* PERFORATION */}
      <div aria-hidden="true" style={{
        height: 1, margin: '0 14px',
        backgroundImage: 'radial-gradient(circle, rgba(28,28,26,0.22) 0.7px, transparent 0.7px)',
        backgroundSize: '6px 1px', backgroundRepeat: 'repeat-x', backgroundPosition: 'left center',
      }}></div>
      <span aria-hidden="true" style={{
        position: 'absolute', left: -9, top: perfY - 9, width: 18, height: 18, borderRadius: '50%',
        background: 'var(--c-canvas)', border: '1px solid rgba(28,28,26,0.10)', clipPath: 'inset(0 0 0 50%)',
      }}></span>
      <span aria-hidden="true" style={{
        position: 'absolute', right: -9, top: perfY - 9, width: 18, height: 18, borderRadius: '50%',
        background: 'var(--c-canvas)', border: '1px solid rgba(28,28,26,0.10)', clipPath: 'inset(0 50% 0 0)',
      }}></span>

      {/* STUB — who */}
      <div style={{ padding: '13px 18px 15px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 9, background: 'var(--c-200)',
          border: '1px solid rgba(28,28,26,0.07)', overflow: 'hidden', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {a.business && a.business.logo
            ? <img src={a.business.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-700)' }}>{((a.business && a.business.name) || '?').trim()[0]}</span>}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: 'var(--c-800)', letterSpacing: '-0.012em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', lineHeight: 1.2,
          }}>{a.business && a.business.name}</span>
        </div>
        {staff && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ZAvatar src={staff.photo} name={staff.name} size={22}></ZAvatar>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-700)', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name.split(' ')[0]}</span>
          </span>
        )}
        {a.reviewable && !staff && (
          <button className="tap" onClick={(e) => { e.stopPropagation(); window.zwOpenReview(a.uuid); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--p-700)', flexShrink: 0 }}>
            <ZIcon name="star" size={13} color="var(--p-600)"></ZIcon>Review
          </button>
        )}
        <ZIcon name="chevR" size={14} color="var(--c-400)" style={{ flexShrink: 0 }}></ZIcon>
      </div>
    </div>
  );
}

// ── Timeline row: date pill + ticket ──
function ZwTimelineRow({ a, ctx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, minWidth: 0 }}>
      <div style={{ paddingTop: 4 }}>
        <ZwDatePill dow={zwApptDow(a)} mon={a.dateMon} day={a.dateDay} tense={a.tense}></ZwDatePill>
      </div>
      <ZwTicketCard a={a} ctx={ctx}></ZwTicketCard>
    </div>
  );
}

// ── Section header (accordion) ──
function ZwSchedSection({ label, count, open, onToggle }) {
  return (
    <button className="tap" onClick={onToggle} aria-expanded={open}
            style={{
              width: '100%', boxSizing: 'border-box', cursor: 'pointer', background: 'transparent', border: 0,
              padding: '6px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.026em', color: 'var(--c-900)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--c-500)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      </span>
      <ZIcon name={open ? 'chevU' : 'chevD'} size={16} color="var(--c-600)"></ZIcon>
    </button>
  );
}

// ── Filter chips with mono counts ──
function ZwSchedFilters({ value, onChange, counts }) {
  const all = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no_show', label: 'No-show' },
  ];
  const tabs = all.filter(t => t.id === 'all' || (counts[t.id] ?? 0) > 0);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24, marginBottom: 28 }}>
      {tabs.map(t => {
        const active = t.id === value;
        return (
          <button key={t.id} className="tap" onClick={() => onChange(t.id)} aria-pressed={active}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 15px',
                    borderRadius: 999, cursor: 'pointer',
                    background: active ? 'var(--c-ink)' : '#fff',
                    color: active ? '#fff' : 'var(--c-700)',
                    border: '1px solid ' + (active ? 'transparent' : 'rgba(28,28,26,0.12)'),
                    fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em',
                    transition: 'background-color .2s var(--ease-soft), color .2s var(--ease-soft)',
                  }}>
            {t.label}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.6)' : 'var(--c-500)', fontVariantNumeric: 'tabular-nums' }}>{counts[t.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Year separator — full-width row when the past list crosses a year ──
function ZwYearSep({ year }) {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 2px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--c-500)', fontVariantNumeric: 'tabular-nums' }}>{year}</span>
      <span aria-hidden="true" style={{ flex: 1, height: 1, background: 'rgba(28,28,26,0.08)' }}></span>
    </div>
  );
}

// ── Grid of timeline rows (optionally with year separators) ──
function ZwSchedGrid({ items, ctx, withYears }) {
  const today = window.ZV_TODAY || { year: 2026 };
  const nodes = [];
  let lastYear = today.year;
  items.forEach((a, i) => {
    if (withYears) {
      const y = a.dateYear ?? today.year;
      if (y !== lastYear) { nodes.push(<ZwYearSep key={'sep-' + y + '-' + i} year={y}></ZwYearSep>); lastYear = y; }
    }
    nodes.push(<ZwTimelineRow key={a.uuid} a={a} ctx={ctx}></ZwTimelineRow>);
  });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 18, paddingBottom: 8 }}>
      {nodes}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
function ZwAppointmentsPage({ ctx }) {
  window.zwUseApptsVersion();
  const [filter, setFilter] = useStateAP('all');
  const [upcomingOpen, setUpcomingOpen] = useStateAP(true);
  const [pastOpen, setPastOpen] = useStateAP(true);

  const isNew = ctx.userState === 'new';
  const session = (window.ZW_SESSION_BOOKINGS || []).map(zwSessionToRich);

  // Logged-out + nothing booked in session → gate.
  if (isNew && session.length === 0) {
    return (
      <ZwSignedOutGate ctx={ctx} icon="cal"
        title="Keep every booking in one place."
        body="Sign in to see your upcoming and past appointments, with reminders, reschedules and directions."
        secondaryLabel="Explore places" onSecondary={() => ctx.go('search')}></ZwSignedOutGate>
    );
  }

  const all = (isNew ? [] : (window.ZV_APPOINTMENTS || []).map(zwRichModel));
  const merged = [...session, ...all];

  const counts = useMemoAP(() => {
    const c = { all: merged.length, upcoming: 0, past: 0, cancelled: 0, no_show: 0 };
    for (const a of merged) {
      if (['pending', 'confirmed'].includes(a.status)) c.upcoming++;
      else if (a.status === 'completed') c.past++;
      else if (a.status === 'cancelled') c.cancelled++;
      else if (a.status === 'no_show') c.no_show++;
    }
    return c;
  }, [merged.length]);

  const filtered = useMemoAP(() => {
    if (filter === 'upcoming')  return merged.filter(a => ['pending', 'confirmed'].includes(a.status));
    if (filter === 'past')      return merged.filter(a => a.status === 'completed');
    if (filter === 'cancelled') return merged.filter(a => a.status === 'cancelled');
    if (filter === 'no_show')   return merged.filter(a => a.status === 'no_show');
    return merged;
  }, [merged.length, filter]);

  const { upcoming, finished } = useMemoAP(() => {
    const up = filtered.filter(a => ['pending', 'confirmed'].includes(a.status));
    const fi = filtered.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));
    const tense = { now: 0, today: 1, future: 2 };
    up.sort((x, y) => (tense[x.tense] ?? 9) - (tense[y.tense] ?? 9));
    const today = window.ZV_TODAY || { year: 2026 };
    const key = (a) => (a.dateYear ?? today.year) * 10000 + (ZW_MON_IX[a.dateMon] ?? 0) * 100 + (a.dateDay ?? 1);
    fi.sort((x, y) => key(y) - key(x));
    return { upcoming: up, finished: fi };
  }, [filtered]);

  const showUpcoming = filter === 'all' || filter === 'upcoming';
  const showFinished = filter === 'all' || filter === 'past' || filter === 'cancelled' || filter === 'no_show';
  const finishedLabel = filter === 'cancelled' ? 'Cancelled' : filter === 'no_show' ? 'No-show' : filter === 'past' ? 'Completed' : 'Past';

  const monthLabel = (() => {
    const t = window.ZV_TODAY || { year: 2026, month: 4 };
    return new Date(t.year, t.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  })();

  return (
    <div data-screen-label="Appointments" className="zw-container" style={{ paddingTop: 44, width: '100%' }}>
      <ZwKicker style={{ marginBottom: 10 }}>Your bookings</ZwKicker>
      <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600, letterSpacing: '-0.035em', color: 'var(--c-900)' }}>Appointments</h1>
      <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--c-500)' }}>
        {monthLabel} · {counts.upcoming} UPCOMING · {counts.past + counts.cancelled + counts.no_show} PAST
      </div>

      <ZwSchedFilters value={filter} onChange={setFilter} counts={counts}></ZwSchedFilters>

      {merged.length === 0 ? (
        <ZwSchedEmpty ctx={ctx}></ZwSchedEmpty>
      ) : (
        <React.Fragment>
          {showUpcoming && (
            <section style={{ marginBottom: 14 }}>
              <ZwSchedSection label="Upcoming" count={upcoming.length} open={upcomingOpen} onToggle={() => setUpcomingOpen(o => !o)}></ZwSchedSection>
              {upcomingOpen && (upcoming.length === 0
                ? <ZwSchedNote>Nothing coming up yet — your next visit will show here.</ZwSchedNote>
                : <ZwSchedGrid items={upcoming} ctx={ctx}></ZwSchedGrid>)}
            </section>
          )}
          {showFinished && (
            <section style={{ marginTop: showUpcoming ? 18 : 0, paddingTop: showUpcoming ? 18 : 0, borderTop: showUpcoming ? '1px solid rgba(28,28,26,0.07)' : 'none' }}>
              <ZwSchedSection label={finishedLabel} count={finished.length} open={pastOpen} onToggle={() => setPastOpen(o => !o)}></ZwSchedSection>
              {pastOpen && (finished.length === 0
                ? <ZwSchedNote>{filter === 'cancelled' ? 'No cancellations — a clean record.' : filter === 'no_show' ? 'No missed visits. Nice.' : 'Your completed visits will show here once you’ve had your first.'}</ZwSchedNote>
                : <ZwSchedGrid items={finished} ctx={ctx} withYears={true}></ZwSchedGrid>)}
            </section>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

function ZwSchedNote({ children }) {
  return (
    <div style={{
      padding: '20px 18px', background: '#fff', border: '1px dashed rgba(28,28,26,0.14)',
      borderRadius: 14, fontSize: 13.5, color: 'var(--c-600)', lineHeight: 1.5, maxWidth: 520,
    }}>{children}</div>
  );
}

function ZwSchedEmpty({ ctx }) {
  return (
    <div style={{
      background: '#fff', border: '1px dashed rgba(28,28,26,0.16)', borderRadius: 22,
      padding: '64px 28px', textAlign: 'center', maxWidth: 560, margin: '0 auto',
    }}>
      <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-shade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <ZIcon name="cal" size={24} color="var(--c-600)"></ZIcon>
      </span>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)', marginBottom: 8 }}>An empty schedule, for now.</div>
      <p className="txt-pretty" style={{ margin: '0 auto 24px', fontSize: 14.5, lineHeight: 1.55, color: 'var(--c-600)', maxWidth: 360 }}>
        Your visits show up here — the date, the place, and everything you need to walk in.
      </p>
      <ZwButton kind="accent" size="lg" onClick={() => ctx.go('search')}>Explore places near you</ZwButton>
    </div>
  );
}

window.ZW_PAGES.appointments = ZwAppointmentsPage;
