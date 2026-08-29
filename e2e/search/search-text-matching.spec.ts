import { expect, test } from '@playwright/test'

/**
 * Free-text matching on /search (`search` param — NOT `q`).
 *
 * Backend note (read from admin-api/src/modules/marketplace/public/marketplace-public.service.ts):
 * free text matches LOCATION names for the primary `locations` group (pg_trgm
 * fuzzy + ILIKE substring), and separately matches BUSINESS names for a
 * supplementary `businesses` group (searchBusinessesByName) — business name is
 * intentionally NOT matched against the locations group. So a business-name
 * query like "Atelier Glow" (whose locations are actually named "Centrul
 * Vechi"/"Băneasa") only ever surfaces via the businesses group, not as a
 * `[data-biz]` location row. A location-name query resolves via the primary,
 * fuzzy-tolerant `locations` group and DOES render `[data-biz]` rows.
 */
test.describe('Search — free-text matching', () => {
  test('SRCH-01 exact business-name search surfaces the business; a location-name typo still fuzzy-matches', async ({ page }) => {
    // Exact business name — resolves via the supplementary "businesses" group,
    // not a location row. The query text is echoed TWICE independent of any
    // match — once in the header "What" search pill, once in the panel's
    // "Edit search" button — so a real match reads as a THIRD occurrence of
    // "Atelier Glow" (the business card itself). Verified against a live
    // run's aria snapshot (the original brief assumed only one echo).
    await page.goto('/search?search=' + encodeURIComponent('Atelier Glow'))
    await expect(page.getByText('Atelier Glow', { exact: true })).toHaveCount(3, { timeout: 15_000 })

    // Location-name typo (missing the ț diacritic): "Aviatiei" vs. the seeded
    // location name "Aviației" (Barber Bros' Aviației branch). This goes
    // through the LOCATION match path, so a hit renders as a real `[data-biz]`
    // row (fuzzy pg_trgm match — see the `%` operator on mp.locationName).
    await page.goto('/search?search=' + encodeURIComponent('Aviatiei'))
    const rows = page.locator('[data-biz]')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Aviaț', { exact: false }).first()).toBeVisible()
  })

  test('SRCH-07 an unconstrained nonsense query falls back to recommendations, never the empty state', async ({ page }) => {
    // IMPORTANT FINDING (adapted from the original brief, confirmed across
    // two live runs): a nonsense FREE-TEXT query alone does NOT render the
    // empty state. When the direct location query returns zero rows and the
    // request isn't `strict`, the backend's relaxation ladder
    // (runRelaxationLadder in marketplace-public.service.ts) falls through
    // to a final "RECOMMENDED" step that drops the search text (and, per
    // the ladder's own rungs, industry/tags too) and returns generic
    // top-rated locations — by design ("Empty filters return the
    // latest/top-rated locations", per the service's own doc comment).
    //
    // SECOND FINDING, from two separate live attempts to reach the true
    // empty state, BOTH contradicted this test's original premise:
    //   1. `city=Bucuresti` (real city) + `industry=baseline-dental` (real
    //      industry, zero Dental businesses in Bucharest) still returned
    //      Cluj Centru — `city` is not applied as a hard AND-filter once
    //      other params are present.
    //   2. `industry=<nonexistent slug>` alone falls through the SAME
    //      industry-dropping rung of the relaxation ladder (confirmed at
    //      marketplace-public.service.ts:1936, `if (dto.industryId ||
    //      dto.industrySlug) { ... }` unconditionally relaxes it) unless
    //      `strict` is set — and the frontend only ever sets `strict` when
    //      `city` is present, which loops back to finding #1.
    // Reaching the genuine empty state through the real UI needs further
    // investigation (a `search` + `strict`-eligible combination this repo's
    // demo dataset doesn't obviously provide) — left as a follow-up rather
    // than a low-confidence guess. This test instead locks down the ONE
    // behavior verified twice: the fallback-to-recommendations path itself.
    await page.goto('/search?search=' + encodeURIComponent('zzzxxxqqqnonsense123'))
    await expect(page.getByText('No places match those filters')).toHaveCount(0, {
      timeout: 15_000,
    })
    await expect(page.locator('[data-biz]').first()).toBeVisible({ timeout: 15_000 })
  })
})
