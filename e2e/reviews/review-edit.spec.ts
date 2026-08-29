import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment } from '../fixtures/seed'
import { rateBlock, reviewDialog } from './review-helpers'

const BUSINESS_LABEL = 'Rate Atelier Glow'

// A posted review is FINAL, and the UI must say so by offering nothing.
//
// `POST /marketplace/customer/reviews` (admin-api CustomerService.submitReview)
// is create-only: it checks for any existing BusinessReview/ProfessionalReview
// row on this (customer, appointment) pair and throws CUSTOMER_REVIEW.E05
// ("A review for this appointment already exists", 400) if one is there. There
// is no update route.
//
// This page used to render an "Edit" button on the posted review that reopened
// the create modal, so every edit attempt was a guaranteed 400. The affordance
// was removed rather than left to fail. This test guards that: it asserts the
// posted review renders WITHOUT an edit control.
//
// If a backend update path is ever added, this test is the one to change —
// alongside re-introducing the affordance and a real "edit succeeds" case.
test.describe('Review edit', () => {
  test('REV-04 a posted review offers no edit affordance (the API has no update path)', async ({ page }) => {
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

    // Submit a real, successful review first.
    await page.goto(`/appointments/${appt.uuid}`)
    await page.getByRole('button', { name: 'Leave a review' }).click()
    const newDialog = reviewDialog(page, 'new')
    await rateBlock(newDialog, BUSINESS_LABEL, 4)
    await newDialog.getByRole('button', { name: 'Post review' }).click()
    await expect(page.getByRole('status')).toContainText('Thanks for your review')
    await expect(newDialog).toBeHidden()

    // The posted review is shown…
    const section = page.getByText('Your review', { exact: true })
    await expect(section).toBeVisible()

    // …and carries no way to re-open the modal. Scoped to the review section so
    // an unrelated "Edit" elsewhere on the page can't make this pass or fail.
    const reviewCard = page
      .locator('section')
      .filter({ has: page.getByText('Your review', { exact: true }) })
    await expect(reviewCard.getByRole('button', { name: /edit/i })).toHaveCount(0)

    // And the create modal cannot be reached a second time: the CTA that opened
    // it is gone now that a review exists.
    await expect(
      page.getByRole('button', { name: 'Leave a review' }),
    ).toHaveCount(0)
  })
})
