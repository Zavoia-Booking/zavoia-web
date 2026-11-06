import type { Locale } from "@/i18n/locales";

export type MarketingMockupScene =
  | "consumerMap"
  | "consumerSchedule"
  | "marketplaceServices"
  | "businessCalendarDesktop"
  | "businessCalendarMobile"
  | "businessAppAssignments"
  | "businessAppMarketplace"
  | "studioBeauty"
  | "studioPet";

export type MarketingMockup = Readonly<{
  src: `/images/${string}`;
  width: number;
  height: number;
}>;

/** Actual product captures. Every scene has an explicit asset for each locale.
 * The homepage and business page share this inventory; page locale is the only
 * input, so a Romanian route never falls back to an English screenshot.
 * Run scripts/check-marketing-mockups.mjs after changing a capture or its size. */
export const MARKETING_MOCKUPS = {
  consumerMap: {
    en: { src: "/images/marketing/native/map-en.webp", width: 1080, height: 2424 },
    ro: { src: "/images/marketing/native/map-ro.webp", width: 1080, height: 2424 },
  },
  consumerSchedule: {
    en: { src: "/images/marketing/native/schedule-v2-en.webp", width: 1080, height: 2424 },
    ro: { src: "/images/marketing/native/schedule-v2-ro.webp", width: 1080, height: 2424 },
  },
  marketplaceServices: {
    en: { src: "/images/marketing/discovery/services-v2-en-desktop.webp", width: 1768, height: 1348 },
    ro: { src: "/images/marketing/discovery/services-v2-ro-desktop.webp", width: 1768, height: 1348 },
  },
  businessCalendarDesktop: {
    en: { src: "/images/for-business/calendar/day-v3-en-desktop.webp", width: 2560, height: 1600 },
    ro: { src: "/images/for-business/calendar/day-v3-ro-desktop.webp", width: 2560, height: 1600 },
  },
  businessCalendarMobile: {
    en: { src: "/images/for-business/calendar/day-v3-en-mobile.webp", width: 780, height: 1752 },
    ro: { src: "/images/for-business/calendar/day-v3-ro-mobile.webp", width: 780, height: 1752 },
  },
  businessAppAssignments: {
    en: { src: "/images/marketing/business-native/assignments-services-v2-en.webp", width: 1080, height: 2424 },
    ro: { src: "/images/marketing/business-native/assignments-services-v2-ro.webp", width: 1080, height: 2424 },
  },
  businessAppMarketplace: {
    en: { src: "/images/marketing/business-native/marketplace-portfolio-v2-en.webp", width: 1080, height: 2424 },
    ro: { src: "/images/marketing/business-native/marketplace-portfolio-v2-ro.webp", width: 1080, height: 2424 },
  },
  studioBeauty: {
    en: { src: "/images/marketing/studio/beauty-v2-en-desktop.webp", width: 1440, height: 960 },
    ro: { src: "/images/marketing/studio/beauty-v2-ro-desktop.webp", width: 1440, height: 960 },
  },
  studioPet: {
    en: { src: "/images/marketing/studio/pet-v2-en-mobile.webp", width: 780, height: 1520 },
    ro: { src: "/images/marketing/studio/pet-v2-ro-mobile.webp", width: 780, height: 1520 },
  },
} as const satisfies Record<MarketingMockupScene, Record<Locale, MarketingMockup>>;

export function getMarketingMockup(scene: MarketingMockupScene, locale: Locale): MarketingMockup {
  return MARKETING_MOCKUPS[scene][locale];
}
