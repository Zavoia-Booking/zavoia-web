import { expect, test as base, type Locator, type Page } from '@playwright/test'
import type { CustomerProfile, NotificationPreferences, TicketListItem, UpdateNotificationPreferencesBody, UpdateProfileBody } from '../../src/lib/api/marketplace/types'

const copy = {
  en: { edit: 'Edit', save: 'Save', cancel: 'Cancel', first: 'First name', last: 'Last name', phone: 'Phone number', dob: 'Date of birth', address: 'Address', city: 'City', account: 'Account', notifications: 'Notifications', error: 'Something went wrong. Please try again.', success: 'Profile updated' },
  ro: { edit: 'Editează', save: 'Salvează', cancel: 'Anulează', first: 'Prenume', last: 'Nume', phone: 'Număr de telefon', dob: 'Data nașterii', address: 'Adresă', city: 'Oraș', account: 'Cont', notifications: 'Notificări', error: 'A apărut o eroare. Încearcă din nou.', success: 'Profil actualizat' },
} as const
type PendingSave = { body: UpdateProfileBody; reply: (status?: number) => void }
type PendingPreferenceSave = { body: UpdateNotificationPreferencesBody; reply: (status?: number) => void }
type PendingClose = { id: number; reply: (status?: number) => void }
type PendingLogout = { reply: (status?: number) => void }
type AccountFixture = {
  authenticated: boolean
  logouts: PendingLogout[]
  saves: PendingSave[]
  preferences: NotificationPreferences
  preferenceReads: number
  preferenceSaves: PendingPreferenceSave[]
  support: {
    tickets: TicketListItem[]
    listReads: number
    listFailures: number
    detailReads: number[]
    detailFailures: number
    closes: PendingClose[]
  }
}

const settingsCopy = {
  en: { personal: 'Personal info', preferences: 'Preferences', security: 'Login & security', marketing: 'Marketing', reminders: 'Reminders', push: 'Push', sms: 'SMS', email: 'Email', password: 'Password', currentPassword: 'Current password', preferencesSaved: 'Preferences updated' },
  ro: { personal: 'Date personale', preferences: 'Preferințe', security: 'Autentificare și securitate', marketing: 'Marketing', reminders: 'Memento-uri', push: 'Push', sms: 'SMS', email: 'Email', password: 'Parolă', currentPassword: 'Parola actuală', preferencesSaved: 'Preferințe actualizate' },
} as const

const calendarCopy = {
  en: { chooseMonth: 'Choose month', chooseYear: 'Choose year', previousYears: 'Previous years', nextYears: 'Next years', nextMonth: 'Next month' },
  ro: { chooseMonth: 'Alege luna', chooseYear: 'Alege anul', previousYears: 'Anii anteriori', nextYears: 'Anii următori', nextMonth: 'Luna următoare' },
} as const

const logoutCopy = {
  en: { action: 'Log out', pending: 'Logging out...', settled: 'Signed out', gateTitle: 'Your profile lives here.', gateBody: 'Sign in to manage your details, notifications and security.' },
  ro: { action: 'Deconectare', pending: 'Se deconectează...', settled: 'Te-ai deconectat', gateTitle: 'Profilul tău se află aici.', gateBody: 'Conectează-te pentru a-ți gestiona datele, notificările și securitatea.' },
} as const

const preferencePaths = {
  marketingPush: ['marketing', 'push'], marketingSms: ['marketing', 'sms'], marketingEmail: ['marketing', 'email'],
  reminderPush: ['reminders', 'push'], reminderSms: ['reminders', 'sms'], reminderEmail: ['reminders', 'email'],
} as const satisfies Record<keyof UpdateNotificationPreferencesBody, readonly [keyof NotificationPreferences, 'push' | 'sms' | 'email']>

const supportCopy = {
  en: {
    section: 'Support', all: 'All', active: 'Active', closed: 'Closed', newTicket: 'Contact support',
    back: 'Collapse conversation', conversation: 'Conversation', reply: 'Reply', close: 'Close ticket', closeTitle: 'Close this ticket?',
    loadError: "Couldn't load your tickets. Please try again.", retry: 'Try again',
    empty: 'No tickets yet', unread: 'Unread reply', you: 'You', support: 'Zavoia Support', closedNotice: 'Ticket closed',
    closedNote: 'You can still read the messages. Contact support if you need more help.',
    modalTitle: 'How can we help?', modalClose: 'Close', messageLabel: 'Tell us what happened',
  },
  ro: {
    section: 'Asistență', all: 'Toate', active: 'Active', closed: 'Închise', newTicket: 'Contactează asistența',
    back: 'Restrânge conversația', conversation: 'Conversație', reply: 'Răspuns', close: 'Închide tichetul', closeTitle: 'Închizi acest tichet?',
    loadError: 'Tichetele nu au putut fi încărcate. Încearcă din nou.', retry: 'Încearcă din nou',
    empty: 'Niciun tichet încă', unread: 'Răspuns necitit', you: 'Tu', support: 'Asistență Zavoia', closedNotice: 'Tichet închis',
    closedNote: 'Poți citi în continuare mesajele. Contactează asistența dacă mai ai nevoie de ajutor.',
    modalTitle: 'Cu ce te putem ajuta?', modalClose: 'Închide', messageLabel: 'Spune-ne ce s-a întâmplat',
  },
} as const

function supportTickets(): TicketListItem[] {
  return ([
    [703, 'REOPENED', 'Reopened booking question'],
    [701, 'OPEN', 'A booking confirmation did not arrive'],
    [704, 'CLOSED', 'An earlier question has been resolved'],
    [702, 'IN_PROGRESS', 'A profile photo needs another look'],
  ] as const).map(([id, status, message]) => ({
    id, uuid: `account-ui-ticket-${id}`, sourceType: 'MARKETPLACE', status,
    category: id === 703 ? 'question' : 'bug', priority: 'LOW', businessId: null,
    createdAt: '2026-10-01T10:00:00Z', updatedAt: `2026-10-${25 - (id - 701)}T10:00:00Z`,
    seen: id !== 701, seenByAdmin: true, hasUnread: id === 701,
    details: { history: [
      { message, createdBy: '901' },
      { message: `We are looking into your report.\nReference: ${'reference'.repeat(32)}`, createdBy: 'admin' },
    ] },
  }))
}

