import { dictionaries } from "@/i18n/dictionaries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { SITE_URL } from "@/lib/site";
import { ApiError } from "@/lib/api/http";
import { getPublicWebsite } from "@/lib/api/marketplace/public";
import { WEBSITE_TAG, websiteTag } from "@/lib/cache/tags";
import type { PublicWebsite } from "@/lib/api/marketplace/types";
import { BusinessMicrosite } from "./_components/business-microsite";
import { NotFoundPage } from "@/app/_components/not-found/not-found-page";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";

// Published business website — zavoia.com/[businessSlug].
//
// The folder is named [city] because Next.js allows only ONE param name per
// dynamic segment level and /[city]/[industry] (city browse) already claims it.
// At depth one the segment is a businessSlug; at depth two it's a city. The two
// namespaces never collide because they differ in depth, and static routes
// (/pricing, /login, …) always win over this dynamic segment.
//
// ISR, same two-layer model as /business/[slug] and /brand/[slug]: 600s is the
// FLOOR (see `LISTING_REVALIDATE_SECONDS` in @/lib/cache/tags), and admin-api's
// revalidate webhook flushes `website:<slug>` the moment anything the site
// renders changes — publish/unpublish, services, prices, assignments. Whichever
// comes first. Must be a literal to be statically analysable.
//
// This segment has no loading.tsx: its first render waits for the lookup and
// subsequent visitors use ISR. An API 404 renders the shared fallback in-page
// with explicit noindex metadata; it retains the existing HTTP 200 behavior.
export const revalidate = 600;

// Required for ISR even though it enumerates nothing: without a
// `generateStaticParams`, Next treats the route as purely on-demand and never
// gives it a `dynamicRoutes` cache entry. Returning [] means "prerender no
// paths, but cache each one after its first request" — the backend is never
// called during `next build`.
export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

// Metadata and body fetch the same site; identical GETs are memoized within one
// render pass, so this is a single upstream request. Two tags: the specific
// page, and the coarse `website` tag for a bulk flush.
const WEBSITE_CACHE = (slug: string) => ({
  revalidate: 600,
  tags: [WEBSITE_TAG, websiteTag(slug)],
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: slug } = await params;
  if (!isLocale(locale) || !slug) return {};
  try {
    const site = await getPublicWebsite(slug, WEBSITE_CACHE(slug));
    return {
      title: site.identity.name,
      description: site.identity.description ?? undefined,
      alternates: {
        canonical: localeHref(locale, slug),
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, localeHref(l, slug)]),
        ) as Record<Locale, string>,
      },
      openGraph: {
        type: "website",
        title: site.identity.name,
        description: site.identity.description ?? undefined,
        url: `${SITE_URL}${localeHref(locale, slug)}`,
        images: site.identity.logo ? [site.identity.logo] : undefined,
      },
    };
  } catch (error) {
    // The matched fallback does not throw notFound(), so supply its metadata.
    // Operational failures are rethrown by the page and must not become misses.
    if (error instanceof ApiError && error.status === 404) return notFoundMetadata(locale);
    return {};
  }
}

export default async function BusinessWebsitePage({ params }: Props) {
  const { locale, city: slug } = await params;
  if (!isLocale(locale)) notFound();
  if (!slug) notFound();

  // Now that the render is CACHED, the two failure modes have to be told apart.
  //
  //   404          → nothing is published at this address, and that is a real,
  //                  cacheable answer: show the shared missing-page UI (metadata marks it
  //                  noindex) without claiming the address is available.
  //   anything else → backend down, 500, timeout. Rethrown, so the render fails
  //                  and Next stores NOTHING; the next request retries. An
  //                  outage must never freeze a wrong answer in for ten minutes.
  let site: PublicWebsite;
  try {
    site = await getPublicWebsite(slug, WEBSITE_CACHE(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <NotFoundPage dictionary={dictionaries[locale]} locale={locale} pathname={localeHref(locale, slug)} />;
    }
    throw error;
  }

  // The published microsite: the copied Website Builder renderer consuming the
  // frozen snapshot (site.website) + live locations/reviews/tags off the payload.
  return <BusinessMicrosite key={site.slug} site={site} locale={locale} />;
}
