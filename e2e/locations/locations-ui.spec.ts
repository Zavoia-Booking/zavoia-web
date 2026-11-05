import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import type { ListingDetail } from '../../src/lib/api/marketplace/types';
import { availabilityFixture, listingFixture } from '../professionals/fixtures.mjs';

const api = `http://127.0.0.1:${process.env.LOCATIONS_FIXTURE_PORT || '4319'}`;
const phone = '+40722123456';
const photoPrefix = '/__professionals-fixtures__/';

type FixtureState = {
  requests: Array<{ path: string; method: string; body: unknown }>;
  blockedMutations: string[];
};

function locationFixture(scenario: string): ListingDetail {
  const listing: ListingDetail = listingFixture();
  // A distinct API URL per scenario also separates Next's server fetch cache.
  listing.slug = `location-${scenario}`;
  listing.location.slug = listing.slug;
  listing.location.phone = phone;
  listing.averageRating = null;
  listing.totalReviews = 0;
  return listing;
}

async function configure(request: APIRequestContext, listing: ListingDetail, signedIn = false) {
  const response = await request.post(`${api}/__control`, {
    data: { reset: true, patch: { listing, signedIn } },
  });
  expect(response.ok()).toBeTruthy();
}

async function inspect(request: APIRequestContext): Promise<FixtureState> {
  return (await request.get(`${api}/__control`)).json();
}

async function openLocation(page: Page, listing: ListingDetail, locale: 'en' | 'ro' = 'en') {
  await page.goto(`${locale === 'ro' ? '/ro' : ''}/business/${listing.slug}`);
  await expect(page.getByRole('heading', { name: listing.location.name, exact: true, level: 1 })).toBeVisible();
  return page.getByRole('main');
}

async function expectReachable(page: Page, control: Locator) {
  await control.scrollIntoViewIfNeeded();
  await control.click({ trial: true });
  const bounds = await control.boundingBox();
  expect(bounds).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function textBaseline(content: Locator) {
  return content.evaluate(element => {
    // A zero-size inline box exposes the browser's text baseline directly;
    // comparing bounding-box bottoms would be wrong for different font sizes.
    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
    element.prepend(marker);
    const baseline = marker.getBoundingClientRect().top;
    marker.remove();
    return baseline;
  });
}

async function expectIdentityFits(page: Page, main: Locator, listing: ListingDetail, placeLabel: string) {
  await page.evaluate(() => document.fonts.ready);
  const heading = main.getByRole('heading', { name: listing.location.name, exact: true, level: 1 });
  const identity = main.locator('header').filter({ has: page.getByRole('heading', { name: listing.location.name, exact: true, level: 1 }) });
  const address = identity.getByText(listing.location.address!, { exact: true });
  const brand = identity.getByRole('link').filter({ hasText: listing.name });
  const rating = identity.getByRole('button', { name: /^(?:Read reviews|Citește recenziile):/ });
  const place = identity.getByRole('link', { name: `${placeLabel}: ${listing.location.address}`, exact: true });
  const gallery = main.getByRole('region').filter({ has: page.getByRole('button', { name: /, (?:photo|fotografia) 1$/, exact: false }) });

  await expect(heading).toHaveText(listing.location.name);
  await expect(address).toHaveText(listing.location.address!);
  await expect.poll(() => page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  // Read all bounds in one browser task. Separate protocol calls can straddle
  // a viewport resize and compare the old rail with the newly wrapped text.
  const geometry = await identity.evaluate((header, elements) => {
    const bounds = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const fragments = (element: Element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, bottom: rect.bottom }));
    };
    return {
      identityBounds: bounds(header), brandBounds: bounds(elements.brand),
      brandNameBounds: bounds(elements.brandName), brandArrowBounds: bounds(elements.brandArrow),
      ratingBounds: bounds(elements.rating), addressGroupBounds: bounds(elements.place),
      galleryBounds: bounds(elements.gallery),
      headingFragments: fragments(elements.heading), addressFragments: fragments(elements.address),
    };
  }, {
    heading: (await heading.elementHandle())!, address: (await address.elementHandle())!,
    brand: (await brand.elementHandle())!, brandName: (await brand.getByText(listing.name, { exact: true }).elementHandle())!,
    brandArrow: (await brand.locator('svg').last().elementHandle())!, rating: (await rating.elementHandle())!,
    place: (await place.elementHandle())!, gallery: (await gallery.elementHandle())!,
  });
  const { identityBounds, brandBounds, brandNameBounds, brandArrowBounds, ratingBounds, addressGroupBounds, galleryBounds } = geometry;
  for (const [fragments, nextTop] of [[geometry.headingFragments, ratingBounds.y], [geometry.addressFragments, brandBounds.y]] as const) {
    // Range rectangles include text hidden by a line clamp or ellipsis, so this
    // checks the full copy fits instead of relying on accessible text alone.
    expect(fragments.length).toBeGreaterThan(0);
    for (const fragment of fragments) {
      expect(fragment.left).toBeGreaterThanOrEqual(identityBounds.x - 1);
      expect(fragment.right).toBeLessThanOrEqual(identityBounds.x + identityBounds.width + 1);
      expect(fragment.bottom, 'Full text does not overlap the following identity content').toBeLessThanOrEqual(nextTop + 1);
    }
  }
  expect(ratingBounds.y + ratingBounds.height, 'Reviews precede the address').toBeLessThanOrEqual(addressGroupBounds.y + 1);
  expect(addressGroupBounds.y + addressGroupBounds.height, 'The brand closes the identity below the address').toBeLessThanOrEqual(brandBounds.y + 1);
  expect(brandArrowBounds.x - (brandNameBounds.x + brandNameBounds.width), 'The brand arrow follows the brand name').toBeLessThanOrEqual(16);
  await expect(identity.locator('a, button').last()).toHaveAttribute('href', /\/brand\//);
  const scoreBaseline = await textBaseline(rating.getByText(/^\d[.,]\d$/));
  const countBaseline = await textBaseline(rating.getByText(/\d[\d,.]* (?:de )?(?:reviews|recenzii)$/));
  expect(Math.abs(scoreBaseline - countBaseline), 'Score and review count share a text baseline').toBeLessThanOrEqual(1);
  const overlapsGallery = identityBounds.x < galleryBounds.x + galleryBounds.width &&
    identityBounds.x + identityBounds.width > galleryBounds.x &&
    identityBounds.y < galleryBounds.y + galleryBounds.height &&
    identityBounds.y + identityBounds.height > galleryBounds.y;
  expect(overlapsGallery, 'Long identity content remains separate from the gallery').toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
}

