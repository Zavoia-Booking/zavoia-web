import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getPublicWebsite } from "@/lib/api/marketplace/public";
import type { PublicWebsite } from "@/lib/api/marketplace/types";

// Published business website — zavoia.com/[businessSlug].
//
// The folder is named [city] because Next.js allows only ONE param name per
// dynamic segment level and /[city]/[industry] (city browse) already claims it.
// At depth one the segment is a businessSlug; at depth two it's a city. The two
// namespaces never collide because they differ in depth, and static routes
// (/pricing, /login, …) always win over this dynamic segment.
//
// Live data resolved by slug: never statically prerender (the backend may be
// down during `next build`).
export const dynamic = "force-dynamic";

export const dynamicParams = true;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { locale, city: slug } = await params;
    if (!isLocale(locale) || !slug) return {};
    const site = await getPublicWebsite(slug);
    return {
      title: site.identity.name,
      description: site.identity.description ?? undefined,
      // Scaffold dump — do not index until the real renderer ships.
      robots: { index: false, follow: false },
    };
  } catch {
    return {};
  }
}

export default async function BusinessWebsitePage({ params }: Props) {
  const { locale, city: slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!slug) notFound();

  // A failed/absent backend or an unpublished/unknown slug renders 404 rather
  // than crashing the route.
  let site: PublicWebsite | null = null;
  try {
    site = await getPublicWebsite(slug);
  } catch {
    site = null;
  }

  if (!site) notFound();

  // Scaffold: raw payload dump. The real renderer will consume site.website
  // (the frozen published snapshot: pageLayout, pageTheme, hero, faq, …) plus
  // site.identity for name/logo/contact.
  return (
    <pre
      style={{
        padding: "1rem",
        fontSize: "0.75rem",
        lineHeight: 1.5,
        overflowX: "auto",
      }}
    >
      {JSON.stringify(site, null, 2)}
    </pre>
  );
}
