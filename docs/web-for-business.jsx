// Zavoia Web — For Business landing. One plan, priced per bookable team
// member, no commission. Option C redesign: the feature grid + how-it-works
// One-screen bento + competitive comparison. Multi-industry, pay-at-venue
// (clients pay you in person — that's why there's no commission), and the
// multi-location / team-optional model. Stat dust trimmed.

const { useState: useStateFB, useEffect: useEffectFB, useRef: useRefFB } = React;

// ─────────────────────────────────────────────
// Hero — ink band, pitch left, photo + floating product moments right
// ─────────────────────────────────────────────
function ZwFbHero({ ctx }) {
  return (
    <section style={{ background: 'var(--c-ink)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(70% 110% at 85% -10%, color-mix(in oklch, var(--p-500) 22%, transparent) 0%, transparent 65%)',
      }}></div>
      <div className="zw-container" style={{
        position: 'relative', display: 'grid', gap: 'clamp(36px, 5vw, 72px)',
        gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', alignItems: 'center',
        padding: 'clamp(56px, 7vw, 110px) var(--gutter)',
      }} data-hero-grid="">
        <div>
          <ZwKicker color="var(--p-400)" style={{ marginBottom: 18 }}>Zavoia for business</ZwKicker>
          <h1 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(38px, 5vw, 66px)', fontWeight: 600,
            letterSpacing: '-0.045em', lineHeight: 0.97,
          }}>
            Your calendar, full.<br></br>
            <span style={{ color: 'rgba(255,255,255,0.42)' }}>Your revenue, untouched.</span>
          </h1>
          <p className="txt-pretty" style={{
            margin: '24px 0 0', fontSize: 'clamp(15.5px, 1.4vw, 18px)', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.68)', maxWidth: 480,
          }}>
            Salons, barbers, garages, clinics, trainers, groomers — wherever people book a time, Zavoia
            puts you in front of the clients searching nearby, with live availability, per-location
            calendars and reminders that kill no-shows. Clients pay you in person, so we never take a cut.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 34 }}>
            <ZwButton kind="accent" size="lg" onClick={zwOpenBizDashboard}>
              Get started free
              <ZIcon name="arrowR" size={17} color="#fff"></ZIcon>
            </ZwButton>
            <ZwButton kind="secondary" size="lg" onClick={() => ctx.go('pricing')}
                      style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
              See pricing
            </ZwButton>
          </div>
          <div style={{
            marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: '8px 18px',
            fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
          }}>
            <span>No commission</span><span aria-hidden="true">·</span>
            <span>No booking fees</span><span aria-hidden="true">·</span>
            <span>{window.ZW_PRICING.trialDays}-day free trial</span>
          </div>
        </div>

        {/* Client booking the business on Zavoia — the demand side, as a phone */}
        <div className="zw-only-desktop" style={{ position: 'relative', minHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="fbphone fbfloat">
            <div className="fbphone-screen">
              <div style={{ position: 'relative', aspectRatio: '16 / 10', background: 'var(--c-300)' }}>
                <ZImg src="https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=1200&q=80" alt="Glow Studio on Zavoia" style={{ width: '100%', height: '100%' }}></ZImg>
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.58))' }}></div>
                <div style={{ position: 'absolute', left: 15, right: 15, bottom: 12, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    Glow Studio
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--s-success-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ZIcon name="check" size={10} color="#fff"></ZIcon></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>
                    <ZIcon name="star" size={11} color="var(--p-400)"></ZIcon>4.9 · Hair · Soho
                  </div>
                </div>
              </div>
              <div style={{ padding: '15px 15px 17px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)' }}>Choose a time · Tue 16 Dec</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
                  {['14:00', '14:30', '15:00', '15:30', '16:30'].map(tm => {
                    const on = tm === '15:30';
                    return (
                      <span key={tm} style={{
                        fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                        padding: '7px 12px', borderRadius: 10,
                        background: on ? 'var(--c-ink)' : '#fff',
                        color: on ? '#fff' : 'var(--c-700)',
                        border: on ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.14)',
                      }}>{tm}</span>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, background: 'var(--p-500)', color: '#fff', borderRadius: 12, padding: '12px 0', textAlign: 'center', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  Confirm · Balayage + tone
                </div>
                <div style={{ marginTop: 9, textAlign: 'center', fontSize: 11, color: 'var(--c-500)' }}>Pay at the venue · free cancellation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip — marketplace scale (credible social proof, kept) */}
      <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="zw-container" style={{
          display: 'flex', flexWrap: 'wrap', gap: '14px clamp(28px, 5vw, 72px)',
          padding: '22px var(--gutter)', alignItems: 'baseline',
        }}>
          {window.ZW_MKT_STATS.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 9 }}>
              <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {s.n}{s.star && <ZIcon name="star" size={13} color="var(--p-400)" style={{ transform: 'translateY(-1px)' }}></ZIcon>}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════
// Product artifacts — real UI, reused inside the day narrative
// ═════════════════════════════════════════════
function ZwFbMomentCalendar() {
  const rows = [
    { time: '10:30', label: 'Amelia W. — Balayage + tone', state: 'booked' },
    { time: '12:00', label: 'Open slot', state: 'open' },
    { time: '13:30', label: 'Ruth P. — Gloss & blow-dry', state: 'booked' },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '14px 16px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        paddingBottom: 10, borderBottom: '1px solid rgba(28,28,26,0.07)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-500)' }}>TUE 16 DEC · MARA</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--s-success-600)' }}>
          <span className="fbpulse" aria-hidden="true"></span>Filling up
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 10 }}>
        {rows.map(r => (
          <div key={r.time} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--c-600)', width: 38, fontVariantNumeric: 'tabular-nums' }}>{r.time}</span>
            {r.state === 'booked' ? (
              <span style={{
                flex: 1, minWidth: 0, background: 'var(--p-100)', borderLeft: '3px solid var(--p-500)',
                borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, color: 'var(--c-900)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{r.label}</span>
            ) : (
              <span style={{
                flex: 1, border: '1.5px dashed rgba(28,28,26,0.18)', borderRadius: 8,
                padding: '7px 10px', fontSize: 12, fontWeight: 500, color: 'var(--c-500)',
              }}>{r.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ZwFbMomentReminder() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '15px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--c-ink)', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ZIcon name="bell" size={16} color="#fff"></ZIcon>
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>Your appointment is in 3 hours</span>
          <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'var(--c-600)' }}>Glow Studio · 15:30 · with Mara</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
        <span style={{
          flex: 1, textAlign: 'center', border: '1px solid rgba(28,28,26,0.14)', borderRadius: 999,
          padding: '7px 0', fontSize: 12, fontWeight: 600, color: 'var(--c-800)',
        }}>Reschedule</span>
        <span style={{
          flex: 1, textAlign: 'center', background: 'var(--c-ink)', borderRadius: 999,
          padding: '7px 0', fontSize: 12, fontWeight: 600, color: '#fff',
        }}>I'll be there</span>
      </div>
    </div>
  );
}

function ZwFbMomentTeam() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '15px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ZAvatar name="Ana Maris" size={44} ring={true}></ZAvatar>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>Ana Maris</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--c-600)', marginTop: 1 }}>Curls & texture · 6 yrs</span>
        </span>
        <ZwRating rating={4.9} reviews={87} size={12.5}></ZwRating>
      </div>
      <div style={{
        marginTop: 13, paddingTop: 12, borderTop: '1px dashed rgba(28,28,26,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--c-500)' }}>NEXT FREE · TODAY 17:15</span>
        <span style={{
          background: 'var(--p-500)', color: '#fff', borderRadius: 999,
          padding: '6px 13px', fontSize: 12, fontWeight: 600,
        }}>Book Ana</span>
      </div>
    </div>
  );
}

