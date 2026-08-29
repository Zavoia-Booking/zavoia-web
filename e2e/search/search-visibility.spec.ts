import { expect, test } from '@playwright/test'
import { DEMO, getBusinessId } from '../fixtures/seed'
import { withTestDb } from '../fixtures/test-db'
import { revalidateLocation } from '../fixtures/revalidate'

/**
 * Toggles `business_marketplace_listing.isListed` directly via SQL (schema:
 * admin-api/src/entities/businessMarketplaceListing.entity.ts — table
 * `business_marketplace_listing`, column `isListed`, keyed by `businessId`).
 *
 * Read from marketplace-public.service.ts: the single-listing endpoint
 * (getListingById) and the supplementary business-name search
 * (searchBusinessesByName) both check `isListed` LIVE against this table —
 * neither depends on the `map_point` sync table, so a raw SQL toggle is safe
 * and immediately observable. (The primary `locations` search group DOES
 * read from `map_point`, which the app only re-syncs via its own service
 * calls — so this spec deliberately asserts through the business-name search
 * path and the listing-detail page, both of which are toggle-safe.)
 */
async function setListed(businessUuid: string, listed: boolean): Promise<void> {
  const businessId = await getBusinessId(businessUuid)
  await withTestDb(async (client) => {
    await client.query('UPDATE business_marketplace_listing SET "isListed" = $2 WHERE "businessId" = $1', [
      businessId,
      listed,
    ])
  })
}

test.describe('Search — unpublishing a listing', () => {
  test('SRCH-11 unpublishing a business hides it from search and 404s its page; republishing restores both', async ({
    page,
  }) => {
    const businessUuid = DEMO.businesses.zen
    const locationSlug = DEMO.locationSlugs.zenDorobanti
    const searchTerm = 'Zen Spa & Masaj'

    // Baseline: listed, findable, and its page renders.
    await page.goto('/search?search=' + encodeURIComponent(searchTerm))
    // The query text is echoed TWICE regardless of results — once in the
    // header "What" search pill, once in the panel's "Edit search" button
    // — so a real business-card match is a THIRD occurrence (verified
    // against a live run's aria snapshot).
    await expect(page.getByText(searchTerm, { exact: true })).toHaveCount(3, { timeout: 15_000 })

    await page.goto('/business/' + locationSlug)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dorobanți')

    // Revalidation is "stale-while-revalidate" (see revalidate.ts) — a
    // fixed number of reloads is a guess, not a guarantee the background
    // regen finished. Poll for the actual expected state instead.
    async function waitForFreshDetailPage(expectNotFound: boolean): Promise<void> {
      const notFound = page.getByText("This place isn't on Zavoia.").first()
      // Background regen time isn't bounded under a loaded, unoptimized
      // (ts-node) backend this deep into a long suite run — 6 attempts at
      // 400ms proved not always enough live; give it more room.
      for (let i = 0; i < 12; i++) {
        await page.goto('/business/' + locationSlug)
        const isNotFound = await notFound.isVisible().catch(() => false)
        if (isNotFound === expectNotFound) return
        await page.waitForTimeout(700)
      }
    }

    try {
      await setListed(businessUuid, false)
      // The detail page is ISR (600s floor) and was already visited (and
      // cached) above — force + wait out revalidation, or the 404 check
      // below can still serve the pre-unpublish cached page.
      await revalidateLocation(page, locationSlug)

      await page.goto('/search?search=' + encodeURIComponent(searchTerm))
      // Only the two query-echo occurrences remain — the business card is gone.
      await expect(page.getByText(searchTerm, { exact: true })).toHaveCount(2, { timeout: 15_000 })

      await waitForFreshDetailPage(true)
      await expect(page.getByText("This place isn't on Zavoia.").first()).toBeVisible()
    } finally {
      // Always restore — this business/location is shared baseline data for
      // every other spec in the run.
      await setListed(businessUuid, true)
      await revalidateLocation(page, locationSlug)
    }

    await page.goto('/search?search=' + encodeURIComponent(searchTerm))
    await expect(page.getByText(searchTerm, { exact: true })).toHaveCount(3, { timeout: 15_000 })

    await waitForFreshDetailPage(false)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dorobanți')
  })
})
