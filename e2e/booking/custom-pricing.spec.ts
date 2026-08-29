import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { BusinessPage } from '../pages/BusinessPage'
import { BookingDrawer } from '../pages/BookingDrawer'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getBusinessId, getLocationId, getServiceId, getUserIdByUuid, setLocationServiceOverride, setStaffServiceOverride } from '../fixtures/seed'
import { gotoFreshLocation } from '../fixtures/revalidate'
import { findApiSlotWithStaff } from '../fixtures/availability'

/**
 * Custom pricing/duration per location and per team member — the price
 * formatting rules live in src/lib/format/money-time.ts (formatServiceSpread:
 * "from {min}" + a duration RANGE when a service's staff/location figures
 * vary) and the staff-forced-choice rules live in
 * src/lib/booking/staff-resolution.ts (needsStaffChoice/itemVariesByStaff).
 */

/** The business-detail page's service row (name + duration/price meta), located by its exact visible name. */
function serviceRowContainer(page: Page, serviceName: string): Locator {
  return page.getByText(serviceName, { exact: true }).locator('xpath=..')
}

async function pickFirstAvailableDay(drawer: BookingDrawer): Promise<void> {
  const day = drawer.root.locator('button[aria-pressed]:not([disabled])').first()
  await expect(day).toBeVisible({ timeout: 15_000 })
  await day.click()
}

async function pickFirstSlot(drawer: BookingDrawer): Promise<void> {
  const slot = drawer.root.locator('.zv-slot').first()
  await expect(slot).toBeVisible({ timeout: 15_000 })
  await slot.click()
}

/**
 * Availability is computed PER SLOT (src/lib/booking/staff-resolution.ts /
 * customer-booking.service.ts's segmentServiceDuration): once Maria's
 * duration is overridden to 75 minutes, an early slot that only leaves a
 * 60-minute gap before the next commitment fits Alex but NOT Maria — so the
 * picker legitimately shows only Alex (+ "Any available") at some slots.
 * The first slot of the day is not guaranteed to be one where both
 * overridden and non-overridden staff are simultaneously free — and with
 * ~95 tests sharing the same demo staff's near-term calendar in one run,
 * clicking through days/slots in the UI to find one proved both slow and
 * fragile (a multi-day scan can burn a whole test timeout, and a live run
 * showed a 60s test timeout wasn't even enough). `findApiSlotWithStaff`
 * finds a qualifying slot via the same public API the drawer itself calls
 * — no UI interaction, no timeout risk — and this just drives the drawer
 * straight to it.
 */
async function goToSlotWithBothStaff(
  page: Page,
  drawer: BookingDrawer,
  locationUuid: string,
  serviceUuid: string,
  firstStaffUuid: string,
  secondStaffUuid: string,
): Promise<void> {
  const [businessId, locationId, serviceId, firstId, secondId] = await Promise.all([
    getBusinessId(DEMO.businesses.glow),
    getLocationId(locationUuid),
    getServiceId(serviceUuid),
    getUserIdByUuid(firstStaffUuid),
    getUserIdByUuid(secondStaffUuid),
  ])
  const target = await findApiSlotWithStaff(page, {
    businessId,
    locationId,
    serviceId,
    requiredStaffIds: [firstId, secondId],
  })
  await drawer.goToDateAndSlot(target.date, target.label)
}

/** The step-3 "{date} · {start} – {end} · {duration}" line, parsed into minutes-from-midnight. */
async function reviewTimeRange(drawer: BookingDrawer): Promise<{ start: number; end: number; text: string }> {
  const row = drawer.root.getByText(/\d{1,2}:\d{2}\s?[AP]M.*\d{1,2}:\d{2}\s?[AP]M/).first()
  await expect(row).toBeVisible()
  const text = await row.innerText()
  const matches = [...text.matchAll(/(\d{1,2}):(\d{2})\s?([AP]M)/gi)]
  if (matches.length < 2) throw new Error(`reviewTimeRange: could not find two clock times in "${text}"`)
  const toMinutes = (m: RegExpMatchArray): number => {
    let h = parseInt(m[1], 10) % 12
    if (m[3].toUpperCase() === 'PM') h += 12
    return h * 60 + parseInt(m[2], 10)
  }
  return { start: toMinutes(matches[0]), end: toMinutes(matches[matches.length - 1]), text }
}

