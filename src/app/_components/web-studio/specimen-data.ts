import type {
  AnnouncementContent,
  FaqItem,
  WebsiteBuilderLocation,
} from "@/features/website/types";
import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import type { ResolvedTagDictionaries } from "@/features/marketplace/hooks/useLocationTagDictionaries";
import type { MicrositeLocale } from "@/features/website/i18n/translate";

/**
 * SYNTHETIC DEMONSTRATION BUSINESS — "Studio Lumina" is not a real Zavoia
 * customer. Every name, price, hour and quote below is authored so the Web
 * Studio catalogue can drive the real microsite renderer at production
 * fidelity when the showcase fetch finds no live published site. The page
 * labels this specimen as a demonstration wherever a visitor could mistake it
 * for a real business. Photography is Unsplash (verified to resolve).
 */

const IMG = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const PORTFOLIO_IDS = [
  "photo-1560066984-138dadb4c035",
  "photo-1522337360788-8b13dee7a37e",
  "photo-1600948836101-f9ffda59d250",
  "photo-1585747860715-2ba37e788b70",
  "photo-1503951914875-452162b0f3f1",
  "photo-1595476108010-b4d1f102b1b1",
  "photo-1570172619644-dfd03ed5d881",
  "photo-1521490683712-35a1cb235d1c",
];

const portfolio = (from: number, count: number) =>
  PORTFOLIO_IDS.slice(from, from + count).map((id, i) => ({
    url: IMG(id),
    key: `specimen/${id}-${i}`,
    originalName: `${id}.jpg`,
  }));

const WEEKDAY = { open: "09:00", close: "20:00", isOpen: true };
const SATURDAY = { open: "10:00", close: "18:00", isOpen: true };
const CLOSED = { open: null, close: null, isOpen: false };

const HOURS = {
  monday: WEEKDAY,
  tuesday: WEEKDAY,
  wednesday: WEEKDAY,
  thursday: WEEKDAY,
  friday: WEEKDAY,
  saturday: SATURDAY,
  sunday: CLOSED,
};

const CAT_HAIR = { id: 1, name: "Hair", displayOrder: 1 };
const CAT_COLOR = { id: 2, name: "Colour", displayOrder: 2 };
const CAT_SKIN = { id: 3, name: "Skin", displayOrder: 3 };

/** Prices are RON minor units (bani): 18000 = 180 RON. */
const SERVICES = [
  {
    id: 1,
    name: "Cut & finish",
    description: "Consultation, wash, precision cut and a finish you can repeat at home.",
    duration: 60,
    price_amount_minor: 18000,
    categoryId: 1,
    category: CAT_HAIR,
  },
  {
    id: 2,
    name: "Restyle",
    description: "A full shape change, planned over a longer chair and a second opinion.",
    duration: 90,
    price_amount_minor: 26000,
    categoryId: 1,
    category: CAT_HAIR,
  },
  {
    id: 3,
    name: "Fringe trim",
    description: "Between appointments, on the house for regulars.",
    duration: 15,
    price_amount_minor: 4000,
    categoryId: 1,
    category: CAT_HAIR,
  },
  {
    id: 4,
    name: "Gloss & tone",
    description: "Refreshes colour and closes the cuticle. Lasts four to six weeks.",
    duration: 45,
    price_amount_minor: 15000,
    categoryId: 2,
    category: CAT_COLOR,
  },
  {
    id: 5,
    name: "Full balayage",
    description: "Hand-painted lift, toned to your skin. Includes the finishing blow-dry.",
    duration: 180,
    price_amount_minor: 52000,
    categoryId: 2,
    category: CAT_COLOR,
  },
  {
    id: 6,
    name: "Root touch-up",
    description: "Single-process colour on regrowth only.",
    duration: 75,
    price_amount_minor: 22000,
    categoryId: 2,
    category: CAT_COLOR,
  },
  {
    id: 7,
    name: "Signature facial",
    description: "Cleanse, enzyme peel, massage and a mask chosen on the day.",
    duration: 60,
    price_amount_minor: 24000,
    categoryId: 3,
    category: CAT_SKIN,
  },
  {
    id: 8,
    name: "Brow shape",
    description: "Mapped, waxed and tinted to suit the face you actually have.",
    duration: 30,
    price_amount_minor: 9000,
    categoryId: 3,
    category: CAT_SKIN,
  },
];

const BUNDLES = [
  {
    id: 1,
    name: "The reset",
    description: "Cut, gloss and a signature facial in one afternoon.",
    price_amount_minor: 49000,
    duration: 165,
    services: [{ name: "Cut & finish" }, { name: "Gloss & tone" }, { name: "Signature facial" }],
  },
  {
    id: 2,
    name: "Colour club",
    description: "Three root touch-ups, booked ahead at the price of two and a half.",
    price_amount_minor: 55000,
    duration: 225,
    services: [{ name: "Root touch-up" }, { name: "Root touch-up" }, { name: "Root touch-up" }],
  },
];

