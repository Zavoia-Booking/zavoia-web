import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import {
  API_URL,
  makeTestCustomer,
  makeTestOwner,
  registerBusinessOwnerViaApi,
  registerCustomerViaApi,
  withAnonContext,
  type TestOwner,
} from '../fixtures/customer-helpers'
import {
  expireLatestToken,
  markLatestTokenUsed,
  rotateLatestToken,
} from '../fixtures/token-helpers'

/**
 * The multi-role account-linking flow: an existing business OWNER/TEAM_MEMBER
 * account (no CUSTOMER role) hits register or login on the marketplace, gets
 * a 409 `account_exists_needs_marketplace_access`, and is walked through the
 * emailed-link + password confirmation to add the CUSTOMER role without
 * creating a second account. See src/app/[locale]/auth/_components/
 * enable-access-panel.tsx and .../verify-account-link/_components/
 * verify-account-link.tsx for the exact UI this drives.
 *
 * Every test that actually completes the link mints its OWN fresh owner via
 * registerBusinessOwnerViaApi — the shared seed DEMO_OWNER is never mutated
 * here.
 */
test.describe('Account linking — register path', () => {
  test('AUTH-M01 register with a business-only email swaps the register form for EnableAccessPanel', async ({ page }) => {
    const owner = makeTestOwner()
    await withAnonContext((ctx) => registerBusinessOwnerViaApi(ctx, owner))

    const auth = new AuthPage(page)
    await auth.gotoRegister()
    // Any password/name is fine here — register proves nothing about
    // ownership of the existing business account, only the email matters.
    const attempt = makeTestCustomer({ email: owner.email })
    await auth.register(attempt)

    await expect(auth.enableAccessHeading).toBeVisible()
    // The register form (and the tabs/heading it lived under) is gone —
    // AuthCard suppresses hideHeader for this sub-flow.
    await expect(auth.registerSubmit).toBeHidden()
    await expect(auth.signInTab).toBeHidden()
    await expect(auth.createAccountTab).toBeHidden()
  })

  test('AUTH-M07 re-registering an existing CUSTOMER-only email gets the plain "already in use" error, not EnableAccessPanel', async ({ page }) => {
    const customer = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, customer))

    const auth = new AuthPage(page)
    await auth.gotoRegister()
    const attempt = makeTestCustomer({ email: customer.email })
    await auth.register(attempt)

    await expect(page.getByText('Email already in use.')).toBeVisible()
    await expect(auth.enableAccessHeading).toBeHidden()
    // Register form is still the one on screen.
    await expect(auth.registerSubmit).toBeVisible()
  })
})

test.describe('Account linking — login path', () => {
  test('AUTH-M02 logging in with a business-only email swaps the login form for EnableAccessPanel, greeting by name', async ({ page }) => {
    const owner = makeTestOwner()
    await withAnonContext((ctx) => registerBusinessOwnerViaApi(ctx, owner))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(owner.email, owner.password)

    await expect(auth.enableAccessHeading).toBeVisible()
    await expect(auth.loginSubmit).toBeHidden()
    await expect(auth.signInTab).toBeHidden()
    // Login's 409 carries the real firstName/lastName (register's doesn't) —
    // the greeting must use the owner's real name, not their email.
    await expect(page.getByText(`Hi ${owner.firstName} ${owner.lastName},`)).toBeVisible()
    await expect(page.getByText(owner.email, { exact: false })).toBeHidden()
  })
})

