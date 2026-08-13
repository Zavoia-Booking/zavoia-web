/**
 * Published-website payload → microsite renderer inputs.
 *
 * Mirrors admin-dashboard's `buildPreviewData` (sectionBuilderModel.ts): the same
 * `PreviewData` contract feeds the same copied `LivePreview` renderer, so the public
 * page at zavoia.com/[businessSlug] is pixel-identical to the builder's full preview.
 * The frozen snapshot supplies layout/theme/copy; locations, reviews, rating stats
 * and tag dictionaries are the live projections served on the public payload.
 */
import type { PublicWebsite } from "@/lib/api/marketplace/types";
import type {
  AnnouncementContent,
  SectionEntry,
} from "./types";
import type {
  PreviewData,
} from "./components/builder/preview/shared/types";
import type {
  ChipOption,
  ResolvedTagDictionaries,
} from "@/features/marketplace/hooks/useLocationTagDictionaries";
import { resolveTagLabel, type MicrositeLocale } from "./i18n/translate";

/** Structurally-valid blank announcement for snapshots published without one. */
const EMPTY_ANNOUNCEMENT: AnnouncementContent = {
  message: { en: "", ro: "" },
  details: null,
  cta: {
    enabled: false,
    label: { en: "", ro: "" },
    url: "",
    newTab: false,
    showArrow: false,
  },
  schedule: null,
};

/**
 * Resolve the raw dictionary payload (id/slug/canonical name per group) into the
 * localized ChipOptions the Locations section renders — mirrors the dashboard's
 * `useLocationTagDictionaries` (localized label when present, else the backend name).
 */
function resolveTagDictionaries(
  raw: PublicWebsite["tagDictionaries"],
  locale: MicrositeLocale,
): ResolvedTagDictionaries | null {
  if (!raw) return null;
  const resolve = (
    group: "amenities" | "paymentMethods" | "languages",
  ): ChipOption[] =>
    (raw[group] ?? []).map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      label: resolveTagLabel(locale, group, entry.slug, entry.name),
    }));
  return {
    amenities: resolve("amenities"),
    paymentMethods: resolve("paymentMethods"),
    languages: resolve("languages"),
  };
}

export interface MicrositeRender {
  layout: SectionEntry[];
  data: PreviewData;
}

export function buildMicrositeRender(
  site: PublicWebsite,
  locale: MicrositeLocale,
): MicrositeRender {
  const snapshot = site.website;
  const { identity } = site;

  // Mirrors the dashboard's teamRatings memo: only members with reviews get stars.
  const teamRatings: Record<number, { rating: number; count: number }> = {};
  for (const teamMember of site.reviewStats?.teamMembers ?? []) {
    if (teamMember.totalReviews > 0 && teamMember.averageRating !== null) {
      teamRatings[teamMember.teamMemberId] = {
        rating: teamMember.averageRating,
        count: teamMember.totalReviews,
      };
    }
  }

  const data: PreviewData = {
    businessName: identity.name ?? "",
    businessTimezone: identity.timezone?.trim() || "UTC",
    logo: identity.logo ?? null,
    heroImageUrl: snapshot.heroImageUrl ?? null,
    tagline: snapshot.tagline ?? "",
    aboutContent: snapshot.aboutContent ?? "",
    establishedYear: snapshot.establishedYear ?? null,
    businessCurrency: identity.businessCurrency?.trim().toUpperCase() || "EUR",
    email: identity.email ?? "",
    phone: identity.phone ?? "",
    social: {
      instagram: identity.instagramUrl,
      facebook: identity.facebookUrl,
      tiktok: identity.tiktokUrl,
      website: identity.websiteUrl,
      pinterest: identity.pinterestUrl,
    },
    locations: site.locations ?? [],
    faq: snapshot.faq ?? [],
    announcement: snapshot.announcement ?? EMPTY_ANNOUNCEMENT,
    brandColor: snapshot.brandColorHex ?? snapshot.pageTheme?.brandColor ?? "",
    fontKey: snapshot.pageTheme?.fontKey ?? "modern",
    locale,
    reviews: site.reviews ?? [],
    teamRatings,
    ratingDistribution: site.reviewStats?.ratingDistribution,
    tagDictionaries: resolveTagDictionaries(site.tagDictionaries, locale),
  };

  return { layout: snapshot.pageLayout ?? [], data };
}
