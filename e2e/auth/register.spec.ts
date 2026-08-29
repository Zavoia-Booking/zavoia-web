import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import {
  makeTestCustomer,
  registerCustomerViaApi,
  withAnonContext,
} from '../fixtures/customer-helpers'
import { rotateLatestToken } from '../fixtures/token-helpers'

test.describe('Register', () => {
  test('AUTH-R01 happy path: valid form auto-logs in and lands off /auth', async ({
    page,
  }) => {
    const user = makeTestCustomer()
    const auth = new AuthPage(page)
    await auth.gotoRegister()
    await auth.register(user)
    // Registration auto-logs-in server-side — no email-verification gate.
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
  })

  test('AUTH-R02 submit stays disabled until the whole form is valid', async ({
    page,
  }) => {
    const user = makeTestCustomer()
    const auth = new AuthPage(page)
    await auth.gotoRegister()

    // Nothing filled in yet.
    await expect(auth.registerSubmit).toBeDisabled()

    // Every field valid, but terms unchecked.
    await auth.firstName.fill(user.firstName)
    await auth.lastName.fill(user.lastName)
    await auth.email.fill(user.email)
    await auth.password.fill(user.password)
    await expect(auth.registerSubmit).toBeDisabled()

    // Check terms — now valid.
    await auth.acceptTerms.check()
    await expect(auth.registerSubmit).toBeEnabled()

    // Break one field again (invalid email) — disabled again.
    await auth.email.fill('not-an-email')
    await expect(auth.registerSubmit).toBeDisabled()
  })

  test('AUTH-R03 password strength meter grows and lists the rules while focused', async ({
    page,
  }) => {
    const auth = new AuthPage(page)
    await auth.gotoRegister()

    const meter = page.getByRole('progressbar', { name: 'Password strength' })

    await auth.password.click()
    await auth.password.fill('aaaaaaaa') // meets length + lowercase only: 2/5
    await expect(meter).toHaveAttribute('aria-valuenow', '40')

    // The floating rules panel is visible while the field is focused.
    await expect(page.getByText('At least 8 characters')).toBeVisible()
    await expect(
      page.getByText('At least one lowercase letter (a–z)'),
    ).toBeVisible()
    await expect(
      page.getByText('At least one uppercase letter (A–Z)'),
    ).toBeVisible()
    await expect(page.getByText('At least one number (0–9)')).toBeVisible()
    await expect(
      page.getByText('At least one special character (e.g. #, @, !, %)'),
    ).toBeVisible()

    await auth.password.fill('Aaaaaaa1!') // meets all 5 rules: 5/5
    await expect(meter).toHaveAttribute('aria-valuenow', '100')
  })

  test('AUTH-R04 inline validation fires on keystroke', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.gotoRegister()

    await auth.email.fill('not-an-email')
    const emailError = page.locator('#email-error')
    await expect(emailError).toHaveRole('alert')
    await expect(emailError).toHaveText('Enter a valid email address.')

    await auth.lastName.fill('A')
    const lastNameError = page.locator('#lastName-error')
    await expect(lastNameError).toHaveRole('alert')
    await expect(lastNameError).toHaveText('Must be at least 2 characters.')

    await auth.phone.fill('123')
    const phoneError = page.locator('#phone-error')
    await expect(phoneError).toHaveRole('alert')
    await expect(phoneError).toHaveText('Phone number is not valid.')
  })

  test('AUTH-R05 duplicate customer email shows inline form error', async ({
    page,
  }) => {
    const existing = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, existing))

    const dupe = makeTestCustomer({ email: existing.email })
    const auth = new AuthPage(page)
    await auth.gotoRegister()
    await auth.register(dupe)

    await expect(page.getByText('Email already in use.')).toBeVisible()
    await expect(page).toHaveURL(/\/auth/)
  })

  test('AUTH-R06 verify-email link works once then dead-ends on reuse', async ({
    page,
  }) => {
    const user = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))

    const token = await rotateLatestToken(user.email, 'EMAIL_VERIFICATION')
    await page.goto(`/auth/verify-email?token=${token}`)
    await expect(
      page.getByRole('heading', { name: 'Email verified' }),
    ).toBeVisible()

    // The backend marks the token used on that first successful verify
    // (CustomerAuthService.verifyEmail), so reusing the same link now hits
    // the "already used" branch and dead-ends.
    await page.reload()
    await expect(
      page.getByRole('heading', { name: "This link can't be used" }),
    ).toBeVisible()
  })
})
