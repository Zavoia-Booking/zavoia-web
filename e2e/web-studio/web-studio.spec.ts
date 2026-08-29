import { expect, test } from '@playwright/test'

/**
 * /web-studio — src/app/_components/web-studio/web-studio-content.tsx.
 * A marketing catalogue page (not the builder, not the public renderer): a
 * live specimen preview driven by the real microsite renderer. Real
 * `data-ws-*` structural attributes are the intended test hooks here (see
 * the file header contract), unlike the rest of the app which carries none.
 */

test.describe('Web Studio catalogue', () => {
  test('WS-01 /web-studio loads without a JS error and renders the cover plate', async ({ page }) => {
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/web-studio')

    await expect(
      page.getByRole('heading', { level: 1, name: /A website[\s\S]*your prices\./ }),
    ).toBeVisible()

    // The cover's live-specimen badge reads either "Live site" (a real,
    // sufficiently-populated business resolved) or "Demonstration" (the
    // authored fallback specimen) — see WebStudioContent's `live` flag.
    // Freshly seeded test data may or may not clear the >=6 services /
    // >=3 team / >=6 photos / >=1 location bar, so assert on whichever
    // actually rendered rather than assuming one outcome.
    const badge = page.locator('text=/^(Live site|Demonstration)$/').first()
    await expect(badge).toBeVisible()
    const badgeText = await badge.textContent()
    console.log(`[WS-01] Cover badge observed: "${badgeText?.trim()}"`)

    expect(pageErrors, pageErrors.map((e) => e.message).join('\n')).toHaveLength(0)
  })

  test('WS-02 switching the section index changes the style chips and the live caption', async ({ page }) => {
    await page.goto('/web-studio')

    const sectionsNav = page.locator('nav[aria-label="Sections"]')
    const chips = page.locator('[role="group"][aria-label="Styles for this section"]')
    const caption = page.locator('[data-ws-stage] [aria-live="polite"]')

    // Default section is "hero" — 6 style chips (Text panel, Cinematic, Poster, Portal, Drift, Tumble).
    await expect(sectionsNav.getByRole('button', { name: /Hero/ })).toHaveAttribute('aria-current', 'true')
    const heroChipTexts = await chips.locator('button').allTextContents()
    expect(heroChipTexts).toContain('Text panel')
    expect(heroChipTexts).toContain('Cinematic')
    await expect(caption).toContainText('Hero')

    // Switch to "Services" — chips change to the services variant set (Feature, Bento, Cards).
    await sectionsNav.getByRole('button', { name: /Services/ }).click()
    await expect(sectionsNav.getByRole('button', { name: /Services/ })).toHaveAttribute('aria-current', 'true')
    await expect(sectionsNav.getByRole('button', { name: /Hero/ })).not.toHaveAttribute('aria-current', 'true')

    const serviceChipTexts = await chips.locator('button').allTextContents()
    expect(serviceChipTexts).not.toEqual(heroChipTexts)
    expect(serviceChipTexts).toContain('Feature')
    expect(serviceChipTexts).toContain('Bento')
    expect(serviceChipTexts).toContain('Cards')

    // The caption already reflects the section switch (default first chip, "Feature").
    await expect(caption).toContainText('Services')
    await expect(caption).not.toContainText('Hero')

    // Clicking a different style chip re-renders the specimen and updates the caption.
    await chips.getByRole('button', { name: 'Bento' }).click()
    await expect(chips.getByRole('button', { name: 'Bento' })).toHaveAttribute('aria-pressed', 'true')
    await expect(chips.getByRole('button', { name: 'Feature' })).toHaveAttribute('aria-pressed', 'false')
    await expect(caption).toContainText('Bento')
    await expect(caption).toContainText('Services')
  })

  test('WS-03 Type & colour: picking a font and a swatch presses them and unpresses the previous default', async ({ page }) => {
    await page.goto('/web-studio')

    // Default fontKey is "modern" (index 0 of FONT_CATALOG) and default accent is
    // Terracotta #C2552F (index 0 of BRAND_ACCENT_CATALOG) — see DEFAULT_ACCENT /
    // useState("modern") in web-studio-content.tsx.
    const fontButtons = page.locator('[data-ws-type] > div').first().locator('button[aria-pressed]')
    const swatchButtons = page.locator('[data-ws-swatches] button[aria-pressed]')

    await expect(fontButtons.nth(0)).toHaveAttribute('aria-pressed', 'true')
    await expect(swatchButtons.nth(0)).toHaveAttribute('aria-pressed', 'true')

    await fontButtons.nth(1).click()
    await expect(fontButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(fontButtons.nth(0)).toHaveAttribute('aria-pressed', 'false')

    await swatchButtons.nth(1).click()
    await expect(swatchButtons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(swatchButtons.nth(0)).toHaveAttribute('aria-pressed', 'false')
  })
})
