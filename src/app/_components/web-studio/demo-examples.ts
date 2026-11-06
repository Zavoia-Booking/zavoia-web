import type { MicrositeLocale } from "@/features/website/i18n/translate";
import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import type { FaqItem, WebsiteBuilderService } from "@/features/website/types";
import { specimenData } from "./specimen-data";

/** Fictional businesses for product exploration, never customer endorsements. */
export const DEMO_EXAMPLES = [
  { id: "beauty", label: { en: "Beauty studio", ro: "Salon de înfrumusețare" } },
  { id: "pets", label: { en: "Pet grooming", ro: "Toaletaj canin" } },
  { id: "fitness", label: { en: "Personal training", ro: "Antrenament personal" } },
  { id: "music", label: { en: "Music lessons", ro: "Lecții de muzică" } },
  { id: "wellness", label: { en: "Massage & wellness", ro: "Masaj și relaxare" } },
  { id: "automotive", label: { en: "Automotive", ro: "Auto" } },
] as const;

export type DemoExampleId = (typeof DEMO_EXAMPLES)[number]["id"];

export function isDemoExampleId(value: string | null | undefined): value is DemoExampleId {
  return DEMO_EXAMPLES.some((example) => example.id === value);
}

// Original generated scenes for fictional demos; never customer profile photos.
// Source prompts are recorded alongside the local assets.
const PHOTOS = {
  grooming: "/images/marketing/examples/pet-room.webp",
  dogBath: "/images/marketing/examples/pet-still-life.webp",
  dog: "/images/marketing/examples/pet-dog.webp",
  gym: "/images/marketing/examples/fitness-room.webp",
  training: "/images/marketing/examples/fitness-equipment.webp",
  guitar: "/images/marketing/examples/music-guitar.webp",
  piano: "/images/marketing/examples/music-piano.webp",
  musicLesson: "/images/marketing/examples/music-room.webp",
  massage: "/images/web-studio/spa/treatment-room.webp",
  relaxation: "/images/web-studio/spa/stones-and-oil.webp",
  treatmentRoom: "/images/web-studio/spa/quiet-corridor.webp",
  autoDiagnostics: "/images/marketing/examples/auto-diagnostics.webp",
  autoMaintenance: "/images/marketing/examples/auto-maintenance.webp",
  wheelChange: "/images/marketing/examples/auto-wheels.webp",
  autoWorkshop: "/images/marketing/examples/auto-workshop.webp",
  autoTools: "/images/marketing/examples/auto-tools.webp",
};

type Bilingual = { en: string; ro: string };
type ServiceCopy = {
  name: Bilingual;
  description: Bilingual;
  category: number;
  duration: number;
  price: number;
};

const PET_CATEGORIES: Bilingual[] = [
  { en: "Grooming", ro: "Toaletaj" },
  { en: "Bath & coat care", ro: "Baie și îngrijirea blănii" },
  { en: "Finishing touches", ro: "Îngrijire suplimentară" },
];

const PET_SERVICES: ServiceCopy[] = [
  { name: { en: "Full groom, small dog", ro: "Toaletaj complet, câine mic" }, description: { en: "Bath, gentle drying, haircut and a tidy finish for small breeds.", ro: "Baie, uscare delicată, tuns și finisare pentru rasele de talie mică." }, category: 0, duration: 90, price: 18000 },
  { name: { en: "Full groom, medium dog", ro: "Toaletaj complet, câine mediu" }, description: { en: "Coat consultation, bath, haircut and finishing for medium breeds.", ro: "Evaluarea blănii, baie, tuns și finisare pentru rasele de talie medie." }, category: 0, duration: 120, price: 24000 },
  { name: { en: "Puppy's first visit", ro: "Prima vizită a cățelului" }, description: { en: "A short, unhurried introduction to the grooming table, brush and dryer.", ro: "O acomodare treptată cu masa de toaletaj, peria și uscătorul." }, category: 0, duration: 45, price: 10000 },
  { name: { en: "Wash & dry", ro: "Spălat și uscat" }, description: { en: "A bath with coat-appropriate shampoo, followed by careful drying and brushing.", ro: "Baie cu șampon potrivit blănii, urmată de uscare atentă și periere." }, category: 1, duration: 60, price: 12000 },
  { name: { en: "De-shedding treatment", ro: "Tratament de îndepărtare a părului mort" }, description: { en: "A thorough bath and brush-out for shedding coats, without a haircut.", ro: "Baie și periere completă pentru îndepărtarea părului mort, fără tuns." }, category: 1, duration: 75, price: 16000 },
  { name: { en: "Nail trim & paw tidy", ro: "Tăiat unghii și îngrijirea lăbuțelor" }, description: { en: "Nail trimming and a gentle tidy around the paw pads.", ro: "Scurtarea unghiilor și îngrijirea delicată a blănii dintre pernuțe." }, category: 2, duration: 20, price: 4000 },
];

