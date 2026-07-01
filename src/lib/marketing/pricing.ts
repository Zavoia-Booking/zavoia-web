// Pricing data — single plan, priced per bookable team member, MONTHLY only.
// Currency is derived from the active locale (NOT IP detection): `ro` → RON,
// everything else (incl. `en`) → EUR. Numeric/currency values live here (not in
// the i18n dictionaries) and are interpolated into copy, so the value is shared
// between the server route and the client calculator without a global.

/** Supported marketing currencies, mapped from the locale. */
export type PricingCurrency = "RON" | "EUR";

/** Price per bookable team member / month, by currency. */
const MONTHLY: Record<PricingCurrency, number> = {
  RON: 100,
  EUR: 20,
};

/** Free-trial length in days (locale-independent). */
export const TRIAL_DAYS = 14;

/** Plan name (locale-independent brand string). */
export const PRICING_NAME = "Zavoia Business";

/** Resolved pricing for a given locale. */
export interface Pricing {
  /** Plan name, e.g. "Zavoia Business". */
  name: string;
  /** Currency code derived from the locale. */
  currency: PricingCurrency;
  /** Price per bookable team member / month, billed monthly. */
  monthly: number;
  /** Free-trial length in days. */
  trialDays: number;
}

/** Locale → currency: `ro` is RON, every other locale (incl. `en`) is EUR. */
export function currencyForLocale(locale: string): PricingCurrency {
  return locale === "ro" ? "RON" : "EUR";
}

/** Resolve the (monthly-only) pricing for a locale. */
export function getPricing(locale: string): Pricing {
  const currency = currencyForLocale(locale);
  return {
    name: PRICING_NAME,
    currency,
    monthly: MONTHLY[currency],
    trialDays: TRIAL_DAYS,
  };
}

/**
 * Clean marketing display of a price, no decimals.
 * EUR → "€20" (symbol prefix); RON → "100 RON" (suffix, the conventional form).
 */
export function formatPrice(amount: number, currency: PricingCurrency): string {
  return currency === "EUR" ? `€${amount}` : `${amount} RON`;
}
