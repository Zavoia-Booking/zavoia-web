export const LOCALES = ["en", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const PREFIXED_LOCALES = LOCALES.filter(
  (l): l is Exclude<Locale, typeof DEFAULT_LOCALE> => l !== DEFAULT_LOCALE,
);

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isPrefixedLocale(value: string): value is Locale {
  return isLocale(value) && value !== DEFAULT_LOCALE;
}
