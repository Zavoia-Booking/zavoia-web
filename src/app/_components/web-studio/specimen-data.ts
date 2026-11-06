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
 * customer. Every name, price and hour below is authored so the Web
 * Studio showcase and design demo can drive the actual microsite renderer.
 * The page identifies these examples as demonstrations, not customer sites.
 * Photography is generated for these examples, with no people or external
 * reference images. It is not a default for customer-uploaded business content.
 */

const PORTFOLIO_IMAGES = [
  "/images/marketing/examples/beauty-room.webp",
  "/images/marketing/examples/beauty-chair.webp",
  "/images/marketing/examples/beauty-tools.webp",
  "/images/web-studio/spa/treatment-room.webp",
  "/images/web-studio/spa/stones-and-oil.webp",
  "/images/web-studio/spa/quiet-corridor.webp",
  "/images/web-studio/spa/linen-and-tea.webp",
  "/images/web-studio/spa/stone-basin.webp",
];

const portfolio = (from: number, count: number) =>
  PORTFOLIO_IMAGES.slice(from, from + count).map((url, i) => ({
    url,
    key: `specimen/image-${from + i}`,
    originalName: url.split("/").pop() ?? "demo.webp",
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
    phone: null,
    email: "dorobanti@studio-lumina.example.test",
    address: "Dorobanți, București",
    addressComponents: {
      city: "București",
      country: "România",
    },
    timezone: "Europe/Bucharest",
    workingHours: HOURS,
    open247: false,
    allowOnlineBooking: true,
    portfolioImages: portfolio(0, 5),
    featuredImage: PORTFOLIO_IMAGES[0],
    averageRating: null,
    totalReviews: 0,
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
    phone: null,
    email: "cotroceni@studio-lumina.example.test",
    address: "Cotroceni, București",
    addressComponents: {
      city: "București",
      country: "România",
    },
    timezone: "Europe/Bucharest",
    workingHours: { ...HOURS, monday: CLOSED },
    open247: false,
    allowOnlineBooking: true,
    portfolioImages: portfolio(5, 3),
    featuredImage: PORTFOLIO_IMAGES[5],
    averageRating: null,
    totalReviews: 0,
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
    ro: "Pachetul de culoare în ianuarie — trei retușuri, programate din timp",
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

/** Matches the ids referenced by the specimen locations' tag arrays. */
const SPECIMEN_TAG_DICTIONARIES: ResolvedTagDictionaries = {
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

/** Authored translations for the demo only; real merchant content stays untouched. */
const RO_SERVICE_COPY: Record<number, { name: string; description: string }> = {
  1: { name: "Tuns și coafat", description: "Consultație, spălat, tuns de precizie și o coafură pe care o poți recrea acasă." },
  2: { name: "Schimbare de look", description: "O schimbare completă de formă, cu mai mult timp pentru consultare și o a doua opinie." },
  3: { name: "Retuș de breton", description: "Între programări, din partea casei pentru clientele fidele." },
  4: { name: "Luciu și nuanțare", description: "Reîmprospătează culoarea și închide cuticula. Rezultatul durează între patru și șase săptămâni." },
  5: { name: "Balayage complet", description: "Șuvițe pictate manual, nuanțate după tenul tău. Include coafarea finală." },
  6: { name: "Retuș de rădăcină", description: "Vopsire într-o singură etapă, doar pe rădăcinile crescute." },
  7: { name: "Tratament facial personalizat", description: "Curățare, exfoliere enzimatică, masaj și o mască aleasă în ziua vizitei." },
  8: { name: "Stilizare sprâncene", description: "Conturare, epilare și vopsire adaptate trăsăturilor tale." },
};

const RO_CATEGORY_NAMES: Record<number, string> = { 1: "Păr", 2: "Culoare", 3: "Îngrijire facială" };
const RO_BUNDLE_COPY: Record<number, { name: string; description: string }> = {
  1: { name: "Ritual complet", description: "Tuns, nuanțare și un tratament facial personalizat, într-o singură după-amiază." },
  2: { name: "Pachet de culoare", description: "Trei retușuri de rădăcină, programate din timp, la prețul a două și jumătate." },
};
const RO_LOCATION_DESCRIPTIONS: Record<number, string> = {
  1: "Primul nostru salon, deasupra florăriei. Patru scaune, ferestre înalte și cafea bună.",
  2: "Un studio mai liniștit, cu două scaune, în cartierul vechi. Aici ne dedicăm culorii și programărilor mai lungi.",
};
const RO_TAG_DICTIONARIES: ResolvedTagDictionaries = {
  amenities: [
    { id: 1, slug: "wifi", label: "Wi-Fi gratuit" },
    { id: 2, slug: "parking-onsite", label: "Parcare proprie" },
    { id: 3, slug: "parking-street", label: "Parcare pe stradă în apropiere" },
    { id: 4, slug: "air-conditioning", label: "Aer condiționat" },
    { id: 9, slug: "private-treatment-room", label: "Cameră privată pentru tratamente" },
  ],
  paymentMethods: [
    { id: 1, slug: "cash", label: "Numerar" },
    { id: 2, slug: "card", label: "Plată cu cardul" },
    { id: 3, slug: "apple-pay", label: "Apple Pay" },
  ],
  languages: [
    { id: 1, slug: "ro", label: "Română" },
    { id: 2, slug: "en", label: "Engleză" },
    { id: 3, slug: "fr", label: "Franceză" },
  ],
};

function localizedLocations(locale: MicrositeLocale): WebsiteBuilderLocation[] {
  if (locale !== "ro") return LOCATIONS;
  const serviceNames = new Map(SERVICES.map(service => [service.name, RO_SERVICE_COPY[service.id].name]));
  return LOCATIONS.map(location => ({
    ...location,
    description: RO_LOCATION_DESCRIPTIONS[location.id],
    services: location.services.map(service => ({
      ...service,
      ...RO_SERVICE_COPY[service.id],
      category: service.category && { ...service.category, name: RO_CATEGORY_NAMES[service.category.id] },
    })),
    bundles: location.bundles.map(bundle => ({
      ...bundle,
      ...RO_BUNDLE_COPY[bundle.id],
      services: bundle.services?.map(service => ({
        ...service,
        name: service.name ? serviceNames.get(service.name) ?? service.name : service.name,
      })),
    })),
  }));
}

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
    heroImageUrl: PORTFOLIO_IMAGES[0],
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
    email: "hello@studio-lumina.example.test",
    phone: "",
    social: {},
    locations: localizedLocations(locale),
    faq: FAQ,
    announcement: ANNOUNCEMENT,
    brandColor,
    fontKey,
    locale,
    reviews: [],
    teamRatings: {},
    ratingDistribution: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
    tagDictionaries: locale === "ro" ? RO_TAG_DICTIONARIES : SPECIMEN_TAG_DICTIONARIES,
  };
}
