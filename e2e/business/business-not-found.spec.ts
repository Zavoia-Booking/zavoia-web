import { expect, test } from '@playwright/test'

test.describe('Business detail — not-found state', () => {
  test('BIZ-04 an invalid slug renders the not-found copy without crashing the page', async ({ page }) => {
    const response = await page.goto('/business/definitely-not-a-real-slug-xyz')

    // The route streams a 200 with the not-found UI (see business/[slug]/page.tsx
    // — an upstream 404 is caught and rendered as <BusinessNotFound/>, not
    // thrown as a Next.js notFound()).
    expect(response?.status()).toBe(200)

    await expect(page.getByText("This place isn't on Zavoia.").first()).toBeVisible()
    await expect(
      page.getByText('It may have closed or moved. Plenty of other trusted pros are a click away.'),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse businesses' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Explore' })).toBeVisible()

    // No Next.js dev/error overlay — the page rendered its own UI, not a crash.
    await expect(page.getByText(/application error/i)).toHaveCount(0)
  })
})
