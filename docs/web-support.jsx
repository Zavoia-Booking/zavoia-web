// Zavoia Web — Support. Desktop-native two-pane inbox: tickets left,
// conversation right. Mobile collapses to list → thread.

const { useState: useStateSP, useRef: useRefSP, useEffect: useEffectSP } = React;

function ZwTicketStatus({ status }) {
  const s = SUPPORT_STATUS[status] || SUPPORT_STATUS.OPEN;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600,
      letterSpacing: '0.10em', textTransform: 'uppercase', color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }}></span>
      {s.label}
    </span>
  );
}

function ZwTicketRow({ t, active, onClick }) {
  return (
    <button onClick={onClick} className="tap"
            style={{
              display: 'flex', flexDirection: 'column', gap: 6, width: '100%',
              textAlign: 'left', cursor: 'pointer', padding: '14px 15px',
              background: active ? '#fff' : 'transparent',
              border: active ? '1px solid rgba(28,28,26,0.10)' : '1px solid transparent',
              borderRadius: 16,
              boxShadow: active ? 'var(--sh-sm)' : 'inset 0 -1px 0 rgba(28,28,26,0.05)',
            }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <ZwTicketStatus status={t.status}></ZwTicketStatus>
        <span style={{ flex: 1 }}></span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-500)' }}>{t.ago}</span>
        {t.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--p-500)' }}></span>}
      </div>
      <span style={{
        fontSize: 14, fontWeight: t.unread ? 600 : 500, color: 'var(--c-900)',
        letterSpacing: '-0.01em', lineHeight: 1.3,
      }}>{t.preview}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--c-500)',
        letterSpacing: '0.04em',
      }}>#{t.num} · {(CATEGORY[t.category] || {}).label || 'Issue'}</span>
    </button>
  );
}

function ZwBubble({ m }) {
  const mine = m.from === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          padding: '11px 15px', fontSize: 14, lineHeight: 1.5, letterSpacing: '-0.005em',
          background: mine ? 'var(--c-ink)' : '#fff',
          color: mine ? '#fff' : 'var(--c-900)',
          border: mine ? 0 : '1px solid rgba(28,28,26,0.08)',
          borderRadius: mine ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
          boxShadow: 'var(--sh-sm)',
        }} className="txt-pretty">{m.text}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--c-500)',
          marginTop: 4, textAlign: mine ? 'right' : 'left', padding: '0 4px',
        }}>{m.from === 'support' ? 'Zavoia Support · ' : ''}{m.at}</div>
      </div>
    </div>
  );
}

function ZwConversation({ ticket, thread, onSend }) {
  const [draft, setDraft] = useStateSP('');
  const scrollRef = useRefSP(null);
  useEffectSP(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.length, ticket.id]);
  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Thread header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(28,28,26,0.07)',
        display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', flexShrink: 0,
        borderRadius: '20px 20px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--c-900)', letterSpacing: '-0.015em' }}>{ticket.preview}</span>
          <ZwTicketStatus status={ticket.status}></ZwTicketStatus>
        </div>
        {ticket.reported && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
            background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.07)',
            padding: '6px 11px', borderRadius: 999, fontSize: 12, color: 'var(--c-700)',
          }}>
            <ZIcon name="cal" size={12} color="var(--c-600)"></ZIcon>
            {ticket.reported.label}
          </span>
        )}
      </div>
      {/* Messages */}
      <div ref={scrollRef} className="zw-scroll-y" style={{
        flex: 1, minHeight: 0, padding: '20px 20px 10px',
        display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--c-50)',
      }}>
        {thread.map((m, i) => <ZwBubble key={i} m={m}></ZwBubble>)}
      </div>
      {/* Composer */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid rgba(28,28,26,0.07)', background: '#fff',
        display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
        borderRadius: '0 0 20px 20px',
      }}>
        <input value={draft} placeholder="Write a reply…"
               onChange={(e) => setDraft(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
               style={{
                 flex: 1, border: '1px solid rgba(28,28,26,0.12)', borderRadius: 999,
                 padding: '12px 18px', fontSize: 14, background: 'var(--c-50)', color: 'var(--c-900)',
               }} />
        <button className="tap" onClick={send} aria-label="Send"
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: 0, cursor: 'pointer',
                  background: 'var(--p-500)', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
          <ZIcon name="nav" size={17} color="#fff"></ZIcon>
        </button>
      </div>
    </div>
  );
}

