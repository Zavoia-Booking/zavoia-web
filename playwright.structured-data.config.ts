import { defineConfig } from '@playwright/test';

// The same isolated production build as the lifecycle checks, backed entirely
// by in-memory fixtures. The start harness disables configured CMS credentials.
const webPort = process.env.STRUCTURED_DATA_WEB_PORT || '3019';
const apiPort = process.env.STRUCTURED_DATA_FIXTURE_PORT || '4324';
const fixtureEnv = {
  LOCATIONS_SEO_WEB_PORT: webPort,
  PROFESSIONALS_FIXTURE_PORT: apiPort,
  STRUCTURED_DATA_FIXTURES: '1',
  NEXT_DIST_DIR: '.next-locations-seo',
  REVALIDATE_SECRET: 'location-seo-isolated-fixture-secret',
};

export default defineConfig({
  testDir: './e2e/structured-data',
  testMatch: 'structured-data.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  outputDir: '/tmp/zavoia-structured-data-tests',
  webServer: [
    {
      command: 'node e2e/professionals/fixture-server.mjs', env: fixtureEnv,
      url: `http://127.0.0.1:${apiPort}/__health`, reuseExistingServer: false, timeout: 30_000,
    },
    {
      command: 'node e2e/locations/start-production-web.mjs', env: fixtureEnv,
      url: `http://localhost:${webPort}/favicon.ico`, reuseExistingServer: false, timeout: 300_000,
    },
  ],
  use: {
    baseURL: `http://localhost:${webPort}`,
    extraHTTPHeaders: { 'User-Agent': 'facebookexternalhit/1.1' },
  },
});
