import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.HOME_FAILURES_WEB_PORT || '3062';
const apiPort = process.env.HOME_FAILURES_FIXTURE_PORT || '3132';
const fixtureEnv = {
  HOME_FAILURES_FIXTURE_PORT: apiPort,
  PROFESSIONALS_WEB_PORT: webPort,
  PROFESSIONALS_FIXTURE_PORT: apiPort,
  NEXT_DIST_DIR: '.next/home-failures',
};

// Both SSR and browser requests use this isolated, database-free API fixture.
export default defineConfig({
  testDir: './e2e/home',
  testMatch: 'home-failure-feedback-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  outputDir: '/tmp/zavoia-home-failure-tests',
  webServer: [
    {
      command: 'node e2e/home/fixture-server.mjs',
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
    contextOptions: { reducedMotion: 'reduce' },
    extraHTTPHeaders: { 'Cache-Control': 'no-cache' },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
