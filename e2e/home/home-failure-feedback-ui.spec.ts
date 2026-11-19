import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { en } from '../../src/i18n/dictionaries/en';
import { ro } from '../../src/i18n/dictionaries/ro';

const dictionaries = { en, ro };

const api = `http://127.0.0.1:${process.env.HOME_FAILURES_FIXTURE_PORT || '3132'}`;
type Feed = 'categories' | 'city' | 'websites' | 'brands' | 'recent' | 'nearby';
type RequestRecord = { feed?: Feed; path: string; params: { offset?: number | string } };
type FixtureState = { requests: RequestRecord[]; blockedMutations: string[] };
const allFailures = { city: 503, websites: 503, brands: 503, recent: 503, nearby: 503 };
const recovered = { city: 200, websites: 200, brands: 200, recent: 200, nearby: 200 };
const browserProblems = new WeakMap<Page, string[]>();

async function configure(request: APIRequestContext, patch: Record<string, unknown>, reset = false) {
  expect((await request.post(`${api}/__control`, { data: { reset, patch } })).ok()).toBeTruthy();
}
async function inspect(request: APIRequestContext): Promise<FixtureState> {
  return (await request.get(`${api}/__control`)).json();
}
async function calls(request: APIRequestContext, feed: Feed) {
  return (await inspect(request)).requests.filter(item => item.feed === feed);
}
async function settleFeeds(request: APIRequestContext, feeds: Feed[] = ['categories', 'city', 'websites', 'brands', 'recent', 'nearby']) {
  for (const feed of feeds) await expect.poll(async () => (await calls(request, feed)).length).toBeGreaterThan(0);
}
async function location(context: BrowserContext, available = true) {
  if (available) {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 44.43, longitude: 26.1 });
  } else {
    await context.addInitScript(() => Object.defineProperty(navigator, 'geolocation', {
      configurable: true, value: { getCurrentPosition: (_success: unknown, failure: (error: { code: number }) => void) => failure({ code: 1 }) },
    }));
  }
}
async function openHome(page: Page, locale: 'en' | 'ro' = 'en') {
  await page.goto(locale === 'ro' ? '/ro' : '/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
function recovery(page: Page, locale: 'en' | 'ro' = 'en') {
  return page.getByRole('heading', { name: dictionaries[locale].homeSections.discovery.title, exact: true });
}
function section(page: Page, name: string) {
  return page.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });
}
function errorToast(page: Page) {
  return page.locator('[data-toast-host]').getByRole('alert');
}

test.beforeEach(async ({ page, context, request, baseURL }) => {
  const problems: string[] = [];
  browserProblems.set(page, problems);
  page.on('pageerror', error => problems.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // These tests intentionally reject discovery requests. Keep hydration,
    // React, and other application errors visible as actual test failures.
    if (message.text().startsWith('Home discovery request failed') || message.text().startsWith('Home discovery retry failed') || message.text().startsWith('Failed to load resource:')) return;
    problems.push(message.text());
  });
  await configure(request, {}, true);
  await context.addCookies([{ name: 'zw-consent', value: 'denied', url: baseURL! }]);
  await context.addInitScript(() => localStorage.setItem('zw-recent-views', JSON.stringify([201, 202])));
  await context.route('https://api.maptiler.com/**', route => route.fulfill({ json: { features: [] } }));
  await context.route('**/marketplace/public/approximate-location', route => route.fulfill({ json: { location: null } }));
});
test.afterEach(async ({ page, request }) => {
  expect((await inspect(request)).blockedMutations, 'The isolated fixture must not receive application mutations').toEqual([]);
  expect(browserProblems.get(page), 'No uncaught browser, hydration, or React errors').toEqual([]);
});

