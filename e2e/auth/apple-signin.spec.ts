import { createHash } from 'node:crypto'
import { expect, test, type Page, type Route } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'

/**
 * Sign in with Apple on the web (Apple JS popup mode, src/lib/auth/apple-signin.ts).
 *
 * Nothing here talks to Apple:
 * - `installFakeApple` defines `window.AppleID` before any app script runs
 *   (page.addInitScript), so the button never loads Apple's CDN script. Its
 *   `signIn()` resolves like Apple's popup does, echoing the `state` the app
 *   passed to `init()`, which the app must verify.
 * - Every /marketplace/auth/apple* call is mocked with page.route, as in
 *   google-oauth.spec.ts. Successful sign-ins also mock GET /me, because the
 *   stub access token means nothing to the real test API.
 *
 * playwright.config.ts sets NEXT_PUBLIC_APPLE_SERVICES_ID and
 * NEXT_PUBLIC_APPLE_REDIRECT_URI for the test web server; without both the
 * Apple button renders nothing.
 */

const SERVICES_ID = 'com.zavoia.signin.web.e2e'
const REDIRECT_URI = 'http://localhost:3055/auth/apple/callback'

type AppleInit = {
  clientId: string
  scope: string
  redirectURI: string
  state: string
  nonce: string
  usePopup: boolean
}

type AppleUser = { email?: string; name?: { firstName?: string; lastName?: string } }

async function installFakeApple(page: Page, user: AppleUser | null = null): Promise<void> {
  // Belt and braces: the real script must never be needed.
  await page.route('https://appleid.cdn-apple.com/**', (route) => route.abort())
  await page.addInitScript((appleUser) => {
    const w = window as unknown as Record<string, unknown>
    w.__appleSignIns = 0
    w.AppleID = {
      auth: {
        init(config: Record<string, unknown>) {
          w.__appleConfig = config
        },
        signIn() {
          w.__appleSignIns = (w.__appleSignIns as number) + 1
          const config = w.__appleConfig as { state: string }
          return Promise.resolve({
            authorization: {
              code: 'e2e-apple-authorization-code',
              id_token: 'e2e.apple.identity-token',
              state: config.state,
            },
            ...(appleUser ? { user: appleUser } : {}),
          })
        },
      },
    }
  }, user)
}

function appleInit(page: Page): Promise<AppleInit> {
  return page.evaluate(() => (window as unknown as { __appleConfig: AppleInit }).__appleConfig)
}

function appleSignIns(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __appleSignIns: number }).__appleSignIns)
}

const STUB_USER = {
  id: 999911,
  uuid: 'e2e-apple-stub-uuid',
  email: 'e2e-apple-stub@zavoia-test.dev',
  firstName: 'Playwright',
  lastName: 'Apple',
  emailVerified: true,
}

function sessionBody(isNewUser = false) {
  return JSON.stringify({
    message: 'APPLE.S01',
    isNewUser,
    user: STUB_USER,
    accessToken: 'stub.access.token',
    csrfToken: 'stub-csrf-token',
  })
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

/** The session adopted after a mocked sign-in reads GET /me with the stub token. */
async function mockMe(page: Page): Promise<void> {
  await page.route('**/marketplace/auth/me', (route) =>
    json(route, 200, {
      user: {
        ...STUB_USER,
        profileImage: null,
        googleSub: null,
        hasPassword: false,
        apple: { linked: true, email: STUB_USER.email, isPrivateEmail: false, emailForwardingDisabled: false },
        signInMethods: ['apple'],
      },
    }),
  )
}

/** Captures each JSON body posted to an exact API path and answers with `respond`. */
async function mockPost(
  page: Page,
  path: string,
  respond: (body: Record<string, unknown>, call: number) => { status: number; body: unknown },
): Promise<Record<string, unknown>[]> {
  const bodies: Record<string, unknown>[] = []
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>
    bodies.push(body)
    const { status, body: response } = respond(body, bodies.length)
    return json(route, status, response)
  })
  return bodies
}

