// Zavoia Location Page — mock data
// Plain JS, attaches everything to window so JSX scripts can read it.

window.ZV_PHOTOS = [
  // Curated salon/barber/wellness shots from Unsplash (CDN — stable IDs)
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80', // colored salon products / interior
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80', // hair wash
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80', // barber styling
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80', // salon interior
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80', // barber chair
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&q=80', // bottles shelf
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80', // hair model
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1200&q=80', // modern salon
];

window.ZV_TEAM = [
  { name: 'Mara Voinescu',  role: 'Senior Stylist · Color',    avatar: 'https://i.pravatar.cc/300?img=47', rating: 4.9, reviews: 84, years: 8, priceMult: 1.20, specialty: 'Color correction', booked: true,  nextAvail: 'Tomorrow · 10:30 AM' },
  { name: 'Andrei Pop',     role: 'Master Barber',              avatar: 'https://i.pravatar.cc/300?img=12', rating: 4.8, reviews: 62, years: 6, priceMult: 1.15, specialty: 'Classic cuts',     booked: false, nextAvail: 'Today · 4:00 PM' },
  { name: 'Iulia Stan',     role: 'Stylist · Cuts',             avatar: 'https://i.pravatar.cc/300?img=44', rating: 4.9, reviews: 41, years: 4, priceMult: 1.00, specialty: 'Curl care',        booked: false, nextAvail: 'Today · 1:30 PM' },
  { name: 'Sofia Petrescu', role: 'Brow & Lash',                avatar: 'https://i.pravatar.cc/300?img=49', rating: 4.7, reviews: 28, years: 3, priceMult: 1.00, specialty: 'Lash lift',        booked: false, nextAvail: 'Thu · 9:00 AM' },
  { name: 'Liam Tanase',    role: 'Stylist',                    avatar: 'https://i.pravatar.cc/300?img=14', rating: 4.6, reviews: 19, years: 2, priceMult: 0.95, specialty: 'Men\u2019s cuts',  booked: false, nextAvail: 'Today · 11:15 AM' },
  { name: 'Radu Marin',     role: 'Apprentice',                 avatar: 'https://i.pravatar.cc/300?img=33', rating: null, reviews: 0, years: 1, priceMult: 0.80, specialty: 'Wash & finish',    booked: false, nextAvail: 'Tomorrow · 9:00 AM' },
];

// Day busyness (0 = light, 1 = moderate, 2 = busy, 3 = full) for the next 30 days
window.ZV_DAY_BUSY = (() => {
  const map = {};
  const start = new Date(2026, 4, 18);
  for (let i = 0; i < 30; i++) {
    const dt = new Date(start.getTime() + i * 86400000);
    const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    // Pseudo-random but stable distribution
    map[k] = [0, 1, 1, 2, 0, 1, 2, 2, 3, 1, 0, 1, 2, 3, 1][i % 15];
  }
  return map;
})();

window.ZV_SERVICES = [
  { cat: 'Hair',         dot: 'var(--cat-hair)',    items: [
    { id: 'cut-women',  name: "Women's haircut",          desc: 'Consultation, wash, cut and finish.', dur: 60, price: 38 },
    { id: 'cut-men',    name: "Men's haircut",            desc: 'Wash, scissors or clipper cut.',       dur: 30, price: 24 },
    { id: 'blowdry',    name: 'Wash & blowdry',           desc: '',                                     dur: 45, price: 28 },
    { id: 'updo',       name: 'Special occasion updo',    desc: 'Includes consultation. Add 30min for trial.', dur: 75, price: 65 },
  ]},
  { cat: 'Color',        dot: 'var(--cat-color)',   items: [
    { id: 'glob',       name: 'Global color',             desc: 'Single-process root to tip.',          dur: 90, price: 78 },
    { id: 'balayage',   name: 'Balayage',                 desc: 'Hand-painted highlights, custom blend.', dur: 150, price: 145 },
    { id: 'gloss',      name: 'Gloss & tone',             desc: '',                                     dur: 30, price: 28 },
  ]},
  { cat: 'Brow & Lash',  dot: 'var(--cat-brow)',    items: [
    { id: 'brow-shape', name: 'Brow shaping',             desc: 'Wax, tweeze and trim.',                 dur: 20, price: 18 },
    { id: 'lash-lift',  name: 'Lash lift & tint',         desc: '',                                     dur: 45, price: 42 },
  ]},
  { cat: 'Skin',         dot: 'var(--cat-skin)',    items: [
    { id: 'facial',     name: 'Signature facial',         desc: 'Cleanse, exfoliate, mask, massage.',    dur: 60, price: 58 },
  ]},
];