for (const locale of ['en', 'ro'] as const) {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    test(`${locale} ${viewport.width}px groups all five failed feeds into one accessible recovery`, async ({ page, context, request }) => {
      await page.setViewportSize(viewport);
      await location(context);
      await configure(request, { statuses: allFailures });
      await openHome(page, locale);
      await settleFeeds(request);
      await expect(recovery(page, locale)).toBeVisible();
      await expect(recovery(page, locale)).toHaveCount(1);
      await expect(page.getByRole('button', { name: dictionaries[locale].homeSections.discovery.retry, exact: true })).toHaveCount(1);
      await expect(page.getByText(dictionaries[locale].errors.sectionFailed, { exact: false })).toHaveCount(0);
      await expect(page.getByRole('link', { name: locale === 'ro' ? 'Frumusețe' : 'Beauty', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      const button = page.getByRole('button', { name: dictionaries[locale].homeSections.discovery.retry, exact: true });
      await button.focus();
      await expect(button).toBeFocused();
      await recovery(page, locale).evaluate(element => {
        window.scrollTo(0, Math.max(0, element.getBoundingClientRect().top + scrollY - 200));
      });
      await page.screenshot({ path: `/tmp/zavoia-home-recovery-${locale}-${viewport.width}.png` });
    });
  }
}

test('isolated optional and place feed failures disappear while other discovery content remains', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: { websites: 503, recent: 503, city: 503 } });
  await openHome(page);
  await settleFeeds(request);
  await expect(page.getByRole('heading', { name: 'Nearby', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Brands', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'In your city', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Recently viewed', exact: true })).toHaveCount(0);
  await expect(recovery(page)).toHaveCount(0);
  await expect(page.getByText(dictionaries.en.errors.sectionFailed, { exact: false })).toHaveCount(0);
  await expect(errorToast(page)).toHaveCount(0);
});

test('a successful promotional website does not conceal failed marketplace discovery', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: { ...allFailures, websites: 200 }, showcase: true });
  await openHome(page);
  await settleFeeds(request);
  await expect(page.getByRole('heading', { name: 'Made with Web Studio', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View website: Fixture website', exact: true })).toBeVisible();
  await expect(recovery(page)).toBeVisible();
});

for (const coordinatesAvailable of [true, false]) {
  test(`successful empty discovery with location ${coordinatesAvailable ? 'available' : 'unavailable'} is not presented as an outage`, async ({ page, context, request }) => {
    await location(context, coordinatesAvailable);
    await configure(request, { empty: ['city', 'nearby', 'brands', 'recent', 'websites'] });
    await openHome(page);
    await settleFeeds(request, coordinatesAvailable
      ? ['categories', 'city', 'nearby', 'brands', 'websites', 'recent']
      : ['categories', 'brands', 'websites', 'recent']);
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
    await expect(recovery(page)).toHaveCount(0);
    await expect(page.getByText(dictionaries.en.errors.sectionFailed, { exact: false })).toHaveCount(0);
    expect(await calls(request, 'city')).toHaveLength(coordinatesAvailable ? 1 : 0);
    expect(await calls(request, 'nearby')).toHaveLength(coordinatesAvailable ? 1 : 0);
  });
}

test('one retry refreshes server and client discovery and clears the shared recovery', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: allFailures });
  await openHome(page);
  await expect(recovery(page)).toBeVisible();
  const before = await inspect(request);
  await configure(request, { statuses: recovered });
  await page.getByRole('button', { name: dictionaries.en.homeSections.discovery.retry, exact: true }).click();
  for (const name of ['In your city', 'Nearby', 'Brands', 'Recently viewed']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(recovery(page)).toHaveCount(0);
  for (const feed of Object.keys(recovered) as Feed[]) {
    expect((await calls(request, feed)).length, `${feed} is included in shared retry`).toBeGreaterThan(before.requests.filter(item => item.feed === feed).length);
  }
});

test('an unsuccessful explicit shared retry reports its result without duplicate section failures', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: allFailures });
  await openHome(page);
  await expect(recovery(page)).toBeVisible();
  const button = page.getByRole('button', { name: dictionaries.en.homeSections.discovery.retry, exact: true });
  await button.click();
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.retryFailed);
  await expect(recovery(page)).toHaveCount(1);
  await expect(page.getByText(dictionaries.en.errors.sectionFailed, { exact: false })).toHaveCount(0);
});

