import { expect, test, type Locator, type Page, type Request } from "@playwright/test";
import { en } from "@/i18n/dictionaries/en";
import { ro } from "@/i18n/dictionaries/ro";

async function openExplore(page: Page, locale = "en") {
  await page.goto(`${locale === "en" ? "" : "/ro"}/search?city=Bucharest`);
  await expect(page.locator("[data-biz]").first()).toBeVisible();
}

test("desktop owns the viewport, hides only the list scrollbar, and keeps Filters visible", async ({ page }) => {
  await openExplore(page);
  const geometry = await page.evaluate(() => ({ viewport: innerHeight, document: document.documentElement.scrollHeight, width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(geometry.document).toBe(geometry.viewport);
  expect(geometry.scrollWidth).toBe(geometry.width);
  const list = page.locator('[data-locale-scroll="search-results"]');
  expect(await list.evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe("none");
  await list.evaluate(element => { element.scrollTop = 400; });
  expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  const filters = await page.getByRole("button", { name: "Filters", exact: true }).boundingBox();
  const listBox = await list.boundingBox();
  expect(filters!.x + filters!.width).toBeLessThanOrEqual(listBox!.x + listBox!.width + 1);
  const header = page.locator("[data-explore-results-header]");
  await expect(header.getByRole("button")).toHaveCount(1);
  await expect(header.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
  await expect(header.getByRole("button", { name: "Clear filters", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: /All|Automotive|Beauty|Closest|Sort/ })).toHaveCount(0);
  const headerBox = await header.boundingBox();
  expect(filters!.y).toBeLessThan(headerBox!.y + 30);
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeVisible();
});

test("header Clear filters resets refinements and preserves the search", async ({ page }) => {
  const query = new URLSearchParams({ city: "Bucharest", lat: "44.4268", lng: "26.1025", radius: "40", mapZoom: "11", search: "Clinic", industry: "health-medical", tagIds: "1", date: "2026-10-21", sort: "rating", minRating: "4.5", maxKm: "2", openNow: "1", open247: "1", amenities: "991001", payments: "991002", languages: "991003" });
  await page.goto(`/search?${query}`);
  const header = page.locator("[data-explore-results-header]");
  const clear = header.getByRole("button", { name: "Clear filters", exact: true });
  await expect(clear).toBeEnabled();
  await clear.click();
  await expect.poll(() => new URL(page.url()).searchParams.has("sort")).toBe(false);
  const params = new URL(page.url()).searchParams;
  for (const key of ["sort", "minRating", "maxKm", "openNow", "open247", "amenities", "payments", "languages"]) expect(params.has(key)).toBe(false);
  for (const key of ["city", "lat", "lng", "radius", "mapZoom", "search", "industry", "tagIds", "date"]) expect(params.get(key)).toBe(query.get(key));
  await expect(clear).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Filters", exact: true })).toBeFocused();
});

test("filters trap and restore focus; uncommitted choices stay in the dialog", async ({ page }) => {
  await openExplore(page);
  const trigger = page.getByRole("button", { name: "Filters", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => !!document.elementFromPoint(innerWidth / 2, 30)?.closest("header[data-marketplace-chrome]"))).toBe(false);
  await dialog.getByRole("button", { name: "Top rated", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Top rated", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => new URL(page.url()).searchParams.has("sort")).toBe(false);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(dialog.getByRole("button", { name: "Closest", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("pill switches keep drafts private and Reset applies the defaults", async ({ page }) => {
  await openExplore(page);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  const openNow = dialog.getByRole("switch", { name: "Open now", exact: true });
  const open247 = dialog.getByRole("switch", { name: "Open 24/7", exact: true });
  await expect(openNow).toHaveAttribute("aria-checked", "false");
  await expect(open247).toHaveAttribute("aria-checked", "false");
  await openNow.click();
  await open247.press("Space");
  await expect(openNow).toHaveAttribute("aria-checked", "true");
  await expect(open247).toHaveAttribute("aria-checked", "true");
  expect(new URL(page.url()).searchParams.has("openNow")).toBe(false);
  expect(new URL(page.url()).searchParams.has("open247")).toBe(false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(openNow).toHaveAttribute("aria-checked", "false");
  await expect(open247).toHaveAttribute("aria-checked", "false");
  await dialog.getByRole("button", { name: "Top rated", exact: true }).click();
  await dialog.getByRole("button", { name: /^Show \d+ places?$/ }).click();
  await expect.poll(() => new URL(page.url()).searchParams.get("sort")).toBe("rating");
  await page.getByRole("button", { name: "Filters, 1 active", exact: true }).click();
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.has("sort")).toBe(false);
  expect(new URL(page.url()).searchParams.get("city")).toBe("Bucharest");
});

test("feature preview exposes usable pills and expands clipped or selected features", async ({ page }) => {
  const amenities = Array.from({ length: 24 }, (_, index) => ({ id: 991000 + index, slug: `fixture-feature-${index + 1}`, name: `Fixture feature ${index + 1}` }));
  await page.route("**/marketplace/public/venue-tags", route => route.fulfill({ json: { amenities, paymentMethods: [], languages: [] } }));
  await openExplore(page);
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  const first = dialog.getByRole("button", { name: "Fixture feature 1", exact: true });
  const last = dialog.getByRole("button", { name: "Fixture feature 24", exact: true, includeHidden: true });
  const disclosure = dialog.getByRole("button", { name: "Show all features", exact: true });
  await expect(first).toBeVisible();
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(await first.evaluate(element => (element as HTMLElement).inert)).toBe(false);
  expect(await last.evaluate(element => (element as HTMLElement).inert)).toBe(true);
  await expect(last).toHaveAttribute("tabindex", "-1");
  await disclosure.click();
  await expect(last).toHaveAttribute("aria-hidden", "false");
  expect(await last.evaluate(element => (element as HTMLElement).inert)).toBe(false);
  await last.click();
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("button", { name: "No places match", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has("amenities")).toBe(false);
  await page.goto("/search?city=Bucharest&amenities=991023");
  await page.getByRole("button", { name: "Filters, 1 active", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Show less", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(last).toHaveAttribute("aria-pressed", "true");
  expect(await last.evaluate(element => (element as HTMLElement).inert)).toBe(false);
});

async function changeWhat(page: Page, search: string) {
  await page.locator('header[data-marketplace-chrome] [data-search-step="what"]').click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "All services and businesses", exact: true }).fill(search);
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

test("the top search picker replaces industry and service tags", async ({ page }) => {
  await page.goto("/search?city=Bucharest&industry=home-services&tagIds=63");
  await expect(page.locator("[data-explore-results-header]")).toBeVisible();
  const browseMore = page.getByRole("button", { name: "More", exact: true });
  await expect(browseMore).toBeHidden();
  await changeWhat(page, "Dental");
  await expect.poll(() => new URL(page.url()).searchParams.get("search")).toBe("Dental");
  expect(new URL(page.url()).searchParams.has("industry")).toBe(false);
  expect(new URL(page.url()).searchParams.has("tagIds")).toBe(false);
  expect(new URL(page.url()).searchParams.get("city")).toBe("Bucharest");
  await expect(page.getByRole("button", { name: "Clear Dental", exact: true })).toBeVisible();
  await expect(browseMore).toBeHidden();
});

test("business matches stay separate from place counts and capped results are disclosed", async ({ page }) => {
  // Replace only browser GET responses. The server/API and their data are untouched.
  const fixture = {
    locations: [{ id: 912345, businessId: 912346, listingId: 912347, slug: "explore-fixture-place", name: "Explore fixture place", locationName: "Explore fixture place", businessName: "Explore fixture business", address: "Test Street 1", city: "Bucharest", latitude: 44.4268, longitude: 26.1025, workingHours: null, open247: true, featuredImage: null, industry: { id: 1, name: "Beauty" }, averageRating: 4.5, totalReviews: 2 }],
    businesses: [{ id: 912346, businessId: 912346, listingId: 912347, primaryLocationId: 912345, slug: "explore-fixture-place", primaryLocationName: "Explore fixture place", name: "Explore fixture business", businessName: "Explore fixture business", city: "Bucharest", country: "Romania", logo: null, featuredImage: null, industry: { id: 1, name: "Beauty" }, averageRating: 4.5, totalReviews: 2, locationsCount: 1, createdAt: "2026-01-01T00:00:00Z" }],
    total: 501, limit: 300, offset: 0, fallback: { applied: false, reason: null },
  };
  await page.route("**/marketplace/public/listings?**", route => route.fulfill({ json: fixture }));
  await page.goto("/search?city=Bucharest&search=ExploreFixture&industry=beauty");
  await changeWhat(page, "ExploreFixtureUpdated");
  await expect(page.locator('[data-biz="912345"]')).toBeVisible();
  await expect(page.getByText("1 place", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Matching businesses", exact: true })).toBeVisible();
  await expect(page.getByText(/Results are limited to 1 of 501 places/)).toBeVisible();
  await page.getByRole("button", { name: /Filters/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  await dialog.getByRole("switch", { name: "Open now", exact: true }).click();
  await dialog.getByRole("button", { name: "Show 1 place", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Matching businesses", exact: true })).toHaveCount(0);
  await expect(page.getByText("1 place", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Filters/ }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Show 1 place", exact: true })).toBeVisible();
});

test("mobile selection clears the sheet and controls; expanded sheet hides card controls from focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplore(page);
  const pin = page.getByRole("list", { name: "Places on the map", exact: true }).getByRole("button").first();
  await pin.focus();
  await pin.press("Enter");
  const close = page.getByRole("button", { name: "Close", exact: true });
  await expect(close).toBeVisible();
  const separator = page.getByRole("separator");
  await expect(separator).toHaveAttribute("aria-valuenow", "0");
  const card = await close.locator("..").boundingBox();
  const sheet = await separator.locator("../../..").boundingBox();
  const recenter = await page.getByRole("button", { name: "Recenter", exact: true }).boundingBox();
  expect(card!.height).toBe(220);
  expect(card!.y + card!.height).toBeLessThanOrEqual(sheet!.y - 10);
  expect(recenter!.y + recenter!.height).toBeLessThanOrEqual(card!.y - 10);
  await separator.focus();
  await separator.press("End");
  await expect(separator).toHaveAttribute("aria-valuenow", "100");
  expect(await page.locator('button[aria-label="Close"]').evaluate(element => !!element.closest("[inert]"))).toBe(true);
});

test("mobile results raise before scrolling and the last row stays inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplore(page);
  const separator = page.getByRole("separator");
  const list = page.locator('[data-locale-scroll="search-results"]');
  await expect(separator).not.toHaveAttribute("aria-valuenow", "100");
  expect(await list.evaluate(element => getComputedStyle(element).overflowY)).toBe("hidden");
  const box = await list.boundingBox();
  await page.mouse.move(box!.x + 100, Math.min(box!.y + 40, 740));
  await page.mouse.wheel(0, 400);
  await expect(separator).toHaveAttribute("aria-valuenow", "100");
  await list.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const last = await page.locator("[data-biz]").last().boundingBox();
  const main = await page.locator("main:not([inert])").boundingBox();
  expect(last!.y + last!.height).toBeLessThanOrEqual(main!.y + main!.height + 1);
  expect(main!.y + main!.height).toBe(page.viewportSize()!.height);
  await expect(page.locator("nav.zw-only-mobile")).toHaveCount(0);
});

for (const screen of [{ locale: "en", width: 390 }, { locale: "ro", width: 320 }]) {
  test(`selected card and recenter fit a short ${screen.locale} phone viewport`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: 568 });
    await page.goto(`${screen.locale === "en" ? "" : "/ro"}/search?lat=44.4268&lng=26.1025&radius=20&mapZoom=11&sort=rating&minRating=4.2`);
    await expect(page.locator("[data-biz]").first()).toBeVisible();
    const map = page.locator('[data-map-ready="true"]');
    await expect(map).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-explore-map-loading]")).toHaveCount(0, { timeout: 30_000 });
    // A nearly covered map must keep a local scale, rather than fitting into
    // the subpixel strip left between a short screen's rail and middle sheet.
    expect(Number(await map.getAttribute("data-map-zoom"))).toBeGreaterThanOrEqual(10);
    const pins = page.getByRole("list", { name: screen.locale === "en" ? "Places on the map" : "Locuri pe hartă", exact: true });
    const pin = pins.getByRole("button").first();
    await pin.focus();
    await pin.press("Enter");
    const close = page.getByRole("button", { name: screen.locale === "en" ? "Close" : "Închide", exact: true });
    await expect(close).toBeVisible();
    const card = await close.locator("..").boundingBox();
    const main = await page.locator("main:not([inert])").boundingBox();
    const recenter = await page.getByRole("button", { name: screen.locale === "en" ? "Recenter" : "Recentrează", exact: true }).boundingBox();
    expect(card!.height).toBeLessThanOrEqual(220);
    expect(card!.height).toBeGreaterThanOrEqual(156);
    expect(recenter!.y).toBeGreaterThanOrEqual(main!.y + 11);
    expect(recenter!.y + recenter!.height).toBeLessThanOrEqual(card!.y - 10);
  });
}

test("real map offers an area search after zooming and persists its expanded radius", async ({ page }) => {
  await openExplore(page);
  const map = page.locator('[data-map-ready="true"]');
  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-explore-map-loading]")).toHaveCount(0, { timeout: 30_000 });
  const before = Number(await map.getAttribute("data-map-zoom"));
  const canvas = await page.locator(".mapboxgl-canvas").boundingBox();
  await page.mouse.move(canvas!.x + canvas!.width / 2, canvas!.y + canvas!.height / 2);
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(1100);
  }
  await expect.poll(async () => before - Number(await map.getAttribute("data-map-zoom"))).toBeGreaterThan(1);
  const area = page.getByRole("button", { name: "Search this area", exact: true });
  await expect(area).toBeVisible();
  await area.click();
  await expect.poll(() => Number(new URL(page.url()).searchParams.get("radius"))).toBeGreaterThan(20);
  const radius = Number(new URL(page.url()).searchParams.get("radius"));
  expect(radius).toBeLessThanOrEqual(50);
  expect(new URL(page.url()).searchParams.has("mapZoom")).toBe(true);
  await page.reload();
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-explore-map-loading]")).toHaveCount(0, { timeout: 30_000 });
  expect(Number(new URL(page.url()).searchParams.get("radius"))).toBe(radius);
});

test("Romanian mobile map fills the viewport and has no nested card actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openExplore(page, "ro");
  const geometry = await page.evaluate(() => {
    const main = document.querySelector("main:not([inert])")!.getBoundingClientRect();
    return { bottom: main.bottom, document: document.documentElement.scrollHeight, viewport: innerHeight };
  });
  expect(geometry.document).toBe(geometry.viewport);
  expect(geometry.bottom).toBe(geometry.viewport);
  await expect(page.locator("nav.zw-only-mobile")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Filtre", exact: true })).toBeVisible();
  expect(await page.locator("[data-biz] a button, [data-biz] button a").count()).toBe(0);
});

async function expectCurrentMapLinkToPreserveState(page: Page, link: Locator, selectionLabel?: string, beforeActivation?: () => Promise<void>) {
  const url = page.url();
  const results = page.locator('[data-locale-scroll="search-results"]');
  await expect(results).toBeVisible();
  const resultNode = await results.elementHandle();
  const resultText = (await results.textContent()) ?? "";
  const requests: string[] = [];
  const recordNavigation = (request: Request) => {
    const target = new URL(request.url());
    if (target.pathname.endsWith("/marketplace/public/listings")
      || (target.pathname.endsWith("/search") && (target.searchParams.has("_rsc") || request.isNavigationRequest()))) requests.push(target.pathname + target.search);
  };
  page.on("request", recordNavigation);
  for (const keyboard of [false, false, true]) {
    await beforeActivation?.();
    await expect(link).toHaveAttribute("aria-current", "page");
    if (keyboard) {
      await link.focus();
      await link.press("Enter");
    } else await link.click();
  }
  // Observe the request scheduling window after pointer and keyboard activation.
  await page.waitForTimeout(250);
  expect(page.url()).toBe(url);
  if (selectionLabel) await expect(page.getByRole("button", { name: selectionLabel, exact: true })).toBeVisible();
  expect(await resultNode!.evaluate(element => element.isConnected)).toBe(true);
  await expect(results).toHaveText(resultText);
  expect(requests).toEqual([]);
  page.off("request", recordNavigation);
}

for (const locale of ["en", "ro"] as const) {
  test(`active map navigation preserves the ${locale} header search without refetching`, async ({ page }) => {
    const dict = locale === "en" ? en : ro;
    const query = new URLSearchParams({ city: "Navigation test area", lat: "48.85", lng: "2.35", radius: "42", mapZoom: "10.5", search: "Navigation test", date: "2026-12-10", sort: "rating", minRating: "4.2", maxKm: "5", openNow: "1", amenities: "991001" });
    await page.goto(`${locale === "en" ? "" : "/ro"}/search?${query}`);
    const selectionLabel = dict.search.clearSelection.replace("{selection}", "Navigation test");
    await expect(page.getByRole("button", { name: selectionLabel, exact: true })).toBeVisible();
    const explore = page.locator("header[data-marketplace-chrome]").getByRole("link", { name: dict.nav.explore, exact: true });
    await expectCurrentMapLinkToPreserveState(page, explore, selectionLabel);
  });
}

test("active map navigation opens Explore from another page and does not refresh bare search", async ({ page }) => {
  await page.goto("/help");
  const explore = page.locator("header[data-marketplace-chrome]").getByRole("link", { name: en.nav.explore, exact: true });
  await explore.click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/search");
  expect(new URL(page.url()).search).toBe("");
  await expectCurrentMapLinkToPreserveState(page, explore);
});

for (const locale of ["en", "ro"] as const) {
  test(`active map navigation preserves the ${locale} mobile menu Search query`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dict = locale === "en" ? en : ro;
    const searchText = locale === "en" ? "Navigation test" : "Căutare test";
    const query = new URLSearchParams({ lat: "48.85", lng: "2.35", radius: "42", mapZoom: "10.5", search: searchText, date: "2026-12-10", sort: "rating", minRating: "4.2" });
    await page.goto(`${locale === "en" ? "" : "/ro"}/search?${query}`);
    const selectionLabel = dict.search.clearSelection.replace("{selection}", searchText);
    await expect(page.getByRole("button", { name: selectionLabel, exact: true })).toBeVisible();
    const menu = page.getByRole("dialog", { name: dict.nav.navigation, exact: true });
    const search = menu.getByRole("link", { name: dict.mobileTabs.search, exact: true });
    const openMenu = async () => {
      await page.locator("header[data-marketplace-chrome]").getByRole("button", { name: dict.nav.openMenu, exact: true }).click();
      await expect(menu).toBeVisible();
    };
    await expectCurrentMapLinkToPreserveState(page, search, selectionLabel, openMenu);
    await expect(menu).toHaveCount(0);
  });
}

test("mobile menu keeps keyboard focus, lets the language drawer close first and restores its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/search?lat=44.4268&lng=26.1025&radius=20");
  const trigger = page.locator("header[data-marketplace-chrome]").getByRole("button", { name: en.nav.openMenu, exact: true });
  const menu = page.getByRole("dialog", { name: en.nav.navigation, exact: true });
  const overflow = await page.evaluate(() => document.body.style.overflow);
  await trigger.focus();
  await trigger.press("Enter");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: en.mobileTabs.explore, exact: true })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: en.nav.homeAria, exact: true })).toBeVisible();
  await expect(menu.getByRole("link", { name: en.nav.homeAria, exact: true })).toHaveAttribute("href", "/");
  await expect(menu.getByRole("link", { name: en.mobileTabs.search, exact: true })).toBeVisible();
  await expect(menu.getByRole("link", { name: en.mobileTabs.search, exact: true })).toHaveAttribute("href", "/search");
  await expect(menu.getByRole("link", { name: en.accountMenu.helpSupport, exact: true })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  const language = menu.locator("[data-mobile-language]").getByRole("button");
  const drawer = page.getByRole("dialog", { name: en.language.label, exact: true });
  await language.click();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "English", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(menu).toBeVisible();
  await expect(language).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(overflow);
  expect(await page.evaluate(() => document.body.dataset.mobileMenuEngaged)).toBeUndefined();
});

