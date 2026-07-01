// Zavoia Web — Profile & settings (#/account). Desktop: a full-width
// profile banner + two-pane (nav rail · content). Narrow: phone-style
// hub → drill-in. Personal info is inline-editable with a completeness
// meter and email-verify banner; Security carries 2FA + active sessions.
// State persists to localStorage (zw-profile, zw-prefs).

const { useState: useStateAP, useEffect: useEffectAP, useRef: useRefAP } = React;

function zwUseNarrow() {
  const [n, setN] = useStateAP(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches);
  useEffectAP(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const fn = (e) => setN(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return n;
}

const ZW_PREF_DEFAULTS = {
  mkt_push: true, mkt_sms: true, mkt_email: true,
  rem_push: true, rem_sms: true, rem_email: true, twofa: false,
};
function zwReadPrefs() {
  try { return { ...ZW_PREF_DEFAULTS, ...JSON.parse(localStorage.getItem('zw-prefs') || '{}') }; }
  catch (e) { return { ...ZW_PREF_DEFAULTS }; }
}
function zwWritePrefs(p) { try { localStorage.setItem('zw-prefs', JSON.stringify(p)); } catch (e) {} }

function zwReadProfile() {
  const u = window.ZW_USER || {};
  const base = { name: u.name, email: u.email, phone: '', dob: '', address: '', emailVerified: false };
  try { return { ...base, ...JSON.parse(localStorage.getItem('zw-profile') || '{}') }; }
  catch (e) { return base; }
}
function zwWriteProfile(p) { try { localStorage.setItem('zw-profile', JSON.stringify(p)); } catch (e) {} }

function zwMaskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [user, dom] = email.split('@');
  const masked = user.length <= 2 ? user[0] + '***' : user[0] + '***' + user[user.length - 1];
  return masked + '@' + dom;
}

const ZW_ACCT_SECTIONS = [
  { id: 'personal',    icon: 'pencil', label: 'Personal information', navLabel: 'Personal info' },
  { id: 'preferences', icon: 'bell',   label: 'Preferences',          navLabel: 'Preferences', sub: 'Choose how you want to be notified.' },
  { id: 'security',    icon: 'lock',   label: 'Login & security',     navLabel: 'Login & security' },
];

// ── Shared primitives ──
function ZwAcctSectionLabel({ children, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)' }}>{children}</div>
      {sub && <div className="txt-pretty" style={{ fontSize: 13, color: 'var(--c-500)', marginTop: 6, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

function ZwAcctCard({ children }) {
  return <div style={{ background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 16, boxShadow: 'var(--sh-sm)', overflow: 'hidden' }}>{children}</div>;
}

function ZwAcctNavRow({ icon, label, sub, action, danger, last, onClick }) {
  return (
    <button className="tap zw-hover-row" onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '15px 18px', background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit',
              borderBottom: last ? 0 : '1px solid rgba(28,28,26,0.06)',
            }}>
      <ZIcon name={icon} size={20} color={danger ? 'var(--s-error-600)' : 'var(--c-700)'} style={{ flexShrink: 0 }}></ZIcon>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.012em', color: danger ? 'var(--s-error-600)' : 'var(--c-900)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-500)', marginTop: 2 }}>{sub}</span>}
      </span>
      {action
        ? <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--p-700)', textDecoration: 'underline', flexShrink: 0 }}>{action}</span>
        : <ZIcon name="chevR" size={16} color="var(--c-400)" style={{ flexShrink: 0 }}></ZIcon>}
    </button>
  );
}

function ZwAcctToggleRow({ icon, label, sub, on, onToggle, last }) {
  return (
    <button className="tap" onClick={onToggle} role="switch" aria-checked={on}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '15px 18px', background: 'transparent', border: 0, cursor: 'pointer', font: 'inherit',
              borderBottom: last ? 0 : '1px solid rgba(28,28,26,0.06)',
            }}>
      <ZIcon name={icon} size={20} color="var(--c-700)" style={{ flexShrink: 0 }}></ZIcon>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.012em', color: 'var(--c-900)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-500)', marginTop: 2 }}>{sub}</span>}
      </span>
      <span aria-hidden="true" style={{ width: 44, height: 26, borderRadius: 999, flexShrink: 0, position: 'relative', background: on ? 'var(--c-ink)' : 'var(--c-300)', transition: 'background-color .2s var(--ease-soft)' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s var(--ease-soft)' }}></span>
      </span>
    </button>
  );
}

