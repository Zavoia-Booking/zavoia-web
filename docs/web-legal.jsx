// Zavoia Web — Legal & policy pages: #/legal/<privacy|terms|cancellation|trust>
// One quiet template: doc switcher rail left, prose right.

function ZwLegalPage({ ctx }) {
  const docs = window.ZW_LEGAL_DOCS || {};
  const order = ['privacy', 'terms', 'cookies', 'cancellation'];
  const id = order.includes(ctx.route.id) ? ctx.route.id : 'privacy';
  const doc = docs[id];

  return (
    <div data-screen-label={'Legal — ' + doc.title}>
      <div className="zw-container" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
        <ZwBreadcrumb items={[
          { label: 'Home', href: '#/home' },
          { label: 'Policies' },
          { label: doc.title },
        ]}></ZwBreadcrumb>

        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) minmax(0, 1fr)',
          gap: 'clamp(28px, 4vw, 64px)', paddingTop: 'clamp(28px, 3.5vw, 44px)', alignItems: 'start',
        }} data-biz-cols="">

          {/* Doc rail */}
          <nav aria-label="Policies" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 24px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ZwKicker style={{ marginBottom: 10 }}>Policies</ZwKicker>
            {order.map(k => {
              const on = k === id;
              return (
                <a key={k} href={'#/legal/' + k} className="tap"
                   style={{
                     padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                     fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                     color: on ? 'var(--c-900)' : 'var(--c-600)',
                     background: on ? 'rgba(28,28,26,0.05)' : 'transparent',
                   }}>{docs[k].title}</a>
              );
            })}
          </nav>

          {/* Document */}
          <article style={{ maxWidth: 720, paddingBottom: 8 }}>
            <h1 style={{
              margin: 0, fontSize: 'clamp(30px, 3.6vw, 44px)', fontWeight: 600,
              letterSpacing: '-0.038em', lineHeight: 1.02, color: 'var(--c-900)',
            }}>{doc.title}</h1>
            <div style={{
              marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-500)',
            }}>Last updated · {doc.updated}</div>
            <p className="txt-pretty" style={{
              margin: '22px 0 0', fontSize: 17, lineHeight: 1.65, color: 'var(--c-700)',
              paddingBottom: 26, borderBottom: '1px solid rgba(28,28,26,0.08)',
            }}>{doc.intro}</p>

            {doc.sections.map((s, i) => (
              <section key={i}>
                <h2 style={{
                  margin: '34px 0 10px', fontSize: 20, fontWeight: 600,
                  letterSpacing: '-0.024em', color: 'var(--c-900)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                    color: 'var(--p-600)', marginRight: 10, letterSpacing: '0.06em',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h2>
                {s.ps.map((p, j) => (
                  <p key={j} className="txt-pretty" style={{
                    margin: '0 0 14px', fontSize: 15.5, lineHeight: 1.7,
                    color: 'var(--c-700)', letterSpacing: '-0.005em',
                  }}>{p}</p>
                ))}
              </section>
            ))}

            <div style={{
              marginTop: 40, padding: '20px 22px', borderRadius: 'var(--r-xl)', background: 'var(--c-shade)',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <ZIcon name="info" size={20} color="var(--c-700)"></ZIcon>
              <span style={{ flex: 1, minWidth: 220, fontSize: 13.5, lineHeight: 1.55, color: 'var(--c-700)' }}>
                Questions about this policy? Our support team answers within a day.
              </span>
              <ZwButton kind="secondary" size="sm" onClick={() => ctx.go('support')}>Contact support</ZwButton>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

window.ZW_PAGES.legal = ZwLegalPage;
