import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ListingDetail } from '../../src/lib/api/marketplace/types';
import { en } from '../../src/i18n/dictionaries/en';
import { ro } from '../../src/i18n/dictionaries/ro';
import { listingFixture } from '../professionals/fixtures.mjs';

const api = `http://127.0.0.1:${process.env.LOCATIONS_SEO_FIXTURE_PORT || '4321'}`;
const secret = 'location-seo-isolated-fixture-secret';
const publicOrigin = 'https://zavoia.com';

function fixture(key: string, id: number): ListingDetail {
  const listing: ListingDetail = listingFixture();
  listing.id = id;
  listing.locationId = id;
  listing.slug = `production-seo-${key}`;
  listing.location.id = id;
  listing.location.slug = listing.slug;
  listing.location.uuid = `production-seo-${id}`;
  listing.location.description = `Published description for ${key}.`;
  listing.teamMembers = [];
  listing.featuredImage = null;
  return listing;
}

async function control(request: APIRequestContext, patch: Record<string, unknown>, reset = false) {
  const response = await request.post(`${api}/__control`, { data: { reset, patch } });
  expect(response.ok()).toBeTruthy();
}

async function state(request: APIRequestContext) {
  return (await request.get(`${api}/__control`)).json() as Promise<{
    requests: Array<{ path: string; method: string }>;
    blockedMutations: string[];
  }>;
}

function paths(listing: ListingDetail) {
  return ['', '/ro'].flatMap(prefix => [
    `${prefix}/business/${listing.slug}`,
    `${prefix}/business/${listing.locationId}`,
  ]);
}

function documentTitles(html: string) {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/g)].map(match => match[1]);
}

async function invalidate(request: APIRequestContext, listing: ListingDetail) {
  const response = await request.post('/api/revalidate/business', {
    headers: { 'x-revalidate-secret': secret },
    data: { locations: [listing.slug, String(listing.locationId)] },
  });
  expect(response.status()).toBe(200);
}

async function expectPublished(response: APIResponse, listing: ListingDetail, path: string) {
  expect(response.status(), path).toBe(200);
  const html = await response.text();
  const titles = documentTitles(html);
  expect(titles, 'Published locations keep their own actual document title').toHaveLength(1);
  expect(titles[0]).toContain(listing.location.name);
  expect(titles[0]).not.toMatch(/^404/);
  expect(html).toContain(`<h1`);
  expect(html).toContain(listing.location.name);
  expect(html).toContain(`name="description" content="${listing.location.description}"`);
  const prefix = path.startsWith('/ro/') ? '/ro' : '';
  expect(html).toContain(`rel="canonical" href="${publicOrigin}${prefix}/business/${listing.slug}"`);
  expect(html).not.toMatch(/name="robots" content="[^"]*noindex/);
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  expect(scripts, 'Structured data is an actual server-rendered script, not just serialized props').toHaveLength(1);
  const schema = JSON.parse(scripts[0][1]) as { '@context': string; '@graph': Array<Record<string, unknown>> };
  expect(schema['@context']).toBe('https://schema.org');
  const location = schema['@graph'].find(entity => entity['@type'] === 'LocalBusiness');
  const webPage = schema['@graph'].find(entity => entity['@type'] === 'WebPage');
  expect(location).toMatchObject({ name: listing.location.name, url: `${publicOrigin}/business/${listing.slug}` });
  expect(webPage).toMatchObject({
    url: `${publicOrigin}${prefix}/business/${listing.slug}`,
    inLanguage: prefix ? 'ro' : 'en', mainEntity: { '@id': location?.['@id'] },
  });
  expect(JSON.stringify(schema)).not.toMatch(/"(?:aggregateRating|reviewCount|ratingCount|offers|priceRange)":/);
}

async function expectUnavailable(response: APIResponse) {
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toMatch(/name="robots" content="[^"]*noindex/);
  const dictionary = new URL(response.url()).pathname.startsWith('/ro/') ? ro : en;
  expect(documentTitles(html), 'Unavailable locations keep their localized metadata, not the homepage title')
    .toEqual([`404 — ${dictionary.notFound.page.title} | Zavoia`]);
  expect(html).not.toMatch(/<link\b[^>]*rel="canonical"/i);
  expect(html).not.toMatch(/<link\b[^>]*hreflang=/i);
  expect(html).not.toContain('type="application/ld+json"');
}

