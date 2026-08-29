import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import {
  API_URL,
  makeTestCustomer,
  registerCustomerViaApi,
  withAnonContext,
} from '../fixtures/customer-helpers'
import { expireLatestToken, rotateLatestToken } from '../fixtures/token-helpers'

const NEUTRAL_HEADING = 'Check your email'
const NEUTRAL_BODY =
  "If an account exists for that email, we've sent a link to reset your password."

test.describe('Password reset', () => {
  test('AUTH-P01 forgot-password shows the identical neutral screen for a real and a made-up email', async ({
    page,
  }) => {
    const registered = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, registered))

    await page.goto('/auth/forgot-password')
    await page.locator('#email').fill(registered.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(
      page.getByRole('heading', { name: NEUTRAL_HEADING }),
    ).toBeVisible()
    await expect(page.getByText(NEUTRAL_BODY)).toBeVisible()

    const ghost = makeTestCustomer()
    await page.goto('/auth/forgot-password')
    await page.locator('#email').fill(ghost.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(
      page.getByRole('heading', { name: NEUTRAL_HEADING }),
    ).toBeVisible()
    await expect(page.getByText(NEUTRAL_BODY)).toBeVisible()
  })

  test('AUTH-P02 reset link changes the password and takes effect immediately', async ({
    page,
    request,
  }) => {
    const user = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))
    const oldPassword = user.password
    const newPassword = 'NewPass1!'

    const res = await request.post(`${API_URL}/marketplace/auth/forgot-password`, {
      data: { email: user.email },
    })
    expect(res.ok()).toBeTruthy()

    const token = await rotateLatestToken(user.email, 'PASSWORD_RESET')
    await page.goto(`/auth/reset-password?token=${token}`)
    await page.getByLabel('New password').fill(newPassword)
    await page.getByLabel('Confirm password').fill(newPassword)
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(
      page.getByRole('heading', { name: 'Password updated' }),
    ).toBeVisible()

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(user.email, oldPassword)
    await expect(auth.incorrectCredentialsAlert()).toBeVisible()

    await auth.gotoLogin()
    await auth.login(user.email, newPassword)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
  })

  test('AUTH-P03 a dead token dead-ends with a link back to forgot-password, and a garbage token does not crash', async ({
    page,
    request,
  }) => {
    const user = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))

    const res = await request.post(`${API_URL}/marketplace/auth/forgot-password`, {
      data: { email: user.email },
    })
    expect(res.ok()).toBeTruthy()

    const token = await rotateLatestToken(user.email, 'PASSWORD_RESET')
    await expireLatestToken(user.email, 'PASSWORD_RESET')

    await page.goto(`/auth/reset-password?token=${token}`)
    await page.getByLabel('New password').fill('NewPass1!')
    await page.getByLabel('Confirm password').fill('NewPass1!')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page.getByText('This link has expired.')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Request a new link' }),
    ).toHaveAttribute('href', /\/auth\/forgot-password$/)

    // Syntactically garbage token — never a real hash, so the backend reports
    // it as simply invalid, not expired. The form must still render (no
    // crash) and land on the same dead-end state.
    await page.goto('/auth/reset-password?token=garbage')
    await page.getByLabel('New password').fill('NewPass1!')
    await page.getByLabel('Confirm password').fill('NewPass1!')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(
      page.getByText('This link is invalid or has already been used.'),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Request a new link' }),
    ).toBeVisible()
  })
})
