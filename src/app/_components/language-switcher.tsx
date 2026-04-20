import Link from "next/link";
import { LOCALES, type Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";

export function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const dict = dictionaries[currentLocale];
  return (
    <ul className="flex gap-3">
      {LOCALES.map((l) => (
        <li key={l}>
          <Link
            href={localeHref(l)}
            hrefLang={l}
            className={
              l === currentLocale
                ? "font-semibold"
                : "text-zinc-500 hover:underline"
            }
          >
            {dict.localeNames[l]}
          </Link>
        </li>
      ))}
    </ul>
  );
}
