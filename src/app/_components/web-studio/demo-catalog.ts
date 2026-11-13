import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import type { DemoExampleId } from "./demo-examples";
import type { MicrositeLocale } from "@/features/website/i18n/translate";
import type { FaqItem, SectionEntry } from "@/features/website/types";
import { joinAboutContent } from "@/features/website/components/builder/aboutContent";
import { CARE_CATALOGS } from "./demo-catalogs/care";
import { LEARNING_CATALOGS } from "./demo-catalogs/learning";
import { CRAFT_CATALOGS } from "./demo-catalogs/craft";

export type DemoText = { en: string; ro: string };
export type DemoService = {
  name: DemoText;
  description: DemoText;
  category: number;
  duration: number;
  /** Fictional menu price in RON minor units. */
  price: number;
};
export type DemoCatalog = {
  tagline: DemoText;
  headline: DemoText;
  about: DemoText;
  sections: {
    services: { heading: DemoText; sublede: DemoText };
    gallery: { heading: DemoText };
    team: { heading: DemoText; sublede: DemoText };
    faq: { heading: DemoText };
  };
  faq: FaqItem[];
  announcement: { message: DemoText; details: DemoText };
  categories: DemoText[];
  services: DemoService[];
  bundles: { name: DemoText; description: DemoText; services: number[]; price: number }[];
  locations: { name: string; description: DemoText }[];
  team: { firstName: string; lastName: string; profileImage: string }[];
};

const CATALOGS: Record<DemoExampleId, DemoCatalog> = {
  ...CARE_CATALOGS,
  ...LEARNING_CATALOGS,
  ...CRAFT_CATALOGS,
};

/** Business-authored section copy uses the same editable fields as the dashboard. */
export function withDemoSectionCopy(layout: SectionEntry[], example: DemoExampleId): SectionEntry[] {
  const copy = CATALOGS[example].sections;
  return layout.map(entry => Object.hasOwn(copy, entry.type)
    ? { ...entry, config: { ...entry.config, ...copy[entry.type as keyof typeof copy] } }
    : entry);
}

/** Rich sample data stays in the marketing host, outside customer website data. */
export function completeDemoData(data: PreviewData, example: DemoExampleId, locale: MicrositeLocale): PreviewData {
  const catalog = CATALOGS[example];
  const primary = data.locations[0];
  const prefix = primary.id * 1000;
  const photos = [...new Map(data.locations.flatMap(location => location.portfolioImages).map(image => [image.url, image])).values()];
  const services = catalog.services.map((service, index) => ({
    id: prefix + index + 1,
    name: service.name[locale],
    description: service.description[locale],
    duration: service.duration,
    price_amount_minor: service.price,
    categoryId: prefix + 800 + service.category,
    category: { id: prefix + 800 + service.category, name: catalog.categories[service.category][locale], displayOrder: service.category + 1 },
  }));
  const bundles = catalog.bundles.map((bundle, index) => ({
    id: prefix + 500 + index,
    name: bundle.name[locale],
    description: bundle.description[locale],
    price_amount_minor: bundle.price,
    duration: bundle.services.reduce((total, service) => total + services[service].duration, 0),
    services: bundle.services.map(service => ({ name: services[service].name })),
  }));
  const team = catalog.team.map((member, index) => ({ ...member, id: prefix + 700 + index }));
  const assignments = [[0, 1, 2], [1, 3, 4], [0, 2, 4]];
  return {
    ...data,
    tagline: catalog.tagline[locale],
    aboutContent: joinAboutContent(catalog.headline[locale], catalog.about[locale]),
    faq: catalog.faq,
    announcement: { ...data.announcement, ...catalog.announcement },
    locations: catalog.locations.map((location, index) => {
      const rotated = [...photos.slice(index), ...photos.slice(0, index)];
      return {
        ...primary,
        id: primary.id + index,
        name: location.name,
        description: location.description[locale],
        address: `${location.name}, București`,
        email: `studio${index + 1}@${primary.email?.split("@")[1] ?? "demo.example.test"}`,
        portfolioImages: rotated.map(image => ({ ...image })),
        featuredImage: rotated[0]?.url ?? null,
        services: services.map(service => ({ ...service, category: { ...service.category } })),
        bundles: bundles.map(bundle => ({ ...bundle, services: bundle.services.map(service => ({ ...service })) })),
        teamMembers: assignments[index].map(member => ({ ...team[member] })),
      };
    }),
  };
}
