// Zavoia Web — shell: hash router, top nav, search overlay, footer,
// toast host, mobile tab bar, and the root <ZwApp/>.
//
// Pages register themselves on window.ZW_PAGES = { key: Component }.
// Every page receives `ctx`: { go, route, userState, favs, toggleFav,
// openBooking, openSearch, query, setQuery }.

const { useState: useStateSH, useEffect: useEffectSH, useMemo: useMemoSH, useRef: useRefSH } = React;

window.ZW_PAGES = window.ZW_PAGES || {};

// ─────────────────────────────────────────────
// Router — hash-based so refresh / back-forward work
// ─────────────────────────────────────────────
function zwParseHash() {
  const h = (location.hash || '#/home').replace(/^#\/?/, '');
  const [page, ...rest] = h.split('/');
  return { page: page || 'home', id: rest.join('/') || null };
}
function zwGo(path) {
  location.hash = path.startsWith('#') ? path : '#/' + path.replace(/^\//, '');
}

// Per-route document titles — tabs, history and SEO all read these.
function zwDocTitle(route) {
  const map = {
    home: 'Book local, brilliantly', all: 'All businesses', search: 'Search',
    appointments: 'Appointments', saved: 'Saved', support: 'Your tickets', offers: 'Offers', help: 'Help centre',
    account: 'Profile & settings',
    blog: 'The Journal', 'for-business': 'Zavoia for Business', pricing: 'Pricing',
    about: 'About', legal: 'Policies', local: 'Zavoia in London',
  };
  let t = map[route.page] || 'Page not found';
  try {
    if (route.page === 'blog' && route.id) {
      const p = (window.ZW_BLOG_POSTS || []).find(p => p.id === route.id);
      if (p) t = p.title;
    } else if (route.page === 'biz' && route.id) {
      const b = (window.ZV_BUSINESSES || []).find(b => b.id === route.id);
      if (b) t = b.name;
    } else if (route.page === 'legal' && route.id) {
      const d = (window.ZW_LEGAL_DOCS || {})[route.id];
      if (d) t = d.title;
    } else if (route.page === 'help' && route.id) {
      const a = window.zwHelpArticle && window.zwHelpArticle(route.id);
      if (a) t = a.title;
    } else if (route.page === 'local' && route.id) {
      const parts = route.id.split('/');
      const cat = (window.ZW_LOCAL_CATS || {})[parts[1]];
      const area = (window.ZW_LOCAL_AREAS || []).find(a => a.id === parts[0]);
      if (cat) t = cat.noun + ' in ' + (area && parts[0] !== 'london' ? area.name + ', London' : 'London');
      else if (parts[0]) t = 'Zavoia in ' + parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch (e) { /* data not loaded yet — fall back to map */ }
  document.title = t + ' · Zavoia';
}
function useHashRoute() {
  const [route, setRoute] = useStateSH(zwParseHash);
  useEffectSH(() => {
    zwDocTitle(zwParseHash());
    const onHash = () => {
      const r = zwParseHash();
      setRoute(r);
      zwDocTitle(r);
      const sc = document.getElementById('zw-page-scroll');
      window.scrollTo(0, 0);
      if (sc) sc.scrollTop = 0;
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

// ─────────────────────────────────────────────
// Footer newsletter — slim Journal signup in the brand column
// ─────────────────────────────────────────────
function ZwFooterNewsletter() {
  const [email, setEmail] = useStateSH('');
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    window.zwToast('Subscribed — see you Thursday', 'check');
    setEmail('');
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 300 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)',
      }}>The Journal, weekly</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="email" value={email} required placeholder="you@example.com"
               onChange={(e) => setEmail(e.target.value)} aria-label="Email address"
               style={{
                 flex: 1, minWidth: 0, border: '1px solid rgba(28,28,26,0.14)', borderRadius: 999,
                 padding: '9px 15px', fontSize: 13, background: '#fff', color: 'var(--c-900)',
                 outline: 'none', letterSpacing: '-0.01em', fontFamily: 'inherit',
               }} />
        <ZwButton kind="primary" size="sm" onClick={submit}>Subscribe</ZwButton>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Toast — window.zwToast(text, icon?)
// ─────────────────────────────────────────────
function ZwToastHost() {
  const [toast, setToast] = useStateSH(null);
  const [leaving, setLeaving] = useStateSH(false);
  useEffectSH(() => {
    let t1, t2;
    window.zwToast = (text, icon = 'check', action = null) => {
      clearTimeout(t1); clearTimeout(t2);
      setLeaving(false);
      setToast({ text, icon, action, key: Date.now() });
      const hold = action ? 4200 : 2600;
      t1 = setTimeout(() => setLeaving(true), hold);
      t2 = setTimeout(() => setToast(null), hold + 350);
    };
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      zIndex: 400, pointerEvents: 'none',
    }}>
      <div key={toast.key} className={'zv-toast' + (leaving ? ' zv-toast--out' : '')}
           style={{
             background: 'var(--c-ink)', color: '#fff', borderRadius: 999,
             padding: toast.action ? '9px 9px 9px 14px' : '11px 20px 11px 14px', fontSize: 14, fontWeight: 500,
             display: 'flex', alignItems: 'center', gap: 9,
             boxShadow: 'var(--sh-lg)', letterSpacing: '-0.01em', pointerEvents: 'auto',
           }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: 'var(--p-500)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ZIcon name={toast.icon} size={12} color="#fff"></ZIcon>
        </span>
        {toast.text}
        {toast.action && (
          <button className="tap" onClick={() => { toast.action.onClick && toast.action.onClick(); setLeaving(true); setTimeout(() => setToast(null), 320); }}
                  style={{
                    marginLeft: 4, padding: '6px 14px', borderRadius: 999, border: 0, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  }}>
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Favorites — localStorage-backed set
// ─────────────────────────────────────────────
function useFavorites() {
  const [favs, setFavs] = useStateSH(() => {
    try { return new Set(JSON.parse(localStorage.getItem('zw-favs') || '[]')); }
    catch (e) { return new Set(); }
  });
  const toggleFav = (id) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); window.zwToast('Removed from Saved', 'x'); }
      else { next.add(id); window.zwToast('Saved', 'heart'); }
      localStorage.setItem('zw-favs', JSON.stringify([...next]));
      return next;
    });
  };
  return [favs, toggleFav];
}

// ─────────────────────────────────────────────
// Top navigation
// ─────────────────────────────────────────────

function ZwNavSearchPill({ query, onOpen }) {
  const ref = useRefSH(null);
  const what  = (query && query.what)  || 'Anything';
  const where = (query && query.where) || 'Soho, London';
  const when  = (query && query.when)  || 'Any time';
  const dimWhat  = !(query && query.what);
  const dimWhere = !(query && query.where);
  const dimWhen  = !(query && query.when);

  const open = (step) => onOpen(ref.current, step);

  const Seg = ({ step, label, value, dim, grow }) => (
    <button type="button" className="zw-pill-seg tap" onClick={() => open(step)}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1,
              background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left',
              padding: '6px 16px', minWidth: 0, flex: grow ? '1 1 auto' : '0 1 auto',
              borderRadius: 999,
            }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
        letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--c-500)', lineHeight: 1,
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: dim ? 500 : 600, letterSpacing: '-0.01em', lineHeight: 1.25,
        color: dim ? 'var(--c-600)' : 'var(--c-900)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</span>
    </button>
  );
  const Div = () => <span aria-hidden="true" style={{ width: 1, height: 26, background: 'rgba(28,28,26,0.10)', flexShrink: 0 }}></span>;

  return (
    <div ref={ref} className="zw-nav-pill" role="search"
         style={{
           display: 'flex', alignItems: 'center', minWidth: 0, maxWidth: 'min(100%, 460px)',
           height: 48, background: '#fff', border: '1px solid rgba(28,28,26,0.10)',
           borderRadius: 999, paddingRight: 5, paddingLeft: 4,
           boxShadow: '0 1px 2px rgba(28,28,26,0.05), 0 4px 12px rgba(28,28,26,0.04)',
         }}>
      <Seg step="what"  label="What"  value={what}  dim={dimWhat}  grow={true}></Seg>
      <Div></Div>
      <Seg step="where" label="Where" value={where} dim={dimWhere} grow={true}></Seg>
      <Div></Div>
      <Seg step="when"  label="When"  value={when}  dim={dimWhen}></Seg>
      <button type="button" className="tap zw-pill-go" aria-label="Search" onClick={() => open('what')}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--p-500)', border: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 6, flexShrink: 0, cursor: 'pointer',
              }}>
        <ZIcon name="search" size={15} color="#fff"></ZIcon>
      </button>
    </div>
  );
}

