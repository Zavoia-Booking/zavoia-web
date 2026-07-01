// Zavoia Web — Homepage. Editorial / luxe direction carried over from the
// app: generous type, single hero search split What/Where/When, category
// row, visits strip (returning users), availability-first grid, editorial
// offers, ranked "near you" feed.

const { useState: useStateHM, useMemo: useMemoHM, useEffect: useEffectHM, useRef: useRefHM } = React;

// ─────────────────────────────────────────────
// Hero command-search — single expressive input with a live typewriter
// placeholder that expands into a "popular right now" suggestion panel.
// Distinct from the segmented What/Where/When pill (which still lives in
// the nav + overlay for in-app searches).
// ─────────────────────────────────────────────
const ZW_HERO_PROMPTS = [
  'balayage in Soho',
  'a deep-tissue massage tonight',
  'the best barber in Shoreditch',
  'gel nails this weekend',
  'a dental check-up near me',
];

function useTypewriter(active) {
  const [text, setText] = useStateHM('');
  useEffectHM(() => {
    if (!active) { setText(''); return; }
    let pi = 0, ci = 0, dir = 1, t;
    const tick = () => {
      const full = ZW_HERO_PROMPTS[pi];
      ci += dir;
      setText(full.slice(0, Math.max(0, ci)));
      if (dir > 0 && ci >= full.length) { dir = -1; t = setTimeout(tick, 1700); return; }
      if (dir < 0 && ci <= 0) { dir = 1; pi = (pi + 1) % ZW_HERO_PROMPTS.length; t = setTimeout(tick, 360); return; }
      t = setTimeout(tick, dir > 0 ? 52 : 26);
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
  }, [active]);
  return text;
}

function ZwHeroSearch({ ctx }) {
  const tw = useTypewriter(true);
  return (
    <div role="button" tabIndex={0} onClick={ctx.openSearch}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ctx.openSearch(); } }}
         className="zw-hover-lift"
         style={{
           display: 'flex', alignItems: 'center', width: '100%', maxWidth: 640, cursor: 'text',
           background: '#fff', borderRadius: 999, border: '1px solid rgba(28,28,26,0.07)',
           boxShadow: '0 1px 2px rgba(28,28,26,0.04), 0 8px 24px rgba(28,28,26,0.07), 0 24px 56px rgba(28,28,26,0.09)',
           padding: '9px 9px 9px 22px',
         }}>
      <ZIcon name="search" size={20} color="var(--c-500)"></ZIcon>
      <span style={{
        flex: 1, minWidth: 0, marginLeft: 14, fontSize: 17, fontWeight: 500, color: 'var(--c-500)',
        letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'left',
      }}>
        Try “{tw}”<span className="zw-caret" style={{ display: 'inline-block', width: 2, height: '1.05em', background: 'var(--p-500)', marginLeft: 2, verticalAlign: 'text-bottom' }}></span>
      </span>
      <button className="tap" aria-label="Search"
              onClick={(e) => { e.stopPropagation(); ctx.openSearch(e.currentTarget.parentElement); }}
              style={{
                width: 54, height: 54, borderRadius: '50%', border: 0, cursor: 'pointer', flexShrink: 0,
                background: 'radial-gradient(125% 125% at 32% 24%, color-mix(in oklch, var(--p-400) 55%, var(--p-500)) 0%, var(--p-600) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 1px 2px rgba(28,28,26,0.10), 0 8px 22px color-mix(in oklch, var(--p-500) 42%, transparent)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
        <ZIcon name="search" size={20} color="#fff"></ZIcon>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero — shade band, headline left, photo stack right
// ─────────────────────────────────────────────
function ZwHero({ ctx }) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(135% 95% at 50% -12%, #FDFCF8 0%, #F4F1E8 48%, var(--c-shade) 100%)',
      borderBottom: '1px solid rgba(28,28,26,0.05)',
    }}>
      {/* subtle ZAVOIA wordmark artwork */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 'clamp(180px, 28vw, 420px)', fontWeight: 700, letterSpacing: '-0.05em',
          color: 'rgba(28,28,26,0.027)', whiteSpace: 'nowrap', lineHeight: 1, userSelect: 'none',
          transform: 'translateY(8%)',
        }}>ZAVOIA</span>
      </div>
      {/* soft focus glow behind the search */}
      <div aria-hidden="true" style={{
        position: 'absolute', left: '50%', top: '62%', transform: 'translate(-50%, -50%)',
        width: 760, height: 360, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(closest-side, color-mix(in oklch, var(--p-400) 9%, transparent) 0%, transparent 100%)',
      }}></div>
      <div className="zw-container" style={{
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: 'clamp(76px, 10vw, 148px) var(--gutter)',
      }}>
        <h1 className="txt-balance zw-rise" style={{
          margin: 0, fontSize: 'clamp(48px, 6.6vw, 88px)', fontWeight: 600,
          letterSpacing: '-0.052em', lineHeight: 0.93, color: 'var(--c-900)', maxWidth: 1000,
        }}>
          Book the city's best,<br></br>
          <span style={{ color: 'var(--c-400)' }}>in seconds.</span>
        </h1>
        <p className="txt-pretty zw-rise" data-d="1" style={{
          margin: '26px 0 48px', fontSize: 'clamp(16px, 1.5vw, 19px)',
          lineHeight: 1.55, color: 'var(--c-600)', maxWidth: 540,
        }}>
          See real-time availability from trusted local professionals — and reserve in a couple of clicks.
        </p>
        <div className="zw-rise" data-d="2" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <ZwHeroSearch ctx={ctx}></ZwHeroSearch>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Category rail
