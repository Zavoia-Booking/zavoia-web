import { DEFAULT_LOCALE, type Locale } from "./locales";

export function localeHref(locale: Locale, ...segments: string[]): string {
  const path = segments.filter(Boolean).join("/");
  if (locale === DEFAULT_LOCALE) {
    return path ? `/${path}` : "/";
  }
  return path ? `/${locale}/${path}` : `/${locale}`;
}
