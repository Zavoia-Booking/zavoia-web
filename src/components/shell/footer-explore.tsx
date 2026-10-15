import "server-only";

import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { listTaxonomy } from "@/data/seo";
import { getIndustries } from "@/lib/api/marketplace/public";
import { LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { currentDaySeed, industryTeaserChips } from "@/lib/marketplace/industry-teaser";
import { FooterExploreLinks, type FooterCategory } from "./footer-explore-links";

export async function FooterExplore({ locale }: { locale: Locale }) {
  let categories: FooterCategory[] = [];
  try {
    const industries = await getIndustries({
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [TAXONOMY_TAG],
    });
    const taxonomy = listTaxonomy(industries, locale);
    // Use the app/map's representative service per industry and daily order.
    // Resolve the order on the server, then hydrate those exact links unchanged.
    categories = industryTeaserChips(industries, currentDaySeed())
      .slice(0, 5)
      .flatMap(({ industry, tag }) => {
        const entry = taxonomy.find((item) =>
          item.kind === "tag" && item.tagId === tag.id && item.industrySlug === industry.slug,
        );
        return entry ? [{
          id: entry.id,
          slug: entry.slug,
          label: taxonomyLabel(tag, locale, dictionaries[locale].industryTags),
        }] : [];
      });
  } catch {
    // Optional navigation must not turn a taxonomy outage into an error on
    // unrelated routes. The permanent Find a business link remains usable.
  }

  return <FooterExploreLinks locale={locale} categories={categories} />;
}
