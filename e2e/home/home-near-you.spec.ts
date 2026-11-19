import { expect, test } from '@playwright/test'
import { en } from '../../src/i18n/dictionaries/en'

/**
 * HOME-03: unavailable location is optional, not a discovery outage.
 * Home never asks for location (the map does): without an earlier "Allow" it
 * goes straight to the IP estimate. Our API returns no estimate here, so the
 * result is independent of the test runner's egress IP.
 * The separate home-failure UI suite covers failed feeds and shared recovery.
 */
test.describe('Home — near-you / in-your-city without location', () => {
  test('HOME-03 unavailable location settles without a location prompt, place requests, skeletons, or section warnings', async ({
    page, context,
  }) => {
    // Count position requests: any would show the browser's location dialog.
    await context.addInitScript(() => {
      const probe = window as unknown as Window & { __geoRequests: number }
      probe.__geoRequests = 0
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: () => { probe.__geoRequests += 1 },
          watchPosition: () => { probe.__geoRequests += 1; return 0 },
          clearWatch: () => {},
        },
      })
    })
    let ipLookups = 0
    await context.route('**/marketplace/public/approximate-location', async route => {
      ipLookups += 1
      await route.fulfill({ json: { location: null } })
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
    expect(await page.evaluate(() => (window as unknown as Window & { __geoRequests: number }).__geoRequests)).toBe(0)
  })
})
