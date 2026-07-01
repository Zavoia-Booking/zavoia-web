// Zavoia Web — account layer: notifications popover, account menu,
// and the sign-in modal. All anchored to the top-nav right cluster.
//
// Sign-in is prototype-real: completing it flips userState to 'returning'
// (and sign-out flips it back to 'new') via ctx.setUserState.

const { useState: useStateAC, useEffect: useEffectAC, useRef: useRefAC } = React;

// The signed-in persona (matches the avatar already used in the nav)
window.ZW_USER = {
  name: 'Sofia Novak',
  email: 'sofia.novak@gmail.com',
  avatar: 'https://i.pravatar.cc/100?img=32',
};

// Notifications — tied to the prototype's world (Sage Wellness massage,
// Glow Studio visit, Mara). `unread` drives the bell dot.
window.ZW_NOTIFS = [
  { id: 'n1', icon: 'cal',   tone: 'var(--p-600)',         toneBg: 'var(--p-100)',
    title: 'Massage tomorrow at 11:00',
    sub: 'Sage Wellness · Deep tissue · Liana Marek', time: '2h ago', unread: true },
  { id: 'n2', icon: 'clock', tone: 'var(--s-success-600)', toneBg: 'var(--s-success-100)',
    title: 'Mara Voinescu added new availability',
    sub: 'Next week at Glow Studio · Soho', time: '5h ago', unread: true },
  { id: 'n3', icon: 'star',  tone: 'var(--c-700)',         toneBg: 'var(--c-100)',
    title: 'How was Glow Studio?',
    sub: 'Leave a review for your balayage with Mara', time: 'Yesterday', unread: false },
  { id: 'n4', icon: 'check', tone: 'var(--c-700)',         toneBg: 'var(--c-100)',
    title: 'Reschedule confirmed',
    sub: 'Dental check-up moved to Fri · 09:30', time: '2 days ago', unread: false },
];

// ─────────────────────────────────────────────
// Popover shell — fixed under the nav, right-aligned to the container.
// Backdrop catches outside clicks; Escape closes.
// ─────────────────────────────────────────────
function ZwPopover({ onClose, width = 380, children, label }) {
  useEffectAC(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Portal to <body>: the sticky nav uses backdrop-filter, which traps
  // position:fixed to the nav box — so a backdrop rendered inside it
  // wouldn't cover the page. Rendering at the body level lets the
  // full-viewport backdrop catch every outside click.
  const node = (
    <React.Fragment>
      <div onClick={onClose} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 190 }}></div>
      <div role="dialog" aria-label={label} className="zv-fade" style={{
        position: 'fixed', zIndex: 191,
        top: 'calc(var(--nav-h) + 10px)',
        right: 'max(var(--gutter), calc((100vw - var(--content-max)) / 2 + var(--gutter)))',
        width: 'min(' + width + 'px, calc(100vw - 24px))',
        background: '#fff', borderRadius: 20,
        border: '1px solid rgba(28,28,26,0.08)', boxShadow: 'var(--sh-lg)',
        overflow: 'hidden',
      }}>{children}</div>
    </React.Fragment>
  );
  return ReactDOM.createPortal(node, document.body);
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
function ZwNotifPanel({ ctx, onClose, notifs, onMarkAll }) {
  const unread = notifs.filter(n => n.unread).length;
  return (
    <ZwPopover onClose={onClose} label="Notifications" width={392}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 12px',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>
          Notifications
        </span>
        {unread > 0 && (
          <button className="tap zw-link" onClick={onMarkAll}
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer', padding: '2px 0',
                    fontSize: 12.5, fontWeight: 600, color: 'var(--c-600)',
                  }}>Mark all read</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 8 }}>
        {notifs.map(n => (
          <button key={n.id} className="tap zw-hover-row"
                  onClick={() => { onClose(); ctx.go(n.id === 'n3' ? 'biz' : 'appointments'); }}
                  style={{
                    display: 'flex', gap: 13, alignItems: 'flex-start', textAlign: 'left',
                    background: 'transparent', border: 0, cursor: 'pointer',
                    padding: '11px 18px', width: '100%',
                  }}>
            <span style={{
              width: 36, height: 36, borderRadius: 12, background: n.toneBg, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
            }}>
              <ZIcon name={n.icon} size={16} color={n.tone}></ZIcon>
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontSize: 13.5, fontWeight: n.unread ? 600 : 500, letterSpacing: '-0.01em',
                color: 'var(--c-900)', lineHeight: 1.35,
              }}>{n.title}</span>
              <span style={{ fontSize: 12.5, color: 'var(--c-600)', lineHeight: 1.4 }}>{n.sub}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-500)', marginTop: 3,
              }}>{n.time}</span>
            </span>
            {n.unread && <span style={{
              width: 7, height: 7, borderRadius: '50%', background: 'var(--p-500)',
              flexShrink: 0, marginTop: 6,
            }}></span>}
          </button>
        ))}
      </div>
    </ZwPopover>
  );
}

