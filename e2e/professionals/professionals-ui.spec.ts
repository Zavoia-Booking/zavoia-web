import { expect, test, type APIRequestContext, type BrowserContext, type Locator, type Page } from '@playwright/test';
import type { ListingDetail, PublicWebsite, TeamMemberBookingContext } from '../../src/lib/api/marketplace/types';
import { ABOUT, IMAGE, PERSON, UUID, contextFixture, listingFixture, profileFixture, websiteFixture } from './fixtures.mjs';

const api = `http://127.0.0.1:${process.env.PROFESSIONALS_FIXTURE_PORT || '4317'}`;
const path = `/professionals/${UUID}`;
type FixtureState = {
  profileStatus: number;
  contextStatus: number;
  requests: Array<{ path: string; method: string; body: unknown }>;
  blockedMutations: string[];
};

async function configure(request: APIRequestContext, patch: Record<string, unknown>, reset = false) {
  const response = await request.post(`${api}/__control`, { data: { reset, patch } });
  expect(response.ok()).toBeTruthy();
}
async function inspect(request: APIRequestContext): Promise<FixtureState> {
  return (await request.get(`${api}/__control`)).json();
}
function publicProfile(page: Page) {
  return page.getByRole('main', { name: PERSON, exact: true });
}
async function openProfile(page: Page, locale: 'en' | 'ro' = 'en') {
  await page.goto(locale === 'ro' ? `/ro${path}` : path);
  const profile = publicProfile(page);
  await expect(profile.getByRole('heading', { name: PERSON, exact: true, level: 1 })).toBeVisible();
  return profile;
}

async function venueServices(page: Page, choice: Locator) {
  const panelId = await choice.getAttribute('aria-controls');
  expect(panelId, 'Each location choice identifies its own services panel').toBeTruthy();
  return page.locator(`[id=${JSON.stringify(panelId)}]`);
}

async function expectServicesBeforeNextVenue(choice: Locator, nextChoice: Locator) {
  const nextPanelId = await nextChoice.getAttribute('aria-controls');
  expect(await choice.evaluate((button, nextId) => {
    const panel = document.getElementById(button.getAttribute('aria-controls') || '');
    const next = Array.from(document.querySelectorAll('button[aria-controls]'))
      .find((candidate) => candidate.getAttribute('aria-controls') === nextId);
    return !!panel && !!next &&
      !!(button.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      !!(panel.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING);
  }, nextPanelId), 'Services follow their selected venue and precede the next venue').toBeTruthy();
}

type BrowserActions = { copied: string[]; shared: ShareData[] };
async function sharingFixture(context: BrowserContext, mode: 'copy' | 'share' | 'cancel' | 'copy-failure' | 'share-failure') {
  await context.addInitScript((selectedMode) => {
    const fixture = window as unknown as Window & { __professionalActions: BrowserActions };
    fixture.__professionalActions = { copied: [], shared: [] };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (selectedMode === 'copy-failure') throw new DOMException('Fixture denied clipboard access', 'NotAllowedError');
          fixture.__professionalActions.copied.push(text);
        },
      },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: selectedMode === 'copy' || selectedMode === 'copy-failure' ? undefined : async (data: ShareData) => {
        fixture.__professionalActions.shared.push(data);
        if (selectedMode === 'cancel') throw new DOMException('Fixture share cancelled', 'AbortError');
        if (selectedMode === 'share-failure') throw new DOMException('Fixture sharing denied', 'NotAllowedError');
      },
    });
  }, mode);
}
async function actions(page: Page): Promise<BrowserActions> {
  return page.evaluate(() => (window as unknown as Window & { __professionalActions: BrowserActions }).__professionalActions);
}

test.beforeEach(async ({ context, request, baseURL }) => {
  await configure(request, {}, true);
  await context.addCookies([{ name: 'zw-consent', value: 'denied', url: baseURL! }]);
  await context.route('**/__professionals-fixtures__/**', route => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#b94b2d"/></svg>',
  }));
});
test.afterEach(async ({ request }) => {
  expect((await inspect(request)).blockedMutations, 'Only fixture-approved actions may be sent').toEqual([]);
});

