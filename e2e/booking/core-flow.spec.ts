import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { BusinessPage } from '../pages/BusinessPage'
import { BookingDrawer } from '../pages/BookingDrawer'
import { AuthPage } from '../pages/AuthPage'
import {
  API_URL,
  authHeader,
  makeTestCustomer,
  registerCustomerViaApi,
  signInAsFreshCustomer,
  withAnonContext,
} from '../fixtures/customer-helpers'
import { DEMO, getLocationId } from '../fixtures/seed'
import { withTestDb } from '../fixtures/test-db'

/**
 * The real booking flow, end to end, against admin-api's live availability +
 * book endpoints. See e2e/fixtures/seed.ts for exactly who can perform what
 * where (DEMO.staff), and e2e/pages/BookingDrawer.ts for the step-by-step
 * selector notes this file relies on.
 */

interface UpcomingAppointment {
  uuid: string
  bookedItemName: string
  primaryItemName: string
  bookingType: string
  scheduledAt: string
  staff: { id: number; firstName: string | null; lastName: string | null } | null
}

/**
 * GET /marketplace/appointments/list via `page.request`. Cookies alone
 * aren't enough for a protected endpoint — `page.request` never runs the
 * app's own JS, so it never attaches the in-memory access token. `authHeader`
 * mints one via the same silent-refresh dance the app itself uses.
 */