// ─────────────────────────────────────────────
function ZwCategoryRail({ ctx }) {
  return (
    <section className="zw-container" style={{ paddingTop: 44 }}>
      <div className="zw-scroll-x" style={{ gap: 6, paddingBottom: 6 }}>
        {window.ZV_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => ctx.go('search')} className="tap"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    background: 'transparent', border: 0, cursor: 'pointer',
                    borderRadius: 16, padding: '8px 8px 6px',
                    minWidth: 92, flexShrink: 0, scrollSnapAlign: 'start',
                  }}>
            <span className="zw-hover-lift" style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#fff', border: '1px solid rgba(28,28,26,0.07)',
              boxShadow: 'var(--sh-sm)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ZIcon name={c.icon} size={21} color={c.dot}></ZIcon>
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--c-700)', letterSpacing: '-0.01em' }}>
              {c.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Visits strip — returning users only
// ─────────────────────────────────────────────
function ZwVisitStrip({ ctx }) {
  const appts = (window.ZV_RECENT_APPTS || []).filter(a => a.tense !== 'past').slice(0, 4);
  if (!appts.length) return null;
  const toneFor = (a) => {
    if (a.statusTone === 'warning' || a.statusTone === 'error') return { color: 'var(--s-warning-600)', label: a.status || 'Cancelled' };
    if (a.tense === 'now') return { color: 'var(--s-success-600)', label: 'In progress' };
    if (a.statusTone === 'pending') return { color: 'var(--s-warning-600)', label: 'Pending' };
    return { color: 'var(--p-600)', label: a.status || 'Confirmed' };
  };
  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <ZwSectionTitle kicker="Your visits" title="Coming up"
                      action="All appointments" onAction={() => ctx.go('appointments')}></ZwSectionTitle>
      <div className="zw-scroll-x" style={{ gap: 14, paddingBottom: 6 }}>
        {appts.map(a => {
          const tone = toneFor(a);
          const services = a.services && a.services.length ? a.services[0] : a.service;
          const timeStr = a.tense === 'now' ? `Today · ${a.time}` : `${a.rel || (a.day + ' ' + a.date)} · ${a.time}`;
          return (
            <div key={a.id} role="button" tabIndex={0} className="zw-hover-lift"
                 onClick={() => ctx.go('appt/' + a.id)}
                 style={{
                   display: 'flex', width: 360, flexShrink: 0, cursor: 'pointer',
                   background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
                   borderRadius: 'var(--card-r, 18px)', overflow: 'hidden', boxShadow: 'var(--sh-sm)',
                   scrollSnapAlign: 'start',
                 }}>
              <div className="zw-zoom-wrap" style={{ width: 118, flexShrink: 0, background: 'var(--c-300)', position: 'relative' }}>
                <ZImg src={a.photo} alt={a.business} label={a.cat} style={{ width: '100%', height: '100%' }}></ZImg>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                  letterSpacing: '0.10em', textTransform: 'uppercase', color: tone.color,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone.color }}></span>
                  {tone.label}
                </span>
                <span style={{
                  fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{services}</span>
                <span style={{ fontSize: 13, color: 'var(--c-600)' }}>{a.business}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
                  color: 'var(--c-700)', marginTop: 'auto',
                }}>{timeStr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Personalized rails (Book again · Recently viewed) + availability-first grid
// ─────────────────────────────────────────────
// Book again — your providers, one tap back into the booking drawer.
function ZwRebookRow({ ctx }) {
  const pros = (window.ZV_YOUR_PROVIDERS || []).slice(0, 3);
  if (!pros.length) return null;
  const bizFor = (p) => (window.ZV_BUSINESSES || []).find(b => {
    const a = b.name.toLowerCase(), c = p.business.toLowerCase();
    return a.includes(c) || c.includes(a);
  });
  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <ZwSectionTitle kicker="Your people" title="Book again"></ZwSectionTitle>
      <div className="zw-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
        {pros.map(p => {
          const biz = bizFor(p);
          return (
            <div key={p.id} className="zw-hover-lift" style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
              borderRadius: 'var(--card-r, 18px)', padding: '14px 16px', boxShadow: 'var(--sh-sm)',
            }}>
              <img src={p.avatar} alt={p.stylist} style={{
                width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                boxShadow: '0 0 0 1px rgba(28,28,26,0.08)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.stylist}</div>
                <div style={{
                  fontSize: 12.5, color: 'var(--c-600)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.role} · {p.business}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                  letterSpacing: '0.04em', color: 'var(--s-success-600)', marginTop: 5,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>NEXT FREE · {p.nextSlot.toUpperCase()}</div>
              </div>
              <ZwButton kind="secondary" size="sm"
                        onClick={() => ctx.openBooking(biz ? { bizId: biz.id, proName: p.stylist } : { proName: p.stylist })}>
                Rebook
              </ZwButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Recently viewed — reads the localStorage trail written by the router.
function ZwRecentlyViewed({ ctx }) {
  const list = useMemoHM(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('zw-recent-views') || '[]');
      return ids.map(id => (window.ZV_BUSINESSES || []).find(b => b.id === id)).filter(Boolean).slice(0, 6);
    } catch (e) { return []; }
  }, []);
  if (list.length < 2) return null;
  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <ZwSectionTitle kicker="Pick up where you left off" title="Recently viewed"></ZwSectionTitle>
      <div className="zw-scroll-x" style={{ gap: 14, paddingBottom: 6 }}>
        {list.map(b => (
          <div key={b.id} role="button" tabIndex={0} className="zw-hover-lift zw-zoom-parent"
               onClick={() => ctx.go('biz/' + b.id)}
               onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('biz/' + b.id); }}
               style={{
                 width: 224, flexShrink: 0, cursor: 'pointer', scrollSnapAlign: 'start',
                 background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
                 borderRadius: 'var(--card-r, 18px)', overflow: 'hidden', boxShadow: 'var(--sh-sm)',
               }}>
            <div className="zw-zoom-wrap" style={{ aspectRatio: '16 / 10', background: 'var(--c-300)' }}>
              <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            <div style={{ padding: '11px 14px 13px' }}>
              <div style={{
                fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{b.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <ZwRating rating={b.rating} size={12}></ZwRating>
                <span style={{ color: 'var(--c-400)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--c-600)' }}>{b.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ZwAvailableToday({ ctx }) {
  const list = window.ZV_BUSINESSES.filter(b => b.availableToday).slice(0, 6);
  return (
    <section className="zw-container" style={{ paddingTop: 60 }}>
      <ZwSectionTitle kicker="Real-time availability" title="Available today near you"
                      action="See all" onAction={() => ctx.go('search')}></ZwSectionTitle>
      <div className="zw-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))', gap: 18 }}>
        {list.map(b => (
          <ZwBusinessOverlayCard key={b.id} b={b}
                          favorited={ctx.favs.has(b.id)}
                          onFavorite={ctx.toggleFav}
                          onClick={() => ctx.go('biz/' + b.id)}></ZwBusinessOverlayCard>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Editor's pick — full-bleed mist band feature
// ─────────────────────────────────────────────
function ZwEditorsPick({ ctx }) {
  const b = window.ZV_BUSINESSES.find(x => x.id === 'glow-soho') || window.ZV_BUSINESSES[0];
  return (
    <section style={{ background: 'var(--c-mist)', marginTop: 64 }}>
      <div className="zw-container" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 6fr) minmax(0, 5fr)',
        gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center',
        padding: 'clamp(36px, 5vw, 64px) var(--gutter)',
      }} data-feature-grid="1">
        <div className="zw-zoom-wrap zw-zoom-parent" role="button" tabIndex={0}
             onClick={() => ctx.go('biz/' + b.id)}
             style={{
               borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
               aspectRatio: '4 / 2.8', background: 'var(--c-300)', boxShadow: 'var(--sh-lg)',
             }}>
          <ZImg src={b.photo} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
        </div>
        <div>
          <ZwKicker style={{ marginBottom: 14 }}>Editor's pick</ZwKicker>
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 600,
            letterSpacing: '-0.035em', lineHeight: 1.05, color: 'var(--c-900)',
          }}>{b.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 12px' }}>
            <ZwRating rating={b.rating} reviews={b.reviews} size={14}></ZwRating>
            <span style={{ color: 'var(--c-400)' }}>·</span>
            <span style={{ fontSize: 14, color: 'var(--c-600)' }}>{b.city}</span>
          </div>
          <p className="txt-pretty" style={{
            margin: '0 0 26px', fontSize: 16, lineHeight: 1.6, color: 'var(--c-700)', maxWidth: 420,
          }}>
            {b.blurb} A Soho favourite for lived-in colour — and one of the most
            rebooked studios on Zavoia this month.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ZwButton kind="primary" size="lg" onClick={() => ctx.go('biz/' + b.id)}>View studio</ZwButton>
            <ZwButton kind="secondary" size="lg"
                      onClick={() => ctx.openBooking({ bizId: b.id })}>Book now</ZwButton>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Offers — editorial promos row
// ─────────────────────────────────────────────
function ZwOffersRow({ ctx }) {
  const promos = (window.ZV_PROMOS || []).slice(0, 3);
  return (
    <section style={{ background: 'var(--c-mist)', marginTop: 64 }}>
      <div className="zw-container" style={{ padding: 'clamp(44px, 5.5vw, 72px) var(--gutter)' }}>
      <ZwSectionTitle kicker="Offers" title="Worth booking this week"
                      action="See all offers" onAction={() => ctx.go('offers')}></ZwSectionTitle>
      <div className="zw-offers-grid">
        {promos.map(p => (
          <div key={p.id} role="button" tabIndex={0} className="zw-hover-lift zw-zoom-parent"
               onClick={() => ctx.go('offers')}
               style={{
                 position: 'relative', borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
                 aspectRatio: '4 / 4.6', background: 'var(--c-300)', boxShadow: 'var(--sh-sm)',
               }}>
            <div className="zw-zoom-wrap" style={{ position: 'absolute', inset: 0 }}>
              <ZImg src={p.photo} alt={p.title} label={p.cat} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(20,18,15,0.82) 0%, rgba(20,18,15,0.25) 45%, rgba(20,18,15,0.05) 70%)',
            }}></div>
            <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)',
                marginBottom: 10,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.accent }}></span>
                {p.kicker}
              </span>
              <div className="txt-balance" style={{
                fontSize: 'clamp(20px, 1.8vw, 24px)', fontWeight: 600, color: '#fff',
                letterSpacing: '-0.025em', lineHeight: 1.12, marginBottom: 6,
              }}>{p.title}</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)', marginBottom: 16 }}>{p.sub}</div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.95)', color: 'var(--c-900)',
                padding: '9px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              }}>
                {p.cta}
                <ZIcon name="arrowR" size={14} color="var(--c-900)"></ZIcon>
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// More near you — ranked feed
// ─────────────────────────────────────────────
function ZwNearYou({ ctx }) {
  const [count, setCount] = useStateHM(8);
  const list = window.ZV_BUSINESSES.slice(0, count);
  return (
    <section className="zw-container" style={{ paddingTop: 64 }}>
      <ZwSectionTitle kicker="Near you" title="More places in Soho"
                      action="Open map" onAction={() => ctx.go('search')}></ZwSectionTitle>
      <div className="zw-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
        {list.map(b => (
          <ZwBusinessFeedCard key={b.id} b={b}
                          onClick={() => ctx.go('biz/' + b.id)}></ZwBusinessFeedCard>
        ))}
      </div>
      {count < window.ZV_BUSINESSES.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
          <ZwButton kind="secondary" size="lg" onClick={() => setCount(c => c + 8)}>Show more places</ZwButton>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Trust closer — quiet three-up band above the footer
// ─────────────────────────────────────────────
function ZwTrustBand() {
  const items = [
    { icon: 'shield', title: 'Verified professionals',
      sub: 'Every business is identity-checked before it can take bookings.' },
    { icon: 'cal',    title: 'Free cancellation',
      sub: 'Plans change — cancel free up to 24 hours before your visit.' },
    { icon: 'wallet', title: 'Pay at the venue',
      sub: 'Nothing upfront. Settle directly with the business after your visit.' },
  ];
  return (
    <section className="zw-container" style={{ paddingTop: 76 }}>
      <div style={{
        borderTop: '1px solid rgba(28,28,26,0.10)', paddingTop: 40,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'clamp(24px, 4vw, 56px)',
      }}>
        {items.map(it => (
          <div key={it.title} style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
            <span style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: '#fff', border: '1px solid rgba(28,28,26,0.08)', boxShadow: 'var(--sh-sm)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ZIcon name={it.icon} size={17} color="var(--p-600)"></ZIcon>
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)' }}>{it.title}</span>
              <span className="txt-pretty" style={{ display: 'block', fontSize: 13.5, lineHeight: 1.5, color: 'var(--c-600)', marginTop: 4, maxWidth: 300 }}>{it.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
// —— For-business strip — slim ink closer above the footer. The deep pitch
// lives on #/for-business; this is just the doorway.
function ZwBizStrip({ ctx }) {
  return (
    <section className="zw-container" style={{ paddingTop: 64 }}>
      <div style={{
        background: 'var(--c-ink)', color: '#fff', borderRadius: 'var(--r-2xl)',
        padding: 'clamp(26px, 3vw, 40px) clamp(24px, 3.5vw, 48px)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(60% 140% at 100% 0%, color-mix(in oklch, var(--p-500) 22%, transparent) 0%, transparent 60%)',
        }}></div>
        <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 0 }}>
          <ZwKicker color="var(--p-400)" style={{ marginBottom: 8 }}>Own a local business?</ZwKicker>
          <div className="txt-balance" style={{
            fontSize: 'clamp(20px, 2.2vw, 27px)', fontWeight: 600,
            letterSpacing: '-0.028em', lineHeight: 1.12,
          }}>Put your team in front of the whole city.</div>
          <div style={{
            marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
          }}>No commission · £18 per team member · live in an afternoon</div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ZwButton kind="accent" onClick={() => ctx.go('for-business')}>
            Zavoia for business
            <ZIcon name="arrowR" size={15} color="#fff"></ZIcon>
          </ZwButton>
          <ZwButton kind="secondary" onClick={() => ctx.go('pricing')}
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
            Pricing
          </ZwButton>
        </div>
      </div>
    </section>
  );
}

function ZwHomePage({ ctx }) {
  return (
    <div data-screen-label="Home">
      <ZwHero ctx={ctx}></ZwHero>
      <ZwCategoryRail ctx={ctx}></ZwCategoryRail>
      {ctx.userState === 'returning' && <ZwVisitStrip ctx={ctx}></ZwVisitStrip>}
      {ctx.userState === 'returning' && <ZwRebookRow ctx={ctx}></ZwRebookRow>}
      <ZwAvailableToday ctx={ctx}></ZwAvailableToday>
      <ZwRecentlyViewed ctx={ctx}></ZwRecentlyViewed>
      <ZwFeaturedSection ctx={ctx}></ZwFeaturedSection>
      <ZwOffersRow ctx={ctx}></ZwOffersRow>
      <ZwNearYou ctx={ctx}></ZwNearYou>
      <ZwAppBand></ZwAppBand>
      <ZwTrustBand></ZwTrustBand>
      <ZwBizStrip ctx={ctx}></ZwBizStrip>
    </div>
  );
}

window.ZW_PAGES.home = ZwHomePage;
Object.assign(window, { ZwTrustBand });
