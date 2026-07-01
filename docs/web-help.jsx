// Zavoia Web — Help Centre. Self-serve articles + search, sitting in
// front of the support ticket inbox. Footer "Help centre" lands here;
// "Contact support" hands off to the #/support inbox for a real person.
//
// Routes: #/help (landing) · #/help/<articleId> (article)

const { useState: useStateHC, useMemo: useMemoHC } = React;

// ─────────────────────────────────────────────
// Content — topics + articles. Bodies are block arrays (p / h / list).
// ─────────────────────────────────────────────
window.ZW_HELP_TOPICS = [
  { id: 'booking',    icon: 'cal',    label: 'Booking & appointments', blurb: 'Find, book, reschedule and cancel.' },
  { id: 'paying',     icon: 'wallet', label: 'Paying & pricing',        blurb: 'Pay at the venue, deposits, refunds.' },
  { id: 'account',    icon: 'user',   label: 'Your account',            blurb: 'Sign in, notifications, privacy.' },
  { id: 'reviews',    icon: 'star',   label: 'Reviews',                 blurb: 'Leaving and editing reviews.' },
  { id: 'safety',     icon: 'shield', label: 'Trust & safety',          blurb: 'Verified pros and our standards.' },
  { id: 'business',   icon: 'flash',  label: 'For businesses',          blurb: 'Listing your team on Zavoia.' },
];

window.ZW_HELP_ARTICLES = [
  { id: 'how-to-book', topic: 'booking', title: 'How do I book an appointment?', popular: true,
    excerpt: 'Search, pick a service and a time, and confirm — no payment needed up front.',
    body: [
      { t: 'p', text: 'Booking on Zavoia takes a couple of clicks and never asks for payment up front.' },
      { t: 'list', items: ['Search for a service, place or professional from the bar at the top', 'Open a business and choose your services', 'Pick a professional, date and time', 'Review and confirm — you\u2019ll get a confirmation instantly'] },
      { t: 'p', text: 'Your booking then appears under Appointments, with reminders before the visit.' },
    ] },
  { id: 'reschedule', topic: 'booking', title: 'Can I reschedule or cancel?', popular: true,
    excerpt: 'Yes — free up to the venue\u2019s cancellation window, usually 24 hours before.',
    body: [
      { t: 'p', text: 'Open the appointment from Appointments and use Reschedule or Cancel.' },
      { t: 'h', text: 'The free window' },
      { t: 'p', text: 'Most venues let you change or cancel for free up to 24 hours before the start time. Some set a longer window for longer or specialist services — the exact window is shown on the appointment.' },
      { t: 'p', text: 'After the window closes the venue\u2019s cancellation fee may apply. Nothing is charged automatically through Zavoia — fees are settled with the venue.' },
    ] },
  { id: 'recurring', topic: 'booking', title: 'How do recurring appointments work?', popular: false,
    excerpt: 'Series bookings repeat on a cadence and show "2 of 4" so you can track them.',
    body: [
      { t: 'p', text: 'Some venues offer recurring plans — for example a cut every six weeks. Each visit appears as its own appointment, labelled with its place in the series.' },
      { t: 'p', text: 'You can reschedule or cancel any single visit without affecting the rest of the series.' },
    ] },
  { id: 'pay-at-venue', topic: 'paying', title: 'When and how do I pay?', popular: true,
    excerpt: 'You pay the business directly after your visit. Zavoia never charges your card to book.',
    body: [
      { t: 'p', text: 'Zavoia is pay-at-venue. You settle directly with the business after your appointment, by whatever methods they accept.' },
      { t: 'p', text: 'Prices shown are set by each business and include any active offer before you confirm, so there are no surprises.' },
      { t: 'h', text: 'Deposits' },
      { t: 'p', text: 'A small number of venues ask for a deposit on certain slots. If so, it\u2019s shown clearly before you confirm and is deducted from your final bill.' },
    ] },
  { id: 'refunds', topic: 'paying', title: 'How do refunds work?', popular: false,
    excerpt: 'Because you pay the venue directly, refunds are handled by the venue.',
    body: [
      { t: 'p', text: 'As payment happens at the venue, any refund is arranged with the venue directly. If you cancelled within the free window, there\u2019s nothing to refund.' },
      { t: 'p', text: 'If a venue cancelled on you, they\u2019ll usually invite you to rebook at no charge. Contact support if anything looks wrong.' },
    ] },
  { id: 'notifications', topic: 'account', title: 'Managing reminders & notifications', popular: false,
    excerpt: 'Choose which reminders and offers you receive in Profile & settings.',
    body: [
      { t: 'p', text: 'Open Profile & settings to control booking reminders, offers near you and the weekly Journal email. Reminders go out the day before and an hour before by default.' },
    ] },
  { id: 'leave-review', topic: 'reviews', title: 'How do I leave a review?', popular: true,
    excerpt: 'After a completed visit, open the appointment and rate your experience.',
    body: [
      { t: 'p', text: 'Once a visit is complete you\u2019ll see a Leave a review action on the appointment, and a prompt in your notifications.' },
      { t: 'p', text: 'Reviews are tied to a real, completed booking, so they\u2019re marked Verified. You can edit your review at any time from the appointment.' },
    ] },
  { id: 'verified', topic: 'safety', title: 'What does a verified business mean?', popular: false,
    excerpt: 'Every business is identity-checked before it can take bookings.',
    body: [
      { t: 'p', text: 'Before a business can appear and take bookings, we verify its identity and details. Ratings come only from clients with a completed visit.' },
      { t: 'p', text: 'If something isn\u2019t right with a listing or a visit, report it and our team will look into it.' },
    ] },
  { id: 'list-business', topic: 'business', title: 'How do I list my business?', popular: false,
    excerpt: 'Set up in an afternoon — per-member profiles, calendar and reminders.',
    body: [
      { t: 'p', text: 'Zavoia for Business gives every bookable team member a public profile, a calendar that protects itself from double-booking, and reminders that cut no-shows.' },
      { t: 'p', text: 'It\u2019s £18 per team member with no commission. Head to Zavoia for Business to start a free trial.' },
    ] },
];

