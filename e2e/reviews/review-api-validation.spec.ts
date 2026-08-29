import { expect, test } from '@playwright/test'
import { API_URL, authHeader, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, getUserIdByUuid, seedAppointment } from '../fixtures/seed'

// POST /marketplace/customer/reviews (SubmitReviewDto + CustomerService.submitReview)
// direct API validation — no UI involved. `page.request` shares this
// signed-in customer's cookies with `page` (see customer-helpers.ts header).
test.describe('Review submission — API validation', () => {
  test('REV-05 rejects an underspecified or invalid submitReview body with 400', async ({ page }) => {
    const user = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(user.email)
    const appt = await seedAppointment({
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      customerId,
      status: 'completed',
      scheduledAt: new Date(Date.now() - 86_400_000),
    })

    // page.request shares cookies with `page` but never runs the app's own
    // JS, so it never attaches the in-memory access token a protected
    // endpoint needs — mint one via the same silent-refresh dance the app uses.
    const headers = await authHeader(page)

    // (a) No rating at all — locationRating and professionalRatings both
    // absent → CUSTOMER_REVIEW.E04 ("no rating given").
    const noRating = await page.request.post(`${API_URL}/marketplace/customer/reviews`, {
      headers,
      data: { appointmentUuid: appt.uuid },
    })
    expect(noRating.status()).toBe(400)

    // (b) professionalRatings names a staff member who did NOT serve this
    // appointment (Alex, not Maria) → CUSTOMER_REVIEW.E06.
    const alexId = await getUserIdByUuid(DEMO.staff.alex.uuid)
    const wrongProfessional = await page.request.post(`${API_URL}/marketplace/customer/reviews`, {
      headers,
      data: {
        appointmentUuid: appt.uuid,
        professionalRatings: [{ professionalId: alexId, rating: 5 }],
      },
    })
    expect(wrongProfessional.status()).toBe(400)

    // (c) rating out of the 1-5 range → class-validator @Max(5) rejects it.
    const outOfRange = await page.request.post(`${API_URL}/marketplace/customer/reviews`, {
      headers,
      data: { appointmentUuid: appt.uuid, locationRating: 6 },
    })
    expect(outOfRange.status()).toBe(400)
  })
})
