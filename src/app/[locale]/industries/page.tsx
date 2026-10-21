import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { getIndustries } from "@/lib/api/marketplace/public";
import { LISTING_REVALIDATE_SECONDS, TAXONOMY_TAG } from "@/lib/cache/tags";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import { SITE_URL } from "@/lib/site";
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
      locale,
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

  // Failures reach the existing localized route error boundary, which offers
  // retry. A successful but empty taxonomy has its own state below.
  const industries = await getIndustries({
    revalidate: LISTING_REVALIDATE_SECONDS,
    tags: [TAXONOMY_TAG],
  });
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
    </main>
  );
}
