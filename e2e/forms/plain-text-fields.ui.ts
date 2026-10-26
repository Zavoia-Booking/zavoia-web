import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { AuthUser } from '../../src/lib/auth/types'
import type { CustomerProfile, Ticket } from '../../src/lib/api/marketplace/types'

const MAX = 9500
const UNSAFE_EN = 'Remove HTML tags or scripts from your text.'
const UNSAFE_RO = 'Elimină codul HTML sau scripturile din text.'
const EXISTING_MESSAGE = 'Existing support conversation fixture'
const SAFE_MESSAGE = '  Ședința de mâine: „întrebare”, 2 < 3 și 5 > 4.\nVă mulțumesc! 😊  '
const unsafeExamples = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'onload=alert(1)', 'javascript:alert(1)']

const user: AuthUser = {
  uuid: 'plain-text-fixture-user', email: 'plain-text@example.invalid', firstName: 'Ștefana',
  lastName: 'Fixture', profileImage: null, hasPassword: true, emailVerified: true, googleSub: null,
}

const profile: CustomerProfile = {
  id: 901, uuid: user.uuid, firstName: user.firstName, lastName: user.lastName,
  email: user.email, phone: null, profileImage: null, dateOfBirth: null,
  addressCountry: null, addressCity: null, addressStreet: null, addressNumber: null,
  addressMentions: null, email_verified: true, createdAt: '2026-01-02T10:00:00Z',
}

function ticket(id = 701, message = EXISTING_MESSAGE): Ticket {
  return {
    id, uuid: `plain-text-ticket-${id}`, sourceType: 'MARKETPLACE',
    details: { history: [{ message, createdBy: String(profile.id) }] },
    createdAt: '2026-10-01T10:00:00Z', updatedAt: '2026-10-01T10:00:00Z',
    seen: true, seenByAdmin: false, priority: 'LOW', category: 'bug', status: 'OPEN', businessId: null,
  }
}

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => { release = resolve })
  return { promise, release }
}

async function installFormsFixture(context: BrowserContext, baseURL: string) {
  const state = {
    tickets: [ticket()],
    mutations: [] as Array<{ path: string; body: Record<string, unknown> }>,
    unmocked: [] as string[], blockedMutations: [] as string[],
    createFailures: 0, guestFailures: 0, replyFailures: 0, closedReply: false,
    replyValidationCode: null as string | null,
    createGate: null as ReturnType<typeof gate> | null,
  }
  const token = ['eyJhbGciOiJub25lIn0',
    Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'),
    'plain-text-fixture'].join('.')
  await context.addCookies([
    { name: 'zw-consent', value: 'denied', url: baseURL },
    { name: 'customerCsrfToken', value: 'plain-text-fixture', url: baseURL },
  ])
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (data: unknown, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(data),
    })
    const wrapped = (data: unknown) => json({ message: 'Plain text fixture', data })
    if (path.includes('/marketplace/')) {
      if (method === 'OPTIONS') return route.fulfill({ status: 204 })
      if (path.endsWith('/auth/refresh')) return json({ accessToken: token, csrfToken: 'plain-text-fixture' })
      if (path.endsWith('/auth/me')) return json({ user })
      if (path.endsWith('/customer/profile')) return json(profile)
      if (path.endsWith('/customer/profile-summary')) return json({
        profileImage: null, memberSince: profile.createdAt, totalAppointments: 2,
        totalBusinessReviews: 0, totalProfessionalReviews: 0, totalFavorites: 0,
      })
      if (path.endsWith('/notifications/unread-count')) return wrapped({ count: 0 })
      if (path.endsWith('/notifications/inbox')) return wrapped({ notifications: [], unreadCount: 0, hasMore: false, nextCursor: null })
      if (path.endsWith('/public/support/tickets') && method === 'POST') {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        if (state.guestFailures > 0) {
          state.guestFailures -= 1
          return json({ message: 'Fixture support unavailable' }, 503)
        }
        return wrapped({ uuid: 'plain-text-guest-receipt', success: true })
      }
      if (path.endsWith('/support/tickets')) {
        if (method === 'GET') return wrapped(state.tickets.map((entry) => ({ ...entry, hasUnread: false })))
        if (method === 'POST') {
          const body = request.postDataJSON()
          state.mutations.push({ path, body })
          if (state.createGate) await state.createGate.promise
          if (state.createFailures > 0) {
            state.createFailures -= 1
            return json({ message: 'Fixture support unavailable' }, 503)
          }
          const created = { ...ticket(702, body.message), category: body.category }
          state.tickets.push(created)
          return wrapped(created)
        }
      }
      const thread = path.match(/\/support\/tickets\/(\d+)$/)
      if (thread && method === 'GET') return wrapped(state.tickets.find((entry) => entry.id === Number(thread[1])))
      const reply = path.match(/\/support\/tickets\/(\d+)\/messages$/)
      if (reply && method === 'POST') {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        if (state.closedReply) return json({ message: ['SUPPORT.E04'] }, 400)
        if (state.replyValidationCode) return json({ message: [state.replyValidationCode] }, 400)
        if (state.replyFailures > 0) {
          state.replyFailures -= 1
          return json({ message: 'Fixture support unavailable' }, 503)
        }
        const entry = state.tickets.find((candidate) => candidate.id === Number(reply[1]))!
        entry.details.history.push({ message: body.message, createdBy: String(profile.id) })
        return wrapped(entry)
      }
      state.unmocked.push(`${method} ${path}`)
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) state.blockedMutations.push(`${method} ${path}`)
      return json({ message: 'Fixture blocked unmocked API endpoint' }, 404)
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      state.blockedMutations.push(`${method} ${path}`)
      return route.fulfill({ status: 403, body: 'Fixture blocked unmocked mutation' })
    }
    if (url.origin !== new URL(baseURL).origin) return route.abort('blockedbyclient')
    return route.continue()
  })
  return state
}

