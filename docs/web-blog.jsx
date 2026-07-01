// Zavoia Web — The Journal: blog list (#/blog) + post page (#/blog/<id>).

const { useState: useStateBL, useMemo: useMemoBL, useEffect: useEffectBL, useRef: useRefBL, useLayoutEffect: useLayoutEffectBL } = React;

const zwSlug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Per-category accent — adds quiet colour-coding so the grid scans faster
const ZW_CAT_COLOR = {
  guides:   'var(--p-500)',
  business: 'var(--s-info-600)',
  product:  'var(--s-success-600)',
};
const zwCatColor = (cat) => ZW_CAT_COLOR[cat] || 'var(--p-500)';

// ──────────────────────────────────────────
// Scroll progress hook — 0..1 of article read
// ──────────────────────────────────────────
function zwUseScrollProgress() {
  const [p, setP] = useStateBL(0);
  useEffectBL(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - window.innerHeight;
        setP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return p;
}

// Reading progress — hairline under the nav (mobile + a safety net)
function ZwReadProgress({ progress }) {
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, height: 2,
      zIndex: 120, pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%', background: 'var(--p-500)',
        transform: 'scaleX(' + progress.toFixed(4) + ')', transformOrigin: 'left center',
      }}></div>
    </div>
  );
}

// ──────────────────────────────────────────
// Shared bits
// ──────────────────────────────────────────
function ZwBlogCatChip({ cat, color = 'var(--p-600)', dot = 'var(--p-500)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase', color,
    }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: dot }}></span>
      {cat}
    </span>
  );
}

function ZwBlogMeta({ post, size = 13, color = 'var(--c-600)', dot = 'var(--c-400)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: size, color, whiteSpace: 'nowrap' }}>
      <span>{post.date}</span>
      <span aria-hidden="true" style={{ width: 3, height: 3, borderRadius: '50%', background: dot }}></span>
      <span>{post.read}</span>
    </span>
  );
}

// ──────────────────────────────────────────
// Editorial tab bar — sliding ink underline, story counts
// ──────────────────────────────────────────
function ZwBlogTabs({ cats, counts, active, onChange }) {
  const wrapRef = useRefBL(null);
  const [ind, setInd] = useStateBL({ left: 0, width: 0 });
  useLayoutEffectBL(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const el = wrap.querySelector('[data-on="1"]');
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 60); // after fonts settle
    return () => { window.removeEventListener('resize', measure); clearTimeout(t); };
  }, [active, cats]);
  return (
    <div ref={wrapRef} className="zw-jtabs" role="tablist" aria-label="Filter stories">
      {cats.map(c => (
        <button key={c.id} className="zw-jtab" role="tab" aria-selected={active === c.id}
                data-on={active === c.id ? '1' : '0'} onClick={() => onChange(c.id)}>
          {c.label}
          <span className="zw-jtab-n">{counts[c.id]}</span>
        </button>
      ))}
      <span className="zw-jtabs-rail" aria-hidden="true"></span>
      <span className="zw-jtabs-ind" aria-hidden="true" style={{ left: ind.left, width: ind.width }}></span>
    </div>
  );
}

// ──────────────────────────────────────────
// Pagination — numbered with windowed ellipsis
// ──────────────────────────────────────────
function zwPageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const keep = new Set([0, total - 1, page, page - 1, page + 1]);
  const sorted = [...keep].filter(p => p >= 0 && p < total).sort((a, b) => a - b);
  const out = [];
  let prev = -2;
  for (const p of sorted) { if (p - prev > 1) out.push('gap'); out.push(p); prev = p; }
  return out;
}

function ZwPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const go = (p) => { if (p >= 0 && p < totalPages && p !== page) onChange(p); };
  return (
    <nav className="zw-pag" role="navigation" aria-label="Stories pagination">
      <button className="zw-pag-btn zw-pag-arrow" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page">
        <ZIcon name="chevL" size={15}></ZIcon>
        <span className="zw-pag-lbl">Prev</span>
      </button>
      {zwPageWindow(page, totalPages).map((p, i) =>
        p === 'gap'
          ? <span key={'g' + i} className="zw-pag-gap" aria-hidden="true">&middot;&middot;&middot;</span>
          : <button key={p} className="zw-pag-btn" data-on={p === page ? '1' : '0'}
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={'Page ' + (p + 1)} onClick={() => go(p)}>
              {String(p + 1).padStart(2, '0')}
            </button>
      )}
      <button className="zw-pag-btn zw-pag-arrow" onClick={() => go(page + 1)} disabled={page === totalPages - 1} aria-label="Next page">
        <span className="zw-pag-lbl">Next</span>
        <ZIcon name="chevR" size={15}></ZIcon>
      </button>
    </nav>
  );
}

