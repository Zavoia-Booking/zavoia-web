import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { defaultSocialImage } from "@/lib/site";
import { homeStructuredData } from "@/lib/seo/discovery-structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { HomeContent, type FeedResult } from "@/app/_components/home-content";
import { ApiError } from "@/lib/api/http";
import {
  getBrands,
  getIndustries,
  getWebsiteShowcase,
} from "@/lib/api/marketplace/public";

import { DISCOVERY_TAG, TAXONOMY_TAG, DISCOVERY_REVALIDATE_SECONDS, LISTING_REVALIDATE_SECONDS } from "@/lib/cache/tags";

const HOME_FEED_TIMEOUT_MS = 15_000;

// Bound the whole exchange, including the body, without dropping Next's cache
// hints. A deadline also settles an abort-ignoring transport. Keep failed data
// distinct from an honest empty array and reject malformed list envelopes here,
// before a streamed section tries to render them.
async function settle<T>(
  endpoint: string,
  request: (signal: AbortSignal) => Promise<T[]>,
): Promise<FeedResult<T[]>> {
  const controller = new AbortController();
  let reason: "request_failed" | "timeout" | "invalid_response" = "request_failed";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reason = "timeout";
        controller.abort();
        reject(new Error("Home feed deadline exceeded"));
      }, HOME_FEED_TIMEOUT_MS);
    });
    const data = await Promise.race([request(controller.signal), deadline]);
    if (!Array.isArray(data) || data.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
      reason = "invalid_response";
      throw new Error("Invalid home feed response");
    }
    return { ok: true, data };
  } catch (error) {
    // Never log response bodies, customer data, tokens, or raw backend messages.
    console.warn("[home-feed] Request failed", {
      endpoint,
      reason,
      ...(error instanceof ApiError ? { status: error.status } : {}),
    });
    return { ok: false, failureId: Date.now() };
  } finally {
    clearTimeout(timer);
  }
}

// The home fetches live marketplace data, so it must NOT be statically
// prerendered at build time (the backend may be down during `next build`).
export const dynamic = "force-dynamic";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ro: "ro_RO",
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l)]),
  ) as Record<Locale, string>;

  return {
    title: { absolute: dict.home.title },
    description: dict.home.description,
    alternates: {
      canonical: localeHref(locale),
      languages: { ...languages, "x-default": localeHref(DEFAULT_LOCALE) },
    },
    openGraph: {
      title: dict.home.title,
      description: dict.home.description,
      url: localeHref(locale),
      type: "website",
      siteName: "Zavoia",
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map(
        (l) => OPEN_GRAPH_LOCALES[l],
      ),
      images: [defaultSocialImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.title,
      description: dict.home.description,
      images: [defaultSocialImage(locale)],
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  // The three feeds fire in parallel and are handed to HomeContent UNAWAITED:
  // each one streams into its own <Suspense> boundary, so the hero and the
  // editorial bands reach the browser without waiting on admin-api at all.
  //
  // `settle()` gives each request a deadline and handles rejection immediately,
  // before its streamed consumer awaits it. Failure remains distinct from an
  // honest empty result so the shared discovery recovery can choose its state.
  // Keep the page dynamic while reusing anonymous, locale-independent data.
  // The existing backend webhook expires discovery data on listing changes.
  const industries = settle("/marketplace/public/industries", (signal) => getIndustries({
    signal,
    revalidate: LISTING_REVALIDATE_SECONDS,
    tags: [TAXONOMY_TAG],
  }));
  const discoveryCache = {
    revalidate: DISCOVERY_REVALIDATE_SECONDS,
    tags: [DISCOVERY_TAG],
  };
  // Website publication changes already expire the discovery tag. The API
  // applies the same publication and entitlement gates as the website route.
  const websites = settle(
    "/marketplace/public/websites",
    (signal) => getWebsiteShowcase({ ...discoveryCache, signal }).then((res) => res.data),
  );
  const brands = settle(
    "/marketplace/public/brands",
    (signal) => getBrands({ limit: 10 }, { ...discoveryCache, signal }).then((res) => res.data),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(homeStructuredData(localeParam)),
        }}
      />
      <HomeContent
        locale={localeParam}
        industries={industries}
        websites={websites}
        brands={brands}
      />
    </>
  );
}
