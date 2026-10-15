"use client";

import { LOCALES, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { useContext } from "react";
import { I18nContext } from "@/i18n/I18nProvider";
import type { LocaleAlternates } from "@/i18n/locale-navigation";
import { LanguageDisclosure } from "./language-disclosure";

/** Use the selected locale context, or explicit labels on standalone 404s. */
export function LanguageSwitcher({
  currentLocale, pathname, label, placement, compact, alternates, messages,
}: {
  currentLocale: Locale;
  messages?: Pick<Dictionary, "language" | "localeNames">;
  pathname?: string;
  label?: string;
  placement?: "above" | "below";
  compact?: "responsive";
  alternates?: LocaleAlternates | "same-path";
}) {
  const context = useContext(I18nContext);
  const dict = messages ?? context?.dict;
  if (!dict) throw new Error("LanguageSwitcher requires messages or I18nProvider");
  return (
    <LanguageDisclosure
      currentLocale={currentLocale}
      pathname={pathname}
      label={label ?? dict.language.label}
      loadingLabel={dict.language.loading}
      unavailableLabel={dict.language.unavailable}
      options={LOCALES.map((locale) => ({ locale, label: dict.localeNames[locale] }))}
      placement={placement}
      compact={compact}
      alternates={alternates}
    />
  );
}
