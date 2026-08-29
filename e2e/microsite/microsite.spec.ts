import { expect, test } from '@playwright/test'

/**
 * Microsite routing — src/app/[locale]/[city]/page.tsx (one-segment
 * businessSlug lookup, falls to <ClaimPage> on a 404 from the backend) vs.
 * src/app/[locale]/[city]/[industry]/page.tsx (two-segment, statically
 * generated city/industry SEO page, src/data/seo.ts). Same URL depth-1
 * folder name, disjoint by segment count — this suite asserts they don't
 * collide.
 */

test.describe('Microsite route shapes', () => {
  test('SITE-02 an unclaimed one-segment slug renders the claim page at 200, not a Next.js error page', async ({ page }) => {
    const response = await page.goto('/definitely-not-a-real-business-slug-xyz')
    expect(response?.status()).toBe(200)

    // src/app/_components/not-found/claim-page.tsx — ClaimPage renders
    // in-page (not a not-found.tsx boundary) precisely so it can answer 200
    // with `noindex` metadata instead of a hard 404.
    await expect(page.getByRole('heading', { name: 'This page could be yours.' })).toBeVisible()
    // The address also appears inside the "Nothing lives at ..." body copy —
    // .first() (the dedicated dashed-pill display) is enough to prove it rendered.
    await expect(page.getByText('zavoia.com/definitely-not-a-real-business-slug-xyz').first()).toBeVisible()

    // The primary CTA is an <a href="{BUSINESS_APP_URL}/register"> wrapping a
    // <Button> (a real <button>) — target the anchor by href shape rather than
    // role to sidestep any ambiguity from that nested interactive markup.
    const trialLink = page.locator('a[href$="/register"]', { hasText: 'Start free trial' })
    await expect(trialLink).toBeVisible()
  })

  test('SITE-03 a real city/industry SEO page renders category content, not a business microsite', async ({ page }) => {
    // bucharest/barbers — confirmed real EN city+industry slugs in src/data/seo.ts.
    await page.goto('/bucharest/barbers')

    await expect(page.getByRole('heading', { level: 1, name: 'Barbers in Bucharest' })).toBeVisible()
    // The category page's own "not yet listed" copy — a business microsite
    // never renders this string, and a claim-page never renders it either.
    await expect(page.getByText(/Businesses coming soon/)).toBeVisible()

    // Distinguish from a business microsite: no claim-page copy, no
    // web-studio-style specimen chrome — just the category page's own nav
    // breadcrumb naming both segments.
    await expect(page.getByText('This page could be yours.')).toHaveCount(0)
  })
})
