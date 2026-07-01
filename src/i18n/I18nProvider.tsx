"use client";

import { createContext, type ReactNode } from "react";
import type { Locale } from "./locales";
import { dictionaries, type Dictionary } from "./dictionaries";

export interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
}

// Null when no provider is mounted — consumers fall back to the default
// locale (see useTranslation) so components stay robust without a provider.
export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value: I18nContextValue = { locale, dict: dictionaries[locale] };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