const formTest = test.extend<{ forms: Awaited<ReturnType<typeof installFormsFixture>> }>({
  forms: [async ({ context, baseURL }, provideFixture) => {
    const state = await installFormsFixture(context, baseURL!)
    await provideFixture(state)
    state.createGate?.release()
    expect(state.unmocked).toEqual([])
    expect(state.blockedMutations).toEqual([])
  }, { auto: true }],
})

async function openAccountSupport(page: Page, locale: 'en' | 'ro' = 'en') {
  await page.goto(`${locale === 'ro' ? '/ro' : ''}/account`)
  await page.getByRole('button', { name: locale === 'ro' ? 'Asistență' : 'Support', exact: true }).click()
  await expect(page.getByRole('button', { name: locale === 'ro' ? 'Raportează o problemă' : 'Report an issue', exact: true })).toBeEnabled()
}

async function openNewTicket(page: Page, locale: 'en' | 'ro' = 'en') {
  await openAccountSupport(page, locale)
  await page.getByRole('button', { name: locale === 'ro' ? 'Raportează o problemă' : 'Report an issue', exact: true }).click()
  return page.getByRole('textbox', { name: locale === 'ro' ? 'Spune-ne ce s-a întâmplat' : 'Tell us what happened', exact: true })
}

async function openThread(page: Page, locale: 'en' | 'ro' = 'en') {
  await openAccountSupport(page, locale)
  await page.getByRole('button').filter({ hasText: '#701' }).click()
  return page.getByRole('textbox', { name: locale === 'ro' ? 'Răspuns' : 'Reply', exact: true })
}

async function openGuestReport(page: Page, context: BrowserContext, locale: 'en' | 'ro' = 'en') {
  await context.clearCookies({ name: 'customerCsrfToken' })
  await page.goto(`${locale === 'ro' ? '/ro' : ''}/help`)
  await page.getByRole('button', { name: locale === 'ro' ? 'Raportează o problemă' : 'Report an issue', exact: true }).click()
  return page.getByRole('dialog')
}

async function expectFieldAssociation(field: Locator, expectedError?: string) {
  const associated = await field.evaluate((element) => {
    const ids = element.getAttribute('aria-describedby')?.split(/\s+/) ?? []
    return ids.map((id) => ({ text: document.getElementById(id)?.textContent, role: document.getElementById(id)?.getAttribute('role') }))
  })
  expect(associated.some((item) => item.text?.includes('/ 9,500') || item.text?.includes('/ 9.500'))).toBe(true)
  if (expectedError) {
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(associated.some((item) => item.text?.includes(expectedError) && item.role === 'alert')).toBe(true)
  }
}

async function expectFixedDarkFocus(field: Locator) {
  await field.focus()
  const appearance = () => field.evaluate((element) => {
    const css = getComputedStyle(element)
    const reference = document.createElement('span')
    reference.style.color = 'var(--c-ink)'
    document.body.appendChild(reference)
    const ink = getComputedStyle(reference).color
    reference.remove()
    return { resize: css.resize, overflowY: css.overflowY, border: css.borderTopColor,
      borderWidth: css.borderTopWidth, outline: css.outlineStyle, shadow: css.boxShadow, ink }
  })
  const { ink } = await appearance()
  // Inputs inherit the app's border-color transition. Assert the settled
  // focus state, rather than sampling an intermediate interpolated color.
  await expect.poll(appearance).toEqual({ resize: 'none', overflowY: 'auto', border: ink,
    borderWidth: '1px', outline: 'none', shadow: 'none', ink })
}

