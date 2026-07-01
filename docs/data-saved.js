// Zavoia — Saved / Favorites dataset.
//
// A FLAT, sorted list of everything the user has saved. Three kinds of
// saveable entity live together here:
//   type: 'place'    — a whole business / brand          (ZV_BUSINESSES)
//   type: 'location' — a specific venue of a business    (a bookable branch)
//   type: 'person'   — a team member / provider          (ZV_YOUR_PROVIDERS + staff)
//
// Each item is denormalised so a card never has to resolve a reference at
// render time. Every item carries the four sort keys the page sorts on:
//   savedDaysAgo  (recent)   · lower = more recently saved
//   distanceKm    (nearby)
//   rating        (top rated)
//   availSoon     (available) · minutes until next slot; 99999 = none today
//
// Built in an IIFE so it runs AFTER data.js has populated ZV_BUSINESSES.

(function buildSaved() {
  const biz = (id) => (window.ZV_BUSINESSES || []).find((b) => b.id === id) || {};

  // How many bookable branches each business has. Anything not listed has a
  // single location (count 1) and shows its city directly. Multi-branch
  // businesses instead advertise "N locations" so the card reads as a picker.
  const LOCATION_COUNT = {
    'glow-soho': 4,
    'merid-dent': 3,
    'noor-hair': 2,
    'kept-soho': 2,
  };

  // "Available today" businesses get a small minutes-until figure so the
  // "Available soon" sort has something to order by. Deterministic per id.
  const soonMinutes = (b) => {
    if (!b.availableToday) return 99999;
    let h = 7;
    for (const c of (b.id || '')) h = (h * 31 + c.charCodeAt(0)) % 360;
    return 20 + h; // 20–380 min out
  };

  const place = (id, savedDaysAgo, savedLabel) => {
    const b = biz(id);
    return {
      key: 'p-' + id,
      type: 'place',
      id,
      name: b.name,
      cat: b.cat, catLabel: b.catLabel,
      city: b.city,
      rating: b.rating, reviews: b.reviews,
      priceFrom: b.priceFrom, currency: b.currency,
      distance: b.distance, distanceKm: b.distanceKm,
      photo: b.photo,
      status: b.status, closesAt: b.closesAt,
      availableToday: b.availableToday, nextSlot: b.nextSlot,
      blurb: b.blurb,
      locationCount: LOCATION_COUNT[id] || 1,
      savedDaysAgo, savedLabel,
      availSoon: soonMinutes(b),
    };
  };

  // A specific venue. References a parent business (bizId) but carries its
  // own venue name + street address — the thing you'd save when you book at
  // one particular branch.
  const location = (o) => {
    const b = biz(o.bizId);
    return {
      key: 'l-' + o.bizId + '-' + o.slug,
      type: 'location',
      bizId: o.bizId,
      brand: b.name,
      cat: o.cat || b.cat, catLabel: o.catLabel || b.catLabel,
      venue: o.venue,            // e.g. "Mayfair · Studio 2"
      address: o.address,        // street line
      rating: o.rating ?? b.rating, reviews: o.reviews ?? b.reviews,
      distance: o.distance, distanceKm: o.distanceKm,
      photo: o.photo || b.photo,
      availableToday: o.availableToday ?? false,
      nextSlot: o.nextSlot || null,
      savedDaysAgo: o.savedDaysAgo, savedLabel: o.savedLabel,
      availSoon: o.availableToday ? (o.availSoon ?? 120) : 99999,
    };
  };

  const person = (o) => ({
    key: 'u-' + o.slug,
    type: 'person',
    name: o.name,
    role: o.role,
    business: o.business,
    cat: o.cat, catLabel: o.catLabel,
    avatar: o.avatar,        // portrait
    photo: o.photo,          // their work / chair photo (banner)
    rating: o.rating, reviews: o.reviews,
    distance: o.distance, distanceKm: o.distanceKm,
    availableToday: o.availableToday ?? false,
    nextSlot: o.nextSlot || null,
    savedDaysAgo: o.savedDaysAgo, savedLabel: o.savedLabel,
    availSoon: o.availableToday ? (o.availSoon ?? 90) : 99999,
  });

  const SAVED = [
    // ── recent ──────────────────────────────────────────────
    person({
      slug: 'mara', name: 'Mara Voinescu', role: 'Senior stylist',
      business: 'Glow Studio', cat: 'hair', catLabel: 'Hair · Color',
      avatar: 'https://i.pravatar.cc/240?img=47',
      photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80',
      rating: 4.9, reviews: 124, distance: '0.4 mi', distanceKm: 0.6,
      availableToday: true, availSoon: 95, nextSlot: 'Today · 3:30 PM',
      savedDaysAgo: 0, savedLabel: 'Today',
    }),
    place('glow-soho', 1, 'Yesterday'),
    location({
      bizId: 'sage-massage', slug: 'mayfair', cat: 'massage', catLabel: 'Massage · Spa',
      venue: 'Mayfair · Studio 2', address: '14 Mount Street, W1K',
      rating: 4.8, reviews: 124, distance: '0.6 mi', distanceKm: 1.0,
      photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80',
      availableToday: false, nextSlot: 'Tomorrow · 11:30 AM',
      savedDaysAgo: 2, savedLabel: '2 days ago',
    }),

    // ── this week ───────────────────────────────────────────
    place('noor-hair', 4, '4 days ago'),
    person({
      slug: 'andrei', name: 'Andrei Pop', role: 'Master barber',
      business: 'Maison Noir', cat: 'hair', catLabel: 'Barber',
      avatar: 'https://i.pravatar.cc/240?img=12',
      photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80',
      rating: 4.9, reviews: 184, distance: '0.9 mi', distanceKm: 1.4,
      availableToday: true, availSoon: 240, nextSlot: 'Today · 4:15 PM',
      savedDaysAgo: 5, savedLabel: '5 days ago',
    }),
    place('paws-soho', 6, '6 days ago'),

    // ── earlier ─────────────────────────────────────────────
    location({
      bizId: 'glow-soho', slug: 'soho', cat: 'hair', catLabel: 'Hair · Color',
      venue: 'Soho · Ground floor', address: '22 Berwick Street, W1F',
      rating: 4.9, reviews: 312, distance: '0.4 mi', distanceKm: 0.6,
      photo: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=900&q=80',
      availableToday: true, availSoon: 150, nextSlot: 'Today · 6:00 PM',
      savedDaysAgo: 12, savedLabel: '2 weeks ago',
    }),
    place('merid-dent', 16, '2 weeks ago'),
    person({
      slug: 'sophie', name: 'Sophie Reyes', role: 'Esthetician',
      business: 'Orris Skin', cat: 'skin', catLabel: 'Skin & Face',
      avatar: 'https://i.pravatar.cc/240?img=49',
      photo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80',
      rating: 4.8, reviews: 142, distance: '1.2 mi', distanceKm: 1.9,
      availableToday: false, nextSlot: 'Fri · 6:30 PM',
      savedDaysAgo: 22, savedLabel: '3 weeks ago',
    }),
    place('helix-fit', 28, '4 weeks ago'),
    location({
      bizId: 'forma-brow', slug: 'covent', cat: 'brow', catLabel: 'Brow & Lash',
      venue: 'Covent Garden', address: '7 Earlham Street, WC2H',
      rating: 4.7, reviews: 86, distance: '1.1 mi', distanceKm: 1.1,
      photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80',
      availableToday: true, availSoon: 320, nextSlot: 'Today · 5:45 PM',
      savedDaysAgo: 35, savedLabel: '5 weeks ago',
    }),
    place('kept-soho', 44, '6 weeks ago'),
  ];

  window.ZV_SAVED = SAVED;

  // Sort comparators keyed by the page's sort menu.
  window.ZV_SAVED_SORTS = {
    recent:    (a, b) => a.savedDaysAgo - b.savedDaysAgo,
    nearby:    (a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99),
    rating:    (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    available: (a, b) => (a.availSoon ?? 99999) - (b.availSoon ?? 99999),
  };
})();
