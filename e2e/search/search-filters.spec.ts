import { expect, test } from '@playwright/test'

test.describe('Search — shareable URL + filter chips', () => {
  test('SRCH-03 city + industry URL is shareable: reloading the same URL in a fresh page reproduces the same result set', async ({
    page,
    context,
  }) => {
    // city=Bucuresti (normalized, diacritic-insensitive) + industry=baseline-beauty
    // (the demo seed's only "Beauty" industry) — matches Atelier Glow, Barber
    // Bros and Zen Spa's Bucharest locations, never Smile Dental (Cluj/dental).
    const url = '/search?city=Bucuresti&industry=baseline-beauty'

    await page.goto(url)
    const rows = page.locator('[data-biz]')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const first = (await rows.evaluateAll((els) => els.map((el) => el.getAttribute('data-biz')))).sort()
    expect(first.length).toBeGreaterThan(0)

    // A brand-new page/tab (fresh render, no client-side state carried over) —
    // navigating straight to the same URL must reproduce the identical set.
    const page2 = await context.newPage()
    try {
      await page2.goto(url)
      const rows2 = page2.locator('[data-biz]')
      await expect(rows2.first()).toBeVisible({ timeout: 15_000 })
      const second = (
        await rows2.evaluateAll((els) => els.map((el) => el.getAttribute('data-biz')))
      ).sort()
      expect(second).toEqual(first)
    } finally {
      await page2.close()
    }
  })

  test('SRCH-06 "Open now" and "Available today" chips write their URL params and refine the result set', async ({
    page,
  }) => {
    // Anchor on a city so the page skips the empty-landing geolocation-priming
    // modal (which would otherwise intercept these clicks) — see
    // search-content.tsx's one-shot auto-resolution effect.
    await page.goto('/search?city=Bucuresti')
    await expect(page.locator('[data-biz]').first()).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Open now', exact: true }).click()
    await expect(page).toHaveURL(/[?&]openNow=1(&|$)/)

    const today = new Date().toISOString().slice(0, 10)
    await page.getByRole('button', { name: 'Available today', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`[?&]date=${today}(&|$)`))

    // "Available today" changes `date`, which IS part of the fetch key — the
    // panel must settle back from "Updating…" rather than hang.
    await expect(page.getByText('Updating…')).toHaveCount(0, { timeout: 15_000 })
    // The result panel is in one of its two settled states: rows, or the
    // empty-filters copy — never stuck loading.
    const hasRows = await page.locator('[data-biz]').count()
    const hasEmptyCopy = await page.getByText('No places match those filters').count()
    expect(hasRows > 0 || hasEmptyCopy > 0).toBe(true)
  })
})