for (const locale of ['en', 'ro'] as const) {
  test(`a signed-out ${locale.toUpperCase()} link contains the real profile and metadata before JavaScript`, async ({ browser, request, baseURL }) => {
    const url = locale === 'ro' ? `/ro${path}` : path;
    const response = await request.get(url, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/<h1\b[^>]*>Mara Share<\/h1>/);
    expect(html).toContain(ABOUT);
    expect(html).toContain(`<title>${PERSON} | Zavoia</title>`);
    expect(html).toContain(`property="og:title" content="${PERSON}"`);
    expect(html).toContain(`property="og:image" content="https://zavoia.com${IMAGE}"`);
    expect(html).toContain(`property="og:image:alt" content="${PERSON}"`);
    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain(`name="twitter:image" content="https://zavoia.com${IMAGE}"`);
    expect(html).toContain(`rel="canonical" href="https://zavoia.com${url}"`);
    expect(html).toContain(`hrefLang="en" href="https://zavoia.com${path}"`);
    expect(html).toContain(`hrefLang="ro" href="https://zavoia.com/ro${path}"`);

    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const page = await noScript.newPage();
    await page.goto(`${baseURL}${url}`);
    await expect(page.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
    await expect(page.getByText(ABOUT, { exact: true })).toBeVisible();
    await noScript.close();
  });
}

for (const locale of ['en', 'ro'] as const) {
  test(`a ${locale.toUpperCase()} professional without a portrait reuses the homepage social image`, async ({ request }) => {
    await configure(request, { profile: { ...profileFixture(), profileImage: null } });
    const response = await request.get(locale === 'ro' ? `/ro${path}` : path, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const image = 'https://zavoia.com/brand/home-social.png';
    expect(html).toContain(`property="og:image" content="${image}"`);
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:alt" content="Zavoia. Local services. On your schedule."');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain(`name="twitter:image" content="${image}"`);
    expect(html).toContain('name="twitter:image:alt" content="Zavoia. Local services. On your schedule."');
    expect(html).toContain(`property="og:title" content="${PERSON}"`);
    expect(html).toContain(`property="og:description" content="${ABOUT}"`);
  });
}

for (const locale of ['en', 'ro'] as const) {
  test(`the ${locale.toUpperCase()} server response contains each venue's actual collapsed menu and links`, async ({ browser, request, baseURL }) => {
    const bookingContext: TeamMemberBookingContext = contextFixture(2);
    bookingContext.businesses[0].locations[0].services[0].name = 'Old Town haircut';
    bookingContext.businesses[0].locations[1].services[0].name = 'North colour';
    bookingContext.businesses[0].locations[1].showPricing = false;
    await configure(request, { bookingContext });
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await noScript.newPage();
      const prefix = locale === 'ro' ? '/ro' : '';
      const response = await page.goto(`${baseURL}${prefix}${path}`);
      expect(response?.status()).toBe(200);
      const profile = publicProfile(page);
      const oldTown = profile.getByRole('button', { name: /Atelier Share Studio.*Old Town venue/ });
      const north = profile.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
      await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
      await expect(north).toHaveAttribute('aria-expanded', 'false');
      const oldTownPanel = await venueServices(page, oldTown);
      const northPanel = await venueServices(page, north);
      for (const panel of [oldTownPanel, northPanel]) {
        await expect(panel).toHaveAttribute('inert', '');
        await expect(panel).toHaveAttribute('aria-hidden', 'true');
        await expect(panel.getByRole('button')).toHaveCount(0);
      }
      await expect(oldTownPanel).toContainText('Old Town haircut');
      await expect(oldTownPanel).toContainText(/120[.,]00/);
      await expect(oldTownPanel).toContainText('30m');
      await expect(oldTownPanel).not.toContainText('North colour');
      await expect(northPanel).toContainText('North colour');
      await expect(northPanel).toContainText('45m');
      await expect(northPanel).toContainText(locale === 'ro' ? 'Solicită o ofertă' : 'Request quote');
      await expect(northPanel).not.toContainText(/180[.,]00/);
      await expect(northPanel).not.toContainText('Old Town haircut');
      await expect(oldTownPanel.locator('a')).toHaveAttribute('href', `${prefix}/business/share-old-town`);
      await expect(northPanel.locator('a')).toHaveAttribute('href', `${prefix}/business/share-north-1`);
      await expect(oldTownPanel.locator('a')).toHaveAttribute('aria-label', locale === 'ro'
        ? 'Vezi locația Atelier Share Studio · Old Town venue'
        : 'View location: Atelier Share Studio · Old Town venue');
      await expect(northPanel.locator('a')).toHaveAttribute('aria-label', locale === 'ro'
        ? 'Vezi locația Atelier Share Studio · North venue'
        : 'View location: Atelier Share Studio · North venue');
      expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(1);
    } finally {
      await noScript.close();
    }
  });
}

for (const locale of ['en', 'ro'] as const) {
  test(`the selected empty ${locale.toUpperCase()} location menu retains its distinct accessible destination`, async ({ page, request }) => {
    const bookingContext: TeamMemberBookingContext = contextFixture(2);
    bookingContext.businesses[0].locations[1].services = [];
    await configure(request, { bookingContext });
    const profile = await openProfile(page, locale);
    const north = profile.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
    await north.click();
    const panel = await venueServices(page, north);
    const link = panel.getByRole('link', { name: locale === 'ro'
      ? 'Vezi locația Atelier Share Studio · North venue'
      : 'View location: Atelier Share Studio · North venue', exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveText(locale === 'ro' ? 'Vezi locația' : 'View location');
    await expect(link).toHaveAttribute('href', `${locale === 'ro' ? '/ro' : ''}/business/share-north-1`);
    await expect(panel.getByRole('button')).toHaveCount(0);
  });
}

test('the sitemap advertises both canonical professional locales with language alternatives', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect((xml.match(/<loc>/g) ?? []).length).toBeLessThanOrEqual(50_000);
  expect(Buffer.byteLength(xml, 'utf8')).toBeLessThanOrEqual(50 * 1024 * 1024);
  for (const prefix of ['', '/ro']) {
    expect(xml).toContain(`<loc>https://zavoia.com${prefix}${path}</loc>`);
  }
  expect(xml).toContain(`hreflang="en" href="https://zavoia.com${path}"`);
  expect(xml).toContain(`hreflang="ro" href="https://zavoia.com/ro${path}"`);
});

for (const locale of ['en', 'ro'] as const) {
  test(`the ${locale.toUpperCase()} numeric location alias uses the stored slug in every canonical signal`, async ({ request }) => {
    const prefix = locale === 'ro' ? '/ro' : '';
    const response = await request.get(`${prefix}/business/201`, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const canonical = `https://zavoia.com${prefix}/business/share-old-town`;
    expect(html).toContain(`rel="canonical" href="${canonical}"`);
    expect(html).toContain(`property="og:url" content="${canonical}"`);
    expect(html).toContain('hrefLang="en" href="https://zavoia.com/business/share-old-town"');
    expect(html).toContain('hrefLang="ro" href="https://zavoia.com/ro/business/share-old-town"');
    expect(html).toContain('hrefLang="x-default" href="https://zavoia.com/business/share-old-town"');
  });
}

test('location pages contain the real professional link before the Team tab is visited', async ({ browser, baseURL }) => {
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await noScript.newPage();
    await page.goto(`${baseURL}/business/share-old-town`);
    const teamPanel = page.getByRole('tabpanel', { includeHidden: true }).filter({ has: page.locator(`a[href="${path}"]`) });
    await expect(teamPanel).toHaveAttribute('hidden', '');
    await expect(teamPanel.locator(`a[href="${path}"]`)).toHaveCount(1);
  } finally {
    await noScript.close();
  }
});

for (const locale of ['en', 'ro'] as const) {
  test(`the ${locale.toUpperCase()} scoped location modal profile link navigates directly without cancelling the destination`, async ({ page, baseURL }) => {
    const prefix = locale === 'ro' ? '/ro' : '';
    await page.goto(`${prefix}/business/share-old-town?tab=team&member=301`);
    const modal = page.getByRole('dialog', { name: PERSON, exact: true });
    const link = modal.locator('aside').getByRole('link', {
      name: locale === 'ro' ? 'Vezi profilul' : 'View profile', exact: true,
    });
    await expect(link).toHaveAttribute('href', `${prefix}${path}`);
    // Navigate on the first click; opening a new tab first would warm the route
    // and could conceal URL cleanup racing the pending destination request.
    await link.click();
    await expect(page).toHaveURL(`${baseURL}${prefix}${path}`);
    await expect(modal).toHaveCount(0);
    await expect(publicProfile(page).getByRole('heading', { name: PERSON, exact: true, level: 1 })).toBeVisible();
  });

  test(`the ${locale.toUpperCase()} location team deep link opens the scoped profile on entry and reload without resetting later tab choices`, async ({ page, request }) => {
    const prefix = locale === 'ro' ? '/ro' : '';
    await page.goto(`${prefix}/business/share-old-town?tab=team&member=301`);
    const team = page.getByRole('tab', { name: locale === 'ro' ? /^Echipă/ : /^Team/ });
    const about = page.getByRole('tab', { name: locale === 'ro' ? 'Despre' : 'About', exact: true });
    const modal = page.getByRole('dialog', { name: PERSON, exact: true });
    await expect(team).toHaveAttribute('aria-selected', 'true');
    await expect(modal.getByRole('heading', { name: PERSON, exact: true, level: 2 })).toBeVisible();
    await expect(modal.getByRole('button', { name: locale === 'ro' ? 'Adaugă Fixture haircut' : 'Add Fixture haircut', exact: true })).toBeVisible();
    expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/11/team-member/301')).toHaveLength(1);

    await page.reload();
    await expect(team).toHaveAttribute('aria-selected', 'true');
    await expect(modal.getByRole('heading', { name: PERSON, exact: true, level: 2 })).toBeVisible();
    await expect(modal.getByRole('button', { name: locale === 'ro' ? 'Adaugă Fixture haircut' : 'Add Fixture haircut', exact: true })).toBeVisible();
    expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/11/team-member/301')).toHaveLength(2);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).searchParams.has('member')).toBe(false);
    await about.click();
    await expect(about).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: locale === 'ro' ? 'Adresă' : 'Address', exact: true })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('tab')).toBe('team');
    await team.click();
    await expect(team).toHaveAttribute('aria-selected', 'true');
    await expect(modal).toHaveCount(0);
  });
}

for (const tab of ['reviews', 'about'] as const) {
  test(`a location ${tab} deep link selects its tab and ignores an off-tab professional parameter`, async ({ page, request }) => {
    await page.goto(`/business/share-old-town?tab=${tab}&member=301`);
    const selected = page.getByRole('tab', { name: tab === 'reviews' ? /^Reviews/ : 'About', exact: tab === 'about' });
    await expect(selected).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/11/team-member/301')).toHaveLength(0);
    const services = page.getByRole('tab', { name: /^Services/ });
    await services.click();
    await expect(services).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('tab')).toBe(tab);
  });
}