// ── Inline-editable field row ──
function ZwEditableRow({ label, value, placeholder, type = 'text', onSave, last }) {
  const [editing, setEditing] = useStateAP(false);
  const [draft, setDraft] = useStateAP(value || '');
  const ref = useRefAP(null);
  useEffectAP(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  const start = () => { setDraft(value || ''); setEditing(true); };
  const commit = () => { onSave((draft || '').trim()); setEditing(false); };
  const cancel = () => setEditing(false);
  const muted = !value;
  return (
    <div style={{ padding: '16px 0', borderBottom: last ? 0 : '1px solid rgba(28,28,26,0.08)' }}>
      <div style={{ display: 'flex', alignItems: editing ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--c-900)' }}>{label}</div>
          {editing ? (
            <input ref={ref} type={type} value={draft}
                   onChange={(e) => setDraft(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
                   placeholder={placeholder}
                   style={{ marginTop: 8, width: '100%', maxWidth: 340, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(28,28,26,0.18)', fontSize: 14, color: 'var(--c-900)', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
          ) : (
            <div style={{ fontSize: 14, color: muted ? 'var(--c-400)' : 'var(--c-600)', marginTop: 4 }}>{value || placeholder}</div>
          )}
        </div>
        {editing ? (
          <span style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
            <button className="tap" onClick={commit} style={{ padding: '7px 14px', borderRadius: 999, border: 0, background: 'var(--c-ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            <button className="tap" onClick={cancel} style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(28,28,26,0.14)', background: '#fff', color: 'var(--c-700)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </span>
        ) : (
          <button className="tap" onClick={start}
                  style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', textDecoration: 'underline', flexShrink: 0, padding: '2px 0' }}>{value ? 'Edit' : 'Add'}</button>
        )}
      </div>
    </div>
  );
}

// ── Completeness meter ──
function ZwProfileMeter({ profile }) {
  const checks = [!!profile.name, !!profile.email, !!profile.phone, !!profile.dob, !!profile.emailVerified];
  const done = checks.filter(Boolean).length;
  const pct = Math.round((done / checks.length) * 100);
  if (pct >= 100) return null;
  const missing = [];
  if (!profile.phone) missing.push('phone number');
  if (!profile.dob) missing.push('date of birth');
  if (!profile.emailVerified) missing.push('verified email');
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 16, boxShadow: 'var(--sh-sm)', padding: '16px 18px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>Profile {pct}% complete</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: 'var(--c-500)', fontVariantNumeric: 'tabular-nums' }}>{done}/{checks.length}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--c-200)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: 'var(--p-500)', transition: 'width .5s var(--ease-out)' }}></div>
      </div>
      {missing.length > 0 && (
        <div className="txt-pretty" style={{ fontSize: 12.5, color: 'var(--c-600)', marginTop: 10 }}>
          Add your {missing.length > 1 ? missing.slice(0, -1).join(', ') + ' and ' + missing.slice(-1) : missing[0]} to finish your profile.
        </div>
      )}
    </div>
  );
}

// ── Section: Personal information ──
function ZwAcctPersonalBody() {
  const [p, setP] = useStateAP(zwReadProfile);
  const save = (key) => (val) => { const n = { ...p, [key]: val }; setP(n); zwWriteProfile(n); window.zwToast('Saved', 'check'); };
  const verify = () => { const n = { ...p, emailVerified: true }; setP(n); zwWriteProfile(n); window.zwToast('Email verified', 'check'); };

  return (
    <div style={{ maxWidth: 620 }}>
      <ZwProfileMeter profile={p}></ZwProfileMeter>

      {!p.emailVerified && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, background: 'var(--s-warning-100)', border: '1px solid color-mix(in oklch, var(--s-warning-600) 24%, transparent)', borderRadius: 14, padding: '15px 17px', marginBottom: 24 }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ZIcon name="email" size={15} color="var(--s-warning-600)"></ZIcon>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>Verify your email</div>
            <div className="txt-pretty" style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--c-700)', marginTop: 2 }}>Confirm {zwMaskEmail(p.email)} to secure your account and get booking confirmations.</div>
          </div>
          <button className="tap" onClick={verify} style={{ padding: '8px 16px', borderRadius: 999, border: 0, background: 'var(--c-ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Verify</button>
        </div>
      )}

      <ZwEditableRow label="First & Last name" value={p.name} placeholder="Add your name" onSave={save('name')}></ZwEditableRow>
      <ZwEditableRow label="Email address" value={p.email} type="email" placeholder="Add your email" onSave={save('email')}></ZwEditableRow>
      <ZwEditableRow label="Phone number" value={p.phone} type="tel" placeholder="Not provided" onSave={save('phone')}></ZwEditableRow>
      <ZwEditableRow label="Date of birth" value={p.dob} placeholder="Not provided" onSave={save('dob')}></ZwEditableRow>
      <ZwEditableRow label="Address" value={p.address} placeholder="Add your address (optional)" onSave={save('address')} last={true}></ZwEditableRow>
    </div>
  );
}

// ── Section: Preferences ──
function ZwAcctPreferencesBody() {
  const [prefs, setPrefs] = useStateAP(zwReadPrefs);
  const toggle = (k) => () => setPrefs(prev => { const n = { ...prev, [k]: !prev[k] }; zwWritePrefs(n); return n; });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(20px, 3vw, 32px)' }}>
      <div>
        <ZwAcctSectionLabel sub="Receive updates about promotions, offers, and new features.">Marketing</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctToggleRow icon="bell" label="Push notifications" sub="Get notified on your device" on={prefs.mkt_push} onToggle={toggle('mkt_push')}></ZwAcctToggleRow>
          <ZwAcctToggleRow icon="phone" label="SMS" sub="Receive text messages" on={prefs.mkt_sms} onToggle={toggle('mkt_sms')}></ZwAcctToggleRow>
          <ZwAcctToggleRow icon="email" label="Email" sub="Receive promotional emails" on={prefs.mkt_email} onToggle={toggle('mkt_email')} last={true}></ZwAcctToggleRow>
        </ZwAcctCard>
      </div>
      <div>
        <ZwAcctSectionLabel sub="Get reminded about your upcoming appointments.">Reminders</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctToggleRow icon="bell" label="Push notifications" sub="Get notified on your device" on={prefs.rem_push} onToggle={toggle('rem_push')}></ZwAcctToggleRow>
          <ZwAcctToggleRow icon="phone" label="SMS" sub="Receive text reminders" on={prefs.rem_sms} onToggle={toggle('rem_sms')}></ZwAcctToggleRow>
          <ZwAcctToggleRow icon="email" label="Email" sub="Receive email reminders" on={prefs.rem_email} onToggle={toggle('rem_email')} last={true}></ZwAcctToggleRow>
        </ZwAcctCard>
      </div>
    </div>
  );
}

// ── Section: Login & security ──
const ZW_SESSIONS_SEED = [
  { id: 's1', icon: 'globe', device: 'Chrome · macOS', place: 'London, UK', when: 'Current session', current: true },
  { id: 's2', icon: 'phone', device: 'Zavoia app · iPhone', place: 'London, UK', when: 'Active 2 days ago', current: false },
  { id: 's3', icon: 'globe', device: 'Safari · iPad', place: 'Manchester, UK', when: 'Active 1 week ago', current: false },
];
function ZwAcctSecurityBody() {
  const [prefs, setPrefs] = useStateAP(zwReadPrefs);
  const [sessions, setSessions] = useStateAP(ZW_SESSIONS_SEED);
  const toggle2fa = () => setPrefs(prev => { const n = { ...prev, twofa: !prev.twofa }; zwWritePrefs(n); window.zwToast(n.twofa ? 'Two-step verification on' : 'Two-step verification off', 'shield'); return n; });
  const endSession = (id) => { setSessions(s => s.filter(x => x.id !== id)); window.zwToast('Signed out of that device', 'check'); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(22px, 3vw, 30px)', maxWidth: 600 }}>
      <div>
        <ZwAcctSectionLabel>Password</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctNavRow icon="lock" label="Password" sub="Last changed 3 months ago" action="Edit" last={true} onClick={() => window.zwToast('Password reset link sent', 'email')}></ZwAcctNavRow>
        </ZwAcctCard>
      </div>

      <div>
        <ZwAcctSectionLabel sub="Add a one-time code at sign-in for an extra layer of security.">Two-step verification</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctToggleRow icon="shield" label="Two-step verification" sub={prefs.twofa ? 'On · code sent by SMS' : 'Off'} on={prefs.twofa} onToggle={toggle2fa} last={true}></ZwAcctToggleRow>
        </ZwAcctCard>
      </div>

      <div>
        <ZwAcctSectionLabel>Social accounts</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctNavRow icon="googleG" label="Google" sub="Not connected" action="Connect" last={true} onClick={() => window.zwToast('Connecting Google account', 'check')}></ZwAcctNavRow>
        </ZwAcctCard>
      </div>

      <div>
        <ZwAcctSectionLabel sub="Devices currently signed in to your account.">Active sessions</ZwAcctSectionLabel>
        <ZwAcctCard>
          {sessions.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i === sessions.length - 1 ? 0 : '1px solid rgba(28,28,26,0.06)' }}>
              <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--c-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ZIcon name={s.icon} size={17} color="var(--c-700)"></ZIcon>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{s.device}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-500)', marginTop: 2 }}>
                  {s.place} · {s.current ? <span style={{ color: 'var(--s-success-600)', fontWeight: 600 }}>{s.when}</span> : s.when}
                </span>
              </span>
              {!s.current && (
                <button className="tap" onClick={() => endSession(s.id)} style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--p-700)', flexShrink: 0 }}>Sign out</button>
              )}
            </div>
          ))}
        </ZwAcctCard>
      </div>

      <div>
        <ZwAcctSectionLabel>Danger zone</ZwAcctSectionLabel>
        <ZwAcctCard>
          <ZwAcctNavRow icon="trash" label="Delete account" sub="Permanently delete your account and data" danger={true} last={true} onClick={() => window.zwToast('Account deletion — out of prototype scope', 'info')}></ZwAcctNavRow>
        </ZwAcctCard>
      </div>
    </div>
  );
}