const FITNESS_CATEGORIES: Bilingual[] = [
  { en: "Personal training", ro: "Antrenament personal" },
  { en: "Movement & mobility", ro: "Mișcare și mobilitate" },
  { en: "Small-group sessions", ro: "Ședințe în grup restrâns" },
];

const FITNESS_SERVICES: ServiceCopy[] = [
  { name: { en: "First training session", ro: "Prima ședință de antrenament" }, description: { en: "Discuss your goals, explore your movement and build a practical starting plan.", ro: "Discutăm obiectivele tale, evaluăm mișcările și stabilim un plan de început." }, category: 0, duration: 60, price: 15000 },
  { name: { en: "One-to-one strength training", ro: "Antrenament individual de forță" }, description: { en: "A coached session with exercises adapted to your experience and training goals.", ro: "O ședință ghidată, cu exerciții adaptate experienței și obiectivelor tale." }, category: 0, duration: 60, price: 17000 },
  { name: { en: "Technique session", ro: "Ședință pentru tehnica exercițiilor" }, description: { en: "Focused practice for the exercises you want to perform with more confidence.", ro: "Exersăm mișcările pe care vrei să le faci cu mai multă încredere." }, category: 0, duration: 45, price: 13000 },
  { name: { en: "Mobility & movement", ro: "Mobilitate și mișcare" }, description: { en: "Controlled movement, stretching and mobility work at your own pace.", ro: "Mișcări controlate, stretching și exerciții de mobilitate, în ritmul tău." }, category: 1, duration: 45, price: 11000 },
  { name: { en: "Stretch & unwind", ro: "Stretching și relaxare" }, description: { en: "An easy-paced session to finish your training week with guided stretching.", ro: "O ședință într-un ritm lejer, pentru a încheia săptămâna cu stretching ghidat." }, category: 1, duration: 30, price: 8000 },
  { name: { en: "Strength in a small group", ro: "Forță în grup restrâns" }, description: { en: "A coached strength session for up to four people, with individual exercise adjustments.", ro: "Antrenament de forță pentru maximum patru persoane, cu exerciții adaptate individual." }, category: 2, duration: 60, price: 9000 },
];

const MUSIC_CATEGORIES: Bilingual[] = [
  { en: "Guitar", ro: "Chitară" },
  { en: "Piano", ro: "Pian" },
  { en: "Voice", ro: "Canto" },
  { en: "Music theory", ro: "Teorie muzicală" },
];

const MUSIC_SERVICES: ServiceCopy[] = [
  { name: { en: "Your first guitar lesson", ro: "Prima lecție de chitară" }, description: { en: "Get comfortable with the instrument, try your first chords and find a starting point.", ro: "Te familiarizezi cu instrumentul, încerci primele acorduri și alegem de unde să începi." }, category: 0, duration: 30, price: 9000 },
  { name: { en: "One-to-one guitar lesson", ro: "Lecție individuală de chitară" }, description: { en: "Work on a song, technique or rhythm with guidance at your own pace.", ro: "Lucrezi la o piesă, la tehnică sau la ritm, cu îndrumare în ritmul tău." }, category: 0, duration: 45, price: 13000 },
  { name: { en: "One-to-one piano lesson", ro: "Lecție individuală de pian" }, description: { en: "Build confidence at the keys with exercises and music suited to your experience.", ro: "Capeți încredere la clape, cu exerciții și piese potrivite experienței tale." }, category: 1, duration: 45, price: 14000 },
  { name: { en: "Voice lesson", ro: "Lecție de canto" }, description: { en: "Explore breathing, warm-ups and a song you would like to sing.", ro: "Exersezi respirația, încălzirea vocii și o piesă pe care îți dorești să o cânți." }, category: 2, duration: 45, price: 14000 },
  { name: { en: "Music theory, made practical", ro: "Teorie muzicală aplicată" }, description: { en: "Make sense of notes, rhythm and harmony through the music you are learning.", ro: "Înțelegi notele, ritmul și armonia prin piesele pe care le înveți." }, category: 3, duration: 30, price: 9000 },
];

