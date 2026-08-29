import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { BusinessPage } from '../pages/BusinessPage'
import { BookingDrawer } from '../pages/BookingDrawer'
import { API_URL, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import {
  DEMO,
  clearStaffForService,
  getBusinessId,
  getLocationId,
  getServiceId,
  getUserIdByEmail,
  getUserIdByUuid,
  setBookingSettings,
} from '../fixtures/seed'
import { withTestDb } from '../fixtures/test-db'
import { gotoFreshLocation } from '../fixtures/revalidate'

/**
 * Timezone helpers, re-implemented locally (dependency-free — copied from
 * src/lib/booking/tz.ts's algorithm, not imported, since no prior e2e spec
 * imports app source under `@/` and this file is the only one in this slice
 * that needs raw wall-clock <-> UTC math for direct DB/API manipulation).
 * Every demo location's timezone is Europe/Bucharest (see playwright.config.ts).
 */
const TIMEZONE = 'Europe/Bucharest'

function zonedWallTimeToUtcISO(date: string, time: string, timeZone: string): string {
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

function todayInTz(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  )
}

function addMinutesClock(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const wrapped = ((h * 60 + m + minutes) % 1440 + 1440) % 1440
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

function fmtTimeLabel(date: string, time: string, timeZone: string): string {
  const iso = zonedWallTimeToUtcISO(date, time, timeZone)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(iso))
}

/** First enabled day cell in the drawer's calendar grid — chronologically the soonest available day. */
function firstAvailableDay(drawer: BookingDrawer) {
  return drawer.root.locator('button[aria-pressed]:not([disabled])').first()
}

/** First slot button rendered for the currently selected day. */
function firstSlot(drawer: BookingDrawer) {
  return drawer.root.locator('.zv-slot').first()
}

test.describe('Availability conflicts', () => {
  test('CONF-01 a service nobody performs at a location drops off the public menu', async ({ page }) => {
    const business = new BusinessPage(page)
    await business.goto(DEMO.locationSlugs.zenDorobanti)
    // Baseline: listed while Ioana can still perform it.
    await expect(business.serviceToggle('Reflexoterapie')).toBeVisible()

    await clearStaffForService(DEMO.locations.zenDorobanti, DEMO.services.zenReflexo.uuid)

    // The business page is ISR (600s floor) — force + wait out the
    // revalidation, or this reload can still serve the pre-mutation cache
    // (see e2e/fixtures/revalidate.ts). isFresh polls for the service
    // actually being gone rather than guessing how many reloads a
    // stale-while-revalidate background regen needs.
    await gotoFreshLocation(page, DEMO.locationSlugs.zenDorobanti, {
      isFresh: async () => (await business.serviceToggle('Reflexoterapie').count()) === 0,
    })
    // No error state on the page itself — the service simply isn't offered.
    await expect(business.serviceToggle('Reflexoterapie')).toHaveCount(0)
    await expect(business.servicesTab).toBeVisible()
    await expect(business.serviceToggle(DEMO.services.zenRelax.name)).toBeVisible()
  })

  test('CONF-03 two customers racing the same slot: the loser gets a conflict alert and only one booking is created', async ({
    page,
    browser,
  }) => {
    const userA = await signInAsFreshCustomer(page)
    const businessA = new BusinessPage(page)
    const drawerA = new BookingDrawer(page)

    // `browser.newContext()` does NOT inherit the project's `use` block
    // (baseURL/locale/timezoneId) the way the built-in `page` fixture does —
    // spread the resolved project options explicitly so relative `goto()`
    // calls and the Bucharest timezone both carry over to the second customer.
    const ctxB = await browser.newContext({ ...test.info().project.use })
    const pageB = await ctxB.newPage()
    const userB = await signInAsFreshCustomer(pageB)
    const businessB = new BusinessPage(pageB)
    const drawerB = new BookingDrawer(pageB)

    try {
      // A reaches a held-but-unconfirmed slot selection at step 3. Zen's
      // "Masaj de relaxare" is performed only by Ioana at Dorobanti, so both
      // customers land on the same professional with no staff choice to make.
      await businessA.goto(DEMO.locationSlugs.zenDorobanti)
      await businessA.addService(DEMO.services.zenRelax.name)
      await businessA.bookButton('Book 1 service').click()
      await drawerA.waitForOpen()
      await expect(drawerA.stepLabel(2)).toBeVisible()
      const dayA = firstAvailableDay(drawerA)
      await dayA.waitFor({ state: 'visible', timeout: 15_000 })
      await dayA.click()
      const slotA = firstSlot(drawerA)
      await slotA.waitFor({ state: 'visible', timeout: 15_000 })
      const slotLabel = ((await slotA.textContent()) ?? '').trim()
      expect(slotLabel).not.toBe('')
      await slotA.click()
      await expect(drawerA.continueFromSlotButton()).toBeEnabled()
      await drawerA.continueFromSlotButton().click()
      await expect(drawerA.confirmButton()).toBeVisible()

      // B independently reaches the SAME slot — the day is still untouched,
      // so its calendar/slots are identical to what A just saw.
      await businessB.goto(DEMO.locationSlugs.zenDorobanti)
      await businessB.addService(DEMO.services.zenRelax.name)
      await businessB.bookButton('Book 1 service').click()
      await drawerB.waitForOpen()
      await expect(drawerB.stepLabel(2)).toBeVisible()
      const dayB = firstAvailableDay(drawerB)
      await dayB.waitFor({ state: 'visible', timeout: 15_000 })
      await dayB.click()
      await expect(drawerB.slot(slotLabel)).toBeVisible({ timeout: 15_000 })
      await drawerB.slot(slotLabel).click()
      await expect(drawerB.continueFromSlotButton()).toBeEnabled()
      await drawerB.continueFromSlotButton().click()
      await expect(drawerB.confirmButton()).toBeVisible()

      // B confirms first and wins the race.
      await drawerB.confirmButton().click()
      await expect(drawerB.successHeading()).toBeVisible({ timeout: 15_000 })

      // A is now stale — confirming the same slot hits E10 (slot conflict):
      // the alert appears, the slot is dropped, and the grid refetches.
      await drawerA.confirmButton().click()
      await expect(drawerA.submitAlert()).toHaveText('That slot was just taken. Please choose another time.')
      await expect(drawerA.stepLabel(2)).toBeVisible()
      await expect(drawerA.slot(slotLabel)).toHaveCount(0)

      // Only one appointment exists across the two racing customers, and
      // it belongs to B.
      const idA = await getUserIdByEmail(userA.email)
      const idB = await getUserIdByEmail(userB.email)
      const rows = await withTestDb((client) =>
        client.query<{ customerId: number }>(
          `SELECT "customerId" FROM appointment WHERE "customerId" IN ($1, $2) AND status != 'cancelled'`,
          [idA, idB],
        ),
      )
      expect(rows.rowCount).toBe(1)
      expect(rows.rows[0].customerId).toBe(idB)
    } finally {
      await ctxB.close()
    }
  })

  test('CONF-04 raising the minimum notice while a slot is held rejects confirm without clearing the slot', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)
    const business = new BusinessPage(page)
    const drawer = new BookingDrawer(page)

    await business.goto(DEMO.locationSlugs.zenDorobanti)
    await business.addService(DEMO.services.zenRelax.name)
    await business.bookButton('Book 1 service').click()
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(2)).toBeVisible()

    const day = firstAvailableDay(drawer)
    await day.waitFor({ state: 'visible', timeout: 15_000 })
    await day.click()
    const slot = firstSlot(drawer)
    await slot.waitFor({ state: 'visible', timeout: 15_000 })
    await slot.click()
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()
    await expect(drawer.confirmButton()).toBeVisible()

    try {
      // Raise the minimum notice window to 3 days AFTER the slot is already
      // held. The soonest slot of the soonest available day is always well
      // inside that window on a fresh demo dataset.
      await setBookingSettings(DEMO.businesses.zen, { minAdvanceBookingMinutes: 4320 })

      await drawer.confirmButton().click()
      await expect(drawer.submitAlert()).toHaveText('That time is too soon to book. Please pick a later date.')
      // Sent back to step 2, but the slot itself is NOT cleared — Continue
      // is still enabled without re-picking anything.
      await expect(drawer.stepLabel(2)).toBeVisible()
      await expect(drawer.continueFromSlotButton()).toBeEnabled()
    } finally {
      // Restore the entity default so later specs booking at Zen aren't hit
      // by this business's now-inflated minimum notice window.
      await setBookingSettings(DEMO.businesses.zen, { minAdvanceBookingMinutes: 0 })
    }
  })

  test('CONF-05 a staff-scope calendar block hides the blocked professional from a slot, not the other', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)

    const businessId = await getBusinessId(DEMO.businesses.barber)
    const locationId = await getLocationId(DEMO.locations.barberAviatiei)
    const serviceId = await getServiceId(DEMO.services.barberTuns.uuid)
    const danId = await getUserIdByUuid(DEMO.staff.dan.uuid)
    const vladId = await getUserIdByUuid(DEMO.staff.vlad.uuid)

    interface RawSlot {
      startTime: string
      items: Array<{ availableStaffIds: number[] }>
    }

    async function fetchSlots(date: string): Promise<RawSlot[]> {
      const res = await page.request.post(`${API_URL}/marketplace/public/booking/slots`, {
        data: { businessId, locationId, services: [{ serviceId }], date },
      })
      expect(res.ok()).toBeTruthy()
      const body = (await res.json()) as { data: { slots: RawSlot[] } }
      return body.data.slots
    }

    // Find the soonest open day, read live off the same public availability
    // endpoint the drawer itself calls (customer-booking.service.ts).
    const calRes = await page.request.post(`${API_URL}/marketplace/public/booking/calendar`, {
      data: {
        businessId,
        locationId,
        services: [{ serviceId }],
        startDate: todayInTz(TIMEZONE),
        daysToCheck: 30,
      },
    })
    expect(calRes.ok()).toBeTruthy()
    const calBody = (await calRes.json()) as { data: { calendar: Array<{ date: string; status: string }> } }
    const blockDate = calBody.data.calendar.find((d) => d.status === 'available')?.date
    expect(blockDate, 'expected at least one available day in the next 30').toBeTruthy()

    const before = await fetchSlots(blockDate!)
    const target = before.find((s) => {
      const ids = s.items[0]?.availableStaffIds ?? []
      return ids.includes(danId) && ids.includes(vladId)
    })
    expect(target, 'expected a slot where both Dan and Vlad are still free').toBeTruthy()
    const slotStart = target!.startTime
    const blockEndClock = addMinutesClock(slotStart, 120)

    // Schema verified against admin-api/src/entities/calendarBlock.entity.ts:
    // blockScope enum 'staff' | 'location' | 'business', businessId always
    // set, userId set (locationId null) for a staff-scope block, startsAt/
    // endsAt are timestamptz, isAllDay/isRecurring both required booleans,
    // reason is a required enum (default 'other' — used explicitly here),
    // showReasonToCustomers is a required boolean.
    const blockUuid = randomUUID()
    await withTestDb((client) =>
      client.query(
        `INSERT INTO calendar_block
           (uuid, "blockScope", "businessId", "locationId", "userId", "startsAt", "endsAt", "isAllDay", "isRecurring", reason, "showReasonToCustomers")
         VALUES ($1, 'staff', $2, NULL, $3, $4, $5, false, false, 'other', false)`,
        [
          blockUuid,
          businessId,
          vladId,
          zonedWallTimeToUtcISO(blockDate!, slotStart, TIMEZONE),
          zonedWallTimeToUtcISO(blockDate!, blockEndClock, TIMEZONE),
        ],
      ),
    )

    try {
      const after = await fetchSlots(blockDate!)
      const targetAfter = after.find((s) => s.startTime === slotStart)
      expect(targetAfter, 'the blocked slot should still be offered — Dan is still free').toBeTruthy()
      const idsAfter = targetAfter!.items[0]?.availableStaffIds ?? []
      expect(idsAfter).toContain(danId)
      expect(idsAfter).not.toContain(vladId)

      // Same thing, through the real UI: land on that exact slot and read
      // the staff chips it offers.
      const business = new BusinessPage(page)
      const drawer = new BookingDrawer(page)
      await business.goto(DEMO.locationSlugs.barberAviatiei)
      await business.addService(DEMO.services.barberTuns.name)
      await business.bookButton('Book 1 service').click()
      await drawer.waitForOpen()
      await expect(drawer.stepLabel(2)).toBeVisible()
      // NOT firstAvailableDay: `blockDate` was found by scanning up to 30
      // days via the raw API above and is not guaranteed to BE the first
      // day the UI's own calendar shows as enabled (shared-calendar
      // contention from other tests can push it out further) — this was a
      // real bug that made this case flaky across several live runs. Land
      // on the exact date the block was written against.
      const slotLabel = fmtTimeLabel(blockDate!, slotStart, TIMEZONE)
      await drawer.goToDateAndSlot(blockDate!, slotLabel)
      await expect(drawer.staffChip('Dan')).toBeVisible()
      await expect(drawer.staffChip('Vlad')).toHaveCount(0)

      // Force-booking Vlad anyway (bypassing the UI, straight at the API)
      // hits the same calendar-block conflict server-side: E14.
      const listingRes = await page.request.get(
        `${API_URL}/marketplace/public/listing/${DEMO.locationSlugs.barberAviatiei}`,
      )
      expect(listingRes.ok()).toBeTruthy()
      const listing = (await listingRes.json()) as { listingId: number; locationId: number }
      const bookRes = await page.request.post(`${API_URL}/marketplace/appointments/book`, {
        data: {
          listingId: listing.listingId,
          locationId: listing.locationId,
          scheduledAt: zonedWallTimeToUtcISO(blockDate!, slotStart, TIMEZONE),
          services: [{ serviceId, staffId: vladId }],
        },
      })
      expect(bookRes.status()).toBe(400)
      const bookBody = (await bookRes.json()) as { message: string | string[] }
      expect(JSON.stringify(bookBody.message)).toContain('MARKETPLACE_BOOKING.E14')

      // Booking Dan for the very same slot succeeds normally through the UI.
      await drawer.staffChip('Dan').click()
      await expect(drawer.continueFromSlotButton()).toBeEnabled()
      await drawer.continueFromSlotButton().click()
      await drawer.confirmButton().click()
      await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })
    } finally {
      await withTestDb((client) => client.query('DELETE FROM calendar_block WHERE uuid = $1', [blockUuid]))
    }
  })
})
