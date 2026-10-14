import "server-only";
import type { Metadata } from "next";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

/** Missing-content metadata is shared by standalone and matched fallbacks. */
export function notFoundMetadata(locale: Locale): Metadata {
  const t = dictionaries[locale].notFound.page;
  return {
    title: { absolute: `404 — ${t.title} | Zavoia` },
    description: t.description,
    robots: { index: false, follow: false },
  };
}