// ──────────────────────────────────────────
// List page — lead feature
// ──────────────────────────────────────────
function ZwBlogFeatured({ post, ctx }) {
  const accent = zwCatColor(post.cat);
  const mediaRef = useRefBL(null);
  const onMove = (e) => {
    const el = mediaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
    el.style.setProperty('--spot-y', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
  };
  return (
    <div role="button" tabIndex={0} className="zw-feat zw-hover-lift zw-zoom-parent"
         onClick={() => ctx.go('blog/' + post.id)}
         onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('blog/' + post.id); }}
         style={{
           display: 'grid', gridTemplateColumns: 'minmax(0, 1.18fr) minmax(0, 1fr)',
           background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
           borderRadius: 'var(--r-2xl)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--sh-md)',
         }} data-feature-grid="">
      <div ref={mediaRef} className="zw-zoom-wrap zw-feat-media" onMouseMove={onMove}
           style={{ position: 'relative', minHeight: 360, background: 'var(--c-300)' }}>
        <ZImg src={post.photo} alt={post.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></ZImg>
        <span className="zw-feat-scrim" aria-hidden="true"></span>
        <span className="zw-feat-spot" aria-hidden="true"></span>
        <span className="zw-feat-pill">
          <span className="zw-feat-pulse" style={{ color: accent }} aria-hidden="true">
            <span className="zw-feat-pulse-dot"></span>
          </span>
          Latest story
        </span>
      </div>
      <div className="zw-feat-body" style={{ padding: 'clamp(28px, 3.6vw, 52px)', display: 'flex', flexDirection: 'column' }}>
        <ZwBlogCatChip cat={post.catLabel} color={accent} dot={accent}></ZwBlogCatChip>
        <h2 style={{
          margin: '20px 0 0', fontSize: 'clamp(25px, 2.9vw, 37px)', fontWeight: 600,
          letterSpacing: '-0.034em', lineHeight: 1.08, color: 'var(--c-900)',
        }} className="txt-balance">
          <span className="zw-feat-title">{post.title}</span>
        </h2>
        <p className="txt-pretty" style={{ margin: '16px 0 0', fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-600)' }}>
          {post.excerpt}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ZAvatar src={post.author.avatar} name={post.author.name} size={40}></ZAvatar>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{post.author.name}</span>
            <ZwBlogMeta post={post} size={12.5}></ZwBlogMeta>
          </span>
          <span className="zw-feat-readline" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9, flexShrink: 0,
            fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em',
          }}>
            <span className="zw-feat-readlbl">Read story</span>
            <span className="zw-feat-go">
              <span className="zw-feat-go-a" aria-hidden="true"><ZIcon name="arrowR" size={16} color="#fff"></ZIcon></span>
              <span className="zw-feat-go-b" aria-hidden="true"><ZIcon name="arrowR" size={16} color="#fff"></ZIcon></span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ZwBlogCard({ post, ctx }) {
  const accent = zwCatColor(post.cat);
  return (
    <div role="button" tabIndex={0} className="zw-hover-lift zw-zoom-parent"
         onClick={() => ctx.go('blog/' + post.id)}
         onKeyDown={(e) => { if (e.key === 'Enter') ctx.go('blog/' + post.id); }}
         style={{
           background: '#fff', border: '1px solid rgba(28,28,26,0.06)',
           borderRadius: 'var(--card-r, 18px)', overflow: 'hidden', cursor: 'pointer',
           boxShadow: 'var(--sh-sm)', display: 'flex', flexDirection: 'column',
         }}>
      <div className="zw-zoom-wrap" style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--c-300)' }}>
        <ZImg src={post.photo} alt={post.title} style={{ width: '100%', height: '100%' }}></ZImg>
        <span className="zw-bcard-cat">
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: accent }}></span>
          {post.catLabel}
        </span>
        <span className="zw-readtag">
          <ZIcon name="clock" size={11} color="#fff"></ZIcon>
          {post.read.replace(' read', '')}
        </span>
      </div>
      <div style={{ padding: '17px 20px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 className="txt-balance" style={{
          margin: 0, fontSize: 18.5, fontWeight: 600,
          letterSpacing: '-0.024em', lineHeight: 1.22, color: 'var(--c-900)',
        }}><span className="zw-card-title">{post.title}</span></h3>
        <p className="txt-pretty" style={{
          margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--c-600)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{post.excerpt}</p>
        <div style={{
          marginTop: 'auto', paddingTop: 15, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
          borderTop: '1px solid rgba(28,28,26,0.06)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <ZAvatar src={post.author.avatar} name={post.author.name} size={30}></ZAvatar>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.author.name}</span>
            <span style={{ fontSize: 11.5, color: 'var(--c-500)', whiteSpace: 'nowrap' }}>{post.date}</span>
          </span>
          <span style={{ flex: 1 }}></span>
          <span className="zw-bcard-go" aria-hidden="true">
            <ZIcon name="arrowR" size={15}></ZIcon>
          </span>
        </div>
      </div>
    </div>
  );
}

function ZwBlogList({ ctx, initialCat = 'all' }) {
  const [cat, setCat] = useStateBL(initialCat);
  const posts = window.ZW_BLOG_POSTS;
  const counts = useMemoBL(() => {
    const m = { all: posts.length };
    window.ZW_BLOG_CATS.forEach(c => { if (c.id !== 'all') m[c.id] = posts.filter(p => p.cat === c.id).length; });
    return m;
  }, [posts]);
  const filtered = useMemoBL(
    () => cat === 'all' ? posts : posts.filter(p => p.cat === cat),
    [cat, posts]
  );

  const PAGE_SIZE = 6;
  const [page, setPage] = useStateBL(0);
  const resultsRef = useRefBL(null);
  useEffectBL(() => { setPage(0); }, [cat]);

  const [featured, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = rest.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const showFeatured = !!featured && safePage === 0;

  const changePage = (p) => {
    setPage(p);
    requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  };

  return (
    <div data-screen-label="Blog — list">
      {/* Masthead — editorial, left-aligned within container */}
      <header className="zw-container" style={{ paddingTop: 'clamp(36px, 5vw, 64px)' }}>
        <div style={{ marginBottom: 'clamp(22px, 3vw, 36px)' }}>
          <ZwBreadcrumb items={[
            { label: 'Home', href: '#/home' },
            { label: 'Journal' },
          ]}></ZwBreadcrumb>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 760 }}>
            <ZwKicker style={{ marginBottom: 16 }}>The Journal</ZwKicker>
            <h1 className="txt-balance" style={{
              margin: 0, fontSize: 'clamp(38px, 5vw, 66px)', fontWeight: 600,
              letterSpacing: '-0.045em', lineHeight: 0.96, color: 'var(--c-900)',
            }}>Notes from the neighbourhood</h1>
            <p className="txt-pretty" style={{ margin: '20px 0 0', fontSize: 'clamp(15.5px, 1.4vw, 18px)', lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 540 }}>
              Guides for booking well, playbooks for the businesses being booked, and what&rsquo;s new on Zavoia.
            </p>
          </div>
          <div className="zw-only-desktop" style={{
            textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)', lineHeight: 1.9,
          }}>
            <div>Updated weekly</div>
            <div style={{ color: 'var(--c-400)' }}>{posts.length} stories · Issue 06</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ marginTop: 'clamp(28px, 3.2vw, 44px)' }}>
          <ZwBlogTabs cats={window.ZW_BLOG_CATS} counts={counts} active={cat} onChange={setCat}></ZwBlogTabs>
        </div>
      </header>

      <div className="zw-container" ref={resultsRef} style={{ paddingTop: 'clamp(28px, 3.4vw, 44px)' }}>
        {showFeatured && (
          <ZwBlogFeatured key={'f-' + cat} post={featured} ctx={ctx}></ZwBlogFeatured>
        )}
        {!featured && (
          <p style={{ textAlign: 'center', color: 'var(--c-600)', padding: '40px 0' }}>Nothing here yet.</p>
        )}
        {pageItems.length > 0 && (
          <div className="zw-mgrid" data-cols="3" style={{ marginTop: showFeatured ? 'clamp(20px, 2.4vw, 32px)' : 0 }}>
            {pageItems.map((p) => (
              <ZwBlogCard key={cat + '-' + p.id} post={p} ctx={ctx}></ZwBlogCard>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="zw-pag-wrap">
            <span className="zw-pag-count">Page&nbsp;<b>{String(safePage + 1).padStart(2, '0')}</b>&nbsp;of {String(totalPages).padStart(2, '0')} &middot; {filtered.length} stories</span>
            <ZwPagination page={safePage} totalPages={totalPages} onChange={changePage}></ZwPagination>
          </div>
        )}
      </div>

      <ZwNewsletter></ZwNewsletter>
    </div>
  );
}

// ──────────────────────────────────────────
// Post page — prose with heading anchors + drop cap
// ──────────────────────────────────────────
function ZwBlogProse({ blocks }) {
  let firstP = true;
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.t === 'h') return (
          <h2 key={i} id={zwSlug(b.text)} className="txt-balance" style={{
            margin: '44px 0 14px', fontSize: 'clamp(21px, 2vw, 26px)', fontWeight: 600,
            letterSpacing: '-0.026em', lineHeight: 1.2, color: 'var(--c-900)', scrollMarginTop: 'calc(var(--nav-h) + 28px)',
          }}>{b.text}</h2>
        );
        if (b.t === 'quote') return (
          <figure key={i} style={{ margin: '40px 0', padding: '0 0 0 4px', position: 'relative' }}>
            <span aria-hidden="true" style={{
              display: 'block', fontFamily: 'Georgia, serif', fontSize: 64, lineHeight: 0.6,
              color: 'var(--p-200)', height: 30, marginBottom: 6,
            }}>{'\u201C'}</span>
            <blockquote className="txt-pretty" style={{
              margin: 0, fontSize: 'clamp(20px, 2vw, 25px)', fontWeight: 500,
              letterSpacing: '-0.024em', lineHeight: 1.4, color: 'var(--c-900)',
            }}>{b.text}</blockquote>
            {b.who && <figcaption style={{
              marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--c-500)',
            }}>
              <span style={{ width: 22, height: 1, background: 'var(--p-500)' }}></span>
              {b.who}
            </figcaption>}
          </figure>
        );
        if (b.t === 'list') return (
          <ul key={i} style={{ margin: '0 0 22px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 13 }}>
            {b.items.map((item, j) => (
              <li key={j} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'var(--p-100)',
                  flexShrink: 0, marginTop: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ZIcon name="check" size={11} color="var(--p-600)"></ZIcon>
                </span>
                <span style={{ fontSize: 16.5, lineHeight: 1.6, color: 'var(--c-700)', letterSpacing: '-0.008em' }}>{item}</span>
              </li>
            ))}
          </ul>
        );
        if (b.t === 'img') return (
          <figure key={i} style={{ margin: '40px 0' }}>
            <div className="zw-zoom-wrap" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', aspectRatio: '16 / 9', background: 'var(--c-300)', boxShadow: 'var(--sh-md)' }}>
              <ZImg src={b.src} alt={b.alt || ''} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
            {b.cap && <figcaption style={{
              marginTop: 12, paddingLeft: 14, borderLeft: '2px solid var(--c-300)',
              fontSize: 12.5, color: 'var(--c-500)', lineHeight: 1.5,
            }}>{b.cap}</figcaption>}
          </figure>
        );
        const isFirst = firstP; firstP = false;
        return (
          <p key={i} className={'txt-pretty' + (isFirst ? ' zw-dropcap' : '')} style={{
            margin: '0 0 22px', fontSize: 16.5, lineHeight: 1.72,
            color: 'var(--c-700)', letterSpacing: '-0.008em',
          }}>{b.text}</p>
        );
      })}
    </div>
  );
}

