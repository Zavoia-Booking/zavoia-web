// Zavoia Web — Team member profile (Mara Voinescu). Person-first:
// portrait + portfolio, identity stats, works-at venues, specialties,
// reviews. Booking hands off to the drawer at her primary venue.

const { useState: useStatePR, useMemo: useMemoPR, useEffect: useEffectPR } = React;

// Loading skeleton — mirrors the profile (portfolio, identity, rail)
function ZwProSkeleton() {
  return (
    <div className="zw-container zv-fade" aria-busy="true" aria-label="Loading profile" style={{ paddingTop: 22, width: '100%' }}>
      <ZSkeleton w={56} h={16} r={6}></ZSkeleton>
      <div data-pro-cols="1" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 372px', gap: 'clamp(28px, 4vw, 56px)', marginTop: 16, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <ZSkeleton w="100%" h={'clamp(300px, 38vw, 460px)'} r={24}></ZSkeleton>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            {[0,1,2,3,4].map(i => <ZSkeleton key={i} w={64} h={64} r={12}></ZSkeleton>)}
          </div>
          <div style={{ marginTop: 28 }}><ZSkeleton w="56%" h={30} r={8}></ZSkeleton></div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            {[70, 90, 64].map((w, i) => <ZSkeleton key={i} w={w} h={14} r={6}></ZSkeleton>)}
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0,1,2].map(i => <ZSkeleton key={i} w="100%" h={14} r={6}></ZSkeleton>)}
          </div>
        </div>
        <div className="zw-only-desktop"><ZSkeleton w="100%" h={300} r={22}></ZSkeleton></div>
      </div>
    </div>
  );
}

function ZwProStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>{value}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--c-500)', marginTop: 3,
      }}>{label}</div>
    </div>
  );
}

