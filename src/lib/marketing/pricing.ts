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

/**
 * One-time price range for a premium Web Studio section style, by currency.
 * Mirrors the backend catalogue: EUR is the default row price on
 * `website_section_variant`; RON is the RO regional override in
 * `website_variant_pricing`. Kept beside MONTHLY so the two can never drift.
 */
const PREMIUM_STYLE_RANGE: Record<PricingCurrency, [number, number]> = {
  EUR: [9, 24],
  RON: [45, 120],
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
 * Formatted one-time pricing for a premium Web Studio style, in the locale's
 * own currency — never a EUR figure beside a RON plan price.
 *
 * `range` carries the currency once, where the language puts it: EUR prefixes
 * each figure ("€9–€24"), RON suffixes the pair ("45–120 RON"). Repeating the
 * unit on both ends reads as machine-made in Romanian.
 */
export function premiumStylePrices(locale: string): { min: string; range: string } {
  const currency = currencyForLocale(locale);
  const [min, max] = PREMIUM_STYLE_RANGE[currency];
  return {
    min: formatPrice(min, currency),
    range:
      currency === "EUR"
        ? `${formatPrice(min, currency)}–${formatPrice(max, currency)}`
        : `${min}–${formatPrice(max, currency)}`,
  };
}

/**
 * Clean marketing display of a price, no decimals.
 * EUR → "€20" (symbol prefix); RON → "100 RON" (suffix, the conventional form).
 */
export function formatPrice(amount: number, currency: PricingCurrency): string {
  return currency === "EUR" ? `€${amount}` : `${amount} RON`;
}
