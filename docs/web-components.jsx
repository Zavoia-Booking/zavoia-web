// Zavoia Web — shared atoms + cards. Web variants of the mobile vocabulary:
// same anatomy (photo, cat chip, name, rating, meta), plus hover lift/zoom.

const { useState: useStateWC } = React;

// Page registry — initialised here because this file loads before any page.
window.ZW_PAGES = window.ZW_PAGES || {};

// ──────────────────────────────────────────
// Appointment session-state — reviews left, reschedules and
// cancellations made this session. Static seed data stays intact;
// these overrides are layered on top by zwApplyApptOverrides so the
// list + detail reflect actions immediately (and survive nav).
// ──────────────────────────────────────────
window.ZW_SESSION_REVIEWS  = window.ZW_SESSION_REVIEWS  || {};
window.ZW_RESCHEDULED      = window.ZW_RESCHEDULED      || {};
window.ZW_CANCELLED        = window.ZW_CANCELLED        || {};

window.zwApplyApptOverrides = function (a) {
  if (!a) return a;
  const rev = window.ZW_SESSION_REVIEWS[a.id];
  const res = window.ZW_RESCHEDULED[a.id];
  const can = window.ZW_CANCELLED[a.id];
  if (!rev && !res && !can) return a;
  const out = { ...a };
  if (res) { out.day = res.day; out.date = res.date; out.time = res.time; out.endTime = res.endTime || out.endTime; out.rel = res.rel || out.rel; out.rescheduled = true; }
  if (rev) { out.review = rev; out.reviewable = false; }
  if (can) {
    out.status = 'Cancelled'; out.statusTone = 'warning'; out.tense = 'past';
    out.cancellationReason = 'Cancelled by you'; out.cancelledBy = 'customer';
    out.policy = { canCancel: false, canReschedule: false };
  }
  return out;
};

// Bump on any appt action so subscribed pages re-render.
window.zwApptsChanged = function () { window.dispatchEvent(new CustomEvent('zw-appts-changed')); };

// Hook: re-render when appointment session-state changes.
function zwUseApptsVersion() {
  const [, set] = React.useState(0);
  React.useEffect(() => {
    const fn = () => set(v => v + 1);
    window.addEventListener('zw-appts-changed', fn);
    return () => window.removeEventListener('zw-appts-changed', fn);
  }, []);
}
window.zwUseApptsVersion = zwUseApptsVersion;