formTest('account ticket rejects markup and scripts inline without posting; safe punctuation and multiline Romanian remain intact', async ({ page, forms }) => {
  const field = await openNewTicket(page)
  await expect(page.getByText('0 / 9,500 characters', { exact: true })).toBeVisible()
  await expect(field).toHaveAttribute('maxlength', String(MAX))
  await expectFixedDarkFocus(field)
  await page.getByRole('button', { name: 'Cancel', exact: true }).focus()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText('Enter a message.')
  await expectFieldAssociation(field, 'Enter a message.')
  for (const example of unsafeExamples) {
    await field.fill(example)
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toContainText(UNSAFE_EN)
    await expectFieldAssociation(field, UNSAFE_EN)
    const submit = page.getByRole('button', { name: 'Submit ticket', exact: true })
    await expect(submit).toBeDisabled()
    await submit.evaluate((element: HTMLButtonElement) => element.click())
    expect(forms.mutations).toEqual([])
  }
  await field.fill(SAFE_MESSAGE)
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0)
  await expectFieldAssociation(field)
  await page.getByRole('button', { name: 'Submit ticket', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Reply', exact: true })).toBeVisible()
  expect(forms.mutations).toEqual([{ path: '/marketplace/support/tickets', body: { category: 'bug', message: SAFE_MESSAGE.trim() } }])
  await expect(page.getByText(SAFE_MESSAGE.trim(), { exact: true })).toBeVisible()
})

formTest('Romanian account ticket keeps its draft after a request failure and retries once without duplicate submissions', async ({ page, forms }) => {
  const field = await openNewTicket(page, 'ro')
  await expect(page.getByText('0 / 9.500 de caractere', { exact: true })).toBeVisible()
  await field.fill('<script>')
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText(UNSAFE_RO)
  await field.fill(SAFE_MESSAGE)
  forms.createFailures = 1
  await page.getByRole('button', { name: 'Trimite tichetul', exact: true }).click()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText('Avem o problemă tehnică. Încearcă din nou în câteva momente.')
  await expect(field).toHaveValue(SAFE_MESSAGE)
  forms.createGate = gate()
  const button = page.getByRole('button', { name: 'Trimite tichetul', exact: true })
  await button.evaluate((element: HTMLButtonElement) => { element.click(); element.click() })
  await expect(button).toBeDisabled()
  await expect(field).toBeDisabled()
  await expect.poll(() => forms.mutations.length).toBe(2)
  forms.createGate.release()
  await expect(page.getByRole('textbox', { name: 'Răspuns', exact: true })).toBeVisible()
  expect(forms.mutations.map((mutation) => mutation.body.message)).toEqual([SAFE_MESSAGE.trim(), SAFE_MESSAGE.trim()])
})

formTest('account reply blocks unsafe Enter submission, preserves failed drafts and resets required validation after success', async ({ page, forms }) => {
  let field = await openThread(page)
  await expect(page.getByText('0 / 9,500 characters', { exact: true })).toBeVisible()
  await expect(field).toHaveAttribute('maxlength', String(MAX))
  await expectFixedDarkFocus(field)
  await field.fill('<iframe src=unsafe>')
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled()
  await field.press('Enter')
  await expectFieldAssociation(field, UNSAFE_EN)
  expect(forms.mutations).toEqual([])
  await field.fill(SAFE_MESSAGE)
  await page.getByRole('button', { name: 'Send', exact: true }).focus()
  forms.replyFailures = 1
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText("We’re having a technical problem. Try again in a moment.")
  await expect(field).toHaveValue(SAFE_MESSAGE)
  await field.press('Enter')
  await expect(page.getByText('Reply sent', { exact: true })).toBeVisible()
  field = page.getByRole('textbox', { name: 'Reply', exact: true })
  await expect(field).toHaveValue('')
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0)
  await expect(page.getByText('0 / 9,500 characters', { exact: true })).toBeVisible()
  expect(forms.mutations.map((mutation) => mutation.body.message)).toEqual([SAFE_MESSAGE.trim(), SAFE_MESSAGE.trim()])
})

formTest('account reply maps API plain-text validation to the field and explains a ticket closed elsewhere inline', async ({ page, forms }) => {
  const field = await openThread(page, 'ro')
  await field.fill('Mesaj simplu, valid local.')
  forms.replyValidationCode = 'VALIDATION.PLAIN_TEXT_UNSAFE'
  await page.getByRole('button', { name: 'Trimite', exact: true }).click()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText(UNSAFE_RO)
  await expectFieldAssociation(field, UNSAFE_RO)
  await expect(field).toHaveValue('Mesaj simplu, valid local.')
  forms.replyValidationCode = null
  forms.closedReply = true
  await field.fill('Un nou mesaj simplu.')
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveCount(0)
  await page.getByRole('button', { name: 'Trimite', exact: true }).click()
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText('Tichetul este închis. Deschide unul nou ca să continui.')
  await expect(field).toHaveValue('Un nou mesaj simplu.')
})

