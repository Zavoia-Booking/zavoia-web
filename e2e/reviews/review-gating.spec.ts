import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment } from '../fixtures/seed'

const BASE_APPT = {
  businessUuid: DEMO.businesses.glow,
  locationUuid: DEMO.locations.glowCentru,
  serviceUuid: DEMO.services.glowTuns.uuid,
  staffUuid: DEMO.staff.maria.uuid,
} as const

test.describe('Review gating', () => {
  test('REV-03 "Leave a review" only ever appears for a COMPLETED appointment, regardless of its nominal time', async ({
    page,
  }) => {
    const user = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(user.email)

    const cancelled = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'cancelled',
      scheduledAt: new Date(Date.now() - 3 * 86_400_000),
    })
    const noShow = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'no_show',
      scheduledAt: new Date(Date.now() - 4 * 86_400_000),
    })
    const confirmedFuture = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'confirmed',
      scheduledAt: new Date(Date.now() + 2 * 86_400_000),
    })
    // Status wins over the nominal slot time: a completed appointment reads
    // as "past" (and therefore reviewable) even when its scheduled_at is in
    // the future (a business can mark it completed early).
    const completedFuture = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'completed',
      scheduledAt: new Date(Date.now() + 5 * 86_400_000),
    })

    const cases: Array<[typeof cancelled, string]> = [
      [cancelled, 'Cancelled'],
      [noShow, 'No-show'],
      [confirmedFuture, 'Confirmed'],
    ]
    for (const [appt, statusLabel] of cases) {
      await page.goto(`/appointments/${appt.uuid}`)
      // Wait for the status stamp so the assertion below is against a fully
      // loaded detail page, not a still-loading one where the button simply
      // hasn't rendered yet either way. .first(): the stamp renders in both
      // a mobile and a desktop layout node simultaneously (CSS-toggled).
      await expect(page.getByText(statusLabel, { exact: true }).first()).toBeVisible()
      await expect(page.getByRole('button', { name: 'Leave a review' })).toHaveCount(0)
    }

    await page.goto(`/appointments/${completedFuture.uuid}`)
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Leave a review' })).toBeVisible()
  })
})
