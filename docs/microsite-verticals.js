// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — VERTICAL PRESETS.
// One engine, many industries. Each vertical supplies the same
// shape (business + locations + per-location menu) plus a `labels`
// layer (nouns/verbs) and a `vibe` (accent + font) so nothing is
// hard-coded to salons. window.MC_applyVertical(key) swaps the live
// globals; the app remounts to re-scope everything.
// ─────────────────────────────────────────────────────────────

window.MC_SLOTS_DEFAULT = ['Today · 3:30 PM', 'Today · 5:15 PM', 'Tomorrow · 10:30 AM', 'Tomorrow · 2:00 PM', 'Thu · 9:00 AM'];

// Section list shared by all verticals (the dashboard "Page sections")
function mcSections() {
  return [
    { id: 'announcement', type: 'announcement', label: 'Announcement', variant: 'Bar',       visible: false },
    { id: 'hero',         type: 'hero',         label: 'Hero',         variant: 'Cinematic', visible: true },
    { id: 'about',        type: 'about',        label: 'About',        variant: 'Editorial', visible: true },
    { id: 'locations',    type: 'locations',    label: 'Locations',    variant: 'Cards',     visible: true },
    { id: 'gallery',      type: 'gallery',      label: 'Gallery',      variant: 'Lookbook',  visible: true },
    { id: 'team',         type: 'team',         label: 'Team',         variant: 'Portraits', visible: true },
    { id: 'reviews',      type: 'reviews',      label: 'Reviews',      variant: 'Quotes',    visible: true },
    { id: 'faq',          type: 'faq',          label: 'FAQ',          variant: 'Accordion', visible: true },
  ];
}

