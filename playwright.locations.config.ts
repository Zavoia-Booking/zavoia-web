import { defineConfig } from "@playwright/test";

// Uses an already-running web/API pair. No global setup, database reset, or writes.
const baseURL = process.env.LOCATION_AUDIT_WEB_URL ?? "http://localhost:3001";
export default defineConfig({
  testDir: "./tests/locations",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  outputDir: "/tmp/zavoia-location-tests",
  use: {
    baseURL,
    browserName: "chromium",
    timezoneId: "Europe/Bucharest",
    locale: "en-US",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox"] }
      : undefined,
    storageState: {
      cookies: [{ name: "zw-consent", value: "denied", domain: new URL(baseURL).hostname, path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" }],
      origins: [],
    },
  },
});
