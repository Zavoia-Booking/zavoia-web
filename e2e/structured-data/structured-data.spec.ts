import { expect, test, type APIRequestContext } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { HOSTILE_COPY } from './fixtures.mjs';
import { UUID } from '../professionals/fixtures.mjs';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Node = { [key: string]: JsonValue };
const origin = 'https://www.zavoia.com';
const api = `http://127.0.0.1:${process.env.STRUCTURED_DATA_FIXTURE_PORT || '4324'}`;

function object(value: JsonValue | undefined): Node {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a schema node');
  return value;
}
function nodes(value: JsonValue | undefined): Node[] {
  if (!Array.isArray(value)) throw new Error('Expected schema node array');
  return value.map(object);
}
function hasType(node: Node, type: string) {
  return Array.isArray(node['@type']) ? node['@type'].includes(type) : node['@type'] === type;
}
function entity(graph: Node[], type: string) {
  const found = graph.find(node => hasType(node, type));
  if (!found) throw new Error(`Missing ${type} node`);
  return found;
}

/** Inspect actual server HTML, including metadata; serialized React props do not count. */
async function document(request: APIRequestContext, path: string, locale: 'en' | 'ro') {
  const response = await request.get(path);
  expect(response.status(), path).toBe(200);
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  expect(scripts, `${path} must render exactly one real JSON-LD script`).toHaveLength(1);
  const schema = JSON.parse(scripts[0][1]) as Node;
  const artifact = test.info().outputPath(`schema-${path.replace(/[^a-z0-9]+/gi, '-')}.json`);
  await mkdir(dirname(artifact), { recursive: true });
  await writeFile(artifact, JSON.stringify(schema, null, 2));
  await test.info().attach('schema', { path: artifact, contentType: 'application/ld+json' });
  expect(schema['@context']).toBe('https://schema.org');
  const graph = nodes(schema['@graph']);
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map(match => match[1]);
  expect(canonicals, path).toHaveLength(1);
  expect(new URL(canonicals[0]).href, path).toBe(new URL(`${origin}${path}`).href);
  const page = graph.find(node => node['@id'] === `${origin}${path}#webpage`);
  expect(page, `${path} has its own page identity`).toMatchObject({
    url: `${origin}${path}`, inLanguage: locale, isPartOf: { '@id': `${origin}/#website` },
  });
  const ids = graph.map(node => node['@id']);
  expect(new Set(ids).size, 'Top-level graph IDs are unique').toBe(ids.length);
  expect(entity(graph, 'WebSite')).toMatchObject({
    '@id': `${origin}/#website`, name: 'Zavoia', url: `${origin}/`,
    publisher: { '@id': `${origin}/#organization` },
  });
  const publisher = graph.find(node => node['@id'] === `${origin}/#organization`);
  expect(publisher).toMatchObject({
    '@type': 'Organization', name: 'Zavoia', taxID: '48718430',
    address: { '@type': 'PostalAddress', postalCode: '060023', addressCountry: 'RO' },
  });
  expect(JSON.stringify(schema)).not.toMatch(/"(?:aggregateRating|review|ratingCount|reviewCount)":/);
  expect(html).not.toContain('<script id="schema-injection">');
  return { html, graph, page: page! };
}

function expectCollection(graph: Node[], page: Node, expectedPaths: string[]) {
  expect(hasType(page, 'CollectionPage')).toBeTruthy();
  const list = entity(graph, 'ItemList');
  expect(page.mainEntity).toEqual({ '@id': list['@id'] });
  expect(list.numberOfItems).toBe(expectedPaths.length);
  const items = nodes(list.itemListElement);
  expect(items.map(item => item.position)).toEqual(expectedPaths.map((_, index) => index + 1));
  expect(items.map(item => item.item)).toEqual(expectedPaths.map(path => `${origin}${path}`));
}

test.afterAll(async ({ request }) => {
  const response = await request.get(`${api}/__control`);
  expect(response.ok()).toBeTruthy();
  const state = await response.json() as {
    requests: Array<{ path: string; method: string }>;
    blockedMutations: string[];
  };
  expect(state.blockedMutations, 'The audit must never invoke an application mutation').toEqual([]);
  expect(state.requests.filter(item => !['GET', 'HEAD'].includes(item.method)
    && item.path !== '/marketplace/public/nearby-locations')).toEqual([]);
});