const TEAM = [
  { id: 101, firstName: "Ioana", lastName: "Petrescu", profileImage: null },
  { id: 102, firstName: "Andrei", lastName: "Marin", profileImage: null },
  { id: 103, firstName: "Sofia", lastName: "Radu", profileImage: null },
  { id: 104, firstName: "Vlad", lastName: "Constantin", profileImage: null },
  { id: 105, firstName: "Elena", lastName: "Dobre", profileImage: null },
];

const LOCATIONS: WebsiteBuilderLocation[] = [
  {
    id: 1,
    name: "Dorobanți",
    description:
      "The first room, above the flower shop. Four chairs, long windows and the good coffee.",
    phone: "+40 21 000 0000",
    email: "doroban@studio-lumina.demo",
    address: "Str. Radu Beller 12, București",
    addressComponents: {
      street: "Str. Radu Beller",
      streetNumber: "12",
      city: "București",
      postalCode: "011816",
      country: "România",
      latitude: 44.4626,
      longitude: 26.0958,
    },
    timezone: "Europe/Bucharest",
    workingHours: HOURS,
    open247: false,
    allowOnlineBooking: true,
    portfolioImages: portfolio(0, 5),
    featuredImage: IMG(PORTFOLIO_IDS[0]),
    averageRating: 4.9,
    totalReviews: 214,
    amenityTagIds: [1, 2, 4, 9],
    paymentMethodTagIds: [1, 2, 3],
    languageTagIds: [1, 2],
    services: SERVICES,
    bundles: BUNDLES,
    teamMembers: TEAM.slice(0, 3),
  },
  {
    id: 2,
    name: "Cotroceni",
    description:
      "A quieter, two-chair studio in the old quarter. Colour work and long appointments live here.",
    phone: "+40 21 000 0001",
    email: "cotroceni@studio-lumina.demo",
    address: "Str. Dr. Lister 34, București",
    addressComponents: {
      street: "Str. Dr. Lister",
      streetNumber: "34",
      city: "București",
      postalCode: "050541",
      country: "România",
      latitude: 44.4318,
      longitude: 26.0631,
    },
    timezone: "Europe/Bucharest",
    workingHours: { ...HOURS, monday: CLOSED },
    open247: false,
    allowOnlineBooking: true,
    portfolioImages: portfolio(5, 3),
    featuredImage: IMG(PORTFOLIO_IDS[5]),
    averageRating: 4.8,
    totalReviews: 96,
    amenityTagIds: [1, 3, 4],
    paymentMethodTagIds: [1, 2],
    languageTagIds: [1, 2, 3],
    services: SERVICES.filter((s) => s.categoryId !== 3),
    bundles: [BUNDLES[1]],
    teamMembers: TEAM.slice(3),
  },
];

const FAQ: FaqItem[] = [
  {
    q: {
      en: "Do I need an appointment?",
      ro: "Am nevoie de programare?",
    },
    a: {
      en: "Walk in if a chair is free — but Saturdays book out about ten days ahead, so online is safer.",
      ro: "Poți veni și fără programare dacă un scaun e liber, dar sâmbetele se ocupă cu zece zile înainte.",
    },
  },
  {
    q: {
      en: "How long does a colour appointment take?",
      ro: "Cât durează o ședință de vopsit?",
    },
    a: {
      en: "A root touch-up is about 75 minutes. A full balayage is three hours, and we'll say so when you book.",
      ro: "Un retuș de rădăcină durează circa 75 de minute. Un balayage complet durează trei ore.",
    },
  },
  {
    q: {
      en: "Can I book with a specific stylist?",
      ro: "Pot alege stilistul?",
    },
    a: {
      en: "Yes — pick the person on the booking screen and you'll only see the hours they actually work.",
      ro: "Da — alegi persoana la programare și vezi doar orele în care lucrează.",
    },
  },
  {
    q: {
      en: "What if I need to cancel?",
      ro: "Ce fac dacă trebuie să anulez?",
    },
    a: {
      en: "Move or cancel it yourself up to 24 hours before. After that, give us a ring and we'll sort it.",
      ro: "Poți muta sau anula singur cu 24 de ore înainte. După, sună-ne și rezolvăm.",
    },
  },
];

const ANNOUNCEMENT: AnnouncementContent = {
  message: {
    en: "January colour club — three root touch-ups, booked ahead",
    ro: "Colour club în ianuarie — trei retușuri, programate din timp",
  },
  details: {
    en: "Book all three before the end of the month and the third is half price. Applies at both studios.",
    ro: "Programează toate trei până la finalul lunii și al treilea e la jumătate de preț.",
  },
  cta: {
    enabled: true,
    label: { en: "See the offer", ro: "Vezi oferta" },
    url: "#",
    newTab: false,
    showArrow: true,
  },
  schedule: null,
};

