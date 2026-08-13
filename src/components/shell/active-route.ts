import { LOCALES } from "@/i18n/locales";

// Strips the locale prefix from a Next pathname and returns the leading
// path segment (the "route key"). Used by the shell chrome to derive active
// states without the prototype's hash router.
//   "/"            → ""        (home)
//   "/search"      → "search"
//   "/ro/search"   → "search"
//   "/business/42" → "business"
export function routeKey(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && (LOCALES as readonly string[]).includes(parts[0])) {
    parts.shift();
  }
  return parts[0] ?? "";
}

// Every static top-level route under app/[locale]/. A single path segment that
// is NOT one of these is a published business microsite (zavoia.com/[businessSlug],
// served by the depth-one [city] dynamic segment); at depth two the same segment
// is a city browse page, which keeps the shell.
const STATIC_TOP_ROUTES = new Set([
  "account",
  "appointments",
  "auth",
  "blog",
  "brand",
  "business",
  "for-business",
  "help",
  "login",
  "pricing",
  "register",
  "saved",
  "search",
  "terms",
  "try",
  "web-studio",
]);

/** True when `pathname` is a published business microsite (full-bleed: no marketplace shell). */
export function isBusinessMicrositePath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && (LOCALES as readonly string[]).includes(parts[0])) {
    parts.shift();
  }
  return parts.length === 1 && !STATIC_TOP_ROUTES.has(parts[0]);
}

/**
 * Routes that own the whole viewport and bring their own chrome, so the
 * marketplace header, footer and mobile tab bar are all suppressed: a
 * published business microsite, and /try (a real microsite under a floating
 * shuffle dock — marketplace chrome on top of it would be two navs at once).
 */
export function isFullBleedPath(pathname: string): boolean {
  return isBusinessMicrositePath(pathname) || routeKey(pathname) === "try";
}
