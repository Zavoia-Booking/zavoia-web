import { expect, test } from '@playwright/test'

/**
 * Microsite routing — src/app/[locale]/[city]/page.tsx (one-segment
 * businessSlug lookup, returns the shared 404 boundary on a backend miss) vs.
 * src/app/[locale]/[city]/[industry]/page.tsx (two-segment city/industry
 * SEO page). Same URL depth-1
 * folder name, disjoint by segment count — this suite asserts they don't
 * collide.
 */

test.describe('Microsite route shapes', () => {
  test('SITE-02 a missing one-segment website returns 404 with localized noindex metadata', async ({ page }) => {
    const response = await page.goto('/definitely-not-a-real-business-slug-xyz')
    expect(response?.status()).toBe(404)

    await expect(page).toHaveTitle('404 — This page isn’t available. | Zavoia')
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toHaveAttribute('content', /noindex/)
    await expect(page.getByRole('heading', { name: 'This page isn’t available.', exact: true })).toBeVisible()

    // A missing publication does not establish that its business slug is free.
    await expect(page.locator('#zavoia-not-found a[href$="/register"]')).toBeVisible()
  })

  test('SITE-03 a real city/industry SEO page renders category content, not a business microsite', async ({ page }) => {
    const response = await page.goto('/bucharest/beauty')
    expect(response?.status()).toBe(200)

    await expect(page.getByRole('heading', { level: 1, name: 'Beauty in Bucharest' })).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/bucharest\/beauty$/)

    // The shared [city] segment must not apply website availability to categories.
    await expect(page.locator('#zavoia-not-found')).toHaveCount(0)
  })
})
