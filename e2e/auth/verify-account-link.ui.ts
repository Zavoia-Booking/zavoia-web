import { expect, test, type Page, type Route } from '@playwright/test'

/**
 * Isolated browser regressions: every marketplace request is mocked and every
 * other mutation is blocked. The .ui.ts suffix keeps this out of the default
 * live-backend suite; use an explicit standalone testMatch, without its seed
 * globalSetup or webServer. Run against an already-running web app.
 */
type Reply = { status?: number; body?: unknown; headers?: Record<string, string>; abort?: boolean }
type Confirmation = { token: string; password: string }
type State = {
  validations: string[]
  submissions: Confirmation[]
  unexpectedWrites: string[]
  validate: (token: string, count: number) => Reply | Promise<Reply>
  complete: (body: Confirmation, count: number) => Reply | Promise<Reply>
}

const TOKEN = 'mock-account-link-token'
const USER = { uuid: '00000000-0000-4000-8000-000000000101', firstName: 'Alex', lastName: 'Fixture', email: 'alex@example.test' }
const WRONG = { status: 401, body: { message: ['CUSTOMER_AUTH.E38'] } }
const DEAD = { status: 400, body: { message: ['SYSTEM.E08'] } }
const heading = "Confirm it's you"
const submitLabel = 'Enable marketplace access'
const required = 'Please enter your password.'
const wrong = 'Incorrect password. Please try again.'
const deadHeading = "This link can't be used"

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

async function reply(route: Route, response: Reply) {
  if (response.abort) return route.abort('internetdisconnected')
  return route.fulfill({ status: response.status ?? 200, contentType: 'application/json',
    headers: response.headers, body: JSON.stringify(response.body ?? {}) })
}

async function install(page: Page): Promise<State> {
  const origin = test.info().project.use.baseURL ?? 'http://localhost:3001'
  await page.context().addCookies([{ name: 'zw-consent', value: 'denied', url: origin }])
  const state: State = {
    validations: [], submissions: [], unexpectedWrites: [],
    validate: token => ({ body: { email: token === TOKEN ? USER.email : `${token}@example.test`, hasPassword: true, googleLinked: false } }),
    complete: () => WRONG,
  }
  await page.context().route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    if (url.pathname.includes('/marketplace/')) {
      if (method === 'OPTIONS') return route.fulfill({ status: 204 })
      if (url.pathname.endsWith('/auth/verify-account-link/validate') && method === 'GET') {
        const token = url.searchParams.get('token') ?? ''
        state.validations.push(token)
        return reply(route, await state.validate(token, state.validations.length))
      }
      if (url.pathname.endsWith('/auth/verify-account-link') && method === 'POST') {
        const body = request.postDataJSON() as Confirmation
        state.submissions.push(body)
        return reply(route, await state.complete(body, state.submissions.length))
      }
      if (url.pathname.endsWith('/auth/me') && method === 'GET') return reply(route, { body: { user: USER } })
      if (!['GET', 'HEAD'].includes(method)) state.unexpectedWrites.push(`${method} ${url.pathname}`)
      return reply(route, { status: 403, body: { message: 'Mock blocked unneeded marketplace request' } })
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      state.unexpectedWrites.push(`${method} ${url.pathname}`)
      return reply(route, { status: 403, body: { message: 'Mock blocked non-marketplace mutation' } })
    }
    if (url.origin === new URL(origin).origin) return route.continue()
    return route.abort('blockedbyclient')
  })
  return state
}

async function open(page: Page, token = TOKEN) {
  await page.goto(`/auth/verify-account-link?token=${encodeURIComponent(token)}`)
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
}

test('empty and incorrect passwords focus their field; editing removes stale errors', async ({ page }) => {
  const state = await install(page)
  await open(page)
  const submit = page.getByRole('button', { name: submitLabel, exact: true })
  const password = page.locator('#password')
  for (let attempt = 0; attempt < 2; attempt++) {
    await submit.click()
    await expect(page.getByText(required, { exact: true })).toBeVisible()
    await expect(password).toBeFocused()
  }
  expect(state.submissions).toEqual([])
  await password.fill('existing-secret')
  await expect(page.getByText(required, { exact: true })).toHaveCount(0)
  await expect(password).toHaveAttribute('aria-invalid', 'false')
  await submit.click()
  await expect(page.getByText(wrong, { exact: true })).toBeVisible()
  await expect(password).toBeFocused()
  await expect(password).toHaveAttribute('aria-describedby', 'password-error')
  await password.fill('corrected-secret')
  await expect(page.getByText(wrong, { exact: true })).toHaveCount(0)
  await expect(password).toHaveAttribute('aria-invalid', 'false')
  expect(state.unexpectedWrites).toEqual([])
})