const test = base.extend<{ account: AccountFixture }>({
  account: async ({ context, baseURL }, run) => {
    if (!baseURL) throw new Error('Account UI tests require a baseURL')
    const origin = new URL(baseURL).origin
    let profile: CustomerProfile = {
      id: 901, uuid: 'account-ui-fixture', firstName: 'Originalfirst', lastName: 'Originallast',
      email: 'account-ui@example.invalid', phone: null, profileImage: null,
      dateOfBirth: '1994-03-15', addressCountry: 'Romania', addressCity: 'Original City',
      addressStreet: 'Original Street', addressNumber: '1', addressMentions: '',
      email_verified: true, createdAt: '2026-01-02T10:00:00Z',
    }
    const token = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'), 'account-ui-fixture'].join('.')
    const state: AccountFixture = {
      authenticated: true, logouts: [],
      saves: [],
      preferences: { marketing: { push: false, sms: false, email: true }, reminders: { push: true, sms: false, email: true } },
      preferenceReads: 0, preferenceSaves: [],
      support: { tickets: supportTickets(), listReads: 0, listFailures: 0, detailReads: [], detailFailures: 0, closes: [] },
    }
    const unexpected: string[] = []
    await context.addCookies([
      { name: 'zw-consent', value: 'denied', url: baseURL },
      { name: 'customerCsrfToken', value: 'account-ui-fixture', url: baseURL },
    ])
    await context.route('**/*', async route => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname
      const method = request.method()
      const headers = { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true' }
      const json = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })
      if (path.includes('/marketplace/')) {
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,x-csrf-token' } })
        if (path.endsWith('/auth/refresh') && method === 'POST') return state.authenticated ? json({ accessToken: token, csrfToken: 'account-ui-fixture' }) : json({ message: 'Controlled signed-out fixture' }, 401)
        if (path.endsWith('/auth/me') && method === 'GET') return state.authenticated ? json({ user: { uuid: profile.uuid, email: profile.email, firstName: profile.firstName, lastName: profile.lastName, profileImage: null, hasPassword: true, emailVerified: true, googleSub: null } }) : json({ message: 'Controlled signed-out fixture' }, 401)
        if (path.endsWith('/auth/logout') && method === 'POST') {
          state.authenticated = false
          const status = await new Promise<number>(resolve => {
            let settled = false
            state.logouts.push({ reply: (status = 200) => {
              if (settled) return
              settled = true
              resolve(status)
            } })
          })
          return json(status === 200 ? {} : { message: 'Controlled logout fixture failure' }, status)
        }
        if (path.endsWith('/public/industries') && method === 'GET') return json([])
        if (path.endsWith('/public/listings') && method === 'GET') return json({ locations: [], businesses: [], total: 0, limit: 300, offset: 0, fallback: { applied: false, reason: null } })
        if (path.endsWith('/customer/profile') && method === 'GET') return json(profile)
        if (path.endsWith('/customer/profile-summary') && method === 'GET') return json({ profileImage: null, memberSince: profile.createdAt, totalAppointments: 2, totalBusinessReviews: 0, totalProfessionalReviews: 0, totalFavorites: 0 })
        if (path.endsWith('/customer/notifications') && method === 'GET') {
          state.preferenceReads += 1
          return json(state.preferences)
        }
        if (path.endsWith('/customer/notifications') && method === 'POST') {
          const body = request.postDataJSON() as UpdateNotificationPreferencesBody
          const response = await new Promise<{ body: unknown; status: number }>(resolve => {
            let settled = false
            state.preferenceSaves.push({ body, reply: (status = 200) => {
              if (settled) return
              settled = true
              if (status === 200) {
                for (const [key, [group, channel]] of Object.entries(preferencePaths)) {
                  const value = body[key as keyof UpdateNotificationPreferencesBody]
                  if (value !== undefined) state.preferences[group][channel] = value
                }
              }
              resolve({ body: status === 200 ? state.preferences : { message: 'Controlled preference fixture failure' }, status })
            } })
          })
          return json(response.body, response.status)
        }
        if (path.endsWith('/notifications/unread-count') && method === 'GET') return json({ data: { count: 0 } })
        if (path.endsWith('/notifications/inbox') && method === 'GET') return json({ data: { notifications: [{ id: 55, title: 'Fixture notice', body: 'Read-only fixture notification', createdAt: '2026-10-25T10:00:00Z', read: true, data: null }], unreadCount: 0, hasMore: false, nextCursor: null } })
        if (path.endsWith('/support/tickets') && method === 'GET') {
          state.support.listReads += 1
          if (state.support.listFailures > 0) {
            state.support.listFailures -= 1
            return json({ message: 'Controlled ticket list failure' }, 503)
          }
          return json({ data: state.support.tickets })
        }
        const ticketMatch = path.match(/\/support\/tickets\/(\d+)$/)
        if (ticketMatch && method === 'GET') {
          const id = Number(ticketMatch[1])
          state.support.detailReads.push(id)
          if (state.support.detailFailures > 0) {
            state.support.detailFailures -= 1
            return json({ message: 'Controlled ticket detail failure' }, 503)
          }
          const ticket = state.support.tickets.find(entry => entry.id === id)
          if (!ticket) return json({ message: 'SUPPORT.E03' }, 404)
          ticket.seen = true
          ticket.hasUnread = false
          return json({ data: ticket })
        }
        const closeMatch = path.match(/\/support\/tickets\/(\d+)\/close$/)
        if (closeMatch && method === 'PUT') {
          const id = Number(closeMatch[1])
          const ticket = state.support.tickets.find(entry => entry.id === id)
          if (!ticket) return json({ message: 'SUPPORT.E03' }, 404)
          const response = await new Promise<{ body: unknown; status: number }>(resolve => {
            let settled = false
            state.support.closes.push({ id, reply: (status = 200) => {
              if (settled) return
              settled = true
              if (status === 200) ticket.status = 'CLOSED'
              resolve({ body: status === 200 ? { data: ticket } : { message: 'Controlled ticket close failure' }, status })
            } })
          })
          return json(response.body, response.status)
        }
        if (path.endsWith('/customer/profile/edit') && method === 'POST') {
          const body = request.postDataJSON() as UpdateProfileBody
          const response = await new Promise<{ body: unknown; status: number }>(resolve => {
            let settled = false
            state.saves.push({ body, reply: (status = 200) => {
              if (settled) return
              settled = true
              if (status === 200) profile = { ...profile, ...body }
              resolve({ body: status === 200 ? { ...profile } : { message: 'Controlled fixture failure' }, status })
            } })
          })
          return json(response.body, response.status)
        }
        unexpected.push(`${method} ${path}`)
        return json({ message: 'Unexpected fixture endpoint blocked' }, 404)
      }
      // Next dev resolves stack frames with a diagnostic POST, not an app write.
      if (url.origin === origin && path === '/__nextjs_original-stack-frames' && method === 'POST') return route.continue()
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        unexpected.push(`${method} ${path}`)
        return route.fulfill({ status: 403, body: 'Real mutations are blocked' })
      }
      if (url.origin !== origin) return route.abort('blockedbyclient')
      if (request.headers()['next-router-prefetch'] || request.headers()['purpose'] === 'prefetch') return route.abort('blockedbyclient')
      return route.continue()
    })
    try { await run(state) }
    finally {
      for (const logout of state.logouts) logout.reply()
      for (const save of state.saves) save.reply(503)
      for (const save of state.preferenceSaves) save.reply(503)
      for (const close of state.support.closes) close.reply(503)
      expect(unexpected, 'All application requests must be handled by the fixture').toEqual([])
    }
  },
})

function fieldRow(page: Page, label: string) {
  // The field label is inside the value column; its parent row owns the actions.
  // Keep the row stable when the date editor adds its own button in that column.
  return page.getByText(label, { exact: true }).locator('..').locator('..')
}
async function openField(page: Page, label: string, edit: string) {
  const row = fieldRow(page, label)
  await row.getByRole('button', { name: edit, exact: true }).click()
  return row
}
async function pending(account: AccountFixture, count: number) {
  await expect.poll(() => account.saves.length).toBe(count)
  return account.saves[count - 1]
}
async function expectFocusInside(panel: Locator) {
  await expect.poll(() => panel.evaluate(el => el.contains(document.activeElement))).toBe(true)
}

async function expectInputBorder(field: Locator, token: string) {
  await expect.poll(async () => field.evaluate((element, value) => {
    const reference = document.createElement('span')
    reference.style.color = value
    document.body.appendChild(reference)
    const expected = getComputedStyle(reference).color
    reference.remove()
    return getComputedStyle(element).borderTopColor === expected
  }, token)).toBe(true)
}

async function openSupport(page: Page, locale: keyof typeof supportCopy) {
  await page.goto(`${locale === 'ro' ? '/ro' : ''}/account`)
  await page.getByRole('button', { name: supportCopy[locale].section, exact: true }).click()
}

function ticketRow(page: Page, id: number) {
  return page.getByRole('button').filter({ hasText: new RegExp(`#${id}\\b`) })
}

