import type { Page } from '@playwright/test'

/**
 * /business/<slug> and /brand/<slug> are ISR with a 600s floor
 * (src/app/[locale]/business/[slug]/page.tsx, `revalidate = 600`). A test
 * that mutates a location/service directly via SQL (setStaffServiceOverride,
 * setLocationServiceOverride, clearStaffForService, a raw isPublic/
 * allowOnlineBooking UPDATE, ...) and then immediately loads the business
 * page will otherwise see stale, pre-mutation content for up to 10 minutes —
 * long past any reasonable test timeout.
 *
 * This calls the same POST /api/revalidate/business hook admin-api uses,
 * with the test-only secret set on the app's webServer in playwright.config.ts.
 *
 * IMPORTANT — revalidation is "stale-while-revalidate", not synchronous: per
 * the route's own doc comment, a revalidated tag is marked stale and
 * refreshed in the BACKGROUND on next visit, so the very first (or even
 * second — confirmed flaky across live runs, background regen time isn't
 * bounded) reload after calling this can still serve the old cached page
 * while the fresh one regenerates behind it. `gotoFreshLocation` below
 * polls with a real freshness check rather than guessing a fixed number of
 * reloads — pass one whenever the caller can express "is this fresh yet?"
 * as a predicate over the page; without one it falls back to a handful of
 * blind reloads, which is better than two but still not a guarantee.
 */
export async function revalidateLocation(page: Page, ...slugsOrIds: string[]): Promise<void> {
  const res = await page.request.post('http://localhost:3055/api/revalidate/business', {
    headers: { 'x-revalidate-secret': 'e2e-test-revalidate-secret' },
    data: { locations: slugsOrIds },
  })
  if (!res.ok()) {
    throw new Error(`revalidateLocation failed: ${res.status()} ${await res.text()}`)
  }
}

/**
 * Revalidates, then reloads until `isFresh(page)` returns true (or gives up
 * after `maxAttempts`, leaving the page on its last load either way — the
 * caller's own assertions will report the real failure with a proper
 * message rather than this helper swallowing it). Without `isFresh`, just
 * reloads `maxAttempts` times with a short pause, which raises the odds of
 * landing after the background regen completes but isn't a guarantee.
 */
export async function gotoFreshLocation(
  page: Page,
  slugOrId: string,
  opts: { path?: string; isFresh?: (page: Page) => Promise<boolean>; maxAttempts?: number } = {},
): Promise<void> {
  await revalidateLocation(page, slugOrId)
  const url = `/business/${slugOrId}${opts.path ?? ''}`
  const maxAttempts = opts.maxAttempts ?? 5
  for (let i = 0; i < maxAttempts; i++) {
    await page.goto(url)
    if (!opts.isFresh) {
      await page.waitForTimeout(400)
      continue
    }
    if (await opts.isFresh(page).catch(() => false)) return
  }
}
