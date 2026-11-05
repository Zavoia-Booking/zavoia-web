import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import { listTaxonomy, taxonomyDisplayName, type TaxonomyView } from "@/data/seo";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { getIndustries } from "@/lib/api/marketplace/public";
import { LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import { industryVisual } from "@/lib/marketplace/industry-visuals";
import { getCategoryDiscoveryGroups } from "@/lib/seo/category-discovery";
import { getOptionalSitemapFeed } from "@/lib/seo/sitemap-feed.server";
import { DEFAULT_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, SITE_URL } from "@/lib/site";
import { IndustryBrowser } from "./industry-browser";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = dictionaries[locale].industryDirectory;

  return {
    title: t.pageTitle,
    description: t.pageDescription,
    alternates: {
      canonical: localeHref(locale, "industries"),
      languages: {
        ...Object.fromEntries(
          LOCALES.map((l) => [l, localeHref(l, "industries")]),
        ),
        "x-default": localeHref(DEFAULT_LOCALE, "industries"),
      },
    },
    openGraph: {
      title: t.pageTitle,
      description: t.pageDescription,
      url: localeHref(locale, "industries"),
      type: "website",
      siteName: "Zavoia",
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter((language) => language !== locale).map((language) => OPEN_GRAPH_LOCALES[language]),
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t.pageTitle,
      description: t.pageDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export default async function IndustriesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = dictionaries[locale];
  const t = dict.industryDirectory;

  // Exclude backend access from build-time prerendering without disabling the
  // explicit fetch cache (unlike force-dynamic). connection() is stable Next API.
  await connection();

  // Taxonomy failures reach the existing localized route error boundary, which
  // offers retry. A successful but empty taxonomy has its own state below. The
  // city links are optional: an unavailable inventory feed only omits them.
  const [industries, inventory] = await Promise.all([
    getIndustries({
      revalidate: LISTING_REVALIDATE_SECONDS,
      tags: [TAXONOMY_TAG],
    }),
    getOptionalSitemapFeed(),
  ]);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const searchPath = localeHref(locale, "search");
  const directory = otherIndustryLast(
    industries
      .map((industry) => ({
        slug: industry.slug,
        label: taxonomyLabel(industry, locale, dict.industries),
        searchText: [industry.name, industry.nameRo].filter(Boolean).join(" "),
        href: `${searchPath}?${new URLSearchParams({ industry: industry.slug })}`,
        tags: industry.tags
          .map((tag) => ({
            id: tag.id,
            label: taxonomyLabel(tag, locale, dict.industryTags),
            searchText: [tag.name, tag.nameRo].filter(Boolean).join(" "),
            href: `${searchPath}?${new URLSearchParams({ industry: industry.slug, tagIds: String(tag.id) })}`,
          }))
          .sort((a, b) => collator.compare(a.label, b.label)),
      }))
      .sort((a, b) => collator.compare(a.label, b.label)),
    (industry) => industry.slug,
  );
  // The city/industry pages that public inventory supports, exactly as the
  // sitemap lists them, so they are reachable through ordinary links. A slug
  // shared by two taxonomy entries would open the wrong page, so it is skipped.
  const taxonomy = listTaxonomy(industries, locale);
  const hasOwnPage = (entry: TaxonomyView) =>
    taxonomy.filter((item) => item.slug === entry.slug).length === 1;
  const cityLinks = directory.length > 0 && inventory
    ? getCategoryDiscoveryGroups(inventory.locations, industries, locale).flatMap((city) => {
        const industryPages = new Set(city.entries.flatMap((entry) =>
          entry.kind === "industry" ? [entry.industrySlug] : []));
        // An industry page already links each of its services, so a service is
        // listed here only when its industry has no page in this city.
        const entries = otherIndustryLast(
          city.entries
            .filter((entry) =>
              (entry.kind === "industry" || !industryPages.has(entry.industrySlug)) && hasOwnPage(entry))
            .map((entry) => ({ entry, label: taxonomyDisplayName(entry, industries, locale, dict) }))
            .sort((a, b) => collator.compare(a.label, b.label)),
          (item) => item.entry.industrySlug,
        );
        return entries.length > 0 ? [{ city, entries }] : [];
      })
    : [];
  const pageUrl = `${SITE_URL}${localeHref(locale, "industries")}`;
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.header.home,
        item: `${SITE_URL}${localeHref(locale)}`,
      },
      { "@type": "ListItem", position: 2, name: t.heading, item: pageUrl },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb,
      {
        "@type": "CollectionPage",
        "@id": pageUrl,
        url: pageUrl,
        name: t.heading,
        description: t.pageDescription,
        inLanguage: locale,
        breadcrumb: { "@id": breadcrumb["@id"] },
      },
    ],
  };

  return (
    <main className={`zw-container ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumb
        ariaLabel={t.breadcrumbLabel}
        items={[
          { label: dict.header.home, href: localeHref(locale) },
          { label: t.heading },
        ]}
      />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.heading}</h1>
          <p className={styles.intro}>{t.intro}</p>
        </div>
      </header>

      {directory.length > 0 ? (
        <IndustryBrowser industries={directory} labels={t} />
      ) : (
        <section className={styles.empty}>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyBody}</p>
          <Link href={searchPath} className={styles.exploreLink}>
            {dict.footer.findBusiness}
            <Icon name="arrowR" size={16} />
          </Link>
        </section>
      )}

      {cityLinks.length > 0 && (
        <section className={styles.cities} aria-labelledby="industries-by-city">
          <h2 id="industries-by-city" className={styles.citiesTitle}>{t.byCityHeading}</h2>
          <ul role="list" className={styles.cityList}>
            {cityLinks.map(({ city, entries }) => (
              <li key={city.id} className={styles.city}>
                <h3 className={styles.cityName}>{city.name}</h3>
                <ul role="list" className={styles.cityLinks}>
                  {entries.map(({ entry, label }) => {
                    const visual = industryVisual(entry.industrySlug);
                    return (
                      <li key={entry.id}>
                        {/* The accessible name carries the city that the heading shows. */}
                        <Link
                          href={localeHref(locale, city.slug, entry.slug)}
                          prefetch={false}
                          aria-label={format(dict.category.titleTemplate, { industry: label, city: city.name })}
                          className={styles.cityLink}
                        >
                          <Icon name={visual.icon} size={20} color={visual.accent} />
                          <span>{label}</span>
                          <Icon name="chevR" size={14} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