test("mobile Search avoids input autofocus and its drawer handle resets cancelled drags before dismissing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/help");
  const trigger = page.locator("header[data-marketplace-chrome]").getByRole("button", { name: en.nav.search, exact: true });
  const drawer = page.getByRole("dialog", { name: en.searchOverlay.overlayTitle, exact: true });
  await trigger.click();
  await expect(drawer).toBeFocused();
  // Wait beyond the desktop input's delayed autofocus, including after the
  // active search step changes back to What.
  await page.waitForTimeout(300);
  await expect(drawer).toBeFocused();
  const sections = drawer.locator("[data-search-section]");
  await sections.nth(1).locator("button[aria-expanded]").first().click();
  await expect(sections.nth(1)).toHaveAttribute("data-open", "true");
  await sections.nth(0).locator("button[aria-expanded]").first().click();
  await page.waitForTimeout(300);
  await expect(drawer.getByRole("textbox", { name: en.searchOverlay.whatPlaceholder, exact: true })).not.toBeFocused();
  expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);

  const handle = drawer.locator("[data-drawer-handle]");
  const top = (await drawer.boundingBox())!.y;
  for (const distance of [36, 160]) {
    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + distance, { steps: 6 });
    await expect(drawer).toHaveAttribute("data-drawer-dragging", "true");
    await handle.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y + distance });
    await page.mouse.up();
    await expect(drawer).toBeVisible();
    await expect(drawer).not.toHaveAttribute("data-drawer-dragging");
    await expect(drawer).toHaveCSS("transform", "none");
    expect((await drawer.boundingBox())!.y).toBe(top);
  }

  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160, { steps: 6 });
  await page.mouse.up();
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile language drawer handle dismisses only the nested drawer and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/help");
  await page.locator("header[data-marketplace-chrome]").getByRole("button", { name: en.nav.openMenu, exact: true }).click();
  const menu = page.getByRole("dialog", { name: en.nav.navigation, exact: true });
  const language = menu.locator("[data-mobile-language]").getByRole("button");
  const drawer = page.getByRole("dialog", { name: en.language.label, exact: true });
  await language.click();
  await expect(drawer).toBeVisible();
  const handle = drawer.locator("[data-drawer-handle]");
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 100, { steps: 6 });
  await page.mouse.up();
  await expect(drawer).toHaveCount(0);
  await expect(menu).toBeVisible();
  await expect(language).toBeFocused();

  await language.press("Enter");
  await expect(drawer).toBeVisible();
  await handle.focus();
  await handle.press("Enter");
  await expect(drawer).toHaveCount(0);
  await expect(menu).toBeVisible();
  await expect(language).toBeFocused();
});

