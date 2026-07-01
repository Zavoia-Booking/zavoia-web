import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { HelpCenter } from "./help-center";

// Help centre page composition (server component). Reads the localized
// `help` dictionary, resolves the "Good to know" link hrefs server-side, and
// hands plain serializable props to the interactive client component. No auth
// gating, no report-an-issue/ticket/support UI — everyone sees the same page.
export function HelpContent({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].help;

  const goodToKnowLinks = t.goodToKnow.items.map((item) => ({
    label: item.label,
    href: localeHref(locale, ...item.href),
  }));

  return (
    <main>
      <HelpCenter
        head={t.head}
        searchPlaceholder={t.searchPlaceholder}
        allLabel={t.allLabel}
        resultsLabel={t.resultsLabel}
        noResults={t.noResults}
        topics={t.topics}
        goodToKnowTitle={t.goodToKnow.title}
        goodToKnowLinks={goodToKnowLinks}
      />
    </main>
  );
}