const WELLNESS_CATEGORIES: Bilingual[] = [
  { en: "Massage", ro: "Masaj" },
  { en: "Time to unwind", ro: "Timp pentru relaxare" },
];

const WELLNESS_SERVICES: ServiceCopy[] = [
  { name: { en: "Relaxation massage", ro: "Masaj de relaxare" }, description: { en: "A full-body massage with unhurried movements and pressure chosen with you.", ro: "Masaj pentru întregul corp, cu mișcări lente și presiune aleasă împreună cu tine." }, category: 0, duration: 60, price: 22000 },
  { name: { en: "Back, neck & shoulders", ro: "Spate, ceafă și umeri" }, description: { en: "A shorter massage focused on your back, neck and shoulders.", ro: "O ședință mai scurtă, dedicată spatelui, cefei și umerilor." }, category: 0, duration: 30, price: 13000 },
  { name: { en: "Aromatherapy massage", ro: "Masaj cu uleiuri aromatice" }, description: { en: "A gentle massage with an aromatic oil selected before your session.", ro: "Un masaj blând, cu un ulei aromatic ales înainte de ședință." }, category: 0, duration: 75, price: 27000 },
  { name: { en: "Scalp & face relaxation", ro: "Relaxare pentru scalp și față" }, description: { en: "Gentle hands-on care for your scalp, face and jaw, at an easy pace.", ro: "Mișcări delicate pentru scalp, față și maxilar, într-un ritm liniștit." }, category: 1, duration: 30, price: 12000 },
  { name: { en: "A longer pause", ro: "O pauză mai lungă" }, description: { en: "A longer full-body massage, with time to settle in and choose the areas you want us to focus on.", ro: "Un masaj prelungit pentru întregul corp, cu timp pentru acomodare și pentru zonele pe care vrei să ne concentrăm." }, category: 1, duration: 90, price: 30000 },
];

const AUTOMOTIVE_CATEGORIES: Bilingual[] = [
  { en: "Maintenance", ro: "Întreținere" },
  { en: "Diagnostics & checks", ro: "Diagnoză și verificări" },
  { en: "Wheels & tyres", ro: "Roți și anvelope" },
];

const AUTOMOTIVE_SERVICES: ServiceCopy[] = [
  { name: { en: "Oil & filter change", ro: "Schimb ulei și filtre" }, description: { en: "Labour for an oil and filter change. We confirm the correct parts and their separate cost for your car before work begins.", ro: "Manoperă pentru schimbul de ulei și filtre. Confirmăm piesele potrivite mașinii tale și costul lor separat înainte de a începe." }, category: 0, duration: 60, price: 15000 },
  { name: { en: "Battery check", ro: "Verificare baterie" }, description: { en: "Test the battery and charging system, then discuss the readings and any next steps.", ro: "Testăm bateria și sistemul de încărcare, apoi discutăm rezultatele și eventualii pași următori." }, category: 0, duration: 30, price: 8000 },
  { name: { en: "Electronic diagnostics", ro: "Diagnoză electronică" }, description: { en: "Read fault codes and investigate the symptoms you describe. Any repair is quoted separately after the check.", ro: "Citim codurile de eroare și verificăm simptomele pe care ni le descrii. Orice reparație se ofertează separat, după verificare." }, category: 1, duration: 45, price: 18000 },
  { name: { en: "Brake inspection", ro: "Verificare sistem de frânare" }, description: { en: "Check the condition of the brake pads, discs and visible components, with findings explained before any further work.", ro: "Verificăm starea plăcuțelor, discurilor și componentelor vizibile. Îți explicăm constatările înainte de orice lucrare suplimentară." }, category: 1, duration: 45, price: 12000 },
  { name: { en: "Seasonal wheel change", ro: "Schimb sezonier de roți" }, description: { en: "Swap a set of four wheels with tyres already fitted, check pressure and tighten the wheel fixings.", ro: "Schimbăm un set de patru roți cu anvelopele deja montate, verificăm presiunea și strângerea prezoanelor." }, category: 2, duration: 45, price: 12000 },
  { name: { en: "Tyre fitting & balancing", ro: "Montaj și echilibrare anvelope" }, description: { en: "Fit and balance four tyres. Confirm wheel dimensions when booking; tyres and replacement valves are charged separately.", ro: "Montăm și echilibrăm patru anvelope. Confirmă dimensiunea roților la programare; anvelopele și valvele înlocuite se plătesc separat." }, category: 2, duration: 60, price: 20000 },
];

