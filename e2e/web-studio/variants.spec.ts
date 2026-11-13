import { expect, test, type Page } from '@playwright/test'

const DEMO = '/web-studio/demo'
const stage = (page: Page) => page.locator('[data-try-stage]')

async function showGallery(page: Page) {
  if (page.viewportSize()!.width < 1024) await page.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
  const panel = page.locator('[data-try-controls]')
  await expect(panel).toBeVisible()
  // Use the hydrated controls to navigate; SSR preview markup exists before its
  // dynamic client renderer mounts and is not ready for scroll/gesture checks.
  await panel.getByRole('button', { name: 'Gallery', exact: true }).click()
  await panel.getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
  await expect(panel).toHaveCount(0)
}

test.describe('Web Studio variant rendering regressions', () => {
  test.use({ viewport: { width: 1440, height: 1200 } })

  test('Gallery Bento balances five photos and preserves lightbox order at every breakpoint', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: 'zw-consent', value: 'denied', url: baseURL! }])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [1440, 834, 390]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${DEMO}?s=20100010000004&example=automotive`)
      await showGallery(page)
      const gallery = page.locator('.mc-gallery-section[data-gallery="bento"]')
      const photos = gallery.locator('button[data-gimg]')
      await expect(photos).toHaveCount(5)
      expect(await photos.evaluateAll(elements => elements.map(element => element.getAttribute('data-gimg')))).toEqual(['0', '1', '2', '3', '4'])
      const geometry = await gallery.locator('.mc-bento-group').evaluate(group => {
        const rects = [...group.querySelectorAll('.mc-bento-tile')].map(tile => {
          const rect = tile.getBoundingClientRect()
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom }
        })
        const stage = group.closest<HTMLElement>('[data-try-stage]')!
        const scale = stage.getBoundingClientRect().width / stage.clientWidth
        return { rects, gap: parseFloat(getComputedStyle(group).rowGap) * scale }
      })
      const [feature, ...small] = geometry.rects
      expect(Math.abs(feature.height - small[0].height * 2 - geometry.gap)).toBeLessThan(1)
      expect(Math.abs(small[0].y - small[1].y)).toBeLessThan(1)
      expect(Math.abs(small[2].y - small[3].y)).toBeLessThan(1)
      expect(Math.abs(small[2].y - small[0].bottom - geometry.gap)).toBeLessThan(1)
      if (width > 720) {
        expect(Math.abs(feature.y - small[0].y)).toBeLessThan(1)
        expect(Math.abs(feature.bottom - small[3].bottom)).toBeLessThan(1)
        expect(small.every(rect => rect.x > feature.x)).toBe(true)
      } else {
        expect(Math.abs(small[0].y - feature.bottom - geometry.gap)).toBeLessThan(1)
      }

      const source = photos.nth(4)
      const lastSrc = await source.locator('img').getAttribute('src')
      const previousSrc = await photos.nth(3).locator('img').getAttribute('src')
      await source.focus()
      await page.keyboard.press('Enter')
      const viewer = page.getByRole('dialog', { name: 'Gallery', exact: true })
      await expect(viewer).toBeVisible()
      await expect(viewer.locator('figure img')).toHaveAttribute('src', lastSrc!)
      await expect(viewer.getByRole('button', { name: 'Next image', exact: true })).toBeDisabled()
      await page.keyboard.press('ArrowLeft')
      await expect(viewer.locator('figure img')).toHaveAttribute('src', previousSrc!)
      await page.keyboard.press('Escape')
      await expect(viewer).toHaveCount(0)
      await expect(photos.nth(3)).toBeFocused()
    }
  })

  test('vertical touch scrolling over Carousel does not open a photo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${DEMO}?s=00100001000000&example=pets`)
    await showGallery(page)
    const carousel = page.locator('.mc-galcar-view')
    await carousel.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(carousel).toBeInViewport()
    const bounds = await carousel.boundingBox()
    expect(bounds).not.toBeNull()
    const client = await page.context().newCDPSession(page)
    const x = bounds!.x + bounds!.width / 2
    const y = Math.min(bounds!.y + bounds!.height / 2, 600)
    const cancellations = page.evaluate(() => {
      const target = document.querySelector('.mc-galcar-view')!
      return new Promise<boolean>(resolve => {
        target.addEventListener('pointercancel', () => resolve(true), { once: true })
        setTimeout(() => resolve(false), 3000)
      })
    })
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let distance = 20; distance <= 100; distance += 20) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - distance }] })
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    expect(await cancellations).toBe(true)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await client.detach()
  })

  test('Services Bento does not consume arrow keys owned by the floating controls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${DEMO}?s=00100100000000&example=automotive&hide=announcement,marquee,about,locations,gallery,team,testimonials,faq`)
    await page.locator('.mc-services-bento-shell').evaluate(element => element.scrollIntoView({ block: 'center' }))
    const count = page.locator('.mc-services-bento-count')
    await expect(count).toHaveText('01 / 06')
    await page.locator('[data-try-controls]').getByRole('button', { name: 'Move controls', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(count).toHaveText('01 / 06')

    // The section's own keyboard navigation still works.
    await page.locator('.mc-services-bento-pager button').last().focus()
    await page.keyboard.press('ArrowRight')
    await expect(count).toHaveText('02 / 06')
  })

  test('Team Carousel follows scaled drags and cancels without changing members', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${DEMO}?s=00100000300000&example=tailoring&hide=announcement,marquee,about,locations,gallery,faq,services,testimonials`)
    await page.locator('[data-try-controls]').getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
    await stage(page).evaluate(element => { element.style.transform = 'scale(.5)' })
    const rail = page.locator('.mc-tmr-view')
    const track = page.locator('.mc-tmr-track')
    await rail.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const offset = () => track.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)
    const before = await offset()
    const pointer = { pointerId: 7, isPrimary: true, button: 0, buttons: 1, clientX: 500, clientY: 400 }
    await rail.dispatchEvent('pointerdown', pointer)
    await rail.dispatchEvent('pointermove', { ...pointer, clientX: 400 })
    expect(Math.abs(((await offset()) - before) * .5 + 100)).toBeLessThan(.1)
    const dragged = await offset()
    await rail.dispatchEvent('pointermove', { ...pointer, pointerId: 8, isPrimary: false, clientX: 200 })
    expect(await offset()).toBeCloseTo(dragged, 1)
    await rail.dispatchEvent('pointercancel', { ...pointer, clientX: 400, buttons: 0 })
    await expect(page.locator('.mc-tmr-slide[data-active="1"]')).toHaveAttribute('data-tmi', '0')
    expect(await offset()).toBeCloseTo(before, 1)
  })

  test('Drift and Reviews Deck pause while outside the preview viewport', async ({ page }) => {
    await page.goto(`${DEMO}?s=00400000040000&example=pets&device=tablet&hide=announcement,marquee,about,locations,gallery,team,faq,services`)
    await page.locator('[data-try-controls]').getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
    const blob = page.locator('.mc-herodr-par').first()
    const activeReview = () => page.locator('.mc-rvx-dash[data-on="1"]').evaluate(element => Array.from(element.parentElement!.children).indexOf(element))
    const firstReview = await activeReview()
    // Longer than the six-second autoplay interval and initial fan-in delay.
    await page.waitForTimeout(8000)
    expect(await activeReview()).toBe(firstReview)
    await stage(page).evaluate(element => { element.scrollTop = element.scrollHeight })
    await expect.poll(() => blob.evaluate(element => element.closest('.mc-herodr')!.getBoundingClientRect().bottom)).toBeLessThan(0)
    await page.waitForTimeout(200)
    const transform = await blob.evaluate(element => (element as HTMLElement).style.transform)
    await page.waitForTimeout(300)
    expect(await blob.evaluate(element => (element as HTMLElement).style.transform)).toBe(transform)
    await stage(page).evaluate(element => { element.scrollTop = 0 })
    await expect.poll(() => blob.evaluate(element => (element as HTMLElement).style.transform)).not.toBe(transform)
  })

  for (const footer of [{ index: 2, selector: '.mc-fsig-mark' }, { index: 4, selector: '.mc-fmq-mark' }]) {
    test(`footer ${footer.index} fits its name without a resize loop under reduced motion`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${DEMO}?s=00100000000${footer.index}00&device=mobile&hide=announcement,marquee,about,locations,gallery,team,faq,services,testimonials`)
      const mark = page.locator(footer.selector)
      await expect(mark).toBeAttached()
      await page.evaluate(() => document.fonts.ready)
      await stage(page).evaluate(element => { element.scrollTop = element.scrollHeight })
      await expect.poll(() => mark.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
      const sizes: string[] = []
      for (let frame = 0; frame < 5; frame += 1) {
        sizes.push(await mark.evaluate(element => getComputedStyle(element).fontSize))
        await expect.poll(() => mark.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
        await page.waitForTimeout(100)
      }
      expect(new Set(sizes).size).toBe(1)
    })
  }

  test('Cinematic parallax uses logical preview pixels and clears when motion is reduced', async ({ page }) => {
    await page.goto(`${DEMO}?s=20100000000008&hide=`)
    const cover = page.locator('.mc-hero-cine .absolute.left-0.right-0')
    await expect(cover).toBeAttached()
    const offsets: number[] = []
    for (const scale of [1, 0.5, 1]) {
      await stage(page).evaluate((element, value) => {
        element.style.transform = `scale(${value})`
        element.scrollTop = 200
        element.dispatchEvent(new Event('scroll'))
      }, scale)
      await expect.poll(() => cover.evaluate(element => Math.abs(new DOMMatrix(getComputedStyle(element).transform).m42))).toBeGreaterThan(1)
      await page.waitForTimeout(100)
      offsets.push(await cover.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42))
    }
    expect(Math.max(...offsets) - Math.min(...offsets)).toBeLessThan(0.2)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(() => cover.evaluate(element => (element as HTMLElement).style.transform)).toBe('')
  })

  test('Underlay moves the floating announcement with the page and blocks background controls', async ({ page }) => {
    await page.goto(`${DEMO}?s=23100000000008&device=mobile&hide=marquee`)
    await page.locator('[data-try-controls]').getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
    const root = stage(page).locator('.mc-root')
    await stage(page).evaluate(element => { element.scrollTop = element.scrollHeight })
    await root.locator('[data-nav-variant="underlay"]').getByRole('button', { name: 'Menu', exact: true }).click()
    await expect.poll(() => root.evaluate(element => element.style.getPropertyValue('--mc-underlay-progress'))).toBe('1.0000')
    const state = await root.evaluate(element => {
      const flow = element.querySelector<HTMLElement>('.mc-page-flow')!
      const pill = element.querySelector<HTMLElement>('.mc-anno-pill-layer')!
      const footer = element.querySelector<HTMLElement>(':scope > .mc-footer')!
      const panel = element.querySelector<HTMLElement>('.mc-nav-underlay-panel')!
      return {
        pageX: new DOMMatrix(getComputedStyle(flow).transform).m41,
        pillX: new DOMMatrix(getComputedStyle(pill).transform).m41,
        panelWidth: panel.offsetWidth,
        inert: [flow.inert, pill.inert, footer.inert],
      }
    })
    expect(state.pageX).toBeCloseTo(-390 * 0.76, 1)
    expect(state.pillX).toBeCloseTo(state.pageX, 1)
    expect(state.panelWidth).toBe(390)
    expect(state.inert).toEqual([true, true, true])
    await page.keyboard.press('Escape')
    await expect.poll(() => root.evaluate(element => element.classList.contains('mc-nav-underlay-engaged'))).toBe(false)
    await expect.poll(() => root.evaluate(element => [...element.querySelectorAll<HTMLElement>('.mc-page-flow, .mc-anno-pill-layer, :scope > .mc-footer')].some(node => node.inert))).toBe(false)
  })

  test('Tumble letters can be tossed after settling, while reduced motion stays still', async ({ page }) => {
    await page.goto(`${DEMO}?s=20500000000008&hide=`)
    await page.locator('[data-try-controls]').getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
    const glyph = page.locator('.mc-herotb-ch').first()
    const transform = () => glyph.evaluate(element => (element as HTMLElement).style.transform)
    await expect(glyph).toHaveAttribute('style', /translate/)
    await expect.poll(async () => {
      const before = await transform()
      await page.waitForTimeout(120)
      return await transform() === before
    }).toBe(true)
    const baseline = await glyph.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)
    await glyph.click()
    await expect.poll(() => glyph.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)).toBeLessThan(baseline - 10)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(() => glyph.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)).toBeCloseTo(baseline, 1)
    const still = await transform()
    await glyph.click()
    await page.waitForTimeout(200)
    expect(await transform()).toBe(still)
  })
})
