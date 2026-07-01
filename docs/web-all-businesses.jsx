// Zavoia Web — All businesses directory. The "See all businesses" target
// from the homepage featured carousel. A clean, filterable grid of every
// business: category chips + open/available toggles + sort, over a
// responsive card grid. Cards are business-level only (no booking action);
// the whole card routes to the business profile.

const { useState: useStateAB, useMemo: useMemoAB, useRef: useRefAB, useEffect: useEffectAB } = React;

const ZW_AB_SORTS = [
  { id: 'rec',    label: 'Recommended' },
  { id: 'rating', label: 'Top rated' },
  { id: 'near',   label: 'Nearest' },
  { id: 'price',  label: 'Price: low to high' },
];

function ZwAbSortMenu({ sort, setSort }) {
  const [open, setOpen] = useStateAB(false);
  const ref = useRefAB(null);
  useEffectAB(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const current = ZW_AB_SORTS.find(s => s.id === sort) || ZW_AB_SORTS[0];
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button className="tap" onClick={() => setOpen(o => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', border: '1px solid rgba(28,28,26,0.12)', cursor: 'pointer',
                borderRadius: 999, padding: '9px 14px', fontSize: 13.5, fontWeight: 600,
                color: 'var(--c-900)', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              }}>
        <ZIcon name="sliders" size={14} color="var(--c-700)"></ZIcon>
        <span style={{ color: 'var(--c-600)', fontWeight: 500 }}>Sort</span>
        {current.label}
        <ZIcon name="chevD" size={13} color="var(--c-600)"></ZIcon>
      </button>
      {open && (
        <div className="zv-fade" style={{
          position: 'absolute', right: 0, top: '112%', zIndex: 30,
          background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-lg)',
          border: '1px solid rgba(28,28,26,0.07)', padding: 6, minWidth: 210,
        }}>
          {ZW_AB_SORTS.map(s => (
            <button key={s.id} className="tap zw-hover-row"
                    onClick={() => { setSort(s.id); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
                      padding: '9px 12px', borderRadius: 9, fontSize: 13.5,
                      fontWeight: s.id === sort ? 600 : 500, color: 'var(--c-900)',
                    }}>
              {s.label}
              {s.id === sort && <ZIcon name="check" size={14} color="var(--p-600)"></ZIcon>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ZwAllBusinessesPage({ ctx }) {
  const [cat, setCat] = useStateAB(null);
  const [openNow, setOpenNow] = useStateAB(false);
  const [availToday, setAvailToday] = useStateAB(false);
  const [sort, setSort] = useStateAB('rec');

  const results = useMemoAB(() => {
    let list = (window.ZV_BUSINESSES || []).slice();
    if (cat) list = list.filter(b => b.cat === cat);
    if (openNow) list = list.filter(b => b.status === 'open' || b.status === '24/7');
    if (availToday) list = list.filter(b => b.availableToday);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'near')   list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'price')  list.sort((a, b) => a.priceFrom - b.priceFrom);
    return list;
  }, [cat, openNow, availToday, sort]);

  const cats = window.ZV_CATEGORIES || [];
  const hasFilters = cat || openNow || availToday;

  return (
    <div data-screen-label="All businesses">
      {/* Header band */}
      <section style={{ background: 'var(--c-mist)', borderBottom: '1px solid rgba(28,28,26,0.06)' }}>
        <div className="zw-container" style={{ padding: 'clamp(40px, 5vw, 72px) var(--gutter) clamp(28px, 3vw, 40px)' }}>
          <ZwKicker style={{ marginBottom: 14 }}>Directory · {window.ZV_CITY ? window.ZV_CITY.name : 'London'}</ZwKicker>
          <h1 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600,
            letterSpacing: '-0.045em', lineHeight: 1.0, color: 'var(--c-900)',
          }}>All businesses</h1>
          <p className="txt-pretty" style={{
            margin: '18px 0 0', fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.55,
            color: 'var(--c-600)', maxWidth: 520,
          }}>
            Every trusted professional on Zavoia near you — browse by category, then open a
            profile to see services and book.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="zw-container" style={{ paddingTop: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'nowrap',
        }}>
          <div className="zw-scroll-x" style={{ gap: 8, padding: '2px 2px 6px', flex: 1, minWidth: 0 }}>
            <ZwChip active={!cat} onClick={() => setCat(null)}>All</ZwChip>
            {cats.map(c => (
              <ZwChip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
                <ZwCatDot cat={c.id} size={6}></ZwCatDot>
                {c.label}
              </ZwChip>
            ))}
            <span style={{ width: 1, background: 'rgba(28,28,26,0.12)', flexShrink: 0, margin: '4px 4px' }}></span>
            <ZwChip active={openNow} onClick={() => setOpenNow(v => !v)}>Open now</ZwChip>
            <ZwChip active={availToday} onClick={() => setAvailToday(v => !v)}>Available today</ZwChip>
          </div>
          <div className="zw-only-desktop">
            <ZwAbSortMenu sort={sort} setSort={setSort}></ZwAbSortMenu>
          </div>
        </div>

        {/* Count row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
          marginTop: 18, marginBottom: 22,
        }}>
          <span style={{ fontSize: 14.5, color: 'var(--c-700)', letterSpacing: '-0.01em' }}>
            <strong style={{ color: 'var(--c-900)', fontWeight: 600 }}>{results.length}</strong>
            {' '}{results.length === 1 ? 'business' : 'businesses'}
            {cat && <span style={{ color: 'var(--c-500)' }}> · {(cats.find(c => c.id === cat) || {}).label}</span>}
          </span>
          {hasFilters && (
            <button className="tap" onClick={() => { setCat(null); setOpenNow(false); setAvailToday(false); }}
                    style={{
                      background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 2px',
                      fontSize: 13.5, fontWeight: 600, color: 'var(--c-700)',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}>
              <ZIcon name="x" size={13} color="var(--c-600)"></ZIcon>
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className="zw-container" style={{ paddingBottom: 8 }}>
        {results.length > 0 ? (
          <div className="zw-biz-grid3">
            {results.map(b => (
              <ZwBizEditorialCard key={b.id} b={b} ctx={ctx}></ZwBizEditorialCard>
            ))}
          </div>
        ) : (
          <div style={{ padding: '64px 20px 80px', textAlign: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--c-800)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              No businesses match those filters
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--c-600)', marginBottom: 22 }}>
              Try widening your filters or clearing the category.
            </div>
            <ZwButton kind="secondary" size="md"
                      onClick={() => { setCat(null); setOpenNow(false); setAvailToday(false); }}>
              Clear filters
            </ZwButton>
          </div>
        )}
      </section>
    </div>
  );
}

window.ZW_PAGES.all = ZwAllBusinessesPage;
