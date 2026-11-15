import { SITE_URL } from "@/lib/site";

/** The displayed slice, in document order; destinations identify pages, not invented entities. */
export function collectionItemList(path: string, items: readonly { name: string; path: string }[]) {
  if (items.length === 0) return null;
  return {
    "@type": "ItemList",
    "@id": `${SITE_URL}${path}#itemlist`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
