import { expect, test } from '@playwright/test'

/**
 * Locale routing is handled by src/proxy.ts (Next.js 16's renamed
 * middleware), read directly rather than guessed:
 *   - `/en` or `/en/...` → 308 redirect stripping the prefix (English is the
 *     unprefixed default locale — it is never shown in the URL bar).
 *   - `/ro` or `/ro/...` → passed through unchanged (NextResponse.next()).
 *   - anything else (e.g. `/`, `/search`) → internally REWRITTEN to `/en/...`
 *     for rendering, but the browser's URL bar never sees the `/en` prefix.
 */
test.describe('Home — locale routing', () => {
  test('HOME-04 default locale stays unprefixed, /ro persists across navigation, /en/* redirects to unprefixed', async ({
    page,
  }) => {
    await page.goto('/')
    expect(new URL(page.url()).pathname).toBe('/')

    await page.goto('/ro')
    expect(new URL(page.url()).pathname).toBe('/ro')
    await page.reload()
    expect(new URL(page.url()).pathname).toBe('/ro')

    // 308 redirect, followed automatically by page.goto — the final URL is
    // the unprefixed English path.
    await page.goto('/en/search')
    expect(new URL(page.url()).pathname).toBe('/search')
  })
})
