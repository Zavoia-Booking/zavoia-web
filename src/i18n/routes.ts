import { DEFAULT_LOCALE, isLocale, type Locale } from "./locales";

export function localeHref(locale: Locale, ...segments: string[]): string {
  const path = segments.filter(Boolean).join("/");
  if (locale === DEFAULT_LOCALE) {
    return path ? `/${path}` : "/";
  }
  return path ? `/${locale}/${path}` : `/${locale}`;
}

/** Replace only the locale prefix, preserving encoded segments and trailing
 * slashes. Accept local pathnames only; callers append search/hash separately.
 */
export function localizedPathname(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || /[\\?#\u0000-\u001f\u007f]/.test(pathname)) {
    return localeHref(locale);
  }

  const path = pathname.slice(1);
  const separator = path.indexOf("/");
  const firstSegment = separator === -1 ? path : path.slice(0, separator);
  const remainder = isLocale(firstSegment)
    ? separator === -1 ? "" : path.slice(separator + 1)
    : path;

  // Removing a locale from /ro//example must never produce //example.
  if (remainder.startsWith("/")) return localeHref(locale);

  const href = localeHref(locale, remainder);
  return pathname.length > 1 && pathname.endsWith("/") && !href.endsWith("/")
    ? `${href}/`
    : href;
}
