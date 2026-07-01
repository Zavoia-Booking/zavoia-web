// Zavoia Web — Business / location detail page.
// Two-column web layout: gallery + tabbed content left, sticky booking
// rail right. Service selection syncs into the rail and hands off to the
// booking drawer. Mobile collapses to one column + bottom booking bar.

const { useState: useStateBZ, useMemo: useMemoBZ, useEffect: useEffectBZ } = React;

function zwFmtPrice(v, cur = '£') { return v == null ? '' : `${cur}${v}`; }
function zwFmtDur(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ─────────────────────────────────────────────
// Service menus. Glow Studio uses the real app dataset; other
// categories get a compact plausible menu so the funnel stays clickable.
// ─────────────────────────────────────────────
const ZW_CAT_MENUS = {
  massage: [{ cat: 'Massage', dot: 'var(--cat-massage)', items: [
    { id: 'm-deep',  name: 'Deep tissue massage',  desc: 'Targeted pressure for chronic tension.', dur: 60, price: 75 },
    { id: 'm-sport', name: 'Sports massage',       desc: 'Recovery-focused, pre/post training.',   dur: 45, price: 65 },
    { id: 'm-hot',   name: 'Hot stone massage',    desc: 'Warm basalt stones, full body.',          dur: 75, price: 95 },
    { id: 'm-pre',   name: 'Prenatal massage',     desc: 'Side-lying, certified therapist.',        dur: 60, price: 80 },
  ]}],
  nails: [{ cat: 'Nails', dot: 'var(--cat-nails)', items: [
    { id: 'n-mani', name: 'Classic manicure',   desc: 'Shape, cuticle care, polish.',          dur: 40, price: 28 },
    { id: 'n-gel',  name: 'Gel manicure',       desc: 'Long-wear gel, LED cured.',             dur: 60, price: 42 },
    { id: 'n-pedi', name: 'Spa pedicure',       desc: 'Soak, exfoliation, massage, polish.',   dur: 55, price: 46 },
    { id: 'n-art',  name: 'Nail art (per set)', desc: 'Hand-painted detail work.',             dur: 30, price: 25 },
  ]}],
  skin: [{ cat: 'Skin & Face', dot: 'var(--cat-skin)', items: [
    { id: 's-sig',  name: 'Signature facial',   desc: 'Cleanse, exfoliate, mask, massage.',    dur: 60, price: 70 },
    { id: 's-peel', name: 'Chemical peel',      desc: 'Clinical-grade resurfacing.',           dur: 45, price: 90 },
    { id: 's-mn',   name: 'Microneedling',      desc: 'Collagen induction therapy.',           dur: 60, price: 120 },
    { id: 's-lymp', name: 'Lymphatic drainage', desc: 'Sculpting facial massage.',             dur: 50, price: 65 },
  ]}],
  brow: [{ cat: 'Brow & Lash', dot: 'var(--cat-brow)', items: [
    { id: 'b-shape', name: 'Brow shape & tint', desc: 'Mapping, wax, tint.',                   dur: 30, price: 24 },
    { id: 'b-lam',   name: 'Brow lamination',   desc: 'Set, lift and style.',                  dur: 45, price: 42 },
    { id: 'b-lift',  name: 'Lash lift & tint',  desc: 'Natural curl, 6–8 week hold.',          dur: 50, price: 48 },
  ]}],
  color: [{ cat: 'Color', dot: 'var(--cat-color)', items: [
    { id: 'c-bal',  name: 'Balayage',           desc: 'Hand-painted, custom blend.',           dur: 150, price: 145 },
    { id: 'c-high', name: 'Full highlights',    desc: 'Foils, tone and finish.',               dur: 120, price: 110 },
    { id: 'c-tone', name: 'Gloss & tone',       desc: 'Refresh between colour visits.',        dur: 45,  price: 48 },
    { id: 'c-corr', name: 'Colour correction',  desc: 'Consultation required.',                dur: 180, price: 220 },
  ]}],
  dental: [{ cat: 'Dental', dot: 'var(--cat-dental)', items: [
    { id: 'd-check', name: 'Check-up & exam',     desc: 'Full mouth exam, X-rays included.',  dur: 30, price: 55 },
    { id: 'd-hyg',   name: 'Hygienist clean',     desc: 'Scale, polish, airflow.',            dur: 45, price: 70 },
    { id: 'd-white', name: 'Teeth whitening',     desc: 'In-chair professional whitening.',   dur: 60, price: 180 },
  ]}],
  auto: [{ cat: 'Auto', dot: 'var(--cat-auto)', items: [
    { id: 'a-mot',  name: 'MOT test',            desc: 'Class 4, while you wait.',            dur: 60,  price: 45 },
    { id: 'a-serv', name: 'Full service',        desc: 'Oil, filters, 50-point check.',       dur: 120, price: 165 },
    { id: 'a-diag', name: 'Diagnostics',         desc: 'Fault-code scan and report.',         dur: 45,  price: 55 },
    { id: 'a-det',  name: 'Full detail',         desc: 'Interior + exterior detail.',         dur: 180, price: 140 },
  ]}],
  cleaning: [{ cat: 'Cleaning', dot: 'var(--cat-cleaning)', items: [
    { id: 'cl-reg',  name: 'Regular clean (2h)', desc: 'Weekly or fortnightly.',              dur: 120, price: 48 },
    { id: 'cl-deep', name: 'Deep clean',         desc: 'Top-to-bottom, incl. appliances.',    dur: 240, price: 120 },
    { id: 'cl-eot',  name: 'End of tenancy',     desc: 'Agency-checklist standard.',          dur: 300, price: 180 },
  ]}],
  fitness: [{ cat: 'Fitness', dot: 'var(--cat-fitness)', items: [
    { id: 'f-pt',   name: 'Personal training',   desc: '1-to-1 session, any level.',          dur: 60, price: 55 },
    { id: 'f-mob',  name: 'Mobility session',    desc: 'Assessment + guided work.',           dur: 45, price: 40 },
    { id: 'f-pil',  name: 'Reformer Pilates',    desc: 'Private reformer session.',           dur: 50, price: 48 },
  ]}],
  pets: [{ cat: 'Pets', dot: 'var(--cat-pets)', items: [
    { id: 'p-groom', name: 'Full dog groom',     desc: 'Bath, cut, nails, ears.',             dur: 90, price: 55 },
    { id: 'p-wash',  name: 'Wash & dry',         desc: 'Shampoo, blow dry, brush.',           dur: 45, price: 28 },
    { id: 'p-nails', name: 'Nail clip',          desc: 'Walk-in friendly.',                   dur: 15, price: 12 },
  ]}],
  trades: [{ cat: 'Trades', dot: 'var(--cat-trades)', items: [
    { id: 't-elec', name: 'Electrical call-out', desc: 'First hour incl. diagnosis.',         dur: 60, price: 85 },
    { id: 't-plum', name: 'Plumbing call-out',   desc: 'First hour incl. diagnosis.',         dur: 60, price: 80 },
    { id: 't-lock', name: 'Lock change',         desc: 'Standard euro cylinder.',             dur: 45, price: 95 },
  ]}],
};

function zwServiceGroupsFor(b) {
  if (b.cat === 'hair') return window.ZV_SERVICES;
  return ZW_CAT_MENUS[b.cat] || window.ZV_SERVICES;
}

// ─────────────────────────────────────────────
// Gallery — 1 large + 2 stacked, "Show all photos"
// ─────────────────────────────────────────────
function ZwGallery({ b }) {
  const photos = useMemoBZ(() => {
    const rest = window.ZV_PHOTOS.filter(p => p !== b.photo);
    return [b.photo, rest[0], rest[1]];
  }, [b.id]);
  return (
    <div style={{ position: 'relative' }}>
      <div data-gallery-grid="1" style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr',
        gap: 10, height: 'clamp(280px, 36vw, 440px)',
        borderRadius: 24, overflow: 'hidden',
      }}>
        <div className="zw-zoom-wrap zw-zoom-parent" style={{ gridRow: '1 / 3', background: 'var(--c-300)' }}>
          <ZImg src={photos[0]} alt={b.name} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
        </div>
        {photos.slice(1).map((p, i) => (
          <div key={i} className="zw-zoom-wrap zw-zoom-parent zw-only-desktop" style={{ background: 'var(--c-300)' }}>
            <ZImg src={p} alt={b.name + ' photo ' + (i + 2)} label={b.cat} style={{ width: '100%', height: '100%' }}></ZImg>
          </div>
        ))}
      </div>
      <button className="tap" onClick={() => window.zwToast('Full gallery — out of prototype scope', 'grid')}
              style={{
                position: 'absolute', bottom: 14, right: 14,
                background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(28,28,26,0.10)', borderRadius: 999, cursor: 'pointer',
                padding: '8px 14px', fontSize: 13, fontWeight: 600, color: 'var(--c-900)',
                display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: 'var(--sh-sm)',
              }}>
        <ZIcon name="grid" size={14} color="var(--c-900)"></ZIcon>
        Show all photos
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────
const ZW_BIZ_TABS = [
  { key: 'services', label: 'Services' },
  { key: 'team',     label: 'Team' },
  { key: 'reviews',  label: 'Reviews' },
  { key: 'about',    label: 'About' },
];

function ZwBizTabs({ tab, setTab }) {
  return (
    <div role="tablist" style={{
      display: 'flex', gap: 26, borderBottom: '1px solid rgba(28,28,26,0.08)',
      marginTop: 28,
    }}>
      {ZW_BIZ_TABS.map(t => {
        const on = tab === t.key;
        return (
          <button key={t.key} role="tab" aria-selected={on} onClick={() => setTab(t.key)}
                  className="tap"
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer', padding: '12px 2px 13px',
                    fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
                    color: on ? 'var(--c-900)' : 'var(--c-500)',
                    boxShadow: on ? 'inset 0 -2px 0 var(--p-500)' : 'none',
                  }}>{t.label}</button>
        );
      })}
    </div>
  );
}

