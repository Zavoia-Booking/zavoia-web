import { defineConfig, devices } from '@playwright/test';

// Dedicated Next + in-memory API processes: covers SSR and hydration without
// touching the running localhost app, real API, database, or seed scripts.
const webPort = process.env.PROFESSIONALS_WEB_PORT || '3012';
const apiPort = process.env.PROFESSIONALS_FIXTURE_PORT || '4317';
export default defineConfig({
  testDir: './e2e/professionals',
  testMatch: 'professionals-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  outputDir: 'test-results/professionals-ui',
  webServer: [
    {
      command: 'node e2e/professionals/fixture-server.mjs',
      url: `http://127.0.0.1:${apiPort}/__health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'node e2e/professionals/start-web.mjs',
      url: `http://localhost:${webPort}/favicon.ico`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL: `http://localhost:${webPort}`,
    locale: 'en-US', timezoneId: 'Europe/Bucharest', reducedMotion: 'reduce',
    serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
