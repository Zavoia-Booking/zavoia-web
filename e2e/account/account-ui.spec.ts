import { expect, test as base, type Locator, type Page } from '@playwright/test'
import type { CustomerProfile, UpdateProfileBody } from '../../src/lib/api/marketplace/types'

const copy = {
  en: { edit: 'Edit', save: 'Save', cancel: 'Cancel', first: 'First name', last: 'Last name', phone: 'Phone number', dob: 'Date of birth', address: 'Address', city: 'City', account: 'Account', notifications: 'Notifications', error: 'Something went wrong. Please try again.', success: 'Profile updated' },
  ro: { edit: 'Editează', save: 'Salvează', cancel: 'Anulează', first: 'Prenume', last: 'Nume', phone: 'Număr de telefon', dob: 'Data nașterii', address: 'Adresă', city: 'Oraș', account: 'Cont', notifications: 'Notificări', error: 'A apărut o eroare. Încearcă din nou.', success: 'Profil actualizat' },
} as const
type PendingSave = { body: UpdateProfileBody; reply: (status?: number) => void }
type AccountFixture = { saves: PendingSave[] }

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
    const state: AccountFixture = { saves: [] }
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
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type,x-csrf-token' } })
        if (path.endsWith('/auth/refresh') && method === 'POST') return json({ accessToken: token, csrfToken: 'account-ui-fixture' })
        if (path.endsWith('/auth/me') && method === 'GET') return json({ user: { uuid: profile.uuid, email: profile.email, firstName: profile.firstName, lastName: profile.lastName, profileImage: null, hasPassword: true, emailVerified: true, googleSub: null } })
        if (path.endsWith('/customer/profile') && method === 'GET') return json(profile)
        if (path.endsWith('/customer/profile-summary') && method === 'GET') return json({ profileImage: null, memberSince: profile.createdAt, totalAppointments: 2, totalBusinessReviews: 0, totalProfessionalReviews: 0, totalFavorites: 0 })
        if (path.endsWith('/notifications/unread-count') && method === 'GET') return json({ data: { count: 0 } })
        if (path.endsWith('/notifications/inbox') && method === 'GET') return json({ data: { notifications: [{ id: 55, title: 'Fixture notice', body: 'Read-only fixture notification', createdAt: '2026-10-25T10:00:00Z', read: true, data: null }], unreadCount: 0, hasMore: false, nextCursor: null } })
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
      for (const save of state.saves) save.reply(503)
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

for (const locale of ['en', 'ro'] as const) {
  const t = copy[locale]
  const prefix = locale === 'ro' ? '/ro' : ''
  test.describe(`${locale} account UI`, () => {
    test.beforeEach(async ({ page, account }) => {
      void account
      await page.goto(`${prefix}/account`)
      await expect(page.getByText('Originalfirst', { exact: true })).toBeVisible()
    })

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

    test('visible editable field labels name controls; pending date saves preserve the selected date', async ({ page, account }) => {
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