function ZwFbMomentLocations() {
  const rows = [
    { name: 'Soho', sub: '6 in the diary today', on: true },
    { name: 'Shoreditch', sub: '4 in the diary today', on: true },
    { name: 'Camden', sub: 'Opening next month', on: false },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-500)' }}>YOUR LOCATIONS</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--c-700)' }}>3 branches</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 6 }}>
        {rows.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: r.on ? 'var(--p-500)' : 'var(--c-400)' }}></span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{r.name}</span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--c-600)', marginTop: 1 }}>{r.sub}</span>
            </span>
            <ZIcon name="chevR" size={14} color="var(--c-400)"></ZIcon>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// One workspace — a bento that shows the whole product running at once,
// then the competitive case for switching. Replaces the one-at-a-time
// scroll narrative: this is a conversion page, density beats drip.
// ═════════════════════════════════════════════

// New-client demand — the business appearing in marketplace search
function ZwFbMomentSearch() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: '1px solid rgba(28,28,26,0.07)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-500)' }}>MARKETPLACE · SOHO</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-600)' }}>Top result</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingTop: 11 }}>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--c-shade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--c-700)', fontSize: 14 }}>G</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>Glow Studio</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--c-600)', marginTop: 1 }}>
            Hair · Soho <ZIcon name="check" size={11} color="var(--s-success-600)"></ZIcon> Verified
          </span>
        </span>
        <span style={{ background: 'var(--c-ink)', color: '#fff', borderRadius: 999, padding: '6px 13px', fontSize: 12, fontWeight: 600 }}>Book</span>
      </div>
      <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px dashed rgba(28,28,26,0.10)', fontSize: 12, color: 'var(--c-600)', fontWeight: 500 }}>
        Found by clients searching nearby — not ones you already had.
      </div>
    </div>
  );
}

