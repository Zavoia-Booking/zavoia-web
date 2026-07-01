// Zavoia Web — Local SEO landing pages.
//   #/local/london          → city hub (all categories × areas link hub)
//   #/local/<area>/<cat>    → "Hair salons & barbers in Soho, London"
//   #/local/london/<cat>    → city-wide category page

const { useMemo: useMemoLC } = React;

function zwLocalArea(id) {
  return (window.ZW_LOCAL_AREAS || []).find(a => a.id === id) || null;
}
function zwLocalCatMeta(catId) {
  return (window.ZW_LOCAL_CATS || {})[catId] || null;
}
function zwLocalBizFor(catId) {
  return (window.ZV_BUSINESSES || [])
    .filter(b => b.cat === catId)
    .sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
}

// ──────────────────────────────────────────
// Why-Zavoia — local pages reuse the homepage's ZwTrustBand (window-exported)
// so the trust vocabulary stays identical across surfaces.
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// Area × category page
// ──────────────────────────────────────────
function ZwLocalCatPage({ ctx, area, catId }) {
  const meta = zwLocalCatMeta(catId);
  const cat = (window.ZV_CATEGORIES || []).find(c => c.id === catId);
  const list = useMemoLC(() => zwLocalBizFor(catId), [catId]);
  const inLondon = area.id === 'london';
  const placeName = inLondon ? 'London' : area.name + ', London';
  const top = list.slice(0, 8);
  const prices = list.map(b => b.priceFrom).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const avg = list.length ? (list.reduce((s, b) => s + b.rating, 0) / list.length) : null;
  const count = cat ? cat.count : list.length;

  const otherAreas = (window.ZW_LOCAL_AREAS || []).filter(a => a.kind === 'area' && a.id !== area.id);
  const otherCats = (window.ZV_CATEGORIES || []).filter(c => c.id !== catId).slice(0, 8);

  const faq = [
    { q: 'How much does ' + meta.q + ' cost in ' + (inLondon ? 'London' : area.name) + '?',
      a: minPrice != null
        ? 'Listings here start from £' + minPrice + ', with most popular options between £' + minPrice + ' and £' + maxPrice + '. Every price is set by the business and shown before you book — what you see at confirmation is what you pay.'
        : 'Prices are set by each business and shown transparently on their profile before you book.' },
    { q: 'Can I book online and pay later?',
      a: 'Yes. Booking takes seconds and most services are pay-at-venue. Some businesses ask for a small deposit on long or peak-time appointments — always shown before you confirm.' },
    { q: 'How quickly can I get an appointment?',
      a: 'Many businesses in ' + placeName + ' list same-day availability. Use the “Available today” filter in search to see live slots for the next few hours.' },
    { q: 'What if I need to cancel?',
      a: 'Cancel or reschedule free up to 24 hours before your appointment, straight from the booking. Inside 24 hours, the business\u2019s late-cancel terms apply — they\u2019re shown when you book.' },
  ];

  return (
    <div data-screen-label={meta.noun + ' in ' + placeName}>
      <header className="zw-container" style={{ paddingTop: 'clamp(36px, 4.5vw, 56px)' }}>
        <ZwBreadcrumb items={[
          { label: 'Home', href: '#/home' },
          { label: 'London', href: '#/local/london' },
          ...(inLondon ? [] : [{ label: area.name }]),
          { label: cat ? cat.label : catId },
        ]}></ZwBreadcrumb>
        <h1 className="txt-balance" style={{
          margin: '24px 0 0', fontSize: 'clamp(32px, 4.2vw, 54px)', fontWeight: 600,
          letterSpacing: '-0.042em', lineHeight: 1, color: 'var(--c-900)', maxWidth: 760,
        }}>
          {meta.noun} in {inLondon ? 'London' : area.name}
          {!inLondon && <span style={{ color: 'var(--c-400)' }}>, London</span>}
        </h1>
        <p className="txt-pretty" style={{ margin: '18px 0 0', fontSize: 16, lineHeight: 1.62, color: 'var(--c-600)', maxWidth: 620 }}>
          {inLondon
            ? count + ' ' + meta.noun.toLowerCase() + ' take bookings on Zavoia in London'
            : meta.noun + ' across ' + area.name + ' and central London take bookings on Zavoia'}
          {avg ? ' — rated ' + avg.toFixed(1) + ' on average from verified visits' : ''}.
          See live availability, compare real prices, and book {meta.q} in a couple of clicks.
          {area.blurb ? ' ' + area.name + ': ' + area.blurb.toLowerCase() + '.' : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 26 }}>
          <ZwButton kind="primary" onClick={() => ctx.go('search')}>
            See all with live slots
            <ZIcon name="arrowR" size={15} color="#fff"></ZIcon>
          </ZwButton>
          <ZwButton kind="secondary" onClick={(e) => ctx.openSearch(e)}>{'Search ' + (cat ? cat.label.toLowerCase() + ' ' : '') + 'services'}</ZwButton>
        </div>
      </header>

      {top.length >= 3 ? (
        <ZwFeatSplit ctx={ctx} list={top}
                     kicker={'Top rated · ' + (inLondon ? 'London' : area.name)}
                     title={'The ' + (inLondon ? 'London' : area.name) + ' ' + (cat ? cat.label.toLowerCase() : '') + ' standouts'}
                     sub={'The highest-rated ' + meta.noun.toLowerCase() + ' on Zavoia' + (inLondon ? ' across the city' : ' around ' + area.name) + ' — hand-picked from verified reviews. Open a profile to see services and book.'}
                     ctaLabel="View all businesses"
                     onCta={() => ctx.go('all')}></ZwFeatSplit>
      ) : top.length > 0 && (
        <section className="zw-container" style={{ paddingTop: 'clamp(44px, 5vw, 64px)' }}>
          <ZwSectionTitle kicker={'Top rated · ' + (inLondon ? 'London' : area.name)}
                          title={'The ' + (cat ? cat.label.toLowerCase() : '') + ' shortlist'}
                          action="View all" onAction={() => ctx.go('all')}></ZwSectionTitle>
          <div className="zw-biz-grid3">
            {top.map(b => (
              <ZwBusinessCard key={b.id} b={b}
                              onClick={() => ctx.go('biz/' + b.id)}
                              favorited={ctx.favs.has(b.id)}
                              onFavorite={ctx.toggleFav}></ZwBusinessCard>
            ))}
          </div>
        </section>
      )}

      <ZwTrustBand></ZwTrustBand>

      <section className="zw-container" style={{ paddingTop: 'clamp(44px, 5vw, 64px)', maxWidth: 'min(var(--content-max), 860px)' }}>
        <ZwSectionTitle kicker="Good to know" title={'Booking ' + meta.q + ' in ' + (inLondon ? 'London' : area.name)}></ZwSectionTitle>
        <ZwFaqList items={faq}></ZwFaqList>
      </section>

      {/* Internal links — nearby areas + other categories */}
      <section className="zw-container" style={{ paddingTop: 'clamp(44px, 5vw, 64px)' }}>
        <div className="zw-mgrid" data-cols="2">
          <div>
            <ZwKicker style={{ marginBottom: 14 }}>{cat ? cat.label : ''} nearby</ZwKicker>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {otherAreas.map(a => (
                <ZwChip key={a.id} onClick={() => ctx.go('local/' + a.id + '/' + catId)}>
                  {cat ? cat.label : ''} in {a.name}
                </ZwChip>
              ))}
              {!inLondon && (
                <ZwChip onClick={() => ctx.go('local/london/' + catId)}>All of London</ZwChip>
              )}
            </div>
          </div>
          <div>
            <ZwKicker style={{ marginBottom: 14 }}>More in {inLondon ? 'London' : area.name}</ZwKicker>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {otherCats.map(c => (
                <ZwChip key={c.id} onClick={() => ctx.go('local/' + area.id + '/' + c.id)} icon={null}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ZwCatDot cat={c.id}></ZwCatDot>{c.label}
                  </span>
                </ZwChip>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ZwCtaBand tone="mist" kicker="Ready?"
                 title={'Book ' + meta.q + ' near you'}
                 sub="Live availability from verified local professionals — free cancellation up to 24h."
                 primaryLabel="Start searching" onPrimary={(e) => ctx.openSearch(e)}
                 secondaryLabel="Browse businesses" onSecondary={() => ctx.go('all')}></ZwCtaBand>
    </div>
  );
}

// ──────────────────────────────────────────
// City hub — #/local/london
// ──────────────────────────────────────────
function ZwLocalCityHub({ ctx }) {
  const areas = (window.ZW_LOCAL_AREAS || []).filter(a => a.kind === 'area');
  const cats = window.ZV_CATEGORIES || [];
  // Hand-picked: warm, interior-led photography first — not raw sort order.
  const top = useMemoLC(() => {
    const ids = ['glow-soho', 'aurum-mayfair', 'maen-bal', 'rouge-shoreditch', 'sage-massage', 'noor-hair'];
    const byId = Object.fromEntries((window.ZV_BUSINESSES || []).map(b => [b.id, b]));
    return ids.map(id => byId[id]).filter(Boolean);
  }, []);
  return (
    <div data-screen-label="Local — London hub">
      <ZwPageHead kicker="Zavoia in London"
                  title="The whole city, bookable."
                  sub="From Soho colour ateliers to Bermondsey garages — browse every neighbourhood and category Zavoia covers in London."></ZwPageHead>

      {/* Stats */}
      <div className="zw-container" style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px clamp(24px, 4vw, 56px)',
        paddingTop: 30,
      }}>
        {[['1,100+', 'London businesses'], ['6', 'neighbourhood hubs'], ['12', 'categories'], ['24/7', 'online booking']].map(([n, l]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)' }}>{l}</span>
          </span>
        ))}
      </div>

      {/* Top rated in the city */}
      <section className="zw-container" style={{ paddingTop: 'clamp(48px, 6vw, 72px)' }}>
        <ZwSectionTitle kicker="The city's finest" title="Top rated across London"
                        action="View all" onAction={() => ctx.go('all')}></ZwSectionTitle>
        <div className="zw-biz-grid3">
          {top.map(b => (
            <ZwBusinessCard key={b.id} b={b}
                            onClick={() => ctx.go('biz/' + b.id)}
                            favorited={ctx.favs.has(b.id)}
                            onFavorite={ctx.toggleFav}></ZwBusinessCard>
          ))}
        </div>
      </section>

      {/* Link hub: category → areas */}
      <section className="zw-container" style={{ paddingTop: 'clamp(56px, 7vw, 88px)' }}>
        <ZwSectionTitle kicker="Browse by neighbourhood" title="Find it where you are"></ZwSectionTitle>
        <div style={{ borderTop: '1px solid rgba(28,28,26,0.10)' }}>
          {cats.map(c => (
            <div key={c.id} className="zw-hover-row" style={{
              display: 'grid', gridTemplateColumns: 'minmax(160px, 220px) 1fr',
              gap: '12px 24px', alignItems: 'baseline', borderRadius: 12,
              padding: '16px 12px', margin: '0 -12px', borderBottom: '1px solid rgba(28,28,26,0.07)',
            }} data-biz-cols="">
              <a href={'#/local/london/' + c.id} className="zw-link"
                 style={{
                   display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none',
                   fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--c-900)',
                 }}>
                <ZwCatDot cat={c.id} size={7}></ZwCatDot>
                {c.label}
              </a>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
                {areas.map(a => (
                  <a key={a.id} href={'#/local/' + a.id + '/' + c.id} className="zw-link"
                     style={{ fontSize: 13.5, color: 'var(--c-600)', textDecoration: 'none', letterSpacing: '-0.005em' }}>
                    {a.name}
                  </a>
                ))}
                <a href={'#/local/london/' + c.id} className="zw-link"
                   style={{ fontSize: 13.5, color: 'var(--p-600)', fontWeight: 600, textDecoration: 'none' }}>
                  All London →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ZwTrustBand></ZwTrustBand>

      <ZwCtaBand tone="mist" kicker="Beyond London"
                 title="Also live in 8 more cities"
                 sub="Manchester, Bristol, Edinburgh, Leeds, Liverpool, New York, Paris and Amsterdam."
                 primaryLabel="Explore the marketplace" onPrimary={() => ctx.go('home')}
                 secondaryLabel="About Zavoia" onSecondary={() => ctx.go('about')}></ZwCtaBand>
    </div>
  );
}

// ──────────────────────────────────────────
// Router glue — parse #/local/<...>
// ──────────────────────────────────────────
function ZwLocalPage({ ctx }) {
  const id = ctx.route.id || 'london';
  const parts = id.split('/').filter(Boolean);

  // #/local/london → hub · #/local/<other-live-city> → compact city page
  if (parts.length === 1) {
    if (parts[0] === 'london') return <ZwLocalCityHub ctx={ctx}></ZwLocalCityHub>;
    const city = (window.ZV_CITIES || []).find(c => c.id === parts[0] && c.kind === 'city' && c.live);
    if (city) return <ZwLocalCityLite ctx={ctx} city={city}></ZwLocalCityLite>;
  }

  // #/local/<area>/<cat>
  if (parts.length >= 2) {
    const area = zwLocalArea(parts[0]);
    const meta = zwLocalCatMeta(parts[1]);
    if (area && meta) return <ZwLocalCatPage ctx={ctx} area={area} catId={parts[1]}></ZwLocalCatPage>;
  }
  // Unknown → hub
  return <ZwLocalCityHub ctx={ctx}></ZwLocalCityHub>;
}

// —— Other live cities — honest, compact hub (the corpus is London-first,
// so these pages point into search rather than faking local listings).
function ZwLocalCityLite({ ctx, city }) {
  const cats = window.ZV_CATEGORIES || [];
  return (
    <div data-screen-label={'Local — ' + city.name}>
      <ZwPageHead kicker={'Zavoia in ' + city.name}
                  title={city.name + ' is live.'}
                  sub={'Salons, clinics, garages and home services across ' + city.name + ' take bookings on Zavoia — with the same live availability and free 24-hour cancellation as everywhere else.'}></ZwPageHead>
      <div className="zw-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 26 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--s-success-600)',
          border: '1px solid rgba(28,28,26,0.10)', background: '#fff', borderRadius: 999, padding: '8px 16px',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--s-success-600)' }}></span>
          Live · onboarding new businesses weekly
        </span>
      </div>
      <section className="zw-container" style={{ paddingTop: 'clamp(44px, 5vw, 64px)', maxWidth: 'min(var(--content-max), 920px)' }}>
        <ZwSectionTitle kicker="Browse" title={'What\u2019s bookable in ' + city.name}></ZwSectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {cats.map(c => (
            <ZwChip key={c.id} onClick={() => ctx.go('search')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ZwCatDot cat={c.id}></ZwCatDot>{c.label}
              </span>
            </ZwChip>
          ))}
        </div>
      </section>
      <ZwTrustBand></ZwTrustBand>
      <ZwCtaBand tone="mist" kicker={city.name}
                 title={'Find your next regular in ' + city.name}
                 sub="Run a business here? The marketplace is open — no commission, priced per team member."
                 primaryLabel="Start searching" onPrimary={(e) => ctx.openSearch(e)}
                 secondaryLabel="List your business" onSecondary={() => ctx.go('for-business')}></ZwCtaBand>
    </div>
  );
}

window.ZW_PAGES.local = ZwLocalPage;