async function expectMapTarget(map: Locator, listing: ListingDetail, locale: 'en' | 'ro') {
  const target = new URL((await map.getAttribute('href'))!, 'http://localhost');
  expect(target.pathname).toBe(locale === 'ro' ? '/ro/search' : '/search');
  expect(Object.fromEntries(target.searchParams)).toMatchObject({
    lat: String(listing.location.latitude), lng: String(listing.location.longitude),
    radius: '20', focus: String(listing.locationId),
  });
  expect(await map.evaluate(element => ({
    tag: element.nextElementSibling?.tagName,
    name: element.nextElementSibling?.getAttribute('aria-label'),
  })), 'The toolbar map action immediately precedes Share').toEqual({
    tag: 'BUTTON', name: locale === 'ro' ? 'Distribuie' : 'Share',
  });
}

async function expectPlaceTarget(place: Locator, listing: ListingDetail) {
  const target = new URL((await place.getAttribute('href'))!);
  expect(target.origin).toBe('https://www.google.com');
  expect(target.pathname, 'The address opens the place, not a route').toBe('/maps/search/');
  const { latitude, longitude, address } = listing.location;
  expect(Object.fromEntries(target.searchParams)).toEqual({
    api: '1', query: address || `${latitude},${longitude}`,
  });
  await expect(place).toHaveAttribute('target', '_blank');
  await expect(place).toHaveAttribute('rel', /\bnoreferrer\b/);
}

const seoDescription = 'Thoughtful care at our Old Town venue, close to the historic centre.';
const seoReview = `${'The team explained every step and made the visit comfortable. '.repeat(18)}The final result matched what we discussed at the consultation.`;
const seoTitle = 'Atelier Share Studio – Old Town venue, Bucharest';

function seoFixture() {
  // Numeric aliases share one cached API URL; keep their payload identical
  // across locale and sharing scenarios, while other fixtures use unique slugs.
  const listing = locationFixture('seo-canonical');
  listing.location.description = `  ${seoDescription}  `;
  listing.location.email = 'oldtown@example.invalid';
  listing.location.workingHours = {
    monday: { isOpen: true, open: '09:00', close: '19:00' },
    sunday: { isOpen: false, open: '', close: '' },
  };
  listing.reviews = [{
    id: 901, type: 'location', rating: 5, comment: seoReview,
    createdAt: '2026-10-15T10:00:00Z',
    customer: { firstName: 'Seo', lastName: 'F.', profileImage: null }, teamMember: null,
  }];
  listing.reviewStats = { totalCount: 1, averageRating: 5, ratingDistribution: { 5: 1 } };
  listing.averageRating = 5;
  listing.totalReviews = 1;
  return listing;
}

async function locationPanel(page: Page, name: string | RegExp) {
  const id = await page.getByRole('tab', { name, exact: true, includeHidden: true }).getAttribute('aria-controls');
  expect(id, 'A location tab identifies its real content panel').toBeTruthy();
  return page.locator(`[id=${JSON.stringify(id)}]`);
}


test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'zw-consent', value: 'denied', url: baseURL! }]);
  await context.route(`**${photoPrefix}**`, route => route.request().url().endsWith('broken.svg')
    ? route.fulfill({ status: 404, body: 'Missing fixture image' })
    : route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#b94b2d"/></svg>',
    }));
});

test.afterEach(async ({ request }) => {
  const state = await inspect(request);
  expect(state.blockedMutations, 'Unexpected mutations must never leave the fixture API').toEqual([]);
  expect(state.requests.filter(item => item.path === '/marketplace/appointments/book')).toEqual([]);
});

