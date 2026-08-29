import { expect, test } from '@playwright/test'
import { DEMO } from '../fixtures/seed'

test.describe('Search — result navigation targets locations, never a business id', () => {
  test('SRCH-10 clicking a result navigates to /business/<location-slug>; a business uuid never resolves', async ({
    page,
  }) => {
    // Barber Bros' "Aviației" location — a fuzzy location-name match (see
    // search-text-matching.spec.ts) so it renders as a real `[data-biz]` row.
    await page.goto('/search?search=' + encodeURIComponent('Aviatiei'))
    const row = page.locator('[data-biz]').first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    const href = await row.locator('a').first().getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toMatch(/^\/business\//)
    // Never the BUSINESS's own identifier (uuid-style seed id, e.g. "demo-b-barber").
    expect(href).not.toContain(`/business/${DEMO.businesses.barber}`)

    await row.click()
    await expect(page).toHaveURL(/\/business\//)
    // Landed on a real listing, not the not-found state.
    await expect(page.getByText("This place isn't on Zavoia.")).toHaveCount(0)

    // A business UUID is neither a location id nor a location slug — the
    // public listing endpoint (`GET listing/:idOrSlug`) resolves ONLY those,
    // so hitting it directly with the business's own identifier must 404.
    await page.goto('/business/' + DEMO.businesses.barber)
    await expect(page.getByText("This place isn't on Zavoia.").first()).toBeVisible()
  })
})
