import { defineConfig, devices } from '@playwright/test'

// Full-app browser regressions against an existing dev or production server.
// All marketplace traffic is intercepted; no DB, seed, or default global setup.
// ACCOUNT_UI_TEST_BASE_URL=http://localhost:3001 npx playwright test --config=playwright.account-ui.config.ts
export default defineConfig({
  testDir: './e2e/account',
  testMatch: 'account-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: 'list',
  outputDir: 'test-results/account-ui',
  use: {
    baseURL: process.env.ACCOUNT_UI_TEST_BASE_URL ?? 'http://localhost:3001',
    locale: 'en-US',
    timezoneId: 'Europe/Bucharest',
    contextOptions: { reducedMotion: 'reduce' },
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
})