function ZwAcctSectionContent({ id }) {
  if (id === 'preferences') return <ZwAcctPreferencesBody></ZwAcctPreferencesBody>;
  if (id === 'security') return <ZwAcctSecurityBody></ZwAcctSecurityBody>;
  return <ZwAcctPersonalBody></ZwAcctPersonalBody>;
}

// ── Stats ──
function zwAcctStats() {
  const apptCount = (window.ZV_WEB_APPTS || window.ZV_RECENT_APPTS || []).length + (window.ZW_SESSION_BOOKINGS || []).length;
  const reviewCount = Object.keys(window.ZW_SESSION_REVIEWS || {}).length + (window.ZV_WEB_APPTS || []).filter(a => a.review).length;
  const savedCount = (window.ZV_SAVED || []).length;
  return { apptCount, reviewCount, savedCount, memberSince: 'Mar 2025' };
}

// ── Editable avatar ──
function ZwAcctAvatar({ size = 84 }) {
  const u = window.ZW_USER;
  return (
    <button className="zw-avatar-edit" aria-label="Change photo"
            onClick={() => window.zwToast('Photo upload — out of prototype scope', 'info')}
            style={{ width: size, height: size, borderRadius: '50%', border: 0, padding: 0, background: 'transparent', flexShrink: 0, boxShadow: '0 0 0 3px var(--c-canvas), 0 0 0 4px rgba(28,28,26,0.10)' }}>
      <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      <span className="zw-avatar-ov"><ZIcon name="pencil" size={Math.round(size * 0.2)} color="#fff"></ZIcon></span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Desktop: full-width profile banner
// ─────────────────────────────────────────────
function ZwAcctBanner({ ctx }) {
  const u = window.ZW_USER;
  const st = zwAcctStats();
  const Chip = ({ value, label, onClick }) => (
    <button className="tap zw-hover-lift" onClick={onClick}
            style={{ flex: '0 0 auto', minWidth: 104, textAlign: 'left', background: 'var(--c-canvas)', border: '1px solid rgba(28,28,26,0.07)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', font: 'inherit' }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--c-500)', marginTop: 2 }}>{label}</div>
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(18px, 3vw, 28px)', background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 22, boxShadow: 'var(--sh-sm)', padding: 'clamp(20px, 2.5vw, 28px)', flexWrap: 'wrap' }}>
      <ZwAcctAvatar size={84}></ZwAcctAvatar>
      <div style={{ flex: 1, minWidth: 180 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 2.8vw, 32px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>{u.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: 'var(--c-600)' }}>Member since {st.memberSince}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--s-success-600)', background: 'var(--s-success-100)', padding: '3px 9px', borderRadius: 999 }}>
            <ZIcon name="shield" size={12} color="var(--s-success-600)"></ZIcon>Verified member
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Chip value={st.apptCount} label="Appointments" onClick={() => ctx.go('appointments')}></Chip>
        <Chip value={st.reviewCount} label="Reviews" onClick={() => ctx.go('appointments')}></Chip>
        <Chip value={st.savedCount} label="Saved" onClick={() => ctx.go('saved')}></Chip>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Desktop nav rail (sections + log out, accent bar on active)
// ─────────────────────────────────────────────
function ZwAcctRail({ ctx, active }) {
  const NavItem = ({ icon, label, on, onClick, danger }) => (
    <button className="tap" onClick={onClick}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '12px 14px', borderRadius: 12, border: 0, cursor: 'pointer', font: 'inherit',
              background: on ? 'var(--c-shade)' : 'transparent',
              color: danger ? 'var(--s-error-600)' : 'var(--c-900)',
              transition: 'background-color .15s var(--ease-soft)',
            }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--c-100)'; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
      {on && <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 999, background: 'var(--p-500)' }}></span>}
      <ZIcon name={icon} size={18} color={danger ? 'var(--s-error-600)' : on ? 'var(--p-600)' : 'var(--c-600)'} style={{ flexShrink: 0 }}></ZIcon>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: on ? 600 : 500, letterSpacing: '-0.01em' }}>{label}</span>
    </button>
  );
  return (
    <aside style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)', padding: '0 14px', marginBottom: 8 }}>Account</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ZW_ACCT_SECTIONS.map(s => <NavItem key={s.id} icon={s.icon} label={s.navLabel} on={active === s.id} onClick={() => ctx.go('account/' + s.id)}></NavItem>)}
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(28,28,26,0.08)' }}></div>
      <NavItem icon="logout" label="Log out" danger={true} onClick={() => { ctx.setUserState('new'); window.zwToast('Signed out', 'check'); ctx.go('home'); }}></NavItem>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Mobile hub
