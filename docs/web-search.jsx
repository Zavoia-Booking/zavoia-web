// Zavoia Web — Search results + map. Map-forward: the stylised map fills
// the viewport below the nav; results live in a floating panel (desktop)
// or a list/map toggle (mobile). Pins ↔ rows stay in sync.

const { useState: useStateSR, useMemo: useMemoSR, useRef: useRefSR, useEffect: useEffectSR } = React;

function useIsMobile() {
  const [m, setM] = useStateSR(() => window.matchMedia('(max-width: 920px)').matches);
  useEffectSR(() => {
    const mq = window.matchMedia('(max-width: 920px)');
    const fn = (e) => setM(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return m;
}

const ZW_SORTS = [
  { id: 'rec',    label: 'Recommended' },
  { id: 'rating', label: 'Top rated' },
  { id: 'near',   label: 'Nearest' },
];

function ZwSortMenu({ sort, setSort }) {
  const [open, setOpen] = useStateSR(false);
  return (
    <div style={{ position: 'relative' }}>
      <button className="tap" onClick={() => setOpen(o => !o)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 0, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: 'var(--c-700)', padding: '6px 2px',
              }}>
        <ZIcon name="sliders" size={14} color="var(--c-700)"></ZIcon>
        {ZW_SORTS.find(s => s.id === sort).label}
        <ZIcon name="chevD" size={13} color="var(--c-600)"></ZIcon>
      </button>
      {open && (
        <div className="zv-fade" style={{
          position: 'absolute', right: 0, top: '110%', zIndex: 30,
          background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-lg)',
          border: '1px solid rgba(28,28,26,0.07)', padding: 6, minWidth: 170,
        }}>
          {ZW_SORTS.map(s => (
            <button key={s.id} className="tap zw-hover-row"
                    onClick={() => { setSort(s.id); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
                      padding: '9px 12px', borderRadius: 9, fontSize: 13.5,
                      fontWeight: s.id === sort ? 600 : 500,
                      color: 'var(--c-900)',
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

function ZwFilterRow({ cat, setCat, openNow, setOpenNow, availToday, setAvailToday }) {
  const cats = window.ZV_CATEGORIES.slice(0, 6);
  return (
    <div className="zw-scroll-x" style={{ gap: 8, padding: '2px 2px 4px' }}>
      <ZwChip active={!cat} onClick={() => setCat(null)}>All</ZwChip>
      {cats.map(c => (
        <ZwChip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
          <ZwCatDot cat={c.id} size={6}></ZwCatDot>
          {c.label}
        </ZwChip>
      ))}
      <span style={{ width: 1, background: 'rgba(28,28,26,0.10)', flexShrink: 0, margin: '4px 2px' }}></span>
      <ZwChip active={openNow} onClick={() => setOpenNow(v => !v)}>Open now</ZwChip>
      <ZwChip active={availToday} onClick={() => setAvailToday(v => !v)}>Available today</ZwChip>
    </div>
  );
}

// Floating mini-card shown when a pin is selected (over the map)
function ZwPinCard({ b, ctx, onClose }) {
  return (
    <div className="zv-sheet-card" data-i="0" style={{
      position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40, width: 'min(420px, calc(100% - 32px))',
      background: '#fff', borderRadius: 18, boxShadow: 'var(--sh-xl)',
      border: '1px solid rgba(28,28,26,0.07)', padding: 6,
    }}>
      <button onClick={onClose} aria-label="Close" className="tap" style={{
        position: 'absolute', top: -10, right: -10, width: 28, height: 28,
        borderRadius: '50%', border: 0, cursor: 'pointer', background: 'var(--c-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
      }}>
        <ZIcon name="x" size={13} color="#fff"></ZIcon>
      </button>
      <ZwBusinessRow b={b} favorited={ctx.favs.has(b.id)} onFavorite={ctx.toggleFav}
                     onClick={() => ctx.go('biz/' + b.id)}></ZwBusinessRow>
    </div>
  );
}

function ZwSearchPage({ ctx }) {
  const isMobile = useIsMobile();
  const [view, setView] = useStateSR('map'); // mobile only: 'list' | 'map'
  const [cat, setCat] = useStateSR(null);
  const [openNow, setOpenNow] = useStateSR(false);
  const [availToday, setAvailToday] = useStateSR(false);
  const [sort, setSort] = useStateSR('rec');
  const [selectedId, setSelectedId] = useStateSR(null);
  const [hoverId, setHoverId] = useStateSR(null);
  const [updating, setUpdating] = useStateSR(false);
  const [areaPill, setAreaPill] = useStateSR(false);
  const listRef = useRefSR(null);

  const results = useMemoSR(() => {
    let list = window.ZV_BUSINESSES.slice();
    if (cat) list = list.filter(b => b.cat === cat);
    if (openNow) list = list.filter(b => b.status === 'open' || b.status === '24/7');
    if (availToday) list = list.filter(b => b.availableToday);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'near') list.sort((a, b) => a.distanceKm - b.distanceKm);
    return list;
  }, [cat, openNow, availToday, sort]);

  const selected = results.find(b => b.id === selectedId) || null;

  // Brief "Updating…" pulse when filters change
  useEffectSR(() => {
    setUpdating(true);
    const t = setTimeout(() => setUpdating(false), 700);
    return () => clearTimeout(t);
  }, [cat, openNow, availToday]);

  // Scroll the selected row into view inside the panel (no scrollIntoView)
  useEffectSR(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-biz="${selectedId}"]`);
    if (el) {
      const top = el.offsetTop - listRef.current.offsetTop - 12;
      listRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  }, [selectedId]);

  const onPinSelect = (b) => { setSelectedId(b.id); setAreaPill(false); };
  const queryLabel = ctx.query.what || 'All services';
  // Re-keys the pins so they re-drop when the result set changes
  const wave = [cat || 'all', openNow ? 1 : 0, availToday ? 1 : 0, sort].join('|');

  const panelHeader = (
    <div style={{ padding: '18px 18px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <ZwKicker style={{ marginBottom: 5 }}>In this area</ZwKicker>
          <span className={updating ? 'zv-updating-pulse' : ''} style={{
            fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--c-900)',
          }}>
            {updating ? 'Updating…' : `${results.length} place${results.length === 1 ? '' : 's'}`}
          </span>
          <span style={{ fontSize: 13, color: 'var(--c-600)', marginLeft: 8 }}>{queryLabel}</span>
        </div>
        <ZwSortMenu sort={sort} setSort={setSort}></ZwSortMenu>
      </div>
      <ZwFilterRow cat={cat} setCat={setCat} openNow={openNow} setOpenNow={setOpenNow}
                   availToday={availToday} setAvailToday={setAvailToday}></ZwFilterRow>
    </div>
  );

  const resultList = (
    <div ref={listRef} className="zw-scroll-y" style={{ flex: 1, padding: '4px 10px 16px', position: 'relative' }}>
      {updating ? (
        <div className="zv-fade" aria-label="Loading results">
          {[0, 1, 2, 3, 4].map(i => <ZwRowSkeleton key={i}></ZwRowSkeleton>)}
        </div>
      ) : (
      <React.Fragment>
      {results.map(b => (
        <div key={b.id} data-biz={b.id}>
          <ZwBusinessRow b={b} selected={b.id === selectedId || b.id === hoverId}
                         favorited={ctx.favs.has(b.id)} onFavorite={ctx.toggleFav}
                         onHover={() => setHoverId(b.id)} onLeave={() => setHoverId(null)}
                         onClick={() => ctx.go('biz/' + b.id)}></ZwBusinessRow>
        </div>
      ))}
      {results.length === 0 && (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-800)', marginBottom: 6 }}>
            No places match those filters
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--c-600)', marginBottom: 18 }}>
            Try widening your filters or clearing the category.
          </div>
          <ZwButton kind="secondary" size="sm"
                    onClick={() => { setCat(null); setOpenNow(false); setAvailToday(false); }}>
            Clear filters
          </ZwButton>
        </div>
      )}
      </React.Fragment>
      )}
    </div>
  );

  const mapSurface = (
    <div style={{ position: 'absolute', inset: 0 }}
         onClick={(e) => { if (e.target.tagName === 'svg' || e.target.closest('svg')) setAreaPill(true); }}>
      <ZvMap businesses={results}
             selectedId={selectedId || hoverId}
             wave={wave}
             onSelect={onPinSelect}
             onHover={isMobile ? undefined : (b) => setHoverId(b ? b.id : null)}
             onRecenter={() => { setAreaPill(false); window.zwToast('Centred on your location', 'nav'); }}>
        {areaPill && (
          <button className="tap zv-pill-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAreaPill(false);
                    setUpdating(true); setTimeout(() => setUpdating(false), 700);
                  }}
                  style={{
                    position: 'absolute', top: 18, left: '50%', zIndex: 30,
                    background: 'var(--c-ink)', color: '#fff', border: 0, cursor: 'pointer',
                    padding: '10px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                    boxShadow: 'var(--sh-lg)', display: 'inline-flex', alignItems: 'center', gap: 7,
                  }}>
            <ZIcon name="search" size={14} color="#fff"></ZIcon>
            Search this area
          </button>
        )}
        {selected && (isMobile || true) && view !== 'list' && (
          <ZwPinCard b={selected} ctx={ctx} onClose={() => setSelectedId(null)}></ZwPinCard>
        )}
      </ZvMap>
    </div>
  );

  // ── Mobile: list/map toggle ──
  if (isMobile) {
    return (
      <div data-screen-label="Search" style={{
        position: 'relative', height: 'calc(100vh - var(--nav-h))',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {view === 'map' ? (
          <div style={{ position: 'relative', flex: 1 }}>{mapSurface}</div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--c-canvas)' }}>
            {panelHeader}
            {resultList}
          </div>
        )}
        <button className="tap" onClick={() => setView(v => v === 'map' ? 'list' : 'map')}
                style={{
                  position: 'absolute', bottom: 86, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 50, background: 'var(--c-ink)', color: '#fff', border: 0, cursor: 'pointer',
                  padding: '12px 22px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                  boxShadow: 'var(--sh-lg)', display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
          <ZIcon name={view === 'map' ? 'list' : 'pin'} size={15} color="#fff"></ZIcon>
          {view === 'map' ? 'List' : 'Map'}
        </button>
      </div>
    );
  }

  // ── Desktop: full-bleed map + floating panel ──
  return (
    <div data-screen-label="Search" style={{
      position: 'relative', height: 'calc(100vh - var(--nav-h))', overflow: 'hidden',
    }}>
      {mapSurface}
      <div style={{
        position: 'absolute', top: 16, left: 16, bottom: 16, zIndex: 35,
        width: 'min(424px, 36vw)',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 22, boxShadow: 'var(--sh-xl)',
        border: '1px solid rgba(28,28,26,0.07)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {panelHeader}
        {resultList}
      </div>
    </div>
  );
}

window.ZW_PAGES.search = ZwSearchPage;