test.describe('Account linking — dead-link states', () => {
  async function seedAccountLinkToken(owner: TestOwner): Promise<void> {
    const res = await withAnonContext((ctx) =>
      ctx.post(`${API_URL}/marketplace/auth/send-account-link`, { data: { email: owner.email } }),
    )
    if (!res.ok()) {
      throw new Error(`send-account-link seed failed: ${res.status()} ${await res.text()}`)
    }
  }

  test('AUTH-M06 an already-used token lands on the dead-end state with a link back to sign-in', async ({ page }) => {
    const owner = makeTestOwner()
    await withAnonContext((ctx) => registerBusinessOwnerViaApi(ctx, owner))
    await seedAccountLinkToken(owner)
    const token = await rotateLatestToken(owner.email, 'BUSINESS_ACCOUNT_LINK')
    await markLatestTokenUsed(owner.email, 'BUSINESS_ACCOUNT_LINK')

    const auth = new AuthPage(page)
    await auth.gotoVerifyAccountLink(token)

    await expect(auth.verifyLinkDeadHeading).toBeVisible()
    await expect(auth.verifyLinkBackToSignInLink).toBeVisible()
  })

  test('AUTH-M06 an expired token lands on the dead-end state with a link back to sign-in', async ({ page }) => {
    const owner = makeTestOwner()
    await withAnonContext((ctx) => registerBusinessOwnerViaApi(ctx, owner))
    await seedAccountLinkToken(owner)
    const token = await rotateLatestToken(owner.email, 'BUSINESS_ACCOUNT_LINK')
    await expireLatestToken(owner.email, 'BUSINESS_ACCOUNT_LINK')

    const auth = new AuthPage(page)
    await auth.gotoVerifyAccountLink(token)

    await expect(auth.verifyLinkDeadHeading).toBeVisible()
    await expect(auth.verifyLinkBackToSignInLink).toBeVisible()
  })

  test('AUTH-M06 visiting the page with no ?token= lands on the dead-end state immediately', async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.gotoVerifyAccountLink()

    await expect(auth.verifyLinkDeadHeading).toBeVisible()
    await expect(auth.verifyLinkBackToSignInLink).toBeVisible()
  })
})

test.describe.serial('Account linking — complete the link via the emailed token', () => {
  // Set by AUTH-M05, consumed by AUTH-M08 to prove the CUSTOMER role
  // persisted beyond the one auto-logged-in session. workers: 1 and
  // fullyParallel: false (playwright.config.ts) guarantee these run in
  // declaration order within this serial describe block.
  let linkedOwner: TestOwner | null = null

  test('AUTH-M05 EnableAccessPanel -> emailed token -> wrong password rejected -> correct password enables access and auto-logs-in', async ({ page }) => {
    const owner = makeTestOwner()
    await withAnonContext((ctx) => registerBusinessOwnerViaApi(ctx, owner))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(owner.email, owner.password)
    await expect(auth.enableAccessHeading).toBeVisible()

    await auth.sendSecureLinkButton.click()
    await expect(page.getByRole('status')).toBeVisible()

    const token = await rotateLatestToken(owner.email, 'BUSINESS_ACCOUNT_LINK')
    await auth.gotoVerifyAccountLink(token)

    await expect(auth.verifyLinkConfirmHeading).toBeVisible()
    await expect(auth.verifyLinkPassword).toBeVisible()

    // Wrong password first: inline error, the confirm form stays put.
    await auth.verifyLinkPassword.fill('DefinitelyWrong123!')
    await auth.verifyLinkConfirmButton.click()
    await expect(auth.verifyLinkWrongPasswordError).toBeVisible()
    await expect(auth.verifyLinkConfirmHeading).toBeVisible()
    await expect(auth.verifyLinkPassword).toBeVisible()

    // Correct password: success + auto-login.
    await auth.verifyLinkPassword.fill(owner.password)
    await auth.verifyLinkConfirmButton.click()
    await expect(auth.verifyLinkSuccessHeading).toBeVisible()

    // /account renders the signed-in user's real name as its h1 (account-content.tsx) —
    // a positive, name-specific signal that the session is real and authenticated,
    // not just "didn't get redirected". The proxy's auth gate (src/proxy.ts) would
    // otherwise 307 an unauthenticated visit to /login before any of this renders.
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: `${owner.firstName} ${owner.lastName}` })).toBeVisible()

    linkedOwner = owner
  })

  test('AUTH-M08 a fresh, separate login with the same (now-linked) owner succeeds normally, no EnableAccessPanel', async ({ browser }) => {
    test.skip(!linkedOwner, 'AUTH-M05 did not complete — no linked owner to re-test')
    const owner = linkedOwner!

    const context = await browser.newContext()
    try {
      const page = await context.newPage()
      const auth = new AuthPage(page)
      await auth.gotoLogin()
      await auth.login(owner.email, owner.password)

      await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
      await expect(auth.enableAccessHeading).toBeHidden()
    } finally {
      await context.close()
    }
  })
})