// Verified review just in
function ZwFbMomentReview() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--sh-md)', padding: '15px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <ZAvatar name="Priya K." size={38}></ZAvatar>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>Priya K.</span>
          <ZStars value={5} size={12}></ZStars>
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--s-success-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ZIcon name="check" size={11} color="var(--s-success-600)"></ZIcon>VERIFIED
        </span>
      </div>
      <p className="txt-pretty" style={{ margin: '11px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--c-700)' }}>
        &ldquo;Best balayage in Soho — booked my next visit before I&rsquo;d left the chair.&rdquo;
      </p>
    </div>
  );
}

// Bento tile — caption (light, on the ink theatre) + artifact
function ZwFbBentoTile({ label, children }) {
  return (
    <div className="fbtile">
      <div className="fbtile-cap" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 9, paddingLeft: 2 }}>{label}</div>
      <div className="fbtile-art">{children}</div>
    </div>
  );
}

const ZW_FB_INDUSTRIES = [
  ['Salons & stylists', 'var(--cat-hair)'],
  ['Barbers', 'var(--cat-brow)'],
  ['Nails & beauty', 'var(--cat-nails)'],
  ['Spas & massage', 'var(--cat-massage)'],
  ['Skin & aesthetics', 'var(--cat-skin)'],
  ['Garages & MOT', 'var(--cat-auto)'],
  ['Dentists & clinics', 'var(--cat-dental)'],
  ['Trainers & studios', 'var(--cat-fitness)'],
  ['Pet grooming', 'var(--cat-pets)'],
  ['Cleaners & trades', 'var(--cat-trades)'],
];

function ZwFbIndustries() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(56px, 7vw, 88px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 'clamp(18px, 2vw, 26px)' }}>
        <ZwKicker>For every local service</ZwKicker>
        <span style={{ fontSize: 14.5, color: 'var(--c-600)' }}>Not just salons and spas — anywhere clients book a time.</span>
      </div>
      <div className="fbchips">
        {ZW_FB_INDUSTRIES.map(([label, c]) => (
          <span className="fbchip" key={label}>
            <span className="fbchip-dot" style={{ background: c }}></span>{label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ZwFbOverview() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 104px)' }}>
      <div style={{ maxWidth: 660, marginBottom: 'clamp(24px, 3vw, 40px)' }}>
        <ZwKicker style={{ marginBottom: 14 }}>One workspace</ZwKicker>
        <h2 className="txt-balance" style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: '-0.038em', lineHeight: 1.04, color: 'var(--c-900)' }}>
          Your whole front desk, on one screen
        </h2>
        <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 560 }}>
          Not four features you click between — the diary, new-client demand, no-show defence, reviews, team or solo calendars and every location all run at once, the moment you open the dashboard.
        </p>
      </div>
      <div className="fbtheatre">
        <div className="fbtheatre-glow" aria-hidden="true"></div>
        <div className="fbbento">
          <div className="fbbento-col">
            <ZwFbBentoTile label="Today's diary"><ZwFbMomentCalendar></ZwFbMomentCalendar></ZwFbBentoTile>
            <ZwFbBentoTile label="New-client demand"><ZwFbMomentSearch></ZwFbMomentSearch></ZwFbBentoTile>
          </div>
          <div className="fbbento-col">
            <ZwFbBentoTile label="No-show defence"><ZwFbMomentReminder></ZwFbMomentReminder></ZwFbBentoTile>
            <ZwFbBentoTile label="Verified reviews"><ZwFbMomentReview></ZwFbMomentReview></ZwFbBentoTile>
          </div>
          <div className="fbbento-col">
            <ZwFbBentoTile label="Team profiles"><ZwFbMomentTeam></ZwFbMomentTeam></ZwFbBentoTile>
            <ZwFbBentoTile label="Every location"><ZwFbMomentLocations></ZwFbMomentLocations></ZwFbBentoTile>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Why switch — Zavoia vs the two things owners are leaving
