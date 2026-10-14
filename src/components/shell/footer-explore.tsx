import "server-only";

import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { listTaxonomy } from "@/data/seo";
import { getIndustries } from "@/lib/api/marketplace/public";
import { LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { FooterExploreLinks, type FooterCategory } from "./footer-explore-links";

// Preserve the six service intents from the original footer. Resolve their
// URLs against the same live taxonomy as the landing pages; never guess tag IDs.
const CATEGORIES = [
  { id: "hair-salon", kind: "tag", label: "catHair" },
  { id: "nail-salon", kind: "tag", label: "catNails" },
  { id: "massage-studio", kind: "tag", label: "catMassage" },
  { id: "dental-clinic", kind: "tag", label: "catDental" },
  { id: "automotive", kind: "industry", label: "catAuto" },
  { id: "cleaning", kind: "tag", label: "catCleaning" },
] as const;

export async function FooterExplore({ locale }: { locale: Locale }) {
  let categories: FooterCategory[] = [];
  try {
    const industries = await getIndustries({
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [TAXONOMY_TAG],
    });
    const taxonomy = listTaxonomy(industries, locale);
    categories = CATEGORIES.flatMap((category) => {
      const entry = taxonomy.find((item) =>
        item.id === category.id && item.kind === category.kind,
      );
      return entry ? [{
        id: entry.id, slug: entry.slug,
        label: dictionaries[locale].footer[category.label],
      }] : [];
    });
  } catch {
    // Optional navigation must not turn a taxonomy outage into an error on
    // unrelated routes. The regular Explore link remains usable.
  }

  return <FooterExploreLinks locale={locale} categories={categories} />;
}
