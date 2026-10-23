import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { ListingDetail, ProfessionalReview, TeamMemberProfile } from "../../src/lib/api/marketplace/types";

// Read-only browser checks against the existing local app. Run with a standalone
// config, not the repository's default config, which provisions its own database.
// The profile/review responses are intercepted in this browser; no fixtures are saved.
const slug = process.env.LOCATION_AUDIT_SLUG ?? "cs-derma-floreasca";
const apiUrl = process.env.LOCATION_AUDIT_API_URL ?? "http://localhost:3000";

function reviews(count: number): ProfessionalReview[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    rating: 4,
    comment: `Audit review ${index + 1}`,
    createdAt: "2026-10-01T12:00:00.000Z",
    customer: { firstName: "Review", lastName: `${index + 1}.`, profileImage: null },
  }));
}

async function prepareProfile(page: Page, request: APIRequestContext, total: number) {
  const response = await request.get(`${apiUrl}/marketplace/public/listing/${slug}`);
  expect(response.ok()).toBe(true);
  const listing: ListingDetail = await response.json();
  const member = listing.teamMembers[0];
  expect(member, "The existing location fixture needs a public team member").toBeTruthy();
  const allReviews = reviews(total);
  const profile: TeamMemberProfile = {
    ...member,
    yearsOfExperience: 5,
    visitsCompleted: 20,
    memberSince: "2020-01-01T12:00:00.000Z",
    about: null,
    services: [],
    portfolio: [],
    reviews: allReviews.slice(0, 50),
    reviewStats: { totalCount: total, averageRating: 4 },
  };
  await page.route(`**/marketplace/public/listing/${listing.listingId}/team-member/${member.id}*`, (route) =>
    route.fulfill({ json: profile }),
  );
  return { member, allReviews };
}

test("professional reviews paginate past 50 and preserve loaded reviews after a failed request", async ({ page, request }) => {
  const { member, allReviews } = await prepareProfile(page, request, 61);
  const offsets: number[] = [];
  let releaseFirstPage: (() => void) | undefined;
  await page.route(`**/marketplace/public/team-member/${member.id}/reviews?*`, async (route) => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    offsets.push(offset);
    expect(limit).toBe(10);
    if (offsets.length === 1) {
      await route.fulfill({ status: 500, json: { message: "Review request failed" } });
      return;
    }
    if (offsets.length === 2) {
      await new Promise<void>((resolve) => { releaseFirstPage = resolve; });
    }
    await route.fulfill({
      json: {
        data: allReviews.slice(offset, offset + limit),
        pagination: { offset, limit, total: allReviews.length },
      },
    });
  });

  await page.goto(`/business/${slug}?tab=team&member=${member.id}`);
  const dialog = page.getByRole("dialog").first();
  const renderedReviews = dialog.locator("p").filter({ hasText: /^Audit review \d+$/ });
  const more = dialog.getByRole("button", { name: "Show more reviews" });
  await expect(renderedReviews).toHaveCount(4);
  await expect(dialog.getByRole("img", { name: "4 out of 5 stars", exact: true })).toHaveCount(5);

  await more.click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(renderedReviews).toHaveCount(50);
  expect(offsets).toEqual([50]);

  await more.click();
  await expect.poll(() => offsets.length).toBe(2);
  await expect(more).toBeDisabled();
  await expect(more).toHaveAttribute("aria-busy", "true");
  await expect(renderedReviews).toHaveCount(50);
  releaseFirstPage!();
  await expect(renderedReviews).toHaveCount(60);
  await expect(dialog.getByRole("alert")).toHaveCount(0);

  await more.click();
  await expect(renderedReviews).toHaveCount(61);
  await expect(more).toHaveCount(0);
  expect(offsets).toEqual([50, 50, 60]);
});

test("review stars expose a localized Romanian accessible name", async ({ page, request }) => {
  const { member } = await prepareProfile(page, request, 3);
  await page.goto(`/ro/business/${slug}?tab=team&member=${member.id}`);
  const dialog = page.getByRole("dialog").first();
  await expect(dialog.getByRole("img", { name: "4 din 5 stele", exact: true })).toHaveCount(4);
  await expect(dialog.getByRole("button", { name: "Vezi mai multe recenzii" })).toHaveCount(0);
  await expect(dialog.locator(".zw-member-main")).not.toHaveClass(/zw-noscrollbar/);
});
