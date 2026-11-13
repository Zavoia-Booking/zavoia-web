import { isLocale, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { safeRedirectTarget } from "@/lib/auth/redirects";

/** Reuse local-URL validation, and never send Back into the demo itself. */
export function demoReturnHref(value: string | null, locale: Locale): string {
  const fallback = localeHref(locale, "web-studio");
  const target = safeRedirectTarget(value, locale, fallback);
  try {
    const path = decodeURIComponent(new URL(target, "https://zavoia.invalid").pathname);
    const parts = path.split("/").filter(Boolean);
    if (parts[0] && isLocale(parts[0])) parts.shift();
    if (parts[0] === "try" || (parts[0] === "web-studio" && parts[1] === "demo")) return fallback;
    return target;
  } catch {
    return fallback;
  }
}