test.describe('Booking — custom pricing (staff & location overrides)', () => {
  test('PRICE-01 staff override on Glow Centru shows a range/"from" and forces a staff choice', async ({ page }) => {
    await setStaffServiceOverride(DEMO.staff.maria.uuid, DEMO.services.glowTuns.uuid, DEMO.locations.glowCentru, {
      customPrice: 15000,
      customDuration: 75,
    })

    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    // /business/<slug> is ISR (600s floor) — the override just written would
    // otherwise stay invisible to this page (and to the drawer's catalog,
    // which is seeded from this same server-rendered data) for up to 10
    // minutes. See e2e/fixtures/revalidate.ts. isFresh polls for the
    // overridden duration text rather than guessing how many reloads a
    // stale-while-revalidate background regen needs.
    const row = serviceRowContainer(page, DEMO.services.glowTuns.name)
    await gotoFreshLocation(page, DEMO.locationSlugs.glowCentru, {
      isFresh: async () => (await row.innerText().catch(() => '')).includes('1h 15m'),
    })

    // (a) the row shows a duration RANGE and a "from"-prefixed price.
    await expect(row).toContainText(/from/i)
    await expect(row).toContainText('1h')
    await expect(row).toContainText('1h 15m')

    // (b) open the drawer straight to this service's step 2.
    await biz.addService(DEMO.services.glowTuns.name)
    await biz.bookButton().click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await goToSlotWithBothStaff(
      page,
      drawer,
      DEMO.locations.glowCentru,
      DEMO.services.glowTuns.uuid,
      DEMO.staff.maria.uuid,
      DEMO.staff.alex.uuid,
    )

    await expect(drawer.anyAvailableStaffChip()).toHaveCount(0)
    await expect(drawer.staffVariesNote()).toBeVisible()
    await expect(drawer.continueFromSlotButton()).toBeDisabled()

    // (c) each staff chip shows its own distinct price/duration.
    const mariaChip = drawer.staffChip('Maria')
    const alexChip = drawer.staffChip('Alex')
    await expect(mariaChip).toBeVisible()
    await expect(alexChip).toBeVisible()
    await expect(mariaChip).toContainText('1h 15m')
    await expect(mariaChip).toContainText(/150[.,]00/)
    await expect(alexChip).toContainText('1h')
    await expect(alexChip).not.toContainText('1h 15m')
    await expect(alexChip).toContainText(/120[.,]00/)
  })

  test('PRICE-02 picking Maria vs Alex changes the review price, duration and end time', async ({ page }) => {
    await setStaffServiceOverride(DEMO.staff.maria.uuid, DEMO.services.glowTuns.uuid, DEMO.locations.glowCentru, {
      customPrice: 15000,
      customDuration: 75,
    })

    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    const freshnessCheck = serviceRowContainer(page, DEMO.services.glowTuns.name)
    await gotoFreshLocation(page, DEMO.locationSlugs.glowCentru, {
      isFresh: async () => (await freshnessCheck.innerText().catch(() => '')).includes('1h 15m'),
    })
    await biz.addService(DEMO.services.glowTuns.name)
    await biz.bookButton().click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await goToSlotWithBothStaff(
      page,
      drawer,
      DEMO.locations.glowCentru,
      DEMO.services.glowTuns.uuid,
      DEMO.staff.maria.uuid,
      DEMO.staff.alex.uuid,
    )
    await expect(drawer.continueFromSlotButton()).toBeDisabled()

    // Pick Maria first.
    await drawer.staffChip('Maria').click()
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()
    await expect(drawer.root.getByText('1h 15m').first()).toBeVisible()
    await expect(drawer.root.getByText(/150[.,]00/).first()).toBeVisible()
    const mariaRange = await reviewTimeRange(drawer)

    // Back to step 2, switch to Alex.
    await drawer.backButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()
    await drawer.staffChip('Alex').click()
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()
    await expect(drawer.root.getByText(/120[.,]00/).first()).toBeVisible()
    const alexRange = await reviewTimeRange(drawer)

    // Same start (same slot throughout), different end — Maria's 75-minute
    // visit ends later than Alex's 60-minute one.
    expect(alexRange.start).toBe(mariaRange.start)
    expect(mariaRange.end).toBeGreaterThan(alexRange.end)
    expect(mariaRange.text).not.toBe(alexRange.text)
  })

  test('PRICE-03 location-level override at Băneasa is an exact price with no staff choice', async ({ page }) => {
    await setLocationServiceOverride(DEMO.locations.glowBaneasa, DEMO.services.glowTuns.uuid, {
      customPrice: 14000,
      customDuration: 75,
    })

    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)

    const baneasaRow = serviceRowContainer(page, DEMO.services.glowTuns.name)
    await gotoFreshLocation(page, DEMO.locationSlugs.glowBaneasa, {
      isFresh: async () => (await baneasaRow.innerText().catch(() => '')).includes('140'),
    })
    await expect(baneasaRow).not.toContainText(/from/i)
    await expect(baneasaRow).toContainText(/140[.,]00/)

    // The Centru location is unaffected by THIS (Băneasa) override — its own
    // base figure (120) still shows, and the overridden 140 never appears.
    await biz.goto(DEMO.locationSlugs.glowCentru)
    const centruRow = serviceRowContainer(page, DEMO.services.glowTuns.name)
    await expect(centruRow).toContainText(/120[.,]00/)
    await expect(centruRow).not.toContainText(/140[.,]00/)

    // The drawer at Băneasa doesn't force a staff choice for this service —
    // Alex is effectively the only performer there. Already revalidated
    // above; a plain goto is enough now that the cache entry is fresh.
    await biz.goto(DEMO.locationSlugs.glowBaneasa)
    await biz.addService(DEMO.services.glowTuns.name)
    await biz.bookButton().click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)
    await expect(drawer.staffVariesNote()).toHaveCount(0)
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
  })

  test('PRICE-07 the printed end time differs by exactly the duration delta (75m vs 60m)', async ({ page }) => {
    await setStaffServiceOverride(DEMO.staff.maria.uuid, DEMO.services.glowTuns.uuid, DEMO.locations.glowCentru, {
      customPrice: 15000,
      customDuration: 75,
    })

    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    const freshnessCheck = serviceRowContainer(page, DEMO.services.glowTuns.name)
    await gotoFreshLocation(page, DEMO.locationSlugs.glowCentru, {
      isFresh: async () => (await freshnessCheck.innerText().catch(() => '')).includes('1h 15m'),
    })
    await biz.addService(DEMO.services.glowTuns.name)
    await biz.bookButton().click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await goToSlotWithBothStaff(
      page,
      drawer,
      DEMO.locations.glowCentru,
      DEMO.services.glowTuns.uuid,
      DEMO.staff.maria.uuid,
      DEMO.staff.alex.uuid,
    )

    await drawer.staffChip('Maria').click()
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()
    const mariaRange = await reviewTimeRange(drawer)

    await drawer.backButton().click()
    await drawer.staffChip('Alex').click()
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()
    const alexRange = await reviewTimeRange(drawer)

    expect(alexRange.start).toBe(mariaRange.start)
    // Maria: 75m, Alex: 60m — a 15-minute delta on an otherwise identical slot.
    expect(mariaRange.end - alexRange.end).toBe(15)
  })
})