function servicesFor(locale: MicrositeLocale, categories: Bilingual[], copies: ServiceCopy[], prefix: number): WebsiteBuilderService[] {
  return copies.map((service, index) => ({
    id: prefix + index,
    name: service.name[locale],
    description: service.description[locale],
    duration: service.duration,
    price_amount_minor: service.price,
    categoryId: prefix + service.category,
    category: { id: prefix + service.category, name: categories[service.category][locale], displayOrder: service.category + 1 },
  }));
}

const PET_FAQ: FaqItem[] = [
  { q: { en: "What should I book for my dog's first visit?", ro: "Ce aleg pentru prima vizită a câinelui meu?" }, a: { en: "Choose a full groom for an adult dog or Puppy's first visit for a gentle introduction. Tell us about their coat and previous grooming experience when booking.", ro: "Alege un toaletaj complet pentru un câine adult sau Prima vizită a cățelului pentru acomodare. Spune-ne la programare ce tip de blană are și dacă a mai fost la toaletaj." } },
  { q: { en: "Can I choose the groomer?", ro: "Pot alege persoana care se ocupă de câinele meu?" }, a: { en: "Yes. Choose an available member of our team when you book your appointment.", ro: "Da. Alegi un membru disponibil al echipei când faci programarea." } },
  { q: { en: "Do I need to bring anything?", ro: "Trebuie să aduc ceva?" }, a: { en: "Bring a lead and let us know about any sensitivities before the visit. A favourite treat can help your dog settle in.", ro: "Adu lesa și anunță-ne înainte de vizită dacă există sensibilități. O recompensă preferată poate ajuta câinele să se acomodeze." } },
];

const FITNESS_FAQ: FaqItem[] = [
  { q: { en: "Can I start if I haven't trained before?", ro: "Pot începe dacă nu m-am mai antrenat?" }, a: { en: "Yes. First training session gives us time to discuss your goals and choose exercises suited to your current experience.", ro: "Da. Prima ședință ne oferă timp să discutăm obiectivele tale și să alegem exerciții potrivite experienței tale." } },
  { q: { en: "What should I bring?", ro: "Ce trebuie să aduc?" }, a: { en: "Comfortable training clothes, clean indoor shoes, a towel and a water bottle. We provide the training equipment.", ro: "Haine comode pentru sport, încălțăminte curată de interior, un prosop și apă. Echipamentul pentru exerciții este disponibil în studio." } },
  { q: { en: "Can I book with the same trainer?", ro: "Mă pot programa la același antrenor?" }, a: { en: "Choose your trainer when booking and pick one of their available times.", ro: "Alegi antrenorul la programare, apoi selectezi una dintre orele sale disponibile." } },
];

const MUSIC_FAQ: FaqItem[] = [
  { q: { en: "Can I book if I have never played before?", ro: "Mă pot programa dacă nu am mai cântat?" }, a: { en: "Yes. Tell us you are a beginner when you book. Your first lesson starts with the basics and time to get comfortable with the instrument.", ro: "Da. Spune-ne la programare că ești începător. Prima lecție începe cu noțiunile de bază și cu timp pentru acomodarea cu instrumentul." } },
  { q: { en: "Do I need to bring an instrument?", ro: "Trebuie să aduc un instrument?" }, a: { en: "You can bring your guitar if you have one. For a first visit, let us know beforehand if you need to use a studio instrument. Piano lessons use the studio piano.", ro: "Poți aduce chitara ta, dacă ai una. Pentru prima vizită, anunță-ne din timp dacă ai nevoie de un instrument din studio. Lecțiile de pian se desfășoară la pianul studioului." } },
  { q: { en: "Can I choose the same teacher each time?", ro: "Pot alege același profesor de fiecare dată?" }, a: { en: "Choose your teacher when booking, then select one of their available lesson times.", ro: "Alegi profesorul când faci programarea, apoi selectezi una dintre orele sale disponibile." } },
];

const WELLNESS_FAQ: FaqItem[] = [
  { q: { en: "What should I choose for my first visit?", ro: "Ce aleg pentru prima vizită?" }, a: { en: "Relaxation massage is a good starting point. Before your session, we discuss your preferences, the pressure you enjoy and any areas you would like us to avoid.", ro: "Poți începe cu masajul de relaxare. Înainte de ședință discutăm preferințele tale, presiunea potrivită și zonele pe care vrei să le evităm." } },
  { q: { en: "How early should I arrive?", ro: "Cu cât timp înainte trebuie să ajung?" }, a: { en: "Please arrive ten minutes before your appointment so you have time to get comfortable. Towels and everything needed for your session are provided.", ro: "Te așteptăm cu zece minute înainte, ca să ai timp să te acomodezi. Îți oferim prosoape și tot ce este necesar pentru ședință." } },
  { q: { en: "Can I book with the same person?", ro: "Mă pot programa la aceeași persoană?" }, a: { en: "Yes. Choose a member of our team when booking, then select one of their available times.", ro: "Da. Alegi un membru al echipei când faci programarea, apoi selectezi una dintre orele sale disponibile." } },
];

