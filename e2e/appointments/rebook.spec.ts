import { expect, test } from '@playwright/test'
import { BookingDrawer } from '../pages/BookingDrawer'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment, setLocationServiceOverride } from '../fixtures/seed'

/**
 * Rebooking shares one launcher between the management rail and mobile bar.
 * Scope the desktop flow to the named management landmark so the test follows
 * the same action surface across layout changes.
 */

test.describe('Book again', () => {
  test('REBK-01 rebooking a past appointment creates a new one and leaves the original untouched', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() - 5 * 24 * 3600_000)
    const { uuid: originalUuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'completed',
      scheduledAt,
    })

    await page.goto(`/appointments/${originalUuid}`)
    await page.getByRole('complementary', { name: 'Manage appointment' }).getByRole('button', { name: 'Book again' }).click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    // Pre-filled and pinned to Maria — the drawer skips straight to step 2.
    await expect(drawer.stepLabel(2)).toBeVisible()

    const day = drawer.root.locator('button[aria-pressed]:not([disabled])').first()
    await expect(day).toBeVisible({ timeout: 15_000 })
    await day.click()
    const slot = drawer.root.locator('.zv-slot').first()
    await expect(slot).toBeVisible({ timeout: 15_000 })
    await slot.click()
    await drawer.continueFromSlotButton().click()
    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })
    await drawer.viewAppointmentButton().click()

    // Two separate "Tuns & styling" appointments now exist for this
    // customer: the original (completed, past) and the freshly rebooked one
    // (upcoming).
    await expect(page).toHaveURL(/\/appointments$/)
    const cards = page.getByRole('link').filter({ hasText: DEMO.services.glowTuns.name })
    await expect(cards).toHaveCount(2)

    // The original is untouched — still completed.
    await page.goto(`/appointments/${originalUuid}`)
    await expect(page.getByText('Completed').first()).toBeVisible()
  })

  test('REBK-02 rebooking a now-discontinued service surfaces a warning and routes to the venue page', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() - 5 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.barber,
      locationUuid: DEMO.locations.barberMilitari,
      serviceUuid: DEMO.services.barberBarba.uuid,
      staffUuid: DEMO.staff.vlad.uuid,
      status: 'completed',
      scheduledAt,
    })

    // The booked service is disabled at THIS location only — the single
    // service on the appointment, so `useRebook` should find nothing left to
    // rebuild and fall back to the "service gone" toast + business-page nav
    // (rather than the "partial drop" toast, which only applies when at
    // least one other item on the same appointment survives).
    await setLocationServiceOverride(DEMO.locations.barberMilitari, DEMO.services.barberBarba.uuid, {
      isEnabled: false,
    })

    await page.goto(`/appointments/${uuid}`)
    await page.getByRole('complementary', { name: 'Manage appointment' }).getByRole('button', { name: 'Book again' }).click()

    await expect(page.getByRole('alert').filter({ hasText: 'is no longer offered here' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).toHaveURL(/\/business\//, { timeout: 10_000 })
  })
})