// Services tab
function ZwServicesTab({ groups, picked, togglePick, currency }) {
  return (
    <div className="zv-tab-in" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingTop: 24 }}>
      {groups.map(g => (
        <div key={g.cat}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.dot }}></span>
            {g.cat}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {g.items.map(it => {
              const on = picked.has(it.id);
              return (
                <div key={it.id} className="zw-hover-row" style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '15px 10px',
                  borderRadius: 14, boxShadow: 'inset 0 -1px 0 rgba(28,28,26,0.05)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>{it.name}</div>
                    <div className="txt-pretty" style={{ fontSize: 13, color: 'var(--c-600)', marginTop: 3 }}>{it.desc}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
                      color: 'var(--c-700)', marginTop: 6,
                    }}>{zwFmtDur(it.dur)} · {zwFmtPrice(it.price, currency)}</div>
                  </div>
                  <button className="tap" onClick={() => togglePick(it)}
                          aria-label={on ? `Remove ${it.name}` : `Add ${it.name}`}
                          style={{
                            width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                            border: on ? '1px solid var(--c-ink)' : '1px solid rgba(28,28,26,0.16)',
                            background: on ? 'var(--c-ink)' : '#fff',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                    <ZIcon name={on ? 'check' : 'plus'} size={16} color={on ? '#fff' : 'var(--c-900)'}></ZIcon>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Team tab
function ZwTeamTab({ ctx }) {
  return (
    <div className="zv-tab-in" style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 16, paddingTop: 24,
    }}>
      {window.ZV_TEAM.map((m, i) => (
        <div key={m.name} className="zw-hover-lift" role="button" tabIndex={0}
             onClick={() => i === 0 ? ctx.go('pro') : window.zwToast('Profile available for Mara in this prototype', 'user')}
             style={{
               background: '#fff', border: '1px solid rgba(28,28,26,0.07)', borderRadius: 18,
               padding: '22px 16px 18px', cursor: 'pointer', textAlign: 'center',
               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
               boxShadow: 'var(--sh-sm)',
             }}>
          <img src={m.avatar} alt={m.name} style={{
            width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
            boxShadow: '0 0 0 3px #fff, 0 0 0 4px rgba(28,28,26,0.10)',
          }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em', marginTop: 4 }}>{m.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--c-600)', marginTop: -4 }}>{m.role}</div>
          <ZwRating rating={m.rating} reviews={m.reviews} size={12.5}></ZwRating>
        </div>
      ))}
    </div>
  );
}

// Reviews tab
function ZwReviewsTab({ b }) {
  const dist = window.ZV_RATING_DIST;
  const total = Object.values(dist).reduce((a, v) => a + v, 0);
  return (
    <div className="zv-tab-in" style={{ paddingTop: 24 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(24px, 4vw, 56px)',
        alignItems: 'center', padding: '6px 0 26px',
      }}>
        <div>
          <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--c-900)' }}>
            {b.rating.toFixed(1)}
          </div>
          <div style={{ marginTop: 8 }}><ZStars value={b.rating} size={15}></ZStars></div>
          <div style={{ fontSize: 13, color: 'var(--c-600)', marginTop: 7 }}>{b.reviews} verified reviews</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 420 }}>
          {[5, 4, 3, 2, 1].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: 'var(--c-600)', width: 10 }}>{s}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 99, background: 'var(--c-200)', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(((dist[s] || 0) / total) * 100)}%`, height: '100%',
                  borderRadius: 99, background: 'var(--p-500)',
                }}></div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-500)', width: 28, textAlign: 'right' }}>{dist[s] || 0}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {window.ZV_REVIEWS.map(r => (
          <div key={r.id} style={{ padding: '20px 0', boxShadow: 'inset 0 -1px 0 rgba(28,28,26,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{
                width: 38, height: 38, borderRadius: '50%', background: 'var(--c-mist)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: 'var(--c-800)', flexShrink: 0,
              }}>{r.initial}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>{r.name}</span>
                  {r.verified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--s-success-600)',
                      background: 'var(--s-success-100)', padding: '3px 8px', borderRadius: 999,
                    }}>
                      <ZIcon name="check" size={9} color="var(--s-success-600)"></ZIcon>
                      Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <ZStars value={r.stars} size={11}></ZStars>
                  <span style={{ fontSize: 12, color: 'var(--c-500)' }}>{r.date}</span>
                </div>
              </div>
            </div>
            <p className="txt-pretty" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--c-800)', maxWidth: 640 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// About tab
function ZwAboutTab({ b }) {
  const loc = window.ZV_LOCATION;
  return (
    <div className="zv-tab-in" style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 30 }}>
      <p className="txt-pretty" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: 'var(--c-800)', maxWidth: 620 }}>
        {b.blurb} Independent and appointment-only, with a small team that
        keeps things personal. Booking through Zavoia confirms instantly and
        can be rescheduled free up to 24 hours before your visit.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
        <div>
          <ZwKicker style={{ marginBottom: 14 }}>Opening hours</ZwKicker>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {window.ZV_HOURS.map(h => (
              <div key={h.d} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--c-700)' }}>{h.d}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 500,
                  color: h.h === 'Closed' ? 'var(--c-500)' : 'var(--c-800)',
                }}>{h.h}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <ZwKicker style={{ marginBottom: 14 }}>Good to know</ZwKicker>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Wi-Fi', 'Wheelchair accessible', 'Walk-ins welcome'].map(a => (
              <span key={a} style={{
                fontSize: 13, fontWeight: 500, color: 'var(--c-800)',
                background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.07)',
                padding: '7px 13px', borderRadius: 999,
              }}>{a}</span>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <ZwKicker style={{ marginBottom: 10 }}>Address</ZwKicker>
            <div style={{ fontSize: 14.5, color: 'var(--c-800)', lineHeight: 1.5 }}>
              {(loc && loc.address) || '12 Greek Street'}<br />{b.city}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Booking rail — sticky right column
// ─────────────────────────────────────────────
function ZwBookingRail({ b, picked, pickedItems, removePick, onBook, currency }) {
  const total = pickedItems.reduce((a, it) => a + it.price, 0);
  const dur = pickedItems.reduce((a, it) => a + it.dur, 0);
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(28,28,26,0.08)',
      borderRadius: 22, boxShadow: 'var(--sh-md)', padding: '22px 22px 20px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>
          Book an appointment
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, fontSize: 13, color: 'var(--c-600)' }}>
          <ZIcon name="flash" size={13} color="var(--s-success-600)"></ZIcon>
          <span>
            Next availability — <span style={{ fontWeight: 600, color: b.availableToday ? 'var(--s-success-600)' : 'var(--c-800)' }}>{b.nextSlot}</span>
          </span>
        </div>
      </div>

      {pickedItems.length > 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'var(--c-50)', border: '1px solid rgba(28,28,26,0.06)',
          borderRadius: 14, padding: '6px 4px',
        }}>
          {pickedItems.map(it => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)' }}>{it.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 2 }}>
                  {zwFmtDur(it.dur)} · {zwFmtPrice(it.price, currency)}
                </div>
              </div>
              <button className="tap" onClick={() => removePick(it.id)} aria-label={`Remove ${it.name}`}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', border: 0, cursor: 'pointer',
                        background: 'var(--c-200)', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                <ZIcon name="x" size={12} color="var(--c-700)"></ZIcon>
              </button>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 10px 8px',
            borderTop: '1px solid rgba(28,28,26,0.07)', marginTop: 2,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-700)' }}>{zwFmtDur(dur)} total</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>
              {zwFmtPrice(total, currency)}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 13.5, color: 'var(--c-600)', lineHeight: 1.5,
          background: 'var(--c-50)', border: '1px dashed rgba(28,28,26,0.14)',
          borderRadius: 14, padding: '14px 16px',
        }}>
          Pick one or more services from the list — or jump straight in and
          choose during booking.
        </div>
      )}

      <ZwButton kind="accent" size="lg" onClick={onBook} style={{ width: '100%' }}>
        {pickedItems.length > 0 ? `Book ${pickedItems.length} service${pickedItems.length > 1 ? 's' : ''}` : 'Book now'}
      </ZwButton>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center',
        fontSize: 12, color: 'var(--c-500)',
      }}>
        <ZIcon name="shield" size={13} color="var(--c-500)"></ZIcon>
        Free cancellation up to 24h before
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading skeleton — mirrors the page (gallery, identity, tabs, rail)
// ─────────────────────────────────────────────
function ZwBizSkeleton() {
  return (
    <div className="zw-container zv-fade" aria-busy="true" aria-label="Loading business" style={{ paddingTop: 22, width: '100%' }}>
      <ZSkeleton w={70} h={16} r={6}></ZSkeleton>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, height: 'clamp(280px, 34vw, 420px)' }}>
        <ZSkeleton w="100%" h="100%" r={20}></ZSkeleton>
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 10 }}>
          <ZSkeleton w="100%" h="100%" r={20}></ZSkeleton>
          <ZSkeleton w="100%" h="100%" r={20}></ZSkeleton>
        </div>
      </div>
      <div data-biz-cols="1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 372px', gap: 'clamp(28px, 4vw, 56px)', marginTop: 30, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <ZSkeleton w="52%" h={34} r={10}></ZSkeleton>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            {[60, 90, 70].map((w, i) => <ZSkeleton key={i} w={w} h={14} r={6}></ZSkeleton>)}
          </div>
          <div style={{ marginTop: 26, display: 'flex', gap: 10 }}>
            {[78, 64, 92, 58].map((w, i) => <ZSkeleton key={i} w={w} h={34} r={999}></ZSkeleton>)}
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px solid rgba(28,28,26,0.06)' : 0 }}>
                <div style={{ flex: 1 }}><ZSkeleton w="48%" h={16} r={6}></ZSkeleton><div style={{ height: 8 }}></div><ZSkeleton w="30%" h={12} r={5}></ZSkeleton></div>
                <ZSkeleton w={64} h={32} r={999}></ZSkeleton>
              </div>
            ))}
          </div>
        </div>
        <div className="zw-only-desktop">
          <ZSkeleton w="100%" h={320} r={22}></ZSkeleton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Not-found — unknown business id lands somewhere designed
// ─────────────────────────────────────────────
function ZwBizNotFound({ ctx }) {
  return (
    <div data-screen-label="Business not found" className="zw-container" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 'clamp(70px, 11vw, 150px) var(--gutter)', flex: 1,
    }}>
      <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--c-shade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <ZIcon name="pin" size={26} color="var(--c-500)"></ZIcon>
      </span>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.16em', color: 'var(--p-600)' }}>NOT FOUND</div>
      <h1 className="txt-balance" style={{ margin: '14px 0 0', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.04, color: 'var(--c-900)' }}>
        This place isn't on Zavoia.
      </h1>
      <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 420 }}>
        It may have closed or moved. Plenty of other trusted pros are a click away.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28, justifyContent: 'center' }}>
        <ZwButton kind="primary" size="lg" onClick={() => ctx.go('all')}>Browse businesses</ZwButton>
        <ZwButton kind="secondary" size="lg" onClick={() => ctx.go('home')}>Back to Explore</ZwButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
function ZwBizPage({ ctx }) {
  const id = ctx.route.id;
  const b = window.ZV_BUSINESSES.find(x => x.id === id) || (!id ? window.ZV_BUSINESSES[0] : null);
  const [tab, setTab] = useStateBZ('services');
  const [picked, setPicked] = useStateBZ(new Set());
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [loading, setLoading] = useStateBZ(() => !reduceMotion);
  useEffectBZ(() => {
    if (reduceMotion) { setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(t);
  }, [id]);
  const groups = useMemoBZ(() => (b ? zwServiceGroupsFor(b) : []), [b && b.id]);
  const allItems = useMemoBZ(() => groups.flatMap(g => g.items), [groups]);
  const pickedItems = allItems.filter(it => picked.has(it.id));

  const togglePick = (it) => {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(it.id)) next.delete(it.id); else next.add(it.id);
      return next;
    });
  };
  const removePick = (id) => setPicked(prev => { const n = new Set(prev); n.delete(id); return n; });
  const onBook = () => ctx.openBooking({ bizId: b.id, serviceIds: [...picked] });

  if (!b) return <ZwBizNotFound ctx={ctx}></ZwBizNotFound>;
  if (loading) return <ZwBizSkeleton></ZwBizSkeleton>;

  return (
    <div data-screen-label={'Business · ' + b.name} className="zw-container" style={{ paddingTop: 22, width: '100%' }}>
      {/* Back */}
      <button className="tap" onClick={() => history.back()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                background: 'transparent', border: 0, cursor: 'pointer',
                fontSize: 13.5, fontWeight: 600, color: 'var(--c-600)', padding: '4px 0',
              }}>
        <ZIcon name="back" size={14} color="var(--c-600)"></ZIcon>
        Back
      </button>

      <ZwGallery b={b}></ZwGallery>

      <div data-biz-cols="1" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 372px',
        gap: 'clamp(28px, 4vw, 56px)', marginTop: 30, alignItems: 'start',
      }}>
        {/* Left column */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 600,
                letterSpacing: '-0.035em', lineHeight: 1.05, color: 'var(--c-900)',
              }}>{b.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginTop: 12, fontSize: 14, color: 'var(--c-600)' }}>
                <ZwRating rating={b.rating} reviews={b.reviews} size={14}></ZwRating>
                <span style={{ color: 'var(--c-400)' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ZwCatDot cat={b.cat}></ZwCatDot>
                  {b.catLabel}
                </span>
                <span style={{ color: 'var(--c-400)' }}>·</span>
                <span>{b.city} · {b.distance}</span>
                <span style={{ color: 'var(--c-400)' }}>·</span>
                <ZwStatusPill status={b.status} closesAt={b.closesAt}></ZwStatusPill>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="tap" aria-label="Share"
                      onClick={() => window.zwToast('Link copied', 'copy')}
                      style={{
                        width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                        border: '1px solid rgba(28,28,26,0.12)', background: '#fff',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                <ZIcon name="share" size={16} color="var(--c-800)"></ZIcon>
              </button>
              <ZwHeartBtn active={ctx.favs.has(b.id)} onClick={() => ctx.toggleFav(b.id)} size={40} floating={false}></ZwHeartBtn>
            </div>
          </div>

          <ZwBizTabs tab={tab} setTab={setTab}></ZwBizTabs>
          {tab === 'services' && <ZwServicesTab groups={groups} picked={picked} togglePick={togglePick} currency={b.currency}></ZwServicesTab>}
          {tab === 'team' && <ZwTeamTab ctx={ctx}></ZwTeamTab>}
          {tab === 'reviews' && <ZwReviewsTab b={b}></ZwReviewsTab>}
          {tab === 'about' && <ZwAboutTab b={b}></ZwAboutTab>}
        </div>

        {/* Right rail — sticky on desktop */}
        <div className="zw-only-desktop" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 18px)' }}>
          <ZwBookingRail b={b} picked={picked} pickedItems={pickedItems}
                         removePick={removePick} onBook={onBook} currency={b.currency}></ZwBookingRail>
        </div>
      </div>

      {/* Mobile bottom booking bar */}
      <div className="zw-only-mobile zv-frost" style={{
        position: 'fixed', left: 0, right: 0, bottom: 'calc(58px + env(safe-area-inset-bottom))',
        zIndex: 80, borderTop: '1px solid rgba(28,28,26,0.08)',
        padding: '10px var(--gutter)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)' }}>
            {pickedItems.length > 0
              ? `${pickedItems.length} service${pickedItems.length > 1 ? 's' : ''} · ${zwFmtPrice(pickedItems.reduce((a, i) => a + i.price, 0), b.currency)}`
              : b.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 2 }}>
            Next: {b.nextSlot}
          </div>
        </div>
        <ZwButton kind="accent" onClick={onBook}>Book now</ZwButton>
      </div>
      <div className="zw-only-mobile" style={{ height: 64 }}></div>
    </div>
  );
}

window.ZW_PAGES.biz = ZwBizPage;
Object.assign(window, { zwServiceGroupsFor, zwFmtPrice, zwFmtDur });
