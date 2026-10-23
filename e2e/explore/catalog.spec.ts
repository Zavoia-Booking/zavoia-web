import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { en } from "@/i18n/dictionaries/en";
import { ro } from "@/i18n/dictionaries/ro";
import type { Industry } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";

async function publicTaxonomy(request: APIRequestContext): Promise<Industry[]> {
  const apiURL = process.env.EXPLORE_E2E_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const response = await request.get(`${apiURL.replace(/\/$/, "")}/marketplace/public/industries`);
  expect(response.ok()).toBe(true);
  const industries = await response.json() as Industry[];
  expect(industries.some(industry => industry.tags.length > 0)).toBe(true);
  return industries;
}

async function openMapCatalog(page: Page, locale: "en" | "ro" = "en") {
  const dict = locale === "en" ? en : ro;
  const trigger = page.getByRole("group", { name: dict.searchOverlay.browseByIndustry, exact: true })
    .getByRole("button", { name: dict.search.browseMore, exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: dict.serviceCatalog.title, exact: true });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

async function expectCenteredSelection(rail: Locator, selection: Locator) {
  await expect.poll(async () => {
    const [railBox, selectionBox] = await Promise.all([rail.boundingBox(), selection.boundingBox()]);
    if (!railBox || !selectionBox) return Infinity;
    return Math.abs((selectionBox.x + selectionBox.width / 2) - (railBox.x + railBox.width / 2));
  }).toBeLessThanOrEqual(1);
}

test("map More opens a dedicated catalog with one selected industry or All and restores focus", async ({ page }) => {
  await page.goto("/search?lat=48.85&lng=2.35");
  const { trigger, dialog } = await openMapCatalog(page);
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await expect(dialog.locator("[data-search-step]")).toHaveCount(0);
  const filters = dialog.getByRole("group", { name: en.serviceCatalog.industries, exact: true });
  const services = dialog.getByRole("region", { name: en.serviceCatalog.services, exact: true });
  const all = filters.getByRole("button", { name: en.serviceCatalog.allIndustries, exact: true });
  await expect(all).toBeFocused();
  const first = filters.getByRole("button").nth(1);
  const second = filters.getByRole("button").nth(2);
  const names = [(await first.innerText()).trim(), (await second.innerText()).trim()];
  await first.click();
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(services.getByRole("heading")).toHaveCount(1);
  await expect(services.getByRole("heading", { name: names[0], exact: true })).toBeVisible();
  await second.click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(services.getByRole("heading")).toHaveCount(1);
  await expect(services.getByRole("heading", { name: names[1], exact: true })).toBeVisible();
  await expect(services.getByRole("heading", { name: names[0], exact: true })).toHaveCount(0);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(services.getByRole("heading")).toHaveCount(1);
  await all.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  expect(await services.getByRole("heading").count()).toBeGreaterThan(2);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("choosing an actual service preserves map location, date and refinements", async ({ page, request }) => {
  const industries = await publicTaxonomy(request);
  const industry = industries.find(item => item.tags.length > 0)!;
  const tag = industry.tags[0];
  const query = new URLSearchParams({
    city: "Catalog test area", lat: "48.85", lng: "2.35", radius: "42", mapZoom: "10.5", date: "2026-12-10",
    sort: "rating", minRating: "4.2", maxKm: "5", openNow: "1", open247: "1", amenities: "991001", payments: "991002", languages: "991003",
  });
  await page.goto(`/search?${query}`);
  const { dialog } = await openMapCatalog(page);
  const services = dialog.getByRole("region", { name: en.serviceCatalog.services, exact: true });
  const group = services.getByRole("heading", { name: taxonomyLabel(industry, "en", en.industries), exact: true }).locator("..");
  await group.getByRole("button", { name: taxonomyLabel(tag, "en", en.industryTags), exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.get("industry")).toBe(industry.slug);
  await expect.poll(() => new URL(page.url()).searchParams.get("tagIds")).toBe(String(tag.id));
  const result = new URL(page.url()).searchParams;
  for (const [key, value] of query) expect(result.get(key), `${key} stays in the search`).toBe(value);
  expect(result.has("search")).toBe(false);
  expect(new URL(page.url()).pathname).toBe("/search");
});

test("homepage catalog keeps its standalone link and industry tiles select services directly", async ({ page, request }) => {
  const industries = await publicTaxonomy(request);
  await page.goto("/");
  const browse = page.getByRole("region", { name: en.searchOverlay.browseByIndustry, exact: true });
  const seeAll = browse.getByRole("link", { name: en.searchOverlay.seeAllIndustries, exact: true });
  await expect(seeAll).toHaveAttribute("href", "/industries");
  await seeAll.click();
  const dialog = page.getByRole("dialog", { name: en.serviceCatalog.title, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: en.serviceCatalog.allIndustries, exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(new URL(page.url()).pathname).toBe("/");
  await page.keyboard.press("Escape");
  await expect(seeAll).toBeFocused();

  const tile = browse.locator('a[aria-haspopup="dialog"][href*="/search?industry="]').first();
  const slug = new URL((await tile.getAttribute("href"))!, page.url()).searchParams.get("industry");
  const industry = industries.find(item => item.slug === slug)!;
  expect(industry.tags.length).toBeGreaterThan(0);
  await tile.click();
  const filters = dialog.getByRole("group", { name: en.serviceCatalog.industries, exact: true });
  await expect(filters.getByRole("button", { name: taxonomyLabel(industry, "en", en.industries), exact: true })).toHaveAttribute("aria-pressed", "true");
  const services = dialog.getByRole("region", { name: en.serviceCatalog.services, exact: true });
  await expect(services.getByRole("heading")).toHaveCount(1);
  const tag = industry.tags[0];
  await services.getByRole("button", { name: taxonomyLabel(tag, "en", en.industryTags), exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/search");
  await expect.poll(() => new URL(page.url()).searchParams.get("industry")).toBe(industry.slug);
  expect(new URL(page.url()).searchParams.get("tagIds")).toBe(String(tag.id));
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Romanian mobile catalog selects one industry, resets to All when reopened and keeps the locale", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const industries = await publicTaxonomy(request);
  await page.goto("/ro/search?lat=48.85&lng=2.35");
  const { trigger, dialog } = await openMapCatalog(page, "ro");
  const filters = dialog.getByRole("group", { name: ro.serviceCatalog.industries, exact: true });
  const all = filters.getByRole("button", { name: ro.serviceCatalog.allIndustries, exact: true });
  const services = dialog.getByRole("region", { name: ro.serviceCatalog.services, exact: true });
  const first = filters.getByRole("button").nth(1);
  const second = filters.getByRole("button").nth(2);
  const secondName = (await second.innerText()).trim();
  await first.click();
  await second.click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(services.getByRole("heading")).toHaveCount(1);
  await expect(services.getByRole("heading", { name: secondName, exact: true })).toBeVisible();
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(services.getByRole("heading")).toHaveCount(1);
  await all.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  expect(await services.getByRole("heading").count()).toBeGreaterThan(2);
  await first.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { pressed: true })).toHaveCount(1);
  const industry = industries.find(item => item.tags.length > 0)!;
  const tag = industry.tags[0];
  await filters.getByRole("button", { name: taxonomyLabel(industry, "ro", ro.industries), exact: true }).click();
  await dialog.getByRole("region", { name: ro.serviceCatalog.services, exact: true })
    .getByRole("button", { name: taxonomyLabel(tag, "ro", ro.industryTags), exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.get("industry")).toBe(industry.slug);
  expect(new URL(page.url()).searchParams.get("tagIds")).toBe(String(tag.id));
  expect(new URL(page.url()).pathname).toBe("/ro/search");
});

test("clearing a selected service preserves location, date and refinements and restores the daily suggestions", async ({ page, request }) => {
  const industries = await publicTaxonomy(request);
  const industry = industries.find(item => item.tags.length > 0)!;
  const tag = industry.tags[0];
  const query = new URLSearchParams({
    city: "Catalog test area", lat: "48.85", lng: "2.35", radius: "42", mapZoom: "10.5", date: "2026-12-10",
    sort: "rating", minRating: "4.2", maxKm: "5", openNow: "1", open247: "1", amenities: "991001", payments: "991002", languages: "991003",
  });
  await page.goto(`/search?${query}`);
  const rail = page.getByRole("group", { name: en.searchOverlay.browseByIndustry, exact: true });
  await expect.poll(() => rail.getByRole("button").count()).toBeGreaterThan(1);
  const suggestions = (await rail.getByRole("button").allTextContents()).map(text => text.trim());
  const { trigger: more, dialog } = await openMapCatalog(page);
  const services = dialog.getByRole("region", { name: en.serviceCatalog.services, exact: true });
  const group = services.getByRole("heading", { name: taxonomyLabel(industry, "en", en.industries), exact: true }).locator("..");
  await group.getByRole("button", { name: taxonomyLabel(tag, "en", en.industryTags), exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const clear = rail.getByRole("button", { name: en.search.clearSelection.replace("{selection}", taxonomyLabel(tag, "en", en.industryTags)), exact: true });
  await expect(clear).toBeVisible();
  await expect(clear).toBeFocused();
  await expect(more).toBeHidden();
  await expect(rail.getByRole("button")).toHaveCount(1);
  await expectCenteredSelection(rail, clear);
  await clear.click();
  await expect.poll(() => new URL(page.url()).searchParams.has("industry")).toBe(false);
  const result = new URL(page.url()).searchParams;
  for (const key of ["search", "industry", "tagIds"]) expect(result.has(key)).toBe(false);
  for (const [key, value] of query) expect(result.get(key), `${key} stays in the search after clearing`).toBe(value);
  await expect(clear).toBeHidden();
  await expect(more).toBeFocused();
  await expect.poll(async () => (await rail.getByRole("button").allTextContents()).map(text => text.trim())).toEqual(suggestions);
  await more.click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: en.serviceCatalog.allIndustries, exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  const teaser = rail.getByRole("button").first();
  const teaserLabel = (await teaser.innerText()).trim();
  await teaser.focus();
  await teaser.press("Enter");
  const teaserClear = rail.getByRole("button", { name: en.search.clearSelection.replace("{selection}", teaserLabel), exact: true });
  await expect(teaserClear).toBeFocused();
  await expect(more).toBeHidden();
  await teaserClear.press("Enter");
  await expect(more).toBeFocused();
  await expect(teaserClear).toBeHidden();
});

test("Romanian mobile clears an industry selection and keeps the expanded sheet's rail inert", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const industries = await publicTaxonomy(request);
  const industry = industries.find(item => item.tags.length > 0)!;
  const query = new URLSearchParams({ lat: "48.85", lng: "2.35", radius: "20", date: "2026-12-10", industry: industry.slug });
  await page.goto(`/ro/search?${query}`);
  const label = ro.search.clearSelection.replace("{selection}", taxonomyLabel(industry, "ro", ro.industries));
  const rail = page.getByRole("group", { name: ro.searchOverlay.browseByIndustry, exact: true });
  const clear = page.getByRole("button", { name: label, exact: true, includeHidden: true });
  const more = page.getByRole("button", { name: ro.search.browseMore, exact: true });
  await expect(clear).toBeVisible();
  await expect(more).toBeHidden();
  await expect(rail.getByRole("button")).toHaveCount(1);
  await expectCenteredSelection(rail, clear);
  const sheet = page.getByRole("separator");
  await sheet.focus();
  await sheet.press("End");
  await expect(sheet).toHaveAttribute("aria-valuenow", "100");
  expect(await clear.evaluate(element => !!element.closest("[inert]"))).toBe(true);
  await expect(more).toBeHidden();
  await sheet.press("Home");
  await expect(sheet).toHaveAttribute("aria-valuenow", "0");
  await clear.focus();
  await clear.press("Enter");
  await expect.poll(() => new URL(page.url()).searchParams.has("industry")).toBe(false);
  await expect(clear).toBeHidden();
  await expect(more).toBeFocused();
  const result = new URL(page.url()).searchParams;
  for (const key of ["lat", "lng", "radius", "date"]) expect(result.get(key)).toBe(query.get(key));
  expect(new URL(page.url()).pathname).toBe("/ro/search");
  await more.press("Enter");
  await expect(page.getByRole("dialog", { name: ro.serviceCatalog.title, exact: true })).toBeVisible();
});
