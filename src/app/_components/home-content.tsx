import type { Locale } from "@/i18n/locales";
import type {
  BrandCard,
  Industry,
  LocationCard,
} from "@/lib/api/marketplace/types";
import {
  brandCardToData,
  locationCardToData,
} from "@/lib/marketplace/card-mappers";
import { Hero } from "@/app/_components/home/hero";
import { CategoryRail } from "@/app/_components/home/category-rail";
import { AvailableToday } from "@/app/_components/home/available-today";
import { BrandsSection } from "@/app/_components/home/brands-section";
import { NearYouSection } from "@/app/_components/home/near-you-section";
import { RecentlyViewed } from "@/app/_components/home/recently-viewed";
import { EditorsPick } from "@/app/_components/home/editors-pick";
import {
  AppBand,
  BizStrip,
  TrustBand,
} from "@/app/_components/home/editorial-bands";

export interface HomeContentProps {
  locale: Locale;
  industries: Industry[];
  latest: LocationCard[];
  brands: BrandCard[];
}

// Home page composition (server component). Data is fetched in page.tsx and
// passed in; here we map BusinessCard → BusinessCardData and lay out the
// sections in editorial order.
//
// Sections & their data source:
//   1. Hero .............. editorial (client: typewriter + router)
//   2. Category rail ..... getIndustries
//   3. Fresh on Zavoia ... getLatestListings (location cards — one per location)
//   4. Brands ............ getBrands (brand cards — one per business)
//   5. Recently viewed ... localStorage + getListingsBulk (client, 1 call)
//   6. Editor's pick ..... reuses the latest-listings array (no extra fetch)
//   7. Near you .......... getNearbyLocations (client geolocation; falls
//                          back to latest listings)
//   8. App band .......... editorial
//   9. Trust band ........ editorial
//  10. For-business strip  editorial
//
// Deferred for v1 (no public endpoint / auth-only): Offers row, Visits strip,
// Book again / Rebook.
export function HomeContent({
  locale,
  industries,
  latest,
  brands,
}: HomeContentProps) {
  // Fresh on Zavoia is location-led: one card per LOCATION (name, photo,
  // per-location rating), linking to that location's detail page.
  const latestCards = latest.map((l) => locationCardToData(l, locale));
  // Brand cards lead with the brand name; nav target is still the primary
  // location page until the dedicated brand page exists.
  const brandCards = brands.map((b) => brandCardToData(b, locale));

  return (
    <main>
      <Hero />
      <CategoryRail locale={locale} industries={industries} />
      <AvailableToday cards={latestCards} />
      <BrandsSection cards={brandCards} />
      <RecentlyViewed />
      <EditorsPick cards={latestCards} />
      <NearYouSection fallback={latestCards} />
      <AppBand locale={locale} />
      <TrustBand locale={locale} />
      <BizStrip locale={locale} />
    </main>
  );
}
