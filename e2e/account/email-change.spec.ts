import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import {
  makeTestCustomer,
  registerCustomerViaApi,
  signInAsFreshCustomer,
  withAnonContext,
} from '../fixtures/customer-helpers'

// The "Email address" label div in ChangeEmailRow (account-content.tsx) sits
// two <div> ancestors below its sibling "Edit" button — see the row's JSX:
// outer row > header (flex) > [info block (flex:1) > label div, ...Edit button].
async function openChangeEmail(page: import('@playwright/test').Page) {
  const label = page.getByText('Email address', { exact: true })
  await label
    .locator('xpath=ancestor::div[2]/button[normalize-space()="Edit"]')
    .click()
}

test.describe('Account — change email', () => {
  test('ACCT-03 change email validation and success', async ({ page }) => {
    const other = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, other))

    const user = await signInAsFreshCustomer(page)
    await page.goto('/account')

    await openChangeEmail(page)
    const currentInput = page.locator('#change-email-current')
    const nextInput = page.locator('#change-email-next')

    // Wrong current email.
    await currentInput.fill('definitely-not@zavoia-test.dev')
    await nextInput.fill('some-new-address@zavoia-test.dev')
    await page.getByRole('button', { name: 'Update email' }).click()
    await expect(page.locator('#change-email-current-error')).toHaveText(
      "Your current email doesn't match.",
    )

    // New email already used by another account.
    await currentInput.fill(user.email)
    await nextInput.fill(other.email)
    await page.getByRole('button', { name: 'Update email' }).click()
    await expect(page.locator('#change-email-next-error')).toHaveText(
      'That email is already in use.',
    )

    // Same email as current.
    await currentInput.fill(user.email)
    await nextInput.fill(user.email)
    await page.getByRole('button', { name: 'Update email' }).click()
    await expect(page.locator('#change-email-next-error')).toHaveText(
      'New email must be different from your current one.',
    )

    // Genuinely new, valid email — instant, no confirmation link.
    const newEmail = makeTestCustomer().email
    await currentInput.fill(user.email)
    await nextInput.fill(newEmail)
    await page.getByRole('button', { name: 'Update email' }).click()
    await expect(page.getByText('Email updated')).toBeVisible()

    // Drop the still-valid session cookies from this signed-in test user so
    // /auth's "already authenticated" redirect doesn't fire before we can
    // drive the login form below.
    await page.context().clearCookies()

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(newEmail, user.password)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })

    // The line-70 login just re-authenticated this same page/context — drop
    // those cookies too, or /auth's login form can render twice (once mid-
    // teardown, once fresh) while the "already signed in" state settles,
    // making '#email' ambiguous.
    await page.context().clearCookies()
    await auth.gotoLogin()
    await auth.login(user.email, user.password)
    await expect(auth.incorrectCredentialsAlert()).toBeVisible()
  })
})
