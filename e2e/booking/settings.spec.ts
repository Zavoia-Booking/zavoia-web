import { expect, test } from '@playwright/test'
import { BusinessPage } from '../pages/BusinessPage'
import { BookingDrawer } from '../pages/BookingDrawer'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getBusinessId, getLocationId, getServiceId, getUserIdByEmail, getUserIdByUuid, seedAppointment, setBookingSettings } from '../fixtures/seed'
import { findApiSlotWithStaff } from '../fixtures/availability'

test.describe('Booking settings', () => {
  test('SET-01 booking one professional leaves the slot open with the other', async ({ page }) => {
    await signInAsFreshCustomer(page)
    const business = new BusinessPage(page)
    const drawer = new BookingDrawer(page)

    await business.goto(DEMO.locationSlugs.barberAviatiei)
    await business.addService(DEMO.services.barberTuns.name)
    await business.bookButton('Book 1 service').click()
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(2)).toBeVisible()

    // Dan and Vlad both perform "Tuns clasic" at Aviației, but per-slot
    // availability means slot #1 isn't guaranteed to offer Dan specifically
    // (an earlier spec in this same run may already have booked him at the
    // very first slot). Find a slot that actually offers him via the same
    // public API the drawer itself calls — much faster and less fragile
    // under shared-calendar contention than clicking through days/slots in
    // the UI (a live run showed that approach could exceed even a 60s
    // per-test timeout once the near-term calendar filled up).
    const [businessId, locationId, serviceId, danId] = await Promise.all([
      getBusinessId(DEMO.businesses.barber),
      getLocationId(DEMO.locations.barberAviatiei),
      getServiceId(DEMO.services.barberTuns.uuid),
      getUserIdByUuid(DEMO.staff.dan.uuid),
    ])
    const target = await findApiSlotWithStaff(page, { businessId, locationId, serviceId, requiredStaffIds: [danId] })
    await drawer.goToDateAndSlot(target.date, target.label)
    const slotLabel = target.label

    // Pin Dan explicitly rather than relying on whichever the drawer defaults to.
    await drawer.staffChip('Dan').click()
    await expect(drawer.continueFromSlotButton()).toBeEnabled()
    await drawer.continueFromSlotButton().click()
    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })

    // Reload the same day's slots for the same service — Vlad is still
    // free, so the exact same time is still offered, just no longer with Dan.
    // Not "first available day": `target.date` may not BE the first
    // available day (contention can push the qualifying slot out further),
    // so go straight back to the specific date the booking was just made on.
    await business.goto(DEMO.locationSlugs.barberAviatiei)
    await business.addService(DEMO.services.barberTuns.name)
    await business.bookButton('Book 1 service').click()
    await drawer.waitForOpen()
    await expect(drawer.stepLabel(2)).toBeVisible()
    await drawer.goToDateAndSlot(target.date, slotLabel)

    // Dan is now busy at this exact time, so only Vlad is offered for it.
    await expect(drawer.staffChip('Vlad')).toBeVisible()
    await expect(drawer.staffChip('Dan')).toHaveCount(0)
  })

  test('SET-02 disabled cancellation/reschedule render as disabled rows with the contact-business hint', async ({
    page,
  }) => {
    const user = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(user.email)

    await setBookingSettings(DEMO.businesses.glow, {
      allowCustomerCancellation: false,
      allowCustomerReschedule: false,
    })

    const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days out — clearly upcoming
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

    // Exact copy read off detail-content.tsx's ActionRail/ManageRow: when
    // the business turns an action off entirely, the row label itself
    // becomes "<Action> unavailable" and shows the contact-business hint
    // (canReschedule/canCancel in actions/shared.ts short-circuit on the
    // business flag before ever checking the notice window).
    const rescheduleRow = page.getByRole('button', { name: 'Reschedule unavailable' })
    const cancelRow = page.getByRole('button', { name: 'Cancellation unavailable' })
    await expect(rescheduleRow).toBeVisible()
    await expect(rescheduleRow).toBeDisabled()
    await expect(cancelRow).toBeVisible()
    await expect(cancelRow).toBeDisabled()
    await expect(page.getByText('For urgent matters contact the business directly')).toHaveCount(2)
  })
})