const REVIEWS = [
  {
    id: 1,
    rating: 5,
    comment:
      "First time in years I've left a salon looking like the photo I brought in. Ioana listened, then told me what would actually work.",
    customerName: "Maria D.",
    locationName: "Dorobanți",
    createdAt: "2026-06-14T10:12:00.000Z",
  },
  {
    id: 2,
    rating: 5,
    comment:
      "Booked at midnight on my phone, got a reminder the day before, was out in under an hour. No phone tag, no waiting on hold.",
    customerName: "Alexandru P.",
    locationName: "Dorobanți",
    createdAt: "2026-05-30T18:44:00.000Z",
  },
  {
    id: 3,
    rating: 5,
    comment:
      "The colour has grown out beautifully — three months later it still looks deliberate. Worth the three hours.",
    customerName: "Ana-Maria R.",
    locationName: "Cotroceni",
    createdAt: "2026-05-02T09:05:00.000Z",
  },
  {
    id: 4,
    rating: 5,
    comment: "Calm room, honest advice, and they never try to sell you a product you don't need.",
    customerName: "Cristina V.",
    locationName: "Cotroceni",
    createdAt: "2026-04-19T14:20:00.000Z",
  },
  {
    id: 5,
    rating: 5,
    comment:
      "Took my daughter for her first proper cut. Vlad was patient, quick, and she has not stopped looking in mirrors since.",
    customerName: "Radu M.",
    locationName: "Dorobanți",
    createdAt: "2026-03-27T11:30:00.000Z",
  },
];

/** Matches the ids referenced by the specimen locations' tag arrays. */
export const SPECIMEN_TAG_DICTIONARIES: ResolvedTagDictionaries = {
  amenities: [
    { id: 1, slug: "wifi", label: "Free Wi-Fi" },
    { id: 2, slug: "parking-onsite", label: "On-site parking" },
    { id: 3, slug: "parking-street", label: "Street parking nearby" },
    { id: 4, slug: "air-conditioning", label: "Air conditioning" },
    { id: 9, slug: "private-treatment-room", label: "Private treatment room" },
  ],
  paymentMethods: [
    { id: 1, slug: "cash", label: "Cash" },
    { id: 2, slug: "card", label: "Cards accepted" },
    { id: 3, slug: "apple-pay", label: "Apple Pay" },
  ],
  languages: [
    { id: 1, slug: "ro", label: "Romanian" },
    { id: 2, slug: "en", label: "English" },
    { id: 3, slug: "fr", label: "French" },
  ],
};

/** The authored specimen, driven through the real microsite renderer. */
export function specimenData(
  locale: MicrositeLocale,
  brandColor: string,
  fontKey: string,
): PreviewData {
  return {
    businessName: "Studio Lumina",
    businessTimezone: "Europe/Bucharest",
    logo: null,
    heroImageUrl: IMG(PORTFOLIO_IDS[1], 2000),
    tagline:
      locale === "ro"
        ? "Păr, culoare și liniște, în două studiouri din București."
        : "Hair, colour and quiet, in two Bucharest studios.",
    aboutContent:
      locale === "ro"
        ? "Am deschis prima cameră deasupra florăriei din Dorobanți în 2016, cu patru scaune și o singură regulă: nimeni nu pleacă cu o tunsoare pe care nu o poate reface acasă. Opt ani mai târziu suntem două studiouri și unsprezece oameni, cu aceeași regulă."
        : "We opened the first room above the flower shop in Dorobanți in 2016 with four chairs and one rule: nobody leaves with a haircut they can't recreate at home. Eight years on we're two studios and eleven people, with the same rule.",
    establishedYear: 2016,
    businessCurrency: "RON",
    email: "buna@studio-lumina.demo",
    phone: "+40 21 000 0000",
    social: {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      tiktok: null,
      website: null,
      pinterest: null,
    },
    locations: LOCATIONS,
    faq: FAQ,
    announcement: ANNOUNCEMENT,
    brandColor,
    fontKey,
    locale,
    reviews: REVIEWS,
    teamRatings: {
      101: { rating: 4.9, count: 128 },
      102: { rating: 4.8, count: 74 },
      103: { rating: 5, count: 41 },
      104: { rating: 4.9, count: 63 },
      105: { rating: 4.7, count: 29 },
    },
    ratingDistribution: { "5": 268, "4": 34, "3": 6, "2": 1, "1": 1 },
    tagDictionaries: SPECIMEN_TAG_DICTIONARIES,
  };
}
