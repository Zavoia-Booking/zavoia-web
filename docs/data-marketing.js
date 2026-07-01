// Zavoia Web — marketing/content data: pricing, blog, local SEO, legal.
// Plain JS on window, loaded after the core datasets.

// ───────────────────────────────────────────────
// Pricing — single plan, priced per bookable team member
// ───────────────────────────────────────────────
window.ZW_PRICING = {
  name: 'Zavoia Business',
  currency: '£',
  monthly: 18,   // per bookable team member / month
  annual: 15,    // per member / month when billed annually
  trialDays: 14,
};

// Marketplace-level stats reused across marketing pages
window.ZW_MKT_STATS = [
  { n: '2,400+', label: 'partner businesses' },
  { n: '120k',   label: 'bookings a month' },
  { n: '4.8',    label: 'average rating', star: true },
  { n: '9',      label: 'live cities' },
];

// ───────────────────────────────────────────────
// Blog — the Zavoia Journal
// cat: 'guides' | 'business' | 'product'
// body blocks: { t:'p'|'h'|'quote'|'list'|'img', ... }
// ───────────────────────────────────────────────
window.ZW_BLOG_CATS = [
  { id: 'all',      label: 'All' },
  { id: 'guides',   label: 'Guides' },
  { id: 'business', label: 'For business' },
  { id: 'product',  label: 'Product news' },
];

