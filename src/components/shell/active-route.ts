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