const AUTOMOTIVE_FAQ: FaqItem[] = [
  { q: { en: "What information should I include when booking?", ro: "Ce informații sunt utile la programare?" }, a: { en: "Tell us the make, model and year of your car, along with the service you need or the symptoms you have noticed. For tyres, include the wheel dimensions.", ro: "Spune-ne marca, modelul și anul mașinii, serviciul dorit sau simptomele pe care le-ai observat. Pentru anvelope, adaugă și dimensiunea roților." } },
  { q: { en: "Are parts included in the listed prices?", ro: "Piesele sunt incluse în prețurile afișate?" }, a: { en: "The listed prices cover the described labour or inspection. We confirm any parts, oil or additional work and their cost with you before proceeding.", ro: "Prețurile afișate acoperă manopera sau verificarea descrisă. Confirmăm cu tine costul pieselor, uleiului și oricărei lucrări suplimentare înainte de a continua." } },
  { q: { en: "Can I book a check before deciding on a repair?", ro: "Pot programa o verificare înainte de a decide reparația?" }, a: { en: "Yes. Choose a diagnostic or inspection appointment. We explain what we find and discuss the proposed work before booking any repair.", ro: "Da. Alegi o programare pentru diagnoză sau verificare. Îți explicăm ce am constatat și discutăm lucrările propuse înainte de a programa reparația." } },
];

