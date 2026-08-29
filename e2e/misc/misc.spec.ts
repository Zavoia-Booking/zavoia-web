import { expect, test } from '@playwright/test'

/**
 * Miscellaneous cross-cutting behaviors: cookie consent, signed-out gating
 * (redirect vs. in-page gate), and the true root 404.
 */

test.describe('Cookie consent banner', () => {
  test('MISC-01 Reject dismisses the banner and the choice persists across a reload', async ({ context, page }) => {
    // playwright.config.ts pre-seeds every context with zw-consent=denied
    // (so the banner doesn't make an unrelated getByRole('dialog') ambiguous
    // in every other spec) — this is the one test whose whole premise is
    // the banner's OWN first-visit behavior, so undo that default here: the
    // consent hook only shows the banner when the cookie is entirely absent.
    await context.clearCookies()
    await page.goto('/')

    const banner = page.getByRole('dialog', { name: 'Cookie consent' })
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: 'Reject' }).click()
    await expect(banner).toBeHidden()

    const cookiesAfterReject = await context.cookies()
    const consentCookie = cookiesAfterReject.find((c) => c.name === 'zw-consent')
    expect(consentCookie?.value).toBe('denied')

    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeHidden()
  })
})

test.describe('Signed-out gating', () => {
  test('MISC-02 /account redirects to /auth while /saved renders an in-page gate at the same URL', async ({ page }) => {
    // Quick cross-check only — the account suite (ACCT-01) owns full coverage
    // of this redirect's exact query params.
    await page.goto('/account')
    await expect(page).toHaveURL(/\/auth\?mode=login/)

    await page.goto('/saved')
    await expect(page).toHaveURL(/\/saved$/)
    await expect(page.getByRole('heading', { name: 'Your shortlist, saved.' })).toBeVisible()
    // URL must NOT have changed to /auth or anywhere else, unlike /account.
    expect(new URL(page.url()).pathname).toBe('/saved')
  })
})

test.describe('Not found', () => {
  test('MISC-05 a multi-segment path under an existing static route reaches the real root 404', async ({ page }) => {
    // /search is a plain leaf page (src/app/[locale]/search/page.tsx) with no
    // dynamic children, and the only catch-all-ish routes in the app are the
    // depth-1 businessSlug segment ([locale]/[city]) and the depth-2
    // city/industry segment ([locale]/[city]/[industry]) — neither matches a
    // 4-segment path. This path therefore can't be mistaken for a
    // businessSlug lookup (which only ever matches ONE segment) and falls
    // all the way through to src/app/not-found.tsx, the last-resort
    // catch-all (per its own header comment: segment-level not-found.tsx
    // files are never reached in this app).
    const response = await page.goto('/search/not-a-real-subpath/x/y')
    // Per node_modules/next/dist/docs .../not-found.md: a genuinely unmatched
    // route answers 404 for a non-streamed response and 200 for a streamed
    // one. This root not-found.tsx is fully synchronous (no async data, no
    // Suspense boundary), so it should be non-streamed and answer a real
    // 404 — assert that, but don't hard-fail the whole spec on the status
    // code alone if the runtime disagrees; the content assertions below are
    // the primary "didn't crash" signal either way.
    expect(response?.status()).toBe(404)

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Distinct from the claim page (/<slug> 200 fallback), which this path
    // shape cannot reach since it has more than one segment.
    await expect(page.getByText('This page could be yours.')).toHaveCount(0)
  })
})