function ticketRows(page: Page) {
  return page.getByRole('button').filter({ hasText: /#70[1-4]\b/ })
}

function supportFilter(page: Page, label: string) {
  return page.getByRole('button', { name: new RegExp(`^${label}(?:\\s|$)`) })
}

async function expectTicketIds(page: Page, ids: number[]) {
  await expect(ticketRows(page)).toHaveCount(ids.length)
  await expect.poll(async () => (await ticketRows(page).allTextContents()).map(text => Number(text.match(/#(\d+)/)?.[1]))).toEqual(ids)
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

async function chooseBirthMonth(calendar: Locator, locale: keyof typeof calendarCopy, year: number, month: number) {
  const labels = calendarCopy[locale]
  await calendar.getByRole('button', { name: labels.chooseMonth, exact: true }).click()
  await calendar.getByRole('button', { name: labels.chooseYear, exact: true }).click()
  const years = calendar.getByRole('group', { name: labels.chooseYear, exact: true })
  for (let page = 0; page < 12 && await years.getByRole('button', { name: String(year), exact: true }).count() === 0; page += 1) {
    const firstYear = Number(await years.getByRole('button').first().innerText())
    await calendar.getByRole('button', { name: year < firstYear ? labels.previousYears : labels.nextYears, exact: true }).click()
  }
  const yearChoice = years.getByRole('button', { name: String(year), exact: true })
  await yearChoice.focus()
  await yearChoice.press('Enter')
  await expect(calendar.getByRole('button', { name: labels.chooseYear, exact: true })).toBeFocused()
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1))
  const monthChoice = calendar.getByRole('group', { name: labels.chooseMonth, exact: true }).getByRole('button', { name: monthName, exact: true })
  await monthChoice.focus()
  await monthChoice.press('Enter')
  await expect(calendar.getByRole('button', { name: labels.chooseMonth, exact: true })).toBeFocused()
}

for (const locale of ['en', 'ro'] as const) {
  const t = copy[locale]
  const prefix = locale === 'ro' ? '/ro' : ''
  test.describe(`${locale} account UI`, () => {
    test.beforeEach(async ({ page, account }) => {
      void account
      await page.goto(`${prefix}/account`)
      await expect(page.getByText('Originalfirst', { exact: true })).toBeVisible()
    })

    for (const width of [1440, 360]) {
      test(`account logout at ${width}px leaves for home without painting the signed-out gate while cleanup is pending`, async ({ page, account }, testInfo) => {
        const labels = logoutCopy[locale]
        const homePath = prefix || '/'
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 740 })
        await page.goto(`${prefix}/account`)
        await expect(page.getByRole('heading', { name: 'Originalfirst Originallast', exact: true })).toBeVisible()
        let releaseHome!: () => void
        const homePayload = new Promise<void>(resolve => { releaseHome = resolve })
        let homeRequested = false
        const holdHome: Parameters<Page['route']>[1] = async route => {
          const url = new URL(route.request().url())
          if (url.pathname === homePath && (url.searchParams.has('_rsc') || route.request().headers().rsc === '1')) {
            homeRequested = true
            await homePayload
          }
          return route.fallback()
        }
        await page.route('**/*', holdHome)
        await page.evaluate(gateTitle => {
          const state = window as Window & { __logoutGateSeen?: boolean; __logoutGateObserver?: MutationObserver }
          state.__logoutGateSeen = false
          const recordGate = () => {
            if ([...document.querySelectorAll('h1')].some(heading => heading.textContent?.trim() === gateTitle)) state.__logoutGateSeen = true
          }
          state.__logoutGateObserver = new MutationObserver(recordGate)
          state.__logoutGateObserver.observe(document.body, { childList: true, subtree: true, characterData: true })
          recordGate()
        }, labels.gateTitle)
        const logoutCount = account.logouts.length
        try {
          await page.getByRole('button', { name: labels.action, exact: true }).click()
          await expect.poll(() => account.logouts.length).toBe(logoutCount + 1)
          await expect.poll(() => homeRequested).toBe(true)
          await expect(page.getByRole('heading', { name: labels.gateTitle, exact: true })).toHaveCount(0)
          const departure = page.locator('div[aria-busy="true"]').filter({ has: page.getByText(labels.pending, { exact: true }) })
          await expect(departure).toBeVisible()
          await expect(page.getByText(labels.pending, { exact: true })).toHaveClass('sr-only')
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
          const spinner = await departure.locator('.zv-spin').boundingBox()
          const header = await page.locator('header').boundingBox()
          expect(spinner).not.toBeNull()
          expect(spinner!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
          expect(spinner!.y + spinner!.height).toBeLessThanOrEqual(width === 1440 ? 900 : 740)
          await page.screenshot({ path: testInfo.outputPath(`logout-${locale}-${width}-route-pending.png`), caret: 'initial' })
          releaseHome()
          await expect.poll(() => new URL(page.url()).pathname).toBe(homePath)
          await expect(page.locator('main h1').first()).toBeVisible()
          expect(await page.evaluate(() => (window as Window & { __logoutGateSeen?: boolean }).__logoutGateSeen)).toBe(false)
          expect(account.logouts.length).toBe(logoutCount + 1)
          account.logouts[logoutCount].reply()
          await expectNoHorizontalOverflow(page)
        } finally {
          releaseHome()
          await page.unroute('**/*', holdHome)
          await page.evaluate(() => (window as Window & { __logoutGateObserver?: MutationObserver }).__logoutGateObserver?.disconnect())
        }
        expect(account.saves).toEqual([])
        expect(account.preferenceSaves).toEqual([])
        expect(account.support.closes).toEqual([])
      })
    }

    test('direct guests keep the account gate', async ({ page, account }) => {
      const labels = logoutCopy[locale]
      const gate = page.getByRole('heading', { name: labels.gateTitle, exact: true })
      account.authenticated = false
      await page.goto(`${prefix}/account`)
      await expect(gate).toBeVisible()
      await expect(page.getByText(labels.gateBody, { exact: true })).toBeVisible()
      expect(account.logouts).toEqual([])
    })

    for (const route of ['account', 'pricing']) {
      test(`header logout preserves the current ${route} route`, async ({ page, account }) => {
        const labels = logoutCopy[locale]
        const gate = page.getByRole('heading', { name: labels.gateTitle, exact: true })
        const path = `${prefix}/${route}`
        await page.goto(path)
        const accountTrigger = page.locator('header').getByRole('button', { name: t.account, exact: true })
        await accountTrigger.click()
        const menu = page.getByRole('dialog', { name: t.account, exact: true })
        const logoutCount = account.logouts.length
        await menu.getByRole('button', { name: labels.action, exact: true }).click()
        await expect.poll(() => account.logouts.length).toBe(logoutCount + 1)
        if (path.endsWith('/account')) await expect(gate).toBeVisible()
        else await expect(gate).toHaveCount(0)
        expect(new URL(page.url()).pathname).toBe(path)
        account.logouts[logoutCount].reply()
        await expect(page.getByText(labels.settled, { exact: true })).toBeVisible()
        expect(new URL(page.url()).pathname).toBe(path)
      })
    }

    test('account sections keep a consistent frame across desktop, tablet and phone', async ({ page, account }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      const labels = settingsCopy[locale]
      const measurements: unknown[] = []
      for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 360, height: 740 }]) {
        const frames: { section: string; width: number; height: number; footerY: number }[] = []
        await page.setViewportSize(viewport)
        await page.goto(`${prefix}/account`)
        await expect(page.getByRole('heading', { name: 'Originalfirst Originallast', exact: true })).toBeVisible()
        for (const [index, section] of ['personal', 'preferences', 'security', 'support'].entries()) {
          if (viewport.width === 360 && index > 0) await page.getByRole('button', { name: locale === 'ro' ? 'Înapoi' : 'Back', exact: true }).click()
          const navName = section === 'support' ? supportCopy[locale].section : labels[section as 'personal' | 'preferences' | 'security']
          if (viewport.width === 360 || index > 0) await page.getByRole('button', { name: navName, exact: true }).click()
          if (section === 'personal') await expect(page.getByText(t.first, { exact: true })).toBeVisible()
          if (section === 'preferences') await expect(page.getByRole('switch')).toHaveCount(6)
          if (section === 'security') await expect(page.getByText('Google', { exact: true }).first()).toBeVisible()
          if (section === 'support') await expectTicketIds(page, [701, 702, 703, 704])
          const heading = page.getByRole('heading', { level: 1 })
          await heading.evaluate(async element => {
            const scope = element.closest('[data-section], .zw-acct-in') ?? element.parentElement!
            await Promise.all(scope.getAnimations({ subtree: true }).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))
          })
          const geometry = await heading.evaluate((element, context) => {
            const outer = element.closest('[data-section], .zw-acct-in') ?? element.parentElement!
            const inner = outer.querySelector('[class*="__settingsSection"], [class*="__notifications"], [class*="__support"]') ?? outer
            const rect = (node: Element) => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y + window.scrollY, width: box.width, height: box.height } }
            const footer = document.querySelector('footer')!
            return { ...context, scrollYAfterNavigation: window.scrollY, outer: rect(outer), inner: rect(inner), heading: rect(element), footerY: rect(footer).y, documentHeight: document.documentElement.scrollHeight }
          }, { locale, section, viewport })
          measurements.push(geometry)
          frames.push({ section, width: geometry.outer.width, height: geometry.outer.height, footerY: geometry.footerY })
          await expectNoHorizontalOverflow(page)
          if (viewport.width > 900 && index > 0) expect(Math.abs(geometry.scrollYAfterNavigation - 220)).toBeLessThanOrEqual(1)
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
          await page.screenshot({ path: testInfo.outputPath(`section-${section}-${locale}-${viewport.width}.png`) })
          await page.evaluate(() => window.scrollTo({ top: 220, behavior: 'instant' }))
        }
        expect(Math.max(...frames.map(frame => frame.width)) - Math.min(...frames.map(frame => frame.width))).toBeLessThanOrEqual(1)
        const shortSections = viewport.width > 900 ? frames : frames.filter(frame => frame.section !== 'support')
        expect(Math.max(...shortSections.map(frame => frame.height)) - Math.min(...shortSections.map(frame => frame.height))).toBeLessThanOrEqual(1)
        expect(Math.max(...shortSections.map(frame => frame.footerY)) - Math.min(...shortSections.map(frame => frame.footerY))).toBeLessThanOrEqual(1)
      }
      await testInfo.attach('account-section-geometry.json', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' })
      expect(account.saves).toEqual([])
      expect(account.preferenceSaves).toEqual([])
      expect(account.support.detailReads).toEqual([])
      expect(account.support.closes).toEqual([])
    })

    test('normal-motion email, password and date controls close safely and reopen with the existing draft behavior', async ({ page, account }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      const labels = settingsCopy[locale]
      for (const width of [1440, 360]) {
        await page.setViewportSize({ width, height: width === 360 ? 740 : 900 })
        await page.goto(`${prefix}/account`)
        await expect(page.getByRole('heading', { name: 'Originalfirst Originallast', exact: true })).toBeVisible()
        if (width === 360) await page.getByRole('button', { name: labels.personal, exact: true }).click()
        const emailLabel = locale === 'ro' ? 'Adresă de email' : 'Email address'
        await openField(page, emailLabel, t.edit)
        const currentEmail = page.locator('#change-email-current')
        const nextEmail = page.locator('#change-email-next')
        await currentEmail.fill('account-ui@example.invalid')
        await nextEmail.fill('discarded-email@example.invalid')
        await page.getByRole('button', { name: t.cancel, exact: true }).click()
        expect(await nextEmail.evaluateAll(fields => fields.every(field => Boolean(field.closest('[inert][aria-hidden="true"]'))))).toBe(true)
        await expect(nextEmail).toBeHidden()
        await openField(page, emailLabel, t.edit)
        await expect(currentEmail).toHaveValue('')
        await expect(nextEmail).toHaveValue('')
        await page.getByRole('button', { name: t.cancel, exact: true }).click()
        await expect(nextEmail).toBeHidden()
        if (width === 360) await page.getByRole('button', { name: locale === 'ro' ? 'Înapoi' : 'Back', exact: true }).click()
        await page.getByRole('button', { name: labels.security, exact: true }).click()
        const passwordTrigger = page.getByRole('button').filter({ has: page.getByText(labels.password, { exact: true }) })
        await passwordTrigger.click()
        const currentPassword = page.locator('#password-current')
        await currentPassword.fill('fixture-only-draft-not-submitted')
        await passwordTrigger.click()
        await expect(passwordTrigger).toHaveAttribute('aria-expanded', 'false')
        expect(await currentPassword.evaluateAll(fields => fields.every(field => Boolean(field.closest('[inert][aria-hidden="true"]'))))).toBe(true)
        await expect(currentPassword).toBeHidden()
        await passwordTrigger.click()
        await expect(currentPassword).toHaveValue('')
        await passwordTrigger.click()
        await expect(currentPassword).toBeHidden()
        if (width === 360) await page.getByRole('button', { name: locale === 'ro' ? 'Înapoi' : 'Back', exact: true }).click()
        await page.getByRole('button', { name: labels.personal, exact: true }).click()
        const dateRow = await openField(page, t.dob, t.edit)
        const dateTrigger = dateRow.getByRole('button', { name: t.dob, exact: true })
        await dateTrigger.click()
        const calendar = dateRow.getByRole('dialog')
        await expect(calendar).toBeVisible()
        const calendarBox = await calendar.boundingBox()
        expect(calendarBox).not.toBeNull()
        expect(calendarBox!.x).toBeGreaterThanOrEqual(0)
        expect(calendarBox!.x + calendarBox!.width).toBeLessThanOrEqual(width)
        const today = await page.evaluate(() => { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() } })
        await chooseBirthMonth(calendar, locale, today.year, today.month)
        await calendar.getByRole('button', { name: calendarCopy[locale].nextMonth, exact: true }).click()
        await expect(calendar.getByRole('button', { name: '1', exact: true })).toBeDisabled()
        await chooseBirthMonth(calendar, locale, 1994, 2)
        await calendar.getByRole('button', { name: '16', exact: true }).click()
        await expect(calendar).toBeHidden()
        await expect(dateTrigger).toHaveAccessibleDescription(/16.*1994/)
        await dateTrigger.click()
        await expect(calendar).toBeVisible()
        await expect(calendar.getByRole('button', { name: '16', exact: true })).toBeEnabled()
        await page.keyboard.press('Escape')
        await expect(calendar).toBeHidden()
        await dateRow.getByRole('button', { name: t.cancel, exact: true }).click()
        await expectNoHorizontalOverflow(page)
      }
      expect(account.saves).toEqual([])
      expect(account.preferenceSaves).toEqual([])
      expect(account.support.detailReads).toEqual([])
      expect(account.support.closes).toEqual([])
    })

    test('birth-date month and year choices stay readable and usable without native dropdowns', async ({ page, account }, testInfo) => {
      const labels = calendarCopy[locale]
      let measurement = 0
      for (const width of [1440, 360, 320]) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 740 })
        await page.goto(`${prefix}/account`)
        await expect(page.getByRole('heading', { name: 'Originalfirst Originallast', exact: true })).toBeVisible()
        if (width < 768) await page.getByRole('button', { name: settingsCopy[locale].personal, exact: true }).click()
        const row = await openField(page, t.dob, t.edit)
        const trigger = row.getByRole('button', { name: t.dob, exact: true })
        await trigger.click()
        const calendar = row.getByRole('dialog')
        await expect(calendar).toBeVisible()
        await expect(calendar.getByRole('combobox')).toHaveCount(0)
        const checkFit = async () => {
          const box = await calendar.boundingBox()
          expect(box).not.toBeNull()
          await testInfo.attach(`birth-calendar-${locale}-${width}-${measurement++}.json`, { body: JSON.stringify({ width, viewportHeight: width === 1440 ? 900 : 740, trigger: await trigger.boundingBox(), calendar: box }), contentType: 'application/json' })
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(width)
          expect(box!.y).toBeGreaterThanOrEqual(0)
          expect(box!.y + box!.height).toBeLessThanOrEqual(width === 1440 ? 900 : 740)
          expect(await calendar.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
          await expectNoHorizontalOverflow(page)
        }
        await checkFit()
        await calendar.getByRole('button', { name: labels.chooseMonth, exact: true }).click()
        const months = calendar.getByRole('group', { name: labels.chooseMonth, exact: true })
        await expect(months.getByRole('button')).toHaveCount(12)
        await expect.poll(() => months.getByRole('button').evaluateAll(buttons => buttons.map(button => {
          const text = document.createRange()
          text.selectNodeContents(button)
          return text.getClientRects().length
        }))).toEqual(Array(12).fill(1))
        await checkFit()
        await calendar.screenshot({ path: testInfo.outputPath(`birth-date-${locale}-${width}-months.png`) })
        await calendar.getByRole('button', { name: labels.chooseYear, exact: true }).click()
        const years = calendar.getByRole('group', { name: labels.chooseYear, exact: true })
        await expect(years.getByRole('button')).toHaveCount(12)
        await checkFit()
        await calendar.screenshot({ path: testInfo.outputPath(`birth-date-${locale}-${width}-years.png`) })
        if (width === 1440) {
          const currentYear = await page.evaluate(() => new Date().getFullYear())
          const previousYears = calendar.getByRole('button', { name: labels.previousYears, exact: true })
          for (let index = 0; index < 12 && await previousYears.isEnabled(); index += 1) await previousYears.click()
          await expect(previousYears).toBeDisabled()
          await expect(years.getByRole('button').first()).toHaveText(String(currentYear - 110))
          const nextYears = calendar.getByRole('button', { name: labels.nextYears, exact: true })
          for (let index = 0; index < 12 && await nextYears.isEnabled(); index += 1) await nextYears.click()
          await expect(nextYears).toBeDisabled()
          await expect(years.getByRole('button').last()).toHaveText(String(currentYear))
        }
        await page.keyboard.press('Escape')
        await expect(calendar).toBeHidden()
        await expect(trigger).toBeFocused()
        await trigger.click()
        await chooseBirthMonth(calendar, locale, 2000, 1)
        await expect(calendar.getByRole('button', { name: '29', exact: true })).toBeEnabled()
        await checkFit()
        await calendar.screenshot({ path: testInfo.outputPath(`birth-date-${locale}-${width}-days.png`) })
        await page.screenshot({ path: testInfo.outputPath(`birth-date-${locale}-${width}-context.png`), caret: 'initial' })
        await calendar.getByRole('button', { name: '29', exact: true }).focus()
        await calendar.getByRole('button', { name: '29', exact: true }).press('Enter')
        await expect(calendar).toBeHidden()
        await expect(trigger).toBeFocused()
        await expect(trigger).toHaveAccessibleDescription(/29.*2000/)
        await row.getByRole('button', { name: t.cancel, exact: true }).click()
        await openField(page, t.dob, t.edit)
        await expect(row.getByRole('button', { name: t.dob, exact: true })).toHaveAccessibleDescription(/15.*1994/)
        await row.getByRole('button', { name: t.cancel, exact: true }).click()
      }
      expect(account.saves).toEqual([])
      expect(account.preferenceSaves).toEqual([])
      expect(account.support.detailReads).toEqual([])
      expect(account.support.closes).toEqual([])
    })

    for (const width of [1440, 360]) {
      test(`settings at ${width}px keep personal editors, preference controls and security details readable`, async ({ page, account }, testInfo) => {
        const labels = settingsCopy[locale]
        await page.setViewportSize({ width, height: width === 360 ? 740 : 900 })
        if (width === 360) await page.getByRole('button', { name: labels.personal, exact: true }).click()
        const row = await openField(page, t.first, t.edit)
        await page.locator('#acct-firstName').fill('Alexandru')
        await expect(page.locator('#acct-firstName')).toHaveAccessibleName(t.first)
        await expect(row.getByRole('button', { name: t.cancel, exact: true })).toBeVisible()
        await expectNoHorizontalOverflow(page)
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: testInfo.outputPath(`personal-edit-${locale}-${width}.png`), caret: 'initial' })
        await expect(page.locator('#acct-firstName')).toHaveValue('Alexandru')
        await row.getByRole('button', { name: t.cancel, exact: true }).click()
        expect(account.preferenceReads).toBe(0)
        if (width === 360) await page.getByRole('button', { name: locale === 'ro' ? 'Înapoi' : 'Back', exact: true }).click()
        await page.getByRole('button', { name: labels.preferences, exact: true }).click()
        await expect(page.getByRole('switch')).toHaveCount(6)
        await expect(page.getByRole('switch', { name: `${labels.marketing} — ${labels.push}`, exact: true })).toHaveAttribute('aria-checked', 'false')
        await expectNoHorizontalOverflow(page)
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: testInfo.outputPath(`preferences-${locale}-${width}.png`), fullPage: true })
        if (width === 360) await page.getByRole('button', { name: locale === 'ro' ? 'Înapoi' : 'Back', exact: true }).click()
        await page.getByRole('button', { name: labels.security, exact: true }).click()
        await expect(page.getByText('Google', { exact: true }).first()).toBeVisible()
        await expectNoHorizontalOverflow(page)
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: testInfo.outputPath(`security-${locale}-${width}.png`), fullPage: true })
        await page.getByRole('button').filter({ has: page.getByText(labels.password, { exact: true }) }).click()
        await expect(page.locator('#password-current')).toHaveAccessibleName(labels.currentPassword)
        await expectNoHorizontalOverflow(page)
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.screenshot({ path: testInfo.outputPath(`security-password-${locale}-${width}.png`), fullPage: true })
        expect(account.saves).toEqual([])
        expect(account.preferenceSaves).toEqual([])
        expect(account.support.closes).toEqual([])
      })
    }

    test('preference toggles preserve channel payloads, busy locks and rollback after failure', async ({ page, account }) => {
      const labels = settingsCopy[locale]
      await page.getByRole('button', { name: labels.preferences, exact: true }).click()
      const marketingPush = page.getByRole('switch', { name: `${labels.marketing} — ${labels.push}`, exact: true })
      const reminderSms = page.getByRole('switch', { name: `${labels.reminders} — ${labels.sms}`, exact: true })
      await expect(marketingPush).toHaveAttribute('aria-checked', 'false')
      await marketingPush.click()
      await expect.poll(() => account.preferenceSaves.length).toBe(1)
      expect(account.preferenceSaves[0].body).toEqual({ marketingPush: true })
      await expect(marketingPush).toHaveAttribute('aria-checked', 'true')
      for (const control of await page.getByRole('switch').all()) await expect(control).toBeDisabled()
      account.preferenceSaves[0].reply(503)
      await expect(page.getByText(t.error, { exact: true })).toBeVisible()
      await expect(marketingPush).toHaveAttribute('aria-checked', 'false')
      await expect(marketingPush).toBeEnabled()
      await marketingPush.click()
      await expect.poll(() => account.preferenceSaves.length).toBe(2)
      expect(account.preferenceSaves[1].body).toEqual({ marketingPush: true })
      account.preferenceSaves[1].reply()
      await expect(marketingPush).toBeEnabled()
      await expect(marketingPush).toHaveAttribute('aria-checked', 'true')
      await expect(page.getByText(labels.preferencesSaved, { exact: true })).toBeVisible()
      await reminderSms.click()
      await expect.poll(() => account.preferenceSaves.length).toBe(3)
      expect(account.preferenceSaves[2].body).toEqual({ reminderSms: true })
      account.preferenceSaves[2].reply()
      await expect(reminderSms).toBeEnabled()
      await expect(reminderSms).toHaveAttribute('aria-checked', 'true')
      await expect(marketingPush).toHaveAttribute('aria-checked', 'true')
      expect(account.saves).toEqual([])
      expect(account.support.closes).toEqual([])
    })

    if (locale === 'ro') {
      test('Romanian mobile field and email editors keep actions in bounds and preserve validation focus colors', async ({ page, account }, testInfo) => {
        await page.setViewportSize({ width: 360, height: 740 })
        await page.getByRole('button', { name: settingsCopy.ro.personal, exact: true }).click()
        const nameRow = await openField(page, t.first, t.edit)
        const name = page.locator('#acct-firstName')
        await name.fill('Alexandru')
        await name.focus()
        await expectInputBorder(name, 'var(--c-ink)')
        const saveBox = await nameRow.getByRole('button', { name: t.save, exact: true }).boundingBox()
        const cancelBox = await nameRow.getByRole('button', { name: t.cancel, exact: true }).boundingBox()
        expect(saveBox).not.toBeNull()
        expect(cancelBox).not.toBeNull()
        expect(Math.abs(saveBox!.y - cancelBox!.y)).toBeLessThanOrEqual(1)
        await name.fill('')
        await expect(name).toHaveAttribute('aria-invalid', 'true')
        await expectInputBorder(name, 'var(--s-error-600)')
        await expect(nameRow.getByRole('button', { name: t.save, exact: true })).toBeDisabled()
        await nameRow.getByRole('button', { name: t.cancel, exact: true }).click()

        for (const width of [360, 320]) {
          await page.setViewportSize({ width, height: 740 })
          await openField(page, 'Adresă de email', t.edit)
          await page.locator('#change-email-current').fill('account-ui@example.invalid')
          const next = page.locator('#change-email-next')
          await next.fill('changed-email@example.invalid')
          await next.focus()
          await expectInputBorder(next, 'var(--c-ink)')
          const update = page.getByRole('button', { name: 'Actualizează emailul', exact: true })
          const cancel = page.getByRole('button', { name: t.cancel, exact: true })
          await update.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 440, behavior: 'instant' }))
          for (const action of [update, cancel]) {
            const box = await action.boundingBox()
            expect(box).not.toBeNull()
            expect(box!.x).toBeGreaterThanOrEqual(12)
            expect(box!.x + box!.width).toBeLessThanOrEqual(width - 12)
          }
          await expectNoHorizontalOverflow(page)
          await page.screenshot({ path: testInfo.outputPath(`personal-email-ro-${width}.png`), caret: 'initial' })
          await cancel.click()
          await expect(next).toBeHidden()
        }
        expect(account.saves).toEqual([])
        expect(account.preferenceSaves).toEqual([])
        expect(account.support.closes).toEqual([])
      })
    }

    for (const kind of ['name', 'address'] as const) {
      test(`failed ${kind} save preserves draft; delayed retry stays busy until success`, async ({ page, account }) => {
        const label = kind === 'name' ? t.first : t.address
        const input = page.locator(kind === 'name' ? '#acct-firstName' : '#address-city')
        const draft = kind === 'name' ? 'Draftfirst' : 'Draft City'
        const row = await openField(page, label, t.edit)
        await input.fill(draft)
        await input.press('Enter')
        ;(await pending(account, 1)).reply(503)
        await expect(page.getByText(t.error, { exact: true })).toBeVisible()
        await expect(input).toBeVisible()
        await expect(input).toHaveValue(draft)
        await expect(input).toHaveAccessibleName(kind === 'name' ? t.first : t.city)
        const save = row.getByRole('button', { name: t.save, exact: true })
        await expect(save).toBeEnabled()
        await save.click()
        const retry = await pending(account, 2)
        await expect(input).toBeVisible()
        await expect(input).toHaveValue(draft)
        await expect(input).toBeDisabled()
        await expect(save).toBeDisabled()
        await expect(save).toHaveAttribute('aria-busy', 'true')
        await expect(row.getByRole('button', { name: t.cancel, exact: true })).toBeDisabled()
        if (kind === 'address') expect(retry.body).toEqual({ addressCountry: 'Romania', addressCity: draft, addressStreet: 'Original Street', addressNumber: '1', addressMentions: '' })
        else expect(retry.body).toEqual({ firstName: draft })
        retry.reply()
        await expect(input).toBeHidden()
        await expect(page.getByText(t.success, { exact: true })).toBeVisible()
        await openField(page, label, t.edit)
        await expect(input).toHaveValue(draft)
      })
    }

    test('overlapping profile writes are blocked without losing another open draft', async ({ page, account }) => {
      const firstRow = await openField(page, t.first, t.edit)
      const lastRow = await openField(page, t.last, t.edit)
      const first = page.locator('#acct-firstName')
      const last = page.locator('#acct-lastName')
      await first.fill('Savedfirst')
      await last.fill('Draftlast')
      await first.press('Enter')
      const firstRequest = await pending(account, 1)
      await expect(firstRow.getByRole('button', { name: t.save, exact: true })).toHaveAttribute('aria-busy', 'true')
      await expect(lastRow.getByRole('button', { name: t.save, exact: true })).toBeDisabled()
      await expect(last).toBeEditable()
      await last.press('Enter')
      await last.press('Enter')
      await last.fill('Keptlast')
      await expect(lastRow.getByRole('button', { name: t.cancel, exact: true })).toBeEnabled()
      expect(account.saves).toHaveLength(1)
      firstRequest.reply()
      await expect(first).toBeHidden()
      await expect(last).toHaveValue('Keptlast')
      await lastRow.getByRole('button', { name: t.save, exact: true }).click()
      const secondRequest = await pending(account, 2)
      expect(secondRequest.body).toEqual({ lastName: 'Keptlast' })
      secondRequest.reply()
      await expect(last).toBeHidden()
      await expect(page.getByText('Savedfirst', { exact: true })).toBeVisible()
      await expect(page.getByText('Keptlast', { exact: true })).toBeVisible()
    })

    test('Cancel and Escape discard drafts; existing name and phone normalization survives', async ({ page, account }) => {
      const firstRow = await openField(page, t.first, t.edit)
      const first = page.locator('#acct-firstName')
      await first.fill('Discardme')
      await firstRow.getByRole('button', { name: t.cancel, exact: true }).click()
      await openField(page, t.first, t.edit)
      await expect(first).toHaveValue('Originalfirst')
      await first.fill('   Trimmedfirst   ')
      await first.press('Enter')
      const nameRequest = await pending(account, 1)
      expect(nameRequest.body).toEqual({ firstName: 'Trimmedfirst' })
      nameRequest.reply()
      await expect(first).toBeHidden()
      await openField(page, t.address, t.edit)
      const city = page.locator('#address-city')
      await city.fill('Discard City')
      await city.press('Escape')
      await expect(city).toBeHidden()
      await openField(page, t.address, t.edit)
      await expect(city).toHaveValue('Original City')
      await city.press('Escape')
      await openField(page, t.phone, t.edit)
      const phone = page.locator('#acct-phone')
      await phone.fill('+40 712-345-678')
      await phone.press('Enter')
      const phoneRequest = await pending(account, 2)
      expect(phoneRequest.body).toEqual({ phone: '+40712345678' })
      phoneRequest.reply()
      await expect(phone).toBeHidden()
      await openField(page, t.phone, t.edit)
      await phone.fill('')
      await phone.press('Enter')
      const clearRequest = await pending(account, 3)
      expect(clearRequest.body).toEqual({ phone: '' })
      clearRequest.reply()
      await expect(phone).toBeHidden()
    })

    test('visible editable field labels name controls; pending date saves preserve the selected date', async ({ page, account }, testInfo) => {
      await page.screenshot({ path: testInfo.outputPath(`personal-info-${locale}-desktop.png`), fullPage: true })
      for (const [label, id] of [[t.first, 'acct-firstName'], [t.last, 'acct-lastName'], [t.phone, 'acct-phone']] as const) {
        await openField(page, label, t.edit)
        await expect(page.locator(`#${id}`)).toHaveAccessibleName(label)
        await page.locator(`#${id}`).press('Escape')
      }
      const dateRow = await openField(page, t.dob, t.edit)
      const date = dateRow.getByRole('button', { name: t.dob, exact: true })
      await expect(date).toBeVisible()
      await expect(date).toContainText('1994')
      await expect(date).toHaveAccessibleDescription(/15.*1994/)
      await date.click()
      const calendar = dateRow.getByRole('dialog')
      await expect(calendar).toBeVisible()
      await dateRow.getByRole('button', { name: t.save, exact: true }).focus()
      await page.keyboard.press('Enter')
      const request = await pending(account, 1)
      expect(request.body).toEqual({ dateOfBirth: '1994-03-15' })
      await expect(calendar).toBeHidden()
      await expect(date).toBeDisabled()
      request.reply(503)
      await expect(page.getByText(t.error, { exact: true })).toBeVisible()
      await expect(date).toBeEnabled()
      await expect(date).toHaveAccessibleDescription(/15.*1994/)
      await dateRow.getByRole('button', { name: t.cancel, exact: true }).click()
    })

    for (const label of [t.account, t.notifications]) {
      test(`${label} keyboard opening, Escape, and nonmodal Tab boundaries manage focus`, async ({ page }) => {
        const trigger = page.locator('header').getByRole('button', { name: label, exact: true })
        const panel = page.getByRole('dialog', { name: label, exact: true })
        await trigger.focus()
        await page.keyboard.press('Enter')
        await expect(panel).toBeVisible()
        await expectFocusInside(panel)
        await expect(trigger).toHaveAttribute('aria-expanded', 'true')
        expect(await trigger.getAttribute('aria-controls')).toBe(await panel.getAttribute('id'))
        await page.keyboard.press('Escape')
        await expect(panel).toBeHidden()
        await expect(trigger).toBeFocused()
        for (const key of ['Shift+Tab', 'Tab']) {
          await trigger.focus()
          await page.keyboard.press(key)
          const adjacent = await page.evaluateHandle(() => document.activeElement)
          await trigger.focus()
          await page.keyboard.press('Enter')
          await expect(panel).toBeVisible()
          await expectFocusInside(panel)
          const controls = panel.locator('a[href], button:not([disabled])').filter({ visible: true })
          if (label === t.notifications) await expect(panel.getByRole('button', { name: /Fixture notice/ })).toBeVisible()
          await (key === 'Tab' ? controls.last() : controls.first()).focus()
          await page.keyboard.press(key)
          await expect(panel).toBeHidden()
          await expect.poll(() => adjacent.evaluate(el => el === document.activeElement)).toBe(true)
          await adjacent.dispose()
        }
      })
    }

    test('outside pointer and navigation dismiss account popover without restoring opener focus', async ({ page }) => {
      const trigger = page.locator('header').getByRole('button', { name: t.account, exact: true })
      const panel = page.getByRole('dialog', { name: t.account, exact: true })
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(panel).toBeVisible()
      await panel.getByRole('link').first().focus()
      await page.mouse.click(30, 500)
      await expect(panel).toBeHidden()
      await expect(trigger).not.toBeFocused()
      await trigger.focus()
      await page.keyboard.press('Enter')
      const pricing = panel.locator(`a[href="${prefix}/pricing"]`)
      await pricing.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp(`${prefix}/pricing$`))
      await expect(panel).toBeHidden()
      await expect(page.locator('header').getByRole('button', { name: t.account, exact: true })).not.toBeFocused()
    })
  })
}

