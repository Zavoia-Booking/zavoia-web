import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { CityView, TaxonomyView } from "@/data/seo";
import { listCities, listTaxonomy } from "@/data/seo";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { BusinessFeedCard } from "@/components/business";
import { locationCardToData } from "@/lib/marketplace/card-mappers";
import type { Industry, LocationCard } from "@/lib/api/marketplace/types";

/** Sibling links shown per rail — enough to be useful, short of a link farm. */
const RELATED_LIMIT = 12;

export function CategoryContent({
  locale,
  city,
  entry,
  industries,
  listings,
}: {
  locale: Locale;
  city: CityView;
  entry: TaxonomyView;
  industries: Industry[];
  listings: LocationCard[];
}) {
  const dict = dictionaries[locale];
  const vars = {
    industry: entry.name,
    industryLower: entry.name.toLowerCase(),
    city: city.name,
  };

  const otherCities = listCities(locale).filter((c) => c.id !== city.id);
  // Siblings under the same industry when this page IS a tag, otherwise the
  // other industries. Either way the reader gets the neighbouring choices at
  // their own level rather than a flat dump of all 91 taxonomy entries.
  const taxonomy = listTaxonomy(industries, locale);
  const siblings = (
    entry.kind === "tag"
      ? taxonomy.filter(
          (t) => t.kind === "tag" && t.industrySlug === entry.industrySlug,
        )
      : taxonomy.filter((t) => t.kind === "industry")
  )
    .filter((t) => t.id !== entry.id)
    .slice(0, RELATED_LIMIT);

  // "See all" hands the query to /search, which owns the map, the filters and
  // the pagination — this page is a landing surface, not a second search UI.
  const searchHref = `${localeHref(locale, "search")}?city=${encodeURIComponent(
    city.name,
  )}&industry=${encodeURIComponent(entry.industrySlug)}`;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="text-sm text-zinc-500">
        <Link href={localeHref(locale)} className="hover:underline">
          {dict.breadcrumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span>{city.name}</span>
        <span className="mx-2">/</span>
        <span>{entry.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {format(dict.category.heading, vars)}
      </h1>

      <div className="mt-6 max-w-2xl space-y-4 text-zinc-700">
        <p>{format(dict.category.body1, vars)}</p>
        <p>{format(dict.category.body2, vars)}</p>
        <p>{format(dict.category.body3, vars)}</p>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-medium">
            {format(dict.category.listHeading, vars)}
          </h2>
          {listings.length > 0 && (
            <Link
              href={searchHref}
              className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              {dict.category.seeAll}
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <p className="mt-3 rounded-md border border-zinc-200 p-4 text-sm text-zinc-500">
            {format(dict.category.comingSoon, vars)}
          </p>
        ) : (
          <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <li key={l.id}>
                <BusinessFeedCard b={locationCardToData(l, locale)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">
          {format(dict.category.otherCitiesHeading, vars)}
        </h2>
        <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-zinc-700">
          {otherCities.map((c) => (
            <li key={c.id}>
              <Link
                href={localeHref(locale, c.slug, entry.slug)}
                className="hover:underline"
              >
                {entry.name} {dict.preposition} {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {siblings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">
            {format(dict.category.otherIndustriesHeading, vars)}
          </h2>
          <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-zinc-700">
            {siblings.map((t) => (
              <li key={t.id}>
                <Link
                  href={localeHref(locale, city.slug, t.slug)}
                  className="hover:underline"
                >
                  {t.name} {dict.preposition} {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
