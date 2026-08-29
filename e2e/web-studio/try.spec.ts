import { expect, test } from '@playwright/test'

/**
 * /try — src/app/_components/try/shuffle-experience.tsx + shuffle-model.ts.
 * A full-bleed live microsite with a floating dock: `[data-try-stage]` (the
 * site), `[data-try-dock]` (the dock), `.zw-try-look[aria-live="polite"]`
 * (the readout: "<hero style> · <accent name> · <font name>"), three lock
 * buttons (`.zw-try-lock`, order layout/colour/type per LOCK_KEYS) and a
 * shuffle button (`.zw-try-shuffle`, `data-spin` while animating).
 *
 * shuffleLook() in shuffle-model.ts *guarantees* every unlocked dimension
 * changes (pickDifferent loops until it differs from the current value), so
 * these assertions are deterministic, not probabilistic.
 */

test.describe('Try (shuffle) experience', () => {
  test('WS-07 shuffle changes the look readout; a locked dimension survives a re-shuffle', async ({ page }) => {
    await page.goto('/try')

    const readout = page.locator('[data-try-dock] .zw-try-look')
    await expect(readout).toBeVisible()

    const before = (await readout.textContent())?.trim() ?? ''
    expect(before.length).toBeGreaterThan(0)

    const shuffleButton = page.locator('[data-try-dock] .zw-try-shuffle')
    await shuffleButton.click()

    // Every dimension is unlocked at first load, so the readout is
    // guaranteed to differ after one shuffle.
    await expect(readout).not.toHaveText(before)

    // Lock "layout" (the first lock, per LOCK_KEYS = ["layout", "colour", "type"])
    // — this freezes look.variants.hero, which drives the readout's first
    // segment (the hero style name, read via heroStyle in the component).
    const locks = page.locator('[data-try-dock] .zw-try-lock')
    const layoutLock = locks.nth(0)
    await layoutLock.click()
    await expect(layoutLock).toHaveAttribute('aria-pressed', 'true')

    const lockedText = (await readout.textContent())?.trim() ?? ''
    const lockedHeroStyle = lockedText.split('·')[0]?.trim()
    expect(lockedHeroStyle).toBeTruthy()

    await shuffleButton.click()

    // Overall readout still changes (colour + type are unlocked, and both
    // are guaranteed to differ), but the locked hero style segment survives.
    await expect(readout).not.toHaveText(lockedText)
    const afterLockText = (await readout.textContent())?.trim() ?? ''
    const afterLockHeroStyle = afterLockText.split('·')[0]?.trim()
    expect(afterLockHeroStyle).toBe(lockedHeroStyle)
  })

  test('WS-09 the look is encoded in ?s= and an invalid code falls back cleanly', async ({ page }) => {
    await page.goto('/try')

    // The look round-trips into the URL via history.replaceState (see the
    // `useEffect` keyed on `look` in shuffle-experience.tsx) even before any
    // shuffle — assert it's there, then assert a shuffle changes its value.
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBeNull()
    const initialCode = new URL(page.url()).searchParams.get('s')

    await page.locator('[data-try-dock] .zw-try-shuffle').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(initialCode)

    // decodeLook() rejects anything the wrong length / with out-of-range
    // digits and the component falls back to OPENING_LOOK — the page must
    // render normally, not crash, on a garbage code.
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/try?s=garbage-not-a-real-code')
    await expect(page.locator('[data-try-dock] .zw-try-look')).toBeVisible()
    await expect(page.locator('[data-try-stage]')).toBeVisible()
    expect(pageErrors, pageErrors.map((e) => e.message).join('\n')).toHaveLength(0)
  })
})