function inventory(listing?: ListingDetail) {
  return {
    locations: listing ? [{ slug: listing.slug, updatedAt: listing.updatedAt }] : [],
    brands: [], websites: [], professionals: [],
  };
}

test.afterEach(async ({ request }) => {
  const inspected = await state(request);
  expect(inspected.blockedMutations, 'Production checks must only read the isolated fixture API').toEqual([]);
  expect(inspected.requests.filter(item => !['GET', 'HEAD'].includes(item.method))).toEqual([]);
});

test('missing locations return real 404 responses for both locales, aliases, and ordinary browsers', async ({ request }) => {
  const listing = fixture('missing', 8101);
  await control(request, { listing, listingStatus: 404 }, true);
  for (const path of paths(listing)) await expectUnavailable(await request.get(path));
  // A distinct cold URL prevents a bot-rendered cache entry from masking
  // an ordinary browser's streaming/status behavior.
  const browserListing = fixture('missing-browser', 8110);
  await control(request, { listing: browserListing, listingStatus: 404 });
  await expectUnavailable(await request.get(`/business/${browserListing.slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }));
  const googleListing = fixture('missing-googlebot', 8111);
  await control(request, { listing: googleListing, listingStatus: 404 });
  await expectUnavailable(await request.get(`/ro/business/${googleListing.slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  }));
});

test('publishing replaces previously requested unavailable pages in both locales and aliases', async ({ request }) => {
  const listing = fixture('publish', 8102);
  await control(request, { listing, listingStatus: 404 }, true);
  for (const path of paths(listing)) await expectUnavailable(await request.get(path));

  await control(request, { listingStatus: 200 });
  await invalidate(request, listing);
  for (const path of paths(listing)) await expectPublished(await request.get(path), listing, path);
});

test('unpublishing, blocking, or deleting expires published content before the next request', async ({ request }) => {
  const listing = fixture('remove', 8103);
  await control(request, { listing }, true);
  for (const path of paths(listing)) await expectPublished(await request.get(path), listing, path);
  // Each lifecycle event uses the public API's same unavailable response.
  await control(request, { listingStatus: 404 });
  await invalidate(request, listing);
  for (const path of paths(listing)) await expectUnavailable(await request.get(path));
});

test('real cached content persists until an authorized webhook refreshes both aliases and locales', async ({ request }) => {
  const listing = fixture('edit', 8104);
  listing.additionalSettings = { showPricing: false };
  await control(request, { listing }, true);
  for (const path of paths(listing)) await expectPublished(await request.get(path), listing, path);

  const changed = structuredClone(listing);
  changed.location.description = 'Updated location description after publication.';
  await control(request, { listing: changed });
  // Proves this suite exercises the production cache, not just a dynamic page.
  await expectPublished(await request.get(paths(listing)[0]), listing, paths(listing)[0]);
  const rejected = await request.post('/api/revalidate/business', {
    headers: { 'x-revalidate-secret': 'incorrect-fixture-secret' },
    data: { locations: [listing.slug, String(listing.locationId)] },
  });
  expect(rejected.status()).toBe(401);
  await expectPublished(await request.get(paths(listing)[0]), listing, paths(listing)[0]);

  await invalidate(request, listing);
  for (const path of paths(listing)) await expectPublished(await request.get(path), changed, path);
});

test('a transient API failure is not cached as missing and recovers without a webhook', async ({ request }) => {
  const listing = fixture('api-recovery', 8105);
  await control(request, { listing, listingStatus: 503 }, true);
  const path = `/business/${listing.slug}`;
  const failed = await request.get(path);
  expect(failed.status()).toBeGreaterThanOrEqual(500);
  expect(await failed.text()).not.toContain('404 —');

  await control(request, { listingStatus: 200 });
  await expectPublished(await request.get(path), listing, path);
});

