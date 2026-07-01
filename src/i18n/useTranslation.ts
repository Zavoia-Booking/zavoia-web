"use client";

import { useContext } from "react";
import { I18nContext, type I18nContextValue } from "./I18nProvider";
import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE } from "./locales";

// Reads the i18n context. If no provider is mounted (e.g. this slice does not
// wire I18nProvider into the layout yet), it falls back to the default locale
// rather than throwing, so components remain usable in isolation.
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return { locale: DEFAULT_LOCALE, dict: dictionaries[DEFAULT_LOCALE] };
}
