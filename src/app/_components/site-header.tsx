import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader({ locale }: { locale: Locale }) {
  return (
    <header className="border-b border-zinc-200">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 text-sm">
        <Link href={localeHref(locale)} className="font-semibold">
          Zavoia
        </Link>
        <LanguageSwitcher currentLocale={locale} />
      </nav>
    </header>
  );
}
