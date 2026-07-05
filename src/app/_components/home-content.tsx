import type { Locale } from "@/i18n/locales";
import type { BusinessCard, Industry } from "@/lib/api/marketplace/types";
import { businessCardToData } from "@/lib/marketplace/card-mappers";
import { Hero } from "@/app/_components/home/hero";
import { CategoryRail } from "@/app/_components/home/category-rail";
import { AvailableToday } from "@/app/_components/home/available-today";
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
  latest: BusinessCard[];
}

// Home page composition (server component). Data is fetched in page.tsx and
// passed in; here we map BusinessCard → BusinessCardData and lay out the
// sections in editorial order.
//
// Sections & their data source:
//   1. Hero .............. editorial (client: typewriter + router)
//   2. Category rail ..... getIndustries
//   3. Fresh on Zavoia ... getLatestListings (business cards)
//   4. Recently viewed ... localStorage + getListingsBulk (client, 1 call)
//   5. Editor's pick ..... reuses the latest-listings array (no extra fetch)
//   6. Near you .......... getNearbyLocations (client geolocation; falls
//                          back to latest listings)
//   7. App band .......... editorial
//   8. Trust band ........ editorial
//   9. For-business strip  editorial
//
// Deferred for v1 (no public endpoint / auth-only): Offers row, Visits strip,
// Book again / Rebook.
export function HomeContent({ locale, industries, latest }: HomeContentProps) {
  const latestCards = latest.map((b) => businessCardToData(b, locale));

  return (
    <main>
      <Hero />
      <CategoryRail locale={locale} industries={industries} />
      <AvailableToday cards={latestCards} />
      <RecentlyViewed />
      <EditorsPick cards={latestCards} />
      <NearYouSection fallback={latestCards} />
      <AppBand locale={locale} />
      <TrustBand locale={locale} />
      <BizStrip locale={locale} />
    </main>
  );
}
