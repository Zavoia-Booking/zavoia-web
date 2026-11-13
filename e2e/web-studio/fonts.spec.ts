import { expect, test, type CDPSession, type Locator, type Page } from '@playwright/test'

// Check the font embedded in the binary, not Next's generated CSS family name.
// A computed font stack can look correct while every glyph falls back to a system font.
const choices = [
  { key: 'modern', family: /geist/i },
  { key: 'classic', family: /librecaslondisplay/i },
  { key: 'elegant', family: /bodonimoda/i },
  { key: 'friendly', family: /bricolagegrotesque/i },
  { key: 'playfair', family: /playfairdisplay/i },
  { key: 'cormorant', family: /cormorantgaramond/i },
  { key: 'italiana', family: /italiana/i },
  { key: 'marcellus', family: /marcellus/i },
  { key: 'dmserif', family: /dmserifdisplay/i },
  { key: 'crimson', family: /crimsonpro/i },
  { key: 'grotesk', family: /spacegrotesk/i },
  { key: 'sora', family: /sora/i },
  { key: 'manrope', family: /manrope/i },
  { key: 'unbounded', family: /unbounded/i },
] as const

type RenderedFont = { familyName: string; isCustomFont: boolean; glyphCount: number }

async function inspectFonts(page: Page) {
  const session = await page.context().newCDPSession(page)
  await session.send('DOM.enable')
  await session.send('CSS.enable')
  return session
}

async function renderedFonts(session: CDPSession, selector: string): Promise<RenderedFont[]> {
  const { root } = await session.send('DOM.getDocument')
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  expect(nodeId, `The font sample must exist: ${selector}`).toBeGreaterThan(0)
  const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId })
  return fonts.filter(font => font.glyphCount > 0)
}

async function expectRenderedFamily(session: CDPSession, selector: string, family: RegExp) {
  await expect.poll(async () => {
    const fonts = await renderedFonts(session, selector)
    return fonts.length > 0 && fonts.every(font => font.isCustomFont
      && family.test(font.familyName.replace(/[\s-]/g, '')))
  }, { message: `${selector} must render with the actual ${family} font, without system fallback` }).toBe(true)
}

// Samples inherit the real preview's tokens and weight. Separate Latin and
// Romanian text exposes missing Latin-ext subsets and per-glyph fallback bugs.
async function addSamples(root: Locator) {
  await root.evaluate(element => {
    element.querySelectorAll('[data-font-sample]').forEach(sample => sample.remove())
    for (const [id, text, family] of [
      ['latin', 'Aa', 'var(--mc-display)'],
      ['romanian', 'ĂăÂâÎîȘșȚț', 'var(--mc-display)'],
      ['body', 'ProgramăriĂăȘșȚț', 'inherit'],
      ['mono', 'BucureștiĂăȘșȚț', 'var(--mc-mono)'],
    ]) {
      const sample = document.createElement('span')
      sample.dataset.fontSample = id
      sample.textContent = text
      Object.assign(sample.style, {
        position: 'absolute', left: '8px', top: '8px', fontSize: '32px',
        fontFamily: family, fontWeight: id === 'body' || id === 'mono' ? '400' : 'var(--mc-display-weight)',
        pointerEvents: 'none',
      })
      element.append(sample)
      // Trigger layout before FontFaceSet.ready, which only waits for used faces.
      sample.getBoundingClientRect()
    }
  })
}

async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await document.fonts.ready
  })
}

async function openControls(page: Page) {
  const panel = page.locator('[data-try-controls]')
  if (!(await panel.isVisible())) await page.getByRole('button', { name: 'Web Studio: Personalizează', exact: true }).click()
  await expect(panel).toBeVisible()
  return panel
}

function recordFontRequests(page: Page) {
  const google: string[] = []
  const fonts = new Set<string>()
  page.on('request', request => {
    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(request.url()).hostname)) {
      google.push(request.url())
    }
    if (request.resourceType() === 'font') fonts.add(request.url())
  })
  return { google, fonts }
}

