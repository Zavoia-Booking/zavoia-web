import { defineConfig, devices } from '@playwright/test'

// Browser-only gallery checks against the existing development server.
// Independent of the default config: no database, API server, or seed setup.
export default defineConfig({
  testDir: './e2e/gallery',
  testMatch: 'image-viewer-ui.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: 'test-results/gallery-ui',
  use: {
    baseURL: process.env.GALLERY_TEST_BASE_URL ?? 'http://localhost:3001',
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
