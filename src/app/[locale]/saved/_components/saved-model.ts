import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { AllFavorites } from "@/lib/api/marketplace/types";
import type { TeamMemberSeed } from "@/app/[locale]/business/_components/team-member-profile-modal";

export type SavedKind = "location" | "person";
export type SavedFilter = "all" | SavedKind;

export interface SavedItem {
  kind: SavedKind;
  key: string;
  entityId: number;
  media: string | null;
  /** Whose location this is; null when it would only repeat the title. */
  brand: string | null;
  industry: { name: string; slug: string } | null;
  title: string;
  rating: number | null;
  reviews: number;
  subtitle: string;
  href: string | null;
  createdAt: string;
  person?: TeamMemberSeed;
}

function number(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rating(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && parsed > 0 && parsed <= 5 ? parsed : null;
}

function reviewCount(value: unknown): number {
  return Math.max(0, Math.floor(number(value) ?? 0));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** One list, newest saved first. The API supplies a save date for every
 * location and person, so the order never depends on the entity type. */
export function buildSavedItems(
  favorites: AllFavorites,
  locale: Locale,
  unnamedPerson: string,
): SavedItem[] {
  const locations: SavedItem[] = favorites.locations.map(
    ({ location, createdAt }) => {
      const title = location.name.trim();
      // Location names are often neighbourhoods ("Dorobanți"), so the brand
      // says whose they are. Like the homepage cards, skip it when it repeats.
      const brand = location.business?.name.trim() || null;
      return {
        kind: "location",
        key: `l-${location.id}`,
        entityId: location.id,
        media: location.featuredImage?.trim() || null,
        brand:
          brand && brand.toLowerCase() !== title.toLowerCase() ? brand : null,
        industry: location.business?.industry ?? null,
        title,
        rating: rating(location.averageRating),
        reviews: reviewCount(location.totalReviews),
        subtitle: location.address?.trim() || location.city?.trim() || "",
        href: localeHref(
          locale,
          "business",
          location.slug?.trim() || String(location.id),
        ),
        createdAt,
      };
    },
  );
  const people: SavedItem[] = favorites.professionals.map(
    ({ professional: person, createdAt }) => {
      const title =
        person.displayName?.trim() ||
        [person.firstName, person.lastName]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(" ") ||
        unnamedPerson;
      const averageRating = rating(person.averageRating);
      const totalReviews = reviewCount(person.totalReviews);
      return {
        kind: "person",
        key: `p-${person.id}`,
        entityId: person.id,
        media: person.profileImage?.trim() || null,
        brand: null,
        industry: null,
        title,
        rating: averageRating,
        reviews: totalReviews,
        subtitle: "",
        href: null,
        createdAt,
        person: {
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          displayName: title,
          profileImage: person.profileImage,
          professionalTitle: person.professionalTitle?.trim() || null,
          averageRating,
          totalReviews,
        },
      };
    },
  );
  // Equal dates keep the API order; an unreadable date sorts last.
  return [...locations, ...people].sort(
    (a, b) => timestamp(b.createdAt) - timestamp(a.createdAt),
  );
}

