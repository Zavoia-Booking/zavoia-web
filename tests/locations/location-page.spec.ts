import { expect, test } from "@playwright/test";
import type { ListingDetail } from "../../src/lib/api/marketplace/types";

const slug = process.env.LOCATION_PAGE_SLUG ?? "cs-nova-centru";
const api = process.env.LOCATION_AUDIT_API_URL ?? "http://localhost:3000";

// These checks use the existing local catalogue and intercept only browser requests.
// They never seed data, submit appointments, or mutate listing configuration.
test("gallery reaches every photo and returns keyboard focus", async ({ page, request }) => {
  const response = await request.get(`${api}/marketplace/public/listing/${slug}`);
  const listing: ListingDetail = await response.json();
  const photos = [...new Set([listing.featuredImage, ...listing.portfolioImages.map(photo => typeof photo === "string" ? photo : photo.url)].filter(Boolean))];
  await page.goto(`/business/${slug}`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Show all photos", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Photo 1 of ${photos.length}`, { exact: true })).toBeVisible();
  await page.keyboard.press("End");
  await expect(dialog.getByText(`Photo ${photos.length} of ${photos.length}`, { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Next photo", exact: true })).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(dialog.getByRole("button", { name: "Previous photo", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("search, category filtering, selection persistence and booking handoff", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`/business/${slug}`, { waitUntil: "networkidle" });
  const services = page.getByRole("tabpanel");
  const add = services.getByRole("button", { name: "Add Balayage", exact: true });
  const box = await add.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(720);
  await add.click();
  await expect(services.getByRole("button", { name: "Remove Balayage", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /^Team/ }).click();
  await page.getByRole("tab", { name: /^Services/ }).click();
  await expect(services.getByRole("button", { name: "Remove Balayage", exact: true })).toBeVisible();
  const search = services.getByRole("searchbox", { name: "Search services" });
  await search.fill("semipermanenta");
  await expect(services.getByRole("button", { name: "Add Manichiură semipermanentă", exact: true })).toBeVisible();
  await expect(services.getByRole("button", { name: "Remove Balayage", exact: true })).toHaveCount(0);
  await search.fill("no-such-service");
  await expect(services.getByText("No matching services", { exact: true })).toBeVisible();
  await services.getByRole("button", { name: "Clear filters", exact: true }).click();
  await services.getByRole("button", { name: /^Unghii & Sprâncene/ }).click();
  await expect(services.getByRole("button", { name: "Add Manichiură semipermanentă", exact: true })).toBeVisible();
  await expect(services.getByRole("button", { name: "Remove Balayage", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Book 1 service", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("Pick a date & time", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("tabs support keyboard navigation and retain reviews across visits", async ({ page }) => {
  await page.goto(`/business/${slug}`, { waitUntil: "networkidle" });
  const services = page.getByRole("tab", { name: /^Services/ });
  await services.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^Team/ })).toBeFocused();
  await expect(page.getByRole("tab", { name: /^Team/ })).toHaveAttribute("aria-selected", "true");
  for (const tab of await page.getByRole("tab").all()) {
    const target = await tab.getAttribute("aria-controls");
    expect(await page.evaluate(id => document.getElementById(id!) !== null, target)).toBe(true);
  }
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Highest rated", exact: true }).click();
  await expect(page.getByRole("button", { name: "Highest rated", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /^Services/ }).click();
  await page.getByRole("tab", { name: /^Reviews/ }).click();
  await expect(page.getByRole("button", { name: "Highest rated", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("mixed review IDs stay distinct and a failed sort preserves data for retry", async ({ page, request }) => {
  const listing: ListingDetail = await (await request.get(`${api}/marketplace/public/listing/${slug}`)).json();
  const original = listing.reviews[0];
  let fail = true;
  await page.route(`**/marketplace/public/listing/${listing.locationId}/reviews?*`, route => fail
    ? route.fulfill({ status: 503, json: { message: "Temporary failure" } })
    : route.fulfill({ json: { data: [
      { ...original, id: 777, type: "location", comment: "Location collision fixture", teamMember: null },
      { ...original, id: 777, type: "team_member", comment: "Professional collision fixture", teamMember: { id: 1, firstName: "Alex", lastName: "Test", profileImage: null } },
    ], pagination: { offset: 0, limit: 10, total: 2 } } }));
  await page.goto(`/business/${slug}?tab=reviews`, { waitUntil: "networkidle" });
  const panel = page.getByRole("tabpanel");
  const before = await panel.getByRole("article").count();
  await panel.getByRole("button", { name: "Highest rated", exact: true }).click();
  await expect(panel.getByRole("alert")).toBeVisible();
  await expect(panel.getByRole("article")).toHaveCount(before);
  await expect(panel.getByRole("button", { name: "Most recent", exact: true })).toHaveAttribute("aria-pressed", "true");
  fail = false;
  await panel.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(panel.getByRole("article")).toHaveCount(2);
  await expect(panel.getByText("Location collision fixture", { exact: true })).toBeVisible();
  await expect(panel.getByText("Professional collision fixture", { exact: true })).toBeVisible();
  await expect(panel.getByText("Review for Alex Test", { exact: true })).toBeVisible();
});

test("closing a deep-linked profile stays closed after changing tabs", async ({ page, request }) => {
  const listing: ListingDetail = await (await request.get(`${api}/marketplace/public/listing/${slug}`)).json();
  await page.goto(`/business/${slug}?tab=team&member=${listing.teamMembers[0].id}`, { waitUntil: "networkidle" });
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]member=/);
  await page.getByRole("tab", { name: /^Services/ }).click();
  await page.getByRole("tab", { name: /^Team/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Romanian phone selection can be reviewed and removed without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/ro/business/${slug}`, { waitUntil: "networkidle" });
  await page.getByRole("tabpanel").getByRole("button", { name: "Adaugă Balayage", exact: true }).click();
  const summary = page.locator("summary").filter({ hasText: /450/ });
  await summary.click();
  await expect(page.getByRole("heading", { name: "Programarea ta", exact: true })).toBeVisible();
  await page.locator("details").getByRole("button", { name: "Elimină Balayage", exact: true }).click();
  await expect(summary).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole("tab", { name: "Despre", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Despre această locație", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("venue status and review hydration are consistent across visitor timezones", async ({ browser }) => {
  const statuses: string[] = [];
  for (const timezoneId of ["Europe/Bucharest", "America/Los_Angeles"]) {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.addCookies([{ name: "zw-consent", value: "denied", domain: "localhost", path: "/" }]);
    await page.goto(`http://localhost:3001/business/${slug}?tab=reviews`, { waitUntil: "networkidle" });
    statuses.push((await page.locator("main header").first().innerText()).includes("Open") ? "open" : "closed");
    await expect(page.getByRole("button", { name: "Highest rated", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  }
  expect(statuses[0]).toBe(statuses[1]);
});

test("location reports keep venue context and trap focus without sending a real ticket", async ({ page, request }) => {
  const listing: ListingDetail = await (await request.get(`${api}/marketplace/public/listing/${slug}`)).json();
  let payload: Record<string, unknown> | undefined;
  await page.route("**/marketplace/public/support/tickets", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { message: "ok", data: { uuid: "local-test-receipt", createdAt: new Date().toISOString() } } });
  });
  await page.goto(`/business/${slug}?tab=about`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Report this location", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(`${listing.name} · ${listing.location.name}`);
  await dialog.getByRole("textbox", { name: "Email", exact: true }).fill("location-test@example.com");
  await dialog.getByRole("textbox", { name: "What happened?", exact: true }).fill("Browser-only report fixture; no ticket is created.");
  await dialog.getByRole("button", { name: "Send report", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Send report", exact: true }).click();
  await expect.poll(() => payload?.context).toEqual({ type: "listing", label: `${listing.name} · ${listing.location.name}`, businessId: listing.businessId, listingId: listing.listingId, locationId: listing.locationId });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
