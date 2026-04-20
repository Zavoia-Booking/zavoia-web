import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { CityView, IndustryView } from "@/data/seo";
import { listCities, listIndustries } from "@/data/seo";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";

export function CategoryContent({
  locale,
  city,
  industry,
}: {
  locale: Locale;
  city: CityView;
  industry: IndustryView;
}) {
  const dict = dictionaries[locale];
  const vars = {
    industry: industry.name,
    industryLower: industry.name.toLowerCase(),
    city: city.name,
    singular: industry.singular,
  };

  const otherCities = listCities(locale).filter((c) => c.id !== city.id);
  const otherIndustries = listIndustries(locale).filter(
    (i) => i.id !== industry.id,
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="text-sm text-zinc-500">
        <Link href={localeHref(locale)} className="hover:underline">
          {dict.breadcrumbHome}
        </Link>
        <span className="mx-2">/</span>
        <span>{city.name}</span>
        <span className="mx-2">/</span>
        <span>{industry.name}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {format(dict.category.heading, vars)}
      </h1>

      <div className="mt-6 space-y-4 text-zinc-700">
        <p>{format(dict.category.body1, vars)}</p>
        <p>{format(dict.category.body2, vars)}</p>
        <p>{format(dict.category.body3, vars)}</p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-medium">
          {format(dict.category.listHeading, vars)}
        </h2>
        <ul className="mt-3 rounded-md border border-zinc-200 p-4 text-sm text-zinc-500">
          <li>{format(dict.category.comingSoon, vars)}</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">
          {format(dict.category.otherCitiesHeading, vars)}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-700">
          {otherCities.map((c) => (
            <li key={c.id}>
              <Link
                href={localeHref(locale, c.slug, industry.slug)}
                className="hover:underline"
              >
                {industry.name} {dict.preposition} {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">
          {format(dict.category.otherIndustriesHeading, vars)}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-700">
          {otherIndustries.map((i) => (
            <li key={i.id}>
              <Link
                href={localeHref(locale, city.slug, i.slug)}
                className="hover:underline"
              >
                {i.name} {dict.preposition} {city.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
