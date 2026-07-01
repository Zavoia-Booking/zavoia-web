// Zavoia Web — Offers. The full listing behind the home "Offers" row.
// Editorial promo cards with the fine print the home row can't carry:
// what's included, who's eligible, when it expires, and pay-at-venue.
// Each card hands off to the businesses running it.

const { useMemo: useMemoOF } = React;

// Fine print per promo — the home row only shows the headline; the
// offers page is where terms + expiry live (mirrors the app's offers
// page handing off to a location page for the detail).
const ZW_OFFER_TERMS = {
  'p-first': {
    expires: 'No expiry · new accounts',
    badge: 'One-time credit',
    terms: ['Applied automatically at your first confirmed booking', 'Any service, any city on Zavoia', 'Not combinable with other promos'],
    dest: 'all',
  },
  'p-spring': {
    expires: 'Ends Sun 31 May',
    badge: '20% off',
    terms: ['Valid on colour services with participating W1 stylists', 'Discount shown at checkout — pay at the venue', 'Subject to stylist availability'],
    dest: 'local/london/hair',
  },
  'p-auto': {
    expires: 'All of May',
    badge: '£45 off',
    terms: ['MOT booked together with a full service', '24 participating garages across London', 'Keep your renewal date when booked early'],
    dest: 'local/london/auto',
  },
  'p-quiet': {
    expires: 'Weekday mornings',
    badge: 'Off-peak',
    terms: ['Best rates on 9–11am weekday slots', 'Shown automatically when you pick an off-peak time'],
    dest: 'search',
  },
  'p-massage': {
    expires: 'While slots last',
    badge: 'Last-minute',
    terms: ['Same-day openings at wellness studios near you', 'Pay at the venue · free cancellation up to 24h before'],
    dest: 'local/london/massage',
  },
};

function zwOfferTerms(p) {
  return ZW_OFFER_TERMS[p.id] || { expires: 'Limited time', badge: 'Offer', terms: ['Pay at the venue · free cancellation up to 24h before'], dest: 'all' };
}

// ── Large lead offer ──
function ZwOfferHero({ p, ctx }) {
  const t = zwOfferTerms(p);
  return (
    <div className="zw-hover-lift zw-zoom-parent" role="button" tabIndex={0}
         onClick={() => ctx.go(t.dest)} onKeyDown={(e) => { if (e.key === 'Enter') ctx.go(t.dest); }}
         style={{
           position: 'relative', borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
           minHeight: 360, background: 'var(--c-300)', boxShadow: 'var(--sh-md)',
           display: 'flex', alignItems: 'flex-end',
         }}>
      <div className="zw-zoom-wrap" style={{ position: 'absolute', inset: 0 }}>
        <ZImg src={p.photo} alt={p.title} label={p.cat} style={{ width: '100%', height: '100%' }}></ZImg>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,18,15,0.86) 0%, rgba(20,18,15,0.28) 50%, rgba(20,18,15,0.04) 78%)' }}></div>
      <div style={{ position: 'relative', padding: 'clamp(24px, 3vw, 38px)', maxWidth: 560 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.86)', marginBottom: 12,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.accent }}></span>
          {p.kicker}
        </span>
        <div className="txt-balance" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>{p.title}</div>
        <div style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.82)', marginTop: 12, maxWidth: 460 }} className="txt-pretty">{p.sub}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.95)',
            color: 'var(--c-900)', padding: '11px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600,
          }}>
            {p.cta}
            <ZIcon name="arrowR" size={15} color="var(--c-900)"></ZIcon>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>{t.expires}</span>
        </div>
      </div>
    </div>
  );
}

// ── Standard offer row ──
function ZwOfferCard({ p, ctx }) {
  const t = zwOfferTerms(p);
  return (
    <div className="zw-hover-lift" role="button" tabIndex={0}
         onClick={() => ctx.go(t.dest)} onKeyDown={(e) => { if (e.key === 'Enter') ctx.go(t.dest); }}
         style={{
           display: 'flex', background: '#fff', cursor: 'pointer', overflow: 'hidden',
           border: '1px solid rgba(28,28,26,0.07)', borderRadius: 'var(--card-r, 18px)', boxShadow: 'var(--sh-sm)',
         }}>
      <div className="zw-zoom-wrap" style={{ width: 'clamp(140px, 26%, 240px)', flexShrink: 0, background: 'var(--c-300)', position: 'relative' }}>
        <ZImg src={p.photo} alt={p.title} label={p.cat} style={{ width: '100%', height: '100%' }}></ZImg>
        <span style={{
          position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 999,
          fontSize: 10.5, fontWeight: 700, color: 'var(--c-900)', letterSpacing: '-0.005em',
        }}>{t.badge}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: 'clamp(18px, 2.4vw, 26px)', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent }}></span>
          {p.kicker}
        </span>
        <div style={{ fontSize: 'clamp(19px, 2vw, 23px)', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--c-900)', lineHeight: 1.12 }} className="txt-balance">{p.title}</div>
        <div style={{ fontSize: 14, color: 'var(--c-600)' }} className="txt-pretty">{p.sub}</div>
        <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {t.terms.map((line, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--c-700)', lineHeight: 1.4 }}>
              <ZIcon name="check" size={13} color="var(--s-success-600)" style={{ marginTop: 2, flexShrink: 0 }}></ZIcon>
              <span className="txt-pretty">{line}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 'auto', paddingTop: 12, flexWrap: 'wrap' }}>
          <ZwButton kind="primary" size="sm" onClick={(e) => { e.stopPropagation(); ctx.go(t.dest); }}>
            {p.cta}
            <ZIcon name="arrowR" size={14} color="#fff"></ZIcon>
          </ZwButton>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--c-500)' }}>
            <ZIcon name="clock" size={13} color="var(--c-500)"></ZIcon>
            {t.expires}
          </span>
        </div>
      </div>
    </div>
  );
}

function ZwOffersPage({ ctx }) {
  const promos = window.ZV_PROMOS || [];
  const [lead, ...rest] = promos;

  return (
    <div data-screen-label="Offers" className="zw-container" style={{ paddingTop: 44, width: '100%' }}>
      <ZwKicker style={{ marginBottom: 10 }}>Offers</ZwKicker>
      <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 600, letterSpacing: '-0.038em', color: 'var(--c-900)' }} className="txt-balance">
        Worth booking this week
      </h1>
      <p className="txt-pretty" style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 540 }}>
        Credits, seasonal deals and last-minute openings from businesses across London. Pay at the venue — nothing's charged until your visit.
      </p>

      {lead && (
        <div style={{ marginTop: 34 }}>
          <ZwOfferHero p={lead} ctx={ctx}></ZwOfferHero>
        </div>
      )}

      <div style={{
        marginTop: 18, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16,
      }}>
        {rest.map(p => <ZwOfferCard key={p.id} p={p} ctx={ctx}></ZwOfferCard>)}
      </div>

      {/* Trust closer */}
      <div style={{
        marginTop: 34, padding: '20px 24px', background: 'var(--c-shade)', borderRadius: 18,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        <ZIcon name="shield" size={18} color="var(--s-success-600)"></ZIcon>
        <span style={{ fontSize: 14, color: 'var(--c-700)', flex: 1, minWidth: 200 }} className="txt-pretty">
          Every offer is honoured at the venue. Discounts show before you confirm, and free cancellation still applies.
        </span>
        <ZwButton kind="secondary" size="sm" onClick={() => ctx.go('legal/cancellation')}>Cancellation policy</ZwButton>
      </div>
    </div>
  );
}

window.ZW_PAGES.offers = ZwOffersPage;
