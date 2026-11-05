// Pricing data, MONTHLY only. Currency is derived from the active locale (NOT IP
// detection): `ro` → RON, everything else (incl. `en`) → EUR. Numeric/currency
// values live here (not in the i18n dictionaries) and are interpolated into
// copy, so marketing pages and metadata use the same approved values.
//
// Business marketing surfaces share Base and Plus (`getPlanPricing`).

/** Supported marketing currencies, mapped from the locale. */
export type PricingCurrency = "RON" | "EUR";

/**
 * One-time price range for a premium Web Studio section style, by currency.
 * Mirrors the backend catalogue: EUR is the default row price on
 * `website_section_variant`; RON is the RO regional override in
 * `website_variant_pricing`. Kept with the plan prices so surfaces stay aligned.
 */
const PREMIUM_STYLE_RANGE: Record<PricingCurrency, [number, number]> = {
  EUR: [9, 24],
  RON: [45, 120],
};

/** Free-trial length in days (locale-independent). */
export const TRIAL_DAYS = 14;

/** Locale → currency: `ro` is RON, every other locale (incl. `en`) is EUR. */
export function currencyForLocale(locale: string): PricingCurrency {
  return locale === "ro" ? "RON" : "EUR";
}

/**
 * Formatted one-time pricing for a premium Web Studio style, in the locale's
 * own currency — never a EUR figure beside a RON plan price.
 */
export function premiumStylePrices(locale: string): { min: string; range: string } {
  const currency = currencyForLocale(locale);
  const [min, max] = PREMIUM_STYLE_RANGE[currency];
  return {
    min: formatPrice(min, currency),
    range: formatPriceRange(min, max, currency),
  };
}

// ── Base and Plus ─────────────────────────────────────────────────────────────

/** The two self-serve plans: admin-api's STANDARD tier is Base, PLUS is Plus. */
export type PlanId = "base" | "plus";

/**
 * Monthly plan price, by currency. These are the page prices agreed on
 * 2026-10-27. Checkout resolves production prices through Stripe by business
 * country; development seed amounts are not evidence of live billing prices.
 */
const PLAN_MONTHLY: Record<PlanId, Record<PricingCurrency, number>> = {
  base: { RON: 99, EUR: 20 },
  plus: { RON: 189, EUR: 38 },
};

/** Each team member besides the owner, per month, on either plan. */
const TEAM_MEMBER_MONTHLY: Record<PricingCurrency, number> = {
  RON: 35,
  EUR: 7,
};

/** Locations each plan allows (admin-api `plan.maxLocations`). */
const PLAN_LOCATIONS: Record<PlanId, number> = { base: 5, plus: 20 };

/** Public limits for additional team members; null means no plan limit. */
const TEAM_MEMBER_LIMITS = { base: 20, plus: null } as const;

/** Resolved Base and Plus pricing for a given locale. */
export interface PlanPricing {
  currency: PricingCurrency;
  trialDays: number;
  /** Monthly price of each team member besides the owner. */
  teamMember: number;
  /** Team members besides the owner; Plus has no customer-facing limit. */
  teamMemberLimits: { base: number; plus: number | null };
  plans: Record<PlanId, { monthly: number; locations: number }>;
}

/** Resolve Base and Plus pricing for a locale. */
export function getPlanPricing(locale: string): PlanPricing {
  const currency = currencyForLocale(locale);
  return {
    currency,
    trialDays: TRIAL_DAYS,
    teamMember: TEAM_MEMBER_MONTHLY[currency],
    teamMemberLimits: TEAM_MEMBER_LIMITS,
    plans: {
      base: { monthly: PLAN_MONTHLY.base[currency], locations: PLAN_LOCATIONS.base },
      plus: { monthly: PLAN_MONTHLY.plus[currency], locations: PLAN_LOCATIONS.plus },
    },
  };
}

// ── Formatting ────────────────────────────────────────────────────────────────

/** The figure alone: whole amounts without decimals, others to the cent. */
function formatAmount(amount: number, currency: PricingCurrency): string {
  const decimals = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(currency === "RON" ? "ro-RO" : "en-IE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Clean marketing display of a price.
 * EUR → "€20" (symbol prefix); RON → "100 RON" (suffix, the conventional form).
 */
export function formatPrice(amount: number, currency: PricingCurrency): string {
  const figure = formatAmount(amount, currency);
  return currency === "EUR" ? `€${figure}` : `${figure} RON`;
}

/**
 * A price range that carries the currency once, where the language puts it:
 * EUR prefixes each figure ("€9–€24"), RON suffixes the pair ("45–120 RON").
 * Repeating the unit on both ends reads as machine-made in Romanian.
 */
export function formatPriceRange(min: number, max: number, currency: PricingCurrency): string {
  return currency === "EUR"
    ? `${formatPrice(min, currency)}–${formatPrice(max, currency)}`
    : `${formatAmount(min, currency)}–${formatPrice(max, currency)}`;
}
