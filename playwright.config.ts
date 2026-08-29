import { defineConfig, devices } from '@playwright/test'

// Mirrors admin-dashboard's e2e setup: a real admin-api instance against an
// isolated Postgres test DB (same docker-compose.test.yml, same port 5433,
// same database), truncated + reseeded once per run in global-setup.
//
// Port plan (must not collide with anything already running locally):
//   3000 - admin-api dev (docker, untouched)
//   3001 - admin-api TEST mode (admin-api/.env.test PORT=3001, also what
//          admin-dashboard's own e2e suite targets — shared test API)
//   3055 - zavoia-web dev server, pointed at the test API via
//          NEXT_PUBLIC_API_URL. Deliberately NOT zavoia-web's normal 3001
//          dev port, which is claimed by admin-api's test server above.
const ADMIN_API_DIR = '../admin-api'
const API_URL = 'http://localhost:3001'
const APP_PORT = 3055
const APP_URL = `http://localhost:${APP_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Backend runs unoptimized (ts-node NestJS) and the app runs `next dev`
  // (Turbopack, no prod optimizations) — booking-calendar/slot generation
  // and other real network round-trips routinely take longer than
  // Playwright's built-in 5s default under this stack. Bump the default so
  // individual specs don't each need their own explicit timeout override.
  expect: {
    timeout: 10_000,
  },
  // A handful of booking specs scan up to 14 days of real slots (via the UI,
  // one round-trip per candidate) to dodge shared-calendar contention across
  // this ~95-test suite — that can outrun the 30s default on its own before
  // ever getting to the test's own assertions. Give every test more room.
  timeout: 60_000,

  use: {
    baseURL: APP_URL,
    locale: 'en-US',
    timezoneId: 'Europe/Bucharest', // matches every demo-seed location's timezone
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Pre-accept the cookie-consent banner (src/lib/consent/ConsentProvider.tsx,
    // cookie `zw-consent`) for every test. Without this, the banner is a
    // second `role="dialog"` on nearly every page, making any untargeted
    // `getByRole('dialog')` ambiguous — a real failure mode several specs hit.
    storageState: {
      cookies: [
        {
          name: 'zw-consent',
          value: 'denied',
          domain: 'localhost',
          path: '/',
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './e2e/global-setup.ts',

  webServer: [
    {
      command: 'yarn db:test:up && yarn migration:run:test && yarn start:test',
      cwd: ADMIN_API_DIR,
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `next dev -p ${APP_PORT}`,
      cwd: '.',
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        // Empty by design for the default run: an empty Google client id
        // hides the Google button entirely (feature-flag pattern), and an
        // empty Mapbox token makes /search render its deterministic "Map
        // unavailable" fallback instead of loading real tiles. The
        // web-studio/OAuth suites override these per-test where needed.
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: '',
        NEXT_PUBLIC_MAPTILER_API_KEY: '',
        // /business/<slug> and /brand/<slug> are ISR (600s floor) — a spec
        // that mutates a location/service directly via SQL and then expects
        // the page to reflect it needs to force a revalidation (see
        // e2e/fixtures/revalidate.ts). Test-only secret, matches nothing real.
        REVALIDATE_SECRET: 'e2e-test-revalidate-secret',
      },
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