function ZwSupportPage({ ctx }) {
  const [tickets, setTickets] = useStateSP(() => SEED_TICKETS.map(t => ({ ...t })));
  const [threads, setThreads] = useStateSP(() => {
    const o = {};
    Object.keys(SEED_THREADS).forEach(k => { o[k] = SEED_THREADS[k].slice(); });
    return o;
  });
  const [activeId, setActiveId] = useStateSP(SEED_TICKETS[0] && SEED_TICKETS[0].id);
  const [mobileThread, setMobileThread] = useStateSP(false);

  const active = tickets.find(t => t.id === activeId);
  const thread = (threads[activeId] || []);

  // Logged-out users must not see anyone's personal requests — gate it,
  // while still pointing them to the public help centre.
  if (ctx.userState === 'new') {
    return (
      <ZwSignedOutGate ctx={ctx} icon="info"
        title="Track the issues you’ve reported."
        body="Sign in to report an issue and see replies to anything you’ve already raised. Just looking for an answer? The help centre is open to everyone."
        secondaryLabel="Browse help centre" onSecondary={() => ctx.go('help')}></ZwSignedOutGate>
    );
  }

  const open = (id) => {
    setActiveId(id);
    setMobileThread(true);
    setTickets(ts => ts.map(t => t.id === id ? { ...t, unread: false } : t));
  };

  const send = (text) => {
    setThreads(th => ({ ...th, [activeId]: [...(th[activeId] || []), { from: 'user', text, at: 'Just now' }] }));
    setTimeout(() => {
      setThreads(th => ({
        ...th,
        [activeId]: [...(th[activeId] || []), {
          from: 'support',
          text: "Thanks — we've got your message. A member of the team will reply here shortly.",
          at: 'Just now',
        }],
      }));
    }, 1400);
  };

  const newTicket = () => {
    const id = 'n' + Date.now();
    const t = {
      id, num: 1043 + tickets.length, category: 'QUESTION', status: 'OPEN', unread: false,
      preview: 'New ticket', ago: 'Just now', created: 'Today',
    };
    setTickets(ts => [t, ...ts]);
    setThreads(th => ({ ...th, [id]: [] }));
    setActiveId(id);
    setMobileThread(true);
    window.zwToast('New ticket started — tell us what happened', 'info');
  };

  const listPane = (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: 4 }}>
      <div className="zw-scroll-y" style={{ flex: 1, minHeight: 0, paddingRight: 4 }}>
        {tickets.map(t => (
          <ZwTicketRow key={t.id} t={t} active={t.id === activeId} onClick={() => open(t.id)}></ZwTicketRow>
        ))}
      </div>
    </div>
  );

  return (
    <div data-screen-label="Support" className="zw-container" style={{
      paddingTop: 44, width: '100%', flex: 1,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ marginBottom: 18 }}>
        <ZwBreadcrumb items={[
          { label: 'Help centre', href: '#/help' },
          { label: 'My tickets' },
        ]}></ZwBreadcrumb>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 'clamp(28px, 3.4vw, 40px)', fontWeight: 600,
            letterSpacing: '-0.035em', color: 'var(--c-900)',
          }}>Your tickets</h1>
          <p style={{ margin: '9px 0 0', fontSize: 14.5, color: 'var(--c-600)', maxWidth: 540 }} className="txt-pretty">
            Issues you’ve reported to our team. For a quick answer, <button className="zw-link" onClick={() => ctx.go('help')}
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--p-700)', fontWeight: 600 }}>search the help centre</button> first — most questions are answered there.
          </p>
        </div>
        <ZwButton kind="primary" onClick={newTicket}>
          <ZIcon name="plus" size={15} color="#fff"></ZIcon>
          Report an issue
        </ZwButton>
      </div>

      {/* Desktop: two panes */}
      <div className="zw-only-desktop" style={{
        display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 22,
        height: 'min(640px, calc(100vh - 280px))', minHeight: 420,
      }}>
        {listPane}
        <div style={{
          border: '1px solid rgba(28,28,26,0.08)', borderRadius: 20,
          boxShadow: 'var(--sh-md)', overflow: 'hidden', minHeight: 0,
          display: 'flex', flexDirection: 'column', background: '#fff',
        }}>
          {active ? (
            <ZwConversation ticket={active} thread={thread} onSend={send}></ZwConversation>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-500)', fontSize: 14 }}>
              Select a conversation
            </div>
          )}
        </div>
      </div>

      {/* Mobile: list OR thread */}
      <div className="zw-only-mobile" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {!mobileThread ? listPane : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <button className="tap" onClick={() => setMobileThread(false)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
                      background: 'transparent', border: 0, cursor: 'pointer', alignSelf: 'flex-start',
                      fontSize: 13.5, fontWeight: 600, color: 'var(--c-600)', padding: '4px 0',
                    }}>
              <ZIcon name="back" size={14} color="var(--c-600)"></ZIcon>
              All tickets
            </button>
            <div style={{
              border: '1px solid rgba(28,28,26,0.08)', borderRadius: 20, overflow: 'hidden',
              background: '#fff', height: 'calc(100vh - 320px)', minHeight: 380,
              display: 'flex', flexDirection: 'column',
            }}>
              {active && <ZwConversation ticket={active} thread={thread} onSend={send}></ZwConversation>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.ZW_PAGES.support = ZwSupportPage;
