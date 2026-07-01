// Zavoia Web — Booking drawer. Slides in from the right over any page.
// Three steps: Services → Time (pro + date + slot) → Review & confirm,
// then a confirmation state with the check-draw hero from the app.

const { useState: useStateBK, useMemo: useMemoBK, useEffect: useEffectBK } = React;

window.ZW_SESSION_BOOKINGS = window.ZW_SESSION_BOOKINGS || [];

// ── Date helpers (ported from the app's booking flow) ──
const ZW_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ZW_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function zwYmd(d) { return `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`; }
function zwDow(d) { return new Date(d.year, d.month, d.day).getDay(); }
function zwFmtShort(d) { return `${ZW_DOW[zwDow(d)]}, ${ZW_MONTHS[d.month].slice(0, 3)} ${d.day}`; }
function zwFmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${period}`;
}

function zwNextDays(n) {
  const t = window.ZV_TODAY;
  const out = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(t.year, t.month, t.day + i);
    out.push({ year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate(), rel: i });
  }
  return out;
}

// Slots — real dataset where present, deterministic fallback elsewhere
function zwSlotsFor(dateKey) {
  if (window.ZV_SLOTS && window.ZV_SLOTS[dateKey]) {
    return { open: window.ZV_SLOTS[dateKey], sold: (window.ZV_SOLD_SLOTS && window.ZV_SOLD_SLOTS[dateKey]) || [] };
  }
  let h = 0;
  for (const c of dateKey) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const open = [], sold = [];
  for (let m = 9 * 60; m <= 18 * 60; m += 30) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const r = (h = (h * 1103515245 + 12345) % 2147483647) % 10;
    if (r < 5) open.push(t); else if (r < 7) sold.push(t);
  }
  return { open, sold };
}

function zwGroupSlots(open, sold) {
  const all = [...open.map(t => ({ t, sold: false })), ...sold.map(t => ({ t, sold: true }))]
    .sort((a, b) => a.t.localeCompare(b.t));
  const part = { Morning: [], Afternoon: [], Evening: [] };
  all.forEach(s => {
    const h = Number(s.t.split(':')[0]);
    if (h < 12) part.Morning.push(s);
    else if (h < 17) part.Afternoon.push(s);
    else part.Evening.push(s);
  });
  return part;
}

// ── Step header pieces ──
function ZwDrawerStep({ n, total, label }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--p-600)',
      }}>Step {n} of {total}</div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Pro picker ──
function ZwProPicker({ pro, setPro }) {
  const opts = [{ name: 'any', label: 'Any professional' }, ...window.ZV_TEAM.map(m => ({ name: m.name, label: m.name, m }))];
  return (
    <div className="zw-scroll-x" style={{ gap: 10, paddingBottom: 4 }}>
      {opts.map(o => {
        const on = pro === o.name;
        return (
          <button key={o.name} className="tap" onClick={() => setPro(o.name)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    minWidth: 86, flexShrink: 0, cursor: 'pointer', padding: '12px 8px 10px',
                    background: on ? 'var(--c-ink)' : '#fff',
                    border: on ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.10)',
                    borderRadius: 16,
                  }}>
            {o.m ? (
              <img src={o.m.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{
                width: 40, height: 40, borderRadius: '50%',
                background: on ? 'rgba(255,255,255,0.16)' : 'var(--c-mist)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ZIcon name="sparkle" size={17} color={on ? '#fff' : 'var(--c-700)'}></ZIcon>
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.25,
              color: on ? '#fff' : 'var(--c-800)', maxWidth: 84,
            }}>{o.m ? o.label.split(' ')[0] : 'Anyone'}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Day strip ──
function ZwDayStrip({ selected, setSelected }) {
  const days = zwNextDays(14);
  const disabled = window.ZV_DISABLED_DATES || new Set();
  return (
    <div className="zw-scroll-x" style={{ gap: 7, paddingBottom: 4 }}>
      {days.map(d => {
        const key = zwYmd(d);
        const off = disabled.has(key);
        const on = selected && zwYmd(selected) === key;
        return (
          <button key={key} className={'tap' + (on ? ' zv-cal-pop' : '')}
                  disabled={off} onClick={() => setSelected(d)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    width: 56, flexShrink: 0, padding: '10px 0 11px', borderRadius: 14,
                    cursor: off ? 'default' : 'pointer', opacity: off ? 0.35 : 1,
                    background: on ? 'var(--c-ink)' : '#fff',
                    border: on ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.10)',
                  }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: on ? 'rgba(255,255,255,0.75)' : 'var(--c-500)',
            }}>{d.rel === 0 ? 'Today' : ZW_DOW[zwDow(d)]}</span>
            <span style={{
              fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              color: on ? '#fff' : 'var(--c-900)',
            }}>{d.day}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Slot grid ──
function ZwSlotGrid({ dateKey, slot, setSlot }) {
  const { open, sold } = useMemoBK(() => zwSlotsFor(dateKey), [dateKey]);
  const groups = zwGroupSlots(open, sold);
  if (!open.length) {
    return (
      <div style={{ fontSize: 13.5, color: 'var(--c-600)', padding: '14px 2px' }}>
        Fully booked this day — try another date.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(groups).map(([label, slots]) => slots.length > 0 && (
        <div key={label}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)', marginBottom: 9,
          }}>{label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 8 }}>
            {slots.map(s => {
              const on = slot === s.t;
              return (
                <button key={s.t} className={s.sold ? '' : 'tap zv-slot'}
                        disabled={s.sold} onClick={() => setSlot(s.t)}
                        style={{
                          padding: '10px 0', borderRadius: 11, cursor: s.sold ? 'default' : 'pointer',
                          fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600,
                          background: on ? 'var(--c-ink)' : s.sold ? 'var(--c-100)' : '#fff',
                          color: on ? '#fff' : s.sold ? 'var(--c-400)' : 'var(--c-900)',
                          border: on ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.10)',
                          textDecoration: s.sold ? 'line-through' : 'none',
                        }}>{zwFmtTime(s.t)}</button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Trust layer — review-step disclosure, ported from the app's booking
// flow: "Free cancellation" (24h window, day-level label) + pay at venue.
const ZW_DOW_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function zwCancelDeadline(date) {
  const apptDate = new Date(date.year, date.month, date.day);
  const cancelBy = new Date(apptDate.getTime() - 24 * 60 * 60 * 1000);
  return `${ZW_DOW_FULL[cancelBy.getDay()]}, ${ZW_MONTHS[cancelBy.getMonth()]} ${cancelBy.getDate()}`;
}

function ZwTrustCard({ b, date }) {
  const rows = [
    { icon: 'shield', tint: 'var(--s-success-600)', tintBg: 'var(--s-success-100)',
      title: 'Free cancellation',
      sub: `Cancel or reschedule for free until ${zwCancelDeadline(date)}.` },
    { icon: 'wallet', tint: 'var(--s-success-600)', tintBg: 'var(--s-success-100)',
      title: 'Pay at the venue',
      sub: `Nothing to pay now — settle directly with ${b.name} after your visit.` },
  ];
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 18,
      padding: '4px 18px', boxShadow: 'var(--sh-sm)',
    }}>
      {rows.map((r, i) => (
        <div key={r.icon} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
          borderTop: i ? '1px solid rgba(28,28,26,0.06)' : 0,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, background: r.tintBg, flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ZIcon name={r.icon} size={14} color={r.tint}></ZIcon>
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.005em' }}>{r.title}</div>
            <div className="txt-pretty" style={{ fontSize: 12, lineHeight: 1.35, color: 'var(--c-600)', marginTop: 1 }}>{r.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Confirmation hero ──
function ZwConfirmed({ b, pickedItems, pro, date, slot, currency, onClose, ctx }) {
  return (
    <div className="zv-tab-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '32px 28px', gap: 0,
    }}>
      <div className="zv-ring-pulse" style={{
        width: 86, height: 86, borderRadius: '50%', background: 'var(--p-500)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(201,74,42,0.06), 0 14px 36px rgba(201,74,42,0.16)',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="2.6"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="24" strokeDashoffset="24"
                style={{ animation: 'zv-draw-check .5s .25s var(--ease-out) forwards' }} />
        </svg>
      </div>
      <h2 style={{ margin: '26px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>
        You're booked
      </h2>
      <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--c-600)', maxWidth: 320 }} className="txt-pretty">
        {pickedItems.map(i => i.name).join(' + ')} at {b.name}
      </p>
      <div style={{
        marginTop: 22, background: 'var(--c-50)', border: '1px solid rgba(28,28,26,0.08)',
        borderRadius: 16, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 7,
        minWidth: 260,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--c-900)' }}>
          {zwFmtShort(date)} · {zwFmtTime(slot)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--c-600)' }}>
          {pro === 'any' ? 'First available professional' : 'with ' + pro}
        </div>
      </div>
      <div style={{
        marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 12.5, color: 'var(--c-500)',
      }}>
        <ZIcon name="shield" size={13} color="var(--s-success-600)"></ZIcon>
        Cancel or reschedule for free until {zwCancelDeadline(date)}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ZwButton kind="primary" onClick={() => { onClose(); ctx.go('appointments'); }}>View appointment</ZwButton>
        <ZwButton kind="secondary" onClick={() => window.zwToast('Added to your calendar', 'cal')}>Add to calendar</ZwButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────
function ZwBookingDrawer({ ctx, opts, onClose }) {
  const b = window.ZV_BUSINESSES.find(x => x.id === opts.bizId) || window.ZV_BUSINESSES[0];
  const groups = useMemoBK(() => window.zwServiceGroupsFor(b), [b.id]);
  const allItems = useMemoBK(() => groups.flatMap(g => g.items), [groups]);

  const [picked, setPicked] = useStateBK(() => new Set(opts.serviceIds || []));
  const [step, setStep] = useStateBK((opts.serviceIds && opts.serviceIds.length) ? 2 : 1);
  const [pro, setPro] = useStateBK(opts.proName || 'any');
  const [date, setDate] = useStateBK(() => zwNextDays(2)[1]);
  const [slot, setSlot] = useStateBK(null);
  const [confirmed, setConfirmed] = useStateBK(false);
  const [closing, setClosing] = useStateBK(false);

  const pickedItems = allItems.filter(it => picked.has(it.id));
  const total = pickedItems.reduce((a, it) => a + it.price, 0);
  const dur = pickedItems.reduce((a, it) => a + it.dur, 0);

  useEffectBK(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const close = () => { setClosing(true); setTimeout(onClose, 260); };

  const togglePick = (it) => setPicked(prev => {
    const next = new Set(prev);
    if (next.has(it.id)) next.delete(it.id); else next.add(it.id);
    return next;
  });

  const confirm = () => {
    window.ZW_SESSION_BOOKINGS.push({
      id: 'new-' + Date.now(), biz: b, services: pickedItems.map(i => i.name),
      pro, date: { ...date }, slot, total, currency: b.currency,
    });
    setConfirmed(true);
  };

  const canNext = step === 1 ? picked.size > 0 : step === 2 ? !!slot : true;

  return (
    <div className="zv-sheet-backdrop"
         onClick={(e) => { if (e.target === e.currentTarget) close(); }}
         style={{
           position: 'fixed', inset: 0, zIndex: 250,
           background: 'rgba(28,28,26,0.34)',
           backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
           display: 'flex', justifyContent: 'flex-end',
         }}>
      <div className={closing ? 'zw-drawer-out' : 'zw-drawer-in'}
           role="dialog" aria-label={'Book at ' + b.name}
           style={{
             width: 'min(478px, 100vw)', height: '100%', background: 'var(--c-canvas)',
             boxShadow: 'var(--sh-xl)', display: 'flex', flexDirection: 'column',
           }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: '1px solid rgba(28,28,26,0.07)', background: '#fff', flexShrink: 0,
        }}>
          {!confirmed && step > 1 && (
            <button className="tap" onClick={() => setStep(s => s - 1)} aria-label="Back"
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(28,28,26,0.10)',
                      background: '#fff', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
              <ZIcon name="back" size={15} color="var(--c-800)"></ZIcon>
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{b.name}</div>
            {!confirmed && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)', marginTop: 2 }}>
                {b.area || b.city || 'Booking'}
              </div>
            )}
          </div>
          <button className="tap" onClick={close} aria-label="Close booking"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 0, background: 'var(--c-100)',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
            <ZIcon name="x" size={15} color="var(--c-800)"></ZIcon>
          </button>
        </div>

        {confirmed ? (
          <ZwConfirmed b={b} pickedItems={pickedItems} pro={pro} date={date} slot={slot}
                       currency={b.currency} onClose={close} ctx={ctx}></ZwConfirmed>
        ) : (
          <React.Fragment>
            {/* Body */}
            <div className="zw-scroll-y" style={{ flex: 1, padding: '22px 20px 28px' }}>
              {step === 1 && (
                <div className="zv-tab-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <ZwDrawerStep n={1} total={3} label="Choose services"></ZwDrawerStep>
                  {groups.map(g => (
                    <div key={g.cat}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4,
                        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: g.dot }}></span>
                        {g.cat}
                      </div>
                      {g.items.map(it => {
                        const on = picked.has(it.id);
                        return (
                          <button key={it.id} className="tap" onClick={() => togglePick(it)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 13, width: '100%',
                                    textAlign: 'left', cursor: 'pointer', padding: '13px 12px',
                                    background: on ? '#fff' : 'transparent',
                                    border: on ? '1px solid rgba(28,28,26,0.14)' : '1px solid transparent',
                                    borderRadius: 14,
                                    boxShadow: on ? 'var(--sh-sm)' : 'inset 0 -1px 0 rgba(28,28,26,0.05)',
                                  }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                              border: on ? 0 : '1.5px solid rgba(28,28,26,0.25)',
                              background: on ? 'var(--p-500)' : 'transparent',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {on && <ZIcon name="check" size={13} color="#fff"></ZIcon>}
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)' }}>{it.name}</span>
                              <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 3 }}>
                                {window.zwFmtDur(it.dur)} · {window.zwFmtPrice(it.price, b.currency)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="zv-tab-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <ZwDrawerStep n={2} total={3} label="Pick a time"></ZwDrawerStep>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-800)', marginBottom: 10 }}>Professional</div>
                    <ZwProPicker pro={pro} setPro={setPro}></ZwProPicker>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-800)', marginBottom: 10 }}>Date</div>
                    <ZwDayStrip selected={date} setSelected={(d) => { setDate(d); setSlot(null); }}></ZwDayStrip>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-800)', marginBottom: 10 }}>
                      {zwFmtShort(date)}
                    </div>
                    <ZwSlotGrid dateKey={zwYmd(date)} slot={slot} setSlot={setSlot}></ZwSlotGrid>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="zv-tab-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <ZwDrawerStep n={3} total={3} label="Review & confirm"></ZwDrawerStep>
                  <div style={{
                    background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 18,
                    padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 13,
                    boxShadow: 'var(--sh-sm)',
                  }}>
                    {pickedItems.map(it => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)' }}>{it.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 2 }}>{window.zwFmtDur(it.dur)}</div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>
                          {window.zwFmtPrice(it.price, b.currency)}
                        </span>
                      </div>
                    ))}
                    <div style={{
                      borderTop: '1px solid rgba(28,28,26,0.07)', paddingTop: 13,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-700)' }}>Total · {window.zwFmtDur(dur)}</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-900)' }}>{window.zwFmtPrice(total, b.currency)}</span>
                    </div>
                  </div>

                  <div style={{
                    background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 18,
                    padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 11, boxShadow: 'var(--sh-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ZIcon name="cal" size={16} color="var(--p-600)"></ZIcon>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>{zwFmtShort(date)} · {zwFmtTime(slot || '10:00')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ZIcon name="user" size={16} color="var(--p-600)"></ZIcon>
                      <span style={{ fontSize: 14, color: 'var(--c-800)' }}>{pro === 'any' ? 'First available professional' : pro}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ZIcon name="pin" size={16} color="var(--p-600)"></ZIcon>
                      <span style={{ fontSize: 14, color: 'var(--c-800)' }}>{b.name} · {b.city}</span>
                    </div>
                  </div>

                  <ZwTrustCard b={b} date={date}></ZwTrustCard>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div style={{
              padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
              borderTop: '1px solid rgba(28,28,26,0.07)', background: '#fff', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {picked.size > 0 ? (
                  <React.Fragment>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-900)' }}>{window.zwFmtPrice(total, b.currency)}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 1 }}>
                      {picked.size} service{picked.size > 1 ? 's' : ''} · {window.zwFmtDur(dur)}
                    </div>
                  </React.Fragment>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--c-500)' }}>Select at least one service</div>
                )}
              </div>
              {step < 3 ? (
                <ZwButton kind="primary" size="lg" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                  Continue
                  <ZIcon name="arrowR" size={15} color="#fff"></ZIcon>
                </ZwButton>
              ) : (
                <ZwButton kind="accent" size="lg" onClick={confirm}>Confirm booking</ZwButton>
              )}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ZwBookingDrawer, zwYmd, zwFmtShort, zwFmtTime, zwNextDays, ZwDayStrip, ZwSlotGrid });
