// Zavoia — Team Member Profile mock data.
// Plain JS; attaches to window so JSX scripts can read it.
// Person-first: one global identity, one rating, one body of reviews.
// Booking logistics (business → location → services/bundles) live in a tree.

// ─────────────────────────────────────────────────────────────
// The professional — global identity (no per-location scoping)
// ─────────────────────────────────────────────────────────────
window.ZV_PRO = {
  // Name shown EXACTLY as provided by backend — no client-side abbreviation.
  name: 'Mara Voinescu',
  title: 'Senior Stylist · Color',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', // portrait
  rating: 4.9,
  reviewCount: 127,
  years: 8,
  completed: 1400,
  joined: 'March 2019',
  specialties: ['Balayage', 'Color correction', 'Lived-in color', 'Gloss & tone', 'Bridal'],
  languages: ['English', 'Romanian', 'Italian'],
  bio: 'I specialize in lived-in, low-maintenance color — soft balayage, root melts and glosses that grow out beautifully. Twelve years behind the chair across London; happiest when I can take someone three shades lighter without a hint of brass. Consultations are always free, and I will tell you honestly if a look will not work with your hair.',
  certifications: ['L’Oréal Colour Specialist', 'Wella Master Colorist'],
  social: {
    instagram: 'mara.colour',
    tiktok: 'maracolour',
    website: 'maravoinescu.co',
    facebook: 'maravoinescuhair',
  },
};

// Portfolio — hero doubles as a swipeable showcase, anchored by the portrait.
// Index 0 is the portrait; the rest are work.
window.ZV_PORTFOLIO = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=80', // portrait (anchor)
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&q=80', // balayage
  'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=1200&q=80', // blonde
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&q=80', // color
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80', // salon work
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80', // color products
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80', // hair model
];

