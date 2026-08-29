import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'

test.describe('Account — delete account', () => {
  test('ACCT-05 delete account confirmation dialog deletes and redirects home', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)
    await page.goto('/account')

    await page.getByRole('button', { name: 'Login & security' }).click()
    // The Danger-zone trigger button's accessible name also includes its
    // caption ("Permanently delete your account..."), so a substring match
    // is enough here — it's the only "Delete account" button on the page
    // before the confirm dialog (matched separately, scoped to `dialog`,
    // below) exists.
    await page.getByRole('button', { name: 'Delete account' }).click()

    const dialog = page.getByRole('dialog', { name: 'Delete your account?' })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: 'Delete your account?' }),
    ).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Delete account' }).click()

    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/, {
      timeout: 15_000,
    })

    // Session cleared: a fresh visit to /account is gated again.
    await page.goto('/account')
    await expect(page).toHaveURL(/\/auth\?mode=login/)
  })
})
