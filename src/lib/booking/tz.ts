/**
 * Timezone helpers for the booking flow — dependency-free (Intl only).
 *
 * The availability endpoints return calendar days (YYYY-MM-DD) and slot times
 * (HH:mm) as WALL-CLOCK values in the LOCATION's timezone. The booking endpoint
 * wants `scheduledAt` as a full UTC ISO instant. These helpers bridge the two
 * without pulling in a date library, by round-tripping a UTC guess through
 * `Intl.DateTimeFormat` to discover the location's offset for that instant
 * (DST-correct, since the offset is computed for the specific date).
 */

/**
 * Convert a wall-clock date + time in `timeZone` to a UTC ISO instant.
 * @param date YYYY-MM-DD
 * @param time HH:mm (24h)
 * @param timeZone IANA tz id (e.g. "Europe/Bucharest")
 */
export function zonedWallTimeToUtcISO(
  date: string,
  time: string,
  timeZone: string,
): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    dtf.formatToParts(new Date(guess)).map((x) => [x.type, x.value]),
  );
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
  );
  const offset = asUTC - guess;
  return new Date(guess - offset).toISOString();
}

/** Today's date (YYYY-MM-DD) as observed in `timeZone`. */
export function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