test.describe('Sign in with Apple — /auth (mocked Apple JS + API)', () => {
  test('APPLE-01 success: the popup credential is posted with the raw nonce, then the session lands on the redirect target', async ({ page }) => {
    await installFakeApple(page, { name: { firstName: 'Ana', lastName: 'Pop' }, email: STUB_USER.email })
    await mockMe(page)
    const bodies = await mockPost(page, '/marketplace/auth/apple', () => ({ status: 200, body: sessionBody(true) }))

    await new AuthPage(page).gotoLogin('/help')
    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()

    await expect(page).toHaveURL(/\/help$/, { timeout: 15_000 })
    expect(bodies).toHaveLength(1)
    const body = bodies[0]
    // router.replace is a client navigation: the fake's window state survives.
    const init = await appleInit(page)
    expect(body).toMatchObject({
      platform: 'web',
      authorizationCode: 'e2e-apple-authorization-code',
      identityToken: 'e2e.apple.identity-token',
      redirectUri: REDIRECT_URI,
      intent: 'login',
      firstName: 'Ana',
      lastName: 'Pop',
    })
    // Raw nonce: 32 random bytes as hex. Apple only ever sees its sha256.
    expect(body.nonce).toMatch(/^[0-9a-f]{64}$/)
    expect(init).toMatchObject({ clientId: SERVICES_ID, redirectURI: REDIRECT_URI, scope: 'name email', usePopup: true })
    expect(init.nonce).toBe(createHash('sha256').update(String(body.nonce)).digest('hex'))
  })

  test('APPLE-02 register tab is gated by the terms checkbox; no name from Apple → name step → /apple/profile signs in', async ({ page }) => {
    await installFakeApple(page)
    await mockMe(page)
    const signInBodies = await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 409,
      body: {
        statusCode: 409,
        message: ['APPLE.E17'],
        code: 'apple_profile_required',
        details: { suggestedNext: 'enter_name', tx_id: 'e2e-profile-tx', email: 'new-apple@zavoia-test.dev' },
      },
    }))
    const profileBodies = await mockPost(page, '/marketplace/auth/apple/profile', () => ({ status: 200, body: sessionBody(true) }))

    const auth = new AuthPage(page)
    await auth.gotoRegister()
    const appleButton = page.getByRole('button', { name: 'Sign up with Apple', exact: true })

    // Terms not accepted: the popup must not open.
    await appleButton.click()
    await expect(page.getByText('You must accept the terms to continue.')).toBeVisible()
    expect(await appleSignIns(page)).toBe(0)
    expect(signInBodies).toHaveLength(0)

    await auth.acceptTerms.check()
    await appleButton.click()

    await expect(page.getByRole('heading', { name: 'Finish creating your account' })).toBeVisible()
    expect(signInBodies[0]).toMatchObject({ platform: 'web', intent: 'register' })
    expect(signInBodies[0]).not.toHaveProperty('firstName')

    // Same name rules as the register form.
    await page.getByRole('button', { name: 'Create account', exact: true }).click()
    await expect(page.getByText('First name is required.')).toBeVisible()
    expect(profileBodies).toHaveLength(0)

    await page.locator('#apple-firstName').fill('Ana')
    await page.locator('#apple-lastName').fill('Pop')
    await page.getByRole('button', { name: 'Create account', exact: true }).click()

    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
    expect(profileBodies).toEqual([{ tx_id: 'e2e-profile-tx', firstName: 'Ana', lastName: 'Pop' }])
  })

  test('APPLE-03 email already has a password account → link panel asks the password; a wrong one is refused, the right one signs in', async ({ page }) => {
    await installFakeApple(page)
    await mockMe(page)
    await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 409,
      body: {
        statusCode: 409,
        message: ['APPLE.E10'],
        code: 'account_exists_unlinked_apple',
        details: { suggestedNext: 'verify_then_link', tx_id: 'e2e-link-tx', email: 'owner-of-password@zavoia-test.dev', proofs: ['password'] },
      },
    }))
    const verifyBodies = await mockPost(page, '/marketplace/auth/apple/link/verify', (_body, call) =>
      call === 1
        ? { status: 401, body: { statusCode: 401, message: ['APPLE.E08'], code: 'apple_link_proof_invalid' } }
        : { status: 200, body: sessionBody() },
    )

    await new AuthPage(page).gotoLogin()
    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Connect Apple to your account' })).toBeVisible()
    await expect(page.getByText('owner-of-password@zavoia-test.dev').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send code' })).toBeHidden()

    await page.locator('#apple-link-password').fill('Wrong1234!')
    await page.getByRole('button', { name: 'Connect Apple', exact: true }).click()
    await expect(page.getByText("That password or code isn't right.")).toBeVisible()

    await page.locator('#apple-link-password').fill('Right1234!')
    await page.getByRole('button', { name: 'Connect Apple', exact: true }).click()

    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
    expect(verifyBodies).toEqual([
      { tx_id: 'e2e-link-tx', password: 'Wrong1234!' },
      { tx_id: 'e2e-link-tx', password: 'Right1234!' },
    ])
  })

  test('APPLE-04 email belongs to an account without a password → "Send code", then the 6-digit code links and signs in', async ({ page }) => {
    await installFakeApple(page)
    await mockMe(page)
    await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 409,
      body: {
        statusCode: 409,
        message: ['APPLE.E10'],
        code: 'account_exists_unlinked_apple',
        details: { suggestedNext: 'verify_then_link', tx_id: 'e2e-code-tx', email: 'google-only@zavoia-test.dev', proofs: ['email_code'] },
      },
    }))
    const sendBodies = await mockPost(page, '/marketplace/auth/apple/link/send-code', () => ({
      status: 200,
      body: { message: 'APPLE.S04', email: 'google-only@zavoia-test.dev' },
    }))
    const verifyBodies = await mockPost(page, '/marketplace/auth/apple/link/verify', () => ({ status: 200, body: sessionBody() }))

    await new AuthPage(page).gotoLogin()
    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Connect Apple to your account' })).toBeVisible()
    await expect(page.locator('#apple-link-password')).toHaveCount(0)
    await page.getByRole('button', { name: 'Send code', exact: true }).click()

    await expect(page.getByText('We sent a 6-digit code to google-only@zavoia-test.dev.', { exact: false })).toBeVisible()
    expect(sendBodies).toEqual([{ tx_id: 'e2e-code-tx' }])

    // Only digits are kept, at most six.
    await page.locator('#apple-link-code').fill('12a3456789')
    await expect(page.locator('#apple-link-code')).toHaveValue('123456')
    await page.getByRole('button', { name: 'Connect Apple', exact: true }).click()

    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 })
    expect(verifyBodies).toEqual([{ tx_id: 'e2e-code-tx', code: '123456' }])
  })

  test('APPLE-05 Apple-linked business account → confirm panel calls /apple/confirm-access (not the Google endpoint)', async ({ page }) => {
    await installFakeApple(page)
    await mockMe(page)
    await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 409,
      body: {
        statusCode: 409,
        message: ['APPLE.E16'],
        code: 'account_exists_needs_marketplace_access',
        details: { suggestedNext: 'confirm_enable_marketplace', tx_id: 'e2e-access-tx', email: 'owner@zavoia-test.dev', provider: 'apple' },
      },
    }))
    const confirmBodies = await mockPost(page, '/marketplace/auth/apple/confirm-access', () => ({ status: 200, body: sessionBody() }))
    const googleConfirm = await mockPost(page, '/marketplace/auth/google/web/confirm-access', () => ({ status: 500, body: {} }))

    await new AuthPage(page).gotoLogin('/help')
    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Enable marketplace access?' })).toBeVisible()
    await expect(page.getByText(/Your Apple ID is already connected to a Zavoia business account \(owner@zavoia-test\.dev\)/)).toBeVisible()
    await page.getByRole('button', { name: 'Enable marketplace access', exact: true }).click()

    await expect(page).toHaveURL(/\/help$/, { timeout: 15_000 })
    expect(confirmBodies).toEqual([{ tx_id: 'e2e-access-tx' }])
    expect(googleConfirm).toHaveLength(0)
  })

  test('APPLE-06 a refused sign-in (403 pending invitation) shows its message and keeps the forms', async ({ page }) => {
    await installFakeApple(page)
    await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 403,
      body: { statusCode: 403, message: ['APPLE.E07'], code: 'pending_invitation_requires_acceptance' },
    }))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()

    await expect(page.getByText('Finish accepting your team invitation first, then you can use Apple.')).toBeVisible()
    await expect(auth.loginSubmit).toBeVisible()
  })
})

