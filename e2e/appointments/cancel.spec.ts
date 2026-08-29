import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment, setBookingSettings } from '../fixtures/seed'

/**
 * Cancel flow — src/app/[locale]/appointments/[uuid]/_components/sections.tsx
 * (ActionRail's "Cancel appointment" ManageRow) and
 * .../_components/actions/cancel-modal.tsx (the modal itself).
 *
 * Copy verified straight from src/i18n/dictionaries/en.ts:
 *   - modal: role="dialog" aria-label="Cancel this appointment?"
 *   - footer buttons: "Keep it" (dismiss) / "Cancel booking" (confirm)
 *   - success toast: "Appointment cancelled" (role="status", default tone)
 *   - ManageRow label when allowed: "Cancel appointment"
 *   - ManageRow label when the business closed the window:
 *     "Online cancellation window is closed by the business"
 *   - ManageRow label when the business disallows it outright:
 *     "Cancellation unavailable"
 *   - Both disabled cases share the SAME hint span underneath:
 *     "For urgent matters contact the business directly" (see the identical
 *     note in reschedule.spec.ts — ManageRow always renders this hint
 *     whenever the action is blocked, regardless of which of the two
 *     reasons caused it, so the label differs but the hint text does not).
 *     Since the hint lives inside the same <button>, the disabled-row
 *     assertions below match by substring, not `exact: true`.
 */

test.describe('Cancel appointment', () => {
  test('CANC-01 confirming the cancel modal cancels the appointment', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowVopsit.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel booking' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'Appointment cancelled' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(dialog).toBeHidden()

    await page.reload()
    await expect(page.getByText('Cancelled').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toHaveCount(0)
  })

  test('CANC-02 dismissing the modal with "Keep it" leaves the appointment untouched', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowMani.uuid,
      staffUuid: DEMO.staff.alex.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Keep it' }).click()
    await expect(dialog).toBeHidden()

    // Status is unchanged: the row is still there, offering to cancel again.
    await page.reload()
    await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toBeVisible()
  })

  test('CANC-03a an already-cancelled appointment offers no cancel action', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.smile,
      locationUuid: DEMO.locations.smileCluj,
      serviceUuid: DEMO.services.smileDetartraj.uuid,
      staffUuid: DEMO.staff.pop.uuid,
      status: 'cancelled',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancellation unavailable' })).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Online cancellation window is closed by the business' }),
    ).toHaveCount(0)
  })

  test('CANC-03b cancel row is disabled when the business disallows online cancellation entirely', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    await setBookingSettings(DEMO.businesses.barber, { allowCustomerCancellation: false })
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.barber,
      locationUuid: DEMO.locations.barberAviatiei,
      serviceUuid: DEMO.services.barberBarba.uuid,
      staffUuid: DEMO.staff.vlad.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    const row = page.getByRole('button', { name: 'Cancellation unavailable' })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    // Scoped to this row, not a page-wide getByText: the hint span is
    // identical for every disabled ManageRow, so an untargeted search is
    // ambiguous whenever more than one row on the page is disabled at once.
    await expect(row).toContainText('For urgent matters contact the business directly')
  })

  test('CANC-03c cancel row is disabled once the business-set cancellation window has closed', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    await setBookingSettings(DEMO.businesses.zen, {
      cancellationWindowMinutes: 999_999,
      allowCustomerCancellation: true,
    })
    const scheduledAt = new Date(Date.now() + 2 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.zen,
      locationUuid: DEMO.locations.zenDorobanti,
      serviceUuid: DEMO.services.zenDeep.uuid,
      staffUuid: DEMO.staff.ioana.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    const row = page.getByRole('button', { name: 'Online cancellation window is closed by the business' })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    // Scoped to this row, not a page-wide getByText: the hint span is
    // identical for every disabled ManageRow, so an untargeted search is
    // ambiguous whenever more than one row on the page is disabled at once.
    await expect(row).toContainText('For urgent matters contact the business directly')
  })
})
