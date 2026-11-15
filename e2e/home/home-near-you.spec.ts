import { expect, test } from '@playwright/test'
import { en } from '../../src/i18n/dictionaries/en'

/**
 * HOME-03: unavailable location is optional, not a discovery outage.
 * Deny device coordinates and return an unsuccessful IP estimate so the result
 * is independent of the test runner's egress IP and the external service.
 * The separate home-failure UI suite covers failed feeds and shared recovery.
 */
test.describe('Home — near-you / in-your-city without geolocation', () => {
  test('HOME-03 unavailable location settles without place requests, skeletons, or section warnings', async ({
    page, context,
  }) => {
    await context.addInitScript(() => Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code: 1 }),
      },
    }))
    let ipLookups = 0
    await context.route('https://ipwho.is/**', async route => {
      ipLookups += 1
      await route.fulfill({ json: { success: false } })
    })
    const locationRequests: string[] = []
    page.on('request', request => {
      const { pathname } = new URL(request.url())
      if (pathname === '/marketplace/public/listings' || pathname === '/marketplace/public/nearby-locations') {
        locationRequests.push(pathname)
      }
    })

    await page.goto('/')
    await expect.poll(() => ipLookups).toBe(1)
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 })

    // Check the current headings and real loading state, including visual
    // skeletons, rather than the old text-only locating announcements.
    for (const name of [en.homeSections.nearYou.title, en.homeSections.inCity.title]) {
      await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0)
    }
    await expect(page.getByText(en.errors.sectionFailed, { exact: false })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: en.homeSections.discovery.title, exact: true })).toHaveCount(0)
    await expect(page.getByText(/application error/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main').getByRole('button', { name: en.homeSections.hero.searchAria, exact: true })).toBeEnabled()
    expect(locationRequests).toEqual([])
  })
})