window.zwHelpArticle = (id) => (window.ZW_HELP_ARTICLES || []).find(a => a.id === id) || null;

// ─────────────────────────────────────────────
// Article view
// ─────────────────────────────────────────────
function ZwHelpArticle({ ctx, article }) {
  const topic = (window.ZW_HELP_TOPICS || []).find(t => t.id === article.topic);
  const related = (window.ZW_HELP_ARTICLES || []).filter(a => a.topic === article.topic && a.id !== article.id).slice(0, 3);
  return (
    <div data-screen-label={'Help · ' + article.title} className="zw-container" style={{ paddingTop: 30, width: '100%', maxWidth: 'min(760px, 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-500)', marginBottom: 22, flexWrap: 'wrap' }}>
        <button className="zw-link" style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--c-600)', fontWeight: 600 }} onClick={() => ctx.go('help')}>Help centre</button>
        <ZIcon name="chevR" size={12} color="var(--c-400)"></ZIcon>
        {topic && <span style={{ color: 'var(--c-600)' }}>{topic.label}</span>}
      </div>

      <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.08, color: 'var(--c-900)' }} className="txt-balance">
        {article.title}
      </h1>

      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {article.body.map((b, i) => {
          if (b.t === 'h') return <h2 key={i} style={{ margin: '12px 0 0', fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>{b.text}</h2>;
          if (b.t === 'list') return (
            <ul key={i} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {b.items.map((it, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 15.5, lineHeight: 1.55, color: 'var(--c-700)' }}>
                  <ZIcon name="check" size={15} color="var(--s-success-600)" style={{ marginTop: 3, flexShrink: 0 }}></ZIcon>
                  <span className="txt-pretty">{it}</span>
                </li>
              ))}
            </ul>
          );
          return <p key={i} className="txt-pretty" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: 'var(--c-700)' }}>{b.text}</p>;
        })}
      </div>

      {/* Was this helpful */}
      <div style={{ marginTop: 36, paddingTop: 22, borderTop: '1px solid rgba(28,28,26,0.08)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-800)' }}>Was this helpful?</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <ZwButton kind="secondary" size="sm" onClick={() => window.zwToast('Thanks for the feedback', 'check')}>Yes</ZwButton>
          <ZwButton kind="ghost" size="sm" onClick={() => ctx.go('support')}>No, contact support</ZwButton>
        </div>
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)', marginBottom: 14 }}>Related</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {related.map(a => (
              <button key={a.id} className="tap zw-hover-row" onClick={() => ctx.go('help/' + a.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderTop: '1px solid rgba(28,28,26,0.06)', padding: '15px 6px', cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--c-900)' }}>{a.title}</span>
                <ZIcon name="chevR" size={15} color="var(--c-400)"></ZIcon>
              </button>
            ))}
          </div>
        </div>
      )}

      <ZwHelpContactBand ctx={ctx}></ZwHelpContactBand>
    </div>
  );
}

