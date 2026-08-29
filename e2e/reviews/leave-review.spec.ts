import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment } from '../fixtures/seed'
import { blockComment, rateBlock, ratingBlock, reviewDialog } from './review-helpers'

// Atelier Glow / Centrul Vechi (glowCentru) with Maria (Maria Ionescu), service
// "Tuns & styling" — the exact combo the calling prompt live-verified renders
// "Leave a review" for a completed appointment.
const BASE_APPT = {
  businessUuid: DEMO.businesses.glow,
  locationUuid: DEMO.locations.glowCentru,
  serviceUuid: DEMO.services.glowTuns.uuid,
  staffUuid: DEMO.staff.maria.uuid,
} as const

const BUSINESS_LABEL = 'Rate Atelier Glow'
const PROFESSIONAL_LABEL = 'Rate Maria Ionescu'

test.describe('Leave a review', () => {
  test('REV-01 happy path: rate business + professional, submit, detail page shows Your review', async ({ page }) => {
    const user = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(user.email)
    const appt = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'completed',
      scheduledAt: new Date(Date.now() - 2 * 86_400_000),
    })

    await page.goto(`/appointments/${appt.uuid}`)
    await page.getByRole('button', { name: 'Leave a review' }).click()

    const dialog = reviewDialog(page, 'new')
    await expect(dialog).toBeVisible()

    await rateBlock(dialog, BUSINESS_LABEL, 4)
    await expect(
      ratingBlock(dialog, BUSINESS_LABEL).getByRole('button', { name: '4 stars' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await blockComment(dialog, BUSINESS_LABEL).fill('Lovely salon, great result.')

    await rateBlock(dialog, PROFESSIONAL_LABEL, 5)
    await blockComment(dialog, PROFESSIONAL_LABEL).fill('Maria was wonderful.')

    await dialog.getByRole('button', { name: 'Post review' }).click()

    await expect(page.getByRole('status')).toContainText('Thanks for your review')
    await expect(dialog).toBeHidden()

    // Detail page re-fetched: the CTA is gone, a "Your review" section with an
    // Edit affordance per rated target (business + professional) replaces it.
    await expect(page.getByRole('button', { name: 'Leave a review' })).toHaveCount(0)
    await expect(page.getByText('Your review', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(2)
  })

  test('REV-02 a rating on just ONE block (business OR professional) is enough to submit', async ({ page }) => {
    const user = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(user.email)

    // ── First appointment: rate ONLY the professional ──
    const apptProOnly = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'completed',
      scheduledAt: new Date(Date.now() - 3 * 86_400_000),
    })
    await page.goto(`/appointments/${apptProOnly.uuid}`)
    await page.getByRole('button', { name: 'Leave a review' }).click()
    const dialog1 = reviewDialog(page, 'new')
    const submit1 = dialog1.getByRole('button', { name: 'Post review' })
    await expect(submit1).toBeDisabled()

    await rateBlock(dialog1, PROFESSIONAL_LABEL, 3)
    await expect(submit1).toBeEnabled()
    // Business block deliberately left at 0 stars.
    await submit1.click()
    await expect(page.getByRole('status')).toContainText('Thanks for your review')
    await expect(dialog1).toBeHidden()

    // ── Second appointment: rate ONLY the business ──
    const apptBizOnly = await seedAppointment({
      ...BASE_APPT,
      customerId,
      status: 'completed',
      scheduledAt: new Date(Date.now() - 4 * 86_400_000),
    })
    await page.goto(`/appointments/${apptBizOnly.uuid}`)
    await page.getByRole('button', { name: 'Leave a review' }).click()
    const dialog2 = reviewDialog(page, 'new')
    const submit2 = dialog2.getByRole('button', { name: 'Post review' })
    await expect(submit2).toBeDisabled()

    await rateBlock(dialog2, BUSINESS_LABEL, 2)
    await expect(submit2).toBeEnabled()
    // Professional block deliberately left at 0 stars.
    await submit2.click()
    await expect(page.getByRole('status')).toContainText('Thanks for your review')
    await expect(dialog2).toBeHidden()
  })
})
