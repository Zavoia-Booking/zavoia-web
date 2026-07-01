// Zavoia Web — shared marketing/content atoms.
// ZwCtaBand, ZwFaqList, ZwBreadcrumb, ZwProse, ZwCheckRow, zwOpenBizDashboard

const { useState: useStateMK } = React;

// The enrollment itself lives in the separate Zavoia Business dashboard app —
// from the marketing site we just hand off.
function zwOpenBizDashboard() {
  window.zwToast('Opening the Zavoia Business dashboard\u2026', 'arrowR');
}

// ──────────────────────────────────────────
// Breadcrumb — mono trail for content/SEO pages
// ──────────────────────────────────────────
function ZwBreadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-500)',
    }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span aria-hidden="true" style={{ color: 'var(--c-400)' }}>/</span>}
          {it.href
            ? <a href={it.href} className="zw-link" style={{ color: 'var(--c-600)', textDecoration: 'none' }}>{it.label}</a>
            : <span style={{ color: 'var(--c-800)' }}>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ──────────────────────────────────────────
// Check row — feature bullet with the brand check
// ──────────────────────────────────────────
function ZwCheckRow({ children, dark = false, size = 15 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: dark ? 'rgba(255,255,255,0.14)' : 'var(--p-100)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ZIcon name="check" size={11} color={dark ? '#fff' : 'var(--p-600)'}></ZIcon>
      </span>
      <span style={{
        fontSize: size, lineHeight: 1.45, letterSpacing: '-0.01em',
        color: dark ? 'rgba(255,255,255,0.85)' : 'var(--c-700)',
      }}>{children}</span>
    </div>
  );
}

// ──────────────────────────────────────────
// FAQ — quiet accordion rows
// ──────────────────────────────────────────
function ZwFaqList({ items }) {
  const [open, setOpen] = useStateMK(0);
  return (
    <div style={{ borderTop: '1px solid rgba(28,28,26,0.08)' }}>
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={i} style={{ borderBottom: '1px solid rgba(28,28,26,0.08)' }}>
            <button className="tap" onClick={() => setOpen(on ? -1 : i)} aria-expanded={on}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 16, background: 'transparent', border: 0, cursor: 'pointer',
                      padding: '20px 2px', textAlign: 'left',
                    }}>
              <span style={{
                fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.018em',
                color: 'var(--c-900)', lineHeight: 1.3,
              }}>{it.q}</span>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: '1px solid rgba(28,28,26,0.14)', background: on ? 'var(--c-ink)' : '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color .2s var(--ease-soft)',
              }}>
                <ZIcon name={on ? 'chevU' : 'chevD'} size={14} color={on ? '#fff' : 'var(--c-700)'}></ZIcon>
              </span>
            </button>
            {on && (
              <p className="zv-fade txt-pretty" style={{
                margin: '0 0 22px', maxWidth: 640, fontSize: 15, lineHeight: 1.65,
                color: 'var(--c-600)', letterSpacing: '-0.005em',
              }}>{it.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────
// CTA band — ink panel that closes marketing pages
// ──────────────────────────────────────────
function ZwCtaBand({ kicker, title, sub, primaryLabel, onPrimary, secondaryLabel, onSecondary, tone = 'ink' }) {
  const ink = tone === 'ink';
  return (
    <section className="zw-container" style={{ marginTop: 'clamp(64px, 8vw, 104px)' }}>
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--r-2xl)',
        background: ink ? 'var(--c-ink)' : 'var(--c-mist)', color: ink ? '#fff' : 'var(--c-900)',
        padding: 'clamp(44px, 6vw, 76px) clamp(24px, 5vw, 72px)',
        textAlign: 'center',
      }}>
        {ink && <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(80% 130% at 50% -30%, color-mix(in oklch, var(--p-500) 26%, transparent) 0%, transparent 70%)',
        }}></div>}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {kicker && <ZwKicker color={ink ? 'var(--p-400)' : 'var(--p-600)'} style={{ marginBottom: 14 }}>{kicker}</ZwKicker>}
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 600,
            letterSpacing: '-0.035em', lineHeight: 1.04, maxWidth: 640,
          }}>{title}</h2>
          {sub && <p className="txt-pretty" style={{
            margin: '16px 0 0', fontSize: 16, lineHeight: 1.6,
            color: ink ? 'rgba(255,255,255,0.66)' : 'var(--c-600)', maxWidth: 480,
          }}>{sub}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            {primaryLabel && (
              <ZwButton kind={ink ? 'accent' : 'primary'} size="lg" onClick={onPrimary}
                        style={{ border: '1px solid transparent' }}>{primaryLabel}</ZwButton>
            )}
            {secondaryLabel && (
              <ZwButton kind="secondary" size="lg" onClick={onSecondary}
                        style={ink
                          ? { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }
                          : { background: 'transparent', color: 'var(--c-900)', border: '1px solid rgba(28,28,26,0.22)' }}>
                {secondaryLabel}
              </ZwButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────
// Prose — renders blog/legal body blocks
// ──────────────────────────────────────────
function ZwProse({ blocks }) {
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.t === 'h') return (
          <h2 key={i} className="txt-balance" style={{
            margin: '40px 0 14px', fontSize: 'clamp(20px, 2vw, 25px)', fontWeight: 600,
            letterSpacing: '-0.026em', lineHeight: 1.2, color: 'var(--c-900)',
          }}>{b.text}</h2>
        );
        if (b.t === 'quote') return (
          <figure key={i} style={{ margin: '34px 0', padding: '4px 0 4px 24px', borderLeft: '3px solid var(--p-500)' }}>
            <blockquote className="txt-pretty" style={{
              margin: 0, fontSize: 'clamp(19px, 1.9vw, 23px)', fontWeight: 500,
              letterSpacing: '-0.022em', lineHeight: 1.42, color: 'var(--c-900)',
            }}>{'\u201C'}{b.text}{'\u201D'}</blockquote>
            {b.who && <figcaption style={{
              marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)',
            }}>{b.who}</figcaption>}
          </figure>
        );
        if (b.t === 'list') return (
          <ul key={i} style={{ margin: '0 0 20px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {b.items.map((item, j) => (
              <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--p-500)',
                  flexShrink: 0, marginTop: 9,
                }}></span>
                <span style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--c-700)', letterSpacing: '-0.008em' }}>{item}</span>
              </li>
            ))}
          </ul>
        );
        if (b.t === 'img') return (
          <figure key={i} style={{ margin: '34px 0' }}>
            <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', aspectRatio: '16 / 9', background: 'var(--c-300)' }}>
              <ZImg src={b.src} alt={b.alt || ''} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            {b.cap && <figcaption style={{ marginTop: 10, fontSize: 13, color: 'var(--c-500)' }}>{b.cap}</figcaption>}
          </figure>
        );
        return (
          <p key={i} className="txt-pretty" style={{
            margin: '0 0 20px', fontSize: 16.5, lineHeight: 1.72,
            color: 'var(--c-700)', letterSpacing: '-0.008em',
          }}>{b.text}</p>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────
// Content page header — kicker + big title + sub, centered
// ──────────────────────────────────────────
function ZwPageHead({ kicker, title, sub, maxWidth = 720 }) {
  return (
    <div className="zw-container" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: 'clamp(52px, 7vw, 96px) var(--gutter) 0',
    }}>
      {kicker && <ZwKicker style={{ marginBottom: 16 }}>{kicker}</ZwKicker>}
      <h1 className="txt-balance" style={{
        margin: 0, fontSize: 'clamp(36px, 4.8vw, 62px)', fontWeight: 600,
        letterSpacing: '-0.045em', lineHeight: 0.98, color: 'var(--c-900)', maxWidth,
      }}>{title}</h1>
      {sub && <p className="txt-pretty" style={{
        margin: '22px 0 0', fontSize: 'clamp(15.5px, 1.4vw, 18px)', lineHeight: 1.6,
        color: 'var(--c-600)', maxWidth: 560,
      }}>{sub}</p>}
    </div>
  );
}

