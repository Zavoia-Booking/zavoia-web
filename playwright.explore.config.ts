import { defineConfig } from "@playwright/test";

// Read-only checks against an already running web/API pair. Deliberately no
// database setup, reseeding, or test-server overrides. Real-map cases require
// the running app's Mapbox configuration, just like a visitor's browser.
export default defineConfig({
  testDir: "./e2e/explore",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: "/tmp/zavoia-explore-playwright",
  use: {
    baseURL: process.env.EXPLORE_E2E_BASE_URL || "http://localhost:3001",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    },
    storageState: {
      cookies: [{ name: "zw-consent", value: "denied", domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }],
      origins: [],
    },
  },
});
