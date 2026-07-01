/**
 * Money & duration formatters for the marketplace UI.
 *
 * Money is stored as integer MINOR units (cents/bani). Divide by 100 ONLY at
 * format time — never carry a divided value around. `currency` is the ISO 4217
 * code from `ListingDetail.businessCurrency` (e.g. "RON", "GBP", "EUR"); the
 * symbol is derived by `Intl.NumberFormat`, so we never hard-code a currency
 * glyph (unlike the prototype's £-assuming `zwFmtPrice`).
 */

/**
 * Format an integer minor-unit amount as a localized currency string.
 * Falls back to a plain decimal if the currency code is unknown/invalid so a
 * bad code never throws into a render.
 */
export function formatMoney(
  minor: number,
  currency: string,
  locale: string,
): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(major);
  } catch {
    return major.toFixed(2);
  }
}

/**
 * Format a duration in minutes as `45m`, `1h` or `1h 30m`.
 */
export function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
