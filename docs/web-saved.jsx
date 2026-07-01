// Zavoia Web — Saved. Editorial row index (web port of the mobile
// Favorites page): flat rows on the canvas — leading media + mono
// category/role eyebrow + tight title + rating·subtitle + a filled
// heart and a "saved Xd ago" stamp. Three entity types share one row:
//   place    → square thumb · CATEGORY eyebrow · city / "N locations"
//   location → square thumb · BRAND eyebrow    · street address
//   person   → round avatar · ROLE eyebrow     · business
// Remove is real (session state) with an Undo toast. Filters by type
// (All · Businesses · Locations · People); sort kept as a web nicety.

const { useState: useStateSV, useMemo: useMemoSV } = React;

const ZW_SAVED_SORTS = [
  { id: 'recent', label: 'Recently saved' },
  { id: 'nearby', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
];

// Industry icon for a category id (mirrors the home browse grid).
function zwCatIcon(cat) {
  const c = (window.ZV_CATEGORIES || []).find(x => x.id === cat);
  return c ? c.icon : 'sparkle';
}

// People with a real web profile page; everyone else opens a quick toast.
const ZW_SAVED_PROFILES = { 'Mara Voinescu': 'pro' };

// ── Mono uppercase eyebrow ──
function ZwSavedEyebrow({ it }) {
  const label = it.type === 'person' ? (it.role || 'Provider')
    : it.type === 'location' ? it.brand
    : it.catLabel;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--c-500)', marginBottom: 5 }}>
      {it.type === 'place' && it.cat && <ZIcon name={zwCatIcon(it.cat)} size={13} color={`var(--cat-${it.cat})`}></ZIcon>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ── Leading media ──
function ZwSavedMedia({ it }) {
  const circle = it.type === 'person';
  const size = circle ? 60 : 64;
  return (
    <div style={{
      width: size, height: size, borderRadius: circle ? '50%' : 15, overflow: 'hidden', flexShrink: 0,
      background: 'var(--c-300)', position: 'relative',
      boxShadow: circle ? 'none' : 'inset 0 0 0 1px rgba(28,28,26,0.07)',
    }}>
      {circle
        ? <img src={it.avatar} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <ZImg src={it.photo} alt={it.name || it.venue} label={it.cat} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></ZImg>}
    </div>
  );
}

// ── Filled heart — removes on tap with a pop ──
function ZwSavedHeart({ it, onRemove }) {
  const [pop, setPop] = useStateSV(false);
  return (
    <span role="button" tabIndex={0} className="tap"
          aria-label={`Remove ${it.name || it.venue} from saved`}
          onClick={(e) => { e.stopPropagation(); setPop(true); setTimeout(() => setPop(false), 560); onRemove(it); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(it); } }}
          style={{ display: 'inline-flex', color: 'var(--p-500)', cursor: 'pointer' }}>
      <span className={pop ? 'zv-heart-pop' : ''} style={{ display: 'inline-flex' }}>
        <ZIcon name="heart" size={18} color="currentColor"></ZIcon>
      </span>
    </span>
  );
}

function zwSavedSubtitle(it) {
  if (it.type === 'person') return it.business;
  if (it.type === 'location') return it.address;
  return it.locationCount > 1 ? `${it.locationCount} locations` : it.city;
}

// ── One editorial row ──
function ZwSavedRow({ it, ctx, onRemove }) {
  const title = it.type === 'location' ? it.venue : it.name;
  const sub = zwSavedSubtitle(it);
  const open = () => {
    if (it.type === 'person') {
      const route = ZW_SAVED_PROFILES[it.name];
      if (route) ctx.go(route);
      else window.zwToast(`${it.name} · ${it.role}`, 'user');
      return;
    }
    if (it.type === 'place' && it.locationCount > 1) {
      ctx.go('biz/' + (it.id || it.bizId || 'glow-soho'));
      return;
    }
    ctx.go('biz/' + (it.id || it.bizId || 'glow-soho'));
  };
  return (
    <div className="zw-saved-row" role="button" tabIndex={0}
         onClick={open} onKeyDown={(e) => { if (e.key === 'Enter') open(); }}
         style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '17px 8px', cursor: 'pointer', borderBottom: '1px solid rgba(28,28,26,0.08)', borderRadius: 12 }}>
      <ZwSavedMedia it={it}></ZwSavedMedia>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ZwSavedEyebrow it={it}></ZwSavedEyebrow>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.024em', lineHeight: 1.12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--c-600)', minWidth: 0 }}>
          {it.rating != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3.5, fontWeight: 600, color: 'var(--c-800)', flexShrink: 0 }}>
              <ZIcon name="star" size={11} color="var(--p-500)"></ZIcon>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{it.rating.toFixed(1)}</span>
            </span>
          )}
          {it.rating != null && sub && <span style={{ color: 'var(--c-300)', flexShrink: 0 }}>·</span>}
          {sub && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden' }}>
              {it.type === 'location' && <ZIcon name="pin" size={11} color="var(--c-500)"></ZIcon>}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}{it.distance ? ` · ${it.distance}` : ''}</span>
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 9, flexShrink: 0 }}>
        <ZwSavedHeart it={it} onRemove={onRemove}></ZwSavedHeart>
        {it.savedLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--c-400)', whiteSpace: 'nowrap' }}>{it.savedLabel}</span>}
      </div>
    </div>
  );
}

