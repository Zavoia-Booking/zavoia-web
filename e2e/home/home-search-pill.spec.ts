import { expect, test } from '@playwright/test'

test.describe('Home — hero search pill', () => {
  test('HOME-01 clicking the hero pill opens the command-search overlay; submitting a query navigates to /search', async ({
    page,
  }) => {
    await page.goto('/')

    // The pill is a decorative `role="button"` div (a typewriter placeholder,
    // not a real input — see src/app/_components/home/hero.tsx) — matched by
    // its stable "Try" prefix rather than the animated typewriter text.
    await page.locator('div[role="button"]').filter({ hasText: 'Try' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const input = page.getByPlaceholder('All services and businesses')
    await expect(input).toBeVisible()
    await input.fill('Aviatiei')

    // Scoped to the dialog: the hero pill's own icon button also carries an
    // aria-label of "Search", so an unscoped lookup would be ambiguous.
    await dialog.getByRole('button', { name: 'Search', exact: true }).click()

    await expect(page).toHaveURL(/\/search\?search=Aviatiei/)
  })
})
