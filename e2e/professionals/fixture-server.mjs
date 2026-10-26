import { createServer } from 'node:http';
import { ABOUT, UUID, availabilityFixture, contextFixture, favoritesFixture, listingFixture, profileFixture, websiteFixture } from './fixtures.mjs';

// A dedicated in-memory API serves both Next's server render and the browser.
// It never opens a database connection or forwards an application mutation.
const port = Number(process.env.PROFESSIONALS_FIXTURE_PORT || 4317);
const defaultState = () => ({
  profile: profileFixture(), listing: listingFixture(), bookingContext: contextFixture(), favorites: favoritesFixture(), signedIn: false,
  profileStatus: 200, contextStatus: 200, requests: [], blockedMutations: [],
});
let state = defaultState();
const token = [
  'eyJhbGciOiJub25lIn0',
  Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'),
  'professional-ui-fixture',
].join('.');
const user = {
  uuid: 'share-customer-fixture', email: 'share-fixture@example.invalid',
  firstName: 'Share', lastName: 'Fixture', profileImage: null,
  hasPassword: true, emailVerified: true, googleSub: null,
};

const server = createServer(async (request, response) => {
  const path = new URL(request.url || '/', `http://127.0.0.1:${port}`).pathname;
  const method = request.method || 'GET';
  const origin = request.headers.origin;
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept-Language, X-Locale, Idempotency-Key');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  const json = (value, status = 200) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  let raw = '';
  for await (const chunk of request) raw += chunk;
  let body = null;
  try { if (raw) body = JSON.parse(raw); } catch { return json({ message: 'Invalid fixture JSON' }, 400); }

  if (method === 'OPTIONS') return json({});
  if (path === '/__health') return json({ ok: true, fixture: true });
  if (path === '/__control' && method === 'GET') return json(state);
  if (path === '/__control' && method === 'POST') {
    if (body?.reset) state = defaultState();
    Object.assign(state, body?.patch || {});
    return json({ ok: true });
  }

  state.requests.push({ path, method, body });
  if (path.startsWith('/__professionals-fixtures__/')) {
    response.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return response.end('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#b94b2d"/></svg>');
  }
  if (path === '/marketplace/auth/refresh' && method === 'POST') {
    return state.signedIn
      ? json({ accessToken: token, csrfToken: 'professional-ui-fixture' })
      : json({ message: 'No fixture session' }, 401);
  }
  if (path === '/marketplace/auth/login' && method === 'POST') {
    state.signedIn = true;
    response.setHeader('Set-Cookie', 'customerCsrfToken=professional-ui-fixture; Path=/; SameSite=Lax');
    return json({ user, accessToken: token, csrfToken: 'professional-ui-fixture' });
  }
  if (path === '/marketplace/auth/me' && method === 'GET') return json({ user });
  const canonical = path.match(/^\/marketplace\/public\/professional\/([^/]+)$/);
  if (canonical && method === 'GET') {
    const uuid = decodeURIComponent(canonical[1]);
    const otherMember = [302, 303].map((id) => profileFixture(id)).find((member) => member.uuid === uuid);
    if (otherMember) return json(otherMember);
    if (uuid !== UUID) return json({ message: 'Professional unavailable', code: 'MARKETPLACE_PUBLIC.E18' }, 404);
    if (state.profileStatus !== 200) return json({ message: 'Fixture profile unavailable' }, state.profileStatus);
    return json(state.profile);
  }
  if (path === '/marketplace/public/team-member/301' && method === 'GET') {
    return state.profileStatus !== 200
      ? json({ message: 'Fixture profile unavailable' }, state.profileStatus)
      : json(state.profile);
  }
  if (path === '/marketplace/public/team-member/301/booking-context' && method === 'GET') {
    return state.contextStatus !== 200
      ? json({ message: 'Fixture booking context unavailable' }, state.contextStatus)
      : json({ data: state.bookingContext });
  }
  if (path === '/marketplace/public/team-member/301/reviews' && method === 'GET') {
    return json({ data: [], pagination: { total: 0, offset: 0, limit: 10, hasMore: false } });
  }
  if ((['/marketplace/public/listing/201', '/marketplace/public/listing/share-old-town'].includes(path)
    || /^\/marketplace\/public\/listing\/share-(pending|legacy)-profile$/.test(path)) && method === 'GET') {
    return json(state.listing);
  }
  const scopedMember = path.match(/^\/marketplace\/public\/listing\/11\/team-member\/(30[1-3])$/);
  if (scopedMember && method === 'GET') {
    const id = Number(scopedMember[1]);
    return json({ ...(id === 301 ? state.profile : profileFixture(id)), services: contextFixture().businesses[0].locations[0].services });
  }
  const website = path.match(/^\/marketplace\/public\/website\/share-team-(portraits|roster|columns|carousel)$/);
  if (website && method === 'GET') return json(websiteFixture(website[1]));
  if (path === '/marketplace/public/website/demo-atelier-glow' && method === 'GET') return json(websiteFixture());
  if (path === '/marketplace/public/booking/calendar' && method === 'POST') {
    return json({ data: availabilityFixture(body?.locationId).calendar });
  }
  if (path === '/marketplace/public/booking/slots' && method === 'POST') {
    return json({ data: availabilityFixture(body?.locationId, body?.date).slots });
  }
  if (path === '/marketplace/appointments/book' && method === 'POST') {
    return json({ data: { appointments: [{
      appointmentId: 501, appointmentUuid: 'share-booked-appointment-fixture',
      scheduledAt: body.scheduledAt,
      endsAt: new Date(new Date(body.scheduledAt).getTime() + 30 * 60_000).toISOString(),
      status: 'confirmed', serviceName: 'Fixture haircut', duration: 30,
      price: 12000, currency: 'RON', location: {}, staff: {},
    }] } });
  }
  if (path === '/marketplace/appointments/list' && method === 'GET') {
    return json({ data: { upcoming: [], past: { items: [], total: 0, offset: 0, limit: 20, hasMore: false } } });
  }
  if (path === '/marketplace/customer/favorites' && method === 'GET') return json(state.favorites);
  if (path === '/marketplace/customer/favorite/professionals' && method === 'GET') return json(state.favorites.professionals);
  if (path === '/marketplace/customer/favorite/locations' && method === 'GET') return json([]);
  if (path === '/marketplace/notifications/unread-count' && method === 'GET') return json({ data: { count: 0 } });
  if (path === '/marketplace/public/industries' && method === 'GET') return json([]);
  if (path === '/marketplace/public/venue-tags' && method === 'GET') return json([]);
  if (path === '/marketplace/public/sitemap' && method === 'GET') {
    return json({ locations: [], brands: [], websites: [], professionals: [{ uuid: UUID }] });
  }

  if (!['GET', 'HEAD'].includes(method)) state.blockedMutations.push(`${method} ${path}`);
  return json({ message: `Unmocked fixture endpoint: ${method} ${path}`, description: ABOUT }, 404);
});

server.listen(port, '127.0.0.1', () => console.log(`Professional fixture API on 127.0.0.1:${port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
