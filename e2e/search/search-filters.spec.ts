import { expect, test } from '@playwright/test'

test.describe('Search — shareable URL + Filters dialog', () => {
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

  test('SRCH-06 availability switches draft, cancel, apply and reset through Filters', async ({ page }) => {
    // The seed's Monday hours include noon at every Bucharest location. Fix
    // only the browser's Date so Open now is deterministic without stopping
    // timers or changing the API/database clock.
    await page.clock.setFixedTime(new Date('2026-10-19T12:00:00+03:00'))
    await page.goto('/search?city=Bucuresti')
    const rows = page.locator('[data-biz]')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const originalIds = await rows.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-biz')).sort(),
    )

    // Availability and sorting belong in Filters, rather than separate
    // controls in the results header.
    await expect(page.getByRole('button', { name: 'Open now', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Available today', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sort', exact: true })).toHaveCount(0)

    const filtersButton = page.getByRole('button', { name: /^Filters(?:, \d+ active)?$/ })
    const dialog = page.getByRole('dialog', { name: 'Filters', exact: true })
    const openNow = dialog.getByRole('switch', { name: 'Open now', exact: true })
    const open247 = dialog.getByRole('switch', { name: 'Open 24/7', exact: true })
    await filtersButton.click()
    await expect(openNow).toHaveAttribute('aria-checked', 'false')
    await expect(open247).toHaveAttribute('aria-checked', 'false')
    await openNow.click()
    await expect(openNow).toHaveAttribute('aria-checked', 'true')
    expect(new URL(page.url()).searchParams.has('openNow')).toBe(false)
    expect(await rows.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-biz')).sort(),
    )).toEqual(originalIds)

    // Dismissing cancels the draft; reopening starts from the applied state.
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await filtersButton.click()
    await expect(openNow).toHaveAttribute('aria-checked', 'false')
    await openNow.click()
    await dialog.getByRole('button', { name: 'Top rated', exact: true }).click()
    await dialog.getByRole('button', { name: /^Show \d+ places?$/ }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/[?&]openNow=1(&|$)/)
    await expect(page).toHaveURL(/[?&]sort=rating(&|$)/)
    await expect(rows.first()).toBeVisible()

    // No demo location is open 24/7. The switch must update the draft count
    // honestly, disable zero-result apply, and leave the URL unchanged.
    await filtersButton.click()
    await expect(openNow).toHaveAttribute('aria-checked', 'true')
    await open247.click()
    await expect(open247).toHaveAttribute('aria-checked', 'true')
    await expect(dialog.getByRole('button', { name: 'No places match', exact: true })).toBeDisabled()
    expect(new URL(page.url()).searchParams.has('open247')).toBe(false)

    // Reset applies defaults immediately and closes the dialog, as in the app.
    await dialog.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => new URL(page.url()).searchParams.has('openNow')).toBe(false)
    expect(new URL(page.url()).searchParams.has('sort')).toBe(false)
    expect(new URL(page.url()).searchParams.has('open247')).toBe(false)
    await expect.poll(() => rows.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('data-biz')).sort(),
    )).toEqual(originalIds)
  })

  test('SRCH-06 date selection remains in the global search When picker', async ({ page }) => {
    await page.goto('/search?city=Bucuresti')
    await expect(page.locator('[data-biz]').first()).toBeVisible({ timeout: 15_000 })
    const today = await page.evaluate(() => {
      const date = new Date()
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    })

    await page.getByRole('search', { name: 'Search', exact: true })
      .getByRole('button', { name: /^When/ }).click()
    const dialog = page.getByRole('dialog', { name: 'What can we help you find?', exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Today', exact: true }).click()
    await dialog.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`[?&]date=${today}(&|$)`))
    expect(new URL(page.url()).searchParams.get('city')).toBe('Bucuresti')

    // Date is an API search parameter. Wait for an actual settled state,
    // including the honest empty state when no appointment is available today.
    await expect(page.getByText('Updating…', { exact: true })).toHaveCount(0, { timeout: 15_000 })
    await expect.poll(async () =>
      await page.locator('[data-biz]').count() > 0 ||
      await page.getByText('No places match those filters', { exact: true }).isVisible(),
    ).toBe(true)
  })
})