// ─────────────────────────────────────────────
const ZW_FB_COMPARE = [
  { label: 'Commission on every booking', zav: ['None, ever', 'win'], market: ['15–30% cut', 'bad'], soft: ['None', 'ok'] },
  { label: 'Brings you new clients', zav: ['Marketplace demand', 'win'], market: ['Yes — but rented', 'ok'], soft: ['No, bring your own', 'bad'] },
  { label: 'The client stays yours', zav: ['Always', 'win'], market: ['Locked to their app', 'bad'], soft: ['Yes', 'ok'] },
  { label: 'Multiple locations & team — or solo', zav: ['Built in', 'win'], market: ['Varies', 'ok'], soft: ['Varies', 'ok'] },
  { label: 'Clients pay you, in person', zav: ['Always — we never touch it', 'win'], market: ['They process & take a cut', 'bad'], soft: ['Their processor', 'ok'] },
  { label: 'Leave whenever you want', zav: ['Monthly, cancel anytime', 'win'], market: ['Varies', 'ok'], soft: ['Annual contracts', 'bad'] },
];

function ZwFbSwitch() {
  const mark = (tone) => tone === 'win'
    ? <ZIcon name="check" size={14} color="var(--p-600)"></ZIcon>
    : tone === 'bad'
      ? <ZIcon name="x" size={13} color="var(--c-400)"></ZIcon>
      : <span aria-hidden="true" style={{ width: 11, height: 2, background: 'var(--c-400)', display: 'inline-block', borderRadius: 2, flexShrink: 0 }}></span>;
  const cols = (r) => [['zav', r.zav], ['market', r.market], ['soft', r.soft]];
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 104px)' }}>
      <div style={{ maxWidth: 680, marginBottom: 'clamp(24px, 3vw, 40px)' }}>
        <ZwKicker style={{ marginBottom: 14 }}>Why owners switch</ZwKicker>
        <h2 className="txt-balance" style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 600, letterSpacing: '-0.038em', lineHeight: 1.04, color: 'var(--c-900)' }}>
          Marketplaces rent you your own clients. We don&rsquo;t.
        </h2>
        <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 560 }}>
          The big marketplaces bring clients but take a cut and keep the relationship. Standalone booking software is yours, but brings no demand. Zavoia is the only one that does both — new clients <em>and</em> ownership, with no commission.
        </p>
      </div>
      <div className="fbcompare-wrap">
        <div className="fbcompare">
          <div className="fbcompare-row fbcompare-head">
            <div className="fbcompare-rowlabel"></div>
            <div className="fbcompare-cell fbcompare-zav"><span className="fbcompare-colname">Zavoia</span></div>
            <div className="fbcompare-cell"><span className="fbcompare-colname">Marketplace apps</span></div>
            <div className="fbcompare-cell"><span className="fbcompare-colname">Booking software</span></div>
          </div>
          {ZW_FB_COMPARE.map((r, i) => (
            <div className="fbcompare-row" key={i}>
              <div className="fbcompare-rowlabel">{r.label}</div>
              {cols(r).map(([k, cell]) => (
                <div key={k} className={'fbcompare-cell' + (k === 'zav' ? ' fbcompare-zav' : '')}>
                  {mark(cell[1])}
                  <span className="fbcompare-txt" style={{ color: k === 'zav' ? 'var(--c-900)' : 'var(--c-600)', fontWeight: k === 'zav' ? 600 : 500 }}>{cell[0]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="fbswitch-cta">
        <ZwButton kind="primary" onClick={zwOpenBizDashboard}>
          Move your team over
          <ZIcon name="arrowR" size={15} color="#fff"></ZIcon>
        </ZwButton>
        <span className="fbswitch-cta-note">Free for {window.ZW_PRICING.trialDays} days · we help import your client list · no commission, ever.</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Setup strip — slim "live in an afternoon" reassurance (no big split)
// ─────────────────────────────────────────────
const ZW_FB_SETUP = [
  { n: '01', title: 'Build your profile', body: 'Photos, services and prices — every location and team member gets their own bookable page.' },
  { n: '02', title: 'Open your calendar', body: 'Set availability per location and team member. Clients see real slots and book instantly.' },
  { n: '03', title: 'Get booked', body: 'You rank in marketplace search across your city, and the rebookings follow.' },
];

function ZwFbSetup() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(56px, 7vw, 92px)' }}>
      <div style={{
        background: 'var(--c-shade)', borderRadius: 'var(--r-2xl)',
        padding: 'clamp(28px, 3.6vw, 48px) clamp(24px, 3.4vw, 48px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 'clamp(22px, 2.6vw, 34px)' }}>
          <h2 className="txt-balance" style={{ margin: 0, fontSize: 'clamp(21px, 2.3vw, 28px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>
            Live in an afternoon, not a quarter
          </h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)' }}>
            {window.ZW_PRICING.trialDays}-day free trial
          </span>
        </div>
        <div className="fbsetup">
          {ZW_FB_SETUP.map(s => (
            <div key={s.n} style={{ borderTop: '2px solid var(--c-ink)', paddingTop: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--p-600)' }}>{s.n}</span>
              <div style={{ marginTop: 8, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>{s.title}</div>
              <p className="txt-pretty" style={{ margin: '6px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--c-600)' }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Testimonials — editorial pull-quote, paged. De-slopped: no stat grid;
// the owner and the quote carry it, with one credible context line.
// ─────────────────────────────────────────────
const ZW_FB_TESTIMONIALS = [
  { biz: 'Glow Studio \u00b7 Soho',
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
    quote: 'We used to lose Tuesday mornings to the phone. Now the calendar fills itself overnight, the no-shows all but vanished, and my stylists each have their own following.',
    name: 'Dana Whitmore', role: 'Owner', context: 'Team of 7 · on Zavoia since 2024' },
  { biz: 'Maison Noir \u00b7 Shoreditch',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
    quote: 'We stopped thinking of the calendar as something to fill and started thinking of it as something to defend. Walk-ins became regulars with a rebooking habit.',
    name: 'Andrei Pop', role: 'Master barber', context: 'Team of 4 · on Zavoia since 2025' },
  { biz: 'Kepler Garage \u00b7 Bermondsey',
    photo: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&q=80',
    quote: 'Customers book an MOT at 11pm from their sofa. The phone barely rings now — and the bays stay full all week.',
    name: 'Marcus Webb', role: 'Owner', context: '6 bays · on Zavoia since 2025' },
];

function ZwFbTestimonial() {
  const [idx, setIdx] = useStateFB(0);
  const n = ZW_FB_TESTIMONIALS.length;
  const t = ZW_FB_TESTIMONIALS[idx];
  const page = (d) => setIdx((idx + d + n) % n);
  const arrow = (d, label) => (
    <button className="tap" onClick={() => page(d)} aria-label={label}
            style={{
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              background: '#fff', border: '1px solid rgba(28,28,26,0.14)',
              boxShadow: 'var(--sh-sm)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
      <ZIcon name={d < 0 ? 'chevL' : 'chevR'} size={17} color="var(--c-800)"></ZIcon>
    </button>
  );
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 104px)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <ZwKicker style={{ marginBottom: 22 }}>What owners say</ZwKicker>
        <div key={idx} style={{ animation: 'zw-page-in .42s var(--ease-out)' }}>
          <span aria-hidden="true" style={{
            display: 'block', fontFamily: 'Georgia, serif', fontSize: 64, lineHeight: 0.6,
            color: 'var(--p-500)', height: 30,
          }}>&ldquo;</span>
          <blockquote className="txt-balance" style={{
            margin: '0 auto', maxWidth: 720, fontSize: 'clamp(22px, 2.7vw, 34px)', fontWeight: 500,
            letterSpacing: '-0.03em', lineHeight: 1.3, color: 'var(--c-900)',
          }}>
            {t.quote}
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 'clamp(24px, 3vw, 36px)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}>
              <ZImg src={t.photo} alt={t.biz} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--c-900)' }}>{t.name} · {t.biz}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-600)', marginTop: 2 }}>{t.role} · {t.context}</span>
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 'clamp(28px, 3.4vw, 40px)' }}>
          {arrow(-1, 'Previous testimonial')}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em',
            color: 'var(--c-700)', fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'center',
          }}>
            0{idx + 1}<span style={{ opacity: 0.45 }}> / 0{n}</span>
          </span>
          {arrow(1, 'Next testimonial')}
        </div>
      </div>
    </section>
  );
}

// Pricing strip — one line; the detail lives on #/pricing
function ZwFbPricingStrip({ ctx }) {
  const P = window.ZW_PRICING;
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 104px)' }}>
      <div style={{
        border: '1px solid rgba(28,28,26,0.08)', borderRadius: 'var(--r-2xl)',
        background: '#fff', boxShadow: 'var(--sh-md)',
        padding: 'clamp(26px, 3vw, 40px) clamp(24px, 3.5vw, 48px)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px 36px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 'clamp(42px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>
            {P.currency}{P.monthly}
          </span>
          <span style={{ fontSize: 13.5, color: 'var(--c-600)', fontWeight: 500, lineHeight: 1.35 }}>
            per bookable team member<br></br>per month
          </span>
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)' }}>
            One plan. Every feature. No commission.
          </div>
          <div style={{ marginTop: 4, fontSize: 13.5, color: 'var(--c-600)' }}>
            {P.currency}{P.annual}/member/month billed annually · {P.trialDays}-day free trial · cancel anytime
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <ZwButton kind="primary" onClick={() => ctx.go('pricing')}>
            See full pricing
            <ZIcon name="arrowR" size={15} color="#fff"></ZIcon>
          </ZwButton>
          <ZwButton kind="secondary" onClick={zwOpenBizDashboard}>Start free trial</ZwButton>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
const ZW_FB_FAQ = [
  { q: 'Do you really take no commission?', a: 'None. Clients pay you directly, in person — Zavoia never touches the money, so there is nothing for us to take a cut of. Your subscription is the whole price.' },
  { q: 'So how do payments work?', a: 'However they already do. Clients pay you at the venue by whatever methods you accept; Zavoia handles the booking, reminders and reviews, never the transaction. That is exactly what keeps it commission-free.' },
  { q: 'Do I need a team to use it?', a: 'No. Run solo with a single calendar, or give every team member their own bookable page — your call. Appointments can sit against a location directly when there is no named person to book.' },
  { q: 'Can I run more than one location?', a: 'Yes. Keep as many locations as you like under one business, each with its own calendars, team and opening hours. You are billed per bookable calendar across all of them.' },
  { q: 'How do we get started?', a: 'Add your locations, services and anyone who takes appointments in the Zavoia Business dashboard, then open the calendar. Most businesses are live the same afternoon, and the first ' + window.ZW_PRICING.trialDays + ' days are free.' },
  { q: 'Can we leave whenever we want?', a: 'Yes — monthly, with no minimum term. Export your client list and booking history at any time; it is your data.' },
];

function ZwFbFaq() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 104px)' }}>
      <div className="fbfaq-grid">
        <div className="fbfaq-aside">
          <ZwKicker style={{ marginBottom: 14 }}>Questions</ZwKicker>
          <h2 className="txt-balance" style={{ margin: 0, fontSize: 'clamp(24px, 2.8vw, 34px)', fontWeight: 600, letterSpacing: '-0.032em', lineHeight: 1.06, color: 'var(--c-900)' }}>
            The things owners ask first
          </h2>
          <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 320 }}>
            Not sure it fits your trade? <button onClick={zwOpenBizDashboard} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--p-700)', fontWeight: 600 }}>Talk to the team</button>.
          </p>
        </div>
        <div>
          <ZwFaqList items={ZW_FB_FAQ}></ZwFaqList>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
function ZwForBusinessPage({ ctx }) {
  return (
    <div data-screen-label="For Business">
      <ZwFbHero ctx={ctx}></ZwFbHero>
      <ZwFbIndustries></ZwFbIndustries>
      <ZwFbOverview></ZwFbOverview>
      <ZwFbSwitch></ZwFbSwitch>
      <ZwFbSetup></ZwFbSetup>
      <ZwFbTestimonial></ZwFbTestimonial>
      <ZwFbPricingStrip ctx={ctx}></ZwFbPricingStrip>
      <ZwFbFaq></ZwFbFaq>
      <ZwCtaBand kicker="Zavoia for business"
                 title="Put your team in front of the whole city"
                 sub={'Free for ' + window.ZW_PRICING.trialDays + ' days. Set up in an afternoon. No commission, ever.'}
                 primaryLabel="Get started free" onPrimary={zwOpenBizDashboard}
                 secondaryLabel="See pricing" onSecondary={() => ctx.go('pricing')}></ZwCtaBand>
    </div>
  );
}

window.ZW_PAGES['for-business'] = ZwForBusinessPage;