window.ZW_BLOG_POSTS = [
  {
    id: 'no-shows-pricing-problem',
    cat: 'business', catLabel: 'For business',
    title: 'No-shows are a pricing problem — how three salons fixed theirs',
    excerpt: 'Empty chairs aren\u2019t bad luck. Deposits, reminders and a fair cancellation window cut no-shows by a third for these London salons.',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80',
    author: { name: 'Tom Hale', role: 'Business editor', avatar: null },
    date: '14 May 2026', read: '6 min read',
    body: [
      { t: 'p', text: 'Every owner we talk to describes no-shows the same way: as weather. Something that happens to you. But across the businesses on Zavoia, no-show rates vary from under 2% to over 15% — for the same service, in the same postcode. That spread isn\u2019t weather. It\u2019s policy.' },
      { t: 'h', text: 'The 24-hour window is the workhorse' },
      { t: 'p', text: 'The single biggest lever is a clearly stated, consistently enforced cancellation window. When clients can reschedule freely up to 24 hours out — and know a late cancel costs something — they reschedule instead of vanishing. Glow Studio in Soho saw no-shows fall from 9% to 4% in the first month after switching it on.' },
      { t: 'quote', text: 'We were nervous deposits would scare people off. Bookings went up. It turns out serious clients like booking somewhere that takes their slot seriously.', who: 'Dana Whitmore, owner, Glow Studio' },
      { t: 'img', src: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1600&q=80', alt: 'A calm, well-run salon floor', cap: 'Glow Studio, Soho \u2014 no-shows under 4% since switching on deposits for peak slots.' },
      { t: 'h', text: 'Deposits, but only where they earn their keep' },
      { t: 'p', text: 'Blanket deposits add friction everywhere to solve a problem that lives in a few places. The pattern that works: deposits on services over 90 minutes, on first-time clients, and on Saturday peak slots. Everything else stays one-tap.' },
      { t: 'list', items: ['Reminders at 48h and 3h — the 3h one matters most', 'Deposits only on long, peak or first-time bookings', 'One-tap reschedule in every reminder, so the easy exit is a new time, not a no-show'] },
      { t: 'p', text: 'None of this needs a spreadsheet. Reminder schedules, deposit rules and cancellation windows are all per-service settings in the Zavoia Business dashboard — set them once and let the defaults work.' },
    ],
  },
  {
    id: 'london-balayage-guide',
    cat: 'guides', catLabel: 'Guides',
    title: 'The London balayage guide: what to ask for, and what it really costs',
    excerpt: 'Lived-in, painted, babylights or a full reverse? A working glossary for your next colour appointment — with honest price ranges.',
    photo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80',
    author: { name: 'Maya Okafor', role: 'Beauty editor', avatar: null },
    date: '8 May 2026', read: '7 min read',
    body: [
      { t: 'p', text: 'Balayage is the most-searched colour service on Zavoia in London, and also the most mispriced expectation. The word covers everything from a two-hour gloss-and-paint to a six-hour transformation, which is why quotes range from £110 to £400 for what sounds like the same thing.' },
      { t: 'h', text: 'Know your four words' },
      { t: 'list', items: ['Classic balayage — hand-painted lightness through the lengths, soft grow-out. From £110.', 'Babylights — fine foils for a brighter, more even result. Usually £150–£220.', 'Lived-in colour — balayage plus a root shadow and gloss, built for 4–6 month grow-out. £180–£280.', 'Colour correction — undoing previous colour first. Quoted after consultation, often £250+.'] },
      { t: 'p', text: 'When you book, the service name matters less than the photos you bring and the consultation notes. The specialists who do this well — Maen Studio in Notting Hill, Aurum in Mayfair, Verre in Islington — all build 15 minutes of consultation into the booking.' },
      { t: 'img', src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1600&q=80', alt: 'Colour work in progress at a London salon', cap: 'Consultation minutes are part of the service \u2014 the good specialists book them in.' },
      { t: 'h', text: 'Timing it right' },
      { t: 'p', text: 'Book toning, not full balayage, for the in-between months. A 45-minute gloss at week 8 keeps the colour alive and roughly halves your yearly colour spend versus re-doing the full service each visit.' },
      { t: 'quote', text: 'The clients with the best hair aren\u2019t the ones who spend the most. They\u2019re the ones on a schedule.', who: 'Ana Maris, colourist, Maen Studio' },
    ],
  },
  {
    id: 'find-a-barber-youll-keep',
    cat: 'guides', catLabel: 'Guides',
    title: 'How to find a barber you\u2019ll actually keep',
    excerpt: 'The average Londoner tries four barbers before settling. Here\u2019s how to shortcut the churn — what to look for in a profile, and the one question to ask in the chair.',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&q=80',
    author: { name: 'Maya Okafor', role: 'Beauty editor', avatar: null },
    date: '29 Apr 2026', read: '5 min read',
    body: [
      { t: 'p', text: 'A good barber relationship is worth more than any single good haircut. The cut you get on visit five — when they know your hair\u2019s behaviour, your tolerance for maintenance, what went wrong last time — is the one you actually wanted on visit one.' },
      { t: 'h', text: 'Read the profile like a regular would' },
      { t: 'list', items: ['Look at the team page, not just the shop. You\u2019re choosing a person.', 'Reviews that mention the same barber by name repeatedly are the strongest signal on the platform.', 'A specific service menu (“skin fade”, “scissor crop”, “beard sculpt”) beats a generic “men\u2019s cut”.'] },
      { t: 'p', text: 'On Zavoia you can book the person, not just the shop — and rebook them in two taps from your appointment history. That rebook button is quietly the whole game: consistency compounds.' },
      { t: 'h', text: 'The one question' },
      { t: 'p', text: 'Ask: “What would you do differently next time?” A barber with a plan for your next cut is a barber thinking past today. That\u2019s who you keep.' },
    ],
  },
  {
    id: 'gel-biab-acrylic-explainer',
    cat: 'guides', catLabel: 'Guides',
    title: 'Gel, BIAB or acrylic? A no-nonsense nail explainer',
    excerpt: 'Three systems, three price points, three maintenance rhythms. What each one is actually for — so you book the right service first time.',
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=80',
    author: { name: 'Maya Okafor', role: 'Beauty editor', avatar: null },
    date: '17 Apr 2026', read: '4 min read',
    body: [
      { t: 'p', text: 'The most common mis-booking on Zavoia\u2019s nails category is someone booking “gel manicure” when they want BIAB, or vice versa. They sound interchangeable. They are not — in wear time, removal, or price.' },
      { t: 'list', items: ['Gel polish — colour cured under UV over your natural nail. 2–3 weeks of wear. From £28.', 'BIAB (builder gel) — adds strength and structure; grows out rather than chips. 3–4 weeks. £40–£55.', 'Acrylic — sculpted length and shape; the most durable and the most commitment. £45–£70 plus infills.'] },
      { t: 'h', text: 'The honest decision rule' },
      { t: 'p', text: 'If your nails break before the polish chips, you want BIAB. If you want length you don\u2019t have, you want acrylic. Otherwise, gel — and spend the savings on the pedicure.' },
      { t: 'p', text: 'One more thing: book removal as part of your next appointment rather than picking at it for a week. Every tech on the platform will thank you, and your nail beds will too.' },
    ],
  },
  {
    id: 'walk-ins-to-fully-booked',
    cat: 'business', catLabel: 'For business',
    title: 'From walk-ins to fully booked: a 90-day playbook for new shops',
    excerpt: 'You don\u2019t need ads to fill a calendar. You need profile photos, a fast first-response, and a rebooking habit. The order matters.',
    photo: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1600&q=80',
    author: { name: 'Tom Hale', role: 'Business editor', avatar: null },
    date: '9 Apr 2026', read: '8 min read',
    body: [
      { t: 'p', text: 'New businesses on Zavoia that reach 80% calendar utilisation share a pattern, and it isn\u2019t marketing spend. It\u2019s a sequence: first make the profile bookable at a glance, then make the first visit excellent, then make rebooking automatic.' },
      { t: 'h', text: 'Days 1–30: be legible' },
      { t: 'list', items: ['Six photos minimum — the space, the work, the people. Phone photos in daylight beat no photos.', 'Name services the way clients search: “skin fade”, not “gents premium”.', 'Put every bookable person on the team page with a face and a specialism.'] },
      { t: 'h', text: 'Days 31–60: win the first visit' },
      { t: 'p', text: 'Reply to questions inside an hour — response time is visible to clients and strongly correlates with first-booking conversion. Confirm fast, remind at 48h and 3h, and start the appointment on time. Reviews follow punctuality more reliably than they follow brilliance.' },
      { t: 'h', text: 'Days 61–90: build the loop' },
      { t: 'p', text: 'Rebooking at checkout is the highest-leverage habit in the industry. “Same time in five weeks?” takes four seconds and lifts repeat rate dramatically — clients prompted to rebook in person return at roughly twice the rate of those left to remember on their own.' },
      { t: 'quote', text: 'We stopped thinking of the calendar as something to fill and started thinking of it as something to defend. Everything changed.', who: 'Andrei Pop, Maison Noir' },
    ],
  },
  {
    id: 'team-page-wins-bookings',
    cat: 'business', catLabel: 'For business',
    title: 'Your team page is your shop window — make every profile earn bookings',
    excerpt: 'Clients book people. Businesses with complete team profiles convert significantly better than those with a bare service list.',
    photo: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=1600&q=80',
    author: { name: 'Tom Hale', role: 'Business editor', avatar: null },
    date: '25 Mar 2026', read: '5 min read',
    body: [
      { t: 'p', text: 'Watch someone choose a salon and you\u2019ll see it: they skim the photos, then go straight to the people. Who would cut my hair? Whose work is this? On Zavoia, profile views of team members are the strongest pre-booking signal we measure.' },
      { t: 'h', text: 'What a converting profile looks like' },
      { t: 'list', items: ['A real photo — not a logo, not sunglasses', 'A one-line specialism: “Curls and texture” beats “Senior stylist”', 'Their own portfolio shots attached to the services they perform', 'Reviews that mention them, surfaced on their profile'] },
      { t: 'p', text: 'Each bookable team member gets a public profile with their own services, portfolio and reviews — it\u2019s part of the per-member subscription, not an add-on. The businesses that treat those pages as their shop window are the ones whose new-client share keeps climbing.' },
    ],
  },
  {
    id: 'whole-team-availability',
    cat: 'product', catLabel: 'Product news',
    title: 'Now live: whole-team availability in one view',
    excerpt: 'Clients can now see every available slot across your whole team for a service — and pick the person or the time, whichever they care about more.',
    photo: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1600&q=80',
    author: { name: 'Zavoia Team', role: 'Product', avatar: null },
    date: '12 Mar 2026', read: '3 min read',
    body: [
      { t: 'p', text: 'Some clients come for a person. Some come for 6:30pm on Thursday. Until now, booking flows made everyone choose a team member first — which quietly hid availability from the time-first crowd.' },
      { t: 'p', text: 'With whole-team view, picking a service now shows the combined calendar: every open slot, with the team members who can take it. Choose the person and see their times, or choose the time and see who\u2019s free.' },
      { t: 'h', text: 'What it means for businesses' },
      { t: 'list', items: ['Time-first clients stop bouncing when their favourite is booked out', 'Newer team members fill up faster — they\u2019re visible in every search', 'No setup: it\u2019s on for every business with 2+ bookable team members'] },
      { t: 'p', text: 'Whole-team view is live on web and in the app today.' },
    ],
  },
  {
    id: 'zavoia-leeds-liverpool',
    cat: 'product', catLabel: 'Product news',
    title: 'Zavoia arrives in Leeds and Liverpool',
    excerpt: 'Two new cities, four hundred new businesses at launch — beauty, dental, auto and home services now bookable across the North West and Yorkshire.',
    photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&q=80',
    author: { name: 'Zavoia Team', role: 'Company', avatar: null },
    date: '26 Feb 2026', read: '2 min read',
    body: [
      { t: 'p', text: 'Leeds and Liverpool are live. From today you can book salons, barbers, dentists, garages, cleaners and more across both cities — with the same live availability and free 24-hour cancellation as everywhere else on Zavoia.' },
      { t: 'p', text: 'Both cities launch with over two hundred businesses each, and the list is growing weekly. If you run a business in either city, the marketplace is open: one plan, priced per bookable team member, no commission on bookings.' },
      { t: 'list', items: ['Now live: London, Manchester, Bristol, Edinburgh, Leeds, Liverpool, New York, Paris, Amsterdam', 'Coming next: Birmingham, Glasgow, Brighton'] },
    ],
  },
  {
    id: 'mot-without-losing-a-saturday',
    cat: 'guides', catLabel: 'Guides',
    title: 'MOT season: how to book it without losing a Saturday',
    excerpt: 'The cheapest MOT slot is rarely the best one. Timing, courtesy checks and the while-you-wait question — a 5-minute read that saves a weekend.',
    photo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80',
    author: { name: 'Maya Okafor', role: 'Guides', avatar: null },
    date: '12 Feb 2026', read: '5 min read',
    body: [
      { t: 'p', text: 'You can book an MOT up to a month before your current certificate expires and keep the original renewal date. Almost nobody does this, which is why garages are empty on Tuesday mornings and rammed on the last Saturday of the month.' },
      { t: 'h', text: 'The booking pattern that works' },
      { t: 'list', items: ['Book 3–4 weeks before expiry — you keep your renewal date and get your pick of slots', 'Weekday early slots are fastest; “while-you-wait” means under an hour at most garages', 'Pair MOT + interim service in one visit — bundled slots are typically £30–£50 cheaper than booking separately'] },
      { t: 'p', text: 'On Zavoia, garages list live slots the same way salons do — so “MOT, Tuesday, before work” is a real search, not a phone call. Kepler Garage in Bermondsey runs while-you-wait MOTs from 7:30am for exactly this crowd.' },
    ],
  },
];

// ───────────────────────────────────────────────
// Local SEO — areas + category metadata for the landing-page templates
// Routes: #/local/london (city hub) · #/local/<area>/<cat> · #/local/london/<cat>
// ───────────────────────────────────────────────
window.ZW_LOCAL_AREAS = [
  { id: 'london',       name: 'London',       kind: 'city' },
  { id: 'soho',         name: 'Soho',         kind: 'area', blurb: 'Central, late-opening, dense with specialists' },
  { id: 'shoreditch',   name: 'Shoreditch',   kind: 'area', blurb: 'East London\u2019s independents and barbershops' },
  { id: 'notting-hill', name: 'Notting Hill', kind: 'area', blurb: 'Neighbourhood studios and colour ateliers' },
  { id: 'mayfair',      name: 'Mayfair',      kind: 'area', blurb: 'Spa, wellness and appointment-only rooms' },
  { id: 'hackney',      name: 'Hackney',      kind: 'area', blurb: 'Studios, trainers and home services' },
  { id: 'camden',       name: 'Camden',       kind: 'area', blurb: 'Barbers, trades and everything in between' },
];

// Per-category SEO copy. noun = plural page title; q = what people search.
window.ZW_LOCAL_CATS = {
  hair:     { noun: 'Hair salons & barbers',    q: 'a haircut' },
  nails:    { noun: 'Nail salons',              q: 'a manicure' },
  massage:  { noun: 'Massage & spa',            q: 'a massage' },
  skin:     { noun: 'Facials & skincare',       q: 'a facial' },
  brow:     { noun: 'Brow & lash studios',      q: 'a brow appointment' },
  color:    { noun: 'Hair colour specialists',  q: 'balayage' },
  dental:   { noun: 'Dentists',                 q: 'a check-up' },
  fitness:  { noun: 'Personal trainers',        q: 'a PT session' },
  auto:     { noun: 'Garages & MOT centres',    q: 'an MOT' },
  cleaning: { noun: 'Home cleaners',            q: 'a home clean' },
  trades:   { noun: 'Trades & repairs',         q: 'an electrician' },
  pets:     { noun: 'Pet groomers',             q: 'dog grooming' },
};

// ───────────────────────────────────────────────
// Legal / policy documents
// ───────────────────────────────────────────────
window.ZW_LEGAL_DOCS = {
  privacy: {
    title: 'Privacy policy', updated: '2 May 2026',
    intro: 'This policy explains what Zavoia collects, why, and the controls you have. The short version: we collect what\u2019s needed to make bookings work, we don\u2019t sell personal data, and you can export or delete your data at any time.',
    sections: [
      { h: 'What we collect', ps: ['Account basics (name, email, phone), booking history, saved businesses, and approximate location when you allow it. Businesses see only what they need to honour your booking: your name, the service, and your contact details for that appointment.'] },
      { h: 'How we use it', ps: ['To run your bookings, send reminders you\u2019ve opted into, surface relevant businesses near you, and keep the marketplace safe. We use aggregated, de-identified data to improve search and availability — never your individual history for advertising.'] },
      { h: 'Sharing', ps: ['We share data with the business you book (to deliver the appointment), payment processors (to take payment), and service providers under contract. We do not sell personal data, full stop.'] },
      { h: 'Your controls', ps: ['Export your data, correct it, or delete your account from Profile → Privacy. Deleting your account removes personal data within 30 days, except records we\u2019re legally required to keep (e.g. payment records).'] },
      { h: 'Contact', ps: ['Questions go to privacy@zavoia.com. If you\u2019re in the UK or EU you can also contact your local data-protection authority.'] },
    ],
  },
  terms: {
    title: 'Terms of service', updated: '2 May 2026',
    intro: 'These terms govern your use of Zavoia as a client. Business accounts are covered by the separate Business Agreement in the dashboard.',
    sections: [
      { h: 'The marketplace', ps: ['Zavoia connects you with independent local businesses. The appointment contract is between you and the business — we provide the booking, payment and messaging rails, and step in on disputes covered by our policies.'] },
      { h: 'Bookings & payment', ps: ['A confirmed booking reserves real time in a real diary. Some services require a deposit, shown clearly before you confirm. Prices listed are set by businesses; what you see at confirmation is what you pay.'] },
      { h: 'Cancellations', ps: ['Our standard window lets you cancel or reschedule free up to 24 hours before the appointment. Some services show a different window at booking — the one shown at confirmation applies. See the Cancellation policy for details.'] },
      { h: 'Fair use', ps: ['Repeated no-shows, review abuse, or harassment of businesses or staff can lead to account limits or removal. We\u2019d rather not — show up, be kind, leave honest reviews.'] },
      { h: 'Liability', ps: ['Services are provided by the businesses themselves. Our liability is limited to the booking fees we charge; nothing in these terms limits liability that can\u2019t legally be limited.'] },
    ],
  },
  cancellation: {
    title: 'Cancellation policy', updated: '14 Apr 2026',
    intro: 'The default policy across the marketplace, designed to be fair in both directions: your plans change, and a business\u2019s time has value.',
    sections: [
      { h: 'The standard window', ps: ['Cancel or reschedule free up to 24 hours before your appointment, in two taps from the appointment page. Within 24 hours, the business\u2019s late-cancellation terms apply — typically a percentage of the service price, always shown at booking.'] },
      { h: 'Deposits', ps: ['Where a deposit was taken, it\u2019s refunded in full for cancellations outside the window, and applied per the business\u2019s terms inside it. Deposits always roll over when you reschedule instead of cancelling.'] },
      { h: 'If the business cancels', ps: ['You\u2019re refunded in full immediately, including any deposit, and we\u2019ll help you rebook with priority slots where available. Businesses that cancel repeatedly lose marketplace ranking.'] },
      { h: 'No-shows', ps: ['Missing an appointment without cancelling may be charged per the business\u2019s stated policy. Three no-shows in six months limits instant booking on your account.'] },
    ],
  },
  cookies: {
    title: 'Cookies policy', updated: '2 May 2026',
    intro: 'How Zavoia uses cookies and similar technologies, and the choices you have. We keep it minimal: enough to make the site work and understand what\u2019s useful, nothing built for cross-site ad tracking.',
    sections: [
      { h: 'What cookies are', ps: ['Small files your browser stores so a site remembers things between visits — that you\u2019re signed in, your city, your preferences. Some are set by us, a few by trusted partners (e.g. our payment processor).'] },
      { h: 'How we use them', ps: ['Essential cookies keep you signed in and the booking flow working. Preference cookies remember your city, language and saved filters. Analytics cookies — aggregated and de-identified — tell us which pages help so we can improve them.'] },
      { h: 'What we don\u2019t do', ps: ['We don\u2019t use advertising cookies that follow you across other sites, and we don\u2019t sell the data cookies collect. Booking history is never used to target ads.'] },
      { h: 'Your choices', ps: ['Manage non-essential cookies from the banner on your first visit, or any time in Profile → Preferences. Blocking essential cookies in your browser may stop bookings and sign-in from working.'] },
    ],
  },
};
