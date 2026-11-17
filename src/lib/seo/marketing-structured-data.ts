import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import type { MarketingFaqItem, MarketingPage } from "@/lib/marketing/page-content";
import { formatPrice, getPlanPricing, type PlanId } from "@/lib/marketing/pricing";
import { SITE_URL } from "@/lib/site";
import { webPageId, webPageNode } from "./entities";
import { organizationId, siteEntities } from "./site-identity";

export const businessApplicationId = `${SITE_URL}/#business-application`;
export const webStudioApplicationId = `${SITE_URL}/#web-studio-application`;

/** The software described by the public business pages; no unverified store/review claims. */
function businessApplication(locale: Locale) {
  return {
    "@type": "SoftwareApplication",
    "@id": businessApplicationId,
    name: "Zavoia",
    description: dictionaries[locale].forBusiness.hero.lead,
    url: `${SITE_URL}${localeHref(DEFAULT_LOCALE, "for-business")}`,
    applicationCategory: "BusinessApplication",
    // The business page displays both platform badges. Minimum OS versions
    // and store/review URLs are not verified and must not be guessed.
    operatingSystem: ["Android", "iOS"],
    softwareRequirements: "Web access requires a browser with JavaScript enabled",
    publisher: { "@id": organizationId },
    softwareHelp: { "@id": webPageId(localeHref(locale, "help")) },
  };
}

/** Monthly subscription offers use the same amounts and conditions as the plan cards. */
function planOffers(locale: Locale, plans: readonly PlanId[]) {
  const pricing = getPlanPricing(locale);
  const dict = dictionaries[locale];
  const copy = dict.businessMarketing.plans;
  return plans.map(plan => ({
    "@type": "Offer",
    // Currency is part of offer identity; EN and RO display different approved amounts.
    "@id": `${SITE_URL}/#plan-${plan}-${pricing.currency.toLowerCase()}`,
    name: copy[plan].name,
    description: [copy[plan].line, dict.pricing.billing.terms,
      format(dict.pricing.billing.currencyNote, { currency: pricing.currency })].join(" "),
    url: `${SITE_URL}${localeHref(locale, "pricing")}#pricing-plan-${plan}`,
    seller: { "@id": organizationId },
    price: pricing.plans[plan].monthly,
    priceCurrency: pricing.currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: pricing.plans[plan].monthly,
      priceCurrency: pricing.currency,
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      // The base subscription includes the owner. Additional seats are variable usage.
      description: format(copy.subscription, { price: formatPrice(pricing.plans[plan].monthly, pricing.currency) }),
    },
    addOn: {
      "@type": "Offer",
      name: copy.teamSeatPrice.label,
      seller: { "@id": organizationId },
      price: pricing.teamMember,
      priceCurrency: pricing.currency,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: pricing.teamMember,
        priceCurrency: pricing.currency,
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
        description: copy.teamSeatPrice.label,
      },
    },
  }));
}

export function marketingStructuredData(locale: Locale, page: MarketingPage, content: {
  name: string;
  description: string;
  faqItems: readonly MarketingFaqItem[];
}) {
  const isStudio = page === "web-studio";
  const application = isStudio ? {
    "@type": "WebApplication",
    "@id": webStudioApplicationId,
    name: "Zavoia Web Studio",
    url: `${SITE_URL}${localeHref(DEFAULT_LOCALE, "web-studio")}`,
    description: dictionaries[locale].webStudio.hero.lead,
    applicationCategory: "BusinessApplication",
    // Web Studio runs in the browser; it has no native OS requirement.
    operatingSystem: "Any",
    browserRequirements: "Requires a web browser with JavaScript enabled",
    applicationSuite: "Zavoia",
    publisher: { "@id": organizationId },
    softwareHelp: { "@id": webPageId(localeHref(locale, "help")) },
  } : businessApplication(locale);
  // Both business pages display both plan cards; Studio displays the Plus
  // subscription that includes publishing. This is a paid monthly bundle,
  // never a standalone Studio price or a permanently free trial offer.
  const offers = planOffers(locale, isStudio ? ["plus"] : ["base", "plus"]);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...siteEntities(),
      webPageNode({ locale, path: localeHref(locale, page), name: content.name,
        description: content.description, mainEntityId: application["@id"], faqItems: content.faqItems }),
      { ...application, mainEntityOfPage: { "@id": webPageId(localeHref(locale, page)) },
        offers },
    ],
  };
}