// ── Contact-support band (shared) ──
function ZwHelpContactBand({ ctx }) {
  return (
    <div style={{
      marginTop: 40, background: 'var(--c-ink)', color: '#fff', borderRadius: 'var(--r-2xl, 24px)',
      padding: 'clamp(24px, 3vw, 36px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 28px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 130% at 100% 0%, color-mix(in oklch, var(--p-500) 24%, transparent), transparent 60%)' }}></div>
      <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 0 }}>
        <div style={{ fontSize: 'clamp(19px, 2vw, 24px)', fontWeight: 600, letterSpacing: '-0.025em' }} className="txt-balance">Still need a hand?</div>
        <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.72)', marginTop: 7 }} className="txt-pretty">Start a conversation with our support team — we usually reply within a few hours.</div>
      </div>
      <div style={{ position: 'relative' }}>
        <ZwButton kind="accent" size="lg" onClick={() => ctx.go('support')}>
          Contact support
          <ZIcon name="arrowR" size={16} color="#fff"></ZIcon>
        </ZwButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Inline answer — renders the article body in place so people
// can read it without leaving the page (deep link still available).
// ─────────────────────────────────────────────
function ZwHelpAnswer({ a, ctx }) {
  return (
    <div className="zv-fade" style={{ padding: '0 4px 20px', maxWidth: 660 }}>
      {(a.body || []).map((b, i) => {
        if (b.t === 'h') return <div key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em', margin: '15px 0 6px' }}>{b.text}</div>;
        if (b.t === 'list') return (
          <ul key={i} style={{ margin: '8px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ display: 'flex', gap: 9, fontSize: 14.5, lineHeight: 1.55, color: 'var(--c-600)' }}>
                <span style={{ marginTop: 8, width: 4, height: 4, borderRadius: '50%', background: 'var(--p-500)', flexShrink: 0 }}></span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        );
        return <p key={i} className="txt-pretty" style={{ margin: '8px 0', fontSize: 14.5, lineHeight: 1.65, color: 'var(--c-600)' }}>{b.text}</p>;
      })}
      <button className="zw-help-fulllink" onClick={() => ctx.go('help/' + a.id)}>
        Open full guide
        <ZIcon name="arrowR" size={13} color="var(--p-700)"></ZIcon>
      </button>
    </div>
  );
}

// One expandable Q&A row
function ZwHelpQARow({ a, on, onToggle, ctx }) {
  return (
    <div className="zw-help-qa-row" data-on={on ? '1' : '0'}>
      <button className="zw-help-qa-q tap" onClick={onToggle} aria-expanded={on}>
        <span className="zw-help-qa-qt">{a.title}</span>
        <span className="zw-help-qa-ic"><ZIcon name={on ? 'chevU' : 'chevD'} size={14} color={on ? '#fff' : 'var(--c-700)'}></ZIcon></span>
      </button>
      {on && <ZwHelpAnswer a={a} ctx={ctx}></ZwHelpAnswer>}
    </div>
  );
}

// Sticky sidebar — keeps requests + contact visible the whole time
function ZwHelpAside({ ctx }) {
  const signedIn = ctx.userState === 'returning';
  // The "My requests" preview state is toggleable from Tweaks → Help centre.
  const mode = ctx.helpRequests || 'Live';
  const seed = window.SEED_TICKETS || [];
  const tickets = !signedIn ? []
    : mode === 'None yet' ? []
    : mode === 'Caught up' ? seed.map(t => ({ ...t, status: 'CLOSED' }))
    : seed;
  const open = tickets.filter(t => t.status !== 'CLOSED');
  const hasHistory = tickets.length > 0;
  const statusOf = (s) => (window.SUPPORT_STATUS && window.SUPPORT_STATUS[s]) || { label: s, color: 'var(--c-500)' };
  return (
    <aside className="zw-help-aside">
      <div className="zw-help-card">
        {/* Header — a live availability cue instead of a decorative icon */}
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--c-900)' }}>Report an issue</div>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--c-600)' }}>We look into every report, usually within a few hours</span>
        </div>

        {/* My requests — only for signed-in users who have a history */}
        {signedIn && (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open.length ? 2 : 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)' }}>My tickets</span>
              {open.length > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--p-700)' }}>{open.length} open</span>}
            </div>
            {open.length > 0 ? (
              <React.Fragment>
                {open.slice(0, 3).map(t => {
                  const st = statusOf(t.status);
                  return (
                    <button key={t.id} className="zw-help-treq tap" onClick={() => ctx.go('support')}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, flexShrink: 0 }}></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.preview}</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--c-500)', marginTop: 1 }}>{st.label} · {t.ago}</span>
                      </span>
                      <ZIcon name="chevR" size={14} color="var(--c-400)"></ZIcon>
                    </button>
                  );
                })}
              </React.Fragment>
            ) : (
              <p className="txt-pretty" style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--c-600)' }}>
                {hasHistory
                  ? 'Nothing open right now — your past tickets are saved in your inbox.'
                  : 'Nothing to report? All good. If something goes wrong, open a ticket and we’ll sort it.'}
              </p>
            )}
          </div>
        )}

        {/* Primary action adapts to state */}
        <div style={{ display: 'flex', marginTop: 16 }}>
          <ZwButton kind="primary" onClick={() => ctx.go('support')} style={{ flex: 1, justifyContent: 'center' }}>
            {open.length > 0 ? 'Open inbox' : 'Report an issue'}
          </ZwButton>
        </div>
        {open.length > 0 && (
          <button className="zw-help-fulllink" style={{ marginTop: 13 }} onClick={() => ctx.go('support')}>
            Report another issue
            <ZIcon name="arrowR" size={13} color="var(--p-700)"></ZIcon>
          </button>
        )}
        {signedIn && open.length === 0 && hasHistory && (
          <button className="zw-help-fulllink" style={{ marginTop: 13 }} onClick={() => ctx.go('support')}>
            View past tickets
            <ZIcon name="arrowR" size={13} color="var(--p-700)"></ZIcon>
          </button>
        )}
      </div>

      <div className="zw-help-card">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-500)', marginBottom: 2 }}>Good to know</div>
        {[
          { label: 'Cancellation policy', go: 'legal/cancellation' },
          { label: 'List your business', go: 'for-business' },
          { label: 'Privacy policy', go: 'legal/privacy' },
        ].map(l => (
          <button key={l.go} className="zw-help-qlink tap" onClick={() => ctx.go(l.go)}>
            <span>{l.label}</span>
            <ZIcon name="arrowR" size={13} color="var(--c-400)"></ZIcon>
          </button>
        ))}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Landing