// Left share rail — reading ring + actions
function ZwShareRail({ progress, post, ctx }) {
  const R = 17, C = 2 * Math.PI * R;
  const copy = () => {
    try { navigator.clipboard.writeText(window.location.href); } catch (e) {}
    window.zwToast('Link copied to clipboard', 'check');
  };
  const share = () => {
    if (navigator.share) { navigator.share({ title: post.title, url: window.location.href }).catch(() => {}); }
    else { copy(); }
  };
  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <div className="zw-share-rail" aria-label="Share and reading progress">
      <div style={{ position: 'relative', width: 42, height: 42, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="42" height="42" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle className="zw-ring-track" cx="21" cy="21" r={R} fill="none" strokeWidth="2.5"></circle>
          <circle className="zw-ring-fill" cx="21" cy="21" r={R} fill="none" strokeWidth="2.5"
                  strokeDasharray={C} strokeDashoffset={C * (1 - progress)}></circle>
        </svg>
        <span style={{
          position: 'absolute', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
          color: 'var(--c-700)', fontVariantNumeric: 'tabular-nums',
        }}>{Math.round(progress * 100)}</span>
      </div>
      <span style={{ width: 1, height: 14, background: 'rgba(28,28,26,0.12)' }}></span>
      <button className="zw-share-btn" onClick={copy} aria-label="Copy link" data-tip="Copy link"><ZIcon name="link" size={17}></ZIcon></button>
      <button className="zw-share-btn" onClick={share} aria-label="Share" data-tip="Share"><ZIcon name="share" size={16}></ZIcon></button>
      <button className="zw-share-btn" onClick={top} aria-label="Back to top" data-tip="Back to top"
              style={{ opacity: progress > 0.08 ? 1 : 0, pointerEvents: progress > 0.08 ? 'auto' : 'none', transition: 'opacity .3s var(--ease-soft)' }}>
        <ZIcon name="arrowU" size={16}></ZIcon>
      </button>
    </div>
  );
}

// Right TOC — scrollspy (scroll-driven; IO is unreliable in some embeds)
function ZwToc({ headings }) {
  const [active, setActive] = useStateBL(headings[0] && headings[0].id);
  useEffectBL(() => {
    if (!headings.length) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const line = window.scrollY + window.innerHeight * 0.28;
        let cur = headings[0].id;
        for (const h of headings) {
          const el = document.getElementById(h.id);
          if (el && el.getBoundingClientRect().top + window.scrollY <= line) cur = h.id;
        }
        setActive(cur);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [headings]);
  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 96; window.scrollTo({ top: y, behavior: 'smooth' }); }
  };
  if (!headings.length) return null;
  return (
    <nav className="zw-toc" aria-label="In this article">
      <div className="zw-toc-label">In this article</div>
      {headings.map(h => (
        <a key={h.id} href={'#' + h.id} className="zw-toc-link" data-on={active === h.id ? '1' : '0'}
           onClick={(e) => jump(e, h.id)}>{h.text}</a>
      ))}
    </nav>
  );
}