// ─────────────────────────────────────────────────────────────
// Where she can be booked — businesses → locations.
// Each business carries its OWN currency (never hardcode one globally).
// "Works at" on the profile links each location through to its venue page.
// ─────────────────────────────────────────────────────────────
window.ZV_BUSINESSES = [
  {
    id: 'glow',
    name: 'Glow Studio',
    currency: 'GBP', symbol: '£',
    tagline: 'Independent salon group · London',
    locations: [
      { id: 'glow-soho',       name: 'Soho',       area: 'Soho, London',       address: '14 Greek Street, W1D 4DJ',      rating: 4.7, reviews: 312, photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80', online: true },
      { id: 'glow-shoreditch', name: 'Shoreditch', area: 'Shoreditch, London', address: '8 Redchurch Street, E2 7DD',     rating: 4.8, reviews: 188, photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80', online: true },
    ],
  },
  {
    id: 'lume',
    name: 'Maison Lumé',
    currency: 'GBP', symbol: '£',
    tagline: 'Atelier salon · Notting Hill',
    locations: [
      { id: 'lume-nh', name: 'Notting Hill', area: 'Notting Hill, London', address: '112 Westbourne Grove, W2 5RU', rating: 4.9, reviews: 96, photo: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&q=80', online: true },
    ],
  },
];

// Per-location services & bundles. Price + duration can differ per location.
// Bundles are visually distinguished (isBundle) and list what's included.
// Categories let the flow group long lists.
function mkSvc(id, name, desc, dur, price, cat) {
  return { id, name, desc, dur, price, cat };
}
function mkBundle(id, name, desc, dur, price, includes, pricing = { type: 'fixed' }) {
  return { id, name, desc, dur, price, cat: 'Packages', isBundle: true, includes, pricing };
}

window.ZV_LOCATION_MENU = {
  'glow-soho': [
    mkSvc('gs-balayage', 'Balayage',            'Hand-painted, custom blend.',           150, 145, 'Color'),
    mkSvc('gs-global',   'Global color',         'Single-process root to tip.',           90,  78,  'Color'),
    mkSvc('gs-gloss',    'Gloss & tone',         'Adds shine, kills brass.',              30,  28,  'Color'),
    mkSvc('gs-root',     'Root touch-up',        'Regrowth color, up to 2cm.',            60,  55,  'Color'),
    mkSvc('gs-cut',      "Women's cut & finish", 'Consultation, wash, cut, style.',       60,  42,  'Hair'),
    mkSvc('gs-blow',     'Wash & blowdry',       '',                                      45,  30,  'Hair'),
    mkSvc('gs-treat',    'Olaplex treatment',    'Bond-building, add to any color.',      20,  22,  'Treatments'),
    mkBundle('gs-refresh', 'Colour refresh',     'Most-booked. Keep your colour bright.', 135, 96.05, ['Gloss & tone', 'Root touch-up', 'Wash & blowdry'], { type: 'percent', pct: 15 }),
    mkBundle('gs-signature', 'Signature balayage day', 'A full day in the chair.',        275, 205, ['Balayage', 'Olaplex treatment', "Women's cut & finish", 'Wash & blowdry'], { type: 'fixed' }),
  ],
  'glow-shoreditch': [
    mkSvc('gsh-balayage', 'Balayage',            'Hand-painted, custom blend.',           150, 135, 'Color'),
    mkSvc('gsh-global',   'Global color',         'Single-process root to tip.',           90,  72,  'Color'),
    mkSvc('gsh-gloss',    'Gloss & tone',         'Adds shine, kills brass.',              30,  26,  'Color'),
    mkSvc('gsh-cut',      "Women's cut & finish", 'Consultation, wash, cut, style.',       60,  38,  'Hair'),
    mkSvc('gsh-blow',     'Wash & blowdry',       '',                                      45,  28,  'Hair'),
    mkBundle('gsh-refresh', 'Colour refresh',     'Two-step brightening, grouped.',        75,  54, ['Gloss & tone', 'Wash & blowdry'], { type: 'sum' }),
  ],
  'lume-nh': [
    mkSvc('ln-balayage', 'Balayage',             'Hand-painted, custom blend.',           160, 165, 'Color'),
    mkSvc('ln-correction', 'Color correction',   'By consultation. Priced from.',         240, 280, 'Color'),
    mkSvc('ln-gloss',    'Gloss & tone',         'Adds shine, kills brass.',              30,  34,  'Color'),
    mkSvc('ln-cut',      "Women's cut & finish", 'Consultation, wash, cut, style.',       60,  55,  'Hair'),
    mkSvc('ln-bridal-trial', 'Bridal trial',     'Color + style trial run.',              90,  95,  'Bridal'),
    mkBundle('ln-bridal', 'Bridal day package',  'Trial plus your wedding-day appointment.', 310, 290, ['Bridal trial', 'Balayage', "Women's cut & finish"], { type: 'fixed' }),
  ],
};

// ─────────────────────────────────────────────────────────────
// Reviews — GLOBAL (about the person, across every place she works).
// Minimal: never show which service or location each review was for.
// Every review is tied to a completed appointment → "Verified".
// ─────────────────────────────────────────────────────────────
window.ZV_PRO_REVIEWS = [
  { id: 1, name: 'Elena R.', initial: 'E', avatar: 'https://i.pravatar.cc/120?img=45', stars: 5, verified: true, date: '2 days ago',
    text: 'Mara absolutely nailed the balayage — exactly the dimension I asked for and zero brassiness. She talked me out of going too light, which I appreciated. Best colour I have had in years.',
    reply: { from: 'Mara', text: 'Thank you Elena! So happy with how it turned out — see you for a gloss in 8 weeks 🌿' } },
  { id: 2, name: 'David T.', initial: 'D', avatar: null, stars: 5, verified: true, date: '1 week ago',
    text: 'Came in for a colour correction after a box-dye disaster. Mara was calm, honest about what was possible in one session, and the result was incredible.' },
  { id: 3, name: 'Priya K.', initial: 'P', avatar: 'https://i.pravatar.cc/120?img=32', stars: 5, verified: true, date: '2 weeks ago',
    text: 'Soft, lived-in colour that actually grows out well. Exactly what I wanted.' },
  { id: 4, name: 'Marco L.', initial: 'M', avatar: null, stars: 4, verified: true, date: '3 weeks ago',
    text: 'Lovely result and a great chat. Ran a little over the booked time, but the colour was worth it.' },
  { id: 5, name: 'Sara H.', initial: 'S', avatar: 'https://i.pravatar.cc/120?img=20', stars: 5, verified: true, date: '1 month ago',
    text: 'Did my bridal colour and trial. Felt completely looked after and the photos came out stunning.',
    reply: { from: 'Mara', text: 'Congratulations again Sara! It was an honour 💍' } },
  { id: 6, name: 'Tom B.', initial: 'T', avatar: null, stars: 5, verified: true, date: '1 month ago', text: '' }, // rating, no comment
  { id: 7, name: 'Aisha N.', initial: 'A', avatar: 'https://i.pravatar.cc/120?img=16', stars: 5, verified: true, date: '2 months ago',
    text: 'Followed Mara from her old salon. Worth every mile of the commute — she just gets fine hair.' },
  { id: 8, name: 'Joana M.', initial: 'J', avatar: null, stars: 4, verified: true, date: '2 months ago',
    text: 'Really happy with the gloss and blowdry. Booking was simple and she runs on time.' },
];

window.ZV_PRO_RATING_DIST = { 5: 108, 4: 14, 3: 3, 2: 1, 1: 1 };

// ─────────────────────────────────────────────────────────────
// Booking availability (prototype) — today, open slots, sold slots,
// blackout dates, and a per-day "busy" heat value (0–3). The
// person-first booking flow reads these to render calendar + times.
// ─────────────────────────────────────────────────────────────
window.ZV_TODAY = { year: 2026, month: 5 /* June, 0-indexed */, day: 2 };

(function () {
  const pad = (n) => String(n).padStart(2, '0');
  const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const Y = 2026, M = 5; // June
  const grid = [];
  for (let h = 9; h <= 18; h++) { grid.push(`${pad(h)}:00`); if (h < 18) grid.push(`${pad(h)}:30`); }

  const disabled = new Set();
  const slots = {}, sold = {}, busy = {};
  for (let d = 2; d <= 20; d++) {
    const dow = new Date(Y, M, d).getDay();
    const k = key(Y, M, d);
    if (dow === 0) { disabled.add(k); continue; }          // Sundays closed
    if (d === 5)  { slots[k] = []; busy[k] = 3; continue; } // one fully-booked day
    const open = grid.filter((t, i) => (i + d) % 3 !== 0);  // deterministic openings
    slots[k] = open;
    sold[k] = grid.filter((t) => !open.includes(t)).slice(0, 4);
    busy[k] = open.length > 13 ? 1 : open.length > 9 ? 2 : 3;
  }
  window.ZV_DISABLED_DATES = disabled;
  window.ZV_SLOTS = slots;
  window.ZV_SOLD_SLOTS = sold;
  window.ZV_DAY_BUSY = busy;
})();
