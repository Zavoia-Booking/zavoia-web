import { dictionaries } from "@/i18n/dictionaries";
import { format, formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { formatPrice, getPlanPricing } from "./pricing";
import type { FaqItem } from "@/lib/seo/entities";

export type MarketingPage = "for-business" | "pricing" | "web-studio";
export type MarketingFaqItem = FaqItem;

/** Resolve the public copy once for metadata, rendered answers and structured data. */
export function marketingPageContent(locale: Locale, page: MarketingPage): {
  name: string;
  description: string;
  faqItems: MarketingFaqItem[];
} {
  const dict = dictionaries[locale];
  const pricing = getPlanPricing(locale);
  const counts = dict.businessMarketing.counts;
  const values = {
    days: formatCount(pricing.trialDays, locale, counts.days),
    seat: formatPrice(pricing.teamMember, pricing.currency),
    base: formatPrice(pricing.plans.base.monthly, pricing.currency),
    plus: formatPrice(pricing.plans.plus.monthly, pricing.currency),
    baseTeamMembers: formatCount(pricing.teamMemberLimits.base, locale, counts.teamMembers),
    baseLocations: formatCount(pricing.plans.base.locations, locale, counts.locations),
    plusLocations: formatCount(pricing.plans.plus.locations, locale, counts.locations),
  };
  if (page === "web-studio") {
    const t = dict.webStudio;
    return {
      name: t.pageTitle,
      description: t.pageDescription,
      // Studio copy says "{days}-day", so it needs the figure rather than the plural phrase.
      faqItems: t.faq.items.map(item => ({
        q: item.q,
        a: format(item.a, { days: String(pricing.trialDays) }),
        ...(item.helpLink && { link: { label: item.helpLink, href: localeHref(locale, "help") } }),
      })),
    };
  }
  const t = page === "pricing" ? dict.pricing : dict.forBusiness;
  return {
    name: t.pageTitle,
    description: format(t.pageDescription, values),
    faqItems: t.faq.items.map(item => ({ q: item.q, a: format(item.a, values) })),
  };
}
