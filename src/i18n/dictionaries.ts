import type { Locale } from "./locales";

export type Dictionary = {
  preposition: string;
  home: {
    title: string;
    description: string;
    heading: string;
    intro: string;
  };
  category: {
    titleTemplate: string;
    descriptionTemplate: string;
    heading: string;
    body1: string;
    body2: string;
    body3: string;
    listHeading: string;
    comingSoon: string;
    otherCitiesHeading: string;
    otherIndustriesHeading: string;
  };
  blog: {
    listTitle: string;
    listDescription: string;
    listHeading: string;
    listIntro: string;
    empty: string;
    readMore: string;
    backToList: string;
  };
  breadcrumbHome: string;
  localeNames: Record<Locale, string>;
};

export const dictionaries: Record<Locale, Dictionary> = {
  ro: {
    preposition: "în",
    home: {
      title: "Zavoia — Rezervări și descoperire în România",
      description:
        "Găsește și rezervă frizerii, saloane de unghii, coafor, masaj și spa în toate orașele mari din România.",
      heading: "Zavoia — Rezervări și descoperire în România",
      intro:
        "Răsfoiește frizerii, saloane de unghii, coafor, masaj și spa în fiecare oraș mare din țară.",
    },
    category: {
      titleTemplate: "{industry} în {city}",
      descriptionTemplate:
        "Găsește și rezervă {industryLower} în {city}. Compară servicii, prețuri și disponibilitate pe Zavoia.",
      heading: "{industry} în {city}",
      body1:
        "Cauți {industryLower} în {city}? Pe Zavoia găsești și rezervi cele mai bune locuri locale — compari servicii, prețuri și disponibilitate, apoi rezervi online în câteva secunde.",
      body2:
        "Fiecare afacere listată în {city} este un business independent pe Zavoia. Disponibilitatea și prețurile sunt actualizate direct de proprietari, deci ce vezi este ce rezervi.",
      body3:
        "Vrei să compari? Zavoia acoperă {industryLower} și în alte orașe din România — vezi link-urile de mai jos.",
      listHeading: "{industry} în {city}",
      comingSoon:
        "În curând — Zavoia înregistrează acum {industryLower} din {city}.",
      otherCitiesHeading: "{industry} în alte orașe",
      otherIndustriesHeading: "Alte servicii în {city}",
    },
    blog: {
      listTitle: "Blog — Zavoia",
      listDescription:
        "Ghiduri, sfaturi și noutăți despre serviciile locale din România.",
      listHeading: "Blog",
      listIntro:
        "Ghiduri, sfaturi și noutăți despre serviciile locale din România.",
      empty: "Nu există încă articole publicate. Revino curând.",
      readMore: "Citește mai mult",
      backToList: "Înapoi la blog",
    },
    breadcrumbHome: "Acasă",
    localeNames: { ro: "Română", en: "English" },
  },
  en: {
    preposition: "in",
    home: {
      title: "Zavoia — Booking & Discovery in Romania",
      description:
        "Find and book barbers, nail salons, hair salons, massage and spa services across Romania.",
      heading: "Zavoia — Booking & Discovery in Romania",
      intro:
        "Browse barbers, nail salons, hair salons, massage and spa services in every major city.",
    },
    category: {
      titleTemplate: "{industry} in {city}",
      descriptionTemplate:
        "Find and book the best {industryLower} in {city}. Compare services, prices and availability on Zavoia.",
      heading: "{industry} in {city}",
      body1:
        "Looking for {industryLower} in {city}? Zavoia helps you discover and book trusted local spots — compare services, prices and availability, then book online in a few clicks.",
      body2:
        "Every business listed in {city} is independently operated. Availability and pricing are kept up to date by the owners themselves, so what you see is what you book.",
      body3:
        "Want to shop around? Zavoia also covers {industryLower} in other Romanian cities — see the related links below.",
      listHeading: "{industry} in {city}",
      comingSoon:
        "Businesses coming soon — Zavoia is onboarding {industryLower} in {city} now.",
      otherCitiesHeading: "{industry} in other cities",
      otherIndustriesHeading: "Other services in {city}",
    },
    blog: {
      listTitle: "Blog — Zavoia",
      listDescription:
        "Guides, tips and news about local services across Romania.",
      listHeading: "Blog",
      listIntro:
        "Guides, tips and news about local services across Romania.",
      empty: "No posts published yet. Check back soon.",
      readMore: "Read more",
      backToList: "Back to blog",
    },
    breadcrumbHome: "Home",
    localeNames: { ro: "Română", en: "English" },
  },
};

export function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}
