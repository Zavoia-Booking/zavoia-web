import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";

/** One location-independent destination for professional profiles. */
export function professionalHref(locale: Locale, uuid: string): string {
  return localeHref(locale, "professionals", encodeURIComponent(uuid));
}