test('location inventory follows publication and removal and omits an unproven lastmod', async ({ request }) => {
  const listing = fixture('sitemap-membership', 8106);
  await control(request, { listing, sitemap: inventory() }, true);
  await invalidate(request, listing);
  let response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain(`/business/${listing.slug}`);

  await control(request, { sitemap: inventory(listing) });
  await invalidate(request, listing);
  response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const published = await response.text();
  for (const prefix of ['', '/ro']) {
    const canonical = `${publicOrigin}${prefix}/business/${listing.slug}`;
    expect(published).toContain(`<loc>${canonical}</loc>`);
    const entry = published.split('<url>').find(part => part.includes(`<loc>${canonical}</loc>`));
    expect(entry).toBeTruthy();
    expect(entry).not.toContain('<lastmod>');
    expect(entry).toContain('hreflang="en"');
    expect(entry).toContain('hreflang="ro"');
  }

  await control(request, { sitemap: inventory() });
  await invalidate(request, listing);
  response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain(`/business/${listing.slug}`);
});

test('sitemap outages never publish successful disappearance of all marketplace URLs', async ({ request }) => {
  const listing = fixture('sitemap-recovery', 8107);
  await control(request, { listing, sitemap: inventory(listing) }, true);
  await invalidate(request, listing);
  const original = await request.get('/sitemap.xml');
  expect(original.status()).toBe(200);
  expect(await original.text()).toContain(`<loc>${publicOrigin}/business/${listing.slug}</loc>`);

  await control(request, { sitemapStatus: 503 });
  await invalidate(request, listing);
  const failed = await request.get('/sitemap.xml');
  // Either retained successful inventory or a genuine failure is safe. A 200
  // containing only static URLs would silently replace the real inventory.
  if (failed.status() === 200) {
    expect(await failed.text()).toContain(`<loc>${publicOrigin}/business/${listing.slug}</loc>`);
  } else {
    expect(failed.status()).toBeGreaterThanOrEqual(500);
  }

  await control(request, { sitemapStatus: 200 });
  await invalidate(request, listing);
  const recovered = await request.get('/sitemap.xml');
  expect(recovered.status()).toBe(200);
  expect(await recovered.text()).toContain(`<loc>${publicOrigin}/business/${listing.slug}</loc>`);
});

test('malformed and oversized invalidation requests fail rather than partially succeeding', async ({ request }) => {
  const listing = fixture('invalid-webhook', 8108);
  await control(request, { listing }, true);
  for (const data of [null, [], { locations: 'not-an-array' }, { locations: [42] },
    { locations: Array.from({ length: 201 }, (_, i) => `fixture-${i}`) }]) {
    const response = await request.post('/api/revalidate/business', {
      headers: { 'x-revalidate-secret': secret }, data,
    });
    expect(response.status(), JSON.stringify(data)).toBe(400);
  }
});

test('padded and encoded numeric aliases redirect before caching and follow publication changes', async ({ request }) => {
  const listing = fixture('numeric-aliases', 8112);
  await control(request, { listing, listingStatus: 404 }, true);
  const query = '?tab=about&utm_source=alias-test&value=a%2Fb';
  const encodedId = String(listing.locationId).split('').map(digit => `%3${digit}`).join('');
  const aliases = ['', '/ro', '/en'].flatMap(prefix =>
    [`000${listing.locationId}`, `%30%30%30${listing.locationId}`, `00%30${listing.locationId}`, encodedId]
      .map(key => ({
        path: `${prefix}/business/${key}${query}`,
        target: `${prefix === '/ro' ? '/ro' : ''}/business/${listing.locationId}${query}`,
      })),
  );

  for (const { path, target } of aliases) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(308);
    const redirect = new URL(response.headers().location, response.url());
    expect(redirect.origin, path).toBe(new URL(response.url()).origin);
    expect(`${redirect.pathname}${redirect.search}`, path).toBe(target);
    await expectUnavailable(await request.get(path));
  }

  await control(request, { listingStatus: 200 });
  await invalidate(request, listing);
  for (const { path } of aliases) await expectPublished(await request.get(path), listing, path);

  await control(request, { listingStatus: 404 });
  await invalidate(request, listing);
  for (const { path } of aliases) await expectUnavailable(await request.get(path));

  const inspected = await state(request);
  const listingRequests = inspected.requests.filter(item => item.path.startsWith('/marketplace/public/listing/'));
  expect(listingRequests.length).toBeGreaterThan(0);
  expect([...new Set(listingRequests.map(item => item.path))], 'Aliases share the invalidated numeric API cache key')
    .toEqual([`/marketplace/public/listing/${listing.locationId}`]);
});
