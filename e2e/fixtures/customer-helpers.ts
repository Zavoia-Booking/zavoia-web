import { randomUUID } from 'node:crypto'
import type { APIRequestContext, Page } from '@playwright/test'
import { request as apiRequestFactory } from '@playwright/test'

/**
 * admin-api in TEST mode (admin-api/.env.test PORT=3001).
 *
 * Cookie sharing, verified empirically (not just from docs): `page.request`
 * IS bound to the page's BrowserContext — cookies set by a call through it
 * (e.g. registerCustomerViaApi(page.request, user)) ARE visible to `page`
 * afterward, so the browser ends up signed in with no UI login step. The
 * top-level `request` TEST FIXTURE and `withAnonContext` below are both
 * independent, unbound contexts — cookies from calls through either never
 * reach `page`. Use `page.request` when a spec wants a fast, already-signed-in
 * customer; use `request` or `withAnonContext` when a spec is about to drive
 * the login/register form itself and must start genuinely signed out.
 */
export const API_URL = 'http://localhost:3001'

export interface TestCustomer {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export const VALID_PASSWORD = 'Test1234!'

// Names go through PASSWORD_REGEX-style validation that only allows letters,
// spaces, hyphens and apostrophes (admin-api's TrimmedName decorator) — no
// digits. Email local-parts have no such restriction, so uniqueness lives
// in the email; names get a short letters-only suffix for readability in
// failure output without risking a 400 on the register/link calls.
function letterSuffix(): string {
  const id = randomUUID().replace(/-/g, '')
  return id
    .slice(0, 6)
    .split('')
    .map((c) => String.fromCharCode(97 + (parseInt(c, 16) % 26)))
    .join('')
}

export function makeTestCustomer(overrides: Partial<TestCustomer> = {}): TestCustomer {
  const uid = randomUUID().slice(0, 8)
  return {
    email: `e2e-customer-${uid}@zavoia-test.dev`,
    password: VALID_PASSWORD,
    firstName: 'Playwright',
    lastName: `Customer${letterSuffix()}`,
    ...overrides,
  }
}

export interface TestOwner {
  email: string
  password: string
  firstName: string
  lastName: string
}

export function makeTestOwner(overrides: Partial<TestOwner> = {}): TestOwner {
  const uid = randomUUID().slice(0, 8)
  return {
    email: `e2e-owner-${uid}@zavoia-test.dev`,
    password: VALID_PASSWORD,
    firstName: 'Playwright',
    lastName: `Owner${letterSuffix()}`,
    ...overrides,
  }
}

/**
 * POST /marketplace/auth/register (admin-api/src/modules/marketplace/auth/dto/customer-register.dto.ts:
 * email, password, firstName, lastName, phone?, locale?). Registration
 * auto-logs-in server-side — the CustomerJwtAuth cookies land in the
 * calling context immediately, no separate login call needed.
 */
export async function registerCustomerViaApi(
  ctx: APIRequestContext,
  user: TestCustomer,
): Promise<void> {
  const res = await ctx.post(`${API_URL}/marketplace/auth/register`, {
    data: {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(user.phone ? { phone: user.phone } : {}),
    },
  })
  if (!res.ok()) {
    throw new Error(`registerCustomerViaApi failed: ${res.status()} ${await res.text()}`)
  }
}

export async function loginCustomerViaApi(
  ctx: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const res = await ctx.post(`${API_URL}/marketplace/auth/login`, {
    data: { email, password },
  })
  if (!res.ok()) {
    throw new Error(`loginCustomerViaApi failed: ${res.status()} ${await res.text()}`)
  }
}

/**
 * POST /auth/register-business-owner (admin-api/src/modules/auth, RegisterDTO:
 * email, password, firstName, lastName, phone?). Creates an account with
 * OWNER role and NO customer role — the exact starting point the multi-role
 * account-linking suite (AUTH-M01/M02/...) needs. Each test that actually
 * completes the link should mint its own via this helper rather than
 * reusing the shared DEMO_OWNER fixture from fixtures/seed.ts, since
 * completing the link mutates that account's roles for the rest of the run.
 */
export async function registerBusinessOwnerViaApi(
  ctx: APIRequestContext,
  owner: TestOwner,
): Promise<void> {
  const res = await ctx.post(`${API_URL}/auth/register-business-owner`, {
    data: {
      email: owner.email,
      password: owner.password,
      firstName: owner.firstName,
      lastName: owner.lastName,
    },
  })
  if (!res.ok()) {
    throw new Error(`registerBusinessOwnerViaApi failed: ${res.status()} ${await res.text()}`)
  }
}

/**
 * An independent request context, isolated from every page/test fixture —
 * its cookies never reach any `page`. Use this whenever a spec needs to
 * create or manipulate an account via the API but must NOT end up
 * authenticated as a side effect (e.g. any test that then drives the
 * login/register form itself and needs to start genuinely signed out).
 */
export async function withAnonContext<T>(fn: (ctx: APIRequestContext) => Promise<T>): Promise<T> {
  const ctx = await apiRequestFactory.newContext()
  try {
    return await fn(ctx)
  } finally {
    await ctx.dispose()
  }
}

/**
 * `page.request` shares COOKIES with the browser, but the app's own JS never
 * runs, so it never attaches the `Authorization: Bearer` header protected
 * marketplace endpoints require (the access token only ever lives in an
 * in-memory ref inside AuthProvider — never in a cookie or localStorage).
 * A raw `page.request.get('/marketplace/appointments/list')` etc. after
 * `signInAsFreshCustomer`/`registerCustomerViaApi` therefore 401s even
 * though the browser cookies are perfectly valid.
 *
 * This mints a fresh access token the same way the app's own silent-refresh
 * does: POST /marketplace/auth/refresh with the CSRF double-submit header
 * (`x-csrf-token` must match the `customerCsrfToken` cookie) — see
 * admin-api's CustomerAuthController.refreshToken. Use the returned header
 * on any authenticated `page.request` call, e.g.
 *   const headers = await authHeader(page)
 *   await page.request.get('.../marketplace/appointments/list', { headers })
 */
export async function authHeader(page: Page): Promise<{ Authorization: string }> {
  // The refresh token ROTATES on every use (single-use, standard rotation
  // pattern — see CustomerAuthController.refreshToken). AuthProvider does
  // its OWN silent-refresh on every fresh page load as part of hydration;
  // calling this again immediately after a `page.goto()` can race that
  // hydration refresh for the SAME cookie. Whichever call loses gets an
  // already-rotated (invalid) token — and if it's the app's OWN hydration
  // call that loses, the app treats the whole session as signed out from
  // then on (a real failure this raced into once — see BOOK-08/09's git
  // history). A short wait lets hydration's own refresh finish first, so
  // by the time this one runs, the browser already holds the current
  // rotated cookie and there's nothing left to race.
  await page.waitForTimeout(500)
  const cookies = await page.context().cookies()
  const csrf = cookies.find((c) => c.name === 'customerCsrfToken')?.value
  if (!csrf) {
    throw new Error('authHeader: no customerCsrfToken cookie on this context — is the page actually signed in?')
  }
  const res = await page.request.post(`${API_URL}/marketplace/auth/refresh`, {
    headers: { 'x-csrf-token': csrf },
    data: {},
  })
  if (!res.ok()) {
    throw new Error(`authHeader: refresh failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { accessToken: string }
  return { Authorization: `Bearer ${body.accessToken}` }
}

/**
 * Convenience for specs that just need to land on a page as a signed-in
 * customer and don't care about exercising the register/login UI. Uses
 * `page.request` internally so the resulting cookies land on `page` itself.
 */
export async function signInAsFreshCustomer(
  page: Page,
  overrides: Partial<TestCustomer> = {},
): Promise<TestCustomer> {
  const user = makeTestCustomer(overrides)
  await registerCustomerViaApi(page.request, user)
  return user
}
