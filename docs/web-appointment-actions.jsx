// Zavoia Web — appointment action modals: review, reschedule, cancel.
//
// A single host (<ZwApptActionHost/>, mounted once in the shell)
// registers window.zwOpenReview / zwOpenReschedule / zwOpenCancel and
// renders the matching modal. Actions write to the session-state stores
// (ZW_SESSION_REVIEWS / ZW_RESCHEDULED / ZW_CANCELLED) and fire
// zwApptsChanged() so the list + detail reflect them immediately.

const { useState: useStateAA, useEffect: useEffectAA, useMemo: useMemoAA } = React;

// ─────────────────────────────────────────────
// Generic modal shell — centered card, backdrop, ESC, scale-in
// ─────────────────────────────────────────────
function ZwModal({ title, sub, onClose, children, footer, width = 480 }) {
  const [closing, setClosing] = useStateAA(false);
  const close = () => { setClosing(true); setTimeout(onClose, 220); };
  useEffectAA(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="zv-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}
         style={{
           position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(28,28,26,0.34)',
           backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
           display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
         }}>
      <div className={closing ? 'zw-modal-out' : 'zw-modal-in'} role="dialog" aria-label={title}
           style={{
             width: 'min(' + width + 'px, 100%)', maxHeight: 'calc(100vh - 40px)',
             background: 'var(--c-canvas)', borderRadius: 24, boxShadow: 'var(--sh-xl)',
             display: 'flex', flexDirection: 'column', overflow: 'hidden',
           }}>
        {/* Header */}
        <div style={{
          padding: '20px 22px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
          borderBottom: '1px solid rgba(28,28,26,0.07)', background: '#fff', flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>{title}</div>
            {sub && <div className="txt-pretty" style={{ fontSize: 13.5, color: 'var(--c-600)', marginTop: 4, lineHeight: 1.45 }}>{sub}</div>}
          </div>
          <button className="tap" onClick={close} aria-label="Close"
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: 0, background: 'var(--c-100)',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
            <ZIcon name="x" size={15} color="var(--c-800)"></ZIcon>
          </button>
        </div>
        {/* Body */}
        <div className="zw-scroll-y" style={{ flex: 1, minHeight: 0, padding: '20px 22px' }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid rgba(28,28,26,0.07)', background: '#fff',
            display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// A compact venue/service header used inside the modals.
function ZwApptMini({ a }) {
  const service = a.bookingType === 'bundle' ? (a.bundleName || a.service)
    : (a.services && a.services.length > 1 ? `${a.services[0]} + ${a.services.length - 1} more` : (a.service || (a.services && a.services[0])));
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13, background: '#fff',
      border: '1px solid rgba(28,28,26,0.08)', borderRadius: 14, padding: '12px 14px',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 11, overflow: 'hidden', background: 'var(--c-300)', flexShrink: 0 }}>
        <ZImg src={a.photo} alt={a.business} label={a.cat} style={{ width: '100%', height: '100%' }}></ZImg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service}</div>
        <div style={{ fontSize: 13, color: 'var(--c-600)', marginTop: 2 }}>{a.business}{a.provider ? ' · ' + a.provider : ''}</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// REVIEW
// ═════════════════════════════════════════════
function ZwReviewModal({ a, onClose }) {
  const existing = a.review || {};
  const [rating, setRating] = useStateAA(existing.rating || 0);
  const [hover, setHover] = useStateAA(0);
  const [comment, setComment] = useStateAA(existing.comment || '');
  const ready = rating > 0;

  const submit = () => {
    if (!ready) return;
    window.ZW_SESSION_REVIEWS[a.id] = { rating, comment: comment.trim() };
    window.zwApptsChanged();
    window.zwToast(existing.rating ? 'Review updated' : 'Thanks for your review', 'star');
    onClose();
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Exceptional'];
  const shown = hover || rating;

  return (
    <ZwModal title={existing.rating ? 'Edit your review' : 'How was it?'}
             sub={`Your visit to ${a.business}`} onClose={onClose}
             footer={
               <React.Fragment>
                 <span style={{ flex: 1, fontSize: 12.5, color: 'var(--c-500)' }}>Reviews are public and tied to your visit.</span>
                 <ZwButton kind="accent" size="lg" disabled={!ready} onClick={submit}>
                   {existing.rating ? 'Update review' : 'Post review'}
                 </ZwButton>
               </React.Fragment>
             }>
      <ZwApptMini a={a}></ZwApptMini>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6 }} onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className="tap" aria-label={n + ' stars'}
                    onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}
                    style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 2, lineHeight: 0 }}>
              <ZIcon name={n <= shown ? 'star' : 'starO'} size={38}
                     color={n <= shown ? 'var(--p-500)' : 'var(--c-300)'}></ZIcon>
            </button>
          ))}
        </div>
        <div style={{ height: 18, fontSize: 13.5, fontWeight: 600, color: 'var(--c-700)', letterSpacing: '-0.01em' }}>
          {labels[shown] || 'Tap to rate'}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)', marginBottom: 8 }}>
          Add a note (optional)
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
                  placeholder="What stood out — the result, the welcome, the space?"
                  style={{
                    width: '100%', resize: 'vertical', minHeight: 96, border: '1px solid rgba(28,28,26,0.12)',
                    borderRadius: 14, padding: '12px 14px', fontSize: 14, lineHeight: 1.5,
                    background: '#fff', color: 'var(--c-900)', outline: 'none', fontFamily: 'inherit',
                  }} />
      </div>
    </ZwModal>
  );
}