test.describe('location SEO', () => {
  for (const locale of ['en', 'ro'] as const) {
    test(`${locale.toUpperCase()} numeric links contain canonical metadata and real About and review nodes in server HTML`, async ({ browser, request, baseURL }) => {
      const listing = seoFixture();
      await configure(request, listing);
      const prefix = locale === 'ro' ? '/ro' : '';
      const noScript = await browser.newContext({ javaScriptEnabled: false, userAgent: 'facebookexternalhit/1.1' });
      try {
        const page = await noScript.newPage();
        const response = await page.goto(`${baseURL}${prefix}/business/201?utm_source=fixture`);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(`${seoTitle} | Zavoia`);
        // The route's loading.tsx streams the real main into a hidden segment;
        // React reveals it with JavaScript. Inspect the parsed content nodes,
        // not their visibility or strings duplicated in serialized RSC props.
        await expect(page.getByRole('heading', { level: 1, name: listing.location.name, exact: true, includeHidden: true })).toHaveCount(1);
        const head = page.locator('head');
        await expect(head.locator('meta[name="description"]')).toHaveAttribute('content', seoDescription);
        for (const property of ['og:title', 'twitter:title']) {
          await expect(head.locator(`meta[property="${property}"], meta[name="${property}"]`)).toHaveAttribute('content', seoTitle);
        }
        for (const property of ['og:description', 'twitter:description']) {
          await expect(head.locator(`meta[property="${property}"], meta[name="${property}"]`)).toHaveAttribute('content', seoDescription);
        }
        const canonical = `https://zavoia.com${prefix}/business/${listing.slug}`;
        await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
        await expect(head.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
        for (const [language, languagePrefix] of [['en', ''], ['ro', '/ro'], ['x-default', '']] as const) {
          await expect(head.locator(`link[rel="alternate"][hreflang="${language}"]`))
            .toHaveAttribute('href', `https://zavoia.com${languagePrefix}/business/${listing.slug}`);
        }
        await expect(head.locator('meta[property="og:site_name"]')).toHaveAttribute('content', 'Zavoia');
        await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute('content', locale === 'ro' ? 'ro_RO' : 'en_US');
        await expect(head.locator('meta[property="og:locale:alternate"]')).toHaveAttribute('content', locale === 'ro' ? 'en_US' : 'ro_RO');
        await expect(head.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://zavoia.com${listing.featuredImage}`);
        await expect(head.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', seoTitle);

        const about = await locationPanel(page, locale === 'ro' ? 'Despre' : 'About');
        const reviews = await locationPanel(page, locale === 'ro' ? /^Recenzii/ : /^Reviews/);
        for (const panel of [about, reviews]) await expect(panel).toHaveAttribute('hidden', '');
        await expect(about.getByText(seoDescription, { exact: true })).toHaveCount(1);
        await expect(about.locator(`a[href="tel:${phone}"]`)).toHaveCount(1);
        await expect(about.locator('a[href="mailto:oldtown@example.invalid"]')).toHaveCount(1);
        await expect(about.locator('dl')).toContainText('09:00 - 19:00');
        await expect(reviews.locator('article')).toContainText(seoReview);
        await expect(reviews.getByText(seoReview, { exact: true })).toHaveCount(1);
        const services = await locationPanel(page, locale === 'ro' ? /^Servicii/ : /^Services/);
        await expect(services).not.toHaveAttribute('hidden', '');
        await expect(services).toContainText('Fixture haircut');
        expect((await inspect(request)).requests.filter(item => /\/reviews(?:\/|$)/.test(item.path))).toEqual([]);
      } finally {
        await noScript.close();
      }
    });

    test(`${locale.toUpperCase()} blank location copy gets a factual fallback and the shared social image`, async ({ browser, request, baseURL }) => {
      const listing = locationFixture(`seo-fallback-${locale}`);
      listing.name = '  Atelier Share Studio  ';
      listing.location.name = '  Old Town venue  ';
      listing.location.city = '  Bucharest  ';
      listing.location.description = ' \n ';
      listing.description = 'Brand-wide copy must not replace this branch identity.';
      listing.featuredImage = '  ';
      listing.portfolioImages = [];
      listing.logo = null;
      listing.allowOnlineBooking = false;
      listing.location.allowOnlineBooking = false;
      await configure(request, listing);
      const noScript = await browser.newContext({ javaScriptEnabled: false, userAgent: 'facebookexternalhit/1.1' });
      try {
        const page = await noScript.newPage();
        const response = await page.goto(`${baseURL}${locale === 'ro' ? '/ro' : ''}/business/${listing.slug}`);
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(`${seoTitle} | Zavoia`);
        // No industry or country in this fixture: the city as written, and services without online booking.
        const description = locale === 'ro'
          ? 'Atelier Share Studio – Old Town venue din Bucharest. Vezi serviciile pe Zavoia.'
          : 'Atelier Share Studio – Old Town venue in Bucharest. View services on Zavoia.';
        const head = page.locator('head');
        await expect(head.locator('meta[name="description"]')).toHaveAttribute('content', description);
        await expect(head.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
        await expect(head.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
        const image = 'https://zavoia.com/brand/home-social.png';
        await expect(head.locator('meta[property="og:image"]')).toHaveAttribute('content', image);
        await expect(head.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
        await expect(head.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
        await expect(head.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', 'Zavoia. Local services. On your schedule.');
        await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
        await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image);
      } finally {
        await noScript.close();
      }
    });

    test(`${locale.toUpperCase()} sharing resolves numeric aliases and retains only the selected tab`, async ({ context, page, request, baseURL }) => {
      const listing = seoFixture();
      await configure(request, listing);
      await context.addInitScript(() => {
        const fixture = window as unknown as { __locationCopies: string[] };
        fixture.__locationCopies = [];
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true, value: { writeText: async (value: string) => { fixture.__locationCopies.push(value); } },
        });
      });
      const prefix = locale === 'ro' ? '/ro' : '';
      await page.goto(`${prefix}/business/201?tab=about&utm_source=fixture&member=999#contact`);
      await expect(page.getByRole('tab', { name: locale === 'ro' ? 'Despre' : 'About', exact: true })).toHaveAttribute('aria-selected', 'true');
      const share = page.getByRole('main').getByRole('button', { name: locale === 'ro' ? 'Distribuie' : 'Share', exact: true });
      const copied = () => page.evaluate(() => (window as unknown as { __locationCopies: string[] }).__locationCopies);
      await share.click();
      const canonical = `${baseURL}${prefix}/business/${listing.slug}`;
      await expect.poll(copied).toEqual([`${canonical}?tab=about`]);
      await page.getByRole('tab', { name: locale === 'ro' ? /^Servicii/ : /^Services/ }).click();
      await share.click();
      await expect.poll(copied).toEqual([`${canonical}?tab=about`, canonical]);
    });
  }

  test('social cards prefer an available gallery photo, then use a logo without inventing photo dimensions', async ({ browser, request, baseURL }) => {
    const noScript = await browser.newContext({ javaScriptEnabled: false, userAgent: 'facebookexternalhit/1.1' });
    try {
      const page = await noScript.newPage();
      for (const source of ['gallery', 'logo'] as const) {
        const listing = locationFixture(`seo-social-${source}`);
        listing.featuredImage = null;
        listing.logo = '/__professionals-fixtures__/brand.svg';
        listing.portfolioImages = source === 'gallery' ? [' ', '/__professionals-fixtures__/venue.svg'] : [];
        await configure(request, listing);
        await page.goto(`${baseURL}/business/${listing.slug}`);
        const head = page.locator('head');
        const image = `https://zavoia.com/__professionals-fixtures__/${source === 'gallery' ? 'venue' : 'brand'}.svg`;
        await expect(head.locator('meta[property="og:image"]')).toHaveAttribute('content', image);
        await expect(head.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image);
        await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute('content', source === 'gallery' ? 'summary_large_image' : 'summary');
        await expect(head.locator('meta[property="og:image:width"], meta[property="og:image:height"]')).toHaveCount(0);
      }
    } finally {
      await noScript.close();
    }
  });

  test('service counts stay outside heading text while category links retain keyboard navigation', async ({ page, request }) => {
    const listing = locationFixture('seo-category-headings');
    const category = { id: 71, name: 'Personal consultation, colour analysis and styling', description: null, color: '#b94b2d' };
    listing.serviceCategories = [category];
    const service = { ...listing.services[0], categoryId: category.id, category };
    listing.services = [service, { ...service, id: 402, uuid: 'second-category-service', name: 'Fixture styling' }];
    listing.bundles = [{
      id: 501, uuid: 'heading-package', name: 'Care package', description: null,
      priceType: 'fixed', priceAmountMinor: 15000, duration: 60,
      priceFromMinor: 15000, priceToMinor: 15000, priceVariesByStaff: false,
      durationMinMinutes: 60, durationMaxMinutes: 60, durationVariesByStaff: false,
      bookableStaffCount: 1, locationIds: [listing.locationId], services: [service],
    }];
    await configure(request, listing);
    const main = await openLocation(page, listing);
    const panel = await locationPanel(page, /^Services/);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const [name, count] of [['Bundles', '1'], [category.name, '2']]) {
        const heading = panel.getByRole('heading', { name, exact: true, level: 2 });
        // SEO extractors read textContent, even when a count is aria-hidden.
        await expect(heading).toHaveText(name);
        await expect(heading.locator('..').locator(':scope > span[aria-hidden="true"]')).toHaveText(count);
      }
      if (viewport.width < 600) await panel.locator('details > summary').click();
      const jump = panel.getByRole('link', { name: category.name, exact: true }).filter({ visible: true });
      const target = await jump.getAttribute('href');
      await jump.focus();
      await jump.press('Enter');
      const heading = panel.getByRole('heading', { name: category.name, exact: true, level: 2 });
      await expect(heading).toBeFocused();
      expect(target).toBe(`#${await heading.getAttribute('id')}`);
      if (viewport.width < 600) await expect(panel.locator('details')).not.toHaveAttribute('open', '');
      await page.keyboard.press('Tab');
      await expect(panel.getByRole('button', { name: `Add ${service.name}`, exact: true })).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    }
    await expect(main.getByRole('heading', { level: 1 })).toHaveText(listing.location.name);
  });

  test('inactive team and review portraits wait for their tab without deferring the header identity', async ({ page, request }) => {
    const listing = seoFixture();
    listing.slug = 'location-seo-lazy-portraits';
    listing.location.slug = listing.slug;
    listing.logo = `${photoPrefix}header-brand.svg`;
    listing.teamMembers[0].profileImage = `${photoPrefix}hidden-team.svg`;
    listing.reviews[0].customer!.profileImage = `${photoPrefix}hidden-reviewer.svg`;
    await configure(request, listing);
    const requested = new Set<string>();
    page.on('request', outgoing => requested.add(new URL(outgoing.url()).pathname));
    const main = await openLocation(page, listing);
    await expect(main.getByRole('tab', { name: /^Services/ })).toHaveAttribute('aria-selected', 'true');
    const team = await locationPanel(page, /^Team/);
    const reviews = await locationPanel(page, /^Reviews/);
    const about = await locationPanel(page, 'About');
    const teamPortrait = team.locator(`img[src="${listing.teamMembers[0].profileImage}"]`);
    const reviewPortrait = reviews.locator(`img[src="${listing.reviews[0].customer!.profileImage}"]`);
    for (const portrait of [teamPortrait, reviewPortrait, about.locator(`img[src="${listing.logo}"]`)]) {
      await expect(portrait).toHaveAttribute('loading', 'lazy');
    }
    await expect(main.locator('header').locator(`img[src="${listing.logo}"]`)).not.toHaveAttribute('loading', 'lazy');
    await expect.poll(() => requested.has(listing.logo!)).toBe(true);
    expect(requested.has(listing.teamMembers[0].profileImage!)).toBe(false);
    expect(requested.has(listing.reviews[0].customer!.profileImage!)).toBe(false);
    await main.getByRole('tab', { name: /^Team/ }).click();
    await teamPortrait.scrollIntoViewIfNeeded();
    await expect.poll(() => requested.has(listing.teamMembers[0].profileImage!)).toBe(true);
    expect(requested.has(listing.reviews[0].customer!.profileImage!)).toBe(false);
    await main.getByRole('tab', { name: /^Reviews/ }).click();
    await reviewPortrait.scrollIntoViewIfNeeded();
    await expect.poll(() => requested.has(listing.reviews[0].customer!.profileImage!)).toBe(true);
  });

  test('sibling thumbnails use optimized sources without changing their responsive dimensions', async ({ page, request }) => {
    const listing = locationFixture('seo-sibling-image');
    listing.logo = '/brand/home-social.png';
    listing.otherLocations = [{ id: 202, name: 'North venue' }];
    await configure(request, listing);
    const main = await openLocation(page, listing);
    await main.getByRole('tab', { name: 'About', exact: true }).click();
    const about = await locationPanel(page, 'About');
    const sibling = about.getByRole('link', { name: 'North venue', exact: true });
    const photo = sibling.locator('img');
    await expect(photo).toHaveAttribute('src', /^\/_next\/image\?/);
    await expect(photo).toHaveAttribute('srcset', /\s64w,/);
    await expect(photo).toHaveAttribute('sizes', 'auto, 80px');
    await expect(photo).toHaveAttribute('alt', '');
    for (const [viewport, width, height] of [
      [{ width: 1440, height: 900 }, 80, 96],
      [{ width: 390, height: 844 }, 64, 80],
    ] as const) {
      await page.setViewportSize(viewport);
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toHaveCSS('width', `${width}px`);
      await expect(photo).toHaveCSS('height', `${height}px`);
      const imageBounds = (await photo.boundingBox())!;
      const textBounds = (await sibling.getByText('North venue', { exact: true }).boundingBox())!;
      expect(imageBounds.x + imageBounds.width).toBeLessThanOrEqual(textBounds.x);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('long reviews keep their complete text while the existing expansion survives tab changes', async ({ page, request }) => {
    const listing = seoFixture();
    listing.slug = 'location-seo-review-expansion';
    listing.location.slug = listing.slug;
    await configure(request, listing);
    const main = await openLocation(page, listing);
    await main.getByRole('tab', { name: /^Reviews/ }).click();
    const reviews = main.getByRole('tabpanel');
    const text = reviews.getByText(seoReview, { exact: true });
    const more = reviews.getByRole('button', { name: 'more', exact: true });
    await expect(text).toHaveText(seoReview);
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    const collapsedHeight = (await text.boundingBox())!.height;
    await more.click();
    const less = reviews.getByRole('button', { name: 'less', exact: true });
    await expect(less).toHaveAttribute('aria-expanded', 'true');
    expect((await text.boundingBox())!.height).toBeGreaterThan(collapsedHeight);
    await main.getByRole('tab', { name: 'About', exact: true }).click();
    await main.getByRole('tab', { name: /^Reviews/ }).click();
    await expect(less).toHaveAttribute('aria-expanded', 'true');
    await less.click();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(text).toHaveText(seoReview);
    expect((await inspect(request)).requests.filter(item => /\/reviews(?:\/|$)/.test(item.path))).toEqual([]);
  });

  test('review expansion appears only when the current layout actually clips its text', async ({ page, request }) => {
    const listing = seoFixture();
    listing.slug = 'location-seo-review-overflow';
    listing.location.slug = listing.slug;
    const comment = 'Care was thoughtful and the team explained every step clearly. '.repeat(5).trim();
    listing.reviews[0].comment = comment;
    await configure(request, listing);
    await page.setViewportSize({ width: 1920, height: 1080 });
    const main = await openLocation(page, listing);
    await main.getByRole('tab', { name: /^Reviews/ }).click();
    await page.evaluate(() => document.fonts.ready);
    const reviews = main.getByRole('tabpanel');
    const text = reviews.getByText(comment, { exact: true });
    const more = reviews.getByRole('button', { name: 'more', exact: true });
    await expect(text).toHaveText(comment);
    await expect.poll(() => text.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    await expect(more).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await reviews.screenshot({ path: '/tmp/location-seo-reviews-1440.png' });

    await page.setViewportSize({ width: 320, height: 844 });
    await expect.poll(() => text.evaluate(element => element.scrollHeight > element.clientHeight + 1)).toBe(true);
    await expect(more).toBeVisible();
    await reviews.screenshot({ path: '/tmp/location-seo-reviews-320.png' });
    await more.click();
    await expect(reviews.getByRole('button', { name: 'less', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(text).toHaveText(comment);
  });
});

test('hidden pricing remains hidden from the menu through selection and booking review', async ({ context, page, request, baseURL }) => {
  const listing = locationFixture('hidden-pricing');
  listing.additionalSettings = { showPricing: false };
  await configure(request, listing, true);
  await context.addCookies([{ name: 'customerCsrfToken', value: 'professional-ui-fixture', url: baseURL! }]);
  const main = await openLocation(page, listing);
  const service = main.getByRole('button', { name: 'Add Fixture haircut', exact: true });
  await expect(service).toContainText('Request quote');
  await expect(service).not.toContainText(/120[.,]00/);
  await service.click();
  const summary = main.getByRole('complementary');
  await expect(summary).toContainText('Request quote');
  await expect(summary).not.toContainText(/120[.,]00/);
  await main.getByRole('button', { name: 'Book 1 service', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true });
  await drawer.locator('button[data-date="2030-10-22"]').click();
  await drawer.getByRole('button', { name: /^10:00/ }).click();
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeVisible();
  await expect(drawer).toContainText('Request quote');
  await expect(drawer).not.toContainText(/120[.,]00/);
  const calendar = (await inspect(request)).requests.find(item => item.path === '/marketplace/public/booking/calendar');
  expect(calendar?.body).toMatchObject({ businessId: 101, locationId: 201, services: [{ serviceId: 401 }] });
});

test('a published catalog with online booking disabled retains its phone fallback on desktop and mobile', async ({ page, request }) => {
  const listing = locationFixture('phone-only');
  listing.allowOnlineBooking = false;
  listing.location.allowOnlineBooking = false;
  listing.location.latitude = null;
  listing.location.longitude = null;
  await configure(request, listing);
  const main = await openLocation(page, listing);
  await expect(main.getByRole('link', { name: 'See on map', exact: true })).toHaveCount(0);
  await expectPlaceTarget(main.getByRole('link', { name: `Open in Google Maps: ${listing.location.address}`, exact: true }), listing);
  await expect(main.getByRole('tabpanel')).toContainText('Fixture haircut');
  await expect(main.getByRole('button', { name: /^Add / })).toHaveCount(0);
  await expect(main.getByRole('button', { name: /^Book/ })).toHaveCount(0);
  await expect(main.getByRole('complementary')).toContainText('Online booking is unavailable at this location.');
  for (const viewport of [{ width: 1366, height: 650 }, { width: 390, height: 664 }]) {
    await page.setViewportSize(viewport);
    const call = main.getByRole('link', { name: 'Call', exact: true });
    await expect(call).toHaveAttribute('href', `tel:${phone}`);
    await expectReachable(page, call);
  }
  await main.getByRole('tab', { name: 'About', exact: true }).click();
  const about = main.getByRole('tabpanel');
  await expect(about.getByRole('heading', { name: 'Contact', exact: true })).toBeVisible();
  await expect(about.getByRole('link', { name: `Call: ${phone}`, exact: true })).toHaveAttribute('href', `tel:${phone}`);
  await expect(about.getByRole('link', { name: 'Directions', exact: true })).toHaveCount(0);
  await expect(about.getByText(listing.location.address!, { exact: true })).toHaveCount(0);
  await expect(about.locator('a[href*="google.com/maps"]')).toHaveCount(0);
  await expectPlaceTarget(main.locator('header').getByRole('link', { name: `Open in Google Maps: ${listing.location.address}`, exact: true }), listing);
  expect((await inspect(request)).requests.filter(item => item.path.includes('/booking/'))).toEqual([]);
});

test('a package and a variable service with the same numeric ID retain separate selection order and totals', async ({ page, request }) => {
  const listing = locationFixture('mixed-selection');
  const service = listing.services[0];
  Object.assign(service, {
    name: 'Variable haircut', priceToMinor: 18000, priceVariesByStaff: true,
    durationMaxMinutes: 45, durationVariesByStaff: true,
  });
  listing.bundles = [{
    id: service.id, uuid: 'location-fixed-package', name: 'Care package', description: 'A fixed package.',
    priceType: 'fixed', priceAmountMinor: 15000, duration: 90,
    priceFromMinor: 15000, priceToMinor: 15000, priceVariesByStaff: false,
    durationMinMinutes: 90, durationMaxMinutes: 90, durationVariesByStaff: false,
    bookableStaffCount: 1, locationIds: [listing.locationId],
    services: [{ ...service, id: 402, uuid: 'location-package-treatment', name: 'Package treatment', duration: 90, priceAmountMinor: 20000 }],
  }];
  await configure(request, listing);
  let calendarBody: unknown;
  await page.route('**/marketplace/public/booking/calendar', async route => {
    calendarBody = route.request().postDataJSON();
    const calendar = availabilityFixture().calendar;
    await route.fulfill({ json: { data: { ...calendar, calendar: [], nextAvailableDate: null } } });
  });
  const main = await openLocation(page, listing);
  const panel = main.getByRole('tabpanel');
  await expect(panel.getByRole('button', { name: 'Add Variable haircut', exact: true })).toContainText(/30m\s*–\s*45m/);
  await panel.getByRole('button', { name: 'Add Care package', exact: true }).click();
  await panel.getByRole('button', { name: 'Add Variable haircut', exact: true }).click();
  const summary = main.getByRole('complementary');
  await expect(summary.getByRole('listitem').locator('strong')).toHaveText(['Care package', 'Variable haircut']);
  await expect(summary).toContainText(/from\s*RON\s*270\.00/i);
  await expect(summary).toContainText(/2h\s*–\s*2h 15m/);
  await summary.getByRole('button', { name: 'Remove Care package', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Remove Variable haircut', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('button', { name: 'Add Care package', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await panel.getByRole('button', { name: 'Add Care package', exact: true }).click();
  await expect(summary.getByRole('listitem').locator('strong')).toHaveText(['Variable haircut', 'Care package']);
  await main.getByRole('button', { name: 'Book 2 services', exact: true }).click();
  await expect.poll(() => calendarBody).toMatchObject({
    businessId: 101, locationId: 201, services: [{ serviceId: 401 }, { bundleId: 401 }],
  });
});

test('an empty location without photos or hours remains usable and does not advertise unavailable actions', async ({ page, request }) => {
  const listing = locationFixture('empty');
  listing.featuredImage = null;
  listing.portfolioImages = [];
  listing.services = [];
  listing.bundles = [];
  listing.teamMembers = [];
  listing.location.latitude = null;
  listing.location.longitude = null;
  listing.location.address = null;
  listing.location.addressComponents = null;
  listing.location.city = null;
  await configure(request, listing);
  const main = await openLocation(page, listing);
  await expect(main.getByRole('button', { name: `${listing.location.name}, photo 1`, exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: /^See all/ })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Next photo', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Previous photo', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: /^Add |^Book/ })).toHaveCount(0);
  await expect(main.getByRole('link', { name: /map/i })).toHaveCount(0);
  await expect(main.getByRole('complementary')).toContainText('Contact this location for services and availability.');
  await expectReachable(page, main.getByRole('link', { name: 'Call', exact: true }));
  await main.getByRole('tab', { name: 'About', exact: true }).click();
  await expect(main.getByText("Opening hours haven't been published yet.", { exact: true })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Directions', exact: true })).toHaveCount(0);
});

test('long Romanian content and a failed photo keep the selected booking action reachable in short viewports', async ({ page, request }) => {
  const listing = locationFixture('long-content');
  listing.location.name = 'Atelier de îngrijire și înfrumusețare Centrul Vechi';
  listing.name = 'Atelier pentru îngrijire personalizată și relaxare';
  listing.location.address = 'Strada cu un nume foarte lung, numărul 125, etajul 2, apartamentul 18, București';
  listing.averageRating = 4.9;
  listing.totalReviews = 123;
  listing.reviewStats = { ...listing.reviewStats, averageRating: 4.9, totalCount: 123 };
  listing.featuredImage = `${photoPrefix}broken.svg`;
  listing.portfolioImages = [listing.featuredImage, { url: listing.featuredImage }];
  listing.services[0].name = 'Consultație personalizată și tratament profesional pentru îngrijirea părului';
  listing.services[0].description = 'Consultație, spălat, tratament și recomandări personalizate pentru îngrijire. '.repeat(5);
  await configure(request, listing);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const main = await openLocation(page, listing, 'ro');
  const rating = main.getByRole('button', { name: 'Citește recenziile: 4,9 din 5 stele, 123 de recenzii', exact: true });
  await expect(rating.getByText('4,9', { exact: true })).toBeVisible();
  await expect(rating.getByText('123 de recenzii', { exact: true })).toBeVisible();
  const map = main.getByRole('link', { name: 'Vezi pe hartă', exact: true });
  await expectMapTarget(map, listing, 'ro');
  const place = main.getByRole('link', { name: `Deschide în Google Maps: ${listing.location.address}`, exact: true });
  await expectPlaceTarget(place, listing);
  const gallery = main.getByRole('button', { name: `${listing.location.name}, fotografia 1`, exact: true });
  await expect(main.getByRole('button', { name: /^Vezi toate/ })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Fotografia următoare', exact: true })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Fotografia anterioară', exact: true })).toHaveCount(0);
  await gallery.click();
  const viewer = page.getByRole('dialog');
  await expect(viewer.getByText('Fotografia 1 din 1', { exact: true })).toBeVisible();
  await expect(viewer.getByText('Nu am putut încărca această fotografie.', { exact: true })).toBeVisible();
  await expect(viewer.getByRole('button', { name: 'Fotografia următoare', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(gallery).toBeFocused();
  await main.getByRole('button', { name: `Adaugă ${listing.services[0].name}`, exact: true }).click();
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 664 }, { width: 768, height: 600 }, { width: 1024, height: 768 }, { width: 1366, height: 600 }]) {
    await page.setViewportSize(viewport);
    await expectIdentityFits(page, main, listing, 'Deschide în Google Maps');
    expect((await rating.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expectReachable(page, map);
    await expectReachable(page, place);
    await expectReachable(page, main.getByRole('button', { name: 'Rezervă 1 serviciu', exact: true }));
  }
  await rating.focus();
  await page.keyboard.press('Enter');
  await expect(main.getByRole('tab', { name: /^Recenzii/ })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('a maximum-length unbroken venue name keeps its reviews and full address accessible at every identity layout', async ({ page, request }) => {
  const listing = locationFixture('unbroken-name');
  listing.industry = { id: 5, name: 'Beauty' };
  listing.location.open247 = true;
  listing.location.name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwx';
  listing.location.address = 'North-West International Business and Wellness Centre, Building Twelve, Suite 1234, Bucharest';
  listing.averageRating = 4.9;
  listing.totalReviews = 1234;
  listing.reviewStats = { ...listing.reviewStats, averageRating: 4.9, totalCount: 1234 };
  await configure(request, listing);
  const main = await openLocation(page, listing);
  const identity = main.locator('header');
  const industry = identity.getByText('Beauty', { exact: true });
  const status = identity.getByText('Open 24/7', { exact: true });
  await expect(status).toBeVisible();
  const rating = main.getByRole('button', { name: 'Read reviews: 4.9 out of 5 stars, 1,234 reviews', exact: true });
  await expect(rating.getByText('4.9', { exact: true })).toBeVisible();
  await expect(rating.getByText('1,234 reviews', { exact: true })).toBeVisible();
  const map = main.getByRole('link', { name: 'See on map', exact: true });
  await expectMapTarget(map, listing, 'en');
  const place = main.getByRole('link', { name: `Open in Google Maps: ${listing.location.address}`, exact: true });
  await expectPlaceTarget(place, listing);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await expectIdentityFits(page, main, listing, 'Open in Google Maps');
    const industryBounds = (await industry.boundingBox())!;
    const statusBounds = (await status.boundingBox())!;
    const titleBounds = (await main.getByRole('heading', { name: listing.location.name, level: 1, exact: true }).boundingBox())!;
    expect(statusBounds.x, 'Opening status follows the industry in the eyebrow row').toBeGreaterThanOrEqual(industryBounds.x + industryBounds.width);
    expect(Math.abs((industryBounds.y + industryBounds.height / 2) - (statusBounds.y + statusBounds.height / 2))).toBeLessThanOrEqual(4);
    expect(Math.max(industryBounds.y + industryBounds.height, statusBounds.y + statusBounds.height)).toBeLessThanOrEqual(titleBounds.y + 1);
    expect((await rating.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expectReachable(page, map);
    await expectReachable(page, place);
  }
  await rating.focus();
  await page.keyboard.press('Enter');
  await expect(main.getByRole('tab', { name: /^Reviews/ })).toHaveAttribute('aria-selected', 'true');
});

for (const count of [2, 3, 10]) {
  test(`a ${count}-photo collage uses distinct previews and opens the full collection with correct focus return`, async ({ page, request }) => {
    const listing = locationFixture(`collage-${count}`);
    const sources = Array.from({ length: count }, (_, index) => `${photoPrefix}location-${index + 1}.svg`);
    listing.featuredImage = sources[0];
    listing.portfolioImages = [
      ...sources.slice(1).map(url => ({ url })),
      sources[0],
      ` ${sources[count - 1]} `,
    ];
    await configure(request, listing);
    await page.setViewportSize({ width: 1366, height: 768 });
    const main = await openLocation(page, listing);
    const gallery = main.getByRole('region', { name: `${listing.location.name}, ${count} photos`, exact: true });
    const previews = gallery.getByRole('button', { name: new RegExp(`${listing.location.name}, photo \\d+$`) });
    const previewCount = Math.min(count, 4);
    await expect(previews).toHaveCount(previewCount);
    await expect(gallery).toHaveAttribute('data-photo-count', String(count));
    await expect(gallery).toHaveAttribute('data-preview-count', String(previewCount));
    expect(await previews.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')))).toEqual(sources.slice(0, previewCount));
    await expect(gallery.getByRole('button', { name: 'Next photo', exact: true })).toHaveCount(0);
    await expect(gallery.getByRole('button', { name: 'Previous photo', exact: true })).toHaveCount(0);

    const selected = gallery.getByRole('button', { name: `${listing.location.name}, photo ${previewCount}`, exact: true });
    await selected.click();
    const viewer = page.getByRole('dialog');
    await expect(viewer.getByText(`Photo ${previewCount} of ${count}`, { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(selected).toBeFocused();

    const seeAll = gallery.getByRole('button', { name: `See all ${count} photos`, exact: true });
    await seeAll.click();
    await expect(viewer.getByText(`Photo 1 of ${count}`, { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: new RegExp(`${listing.location.name}, photo \\d+$`) })).toHaveCount(count);
    await page.keyboard.press('End');
    await expect(viewer.getByText(`Photo ${count} of ${count}`, { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'Next photo', exact: true })).toBeDisabled();
    await page.keyboard.press('Home');
    await expect(viewer.getByRole('button', { name: 'Previous photo', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(seeAll).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1366);

    if (count === 10) {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(previews).toHaveCount(3);
      await expect(gallery.getByRole('button', { name: `${listing.location.name}, photo 4`, exact: true, includeHidden: true })).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      await expectReachable(page, seeAll);
      await seeAll.click();
      await page.keyboard.press('End');
      await expect(viewer.getByText('Photo 10 of 10', { exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(seeAll).toBeFocused();

      const romanianMain = await openLocation(page, listing, 'ro');
      const romanianGallery = romanianMain.getByRole('region', { name: `${listing.location.name}, 10 fotografii`, exact: true });
      const romanianSeeAll = romanianGallery.getByRole('button', { name: 'Vezi toate cele 10 fotografii', exact: true });
      for (const width of [1024, 921]) {
        await page.setViewportSize({ width, height: 768 });
        await expect(romanianSeeAll).toBeVisible();
        await expect(romanianGallery.getByRole('button', { name: new RegExp(`${listing.location.name}, fotografia \\d+$`) })).toHaveCount(4);
        const dimensions = await romanianSeeAll.evaluate(element => ({
          scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        }));
        expect(dimensions.scrollHeight, `Romanian See all content fits vertically at ${width}px`).toBeLessThanOrEqual(dimensions.clientHeight + 1);
        expect(dimensions.scrollWidth, `Romanian See all content fits horizontally at ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      }
    }
  });
}

test('About explains overnight opening hours and refreshes the header and schedule together on return', async ({ page, request }) => {
  const listing = locationFixture('about-overnight');
  listing.location.workingHours = {
    monday: { isOpen: true, open: '09:00', close: '19:00' },
    saturday: { isOpen: true, open: '22:00', close: '02:00' },
    sunday: { isOpen: false, open: '', close: '' },
  };
  // Sunday 01:00 at this venue is still part of Saturday's opening interval.
  await page.clock.setFixedTime(new Date('2026-10-31T23:00:00Z'));
  await configure(request, listing);
  const main = await openLocation(page, listing);
  await main.getByRole('tab', { name: 'About', exact: true }).click();
  const about = main.getByRole('tabpanel');
  const hours = about.locator('section').filter({ has: page.getByRole('heading', { name: 'Opening hours', exact: true }) });
  await expect(main.locator('header').getByText('Open', { exact: true })).toBeVisible();
  await expect(hours.getByText('Open', { exact: true })).toBeVisible();
  await expect(hours.getByText('Continuing Saturday’s opening hours', { exact: true })).toBeVisible();
  const saturday = hours.locator('dl > div').filter({ has: page.locator('dt').filter({ hasText: /^Saturday$/ }) });
  await expect(saturday).toContainText('22:00 - 02:00');
  await expect(saturday).toContainText('next day');
  const sunday = hours.locator('dl > div').filter({ has: page.locator('dt').filter({ hasText: /^Sunday/ }) });
  await expect(sunday).toHaveAttribute('aria-current', 'date');
  await expect(hours.getByText('Today', { exact: true })).toHaveCount(0);
  await expect(sunday).toContainText('Closed');
  await about.screenshot({ path: '/tmp/location-about-implemented-en.png' });

  // Returning to the tab must re-read the venue clock immediately, without
  // waiting for a periodic update or changing the API/server's actual clock.
  await page.clock.setFixedTime(new Date('2026-11-01T00:01:00Z'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(main.locator('header').getByText('Closed', { exact: true })).toBeVisible();
  await expect(hours.getByText('Open', { exact: true })).toHaveCount(0);
  await expect(hours.getByText('Opens tomorrow at 09:00', { exact: true })).toBeVisible();
  await expect(hours.getByText('Continuing Saturday’s opening hours', { exact: true })).toHaveCount(0);
});

test('About distinguishes invalid and unpublished hours from closed days and normalizes valid times', async ({ page, request }) => {
  const listing = locationFixture('about-partial-hours');
  listing.location.workingHours = {
    monday: { isOpen: true, open: '09:00', close: '09:00' },
    tuesday: { isOpen: true, open: '9:00', close: '17:00' },
    wednesday: { isOpen: false, open: '', close: '' },
    thursday: { isOpen: true, open: 'not-a-time', close: '17:00' },
  };
  await page.clock.setFixedTime(new Date('2026-11-02T10:00:00Z'));
  await configure(request, listing);
  const main = await openLocation(page, listing);
  await main.getByRole('tab', { name: 'About', exact: true }).click();
  const hours = main.getByRole('tabpanel').locator('section').filter({ has: page.getByRole('heading', { name: 'Opening hours', exact: true }) });
  const rows = hours.locator('dl > div');
  await expect(rows).toHaveCount(7);
  await expect(rows.filter({ has: page.locator('dt').filter({ hasText: /^Monday/ }) })).toContainText('Not provided');
  await expect(rows.filter({ has: page.locator('dt').filter({ hasText: /^Tuesday$/ }) })).toContainText('09:00 - 17:00');
  await expect(rows.filter({ has: page.locator('dt').filter({ hasText: /^Wednesday$/ }) })).toContainText('Closed');
  await expect(rows.filter({ has: page.locator('dt').filter({ hasText: /^Thursday$/ }) })).toContainText('Not provided');
  await expect(rows.filter({ has: page.locator('dt').filter({ hasText: /^Friday$/ }) })).toContainText('Not provided');
  await expect(hours.getByText('Current opening status is unavailable.', { exact: true })).toBeVisible();
  await expect(hours).not.toContainText('09:00 - 09:00');
  await expect(hours.getByText(/^Times shown in /)).toHaveCount(0);
});

test.describe('About venue time and contact controls', () => {
  test.use({ timezoneId: 'America/New_York', reducedMotion: 'no-preference' });

  test('About explains a different venue timezone and keeps explicit 24/7 hours concise', async ({ page, request }) => {
    const listing = locationFixture('about-timezone');
    listing.location.workingHours = {
      thursday: { isOpen: true, open: '09:00', close: '19:00' },
    };
    await page.clock.setFixedTime(new Date('2026-10-29T10:00:00Z'));
    await configure(request, listing);
    const main = await openLocation(page, listing);
    await main.getByRole('tab', { name: 'About', exact: true }).click();
    let hours = main.getByRole('tabpanel').locator('section').filter({ has: page.getByRole('heading', { name: 'Opening hours', exact: true }) });
    await expect(hours.getByText('Open', { exact: true })).toBeVisible();
    await expect(hours.locator('dl > div')).toHaveCount(7);
    await expect(hours.getByText(/^Times shown in .+\.$/)).toBeVisible();
    await expect(hours).not.toContainText("Opening hours haven't been published yet.");

    // The explanatory note is unnecessary for a visitor in the venue's zone.
    const matching = locationFixture('about-matching-timezone');
    matching.timezone = 'America/New_York';
    matching.location.timezone = matching.timezone;
    matching.location.open247 = true;
    await configure(request, matching);
    await openLocation(page, matching);
    await main.getByRole('tab', { name: 'About', exact: true }).click();
    hours = main.getByRole('tabpanel').locator('section').filter({ has: page.getByRole('heading', { name: 'Opening hours', exact: true }) });
    await expect(hours.getByText('Open 24/7', { exact: true })).toBeVisible();
    await expect(hours.locator('dl')).toHaveCount(0);
    await expect(hours.getByText(/^Times shown in /)).toHaveCount(0);
  });

  test('About keeps long Romanian contact details and the full week usable with local control feedback', async ({ page, request }) => {
    const listing = locationFixture('about-long-contacts');
    listing.location.description = 'Îngrijire personalizată, într-un spațiu dedicat relaxării și consultațiilor. '.repeat(4);
    listing.location.address = 'Strada cu un nume foarte lung, numărul 125, etajul 2, apartamentul 18, București';
    listing.location.city = 'București';
    listing.location.email = `appointments.${'personalized-care'.repeat(3)}@${'long-venue'.repeat(4)}.example`;
    listing.location.workingHours = Object.fromEntries(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        .map(day => [day, { isOpen: true, open: '09:00', close: '19:00' }]),
    );
    await page.clock.setFixedTime(new Date('2026-10-29T10:00:00Z'));
    await configure(request, listing);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const main = await openLocation(page, listing, 'ro');
    await main.getByRole('tab', { name: 'Despre', exact: true }).click();
    const about = main.getByRole('tabpanel');
    await expect(about.getByRole('heading', { name: 'Contact', exact: true })).toBeVisible();
    const call = about.getByRole('link', { name: `Sună: ${phone}`, exact: true });
    const email = about.getByRole('link', { name: `E-mail: ${listing.location.email}`, exact: true });
    const placeName = `Deschide în Google Maps: ${listing.location.address}`;
    const place = main.locator('header').getByRole('link', { name: placeName, exact: true });
    await expect(about.getByRole('link', { name: 'Indicații', exact: true })).toHaveCount(0);
    await expect(about.getByText(listing.location.address!, { exact: true })).toHaveCount(0);
    await expect(about.locator('a[href*="google.com/maps"]')).toHaveCount(0);
    await expectPlaceTarget(place, listing);
    await expect(place).toHaveCount(1);
    await expect(main.getByRole('link', { name: placeName, exact: true })).toHaveCount(1);
    await expect(call).toHaveAttribute('href', `tel:${phone}`);
    await expect(email).toHaveAttribute('href', `mailto:${listing.location.email}`);
    await expect(call.getByText('Sună', { exact: true })).toBeVisible();
    await expect(email.getByText('E-mail', { exact: true })).toBeVisible();
    const hours = about.locator('section').filter({ has: page.getByRole('heading', { name: 'Program', exact: true }) });
    await expect(hours.locator('dl > div')).toHaveCount(7);
    await expect(hours.getByText(/^Fus orar: .+\.$/)).toBeVisible();
    await expect(hours.getByText('Astăzi', { exact: true })).toHaveCount(0);
    await expect(hours.locator('[aria-current="date"] dt')).toHaveText('joi');
    expect(await hours.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor, image: style.backgroundImage, shadow: style.boxShadow,
        borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      };
    }), 'The published schedule stays on the page canvas without a surrounding card').toEqual({
      background: 'rgba(0, 0, 0, 0)', image: 'none', shadow: 'none', borders: ['0px', '0px', '0px', '0px'],
    });
    for (const link of [call, email]) {
      const glyph = link.locator(':scope > svg');
      await expect(glyph, 'Contact actions use the plain shared glyph directly').toHaveCount(1);
      expect(await glyph.evaluate(element => {
        const style = getComputedStyle(element);
        return { width: element.getBoundingClientRect().width, background: style.backgroundColor, border: style.borderTopWidth };
      })).toEqual({ width: 19, background: 'rgba(0, 0, 0, 0)', border: '0px' });
    }

    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const link of [call, email]) {
        await expectReachable(page, link);
        const geometry = await link.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          return {
            left: bounds.left, right: bounds.right, height: bounds.height,
            text: [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right })),
          };
        });
        expect(geometry.height).toBeGreaterThanOrEqual(44);
        for (const fragment of geometry.text) {
          expect(fragment.left).toBeGreaterThanOrEqual(geometry.left - 1);
          expect(fragment.right).toBeLessThanOrEqual(geometry.right + 1);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (width === 1440) {
        await about.getByRole('heading', { name: 'Contact', exact: true }).locator('../..')
          .screenshot({ path: `/tmp/location-about-simplified-ro-${width}.png` });
      }
      if (width === 390) {
        for (const [heading, name] of [[about.getByRole('heading', { name: 'Contact', exact: true }), 'contact'], [hours.getByRole('heading'), 'hours']] as const) {
          await heading.evaluate(element => window.scrollTo(0, scrollY + element.getBoundingClientRect().top - 150));
          await page.screenshot({ path: `/tmp/location-about-simplified-ro-390-${name}.png` });
        }
      }
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
    await email.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(call).toBeFocused();
    expect(await call.evaluate(element => element.matches(':focus-visible'))).toBe(true);
    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();
    await call.hover();
    await expect.poll(() => call.evaluate(element => {
      const style = getComputedStyle(element);
      return { transform: style.transform, filter: style.filter, shadow: style.boxShadow };
    })).toEqual({ transform: 'none', filter: 'none', shadow: 'none' });
    expect(errors).toEqual([]);
  });
});