for (const locale of ['en', 'ro'] as const) {
  const prefix = locale === 'ro' ? '/ro' : '';
  const currency = locale === 'ro' ? 'RON' : 'EUR';

  test(`${locale}: business, pricing and Web Studio expose visible offers and supported platforms`, async ({ request }) => {
    for (const name of ['for-business', 'pricing', 'web-studio']) {
      const path = `${prefix}/${name}`;
      const { graph, page } = await document(request, path, locale);
      const apps = graph.filter(node => hasType(node, 'SoftwareApplication') || hasType(node, 'WebApplication'));
      expect(apps, `${path} describes one software entity`).toHaveLength(1);
      const app = apps[0];
      expect(app.applicationCategory).toBe('BusinessApplication');
      expect(app.publisher).toEqual({ '@id': `${origin}/#organization` });
      expect(app.mainEntityOfPage).toEqual({ '@id': page['@id'] });
      expect(page.about).toEqual({ '@id': app['@id'] });
      const questions = nodes(page.mainEntity);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions.every(question => hasType(question, 'Question') && object(question.acceptedAnswer).text)).toBeTruthy();
      const offers = nodes(app.offers);
      const studio = name === 'web-studio';
      expect(offers.map(offer => offer.price)).toEqual(studio
        ? [locale === 'ro' ? 189 : 38]
        : locale === 'ro' ? [99, 189] : [20, 38]);
      expect(offers.map(offer => offer.priceCurrency)).toEqual(offers.map(() => currency));
      expect(offers.map(offer => offer['@id'])).toEqual(studio
        ? [`${origin}/#plan-plus-${currency.toLowerCase()}`]
        : [`${origin}/#plan-base-${currency.toLowerCase()}`, `${origin}/#plan-plus-${currency.toLowerCase()}`]);
      for (const offer of offers) {
        expect(offer.url).toMatch(/\/pricing#pricing-plan-(base|plus)$/);
        expect(object(offer.priceSpecification)).toMatchObject({
          '@type': 'UnitPriceSpecification', price: offer.price, priceCurrency: currency,
          referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
        });
        expect(object(offer.addOn)).toMatchObject({ price: locale === 'ro' ? 35 : 7, priceCurrency: currency });
      }
      if (studio) {
        expect(hasType(app, 'WebApplication')).toBeTruthy();
        expect(app.operatingSystem).toBe('Any');
        expect(app.browserRequirements).toContain('JavaScript');
        expect(graph.some(node => node['@id'] === `${origin}/#business-application`)).toBeFalsy();
      } else {
        expect(app.operatingSystem).toEqual(['Android', 'iOS']);
      }
    }
  });

  test(`${locale}: homepage and help retain distinct connected page identities`, async ({ request }) => {
    const home = await document(request, prefix || '/', locale);
    expect(hasType(home.page, 'WebPage')).toBeTruthy();
    expect(home.graph.some(node => hasType(node, 'SoftwareApplication'))).toBeFalsy();
    const help = await document(request, `${prefix}/help`, locale);
    expect(hasType(help.page, 'FAQPage')).toBeTruthy();
    const questions = nodes(help.page.mainEntity);
    expect(questions.length).toBeGreaterThan(10);
    for (const question of questions) {
      expect(hasType(question, 'Question')).toBeTruthy();
      expect(object(question.acceptedAnswer).text).toBeTruthy();
    }
  });

  test(`${locale}: empty isolated blog archives do not invent articles or collection members`, async ({ request }) => {
    const categories = locale === 'ro' ? ['ghiduri', 'pentru-afaceri', 'noutati-produs'] : ['guides', 'for-business', 'product-news'];
    for (const suffix of ['', ...categories.map(category => `/${category}`)]) {
      const { graph, page, html } = await document(request, `${prefix}/blog${suffix}`, locale);
      expect(hasType(page, 'CollectionPage')).toBeTruthy();
      expect(graph.some(node => hasType(node, 'BlogPosting') || hasType(node, 'ItemList'))).toBeFalsy();
      if (suffix) {
        expect(entity(graph, 'BreadcrumbList').itemListElement).toHaveLength(2);
        expect(html).toMatch(/name="robots" content="[^"]*noindex/);
      }
    }
    const missing = await request.get(`${prefix}/blog/no-cms-article`);
    expect(missing.status()).toBe(404);
    expect(await missing.text()).not.toContain('type="application/ld+json"');
  });

  test(`${locale}: industry and city category lists describe exactly their displayed destinations`, async ({ request }) => {
    const directory = await document(request, `${prefix}/industries`, locale);
    expectCollection(directory.graph, directory.page, [`${prefix}/search?industry=hair-salon`]);
    expect(entity(directory.graph, 'BreadcrumbList').itemListElement).toHaveLength(2);
    const categoryPath = locale === 'ro' ? '/ro/bucuresti/salon-de-coafura' : '/bucharest/hair-salon';
    const category = await document(request, categoryPath, locale);
    expectCollection(category.graph, category.page, [`${prefix}/business/share-old-town`, `${prefix}/business/share-north`]);
    expect(entity(category.graph, 'BreadcrumbList').itemListElement).toHaveLength(3);
    expect(category.html).not.toMatch(/name="robots" content="[^"]*noindex/);
  });

  test(`${locale}: location, brand and professional identities connect to real published entities`, async ({ request }) => {
    const location = await document(request, `${prefix}/business/share-old-town`, locale);
    const venue = entity(location.graph, 'LocalBusiness');
    expect(venue.description).toBe(HOSTILE_COPY);
    expect(venue.address).toMatchObject({ postalCode: '030167', addressCountry: 'RO' });
    expect(venue.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '09:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Tuesday', opens: '09:00', closes: '18:00' },
    ]);
    expect(location.page.mainEntity).toEqual({ '@id': venue['@id'] });
    expect(venue.url).toBe(`${origin}/business/share-old-town`);
    expect(venue.parentOrganization).toMatchObject({ '@id': `${origin}/#business-101` });
    const catalog = object(venue.hasOfferCatalog);
    const serviceOffers = nodes(catalog.itemListElement);
    expect(serviceOffers).toHaveLength(1);
    expect(serviceOffers[0]).toMatchObject({ '@type': 'Offer', price: 120, priceCurrency: 'RON' });
    expect(object(serviceOffers[0].itemOffered)).toMatchObject({
      '@type': 'Service', name: 'Fixture haircut', provider: { '@id': venue['@id'] },
    });
    expect(location.html).toContain('\\u003c/script');

    const brand = await document(request, `${prefix}/brand/share-studio`, locale);
    expectCollection(brand.graph, brand.page, [`${prefix}/business/share-old-town`, `${prefix}/business/share-north`]);
    expect(brand.page.about).toEqual({ '@id': `${origin}/#business-101` });
    const merchant = brand.graph.find(node => node['@id'] === `${origin}/#business-101`);
    expect(merchant?.description).toBe(HOSTILE_COPY);

    const professional = await document(request, `${prefix}/professionals/${UUID}`, locale);
    const person = entity(professional.graph, 'Person');
    expect(hasType(professional.page, 'ProfilePage')).toBeTruthy();
    expect(person.name).toBe('Mara Share');
    expect(professional.page.mainEntity).toEqual({ '@id': person['@id'] });
    expect(person.mainEntityOfPage).toEqual({ '@id': professional.page['@id'] });
    expect(nodes(person.worksFor).map(employer => employer['@id'])).toEqual([`${origin}/#business-101`]);
  });

  test(`${locale}: published merchant website schema follows its visible About and FAQ`, async ({ request }) => {
    const website = await document(request, `${prefix}/schema-merchant`, locale);
    const merchant = website.graph.find(node => node['@id'] === `${origin}/#business-101`);
    expect(merchant).toMatchObject({ '@type': 'Organization', description: HOSTILE_COPY });
    expect(merchant).not.toHaveProperty('email');
    expect(merchant).not.toHaveProperty('logo');
    expect(website.page.publisher).toEqual({ '@id': `${origin}/#business-101` });
    expect(website.page.about).toEqual({ '@id': `${origin}/#business-101` });
    expect(hasType(website.page, 'FAQPage')).toBeTruthy();
    const questions = nodes(website.page.mainEntity);
    expect(questions).toHaveLength(1);
    expect(questions[0].name).toBe(locale === 'ro' ? 'Pot rezerva online?' : 'Can I book online?');
    expect(website.html).toContain('\\u003c/script');
  });

  test(`${locale}: legal noindex pages do not emit unrelated rich-result entities`, async ({ request }) => {
    const response = await request.get(`${prefix}/terms`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/name="robots" content="[^"]*noindex/);
    expect(html).not.toContain('type="application/ld+json"');
  });
}