// ─────────────────────────────────────────────
// Account menu
// ─────────────────────────────────────────────
function ZwAccountMenu({ ctx, onClose, onSignOut }) {
  const u = window.ZW_USER;
  const item = (icon, label, onClick, danger = false) => (
    <button key={label} className="tap zw-hover-row" onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: 'transparent', border: 0, cursor: 'pointer',
              padding: '10px 18px', fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em',
              color: danger ? 'var(--s-warning-600)' : 'var(--c-800)', textAlign: 'left',
            }}>
      <ZIcon name={icon} size={16} color={danger ? 'var(--s-warning-600)' : 'var(--c-600)'}></ZIcon>
      {label}
    </button>
  );
  const noop = (label) => () => { onClose(); window.zwToast(label + ' — out of prototype scope', 'info'); };
  return (
    <ZwPopover onClose={onClose} label="Account" width={300}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px 14px' }}>
        <img src={u.avatar} alt={u.name} style={{
          width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
          boxShadow: '0 0 0 1px rgba(28,28,26,0.08)', flexShrink: 0,
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)' }}>{u.name}</div>
          <div style={{
            fontSize: 12.5, color: 'var(--c-600)', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{u.email}</div>
        </div>
      </div>
      <div className="zv-hair" style={{ height: 1 }}></div>
      <div style={{ padding: '8px 0' }}>
        {item('cal',    'Appointments',     () => { onClose(); ctx.go('appointments'); })}
        {item('heartO', 'Saved',            () => { onClose(); ctx.go('saved'); })}
        {item('user',   'Profile & settings', () => { onClose(); ctx.go('account'); })}
      </div>
      <div className="zv-hair" style={{ height: 1 }}></div>
      <div style={{ padding: '8px 0' }}>
        {item('sparkle', 'The Journal',     () => { onClose(); ctx.go('blog'); })}
        {item('info',   'Help & support',   () => { onClose(); ctx.go('help'); })}
      </div>
      <div className="zv-hair" style={{ height: 1 }}></div>
      <div style={{ padding: '8px 0' }}>
        {item('globe',  'For business',     () => { onClose(); ctx.go('for-business'); })}
        {item('wallet', 'Pricing',          () => { onClose(); ctx.go('pricing'); })}
      </div>
      <div className="zv-hair" style={{ height: 1 }}></div>
      <div style={{ padding: '8px 0' }}>
        {item('logout', 'Log out', () => { onClose(); onSignOut(); }, false)}
      </div>
    </ZwPopover>
  );
}

// ─────────────────────────────────────────────
// Sign-in modal
// ─────────────────────────────────────────────
function ZwAuthModal({ onClose, onSignIn, mode: initialMode = 'signin' }) {
  const [mode, setMode] = useStateAC(initialMode);
  const [name, setName] = useStateAC('');
  const [email, setEmail] = useStateAC('');
  const [password, setPassword] = useStateAC('');
  const [busy, setBusy] = useStateAC(false);
  const inputRef = useRefAC(null);
  const isSignup = mode === 'signup';
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const ready = emailOk && password.length >= 6 && (!isSignup || name.trim().length > 0);
  useEffectAC(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    if (inputRef.current) inputRef.current.focus();
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);
  const submit = () => {
    if (busy || !ready) return;
    setBusy(true);
    setTimeout(() => onSignIn(email), 700);
  };
  const fieldLabel = {
    display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-600)', marginBottom: 7,
  };
  const fieldInput = {
    width: '100%', boxSizing: 'border-box', padding: '13px 16px',
    borderRadius: 14, border: '1px solid rgba(28,28,26,0.16)',
    fontSize: 15, color: 'var(--c-900)', background: '#fff',
    outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.01em',
  };
  const socialBtn = (label) => (
    <button key={label} className="tap" onClick={() => { setBusy(true); setTimeout(() => onSignIn(email), 700); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '13px 18px', borderRadius: 'var(--r-full)',
              background: '#fff', border: '1px solid rgba(28,28,26,0.16)', cursor: 'pointer',
              fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--c-900)',
            }}>{label}</button>
  );
  return (
    <div className="zv-sheet-backdrop" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(28,28,26,0.42)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--gutter)',
    }}>
      <div className="zv-sheet-card" data-i="0" onClick={(e) => e.stopPropagation()}
           role="dialog" aria-label={isSignup ? 'Create account' : 'Sign in'}
           style={{
             width: 'min(420px, 100%)', background: '#fff', borderRadius: 26,
             boxShadow: 'var(--sh-lg)', padding: '34px 32px 30px', position: 'relative',
             maxHeight: 'calc(100vh - 2 * var(--gutter))', overflowY: 'auto', boxSizing: 'border-box',
           }}>
        <button className="tap" onClick={onClose} aria-label="Close"
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 34, height: 34, borderRadius: '50%', border: 0,
                  background: 'var(--c-100)', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
          <ZIcon name="x" size={15} color="var(--c-700)"></ZIcon>
        </button>

        <img src="assets/logo-icon.png" alt="" style={{ width: 44, height: 44, marginBottom: 18 }} />
        <h2 style={{
          margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)',
        }}>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p style={{ margin: '8px 0 24px', fontSize: 14, lineHeight: 1.5, color: 'var(--c-600)' }} className="txt-pretty">
          {isSignup
            ? 'Book trusted local pros and keep every appointment in one place.'
            : 'Sign in to see your appointments, saved places and more.'}
        </p>

        {isSignup && (
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Full name</label>
            <input type="text" value={name} placeholder="Sofia Novak"
                   onChange={(e) => setName(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                   style={fieldInput} />
          </div>
        )}

        <label style={fieldLabel}>Email</label>
        <input ref={inputRef} type="email" value={email} placeholder="you@example.com"
               onChange={(e) => setEmail(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
               style={fieldInput} />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '14px 0 7px' }}>
          <label style={{ ...fieldLabel, marginBottom: 0 }}>Password</label>
          {!isSignup && (
            <button className="zw-link" onClick={() => window.zwToast('Password reset link sent', 'email')}
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--p-700)' }}>Forgot?</button>
          )}
        </div>
        <input type="password" value={password} placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
               onChange={(e) => setPassword(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
               style={fieldInput} />

        <ZwButton kind="accent" size="lg" onClick={submit} disabled={!ready}
                  style={{ width: '100%', marginTop: 16, opacity: busy ? 0.7 : 1 }}>
          {busy ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
        </ZwButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0' }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(28,28,26,0.10)' }}></span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
            letterSpacing: '0.12em', color: 'var(--c-500)',
          }}>OR</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(28,28,26,0.10)' }}></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {socialBtn('Continue with Apple')}
          {socialBtn('Continue with Google')}
        </div>

        <p style={{ margin: '20px 0 0', fontSize: 13.5, color: 'var(--c-700)', textAlign: 'center' }}>
          {isSignup ? 'Already have an account? ' : "New to Zavoia? "}
          <button className="zw-link" onClick={() => setMode(isSignup ? 'signin' : 'signup')}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--p-700)' }}>
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <p style={{ margin: '16px 0 0', fontSize: 12, lineHeight: 1.55, color: 'var(--c-500)', textAlign: 'center' }}>
          By continuing you agree to Zavoia's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { ZwNotifPanel, ZwAccountMenu, ZwAuthModal });