test.describe('Sign in with Apple — /auth/verify-account-link', () => {
  test('APPLE-07 an Apple-only business account confirms with Apple instead of a password', async ({ page }) => {
    await installFakeApple(page)
    await mockMe(page)
    await page.route(
      (url) => url.pathname.endsWith('/marketplace/auth/verify-account-link/validate'),
      (route) => json(route, 200, { email: 'apple-owner@zavoia-test.dev', hasPassword: false, googleLinked: false, appleLinked: true }),
    )
    const signInBodies = await mockPost(page, '/marketplace/auth/apple', () => ({
      status: 409,
      body: {
        statusCode: 409,
        message: ['APPLE.E16'],
        code: 'account_exists_needs_marketplace_access',
        details: { suggestedNext: 'confirm_enable_marketplace', tx_id: 'e2e-link-access-tx', email: 'apple-owner@zavoia-test.dev', provider: 'apple' },
      },
    }))
    const confirmBodies = await mockPost(page, '/marketplace/auth/apple/confirm-access', () => ({ status: 200, body: sessionBody() }))

    await new AuthPage(page).gotoVerifyAccountLink('e2e-unused-token')
    await expect(page.getByText('This account uses Sign in with Apple. Continue with Apple to enable marketplace access.')).toBeVisible()
    await expect(page.locator('#password')).toHaveCount(0)

    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Enable marketplace access?' })).toBeVisible()
    expect(signInBodies[0]).toMatchObject({ platform: 'web', intent: 'login' })

    await page.getByRole('button', { name: 'Enable marketplace access', exact: true }).click()
    await expect(page).not.toHaveURL(/verify-account-link/, { timeout: 15_000 })
    expect(confirmBodies).toEqual([{ tx_id: 'e2e-link-access-tx' }])
  })
})

