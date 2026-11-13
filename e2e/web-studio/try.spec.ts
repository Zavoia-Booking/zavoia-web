import { expect, test, type Locator, type Page } from '@playwright/test'

const DEMO = '/web-studio/demo'
const controls = (page: Page) => page.locator('[data-try-controls]')
const sectionButton = (panel: Locator, name: string) => panel.getByRole('button', { name, exact: true })
const sectionControl = (panel: Locator, name: string) => panel.locator('[data-section-control]').filter({ has: panel.page().getByRole('button', { name, exact: true }) })
const expandedSection = (panel: Locator) => panel.locator('[data-section-control]:has(button[aria-expanded="true"])')

async function openSection(panel: Locator, name: string) {
  const button = sectionButton(panel, name)
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(sectionControl(panel, name).getByRole('radio').first()).toBeVisible()
}

async function chooseFont(panel: Locator, key: string) {
  const trigger = panel.getByRole('button', { name: 'Choose a font', exact: true })
  if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click()
  const radio = panel.locator(`input[type="radio"][value="${key}"]`)
  await radio.locator('..').click()
  await expect(radio).toBeChecked()
}

async function chooseExample(panel: Locator, name: string) {
  const trigger = panel.getByRole('button', { name: 'Choose demo business', exact: true })
  if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click()
  const radio = panel.getByRole('radio', { name, exact: true })
  await radio.locator('..').click()
  await expect(radio).toBeChecked()
}

async function chooseStyle(panel: Locator, variant: string) {
  const radio = expandedSection(panel).locator(`input[type="radio"][value="${variant}"]`)
  // Click the visible label; the native radio provides the selected state and keyboard semantics.
  await radio.locator('..').click()
  await expect(radio).toBeChecked()
}

async function minimizeControls(page: Page, locale = 'en') {
  await controls(page).getByRole('button', { name: locale === 'ro' ? 'Web Studio · Demo: Restrânge panoul' : 'Web Studio · Demo: Minimize panel', exact: true }).click()
  await expect(controls(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: locale === 'ro' ? 'Web Studio: Personalizează' : 'Web Studio: Customize', exact: true })).toBeVisible()
}

const stageBounds = (page: Page) => page.locator('[data-try-stage]').evaluate(element => {
  const rect = element.getBoundingClientRect()
  return [rect.x, rect.y, rect.width, rect.height].map(Math.round)
})

async function moveControls(page: Page, handle: Locator, deltaX: number, deltaY: number) {
  const bounds = await handle.boundingBox()
  expect(bounds).not.toBeNull()
  const x = bounds!.x + bounds!.width / 2
  const y = bounds!.y + bounds!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + deltaX, y + deltaY, { steps: 8 })
  await page.mouse.up()
}

async function expectControlsInsideViewport(target: Locator) {
  await expect.poll(() => target.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1
  })).toBe(true)
}

