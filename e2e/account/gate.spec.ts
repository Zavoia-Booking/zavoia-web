import { expect, test } from '@playwright/test'

test.describe('Account gate', () => {
  test('ACCT-01 signed-out visit to /account 307s through /login to /auth?mode=login&redirect=/account', async ({
    page,
  }) => {
    // Fresh context, never signed in: src/proxy.ts denies on CSRF-cookie
    // absence and 307s to /login?redirect=<path>, whose page.tsx then
    // redirects to /auth?mode=login&redirect=<path>.
    await page.goto('/account')
    await expect(page).toHaveURL(/\/auth\?/)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/auth')
    expect(url.searchParams.get('mode')).toBe('login')
    expect(url.searchParams.get('redirect')).toBe('/account')
  })
})