test('existing passwords preserve whitespace, Unicode, markup-like text and legacy strength exactly', async ({ page }) => {
  const state = await install(page)
  await open(page)
  const passwords = [
    '   ',
    '  Éxisting-Pașs1!  ',
    'Cafe\u0301-Ștefan-🔐1!',
    '<img src=x onerror="window.__passwordExecution=true">',
    'abc',
  ]
  for (const password of passwords) {
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: submitLabel, exact: true }).click()
    await expect(page.getByText(wrong, { exact: true })).toBeVisible()
    expect(state.submissions.at(-1)).toEqual({ token: TOKEN, password })
    await expect(page.locator('#password')).toHaveValue(password)
  }
  expect(state.submissions).toHaveLength(passwords.length)
  expect(await page.evaluate(() => '__passwordExecution' in window)).toBe(false)
  expect(state.unexpectedWrites).toEqual([])
})

test('a synchronous duplicate submission makes one request; pending controls recover after rejection', async ({ page }) => {
  const state = await install(page)
  const pending = deferred<Reply>()
  state.complete = () => pending.promise
  await open(page)
  await page.locator('#password').fill('existing-password')
  await page.locator('main form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  const submit = page.getByRole('button', { name: submitLabel, exact: true })
  await expect(submit).toBeDisabled()
  await expect(submit).toHaveAttribute('aria-busy', 'true')
  await expect(page.locator('#password')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Show password', exact: true })).toBeDisabled()
  await expect.poll(() => state.submissions.length).toBe(1)
  pending.resolve(WRONG)
  await expect(page.getByText(wrong, { exact: true })).toBeVisible()
  await expect(submit).toBeEnabled()
  await expect(page.locator('#password')).toBeFocused()
  expect(state.submissions).toHaveLength(1)
})

for (const scenario of [
  { name: 'network failure', response: { abort: true }, message: "We couldn’t connect. Check your internet connection and try again." },
  { name: 'server failure', response: { status: 500, body: { message: ['CUSTOMER_AUTH.E51'] } }, message: "We’re having a technical problem. Try again in a moment." },
  // The API currently sends Retry-After without exposing it through CORS.
  // Shared HTTP parsing therefore uses the localized no-duration fallback.
  { name: 'rate limit', response: { status: 429, headers: { 'Retry-After': '15' }, body: { message: 'Too many requests. Please try again later.', retryAfterSeconds: 15 } }, message: 'Too many attempts. Wait a moment and try again.' },
  { name: 'session replacement', response: { status: 401, body: { code: 'SESSION_CHANGED', message: 'Session changed' } }, message: 'Something went wrong. Please try again.' },
  { name: 'unknown rejection', response: { status: 400, body: { message: 'Unexpected validation rejection' } }, message: 'Something went wrong. Please try again.' },
] satisfies { name: string; response: Reply; message: string }[]) {
  test(`completion ${scenario.name} preserves the form and password for explicit retry`, async ({ page }) => {
    const state = await install(page)
    state.complete = (_body, count) => count === 1 ? scenario.response : WRONG
    await open(page)
    await page.locator('#password').fill('exact-existing-password ')
    await page.getByRole('button', { name: submitLabel, exact: true }).click()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(scenario.message)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: deadHeading, exact: true })).toHaveCount(0)
    await expect(page.locator('#password')).toHaveValue('exact-existing-password ')
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'false')
    await page.getByRole('button', { name: submitLabel, exact: true }).click()
    await expect(page.getByText(wrong, { exact: true })).toBeVisible()
    expect(state.submissions).toHaveLength(2)
    expect(state.unexpectedWrites).toEqual([])
  })
}

test('a completion timeout preserves the form and exact password', async ({ page }) => {
  const state = await install(page)
  const pending = deferred<Reply>()
  state.complete = () => pending.promise
  await open(page)
  await page.clock.install()
  await page.locator('#password').fill('still-the-original-password ')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect.poll(() => state.submissions.length).toBe(1)
  await page.clock.fastForward(15_001)
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('We didn’t receive a response in time. Try again.')
  await expect(page.locator('#password')).toHaveValue('still-the-original-password ')
  await expect(page.getByRole('button', { name: submitLabel, exact: true })).toBeEnabled()
  pending.resolve(WRONG)
})

test('preflight rate limiting stays retryable, with duplicate retries deduplicated', async ({ page }) => {
  const state = await install(page)
  const pending = deferred<Reply>()
  state.validate = (_token, count) => count === 1
    ? { status: 429, headers: { 'Retry-After': '30' }, body: { message: 'Too many requests. Please try again later.', retryAfterSeconds: 30 } }
    : pending.promise
  await page.goto(`/auth/verify-account-link?token=${TOKEN}`)
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Too many attempts. Wait a moment and try again.')
  const retry = page.getByRole('button', { name: 'Try again', exact: true })
  await retry.evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click() })
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveAttribute('aria-busy', 'true')
  await expect.poll(() => state.validations.length).toBe(2)
  pending.resolve({ body: { email: USER.email, hasPassword: true, googleLinked: false } })
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  expect(state.validations).toHaveLength(2)
})