test('failed pagination preserves cards, reports one toast, and can load the next page on retry', async ({ page, context, request }) => {
  await location(context);
  await openHome(page);
  const city = section(page, 'In your city');
  await expect(city.locator('a[href^="/business/"]')).toHaveCount(10);
  await page.clock.install();
  await configure(request, { statuses: { city: 503 } });
  await city.getByRole('button', { name: 'Show more places', exact: true }).click();
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.loadMoreFailed);
  await expect(city.locator('a[href^="/business/"]')).toHaveCount(10);
  await expect(recovery(page)).toHaveCount(0);
  const moreCalls = (await calls(request, 'city')).filter(item => Number(item.params.offset) === 10);
  expect(moreCalls).toHaveLength(1);
  await configure(request, { statuses: { city: 200 } });
  await page.clock.fastForward(15_100);
  await city.getByRole('button', { name: 'Show more places', exact: true }).click();
  await expect(city.locator('a[href^="/business/"]')).toHaveCount(12);
  await expect(city.getByRole('button', { name: 'Show more places', exact: true })).toHaveCount(0);
});

test('simultaneous background failures keep successful cards and announce an outage only once', async ({ page, context, request }) => {
  await location(context);
  await openHome(page);
  await settleFeeds(request);
  const city = section(page, 'In your city');
  const nearby = section(page, 'Nearby');
  await expect(city.locator('a[href^="/business/"]')).toHaveCount(10);
  await expect(nearby.locator('a[href^="/business/"]')).toHaveCount(6);
  await page.clock.install();
  await configure(request, { statuses: { city: 503, nearby: 503, recent: 503 } });
  await page.clock.fastForward(61_000);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  for (const feed of ['city', 'nearby', 'recent'] as const) {
    await expect.poll(async () => (await calls(request, feed)).length).toBe(2);
  }
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.refreshFailed);
  await expect(city.locator('a[href^="/business/"]')).toHaveCount(10);
  await expect(nearby.locator('a[href^="/business/"]')).toHaveCount(6);
  await expect(recovery(page)).toHaveCount(0);
  await page.clock.fastForward(7_000);
  await expect(errorToast(page)).toHaveCount(0);
  await page.clock.fastForward(61_000);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(async () => (await calls(request, 'city')).length).toBe(3);
  await expect(errorToast(page)).toHaveCount(0);
});

test('retrying a failed feed retains successful server categories and brands when their refresh fails', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: { websites: 503 } });
  await openHome(page);
  await settleFeeds(request);
  await expect(page.getByRole('link', { name: 'Fixture brand, Bucharest', exact: true })).toBeVisible();
  await page.clock.install();
  await configure(request, { statuses: { city: 503 } });
  await page.clock.fastForward(61_000);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.refreshFailed);
  await configure(request, { statuses: { categories: 503, brands: 503, city: 200 } });
  await errorToast(page).getByRole('button', { name: dictionaries.en.homeSections.discovery.retry, exact: true }).click();
  for (const feed of ['categories', 'brands'] as const) {
    await expect.poll(async () => (await calls(request, feed)).length).toBeGreaterThan(1);
  }
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.retryFailed);
  await expect(page.getByRole('link', { name: 'Beauty', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fixture brand, Bucharest', exact: true })).toBeVisible();
  await expect(recovery(page)).toHaveCount(0);
});

test('rapid retries share one attempt and cannot repeatedly request a fast-failing backend', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: allFailures, delays: { city: 300, nearby: 300, recent: 300, brands: 300, websites: 300 } });
  await openHome(page);
  await expect(recovery(page)).toBeVisible();
  const before = await inspect(request);
  const button = page.locator('main').getByRole('button', { name: /Try again/ });
  await button.evaluate(element => { for (let i = 0; i < 12; i++) (element as HTMLButtonElement).click(); });
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.retryFailed);
  for (const feed of Object.keys(allFailures) as Feed[]) {
    expect((await calls(request, feed)).length, `${feed} has a single shared retry`).toBe(before.requests.filter(item => item.feed === feed).length + 1);
  }
  const afterFailure = await inspect(request);
  await button.evaluate(element => { for (let i = 0; i < 12; i++) (element as HTMLButtonElement).click(); });
  await expect(errorToast(page).getByRole('button', { name: dictionaries.en.homeSections.discovery.retry, exact: true })).toHaveCount(0);
  expect((await inspect(request)).requests.filter(item => item.feed).length).toBe(afterFailure.requests.filter(item => item.feed).length);
  await expect(button).toBeDisabled();
});