// ─────────────────────────────────────────────
function ZwHelpPage({ ctx }) {
  const id = ctx.route.id;
  if (id) {
    const article = window.zwHelpArticle(id);
    if (article) return <ZwHelpArticle ctx={ctx} article={article}></ZwHelpArticle>;
  }

  const [q, setQ] = useStateHC('');
  const [topic, setTopic] = useStateHC('all');
  const [openId, setOpenId] = useStateHC(null);
  const articles = window.ZW_HELP_ARTICLES || [];
  const topics = window.ZW_HELP_TOPICS || [];
  const query = q.trim().toLowerCase();

  const results = useMemoHC(() => {
    if (!query) return null;
    return articles.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.excerpt.toLowerCase().includes(query) ||
      (a.body || []).some(b => (b.text || (b.items || []).join(' ')).toLowerCase().includes(query)));
  }, [query]);

  const toggle = (id) => setOpenId(openId === id ? null : id);
  const visibleTopics = topic === 'all' ? topics : topics.filter(t => t.id === topic);

  return (
    <div data-screen-label="Help centre" className="zw-container" style={{ paddingTop: 'clamp(30px, 4vw, 52px)', width: '100%' }}>
      {/* Editorial header */}
      <div style={{ maxWidth: 700 }}>
        <ZwKicker style={{ marginBottom: 14 }}>Help centre</ZwKicker>
        <h1 className="txt-balance" style={{ margin: 0, fontSize: 'clamp(32px, 4.4vw, 54px)', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1.0, color: 'var(--c-900)' }}>
          What do you need a hand with?
        </h1>
        <p className="txt-pretty" style={{ margin: '18px 0 0', fontSize: 'clamp(15.5px, 1.4vw, 18px)', lineHeight: 1.6, color: 'var(--c-600)', maxWidth: 540 }}>
          Plain answers to the things people ask us most — open any question to read it right here, no digging required.
        </p>
        <div className="zw-help-search">
          <ZIcon name="search" size={18} color="var(--c-500)"></ZIcon>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions — cancel, deposit, reschedule…"
                 style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontSize: 15.5, color: 'var(--c-900)', fontFamily: 'inherit', padding: '8px 0' }} />
          {q && <button className="tap" onClick={() => setQ('')} aria-label="Clear" style={{ width: 34, height: 34, borderRadius: '50%', border: 0, background: 'var(--c-shade)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ZIcon name="x" size={14} color="var(--c-700)"></ZIcon></button>}
        </div>
      </div>

      {/* Two-column body — Q&A left, requests + contact right */}
      <div className="zw-help-grid">
        <div className="zw-help-main">
          {query ? (
            <React.Fragment>
              <div className="zw-help-grouphead">{results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;</div>
              {results.length === 0 ? (
                <div style={{ padding: '24px 4px', color: 'var(--c-600)' }}>
                  <p className="txt-pretty" style={{ margin: '0 0 16px', fontSize: 15 }}>No questions matched. Try different words, or ask our team directly.</p>
                  <ZwButton kind="primary" onClick={() => ctx.go('support')}>Contact us</ZwButton>
                </div>
              ) : (
                <div className="zw-help-qa">
                  {results.map(a => <ZwHelpQARow key={a.id} a={a} on={openId === a.id} onToggle={() => toggle(a.id)} ctx={ctx}></ZwHelpQARow>)}
                </div>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              {/* Topic filter */}
              <div className="zw-help-chips">
                <button className="zw-help-chip" data-on={topic === 'all' ? '1' : '0'} onClick={() => setTopic('all')}>All</button>
                {topics.map(t => (
                  <button key={t.id} className="zw-help-chip" data-on={topic === t.id ? '1' : '0'} onClick={() => setTopic(t.id)}>{t.label}</button>
                ))}
              </div>

              {visibleTopics.map(t => {
                const arts = articles.filter(a => a.topic === t.id);
                if (!arts.length) return null;
                return (
                  <section key={t.id} style={{ marginTop: 26 }}>
                    <div className="zw-help-grouphead">
                      <ZIcon name={t.icon} size={14} color="var(--p-600)"></ZIcon>
                      {t.label}
                    </div>
                    <div className="zw-help-qa">
                      {arts.map(a => <ZwHelpQARow key={a.id} a={a} on={openId === a.id} onToggle={() => toggle(a.id)} ctx={ctx}></ZwHelpQARow>)}
                    </div>
                  </section>
                );
              })}
            </React.Fragment>
          )}
        </div>

        <ZwHelpAside ctx={ctx}></ZwHelpAside>
      </div>
    </div>
  );
}

function ZwHelpRow({ a, ctx }) {
  return (
    <button className="tap zw-hover-row" onClick={() => ctx.go('help/' + a.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderTop: '1px solid rgba(28,28,26,0.07)', padding: '16px 6px', cursor: 'pointer' }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.01em' }}>{a.title}</span>
        <span style={{ display: 'block', fontSize: 13.5, color: 'var(--c-600)', marginTop: 3 }} className="txt-pretty">{a.excerpt}</span>
      </span>
      <ZIcon name="chevR" size={16} color="var(--c-400)" style={{ flexShrink: 0 }}></ZIcon>
    </button>
  );
}

window.ZW_PAGES.help = ZwHelpPage;
