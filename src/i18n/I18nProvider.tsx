"use client";

import { createContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./locales";
import type { Dictionary } from "./dictionaries";

export interface I18nContextValue { locale: Locale; dict: Dictionary }
export const I18nContext = createContext<I18nContextValue | null>(null);

/** The locale layout selects and serializes one language on the server. */
export function I18nProvider({ locale, dict, children }: I18nContextValue & { children: ReactNode }) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
