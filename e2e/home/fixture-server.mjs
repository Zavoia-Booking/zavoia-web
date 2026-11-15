import { createServer } from 'node:http';

const port = Number(process.env.HOME_FAILURES_FIXTURE_PORT || 3132);
const industry = { id: 1, slug: 'beauty', name: 'Beauty', nameRo: 'Frumusețe', tags: [] };
const location = (index) => ({
  id: 201 + index, businessId: 11, listingId: 21, slug: `fixture-place-${index + 1}`,
  name: `Fixture place ${index + 1}`, locationName: `Fixture place ${index + 1}`,
  businessName: 'Fixture brand', description: null, address: null, city: 'Bucharest',
  latitude: 44.43, longitude: 26.1, workingHours: null, open247: false,
  featuredImage: null, industry, averageRating: null, totalReviews: 0, distanceKm: 1.2,
});
const brand = {
  businessId: 11, slug: 'fixture-brand', name: 'Fixture brand', description: null,
  profileImage: null, featuredImage: null, city: 'Bucharest', primaryLocationId: 201,
  primaryLocationSlug: 'fixture-place-1', industry, averageRating: null, totalReviews: 0,
  locations: [], locationsCount: 1, teamMembers: [], teamMembersCount: 0,
};
const recent = (index) => ({
  id: 201 + index, slug: `fixture-place-${index + 1}`, name: `Recent place ${index + 1}`,
  image: null, averageRating: null, totalReviews: 0, city: 'Bucharest', latitude: 44.43, longitude: 26.1,
});
const hero = { type: 'hero', visible: true, variant: 'default' };
const website = {
  businessId: 12, slug: 'fixture-website', name: 'Fixture website', logo: null,
  timezone: 'Europe/Bucharest', layout: [{ type: 'nav', visible: false, variant: 'default' }, hero],
  announcement: null, industry, publishedVersion: 1, publishedAt: '2026-10-01T10:00:00Z',
  hero, heroImageUrl: null, tagline: 'Fixture business', brandColor: null, fontKey: null, locations: [],
};
const initial = () => ({
  statuses: { categories: 200, city: 200, websites: 200, brands: 200, recent: 200, nearby: 200 },
  empty: [], delays: {}, showcase: false, requests: [], blockedMutations: [],
});
let state = initial();
const routeFeeds = {
  '/marketplace/public/industries': 'categories',
  '/marketplace/public/listings': 'city',
  '/marketplace/public/websites': 'websites',
  '/marketplace/public/brands': 'brands',
  '/marketplace/public/listings/bulk': 'recent',
  '/marketplace/public/nearby-locations': 'nearby',
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${port}`);
  const path = url.pathname;
  const method = request.method || 'GET';
  const origin = request.headers.origin;
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept-Language, X-Locale, Cache-Control');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  const json = (value, status = 200) => {
    if (response.destroyed) return;
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  let raw = '';
  for await (const chunk of request) raw += chunk;
  let body = null;
  try { if (raw) body = JSON.parse(raw); } catch { return json({ message: 'Invalid fixture JSON' }, 400); }
  if (method === 'OPTIONS') return json({});
  if (path === '/__health') return json({ ok: true });
  if (path === '/__control' && method === 'GET') return json(state);
  if (path === '/__control' && method === 'POST') {
    if (body?.reset) state = initial();
    const patch = body?.patch || {};
    if (patch.statuses) state.statuses = { ...state.statuses, ...patch.statuses };
    if (patch.delays) state.delays = { ...state.delays, ...patch.delays };
    if (patch.empty) state.empty = patch.empty;
    if (typeof patch.showcase === 'boolean') state.showcase = patch.showcase;
    return json({ ok: true });
  }

  const feed = routeFeeds[path];
  const params = method === 'POST' ? body : Object.fromEntries(url.searchParams);
  state.requests.push({ path, method, feed, params });
  if (feed) {
    const status = state.statuses[feed];
    const empty = state.empty.includes(feed);
    const delay = state.delays[feed] || 0;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (status !== 200) return json({ message: 'Fixture discovery failure' }, status);
    if (feed === 'categories') return json(empty ? [] : [industry]);
    if (feed === 'websites') return json({ data: !empty && state.showcase ? [website] : [] });
    if (feed === 'brands') return json({ data: empty ? [] : [brand], total: empty ? 0 : 1, limit: 10, offset: 0 });
    if (feed === 'recent') return json({ data: empty ? [] : [recent(0), recent(1)] });
    const total = empty ? 0 : feed === 'city' ? 12 : 8;
    const offset = Number(params?.offset || 0);
    const limit = Number(params?.limit || (feed === 'city' ? 10 : 6));
    const rows = Array.from({ length: total }, (_, index) => location(index)).slice(offset, offset + limit);
    return json(feed === 'city'
      ? { locations: rows, businesses: [], total, offset, limit, fallback: { applied: false, reason: null } }
      : { data: rows, total, offset, limit, fallback: { applied: false, reason: null } });
  }
  if (path === '/marketplace/auth/refresh' && method === 'POST') return json({ message: 'No fixture session' }, 401);
  if (path === '/marketplace/public/venue-tags') return json({ amenities: [], paymentMethods: [], languages: [] });
  if (!['GET', 'HEAD'].includes(method)) state.blockedMutations.push(`${method} ${path}`);
  return json({ message: `Unmocked fixture endpoint: ${method} ${path}` }, 404);
});

server.listen(port, '127.0.0.1', () => console.log(`Homepage fixture API on 127.0.0.1:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