// ═════════════════════════════════════════════
// RESCHEDULE
// ═════════════════════════════════════════════
function zwRelLabel(d) {
  const t = window.ZV_TODAY;
  const dt = new Date(d.year, d.month, d.day);
  const days = Math.round((dt - new Date(t.year, t.month, t.day)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return 'In ' + days + ' days';
  return 'In ' + Math.round(days / 7) + ' weeks';
}

function ZwRescheduleModal({ a, onClose }) {
  const DayStrip = window.ZwDayStrip;
  const SlotGrid = window.ZwSlotGrid;
  const [date, setDate] = useStateAA(() => window.zwNextDays(2)[1]);
  const [slot, setSlot] = useStateAA(null);
  const ready = !!slot;
  const win = (a.policy && a.policy.rescheduleWindowHours) || (a.policy && a.policy.cancelWindowHours) || 24;

  const confirm = () => {
    if (!ready) return;
    const short = window.zwFmtShort(date); // "Mon, May 19"
    const [day, rest] = short.split(', ');
    window.ZW_RESCHEDULED[a.id] = {
      day, date: rest, time: window.zwFmtTime(slot), rel: zwRelLabel(date),
    };
    window.zwApptsChanged();
    window.zwToast('Rescheduled to ' + short + ' · ' + window.zwFmtTime(slot), 'cal');
    onClose();
  };

  return (
    <ZwModal title="Reschedule" sub={`Pick a new time at ${a.business}`} onClose={onClose} width={520}
             footer={
               <React.Fragment>
                 <div style={{ flex: 1, minWidth: 0 }}>
                   {ready ? (
                     <React.Fragment>
                       <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-900)' }}>{window.zwFmtShort(date)} · {window.zwFmtTime(slot)}</div>
                       <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 1 }}>New time</div>
                     </React.Fragment>
                   ) : (
                     <span style={{ fontSize: 13, color: 'var(--c-500)' }}>Pick a slot to continue</span>
                   )}
                 </div>
                 <ZwButton kind="primary" size="lg" disabled={!ready} onClick={confirm}>Confirm new time</ZwButton>
               </React.Fragment>
             }>
      <ZwApptMini a={a}></ZwApptMini>

      <div style={{
        marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 12.5, color: 'var(--c-600)', background: 'var(--c-50)',
        border: '1px solid rgba(28,28,26,0.07)', borderRadius: 999, padding: '7px 13px',
      }}>
        <ZIcon name="clock" size={13} color="var(--c-500)"></ZIcon>
        Currently {a.day} {a.date} · {a.time} — free to move up to {win}h before
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-800)', marginBottom: 10 }}>Date</div>
        {DayStrip ? <DayStrip selected={date} setSelected={(d) => { setDate(d); setSlot(null); }}></DayStrip> : null}
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-800)', marginBottom: 10 }}>{window.zwFmtShort(date)}</div>
        {SlotGrid ? <SlotGrid dateKey={window.zwYmd(date)} slot={slot} setSlot={setSlot}></SlotGrid> : null}
      </div>
    </ZwModal>
  );
}

// ═════════════════════════════════════════════
// CANCEL
// ═════════════════════════════════════════════
function ZwCancelModal({ a, onClose }) {
  const win = (a.policy && a.policy.cancelWindowHours) || 24;
  const confirm = () => {
    window.ZW_CANCELLED[a.id] = true;
    window.zwApptsChanged();
    window.zwToast('Appointment cancelled', 'check');
    onClose();
  };
  return (
    <ZwModal title="Cancel this appointment?" onClose={onClose} width={440}
             footer={
               <React.Fragment>
                 <ZwButton kind="secondary" size="lg" onClick={onClose} style={{ flex: 1 }}>Keep it</ZwButton>
                 <ZwButton kind="accent" size="lg" onClick={confirm} style={{ flex: 1, background: 'var(--s-error-600)' }}>Cancel booking</ZwButton>
               </React.Fragment>
             }>
      <ZwApptMini a={a}></ZwApptMini>
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, lineHeight: 1.55, color: 'var(--c-700)' }} className="txt-pretty">
        <ZIcon name="shield" size={18} color="var(--s-success-600)" style={{ flexShrink: 0, marginTop: 1 }}></ZIcon>
        <span>You're within the free window — cancelling now costs nothing. After {win}h before your slot, the venue's cancellation fee may apply.</span>
      </div>
    </ZwModal>
  );
}

// ═════════════════════════════════════════════
// HOST — registers the global openers
// ═════════════════════════════════════════════
function ZwApptActionHost() {
  const [state, setState] = useStateAA(null); // { kind, id }
  useEffectAA(() => {
    window.zwOpenReview     = (id) => setState({ kind: 'review', id });
    window.zwOpenReschedule = (id) => setState({ kind: 'reschedule', id });
    window.zwOpenCancel     = (id) => setState({ kind: 'cancel', id });
  }, []);
  if (!state) return null;
  const a = window.zwFindAppt ? window.zwFindAppt(state.id) : (window.ZV_RECENT_APPTS || []).find(x => x.id === state.id);
  if (!a) return null;
  const close = () => setState(null);
  if (state.kind === 'review') return <ZwReviewModal a={a} onClose={close}></ZwReviewModal>;
  if (state.kind === 'reschedule') return <ZwRescheduleModal a={a} onClose={close}></ZwRescheduleModal>;
  if (state.kind === 'cancel') return <ZwCancelModal a={a} onClose={close}></ZwCancelModal>;
  return null;
}

Object.assign(window, { ZwApptActionHost });
