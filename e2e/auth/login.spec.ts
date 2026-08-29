import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import { makeTestCustomer, registerCustomerViaApi, withAnonContext } from '../fixtures/customer-helpers'

test.describe('Login', () => {
  test('AUTH-L01 happy path: registered customer logs in and lands off /auth', async ({ page }) => {
    const user = makeTestCustomer()
    // Anonymous context: register's auto-login cookies must NOT land on
    // `page`, or the /auth screen below would already be authenticated.
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(user.email, user.password)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
  })

  test('AUTH-L02 wrong password and unknown email show the identical generic error', async ({ page }) => {
    const user = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, user))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(user.email, 'DefinitelyWrong123!')
    await expect(auth.incorrectCredentialsAlert()).toBeVisible()
    await expect(page).toHaveURL(/\/auth/)

    const ghost = makeTestCustomer()
    await auth.gotoLogin()
    await auth.login(ghost.email, ghost.password)
    await expect(auth.incorrectCredentialsAlert()).toBeVisible()
  })
})