for (const locale of ['en', 'ro'] as const) {
  const t = supportCopy[locale]
  test.describe(`${locale} account support UI`, () => {
    test('one ticket list preserves order and filters all three active statuses without new requests', async ({ page, account }, testInfo) => {
      await openSupport(page, locale)
      await expectTicketIds(page, [701, 702, 703, 704])
      for (const ticket of account.support.tickets) {
        await expect(page.getByText(ticket.details.history[0].message, { exact: true })).toHaveCount(1)
      }
      await expect(page.getByRole('button', { name: t.newTicket, exact: true })).toHaveCount(1)
      await expect(page.getByLabel(t.unread, { exact: true })).toHaveCount(1)
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-1440.png`), fullPage: true })
      if (locale === 'ro') {
        await page.setViewportSize({ width: 1024, height: 800 })
        await expectNoHorizontalOverflow(page)
        await page.screenshot({ path: testInfo.outputPath('support-ro-1024.png'), fullPage: true })
      }
      await supportFilter(page, t.active).click()
      await expectTicketIds(page, [701, 702, 703])
      await supportFilter(page, t.closed).click()
      await expectTicketIds(page, [704])
      await supportFilter(page, t.all).click()
      await expectTicketIds(page, [701, 702, 703, 704])
      expect(account.support.listReads).toBe(1)
      expect(account.support.detailReads).toEqual([])
      expect(account.support.closes).toEqual([])
      expect(account.saves).toEqual([])
    })

    for (const width of [1440, 360]) {
      test(`contact modal at ${width}px preserves the conversation, traps focus and restores navigation after dismissal`, async ({ page, account }, testInfo) => {
        await page.setViewportSize({ width, height: width === 360 ? 600 : 900 })
        await openSupport(page, locale)
        await ticketRow(page, 701).click()
        const reply = page.getByRole('textbox', { name: t.reply, exact: true })
        await reply.fill('Keep this existing conversation draft while opening support.')
        const opener = page.getByRole('button', { name: t.newTicket, exact: true, includeHidden: true })
        const dialog = page.getByRole('dialog', { name: t.modalTitle, exact: true })
        const backgroundRows = page.getByRole('button', { includeHidden: true }).filter({ hasText: /#70[1-4]\b/ })

        for (const dismissal of ['escape', 'cancel', 'close', 'overlay'] as const) {
          await opener.click()
          await expect(dialog).toBeVisible()
          await expectFocusInside(dialog)
          await expect(backgroundRows).toHaveCount(4)
          await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden')
          const field = dialog.getByRole('textbox', { name: t.messageLabel, exact: true })
          await field.fill('A draft inside the contact dialog.')
          const controls = dialog.locator('button:not([disabled]), textarea:not([disabled])').filter({ visible: true })
          await controls.last().focus()
          await page.keyboard.press('Tab')
          await expect(controls.first()).toBeFocused()
          await page.keyboard.press('Shift+Tab')
          await expect(controls.last()).toBeFocused()
          if (dismissal === 'escape') {
            await page.screenshot({ path: testInfo.outputPath(`support-${locale}-contact-modal-${width}.png`) })
            if (width === 360) {
              await page.setViewportSize({ width: 320, height: 600 })
              const surface = await dialog.boundingBox()
              const cancel = await dialog.getByRole('button', { name: copy[locale].cancel, exact: true }).boundingBox()
              const submit = await dialog.getByRole('button', { name: locale === 'ro' ? 'Trimite tichetul' : 'Submit ticket', exact: true }).boundingBox()
              expect(surface).not.toBeNull()
              expect(cancel).not.toBeNull()
              expect(submit).not.toBeNull()
              expect(cancel!.x).toBeGreaterThanOrEqual(surface!.x + 10)
              expect(submit!.x + submit!.width).toBeLessThanOrEqual(surface!.x + surface!.width - 10)
              expect(Math.abs(cancel!.y - submit!.y)).toBeLessThanOrEqual(1)
              await expectNoHorizontalOverflow(page)
              await page.screenshot({ path: testInfo.outputPath(`support-${locale}-contact-modal-320.png`) })
              await page.setViewportSize({ width: 360, height: 600 })
            }
            const beforeWheel = await page.evaluate(() => window.scrollY)
            await page.mouse.move(10, 200)
            await page.mouse.wheel(0, 500)
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
            expect(await page.evaluate(() => window.scrollY)).toBe(beforeWheel)
            await page.keyboard.press('Escape')
          } else if (dismissal === 'cancel') {
            await dialog.getByRole('button', { name: copy[locale].cancel, exact: true }).click()
          } else if (dismissal === 'close') {
            await dialog.getByRole('button', { name: t.modalClose, exact: true }).click()
          } else {
            await page.mouse.click(10, 200)
          }
          await expect(dialog).toBeHidden()
          await expect(opener).toBeFocused()
          await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
          await expect(reply).toHaveValue('Keep this existing conversation draft while opening support.')
          await expect(ticketRow(page, 701)).toHaveAttribute('aria-expanded', 'true')
          await expectTicketIds(page, [701, 702, 703, 704])
          expect(account.support.detailReads).toEqual([701])
        }
        const beforeWheel = await page.evaluate(() => window.scrollY)
        await page.mouse.move(10, 200)
        await page.mouse.wheel(0, 500)
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(beforeWheel + 20)
        expect(account.support.closes).toEqual([])
        expect(account.saves).toEqual([])
      })
    }

    test('selected conversation expands below its ticket, preserves drafts and restores focus when collapsed', async ({ page, account }, testInfo) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      const original = account.support.tickets.find(ticket => ticket.id === 701)!
      original.details.history[1].message = locale === 'ro'
        ? 'Mulțumim că ne-ai scris. Verificăm trimiterea confirmării și revenim aici cu un răspuns.'
        : 'Thanks for letting us know. We are checking the confirmation delivery and will reply here with an update.'
      await openSupport(page, locale)
      await expectTicketIds(page, [701, 702, 703, 704])
      expect(account.support.detailReads).toEqual([])
      const firstRow = ticketRow(page, 701)
      await firstRow.focus()
      await page.keyboard.press('Enter')
      const heading = page.getByRole('heading', { name: t.conversation, exact: true })
      const conversation = page.getByRole('region', { name: t.conversation, exact: true })
      await expect(heading).toHaveCount(1)
      await expect(heading).toBeFocused()
      await expect(firstRow).toHaveAttribute('aria-current', 'true')
      await expect(firstRow).toHaveAttribute('aria-expanded', 'true')
      await expect(conversation).toHaveCount(1)
      await expect(firstRow.locator('xpath=ancestor::li[1]').getByRole('region', { name: t.conversation, exact: true })).toBeVisible()
      await expectTicketIds(page, [701, 702, 703, 704])
      const rowBox = await firstRow.boundingBox()
      const headingBox = await conversation.boundingBox()
      expect(rowBox).not.toBeNull()
      expect(headingBox).not.toBeNull()
      expect(headingBox!.y).toBeGreaterThanOrEqual(rowBox!.y + rowBox!.height)
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: t.newTicket, exact: true })).toBeVisible()
      const ownMessage = conversation.getByRole('article', { name: t.you, exact: true })
      const supportMessage = conversation.getByRole('article', { name: t.support, exact: true })
      await expect(ownMessage).toHaveCount(1)
      await expect(supportMessage).toHaveCount(1)
      await expect(ownMessage.getByText(original.details.history[0].message, { exact: true })).toBeVisible()
      await expect(supportMessage.getByText(original.details.history[1].message, { exact: true })).toBeVisible()
      const ownAuthorBox = await ownMessage.getByText(t.you, { exact: true }).boundingBox()
      const supportAuthorBox = await supportMessage.getByText(t.support, { exact: true }).boundingBox()
      expect(ownAuthorBox).not.toBeNull()
      expect(supportAuthorBox).not.toBeNull()
      expect(ownAuthorBox!.x).toBeGreaterThan(supportAuthorBox!.x + 20)
      expect(account.support.detailReads).toEqual([701])
      await expectNoHorizontalOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-desktop-conversation.png`), fullPage: true })

      await page.setViewportSize({ width: 1024, height: 800 })
      await expect(firstRow).toBeVisible()
      await expect(conversation).toBeVisible()
      await expectNoHorizontalOverflow(page)
      expect(account.support.detailReads).toEqual([701])
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-tablet-conversation.png`), fullPage: true })
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(firstRow).toBeVisible()
      await expect(firstRow).toHaveAttribute('aria-current', 'true')
      expect(account.support.detailReads).toEqual([701])

      const reply = page.getByRole('textbox', { name: t.reply, exact: true })
      await reply.fill('Keep the first conversation draft while reviewing another ticket.')
      const nextRow = ticketRow(page, 703)
      await nextRow.click()
      await expect(heading).toBeFocused()
      await expect(nextRow).toHaveAttribute('aria-current', 'true')
      await expect(firstRow).not.toHaveAttribute('aria-current', 'true')
      await expect(firstRow).toHaveAttribute('aria-expanded', 'false')
      await expect(conversation).toHaveCount(1)
      expect(account.support.detailReads).toEqual([701, 703])
      await expect(reply).toHaveValue('')
      await reply.fill('Keep the second conversation draft separately.')
      await firstRow.click()
      await expect(heading).toBeFocused()
      await expect(reply).toHaveValue('Keep the first conversation draft while reviewing another ticket.')
      await nextRow.click()
      await expect(heading).toBeFocused()
      await expect(reply).toHaveValue('Keep the second conversation draft separately.')
      await nextRow.click()
      await expect(nextRow).toBeFocused()
      await expect(nextRow).not.toHaveAttribute('aria-current', 'true')
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toHaveCount(0)
      expect(account.support.detailReads).toEqual([701, 703, 701, 703])
      await nextRow.click()
      await expect(reply).toHaveValue('Keep the second conversation draft separately.')
      await nextRow.click()
      await expect(nextRow).toBeFocused()
      await expect(nextRow).toHaveAttribute('aria-expanded', 'false')
      await expect(conversation).toHaveCount(0)
      expect(account.support.closes).toEqual([])
      expect(account.saves).toEqual([])
    })

    test('rapid accordion toggles keep closing content inert and expose only the current conversation', async ({ page, account }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await openSupport(page, locale)
      const firstRow = ticketRow(page, 701)
      const firstItem = firstRow.locator('xpath=ancestor::li[1]')
      const conversation = page.getByRole('region', { name: t.conversation, exact: true })
      await firstRow.click()
      await expect(conversation).toHaveCount(1)
      for (let index = 0; index < 4; index += 1) {
        await firstRow.evaluate((button: HTMLButtonElement) => button.click())
        const opened = index % 2 !== 0
        await expect(firstRow).toHaveAttribute('aria-expanded', String(opened))
        await expect(conversation).toHaveCount(opened ? 1 : 0)
        if (!opened) {
          expect(await firstItem.locator('[data-state="closed"][aria-hidden="true"]').evaluateAll(elements => elements.every(element => element.hasAttribute('inert')))).toBe(true)
        }
      }
      await ticketRow(page, 703).evaluate((button: HTMLButtonElement) => button.click())
      await expect(ticketRow(page, 703)).toHaveAttribute('aria-expanded', 'true')
      await expect(firstRow).toHaveAttribute('aria-expanded', 'false')
      await expect(conversation).toHaveCount(1)
      await expect(ticketRow(page, 703).locator('xpath=ancestor::li[1]').getByRole('region', { name: t.conversation, exact: true })).toBeVisible()
      expect(await firstItem.locator('[data-state="closed"][aria-hidden="true"]').evaluateAll(elements => elements.every(element => element.hasAttribute('inert')))).toBe(true)
      await supportFilter(page, t.closed).click()
      await expect(conversation).toHaveCount(0)
      await expectTicketIds(page, [704])
      expect(account.support.detailReads.every(id => id === 701 || id === 703)).toBe(true)
      expect(account.support.closes).toEqual([])
    })

    test('expanded history lets the page scroll when the pointer is over its last message', async ({ page, account }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.setViewportSize({ width: 1440, height: 900 })
      const fixture = account.support.tickets.find(ticket => ticket.id === 701)!
      fixture.details.history = Array.from({ length: 14 }, (_, index) => ({
        createdBy: index % 2 === 0 ? '901' : 'admin',
        message: `Scroll fixture message ${index + 1}. ${'This is a longer support message that must remain readable while scrolling the account page. '.repeat(9)}`,
      }))
      await openSupport(page, locale)
      await ticketRow(page, 701).click()
      const conversation = page.getByRole('region', { name: t.conversation, exact: true })
      const lastMessage = conversation.getByText(fixture.details.history.at(-1)!.message, { exact: true })
      const transcript = lastMessage.locator('..').locator('..')
      await expect(lastMessage).toBeVisible()
      await transcript.evaluate(element => { element.scrollTop = element.scrollHeight })
      await transcript.scrollIntoViewIfNeeded()
      const box = await transcript.boundingBox()
      expect(box).not.toBeNull()
      const viewport = page.viewportSize()!
      await page.mouse.move(box!.x + Math.min(box!.width / 2, 400), Math.max(120, Math.min(box!.y + box!.height / 2, viewport.height - 120)))
      const beforeInside = await page.evaluate(() => window.scrollY)
      await page.mouse.wheel(0, 600)
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const afterInside = await page.evaluate(() => window.scrollY)
      await page.mouse.move(40, viewport.height / 2)
      const beforeOutside = await page.evaluate(() => window.scrollY)
      await page.mouse.wheel(0, 600)
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const afterOutside = await page.evaluate(() => window.scrollY)
      const diagnostics = await transcript.evaluate((element, movement) => ({
        ...movement, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop, overflowY: getComputedStyle(element).overflowY,
        overscrollBehavior: getComputedStyle(element).overscrollBehavior,
      }), { beforeInside, afterInside, beforeOutside, afterOutside })
      await testInfo.attach('expanded-history-scroll.json', { body: JSON.stringify(diagnostics, null, 2), contentType: 'application/json' })
      expect(afterOutside - beforeOutside, JSON.stringify(diagnostics)).toBeGreaterThan(20)
      expect(afterInside - beforeInside, JSON.stringify(diagnostics)).toBeGreaterThan(20)
      expect(account.support.detailReads).toEqual([701])
      expect(account.support.closes).toEqual([])
    })

    test('list and thread failures retain recovery actions and retry the same read', async ({ page, account }) => {
      account.support.listFailures = 1
      await openSupport(page, locale)
      await expect(page.getByText(t.loadError, { exact: true })).toBeVisible()
      await expect(page.getByText(t.empty, { exact: true })).toHaveCount(0)
      await expectTicketIds(page, [])
      await page.getByRole('button', { name: t.retry, exact: true }).click()
      await expectTicketIds(page, [701, 702, 703, 704])
      await expect(page.getByText(t.loadError, { exact: true })).toHaveCount(0)
      expect(account.support.listReads).toBe(2)

      account.support.detailFailures = 1
      await ticketRow(page, 701).click()
      await expect(page.getByText(t.loadError, { exact: true })).toBeVisible()
      await expect(ticketRow(page, 701)).toBeEnabled()
      await expect(ticketRow(page, 701)).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toHaveCount(0)
      await page.getByRole('button', { name: t.retry, exact: true }).click()
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toBeVisible()
      await expect(page.getByText(t.loadError, { exact: true })).toHaveCount(0)
      expect(account.support.detailReads).toEqual([701, 701])
      await ticketRow(page, 701).click()
      await expectTicketIds(page, [701, 702, 703, 704])
      await expect(page.getByLabel(t.unread, { exact: true })).toHaveCount(0)
      expect(account.support.closes).toEqual([])
    })

    test('closing requires confirmation, preserves a failed conversation and locks a delayed retry', async ({ page, account }, testInfo) => {
      await openSupport(page, locale)
      await ticketRow(page, 701).click()
      const reply = page.getByRole('textbox', { name: t.reply, exact: true })
      await reply.fill('A reply draft remains available while closing is cancelled or fails.')
      const openClose = page.getByRole('button', { name: t.close, exact: true })
      await openClose.click()
      const dialog = page.getByRole('dialog', { name: t.closeTitle, exact: true })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: copy[locale].cancel, exact: true }).click()
      await expect(dialog).toBeHidden()
      await expect(reply).toHaveValue('A reply draft remains available while closing is cancelled or fails.')
      expect(account.support.closes).toEqual([])

      await openClose.click()
      await dialog.getByRole('button', { name: t.close, exact: true }).click()
      await expect.poll(() => account.support.closes.length).toBe(1)
      account.support.closes[0].reply(503)
      await expect(page.getByText(copy[locale].error, { exact: true })).toBeVisible()
      await expect(dialog).toBeVisible()
      await expect(reply).toHaveValue('A reply draft remains available while closing is cancelled or fails.')
      const confirm = dialog.getByRole('button', { name: t.close, exact: true })
      await expect(confirm).toBeEnabled()
      await confirm.evaluate((element: HTMLButtonElement) => { element.click(); element.click() })
      await expect.poll(() => account.support.closes.length).toBe(2)
      await expect(confirm).toBeDisabled()
      await expect(confirm).toHaveAttribute('aria-busy', 'true')
      await expect(dialog.getByRole('button', { name: copy[locale].cancel, exact: true })).toBeDisabled()
      expect(account.support.closes.map(close => close.id)).toEqual([701, 701])
      account.support.closes[1].reply()
      await expect(dialog).toBeHidden()
      await expect(reply).toHaveCount(0)
      const closedNotice = page.getByRole('region', { name: t.conversation, exact: true }).getByRole('status', { name: t.closedNotice, exact: true })
      await expect(closedNotice).toBeVisible()
      await expect(closedNotice).toContainText(t.closedNote)
      await expect(page.getByRole('button', { name: t.close, exact: true })).toHaveCount(0)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-newly-closed-desktop.png`), fullPage: true })
      await ticketRow(page, 701).click()
      await supportFilter(page, t.active).click()
      await expectTicketIds(page, [702, 703])
      await supportFilter(page, t.closed).click()
      await expectTicketIds(page, [701, 704])
    })

    test('mobile hub, filters and long conversation stay within the viewport', async ({ page, account }, testInfo) => {
      await page.setViewportSize({ width: 360, height: 740 })
      await openSupport(page, locale)
      await expectTicketIds(page, [701, 702, 703, 704])
      await expectNoHorizontalOverflow(page)
      await supportFilter(page, t.closed).click()
      await expectTicketIds(page, [704])
      await expectNoHorizontalOverflow(page)
      await ticketRow(page, 704).click()
      const closedNotice = page.getByRole('region', { name: t.conversation, exact: true }).getByRole('status', { name: t.closedNotice, exact: true })
      await expect(closedNotice).toBeVisible()
      await expect(closedNotice).toContainText(t.closedNote)
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: t.close, exact: true })).toHaveCount(0)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-already-closed-mobile.png`), fullPage: true })
      await closedNotice.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - 120, behavior: 'instant' }))
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-closed-notice-mobile-viewport.png`) })
      await ticketRow(page, 704).click()
      await supportFilter(page, t.all).click()
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-mobile-list.png`), fullPage: true })
      await ticketRow(page, 701).click()
      await expect(ticketRow(page, 701)).toBeVisible()
      await expect(ticketRow(page, 701)).toHaveAttribute('aria-expanded', 'true')
      await expectTicketIds(page, [701, 702, 703, 704])
      const reply = page.getByRole('textbox', { name: t.reply, exact: true })
      await expect(reply).toBeVisible()
      await expect(page.getByText(account.support.tickets.find(ticket => ticket.id === 701)!.details.history[1].message, { exact: true })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-mobile-thread.png`), fullPage: true })
      await ticketRow(page, 701).click()
      await expectTicketIds(page, [701, 702, 703, 704])
      await expect(ticketRow(page, 701)).toBeFocused()
      expect(account.support.closes).toEqual([])
      expect(account.saves).toEqual([])
    })

    test('a short original message opens as a compact inline transcript on desktop and phone', async ({ page, account }, testInfo) => {
      const original = locale === 'ro' ? 'Confirmarea programării nu a ajuns.' : 'The booking confirmation has not arrived.'
      const fixture = account.support.tickets.find(ticket => ticket.id === 701)!
      fixture.details.history = [{ message: original, createdBy: '901' }]
      await page.setViewportSize({ width: 1440, height: 900 })
      await openSupport(page, locale)
      expect(account.support.detailReads).toEqual([])
      await ticketRow(page, 701).click()
      const conversation = page.getByRole('region', { name: t.conversation, exact: true })
      await expect(conversation.getByText(original, { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: t.back, exact: true })).toHaveCount(0)
      await expect(page.getByRole('textbox', { name: t.reply, exact: true })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-short-original-desktop.png`), fullPage: true })
      await page.setViewportSize({ width: 360, height: 740 })
      // Account switches between its desktop workspace and mobile hub at 900px.
      // Enter the mobile conversation explicitly after that existing remount.
      await expect(ticketRow(page, 701)).toHaveAttribute('aria-expanded', 'false')
      expect(account.support.detailReads).toEqual([701])
      await ticketRow(page, 701).click()
      await expect(conversation.getByText(original, { exact: true })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      expect(account.support.detailReads).toEqual([701, 701])
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: testInfo.outputPath(`support-${locale}-short-original-mobile.png`), fullPage: true })
      await ticketRow(page, 701).click()
      await expect(conversation).toHaveCount(0)
      await expect(ticketRow(page, 701)).toBeFocused()
      expect(account.support.closes).toEqual([])
      expect(account.saves).toEqual([])
    })
  })
}
