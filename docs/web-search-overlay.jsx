// Zavoia Web — search modal. Faithful port of the mobile app's unified
// search sheet (search-sheet.jsx): stacked What? / Where? / When? cards
// (accordion — one always open), carrying the exact same anatomy and data:
//   • What  — input + autocomplete + recents + two-tier browse-by-category
//   • Where — radar current-location + city search + recents + popular
//   • When  — full month calendar picker + quick range pills
// Value contracts match the app:  where = 'current' | <cityId> ;
//   when = 'any' | 'today' | 'tom' | 'week' | 'month' | 'date:YYYY-MM-DD'.

const { useState: useStateSO, useEffect: useEffectSO, useRef: useRefSO, useMemo: useMemoSO } = React;

// ── Local date helpers (ISO YYYY-MM-DD, locale-agnostic) ──
function zwFmtDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function zwParseDateISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}
function zwSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Radar pulse icon (ported from the app's location sheet) ──
function ZwRadarIcon({ size = 32, ringColor, iconColor, bg, pulseKey, children }) {
  const ring = (i) => (
    <span key={i} aria-hidden="true" data-i={i} className="zv-radar-ring"
          style={{ background: 'transparent', border: `1.5px solid ${ringColor}` }}></span>
  );
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: iconColor,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
    }}>
      <span aria-hidden="true" key={pulseKey ?? 0} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {ring(1)}{ring(2)}{ring(3)}
      </span>
      <span style={{ position: 'relative', display: 'inline-flex' }}>{children}</span>
    </span>
  );
}