window.MC_VERTICALS = {

  // ─────────────────────── HAIR SALON ───────────────────────
  salon: {
    label: 'Hair salon',
    vibe: { accent: '#C2552F', font: 'elegant' },
    business: {
      id: 'glow', name: 'Glow Studio', slug: 'glow-studio', currency: '£', established: 2014,
      tagline: 'Lived-in colour & precision cuts, across London.',
      cover: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=2000&q=80',
      logo: null, social: { instagram: 'glowstudio', tiktok: 'glowstudio', facebook: 'glowstudiolondon', x: 'glowstudio', youtube: 'glowstudio', pinterest: 'glowstudio', web: 'glowstudio.co' }, email: 'hello@glowstudio.co',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Stylists', teamLine: 'Hands at', book: 'Book', services: 'Services', kind: 'salon' },
      marquee: ['Lived-in colour', 'Balayage', 'Precision cuts', 'Curl care', 'Gloss & tone', 'Brow & lash'],
      about: {
        lede: 'A small group of light-filled studios making colour that grows out beautifully — and cuts you’ll still love in week six.',
        body: 'Since 2014 we’ve built Glow around one idea: unhurried, lived-in hair. Every chair gets a real consultation, every colour is mixed for your regrowth, not just the reveal. Four rooms across London, one devoted team, no conveyor belt.',
        stats: [{ n: 4, label: 'Studios in London' }, { n: 28, label: 'Stylists & colourists' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2014, label: 'Established', raw: true }],
      },
      gallery: [
        { src: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1400&q=80', cap: 'The colour bar' },
        { src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&q=80', cap: 'Wash & finish' },
        { src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1400&q=80', cap: 'Soho floor' },
        { src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1400&q=80', cap: 'Shelf' },
        { src: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1400&q=80', cap: 'The studio' },
        { src: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1400&q=80', cap: 'Lived-in colour' },
        { src: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1400&q=80', cap: 'At the basin' },
        { src: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1400&q=80', cap: 'Gloss & tone' },
        { src: 'https://images.unsplash.com/photo-1633681926035-ec1ac984418a?w=1400&q=80', cap: 'Foils' },
        { src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&q=80', cap: 'Backwash' },
        { src: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=1400&q=80', cap: 'The cut' },
        { src: 'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=1400&q=80', cap: 'Reception' },
      ],
      interludes: [
        { src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=2000&q=80', kicker: 'The craft', line: 'We paint for the grow-out, not the reveal.' },
        { src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=2000&q=80', kicker: 'The chair', line: 'Never rushed. Never a conveyor belt.' },
      ],
      faq: [
        { q: 'Do you offer free consultations?', a: 'Yes — every colour appointment begins with a consultation, and you can book a standalone 15-minute consult any time, free of charge.' },
        { q: 'How far in advance should I book?', a: 'Cuts are usually available within a few days. For balayage and colour correction with a senior colourist, we’d suggest two to three weeks.' },
        { q: 'What’s your cancellation policy?', a: 'Free cancellation up to 24 hours before your appointment. Inside 24 hours a 50% fee applies, charged through Zavoia.' },
        { q: 'Can I request a specific stylist?', a: 'Always. Pick your stylist when you book, or let us match you — every Glow stylist is trained in our lived-in colour method.' },
      ],
      announcement: { text: 'Autumn colour openings now live — book before October for 2025 pricing.', cta: 'Book now' },
    },
    menu: {
      'glow-soho': [
        { cat: 'Colour', items: [
          { id: 'so-balayage', name: 'Balayage', desc: 'Hand-painted, custom blend.', dur: 150, price: 145 },
          { id: 'so-global', name: 'Global colour', desc: 'Single-process, root to tip.', dur: 90, price: 78 },
          { id: 'so-gloss', name: 'Gloss & tone', desc: 'Adds shine, kills brass.', dur: 30, price: 28 },
          { id: 'so-root', name: 'Root touch-up', desc: 'Regrowth colour, up to 2cm.', dur: 60, price: 55 } ]},
        { cat: 'Hair', items: [
          { id: 'so-cut', name: "Women's cut & finish", desc: 'Consultation, wash, cut, style.', dur: 60, price: 42 },
          { id: 'so-mens', name: "Men's cut", desc: 'Wash, scissor or clipper cut.', dur: 30, price: 26 },
          { id: 'so-blow', name: 'Wash & blowdry', desc: '', dur: 45, price: 30 } ]},
        { cat: 'Treatments', items: [
          { id: 'so-olaplex', name: 'Olaplex treatment', desc: 'Bond-building, add to any colour.', dur: 20, price: 22 },
          { id: 'so-curl', name: 'Curl care ritual', desc: 'Cut, hydrate & define for curls.', dur: 75, price: 64 } ]},
        { cat: 'Packages', items: [
          { id: 'so-signature', name: 'Signature colour day', desc: 'Balayage, bond treatment, cut & finish.', dur: 275, price: 205, isBundle: true, includes: ['Balayage', 'Olaplex treatment', "Women's cut & finish"] } ]},
      ],
      'glow-shoreditch': [
        { cat: 'Colour', items: [
          { id: 'sh-balayage', name: 'Balayage', desc: 'Hand-painted, custom blend.', dur: 150, price: 135 },
          { id: 'sh-global', name: 'Global colour', desc: 'Single-process, root to tip.', dur: 90, price: 72 },
          { id: 'sh-creative', name: 'Creative colour', desc: 'Fashion shades & vivids.', dur: 180, price: 165 } ]},
        { cat: 'Hair', items: [
          { id: 'sh-cut', name: "Women's cut & finish", desc: 'Consultation, wash, cut, style.', dur: 60, price: 38 },
          { id: 'sh-mens', name: "Men's cut & fade", desc: 'Skin fades a speciality.', dur: 40, price: 32 },
          { id: 'sh-blow', name: 'Wash & blowdry', desc: '', dur: 45, price: 28 } ]},
      ],
      'glow-marylebone': [
        { cat: 'Colour', items: [
          { id: 'ma-balayage', name: 'Balayage', desc: 'Hand-painted, custom blend.', dur: 160, price: 158 },
          { id: 'ma-correction', name: 'Colour correction', desc: 'By consultation. Priced from.', dur: 240, price: 290 } ]},
        { cat: 'Hair', items: [
          { id: 'ma-cut', name: "Women's cut & finish", desc: 'Consultation, wash, cut, style.', dur: 60, price: 52 },
          { id: 'ma-bridal', name: 'Bridal trial', desc: 'Colour + style trial run.', dur: 90, price: 95 } ]},
        { cat: 'Treatments', items: [
          { id: 'ma-keratin', name: 'Keratin smoothing', desc: 'Frizz-free for up to 12 weeks.', dur: 150, price: 180 } ]},
      ],
    },
    locations: [
      { id: 'glow-soho', name: 'Soho', area: 'Soho, London', address: '14 Greek Street', postcode: 'London W1D 4DJ', phone: '+44 20 7946 0991', station: 'Tottenham Court Road · 4 min', rating: 4.9, reviewCount: 312, flagship: true,
        photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80', blurb: 'Our flagship off Soho Square — colour-led, plant-strewn, six chairs.',
        amenities: [{ icon: 'wheelchair', label: 'Step-free access' }, { icon: 'globe', label: 'Free Wi-Fi' }, { icon: 'sparkle', label: 'Complimentary drinks' }, { icon: 'wallet', label: 'Card & contactless' }, { icon: 'cal', label: 'Walk-ins welcome' }],
        hours: [{ d: 'Mon–Wed', h: '9:00 – 19:00' }, { d: 'Thu–Fri', h: '9:00 – 20:00' }, { d: 'Saturday', h: '10:00 – 18:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'mara', name: 'Mara Voinescu', role: 'Senior Colourist', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', rating: 4.9, reviews: 127, specialty: 'Balayage & colour correction', does: ['so-balayage','so-global','so-gloss','so-root'], rates: { 'so-balayage': { price: 165, dur: 165 }, 'so-global': { price: 88 } } },
          { id: 'iulia', name: 'Iulia Stan', role: 'Stylist · Cuts', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', rating: 4.9, reviews: 41, specialty: 'Curl care & precision cuts', does: ['so-cut','so-blow','so-curl'] },
          { id: 'andrei', name: 'Andrei Pop', role: 'Master Barber', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', rating: 4.8, reviews: 62, specialty: 'Classic & scissor cuts', does: ['so-mens','so-blow'] },
          { id: 'sofia', name: 'Sofia Petrescu', role: 'Colour & Treatments', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80', rating: 4.8, reviews: 38, specialty: 'Gloss & bond-building', does: ['so-gloss','so-olaplex','so-root'] },
        ],
        reviews: [
          { id: 1, name: 'Elena R.', stars: 5, date: '2 days ago', verified: true, text: 'Mara absolutely nailed the balayage — exactly the dimension I asked for and zero brassiness. They offered me an espresso the moment I walked in.' },
          { id: 2, name: 'David T.', stars: 5, date: '1 week ago', verified: true, text: 'Best men’s cut in Soho, full stop. Andrei takes the time to talk through what works with how my hair grows.' },
          { id: 3, name: 'Marco L.', stars: 5, date: '3 weeks ago', verified: true, text: 'Iulia is a magician with curly hair. Felt seen and listened to. Pricing was clear up front.' },
        ] },
      { id: 'glow-shoreditch', name: 'Shoreditch', area: 'Shoreditch, London', address: '8 Redchurch Street', postcode: 'London E2 7DD', phone: '+44 20 7946 0992', station: 'Shoreditch High St · 3 min', rating: 4.8, reviewCount: 188,
        photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80', blurb: 'Our East studio — creative colour, fades, and a record player.',
        amenities: [{ icon: 'globe', label: 'Free Wi-Fi' }, { icon: 'sparkle', label: 'Coffee & vinyl' }, { icon: 'wallet', label: 'Card only' }, { icon: 'cal', label: 'Walk-ins welcome' }],
        hours: [{ d: 'Mon–Wed', h: '10:00 – 19:00' }, { d: 'Thu–Fri', h: '10:00 – 20:00' }, { d: 'Saturday', h: '9:00 – 18:00' }, { d: 'Sunday', h: '11:00 – 17:00' }],
        team: [
          { id: 'jay', name: 'Jay Okafor', role: 'Creative Colourist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', rating: 4.9, reviews: 73, specialty: 'Vivids & fashion shades', does: ['sh-creative','sh-balayage'] },
          { id: 'nadia', name: 'Nadia Haddad', role: 'Senior Stylist', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', rating: 4.8, reviews: 54, specialty: 'Lived-in colour & cuts', does: ['sh-global','sh-cut','sh-blow'] },
          { id: 'theo', name: 'Theo Marsh', role: 'Barber', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80', rating: 4.7, reviews: 31, specialty: 'Skin fades', does: ['sh-mens','sh-blow'] },
        ],
        reviews: [
          { id: 1, name: 'Priya K.', stars: 5, date: '4 days ago', verified: true, text: 'Jay took my box-dye disaster to the softest copper. Genuinely the most fun salon visit I’ve had.' },
          { id: 2, name: 'Sam W.', stars: 5, date: '2 weeks ago', verified: true, text: 'Cleanest skin fade in East London and a great playlist. Booked my next three already.' },
        ] },
      { id: 'glow-marylebone', name: 'Marylebone', area: 'Marylebone, London', address: '46 Marylebone Lane', postcode: 'London W1U 2NT', phone: '+44 20 7946 0993', station: 'Bond Street · 6 min', rating: 4.9, reviewCount: 96,
        photo: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1200&q=80', blurb: 'Our quietest room — bridal, correction and keratin by appointment.',
        amenities: [{ icon: 'wheelchair', label: 'Step-free access' }, { icon: 'cal', label: 'By appointment' }, { icon: 'sparkle', label: 'Bridal suite' }, { icon: 'globe', label: 'Free Wi-Fi' }, { icon: 'wallet', label: 'Card & contactless' }],
        hours: [{ d: 'Tue–Wed', h: '9:30 – 18:30' }, { d: 'Thu–Fri', h: '9:30 – 20:00' }, { d: 'Saturday', h: '9:00 – 17:00' }, { d: 'Sun–Mon', h: 'Closed' }],
        team: [
          { id: 'claudia', name: 'Claudia Fenn', role: 'Colour Director', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', rating: 5.0, reviews: 58, specialty: 'Correction & bridal', does: ['ma-correction','ma-balayage'] },
          { id: 'rosa', name: 'Rosa Iqbal', role: 'Senior Stylist', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', rating: 4.9, reviews: 38, specialty: 'Cuts & keratin', does: ['ma-cut','ma-keratin','ma-bridal'] },
        ],
        reviews: [
          { id: 1, name: 'Sara H.', stars: 5, date: '1 week ago', verified: true, text: 'Claudia did my bridal colour and trial. Felt completely looked after and the photos came out stunning.' },
          { id: 2, name: 'Aisha N.', stars: 5, date: '3 weeks ago', verified: true, text: 'Worth every mile of the commute — Rosa just gets fine hair. The keratin lasted the full twelve weeks.' },
        ] },
    ],
  },

  // ─────────────────────── DAY SPA ───────────────────────
  spa: {
    label: 'Day spa',
    vibe: { accent: '#5E7261', font: 'classic' },
    business: {
      id: 'lumen', name: 'Lumen & Stone', slug: 'lumen-stone', currency: '£', established: 2017,
      tagline: 'Slow rituals for skin and mind, in the middle of the city.',
      cover: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=2000&q=80',
      logo: null, social: { instagram: 'lumenandstone', facebook: 'lumenandstone', pinterest: 'lumenandstone', web: 'lumenandstone.co' }, email: 'hello@lumenandstone.co',
      labels: { place: 'spa', placePlural: 'spas', teamPlural: 'Therapists', teamLine: 'Therapists at', book: 'Reserve', services: 'Treatments', kind: 'spa' },
      marquee: ['Deep-tissue', 'Hot stone', 'Signature facials', 'Couples rituals', 'Sauna & steam', 'Aromatherapy'],
      about: {
        lede: 'Two calm rooms built around one promise: you leave lighter than you arrived.',
        body: 'We opened Lumen & Stone in 2017 for people who needed somewhere to actually slow down. Every ritual starts with quiet, a foot soak and a breath; our therapists tailor pressure and oils to your week, not a script. Phones away, candles lit, nowhere to be.',
        stats: [{ n: 2, label: 'City sanctuaries' }, { n: 14, label: 'Trained therapists' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2017, label: 'Established', raw: true }],
      },
      gallery: [
        { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=80', cap: 'The relaxation room' },
        { src: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1400&q=80', cap: 'Stones & oils' },
        { src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1400&q=80', cap: 'Deep-tissue' },
        { src: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1400&q=80', cap: 'Linen & steam' },
        { src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1400&q=80', cap: 'Signature facial' },
      ],
      interludes: [
        { src: 'https://images.unsplash.com/photo-1532926381893-7542290edf1d?w=2000&q=80', kicker: 'The ritual', line: 'It begins with quiet, a foot soak, a breath.' },
        { src: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=2000&q=80', kicker: 'The hands', line: 'Pressure tuned to your week, not a script.' },
      ],
      faq: [
        { q: 'What should I arrive with?', a: 'Just yourself — arrive 15 minutes early to settle in. Robes, slippers, lockers and tea are all provided.' },
        { q: 'Can I book for two?', a: 'Yes. Our couples room takes two therapists side by side — choose the Couples ritual and pick your time together.' },
        { q: 'Do you tailor pressure?', a: 'Always. Your therapist checks in before and during every treatment, and adjusts oils and pressure to how you’re feeling that day.' },
        { q: 'What’s your cancellation policy?', a: 'Free up to 24 hours before. Inside 24 hours a 50% fee applies, charged through Zavoia.' },
      ],
      announcement: { text: 'Winter warmth: hot-stone rituals now 20% longer through February.', cta: 'Reserve' },
    },
    menu: {
      'lumen-marylebone': [
        { cat: 'Massage', items: [
          { id: 'lm-deep', name: 'Deep-tissue massage', desc: 'Firm pressure, targeted release.', dur: 60, price: 95 },
          { id: 'lm-stone', name: 'Hot stone ritual', desc: 'Warm basalt, full body.', dur: 90, price: 130 },
          { id: 'lm-couples', name: 'Couples ritual', desc: 'Side by side, two therapists.', dur: 90, price: 250 } ]},
        { cat: 'Skin', items: [
          { id: 'lm-facial', name: 'Signature facial', desc: 'Cleanse, mask, lymphatic massage.', dur: 60, price: 110 },
          { id: 'lm-glow', name: 'The Glow facial', desc: 'Brightening, event-ready.', dur: 75, price: 140 } ]},
        { cat: 'Body', items: [
          { id: 'lm-scrub', name: 'Salt & oil scrub', desc: 'Exfoliate, hydrate, wrap.', dur: 45, price: 85 } ]},
        { cat: 'Packages', items: [
          { id: 'lm-retreat', name: 'Half-day retreat', desc: 'Massage, facial & a sauna circuit.', dur: 210, price: 280, isBundle: true, includes: ['Hot stone ritual', 'Signature facial', 'Salt & oil scrub'] } ]},
      ],
      'lumen-richmond': [
        { cat: 'Massage', items: [
          { id: 'lr-deep', name: 'Deep-tissue massage', desc: 'Firm pressure, targeted release.', dur: 60, price: 88 },
          { id: 'lr-aroma', name: 'Aromatherapy massage', desc: 'Calming blend, light pressure.', dur: 60, price: 92 },
          { id: 'lr-stone', name: 'Hot stone ritual', desc: 'Warm basalt, full body.', dur: 90, price: 120 } ]},
        { cat: 'Skin', items: [
          { id: 'lr-facial', name: 'Signature facial', desc: 'Cleanse, mask, lymphatic massage.', dur: 60, price: 100 } ]},
        { cat: 'Body', items: [
          { id: 'lr-sauna', name: 'Sauna & steam circuit', desc: 'Two hours, robe & tea.', dur: 120, price: 60 } ]},
      ],
    },
    locations: [
      { id: 'lumen-marylebone', name: 'Marylebone', area: 'Marylebone, London', address: '9 Chiltern Street', postcode: 'London W1U 7PE', phone: '+44 20 7946 0210', station: 'Baker Street · 5 min', rating: 4.9, reviewCount: 204, flagship: true,
        photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80', blurb: 'Our flagship sanctuary — five treatment rooms, sauna and steam.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 21:00' }, { d: 'Saturday', h: '9:00 – 20:00' }, { d: 'Sunday', h: '10:00 – 18:00' }],
        team: [
          { id: 'noor', name: 'Noor Rahman', role: 'Lead Therapist', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80', rating: 5.0, reviews: 96, specialty: 'Deep-tissue & hot stone', does: ['lm-deep','lm-stone','lm-couples'], rates: { 'lm-deep': { price: 110, dur: 75 }, 'lm-stone': { price: 150, dur: 100 } } },
          { id: 'esme', name: 'Esme Clarke', role: 'Facialist', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', rating: 4.9, reviews: 71, specialty: 'Skin & lymphatic facials', does: ['lm-facial','lm-glow'] },
          { id: 'priya', name: 'Priya Nair', role: 'Body Therapist', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', rating: 4.8, reviews: 44, specialty: 'Scrubs & wraps', does: ['lm-scrub','lm-stone'] },
        ],
        reviews: [
          { id: 1, name: 'Hannah B.', stars: 5, date: '3 days ago', verified: true, text: 'Noor found every knot I’d been carrying for a month. I floated out. The foot soak and tea ritual to start is everything.' },
          { id: 2, name: 'Olu A.', stars: 5, date: '2 weeks ago', verified: true, text: 'Booked the couples ritual for our anniversary — calm, private and genuinely restorative. Already rebooked.' },
        ] },
      { id: 'lumen-richmond', name: 'Richmond', area: 'Richmond, London', address: '22 Hill Rise', postcode: 'London TW10 6UA', phone: '+44 20 7946 0211', station: 'Richmond · 7 min', rating: 4.8, reviewCount: 118,
        photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80', blurb: 'Riverside rooms with a sauna and steam circuit overlooking the hill.',
        hours: [{ d: 'Tue–Fri', h: '9:00 – 20:00' }, { d: 'Saturday', h: '9:00 – 19:00' }, { d: 'Sun–Mon', h: '10:00 – 17:00' }],
        team: [
          { id: 'marek', name: 'Marek Nowak', role: 'Senior Therapist', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', rating: 4.9, reviews: 62, specialty: 'Deep-tissue & sport', does: ['lr-deep','lr-stone'] },
          { id: 'sana', name: 'Sana Iqbal', role: 'Aromatherapist', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', rating: 4.8, reviews: 49, specialty: 'Aromatherapy & facials', does: ['lr-aroma','lr-facial'] },
        ],
        reviews: [
          { id: 1, name: 'Grace L.', stars: 5, date: '5 days ago', verified: true, text: 'The sauna circuit before a massage is the perfect Sunday. Marek’s pressure was spot on without me having to ask twice.' },
          { id: 2, name: 'Tom R.', stars: 4, date: '3 weeks ago', verified: true, text: 'Lovely aromatherapy session with Sana. Ran a few minutes over the slot, which I didn’t mind at all.' },
        ] },
    ],
  },

  // ─────────────────────── AUTO STUDIO ───────────────────────
  auto: {
    label: 'Auto studio',
    vibe: { accent: '#2F6E8F', font: 'modern' },
    business: {
      id: 'apex', name: 'Apex Auto Studio', slug: 'apex-auto', currency: '£', established: 2011,
      tagline: 'Detailing, ceramic & paint correction for cars worth keeping.',
      cover: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=2000&q=80',
      logo: null, social: { instagram: 'apexautostudio', youtube: 'apexautostudio', tiktok: 'apexauto', facebook: 'apexautostudio', web: 'apexauto.co' }, email: 'studio@apexauto.co',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Specialists', teamLine: 'Specialists at', book: 'Get a quote', services: 'Services', kind: 'auto' },
      marquee: ['Paint correction', 'Ceramic coating', 'Full details', 'Interior restore', 'Paint protection film', 'Ceramic glass'],
      about: {
        lede: 'A workshop for owners who treat their car like an investment, not an appliance.',
        body: 'Apex started in a single railway arch in 2011, correcting paint other shops wouldn’t touch. Today we run two climate-controlled studios with dedicated coating rooms and a no-rush booking model — one car per bay, per day. Every job is photographed, paint-depth logged and warrantied.',
        stats: [{ n: 2, label: 'Climate-controlled studios' }, { n: 9, label: 'Detailers & coaters' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2011, label: 'Established', raw: true }],
      },
      gallery: [
        { src: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1400&q=80', cap: 'Final inspection' },
        { src: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1400&q=80', cap: 'Paint correction' },
        { src: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1400&q=80', cap: 'Wheels off' },
        { src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1400&q=80', cap: 'The studio' },
        { src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=80', cap: 'Coated & cured' },
        { src: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1400&q=80', cap: 'Interior restore' },
        { src: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1400&q=80', cap: 'The arch' },
        { src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=80', cap: 'Buffed' },
        { src: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1400&q=80', cap: 'Ceramic coat' },
      ],
      interludes: [
        { src: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=2000&q=80', kicker: 'The process', line: 'Measured, corrected, protected — then proven.' },
        { src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=2000&q=80', kicker: 'The bay', line: 'One car per bay, per day. No rush jobs.' },
      ],
      faq: [
        { q: 'How long does a ceramic coating take?', a: 'A full correction and coating is a one to two day job depending on paint condition. We give you a firm timeline after the inspection.' },
        { q: 'Do you offer a warranty?', a: 'Yes — our ceramic coatings carry a documented multi-year warranty, with paint-depth readings logged before and after.' },
        { q: 'Can you collect my car?', a: 'We offer collection and delivery within the M25 for full details and coatings. Add it when you request your quote.' },
        { q: 'How do quotes work?', a: 'Tell us the vehicle and the service; we confirm a fixed price after a quick inspection. No surprises on collection.' },
      ],
      announcement: { text: 'Winter PPF slots filling fast — protect your paint before the salt season.', cta: 'Get a quote' },
    },
    menu: {
      'apex-vauxhall': [
        { cat: 'Detailing', items: [
          { id: 'av-full', name: 'Full detail', desc: 'Decontaminate, polish, protect.', dur: 360, price: 295 },
          { id: 'av-maint', name: 'Maintenance wash', desc: 'Safe wash & quick protect.', dur: 90, price: 75 },
          { id: 'av-interior', name: 'Interior restore', desc: 'Deep clean, leather, fabric.', dur: 180, price: 165 } ]},
        { cat: 'Correction', items: [
          { id: 'av-1step', name: 'One-step correction', desc: 'Gloss-up, light swirl removal.', dur: 300, price: 320 },
          { id: 'av-2step', name: 'Two-step correction', desc: 'Heavy defect removal.', dur: 600, price: 580 } ]},
        { cat: 'Protection', items: [
          { id: 'av-ceramic', name: 'Ceramic coating', desc: '5-year coating, warrantied.', dur: 720, price: 850 },
          { id: 'av-ppf', name: 'Paint protection film', desc: 'Front-end PPF, self-healing.', dur: 720, price: 1200 } ]},
        { cat: 'Packages', items: [
          { id: 'av-protect', name: 'Full protection package', desc: 'Correction, ceramic coat & front PPF.', dur: 1440, price: 1900, isBundle: true, includes: ['Two-step correction', 'Ceramic coating', 'Paint protection film'] } ]},
      ],
      'apex-parkroyal': [
        { cat: 'Detailing', items: [
          { id: 'ap-full', name: 'Full detail', desc: 'Decontaminate, polish, protect.', dur: 360, price: 275 },
          { id: 'ap-maint', name: 'Maintenance wash', desc: 'Safe wash & quick protect.', dur: 90, price: 70 } ]},
        { cat: 'Correction', items: [
          { id: 'ap-1step', name: 'One-step correction', desc: 'Gloss-up, light swirl removal.', dur: 300, price: 300 } ]},
        { cat: 'Protection', items: [
          { id: 'ap-ceramic', name: 'Ceramic coating', desc: '3-year coating, warrantied.', dur: 600, price: 650 },
          { id: 'ap-glass', name: 'Ceramic glass coat', desc: 'Hydrophobic windscreen.', dur: 60, price: 90 } ]},
      ],
    },
    locations: [
      { id: 'apex-vauxhall', name: 'Vauxhall', area: 'Vauxhall, London', address: 'Arch 42, Miles Street', postcode: 'London SW8 1RZ', phone: '+44 20 7946 0440', station: 'Vauxhall · 6 min', rating: 4.9, reviewCount: 241, flagship: true,
        photo: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80', blurb: 'Our flagship arches — four bays, dedicated coating room.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 18:00' }, { d: 'Saturday', h: '9:00 – 16:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'dan', name: 'Dan Whitfield', role: 'Lead Detailer', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', rating: 5.0, reviews: 132, specialty: 'Paint correction & ceramic', does: ['av-2step','av-1step','av-ceramic'], rates: { 'av-2step': { price: 680, dur: 720 }, 'av-ceramic': { price: 980, dur: 840 } } },
          { id: 'kasia', name: 'Kasia Lewandowska', role: 'Coating Specialist', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', rating: 4.9, reviews: 78, specialty: 'Ceramic & PPF', does: ['av-ceramic','av-ppf'] },
          { id: 'reece', name: 'Reece Adeyemi', role: 'Detailer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', rating: 4.8, reviews: 53, specialty: 'Details & interiors', does: ['av-full','av-maint','av-interior'] },
        ],
        reviews: [
          { id: 1, name: 'James P.', stars: 5, date: '6 days ago', verified: true, text: 'Dan took three years of swirls out of black paint and coated it — looks better than the showroom. Photo log before and after was a nice touch.' },
          { id: 2, name: 'Yusuf K.', stars: 5, date: '2 weeks ago', verified: true, text: 'Booked PPF on the front end before a road trip. Flawless install, no orange peel, and they collected the car. Worth every penny.' },
        ] },
      { id: 'apex-parkroyal', name: 'Park Royal', area: 'Park Royal, London', address: 'Unit 7, Abbey Road', postcode: 'London NW10 7XF', phone: '+44 20 7946 0441', station: 'Park Royal · 8 min', rating: 4.8, reviewCount: 134,
        photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80', blurb: 'Our West studio — quick-turn details and maintenance plans.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 18:00' }, { d: 'Saturday', h: '8:00 – 15:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'omar', name: 'Omar Haddad', role: 'Studio Lead', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80', rating: 4.9, reviews: 64, specialty: 'Correction & coating', does: ['ap-1step','ap-ceramic','ap-glass'] },
          { id: 'lottie', name: 'Lottie Grant', role: 'Detailer', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80', rating: 4.8, reviews: 37, specialty: 'Details & maintenance', does: ['ap-full','ap-maint'] },
        ],
        reviews: [
          { id: 1, name: 'Priit M.', stars: 5, date: '1 week ago', verified: true, text: 'Maintenance plan keeps my daily spotless. In and out in 90 minutes, and the glass coat means I barely use the wipers.' },
          { id: 2, name: 'Sophie D.', stars: 5, date: '4 weeks ago', verified: true, text: 'Omar corrected and coated my partner’s car as a surprise. Communication was brilliant throughout.' },
        ] },
    ],
  },

  barber: {
    label: 'Barbershop',
    vibe: { accent: '#7A5230', font: 'classic' },
    business: {
      id: 'sharps', name: 'Sharps Barbershop', slug: 'sharps-barbershop', currency: '£', established: 2016,
      tagline: 'Proper cuts, hot-towel shaves and good conversation.',
      cover: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=2000&q=80',
      logo: null, social: { instagram: 'sharpsbarbers', tiktok: 'sharpsbarbers', facebook: 'sharpsbarbers', web: 'sharps.co' }, email: 'hello@sharps.co',
      labels: { place: 'shop', placePlural: 'shops', teamPlural: 'Barbers', teamLine: 'Barbers at', book: 'Book', services: 'Services', kind: 'barber' },
      marquee: ['Skin fades', 'Scissor cuts', 'Hot-towel shave', 'Beard sculpt', 'Kids’ cuts', 'Grey blending'],
      about: {
        lede: 'A proper neighbourhood barbershop — no fuss, just a good chair and a sharp finish.',
        body: 'We opened Sharps in 2016 on a corner off Arnold Circus with three chairs and a simple idea: take your time, get it right. Every cut starts with a chat about how your hair actually grows, and ends with a hot towel. Walk-ins welcome when there’s a chair free.',
        stats: [{ n: 1, label: 'Shop in Shoreditch' }, { n: 5, label: 'Barbers' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2016, label: 'Established', raw: true }],
      },
      gallery: [
        { src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1400&q=80', cap: 'The chair' },
        { src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1400&q=80', cap: 'Skin fade' },
        { src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1400&q=80', cap: 'The shop' },
        { src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1400&q=80', cap: 'Finish' },
        { src: 'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=1400&q=80', cap: 'Beard work' },
        { src: 'https://images.unsplash.com/photo-1521490878406-4f49b0b8e2f5?w=1400&q=80', cap: 'Hot towel' },
        { src: 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=1400&q=80', cap: 'Clipper work' },
        { src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1400&q=80', cap: 'The cut' },
        { src: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=1400&q=80', cap: 'Scissor over comb' },
        { src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1400&q=80', cap: 'Line up' },
        { src: 'https://images.unsplash.com/photo-1635273051839-003bf06a8751?w=1400&q=80', cap: 'The window seat' },
        { src: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=1400&q=80', cap: 'Tools of the trade' },
        { src: 'https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?w=1400&q=80', cap: 'Finishing touch' },
        { src: 'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=1400&q=80', cap: 'On the corner' },
      ],
      interludes: [
        { src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=2000&q=80', kicker: 'The craft', line: 'Sharp lines, soft finish — no two heads the same.' },
        { src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=2000&q=80', kicker: 'The room', line: 'Three chairs, a good playlist, and a hot towel waiting.' },
      ],
      faq: [
        { q: 'Do you take walk-ins?', a: 'When there’s a free chair, yes — but booking guarantees your barber and time, especially on weekends.' },
        { q: 'Can I always get the same barber?', a: 'Pick your barber when you book, or let us match you. We keep notes so any of us can pick up where the last cut left off.' },
        { q: 'Do you cut kids’ hair?', a: 'We do — kids’ cuts are on the menu, and we’re patient with first-timers.' },
        { q: 'What’s your cancellation policy?', a: 'Free cancellation up to 12 hours before. Inside that, a small fee applies through Zavoia.' },
      ],
      announcement: { text: 'Saturday chairs go fast — book your weekend cut early.', cta: 'Book' },
    },
    menu: {
      'sharps-shoreditch': [
        { cat: 'Cuts', items: [
          { id: 'sh-skin', name: 'Skin fade', desc: 'Tight fade, scissor top.', dur: 45, price: 32 },
          { id: 'sh-scissor', name: 'Scissor cut', desc: 'Classic, wash & finish.', dur: 40, price: 30 },
          { id: 'sh-restyle', name: 'Restyle & consult', desc: 'Bigger change, full consult.', dur: 60, price: 42 },
          { id: 'sh-kids', name: 'Kids’ cut', desc: 'Under 12s.', dur: 30, price: 20 } ]},
        { cat: 'Shaves & beard', items: [
          { id: 'sh-shave', name: 'Hot-towel shave', desc: 'Traditional cut-throat.', dur: 45, price: 35 },
          { id: 'sh-beard', name: 'Beard sculpt', desc: 'Shape, line & oil.', dur: 30, price: 22 },
          { id: 'sh-tidy', name: 'Neck & line tidy', desc: 'Between cuts.', dur: 15, price: 12 } ]},
        { cat: 'Extras', items: [
          { id: 'sh-grey', name: 'Grey blending', desc: 'Soften, not dye.', dur: 30, price: 28 },
          { id: 'sh-wash', name: 'Wash & style', desc: 'Shampoo, product, finish.', dur: 20, price: 16 } ]},
        { cat: 'Packages', items: [
          { id: 'sh-works', name: 'The full works', desc: 'Skin fade, hot-towel shave & beard.', dur: 90, price: 78, isBundle: true, includes: ['Skin fade', 'Hot-towel shave', 'Beard sculpt'] } ]},
      ],
    },
    locations: [
      { id: 'sharps-shoreditch', name: 'Shoreditch', area: 'Shoreditch, London', address: '5 Calvert Avenue', postcode: 'London E2 7JP', phone: '+44 20 7946 0550', station: 'Shoreditch High St · 4 min', rating: 4.9, reviewCount: 487, flagship: true,
        photo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80', blurb: 'Our corner shop off Arnold Circus — three chairs, hot towels, good chat.',
        hours: [{ d: 'Tue–Fri', h: '10:00 – 19:00' }, { d: 'Saturday', h: '9:00 – 18:00' }, { d: 'Sunday', h: '11:00 – 16:00' }, { d: 'Monday', h: 'Closed' }],
        team: [
          { id: 'theo', name: 'Theo Marsh', role: 'Master Barber', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', rating: 5.0, reviews: 198, specialty: 'Skin fades & classic cuts', does: ['sh-skin','sh-scissor','sh-restyle','sh-works'], rates: { 'sh-skin': { price: 36, dur: 45 } } },
          { id: 'marcus', name: 'Marcus Bell', role: 'Senior Barber', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80', rating: 4.9, reviews: 142, specialty: 'Shaves & beard work', does: ['sh-shave','sh-beard','sh-tidy','sh-scissor'] },
          { id: 'jay', name: 'Jay Okonkwo', role: 'Barber', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80', rating: 4.8, reviews: 96, specialty: 'Texture & kids’ cuts', does: ['sh-scissor','sh-kids','sh-grey','sh-wash'] },
        ],
        reviews: [
          { id: 1, name: 'Daniel O.', stars: 5, date: '3 days ago', verified: true, text: 'Best fade in East London, full stop. Theo takes his time and the hot-towel finish is unmatched. Booked my next three.' },
          { id: 2, name: 'Sam R.', stars: 5, date: '1 week ago', verified: true, text: 'Came in for a restyle with no idea what I wanted. Honest advice, great cut, zero pressure. Proper barbershop.' },
          { id: 3, name: 'Will T.', stars: 4, date: '3 weeks ago', verified: false, text: 'Solid cut and a great shave. Got a little busy on a Saturday but worth the short wait.' },
        ] },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Extra stress-test variants (built programmatically to stay DRY):
//   · reform    — six locations (exercises the footer's multi-location list)
//   · lacquer   — a one-word business name
//   · hampstead — a five/six-word business name
// ─────────────────────────────────────────────────────────────
(function () {
  const V = window.MC_VERTICALS;
  const U = (id, w) => 'https://images.unsplash.com/' + id + '?w=' + (w || 1400) + '&q=80';
  const HRS = (rows) => rows.map(r => ({ d: r[0], h: r[1] }));
  const REV = (id, name, stars, date, text) => ({ id, name, stars, date, verified: true, text });
  const tm = (id, name, role, avi, spec, does, rating, reviews) => ({ id, name, role, avatar: U(avi, 600), rating, reviews, specialty: spec, does });
  const gal = (ids, caps) => ids.map((id, i) => ({ src: U(id), cap: caps[i % caps.length] }));
  const faq = (place) => ([
    { q: 'How do I book?', a: 'Book online in a couple of taps, or call your nearest ' + place + ' — pick a time and we’ll confirm instantly.' },
    { q: 'What’s your cancellation policy?', a: 'Free cancellation up to 24 hours before. Inside 24 hours a 50% fee applies, charged through Zavoia.' },
    { q: 'Can I request a specific person?', a: 'Always — choose when you book, or let us match you to the right person.' },
    { q: 'Do you offer gift cards?', a: 'Yes — digital gift cards are available for any amount and never expire.' },
  ]);
  const amen = [{ icon: 'wheelchair', label: 'Step-free access' }, { icon: 'globe', label: 'Free Wi-Fi' }, { icon: 'wallet', label: 'Card & contactless' }, { icon: 'cal', label: 'Walk-ins welcome' }];
  const AV = ['photo-1544005313-94ddf0286df2', 'photo-1487412720507-e7ab37603c6f', 'photo-1573496359142-b8d87734a5a2', 'photo-1580489944761-15a19d654956', 'photo-1531123897727-8f129e1688ce', 'photo-1506794778202-cad84cf45f1d', 'photo-1500648767791-00dcc994a43e', 'photo-1534528741775-53994a69daeb'];
  const SPA = ['photo-1540555700478-4be289fbecef', 'photo-1600334129128-685c5582fd35', 'photo-1544161515-4ab6ce6db874', 'photo-1519823551278-64ac92734fb1', 'photo-1570172619644-dfd03ed5d881', 'photo-1571019613454-1cb2f99b2d8b'];
  const HAIR = ['photo-1560066984-138dadb4c035', 'photo-1633681926022-84c23e8cb2d6', 'photo-1521590832167-7bcbfaa6381f', 'photo-1600948836101-f9ffda59d250', 'photo-1562322140-8baeececf3df', 'photo-1595476108010-b4d1f102b1b1'];

  // ============================ REFORM ROOM — 6 studios ============================
  const RR_MENU = [
    { cat: 'Classes', items: [
      { id: 'flow', name: 'Reformer Flow', desc: 'Full-body, spring-loaded.', dur: 50, price: 28 },
      { id: 'sculpt', name: 'Reformer Sculpt', desc: 'Strength & control.', dur: 50, price: 30 },
      { id: 'mat', name: 'Mat Pilates', desc: 'Classical mat work.', dur: 45, price: 18 } ] },
    { cat: 'Private', items: [
      { id: 'priv', name: 'Private session', desc: 'One-to-one, tailored.', dur: 55, price: 78 },
      { id: 'duet', name: 'Duet session', desc: 'Two of you, one instructor.', dur: 55, price: 110 } ] },
  ];
  const rrHours = HRS([['Mon–Fri', '6:30 – 21:00'], ['Saturday', '8:00 – 18:00'], ['Sunday', '8:00 – 16:00']]);
  function rrLoc(id, name, area, address, postcode, phone, station, photo, blurb, t, rev, flagship) {
    return { id, name, area, address, postcode, phone, station, rating: 4.9, reviewCount: 60 + rev.length * 40, flagship: !!flagship,
      photo: U(photo, 1200), blurb, amenities: amen, hours: rrHours, team: t, reviews: rev };
  }
  const rrInst = (n, name, spec) => tm('rr' + n, name, 'Instructor', AV[n % AV.length], spec, ['flow', 'sculpt', 'mat', 'priv', 'duet'], 4.9, 38 + n);
  const rrLocs = [
    rrLoc('rr-islington', 'Islington', 'Islington, London', '12 Upper Street', 'London N1 0PN', '+44 20 7946 0610', 'Angel · 4 min', SPA[0], 'Our flagship — eight reformers and a sprung floor.',
      [rrInst(0, 'Mia Calder', 'Flow & alignment'), rrInst(1, 'Tom Reyes', 'Strength & sculpt')], [REV(1, 'Hannah B.', 5, '2 days ago', 'Best reformer class in north London — Mia’s cues are spot on.')], true),
    rrLoc('rr-clapham', 'Clapham', 'Clapham, London', '88 Venn Street', 'London SW4 0BD', '+44 20 7946 0611', 'Clapham Common · 5 min', SPA[1], 'Bright corner studio by the common.',
      [rrInst(2, 'Priya Nair', 'Pre & postnatal'), rrInst(3, 'Jonah West', 'Mobility')], [REV(1, 'Olu A.', 5, '1 week ago', 'Small classes, real coaching. I actually feel stronger.')]),
    rrLoc('rr-shoreditch', 'Shoreditch', 'Shoreditch, London', '24 Redchurch Street', 'London E2 7DP', '+44 20 7946 0612', 'Shoreditch High St · 3 min', SPA[2], 'East-side studio with a great playlist.',
      [rrInst(4, 'Sana Iqbal', 'Flow & sculpt')], [REV(1, 'Grace L.', 5, '5 days ago', 'The 7am flow sets up my whole day. Worth the early alarm.')]),
    rrLoc('rr-nottinghill', 'Notting Hill', 'Notting Hill, London', '5 Portobello Road', 'London W11 3DA', '+44 20 7946 0613', 'Ladbroke Grove · 6 min', SPA[3], 'Calm room off Portobello — slower, precise classes.',
      [rrInst(5, 'Marek Nowak', 'Rehab & alignment'), rrInst(6, 'Esme Clarke', 'Beginners')], [REV(1, 'Tom R.', 4, '3 weeks ago', 'Lovely studio and patient teaching for a total beginner.')]),
    rrLoc('rr-wimbledon', 'Wimbledon', 'Wimbledon, London', '17 The Broadway', 'London SW19 1RE', '+44 20 7946 0614', 'Wimbledon · 4 min', SPA[4], 'Our largest floor — twelve reformers, lots of light.',
      [rrInst(7, 'Noor Rahman', 'Strength'), rrInst(0, 'Mia Calder', 'Flow & alignment')], [REV(1, 'Sara H.', 5, '1 week ago', 'Spacious, spotless and a brilliant teaching team.')]),
    rrLoc('rr-hackney', 'Hackney', 'Hackney, London', '33 Wilton Way', 'London E8 1BG', '+44 20 7946 0615', 'Hackney Central · 5 min', SPA[5], 'Our newest studio — neighbourhood-feel, first class £10.',
      [rrInst(1, 'Tom Reyes', 'Strength & sculpt')], [REV(1, 'Aisha N.', 5, '4 days ago', 'So glad they opened up the road. Friendly and properly good.')]),
  ];
  V.reform = {
    label: 'Pilates studio',
    vibe: { accent: '#4C6B5B', font: 'friendly' },
    business: {
      id: 'reform', name: 'Reform Room', slug: 'reform-room', currency: '£', established: 2018,
      tagline: 'Reformer Pilates, six studios across London.',
      cover: U('photo-1540555700478-4be289fbecef', 2000),
      logo: null, social: { instagram: 'reformroom', tiktok: 'reformroom', facebook: 'reformroomldn', youtube: 'reformroom', web: 'reformroom.co' }, email: 'hello@reformroom.co',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Instructors', teamLine: 'Instructors at', book: 'Book a class', services: 'Classes', kind: 'fitness' },
      marquee: ['Reformer Flow', 'Mat Pilates', 'Sculpt', 'Private sessions', 'Pre & postnatal', 'Beginners welcome'],
      about: {
        lede: 'Six light studios built around the reformer — strong, mobile, unhurried.',
        body: 'We opened Reform Room in 2018 to make reformer Pilates feel personal at scale. Small classes, real coaching, and the same considered method in every studio across London.',
        stats: [{ n: 6, label: 'Studios in London' }, { n: 34, label: 'Instructors' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2018, label: 'Established', raw: true }],
      },
      gallery: gal(SPA, ['The studio floor', 'Reformers', 'Mat work', 'Light & space', 'In class', 'The space']),
      interludes: [
        { src: U('photo-1540555700478-4be289fbecef', 2000), kicker: 'The method', line: 'Strong, mobile, unhurried — the same in every room.' },
        { src: U('photo-1519823551278-64ac92734fb1', 2000), kicker: 'The room', line: 'Small classes. Real coaching. No conveyor belt.' },
      ],
      faq: faq('studio'),
      announcement: { text: 'New Hackney studio now open — first class £10.', cta: 'Book a class' },
    },
    menu: { 'rr-islington': RR_MENU, 'rr-clapham': RR_MENU, 'rr-shoreditch': RR_MENU, 'rr-nottinghill': RR_MENU, 'rr-wimbledon': RR_MENU, 'rr-hackney': RR_MENU },
    locations: rrLocs,
  };

  // ============================ LACQUER — one-word name ============================
  const LAC_MENU = [
    { cat: 'Hands', items: [
      { id: 'mani', name: 'Signature manicure', desc: 'Shape, cuticle, polish.', dur: 45, price: 38 },
      { id: 'gel', name: 'Gel manicure', desc: 'Two-week wear.', dur: 60, price: 48 },
      { id: 'biab', name: 'BIAB overlay', desc: 'Builder gel, natural look.', dur: 75, price: 58 } ] },
    { cat: 'Feet', items: [
      { id: 'pedi', name: 'Signature pedicure', desc: 'Soak, scrub, polish.', dur: 55, price: 48 } ] },
  ];
  V.lacquer = {
    label: 'Nail studio',
    vibe: { accent: '#B5476A', font: 'elegant' },
    business: {
      id: 'lacquer', name: 'Lacquer', slug: 'lacquer', currency: '£', established: 2020,
      tagline: 'Considered nails, one quiet room in Fitzrovia.',
      cover: U('photo-1595476108010-b4d1f102b1b1', 2000),
      logo: null, social: { instagram: 'lacquer.london', tiktok: 'lacquerlondon', pinterest: 'lacquerlondon', web: 'lacquer.london' }, email: 'hello@lacquer.london',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Technicians', teamLine: 'Hands at', book: 'Book', services: 'Services', kind: 'nails' },
      marquee: ['Signature manicures', 'Gel', 'BIAB', 'Nail art', 'Pedicures', 'Hand care'],
      about: {
        lede: 'A small studio for considered nails — clean work, calm room, no rush.',
        body: 'Lacquer is one quiet room off Charlotte Street. We keep the diary light so every set gets the time it needs, from a simple file-and-polish to sculpted BIAB.',
        stats: [{ n: 1, label: 'Studio in Fitzrovia' }, { n: 6, label: 'Technicians' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2020, label: 'Established', raw: true }],
      },
      gallery: gal(HAIR, ['The bar', 'Detail', 'The room', 'Hands', 'Finish', 'At work']),
      interludes: [
        { src: U('photo-1595476108010-b4d1f102b1b1', 2000), kicker: 'The craft', line: 'Unhurried hands, a quiet room.' },
        { src: U('photo-1562322140-8baeececf3df', 2000), kicker: 'The finish', line: 'Polish that lasts the fortnight.' },
      ],
      faq: faq('studio'),
      announcement: { text: 'Midweek manicures 15% off through spring.', cta: 'Book' },
    },
    menu: { 'lac-fitzrovia': LAC_MENU },
    locations: [
      { id: 'lac-fitzrovia', name: 'Fitzrovia', area: 'Fitzrovia, London', address: '9 Charlotte Street', postcode: 'London W1T 1RR', phone: '+44 20 7946 0720', station: 'Goodge Street · 3 min', rating: 4.9, reviewCount: 142, flagship: true,
        photo: U('photo-1595476108010-b4d1f102b1b1', 1200), blurb: 'One quiet room off Charlotte Street — six seats, no rush.', amenities: amen,
        hours: HRS([['Tue–Fri', '10:00 – 19:00'], ['Saturday', '9:00 – 18:00'], ['Sun–Mon', 'Closed']]),
        team: [tm('lac1', 'Noor Haddad', 'Lead Technician', AV[2], 'BIAB & nail art', ['mani', 'gel', 'biab', 'pedi'], 5.0, 88), tm('lac2', 'Esme Clarke', 'Technician', AV[3], 'Gel & natural care', ['mani', 'gel', 'pedi'], 4.9, 54)],
        reviews: [REV(1, 'Priya K.', 5, '4 days ago', 'Cleanest BIAB I’ve had — lasted three weeks, and the room is so calm.'), REV(2, 'Sam W.', 5, '2 weeks ago', 'Genuinely the nicest manicure in central London.')] },
    ],
  };

  // ============================ HAMPSTEAD HOUSE — long name ============================
  const HH_MENU = [
    { cat: 'Colour', items: [
      { id: 'hh-balayage', name: 'Balayage', desc: 'Hand-painted, custom blend.', dur: 150, price: 140 },
      { id: 'hh-tint', name: 'Root tint', desc: 'Regrowth colour.', dur: 60, price: 55 } ] },
    { cat: 'Hair', items: [
      { id: 'hh-cut', name: 'Cut & finish', desc: 'Consult, wash, cut, style.', dur: 60, price: 52 },
      { id: 'hh-blow', name: 'Blow-dry', desc: 'Wash & finish.', dur: 45, price: 34 } ] },
    { cat: 'Beauty', items: [
      { id: 'hh-facial', name: 'Express facial', desc: 'Cleanse, mask & glow.', dur: 45, price: 60 } ] },
  ];
  V.hampstead = {
    label: 'Hair & beauty',
    vibe: { accent: '#8A6D46', font: 'classic' },
    business: {
      id: 'hampstead', name: 'The Hampstead House of Hair & Beauty', slug: 'hampstead-house', currency: '£', established: 2009,
      tagline: 'Colour, cuts and skin, on the hill since 2009.',
      cover: U('photo-1600948836101-f9ffda59d250', 2000),
      logo: null, social: { instagram: 'hampsteadhouse', facebook: 'hampsteadhouseofhairandbeauty', pinterest: 'hampsteadhouse', web: 'hampsteadhouse.co.uk' }, email: 'hello@hampsteadhouse.co.uk',
      labels: { place: 'salon', placePlural: 'salons', teamPlural: 'Stylists', teamLine: 'Hands at', book: 'Book', services: 'Services', kind: 'salon' },
      marquee: ['Colour', 'Balayage', 'Cuts', 'Blow-dries', 'Facials', 'Brow & lash'],
      about: {
        lede: 'A village salon for colour, cuts and skin — on the hill since 2009.',
        body: 'The Hampstead House of Hair & Beauty has dressed north London for over fifteen years. Two townhouse salons, one unhurried approach to colour, cutting and facials.',
        stats: [{ n: 2, label: 'Salons in north London' }, { n: 18, label: 'Stylists & therapists' }, { n: 4.8, label: 'Average rating', dec: 1 }, { n: 2009, label: 'Established', raw: true }],
      },
      gallery: gal(HAIR, ['The salon', 'Colour bar', 'At the basin', 'The townhouse', 'Finish', 'Detail']),
      interludes: [
        { src: U('photo-1600948836101-f9ffda59d250', 2000), kicker: 'The house', line: 'Two townhouses, fifteen years on the hill.' },
        { src: U('photo-1562322140-8baeececf3df', 2000), kicker: 'The craft', line: 'Colour, cutting and skin — unhurried.' },
      ],
      faq: faq('salon'),
      announcement: { text: 'New-client colour: 20% off your first visit this season.', cta: 'Book' },
    },
    menu: { 'hh-hampstead': HH_MENU, 'hh-highgate': HH_MENU },
    locations: [
      { id: 'hh-hampstead', name: 'Hampstead', area: 'Hampstead, London', address: '24 Heath Street', postcode: 'London NW3 6TE', phone: '+44 20 7946 0810', station: 'Hampstead · 3 min', rating: 4.8, reviewCount: 226, flagship: true,
        photo: U('photo-1600948836101-f9ffda59d250', 1200), blurb: 'Our original townhouse off the high street — colour, cuts and facials.', amenities: amen,
        hours: HRS([['Tue–Wed', '9:00 – 18:00'], ['Thu–Fri', '9:00 – 20:00'], ['Saturday', '9:00 – 18:00'], ['Sun–Mon', 'Closed']]),
        team: [tm('hh1', 'Claudia Fenn', 'Colour Director', AV[3], 'Balayage & correction', ['hh-balayage', 'hh-tint', 'hh-cut'], 5.0, 98), tm('hh2', 'Rosa Iqbal', 'Senior Stylist', AV[4], 'Cuts & blow-dries', ['hh-cut', 'hh-blow'], 4.9, 64)],
        reviews: [REV(1, 'Elena R.', 5, '3 days ago', 'Claudia’s balayage is the best I’ve had in years. Proper consultation, no rush.'), REV(2, 'David T.', 5, '2 weeks ago', 'A lovely old salon with seriously good colourists.')] },
      { id: 'hh-highgate', name: 'Highgate', area: 'Highgate, London', address: '51 Highgate High Street', postcode: 'London N6 5JX', phone: '+44 20 7946 0811', station: 'Highgate · 6 min', rating: 4.8, reviewCount: 134,
        photo: U('photo-1562322140-8baeececf3df', 1200), blurb: 'Our second house up the hill — quieter, by appointment.', amenities: amen,
        hours: HRS([['Tue–Fri', '9:30 – 19:00'], ['Saturday', '9:00 – 17:00'], ['Sun–Mon', 'Closed']]),
        team: [tm('hh3', 'Sofia Marsh', 'Stylist & Facialist', AV[2], 'Cuts & skin', ['hh-cut', 'hh-blow', 'hh-facial'], 4.8, 47)],
        reviews: [REV(1, 'Aisha N.', 5, '1 week ago', 'Calm, friendly and a brilliant cut. The express facial is a treat.')] },
    ],
  };
})();

// Apply a vertical's data to the live globals. Called at load (salon) and on switch.
window.MC_applyVertical = function (key) {
  const v = window.MC_VERTICALS[key] || window.MC_VERTICALS.salon;
  window.MC_BUSINESS = v.business;
  window.MC_LOCATIONS = v.locations;
  window.MC_LOCATION_MENU = v.menu;
  window.MC_SECTIONS_DEFAULT = mcSections();
  window.MC_SLOTS = window.MC_SLOTS_DEFAULT;
  window.MC_VERTICAL_KEY = key;
  return v;
};

// Initialise to salon so globals exist before the JSX scripts evaluate.
window.MC_applyVertical('salon');
