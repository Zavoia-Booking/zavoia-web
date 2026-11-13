import type { Metadata } from "next";
import { LOCALES, type Locale } from "@/i18n/locales";

// The production host; zavoia.com redirects here.
const DEFAULT_SITE_URL = "https://www.zavoia.com";

/** Accept a bare origin only: canonical and alternate URLs append their own paths. */
function publicOrigin(value: string | undefined): string {
  const configured = value?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  let url: URL | undefined;
  try {
    url = new URL(configured);
  } catch {
    url = undefined;
  }
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password
    || url.pathname !== "/" || url.search || url.hash) {
    // Never echo the value: a malformed URL can carry credentials into build logs.
    throw new Error("NEXT_PUBLIC_SITE_URL must be a bare http(s) origin, such as https://www.zavoia.com.");
  }
  return url.origin;
}

/**
 * The public origin for canonical, alternate, Open Graph, sitemap and JSON-LD
 * URLs. Production must use the host that answers directly, never one that
 * redirects. The value is inlined at build time because client-rendered
 * fallbacks read it as well.
 */
export const SITE_URL = publicOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** Open Graph `og:locale` for each interface language. */
export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  ro: "ro_RO",
};

/** Text alternatives for the shared brand artwork, whose own text is English. */
const DEFAULT_SOCIAL_IMAGE_ALT: Record<Locale, string> = {
  en: "Zavoia. Local services. On your schedule.",
  ro: "Zavoia. Servicii locale. Tu alegi când.",
};

/** Shared brand artwork, described in the page language. */
export function defaultSocialImage(locale: Locale) {
  return {
    url: `${SITE_URL}/brand/home-social.png`,
    width: 1200,
    height: 630,
    alt: DEFAULT_SOCIAL_IMAGE_ALT[locale],
  };
}

/**
 * Open Graph and Twitter tags for an indexable page. Metadata merges
 * shallowly, so a page that sets `openGraph` must set all of it.
 */
export function socialMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = defaultSocialImage(locale);
  return {
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: "Zavoia",
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OPEN_GRAPH_LOCALES[l]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
