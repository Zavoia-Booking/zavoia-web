import { Suspense } from "react";
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
import { InYourCity } from "@/app/_components/home/in-your-city";
import { BrandsSection } from "@/app/_components/home/brands-section";
import { NearYouSection } from "@/app/_components/home/near-you-section";
import { RecentlyViewed } from "@/app/_components/home/recently-viewed";
import { EditorsPick } from "@/app/_components/home/editors-pick";
import {
  CardGridSkeleton,
  CategoryRailSkeleton,
} from "@/app/_components/home/section-skeletons";
import {
  AppBand,
  BizStrip,
  TrustBand,
} from "@/app/_components/home/editorial-bands";

export interface HomeContentProps {
  locale: Locale;
  // Promises, not resolved data: page.tsx starts the requests and hands them
  // over unawaited so the editorial shell can stream immediately while the
  // marketplace feeds are still in flight.
  industries: Promise<Industry[]>;
  editorsPick: Promise<LocationCard[]>;
  brands: Promise<BrandCard[]>;
}

// Home page composition (server component). The editorial sections (hero,
// bands) carry no data and render into the static shell; every section that
// depends on admin-api sits behind its own <Suspense> boundary so a slow or
// cold backend delays only that strip, never the first paint.
//
// Sections & their data source:
//   1. Hero .............. editorial (client: typewriter + router)
//   2. Category rail ..... getIndustries          [streamed]
//   3. In your city ...... searchListings (client: coords + 50km + seeded
//                          shuffle, strict, paged 10/page)
//   4. Brands ............ getBrands              [streamed]
//   5. Recently viewed ... localStorage + getListingsBulk (client, 1 call)
//   6. Editor's pick ..... searchListings, no geo (server-rendered)
//   7. Near you .......... getNearbyLocations (client coords + 20km, strict)
//   8. App band .......... editorial
//   9. Trust band ........ editorial
//  10. For-business strip  editorial
//
// Deferred for v1 (no public endpoint / auth-only): Offers row, Visits strip,
// Book again / Rebook.
export function HomeContent({
  locale,
  industries,
  editorsPick,
  brands,
}: HomeContentProps) {
  return (
    <main>
      <Hero />

      <Suspense fallback={<CategoryRailSkeleton />}>
        <CategorySection locale={locale} industries={industries} />
      </Suspense>

      <InYourCity />

      <Suspense fallback={<CardGridSkeleton count={4} />}>
        <BrandsBlock locale={locale} brands={brands} />
      </Suspense>

      <RecentlyViewed />

      <Suspense fallback={<CardGridSkeleton />}>
        <PicksSection locale={locale} editorsPick={editorsPick} />
      </Suspense>

      <NearYouSection />

      <AppBand locale={locale} />
      <TrustBand locale={locale} />
      <BizStrip locale={locale} />
    </main>
  );
}

async function CategorySection({
  locale,
  industries,
}: {
  locale: Locale;
  industries: Promise<Industry[]>;
}) {
  return <CategoryRail locale={locale} industries={await industries} />;
}

// Brand cards lead with the brand name; nav target is still the primary
// location page until the dedicated brand page exists.
async function BrandsBlock({
  locale,
  brands,
}: {
  locale: Locale;
  brands: Promise<BrandCard[]>;
}) {
  const cards = (await brands).map((b) => brandCardToData(b, locale));
  return <BrandsSection cards={cards} />;
}

// The only server-rendered card feed left on the home page: everything else is
// location-scoped, so it can only be resolved on the client.
async function PicksSection({
  locale,
  editorsPick,
}: {
  locale: Locale;
  editorsPick: Promise<LocationCard[]>;
}) {
  const cards = (await editorsPick).map((l) => locationCardToData(l, locale));
  return <EditorsPick cards={cards} />;
}