function ZwSavedFilters({ value, onChange, counts }) {
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'place', label: 'Businesses' },
    { id: 'location', label: 'Locations' },
    { id: 'person', label: 'People' },
  ].filter(t => t.id === 'all' || (counts[t.id] ?? 0) > 0);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map(t => {
        const active = t.id === value;
        return (
          <button key={t.id} className="tap" onClick={() => onChange(t.id)} aria-pressed={active}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 15px', borderRadius: 999, cursor: 'pointer',
                    background: active ? 'var(--c-ink)' : '#fff', color: active ? '#fff' : 'var(--c-700)',
                    border: '1px solid ' + (active ? 'transparent' : 'rgba(28,28,26,0.12)'),
                    fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em',
                    transition: 'background-color .2s var(--ease-soft), color .2s var(--ease-soft)',
                  }}>
            {t.label}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.6)' : 'var(--c-500)', fontVariantNumeric: 'tabular-nums' }}>{counts[t.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function ZwSavedPage({ ctx }) {
  const [kind, setKind] = useStateSV('all');
  const [sort, setSort] = useStateSV('recent');
  const [sortOpen, setSortOpen] = useStateSV(false);
  const [removed, setRemoved] = useStateSV(() => new Set());
  const isNew = ctx.userState === 'new';

  const live = useMemoSV(() => (window.ZV_SAVED || []).filter(i => !removed.has(i.key)), [removed]);

  const counts = useMemoSV(() => {
    const c = { all: live.length, place: 0, location: 0, person: 0 };
    for (const i of live) c[i.type] = (c[i.type] || 0) + 1;
    return c;
  }, [live]);

  const items = useMemoSV(() => {
    let list = kind === 'all' ? live.slice() : live.filter(i => i.type === kind);
    const cmp = (window.ZV_SAVED_SORTS || {})[sort];
    if (cmp) list.sort(cmp);
    return list;
  }, [live, kind, sort]);

  const removeItem = (it) => {
    setRemoved(prev => { const n = new Set(prev); n.add(it.key); return n; });
    const label = it.name || it.venue || 'Item';
    window.zwToast(`Removed · ${label}`, 'heartO', {
      label: 'Undo',
      onClick: () => setRemoved(prev => { const n = new Set(prev); n.delete(it.key); return n; }),
    });
  };

  // Signed-out → gate.
  if (isNew) {
    return (
      <ZwSignedOutGate ctx={ctx} icon="heartO"
        title="Your shortlist, saved."
        body="Sign in to keep the places, venues and people you love in one tap-to-rebook list."
        secondaryLabel="Explore places" onSecondary={() => ctx.go('search')}></ZwSignedOutGate>
    );
  }

  return (
    <div data-screen-label="Saved" className="zw-container" style={{ paddingTop: 44, width: '100%' }}>
      <ZwKicker style={{ marginBottom: 10 }}>Your shortlist</ZwKicker>
      <h1 style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600, letterSpacing: '-0.035em', color: 'var(--c-900)' }}>Saved</h1>
      <div style={{ marginTop: 9, fontSize: 13.5, color: 'var(--c-600)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--c-800)', fontVariantNumeric: 'tabular-nums' }}>{live.length}</span> saved
      </div>

      {live.length === 0 ? (
        <div style={{ background: '#fff', border: '1px dashed rgba(28,28,26,0.16)', borderRadius: 22, padding: '60px 28px', textAlign: 'center', marginTop: 28, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-shade)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <ZIcon name="heartO" size={24} color="var(--c-600)"></ZIcon>
          </span>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)', marginBottom: 8 }}>Nothing saved yet</div>
          <p className="txt-pretty" style={{ margin: '0 auto 24px', fontSize: 14.5, lineHeight: 1.55, color: 'var(--c-600)', maxWidth: 360 }}>
            Tap the heart on any place, venue or team member — your favourites collect here for next time.
          </p>
          <ZwButton kind="accent" size="lg" onClick={() => ctx.go('search')}>Browse places</ZwButton>
        </div>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 26, marginBottom: 18, flexWrap: 'wrap' }}>
            <ZwSavedFilters value={kind} onChange={setKind} counts={counts}></ZwSavedFilters>
            <span style={{ flex: 1 }}></span>
            <div style={{ position: 'relative' }}>
              <button className="tap" onClick={() => setSortOpen(o => !o)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--c-700)', padding: '6px 2px' }}>
                <ZIcon name="sliders" size={14} color="var(--c-700)"></ZIcon>
                {ZW_SAVED_SORTS.find(s => s.id === sort).label}
                <ZIcon name="chevD" size={13} color="var(--c-600)"></ZIcon>
              </button>
              {sortOpen && (
                <div className="zv-fade" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 30, background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-lg)', border: '1px solid rgba(28,28,26,0.07)', padding: 6, minWidth: 180 }}>
                  {ZW_SAVED_SORTS.map(s => (
                    <button key={s.id} className="tap zw-hover-row" onClick={() => { setSort(s.id); setSortOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: 0, background: 'transparent', cursor: 'pointer', padding: '9px 12px', borderRadius: 9, fontSize: 13.5, fontWeight: s.id === sort ? 600 : 500, color: 'var(--c-900)' }}>
                      {s.label}
                      {s.id === sort && <ZIcon name="check" size={14} color="var(--p-600)"></ZIcon>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '22px 18px', background: '#fff', border: '1px dashed rgba(28,28,26,0.14)', borderRadius: 14, fontSize: 13.5, color: 'var(--c-600)', textAlign: 'center', maxWidth: 460 }}>
              No {kind === 'place' ? 'businesses' : kind === 'location' ? 'locations' : 'people'} saved yet.
            </div>
          ) : (
            <div className="zv-tab-in" key={kind + sort} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', columnGap: 40, rowGap: 0, paddingBottom: 10 }}>
              {items.map(it => <ZwSavedRow key={it.key} it={it} ctx={ctx} onRemove={removeItem}></ZwSavedRow>)}
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

window.ZW_PAGES.saved = ZwSavedPage;
