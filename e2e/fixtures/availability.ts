import type { Page } from '@playwright/test'
import { API_URL } from './customer-helpers'
import { todayInTz, fmtTimeLabel } from './slot-time'

const TIMEZONE = 'Europe/Bucharest'

interface RawSlotItem {
  availableStaffIds: number[]
}
interface RawSlot {
  startTime: string
  items: RawSlotItem[]
}
interface CalendarDay {
  date: string
  status: string
}

/**
 * Finds a real, currently-open slot where every id in `requiredStaffIds` is
 * available, by querying the SAME public availability endpoints the drawer
 * itself calls (customer-booking.service.ts) — no UI interaction at all, so
 * this is fast regardless of how many days need checking.
 *
 * Exists because clicking through days/slots in the UI one at a time (the
 * first approach here) proved both slow AND fragile once the shared demo
 * calendar was heavily booked by other tests in this ~95-test suite: a
 * multi-day UI scan can burn the whole test timeout, and re-querying
 * `.nth(i)` locators against a list that can shift between reads risks a
 * Playwright action hanging on a moving target. A direct API scan sidesteps
 * both — verified against a live run where the identical UI approach
 * consistently exceeded a 60s test timeout while this resolves in ~1-2s.
 */
export async function findApiSlotWithStaff(
  page: Page,
  args: { businessId: number; locationId: number; serviceId: number; requiredStaffIds: number[] },
  opts: { daysToCheck?: number } = {},
): Promise<{ date: string; startTime: string; label: string }> {
  const calRes = await page.request.post(`${API_URL}/marketplace/public/booking/calendar`, {
    data: {
      businessId: args.businessId,
      locationId: args.locationId,
      services: [{ serviceId: args.serviceId }],
      startDate: todayInTz(TIMEZONE),
      daysToCheck: opts.daysToCheck ?? 30,
    },
  })
  if (!calRes.ok()) throw new Error(`findApiSlotWithStaff: calendar fetch failed: ${calRes.status()}`)
  const calBody = (await calRes.json()) as { data: { calendar: CalendarDay[] } }
  const openDays = calBody.data.calendar.filter((d) => d.status === 'available')

  for (const day of openDays) {
    const slotsRes = await page.request.post(`${API_URL}/marketplace/public/booking/slots`, {
      data: {
        businessId: args.businessId,
        locationId: args.locationId,
        services: [{ serviceId: args.serviceId }],
        date: day.date,
      },
    })
    if (!slotsRes.ok()) continue
    const slotsBody = (await slotsRes.json()) as { data: { slots: RawSlot[] } }
    const match = slotsBody.data.slots.find((s) => {
      const ids = s.items[0]?.availableStaffIds ?? []
      return args.requiredStaffIds.every((id) => ids.includes(id))
    })
    if (match) {
      return { date: day.date, startTime: match.startTime, label: fmtTimeLabel(day.date, match.startTime, TIMEZONE) }
    }
  }
  throw new Error(
    `findApiSlotWithStaff: no slot across ${openDays.length} open day(s) has all of [${args.requiredStaffIds.join(', ')}] available.`,
  )
}
