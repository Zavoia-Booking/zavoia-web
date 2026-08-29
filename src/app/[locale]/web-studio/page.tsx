import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  type Locale,
} from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { getPublicWebsite } from "@/lib/api/marketplace/public";
import { WEBSITE_TAG, websiteTag } from "@/lib/cache/tags";
import { buildMicrositeRender } from "@/features/website/publicWebsite";
import type { PreviewData } from "@/features/website/components/builder/preview/shared/types";
import { WebStudioContent } from "@/app/_components/web-studio/web-studio-content";

// The showcase is one published site rendered as a specimen: the same content
// for every visitor, changing only when its owner republishes. An hour of ISR
// is the right cadence — and the fetch carries the website tags, so a publish
// of the showcased site refreshes this page too rather than waiting the hour.
//
// It is prerendered per locale at build. A build while the backend is down
// still succeeds: `loadShowcase` swallows the failure and the page falls back
// to its authored specimen, which then self-heals on the next revalidation.
export const revalidate = 3600;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Business slugs the catalogue prefers for its live specimen, first one that
 * resolves wins. Override per environment with WEB_STUDIO_SHOWCASE_SLUG. When
 * none resolves the page falls back to its authored specimen, labelled as a
 * demonstration.
 */
const SHOWCASE_SLUGS = [
  process.env.WEB_STUDIO_SHOWCASE_SLUG,
  "demo-atelier-glow",
].filter(Boolean) as string[];

/**
 * A showcase site only earns the plates if it has enough real content to show
 * the catalogue's range — a business with three services and one photo makes
 * the product look thinner than it is. Below this bar the page uses its
 * authored specimen instead, labelled as a demonstration.
 */
function richEnough(data: PreviewData): boolean {
  const services = new Set(
    data.locations.flatMap((l) => l.services.map((s) => s.id)),
  ).size;
  const team = new Set(
    data.locations.flatMap((l) => l.teamMembers.map((m) => m.id)),
  ).size;
  const photos = data.locations.reduce(
    (n, l) => n + l.portfolioImages.length,
    0,
  );
  return data.locations.length > 0 && services >= 6 && team >= 3 && photos >= 6;
}

async function loadShowcase(
  locale: Locale,
): Promise<{ data: PreviewData; name: string } | null> {
  for (const slug of SHOWCASE_SLUGS) {
    try {
      const site = await getPublicWebsite(slug, {
        revalidate: 3600,
        tags: [WEBSITE_TAG, websiteTag(slug)],
      });
      const { data } = buildMicrositeRender(site, locale);
      if (richEnough(data)) return { data, name: data.businessName };
    } catch {
      // Unpublished, unentitled, or backend down — try the next candidate.
    }
  }
  return null;
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, localeHref(l, "web-studio")]),
  ) as Record<Locale, string>;

  return {
    title: dict.webStudio.pageTitle,
    description: dict.webStudio.pageDescription,
    alternates: {
      canonical: localeHref(locale, "web-studio"),
      languages: {
        ...languages,
        "x-default": localeHref(DEFAULT_LOCALE, "web-studio"),
      },
    },
  };
}

export default async function WebStudioPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const showcase = await loadShowcase(locale);

  return (
    <main data-impeccable-seed="e0b2c650">
      <WebStudioContent
        locale={locale}
        showcase={showcase?.data ?? null}
        showcaseName={showcase?.name ?? null}
      />
    </main>
  );
}
