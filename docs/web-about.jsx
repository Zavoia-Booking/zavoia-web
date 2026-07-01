// Zavoia Web — About us. Editorial company page: mission, story, values,
// stats, cities, team.

function ZwAboutStory() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(56px, 7vw, 88px)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center',
      }} data-feature-grid="">
        <div style={{ position: 'relative' }}>
          <div style={{ borderRadius: 'var(--r-2xl)', overflow: 'hidden', aspectRatio: '4 / 4.6', background: 'var(--c-300)', boxShadow: 'var(--sh-lg)' }}>
            <ZImg src="https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80"
                  alt="Inside a Zavoia partner salon" style={{ width: '100%', height: '100%' }}></ZImg>
          </div>
          <div style={{
            position: 'absolute', right: 18, bottom: 26, background: '#fff',
            borderRadius: 16, boxShadow: 'var(--sh-xl)', padding: '13px 18px',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-700)',
          }}>London · est. 2024</div>
        </div>
        <div>
          <ZwKicker style={{ marginBottom: 14 }}>Our story</ZwKicker>
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 600,
            letterSpacing: '-0.034em', lineHeight: 1.06, color: 'var(--c-900)',
          }}>It started with a haircut nobody could book</h2>
          <p className="txt-pretty" style={{ margin: '20px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--c-700)' }}>
            Zavoia began in 2024 with a simple observation: the best local businesses are the hardest
            to book. The colourist with a three-week waitlist runs her diary on paper. The garage
            everyone trusts answers its phone between jobs. Brilliant work, invisible availability.
          </p>
          <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--c-700)' }}>
            So we built the missing layer: live calendars for the businesses, honest search for the
            people looking for them. No commission eating into a stylist's chair time, no pay-to-win
            ranking — just real slots, real reviews, and a booking that takes seconds.
          </p>
          <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.7, color: 'var(--c-700)' }}>
            Today Zavoia connects thousands of independents — salons, dentists, garages, cleaners,
            groomers — with the neighbourhoods around them, across nine cities and counting.
          </p>
        </div>
      </div>
    </section>
  );
}

const ZW_ABOUT_VALUES = [
  { n: '01', title: 'Trust is the product', body: 'Verified businesses, reviews only from completed appointments, and policies that are fair in both directions. Everything else is built on this.' },
  { n: '02', title: 'Respect the hour', body: 'A booked slot is a promise about someone\u2019s time — the client\u2019s and the professional\u2019s. We design every flow to protect both.' },
  { n: '03', title: 'Independents first', body: 'No commission, no rent-seeking, no burying small businesses under sponsored results. When the corner studio wins, the city gets better.' },
];

