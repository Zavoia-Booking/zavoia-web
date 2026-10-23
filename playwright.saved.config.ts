import { defineConfig, devices } from '@playwright/test'

// Browser-only Saved regressions against an already-running web server.
// Deliberately independent of playwright.config.ts: no API server, DB setup,
// account creation, or seed reset. The spec intercepts every marketplace call.
// Run: npx playwright test --config=playwright.saved.config.ts
export default defineConfig({
  testDir: './e2e/favorites',
  testMatch: 'saved-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: 'test-results/saved-ui',
  use: {
    baseURL: process.env.SAVED_TEST_BASE_URL ?? 'http://localhost:3001',
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