// ── Stacked card — header row + collapsing body ──
function ZwSheetSection({ label, summary, open, onToggle, maxOpen = 1000, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid rgba(28,28,26,0.06)',
      boxShadow: 'var(--sh-sm)', overflow: 'hidden',
      transition: 'box-shadow .2s var(--ease-soft)',
    }}>
      <button onClick={onToggle} className="tap"
              style={{
                width: '100%', minHeight: 54, background: 'transparent', border: 0, cursor: 'pointer',
                padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{label}</span>
        {!open && (
          <span style={{
            fontSize: 14, fontWeight: 500, color: 'var(--c-600)', letterSpacing: '-0.005em', textAlign: 'right',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%',
          }}>{summary}</span>
        )}
      </button>
      <div style={{
        maxHeight: open ? maxOpen : 0, opacity: open ? 1 : 0, overflow: 'hidden',
        transition: open
          ? 'max-height .42s var(--ease-out), opacity .25s var(--ease-out) .05s'
          : 'max-height .3s var(--ease-soft), opacity .15s var(--ease-soft)',
      }}>
        <div style={{ padding: '0 20px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

// ── What — two-tier browse-by-category (pill scroller + inline expansion) ──
function ZwWhatBrowseGrid({ onPickService, onPickCategory }) {
  const cats = window.ZV_CATEGORIES || [];
  const [openId, setOpenId] = useStateSO(null);
  const open = cats.find(c => c.id === openId) || null;
  const innerRef = useRefSO(null);
  const [expanded, setExpanded] = useStateSO(false);
  const ROW1_H = 58;                       // first row + a blurred peek of the next
  const [maxH, setMaxH] = useStateSO(ROW1_H);

  // Measure the pills' natural height at click time (and on resize while
  // open) so expand/collapse always animates to the right height — no
  // stale measurement, works in every browser.
  const measureFull = () => (innerRef.current ? innerRef.current.scrollHeight : 1000);
  const toggle = () => {
    setExpanded(prev => {
      const next = !prev;
      setMaxH(next ? measureFull() : ROW1_H);
      return next;
    });
  };
  useEffectSO(() => {
    if (!expanded) return;
    const onResize = () => setMaxH(measureFull());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [expanded]);

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ marginBottom: 11, padding: '0 2px' }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: 'var(--c-600)', fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>Browse by category</span>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ maxHeight: maxH, overflow: 'hidden', transition: 'max-height .44s var(--ease-out)' }}>
          <div ref={innerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
            {cats.map((c) => {
              const isOpen = openId === c.id;
              return (
                <button key={c.id} data-cat={c.id} onClick={() => setOpenId(isOpen ? null : c.id)}
                        className="tap zw-hover-lift" aria-pressed={isOpen} aria-label={c.label}
                        style={{
                          flex: '0 0 auto', height: 40, padding: '0 15px 0 12px',
                          background: isOpen ? 'var(--c-ink)' : '#fff',
                          border: `1px solid ${isOpen ? 'var(--c-ink)' : 'rgba(28,28,26,0.09)'}`,
                          borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                          boxShadow: isOpen ? 'none' : '0 1px 2px rgba(28,28,26,0.03)',
                        }}>
                  <ZIcon name={c.icon} size={15} color={isOpen ? '#fff' : c.dot}></ZIcon>
                  <span style={{
                    fontSize: 13.5, fontWeight: 600, color: isOpen ? '#fff' : 'var(--c-900)',
                    letterSpacing: '-0.008em', lineHeight: 1, whiteSpace: 'nowrap',
                  }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Blurred peek — fades the second row while collapsed. Click to expand. */}
        <div aria-hidden="true" onClick={toggle} style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 34,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 92%)',
          backdropFilter: 'blur(2.5px)', WebkitBackdropFilter: 'blur(2.5px)',
          maskImage: 'linear-gradient(to bottom, transparent, #000 62%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 62%)',
          opacity: expanded ? 0 : 1,
          pointerEvents: expanded ? 'none' : 'auto',
          cursor: 'pointer', transition: 'opacity .3s var(--ease-soft)',
        }}></div>
      </div>

      {/* Centered chevron toggle — rotates to point up when expanded */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 7 }}>
        <button onClick={toggle} className="tap zw-hover-lift" aria-expanded={expanded}
                aria-label={expanded ? 'Show fewer categories' : 'Show all categories'}
                style={{
                  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                  background: '#fff', border: '1px solid rgba(28,28,26,0.10)',
                  boxShadow: '0 1px 3px rgba(28,28,26,0.07)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
          <span style={{
            display: 'inline-flex', transition: 'transform .35s var(--ease-out)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <ZIcon name="chevD" size={16} color="var(--c-700)"></ZIcon>
          </span>
        </button>
      </div>

      <div style={{
        maxHeight: open ? 200 : 0, opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-4px)', overflow: 'hidden',
        transition: open
          ? 'max-height .35s var(--ease-out), opacity .25s var(--ease-out) .05s, transform .3s var(--ease-out)'
          : 'max-height .25s var(--ease-soft), opacity .15s var(--ease-soft), transform .2s var(--ease-soft)',
      }}>
        {open && (
          <div style={{
            marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(28,28,26,0.06)',
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            <button onClick={() => onPickCategory(open)} className="tap"
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 999, background: 'var(--c-ink)',
                      color: '#fff', border: '1px solid var(--c-ink)', cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 600, letterSpacing: '-0.005em',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
              All
              {open.count != null && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  color: 'rgba(255,255,255,0.62)', fontVariantNumeric: 'tabular-nums',
                }}>{open.count}</span>
              )}
            </button>
            {(open.tagsPreview || []).map((s) => (
              <button key={s} onClick={() => onPickService(s)} className="tap"
                      style={{
                        height: 32, padding: '0 14px', borderRadius: 999, background: '#fff',
                        border: '1px solid rgba(28,28,26,0.08)', color: 'var(--c-900)', cursor: 'pointer',
                        fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em',
                        display: 'inline-flex', alignItems: 'center',
                      }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── What — text input + autocomplete + recents + browse grid ──
function ZwWhatSection({ value, onChange, recentSearches, onPickRecent, onPickSuggestion, suggestions, autoFocus }) {
  const inputRef = useRefSO(null);
  useEffectSO(() => {
    if (!autoFocus) return;
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 260);
    return () => clearTimeout(id);
  }, []);
  const showAutocomplete = (value || '').trim().length >= 2;

  const eyebrow = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--c-600)', fontFamily: 'var(--font-mono)',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, padding: '0 4px',
  };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '12px 15px',
        background: 'var(--c-100)', borderRadius: 13,
      }}>
        <ZIcon name="search" size={16} color="var(--c-700)"></ZIcon>
        <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)}
               placeholder="All services and businesses"
               style={{
                 flex: 1, border: 0, outline: 'none', background: 'transparent',
                 fontSize: 15, color: 'var(--c-900)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.005em',
               }} />
        {value && (
          <button onClick={() => onChange('')} className="tap" aria-label="Clear"
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: 'var(--c-300)', color: 'var(--c-700)',
                    border: 0, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
            <ZIcon name="x" size={11}></ZIcon>
          </button>
        )}
      </div>

      {showAutocomplete && suggestions && suggestions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={eyebrow}>Suggestions</div>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onPickSuggestion(s)} className="tap zw-hover-row"
                    style={{
                      width: '100%', padding: '11px 8px', background: 'transparent', border: 0, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, borderRadius: 10,
                    }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: s.kind === 'business' ? 'var(--c-100)' : 'var(--p-100)',
                color: s.kind === 'business' ? 'var(--c-800)' : 'var(--p-700)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ZIcon name={s.kind === 'business' ? 'pin' : 'search'} size={14}></ZIcon>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{s.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--c-600)', marginTop: 1 }}>{s.hint}</span>
              </span>
              <ZIcon name="chevR" size={14} color="var(--c-500)"></ZIcon>
            </button>
          ))}
        </div>
      )}

      {!showAutocomplete && recentSearches && recentSearches.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ ...eyebrow, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Recent searches</span>
            <button className="tap" style={{
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--font-sans)',
              fontSize: 11, fontWeight: 600, color: 'var(--c-700)', textTransform: 'none', letterSpacing: '-0.005em',
            }}>Clear</button>
          </div>
          {recentSearches.map((r, i) => (
            <button key={r.id} onClick={() => onPickRecent(r)} className="tap zw-hover-row"
                    style={{
                      width: '100%', padding: '10px 8px', background: 'transparent', border: 0, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, borderRadius: 10,
                    }}>
              <span style={{
                width: 22, height: 22, flexShrink: 0, color: 'var(--c-700)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ZIcon name="arrowUL" size={15}></ZIcon>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontSize: 14.5, fontWeight: 500, color: 'var(--c-900)', letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--c-600)', marginTop: 1 }}>{r.sub}</span>
              </span>
              <ZIcon name="chevR" size={14} color="var(--c-500)"></ZIcon>
            </button>
          ))}
        </div>
      )}

      {!showAutocomplete && (
        <ZwWhatBrowseGrid
          onPickService={(label) => onPickSuggestion({ kind: 'service', label })}
          onPickCategory={(c) => onPickSuggestion({ kind: 'service', label: c.label, catId: c.id })}></ZwWhatBrowseGrid>
      )}
    </div>
  );
}

