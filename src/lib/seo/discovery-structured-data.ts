import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { SITE_URL } from "@/lib/site";
import { collectionItemList } from "./collection-structured-data";
import { webPageNode } from "./entities";
import { siteEntities } from "./site-identity";

/** Keep the localized homepage distinct from the shared WebSite identity. */
export function homeStructuredData(locale: Locale) {
  const { home } = dictionaries[locale];
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({ locale, path: localeHref(locale), name: home.title, description: home.description }),
    ],
  };
}

/** The visible directory slice and breadcrumb trail, with a connected page identity. */
export function discoveryStructuredData(input: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  breadcrumbs: readonly { name: string; path?: string }[];
  items: readonly { name: string; path: string }[];
}) {
  const breadcrumb = input.breadcrumbs.length >= 2 ? {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${input.path}#breadcrumb`,
    itemListElement: input.breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path ?? input.path}`,
    })),
  } : undefined;
  const itemList = collectionItemList(input.path, input.items);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({
        locale: input.locale,
        path: input.path,
        name: input.name,
        description: input.description,
        type: "CollectionPage",
        breadcrumbId: breadcrumb?.["@id"],
        mainEntityId: itemList?.["@id"],
      }),
      ...(breadcrumb ? [breadcrumb] : []),
      ...(itemList ? [itemList] : []),
    ],
  };
}