test.describe('Sign in with Apple — Account → Login & security', () => {
  test('APPLE-08 connect Apple (relay note shown), then disconnect with the account password', async ({ page }) => {
    await signInAsFreshCustomer(page)
    await installFakeApple(page)
    const linkBodies = await mockPost(page, '/marketplace/auth/link/apple', () => ({
      status: 200,
      body: {
        message: 'APPLE.S02',
        apple: { linked: true, email: 'abc123@privaterelay.appleid.com', isPrivateEmail: true, emailForwardingDisabled: false },
        signInMethods: ['password', 'apple'],
      },
    }))
    const unlinkBodies = await mockPost(page, '/marketplace/auth/unlink/apple', (body) =>
      body.password === 'Test1234!'
        ? {
            status: 200,
            body: {
              message: 'APPLE.S03',
              apple: { linked: false, email: null, isPrivateEmail: false, emailForwardingDisabled: false },
              signInMethods: ['password'],
            },
          }
        : { status: 401, body: { statusCode: 401, message: ['APPLE.E08'], code: 'apple_link_proof_invalid' } },
    )

    await page.goto('/account')
    await page.getByRole('button', { name: 'Login & security' }).click()
    await expect(page.getByText('Apple', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Continue with Apple', exact: true }).click()
    await expect(page.getByText('Apple connected')).toBeVisible()
    await expect(page.getByText(/Apple's relay address abc123@privaterelay\.appleid\.com/)).toBeVisible()
    expect(linkBodies).toHaveLength(1)
    expect(linkBodies[0]).toMatchObject({
      platform: 'web',
      authorizationCode: 'e2e-apple-authorization-code',
      identityToken: 'e2e.apple.identity-token',
      redirectUri: REDIRECT_URI,
    })
    expect(linkBodies[0].nonce).toMatch(/^[0-9a-f]{64}$/)

    // The account has a password, so disconnecting asks for it.
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
    const form = page.locator('form').filter({ has: page.locator('#apple-disconnect-password') })
    await form.locator('#apple-disconnect-password').fill('Wrong1234!')
    await form.getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect(page.getByText("That password or code isn't right.")).toBeVisible()

    await form.locator('#apple-disconnect-password').fill('Test1234!')
    await form.getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect(page.getByText('Apple disconnected')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Apple', exact: true })).toBeVisible()
    expect(unlinkBodies).toEqual([{ password: 'Wrong1234!' }, { password: 'Test1234!' }])
  })

  test('APPLE-09 Apple-only account: disconnect explains the last-method rule; "Create password" posts to /set-password', async ({ page }) => {
    await signInAsFreshCustomer(page)
    await installFakeApple(page)
    // Keep the real signed-in user, but present it as Apple-only.
    await page.route('**/marketplace/auth/me', async (route) => {
      const response = await route.fetch()
      const body = (await response.json()) as { user: Record<string, unknown> }
      body.user.hasPassword = false
      body.user.apple = { linked: true, email: 'apple-only@zavoia-test.dev', isPrivateEmail: false, emailForwardingDisabled: false }
      body.user.signInMethods = ['apple']
      await route.fulfill({ response, json: body })
    })
    const unlinkBodies = await mockPost(page, '/marketplace/auth/unlink/apple', () => ({
      status: 400,
      body: { statusCode: 400, message: ['APPLE.E11'], code: 'apple_unlink_last_method' },
    }))
    const setPasswordBodies = await mockPost(page, '/marketplace/auth/set-password', () => ({
      status: 200,
      body: { message: 'CUSTOMER_AUTH.S17' },
    }))

    await page.goto('/account')
    await page.getByRole('button', { name: 'Login & security' }).click()

    // No password: no password prompt, a plain confirmation instead.
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
    await expect(page.getByText('Disconnect Apple from your account?', { exact: false })).toBeVisible()
    await expect(page.locator('#apple-disconnect-password')).toHaveCount(0)
    await page.getByRole('button', { name: 'Disconnect', exact: true }).last().click()
    await expect(page.getByText('Apple is the only way you sign in right now.', { exact: false })).toBeVisible()
    expect(unlinkBodies).toEqual([{}])

    // "Create password" replaces the change-password card.
    const createToggle = page.getByRole('button', { name: /doesn't have a password yet/ })
    await expect(createToggle).toBeVisible()
    await createToggle.click()
    await page.locator('#create-password-new').fill('weakpass')
    await page.locator('#create-password-confirm').fill('weakpass')
    await page.getByRole('button', { name: 'Create password', exact: true }).click()
    await expect(page.getByText('Password must include lowercase, uppercase, digit and a special character.', { exact: false })).toBeVisible()
    expect(setPasswordBodies).toHaveLength(0)

    await page.locator('#create-password-new').fill('NewPass123!')
    await page.locator('#create-password-confirm').fill('NewPass123!')
    await page.getByRole('button', { name: 'Create password', exact: true }).click()
    await expect(page.getByText('Password created')).toBeVisible()
    await expect(createToggle).toBeHidden()
    expect(setPasswordBodies).toEqual([{ password: 'NewPass123!' }])
  })
})

test.describe('Sign in with Apple — Return URL', () => {
  test('APPLE-10 the locale-less /auth/apple/callback renders the "close this window" page', async ({ page }) => {
    const response = await page.goto('/auth/apple/callback')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'You can close this window' })).toBeVisible()
  })
})