test.describe('Self-hosted Web Studio fonts', () => {
  test('all 14 choices render their own typeface and Romanian glyphs in the live demo', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'The actual rendered-font check uses Chromium CDP.')
    test.setTimeout(90_000)
    const requests = recordFontRequests(page)
    await page.goto('/ro/web-studio/demo')
    const root = page.locator('[data-try-stage] .mc-root').first()
    await expect(root).toBeVisible()
    const panel = await openControls(page)
    await panel.getByRole('button', { name: 'Alege un font', exact: true }).click()
    const picker = panel.getByRole('group', { name: 'Font', exact: true })
    await expect(picker.getByRole('radio')).toHaveCount(choices.length)
    const session = await inspectFonts(page)

    for (const choice of choices) {
      await test.step(choice.key, async () => {
        await picker.locator(`input[value="${choice.key}"]`).check()
        await addSamples(root)
        await waitForFonts(page)
        await expectRenderedFamily(session, '[data-font-sample="latin"]', choice.family)
        if (choice.key === 'italiana') {
          // Italiana has Latin glyphs only. Romanian characters outside that
          // subset deliberately use the bundled Bodoni face, never Georgia.
          const selector = '[data-font-sample="romanian"]'
          await expectRenderedFamily(session, selector, /italiana|bodonimoda/i)
          expect((await renderedFonts(session, selector)).some(font => /bodoni/i.test(font.familyName))).toBe(true)
        } else if (choice.key === 'marcellus') {
          // Marcellus lacks the modern comma-below forms Ș/Ț even in its
          // Latin-ext subset. Libre Caslon supplies those specific glyphs.
          const selector = '[data-font-sample="romanian"]'
          await expectRenderedFamily(session, selector, /marcellus|librecaslondisplay/i)
          expect((await renderedFonts(session, selector)).some(font => /libre/i.test(font.familyName))).toBe(true)
        } else {
          await expectRenderedFamily(session, '[data-font-sample="romanian"]', choice.family)
        }
        // Body and small labels remain stable across every display choice.
        await expectRenderedFamily(session, '[data-font-sample="body"]', /^geist$/i)
        await expectRenderedFamily(session, '[data-font-sample="mono"]', /geistmono/i)
      })
    }
    expect(requests.google, 'The public demo must not contact Google Fonts').toEqual([])
    const origin = new URL(page.url()).origin
    expect([...requests.fonts].every(url => new URL(url).origin === origin)).toBe(true)
    await session.detach()
  })

  test('shared designs download only their used fonts while the font chooser is closed', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'The actual rendered-font check uses Chromium CDP.')
    const requests = recordFontRequests(page)
    // This valid shared look selects the first layout/colour/font options.
    // Open it directly in a fresh context so previously selected fonts cannot mask eager loading.
    await page.goto('/ro/web-studio/demo?s=00000000000000')
    const root = page.locator('[data-try-stage] .mc-root').first()
    await expect(root).toBeVisible()
    // Wait for a real hydrated interaction before adding diagnostic samples;
    // React may otherwise replace them when the initial preview mounts.
    await openControls(page)
    await addSamples(root)
    await waitForFonts(page)
    const session = await inspectFonts(page)
    await expectRenderedFamily(session, '[data-font-sample="latin"]', /^geist$/i)
    const initial = new Set(requests.fonts)
    expect(initial.size).toBeGreaterThan(0)
    // The fixed UI, body and mono faces can need Latin + Latin-ext files.
    // Loading all 14 display families would exceed this even with one file each.
    expect(initial.size, 'Unused display families must not be preloaded').toBeLessThanOrEqual(8)

    // Trying font specimens intentionally loads their faces. A shared design
    // with the chooser closed must still fetch only the face it actually uses.
    await page.goto('/ro/web-studio/demo?s=0000000000000b')
    await openControls(page)
    await addSamples(root)
    await waitForFonts(page)
    await expectRenderedFamily(session, '[data-font-sample="romanian"]', /sora/i)
    const newlyRequested = [...requests.fonts].filter(url => !initial.has(url))
    expect(newlyRequested.length, 'The selected face should load on demand').toBeGreaterThan(0)
    expect(newlyRequested.length, 'Opening one design must not download the rest of the catalog').toBeLessThanOrEqual(3)
    expect(requests.google).toEqual([])
    await session.detach()
  })

  for (const locale of ['en', 'ro'] as const) {
    test(`${locale} marketing mockups render their distinct fonts without external font requests`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'The actual rendered-font check uses Chromium CDP.')
      const requests = recordFontRequests(page)
      await page.goto(locale === 'en' ? '/web-studio' : '/ro/web-studio')
      const session = await inspectFonts(page)
      for (const [industry, family] of [
        ['fitness', /spacegrotesk/i], ['pets', /bricolagegrotesque/i],
        ['music', /librecaslondisplay/i], ['wellness', /cormorantgaramond/i], ['automotive', /dmserifdisplay/i],
        ['tattoo', /unbounded/i], ['tailoring', /italiana/i],
      ] as const) {
        const article = page.locator(`[data-studio-gallery] [data-example="${industry}"]`)
        await article.scrollIntoViewIfNeeded()
        const preview = article.locator('figure [inert]').first()
        await expect(preview).toHaveCSS('opacity', '1')
        await addSamples(article.locator('.mc-root').first())
        await waitForFonts(page)
        await expectRenderedFamily(session, `[data-example="${industry}"] [data-font-sample="latin"]`, family)
        await expectRenderedFamily(session, `[data-example="${industry}"] [data-font-sample="romanian"]`,
          industry === 'tailoring' ? /italiana|bodonimoda/i : family)
        await expectRenderedFamily(session, `[data-example="${industry}"] [data-font-sample="body"]`, /^geist$/i)
        await expectRenderedFamily(session, `[data-example="${industry}"] [data-font-sample="mono"]`, /geistmono/i)
      }
      expect(requests.google).toEqual([])
      expect(requests.fonts.size).toBeGreaterThan(0)
      const origin = new URL(page.url()).origin
      expect([...requests.fonts].every(url => new URL(url).origin === origin)).toBe(true)
      await session.detach()
    })
  }
})
