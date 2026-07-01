// ─────────────────────────────────────────────────────────────
// Zavoia · Business Microsite — VERTICAL PRESETS
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
      cover: window.__resources['img1'],
      social: { instagram: 'glowstudio', tiktok: 'glowstudio', web: 'glowstudio.co' }, email: 'hello@glowstudio.co',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Stylists', teamLine: 'Hands at', book: 'Book', services: 'Services', kind: 'salon' },
      marquee: ['Lived-in colour', 'Balayage', 'Precision cuts', 'Curl care', 'Gloss & tone', 'Brow & lash'],
      about: {
        lede: 'A small group of light-filled studios making colour that grows out beautifully — and cuts you’ll still love in week six.',
        body: 'Since 2014 we’ve built Glow around one idea: unhurried, lived-in hair. Every chair gets a real consultation, every colour is mixed for your regrowth, not just the reveal. Four rooms across London, one devoted team, no conveyor belt.',
        stats: [{ n: 4, label: 'Studios in London' }, { n: 28, label: 'Stylists & colourists' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2014, label: 'Established', raw: true }],
      },
      gallery: [
        { src: window.__resources['img2'], cap: 'The colour bar' },
        { src: window.__resources['img3'], cap: 'Wash & finish' },
        { src: window.__resources['img4'], cap: 'Soho floor' },
        { src: window.__resources['img5'], cap: 'Shelf' },
        { src: window.__resources['img6'], cap: 'The studio' },
        { src: window.__resources['img7'], cap: 'Lived-in colour' },
      ],
      interludes: [
        { src: window.__resources['img8'], kicker: 'The craft', line: 'We paint for the grow-out, not the reveal.' },
        { src: window.__resources['img9'], kicker: 'The chair', line: 'Never rushed. Never a conveyor belt.' },
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
        photo: window.__resources['img10'], blurb: 'Our flagship off Soho Square — colour-led, plant-strewn, six chairs.',
        hours: [{ d: 'Mon–Wed', h: '9:00 – 19:00' }, { d: 'Thu–Fri', h: '9:00 – 20:00' }, { d: 'Saturday', h: '10:00 – 18:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'mara', name: 'Mara Voinescu', role: 'Senior Colourist', avatar: window.__resources['img11'], rating: 4.9, reviews: 127, specialty: 'Balayage & colour correction', does: ['so-balayage','so-global','so-gloss','so-root'], rates: { 'so-balayage': { price: 165, dur: 165 }, 'so-global': { price: 88 } } },
          { id: 'iulia', name: 'Iulia Stan', role: 'Stylist · Cuts', avatar: window.__resources['img12'], rating: 4.9, reviews: 41, specialty: 'Curl care & precision cuts', does: ['so-cut','so-blow','so-curl'] },
          { id: 'andrei', name: 'Andrei Pop', role: 'Master Barber', avatar: window.__resources['img13'], rating: 4.8, reviews: 62, specialty: 'Classic & scissor cuts', does: ['so-mens','so-blow'] },
          { id: 'sofia', name: 'Sofia Petrescu', role: 'Colour & Treatments', avatar: window.__resources['img14'], rating: 4.8, reviews: 38, specialty: 'Gloss & bond-building', does: ['so-gloss','so-olaplex','so-root'] },
        ],
        reviews: [
          { id: 1, name: 'Elena R.', stars: 5, date: '2 days ago', verified: true, text: 'Mara absolutely nailed the balayage — exactly the dimension I asked for and zero brassiness. They offered me an espresso the moment I walked in.' },
          { id: 2, name: 'David T.', stars: 5, date: '1 week ago', verified: true, text: 'Best men’s cut in Soho, full stop. Andrei takes the time to talk through what works with how my hair grows.' },
          { id: 3, name: 'Marco L.', stars: 5, date: '3 weeks ago', verified: true, text: 'Iulia is a magician with curly hair. Felt seen and listened to. Pricing was clear up front.' },
        ] },
      { id: 'glow-shoreditch', name: 'Shoreditch', area: 'Shoreditch, London', address: '8 Redchurch Street', postcode: 'London E2 7DD', phone: '+44 20 7946 0992', station: 'Shoreditch High St · 3 min', rating: 4.8, reviewCount: 188,
        photo: window.__resources['img15'], blurb: 'Our East studio — creative colour, fades, and a record player.',
        hours: [{ d: 'Mon–Wed', h: '10:00 – 19:00' }, { d: 'Thu–Fri', h: '10:00 – 20:00' }, { d: 'Saturday', h: '9:00 – 18:00' }, { d: 'Sunday', h: '11:00 – 17:00' }],
        team: [
          { id: 'jay', name: 'Jay Okafor', role: 'Creative Colourist', avatar: window.__resources['img16'], rating: 4.9, reviews: 73, specialty: 'Vivids & fashion shades', does: ['sh-creative','sh-balayage'] },
          { id: 'nadia', name: 'Nadia Haddad', role: 'Senior Stylist', avatar: window.__resources['img17'], rating: 4.8, reviews: 54, specialty: 'Lived-in colour & cuts', does: ['sh-global','sh-cut','sh-blow'] },
          { id: 'theo', name: 'Theo Marsh', role: 'Barber', avatar: window.__resources['img18'], rating: 4.7, reviews: 31, specialty: 'Skin fades', does: ['sh-mens','sh-blow'] },
        ],
        reviews: [
          { id: 1, name: 'Priya K.', stars: 5, date: '4 days ago', verified: true, text: 'Jay took my box-dye disaster to the softest copper. Genuinely the most fun salon visit I’ve had.' },
          { id: 2, name: 'Sam W.', stars: 5, date: '2 weeks ago', verified: true, text: 'Cleanest skin fade in East London and a great playlist. Booked my next three already.' },
        ] },
      { id: 'glow-marylebone', name: 'Marylebone', area: 'Marylebone, London', address: '46 Marylebone Lane', postcode: 'London W1U 2NT', phone: '+44 20 7946 0993', station: 'Bond Street · 6 min', rating: 4.9, reviewCount: 96,
        photo: window.__resources['img19'], blurb: 'Our quietest room — bridal, correction and keratin by appointment.',
        hours: [{ d: 'Tue–Wed', h: '9:30 – 18:30' }, { d: 'Thu–Fri', h: '9:30 – 20:00' }, { d: 'Saturday', h: '9:00 – 17:00' }, { d: 'Sun–Mon', h: 'Closed' }],
        team: [
          { id: 'claudia', name: 'Claudia Fenn', role: 'Colour Director', avatar: window.__resources['img20'], rating: 5.0, reviews: 58, specialty: 'Correction & bridal', does: ['ma-correction','ma-balayage'] },
          { id: 'rosa', name: 'Rosa Iqbal', role: 'Senior Stylist', avatar: window.__resources['img21'], rating: 4.9, reviews: 38, specialty: 'Cuts & keratin', does: ['ma-cut','ma-keratin','ma-bridal'] },
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
      cover: window.__resources['img22'],
      social: { instagram: 'lumenandstone', tiktok: 'lumenandstone', web: 'lumenandstone.co' }, email: 'hello@lumenandstone.co',
      labels: { place: 'spa', placePlural: 'spas', teamPlural: 'Therapists', teamLine: 'Therapists at', book: 'Reserve', services: 'Treatments', kind: 'spa' },
      marquee: ['Deep-tissue', 'Hot stone', 'Signature facials', 'Couples rituals', 'Sauna & steam', 'Aromatherapy'],
      about: {
        lede: 'Two calm rooms built around one promise: you leave lighter than you arrived.',
        body: 'We opened Lumen & Stone in 2017 for people who needed somewhere to actually slow down. Every ritual starts with quiet, a foot soak and a breath; our therapists tailor pressure and oils to your week, not a script. Phones away, candles lit, nowhere to be.',
        stats: [{ n: 2, label: 'City sanctuaries' }, { n: 14, label: 'Trained therapists' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2017, label: 'Established', raw: true }],
      },
      gallery: [
        { src: window.__resources['img23'], cap: 'The relaxation room' },
        { src: window.__resources['img24'], cap: 'Stones & oils' },
        { src: window.__resources['img25'], cap: 'Deep-tissue' },
        { src: window.__resources['img26'], cap: 'Linen & steam' },
        { src: window.__resources['img27'], cap: 'Signature facial' },
        { src: window.__resources['img28'], cap: 'The pool' },
      ],
      interludes: [
        { src: window.__resources['img29'], kicker: 'The ritual', line: 'It begins with quiet, a foot soak, a breath.' },
        { src: window.__resources['img30'], kicker: 'The hands', line: 'Pressure tuned to your week, not a script.' },
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
        photo: window.__resources['img31'], blurb: 'Our flagship sanctuary — five treatment rooms, sauna and steam.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 21:00' }, { d: 'Saturday', h: '9:00 – 20:00' }, { d: 'Sunday', h: '10:00 – 18:00' }],
        team: [
          { id: 'noor', name: 'Noor Rahman', role: 'Lead Therapist', avatar: window.__resources['img14'], rating: 5.0, reviews: 96, specialty: 'Deep-tissue & hot stone', does: ['lm-deep','lm-stone','lm-couples'], rates: { 'lm-deep': { price: 110, dur: 75 }, 'lm-stone': { price: 150, dur: 100 } } },
          { id: 'esme', name: 'Esme Clarke', role: 'Facialist', avatar: window.__resources['img20'], rating: 4.9, reviews: 71, specialty: 'Skin & lymphatic facials', does: ['lm-facial','lm-glow'] },
          { id: 'priya', name: 'Priya Nair', role: 'Body Therapist', avatar: window.__resources['img21'], rating: 4.8, reviews: 44, specialty: 'Scrubs & wraps', does: ['lm-scrub','lm-stone'] },
        ],
        reviews: [
          { id: 1, name: 'Hannah B.', stars: 5, date: '3 days ago', verified: true, text: 'Noor found every knot I’d been carrying for a month. I floated out. The foot soak and tea ritual to start is everything.' },
          { id: 2, name: 'Olu A.', stars: 5, date: '2 weeks ago', verified: true, text: 'Booked the couples ritual for our anniversary — calm, private and genuinely restorative. Already rebooked.' },
        ] },
      { id: 'lumen-richmond', name: 'Richmond', area: 'Richmond, London', address: '22 Hill Rise', postcode: 'London TW10 6UA', phone: '+44 20 7946 0211', station: 'Richmond · 7 min', rating: 4.8, reviewCount: 118,
        photo: window.__resources['img32'], blurb: 'Riverside rooms with a sauna and steam circuit overlooking the hill.',
        hours: [{ d: 'Tue–Fri', h: '9:00 – 20:00' }, { d: 'Saturday', h: '9:00 – 19:00' }, { d: 'Sun–Mon', h: '10:00 – 17:00' }],
        team: [
          { id: 'marek', name: 'Marek Nowak', role: 'Senior Therapist', avatar: window.__resources['img13'], rating: 4.9, reviews: 62, specialty: 'Deep-tissue & sport', does: ['lr-deep','lr-stone'] },
          { id: 'sana', name: 'Sana Iqbal', role: 'Aromatherapist', avatar: window.__resources['img12'], rating: 4.8, reviews: 49, specialty: 'Aromatherapy & facials', does: ['lr-aroma','lr-facial'] },
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
      cover: window.__resources['img33'],
      social: { instagram: 'apexautostudio', tiktok: 'apexauto', web: 'apexauto.co' }, email: 'studio@apexauto.co',
      labels: { place: 'studio', placePlural: 'studios', teamPlural: 'Specialists', teamLine: 'Specialists at', book: 'Get a quote', services: 'Services', kind: 'auto' },
      marquee: ['Paint correction', 'Ceramic coating', 'Full details', 'Interior restore', 'Paint protection film', 'Ceramic glass'],
      about: {
        lede: 'A workshop for owners who treat their car like an investment, not an appliance.',
        body: 'Apex started in a single railway arch in 2011, correcting paint other shops wouldn’t touch. Today we run two climate-controlled studios with dedicated coating rooms and a no-rush booking model — one car per bay, per day. Every job is photographed, paint-depth logged and warrantied.',
        stats: [{ n: 2, label: 'Climate-controlled studios' }, { n: 9, label: 'Detailers & coaters' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2011, label: 'Established', raw: true }],
      },
      gallery: [
        { src: window.__resources['img34'], cap: 'Final inspection' },
        { src: window.__resources['img35'], cap: 'Paint correction' },
        { src: window.__resources['img36'], cap: 'Wheels off' },
        { src: window.__resources['img37'], cap: 'The studio' },
        { src: window.__resources['img38'], cap: 'Coated & cured' },
        { src: window.__resources['img39'], cap: 'Interior restore' },
      ],
      interludes: [
        { src: window.__resources['img40'], kicker: 'The process', line: 'Measured, corrected, protected — then proven.' },
        { src: window.__resources['img41'], kicker: 'The bay', line: 'One car per bay, per day. No rush jobs.' },
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
        photo: window.__resources['img42'], blurb: 'Our flagship arches — four bays, dedicated coating room.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 18:00' }, { d: 'Saturday', h: '9:00 – 16:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'dan', name: 'Dan Whitfield', role: 'Lead Detailer', avatar: window.__resources['img13'], rating: 5.0, reviews: 132, specialty: 'Paint correction & ceramic', does: ['av-2step','av-1step','av-ceramic'], rates: { 'av-2step': { price: 680, dur: 720 }, 'av-ceramic': { price: 980, dur: 840 } } },
          { id: 'kasia', name: 'Kasia Lewandowska', role: 'Coating Specialist', avatar: window.__resources['img20'], rating: 4.9, reviews: 78, specialty: 'Ceramic & PPF', does: ['av-ceramic','av-ppf'] },
          { id: 'reece', name: 'Reece Adeyemi', role: 'Detailer', avatar: window.__resources['img16'], rating: 4.8, reviews: 53, specialty: 'Details & interiors', does: ['av-full','av-maint','av-interior'] },
        ],
        reviews: [
          { id: 1, name: 'James P.', stars: 5, date: '6 days ago', verified: true, text: 'Dan took three years of swirls out of black paint and coated it — looks better than the showroom. Photo log before and after was a nice touch.' },
          { id: 2, name: 'Yusuf K.', stars: 5, date: '2 weeks ago', verified: true, text: 'Booked PPF on the front end before a road trip. Flawless install, no orange peel, and they collected the car. Worth every penny.' },
        ] },
      { id: 'apex-parkroyal', name: 'Park Royal', area: 'Park Royal, London', address: 'Unit 7, Abbey Road', postcode: 'London NW10 7XF', phone: '+44 20 7946 0441', station: 'Park Royal · 8 min', rating: 4.8, reviewCount: 134,
        photo: window.__resources['img43'], blurb: 'Our West studio — quick-turn details and maintenance plans.',
        hours: [{ d: 'Mon–Fri', h: '8:00 – 18:00' }, { d: 'Saturday', h: '8:00 – 15:00' }, { d: 'Sunday', h: 'Closed' }],
        team: [
          { id: 'omar', name: 'Omar Haddad', role: 'Studio Lead', avatar: window.__resources['img18'], rating: 4.9, reviews: 64, specialty: 'Correction & coating', does: ['ap-1step','ap-ceramic','ap-glass'] },
          { id: 'lottie', name: 'Lottie Grant', role: 'Detailer', avatar: window.__resources['img12'], rating: 4.8, reviews: 37, specialty: 'Details & maintenance', does: ['ap-full','ap-maint'] },
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
      cover: window.__resources['img8'],
      social: { instagram: 'sharpsbarbers', tiktok: 'sharpsbarbers', web: 'sharps.co' }, email: 'hello@sharps.co',
      labels: { place: 'shop', placePlural: 'shops', teamPlural: 'Barbers', teamLine: 'Barbers at', book: 'Book', services: 'Services', kind: 'barber' },
      marquee: ['Skin fades', 'Scissor cuts', 'Hot-towel shave', 'Beard sculpt', 'Kids’ cuts', 'Grey blending'],
      about: {
        lede: 'A proper neighbourhood barbershop — no fuss, just a good chair and a sharp finish.',
        body: 'We opened Sharps in 2016 on a corner off Arnold Circus with three chairs and a simple idea: take your time, get it right. Every cut starts with a chat about how your hair actually grows, and ends with a hot towel. Walk-ins welcome when there’s a chair free.',
        stats: [{ n: 1, label: 'Shop in Shoreditch' }, { n: 5, label: 'Barbers' }, { n: 4.9, label: 'Average rating', dec: 1 }, { n: 2016, label: 'Established', raw: true }],
      },
      gallery: [
        { src: window.__resources['img44'], cap: 'The chair' },
        { src: window.__resources['img45'], cap: 'Skin fade' },
        { src: window.__resources['img46'], cap: 'The shop' },
        { src: window.__resources['img47'], cap: 'Finish' },
        { src: window.__resources['img48'], cap: 'Beard work' },
        { src: window.__resources['img45'], cap: 'Hot towel' },
      ],
      interludes: [
        { src: window.__resources['img49'], kicker: 'The craft', line: 'Sharp lines, soft finish — no two heads the same.' },
        { src: window.__resources['img50'], kicker: 'The room', line: 'Three chairs, a good playlist, and a hot towel waiting.' },
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
        photo: window.__resources['img51'], blurb: 'Our corner shop off Arnold Circus — three chairs, hot towels, good chat.',
        hours: [{ d: 'Tue–Fri', h: '10:00 – 19:00' }, { d: 'Saturday', h: '9:00 – 18:00' }, { d: 'Sunday', h: '11:00 – 16:00' }, { d: 'Monday', h: 'Closed' }],
        team: [
          { id: 'theo', name: 'Theo Marsh', role: 'Master Barber', avatar: window.__resources['img13'], rating: 5.0, reviews: 198, specialty: 'Skin fades & classic cuts', does: ['sh-skin','sh-scissor','sh-restyle','sh-works'], rates: { 'sh-skin': { price: 36, dur: 45 } } },
          { id: 'marcus', name: 'Marcus Bell', role: 'Senior Barber', avatar: window.__resources['img16'], rating: 4.9, reviews: 142, specialty: 'Shaves & beard work', does: ['sh-shave','sh-beard','sh-tidy','sh-scissor'] },
          { id: 'jay', name: 'Jay Okonkwo', role: 'Barber', avatar: window.__resources['img18'], rating: 4.8, reviews: 96, specialty: 'Texture & kids’ cuts', does: ['sh-scissor','sh-kids','sh-grey','sh-wash'] },
        ],
        reviews: [
          { id: 1, name: 'Daniel O.', stars: 5, date: '3 days ago', verified: true, text: 'Best fade in East London, full stop. Theo takes his time and the hot-towel finish is unmatched. Booked my next three.' },
          { id: 2, name: 'Sam R.', stars: 5, date: '1 week ago', verified: true, text: 'Came in for a restyle with no idea what I wanted. Honest advice, great cut, zero pressure. Proper barbershop.' },
          { id: 3, name: 'Will T.', stars: 4, date: '3 weeks ago', verified: false, text: 'Solid cut and a great shave. Got a little busy on a Saturday but worth the short wait.' },
        ] },
    ],
  },
};

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