window.ZV_REVIEWS = [
  { id: 1, name: 'Elena R.',  initial: 'E', stars: 5, verified: true,  date: '2 days ago', helpful: 18,
    text: 'Mara absolutely nailed the balayage — exactly the dimension I asked for and zero brassiness. Booking was seamless and they offered me an espresso the moment I walked in.',
    response: { from: 'Glow Studio', text: 'Thank you Elena! Mara will be thrilled. See you in 8 weeks 🌿' } },
  { id: 2, name: 'David T.',  initial: 'D', stars: 5, verified: true,  date: '1 week ago', helpful: 12,
    text: 'Best men\'s cut in Soho, full stop. Andrei takes the time to talk through what works with how my hair grows.', response: null },
  { id: 3, name: 'Priya K.',  initial: 'P', stars: 4, verified: false, date: '2 weeks ago', helpful: 4,
    text: 'Lovely space and a great gloss treatment. Took a bit longer than the booked slot — small ding, but I\'ll be back.', response: null },
  { id: 4, name: 'Marco L.',  initial: 'M', stars: 5, verified: true,  date: '3 weeks ago', helpful: 7,
    text: 'Iulia is a magician with curly hair. Felt seen and listened to. Pricing was clear up front.', response: null },
  { id: 5, name: 'Sara H.',   initial: 'S', stars: 5, verified: false, date: '1 month ago', helpful: 2,
    text: 'Came in for a wash and blowdry before a wedding. Stayed under an hour and looked photo-ready.', response: null },
];

// Review distribution per period — sparkline data
window.ZV_RATING_TRENDS = {
  '30d':  { avg: 4.8, points: [5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5] },
  'all':  { avg: 4.7, points: [4, 5, 4, 5, 4, 5, 5, 5, 4, 5, 5, 5] },
};

window.ZV_RATING_DIST = { 5: 92, 4: 24, 3: 8, 2: 3, 1: 1 };

window.ZV_HOURS = [
  { d: 'Monday',    h: '09:00 – 19:00' },
  { d: 'Tuesday',   h: '09:00 – 19:00' },
  { d: 'Wednesday', h: '09:00 – 19:00' },
  { d: 'Thursday',  h: '09:00 – 20:00' },
  { d: 'Friday',    h: '09:00 – 20:00' },
  { d: 'Saturday',  h: '10:00 – 18:00' },
  { d: 'Sunday',    h: 'Closed' },
];

window.ZV_LOCATION = {
  brand: 'Glow Studio',
  city: 'Soho',
  name: 'Glow Studio · Soho',
  address: '14 Greek Street, Soho, London W1D 4DJ',
  rating: 4.7,
  reviewCount: 128,
  status: 'open',     // 'open' | 'closed' | '24/7'
  closesAt: '20:00',
  distance: '0.4 mi',
  walkingMin: 8,
  phone: '+44 20 7946 0991',
  brandTagline: 'Independent salon group · 4 locations across London',
  description: 'A light-filled, plant-strewn studio off Soho Square. Our Soho team specializes in lived-in color, precision cuts, and curl care. Walk-ins welcome for fringe trims.',
  social: { instagram: 'glowstudio.soho', tiktok: 'glowstudio' },
  // Average wait when busy (mins) for the location-page pill
  avgWaitMin: 12,
  // Accessibility + languages — for the About tab
  accessibility: ['Wheelchair accessible', 'Step-free entrance', 'Gender-inclusive'],
  languages: ['English', 'Romanian', 'Italian'],
  // Special hours / holidays
  specialHours: [
    { date: 'Mon, May 25', label: 'Spring Bank Holiday', hours: 'Closed' },
    { date: 'Mon, Aug 31', label: 'Summer Bank Holiday', hours: 'Closed' },
    { date: 'Thu, Dec 25', label: 'Christmas Day', hours: 'Closed' },
  ],
  // Cancellation summary shown on About tab
  cancellationSummary: 'Free up to 24h before. Inside 24h, the venue\u2019s policy applies.',
};

// "Today" in the prototype — Mon May 18, 2026 (so May 19 is "tomorrow")
window.ZV_TODAY = { year: 2026, month: 4 /* May, 0-indexed */, day: 18 };

// Disabled dates for the prototype (closed days, blackout dates).
window.ZV_DISABLED_DATES = new Set([
  '2026-05-17', // Sunday
  '2026-05-22', // blackout
  '2026-05-24', // Sunday
  '2026-05-25', // blackout
  '2026-05-31', // Sunday
]);

// Sold-out slots per date — shown greyed out alongside available ones
window.ZV_SOLD_SLOTS = {
  '2026-05-19': ['08:30', '12:30', '13:00', '13:30', '17:30', '18:00'],
  '2026-05-20': ['09:00', '11:30', '12:00', '12:30', '13:00', '13:30', '15:30', '16:30', '18:00'],
  '2026-05-21': ['08:30', '11:30', '12:00', '12:30', '13:00', '14:30', '16:00', '17:00', '17:30'],
};

// Available time slots per date (HH:MM).
window.ZV_SLOTS = {
  '2026-05-19': [
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00',
  ],
  '2026-05-20': [
    '09:30', '10:00', '10:30', '11:00',
    '14:00', '14:30', '15:00', '16:00', '17:30',
  ],
  '2026-05-21': [
    '09:00', '09:30', '10:00', '10:30', '11:00',
    '13:30', '14:00', '15:00', '15:30', '16:30',
  ],
};