function ZwAboutValues() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 96px)', maxWidth: 'min(var(--content-max), 920px)' }}>
      <ZwSectionTitle kicker="What we believe" title="Three rules we don't break"></ZwSectionTitle>
      <div style={{ borderTop: '1px solid rgba(28,28,26,0.10)' }}>
        {ZW_ABOUT_VALUES.map(v => (
          <div key={v.n} style={{
            display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 'clamp(16px, 3vw, 36px)',
            padding: 'clamp(24px, 3vw, 34px) 0', borderBottom: '1px solid rgba(28,28,26,0.10)',
            alignItems: 'baseline',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 'clamp(15px, 1.6vw, 18px)', fontWeight: 600,
              letterSpacing: '0.08em', color: 'var(--p-600)',
            }}>{v.n}</span>
            <span>
              <span className="txt-balance" style={{
                display: 'block', fontSize: 'clamp(21px, 2.4vw, 28px)', fontWeight: 600,
                letterSpacing: '-0.028em', lineHeight: 1.12, color: 'var(--c-900)',
              }}>{v.title}</span>
              <span className="txt-pretty" style={{
                display: 'block', marginTop: 10, fontSize: 15.5, lineHeight: 1.62,
                color: 'var(--c-600)', maxWidth: 600,
              }}>{v.body}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ZwAboutStats() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 96px)' }}>
      <div style={{
        background: 'var(--c-ink)', color: '#fff', borderRadius: 'var(--r-2xl)',
        padding: 'clamp(32px, 4vw, 52px)', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(70% 130% at 0% 120%, color-mix(in oklch, var(--p-500) 20%, transparent) 0%, transparent 60%)',
        }}></div>
        <div className="zw-mgrid" data-cols="4" style={{ position: 'relative' }}>
          {window.ZW_MKT_STATS.map((s, i) => (
            <div key={i} style={{ borderLeft: '1px solid rgba(255,255,255,0.14)', paddingLeft: 20 }}>
              <div style={{ fontSize: 'clamp(32px, 3.4vw, 44px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.n}{s.star && <ZIcon name="star" size={20} color="var(--p-400)"></ZIcon>}
              </div>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// City photos — verified-stable Unsplash IDs, keyed by ZV_CITIES id
const ZW_CITY_PHOTOS = {
  london:     'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  manchester: 'https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=800&q=80',
  bristol:    'https://images.unsplash.com/photo-1597079910443-60c43fc4f729?w=800&q=80',
  edinburgh:  'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=800&q=80',
  leeds:      'https://images.unsplash.com/photo-1626863905121-3b0c0ed7b94c?w=800&q=80',
  liverpool:  'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=800&q=80',
  nyc:        'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  paris:      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  amsterdam:  'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
};

function ZwAboutCities({ ctx }) {
  const live = (window.ZV_CITIES || []).filter(c => c.kind === 'city' && c.live);
  const soon = (window.ZV_CITIES || []).filter(c => c.kind === 'city' && !c.live).slice(0, 3);
  return (
    <section style={{ paddingTop: 'clamp(64px, 8vw, 96px)', overflow: 'hidden' }}>
      <div className="zw-container">
        <ZwSectionTitle kicker="Where we are" title="Nine cities, more on the way"
                        action="Browse London" onAction={() => ctx.go('local/london')}></ZwSectionTitle>
      </div>
      <div className="zw-container">
        <div className="zw-scroll-x" style={{ gap: 14, paddingBottom: 8, marginRight: 'calc(-1 * var(--gutter))', paddingRight: 'var(--gutter)' }}>
          {live.map(c => (
            <div key={c.id} role="button" tabIndex={0} className="zw-hover-lift zw-zoom-parent"
                 onClick={() => ctx.go('local/' + c.id)}
                 onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('local/' + c.id); }}
                 style={{
                   position: 'relative', flex: '0 0 200px', aspectRatio: '4 / 5',
                   borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                   background: 'var(--c-300)', boxShadow: 'var(--sh-sm)', scrollSnapAlign: 'start',
                 }}>
              <div className="zw-zoom-wrap" style={{ position: 'absolute', inset: 0 }}>
                <ZImg src={ZW_CITY_PHOTOS[c.id]} alt={c.name} label="city" style={{ width: '100%', height: '100%' }}></ZImg>
              </div>
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(20,18,15,0.78) 0%, rgba(20,18,15,0.16) 48%, rgba(20,18,15,0.05) 72%)',
              }}></div>
              <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6,
                  fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--s-success-600)' }}></span>
                  Live
                </span>
                <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', letterSpacing: '-0.022em', lineHeight: 1.05 }}>{c.name}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}>{c.country}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 18, fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 500,
          letterSpacing: '0.06em', color: 'var(--c-500)', lineHeight: 1.9,
        }}>
          NEXT: {soon.map(c => c.name.toUpperCase()).join(' · ')}
        </div>
      </div>
    </section>
  );
}

const ZW_ABOUT_TEAM = [
  { name: 'Ana Petrescu',  role: 'Co-founder · CEO',         avatar: null },
  { name: 'James Okonkwo', role: 'Co-founder · CTO',         avatar: null },
  { name: 'Sofia Lindqvist', role: 'Head of Marketplace',    avatar: null },
  { name: 'Raj Mehta',     role: 'Head of Partner Success',  avatar: null },
];

function ZwAboutTeam() {
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 96px)' }}>
      <ZwSectionTitle kicker="The people" title="A small team with strong opinions"></ZwSectionTitle>
      <div className="zw-mgrid" data-cols="4">
        {ZW_ABOUT_TEAM.map(p => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', borderTop: '1px solid rgba(28,28,26,0.10)' }}>
            <ZAvatar src={p.avatar} name={p.name} size={54} ring={true}></ZAvatar>
            <span>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)' }}>{p.name}</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: 'var(--c-600)' }}>{p.role}</span>
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: '20px 0 0', fontSize: 14, color: 'var(--c-600)' }}>
        …and 30 more across London and Bucharest, most of whom you'll meet answering your support tickets.
      </p>
    </section>
  );
}

function ZwAboutPage({ ctx }) {
  return (
    <div data-screen-label="About us">
      <ZwPageHead kicker="About Zavoia"
                  title="Local is worth booking."
                  sub="We connect neighbourhoods with the independent professionals who keep them running — and give those professionals tools that used to belong only to chains."
                  maxWidth={820}></ZwPageHead>
      <ZwAboutStory></ZwAboutStory>
      <ZwAboutValues></ZwAboutValues>
      <ZwAboutStats></ZwAboutStats>
      <ZwAboutCities ctx={ctx}></ZwAboutCities>
      <ZwAboutTeam></ZwAboutTeam>
      <ZwCtaBand kicker="Join in"
                 title="Two ways into Zavoia"
                 sub="Book someone brilliant near you — or put your own business on the map."
                 primaryLabel="Explore the marketplace" onPrimary={() => ctx.go('home')}
                 secondaryLabel="Zavoia for business" onSecondary={() => ctx.go('for-business')}></ZwCtaBand>
    </div>
  );
}

window.ZW_PAGES.about = ZwAboutPage;
