import { defineConfig, devices } from '@playwright/test'

// Isolated UI regressions: all API traffic is intercepted by the fixture.
// No DB, seeding, global setup or server lifecycle from the default config.
export default defineConfig({
  testDir: './e2e/forms',
  testMatch: 'plain-text-fields.ui.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: 'test-results/forms-ui',
  use: {
    baseURL: process.env.FORMS_TEST_BASE_URL ?? 'http://localhost:3001',
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
})