// ── Where — single city/neighbourhood row ──
function ZwWhereCityRow({ city, selected, onSelect, divider }) {
  const sub = city.kind === 'neighbourhood' ? `${city.parent} · ${city.country}` : city.country;
  return (
    <button onClick={onSelect} className="tap zw-hover-row" aria-pressed={selected}
            style={{
              width: '100%', padding: '10px 8px', background: 'transparent', border: 0, cursor: 'pointer',
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, borderRadius: 10,
              borderBottom: divider ? '1px solid rgba(28,28,26,0.05)' : 'none',
            }}>
      <span style={{
        width: 22, height: 22, flexShrink: 0, color: 'var(--c-700)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ZIcon name={selected ? 'pinSolid' : 'arrowUL'} size={14}></ZIcon>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 14.5, fontWeight: selected ? 600 : 500, color: 'var(--c-900)',
          letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{city.name}</span>
        <span style={{
          display: 'block', fontSize: 11.5, color: 'var(--c-600)', marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{sub}</span>
      </span>
      {selected && (
        <span style={{
          width: 20, height: 20, borderRadius: '50%', background: 'var(--c-ink)', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ZIcon name="check" size={11}></ZIcon>
        </span>
      )}
    </button>
  );
}

// ── Where — current location + city search + recents + popular ──
function ZwWhereSection({ value, onChange }) {
  const cities = window.ZV_CITIES || [];
  const recents = useMemoSO(() => cities.filter(c => c.recent && c.live).slice(0, 3), [cities]);
  const [query, setQuery] = useStateSO('');
  const [granted, setGranted] = useStateSO(false);
  const [pulseKey, setPulseKey] = useStateSO(0);

  const eyebrow = {
    fontSize: 10.5, fontWeight: 700, color: 'var(--c-600)', fontFamily: 'var(--font-mono)',
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, padding: '0 4px',
  };

  const q = query.trim().toLowerCase();
  const matches = q.length >= 1
    ? cities.filter(c => c.live && (
        c.name.toLowerCase().includes(q) || (c.parent || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q)
      )).slice(0, 6)
    : [];
  const isSearching = matches.length > 0;
  const isCurrentSelected = (value === 'current' || value == null) && granted;

  const handleCurrentTap = () => {
    if (!granted) { setGranted(true); setPulseKey(k => k + 1); }
    onChange('current');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button onClick={handleCurrentTap} className="tap" aria-pressed={isCurrentSelected}
              style={{
                width: '100%', padding: '11px 13px', background: 'transparent',
                border: '1px dashed color-mix(in oklch, var(--p-500) 35%, transparent)', borderRadius: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              }}>
        <ZwRadarIcon size={34} pulseKey={pulseKey} bg="transparent" iconColor="var(--p-700)"
                     ringColor="color-mix(in oklch, var(--p-500) 55%, transparent)">
          <ZIcon name="nav" size={15} color="var(--p-700)"></ZIcon>
        </ZwRadarIcon>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.012em', lineHeight: 1.2,
          }}>Use my current location</span>
          <span style={{
            display: 'block', marginTop: 2, fontSize: 12, color: 'var(--c-600)', letterSpacing: '-0.005em', lineHeight: 1.3,
          }}>{granted ? 'Soho, London' : 'Tap to enable'}</span>
        </span>
        {isCurrentSelected ? (
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: 'var(--c-ink)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ZIcon name="check" size={12}></ZIcon>
          </span>
        ) : (
          <span style={{
            fontSize: 12.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.005em',
            display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
          }}>
            {granted ? 'Use this' : 'Enable'}
            <ZIcon name="chevR" size={11} color="var(--c-900)"></ZIcon>
          </span>
        )}
      </button>

      <div style={{
        height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(28,28,26,0.08)',
        background: '#fff', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 1px 2px rgba(28,28,26,0.03)',
      }}>
        <ZIcon name="search" size={14} color="var(--c-700)"></ZIcon>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city or neighbourhood"
               style={{
                 flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontFamily: 'inherit',
                 fontSize: 14, fontWeight: 500, color: 'var(--c-900)', letterSpacing: '-0.008em',
               }} />
        {query && (
          <button onClick={() => setQuery('')} className="tap" aria-label="Clear"
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: 'var(--c-300)', color: 'var(--c-700)',
                    border: 0, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
            <ZIcon name="x" size={11}></ZIcon>
          </button>
        )}
      </div>

      {isSearching && (
        <div>
          <div style={eyebrow}>Results</div>
          {matches.map((c, i) => (
            <ZwWhereCityRow key={c.id} city={c} selected={value === c.id}
                            onSelect={() => { onChange(c.id); setQuery(''); }} divider={i < matches.length - 1}></ZwWhereCityRow>
          ))}
        </div>
      )}

      {!isSearching && recents.length > 0 && (
        <div>
          <div style={eyebrow}>Recent</div>
          {recents.map((c, i) => (
            <ZwWhereCityRow key={c.id} city={c} selected={value === c.id}
                            onSelect={() => onChange(c.id)} divider={i < recents.length - 1}></ZwWhereCityRow>
          ))}
        </div>
      )}

      {!isSearching && (() => {
        const popular = ['soho', 'shoreditch', 'mayfair'].map(id => cities.find(c => c.id === id)).filter(Boolean);
        if (popular.length === 0) return null;
        return (
          <div style={{ paddingTop: 4, borderTop: '1px solid rgba(28,28,26,0.06)' }}>
            <div style={{ ...eyebrow, marginBottom: 8, marginTop: 10 }}>Popular</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {popular.map((c) => {
                const active = value === c.id;
                return (
                  <button key={c.id} onClick={() => onChange(c.id)} className="tap" aria-pressed={active}
                          style={{
                            height: 34, padding: '0 15px', borderRadius: 999,
                            background: active ? 'var(--c-ink)' : '#fff', color: active ? '#fff' : 'var(--c-900)',
                            border: `1px solid ${active ? 'var(--c-ink)' : 'rgba(28,28,26,0.08)'}`,
                            cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em',
                            display: 'inline-flex', alignItems: 'center',
                          }}>{c.name}</button>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── When — month calendar picker ──
function ZwMonthPicker({ value, onPick, today }) {
  const tomorrow = (() => { const d = new Date(today); d.setDate(today.getDate() + 1); return d; })();
  const pickedDate = (() => {
    if (typeof value !== 'string') return null;
    if (value.startsWith('date:')) return zwParseDateISO(value.slice(5));
    if (value === 'today') return today;
    if (value === 'tom') return tomorrow;
    return null;
  })();

  const seed = pickedDate || today;
  const [view, setView] = useStateSO({ year: seed.getFullYear(), month: seed.getMonth() });
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstOfMonth = new Date(view.year, view.month, 1);
  const dowMon = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - dowMon);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });
  const stepMonth = (delta) => setView(v => {
    const d = new Date(v.year, v.month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const navBtn = {
    width: 32, height: 32, borderRadius: '50%', background: 'transparent',
    border: '1px solid rgba(28,28,26,0.08)', cursor: 'pointer', padding: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{
      padding: '14px 14px 12px', borderRadius: 14, border: '1px solid rgba(28,28,26,0.07)',
      background: '#fff', boxShadow: '0 1px 2px rgba(28,28,26,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, padding: '0 2px' }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--c-900)', letterSpacing: '-0.012em' }}>{monthLabel}</span>
        <div style={{ display: 'inline-flex', gap: 6 }}>
          <button onClick={() => stepMonth(-1)} className="tap" aria-label="Previous month" style={navBtn}>
            <ZIcon name="chevL" size={14} color="var(--c-900)"></ZIcon>
          </button>
          <button onClick={() => stepMonth(1)} className="tap" aria-label="Next month" style={navBtn}>
            <ZIcon name="chevR" size={14} color="var(--c-900)"></ZIcon>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DOW.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.05em', color: 'var(--c-500)', padding: '4px 0',
          }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === view.month;
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday = zwSameDay(d, today);
          const isPicked = zwSameDay(d, pickedDate);
          const disabled = isPast;
          return (
            <button key={i} type="button" disabled={disabled}
                    onClick={() => !disabled && onPick(`date:${zwFmtDateISO(d)}`)}
                    aria-label={d.toDateString()} aria-pressed={isPicked}
                    className={disabled ? '' : 'zw-cal-day'}
                    style={{
                      height: 38, background: isPicked ? 'var(--p-500)' : 'transparent',
                      color: isPicked ? '#fff' : (disabled ? 'var(--c-400)' : (inMonth ? 'var(--c-900)' : 'var(--c-500)')),
                      border: isToday && !isPicked ? '1px solid var(--p-500)' : '1px solid transparent',
                      borderRadius: 999, cursor: disabled ? 'default' : 'pointer', padding: 0,
                      fontSize: 13.5, fontWeight: isPicked ? 700 : (isToday ? 700 : 500),
                      fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.005em',
                      transition: 'background-color .15s var(--ease-soft), color .15s var(--ease-soft)',
                    }}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── When — month picker + quick range pills ──
function ZwWhenSection({ value, onChange }) {
  const presets = (window.ZV_WHEN_PRESETS || []).filter(p => ['week', 'month', 'pick'].indexOf(p.id) === -1);
  const t = window.ZV_TODAY || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
  const today = new Date(t.year, t.month, t.day);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ZwMonthPicker value={value} onPick={onChange} today={today}></ZwMonthPicker>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {presets.map(p => {
          const active = value === p.id;
          return (
            <button key={p.id} onClick={() => onChange(p.id)} className="tap"
                    style={{
                      height: 40, padding: '0 16px', background: active ? 'var(--c-ink)' : '#fff',
                      color: active ? '#fff' : 'var(--c-900)',
                      border: `1px solid ${active ? 'var(--c-ink)' : 'rgba(28,28,26,0.10)'}`,
                      borderRadius: 999, cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
                      letterSpacing: '-0.005em', display: 'inline-flex', alignItems: 'center',
                    }}>{p.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Summary resolvers (value → display string) ──
function zwWhereSummary(where) {
  if (!where || where === 'current') return 'Current location';
  if (where === 'map') return 'Choose on map';
  const c = (window.ZV_CITIES || []).find(x => x.id === where);
  if (!c) return 'Anywhere';
  return c.kind === 'neighbourhood' ? `${c.name}, ${c.parent}` : c.name;
}
function zwWhenSummary(when) {
  if (typeof when === 'string' && when.startsWith('date:')) {
    const t = window.ZV_TODAY; const today = new Date(t.year, t.month, t.day);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const d = zwParseDateISO(when.slice(5));
    if (!d) return 'Any time';
    if (zwSameDay(d, today)) return 'Today';
    if (zwSameDay(d, tomorrow)) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return (window.ZV_WHEN_PRESETS.find(p => p.id === when) || {}).label || 'Any time';
}
// Reverse-map a stored ctx.query display string back to an internal id.
function zwWhereIdFromLabel(s) {
  if (!s || s === 'Current location') return s === 'Current location' ? 'current' : 'soho';
  const cities = window.ZV_CITIES || [];
  const c = cities.find(x => (x.kind === 'neighbourhood' ? `${x.name}, ${x.parent}` : x.name) === s)
         || cities.find(x => x.name === s);
  return c ? c.id : 'soho';
}
function zwWhenIdFromLabel(s) {
  if (!s) return 'any';
  const p = (window.ZV_WHEN_PRESETS || []).find(x => x.label === s);
  return p ? p.id : 'any';
}

// ── Search modal ──
function ZwSearchOverlay({ ctx, onClose, initialCard }) {
  const [openCard, setOpenCard] = useStateSO(initialCard || 'what');
  const toggleCard = (id) => setOpenCard(prev => prev === id ? 'what' : id);
  const [what, setWhat] = useStateSO(ctx.query.what || '');
  const [where, setWhere] = useStateSO(() => zwWhereIdFromLabel(ctx.query.where));
  const [when, setWhen] = useStateSO(() => zwWhenIdFromLabel(ctx.query.when));

  const cardRef = useRefSO(null);
  const backRef = useRefSO(null);
  const closingRef = useRefSO(false);

  // Premium entrance: backdrop fades, card scales + lifts into place.
  // Driven by a timer (not rAF) so an unfocused preview still resolves to
  // the visible end state.
  useEffectSO(() => {
    const onKey = (e) => { if (e.key === 'Escape') beginClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    const card = cardRef.current;
    const back = backRef.current;
    const timers = [];
    if (card) {
      if (back) back.style.opacity = '0';
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px) scale(0.965)';
      card.getBoundingClientRect();
      timers.push(setTimeout(() => {
        if (back) { back.style.transition = 'opacity .34s var(--ease-out)'; back.style.opacity = '1'; }
        card.style.transition = 'transform .5s var(--ease-out), opacity .34s var(--ease-out)';
        card.style.transform = 'translateY(0) scale(1)';
        card.style.opacity = '1';
      }, 24));
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      timers.forEach(clearTimeout);
    };
  }, []);

  const beginClose = (after) => {
    if (closingRef.current) return;
    closingRef.current = true;
    const card = cardRef.current;
    const back = backRef.current;
    if (back) { back.style.transition = 'opacity .3s var(--ease-soft)'; back.style.opacity = '0'; }
    if (card) {
      card.style.transition = 'transform .32s var(--ease-soft), opacity .28s var(--ease-soft)';
      card.style.transform = 'translateY(12px) scale(0.975)';
      card.style.opacity = '0';
      setTimeout(() => { onClose(); if (after) after(); }, 300);
    } else {
      onClose(); if (after) after();
    }
  };

  const lc = (what || '').toLowerCase();
  const suggestions = lc.length >= 2
    ? (window.ZV_SUGGESTIONS[lc.slice(0, 3)] || window.ZV_SUGGESTIONS[lc.slice(0, 2)] || [])
    : [];

  const whatSummary = (what && what.trim()) || 'All services';
  const whereSummary = zwWhereSummary(where);
  const whenSummary = zwWhenSummary(when);

  const submit = () => {
    ctx.setQuery({
      what: (what || '').trim(),
      where: whereSummary,
      when: when === 'any' ? '' : whenSummary,
    });
    beginClose(() => ctx.go('search'));
  };

  return (
    <div ref={backRef}
         onClick={(e) => { if (e.target === e.currentTarget) beginClose(); }}
         style={{
           position: 'fixed', inset: 0, zIndex: 300,
           background: 'rgba(28,28,26,0.40)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
           display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
           padding: '6vh 16px 40px', overflowY: 'auto',
         }}>
      <div ref={cardRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search"
           style={{
             width: '100%', maxWidth: 600, background: 'var(--c-canvas)', borderRadius: 28,
             boxShadow: 'var(--sh-xl)', border: '1px solid rgba(28,28,26,0.06)',
             display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '88vh',
             willChange: 'transform',
           }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>
            What can we help you find?
          </span>
          <button onClick={() => beginClose()} className="tap" aria-label="Close search"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(28,28,26,0.10)',
                    background: '#fff', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
            <ZIcon name="x" size={16} color="var(--c-800)"></ZIcon>
          </button>
        </div>

        {/* Sections */}
        <div className="zw-noscrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ZwSheetSection label="What?" summary={whatSummary} open={openCard === 'what'} maxOpen={1100} onToggle={() => toggleCard('what')}>
            <ZwWhatSection value={what} onChange={setWhat} autoFocus
                           recentSearches={window.ZV_RECENT_SEARCHES}
                           onPickRecent={(r) => { setWhat(r.label); setOpenCard('where'); }}
                           onPickSuggestion={(s) => { setWhat(s.label); setOpenCard('where'); }}
                           suggestions={suggestions}></ZwWhatSection>
          </ZwSheetSection>

          <ZwSheetSection label="Where?" summary={whereSummary} open={openCard === 'where'} maxOpen={900} onToggle={() => toggleCard('where')}>
            <ZwWhereSection value={where} onChange={(v) => { setWhere(v); setOpenCard('when'); }}></ZwWhereSection>
          </ZwSheetSection>

          <ZwSheetSection label="When?" summary={whenSummary} open={openCard === 'when'} maxOpen={900} onToggle={() => toggleCard('when')}>
            <ZwWhenSection value={when} onChange={setWhen}></ZwWhenSection>
          </ZwSheetSection>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderTop: '1px solid rgba(28,28,26,0.07)', background: '#fff', flexShrink: 0,
        }}>
          <button className="tap" onClick={() => { setWhat(''); setWhere('soho'); setWhen('any'); setOpenCard('what'); }}
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    color: 'var(--c-700)', textDecoration: 'underline', textUnderlineOffset: 3,
                  }}>
            Clear all
          </button>
          <ZwButton kind="accent" size="lg" onClick={submit} style={{ padding: '14px 34px' }}>
            <ZIcon name="search" size={16} color="#fff"></ZIcon>
            Search
          </ZwButton>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ZwSearchOverlay });