async function fetchUpcoming(page: Page): Promise<UpcomingAppointment[]> {
  const res = await page.request.get(`${API_URL}/marketplace/appointments/list`, {
    headers: await authHeader(page),
  })
  if (!res.ok()) {
    throw new Error(`GET /marketplace/appointments/list failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  return body.data.upcoming as UpcomingAppointment[]
}

/** First non-disabled day-of-month button in the calendar grid. */
async function pickFirstAvailableDay(drawer: BookingDrawer): Promise<void> {
  const day = drawer.root.locator('button[aria-pressed]:not([disabled])').first()
  await expect(day).toBeVisible({ timeout: 15_000 })
  await day.click()
}

/** First `.zv-slot` button for the chosen day. Returns it so callers can read its label. */
async function pickFirstSlot(drawer: BookingDrawer): Promise<Locator> {
  const slot = drawer.root.locator('.zv-slot').first()
  await expect(slot).toBeVisible({ timeout: 15_000 })
  await slot.click()
  return slot
}

/**
 * Satisfies a required staff choice (if any) after a slot is picked, using
 * "Any available" when it's offered, otherwise the first candidate chip that
 * actually renders. A no-op when Continue is already enabled (no variance,
 * "Any available" already the default pick).
 */
async function ensureStaffPicked(drawer: BookingDrawer, candidateFirstNames: string[]): Promise<void> {
  const continueBtn = drawer.continueFromSlotButton()
  await expect(continueBtn).toBeVisible()
  if (await continueBtn.isEnabled()) return

  const anyChip = drawer.anyAvailableStaffChip()
  if ((await anyChip.count()) > 0) {
    await anyChip.click()
    return
  }
  for (const name of candidateFirstNames) {
    const chip = drawer.staffChip(name)
    if ((await chip.count()) > 0) {
      await chip.click()
      return
    }
  }
  throw new Error('ensureStaffPicked: no matching staff chip found to satisfy the required choice')
}

/**
 * ~95 tests in this suite share the same handful of demo staff and book
 * real near-term slots throughout a single run — the very first slot a
 * simple happy-path test picks can legitimately already be taken by
 * another test's booking moments earlier (a real MARKETPLACE_BOOKING.E10,
 * not a bug). Retry with the NEXT slot on that specific conflict rather
 * than failing outright; any other submit error still fails immediately.
 */
async function confirmWithConflictRetry(
  drawer: BookingDrawer,
  candidateFirstNames: string[],
  maxAttempts = 5,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await drawer.confirmButton().click()
    const success = drawer.successHeading()
    const alert = drawer.submitAlert()
    await Promise.race([
      success.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
      alert.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
    ])
    if (await success.isVisible().catch(() => false)) return
    const alertText = (await alert.textContent().catch(() => null)) ?? ''
    if (!/slot was just taken/i.test(alertText)) {
      throw new Error(`confirmWithConflictRetry: non-conflict submit error: "${alertText}"`)
    }
    // Bounced back to step 2 with the slot cleared — pick the NEXT slot and retry.
    await expect(drawer.stepLabel(2)).toBeVisible()
    const slots = drawer.root.locator('.zv-slot')
    await slots.first().waitFor({ state: 'visible', timeout: 15_000 })
    const count = await slots.count()
    if (count === 0) throw new Error('confirmWithConflictRetry: no slots left to retry with')
    await slots.nth(Math.min(attempt + 1, count - 1)).click()
    await ensureStaffPicked(drawer, candidateFirstNames)
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()
  }
  throw new Error(`confirmWithConflictRetry: still conflicting after ${maxAttempts} attempts`)
}

test.describe('Booking — core flow', () => {
  test('BOOK-01 book with no preselected service, signed in, through to the appointments list', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru)

    await biz.bookButton('Book now').click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(1)).toBeVisible()

    await drawer.serviceRow(DEMO.services.glowTuns.name).click()
    await drawer.continueFromServicesButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)
    await ensureStaffPicked(drawer, ['Maria', 'Alex'])
    await drawer.continueFromSlotButton().click()

    await expect(drawer.stepLabel(3)).toBeVisible()
    await expect(drawer.root.getByText(DEMO.services.glowTuns.name).first()).toBeVisible()

    await confirmWithConflictRetry(drawer, ['Maria', 'Alex'])
    await drawer.viewAppointmentButton().click()
    await expect(page).toHaveURL(/\/appointments(?:[/?#]|$)/)
  })

  test('BOOK-02 preselecting a service on the page skips straight to step 2', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru)

    await biz.addService(DEMO.services.glowTuns.name)
    await biz.bookButton().click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(2)).toBeVisible()
    await expect(drawer.stepLabel(1)).toHaveCount(0)
    await expect(drawer.backButton()).toHaveCount(0)
  })

  test('BOOK-04 guest gate: sign-in detour preserves the in-progress selection', async ({ page }) => {
    const user = makeTestCustomer()
    // Registered via an anonymous context so its auto-login cookies never
    // reach `page` — the drawer must see a genuinely signed-out visitor.
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))

    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru)
    await biz.bookButton('Book now').click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await drawer.serviceRow(DEMO.services.glowMani.name).click()
    await drawer.continueFromServicesButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)
    await ensureStaffPicked(drawer, ['Alex'])
    await drawer.continueFromSlotButton().click()
    await expect(drawer.stepLabel(3)).toBeVisible()

    const reviewBefore = await drawer.root.innerText()
    const timesBefore = [...reviewBefore.matchAll(/\d{1,2}:\d{2}\s?[AP]M/gi)].map((m) => m[0])
    expect(timesBefore.length).toBeGreaterThanOrEqual(2)

    await expect(drawer.confirmButton()).toHaveText('Sign in to book')
    await drawer.confirmButton().click()

    await expect(drawer.root).toBeHidden()
    await expect(page).toHaveURL(/\/auth\?mode=login&redirect=/)

    const auth = new AuthPage(page)
    await auth.login(user.email, user.password)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })

    // The drawer reopens automatically with the SAME payload — same step,
    // same service, same slot/staff.
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(3)).toBeVisible()
    const reviewAfter = await drawer.root.innerText()
    expect(reviewAfter).toContain(DEMO.services.glowMani.name)
    for (const time of timesBefore) {
      expect(reviewAfter).toContain(time)
    }
    await expect(drawer.confirmButton()).toHaveText('Confirm booking')
  })

  test('BOOK-06 "Any available" still books a real, specific professional', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.barberAviatiei)

    await biz.bookButton('Book now').click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    await drawer.serviceRow(DEMO.services.barberTuns.name).click()
    await drawer.continueFromServicesButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)

    // Dan and Vlad both perform "Tuns clasic" at Aviației for the same base
    // price/duration — no forced choice, "Any available" is offered.
    await expect(drawer.staffVariesNote()).toHaveCount(0)
    await expect(drawer.anyAvailableStaffChip()).toBeVisible()
    await drawer.anyAvailableStaffChip().click()
    await drawer.continueFromSlotButton().click()

    await expect(drawer.stepLabel(3)).toBeVisible()
    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })

    const upcoming = await fetchUpcoming(page)
    const booked = upcoming.find((a) => a.bookedItemName === DEMO.services.barberTuns.name)
    expect(booked).toBeTruthy()
    expect(booked!.staff).not.toBeNull()
    expect(['Dan', 'Vlad']).toContain(booked!.staff!.firstName)
  })

  test('BOOK-08 two services, same staff for both, create ONE composite appointment', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru)

    const before = await fetchUpcoming(page)

    await biz.bookButton('Book now').click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    // Both services are Maria-only at Glow Centru — no staff-picker ambiguity,
    // so the single "run" the backend groups by staff always merges into one
    // appointment.
    await drawer.serviceRow(DEMO.services.glowVopsit.name).click()
    await drawer.serviceRow(DEMO.services.glowCoafat.name).click()
    await drawer.continueFromServicesButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()

    await expect(drawer.stepLabel(3)).toBeVisible()
    await expect(drawer.root.getByText(DEMO.services.glowVopsit.name).first()).toBeVisible()
    await expect(drawer.root.getByText(DEMO.services.glowCoafat.name).first()).toBeVisible()

    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })

    const after = await fetchUpcoming(page)
    const newOnes = after.filter((a) => !before.some((b) => b.uuid === a.uuid))
    expect(newOnes).toHaveLength(1)
    expect(newOnes[0].bookingType).toBe('composite')
    expect(newOnes[0].bookedItemName).toContain(DEMO.services.glowVopsit.name)
    expect(newOnes[0].bookedItemName).toContain(DEMO.services.glowCoafat.name)
  })

  test('BOOK-09 two services, different staff each, create TWO separate appointments', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru)

    const before = await fetchUpcoming(page)

    await biz.bookButton('Book now').click()
    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    // glowMani is Alex-only, glowCoafat is Maria-only at Glow Centru — the
    // two items are always served by different staff, forcing two runs.
    await drawer.serviceRow(DEMO.services.glowMani.name).click()
    await drawer.serviceRow(DEMO.services.glowCoafat.name).click()
    await drawer.continueFromServicesButton().click()
    await expect(drawer.stepLabel(2)).toBeVisible()

    await pickFirstAvailableDay(drawer)
    await pickFirstSlot(drawer)
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()

    await expect(drawer.stepLabel(3)).toBeVisible()
    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })

    const after = await fetchUpcoming(page)
    const newOnes = after.filter((a) => !before.some((b) => b.uuid === a.uuid))
    expect(newOnes).toHaveLength(2)
    expect(newOnes.map((a) => a.bookedItemName).sort()).toEqual(
      [DEMO.services.glowMani.name, DEMO.services.glowCoafat.name].sort(),
    )
    for (const appt of newOnes) {
      expect(appt.bookingType).not.toBe('composite')
    }
  })

  test('BOOK-12 a location with online booking off disables every Book CTA', async ({ page }) => {
    const locationId = await getLocationId(DEMO.locations.barberMilitari)
    await withTestDb((client) =>
      client.query('UPDATE location SET "allowOnlineBooking" = false WHERE id = $1', [locationId]),
    )

    await signInAsFreshCustomer(page)
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.barberMilitari)

    await expect(biz.bookButton()).toBeDisabled()
    await expect(page.getByText(/doesn.t take online bookings/i).first()).toBeVisible()
  })
})
