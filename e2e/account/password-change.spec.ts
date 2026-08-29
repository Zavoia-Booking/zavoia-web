import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'

// "Click here to manage your password" is the row's unique caption text; its
// nearest ancestor <button> is the collapsible toggle (SecuritySection in
// account-content.tsx).
async function openPasswordRow(page: import('@playwright/test').Page) {
  await page
    .getByText('Click here to manage your password')
    .locator('xpath=ancestor::button[1]')
    .click()
}

test.describe('Account — change password', () => {
  test('ACCT-04 change password validation and effect', async ({ page }) => {
    const user = await signInAsFreshCustomer(page)
    await page.goto('/account')

    await page.getByRole('button', { name: 'Login & security' }).click()
    await openPasswordRow(page)

    const currentInput = page.locator('#password-current')
    const newInput = page.locator('#password-new')
    const confirmInput = page.locator('#password-confirm')
    const submit = page.getByRole('button', { name: 'Change password' })

    // Disabled until all three fields are filled.
    await expect(submit).toBeDisabled()
    await currentInput.fill(user.password)
    await expect(submit).toBeDisabled()
    await newInput.fill('NewStrong1!')
    await expect(submit).toBeDisabled()
    await confirmInput.fill('NewStrong1!')
    await expect(submit).toBeEnabled()

    // Wrong current password.
    await currentInput.fill('DefinitelyWrong123!')
    await submit.click()
    await expect(page.getByText("That current password isn't right.")).toBeVisible()

    // Correct current password — takes effect immediately.
    await currentInput.fill(user.password)
    await newInput.fill('NewStrong1!')
    await confirmInput.fill('NewStrong1!')
    await submit.click()
    await expect(page.getByText('Password changed')).toBeVisible()

    await page.context().clearCookies()
    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(user.email, 'NewStrong1!')
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
  })
})
