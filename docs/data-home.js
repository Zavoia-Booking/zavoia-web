// Zavoia Home / Search / Map — mock data.
// Plain JS, attaches everything to window so JSX scripts can read it.

// ───────────────────────────────────────────────
// Shared photo CDN (Unsplash, stable IDs)
// ───────────────────────────────────────────────
window.ZV_PHOTOS = [
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1200&q=80',
];

// ───────────────────────────────────────────────
// Today (for "Available today" copy etc)
// ───────────────────────────────────────────────
window.ZV_TODAY = { year: 2026, month: 4 /* May, 0-indexed */, day: 18 };

// ───────────────────────────────────────────────
// Categories — paired with the location-page palette
// ───────────────────────────────────────────────
// Multi-industry. Used by the homepage grid, the full browse sheet, and
// the search sheet. Each industry carries:
//   id, label, dot, icon — used by all surfaces
//   count                — kept in data even though home tile doesn't render
//   section              — grouping in the full browse sheet
//                           (beauty | health | home | pets)
//   tagsPreview          — short list of representative tags. Shown under
//                           the industry name in the browse sheet to expose
//                           the industry → tag depth without a drill-in.
//   photo                — used by Option A (photographic browse cards)
window.ZV_CATEGORIES = [
  // Beauty & wellness
  { id: 'hair',     label: 'Hair',        dot: 'var(--cat-hair)',     icon: 'scissors', count: 312,
    section: 'beauty',
    tagsPreview: ['Cuts', 'Color', 'Balayage', 'Curls', 'Extensions'],
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80' },
  { id: 'nails',    label: 'Nails',       dot: 'var(--cat-nails)',    icon: 'sparkle',  count: 184,
    section: 'beauty',
    tagsPreview: ['Manicure', 'Pedicure', 'Gel', 'Acrylic', 'Nail art'],
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80' },
  { id: 'massage',  label: 'Massage',     dot: 'var(--cat-massage)',  icon: 'sparkle',  count: 96,
    section: 'beauty',
    tagsPreview: ['Deep tissue', 'Sports', 'Hot stone', 'Prenatal'],
    photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80' },
  { id: 'skin',     label: 'Skin & Face', dot: 'var(--cat-skin)',     icon: 'shield',   count: 71,
    section: 'beauty',
    tagsPreview: ['Facials', 'Peels', 'Microneedling', 'Acne'],
    photo: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=900&q=80' },
  { id: 'brow',     label: 'Brow & Lash', dot: 'var(--cat-brow)',     icon: 'sparkle',  count: 58,
    section: 'beauty',
    tagsPreview: ['Brow shape', 'Tint', 'Lash lift', 'Extensions'],
    photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80' },
  { id: 'color',    label: 'Color',       dot: 'var(--cat-color)',    icon: 'sparkle',  count: 53,
    section: 'beauty',
    tagsPreview: ['Balayage', 'Highlights', 'Tone', 'Color correction'],
    photo: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=900&q=80' },

  // Health & care
  { id: 'dental',   label: 'Dental',      dot: 'var(--cat-dental)',   icon: 'tooth',    count: 64,
    section: 'health',
    tagsPreview: ['Check-up', 'Hygienist', 'Whitening', 'Invisalign'],
    photo: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=900&q=80' },
  { id: 'fitness',  label: 'Fitness',     dot: 'var(--cat-fitness)',  icon: 'dumbbell', count: 88,
    section: 'health',
    tagsPreview: ['Personal training', 'Strength', 'Mobility', 'Pilates'],
    photo: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=80' },

  // Home & auto
  { id: 'auto',     label: 'Auto',        dot: 'var(--cat-auto)',     icon: 'car',      count: 142,
    section: 'home',
    tagsPreview: ['MOT', 'Service', 'Detailing', 'Diagnostics'],
    photo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80' },
  { id: 'cleaning', label: 'Cleaning',    dot: 'var(--cat-cleaning)', icon: 'broom',    count: 47,
    section: 'home',
    tagsPreview: ['Regular clean', 'Deep clean', 'End of tenancy'],
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80' },
  { id: 'trades',   label: 'Trades',      dot: 'var(--cat-trades)',   icon: 'wrench',   count: 116,
    section: 'home',
    tagsPreview: ['Electrician', 'Plumber', 'Locksmith', 'Handyman'],
    photo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80' },

  // Pets & more
  { id: 'pets',     label: 'Pets',        dot: 'var(--cat-pets)',     icon: 'paw',      count: 39,
    section: 'pets',
    tagsPreview: ['Dog grooming', 'Cat grooming', 'Nail clip', 'Wash'],
    photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900&q=80' },
];

// Section labels for the browse sheet.
window.ZV_CATEGORY_SECTIONS = [
  { id: 'beauty', label: 'Beauty & wellness' },
  { id: 'health', label: 'Health & care' },
  { id: 'home',   label: 'Home & auto' },
  { id: 'pets',   label: 'Pets & more' },
];

// ───────────────────────────────────────────────
// Editorial promotions — multi-industry, mixed seasons.
// Shape: { id, kicker, title, sub, cta, accent, photo, cat }
// `accent` is the CSS color used for the kicker dot + CTA tint on the card.
// ───────────────────────────────────────────────
window.ZV_PROMOS = [
  {
    id: 'p-first',
    kicker: 'New to Zavoia',
    title: '£10 off your first booking',
    sub: 'Any service · any city. One-time credit on us.',
    cta: 'Claim credit',
    accent: 'var(--p-500)',
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
    cat: 'hair',
  },
  {
    id: 'p-spring',
    kicker: 'Spring refresh',
    title: '20% off colour services',
    sub: '14 specialists in W1 this week.',
    cta: 'See offers',
    accent: 'var(--cat-color)',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    cat: 'color',
  },
  {
    id: 'p-auto',
    kicker: 'Bundle & save',
    title: 'MOT + full service · £45 off',
    sub: 'At 24 garages in London this month.',
    cta: 'Book a slot',
    accent: 'var(--cat-auto)',
    photo: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1200&q=80',
    cat: 'auto',
  },
  {
    id: 'p-dental',
    kicker: 'Health check',
    title: 'Dental check-up · £35 flat',
    sub: 'Until 30 June at participating clinics.',
    cta: 'Find a dentist',
    accent: 'var(--cat-dental)',
    photo: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&q=80',
    cat: 'dental',
  },
  {
    id: 'p-pets',
    kicker: 'Furry friends',
    title: 'Bring your dog · grooming',
    sub: '30% off first wash this weekend.',
    cta: 'Browse groomers',
    accent: 'var(--cat-pets)',
    photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80',
    cat: 'pets',
  },
];

// Coarse user location — IP-derived city. We always have this; precision
// (GPS-level) is permission-gated and lives outside this default.
window.ZV_CITY = { id: 'london', name: 'London', country: 'United Kingdom' };

// Search corpus for the location sheet.
//   kind:   'city' | 'neighbourhood'
//   live:   true  → supported now
//   live:   false → not yet (we offer notify)
//   parent: for neighbourhoods, the city they belong to (display only)
//   recent: pre-seeded recents for the demo
window.ZV_CITIES = [
  // ── UK — live ───────────────────────────────────────────
  { id: 'london',     name: 'London',     country: 'United Kingdom', kind: 'city', live: true, recent: true },
  { id: 'manchester', name: 'Manchester', country: 'United Kingdom', kind: 'city', live: true },
  { id: 'bristol',    name: 'Bristol',    country: 'United Kingdom', kind: 'city', live: true },
  { id: 'edinburgh',  name: 'Edinburgh',  country: 'United Kingdom', kind: 'city', live: true },
  { id: 'leeds',      name: 'Leeds',      country: 'United Kingdom', kind: 'city', live: true },
  { id: 'liverpool',  name: 'Liverpool',  country: 'United Kingdom', kind: 'city', live: true },

  // ── UK — coming soon ───────────────────────────────────
  { id: 'birmingham', name: 'Birmingham', country: 'United Kingdom', kind: 'city', live: false },
  { id: 'glasgow',    name: 'Glasgow',    country: 'United Kingdom', kind: 'city', live: false },
  { id: 'oxford',     name: 'Oxford',     country: 'United Kingdom', kind: 'city', live: false },
  { id: 'cambridge',  name: 'Cambridge',  country: 'United Kingdom', kind: 'city', live: false },
  { id: 'brighton',   name: 'Brighton',   country: 'United Kingdom', kind: 'city', live: false, recent: true },

  // ── London neighbourhoods — live ────────────────────────
  { id: 'soho',         name: 'Soho',         parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },
  { id: 'shoreditch',   name: 'Shoreditch',   parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },
  { id: 'notting-hill', name: 'Notting Hill', parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },
  { id: 'mayfair',      name: 'Mayfair',      parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },
  { id: 'hackney',      name: 'Hackney',      parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },
  { id: 'camden',       name: 'Camden',       parent: 'London', country: 'United Kingdom', kind: 'neighbourhood', live: true },

  // ── Global — live ──────────────────────────────────────
  { id: 'nyc',     name: 'New York',  country: 'United States', kind: 'city', live: true },
  { id: 'paris',   name: 'Paris',     country: 'France',        kind: 'city', live: true },
  { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', kind: 'city', live: true },

  // ── Global neighbourhoods — live ───────────────────────
  { id: 'brooklyn',  name: 'Brooklyn',  parent: 'New York', country: 'United States', kind: 'neighbourhood', live: true },
  { id: 'le-marais', name: 'Le Marais', parent: 'Paris',    country: 'France',        kind: 'neighbourhood', live: true },

  // ── Global — coming soon ───────────────────────────────
  { id: 'berlin',  name: 'Berlin',    country: 'Germany', kind: 'city', live: false },
  { id: 'madrid',  name: 'Madrid',    country: 'Spain',   kind: 'city', live: false },
  { id: 'lisbon',  name: 'Lisbon',    country: 'Portugal',kind: 'city', live: false },
  { id: 'tokyo',   name: 'Tokyo',     country: 'Japan',   kind: 'city', live: false },
  { id: 'milano',  name: 'Milan',     country: 'Italy',   kind: 'city', live: false },
  { id: 'dublin',  name: 'Dublin',    country: 'Ireland', kind: 'city', live: false },
  { id: 'sydney',  name: 'Sydney',    country: 'Australia', kind: 'city', live: false },
];

// ───────────────────────────────────────────────
// Trending tags — surfaces the *tag* layer beneath the industry grid.
// Mixed-industry on purpose: signals breadth without making the grid heavier.
// `cat` keys into ZV_CATEGORIES.dot so the chip can carry its own colour dot.
// ───────────────────────────────────────────────
window.ZV_TRENDING_TAGS = [
  { id: 't-bal',    label: 'Balayage',         cat: 'color',    count: 34 },
  { id: 't-mot',    label: 'MOT',              cat: 'auto',     count: 142 },
  { id: 't-lash',   label: 'Lash lift',        cat: 'brow',     count: 58 },
  { id: 't-white',  label: 'Teeth whitening',  cat: 'dental',   count: 26 },
  { id: 't-dog',    label: 'Dog wash',         cat: 'pets',     count: 18 },
  { id: 't-hot',    label: 'Hot stone',        cat: 'massage',  count: 41 },
  { id: 't-cut-m',  label: "Men's cut",        cat: 'hair',     count: 96 },
  { id: 't-gel',    label: 'Gel manicure',     cat: 'nails',    count: 67 },
  { id: 't-facial', label: 'Signature facial', cat: 'skin',     count: 22 },
  { id: 't-pt',     label: '1:1 PT session',   cat: 'fitness',  count: 31 },
];

// ───────────────────────────────────────────────
// Businesses — used everywhere (homepage carousels, search results, map pins).
// Coordinates are in normalised viewport space [0..1] for the stylised map.
// ───────────────────────────────────────────────
window.ZV_BUSINESSES = [
  {
    id: 'glow-soho', name: 'Glow Studio', city: 'Soho · London',
    cat: 'hair', catLabel: 'Hair · Color',
    rating: 4.9, reviews: 213, priceFrom: 38, currency: '£',
    distance: '0.4 mi', distanceKm: 0.6,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Today · 3:30 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    mapX: 0.52, mapY: 0.46,
    blurb: 'Lived-in color, precision cuts.',
  },
  {
    id: 'maison-noir', name: 'Maison Noir', city: 'Shoreditch',
    cat: 'hair', catLabel: 'Barber',
    rating: 4.8, reviews: 162, priceFrom: 24, currency: '£',
    distance: '0.9 mi', distanceKm: 1.4,
    status: 'open', closesAt: '19:00',
    nextSlot: 'Today · 4:15 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
    mapX: 0.72, mapY: 0.30,
    blurb: 'Classic cuts & hot-towel shaves.',
  },
  {
    id: 'orris-skin', name: 'Orris Skin', city: 'Marylebone',
    cat: 'skin', catLabel: 'Facials',
    rating: 4.9, reviews: 88, priceFrom: 58, currency: '£',
    distance: '1.2 mi', distanceKm: 1.9,
    status: 'open', closesAt: '21:00',
    nextSlot: 'Tomorrow · 10:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80',
    mapX: 0.34, mapY: 0.62,
    blurb: 'Bespoke facials & lymphatic massage.',
  },
  {
    id: 'studio-petale', name: 'Studio Pétale', city: 'Notting Hill',
    cat: 'nails', catLabel: 'Nails',
    rating: 4.7, reviews: 56, priceFrom: 28, currency: '£',
    distance: '1.6 mi', distanceKm: 2.5,
    status: 'open', closesAt: '19:30',
    nextSlot: 'Today · 6:00 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
    mapX: 0.18, mapY: 0.34,
    blurb: 'Editorial nails & soft gel.',
  },
  {
    id: 'forma-brow', name: 'Forma Brow Bar', city: 'Covent Garden',
    cat: 'brow', catLabel: 'Brow & Lash',
    rating: 4.8, reviews: 41, priceFrom: 18, currency: '£',
    distance: '0.7 mi', distanceKm: 1.1,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Today · 5:45 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
    mapX: 0.58, mapY: 0.62,
    blurb: 'Lash lift & brow shaping.',
  },
  {
    id: 'sage-massage', name: 'Sage Wellness', city: 'Mayfair',
    cat: 'massage', catLabel: 'Massage · Spa',
    rating: 4.9, reviews: 124, priceFrom: 75, currency: '£',
    distance: '0.6 mi', distanceKm: 1.0,
    status: 'open', closesAt: '22:00',
    nextSlot: 'Tomorrow · 11:30 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&q=80',
    mapX: 0.44, mapY: 0.24,
    blurb: 'Deep tissue, sports & prenatal.',
  },
  {
    id: 'verre-color', name: 'Verre Color', city: 'Islington',
    cat: 'color', catLabel: 'Color Specialist',
    rating: 4.8, reviews: 73, priceFrom: 78, currency: '£',
    distance: '1.9 mi', distanceKm: 3.0,
    status: 'closed', closesAt: '10:00',
    nextSlot: 'Wed · 9:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1200&q=80',
    mapX: 0.80, mapY: 0.70,
    blurb: 'Balayage & color correction.',
  },
  {
    id: 'noor-hair', name: 'Noor Hair Studio', city: 'Soho',
    cat: 'hair', catLabel: 'Hair · Curl care',
    rating: 4.9, reviews: 198, priceFrom: 42, currency: '£',
    distance: '0.5 mi', distanceKm: 0.8,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Today · 7:00 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
    mapX: 0.50, mapY: 0.40,
    blurb: 'Specialists in curls & texture.',
  },

  // ── Auto ──────────────────────────────────────
  {
    id: 'kepler-auto', name: 'Kepler Garage', city: 'Bermondsey',
    cat: 'auto', catLabel: 'Garage · MOT',
    rating: 4.8, reviews: 312, priceFrom: 55, currency: '£',
    distance: '2.1 mi', distanceKm: 3.4,
    status: 'open', closesAt: '18:00',
    nextSlot: 'Today · 4:00 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1200&q=80',
    mapX: 0.66, mapY: 0.78,
    blurb: 'MOT, service & diagnostics.',
  },
  {
    id: 'oak-detail', name: 'Oak Auto Detailing', city: 'Wandsworth',
    cat: 'auto', catLabel: 'Detailing',
    rating: 4.9, reviews: 144, priceFrom: 95, currency: '£',
    distance: '3.0 mi', distanceKm: 4.8,
    status: 'open', closesAt: '19:00',
    nextSlot: 'Tomorrow · 9:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1542367592-8849eb950fd8?w=1200&q=80',
    mapX: 0.12, mapY: 0.82,
    blurb: 'Ceramic coatings & full-detail.',
  },

  // ── Dental ────────────────────────────────────
  {
    id: 'merid-dent', name: 'Meridian Dental', city: 'Fitzrovia',
    cat: 'dental', catLabel: 'Dentist · NHS + private',
    rating: 4.9, reviews: 421, priceFrom: 35, currency: '£',
    distance: '0.8 mi', distanceKm: 1.3,
    status: 'open', closesAt: '17:30',
    nextSlot: 'Today · 5:00 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&q=80',
    mapX: 0.40, mapY: 0.18,
    blurb: 'Check-ups, hygienist & whitening.',
  },
  {
    id: 'aria-dent', name: 'Aria Smile Studio', city: 'Chelsea',
    cat: 'dental', catLabel: 'Dental · Cosmetic',
    rating: 4.8, reviews: 188, priceFrom: 120, currency: '£',
    distance: '2.4 mi', distanceKm: 3.8,
    status: 'open', closesAt: '19:00',
    nextSlot: 'Thu · 11:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    mapX: 0.86, mapY: 0.18,
    blurb: 'Invisalign, veneers & whitening.',
  },

  // ── Fitness ───────────────────────────────────
  {
    id: 'helix-fit', name: 'Helix Studio', city: 'Hackney',
    cat: 'fitness', catLabel: 'Personal training',
    rating: 4.9, reviews: 92, priceFrom: 48, currency: '£',
    distance: '2.8 mi', distanceKm: 4.5,
    status: 'open', closesAt: '21:00',
    nextSlot: 'Today · 6:30 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80',
    mapX: 0.92, mapY: 0.46,
    blurb: 'Strength, mobility, conditioning.',
  },

  // ── Cleaning ──────────────────────────────────
  {
    id: 'lila-clean', name: 'Lila Home Cleaning', city: 'Battersea',
    cat: 'cleaning', catLabel: 'Home cleaning',
    rating: 4.8, reviews: 256, priceFrom: 22, currency: '£',
    distance: '1.7 mi', distanceKm: 2.7,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Tomorrow · 8:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    mapX: 0.08, mapY: 0.52,
    blurb: 'Eco-friendly cleans · 2-3 hrs.',
  },

  // ── Pets ──────────────────────────────────────
  {
    id: 'paws-soho', name: 'Paws & Co.', city: 'Soho',
    cat: 'pets', catLabel: 'Dog grooming',
    rating: 4.9, reviews: 117, priceFrom: 35, currency: '£',
    distance: '0.6 mi', distanceKm: 0.9,
    status: 'open', closesAt: '19:00',
    nextSlot: 'Today · 2:30 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80',
    mapX: 0.26, mapY: 0.22,
    blurb: 'Full groom, bath & nail-clip.',
  },

  // ── Trades ────────────────────────────────────
  {
    id: 'forge-elec', name: 'Forge Electrical', city: 'Camden',
    cat: 'trades', catLabel: 'Electrician',
    rating: 4.8, reviews: 78, priceFrom: 65, currency: '£',
    distance: '2.3 mi', distanceKm: 3.7,
    status: 'open', closesAt: '18:00',
    nextSlot: 'Today · 5:30 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
    mapX: 0.72, mapY: 0.08,
    blurb: 'Same-day call-outs · NICEIC.',
  },
  // ── Hair (expanded so category list feels real) ──
  {
    id: 'rouge-shoreditch', name: 'Rouge Atelier', city: 'Shoreditch',
    cat: 'hair', catLabel: 'Hair · Editorial',
    rating: 4.9, reviews: 287, priceFrom: 65, currency: '£',
    distance: '0.8 mi', distanceKm: 1.3,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Today · 3:00 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80',
    mapX: 0.66, mapY: 0.34,
    tags: ['cuts', 'color', 'balayage'],
    blurb: 'Editorial cuts & lived-in colour.',
  },
  {
    id: 'fold-fitzrovia', name: 'Fold', city: 'Fitzrovia',
    cat: 'hair', catLabel: 'Hair · Cuts',
    rating: 4.8, reviews: 132, priceFrom: 45, currency: '£',
    distance: '0.7 mi', distanceKm: 1.1,
    status: 'open', closesAt: '19:30',
    nextSlot: 'Today · 5:30 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
    mapX: 0.38, mapY: 0.26,
    tags: ['cuts'],
    blurb: 'Precision cuts, no fuss.',
  },
  {
    id: 'aurum-mayfair', name: 'Aurum Hair', city: 'Mayfair',
    cat: 'hair', catLabel: 'Hair · Color',
    rating: 4.9, reviews: 421, priceFrom: 85, currency: '£',
    distance: '1.1 mi', distanceKm: 1.8,
    status: 'open', closesAt: '20:30',
    nextSlot: 'Tomorrow · 11:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=1200&q=80',
    mapX: 0.42, mapY: 0.28,
    tags: ['color', 'balayage', 'highlights'],
    blurb: 'Tonal colour specialists.',
  },
  {
    id: 'kept-soho', name: 'Kept', city: 'Soho',
    cat: 'hair', catLabel: 'Hair · Curl care',
    rating: 4.8, reviews: 95, priceFrom: 52, currency: '£',
    distance: '0.4 mi', distanceKm: 0.6,
    status: 'open', closesAt: '19:00',
    nextSlot: 'Today · 6:15 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
    mapX: 0.54, mapY: 0.42,
    tags: ['cuts', 'curls'],
    blurb: 'Cuts that grow out beautifully.',
  },
  {
    id: 'theo-camden', name: 'Theo & Co.', city: 'Camden',
    cat: 'hair', catLabel: 'Barber',
    rating: 4.7, reviews: 173, priceFrom: 28, currency: '£',
    distance: '1.8 mi', distanceKm: 2.9,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Today · 4:45 PM', availableToday: true,
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80',
    mapX: 0.74, mapY: 0.14,
    tags: ['cuts', 'shave'],
    blurb: 'Old-school barbering with care.',
  },
  {
    id: 'maen-bal', name: 'Maen Studio', city: 'Notting Hill',
    cat: 'hair', catLabel: 'Hair · Balayage',
    rating: 4.9, reviews: 312, priceFrom: 110, currency: '£',
    distance: '2.0 mi', distanceKm: 3.2,
    status: 'open', closesAt: '20:00',
    nextSlot: 'Fri · 10:00 AM', availableToday: false,
    photo: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&q=80',
    mapX: 0.14, mapY: 0.36,
    tags: ['balayage', 'color'],
    blurb: 'Painted balayage, hand-tailored.',
  },
];

// ───────────────────────────────────────────────
// Backfill business-level facts the filters sheet checks against
// (online-booking flag, offers flag) + a `tags` field on each business
// (used by the category page to filter by tag).
// Runs AFTER ZV_BUSINESSES is defined.
// ───────────────────────────────────────────────
(function backfillBusinessMeta() {
  const onlineBooking = new Set(['glow-soho', 'maison-noir', 'orris-skin', 'studio-petale',
    'forma-brow', 'sage-massage', 'noor-hair', 'kepler-auto', 'merid-dent',
    'aria-dent', 'helix-fit', 'paws-soho', 'rouge-shoreditch', 'fold-fitzrovia',
    'aurum-mayfair', 'kept-soho', 'maen-bal']);
  const hasOffers = new Set(['glow-soho', 'kepler-auto', 'merid-dent', 'paws-soho',
    'verre-color', 'aurum-mayfair']);
  for (const b of window.ZV_BUSINESSES) {
    b.onlineBooking = onlineBooking.has(b.id);
    b.hasOffers     = hasOffers.has(b.id);
  }
})();

(function backfillBusinessTags() {
  const seed = {
    'glow-soho':    ['cuts', 'color'],
    'maison-noir':  ['cuts', 'shave'],
    'orris-skin':   ['facials', 'peels'],
    'studio-petale':['manicure', 'gel', 'nail-art'],
    'forma-brow':   ['brow', 'lash', 'tint'],
    'sage-massage': ['deep-tissue', 'sports', 'prenatal'],
    'verre-color':  ['color', 'balayage', 'highlights'],
    'noor-hair':    ['cuts', 'curls'],
    'kepler-auto':  ['mot', 'service', 'diagnostics'],
    'oak-detail':   ['detailing', 'ceramic'],
    'merid-dent':   ['check-up', 'hygienist', 'whitening'],
    'aria-dent':    ['invisalign', 'veneers', 'whitening'],
    'helix-fit':    ['pt', 'strength', 'mobility'],
    'lila-clean':   ['regular', 'deep'],
    'paws-soho':    ['dog-groom', 'wash', 'nail-clip'],
    'forge-elec':   ['electrician'],
  };
  for (const b of window.ZV_BUSINESSES) {
    if (!b.tags && seed[b.id]) b.tags = seed[b.id];
  }
})();
// New fields per appointment:
//   tense:        'now' | 'today' | 'future' | 'past'
//   services:     string[]   — list of line items in the booking
//   durationMin:  number     — total appointment duration in minutes
//   price:        number     — total price (units of `currency`)
//   currency:     '£' | '€' | '$' …
//   endTime:      string     — for 'now' (in-progress) only, hh:mm
//   travelTime:   string     — for 'today' only, e.g. '12 min walk'
//   leaveBy:      string     — for 'today' only, hh:mm
// ───────────────────────────────────────────────
window.ZV_RECENT_APPTS = [
  // ── In-progress (happening RIGHT NOW) ─────────────────
  {
    id: 'a0', bizId: 'sage-massage', business: 'Sage Wellness',
    service: 'Deep tissue massage',
    services: ['Deep tissue massage'],
    provider: 'Liana Marek',
    photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
    day: 'Mon', date: '15 Dec', time: '11:00', endTime: '11:30',
    rel: 'In progress', status: 'In progress', statusTone: 'live',
    cat: 'massage', tense: 'now',
    durationMin: 30, price: 75, currency: '£',
  },

  // ── Today (later in the day) ───────────────────────────
  {
    id: 'a05', bizId: 'forma-brow', business: 'Forma Brow Bar',
    service: 'Brow shape + lash tint',
    services: ['Brow shape', 'Lash tint'],
    provider: 'Iris Hale',
    photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
    day: 'Mon', date: '15 Dec', time: '17:30',
    rel: 'In 5 hours', status: 'Confirmed', statusTone: 'success',
    cat: 'brow', tense: 'today',
    durationMin: 45, price: 38, currency: '£',
    travelTime: null, leaveBy: null,
  },

  // ── Future ────────────────────────────────────────────
  {
    id: 'a1', bizId: 'glow-soho', business: 'Glow Studio',
    service: "Women's cut + tone",
    services: ["Women's haircut", 'Tone refresh'],
    provider: 'Mara Voinescu',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
    day: 'Tue', date: '16 Dec', time: '10:30',
    rel: 'Tomorrow', status: 'Confirmed', statusTone: 'success',
    cat: 'hair', tense: 'future',
    durationMin: 90, price: 78, currency: '£',
  },
  {
    id: 'a2', bizId: 'orris-skin', business: 'Orris Skin',
    service: 'Signature facial',
    services: ['Signature facial'],
    provider: 'Sophie Reyes',
    photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    day: 'Fri', date: '19 Dec', time: '18:30',
    rel: 'In 5 days', status: 'Scheduled', statusTone: 'info',
    cat: 'skin', tense: 'future',
    durationMin: 75, price: 95, currency: '£',
  },

  // ── Past ──────────────────────────────────────────────
  {
    id: 'a3', bizId: 'maison-noir', business: 'Maison Noir',
    service: "Men's cut + hot-towel",
    services: ["Men's haircut", 'Hot-towel shave'],
    provider: 'Andrei Pop',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    day: 'Mon', date: '8 Dec', time: '16:00',
    rel: '1 week ago', status: 'Completed', statusTone: 'neutral',
    cat: 'hair', tense: 'past',
    durationMin: 45, price: 36, currency: '£',
  },
  {
    id: 'a4', bizId: 'noor-hair', business: 'Noor Hair',
    service: 'Balayage + tone',
    services: ['Balayage', 'Tone refresh'],
    provider: null,  // location-only — drop-in / no specific team member
    photo: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80',
    day: 'Wed', date: '26 Nov', time: '11:00',
    rel: '3 weeks ago', status: 'Completed', statusTone: 'neutral',
    cat: 'color', tense: 'past',
    durationMin: 150, price: 168, currency: '£',
  },
  {
    id: 'a5', bizId: 'glow-soho', business: 'Glow Studio',
    service: 'Color refresh',
    services: ['Color refresh'],
    provider: 'Mara Voinescu',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
    day: 'Thu', date: '6 Nov', time: '14:00',
    rel: '6 weeks ago', status: 'Cancelled', statusTone: 'warning',
    cat: 'hair', tense: 'past',
    durationMin: 60, price: 58, currency: '£',
  },
];

// ───────────────────────────────────────────────
// Your providers (rebook strip) — derived from past bookings
// ───────────────────────────────────────────────
window.ZV_YOUR_PROVIDERS = [
  { id: 'p1', stylist: 'Mara Voinescu',  role: 'Senior Stylist',  business: 'Glow Studio', avatar: 'https://i.pravatar.cc/300?img=47', photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80', lastVisit: '6 weeks ago',  nextSlot: 'Tomorrow · 10:30 AM', cat: 'hair' },
  { id: 'p2', stylist: 'Andrei Pop',     role: 'Master Barber',   business: 'Maison Noir', avatar: 'https://i.pravatar.cc/300?img=12', photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80', lastVisit: '3 weeks ago',  nextSlot: 'Today · 4:00 PM', cat: 'hair' },
  { id: 'p3', stylist: 'Iulia Stan',     role: 'Stylist',         business: 'Noor Hair',   avatar: 'https://i.pravatar.cc/300?img=44', photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80', lastVisit: '2 months ago', nextSlot: 'Today · 1:30 PM', cat: 'color' },
];

// ───────────────────────────────────────────────
// Recent searches (empty state of search sheet)
// ───────────────────────────────────────────────
window.ZV_RECENT_SEARCHES = [
  { id: 's1', label: 'Balayage near me',           sub: 'Today · Soho' },
  { id: 's2', label: 'Hair salon',                  sub: 'Anytime · Current location' },
  { id: 's3', label: 'Lash lift',                   sub: 'This week · Covent Garden' },
  { id: 's4', label: 'Deep tissue massage',         sub: 'Tomorrow · Mayfair' },
];

// ───────────────────────────────────────────────
// Autocomplete suggestions — what the user sees as they type
// ───────────────────────────────────────────────
window.ZV_SUGGESTIONS = {
  ha: [
    { kind: 'service',  label: 'Haircut',                hint: '128 places nearby' },
    { kind: 'service',  label: 'Hair color',             hint: '64 places' },
    { kind: 'service',  label: 'Hair extensions',        hint: '12 places' },
    { kind: 'business', label: 'Hair & Co. Studio',      hint: 'Soho · 0.3 mi' },
  ],
  bal: [
    { kind: 'service',  label: 'Balayage',               hint: '34 specialists' },
    { kind: 'service',  label: 'Babylights',             hint: '18 places' },
    { kind: 'business', label: 'Verre Color',            hint: 'Islington · 1.9 mi' },
  ],
};

// ───────────────────────────────────────────────
// "Where" presets in the search sheet
// ───────────────────────────────────────────────
window.ZV_WHERE_PRESETS = [
  { id: 'current', label: 'Current location',  sub: 'Soho, London' },
  { id: 'nearby',  label: 'Nearby (5 km)',      sub: 'Around me' },
  { id: 'city',    label: 'City Center',        sub: 'London W1' },
  { id: 'map',     label: 'Choose on map',      sub: 'Pick a point' },
];

// ───────────────────────────────────────────────
// "When" presets
// ───────────────────────────────────────────────
window.ZV_WHEN_PRESETS = [
  { id: 'any',    label: 'Any time' },
  { id: 'today',  label: 'Today' },
  { id: 'tom',    label: 'Tomorrow' },
  { id: 'week',   label: 'This week' },
  { id: 'month',  label: 'This month' },
  { id: 'pick',   label: 'Pick a date' },
];

// ───────────────────────────────────────────────
// About-section enrichment — accessibility, languages.
// These are the same fields collected on the location page's About tab.
// Mock data here is deterministic per business id so filters always
// behave the same. Replace with real onboarding data when available.
// ───────────────────────────────────────────────
window.ZV_ACCESSIBILITY_OPTIONS = ['Wheelchair accessible', 'Step-free entrance', 'Gender-inclusive'];
window.ZV_LANGUAGE_OPTIONS      = ['English', 'Romanian', 'Italian', 'Spanish', 'French', 'Polish', 'Arabic'];
window.ZV_AMENITY_OPTIONS       = ['Wi-Fi', 'Parking', 'Pet-friendly', 'Kid-friendly', 'Mobile service', 'Remote / Online available', 'Walk-ins welcome'];
window.ZV_VALUES_OPTIONS        = ['Independent', 'Eco-conscious', 'Vegan products', 'Cruelty-free', 'Refillable', 'Black-owned', 'Women-owned', 'LGBTQ+-owned'];

(function decorateBusinessesForFilters() {
  if (!Array.isArray(window.ZV_BUSINESSES)) return;
  const hash = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  window.ZV_BUSINESSES.forEach((b) => {
    if (!b.accessibility) {
      const h = hash(b.id + ':a11y');
      const out = [];
      if (h % 4 !== 0) out.push('Step-free entrance');
      if (h % 3 !== 0) out.push('Wheelchair accessible');
      if (h % 5 === 0) out.push('Gender-inclusive');
      b.accessibility = out;
    }
    if (!b.languages) {
      const h = hash(b.id + ':lang');
      const out = ['English']; // everyone speaks English (London-centric corpus)
      if (h % 3 === 0) out.push('Romanian');
      if (h % 4 === 0) out.push('Italian');
      if (h % 5 === 0) out.push('Spanish');
      if (h % 6 === 0) out.push('French');
      if (h % 7 === 0) out.push('Polish');
      if (h % 11 === 0) out.push('Arabic');
      b.languages = out;
    }
    if (!b.amenities) {
      const h = hash(b.id + ':amen');
      const out = [];
      if (h % 2 === 0)  out.push('Wi-Fi');
      if (h % 4 === 0)  out.push('Parking');
      if (h % 5 === 0)  out.push('Pet-friendly');
      if (h % 6 === 0)  out.push('Kid-friendly');
      if (h % 7 === 0)  out.push('Mobile service');
      if (h % 9 === 0)  out.push('Remote / Online available');
      if (h % 3 === 0)  out.push('Walk-ins welcome');
      b.amenities = out;
    }
    if (!b.values) {
      const h = hash(b.id + ':val');
      const out = [];
      if (h % 2 === 0) out.push('Independent');
      if (h % 5 === 0) out.push('Eco-conscious');
      if (h % 7 === 0) out.push('Vegan products');
      if (h % 9 === 0) out.push('Cruelty-free');
      if (h % 11 === 0) out.push('Refillable');
      if (h % 8 === 0) out.push('Black-owned');
      if (h % 6 === 0) out.push('Women-owned');
      if (h % 13 === 0) out.push('LGBTQ+-owned');
      b.values = out;
    }
    if (typeof b.openTwentyFour !== 'boolean') {
      const h = hash(b.id + ':24h');
      // ~12% of businesses are 24/7 — emergency services, late-night salons, etc.
      b.openTwentyFour = h % 8 === 0;
    }
  });
})();