function ZwProfilePage({ ctx }) {
  const pro = window.ZV_PRO;
  const portfolio = window.ZV_PORTFOLIO;
  const [photo, setPhoto] = useStatePR(0);
  const reduceMotionPR = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [loadingPR, setLoadingPR] = useStatePR(() => !reduceMotionPR);
  useEffectPR(() => {
    if (reduceMotionPR) { setLoadingPR(false); return; }
    setLoadingPR(true);
    const t = setTimeout(() => setLoadingPR(false), 420);
    return () => clearTimeout(t);
  }, [ctx.route.id]);
  const dist = window.ZV_PRO_RATING_DIST;
  const distTotal = Object.values(dist).reduce((a, v) => a + v, 0);
  const reviews = window.ZV_PRO_REVIEWS;

  const book = () => ctx.openBooking({ bizId: 'glow-soho', proName: pro.name });

  if (loadingPR) return <ZwProSkeleton></ZwProSkeleton>;

  return (
    <div data-screen-label={'Profile · ' + pro.name} className="zw-container" style={{ paddingTop: 22, width: '100%' }}>
      <button className="tap" onClick={() => history.back()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                background: 'transparent', border: 0, cursor: 'pointer',
                fontSize: 13.5, fontWeight: 600, color: 'var(--c-600)', padding: '4px 0',
              }}>
        <ZIcon name="back" size={14} color="var(--c-600)"></ZIcon>
        Back
      </button>

      <div data-pro-cols="1" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 372px',
        gap: 'clamp(28px, 4vw, 56px)', alignItems: 'start',
      }}>
        {/* ── Left column ── */}
        <div style={{ minWidth: 0 }}>
          {/* Portfolio viewer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="zw-zoom-wrap zw-zoom-parent" style={{
              borderRadius: 24, overflow: 'hidden', background: 'var(--c-300)',
              height: 'clamp(300px, 38vw, 460px)',
            }}>
              <ZImg key={photo} src={portfolio[photo]} alt={pro.name + ' portfolio'} label="hair"
                    className="zv-fade" style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            <div className="zw-scroll-x" style={{ gap: 8 }}>
              {portfolio.map((p, i) => (
                <button key={i} className="tap" onClick={() => setPhoto(i)}
                        aria-label={'Photo ' + (i + 1)}
                        style={{
                          width: 72, height: 56, borderRadius: 10, overflow: 'hidden',
                          padding: 0, cursor: 'pointer', flexShrink: 0,
                          border: photo === i ? '2px solid var(--p-500)' : '2px solid transparent',
                          opacity: photo === i ? 1 : 0.75,
                        }}>
                  <img src={p.replace('w=1200', 'w=300')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Identity */}
          <div style={{ marginTop: 30 }}>
            <ZwKicker style={{ marginBottom: 10 }}>{pro.title}</ZwKicker>
            <h1 style={{
              margin: 0, fontSize: 'clamp(28px, 3.2vw, 40px)', fontWeight: 600,
              letterSpacing: '-0.035em', color: 'var(--c-900)',
            }}>{pro.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12, flexWrap: 'wrap' }}>
              <ZwRating rating={pro.rating} reviews={pro.reviewCount} size={14}></ZwRating>
              <span style={{ color: 'var(--c-400)' }}>·</span>
              <span style={{ fontSize: 14, color: 'var(--c-600)' }}>Joined {pro.joined}</span>
            </div>
          </div>

          {/* Bio */}
          <p className="txt-pretty" style={{
            margin: '20px 0 0', fontSize: 15.5, lineHeight: 1.65, color: 'var(--c-800)', maxWidth: 640,
          }}>{pro.bio}</p>

          {/* Specialties */}
          <div style={{ marginTop: 26 }}>
            <ZwKicker style={{ marginBottom: 12 }}>Specialties</ZwKicker>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pro.specialties.map(s => (
                <span key={s} style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--c-800)',
                  background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.07)',
                  padding: '7px 13px', borderRadius: 999,
                }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Works at */}
          <div style={{ marginTop: 34 }}>
            <ZwKicker style={{ marginBottom: 14 }}>Works at</ZwKicker>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {window.ZV_PRO_BUSINESSES.flatMap(biz => biz.locations.map(loc => (
                <div key={loc.id} className="zw-hover-lift" role="button" tabIndex={0}
                     onClick={() => ctx.go('biz/' + (loc.id === 'glow-soho' ? 'glow-soho' : 'glow-soho'))}
                     style={{
                       display: 'flex', gap: 13, padding: 12, cursor: 'pointer',
                       background: '#fff', border: '1px solid rgba(28,28,26,0.07)',
                       borderRadius: 16, boxShadow: 'var(--sh-sm)', alignItems: 'center',
                     }}>
                  <img src={loc.photo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>
                      {biz.name} · {loc.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--c-600)', marginTop: 2 }}>{loc.area}</div>
                    <div style={{ marginTop: 4 }}><ZwRating rating={loc.rating} reviews={loc.reviews} size={12}></ZwRating></div>
                  </div>
                </div>
              )))}
            </div>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 40 }}>
            <ZwKicker style={{ marginBottom: 14 }}>Reviews</ZwKicker>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(20px, 3vw, 44px)', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--c-900)' }}>
                  {pro.rating.toFixed(1)}
                </div>
                <div style={{ marginTop: 7 }}><ZStars value={pro.rating} size={13}></ZStars></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, maxWidth: 360 }}>
                {[5, 4, 3, 2, 1].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--c-600)', width: 10 }}>{s}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--c-200)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(((dist[s] || 0) / distTotal) * 100)}%`, height: '100%', borderRadius: 99, background: 'var(--p-500)' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {reviews.slice(0, 4).map(r => (
              <div key={r.id} style={{ padding: '18px 0', boxShadow: 'inset 0 -1px 0 rgba(28,28,26,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                  <img src={r.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)' }}>{r.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
                      <ZStars value={r.stars} size={10}></ZStars>
                      <span style={{ fontSize: 11.5, color: 'var(--c-500)' }}>{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="txt-pretty" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--c-800)', maxWidth: 620 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right rail ── */}
        <div className="zw-only-desktop" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 18px)' }}>
          <div style={{
            background: '#fff', border: '1px solid rgba(28,28,26,0.08)',
            borderRadius: 22, boxShadow: 'var(--sh-md)', padding: '24px 22px 20px',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={pro.avatar} alt={pro.name} style={{
                width: 58, height: 58, borderRadius: '50%', objectFit: 'cover',
                boxShadow: '0 0 0 3px #fff, 0 0 0 4px rgba(28,28,26,0.10)', flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>{pro.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--c-600)', marginTop: 2 }}>{pro.title}</div>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              background: 'var(--c-50)', border: '1px solid rgba(28,28,26,0.06)',
              borderRadius: 16, padding: '14px 8px',
            }}>
              <ZwProStat value={pro.years + ' yrs'} label="Experience"></ZwProStat>
              <ZwProStat value={(pro.completed / 1000).toFixed(1) + 'k'} label="Bookings"></ZwProStat>
              <ZwProStat value={pro.rating.toFixed(1)} label="Rating"></ZwProStat>
            </div>
            <ZwButton kind="accent" size="lg" onClick={book} style={{ width: '100%' }}>
              {'Book with ' + pro.name.split(' ')[0]}
            </ZwButton>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', fontSize: 12, color: 'var(--c-500)' }}>
              <ZIcon name="flash" size={13} color="var(--s-success-600)"></ZIcon>
              Usually replies within the hour
            </div>
          </div>
        </div>
      </div>

      {/* Mobile booking bar */}
      <div className="zw-only-mobile zv-frost" style={{
        position: 'fixed', left: 0, right: 0, bottom: 'calc(58px + env(safe-area-inset-bottom))',
        zIndex: 80, borderTop: '1px solid rgba(28,28,26,0.08)',
        padding: '10px var(--gutter)', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>{pro.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-600)', marginTop: 1 }}>{pro.title}</div>
        </div>
        <ZwButton kind="accent" onClick={book}>Book now</ZwButton>
      </div>
      <div className="zw-only-mobile" style={{ height: 64 }}></div>
    </div>
  );
}

window.ZW_PAGES.pro = ZwProfilePage;