function ZwBlogPost({ ctx, post }) {
  const progress = zwUseScrollProgress();
  const headings = useMemoBL(() => post.body.filter(b => b.t === 'h').map(b => ({ id: zwSlug(b.text), text: b.text })), [post]);
  const related = window.ZW_BLOG_POSTS.filter(p => p.id !== post.id && p.cat === post.cat).slice(0, 3);
  const fill = related.length < 3
    ? window.ZW_BLOG_POSTS.filter(p => p.id !== post.id && !related.includes(p)).slice(0, 3 - related.length)
    : [];
  const rel = [...related, ...fill];

  // reset scroll on mount
  useEffectBL(() => { window.scrollTo(0, 0); }, [post.id]);

  return (
    <div data-screen-label={'Blog — ' + post.title} className="zw-post-shell">
      <ZwReadProgress progress={progress}></ZwReadProgress>
      <ZwShareRail progress={progress} post={post} ctx={ctx}></ZwShareRail>

      <article>
        <header className="zw-container" style={{ paddingTop: 'clamp(36px, 4.5vw, 60px)' }}>
          <div className="zw-post-head">
            <ZwBreadcrumb items={[
              { label: 'Home', href: '#/home' },
              { label: 'Journal', href: '#/blog' },
              { label: post.catLabel, href: '#/blog/' + post.cat },
            ]}></ZwBreadcrumb>
            <div style={{ marginTop: 24 }}><ZwBlogCatChip cat={post.catLabel} color={zwCatColor(post.cat)} dot={zwCatColor(post.cat)}></ZwBlogCatChip></div>
            <h1 className="txt-balance" style={{
              margin: '14px 0 0', fontSize: 'clamp(32px, 4.2vw, 54px)', fontWeight: 600,
              letterSpacing: '-0.042em', lineHeight: 1.02, color: 'var(--c-900)',
            }}>{post.title}</h1>
            <p className="txt-pretty" style={{ margin: '20px 0 0', fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 680 }}>
              {post.excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(28,28,26,0.08)' }}>
              <ZAvatar src={post.author.avatar} name={post.author.name} size={44} ring={true}></ZAvatar>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{post.author.name}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--c-600)' }}>{post.author.role}</span>
              </span>
              <ZwBlogMeta post={post}></ZwBlogMeta>
            </div>
          </div>
        </header>

        <div className="zw-container" style={{ paddingTop: 'clamp(28px, 3.5vw, 44px)' }}>
          <div className="zw-zoom-parent" style={{ borderRadius: 'var(--r-2xl)', overflow: 'hidden', aspectRatio: '21 / 9', background: 'var(--c-300)', boxShadow: 'var(--sh-md)' }}>
            <div className="zw-zoom-wrap" style={{ width: '100%', height: '100%' }}>
              <ZImg src={post.photo} alt={post.title} style={{ width: '100%', height: '100%' }}></ZImg>
            </div>
          </div>
        </div>

        {/* Body + sticky TOC — left-aligned article column with a right sidebar */}
        <div className="zw-container" style={{ paddingTop: 'clamp(36px, 4.5vw, 56px)' }}>
          <div className="zw-post-grid">
            <div className="zw-post-main">
              <ZwBlogProse blocks={post.body}></ZwBlogProse>

              {/* Tag + author bio */}
              <div style={{ marginTop: 40, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  color: 'var(--c-600)', background: 'var(--c-shade)', borderRadius: 999, padding: '7px 13px',
                }}>#{post.cat}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  color: 'var(--c-600)', background: 'var(--c-shade)', borderRadius: 999, padding: '7px 13px',
                }}>#zavoia</span>
              </div>

              <div style={{
                marginTop: 28, padding: '24px 26px', borderRadius: 'var(--r-xl)',
                background: 'var(--c-shade)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <ZAvatar src={post.author.avatar} name={post.author.name} size={54} ring={true}></ZAvatar>
                <span style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>{post.author.name}</span>
                  <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--c-600)', lineHeight: 1.5 }}>
                    {post.author.role} at Zavoia. Writing about local services, one booking at a time.
                  </span>
                </span>
                <ZwButton kind="secondary" size="sm" onClick={() => ctx.go('blog')}>More from the Journal</ZwButton>
              </div>
            </div>

            <aside className="zw-post-aside">
              <ZwToc headings={headings}></ZwToc>
            </aside>
          </div>
        </div>
      </article>

      {rel.length > 0 && (
        <section className="zw-container" style={{ paddingTop: 'clamp(56px, 7vw, 88px)' }}>
          <ZwSectionTitle kicker="Keep reading" title="Related stories"
                          action="All stories" onAction={() => ctx.go('blog')}></ZwSectionTitle>
          <div className="zw-mgrid" data-cols="3">
            {rel.map((p) => (
              <ZwBlogCard key={p.id} post={p} ctx={ctx}></ZwBlogCard>
            ))}
          </div>
        </section>
      )}

      <ZwNewsletter></ZwNewsletter>
    </div>
  );
}

// ──────────────────────────────────────────
// Router glue
// ──────────────────────────────────────────
function ZwBlogPage({ ctx }) {
  const id = ctx.route.id;
  // #/blog/<cat> deep-links the filtered list (guides | business | product)
  const isCat = id && (window.ZW_BLOG_CATS || []).some(c => c.id === id && c.id !== 'all');
  if (isCat) return <ZwBlogList key={id} ctx={ctx} initialCat={id}></ZwBlogList>;
  const post = id ? window.ZW_BLOG_POSTS.find(p => p.id === id) : null;
  if (id && !post) return <ZwBlogList ctx={ctx}></ZwBlogList>;
  return post ? <ZwBlogPost key={post.id} ctx={ctx} post={post}></ZwBlogPost> : <ZwBlogList ctx={ctx}></ZwBlogList>;
}

window.ZW_PAGES.blog = ZwBlogPage;
Object.assign(window, { ZwBlogCard });