// —— Get-the-app band — shade band with a CSS phone mock built from the
// app's own vocabulary (search pill, overlay card), cropped at the band edge.
function ZwAppBand() {
  const store = (label) => () => window.zwToast('Opening the ' + label + '…', 'arrowR');
  const biz = (window.ZV_BUSINESSES || [])[0] || {};
  return (
    <section style={{ background: 'var(--c-shade)', marginTop: 76, overflow: 'hidden' }}>
      <div className="zw-container" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
        gap: 'clamp(28px, 4vw, 64px)', alignItems: 'end',
      }} data-feature-grid="">
        <div style={{ padding: 'clamp(44px, 6vw, 80px) 0', alignSelf: 'center' }}>
          <ZwKicker style={{ marginBottom: 14 }}>The Zavoia app</ZwKicker>
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 600,
            letterSpacing: '-0.034em', lineHeight: 1.05, color: 'var(--c-900)',
          }}>Your bookings, in your pocket</h2>
          <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 440 }}>
            Live slots, two-tap rebooking and reminders that actually remind —
            the whole marketplace, wherever you are.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
            <ZwButton kind="primary" onClick={store('App Store')}>
              <ZIcon name="phone" size={15} color="#fff"></ZIcon>
              Download for iPhone
            </ZwButton>
            <ZwButton kind="secondary" onClick={store('Play Store')}>Get it on Android</ZwButton>
          </div>
          <div style={{
            marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)',
          }}>
            <ZIcon name="star" size={12} color="var(--p-500)"></ZIcon>
            4.9 on the App Store · Free
          </div>
        </div>

        {/* Phone mock — tilted, cropped at the band's bottom edge, with a
            reminder toast floating off the bezel */}
        <div className="zw-only-desktop" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div aria-hidden="true" style={{
            width: 280, height: 360, borderRadius: '40px 40px 0 0',
            background: 'var(--c-ink)', padding: '10px 10px 0',
            boxShadow: 'var(--sh-xl)', marginTop: 48,
            transform: 'rotate(2.2deg)', transformOrigin: '50% 100%',
          }}>
            <div style={{
              background: 'var(--c-canvas)', borderRadius: '31px 31px 0 0',
              height: '100%', overflow: 'hidden', padding: '12px 14px 0',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--c-700)',
                padding: '2px 8px 10px',
              }}>
                <span>9:41</span>
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--c-500)' }}></span>)}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--c-900)', padding: '0 2px' }}>
                Good morning, Ana
              </div>
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 999,
                padding: '9px 12px', boxShadow: 'var(--sh-sm)',
              }}>
                <ZIcon name="search" size={13} color="var(--c-500)"></ZIcon>
                <span style={{ fontSize: 11.5, color: 'var(--c-500)', fontWeight: 500 }}>Balayage in Soho…</span>
              </div>
              <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', position: 'relative', height: 150, background: 'var(--c-300)' }}>
                <ZImg src={biz.photo} alt="" style={{ width: '100%', height: '100%' }}></ZImg>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%)',
                }}></div>
                <div style={{ position: 'absolute', left: 12, right: 12, bottom: 10, color: '#fff' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>{biz.name}</div>
                  <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>{'★'} {biz.rating} · {biz.city}</div>
                </div>
              </div>
              <div style={{
                marginTop: 10, background: '#fff', borderRadius: 14, padding: '10px 12px',
                border: '1px solid rgba(28,28,26,0.07)', display: 'flex', alignItems: 'center', gap: 9,
              }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--s-success-100)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ZIcon name="check" size={12} color="var(--s-success-600)"></ZIcon>
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-900)' }}>Booked — Today · 15:30</span>
              </div>
            </div>
          </div>
          {/* Floating reminder toast — half off the bezel */}
          <div aria-hidden="true" style={{
            position: 'absolute', left: 'calc(50% - 268px)', bottom: 88, width: 236,
            background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-xl)',
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11,
            transform: 'rotate(-2deg)',
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: '50%', background: 'var(--c-ink)', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ZIcon name="bell" size={15} color="#fff"></ZIcon>
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>Reminder · in 3 hours</span>
              <span style={{ display: 'block', marginTop: 1, fontSize: 11, color: 'var(--c-600)' }}>Glow Studio · 15:30 · with Mara</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// —— Newsletter — Journal subscription card
function ZwNewsletter() {
  const [email, setEmail] = useStateMK('');
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    window.zwToast('Subscribed — see you Thursday', 'check');
    setEmail('');
  };
  return (
    <section className="zw-container" style={{ marginTop: 'clamp(56px, 7vw, 88px)' }}>
      <div style={{
        background: 'var(--c-mist)', borderRadius: 'var(--r-2xl)',
        padding: 'clamp(30px, 4vw, 52px)',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'clamp(24px, 3vw, 48px)', alignItems: 'center',
      }} data-feature-grid="">
        <div>
          <ZwKicker style={{ marginBottom: 10 }}>The Journal, weekly</ZwKicker>
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 600,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--c-900)',
          }}>The best of the neighbourhood, every Thursday</h2>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="email" value={email} required placeholder="you@example.com"
                   onChange={(e) => setEmail(e.target.value)}
                   aria-label="Email address"
                   style={{
                     flex: 1, minWidth: 0, border: '1px solid rgba(28,28,26,0.14)', borderRadius: 999,
                     padding: '13px 20px', fontSize: 14.5, background: '#fff', color: 'var(--c-900)',
                     outline: 'none', letterSpacing: '-0.01em',
                   }} />
            <ZwButton kind="primary" onClick={submit}>Subscribe</ZwButton>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-500)',
          }}>One email a week · unsubscribe anytime</span>
        </form>
      </div>
    </section>
  );
}

Object.assign(window, {
  zwOpenBizDashboard, ZwBreadcrumb, ZwCheckRow, ZwFaqList, ZwCtaBand, ZwProse, ZwPageHead,
  ZwAppBand, ZwNewsletter,
});
