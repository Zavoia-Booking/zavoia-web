import { expect, test } from '@playwright/test'
import { BookingDrawer } from '../pages/BookingDrawer'
import { BusinessPage } from '../pages/BusinessPage'
import { makeTestCustomer, registerCustomerViaApi, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment, setBookingSettings } from '../fixtures/seed'

/**
 * Reschedule flow — src/app/[locale]/appointments/[uuid]/_components/detail-content.tsx
 * (ActionRail's "Reschedule" ManageRow) and
 * .../_components/actions/reschedule-modal.tsx (the modal itself).
 *
 * Copy verified straight from src/i18n/dictionaries/en.ts before writing any
 * assertion:
 *   - modal: role="dialog" aria-label="Reschedule" (ActionModal sets
 *     aria-label from `title`, no separate heading element)
 *   - footer confirm button: "Confirm new time"
 *   - ManageRow keeps "Reschedule" as its action label.
 *   - A disabled row includes the restriction in its accessible name:
 *     "Reschedule unavailable" or
 *     "The deadline for online rescheduling has passed".
 *   - "Contact the venue for help." appears once outside the action buttons,
 *     shared by blocked cancellation and rescheduling.
 */

test.describe('Reschedule', () => {
  test('RESCH-01 confirmed appointment can be rescheduled to a new time', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)

    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    const appointmentTime = page.getByRole('main').locator('header time[datetime]')
    await expect(appointmentTime).toBeVisible()
    const before = await appointmentTime.getAttribute('datetime')

    await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Reschedule' })
    await expect(dialog).toBeVisible()

    const firstDay = dialog.locator('button[aria-pressed]:not(.zv-slot):not([disabled])').first()
    await expect(firstDay).toBeVisible({ timeout: 15_000 })
    await firstDay.click()

    const firstSlot = dialog.locator('.zv-slot').first()
    await expect(firstSlot).toBeVisible({ timeout: 15_000 })
    await firstSlot.click()

    await dialog.getByRole('button', { name: 'Confirm new time' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Rescheduled to' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(dialog).toBeHidden()

    // Re-fetch and confirm the hero date+time actually changed.
    await page.reload()
    await expect(appointmentTime).toBeVisible()
    await expect(appointmentTime).not.toHaveAttribute('datetime', before!)
  })

  test('RESCH-03a reschedule row is disabled once the business-set window has closed', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    // A huge window (relative to the seed's real defaults) plus an appointment
    // only 2h out guarantees minutesUntil() < rescheduleWindowMinutes.
    await setBookingSettings(DEMO.businesses.barber, {
      rescheduleWindowMinutes: 999_999,
      allowCustomerReschedule: true,
    })
    const scheduledAt = new Date(Date.now() + 2 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.barber,
      locationUuid: DEMO.locations.barberAviatiei,
      serviceUuid: DEMO.services.barberTuns.uuid,
      staffUuid: DEMO.staff.dan.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    const rail = page.getByRole('complementary', { name: 'Manage appointment' })
    const row = rail.getByRole('button', { name: /^Reschedule/ })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    await expect(row).toContainText('The deadline for online rescheduling has passed')
    const contactHint = rail.getByText('Contact the venue for help.', { exact: true })
    await expect(contactHint).toHaveCount(1)
    await expect(contactHint).toBeVisible()
  })

  test('RESCH-03b reschedule row is disabled when the business disallows online rescheduling entirely', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    await setBookingSettings(DEMO.businesses.zen, { allowCustomerReschedule: false })
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.zen,
      locationUuid: DEMO.locations.zenDorobanti,
      serviceUuid: DEMO.services.zenRelax.uuid,
      staffUuid: DEMO.staff.ioana.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    const rail = page.getByRole('complementary', { name: 'Manage appointment' })
    const row = rail.getByRole('button', { name: /^Reschedule/ })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    await expect(row).toContainText('Reschedule unavailable')
    const contactHint = rail.getByText('Contact the venue for help.', { exact: true })
    await expect(contactHint).toHaveCount(1)
    await expect(contactHint).toBeVisible()
  })

  test('RESCH-03c a cancelled appointment offers no reschedule action at all', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.smile,
      locationUuid: DEMO.locations.smileCluj,
      serviceUuid: DEMO.services.smileConsult.uuid,
      staffUuid: DEMO.staff.pop.uuid,
      status: 'cancelled',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await expect(page.getByRole('button', { name: /^Reschedule/ })).toHaveCount(0)
  })

  test('RESCH-04 confirming a stale slot selection surfaces the conflict and clears the picked slot', async ({
    page,
    browser,
  }) => {
    const customerA = await signInAsFreshCustomer(page)
    const customerIdA = await getUserIdByEmail(customerA.email)
    const scheduledAt = new Date(Date.now() + 6 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId: customerIdA,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Reschedule' })
    await expect(dialog).toBeVisible()

    const dayA = dialog.locator('button[aria-pressed]:not(.zv-slot):not([disabled])').first()
    await expect(dayA).toBeVisible({ timeout: 15_000 })
    await dayA.click()
    const slotA = dialog.locator('.zv-slot').first()
    await expect(slotA).toBeVisible({ timeout: 15_000 })
    await slotA.click()
    // Confirms a slot is actually picked (footer swaps from "Pick a slot to
    // continue" to the chosen-time summary) before we let a second customer
    // race it.
    await expect(dialog.getByText('New time', { exact: true })).toBeVisible()

    // Second customer, separate browser context (own cookie jar), books the
    // SAME staff member (Maria) for the SAME service via her team-member
    // modal — pinning teamMemberId the same way the reschedule modal did —
    // then picks "first available day, first available slot" exactly like
    // customer A did above. Since both flows query the identical
    // Maria-pinned availability within seconds of each other, this
    // deterministically lands on the same slot without needing to parse or
    // replicate any visible date/time text (which would be unreliable: e.g.
    // "2:30 PM" is a literal substring of "12:30 PM").
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    const customerB = makeTestCustomer()
    await registerCustomerViaApi(page2.request, customerB)

    const business2 = new BusinessPage(page2)
    await business2.goto(DEMO.locationSlugs.glowCentru, { tab: 'team' })
    await business2.teamMemberCard('Maria').click()
    const memberModal = page2.getByRole('dialog', { name: /Maria/ })
    await expect(memberModal).toBeVisible()
    await memberModal.getByRole('button', { name: `Add ${DEMO.services.glowTuns.name}` }).click()
    await memberModal.getByRole('button', { name: 'Book with Maria' }).click()

    const drawer2 = new BookingDrawer(page2)
    await drawer2.waitForOpen()
    const dayB = drawer2.root.locator('button[aria-pressed]:not([disabled])').first()
    await expect(dayB).toBeVisible({ timeout: 15_000 })
    await dayB.click()
    const slotB = drawer2.root.locator('.zv-slot').first()
    await expect(slotB).toBeVisible({ timeout: 15_000 })
    await slotB.click()
    await drawer2.continueFromSlotButton().click()
    await drawer2.confirmButton().click()
    await expect(drawer2.successHeading()).toBeVisible({ timeout: 15_000 })
    await context2.close()

    // Customer A confirms their now-stale selection.
    await dialog.getByRole('button', { name: 'Confirm new time' }).click()
    await expect(dialog.getByRole('alert')).toContainText('That time is no longer available', {
      timeout: 10_000,
    })
    // The picked slot was cleared and the day's slots refetched — footer
    // reverts to the "pick a slot" prompt.
    await expect(dialog.getByText('Pick a slot to continue', { exact: true })).toBeVisible()
  })
})