test('hung client discovery settles to one recovery instead of permanent skeletons', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: { brands: 503 }, delays: { city: 25_000, nearby: 25_000, recent: 25_000 } });
  await page.clock.install();
  await openHome(page);
  await settleFeeds(request);
  await expect(recovery(page)).toHaveCount(0);
  await page.clock.fastForward(15_100);
  await expect(recovery(page)).toBeVisible();
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByText(dictionaries.en.errors.sectionFailed, { exact: false })).toHaveCount(0);
});

test('a hung server feed reaches recovery and retry also settles without losing the homepage', async ({ page, context, request }) => {
  test.setTimeout(55_000);
  await location(context);
  await configure(request, { statuses: { city: 503, nearby: 503, recent: 503 }, delays: { brands: 25_000 } });
  await openHome(page);
  await settleFeeds(request);
  await expect(recovery(page)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  await page.locator('main').getByRole('button', { name: dictionaries.en.homeSections.discovery.retry, exact: true }).click();
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.retryFailed, { timeout: 20_000 });
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(recovery(page)).toHaveCount(1);
});

test('an IP lookup that never settles cannot leave the homepage loading forever, and home never asks for location', async ({ page, context, request }) => {
  await context.addInitScript(() => {
    const probe = window as unknown as Window & { __geoRequests: number };
    probe.__geoRequests = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true, value: { getCurrentPosition: () => { probe.__geoRequests += 1; } },
    });
  });
  await context.route('**/marketplace/public/approximate-location', () => {});
  await configure(request, { empty: ['brands', 'recent', 'websites'] });
  await page.clock.install();
  // Without an earlier "Allow", the IP lookup starts as the page loads.
  const ipRequest = page.waitForRequest(item => new URL(item.url()).pathname === '/marketplace/public/approximate-location');
  await openHome(page);
  await ipRequest;
  await page.clock.fastForward(8_100);
  await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as Window & { __geoRequests: number }).__geoRequests)).toBe(0);
  await expect(recovery(page)).toHaveCount(0);
  expect(await calls(request, 'city')).toHaveLength(0);
  expect(await calls(request, 'nearby')).toHaveLength(0);
});

test('an unresponsive route-refresh transport releases recovery instead of a permanent pending action', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: allFailures });
  await openHome(page);
  await expect(recovery(page)).toBeVisible();
  await page.clock.install();
  await page.route('**/*', route => {
    if (route.request().headers().rsc === '1') return;
    return route.fallback();
  });
  const refreshRequest = page.waitForRequest(item => item.headers().rsc === '1');
  await page.locator('main').getByRole('button', { name: 'Try again', exact: true }).click();
  await refreshRequest;
  await page.clock.fastForward(20_100);
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.retryFailed);
  await expect(page.locator('main').getByRole('button', { name: /Try again/ })).not.toHaveAttribute('aria-busy', 'true');
  await expect(recovery(page)).toHaveCount(1);
});

test('outage notifications track joined failing feeds and reset after recovery despite an unrelated hidden failure', async ({ page, context, request }) => {
  await location(context);
  await configure(request, { statuses: { websites: 503 } });
  await openHome(page);
  await settleFeeds(request);
  await expect(section(page, 'In your city').locator('a[href^="/business/"]')).toHaveCount(10);
  await page.clock.install();
  const refresh = async (cityCallCount: number) => {
    await page.clock.fastForward(61_000);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect.poll(async () => (await calls(request, 'city')).length).toBe(cityCallCount);
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);
  };
  await configure(request, { statuses: { city: 503 } });
  await refresh(2);
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.refreshFailed);
  await configure(request, { statuses: { nearby: 503 } });
  await refresh(3);
  await expect(errorToast(page)).toHaveCount(0);
  await configure(request, { statuses: { city: 200 } });
  await refresh(4);
  await expect(errorToast(page)).toHaveCount(0);
  await configure(request, { statuses: { nearby: 200 } });
  await refresh(5);
  await expect(errorToast(page)).toHaveCount(0);
  await configure(request, { statuses: { city: 503 } });
  await refresh(6);
  await expect(errorToast(page)).toContainText(dictionaries.en.homeSections.discovery.refreshFailed);
});
