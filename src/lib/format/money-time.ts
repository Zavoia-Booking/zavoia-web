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

/**
 * Format a duration span as `30m–1h`, collapsing to a single value when the
 * bounds match. Time gets a range where money gets a "from" — a duration range
 * reads naturally, a price range reads cluttered.
 */
export function formatDurationRange(min: number, max: number): string {
  if (!Number.isFinite(max) || max <= min) return formatDuration(min);
  // Non-breaking spaces around the dash: same look as plain spaces, but the
  // range can't wrap onto two lines mid-way in a narrow service row.
  return `${formatDuration(min)} – ${formatDuration(max)}`;
}

/**
 * The price/duration spread of a service across the professionals who can
 * perform it. Every spread field is optional so a surface fed by an endpoint
 * that doesn't compute one (team-member profile, bundle line-items) degrades
 * to the exact figures instead of rendering a bogus range.
 */
export interface ServiceSpread {
  priceAmountMinor: number;
  duration: number;
  priceFromMinor?: number;
  priceVariesByStaff?: boolean;
  durationMinMinutes?: number;
  durationMaxMinutes?: number;
  durationVariesByStaff?: boolean;
}

/**
 * Build the meta line for a service on a pre-staff-selection list.
 *
 * Money uses "from {min}" and time uses a range — the asymmetry is the
 * marketplace convention (Fresha/Treatwell/Booksy all do it this way), not an
 * oversight. `priceVaries` is returned rather than baked into `price` so the
 * caller can style the "from" prefix lighter than the price itself.
 */
export function formatServiceSpread(
  service: ServiceSpread,
  currency: string,
  locale: string,
): { duration: string; price: string; priceVaries: boolean } {
  const priceVaries = service.priceVariesByStaff === true;
  return {
    duration: service.durationVariesByStaff
      ? formatDurationRange(
          service.durationMinMinutes ?? service.duration,
          service.durationMaxMinutes ?? service.duration,
        )
      : formatDuration(service.duration),
    price: formatMoney(
      priceVaries
        ? (service.priceFromMinor ?? service.priceAmountMinor)
        : service.priceAmountMinor,
      currency,
      locale,
    ),
    priceVaries,
  };
}