formTest('guest Help rejects unsafe title and message markup with associated inline errors before any POST', async ({ page, context, forms }) => {
  const dialog = await openGuestReport(page, context)
  const title = dialog.getByRole('textbox', { name: 'Title', exact: true })
  const field = dialog.getByRole('textbox', { name: 'What happened?', exact: true })
  const button = dialog.getByRole('button', { name: 'Send report', exact: true })
  await expect(dialog.getByText('0 / 9,500 characters', { exact: true })).toBeVisible()
  await expectFixedDarkFocus(field)
  await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill('guest@example.invalid')
  await title.fill('<script>')
  await field.fill('A plain, valid support message.')
  await expect(title).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByRole('alert')).toHaveText(UNSAFE_EN)
  await expect(button).toBeDisabled()
  await button.evaluate((element: HTMLButtonElement) => element.click())
  expect(forms.mutations).toEqual([])
  await title.fill('A plain support question')
  for (const example of unsafeExamples) {
    await field.fill(example)
    await expectFieldAssociation(field, UNSAFE_EN)
    await expect(button).toBeDisabled()
    await button.evaluate((element: HTMLButtonElement) => element.click())
    expect(forms.mutations).toEqual([])
  }
})

formTest('Romanian guest Help keeps a failed draft, retries with the exact combined safe message and normalizes only email', async ({ page, context, forms }) => {
  const dialog = await openGuestReport(page, context, 'ro')
  const field = dialog.getByRole('textbox', { name: 'Ce s-a întâmplat?', exact: true })
  await expect(dialog.getByText('0 / 9.500 de caractere', { exact: true })).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Titlu', exact: true }).fill('  Întrebare despre ședință  ')
  await dialog.getByRole('textbox', { name: 'Email', exact: true }).fill('  GUEST@Example.Invalid  ')
  await field.fill('<script>')
  await expect(dialog.getByRole('alert')).toHaveText(UNSAFE_RO)
  await field.fill(SAFE_MESSAGE)
  forms.guestFailures = 1
  await dialog.getByRole('button', { name: 'Trimite raportul', exact: true }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Nu am putut trimite raportul. Te rugăm să încerci din nou.')
  await expect(field).toHaveValue(SAFE_MESSAGE)
  await dialog.getByRole('button', { name: 'Trimite raportul', exact: true }).click()
  await expect(dialog.getByRole('heading', { name: 'Mulțumim — am primit raportul tău', exact: true })).toBeVisible()
  const payload = { email: 'guest@example.invalid', locale: 'ro', category: 'bug', message: `Întrebare despre ședință\n\n${SAFE_MESSAGE.trim()}` }
  expect(forms.mutations).toEqual([
    { path: '/marketplace/public/support/tickets', body: payload },
    { path: '/marketplace/public/support/tickets', body: payload },
  ])
})

formTest('support textareas cap input at 9500 and scroll within their fixed size on a narrow screen', async ({ page, context, forms }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  const field = await openNewTicket(page)
  await field.fill('x'.repeat(MAX + 1))
  await expect(field).toHaveValue('x'.repeat(MAX))
  await expect(page.getByText('9,500 / 9,500 characters', { exact: true })).toBeVisible()
  const initialHeight = await field.evaluate((element) => element.getBoundingClientRect().height)
  await field.fill(Array.from({ length: 100 }, (_, index) => `Linia ${index}: șțîâă.`).join('\n'))
  const dimensions = await field.evaluate((element) => ({ height: element.getBoundingClientRect().height,
    scroll: element.scrollHeight, client: element.clientHeight, resize: getComputedStyle(element).resize }))
  expect(dimensions.height).toBe(initialHeight)
  expect(dimensions.scroll).toBeGreaterThan(dimensions.client)
  expect(dimensions.resize).toBe('none')
  expect(forms.mutations).toEqual([])
  const dialog = await openGuestReport(page, context)
  const guestField = dialog.getByRole('textbox', { name: 'What happened?', exact: true })
  await expect(guestField).toHaveAttribute('maxlength', String(MAX))
  await expectFixedDarkFocus(guestField)
  await guestField.fill('a'.repeat(MAX + 1))
  await expect(guestField).toHaveValue('a'.repeat(MAX))
  await expect(dialog.getByText('9,500 / 9,500 characters', { exact: true })).toBeVisible()
})
