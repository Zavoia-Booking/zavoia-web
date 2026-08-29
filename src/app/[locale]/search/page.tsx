import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { getIndustries, searchListings } from "@/lib/api/marketplace/public";
import type {
  Industry,
  SearchListingsParams,
  SearchListingsResult,
} from "@/lib/api/marketplace/types";
import { SEARCH_LIMIT } from "@/components/search/constants";
import { SearchContent } from "./_components/search-content";

// Live marketplace data: never statically prerender (the backend may be down
// during `next build`).
export const dynamic = "force-dynamic";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];
  return {
    title: dict.nav.search,
    description: dict.home.description,
    // The results page is query-driven and personalised — keep it out of the
    // index.
    robots: { index: false, follow: true },
  };
}

const EMPTY_RESULT: SearchListingsResult = {
  businesses: [],
  locations: [],
  total: 0,
  limit: SEARCH_LIMIT,
  offset: 0,
  fallback: { applied: false, reason: null },
};

function one(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (s == null || s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function csvNums(v: string | string[] | undefined): number[] | undefined {
  const s = one(v);
  if (!s) return undefined;
  const arr = s
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
  return arr.length ? arr : undefined;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;

  // Initial results from the URL params (build-safe: never throws; a failed
  // fetch resolves to EMPTY_RESULT below, with `initialResultFailed` telling
  // SearchContent it was a failure, not a genuine zero-result search).
  const initialParams: SearchListingsParams = {
    search: one(sp.search),
    industrySlug: one(sp.industry),
    tagIds: csvNums(sp.tagIds),
    city: one(sp.city),
    date: one(sp.date),
    lat: num(sp.lat),
    lng: num(sp.lng),
    radius: num(sp.radius),
    limit: SEARCH_LIMIT,
    offset: num(sp.offset) ?? 0,
  };

  // The filter taxonomy and the result set are independent, so both requests
  // go out together rather than one after the other. The result set also
  // tracks whether the fetch itself failed (vs. genuinely returned zero
  // rows) — SearchContent needs that distinction to avoid rendering a
  // backend outage as "no places match your search".
  const initialSearch = searchListings(initialParams).then(
    (result) => ({ result, failed: false as const }),
    () => ({ result: EMPTY_RESULT, failed: true as const }),
  );

  const [industries, { result: initialResult, failed: initialResultFailed }] =
    await Promise.all([getIndustries().catch((): Industry[] => []), initialSearch]);

  return (
    <SearchContent
      locale={locale}
      industries={industries}
      initialResult={initialResult}
      initialResultFailed={initialResultFailed}
    />
  );
}
