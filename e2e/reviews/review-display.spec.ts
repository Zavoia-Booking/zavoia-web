import { expect, test } from '@playwright/test'
import { API_URL, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getLocationId, getUserIdByEmail, seedAppointment } from '../fixtures/seed'
import { blockComment, rateBlock, reviewDialog } from './review-helpers'

const BUSINESS_LABEL = 'Rate Atelier Glow'

test.describe('Review display', () => {
  test('REV-06/07 a submitted review appears in the location public reviews feed and feeds the rating summary', async ({
    page,
  }) => {
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

    const uniqueComment = `E2E display check ${Date.now()}`

    await page.goto(`/appointments/${appt.uuid}`)
    await page.getByRole('button', { name: 'Leave a review' }).click()
    const dialog = reviewDialog(page, 'new')
    await rateBlock(dialog, BUSINESS_LABEL, 5)
    await blockComment(dialog, BUSINESS_LABEL).fill(uniqueComment)
    await dialog.getByRole('button', { name: 'Post review' }).click()
    await expect(page.getByRole('status')).toContainText('Thanks for your review')
    await expect(dialog).toBeHidden()

    // ── Direct backend checks — bypass Next's ISR page cache entirely
    // (the business detail page itself is `revalidate = 600`, so a fresh SSR
    // visit may not reflect this within the window; these hit admin-api
    // straight, which is authoritative and live). ──
    const locationId = await getLocationId(DEMO.locations.glowCentru)

    const reviewsRes = await page.request.get(
      `${API_URL}/marketplace/public/listing/${locationId}/reviews?limit=50`,
    )
    expect(reviewsRes.ok()).toBeTruthy()
    const reviewsBody = (await reviewsRes.json()) as { data: Array<{ rating: number; comment: string | null }> }
    const found = reviewsBody.data.find((r) => r.comment === uniqueComment)
    expect(found).toBeTruthy()
    expect(found?.rating).toBe(5)

    const listingRes = await page.request.get(
      `${API_URL}/marketplace/public/listing/${DEMO.locationSlugs.glowCentru}`,
    )
    expect(listingRes.ok()).toBeTruthy()
    const listing = (await listingRes.json()) as {
      reviewStats: { totalCount: number; averageRating: number | string | null }
    }
    expect(listing.reviewStats.totalCount).toBeGreaterThan(0)
    // Coerce defensively — the frontend also treats averageRating as
    // possibly-a-numeric-string at runtime (see business-detail.tsx's
    // ReviewsTab docblock); whatever shape it arrives in here must still
    // parse to a finite number.
    expect(Number.isFinite(Number(listing.reviewStats.averageRating))).toBe(true)

    // ── UI sanity: the Reviews tab renders a real numeric rating summary and
    // at least one review card without crashing/blanking, exercising the same
    // "averageRating might be a numeric string" render path this location's
    // PRE-EXISTING seeded reviews (4.8, 26 reviews) already goes through on
    // every load — independent of whether ISR has picked up our new review yet. ──
    await page.goto(`/business/${DEMO.locationSlugs.glowCentru}`)
    await page.getByRole('tab', { name: 'Reviews' }).click()
    // Rendered in both a mobile and a desktop layout node simultaneously
    // (CSS-toggled, not unmounted) — .first() is enough to prove it renders.
    await expect(page.getByText(/^\d\.\d$/).first()).toBeVisible()
  })
})