// ──────────────────────────────────────────
// Small atoms (ported from mobile business-card.jsx)
// ──────────────────────────────────────────
function ZwCatDot({ cat, size = 6, ring = false }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: `var(--cat-${cat})`, display: 'inline-block', flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px var(--c-canvas)` : 'none',
    }}></span>
  );
}

function ZwRating({ rating, reviews, size = 13, color = 'var(--c-900)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: size, color, fontWeight: 600, letterSpacing: '-0.005em',
    }}>
      <ZIcon name="star" size={size - 1} color="var(--p-500)"></ZIcon>
      <span style={{ fontFeatureSettings: '"tnum"' }}>{rating.toFixed(1)}</span>
      {reviews != null && <span style={{ color: 'var(--c-600)', fontWeight: 400 }}>({reviews})</span>}
    </span>
  );
}

function ZwStatusPill({ status, closesAt, dense = false }) {
  const isOpen = status === 'open' || status === '24/7';
  const color = isOpen ? 'var(--s-success-600)' : 'var(--c-500)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: dense ? 4 : 5,
      fontSize: dense ? 11.5 : 12.5, color: 'var(--c-700)', letterSpacing: '-0.005em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}></span>
      <span style={{ color, fontWeight: 600 }}>
        {status === '24/7' ? 'Open 24/7' : isOpen ? 'Open' : 'Closed'}
      </span>
      {isOpen && closesAt && <span style={{ color: 'var(--c-600)' }}>· Closes {closesAt}</span>}
    </span>
  );
}

// Mono uppercase kicker — the brand's section voice
function ZwKicker({ children, color = 'var(--p-600)', style = {} }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
      letterSpacing: '0.14em', textTransform: 'uppercase', color, ...style,
    }}>{children}</div>
  );
}

// Section title — editorial scale for web
function ZwSectionTitle({ kicker, title, action, onAction, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 16, marginBottom: 22, ...style,
    }}>
      <div>
        {kicker && <ZwKicker style={{ marginBottom: 8 }}>{kicker}</ZwKicker>}
        <h2 style={{
          margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600,
          letterSpacing: '-0.03em', lineHeight: 1.06, color: 'var(--c-900)',
        }} className="txt-balance">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="tap"
                style={{
                  background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                  color: 'var(--c-700)', fontSize: 14, fontWeight: 600, flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
          {action}
          <ZIcon name="chevR" size={14} color="var(--c-700)"></ZIcon>
        </button>
      )}
    </div>
  );
}

// Heart button — shared favorite affordance
function ZwHeartBtn({ active, onClick, size = 34, floating = true }) {
  const [pop, setPop] = useStateWC(false);
  return (
    <button
      aria-label={active ? 'Remove from saved' : 'Save'}
      onClick={(e) => {
        e.stopPropagation();
        setPop(true); setTimeout(() => setPop(false), 600);
        onClick && onClick();
      }}
      className="tap"
      style={{
        width: size, height: size, borderRadius: '50%', border: 0, cursor: 'pointer',
        background: floating ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: floating ? 'blur(10px)' : 'none',
        boxShadow: floating ? '0 1px 4px rgba(28,28,26,0.12)' : 'none',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
      <span className={pop ? 'zv-heart-pop' : ''} style={{ display: 'inline-flex' }}>
        <ZIcon name={active ? 'heart' : 'heartO'} size={size * 0.5}
               color={active ? 'var(--p-500)' : 'var(--c-800)'}></ZIcon>
      </span>
    </button>
  );
}

// Primary / secondary buttons
function ZwButton({ children, kind = 'primary', size = 'md', onClick, style = {}, disabled = false }) {
  const pad = size === 'lg' ? '15px 28px' : size === 'sm' ? '8px 14px' : '11px 20px';
  const fs  = size === 'lg' ? 16 : size === 'sm' ? 13 : 14.5;
  const looks = {
    primary:  { background: 'var(--c-ink)', color: '#fff', border: '1px solid var(--c-ink)' },
    accent:   { background: 'var(--p-500)', color: '#fff', border: '1px solid var(--p-500)' },
    secondary:{ background: '#fff', color: 'var(--c-900)', border: '1px solid rgba(28,28,26,0.14)' },
    ghost:    { background: 'transparent', color: 'var(--c-800)', border: '1px solid transparent' },
  };
  return (
    <button onClick={onClick} className="tap zw-btn" disabled={disabled}
            style={{
              ...looks[kind], padding: pad, fontSize: fs, fontWeight: 600,
              borderRadius: 'var(--r-full)', cursor: disabled ? 'default' : 'pointer',
              letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              opacity: disabled ? 0.45 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              ...style,
            }}>{children}</button>
  );
}

// ──────────────────────────────────────────
// BusinessCard — web grid variant. Faithful desktop port of the mobile
// EDITORIAL card (business-card.jsx → BusinessCardEditorial). Cards show
// BUSINESS-level data only — name, cat, rating/reviews, blurb, distance,
// status. NO service-level data (no "next slot", no "from £X"): that lives
// on the business detail page once a service is picked. Hover lift + zoom
// are the only web-native additions.
// ──────────────────────────────────────────
function ZwBusinessCard({ b, onClick, favorited, onFavorite }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }}
         className="zw-hover-lift"
         style={{
           background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
           borderRadius: 'var(--card-r, 18px)', overflow: 'hidden', cursor: 'pointer',
           boxShadow: 'var(--sh-sm)', display: 'flex', flexDirection: 'column',
         }}>
      <div className="zw-zoom-wrap" style={{ position: 'relative', aspectRatio: '16 / 10', background: 'var(--c-300)' }}>
        <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
        <span style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          color: 'var(--c-800)', letterSpacing: '-0.005em',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <ZwCatDot cat={b.cat}></ZwCatDot>
          {b.catLabel}
        </span>
        <span style={{ position: 'absolute', top: 10, right: 10 }}>
          <ZwHeartBtn active={favorited} onClick={() => onFavorite && onFavorite(b.id)} size={36}></ZwHeartBtn>
        </span>
      </div>
      <div style={{ padding: '15px 17px 17px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{
            fontSize: 18, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--c-900)', lineHeight: 1.15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
          }}>{b.name}</span>
          <ZwRating rating={b.rating} reviews={b.reviews} size={13.5}></ZwRating>
        </div>
        {b.blurb && (
          <p className="txt-pretty" style={{
            margin: '6px 0 0', fontSize: 13.5, color: 'var(--c-700)', letterSpacing: '-0.005em', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{b.blurb}</p>
        )}
        <div style={{
          marginTop: 9, display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 12.5, color: 'var(--c-600)', letterSpacing: '-0.005em', whiteSpace: 'nowrap',
        }}>
          <span>{b.distance}</span>
          <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--c-400)', flexShrink: 0 }}></span>
          {(b.status === 'open' || b.status === '24/7')
            ? <span style={{ color: 'var(--s-success-600)', fontWeight: 600 }}>{b.status === '24/7' ? 'Open 24/7' : 'Open'}</span>
            : <span style={{ color: 'var(--c-500)', fontWeight: 600 }}>Closed</span>}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// OverlayCard — faithful port of the mobile OVERLAY card
// (business-card.jsx → BusinessCardOverlay). Photo-forward: full-bleed
// image, top+bottom gradient shades, magazine-bold name, city·distance,
// and a confident rating block (big number + fractional stars + reviews).
// Used for the photo-led home carousels/grids.
// ──────────────────────────────────────────
function ZwBusinessOverlayCard({ b, onClick, favorited, onFavorite }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }}
         className="zw-hover-lift zw-zoom-parent"
         style={{
           position: 'relative', borderRadius: 'var(--card-r, 18px)', overflow: 'hidden', cursor: 'pointer',
           aspectRatio: '4 / 5', background: 'var(--c-ink)', boxShadow: 'var(--sh-md)',
         }}>
      <div className="zw-zoom-wrap" style={{ position: 'absolute', inset: 0 }}>
        <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 110,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none',
      }}></div>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.88) 100%)',
      }}></div>

      <span style={{ position: 'absolute', top: 12, right: 12 }}>
        <ZwHeartBtn active={favorited} onClick={() => onFavorite && onFavorite(b.id)} size={34}></ZwHeartBtn>
      </span>

      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18, color: '#fff', textAlign: 'left' }}>
        <div style={{
          fontSize: 'clamp(20px, 1.5vw, 25px)', fontWeight: 700, lineHeight: 1.04,
          letterSpacing: '-0.03em', textShadow: '0 2px 14px rgba(0,0,0,0.42)', textWrap: 'balance',
        }}>{b.name}</div>
        <div style={{
          marginTop: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.82)',
          letterSpacing: '-0.005em', textShadow: '0 1px 6px rgba(0,0,0,0.40)',
          display: 'inline-flex', alignItems: 'center', gap: 7,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
        }}>
          {b.city && <span>{b.city}</span>}
          {b.city && b.distance && <span style={{ opacity: 0.45 }}>·</span>}
          {b.distance && <span>{b.distance}</span>}
        </div>
        {b.rating != null && (
          <div style={{ marginTop: 13, display: 'flex', alignItems: 'flex-end', gap: 9 }}>
            <span style={{
              fontSize: 31, fontWeight: 700, color: '#fff', letterSpacing: '-0.038em', lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 12px rgba(0,0,0,0.38)',
            }}>{b.rating.toFixed(1)}</span>
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ display: 'inline-flex', gap: 1.5, alignItems: 'center' }}>
                {[0, 1, 2, 3, 4].map(i => {
                  const fill = Math.max(0, Math.min(1, (b.rating || 0) - i));
                  return (
                    <span key={i} style={{ position: 'relative', width: 10, height: 10, display: 'inline-block' }}>
                      <ZIcon name="star" size={10} color="rgba(255,255,255,0.32)"></ZIcon>
                      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fill * 100}%` }}>
                        <ZIcon name="star" size={10} color="#fff"></ZIcon>
                      </span>
                    </span>
                  );
                })}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.78)',
                letterSpacing: '-0.005em', textShadow: '0 1px 6px rgba(0,0,0,0.35)',
              }}>{b.reviews} reviews</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// FeedCard — faithful port of the mobile FEED card
