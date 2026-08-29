import { expect, test, type Page } from '@playwright/test'
import { AuthPage } from '../pages/AuthPage'
import {
  makeTestCustomer,
  registerCustomerViaApi,
  signInAsFreshCustomer,
  withAnonContext,
} from '../fixtures/customer-helpers'

/**
 * Google OAuth is a full-page redirect flow (src/lib/auth/google-oauth.ts):
 * the button navigates to Google, then Google redirects back to
 * /auth/callback with ?code=&state=, and google-callback.tsx reads a
 * sessionStorage['googleOAuth'] context stashed before the redirect
 * (`{state, intent, locale, redirect}` — see consumeGoogleOAuthContext) and
 * POSTs the code to /marketplace/auth/google/web.
 *
 * None of these tests touch a real Google account: `stashGoogleOAuthContext`
 * seeds the same sessionStorage shape the real button would via
 * page.addInitScript (so it exists before any app JS runs), and
 * page.route intercepts the backend exchange so we can drive every outcome
 * (success / collision) deterministically. NEXT_PUBLIC_GOOGLE_CLIENT_ID is
 * empty in this test env by default (playwright.config.ts) — that only
 * hides the *button* that starts the flow, it does not gate the
 * /auth/callback landing route itself, so these tests work unmodified.
 */

async function stashGoogleOAuthContext(
  page: Page,
  intent: 'login' | 'register' | 'link' = 'login',
  redirect: string | null = null,
): Promise<void> {
  await page.addInitScript(
    ({ intent: initIntent, redirect: initRedirect }) => {
      sessionStorage.setItem(
        'googleOAuth',
        JSON.stringify({ state: 'e2e-state', intent: initIntent, locale: 'en', redirect: initRedirect }),
      )
    },
    { intent, redirect },
  )
}

test.describe('Google OAuth callback (mocked)', () => {
  test('AUTH-G01 a 200 exchange response signs the user in and navigates off /auth/callback', async ({ page }) => {
    await stashGoogleOAuthContext(page, 'login')
    await page.route('**/marketplace/auth/google/web', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'OK',
          isNewUser: false,
          user: {
            id: 999901,
            uuid: 'e2e-google-stub-uuid',
            email: 'e2e-google-stub@zavoia-test.dev',
            firstName: 'Playwright',
            lastName: 'Google',
            emailVerified: true,
          },
          accessToken: 'stub.access.token',
          csrfToken: 'stub-csrf-token',
        }),
      }),
    )

    await page.goto('/auth/callback?code=FAKE-CODE&state=e2e-state')

    await expect(page).not.toHaveURL(/\/auth\/callback/, { timeout: 15_000 })
  })

  test('AUTH-G02 a 409 account_exists_unlinked_google renders GoogleLinkPanel', async ({ page }) => {
    // Real account for realism (per the task brief): a genuine CUSTOMER-only
    // registration, whose email we plumb through the stubbed 409 body so the
    // panel renders a real, existing account's email. The `tx_id` itself
    // cannot be a real one without a rabbit hole this suite deliberately
    // avoids: obtaining it requires admin-api's googleAuthService to actually
    // exchange a code with Google server-side (customer-auth.service.ts
    // googleAuth(), createPendingLink) — an outbound call Playwright's
    // page.route (browser-side interception only) cannot reach. Per the task
    // brief this pure-panel-render version is an accepted P0 on its own; the
    // "Link account" submit is intentionally NOT exercised here since it
    // would fail against the fake tx_id no matter what password is entered.
    const customer = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, customer))

    await stashGoogleOAuthContext(page, 'login')
    await page.route('**/marketplace/auth/google/web', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'CUSTOMER_AUTH.E06',
          code: 'account_exists_unlinked_google',
          details: {
            suggestedNext: 'verify_then_link',
            tx_id: 'e2e-fake-tx-id',
            email: customer.email,
          },
        }),
      }),
    )

    await page.goto('/auth/callback?code=FAKE-CODE&state=e2e-state')

    const auth = new AuthPage(page)
    await expect(auth.googleLinkHeading).toBeVisible()
    await expect(auth.googleLinkPassword).toBeVisible()
    await expect(auth.googleLinkSubmitButton).toBeVisible()
    // The email appears twice (once inside the explanatory sentence, once in
    // its own read-only display box) — .first() is enough to prove it rendered.
    await expect(page.getByText(customer.email).first()).toBeVisible()
  })
})

test.describe('Login form Google hint', () => {
  test('AUTH-G03 wrong password shows the generic error; the Google hint and button are suppressed (no client id configured)', async ({ page }) => {
    const customer = makeTestCustomer()
    await withAnonContext((ctx) => registerCustomerViaApi(ctx, customer))

    const auth = new AuthPage(page)
    await auth.gotoLogin()
    await auth.login(customer.email, 'DefinitelyWrong123!')

    await expect(auth.incorrectCredentialsAlert()).toBeVisible()
    // login-form.tsx: `{GOOGLE_CLIENT_ID && <p>{dict.errors.googleAccountHint}</p>}`.
    // NEXT_PUBLIC_GOOGLE_CLIENT_ID is '' in this test env (playwright.config.ts
    // webServer env), so GOOGLE_CLIENT_ID (src/lib/env.ts) is '' and this hint
    // — and the Google button itself — must not render.
    await expect(
      page.getByText('Signed up with Google? Use "Continue with Google" above.'),
    ).toBeHidden()
    await expect(page.getByRole('button', { name: 'Google', exact: true })).toBeHidden()
  })
})

test.describe('Account page Google connection row', () => {
  test('AUTH-G04 Login & security shows the Google row as "Not connected" (connect button hidden — no client id configured)', async ({ page }) => {
    // Real signed-in customer with a password (registered via email/password,
    // so hasPassword is true and the disconnect gate never even applies here
    // — there is nothing linked to disconnect). Wiring an actual Google
    // connect/disconnect round-trip needs a real Google account or a token
    // this suite has no way to mint, so per the task brief this stays a
    // light, real-account render check: the row appears and correctly shows
    // "Not connected", and (since NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset in
    // this test env) the "Connect" affordance is hidden entirely — same
    // GOOGLE_CLIENT_ID feature-flag gate as AUTH-G03's login hint.
    await signInAsFreshCustomer(page)

    await page.goto('/account')
    await page.getByRole('button', { name: 'Login & security' }).click()

    await expect(page.getByText('Google', { exact: true })).toBeVisible()
    await expect(page.getByText('Not connected', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google', exact: true })).toBeHidden()
  })
})
