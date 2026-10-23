import { expect, test } from '@playwright/test'

/**
 * The default suite intentionally starts web without a Mapbox token. Its map
 * fallback can be verified here; real camera, marker and selection behavior
 * belongs to the separate Explore suite with a real renderer.
 *
 * Use a strict city query with known seed locations. A nonsense search now
 * correctly returns no matches because /search always requests strict results.
 */
test.describe('Search — map fallback + list filtering', () => {
  test('SRCH-08 the no-token map fallback keeps the list and Filters usable', async ({ page }) => {
    await page.goto('/search?city=Bucuresti')
    await expect(page.getByText('Map unavailable', { exact: true })).toBeVisible()

    const rows = page.locator('[data-biz]')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const before = await rows.count()
    expect(before).toBeGreaterThan(1)

    // The Bucharest seed has ratings both below and at/above 4.8. A rating
    // filter exercises the current dialog without relying on removed industry
    // chips or the server's recommendation relaxation ladder.
    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Filters', exact: true })
    await dialog.getByRole('button', { name: '4.8+', exact: true }).click()
    expect(new URL(page.url()).searchParams.has('minRating')).toBe(false)
    await dialog.getByRole('button', { name: /^Show \d+ places?$/ }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/[?&]minRating=4\.8(&|$)/)
    await expect(rows.first()).toBeVisible()
    await expect.poll(() => rows.count(), { timeout: 15_000 }).toBeLessThan(before)

    for (const row of await rows.all()) {
      const rating = Number(await row.getByText(/^[0-5]\.\d$/).textContent())
      expect(rating).toBeGreaterThanOrEqual(4.8)
    }
    await expect(page.getByText('Map unavailable', { exact: true })).toBeVisible()
  })
})