for (const phase of ['preflight', 'completion'] as const) {
  test(`${phase} confirmed expired token shows unusable-link recovery`, async ({ page }) => {
    const state = await install(page)
    if (phase === 'preflight') state.validate = () => DEAD
    else state.complete = () => DEAD
    await page.goto(`/auth/verify-account-link?token=${TOKEN}`)
    if (phase === 'completion') {
      await page.locator('#password').fill('existing-password')
      await page.getByRole('button', { name: submitLabel, exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: deadHeading, exact: true })).toBeVisible()
    await expect(page.locator('#password')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Back to sign in', exact: true })).toHaveAttribute('href', '/auth?mode=login')
  })
}

test('changing the query token revalidates and clears the previous draft and errors', async ({ page }) => {
  const state = await install(page)
  await open(page)
  await page.locator('#password').fill('old-draft')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect(page.getByText(wrong, { exact: true })).toBeVisible()
  await page.evaluate(() => window.history.pushState(null, '', '?token=next-token'))
  await expect(page.getByText('next-token@example.test', { exact: true })).toBeVisible()
  await expect(page.locator('#password')).toHaveValue('')
  await expect(page.getByText(wrong, { exact: true })).toHaveCount(0)
  expect(state.validations).toEqual([TOKEN, 'next-token'])
  await page.locator('#password').fill('new-draft')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect(page.getByText(wrong, { exact: true })).toBeVisible()
  expect(state.submissions.at(-1)).toEqual({ token: 'next-token', password: 'new-draft' })
})

test('a late preflight response cannot replace a newer token identity', async ({ page }) => {
  const state = await install(page)
  const pending = deferred<Reply>()
  state.validate = token => token === TOKEN ? pending.promise :
    { body: { email: 'new-identity@example.test', hasPassword: true, googleLinked: false } }
  await page.goto(`/auth/verify-account-link?token=${TOKEN}`)
  await expect.poll(() => state.validations.length).toBe(1)
  await page.evaluate(() => window.history.pushState(null, '', '?token=new-identity'))
  await expect(page.getByText('new-identity@example.test', { exact: true })).toBeVisible()
  const oldResponse = page.waitForResponse(response => response.url().endsWith(`/validate?token=${TOKEN}`))
  pending.resolve({ body: { email: 'stale-identity@example.test', hasPassword: false, googleLinked: true } })
  await oldResponse
  await expect(page.getByText('new-identity@example.test', { exact: true })).toBeVisible()
  await expect(page.getByText('stale-identity@example.test', { exact: true })).toHaveCount(0)
  await expect(page.locator('#password')).toBeVisible()
  expect(state.submissions).toEqual([])
})

test('a late completion rejection cannot attach errors to a different token form', async ({ page }) => {
  const state = await install(page)
  const pending = deferred<Reply>()
  state.complete = () => pending.promise
  await open(page)
  await page.locator('#password').fill('old-password')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect.poll(() => state.submissions.length).toBe(1)
  await page.evaluate(() => window.history.pushState(null, '', '?token=new-identity'))
  await expect(page.getByText('new-identity@example.test', { exact: true })).toBeVisible()
  await page.locator('#password').fill('new-password-draft')
  const oldResponse = page.waitForResponse(response => response.url().endsWith('/auth/verify-account-link'))
  pending.resolve(WRONG)
  await oldResponse
  await expect(page.locator('#password')).toHaveValue('new-password-draft')
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0)
})

test('a confirmed Google-only account switches provider without calling the token completion again', async ({ page }) => {
  const state = await install(page)
  state.complete = () => ({ status: 400, body: { code: 'google_login_required', message: ['CUSTOMER_AUTH.E53'] } })
  await open(page)
  await page.locator('#password').fill('existing-password')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect(page.locator('#password')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: deadHeading, exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Back to sign in', exact: true })).toBeVisible()
  expect(state.submissions).toHaveLength(1)
})

test('successful completion adopts the mocked session and offers localized-home continuation', async ({ page }) => {
  const state = await install(page)
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  state.complete = () => ({ body: { user: USER, accessToken: `fixture.${payload}.fixture`, csrfToken: 'fixture-csrf' } })
  await open(page)
  await page.locator('#password').fill('existing-password')
  await page.getByRole('button', { name: submitLabel, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Marketplace access enabled', exact: true })).toBeVisible()
  await expect(page.locator('#password')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Start exploring', exact: true })).toHaveAttribute('href', '/')
  expect(state.submissions).toEqual([{ token: TOKEN, password: 'existing-password' }])
  expect(state.unexpectedWrites).toEqual([])
})