/** A separate authored music-school example; it does not inherit salon content. */
function musicData(base: PreviewData, locale: MicrositeLocale): PreviewData {
  const services = servicesFor(locale, MUSIC_CATEGORIES, MUSIC_SERVICES, 400);
  const about: Bilingual = {
    en: "A small music studio in Domenii for curious beginners and returning players. Choose guitar, piano or voice, meet your teacher and work on music you enjoy. Individual lessons leave room for questions, practice and your own pace.",
    ro: "Un mic studio de muzică în Domenii, pentru începători curioși și pentru cei care revin la un instrument. Alegi chitara, pianul sau canto, îți cunoști profesorul și lucrezi la muzica pe care o îndrăgești. Lecțiile individuale lasă timp pentru întrebări, exercițiu și ritmul tău.",
  };
  const location = {
    ...base.locations[0],
    id: 401,
    name: "Domenii",
    description: about[locale],
    phone: null,
    email: "hello@tempo-music.example.test",
    address: "Domenii, București",
    addressComponents: { city: "București", country: "România" },
    workingHours: {
      monday: { open: "12:00", close: "20:00", isOpen: true },
      tuesday: { open: "12:00", close: "20:00", isOpen: true },
      wednesday: { open: "12:00", close: "20:00", isOpen: true },
      thursday: { open: "12:00", close: "20:00", isOpen: true },
      friday: { open: "12:00", close: "20:00", isOpen: true },
      saturday: { open: "10:00", close: "16:00", isOpen: true },
      sunday: { open: null, close: null, isOpen: false },
    },
    portfolioImages: [PHOTOS.guitar, PHOTOS.piano, PHOTOS.musicLesson].map((url, index) => ({ url, key: `demo-music-${index}`, originalName: `music-${index}.jpg` })),
    featuredImage: PHOTOS.guitar,
    averageRating: null,
    totalReviews: 0,
    amenityTagIds: [],
    paymentMethodTagIds: [1, 2],
    languageTagIds: [1, 2],
    services,
    bundles: [],
    teamMembers: [
      { id: 401, firstName: "Alex", lastName: "Marin", profileImage: null },
      { id: 402, firstName: "Irina", lastName: "Dobre", profileImage: null },
      { id: 403, firstName: "Vlad", lastName: "Popescu", profileImage: null },
    ],
  };
  return {
    ...base,
    businessName: "Tempo Music",
    heroImageUrl: PHOTOS.guitar,
    tagline: locale === "ro" ? "Lecții de muzică. În ritmul tău." : "Music lessons. At your own tempo.",
    aboutContent: about[locale],
    establishedYear: null,
    email: location.email,
    phone: "",
    social: {},
    locations: [location],
    faq: MUSIC_FAQ,
    announcement: {
      message: { en: "Make time for your first lesson", ro: "Fă loc primei lecții" },
      details: { en: "Choose your instrument and book a lesson with one of our teachers. Beginners are welcome.", ro: "Alegi instrumentul și programezi o lecție cu unul dintre profesorii noștri. Începătorii sunt bineveniți." },
      cta: { enabled: false, label: { en: "", ro: "" }, url: "", newTab: false, showArrow: true },
      schedule: null,
    },
    reviews: [],
    teamRatings: {},
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}

/** An authored wellness studio with its own services, people, photos and copy. */
function wellnessData(base: PreviewData, locale: MicrositeLocale): PreviewData {
  const services = servicesFor(locale, WELLNESS_CATEGORIES, WELLNESS_SERVICES, 500);
  const about: Bilingual = {
    en: "A quiet massage studio in Aviatorilor, with space to step out of the rush. Choose a short pause for your shoulders or a longer full-body session. We start by listening, agree on the pressure and give each appointment its own time.",
    ro: "Un studio de masaj liniștit în Aviatorilor, unde poți lăsa graba deoparte. Alegi o pauză scurtă pentru umeri sau o ședință mai lungă pentru întregul corp. Începem prin a te asculta, stabilim presiunea potrivită și acordăm fiecărei programări timpul ei.",
  };
  const photos = [PHOTOS.massage, PHOTOS.treatmentRoom, PHOTOS.relaxation];
  const location: PreviewData["locations"][number] = {
    id: 501,
    name: "Aviatorilor",
    description: about[locale],
    phone: null,
    email: "hello@serein-studio.example.test",
    address: "Aviatorilor, București",
    addressComponents: { city: "București", country: "România" },
    timezone: "Europe/Bucharest",
    open247: false,
    allowOnlineBooking: true,
    workingHours: {
      monday: { open: "10:00", close: "20:00", isOpen: true },
      tuesday: { open: "10:00", close: "20:00", isOpen: true },
      wednesday: { open: "10:00", close: "20:00", isOpen: true },
      thursday: { open: "10:00", close: "20:00", isOpen: true },
      friday: { open: "10:00", close: "20:00", isOpen: true },
      saturday: { open: "10:00", close: "17:00", isOpen: true },
      sunday: { open: null, close: null, isOpen: false },
    },
    portfolioImages: photos.map((url, index) => ({ url, key: `demo-wellness-${index}`, originalName: `wellness-${index}.jpg` })),
    featuredImage: PHOTOS.massage,
    averageRating: null,
    totalReviews: 0,
    amenityTagIds: [9],
    paymentMethodTagIds: [1, 2],
    languageTagIds: [1, 2],
    services,
    bundles: [],
    teamMembers: [
      { id: 501, firstName: "Elena", lastName: "Radu", profileImage: null },
      { id: 502, firstName: "Mihai", lastName: "Dobre", profileImage: null },
    ],
  };
  return {
    ...base,
    businessName: "Serein Studio",
    logo: null,
    heroImageUrl: PHOTOS.massage,
    tagline: locale === "ro" ? "Masaj și relaxare. Timp doar pentru tine." : "Massage and relaxation. Time just for you.",
    aboutContent: about[locale],
    establishedYear: null,
    email: location.email!,
    phone: "",
    social: {},
    locations: [location],
    faq: WELLNESS_FAQ,
    announcement: {
      message: { en: "Make a little room for yourself", ro: "Fă-ți puțin timp pentru tine" },
      details: { en: "Explore our massage sessions, meet the team and choose a time that fits your day.", ro: "Descoperi ședințele de masaj, cunoști echipa și alegi o oră potrivită pentru ziua ta." },
      cta: { enabled: false, label: { en: "", ro: "" }, url: "", newTab: false, showArrow: true },
      schedule: null,
    },
    reviews: [],
    teamRatings: {},
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}

/** An independent garage example, with no salon services or invented endorsements. */
function automotiveData(base: PreviewData, locale: MicrositeLocale): PreviewData {
  const services = servicesFor(locale, AUTOMOTIVE_CATEGORIES, AUTOMOTIVE_SERVICES, 600);
  const about: Bilingual = {
    en: "An independent workshop in Băneasa for everyday maintenance, diagnostics and seasonal tyre changes. Choose the service you need and a time that suits you. We explain what we find and agree on the work and costs before getting started.",
    ro: "Un atelier auto independent în Băneasa, pentru întreținere, diagnoză și schimburi sezoniere de anvelope. Alegi serviciul de care ai nevoie și o oră potrivită. Îți explicăm ce am constatat și stabilim împreună lucrările și costurile înainte de a începe.",
  };
  const photos = [PHOTOS.autoDiagnostics, PHOTOS.autoMaintenance, PHOTOS.wheelChange, PHOTOS.autoWorkshop, PHOTOS.autoTools];
  const location: PreviewData["locations"][number] = {
    id: 601,
    name: "Băneasa",
    description: about[locale],
    phone: null,
    email: "hello@nord-auto.example.test",
    address: "Băneasa, București",
    addressComponents: { city: "București", country: "România" },
    timezone: "Europe/Bucharest",
    open247: false,
    allowOnlineBooking: true,
    workingHours: {
      monday: { open: "08:00", close: "18:00", isOpen: true },
      tuesday: { open: "08:00", close: "18:00", isOpen: true },
      wednesday: { open: "08:00", close: "18:00", isOpen: true },
      thursday: { open: "08:00", close: "18:00", isOpen: true },
      friday: { open: "08:00", close: "18:00", isOpen: true },
      saturday: { open: "09:00", close: "14:00", isOpen: true },
      sunday: { open: null, close: null, isOpen: false },
    },
    portfolioImages: photos.map((url, index) => ({ url, key: `demo-automotive-${index}`, originalName: `automotive-${index}.jpg` })),
    featuredImage: PHOTOS.autoDiagnostics,
    averageRating: null,
    totalReviews: 0,
    amenityTagIds: [],
    paymentMethodTagIds: [1, 2],
    languageTagIds: [1, 2],
    services,
    bundles: [],
    teamMembers: [
      { id: 601, firstName: "Radu", lastName: "Ionescu", profileImage: null },
      { id: 602, firstName: "Vlad", lastName: "Petrescu", profileImage: null },
    ],
  };
  return {
    ...base,
    businessName: "Nord Auto",
    logo: null,
    heroImageUrl: PHOTOS.autoDiagnostics,
    tagline: locale === "ro" ? "Întreținere și diagnoză. Cu programare." : "Maintenance and diagnostics. By appointment.",
    aboutContent: about[locale],
    establishedYear: null,
    email: location.email!,
    phone: "",
    social: {},
    locations: [location],
    faq: AUTOMOTIVE_FAQ,
    announcement: {
      message: { en: "Make time for your next service", ro: "Programează următoarea vizită la service" },
      details: { en: "Explore maintenance, diagnostics and tyre services, then choose an available time for your car.", ro: "Descoperi serviciile de întreținere, diagnoză și anvelope, apoi alegi o oră disponibilă pentru mașina ta." },
      cta: { enabled: false, label: { en: "", ro: "" }, url: "", newTab: false, showArrow: true },
      schedule: null,
    },
    reviews: [],
    teamRatings: {},
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}

/**
 * All sample content travels together when changing industry. These examples
 * intentionally have no customer quotes or rating totals; a demonstration must
 * not suggest that a fictional business has real customer endorsements.
 */
export function demoExampleData(
  locale: MicrositeLocale,
  brandColor: string,
  fontKey: string,
  exampleId: DemoExampleId = "beauty",
): PreviewData {
  const base = specimenData(locale, brandColor, fontKey);
  if (exampleId === "beauty") return base;
  if (exampleId === "music") return musicData(base, locale);
  if (exampleId === "wellness") return wellnessData(base, locale);
  if (exampleId === "automotive") return automotiveData(base, locale);

  const pets = exampleId === "pets";
  const services = servicesFor(locale, pets ? PET_CATEGORIES : FITNESS_CATEGORIES, pets ? PET_SERVICES : FITNESS_SERVICES, pets ? 200 : 300);
  const name = pets ? "Paw & Co" : "Forma Studio";
  const photos = pets ? [PHOTOS.dog, PHOTOS.grooming, PHOTOS.dogBath] : [PHOTOS.gym, PHOTOS.training];
  const locationName = pets ? "Cotroceni" : "Tineretului";
  const team = pets
    ? [{ id: 201, firstName: "Mara", lastName: "Ionescu", profileImage: null }, { id: 202, firstName: "Alex", lastName: "Dumitrescu", profileImage: null }]
    : [{ id: 301, firstName: "Andrei", lastName: "Popa", profileImage: null }, { id: 302, firstName: "Diana", lastName: "Stan", profileImage: null }, { id: 303, firstName: "Radu", lastName: "Marin", profileImage: null }];
  const tagline: Bilingual = pets
    ? { en: "Thoughtful grooming, from the first bath to the finishing touch.", ro: "Toaletaj cu grijă, de la prima baie până la ultimul retuș." }
    : { en: "Personal training. A plan that fits your pace.", ro: "Antrenament personal. Un plan în ritmul tău." };
  const about: Bilingual = pets
    ? { en: "A calm grooming studio in Cotroceni, with time to get to know your dog. We plan each visit around their coat, comfort and everyday care, from a quick paw tidy to a full groom.", ro: "Un studio de toaletaj liniștit în Cotroceni, unde avem timp să îți cunoaștem câinele. Adaptăm fiecare vizită blănii, confortului și îngrijirii sale, de la lăbuțe până la un toaletaj complet." }
    : { en: "A neighbourhood training studio in Tineretului for people who want a clear plan and personal guidance. We work on strength, movement and confidence, one well-paced session at a time.", ro: "Un studio de antrenament în Tineretului, pentru cei care își doresc un plan clar și îndrumare personală. Lucrăm la forță, mișcare și încredere, cu fiecare ședință în ritmul potrivit." };

  const location = {
    ...base.locations[0],
    id: pets ? 201 : 301,
    name: locationName,
    description: about[locale],
    phone: null,
    email: pets ? "hello@paw-and-co.example.test" : "hello@forma-studio.example.test",
    address: pets ? "Cotroceni, București" : "Tineretului, București",
    addressComponents: { city: "București", country: "România" },
    workingHours: pets ? base.locations[0].workingHours : {
      monday: { open: "07:00", close: "21:00", isOpen: true },
      tuesday: { open: "07:00", close: "21:00", isOpen: true },
      wednesday: { open: "07:00", close: "21:00", isOpen: true },
      thursday: { open: "07:00", close: "21:00", isOpen: true },
      friday: { open: "07:00", close: "21:00", isOpen: true },
      saturday: { open: "09:00", close: "15:00", isOpen: true },
      sunday: { open: null, close: null, isOpen: false },
    },
    portfolioImages: photos.map((url, index) => ({ url, key: `demo-${exampleId}-${index}`, originalName: `${exampleId}-${index}.jpg` })),
    featuredImage: photos[0],
    averageRating: null,
    totalReviews: 0,
    amenityTagIds: [1, 4],
    paymentMethodTagIds: [1, 2],
    languageTagIds: [1, 2],
    services,
    bundles: [{
      id: pets ? 201 : 301,
      name: pets ? (locale === "ro" ? "Baie și lăbuțe" : "Bath & paws") : (locale === "ro" ? "Forță și mobilitate" : "Strength & mobility"),
      description: pets ? (locale === "ro" ? "Spălat, uscat și îngrijirea lăbuțelor, într-o singură vizită." : "Wash, dry and paw care in one visit.") : (locale === "ro" ? "Antrenament individual urmat de o ședință de mobilitate." : "One-to-one training followed by a mobility session."),
      duration: pets ? 80 : 105,
      price_amount_minor: pets ? 15000 : 25000,
      services: pets ? [services[3], services[5]].map((service) => ({ name: service.name })) : [services[1], services[3]].map((service) => ({ name: service.name })),
    }],
    teamMembers: team,
  };

  return {
    ...base,
    businessName: name,
    heroImageUrl: photos[0],
    tagline: tagline[locale],
    aboutContent: about[locale],
    establishedYear: null,
    email: location.email,
    phone: "",
    social: {},
    locations: [location],
    faq: pets ? PET_FAQ : FITNESS_FAQ,
    announcement: {
      message: pets ? { en: "A gentler first visit for your puppy", ro: "O primă vizită mai blândă pentru cățelul tău" } : { en: "Start with a session that gets to know you", ro: "Începe cu o ședință în care ne cunoaștem" },
      details: pets ? { en: "Our puppy introduction makes room for breaks, new sounds and plenty of reassurance. Choose Puppy's first visit from the service menu.", ro: "Vizita de acomodare lasă timp pentru pauze, sunete noi și încurajări. Alege Prima vizită a cățelului din lista de servicii." } : { en: "Tell us what you want to work towards. Your first session combines a conversation with coached movement and a practical next step.", ro: "Spune-ne care sunt obiectivele tale. Prima ședință combină o discuție cu mișcare ghidată și un plan pentru următorul pas." },
      cta: { enabled: false, label: { en: "", ro: "" }, url: "", newTab: false, showArrow: true },
      schedule: null,
    },
    reviews: [],
    teamRatings: {},
    ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}
