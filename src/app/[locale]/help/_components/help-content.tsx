import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { HelpCenter } from "./help-center";
import { FaqArtwork } from "@/app/_components/for-business/faq-artwork";
import { preloadSignatureFont } from "@/app/_components/for-business/signature-font";
import { blogIndexHref } from "@/lib/blog/listing";
import { siteEntities } from "@/lib/seo/site-identity";
import { webPageNode } from "@/lib/seo/entities";
import { serializeJsonLd } from "@/lib/seo/json-ld";

// Help centre page composition (server component). Reads the localized
// `help` dictionary, resolves localized useful links, and
// hands plain serializable props to the interactive client component. No auth
// gating: everyone sees the same page. The shared report form submits to
// the PUBLIC guest ticket endpoint, so it works signed out.
export function HelpContent({ locale }: { locale: Locale }) {
  preloadSignatureFont();
  const t = dictionaries[locale].help;

  const topics = t.topics.map((topic) => ({
    ...topic,
    items: topic.items.map(({ q, a, searchTerms }) => ({ q, a, searchTerms })),
  }));
  const usefulLinks = [
    ...t.topics.flatMap(topic => topic.items.flatMap(item => item.link ? [{
      label: item.link.label,
      href: localeHref(locale, ...item.link.href),
    }] : [])),
    { label: t.guidesLabel, href: blogIndexHref(locale, "guides") },
    { label: t.webStudioLabel, href: localeHref(locale, "web-studio") },
    { label: t.pricingLabel, href: localeHref(locale, "pricing") },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({
        locale, path: localeHref(locale, "help"), name: t.metaTitle,
        description: t.pageDescription, faqItems: topics.flatMap(topic => topic.items),
      }),
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <HelpCenter
        locale={locale}
        head={t.head}
        artwork={<FaqArtwork />}
        searchPlaceholder={t.searchPlaceholder}
        searchLabel={t.searchLabel}
        clearSearchLabel={t.clearSearchLabel}
        resultsLabel={t.resultsLabel}
        noResults={t.noResults}
        topics={topics}
        usefulLinks={{ title: t.usefulLinksTitle, items: usefulLinks }}
        report={t.report}
      />
    </main>
  );
}
