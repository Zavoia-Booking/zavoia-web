/**
 * Local-date helpers (ISO YYYY-MM-DD, locale-agnostic). Ported from the search
 * overlay prototype (docs/web-search-overlay.jsx — zwFmtDateISO/zwParseDateISO/
 * zwSameDay). These intentionally operate on the LOCAL calendar day (not UTC),
 * so the calendar's "today" and a picked date match the user's wall clock.
 */

/** Format a Date as `YYYY-MM-DD` using its local calendar fields. */
export function zwFmtDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a `YYYY-MM-DD` string into a local-midnight Date, or null. */
export function zwParseDateISO(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  return new Date(
    parseInt(m[1], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[3], 10),
  );
}

/** True when two Dates fall on the same local calendar day. */
export function zwSameDay(a: Date | null, b: Date | null): boolean {
  return (
    a != null &&
    b != null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Local-midnight Date for "today". */
export function zwToday(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Local-midnight Date for the day after `d`. */
export function zwTomorrow(d: Date): Date {
  const t = new Date(d);
  t.setDate(d.getDate() + 1);
  return t;
}
