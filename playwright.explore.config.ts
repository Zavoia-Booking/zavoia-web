import { defineConfig } from "@playwright/test";

// Read-only checks against an already running web/API pair. Deliberately no
// database setup, reseeding, or test-server overrides. Real-map cases require
// the running app's Mapbox configuration, just like a visitor's browser.
const baseURL = process.env.EXPLORE_E2E_BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e/explore",
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: "/tmp/zavoia-explore-playwright",
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    contextOptions: { reducedMotion: "reduce" },
    locale: "en-US",
    timezoneId: "Europe/Bucharest",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--enable-unsafe-swiftshader"],
    },
    // The map asks for location whenever it opens; pre-answer "Not now"
    // (`zv-loc-skip`) so that dialog doesn't cover the pages under test.
    storageState: {
      cookies: [{ name: "zw-consent", value: "denied", domain: "localhost", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }],
      origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: "zv-loc-skip", value: "1" }] }],
    },
  },
});
