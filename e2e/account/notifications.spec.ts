import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'

test.describe('Account — notification preferences', () => {
  test('ACCT-06 toggling a notification switch persists across reload', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)
    await page.goto('/account')

    await page.getByRole('button', { name: 'Preferences' }).click()
    const marketingPush = page.getByRole('switch', {
      name: 'Marketing — Push',
    })
    await expect(marketingPush).toBeVisible()

    const before = await marketingPush.getAttribute('aria-checked')
    const expected = before === 'true' ? 'false' : 'true'

    await marketingPush.click()
    await expect(marketingPush).toHaveAttribute('aria-checked', expected)
    await expect(page.getByText('Preferences updated')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Preferences' }).click()
    await expect(
      page.getByRole('switch', { name: 'Marketing — Push' }),
    ).toHaveAttribute('aria-checked', expected, { timeout: 15_000 })
  })
})
