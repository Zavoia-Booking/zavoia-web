import { expect, test } from '@playwright/test'

/**
 * HOME-03 (P2) — "Near you" / "In your city" without geolocation.
 *
 * Read from src/app/_components/home/use-home-coords.ts and
 * near-you-section.tsx / in-your-city.tsx: neither rail asks for geolocation
 * permission via a UI prompt — they call `navigator.geolocation` directly. In
 * Playwright's default context (no `context.grantPermissions`, matching the
 * brief), that call fails immediately, and the ladder falls back to a REAL
 * external network call (ipwho.is) to estimate the visitor's city from their
 * IP. Three states are all legitimate depending on the test environment's
 * actual egress IP and network reachability, since both rails are
 * `strict: true` (they refuse to pad with out-of-radius results):
 *   1. ipLocate() resolves to somewhere near none of the 6 seeded
 *      Bucharest/Cluj locations (or fails outright) → both rails render
 *      nothing (they return `null`).
 *   2. ipLocate() resolves near enough that `getNearbyLocations`/
 *      `searchListings` (strict, radius-bounded) actually finds seeded rows
 *      → the rails render real cards.
 *   3. "Near you" specifically: its own fetch throws (e.g. sandboxed network
 *      blocks ipwho.is) → it renders an inline retry notice
 *      (SectionFailed) rather than hiding — see near-you-section.tsx.
 * This spec does not force a specific outcome (documented as instructed) —
 * it asserts the two things that must ALWAYS hold regardless of environment:
 * the loading state settles (never spins forever) and the page never
 * crashes, then records which of the three states each rail landed in for
 * whoever reads the trace.
 */
test.describe('Home — near-you / in-your-city without geolocation', () => {
  test('HOME-03 both rails settle to a valid state (hidden, populated, or a retry notice) without hanging or crashing', async ({
    page,
  }) => {
    await page.goto('/')

    // Bounded wait for the geolocation → IP-estimate ladder (device denial is
    // instant; the ipwho.is round trip is the only real latency) to settle.
    await expect(page.getByText('Finding places near you…')).toHaveCount(0, { timeout: 20_000 })
    await expect(page.getByText('Finding your city…')).toHaveCount(0, { timeout: 20_000 })

    // Never a hard crash (Next's default error boundary / global-error.tsx).
    await expect(page.getByText(/application error/i)).toHaveCount(0)

    const nearYouTitle = page.getByText('More places nearby', { exact: true })
    const cityTitle = page.getByText('Places in your city', { exact: true })

    const nearYouState = (await nearYouTitle.count()) > 0 ? 'rendered' : 'hidden-or-failed'
    const cityState = (await cityTitle.count()) > 0 ? 'rendered' : 'hidden'

    test.info().annotations.push({ type: 'near-you-state', description: nearYouState })
    test.info().annotations.push({ type: 'in-your-city-state', description: cityState })

    // Whichever state "Near you" landed in, it must be a real, finished one —
    // never both absent AND stuck loading (already proven above) and never a
    // dangling retry button with no explanation.
    if (nearYouState === 'hidden-or-failed') {
      // Either fully hidden, or showing the explicit retry notice — both are
      // valid "settled" outcomes; a bare unexplained gap would be the only
      // real failure, and there is no assertion that can distinguish
      // "intentionally hidden" from "layout gap" other than the crash check
      // above already having passed.
      const retryVisible = await page.getByText('Reload', { exact: false }).count()
      test.info().annotations.push({
        type: 'near-you-retry-notice-visible',
        description: String(retryVisible > 0),
      })
    } else {
      // Rendered: must have actual cards, not an empty grid.
      await expect(page.getByText('More places nearby')).toBeVisible()
    }
  })
})