// ─────────────────────────────────────────────
function ZwAcctHubMobile({ ctx }) {
  const u = window.ZW_USER;
  const st = zwAcctStats();
  const Stat = ({ value, label, onClick }) => (
    <button className="tap" onClick={onClick} style={{ flex: 1, textAlign: 'center', minWidth: 0, background: 'transparent', border: 0, cursor: onClick ? 'pointer' : 'default', font: 'inherit' }}>
      <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--c-500)', marginTop: 3 }}>{label}</div>
    </button>
  );
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 30 }}>
        <ZwAcctAvatar size={92}></ZwAcctAvatar>
        <h1 style={{ margin: '15px 0 0', fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>{u.name}</h1>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--s-success-600)', background: 'var(--s-success-100)', padding: '3px 10px', borderRadius: 999, marginTop: 10 }}>
          <ZIcon name="shield" size={12} color="var(--s-success-600)"></ZIcon>Verified · Member since {st.memberSince}
        </span>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginTop: 18, width: '100%', maxWidth: 380 }}>
          <Stat value={st.apptCount} label="Appointments" onClick={() => ctx.go('appointments')}></Stat>
          <span style={{ width: 1, background: 'rgba(28,28,26,0.08)' }}></span>
          <Stat value={st.reviewCount} label="Reviews" onClick={() => ctx.go('appointments')}></Stat>
          <span style={{ width: 1, background: 'rgba(28,28,26,0.08)' }}></span>
          <Stat value={st.savedCount} label="Saved" onClick={() => ctx.go('saved')}></Stat>
        </div>
      </div>

      <div style={{ marginBottom: 26 }}>
        <ZwAcctSectionLabel>Profile &amp; account</ZwAcctSectionLabel>
        <ZwAcctCard>
          {ZW_ACCT_SECTIONS.map((s, i) => (
            <ZwAcctNavRow key={s.id} icon={s.icon} label={s.id === 'personal' ? 'Edit account' : s.label} last={i === ZW_ACCT_SECTIONS.length - 1} onClick={() => ctx.go('account/' + s.id)}></ZwAcctNavRow>
          ))}
        </ZwAcctCard>
      </div>

      <button className="tap" onClick={() => { ctx.setUserState('new'); window.zwToast('Signed out', 'check'); ctx.go('home'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '15px 18px', borderRadius: 999, background: 'var(--c-ink)', border: 0, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', fontFamily: 'inherit', boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 20px rgba(28,28,26,0.16)' }}>
        <ZIcon name="logout" size={17} color="#fff"></ZIcon>
        Log out
      </button>
    </div>
  );
}

