import { defineConfig } from '@playwright/test';

// Production HTTP/cache checks against a separate build and an in-memory API.
// This configuration never starts the real API or invokes database seed scripts.
const webPort = process.env.LOCATIONS_SEO_WEB_PORT || '3016';
const apiPort = process.env.LOCATIONS_SEO_FIXTURE_PORT || '4321';
const fixtureEnv = {
  LOCATIONS_SEO_WEB_PORT: webPort,
  PROFESSIONALS_FIXTURE_PORT: apiPort,
  NEXT_DIST_DIR: '.next-locations-seo',
  REVALIDATE_SECRET: 'location-seo-isolated-fixture-secret',
};

export default defineConfig({
  testDir: './e2e/locations',
  testMatch: 'locations-seo.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  outputDir: '/tmp/zavoia-location-seo-tests',
  webServer: [
    {
      command: 'node e2e/professionals/fixture-server.mjs',
      env: fixtureEnv,
      url: `http://127.0.0.1:${apiPort}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'node e2e/locations/start-production-web.mjs',
      env: fixtureEnv,
      url: `http://localhost:${webPort}/favicon.ico`,
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
  use: {
    baseURL: `http://localhost:${webPort}`,
    extraHTTPHeaders: { 'User-Agent': 'facebookexternalhit/1.1' },
  },
});