test('location team cards preserve modified native navigation and open one scoped modal on an ordinary click', async ({ context, page, request, baseURL }) => {
  await sharingFixture(context, 'copy');
  await page.goto('/business/share-old-town');
  const team = page.getByRole('tab', { name: /^Team/ });
  await team.click();
  const card = page.getByRole('tabpanel').locator(`a[href="${path}"]`);
  const newTabPromise = context.waitForEvent('page');
  await card.click({ modifiers: ['ControlOrMeta'] });
  const newTab = await newTabPromise;
  await expect(newTab).toHaveURL(`${baseURL}${path}`);
  await newTab.close();
  await expect(page).toHaveURL(`${baseURL}/business/share-old-town`);
  await expect(team).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await card.click();
  const modal = page.getByRole('dialog', { name: PERSON, exact: true });
  await expect(modal.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(async () => (await actions(page)).copied).toEqual([`${baseURL}${path}`]);
  expect(new URL(page.url()).pathname).toBe('/business/share-old-town');
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/11/team-member/301')).toHaveLength(1);
});

for (const availability of ['pending', 'legacy'] as const) {
  test(`a ${availability} professional keeps the contextual location profile without advertising an independent link or Share`, async ({ context, page, request }) => {
    const profile = profileFixture();
    const listing = listingFixture();
    if (availability === 'pending') {
      profile.publicProfileAvailable = false;
      listing.teamMembers[0].publicProfileAvailable = false;
    } else {
      delete (profile as Partial<typeof profile>).publicProfileAvailable;
      delete (listing.teamMembers[0] as Partial<typeof listing.teamMembers[number]>).publicProfileAvailable;
    }
    await configure(request, { profile, listing });
    await sharingFixture(context, 'copy');
    await page.goto(`/business/share-${availability}-profile?tab=team`);
    const panel = page.getByRole('tabpanel');
    await expect(panel.locator(`a[href="${path}"]`)).toHaveCount(0);
    const card = panel.getByRole('button', { name: new RegExp(PERSON) });
    await expect(card).toBeVisible();
    await card.click();
    const modal = page.getByRole('dialog', { name: PERSON, exact: true });
    await expect(modal.getByRole('heading', { name: PERSON, level: 2, exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
    await expect(modal.getByRole('link', { name: 'View profile', exact: true })).toHaveCount(0);
    expect(await actions(page)).toEqual({ copied: [], shared: [] });
    expect((await inspect(request)).requests.filter(item => item.path === `/marketplace/public/professional/${UUID}`)).toHaveLength(0);
  });
}

for (const variant of ['portraits', 'roster', 'columns', 'carousel'] as const) {
  test(`published ${variant} team cards expose native profile links and retain the scoped profile flow`, async ({ browser, page, request, baseURL }) => {
    const websitePath = `/share-team-${variant}`;
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    try {
      const source = await noScript.newPage();
      const response = await source.goto(`${baseURL}${websitePath}`);
      expect(response?.status()).toBe(200);
      const team = source.locator('[data-preview-section="team"]');
      await expect(team.locator('a[href^="/professionals/"]')).toHaveCount(3);
      await expect(team.locator(`a[href="${path}"]`)).toHaveCount(1);
    } finally {
      await noScript.close();
    }

    await page.goto(websitePath);
    const team = page.locator('[data-preview-section="team"]');
    await team.locator(`a[href="${path}"]`).click();
    const modal = page.getByRole('dialog', { name: PERSON, exact: true });
    await expect(modal.getByRole('heading', { name: PERSON, level: 2, exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
    await expect(page).toHaveURL(`${baseURL}${websitePath}`);
    const state = await inspect(request);
    expect(state.requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(1);
    expect(state.requests.filter(item => item.path === '/marketplace/public/listing/11/team-member/301')).toHaveLength(1);
    expect(state.requests.filter(item => item.path === `/marketplace/public/professional/${UUID}`)).toHaveLength(0);
  });
}

test('the published team carousel centres side taps, opens the centre once, suppresses drags and preserves native new tabs', async ({ context, page, request, baseURL }) => {
  await page.goto('/share-team-carousel');
  const team = page.locator('[data-preview-section="team"]');
  const slides = team.locator('.mc-tmr-slide');
  await expect(slides.nth(0)).toHaveAttribute('data-active', '1');
  const second = team.locator('a[href="/professionals/share-professional-lily"]');
  await second.click();
  await expect(slides.nth(1)).toHaveAttribute('data-active', '1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(0);

  await second.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Lily Share', exact: true });
  await expect(modal.getByRole('heading', { name: 'Lily Share', exact: true, level: 2 })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(1);
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  const bounds = await second.boundingBox();
  expect(bounds).not.toBeNull();
  const x = bounds!.x + bounds!.width / 2;
  const y = bounds!.y + bounds!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 400, y, { steps: 12 });
  await page.mouse.up();
  await expect(slides.nth(2)).toHaveAttribute('data-active', '1');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(`${baseURL}/share-team-carousel`);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(1);

  const newTabPromise = context.waitForEvent('page');
  await team.locator('a[href="/professionals/share-professional-sofia"]').click({ modifiers: ['ControlOrMeta'] });
  const newTab = await newTabPromise;
  await expect(newTab).toHaveURL(`${baseURL}/professionals/share-professional-sofia`);
  await newTab.close();
  await expect(page).toHaveURL(`${baseURL}/share-team-carousel`);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(slides.nth(2)).toHaveAttribute('data-active', '1');
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(1);
});

test('Studio team specimens remain inert even when their real showcase data includes public professional UUIDs', async ({ page, request }) => {
  await page.goto('/web-studio');
  await page.getByRole('button', { name: /^06 Team/ }).click();
  const specimen = page.locator('[inert] [data-preview-section="team"]').first();
  await expect(specimen).toBeAttached();
  await expect(specimen).toContainText(PERSON);
  await expect(specimen.locator('a[href^="/professionals/"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: PERSON, exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/listing/201')).toHaveLength(0);
});

test('refresh preserves the canonical page without opening a modal or fetching its profile again during hydration', async ({ page, request }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  const profile = await openProfile(page);
  await expect(profile.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  let state = await inspect(request);
  expect(state.requests.filter(item => item.path.endsWith(`/professional/${UUID}`))).toHaveLength(1);
  expect(state.requests.filter(item => item.path === '/marketplace/public/team-member/301')).toHaveLength(0);
  expect(state.requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(1);
  await page.reload();
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  state = await inspect(request);
  expect(state.requests.filter(item => item.path.endsWith(`/professional/${UUID}`))).toHaveLength(2);
  expect(state.requests.filter(item => item.path === '/marketplace/public/team-member/301')).toHaveLength(0);
  expect(state.requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(2);
  expect(runtimeErrors).toEqual([]);
});

for (const locale of ['en', 'ro'] as const) {
  test(`profile ${locale.toUpperCase()} labels and language names localize without rewriting authored content`, async ({ page, request }) => {
    const bookingContext: TeamMemberBookingContext = contextFixture();
    bookingContext.businesses[0].locations[0].services[0] = {
      ...bookingContext.businesses[0].locations[0].services[0],
      name: 'Tuns personalizat', category: { id: 91, name: 'Păr', color: '#b94b2d' },
    };
    const fixture = profileFixture();
    await configure(request, {
      bookingContext,
      profile: {
        ...fixture,
        about: { ...fixture.about, aboutMe: 'Îngrijire atentă, în ritmul tău.', languages: ['Română', 'English', 'Fixture language'] },
      },
    });
    const profile = await openProfile(page, locale);
    await expect(profile.getByRole('heading', { name: locale === 'en' ? 'Location' : 'Locație', exact: true })).toBeVisible();
    await expect(profile.getByText(locale === 'en' ? 'Romanian, English, Fixture language' : 'Română, Engleză, Fixture language', { exact: true })).toBeVisible();
    await expect(profile.getByText(locale === 'en' ? '5 years' : '5 ani', { exact: true })).toBeVisible();
    await expect(profile.getByText(locale === 'en' ? 'Since 2024' : 'Din 2024', { exact: true })).toBeVisible();
    await expect(profile.getByText('Îngrijire atentă, în ritmul tău.', { exact: true })).toBeVisible();
    await expect(profile.getByText('Păr', { exact: true })).toBeVisible();
    await expect(profile.getByText(locale === 'en' ? 'No reviews yet' : 'Nicio recenzie încă', { exact: true })).toBeVisible();
    await expect(profile.getByText(locale === 'en' ? 'Reviews from clients will appear here.' : 'Aici vor apărea recenziile clienților.', { exact: true })).toHaveCount(0);

    const prompt = profile.getByText(locale === 'en' ? 'Choose a service' : 'Alege un serviciu', { exact: true });
    const book = profile.getByRole('button', { name: locale === 'en' ? 'Book with Mara' : 'Programează-te la Mara', exact: true });
    await expect(prompt).toBeVisible();
    await expect(book).toBeDisabled();
    await profile.getByRole('button', { name: /Tuns personalizat/ }).click();
    await expect(prompt).toHaveCount(0);
    await expect(book).toBeEnabled();
  });
}

test('Romanian profile counts use the appropriate noun form for experience, locations and reviews', async ({ page, request }) => {
  const review = {
    id: 711, rating: 5, comment: 'Foarte atentă la detalii.',
    createdAt: '2026-10-20T12:00:00Z', customer: null,
  };
  for (const [count, expected] of [[20, '20 de recenzii'], [101, '101 recenzii'], [120, '120 de recenzii']] as const) {
    await configure(request, {
      bookingContext: contextFixture(20),
      profile: {
        ...profileFixture(), yearsOfExperience: 20, reviews: [review],
        reviewStats: { totalCount: count, averageRating: 5 },
      },
    });
    const profile = await openProfile(page, 'ro');
    await expect(profile.getByRole('heading', { name: 'Alege locația', exact: true })).toBeVisible();
    await expect(profile.getByText('20 de ani', { exact: true })).toBeVisible();
    await expect(profile.getByText('20 de locații', { exact: true })).toBeVisible();
    await expect(profile.getByText(expected, { exact: true })).toBeVisible();
    await expect(profile.getByText(review.comment, { exact: true })).toBeVisible();
    await expect(profile.getByRole('button', { name: 'Programează-te la Mara', exact: true })).toHaveCount(0);
  }
});

test.describe('profile dates across browser and server timezones', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('hydrates membership and review dates without errors before using the browser timezone', async ({ page, request }) => {
    await configure(request, {
      profile: {
        ...profileFixture(),
        memberSince: '2024-01-01T00:30:00Z',
        reviews: [{
          id: 601, rating: 5, comment: 'Timezone boundary review fixture.',
          createdAt: '2026-08-20T00:30:00Z', customer: null,
        }],
        reviewStats: { totalCount: 1, averageRating: 5 },
      },
    });
    // These instants belong to the previous date/year in New York. The server
    // response must remain usable before the browser applies its own timezone.
    const response = await request.get(path, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    const html = await response.text();
    expect(html).toMatch(/>Since 2024<\/div>/);
    expect(html).toMatch(/<time\b[^>]*>Aug 20, 2026<\/time>/);

    const runtimeErrors: string[] = [];
    const hydrationErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /hydrat|server.rendered|didn't match/i.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    const profile = await openProfile(page);
    await expect(profile.getByText('Since 2023', { exact: true })).toBeVisible();
    await expect(profile.locator('time[datetime="2026-08-20T00:30:00Z"]')).toHaveText('Aug 19, 2026');
    expect(runtimeErrors, 'A different browser timezone must not break hydration').toEqual([]);
    expect(hydrationErrors, 'Server dates must match the first browser render').toEqual([]);
  });
});

test('nullable profile names use the same localized fallback in the page and metadata', async ({ page, request }) => {
  const profile = profileFixture();
  await configure(request, { profile: { ...profile, firstName: null, lastName: null, about: null } });
  for (const [locale, name] of [['en', 'Professional'], ['ro', 'Profesionist']] as const) {
    const url = locale === 'ro' ? `/ro${path}` : path;
    await page.goto(url);
    await expect(page.getByRole('main', { name, exact: true }).getByRole('heading', { name, level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(`${name} | Zavoia`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', name);
  }
});

for (const locale of ['en', 'ro'] as const) {
  test(`a profile without a biography has a useful localized ${locale.toUpperCase()} metadata description`, async ({ request }) => {
    const profile = profileFixture();
    await configure(request, { profile: { ...profile, about: { ...profile.about, aboutMe: null } } });
    const response = await request.get(locale === 'ro' ? `/ro${path}` : path, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    const html = await response.text();
    const description = locale === 'ro'
      ? `${PERSON}, Stylist. Vezi profilul profesional și recenziile pe Zavoia.`
      : `${PERSON}, Stylist. View their professional profile and reviews on Zavoia.`;
    expect(html).toContain(`<meta name="description" content="${description}"`);
    expect(html).toContain(`property="og:description" content="${description}"`);
    expect(html).toContain(`name="twitter:description" content="${description}"`);
  });
}

test('an unknown identifier shows an unavailable page with noindex', async ({ page, request }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  const response = await request.get('/professionals/missing-fixture', { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
  expect(html).not.toMatch(/<h1\b[^>]*>Mara Share<\/h1>/);
  await page.goto('/professionals/missing-fixture');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: PERSON })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test('a server failure offers page recovery and does not become a cached missing profile', async ({ page, request }) => {
  const runtimeErrors: string[] = [];
  const reportedErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') reportedErrors.push(message.text()); });
  await configure(request, { profileStatus: 503 });
  await page.goto(path);
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: PERSON })).toHaveCount(0);
  await expect.poll(() => reportedErrors.some(message => message.includes('Fixture profile unavailable'))).toBe(true);
  await configure(request, { profileStatus: 200 });
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(publicProfile(page).getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test('clipboard sharing copies the canonical localhost URL and confirms only the completed copy', async ({ context, page, baseURL }) => {
  await sharingFixture(context, 'copy');
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(async () => (await actions(page)).copied).toEqual([`${baseURL}${path}`]);
  await expect(page.getByText('Link copied', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}${path}`);
});

test('Romanian sharing uses the localized canonical profile link', async ({ context, page, baseURL }) => {
  await sharingFixture(context, 'copy');
  const profile = await openProfile(page, 'ro');
  await profile.getByRole('button', { name: 'Distribuie', exact: true }).click();
  await expect.poll(async () => (await actions(page)).copied).toEqual([`${baseURL}/ro${path}`]);
  await expect(page.getByText('Link copiat', { exact: true })).toBeVisible();
});

test('sharing from a contextual modal sends the public profile URL and leaves the sender on Saved', async ({ context, page, request, baseURL }) => {
  await sharingFixture(context, 'copy');
  await configure(request, { signedIn: true });
  await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
  await page.goto('/saved');
  await page.getByRole('button', { name: PERSON, exact: true }).click();
  const modal = page.getByRole('dialog', { name: PERSON, exact: true });
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(async () => (await actions(page)).copied).toEqual([`${baseURL}${path}`]);
  await expect(page.getByText('Link copied', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}/saved`);
  await expect(modal).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Saved', exact: true, level: 1 })).toBeVisible();
});

test('native sharing receives this professional rather than the origin page', async ({ context, page, baseURL }) => {
  await sharingFixture(context, 'share');
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(async () => (await actions(page)).shared).toEqual([{ title: PERSON, url: `${baseURL}${path}` }]);
  expect((await actions(page)).copied).toEqual([]);
  await expect(page.getByText('Link copied', { exact: true })).toHaveCount(0);
});

test('cancelling device sharing stays silent and preserves the profile', async ({ context, page }) => {
  await sharingFixture(context, 'cancel');
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Share', exact: true }).click();
  await expect.poll(async () => (await actions(page)).shared.length).toBe(1);
  expect((await actions(page)).copied).toEqual([]);
  await expect(page.getByText('Link copied', { exact: true })).toHaveCount(0);
  await expect(page.getByText("Couldn't share this profile. Please try again.", { exact: true })).toHaveCount(0);
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
});

test('a failed device share offers a fresh copy action without claiming it already copied', async ({ context, page, baseURL }) => {
  await sharingFixture(context, 'share-failure');
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Share', exact: true }).click();
  const failure = page.getByRole('alert').filter({ hasText: "Couldn't share this profile. Please try again." });
  await expect(failure).toBeVisible();
  expect((await actions(page)).copied).toEqual([]);
  await failure.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect.poll(async () => (await actions(page)).copied).toEqual([`${baseURL}${path}`]);
  await expect(page.getByText('Link copied', { exact: true })).toBeVisible();
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
});

test('clipboard denial gives translated action feedback and retains the profile', async ({ context, page }) => {
  await sharingFixture(context, 'copy-failure');
  const profile = await openProfile(page, 'ro');
  await profile.getByRole('button', { name: 'Distribuie', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Nu am putut copia linkul. Încearcă din nou.' })).toBeVisible();
  await expect(page.getByText('Link copiat', { exact: true })).toHaveCount(0);
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
});

for (const locale of ['en', 'ro'] as const) {
  for (const presentation of ['page', 'modal'] as const) {
    test(`reselecting the current venue preserves service picks in the ${locale.toUpperCase()} profile ${presentation}`, async ({ context, page, request, baseURL }) => {
      await configure(request, { signedIn: presentation === 'modal', bookingContext: contextFixture(2) });
      let profile: Locator;
      if (presentation === 'modal') {
        await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
        await page.goto(locale === 'ro' ? '/ro/saved' : '/saved');
        await page.getByRole('button', { name: PERSON, exact: true }).click();
        profile = page.getByRole('dialog', { name: PERSON, exact: true });
      } else {
        profile = await openProfile(page, locale);
      }

      const oldTown = profile.getByRole('button', { name: /Atelier Share Studio.*Old Town venue/ });
      const north = profile.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
      const addName = `${locale === 'ro' ? 'Adaugă' : 'Add'} Fixture haircut`;
      const removeName = `${locale === 'ro' ? 'Elimină' : 'Remove'} Fixture haircut`;
      const book = profile.getByRole('button', { name: locale === 'ro' ? 'Programează-te la Mara' : 'Book with Mara', exact: true });
      await oldTown.click();
      const oldTownServices = await venueServices(page, oldTown);
      await oldTownServices.getByRole('button', { name: addName, exact: true }).click();
      await expect(book).toBeEnabled();

      // Re-activating the selected venue is a no-op for pointer and keyboard users.
      for (const activation of ['click', 'Enter', 'Space'] as const) {
        if (activation === 'click') await oldTown.click();
        else await oldTown.press(activation);
        await expect(oldTown).toHaveAttribute('aria-expanded', 'true');
        await expect(oldTownServices.getByRole('button', { name: removeName, exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(book).toBeEnabled();
      }

      // The same service can have different terms at another venue, so switching still clears it.
      await north.click();
      await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
      await expect(north).toHaveAttribute('aria-expanded', 'true');
      const northServices = await venueServices(page, north);
      await expect(northServices.getByRole('button', { name: addName, exact: true })).toHaveAttribute('aria-pressed', 'false');
      await expect(book).toBeDisabled();
    });
  }
}

test('multiple venues require an explicit choice and changing venues clears selected services', async ({ page, request }) => {
  await configure(request, { bookingContext: contextFixture(2) });
  const profile = await openProfile(page);
  await expect(profile.getByRole('heading', { name: 'Choose a location', exact: true })).toBeVisible();
  await expect(profile.getByRole('link', { name: /^View location: / })).toHaveCount(0);
  await expect(profile.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toHaveCount(0);
  const oldTown = profile.getByRole('button', { name: /Atelier Share Studio.*Old Town venue/ });
  const north = profile.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
  await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
  await expect(north).toHaveAttribute('aria-expanded', 'false');
  await oldTown.click();
  const oldTownServices = await venueServices(page, oldTown);
  await expect(oldTown).toHaveAttribute('aria-expanded', 'true');
  await expect(oldTownServices).toBeVisible();
  await expect(oldTownServices.getByRole('link', { name: 'View location: Atelier Share Studio · Old Town venue', exact: true })).toHaveAttribute('href', '/business/share-old-town');
  await expectServicesBeforeNextVenue(oldTown, north);
  await expect(profile.getByRole('heading', { name: 'Services', exact: true })).toHaveCount(1);
  await expect(oldTownServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  const service = profile.getByRole('button', { name: 'Add Fixture haircut', exact: true });
  await expect(service).toContainText(/120[.,]00/);
  await service.click();
  await expect(profile.getByRole('button', { name: 'Book with Mara', exact: true })).toBeEnabled();
  await north.click();
  await expect(north).toHaveAttribute('aria-pressed', 'true');
  await expect(north).toHaveAttribute('aria-expanded', 'true');
  await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
  await expect(oldTownServices).toBeHidden();
  await expect(oldTownServices.getByRole('button')).toHaveCount(0);
  const northServices = await venueServices(page, north);
  await expect(northServices.getByRole('link', { name: 'View location: Atelier Share Studio · North venue', exact: true })).toHaveAttribute('href', '/business/share-north-1');
  await expect(profile.getByRole('link', { name: /^View location: / })).toHaveCount(1);
  await expect(northServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await expect(profile.getByRole('heading', { name: 'Services', exact: true })).toHaveCount(1);
  await expect(service).toContainText(/180[.,]00/);
  await expect(profile.getByRole('button', { name: 'Book with Mara', exact: true })).toBeDisabled();
});

for (const locale of ['en', 'ro'] as const) {
  test(`the ${locale.toUpperCase()} modal profile link preserves selections in a new tab and closes the modal on ordinary navigation`, async ({ context, page, request, baseURL }) => {
    await configure(request, { signedIn: true, bookingContext: contextFixture(2) });
    await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
    const prefix = locale === 'ro' ? '/ro' : '';
    const linkName = locale === 'ro' ? 'Vezi profilul' : 'View profile';
    await page.goto(`${prefix}/saved`);
    await page.getByRole('button', { name: PERSON, exact: true }).click();
    const modal = page.getByRole('dialog', { name: PERSON, exact: true });
    const north = modal.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
    await north.click();
    const addName = `${locale === 'ro' ? 'Adaugă' : 'Add'} Fixture haircut`;
    const removeName = `${locale === 'ro' ? 'Elimină' : 'Remove'} Fixture haircut`;
    await modal.getByRole('button', { name: addName, exact: true }).click();
    const book = modal.getByRole('button', { name: locale === 'ro' ? 'Programează-te la Mara' : 'Book with Mara', exact: true });
    await expect(book).toBeEnabled();

    const link = modal.locator('aside').getByRole('link', { name: linkName, exact: true });
    await expect(link).toHaveAttribute('href', `${prefix}${path}`);
    await expect(link).not.toHaveAttribute('target', '_blank');
    const newTabPromise = context.waitForEvent('page');
    await link.click({ modifiers: ['ControlOrMeta'] });
    const newTab = await newTabPromise;
    await expect(newTab).toHaveURL(`${baseURL}${prefix}${path}`);
    await expect(publicProfile(newTab).getByRole('heading', { name: PERSON, exact: true, level: 1 })).toBeVisible();
    await expect(publicProfile(newTab).getByRole('link', { name: linkName, exact: true })).toHaveCount(0);
    await newTab.close();
    await expect(page).toHaveURL(`${baseURL}${prefix}/saved`);
    await expect(modal).toBeVisible();
    await expect(north).toHaveAttribute('aria-pressed', 'true');
    await expect(modal.getByRole('button', { name: removeName, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(book).toBeEnabled();

    await link.click();
    await expect(page).toHaveURL(`${baseURL}${prefix}${path}`);
    await expect(modal).toHaveCount(0);
    await expect(publicProfile(page).getByRole('heading', { name: PERSON, exact: true, level: 1 })).toBeVisible();
    await expect(publicProfile(page).getByRole('link', { name: linkName, exact: true })).toHaveCount(0);
  });
}

test('the selected location link supports new tabs and dismisses the Romanian profile modal only on same-tab navigation', async ({ context, page, request, baseURL }) => {
  await configure(request, { signedIn: true, bookingContext: contextFixture(2) });
  await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
  await page.goto('/ro/saved');
  await page.getByRole('button', { name: PERSON, exact: true }).click();
  const modal = page.getByRole('dialog', { name: PERSON, exact: true });
  await expect(modal.getByRole('link', { name: /^Vezi locația / })).toHaveCount(0);
  const north = modal.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
  await north.click();
  const link = modal.getByRole('link', { name: 'Vezi locația Atelier Share Studio · North venue', exact: true });
  await expect(link).toHaveAttribute('href', '/ro/business/share-north-1');
  await expect(link).not.toHaveAttribute('target', '_blank');

  const newTabPromise = context.waitForEvent('page');
  await link.click({ modifiers: ['ControlOrMeta'] });
  const newTab = await newTabPromise;
  await expect(newTab).toHaveURL(`${baseURL}/ro/business/share-north-1`);
  await newTab.close();
  await expect(page).toHaveURL(`${baseURL}/ro/saved`);
  await expect(modal).toBeVisible();
  await expect(north).toHaveAttribute('aria-pressed', 'true');

  await link.click();
  await expect(page).toHaveURL(`${baseURL}/ro/business/share-north-1`);
  await expect(modal).toHaveCount(0);
});

test('business-grouped venue choices retain exact menus and clear service picks across businesses', async ({ page, request }) => {
  const bookingContext: TeamMemberBookingContext = contextFixture(2);
  for (const location of bookingContext.businesses[0].locations) location.featuredImage = IMAGE;
  const wellness: TeamMemberBookingContext['businesses'][number] = contextFixture(1).businesses[0];
  wellness.id = 102;
  wellness.name = 'Wellness House';
  wellness.listingId = 12;
  wellness.locations[0] = {
    ...wellness.locations[0], id: 203, name: 'Garden venue',
    address: 'Strada Grădinii 7, Bucharest', featuredImage: IMAGE,
    services: [{
      ...wellness.locations[0].services[0], id: 402, uuid: 'share-massage-fixture',
      name: 'Fixture massage', priceAmountMinor: 21000, duration: 50,
    }],
  };
  bookingContext.businesses.push(wellness);
  await configure(request, { bookingContext });
  const profile = await openProfile(page);
  const atelier = profile.getByRole('group', { name: 'Atelier Share Studio', exact: true });
  const spa = profile.getByRole('group', { name: 'Wellness House', exact: true });
  await expect(atelier.getByRole('button')).toHaveCount(2);
  await expect(spa.getByRole('button')).toHaveCount(1);
  await expect(profile.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toHaveCount(0);

  // The photo is part of the selection target, including when it is a sibling
  // of the native button whose hit area covers the entire venue row.
  const photo = atelier.locator('img').first();
  await photo.scrollIntoViewIfNeeded();
  const bounds = await photo.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  const oldTown = atelier.getByRole('button', { name: /Atelier Share Studio.*Old Town venue/ });
  const north = atelier.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
  const garden = spa.getByRole('button', { name: /Wellness House.*Garden venue/ });
  await expect(oldTown).toHaveAttribute('aria-pressed', 'true');
  const oldTownServices = await venueServices(page, oldTown);
  await expectServicesBeforeNextVenue(oldTown, north);
  await expect(oldTownServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  const haircut = profile.getByRole('button', { name: 'Add Fixture haircut', exact: true });
  await expect(haircut).toContainText(/120[.,]00/);
  await expect(haircut).toContainText('30m');
  await haircut.click();
  const book = profile.getByRole('button', { name: 'Book with Mara', exact: true });
  await expect(book).toBeEnabled();

  await north.focus();
  await page.keyboard.press('Enter');
  await expect(north).toHaveAttribute('aria-pressed', 'true');
  await expect(north).toHaveAttribute('aria-expanded', 'true');
  await expect(oldTown).toHaveAttribute('aria-pressed', 'false');
  await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
  await expect(oldTownServices).toBeHidden();
  await expect(oldTownServices.getByRole('button')).toHaveCount(0);
  const northServices = await venueServices(page, north);
  await expectServicesBeforeNextVenue(north, garden);
  await expect(northServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await expect(haircut).toContainText(/180[.,]00/);
  await expect(haircut).toContainText('45m');
  await expect(book).toBeDisabled();
  await haircut.click();
  await expect(book).toBeEnabled();

  await spa.getByText('Garden venue', { exact: true }).click();
  await expect(garden).toHaveAttribute('aria-pressed', 'true');
  await expect(garden).toHaveAttribute('aria-expanded', 'true');
  await expect(north).toHaveAttribute('aria-pressed', 'false');
  await expect(north).toHaveAttribute('aria-expanded', 'false');
  await expect(northServices).toBeHidden();
  await expect(northServices.getByRole('button')).toHaveCount(0);
  await expect(haircut).toHaveCount(0);
  const massage = profile.getByRole('button', { name: 'Add Fixture massage', exact: true });
  const gardenServices = await venueServices(page, garden);
  await expect(gardenServices.getByRole('button', { name: 'Add Fixture massage', exact: true })).toBeVisible();
  await expect(profile.getByRole('heading', { name: 'Services', exact: true })).toHaveCount(1);
  await expect(massage).toContainText(/210[.,]00/);
  await expect(massage).toContainText('50m');
  await expect(book).toBeDisabled();
});

test('venue services keep their own menu during a smooth close and recover from interrupted switching', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await configure(request, { bookingContext: contextFixture(2) });
  const profile = await openProfile(page);
  const oldTown = profile.getByRole('button', { name: /Atelier Share Studio.*Old Town venue/ });
  const north = profile.getByRole('button', { name: /Atelier Share Studio.*North venue/ });
  await oldTown.click();
  const oldTownServices = await venueServices(page, oldTown);
  const northServices = await venueServices(page, north);
  await expect(oldTownServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await oldTownServices.evaluate(async (panel) => {
    await Promise.all(panel.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
  });
  await oldTownServices.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click();
  const book = profile.getByRole('button', { name: 'Book with Mara', exact: true });
  await expect(book).toBeEnabled();

  // Freeze the outgoing transition so the closing state can be checked without
  // racing a short animation or asserting implementation-specific keyframes.
  const oldPanelId = await oldTown.getAttribute('aria-controls');
  const closing = await north.evaluate(async (button, outgoingId) => {
    (button as HTMLButtonElement).click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const panel = document.getElementById(outgoingId || '');
    if (!panel) return { transitionFound: false, earlyHeight: 0, lateHeight: 0 };
    const animations = panel.getAnimations({ subtree: true });
    const grid = animations.find((animation) => animation instanceof CSSTransition &&
      animation.transitionProperty === 'grid-template-rows');
    if (!grid) return { transitionFound: false, earlyHeight: 0, lateHeight: 0 };
    for (const animation of animations) animation.pause();
    const duration = Number(grid.effect?.getTiming().duration) || 0;
    grid.currentTime = duration * 0.25;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const earlyHeight = panel.getBoundingClientRect().height;
    grid.currentTime = duration * 0.75;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return { transitionFound: true, earlyHeight, lateHeight: panel.getBoundingClientRect().height };
  }, oldPanelId);
  expect(closing.transitionFound, 'The old menu collapses through a grid transition instead of disappearing immediately').toBeTruthy();
  expect(closing.earlyHeight).toBeGreaterThan(closing.lateHeight);
  expect(closing.lateHeight).toBeGreaterThan(0);
  await expect(oldTown).toHaveAttribute('aria-expanded', 'false');
  await expect(oldTownServices).toHaveAttribute('aria-hidden', 'true');
  await expect(oldTownServices).toHaveAttribute('inert', '');
  await expect(oldTownServices).toContainText(/120[.,]00/);
  await expect(oldTownServices).toContainText('30m');
  await expect(oldTownServices).not.toContainText(/180[.,]00/);
  expect(await oldTownServices.locator('button').count()).toBeGreaterThan(0);
  await expect(oldTownServices.getByRole('button')).toHaveCount(0);
  await expect(northServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toContainText(/180[.,]00/);
  await expect(profile.getByRole('heading', { name: 'Services', exact: true })).toHaveCount(1);
  await expect(book).toBeDisabled();

  // Inert outgoing controls cannot receive the pointer, even while retained
  // visually to complete the closing motion.
  expect(await oldTownServices.locator('button').first().evaluate((button) => {
    const bounds = button.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit !== button && !button.contains(hit);
  })).toBeTruthy();

  await oldTown.evaluate((button) => (button as HTMLButtonElement).click());
  await expect(oldTown).toHaveAttribute('aria-expanded', 'true');
  await expect(oldTownServices).not.toHaveAttribute('aria-hidden', 'true');
  await expect(oldTownServices).not.toHaveAttribute('inert', '');
  const restoredHaircut = oldTownServices.getByRole('button', { name: 'Add Fixture haircut', exact: true });
  await expect(restoredHaircut).toContainText(/120[.,]00/);
  await expect(restoredHaircut).toContainText('30m');
  await expect(restoredHaircut).not.toContainText(/180[.,]00/);
  await expect(book).toBeDisabled();
  await oldTownServices.evaluate(async (panel) => {
    const animations = panel.getAnimations({ subtree: true });
    for (const animation of animations) if (animation.playState === 'paused') animation.play();
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
  });

  await north.click();
  await expect(oldTownServices).toBeHidden();
  await expect(oldTownServices).toContainText('Fixture haircut');
  await expect(oldTownServices).toContainText(/120[.,]00/);
  await expect(oldTownServices).toHaveAttribute('inert', '');
  await expect(oldTownServices).toHaveAttribute('aria-hidden', 'true');
  await expect(northServices.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toContainText(/180[.,]00/);
  await expect(profile.getByRole('heading', { name: 'Services', exact: true })).toHaveCount(1);
});

test('professional reviews preserve client details and expand existing reviews without duplicates', async ({ page, request }) => {
  const comments = [
    'A thoughtful visit.\nThe result was exactly what I hoped for.',
    'Clear advice and a careful finish.',
    'A welcoming place with time to explain every step.',
    'Very pleased with the service.',
    'The fifth client review remains available when the list expands.',
  ];
  const names = [
    ['Alexandra-Maria', 'Constantinescu-Popescu'], ['Bogdan', 'N.'],
    ['Ioana', 'M.'], ['Andrei', 'P.'], ['Elena', 'D.'],
  ];
  const reviews = names.map(([firstName, lastName], index) => ({
    id: 701 + index, rating: index === 1 ? 4 : 5, comment: comments[index],
    createdAt: `2026-10-${20 - index}T12:00:00Z`,
    customer: { firstName, lastName, profileImage: index === 0 ? IMAGE : null },
  }));
  await configure(request, {
    profile: { ...profileFixture(), reviews, reviewStats: { totalCount: 5, averageRating: 4.8 } },
  });
  const profile = await openProfile(page);
  await expect(profile.getByText('Alexandra-Maria Constantinescu-Popescu', { exact: true })).toBeVisible();
  await expect(profile.getByText(comments[0], { exact: true })).toHaveText(comments[0]);
  await expect(profile.locator('time[datetime="2026-10-20T12:00:00Z"]')).toBeVisible();
  await expect(profile.getByText(comments[4], { exact: true })).toHaveCount(0);
  await profile.getByRole('button', { name: 'Show more reviews', exact: true }).click();
  for (const comment of comments) await expect(profile.getByText(comment, { exact: true })).toHaveCount(1);
  await expect(profile.getByRole('button', { name: 'Show more reviews', exact: true })).toHaveCount(0);
  expect((await inspect(request)).requests.filter(item => item.path.endsWith('/team-member/301/reviews'))).toHaveLength(0);

  await configure(request, { profile: profileFixture() });
  const romanianProfile = await openProfile(page, 'ro');
  await expect(romanianProfile.getByText('Nicio recenzie încă', { exact: true })).toBeVisible();
  await expect(romanianProfile.getByText('Aici vor apărea recenziile clienților.', { exact: true })).toHaveCount(0);
});

test('hidden pricing and professional selection survive the public page booking handoff', async ({ context, page, request, baseURL }) => {
  await configure(request, { bookingContext: contextFixture(1, false), signedIn: true });
  await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
  const profile = await openProfile(page);
  const service = profile.getByRole('button', { name: 'Add Fixture haircut', exact: true });
  await expect(service).toContainText('Request quote');
  await expect(service).not.toContainText(/120[.,]00/);
  await service.click();
  await profile.getByRole('button', { name: 'Book with Mara', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true });
  await expect(drawer).toBeVisible();
  await drawer.locator('button[data-date="2030-10-22"]').click();
  await drawer.getByRole('button', { name: /^10:00/ }).click();
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeVisible();
  await expect(drawer).toContainText('Request quote');
  await expect(drawer).not.toContainText(/120[.,]00/);
  const state = await inspect(request);
  const calendar = state.requests.find(item => item.path === '/marketplace/public/booking/calendar');
  expect(calendar?.body).toMatchObject({ businessId: 101, locationId: 201, services: [{ serviceId: 401, teamMemberId: 301 }] });
});

test('booking Back and close restore the public profile without navigating away or losing its selection', async ({ page, request, baseURL }) => {
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click();
  const book = profile.getByRole('button', { name: 'Book with Mara', exact: true });
  await book.click();
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Back to profile', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(profile.getByRole('button', { name: 'Remove Fixture haircut', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(book).toBeFocused();
  await book.click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
  await expect(profile.getByRole('button', { name: 'Remove Fixture haircut', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(`${baseURL}${path}`);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(1);
});

test('successful booking navigates to Appointments without the profile dismissal overriding the destination', async ({ context, page, request, baseURL }) => {
  await configure(request, { signedIn: true });
  await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click();
  await profile.getByRole('button', { name: 'Book with Mara', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true });
  await drawer.locator('button[data-date="2030-10-22"]').click();
  await drawer.getByRole('button', { name: /^10:00/ }).click();
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await drawer.getByRole('button', { name: 'View appointment', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/appointments`);
  await expect(page.getByRole('heading', { name: 'No appointments yet', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const submissions = (await inspect(request)).requests.filter(item => item.path === '/marketplace/appointments/book');
  expect(submissions).toHaveLength(1);
  expect(submissions[0].body).toMatchObject({ listingId: 11, locationId: 201, services: [{ serviceId: 401, staffId: 301 }] });
});

test('venue navigation follows its location link without a competing profile dismissal navigation', async ({ page, baseURL }) => {
  const profile = await openProfile(page);
  const location = profile.getByRole('link', { name: /Atelier Share Studio.*Old Town venue/ });
  await expect(location).toHaveAttribute('href', '/business/share-old-town');
  await location.click();
  await expect(page).toHaveURL(`${baseURL}/business/share-old-town`);
  await expect(publicProfile(page)).toHaveCount(0);
});

test('a venue without a stored slug retains the supported numeric link fallback', async ({ page, request, baseURL }) => {
  const bookingContext: TeamMemberBookingContext = contextFixture();
  bookingContext.businesses[0].locations[0].slug = null;
  await configure(request, { bookingContext });
  const profile = await openProfile(page);
  const location = profile.getByRole('link', { name: /Atelier Share Studio.*Old Town venue/ });
  await expect(location).toHaveAttribute('href', '/business/201');
  await location.click();
  await expect(page).toHaveURL(`${baseURL}/business/201`);
  await expect(publicProfile(page)).toHaveCount(0);
});

test('booking context failure keeps the public profile and recovers through the existing retry action', async ({ page, request }) => {
  await configure(request, { contextStatus: 503 });
  const profile = await openProfile(page);
  await expect(profile.getByText(ABOUT, { exact: true })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'We’re having a technical problem. Try again in a moment.' })).toBeVisible();
  await expect(profile.getByText("Online booking isn't available for this professional yet.", { exact: true })).toHaveCount(0);
  await configure(request, { contextStatus: 200 });
  await profile.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(profile.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
});

test('an unavailable booking context preserves the profile without an error toast or retry loop', async ({ page, request }) => {
  await configure(request, { contextStatus: 404 });
  const profile = await openProfile(page);
  await expect(profile.getByText(ABOUT, { exact: true })).toBeVisible();
  await expect(profile.getByText("Online booking isn't available for this professional yet.", { exact: true })).toBeVisible();
  await expect(profile.getByRole('button', { name: 'Try again', exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(1);
});

for (const locale of ['en', 'ro'] as const) {
  test(`initial missing booking metadata shows ${locale.toUpperCase()} action feedback and retains the profile menu`, async ({ page, request }) => {
    const bookingContext: TeamMemberBookingContext = contextFixture();
    bookingContext.businesses[0].businessCurrency = '';
    await configure(request, { bookingContext });
    const profile = await openProfile(page, locale);
    await expect(profile.getByText(ABOUT, { exact: true })).toBeVisible();
    await expect(profile.getByText('Fixture haircut', { exact: true })).toBeVisible();
    const message = locale === 'ro'
      ? 'Detaliile de programare nu sunt disponibile pentru această locație.'
      : 'Booking details are unavailable for this location.';
    await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
    await expect(profile.getByRole('button', { name: /^(Add|Adaugă) Fixture haircut$/ })).toHaveCount(0);
    expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/public/team-member/301/booking-context')).toHaveLength(1);
  });
}

test('sign-in returns to the public page and resumes the same booking selection', async ({ page, request, baseURL }) => {
  const profile = await openProfile(page);
  await profile.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click();
  await profile.getByRole('button', { name: 'Book with Mara', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true });
  await drawer.locator('button[data-date="2030-10-22"]').click();
  await drawer.getByRole('button', { name: /^10:00/ }).click();
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
  await drawer.getByRole('button', { name: 'Sign in to book', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\?/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(path);
  await expect(drawer).toBeHidden();
  await page.getByLabel('Email', { exact: true }).fill('share-fixture@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('Fixture-password-123!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}${path}`);
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeVisible();
  await expect(drawer).toContainText('Fixture haircut');
  await expect(drawer).toContainText(PERSON);
  expect((await inspect(request)).requests.filter(item => item.path === '/marketplace/appointments/book')).toHaveLength(0);
});

test('the public profile fits desktop and mobile widths and lets the document scroll', async ({ page }) => {
  const profile = await openProfile(page);
  await expect(profile.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('a professional without bookable venues still has a useful public profile', async ({ page, request }) => {
  await configure(request, { bookingContext: contextFixture(0) });
  const profile = await openProfile(page);
  await expect(profile.getByText("Online booking isn't available for this professional yet.", { exact: true })).toBeVisible();
  await expect(profile.getByText(ABOUT, { exact: true })).toBeVisible();
  await expect(profile.getByRole('button', { name: 'Share', exact: true })).toBeVisible();
  await expect(profile.getByRole('button', { name: 'Book with Mara', exact: true })).toHaveCount(0);
});

test('portfolio navigation closes back to the public page and restores keyboard focus', async ({ page }) => {
  const profile = await openProfile(page);
  const photos = profile.getByRole('button', { name: /^View portfolio photo \d+ \(Mara Share\)$/ });
  await expect(photos).toHaveCount(2);
  await expect(photos.nth(0)).toHaveAccessibleName('View portfolio photo 1 (Mara Share)');
  await expect(photos.nth(1)).toHaveAccessibleName('View portfolio photo 2 (Mara Share)');
  await expect(photos.nth(0).locator('img')).toHaveAttribute('alt', 'Mara Share, portfolio photo 1');
  await expect(photos.nth(1).locator('img')).toHaveAttribute('alt', 'Mara Share, portfolio photo 2');
  await photos.first().click();
  const gallery = page.getByRole('dialog');
  await expect(gallery).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(gallery.getByRole('status')).toContainText('2');
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(profile.getByRole('heading', { name: PERSON, level: 1 })).toBeVisible();
  await expect(photos.first()).toBeFocused();
});

// Keep fixture shapes checked against the production contract without casting
// the runtime API responses used by the tests.
const fixtureContract: TeamMemberBookingContext = contextFixture();
void fixtureContract;
const listingContract: ListingDetail = listingFixture();
void listingContract;
const websiteContract: PublicWebsite = websiteFixture();
void websiteContract;
