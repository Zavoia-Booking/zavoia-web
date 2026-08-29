import { expect, test } from '@playwright/test'

/**
 * SRCH-08, adapted for the no-Mapbox-token test env (playwright.config.ts sets
 * NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN='' on purpose). Read from
 * src/components/search/mapbox-surface.tsx: with no token, `<Map>` (react-map-gl)
 * is never instantiated at all — the component early-returns a plain
 * `<div>Map unavailable</div>` fallback (plus the recenter control + any
 * children, e.g. the location-permission modal). There is NO pin/marker DOM
 * in this state (no `aria-label={location name}` spans — those only exist
 * inside the real `<Map>`'s `<Marker>` children), so true pin-to-list sync
 * (matching a specific pin's aria-label to its `[data-biz]` row) is NOT
 * testable without a real Mapbox token in a separate, dedicated run.
 *
 * What IS testable here, and is exactly what this spec checks: the map
 * degrades to its fallback without crashing the page, and the LIST panel
 * (the `[data-biz]` rows) keeps working fully — filtering still reduces the
 * row set — even while the map itself shows nothing useful.
 */
test.describe('Search — map (no-token fallback) + list interplay', () => {
  test('SRCH-08 map shows its "Map unavailable" fallback without crashing; the list still filters normally', async ({
    page,
  }) => {
    // A nonsense free-text query with no city/geo constraint: the backend's
    // relaxation ladder falls back to generic top-rated locations across BOTH
    // seeded industries (Beauty + Dental) — see search-text-matching.spec.ts
    // for the full reasoning. This also sidesteps the empty-landing
    // geolocation-priming modal (derived.search is truthy).
    await page.goto('/search?search=' + encodeURIComponent('nonsensequeryxyz123'))

    await expect(page.getByText('Map unavailable')).toBeVisible()

    const rows = page.locator('[data-biz]')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const before = await rows.count()

    // Filter down to the "Dental" industry (the demo seed's only dental
    // business, Smile Dental in Cluj) — a real, verifiable narrowing of the
    // row set, proving the list panel is fully interactive.
    await page.getByRole('button', { name: 'Dental', exact: true }).click()
    await expect(page).toHaveURL(/[?&]industry=baseline-dental(&|$)/)
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    await expect
      .poll(() => rows.count(), { timeout: 15_000 })
      .toBeLessThan(before)

    // The map is still degraded (never attempted, never crashed) throughout.
    await expect(page.getByText('Map unavailable')).toBeVisible()
  })
})