async function waitForControlMotion(target: Locator) {
  await expect.poll(() => target.evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(false)
}

test.describe('Web Studio design demo', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('section selection and style changes keep headings below Capsule', async ({ page }) => {
    await page.goto(`${DEMO}?example=tailoring&s=21302132331166&hide=announcement,marquee,testimonials`)
    const panel = controls(page)
    const headingGap = (type: string) => page.locator(`[data-try-stage] [data-preview-section="${type}"] h2`).first().evaluate(element => {
      const header = document.querySelector('[data-try-stage] [data-nav-variant]')!
      return element.getBoundingClientRect().top - header.getBoundingClientRect().bottom
    })
    await openSection(panel, 'Gallery')
    await expect.poll(() => headingGap('gallery')).toBeGreaterThanOrEqual(18)
    await expect.poll(() => headingGap('gallery')).toBeLessThan(80)
    await chooseStyle(panel, 'bento')
    await expect.poll(() => headingGap('gallery')).toBeGreaterThanOrEqual(18)
    await expect.poll(() => headingGap('gallery')).toBeLessThan(80)
    await openSection(panel, 'FAQ')
    await expect.poll(() => headingGap('faq')).toBeGreaterThanOrEqual(18)
    await expect.poll(() => headingGap('faq')).toBeLessThan(80)
  })

  test('desktop keeps backgrounds full width and caps inner footer content at 1400px', async ({ page }) => {
    await page.goto(`${DEMO}?s=00100200000200&example=tailoring`)
    await expect(controls(page)).toBeVisible()
    const metrics = () => page.locator('[data-try-stage]').evaluate(element => {
      const text = element.querySelector('.mc-services-card-item-description')!
      const bounds = element.getBoundingClientRect()
      const scale = bounds.width / element.clientWidth
      return {
        width: element.clientWidth,
        renderedWidth: Math.round(bounds.width),
        renderedHeight: Math.round(bounds.height),
        left: Math.round(bounds.left),
        scale,
        text: parseFloat(getComputedStyle(text).fontSize) * scale,
      }
    })
    for (const width of [1024, 1280, 1440, 2513]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(metrics).toEqual({
        width,
        renderedWidth: width,
        renderedHeight: 900,
        left: 0,
        scale: 1,
        text: 16,
      })
      await expect.poll(() => page.locator('.mc-footer--signature').evaluate(footer => {
        const background = footer.getBoundingClientRect()
        const content = footer.querySelector('.mc-fsig-mark-wrap')!
        const bounds = content.getBoundingClientRect()
        const style = getComputedStyle(content)
        const usableWidth = bounds.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        return {
          backgroundWidth: Math.round(background.width),
          backgroundLeft: Math.round(background.left),
          contentCapped: usableWidth <= 1401,
          contentCentered: Math.abs((bounds.left + bounds.right) - (background.left + background.right)) < 1,
        }
      })).toEqual({ backgroundWidth: width, backgroundLeft: 0, contentCapped: true, contentCentered: true })
    }
  })

  test('a visitor can change a design, keep a dimension, undo and reset', async ({ page }) => {
    await page.goto(DEMO)
    const panel = controls(page)
    await expect(panel).toBeVisible()
    await expect(panel.locator('[data-section-control][data-hidden]')).toHaveCount(2)
    for (const type of ['announcement', 'marquee']) {
      await expect(panel.locator(`[data-section-control="${type}"] [role="switch"]`)).toHaveAttribute('aria-checked', 'false')
    }
    await expect(page.locator('[data-preview-section="testimonials"]')).toHaveCount(1)
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBeNull()
    const firstCode = new URL(page.url()).searchParams.get('s')
    await panel.getByRole('button', { name: 'Try another design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(firstCode)
    await panel.getByRole('button', { name: 'Undo last change', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(firstCode)

    await panel.getByRole('button', { name: 'Keep section styles', exact: true }).click()
    const lockedCode = new URL(page.url()).searchParams.get('s')!
    await panel.getByRole('button', { name: 'Try another design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(lockedCode)
    expect(new URL(page.url()).searchParams.get('s')!.slice(0, -2)).toBe(lockedCode.slice(0, -2))
    await panel.getByRole('button', { name: 'Reset design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(firstCode)
    await expect(panel.locator('[data-section-control][data-hidden]')).toHaveCount(2)
    await expect.poll(() => new URL(page.url()).searchParams.get('hide')).toBeNull()
  })

  test('shuffle preserves the viewed section instead of returning to an open inspector', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const scenario of [
      { width: 1440, height: 900, inspector: 'About', viewed: 'services', minimized: false },
      { width: 1440, height: 900, inspector: 'Hero', viewed: 'gallery', minimized: true },
      { width: 390, height: 844, inspector: 'About', viewed: 'team', minimized: true },
    ]) {
      await page.setViewportSize({ width: scenario.width, height: scenario.height })
      await page.goto(`${DEMO}?s=00000000000000&example=pets`)
      const panel = controls(page)
      const stage = page.locator('[data-try-stage]')
      if (scenario.width < 1024) await page.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
      await openSection(panel, scenario.inspector)
      // Let explicit inspector navigation finish before the visitor scrolls elsewhere.
      await expect.poll(() => stage.evaluate((element, inspector) => {
        if (inspector === 'Hero') return element.scrollTop === 0
        const heading = element.querySelector('[data-preview-section="about"] h2')!
        const scale = element.getBoundingClientRect().width / element.clientWidth
        const gap = (heading.getBoundingClientRect().top - element.getBoundingClientRect().top) / scale
        return gap >= 0 && gap < 200
      }, scenario.inspector)).toBe(true)
      if (scenario.minimized) await minimizeControls(page)
      const target = stage.locator(`[data-preview-section="${scenario.viewed}"]`)
      await target.evaluate(element => {
        const scroller = element.closest<HTMLElement>('[data-try-stage]')!
        const bounds = scroller.getBoundingClientRect()
        const scale = bounds.width / scroller.clientWidth
        scroller.scrollTo({ top: scroller.scrollTop + (element.getBoundingClientRect().top - bounds.top) / scale + element.clientHeight * .2, behavior: 'instant' })
      })
      const position = () => target.evaluate(element => {
        const scroller = element.closest<HTMLElement>('[data-try-stage]')!
        const bounds = scroller.getBoundingClientRect()
        const scale = bounds.width / scroller.clientWidth
        return (bounds.top - element.getBoundingClientRect().top) / (element.clientHeight * scale)
      })
      const before = await position()
      for (let iteration = 0; iteration < 2; iteration++) {
        const code = new URL(page.url()).searchParams.get('s')
        const shuffle = scenario.minimized ? page.locator('[data-try-launcher] .zw-try-shuffle') : panel.locator('.zw-try-shuffle')
        await shuffle.click()
        await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(code)
        await expect.poll(async () => Math.abs(await position() - before)).toBeLessThan(.025)
        // Font loading and section measurement can finish after the first restored frame.
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(350)
        expect(Math.abs(await position() - before)).toBeLessThan(.025)
      }
    }
  })

  test('both shuffle controls change every section and preserve manually disabled sections', async ({ page }) => {
    await page.goto(`${DEMO}?s=00000000000000&hide=announcement,testimonials`)
    const panel = controls(page)
    const stage = page.locator('[data-try-stage]')
    await openSection(panel, 'About')
    await chooseStyle(panel, 'sticky')
    await panel.getByRole('switch', { name: 'Show this section: About', exact: true }).click()
    await expect(stage.locator('[data-preview-section="about"]')).toHaveCount(0)
    const disabled = new URL(page.url()).searchParams.get('hide')
    expect(disabled?.split(',')).toEqual(expect.arrayContaining(['announcement', 'about', 'testimonials']))

    for (let iteration = 0; iteration < 6; iteration++) {
      if (iteration === 3) await minimizeControls(page)
      const before = new URL(page.url()).searchParams.get('s')!
      const shuffle = iteration < 3 ? panel.locator('.zw-try-shuffle') : page.locator('[data-try-launcher] .zw-try-shuffle')
      await shuffle.click()
      await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(before)
      const after = new URL(page.url()).searchParams.get('s')!
      // Every section's style changes, including hidden sections; visibility is independent.
      for (let index = 0; index < 12; index++) expect(after[index], `section ${index}, shuffle ${iteration}`).not.toBe(before[index])
      expect(new URL(page.url()).searchParams.get('hide')).toBe(disabled)
      await expect(stage.locator('[data-preview-section="about"], [data-preview-section="testimonials"]')).toHaveCount(0)
      await expect(stage.locator('[data-preview-section="services"]')).toHaveCount(1)
      if (iteration < 3) await expect(panel.getByRole('switch', { name: 'Show this section: About', exact: true })).toHaveAttribute('aria-checked', 'false')
    }

    await page.reload()
    await expect(stage.locator('[data-preview-section="about"], [data-preview-section="testimonials"]')).toHaveCount(0)
    await expect(controls(page).getByRole('switch', { name: 'Show this section: About', exact: true })).toHaveAttribute('aria-checked', 'false')
  })

  test('shuffle and undo keep the preview at the footer until the visitor scrolls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`${DEMO}?s=00000000000000`)
    const panel = controls(page)
    const stage = page.locator('[data-try-stage]')
    await expect(stage.locator('[data-preview-section="footer"]')).toBeAttached()
    await stage.evaluate(element => { element.scrollTop = element.scrollHeight })
    const distanceFromEnd = () => stage.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)
    const code = new URL(page.url()).searchParams.get('s')
    await panel.locator('.zw-try-shuffle').click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(code)
    await expect.poll(distanceFromEnd).toBeLessThanOrEqual(2)
    await page.evaluate(() => document.fonts.ready)
    await expect.poll(distanceFromEnd).toBeLessThanOrEqual(2)
    await panel.getByRole('button', { name: 'Undo last change', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(code)
    await expect.poll(distanceFromEnd).toBeLessThanOrEqual(2)
    const bounds = (await stage.boundingBox())!
    await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .5)
    await page.mouse.wheel(0, -600)
    await expect.poll(distanceFromEnd).toBeGreaterThan(200)
    const afterScroll = await stage.evaluate(element => element.scrollTop)
    await page.waitForTimeout(250)
    expect(Math.abs(await stage.evaluate(element => element.scrollTop) - afterScroll)).toBeLessThan(2)
  })

  test('all locked choices disable shuffle; explicit controls still change the preview', async ({ page }) => {
    await page.goto(DEMO)
    const panel = controls(page)
    await expect(panel).toBeVisible()
    for (const name of ['Keep section styles', 'Keep the selected colour', 'Keep the selected font']) {
      const keep = panel.getByRole('button', { name, exact: true })
      await expect(keep).toHaveAttribute('aria-pressed', 'false')
      await expect(keep).toBeInViewport()
      await keep.click()
      // The toggle keeps its accessible name and changes only its pressed state.
      await expect(keep).toHaveAttribute('aria-pressed', 'true')
    }
    await expect(panel.getByRole('button', { name: 'Try another design', exact: true })).toBeDisabled()
    await expect(panel.getByRole('status').filter({ hasText: 'Allow at least one setting to change.' })).toBeVisible()
    await openSection(panel, 'Services')
    await chooseStyle(panel, 'bento')
    await expect(page.locator('[data-preview-section="services"] [data-services="bento"]')).toHaveCount(1)
    const previousFont = await page.locator('[data-try-stage] .mc-root').evaluate(element => getComputedStyle(element).getPropertyValue('--mc-display'))
    await chooseFont(panel, 'classic')
    await expect.poll(() => page.locator('[data-try-stage] .mc-root').evaluate(element => getComputedStyle(element).getPropertyValue('--mc-display'))).not.toBe(previousFont)
    await chooseExample(panel, 'Pet grooming')
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Paw & Co')
    await expect(page.locator('[data-try-stage]:visible [data-preview-section="testimonials"]')).toHaveCount(1)
    await openSection(panel, 'Services')
    await panel.getByRole('switch', { name: 'Show this section: Services', exact: true }).click()
    await expect(page.locator('[data-try-stage]:visible [data-preview-section="services"]')).toHaveCount(0)
    expect(new URL(page.url()).searchParams.get('hide')).toContain('services')
  })

  test('legacy links keep their locale, design and source; language changes keep the look and device', async ({ page }) => {
    const response = await page.request.get('/ro/try?s=00000000000000&src=flyer%20one&example=pets&tag=one&tag=two', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const destination = new URL(response.headers().location, page.url() === 'about:blank' ? 'http://localhost' : page.url())
    expect(destination.pathname).toBe('/ro/web-studio/demo')
    expect(destination.searchParams.get('s')).toBe('00000000000000')
    expect(destination.searchParams.get('src')).toBe('flyer one')
    expect(destination.searchParams.get('example')).toBe('pets')
    expect(destination.searchParams.getAll('tag')).toEqual(['one', 'two'])

    await page.goto('/ro/web-studio/demo?s=00000000000000&src=flyer%20one&example=pets&device=tablet')
    const panel = controls(page)
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Paw & Co')
    const signup = new URL((await panel.getByRole('link', { name: 'Încearcă gratuit', exact: true }).getAttribute('href'))!)
    expect(signup.pathname).toBe('/register')
    expect(signup.origin).not.toBe(new URL(page.url()).origin)
    expect(signup.searchParams.get('lang')).toBe('ro')
    expect(signup.searchParams.get('src')).toBe('flyer one')
    await expect(panel.getByRole('button', { name: 'Tabletă', exact: true })).toHaveAttribute('aria-pressed', 'true')
    const language = panel.locator('[data-demo-language] details')
    await language.locator('summary').click()
    await expect(language).toHaveAttribute('open', '')
    await language.getByRole('link', { name: 'English', exact: true }).click()
    await expect(page).toHaveURL(/\/web-studio\/demo\?/)
    await expect(panel.getByRole('link', { name: 'Start free trial', exact: true })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Tablet', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(new URL(page.url()).searchParams.get('s')).toBe('00000000000000')
    expect(new URL(page.url()).searchParams.get('example')).toBe('pets')
    expect(new URL(page.url()).searchParams.get('src')).toBe('flyer one')
    expect(new URL(page.url()).searchParams.get('device')).toBe('tablet')

    await chooseExample(panel, 'Tailoring & Repairs')
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Fir Atelier')
    await language.locator('summary').click()
    const romanian = language.getByRole('link', { name: 'Română', exact: true })
    await expect(romanian).toHaveAttribute('href', /example=tailoring/)
    await romanian.click()
    await expect(page).toHaveURL(/\/ro\/web-studio\/demo\?/)
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Probă pentru scurtat pantaloni')
    expect(new URL(page.url()).searchParams.get('example')).toBe('tailoring')
    expect(new URL(page.url()).searchParams.get('src')).toBe('flyer one')
    expect(new URL(page.url()).searchParams.get('device')).toBe('tablet')
  })

  test('language dropdown supports keyboard dismissal without closing the floating controls', async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(DEMO)
      const panel = controls(page)
      if (width < 1024) {
        await page.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
        await waitForControlMotion(panel)
      }
      const language = panel.locator('[data-demo-language] details')
      const trigger = language.locator('summary')
      await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBeNull()
      const originalUrl = page.url()
      await trigger.focus()
      await page.keyboard.press('ArrowDown')
      await expect(language).toHaveAttribute('open', '')
      await expect(language.locator('a[data-locale="en"]')).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(language.locator('a[data-locale="ro"]')).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(language).not.toHaveAttribute('open', '')
      await expect(panel).toBeVisible()
      await expect(trigger).toBeFocused()
      expect(page.url()).toBe(originalUrl)
    }
  })

  test('invalid designs fall back and demo booking actions explain the limitation', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${DEMO}?s=invalid`)
    await expect(page.locator('[data-try-stage]:visible')).toBeVisible()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe('invalid')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await minimizeControls(page)
    await page.locator('[data-try-stage]:visible').getByRole('button', { name: /Book now|Book an appointment/i }).first().click()
    await expect(page.locator('[data-toast-host]')).toContainText('This is a sample business.')
    await expect(page).toHaveURL(/\/web-studio\/demo/)
    expect(errors).toEqual([])
  })

  test('required sections survive shared links and the hero follows the preview viewport', async ({ page }) => {
    await page.goto(`${DEMO}?hide=nav,hero,footer,announcement,marquee`)
    const stage = page.locator('[data-try-stage]')
    const panel = controls(page)
    for (const section of ['nav', 'hero', 'footer']) {
      await expect(stage.locator(`[data-preview-section="${section}"]`)).toHaveCount(1)
    }
    await expect.poll(() => new URL(page.url()).searchParams.get('hide')).toBeNull()
    for (const name of ['Navigation', 'Hero', 'Footer']) {
      await openSection(panel, name)
      await expect(sectionControl(panel, name).getByRole('switch')).toHaveCount(0)
    }
    await openSection(panel, 'Hero')
    await chooseStyle(panel, 'cinematic')
    await minimizeControls(page)
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      await expect.poll(() => stage.evaluate(element => {
        const hero = element.querySelector('.mc-hero-cine')!
        return Math.round(hero.getBoundingClientRect().height - element.getBoundingClientRect().height)
      })).toBe(0)
    }
  })

  test('all five review designs have visibly fictional samples in both languages', async ({ page }) => {
    for (const locale of ['en', 'ro']) {
      await page.goto(`${locale === 'ro' ? '/ro' : ''}${DEMO}`)
      const panel = controls(page)
      const name = locale === 'ro' ? 'Recenzii' : 'Reviews'
      await openSection(panel, name)
      await expect(panel.getByRole('switch', { name: `${locale === 'ro' ? 'Afișează această secțiune' : 'Show this section'}: ${name}`, exact: true })).toHaveAttribute('aria-checked', 'true')
      const reviews = page.locator('[data-preview-section="testimonials"]')
      for (const variant of ['wall', 'default', 'marquee', 'spotlight', 'deck']) {
        await chooseStyle(panel, variant)
        await expect(reviews.locator(`[data-reviews="${variant}"]`)).toHaveCount(1)
        await expect(reviews).toContainText(locale === 'ro' ? 'Client demo' : 'Demo client')
        await expect(reviews).not.toContainText(/\bverified\b|verificat[ăe]/i)
      }
      const notice = panel.locator('[data-demo-info]')
      await expect(panel.locator('header')).toContainText('Web Studio · Demo')
      await expect(notice).toContainText(locale === 'ro' ? 'Despre acest demo' : 'About this demo')
      const disclosure = locale === 'ro'
        ? 'Afacerea, echipa, recenziile și evaluările sunt fictive. Portretele echipei sunt generate cu AI.'
        : 'The business, team, reviews and ratings are fictional. Team portraits are AI-generated.'
      await expect(notice).toContainText(disclosure)
      await minimizeControls(page, locale)
      const launcher = page.locator('[data-try-launcher]')
      await expect(launcher.getByText(disclosure, { exact: true })).toHaveCount(0)
      await page.reload()
      await expect(notice).toBeVisible()
      await expect(reviews.locator('[data-reviews="deck"]')).toHaveCount(1)
    }
  })

  test('Studio gallery supports keyboard navigation, modal focus and return to the source image', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(DEMO)
    const panel = controls(page)
    await openSection(panel, 'Gallery')
    await chooseStyle(panel, 'bento')
    await minimizeControls(page)
    const source = page.locator('[data-preview-section="gallery"] button[data-gimg="0"]').first()
    await source.scrollIntoViewIfNeeded()
    await source.focus()
    await page.keyboard.press('Enter')
    const viewer = page.getByRole('dialog')
    await expect(viewer).toBeVisible()
    await expect(viewer.getByRole('button', { name: 'Previous image', exact: true })).toBeDisabled()
    await page.keyboard.press('ArrowRight')
    await expect(viewer.getByRole('status')).toContainText('2')
    await expect(viewer.getByRole('button', { name: 'Previous image', exact: true })).toBeEnabled()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
    await expect(source).toBeFocused()
    expect(errors).toEqual([])
  })

  test('section styles expand in place and keep neighbouring sections available', async ({ page }) => {
    await page.goto(`${DEMO}?hide=testimonials`)
    const panel = controls(page)
    await expect(panel.getByRole('tab')).toHaveCount(0)
    await expect(panel.getByRole('combobox')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Back to sections', exact: true })).toHaveCount(0)
    await expect(panel.getByRole('radio')).toHaveCount(0)
    await openSection(panel, 'Gallery')
    await chooseStyle(panel, 'masonry')
    await expect(page.locator('[data-preview-section="gallery"] [data-gallery="masonry"]')).toHaveCount(1)
    await expect(sectionButton(panel, 'Team')).toBeVisible()
    await expect(sectionButton(panel, 'Services')).toBeVisible()

    await openSection(panel, 'Team')
    await expect(sectionButton(panel, 'Gallery')).toHaveAttribute('aria-expanded', 'false')
    await openSection(panel, 'Gallery')
    await expect(sectionControl(panel, 'Gallery').locator('input[type="radio"][value="masonry"]')).toBeChecked()
    await sectionButton(panel, 'Gallery').click()
    await expect(sectionButton(panel, 'Gallery')).toHaveAttribute('aria-expanded', 'false')
    await expect(sectionControl(panel, 'Gallery')).toContainText('Masonry')
    await expect(sectionControl(panel, 'Gallery').getByRole('radio')).toHaveCount(0)

    await openSection(panel, 'Reviews')
    await expect(panel.getByText('This section is hidden. Turn it on to preview this style.', { exact: true })).toBeVisible()
    await chooseStyle(panel, 'deck')
    const hiddenReviews = panel.locator('[data-section-control="testimonials"]')
    const selectedVariant = hiddenReviews.locator('input[type="radio"][value="deck"]')
    await expect(selectedVariant).toBeChecked()
    const selectedStyleName = (await selectedVariant.locator('..').innerText()).trim()
    await expect(page.locator('[data-preview-section="testimonials"]')).toHaveCount(0)
    await sectionButton(panel, 'Reviews').click()
    await expect(sectionButton(panel, 'Reviews')).toHaveAttribute('aria-expanded', 'false')
    await expect(hiddenReviews).toContainText(selectedStyleName)
    await expect(sectionButton(panel, 'Reviews')).toHaveAccessibleDescription(`Hidden. ${selectedStyleName}`)
    await openSection(panel, 'Reviews')
    await expect(selectedVariant).toBeChecked()
    await panel.getByRole('switch', { name: 'Show this section: Reviews', exact: true }).click()
    await expect(panel.getByText('This section is hidden. Turn it on to preview this style.', { exact: true })).toHaveCount(0)
    await expect(page.locator('[data-preview-section="testimonials"]')).toHaveCount(1)
  })

  test('selected business, font and section choices use neutral borders', async ({ page }) => {
    await page.goto(DEMO)
    const panel = controls(page)
    const expectNeutralBorder = async (selected: Locator) => {
      await expect(selected).toBeChecked()
      await expect.poll(() => selected.evaluate(input => {
        const border = getComputedStyle(input.nextElementSibling!).borderTopColor
        const context = document.createElement('canvas').getContext('2d')!
        context.fillStyle = border
        context.fillRect(0, 0, 1, 1)
        const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
        return Math.max(red, green, blue) - Math.min(red, green, blue)
      })).toBeLessThan(15)
    }
    await chooseExample(panel, 'Pet grooming')
    await expectNeutralBorder(panel.getByRole('radio', { name: 'Pet grooming', exact: true }))
    await chooseFont(panel, 'classic')
    await expectNeutralBorder(panel.locator('input[type="radio"][value="classic"]'))
    await openSection(panel, 'Hero')
    await chooseStyle(panel, 'portal')
    await expectNeutralBorder(sectionControl(panel, 'Hero').locator('input[type="radio"][value="portal"]'))
  })

  test('colours expand in place and retain an extra colour when collapsed', async ({ page }) => {
    await page.goto(DEMO)
    const panel = controls(page)
    const quickColours = ['Terracotta', 'Jade', 'Mulberry', 'Forest', 'Marine']
    for (const name of quickColours) await expect(panel.getByRole('button', { name, exact: true })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Ink', exact: true })).toHaveCount(0)
    const more = panel.getByRole('button', { name: 'More colours', exact: true })
    await more.click()
    const fewer = panel.getByRole('button', { name: 'Fewer colours', exact: true })
    await expect(fewer).toHaveAttribute('aria-expanded', 'true')
    await expect(fewer).toHaveAttribute('aria-controls', /.+/)
    await panel.getByRole('button', { name: 'Ink', exact: true }).click()
    await expect(panel.getByRole('button', { name: 'Ink', exact: true })).toHaveAttribute('aria-pressed', 'true')
    const inkCode = new URL(page.url()).searchParams.get('s')
    await fewer.click()
    await expect(more).toHaveAttribute('aria-expanded', 'false')
    await expect(panel.locator('[data-current-colour]')).toHaveText('Ink')
    for (const name of quickColours) await expect(panel.getByRole('button', { name, exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.get('s')).toBe(inkCode)
    await panel.getByRole('button', { name: 'Terracotta', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(inkCode)
    await expect(panel.getByRole('button', { name: 'Terracotta', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('inline disclosures support keyboard use and reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(DEMO)
    const panel = controls(page)
    const heroButton = sectionButton(panel, 'Hero')
    await heroButton.focus()
    await page.keyboard.press('Enter')
    await expect(heroButton).toHaveAttribute('aria-expanded', 'true')
    const hero = sectionControl(panel, 'Hero')
    const selected = hero.locator('input[type="radio"]:checked')
    const previous = await selected.inputValue()
    await selected.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => selected.inputValue()).not.toBe(previous)
    await expect.poll(() => panel.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)).toBe(0)
    await heroButton.focus()
    await page.keyboard.press('Enter')
    await expect(heroButton).toHaveAttribute('aria-expanded', 'false')
    await expect(hero.getByRole('radio')).toHaveCount(0)
    await expect(heroButton).toBeFocused()
    const chooseFontButton = panel.getByRole('button', { name: 'Choose a font', exact: true })
    await chooseFontButton.focus()
    await page.keyboard.press('Enter')
    await expect(chooseFontButton).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.getByRole('radio', { name: 'Libre Caslon', exact: true })).toBeVisible()
  })

  test('floating controls minimize without resizing the website or losing the selected device and section', async ({ page }) => {
    await page.goto(DEMO)
    const panel = controls(page)
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Desktop', exact: true })).toHaveAttribute('aria-pressed', 'true')
    // Floating controls leave the full-width desktop canvas unchanged.
    await expect.poll(() => stageBounds(page)).toEqual([0, 0, 1440, 900])
    const desktopBounds = await stageBounds(page)
    await minimizeControls(page)
    await expect.poll(() => stageBounds(page)).toEqual(desktopBounds)
    await page.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
    await expect(panel).toBeVisible()
    await expect.poll(() => stageBounds(page)).toEqual(desktopBounds)
    await panel.getByRole('button', { name: 'Mobile', exact: true }).click()
    await expect.poll(() => page.locator('[data-try-stage]').evaluate(element => element.clientWidth)).toBe(390)
    await openSection(panel, 'Gallery')
    const mobileBounds = await stageBounds(page)
    const code = new URL(page.url()).searchParams.get('s')
    await minimizeControls(page)
    await expect.poll(() => stageBounds(page)).toEqual(mobileBounds)
    await page.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
    await expect(panel.getByRole('button', { name: 'Mobile', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(sectionButton(panel, 'Gallery')).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => stageBounds(page)).toEqual(mobileBounds)
    expect(new URL(page.url()).searchParams.get('s')).toBe(code)
  })

  test('visible demo information and footer locks leave keyboard-selected styles readable', async ({ page }) => {
    for (const { width, height, locale } of [
      { width: 1366, height: 768, locale: 'en' },
      { width: 1366, height: 768, locale: 'ro' },
      { width: 390, height: 844, locale: 'ro' },
      { width: 1366, height: 700, locale: 'ro' },
    ]) {
      await page.setViewportSize({ width, height })
      await page.goto(`${locale === 'ro' ? '/ro' : ''}${DEMO}?hide=`)
      const panel = controls(page)
      if (width < 1024) {
        await page.getByRole('button', { name: locale === 'ro' ? 'Web Studio: Personalizează' : 'Web Studio: Customize', exact: true }).click()
        await waitForControlMotion(panel)
      }
      await openSection(panel, 'Hero')
      const information = panel.locator('[data-demo-info]')
      await information.scrollIntoViewIfNeeded()
      await expect(information).toBeVisible()
      await expect(information.locator('details, summary')).toHaveCount(0)
      for (const lock of await panel.locator('.zw-try-lock').all()) {
        await lock.click()
        await expect(lock).toHaveAttribute('aria-pressed', 'true')
      }
      await expect(panel.locator('.zw-try-shuffle')).toBeDisabled()
      await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBe(0)

      const hero = sectionControl(panel, 'Hero')
      await hero.locator('input[type="radio"]:checked').focus()
      for (let index = 0; index < 6; index++) {
        await page.keyboard.press('ArrowRight')
        await expect.poll(() => hero.locator('input[type="radio"]:checked').evaluate(input => {
          const card = input.parentElement!
          const label = card.getBoundingClientRect()
          const settings = input.closest('[data-controls-scroll]')!
          const scroller = getComputedStyle(settings).overflowY === 'visible' ? input.closest('[data-controls-body]')! : settings
          const scrollport = scroller.getBoundingClientRect()
          return label.top >= scrollport.top && label.bottom <= scrollport.bottom + 1
        })).toBe(true)
      }
      await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBe(0)
    }
  })

  test('phone starts minimized and keyboard customization returns focus to its launcher', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(DEMO)
    const panel = controls(page)
    const launcher = page.getByRole('button', { name: 'Customize', exact: true })
    await expect(launcher).toBeVisible()
    await expect(panel).toHaveCount(0)
    const initialBounds = await stageBounds(page)
    await launcher.focus()
    await page.keyboard.press('Enter')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Choose demo business', exact: true })).toBeFocused()
    await expect.poll(() => stageBounds(page)).toEqual(initialBounds)
    await panel.getByRole('button', { name: 'Try another design', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(panel.getByRole('link', { name: 'Back', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(launcher).toBeFocused()
    await expect.poll(() => stageBounds(page)).toEqual(initialBounds)
    await launcher.click()
    await panel.getByRole('button', { name: 'Web Studio · Demo: Minimize panel', exact: true }).click()
    await expect(panel).toHaveCount(0)
    await expect(launcher).toBeFocused()
  })

  test('desktop controls can move without resizing the preview and remain reachable after expanding and resizing', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1200 })
    await page.goto(DEMO)
    const panel = controls(page)
    const launcher = page.locator('[data-try-launcher]')
    await expect(panel).toBeVisible()
    const initialStage = await stageBounds(page)
    const original = (await panel.boundingBox())!
    expect(original).toMatchObject({ x: 16, y: 16, width: 420, height: 1168 })
    // The website and settings own their scrolling; SR labels must not add an outer scrollbar.
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBe(0)
    const handle = panel.getByRole('button', { name: 'Move controls', exact: true })

    await moveControls(page, handle, 360, 100)
    await expect.poll(async () => Math.round((await panel.boundingBox())!.x - original.x)).toBe(360)
    const moved = (await panel.boundingBox())!
    expect(Math.round(moved.y - original.y)).toBe(0)
    expect(Math.round(moved.width)).toBe(Math.round(original.width))
    expect(Math.round(moved.height)).toBe(Math.round(original.height))
    await expect.poll(() => stageBounds(page)).toEqual(initialStage)

    // Clicking the grip offers an alternative to dragging; it must not reset the position.
    await handle.click()
    const positioning = page.getByRole('dialog', { name: 'Position controls', exact: true })
    await expect(positioning).toBeVisible()
    await expect.poll(async () => {
      const rect = (await panel.boundingBox())!
      return [Math.round(rect.x), Math.round(rect.y)]
    }).toEqual([Math.round(moved.x), Math.round(moved.y)])
    await positioning.getByRole('button', { name: 'Move right', exact: true }).click()
    await positioning.getByRole('button', { name: 'Move down', exact: true }).click()
    await expect.poll(async () => {
      const rect = (await panel.boundingBox())!
      return [Math.round(rect.x - moved.x), Math.round(rect.y - moved.y)]
    }).toEqual([20, 0])
    await positioning.getByRole('button', { name: 'Reset position', exact: true }).click()
    await expect(positioning).toHaveCount(0)
    await expect(handle).toBeFocused()
    await expect.poll(async () => {
      const rect = (await panel.boundingBox())!
      return [Math.round(rect.x), Math.round(rect.y)]
    }).toEqual([16, 16])

    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => Math.round((await panel.boundingBox())!.x)).toBe(36)
    await page.keyboard.press('Shift+ArrowDown')
    await expect.poll(async () => Math.round((await panel.boundingBox())!.y)).toBe(16)
    await page.keyboard.press('Home')
    await expect.poll(async () => {
      const rect = (await panel.boundingBox())!
      return [Math.round(rect.x), Math.round(rect.y)]
    }).toEqual([16, 16])

    await minimizeControls(page)
    const pillHandle = launcher.getByRole('button', { name: 'Move controls', exact: true })
    const grip = (await pillHandle.boundingBox())!
    await moveControls(page, pillHandle, 1580 - grip.x - grip.width / 2, 1180 - grip.y - grip.height / 2)
    await expectControlsInsideViewport(launcher)
    const movedPill = (await launcher.boundingBox())!
    expect(movedPill.x + movedPill.width).toBeGreaterThan(1450)
    expect(movedPill.y + movedPill.height).toBeGreaterThan(1100)
    await expect.poll(() => launcher.evaluate(element => Math.round(innerHeight - element.getBoundingClientRect().bottom))).toBe(16)
    await expect.poll(() => stageBounds(page)).toEqual(initialStage)

    await launcher.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
    await expect(panel).toBeVisible()
    await waitForControlMotion(panel)
    await expectControlsInsideViewport(panel)
    await expect.poll(() => stageBounds(page)).toEqual(initialStage)
    await minimizeControls(page)
    await expect.poll(async () => {
      const rect = (await launcher.boundingBox())!
      return [Math.round(rect.x), Math.round(rect.y)]
    }).toEqual([Math.round(movedPill.x), Math.round(movedPill.y)])

    await launcher.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
    await waitForControlMotion(panel)
    await page.setViewportSize({ width: 1100, height: 740 })
    await expectControlsInsideViewport(panel)
    await minimizeControls(page)
    await expectControlsInsideViewport(launcher)
  })

  test('phone and tablet controls stay anchored at the bottom while the preview and settings scroll', async ({ page }) => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 834, height: 1194 }]) {
      await page.setViewportSize(viewport)
      await page.goto(DEMO)
      const panel = controls(page)
      const launcher = page.locator('[data-try-launcher]')
      const stage = page.locator('[data-try-stage]')
      await expect(launcher).toBeVisible()
      await expect(panel).toHaveCount(0)
      await expect(launcher.getByRole('button', { name: 'Move controls', exact: true })).toHaveCount(0)
      await expect.poll(() => launcher.evaluate(element => innerHeight - element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(16)
      await expectControlsInsideViewport(launcher)
      const beforeScroll = (await launcher.boundingBox())!
      await page.mouse.move(viewport.width / 2, viewport.height / 2)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => stage.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      await expect.poll(async () => Math.round((await launcher.boundingBox())!.y)).toBe(Math.round(beforeScroll.y))

      await launcher.getByRole('button', { name: 'Web Studio: Customize', exact: true }).click()
      await expect(panel).toBeVisible()
      await waitForControlMotion(panel)
      await expectControlsInsideViewport(panel)
      await expect.poll(() => panel.evaluate(element => innerHeight - element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(16)
      const expanded = (await panel.boundingBox())!
      const settings = panel.locator('[data-controls-scroll]')
      const settingsBounds = (await settings.boundingBox())!
      await page.mouse.move(settingsBounds.x + settingsBounds.width / 2, settingsBounds.y + settingsBounds.height / 2)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => settings.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      await expect.poll(async () => Math.round((await panel.boundingBox())!.y)).toBe(Math.round(expanded.y))
      await minimizeControls(page)
      await expect.poll(async () => Math.round((await launcher.boundingBox())!.y)).toBe(Math.round(beforeScroll.y))
    }
  })
})
