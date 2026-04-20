import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { CITY_ENTRIES, INDUSTRY_ENTRIES } from "@/data/seo";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";

export function HomeContent({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        {dict.home.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-zinc-600">{dict.home.intro}</p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {CITY_ENTRIES.map((city) => (
          <section key={city.id}>
            <h2 className="text-lg font-medium">{city.name[locale]}</h2>
            <ul className="mt-2 space-y-1">
              {INDUSTRY_ENTRIES.map((industry) => (
                <li key={industry.id}>
                  <Link
                    href={localeHref(
                      locale,
                      city.slug[locale],
                      industry.slug[locale],
                    )}
                    className="text-sm text-zinc-700 hover:underline"
                  >
                    {industry.name[locale]} {dict.preposition}{" "}
                    {city.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