test("mobile Search drag release keeps the paper opaque through its smooth exit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/help");
  const trigger = page.locator("header[data-marketplace-chrome]").getByRole("button", { name: en.nav.search, exact: true });
  const drawer = page.getByRole("dialog", { name: en.searchOverlay.overlayTitle, exact: true });
  await trigger.click();
  await expect(drawer).toBeVisible();
  await drawer.evaluate(async element => {
    await Promise.all([...element.getAnimations(), ...element.parentElement!.getAnimations()].map(animation => animation.finished.catch(() => {})));
  });
  const handle = drawer.locator("[data-drawer-handle]");
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160, { steps: 6 });

  // Pause both release animations at creation, so a busy test host cannot skip
  // past the middle of the movement before its opacity and position are read.
  await drawer.evaluate(element => {
    for (const target of [element, element.parentElement!]) {
      const animate = target.animate;
      target.animate = (keyframes, options) => {
        const animation = animate.call(target, keyframes, options);
        animation.pause();
        animation.currentTime = 160;
        target.animate = animate;
        return animation;
      };
    }
  });
  await page.mouse.up();
  const midpoint = await drawer.evaluate(element => {
    const movement = element.getAnimations().find(animation => animation.effect instanceof KeyframeEffect
      && animation.effect.getKeyframes().some(frame => typeof frame.transform === "string"));
    const backdrop = element.parentElement!.getAnimations().find(animation => animation.effect instanceof KeyframeEffect
      && animation.effect.getKeyframes().some(frame => typeof frame.backgroundColor === "string"));
    if (!movement || !backdrop) throw new Error("Expected separate paper movement and backdrop paint animations");
    const opacity: string[] = [];
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) opacity.push(getComputedStyle(ancestor).opacity);
    return {
      connected: element.isConnected,
      state: element.getAttribute("data-state"),
      duration: movement.effect!.getTiming().duration,
      easing: movement.effect!.getTiming().easing,
      playState: movement.playState,
      backdropPlayState: backdrop.playState,
      translation: new DOMMatrixReadOnly(getComputedStyle(element).transform).m42,
      height: element.getBoundingClientRect().height,
      opacity,
    };
  });
  expect(midpoint.connected).toBe(true);
  expect(midpoint.state).toBe("open");
  expect(midpoint.duration).toBe(320);
  expect(midpoint.easing).toBe("cubic-bezier(0.2, 0.7, 0.3, 1)");
  expect(midpoint.playState).toBe("paused");
  expect(midpoint.backdropPlayState).toBe("paused");
  expect(midpoint.translation).toBeGreaterThan(160);
  expect(midpoint.translation).toBeLessThan(midpoint.height - 5);
  expect(midpoint.opacity.every(opacity => opacity === "1")).toBe(true);
  await drawer.evaluate(element => {
    [...element.getAnimations(), ...element.parentElement!.getAnimations()].forEach(animation => animation.play());
  });
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile Filters drawer keeps drafts private through dragging and applies only confirmed choices", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  const amenities = Array.from({ length: 24 }, (_, index) => ({ id: 992000 + index, slug: `drawer-feature-${index + 1}`, name: `Drawer feature ${index + 1}` }));
  await page.route("**/marketplace/public/venue-tags", route => route.fulfill({ json: { amenities, paymentMethods: [], languages: [] } }));
  const query = new URLSearchParams({ city: "Bucharest", lat: "44.4268", lng: "26.1025", radius: "40" });
  await page.goto(`/search?${query}`);
  await expect(page.locator("[data-biz]").first()).toBeVisible();
  const url = page.url();
  const t = en.search.filters;
  const trigger = page.getByRole("button", { name: t.title, exact: true });
  const dialog = page.getByRole("dialog", { name: t.title, exact: true });
  await trigger.click();
  const handle = dialog.locator("[data-drawer-handle]");
  await expect(handle).toBeVisible();
  const rating = dialog.getByRole("button", { name: "4.5+", exact: true });
  await rating.click();
  await expect(rating).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).toBe(url);

  const header = dialog.locator("[data-filter-header]");
  const footer = dialog.locator("[data-filter-footer]");
  const body = dialog.locator("[data-filter-body]");
  const headerTop = (await header.boundingBox())!.y;
  const footerTop = (await footer.boundingBox())!.y;
  await expect.poll(() => body.evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
  const bodyBox = (await body.boundingBox())!;
  await page.mouse.move(bodyBox.x + bodyBox.width / 2, bodyBox.y + bodyBox.height / 2);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await header.boundingBox())!.y).toBe(headerTop);
  expect((await footer.boundingBox())!.y).toBe(footerTop);

  const frameTop = (await dialog.boundingBox())!.y;
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160, { steps: 6 });
  await expect(dialog).toHaveAttribute("data-drawer-dragging", "true");
  await handle.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y + 160 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect.poll(async () => (await dialog.boundingBox())!.y).toBe(frameTop);
  await expect(rating).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).toBe(url);

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 160, { steps: 6 });
  await page.mouse.up();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(page.url()).toBe(url);

  await trigger.click();
  await expect(rating).toHaveAttribute("aria-pressed", "false");
  await rating.click();
  const apply = dialog.getByRole("button", { name: /^Show \d+ places?$/ });
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.get("minRating")).toBe("4.5");
  const applied = new URL(page.url()).searchParams;
  expect(applied.get("lat")).toBe(query.get("lat"));
  expect(applied.get("lng")).toBe(query.get("lng"));
});