function ZwTopNav({ ctx }) {
  const { route, go, userState, openSearch, query } = ctx;
  const onHome = route.page === 'home';
  const [notifOpen, setNotifOpen] = useStateSH(false);
  const [acctOpen, setAcctOpen] = useStateSH(false);
  const [auth, setAuth] = useStateSH(null); // null | 'signin' | 'signup'
  const [notifs, setNotifs] = useStateSH(() => window.ZW_NOTIFS || []);
  // On the homepage the pill stays hidden until the hero search scrolls
  // away, then pops into the nav (Airbnb-style morph).
  const [pastHero, setPastHero] = useStateSH(false);
  useEffectSH(() => {
    if (!onHome) { setPastHero(false); return; }
    const fn = () => setPastHero(window.scrollY > 440);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [onHome]);
  const showPill = !onHome || pastHero;
  const unread = notifs.some(n => n.unread);
  const signIn = () => {
    setAuth(null);
    ctx.setUserState('returning');
    window.zwToast('Welcome back, ' + window.ZW_USER.name.split(' ')[0], 'check');
  };
  const signOut = () => {
    ctx.setUserState('new');
    window.zwToast('Signed out', 'check');
  };
  return (
    <header className="zv-frost" style={{
      position: 'sticky', top: 0, zIndex: 90,
      borderBottom: '1px solid rgba(28,28,26,0.06)',
    }}>
      <div className="zw-container" style={{
        height: 'var(--nav-h)', display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Wordmark */}
        <a href="#/home" aria-label="Zavoia home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src="assets/wordmark-cropped.png" alt="Zavoia" style={{ height: 28, width: 'auto' }} />
        </a>

        {/* Explore → the map / search view (distinct from the logo, which
            goes to the editorial home). Appointments & Saved live in the
            account menu, not here. */}
        <nav className="zw-only-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0, marginLeft: 14 }}>
          <a href="#/search"
             className={'zw-navlink' + (['search', 'all', 'local', 'biz', 'pro'].includes(route.page) ? ' zw-navlink--on' : '')}>Explore</a>
        </nav>

        {/* Compact search pill — pops in once the home hero scrolls away */}
        <div className="zw-only-desktop" style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          {showPill && (
            <div className={onHome ? 'zw-pill-pop' : ''} style={{ minWidth: 0, maxWidth: '100%', display: 'flex' }}>
              <ZwNavSearchPill query={query} onOpen={openSearch}></ZwNavSearchPill>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} className="zw-only-mobile"></div>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <a href="#/for-business"
             className={'zw-only-desktop zw-navlink' + (route.page === 'for-business' || route.page === 'pricing' ? ' zw-navlink--on' : '')}
             style={{ marginRight: 12 }}>For business</a>
          <button className="tap zw-only-mobile" onClick={openSearch} aria-label="Search"
                  style={{
                    width: 38, height: 38, borderRadius: '50%', border: 0,
                    background: 'transparent', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
            <ZIcon name="search" size={18} color="var(--c-800)"></ZIcon>
          </button>

          {userState === 'returning' ? (
            <React.Fragment>
              <button className="tap zw-hover-row zw-only-desktop" aria-label="Notifications"
                      onClick={() => { setAcctOpen(false); setNotifOpen(o => !o); }}
                      style={{
                        width: 38, height: 38, borderRadius: '50%', border: 0,
                        background: notifOpen ? 'var(--c-100)' : 'transparent', cursor: 'pointer', position: 'relative',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                <ZIcon name="bell" size={18} color="var(--c-700)"></ZIcon>
                {unread && <span style={{
                  position: 'absolute', top: 7, right: 8, width: 7, height: 7,
                  borderRadius: '50%', background: 'var(--p-500)',
                  boxShadow: '0 0 0 2px var(--c-canvas)',
                }}></span>}
              </button>
              <button className="tap" aria-label="Account"
                      onClick={() => { setNotifOpen(false); setAcctOpen(o => !o); }}
                      style={{
                        width: 34, height: 34, borderRadius: '50%', border: 0, padding: 0,
                        marginLeft: 6, cursor: 'pointer', overflow: 'hidden', background: 'var(--c-300)',
                        boxShadow: acctOpen
                          ? '0 0 0 2px var(--c-canvas), 0 0 0 4px var(--c-ink)'
                          : '0 0 0 1px rgba(28,28,26,0.08)',
                      }}>
                <ZAvatar src={window.ZW_USER.avatar} name={window.ZW_USER.name} size={34}></ZAvatar>
              </button>
            </React.Fragment>
          ) : (
            <ZwButton kind="primary" size="sm"
                      onClick={() => setAuth('signin')}
                      style={{ padding: '9px 18px' }}>Sign in</ZwButton>
          )}
        </div>
      </div>

      {notifOpen && (
        <ZwNotifPanel ctx={ctx} onClose={() => setNotifOpen(false)} notifs={notifs}
                      onMarkAll={() => setNotifs(ns => ns.map(n => ({ ...n, unread: false })))}></ZwNotifPanel>
      )}
      {acctOpen && (
        <ZwAccountMenu ctx={ctx} onClose={() => setAcctOpen(false)} onSignOut={signOut}></ZwAccountMenu>
      )}
      {auth && (
        <ZwAuthModal mode={auth} onClose={() => setAuth(null)} onSignIn={signIn}></ZwAuthModal>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────
// Mobile bottom tab bar — continuity with the app
// ─────────────────────────────────────────────
function ZwMobileTabs({ ctx }) {
  const { route, userState } = ctx;
  const tabs = userState === 'returning'
    ? [
        { key: 'home',         icon: 'home',   label: 'Explore' },
        { key: 'search',       icon: 'search', label: 'Search' },
        { key: 'appointments', icon: 'cal',    label: 'Bookings' },
        { key: 'saved',        icon: 'heartO', label: 'Saved' },
        { key: 'help',         icon: 'info',   label: 'Help' },
      ]
    : [
        { key: 'home',    icon: 'home',   label: 'Explore' },
        { key: 'search',  icon: 'search', label: 'Search' },
        { key: 'offers',  icon: 'sparkle', label: 'Offers' },
        { key: 'help',    icon: 'info',   label: 'Help' },
      ];
  return (
    <nav className="zw-only-mobile zv-frost" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 95,
      borderTop: '1px solid rgba(28,28,26,0.07)',
      display: 'flex', justifyContent: 'space-around',
      padding: '6px 8px calc(8px + env(safe-area-inset-bottom))',
    }}>
      {tabs.map(t => {
        const active = route.page === t.key ||
          (t.key === 'home' && ['biz', 'pro'].includes(route.page)) ||
          (t.key === 'help' && route.page === 'support') ||
          (t.key === 'appointments' && route.page === 'appt');
        return (
          <a key={t.key} href={'#/' + t.key} className="tap"
             style={{
               display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
               textDecoration: 'none', padding: '6px 10px', minWidth: 52, borderRadius: 12,
             }}>
            <ZIcon name={active && t.key === 'home' ? 'homeF' : t.icon} size={21}
                   color={active ? 'var(--p-600)' : 'var(--c-500)'}></ZIcon>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.01em',
              color: active ? 'var(--p-600)' : 'var(--c-500)',
            }}>{t.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────
function ZwFooter({ ctx }) {
  const col = { display: 'flex', flexDirection: 'column', gap: 11 };
  const head = {
    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)',
    marginBottom: 4,
  };
  const link = {
    background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
    fontSize: 14, color: 'var(--c-700)', textAlign: 'left', letterSpacing: '-0.01em',
  };
  const noop = (label) => () => window.zwToast(label + ' — out of prototype scope', 'info');
  return (
    <footer style={{ background: 'var(--c-shade)', marginTop: 72 }}>
      <div className="zw-container" style={{ padding: '52px var(--gutter) 36px' }}>
        <div className="zw-footer-grid">
          <div style={{ ...col, gap: 14 }}>
            <img src="assets/wordmark-cropped.png" alt="Zavoia" style={{ height: 28, width: 'auto', alignSelf: 'flex-start' }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--c-600)', maxWidth: 300 }} className="txt-pretty">
              Book trusted local professionals — beauty, health, home and more — in a couple of clicks.
            </p>
            <ZwFooterNewsletter></ZwFooterNewsletter>
          </div>
          <div style={col}>
            <div style={head}>Explore</div>
            <button className="zw-link" style={link} onClick={() => ctx.go('offers')}>Offers</button>
            {[['Hair', 'hair'], ['Nails', 'nails'], ['Massage', 'massage'], ['Dental', 'dental'], ['Auto', 'auto'], ['Cleaning', 'cleaning']].map(([label, cat]) => (
              <button key={cat} className="zw-link" style={link} onClick={() => ctx.go('local/london/' + cat)}>{label}</button>
            ))}
          </div>
          <div style={col}>
            <div style={head}>Near you</div>
            {[['Hair in Soho', 'local/soho/hair'], ['Barbers in Shoreditch', 'local/shoreditch/hair'],
              ['Nails in Notting Hill', 'local/notting-hill/nails'], ['Massage in Mayfair', 'local/mayfair/massage'],
              ['Cleaning in Hackney', 'local/hackney/cleaning'], ['All of London', 'local/london']].map(([label, path]) => (
              <button key={path} className="zw-link" style={link} onClick={() => ctx.go(path)}>{label}</button>
            ))}
          </div>
          <div style={col}>
            <div style={head}>Zavoia</div>
            <button className="zw-link" style={link} onClick={() => ctx.go('about')}>About</button>
            <button className="zw-link" style={link} onClick={() => ctx.go('blog')}>Journal</button>
            <button className="zw-link" style={link} onClick={() => ctx.go('for-business')}>For business</button>
            <button className="zw-link" style={link} onClick={() => ctx.go('pricing')}>Pricing</button>
            <button className="zw-link" style={link} onClick={() => window.zwOpenBizDashboard()}>Business dashboard</button>
          </div>
          <div style={col}>
            <div style={head}>Support</div>
            <button className="zw-link" style={link} onClick={() => ctx.go('help')}>Help centre</button>
            <button className="zw-link" style={link} onClick={() => ctx.go('support')}>My tickets</button>
            <button className="zw-link" style={link} onClick={() => ctx.go('legal/cancellation')}>Cancellation policy</button>
          </div>
        </div>
        <div style={{
          marginTop: 44, paddingTop: 22, borderTop: '1px solid rgba(28,28,26,0.08)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18,
          fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--c-500)',
        }}>
          <span>© 2026 ZAVOIA</span>
          <button className="zw-link" style={{ ...link, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--c-500)' }} onClick={() => ctx.go('legal/privacy')}>PRIVACY</button>
          <button className="zw-link" style={{ ...link, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--c-500)' }} onClick={() => ctx.go('legal/terms')}>TERMS</button>
          <span style={{ flex: 1 }}></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ZIcon name="globe" size={13} color="var(--c-500)"></ZIcon>
            ENGLISH (UK) · GBP £
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// 404 — unknown routes land somewhere designed, not on a silent fallback
// ─────────────────────────────────────────────
function ZwNotFound({ ctx }) {
  return (
    <div data-screen-label="404" className="zw-container" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: 'clamp(80px, 12vw, 160px) var(--gutter)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.18em', color: 'var(--p-600)',
      }}>ERROR · 404</div>
      <h1 className="txt-balance" style={{
        margin: '18px 0 0', fontSize: 'clamp(34px, 4.5vw, 56px)', fontWeight: 600,
        letterSpacing: '-0.042em', lineHeight: 1, color: 'var(--c-900)',
      }}>This page took the day off.</h1>
      <p style={{ margin: '18px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 420 }} className="txt-pretty">
        The address doesn't match anything on Zavoia. The rest of the city is still bookable, though.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30, justifyContent: 'center' }}>
        <ZwButton kind="primary" size="lg" onClick={() => ctx.go('home')}>Back to Explore</ZwButton>
        <ZwButton kind="secondary" size="lg" onClick={() => ctx.go('all')}>Browse businesses</ZwButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root app
// ─────────────────────────────────────────────
const ZW_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "userState": "returning",
  "contentWidth": 1232,
  "cardCorners": 18,
  "spotlightTone": "dark",
  "helpRequests": "Live"
}/*EDITMODE-END*/;

function ZwApp() {
  const [t, setTweak] = useTweaks(ZW_TWEAK_DEFAULTS);
  const route = useHashRoute();
  const [favs, toggleFav] = useFavorites();
  const [searchOpen, setSearchOpen] = useStateSH(false);
  const [searchOrigin, setSearchOrigin] = useStateSH(null);
  const [searchStep, setSearchStep] = useStateSH('what');
  const [booking, setBooking] = useStateSH(null); // { bizId, serviceId?, proName? }
  const [query, setQuery] = useStateSH({ what: '', where: '', when: '' });

  // Navigating to a different page closes overlays (e.g. browser back
  // while the booking drawer or search overlay is open).
  useEffectSH(() => {
    setBooking(null);
    setSearchOpen(false);
  }, [route.page, route.id]);

  // Recently viewed — remember the last 8 business pages for the
  // "Pick up where you left off" rail on the homepage.
  useEffectSH(() => {
    if (route.page !== 'biz' || !route.id) return;
    try {
      const k = 'zw-recent-views';
      const cur = JSON.parse(localStorage.getItem(k) || '[]').filter(id => id !== route.id);
      cur.unshift(route.id);
      localStorage.setItem(k, JSON.stringify(cur.slice(0, 8)));
    } catch (e) { /* storage unavailable — rail just stays hidden */ }
  }, [route.page, route.id]);

  // Scroll-reveal — tag below-the-fold sections of the new page so they
  // rise + fade in on first viewport entry. Sections already visible at
  // load are left untouched; reduced-motion users see everything static.
  // Belt-and-braces: if IntersectionObserver never delivers (throttled
  // tabs, odd embeds), a scroll fallback + watchdog force-reveal so
  // content can never stay hidden.
  useEffectSH(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let io, watchdog;
    const revealInView = () => {
      document.querySelectorAll('main section.zw-reveal:not(.zw-reveal-in)').forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) s.classList.add('zw-reveal-in');
      });
    };
    const revealAll = () => {
      document.querySelectorAll('main section.zw-reveal:not(.zw-reveal-in)').forEach((s) => s.classList.add('zw-reveal-in'));
    };
    const t = setTimeout(() => {
      try {
        io = new IntersectionObserver((entries) => {
          io.__alive = true; // IO always delivers an initial callback — silence means it's dead
          entries.forEach((en) => {
            if (en.isIntersecting) { en.target.classList.add('zw-reveal-in'); io.unobserve(en.target); }
          });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      } catch (e) { io = null; }
      document.querySelectorAll('main section').forEach((s) => {
        if (s.classList.contains('zw-reveal')) return;
        const r = s.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return; // in view at load — show as-is
        s.classList.add('zw-reveal');
        if (io) io.observe(s);
      });
      if (!io) { revealAll(); return; }
      // Watchdog: IO always fires an initial callback for observed elements.
      // If it stays silent for 2.5s it's dead in this environment — force-
      // reveal everything and fall back to the scroll listener. If it's
      // alive, leave the animation to IO (scroll listener stays as a
      // harmless second net).
      window.addEventListener('scroll', revealInView, { passive: true });
      watchdog = setTimeout(() => { if (!io.__alive) revealAll(); }, 2500);
    }, 80);
    return () => {
      clearTimeout(t);
      clearTimeout(watchdog);
      window.removeEventListener('scroll', revealInView);
      if (io) io.disconnect();
    };
  }, [route.page, route.id]);

  const ctx = {
    go: zwGo, route,
    userState: t.userState,
    setUserState: (v) => setTweak('userState', v),
    favs, toggleFav,
    query, setQuery,
    spotlightTone: t.spotlightTone,
    helpRequests: t.helpRequests,
    openSearch: (arg, step) => {
      const el = arg && arg.currentTarget ? arg.currentTarget : arg;
      const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      setSearchOrigin(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
      setSearchStep(typeof step === 'string' ? step : 'what');
      setSearchOpen(true);
    },
    openBooking: (opts) => setBooking(opts || { bizId: 'glow-soho' }),
    closeBooking: () => setBooking(null),
  };

  const Page = window.ZW_PAGES[route.page] || ZwNotFound;
  const isMapPage = route.page === 'search';

  return (
    <div style={{ '--content-max': t.contentWidth + 'px', '--card-r': t.cardCorners + 'px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ZwTopNav ctx={ctx}></ZwTopNav>
      <main key={route.page + ':' + (route.id || '')} className="zw-page-in"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Page ctx={ctx}></Page>
      </main>
      {!isMapPage && <ZwFooter ctx={ctx}></ZwFooter>}
      {!isMapPage && <div className="zw-only-mobile" style={{ height: 70 }}></div>}

      <ZwMobileTabs ctx={ctx}></ZwMobileTabs>
      {searchOpen && <ZwSearchOverlay ctx={ctx} origin={searchOrigin} initialCard={searchStep} onClose={() => setSearchOpen(false)}></ZwSearchOverlay>}
      {booking && <ZwBookingDrawer ctx={ctx} opts={booking} onClose={() => setBooking(null)}></ZwBookingDrawer>}
      <ZwApptActionHost></ZwApptActionHost>
      <ZwToastHost></ZwToastHost>

      <TweaksPanel>
        <TweakSection label="Prototype state" />
        <TweakRadio label="User" value={t.userState}
                    options={['new', 'returning']}
                    onChange={(v) => setTweak('userState', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Spotlight tone" value={t.spotlightTone}
                    options={['dark', 'light']}
                    onChange={(v) => setTweak('spotlightTone', v)} />
        <TweakSlider label="Content width" value={t.contentWidth} min={1080} max={1480} step={8} unit="px"
                     onChange={(v) => setTweak('contentWidth', v)} />
        <TweakSlider label="Card corners" value={t.cardCorners} min={8} max={26} step={1} unit="px"
                     onChange={(v) => setTweak('cardCorners', v)} />
        <TweakSection label="Help centre · contact card" />
        <TweakRadio label="My tickets" value={t.helpRequests}
                    options={['Live', 'Caught up', 'None yet']}
                    onChange={(v) => setTweak('helpRequests', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ZwApp />);
