import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { CityView, TaxonomyView } from "@/data/seo";
import { listCities, listTaxonomy, taxonomyDisplayName } from "@/data/seo";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { BusinessCard } from "@/components/business";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { SearchPageContext } from "@/components/search/search-overlay-provider";
import { SITE_URL } from "@/lib/site";
import { Icon } from "@/components/ui/icon";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import { buildSlugById, industryVisual } from "@/lib/marketplace/industry-visuals";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import type { Industry, LocationCard } from "@/lib/api/marketplace/types";
import styles from "./category-content.module.css";
import motion from "@/components/ui/disclosure-motion.module.css";

const RELATED_SERVICE_LIMIT = 12;

export function CategoryContent({
  locale,
  city,
  entry,
  industries,
  listings,
  total,
}: {
  locale: Locale;
  city: CityView;
  entry: TaxonomyView;
  industries: Industry[];
  listings: LocationCard[];
  total: number;
}) {
  const dict = dictionaries[locale];
  const t = dict.category;
  const label = (item: TaxonomyView) => taxonomyDisplayName(item, industries, locale, dict);
  const name = label(entry);
  const vars = { industry: name, city: city.name };
  const taxonomy = listTaxonomy(industries, locale);
  const slugById = buildSlugById(industries);
  const otherCities = listCities(locale).filter((item) => item.id !== city.id);
  const pathname = localeHref(locale, city.slug, entry.slug);
  const parentIndustry = entry.kind === "tag"
    ? taxonomy.find((item) => item.kind === "industry" && item.industrySlug === entry.industrySlug)
    : undefined;
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: dict.breadcrumbHome, href: localeHref(locale) },
    { label: dict.industryDirectory.heading, href: localeHref(locale, "industries") },
    ...(parentIndustry ? [{
      label: format(t.heading, { industry: label(parentIndustry), city: city.name }),
      href: localeHref(locale, city.slug, parentIndustry.slug),
    }] : []),
    { label: parentIndustry ? name : format(t.heading, vars) },
  ];
  const pageUrl = `${SITE_URL}${pathname}`;
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : pageUrl,
    })),
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb,
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: format(t.heading, vars),
        inLanguage: locale,
        breadcrumb: { "@id": breadcrumb["@id"] },
      },
    ],
  };
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale).select(total);
  const resultHeading = t.resultsHeading[plural === "one" ? "one" : plural === "few" ? "few" : "other"];
  const sparseResults = listings.length <= 2;

  // Keep city/service discovery in server HTML independently of the sitemap.
  const industryLinks = otherIndustryLast(
    taxonomy.filter((item) => item.kind === "industry" && (
      entry.kind === "tag" || item.id !== entry.id
    )),
    (item) => item.industrySlug,
  );
  const services = taxonomy.filter((item) =>
    item.kind === "tag" && item.industrySlug === entry.industrySlug && (
      entry.kind === "industry" || item.tagId !== entry.tagId
    ),
  );
  const relatedGroups = [
    {
      id: "related",
      title: entry.kind === "industry" ? t.otherIndustriesHeading : t.exploreIndustriesHeading,
      items: industryLinks,
      industries: true,
    },
    {
      id: "services",
      title: entry.kind === "industry" ? t.servicesHeading : t.relatedServicesHeading,
      items: entry.kind === "industry" ? services : services.slice(0, RELATED_SERVICE_LIMIT),
      industries: false,
    },
  ].filter((group) => group.items.length > 0);

  // Preserve the exact city and service filter when handing off to map search.
  const searchParams = new URLSearchParams({ city: city.name });
  if (entry.kind === "tag") {
    searchParams.set("tagIds", String(entry.tagId));
  } else {
    searchParams.set("industry", entry.industrySlug);
  }
  const searchHref = `${localeHref(locale, "search")}?${searchParams}`;
  // Empty-state recovery explicitly broadens to all businesses in this city.
  const citySearchHref = `${localeHref(locale, "search")}?${new URLSearchParams({ city: city.name })}`;

  return (
    <main className={styles.page} data-footer-surface="warm">
      <SearchPageContext
        pathname={pathname}
        label={name}
        initial={{
          city: city.name,
          industry: entry.kind === "industry" ? entry.industrySlug : "",
          tagIds: entry.kind === "tag" ? [entry.tagId] : [],
        }}
        industries={industries}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="zw-container">
        <Breadcrumb
          ariaLabel={dict.industryDirectory.breadcrumbLabel}
          items={breadcrumbItems}
        />

        <header className={styles.header}>
          <div className={styles.introduction}>
            <h1 className={styles.title}>{format(t.heading, vars)}</h1>
            {listings.length > 0 && <p className={styles.intro}>{t.intro}</p>}
          </div>
        </header>

        {listings.length > 0 ? (
          <section className={styles.results} aria-labelledby="category-results">
            <div className={styles.resultsHeader}>
              <div className={styles.resultsSummary}>
                <h2 id="category-results" className={styles.sectionTitle}>
                  {format(resultHeading, { count: numbers.format(total), city: city.name })}
                </h2>
                {total > listings.length && (
                  <p className={styles.count}>
                    {format(t.resultsShowing, { count: numbers.format(listings.length), total: numbers.format(total) })}
                  </p>
                )}
              </div>
              <Link href={searchHref} prefetch={false} className={styles.mapLink}>
                <Icon name="pin" size={18} />
                {t.seeAll}
              </Link>
            </div>
            <ul className={styles.grid} data-layout={sparseResults ? "rows" : "grid"}>
              {listings.map((location) => {
                const card = locationCardToData(location, locale, slugById);
                return (
                  <li key={location.id}>
                    <BusinessCard
                      variant="result"
                      resultLayout={sparseResults ? "row" : "stacked"}
                      b={card}
                    />
                  </li>
                );
              })}
            </ul>
            {total > listings.length && (
              <div className={styles.moreResults}>
                <Link href={searchHref} prefetch={false} className={styles.mapLink}>
                  {t.viewAllResults}
                  <Icon name="arrowR" size={18} />
                </Link>
              </div>
            )}
          </section>
        ) : (
          <section className={styles.empty} aria-labelledby="category-empty">
            <div className={styles.emptyContent}>
              <Icon name="search" size={24} className={styles.emptyIcon} />
              <div className={styles.emptyCopy}>
                <h2 id="category-empty" className={styles.sectionTitle}>{t.emptyTitle}</h2>
                <p>{format(t.emptyBody, vars)}</p>
              </div>
            </div>
            <Link href={citySearchHref} prefetch={false} className={styles.primaryLink}>
              {format(t.exploreCity, vars)}
              <Icon name="arrowR" size={18} />
            </Link>
          </section>
        )}
      </div>

      <div className={styles.discovery}>
        <div className="zw-container">
          {relatedGroups.map((group) => (
            <section
              key={group.id}
              className={group.industries ? styles.industries : styles.related}
              aria-labelledby={`category-${group.id}`}
            >
              <h2 id={`category-${group.id}`} className={styles.sectionTitle}>
                {format(group.title, vars)}
              </h2>
              <ul role="list" className={group.industries ? styles.industryGrid : styles.linkGrid}>
                {group.items.map((item) => {
                  const visual = group.industries ? industryVisual(item.industrySlug) : null;
                  return (
                    <li key={item.id}>
                      <Link
                        href={localeHref(locale, city.slug, item.slug)}
                        prefetch={false}
                        className={group.industries ? styles.industryLink : styles.relatedLink}
                      >
                        {visual && <Icon name={visual.icon} size={24} color={visual.accent} />}
                        <span>{label(item)}</span>
                        <Icon name="chevR" size={14} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <details className={`${styles.disclosure} ${motion.root} ${motion.native}`}>
            <summary className={styles.disclosureSummary}>
              <h2 className={styles.sectionTitle}>{format(t.otherCitiesHeading, vars)}</h2>
              <Icon name="chevD" size={18} />
            </summary>
            <div className={motion.body}>
              <p className={styles.disclosureIntro}>{format(t.otherCitiesIntro, vars)}</p>
              <ul className={styles.disclosureGrid}>
                {otherCities.map((otherCity) => (
                  <li key={otherCity.id}>
                    <Link
                      href={localeHref(locale, otherCity.slug, entry.slug)}
                      prefetch={false}
                      className={styles.relatedLink}
                    >
                      <span>{otherCity.name}</span>
                      <Icon name="chevR" size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
