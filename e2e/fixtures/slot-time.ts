/**
 * Timezone math, dependency-free (copied from src/lib/booking/tz.ts's
 * algorithm, not imported — no e2e spec imports app source under `@/`).
 * Every demo location's timezone is Europe/Bucharest (playwright.config.ts).
 */

export function zonedWallTimeToUtcISO(date: string, time: string, timeZone: string): string {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const p = Object.fromEntries(dtf.formatToParts(new Date(guess)).map((x) => [x.type, x.value]))
  const hour = p.hour === '24' ? 0 : Number(p.hour)
  const asUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), hour, Number(p.minute), Number(p.second))
  const offset = asUTC - guess
  return new Date(guess - offset).toISOString()
}

export function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  )
}

/** Matches the drawer's own slot-label rendering (BookingDrawer.tsx's fmtTimeLabel) — e.g. "10:00 AM". */
export function fmtTimeLabel(date: string, time: string, timeZone: string): string {
  const iso = zonedWallTimeToUtcISO(date, time, timeZone)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso))
}
