// Zavoia Web — Pricing. Single plan, priced per bookable team member.
// Interactive calculator + included list + FAQ.

const { useState: useStatePR, useMemo: useMemoPR } = React;

// ─────────────────────────────────────────────
// Plan card + team-size calculator
// ─────────────────────────────────────────────
function ZwPricingCalc({ ctx }) {
  const P = window.ZW_PRICING;
  const [members, setMembers] = useStatePR(4);
  const [annual, setAnnual] = useStatePR(true);
  const rate = annual ? P.annual : P.monthly;
  const monthlyTotal = rate * members;
  const yearSaving = (P.monthly - P.annual) * members * 12;

  const seg = (on) => ({
    padding: '8px 16px', borderRadius: 999, border: 0, cursor: 'pointer',
    fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em',
    background: on ? 'var(--c-ink)' : 'transparent',
    color: on ? '#fff' : 'var(--c-700)',
    transition: 'background-color .2s var(--ease-soft), color .2s var(--ease-soft)',
  });

  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'clamp(24px, 3vw, 40px)', alignItems: 'stretch',
      }} data-feature-grid="">

        {/* The plan */}
        <div style={{
          background: 'var(--c-ink)', color: '#fff', borderRadius: 'var(--r-2xl)',
          padding: 'clamp(28px, 3.5vw, 44px)', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(85% 120% at 100% -20%, color-mix(in oklch, var(--p-500) 24%, transparent) 0%, transparent 65%)',
          }}></div>
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <ZwKicker color="var(--p-400)">{P.name}</ZwKicker>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.66)',
                border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 11px',
              }}>{P.trialDays}-day free trial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 26 }}>
              <span style={{ fontSize: 'clamp(54px, 6vw, 76px)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {P.currency}{rate}
              </span>
              <span style={{ fontSize: 14.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.62)', fontWeight: 500 }}>
                per bookable team member<br></br>per month{annual ? ', billed annually' : ''}
              </span>
            </div>
            <p className="txt-pretty" style={{ margin: '20px 0 0', fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.68)', maxWidth: 400 }}>
              Every feature, for every business — from a one-chair studio to a twenty-bay garage.
              No commission on bookings. No setup fee. No contract.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
              {['Unlimited bookings & clients', 'Marketplace listing across your city',
                'Reminders, deposits & no-show protection', 'Payments with daily payouts',
                'Per-member profiles, portfolios & reviews', 'Insights & exports'].map(f => (
                <ZwCheckRow key={f} dark={true} size={14.5}>{f}</ZwCheckRow>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 30 }}>
              <ZwButton kind="accent" size="lg" onClick={zwOpenBizDashboard} style={{ width: '100%' }}>
                Start your free trial
                <ZIcon name="arrowR" size={17} color="#fff"></ZIcon>
              </ZwButton>
            </div>
          </div>
        </div>

        {/* The calculator */}
        <div style={{
          background: '#fff', border: '1px solid rgba(28,28,26,0.08)', borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--sh-md)', padding: 'clamp(28px, 3.5vw, 44px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <ZwKicker style={{ marginBottom: 6 }}>What would you pay?</ZwKicker>
          <h2 style={{ margin: 0, fontSize: 'clamp(22px, 2.2vw, 28px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--c-900)' }}>
            Price out your team
          </h2>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 32 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-800)', letterSpacing: '-0.01em' }}>Bookable team members</span>
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>{members}</span>
          </div>
          <input type="range" min="1" max="25" step="1" value={members} className="zw-range"
                 aria-label="Bookable team members"
                 onChange={(e) => setMembers(parseInt(e.target.value, 10))}
                 style={{ marginTop: 14 }} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 8,
            fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--c-500)', letterSpacing: '0.06em',
          }}>
            <span>SOLO</span><span>25</span>
          </div>

          {/* Team dots — the price made visible: one dot per bookable member */}
          <div aria-hidden="true" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 18 }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <span key={i} style={{
                width: 13, height: 13, borderRadius: '50%',
                background: i < members ? 'var(--c-ink)' : 'rgba(28,28,26,0.10)',
                transform: i < members ? 'scale(1)' : 'scale(0.72)',
                transition: 'background-color .25s var(--ease-soft), transform .3s var(--ease-spring, var(--ease-out))',
              }}></span>
            ))}
          </div>

          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start', gap: 2, marginTop: 28,
            background: 'var(--c-100)', border: '1px solid rgba(28,28,26,0.08)',
            borderRadius: 999, padding: 3,
          }}>
            <button className="tap" style={seg(annual)} onClick={() => setAnnual(true)}>Annual</button>
            <button className="tap" style={seg(!annual)} onClick={() => setAnnual(false)}>Monthly</button>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 30 }}>
            <div style={{
              borderTop: '1px dashed rgba(28,28,26,0.14)', paddingTop: 22,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-500)' }}>
                  Your total
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1, color: 'var(--c-900)', fontVariantNumeric: 'tabular-nums' }}>
                    {P.currency}{monthlyTotal}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--c-600)', fontWeight: 500 }}>/ month</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: annual ? 'var(--s-success-600)' : 'var(--c-600)', fontWeight: 500 }}>
                  {annual
                    ? 'Saving ' + P.currency + yearSaving + ' a year vs monthly billing'
                    : 'Switch to annual and save ' + P.currency + yearSaving + ' a year'}
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--c-500)', letterSpacing: '0.04em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {members} × {P.currency}{rate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// What's included — grouped columns
// ─────────────────────────────────────────────
// ─────────────────────────────────
// The difference — no commission, told as a receipt
// ─────────────────────────────────
function ZwPricingCompare() {
  const mono = {
    fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums',
  };
  return (
    <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 96px)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
        gap: 'clamp(32px, 5vw, 80px)', alignItems: 'center',
      }} data-feature-grid="">
        <div>
          <ZwKicker style={{ marginBottom: 12 }}>The difference</ZwKicker>
          <h2 className="txt-balance" style={{
            margin: 0, fontSize: 'clamp(24px, 2.8vw, 34px)', fontWeight: 600,
            letterSpacing: '-0.032em', lineHeight: 1.05, color: 'var(--c-900)',
          }}>No commission. We mean it.</h2>
          <p className="txt-pretty" style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.65, color: 'var(--c-700)', maxWidth: 480 }}>
            Most marketplaces take a cut of every new client's first visit — typically 20–30% —
            or charge to be seen at all. On Zavoia, a client who finds you through the marketplace
            costs exactly what a regular costs: nothing beyond your subscription.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 24 }}>
            <ZwCheckRow>No new-client acquisition fees — ever</ZwCheckRow>
            <ZwCheckRow>No per-booking or “boost” charges to stay visible</ZwCheckRow>
            <ZwCheckRow>No feature tiers — the one plan is the top plan</ZwCheckRow>
          </div>
        </div>

        {/* The receipt */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="zw-receipt" style={{
            width: '100%', maxWidth: 360, background: '#fff', borderRadius: 14,
            boxShadow: 'var(--sh-lg)', border: '1px solid rgba(28,28,26,0.06)',
            padding: '24px 26px 22px',
          }}>
            <div style={{ ...mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--c-500)', textAlign: 'center' }}>
              NEW CLIENT · FIRST VISIT
            </div>
            <div style={{ borderBottom: '1.5px dashed rgba(28,28,26,0.16)', margin: '16px 0' }}></div>
            {[['Balayage + tone', '£168.00'], ['Tip', '£20.00']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', fontSize: 14, color: 'var(--c-700)' }}>
                <span>{l}</span>
                <span style={mono}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', fontSize: 14, fontWeight: 600, color: 'var(--c-900)' }}>
              <span>Visit total</span>
              <span style={mono}>£188.00</span>
            </div>
            <div style={{ borderBottom: '1.5px dashed rgba(28,28,26,0.16)', margin: '16px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)' }}>Zavoia marketplace fee</span>
              <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: 'var(--s-success-600)', letterSpacing: '-0.02em' }}>£0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--c-900)' }}>You keep</span>
              <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: 'var(--c-900)', letterSpacing: '-0.02em' }}>£188.00</span>
            </div>
            <div style={{ borderBottom: '1.5px dashed rgba(28,28,26,0.16)', margin: '16px 0' }}></div>
            <div style={{ ...mono, fontSize: 10.5, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--c-500)', textAlign: 'center', lineHeight: 1.7 }}>
              ELSEWHERE, THIS VISIT COSTS YOU £34–£56
              <br></br>IN NEW-CLIENT COMMISSION
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────
const ZW_PR_FAQ = [
  { q: 'Who counts toward the per-member price?', a: 'Only people clients can book time with. A salon with five stylists and two receptionists pays for five. Owners and admin staff use the dashboard free.' },
  { q: 'Is there really no commission or booking fee?', a: 'Really. The subscription is our entire revenue from your business. Bookings, rebookings, and clients who found you through the marketplace all cost the same: nothing extra.' },
  { q: 'What happens when my team changes size?', a: 'Your bill adjusts automatically. Add a member mid-month and you pay a prorated amount; remove one and the next invoice drops. Annual plans credit the difference.' },
  { q: 'How does the free trial work?', a: 'Full product, every feature, ' + window.ZW_PRICING.trialDays + ' days, no card required to start. Take real bookings during the trial — if you leave, your data exports with you.' },
  { q: 'Are prices inclusive of VAT?', a: 'Prices shown exclude VAT, which is added at checkout where applicable. VAT invoices are issued automatically every billing cycle.' },
  { q: 'Can I switch between monthly and annual billing?', a: 'Anytime. Switching to annual applies immediately at the lower rate; switching to monthly takes effect at your next renewal.' },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
function ZwPricingPage({ ctx }) {
  const P = window.ZW_PRICING;
  return (
    <div data-screen-label="Pricing">
      <ZwPageHead kicker="Pricing"
                  title="One plan. Priced by team, not by tier."
                  sub={'Every feature included, ' + P.currency + P.monthly + ' per bookable team member per month — or ' + P.currency + P.annual + ' billed annually. No commission on your bookings, ever.'}></ZwPageHead>
      <ZwPricingCalc ctx={ctx}></ZwPricingCalc>
      <ZwPricingCompare></ZwPricingCompare>
      <section className="zw-container" style={{ paddingTop: 'clamp(64px, 8vw, 96px)', maxWidth: 'min(var(--content-max), 860px)' }}>
        <ZwSectionTitle kicker="Questions" title="Pricing, without the asterisks"></ZwSectionTitle>
        <ZwFaqList items={ZW_PR_FAQ}></ZwFaqList>
      </section>
      <ZwCtaBand kicker="Ready when you are"
                 title="Try it free with your real calendar"
                 sub={P.trialDays + ' days, every feature, no card to start.'}
                 primaryLabel="Start free trial" onPrimary={zwOpenBizDashboard}
                 secondaryLabel="Learn more" onSecondary={() => ctx.go('for-business')}></ZwCtaBand>
    </div>
  );
}

window.ZW_PAGES.pricing = ZwPricingPage;
