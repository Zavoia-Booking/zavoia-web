import { defineConfig, devices } from '@playwright/test';

// Reuse the SSR-aware in-memory API harness. No real API or database is involved.
const webPort = process.env.LOCATIONS_WEB_PORT || '3014';
const apiPort = process.env.LOCATIONS_FIXTURE_PORT || '4319';
const fixtureEnv = {
  PROFESSIONALS_WEB_PORT: webPort,
  PROFESSIONALS_FIXTURE_PORT: apiPort,
  NEXT_DIST_DIR: '.next-locations-ui',
};

export default defineConfig({
  testDir: './e2e/locations',
  testMatch: 'locations-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  outputDir: '/tmp/zavoia-location-fixture-tests',
  webServer: [
    {
      command: 'node e2e/professionals/fixture-server.mjs',
      env: fixtureEnv,
      url: `http://127.0.0.1:${apiPort}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'node e2e/professionals/start-web.mjs',
      env: fixtureEnv,
      url: `http://localhost:${webPort}/favicon.ico`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL: `http://localhost:${webPort}`,
    locale: 'en-US',
    timezoneId: 'Europe/Bucharest',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
