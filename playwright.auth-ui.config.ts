import { defineConfig, devices } from '@playwright/test'

// Mock-only auth regressions against an already-running web server. No live
// backend setup, database seeds, or server startup. The .ui.ts test suffix is
// intentionally excluded by the default live suite's filename pattern.
// Run: npx playwright test --config=playwright.auth-ui.config.ts
export default defineConfig({
  testDir: './e2e/auth',
  testMatch: 'verify-account-link.ui.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: 'test-results/auth-ui',
  use: {
    baseURL: process.env.AUTH_TEST_BASE_URL ?? 'http://localhost:3001',
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
