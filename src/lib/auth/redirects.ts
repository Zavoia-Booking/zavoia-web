import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";

export function safeRedirectTarget(
  param: string | null,
  locale: Locale,
  fallback: string,
): string {
  if (!param) return fallback;
  if (!param.startsWith("/")) return fallback;
  if (param.startsWith("//") || param.startsWith("/\\")) return fallback;
  if (param.includes("\\")) return fallback;
  if (param.includes(":")) return fallback;
  return param;
}

export function defaultPostAuthTarget(locale: Locale): string {
  return localeHref(locale);
}
