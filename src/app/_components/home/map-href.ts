import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";

/**
 * "See all" target for the home rails: the map, scoped to the city rather than to the rail's
 * radius.
 *
 * The map runs its OWN query from this URL — `?city=<name>` and nothing else — so it never
 * inherits the 20km/50km radius the rail was showing. It answers "everything published in this
 * city", deliberately a wider set than the rail displayed. Without a resolved name we can only
 * open the map unscoped.
 */
export function mapHref(locale: Locale, city: string | null): string {
  const base = localeHref(locale, "search");
  return city ? `${base}?city=${encodeURIComponent(city)}` : base;
}