// (business-card.jsx → BusinessCardFeed). Two-zone ticket: photo left with
// the name overlaid at the bottom, a dashed divider, then a content zone —
// category small-caps, blurb (the title slot), rating, and a mono meta line
// (distance · OPEN/CLOSED). This is the app's signature "Near you" card.
// ──────────────────────────────────────────
function ZwBusinessFeedCard({ b, onClick }) {
  const isOpen = b.status === 'open' || b.status === '24/7';
  return (
    <div role="button" tabIndex={0} onClick={onClick}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }}
         className="zw-hover-lift zw-zoom-parent"
         style={{
           display: 'flex', height: 168, background: '#fff',
           border: '1px solid rgba(28,28,26,0.06)', borderRadius: 'var(--card-r, 18px)',
           overflow: 'hidden', boxShadow: 'var(--sh-sm)', cursor: 'pointer',
         }}>
      <div className="zw-zoom-wrap" style={{ width: 150, flexShrink: 0, position: 'relative', background: 'var(--c-300)' }}>
        <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></ZImg>
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 70,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 100%)', pointerEvents: 'none',
        }}></div>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.88) 100%)',
        }}></div>
        <div style={{
          position: 'absolute', left: 12, right: 12, bottom: 11,
          fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.018em', lineHeight: 1.15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 12px rgba(0,0,0,0.42)',
        }}>{b.name}</div>
      </div>
      <div style={{
        flex: 1, minWidth: 0, padding: '13px 16px 0',
        display: 'flex', flexDirection: 'column', borderLeft: '1px dashed rgba(28,28,26,0.08)',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 700, color: `var(--cat-${b.cat})`,
          letterSpacing: '0.02em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: `var(--cat-${b.cat})`, flexShrink: 0 }}></span>
          {b.catLabel}
        </span>
        {b.blurb && (
          <div style={{
            marginTop: 9, fontSize: 15, fontWeight: 500, color: 'var(--c-900)',
            letterSpacing: '-0.015em', lineHeight: 1.25,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{b.blurb}</div>
        )}
        <div style={{
          marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12.5, fontWeight: 600, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums',
        }}>
          <ZIcon name="star" size={11} color="var(--p-500)"></ZIcon>
          {b.rating.toFixed(1)}
          <span style={{ color: 'var(--c-500)', fontWeight: 500 }}>({b.reviews})</span>
        </div>
        <div style={{
          marginTop: 'auto', marginBottom: 13, paddingTop: 9, borderTop: '1px solid rgba(28,28,26,0.06)',
          fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
          fontSize: 11, fontWeight: 600, color: 'var(--c-700)', letterSpacing: '0.005em',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span>{b.distance}</span>
          <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--c-400)', flexShrink: 0 }}></span>
          {isOpen
            ? <span style={{ color: 'var(--s-success-600)' }}>{b.status === '24/7' ? 'OPEN 24/7' : 'OPEN'}</span>
            : <span style={{ color: 'var(--c-500)' }}>CLOSED</span>}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// BusinessRow — horizontal compact (results panel, lists)
// ──────────────────────────────────────────
function ZwBusinessRow({ b, onClick, selected = false, favorited, onFavorite, onHover, onLeave }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
         onMouseEnter={onHover} onMouseLeave={onLeave}
         onKeyDown={(e) => { if (e.key === 'Enter') onClick && onClick(); }}
         className="zw-zoom-parent"
         style={{
           display: 'flex', gap: 14, padding: 12, borderRadius: 16, cursor: 'pointer',
           background: selected ? 'var(--c-100)' : 'transparent',
           border: selected ? '1px solid rgba(28,28,26,0.10)' : '1px solid transparent',
           transition: 'background-color .18s var(--ease-soft), border-color .18s var(--ease-soft)',
         }}>
      <div className="zw-zoom-wrap" style={{
        width: 116, height: 96, borderRadius: 12, overflow: 'hidden',
        background: 'var(--c-300)', flexShrink: 0, position: 'relative',
      }}>
        <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{b.name}</span>
          <ZwHeartBtn active={favorited} onClick={() => onFavorite && onFavorite(b.id)} size={28} floating={false}></ZwHeartBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--c-600)' }}>
          <ZwCatDot cat={b.cat} size={5}></ZwCatDot>
          <span>{b.catLabel}</span>
          <span style={{ color: 'var(--c-400)' }}>·</span>
          <span>{b.distance}</span>
        </div>
        <ZwRating rating={b.rating} reviews={b.reviews} size={12.5}></ZwRating>
        <div style={{ marginTop: 'auto' }}>
          <ZwStatusPill status={b.status} closesAt={b.closesAt} dense={true}></ZwStatusPill>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Chip — filter / tag pill
// ──────────────────────────────────────────
function ZwChip({ children, active = false, onClick, icon, style = {} }) {
  return (
    <button onClick={onClick} className="tap"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em',
              background: active ? 'var(--c-ink)' : '#fff',
              color: active ? '#fff' : 'var(--c-800)',
              border: active ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.12)',
              whiteSpace: 'nowrap', flexShrink: 0,
              ...style,
            }}>
      {icon && <ZIcon name={icon} size={14} color={active ? '#fff' : 'var(--c-700)'}></ZIcon>}
      {children}
    </button>
  );
}

// ──────────────────────────────────────────
// Signed-out gate — shared lock screen for personal pages
// (Appointments, Support, Profile). Mirrors the Account gate.
// ──────────────────────────────────────────
function ZwSignedOutGate({ ctx, icon = 'user', title, body, cta = 'Sign in', secondaryLabel, onSecondary }) {
  const signIn = () => {
    ctx.setUserState('returning');
    const name = (window.ZW_USER && window.ZW_USER.name.split(' ')[0]) || 'there';
    window.zwToast('Welcome back, ' + name, 'check');
  };
  return (
    <div className="zw-container" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: 'clamp(80px, 12vw, 150px) var(--gutter)',
    }}>
      <span style={{
        width: 64, height: 64, borderRadius: '50%', background: 'var(--c-mist)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ZIcon name={icon} size={26} color="var(--c-700)"></ZIcon>
      </span>
      <h1 style={{ margin: '22px 0 0', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 600, letterSpacing: '-0.035em', color: 'var(--c-900)' }} className="txt-balance">
        {title}
      </h1>
      <p className="txt-pretty" style={{ margin: '14px 0 26px', fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 400 }}>
        {body}
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <ZwButton kind="primary" size="lg" onClick={signIn}>{cta}</ZwButton>
        {secondaryLabel && <ZwButton kind="secondary" size="lg" onClick={onSecondary}>{secondaryLabel}</ZwButton>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Row skeleton — shimmer placeholder matching ZwBusinessRow's anatomy
// ──────────────────────────────────────────
function ZwRowSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: 12 }} aria-hidden="true">
      <div className="zv-skel" style={{ width: 116, height: 96, borderRadius: 12, flexShrink: 0 }}></div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="zv-skel" style={{ width: '62%', height: 14 }}></div>
        <div className="zv-skel" style={{ width: '42%', height: 11 }}></div>
        <div className="zv-skel" style={{ width: '30%', height: 11 }}></div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ZwCatDot, ZwRating, ZwStatusPill, ZwKicker, ZwSectionTitle,
  ZwHeartBtn, ZwButton, ZwBusinessCard, ZwBusinessOverlayCard, ZwBusinessFeedCard, ZwBusinessRow, ZwChip,
  ZwRowSkeleton, ZwSignedOutGate,
});