// ── Section header ──
function ZwAcctHeader({ ctx, section, showBack }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {showBack && (
        <button className="tap zw-hover-row" onClick={() => ctx.go('account')}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '1px solid rgba(28,28,26,0.10)', cursor: 'pointer', marginBottom: 16, boxShadow: 'var(--sh-sm)' }}>
          <ZIcon name="back" size={16} color="var(--c-900)"></ZIcon>
        </button>
      )}
      <h1 style={{ margin: 0, fontSize: 'clamp(23px, 2.4vw, 28px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>{section.label}</h1>
      {section.sub && <p className="txt-pretty" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--c-600)' }}>{section.sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
function ZwAccountPage({ ctx }) {
  const isNarrow = zwUseNarrow();

  if (ctx.userState !== 'returning') {
    return (
      <ZwSignedOutGate ctx={ctx} icon="user"
        title="Your profile lives here."
        body="Sign in to manage your details, notifications and security."
        secondaryLabel="Explore places" onSecondary={() => ctx.go('search')}></ZwSignedOutGate>
    );
  }

  const sub = ctx.route.id;
  const section = ZW_ACCT_SECTIONS.find(s => s.id === sub);

  // ── Mobile: hub → drill-in ──
  if (isNarrow) {
    return (
      <div data-screen-label="Profile & settings" className="zw-container" style={{ paddingTop: 32, paddingBottom: 24, width: '100%' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {section ? (
            <div className="zw-acct-in" key={section.id}>
              <ZwAcctHeader ctx={ctx} section={section} showBack={true}></ZwAcctHeader>
              <ZwAcctSectionContent id={section.id}></ZwAcctSectionContent>
            </div>
          ) : (
            <ZwAcctHubMobile ctx={ctx}></ZwAcctHubMobile>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop: banner + two-pane ──
  const active = section ? section.id : 'personal';
  const activeSection = ZW_ACCT_SECTIONS.find(s => s.id === active);
  return (
    <div data-screen-label="Profile & settings" className="zw-container" style={{ paddingTop: 40, paddingBottom: 40, width: '100%' }}>
      <ZwAcctBanner ctx={ctx}></ZwAcctBanner>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 244px) minmax(0, 1fr)', gap: 'clamp(32px, 4.5vw, 64px)', alignItems: 'start', marginTop: 'clamp(28px, 3.5vw, 44px)' }}>
        <ZwAcctRail ctx={ctx} active={active}></ZwAcctRail>
        <div className="zw-acct-in" key={active} style={{ minWidth: 0, maxWidth: 760 }}>
          <ZwAcctHeader ctx={ctx} section={activeSection}></ZwAcctHeader>
          <ZwAcctSectionContent id={active}></ZwAcctSectionContent>
        </div>
      </div>
    </div>
  );
}

window.ZW_PAGES.account = ZwAccountPage;
