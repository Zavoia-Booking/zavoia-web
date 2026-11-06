import { expect, test, type Locator } from '@playwright/test'

const examples = [
  {
    id: 'fitness', business: 'Forma Studio', hero: '.mc-hero-cine',
    title: { en: 'Fitness & Sports', ro: 'Fitness & Sport' },
    nav: 'capsule', services: 'bento', gallery: 'carousel', team: '.mc-team', locations: 'showcase', footer: 'masthead',
    service: 'First training session', member: 'Andrei Popa',
  },
  {
    id: 'pets', business: 'Paw & Co', hero: '.mc-plate',
    title: { en: 'Pets', ro: 'Animale de companie' },
    nav: 'editorial', services: 'grid', gallery: 'masonry', team: '.mc-tmc', locations: 'panorama', footer: 'editorial',
    service: 'Full groom, small dog', member: 'Mara Ionescu',
  },
  {
    id: 'music', business: 'Tempo Music', hero: '.mc-heropt',
    title: { en: 'Education & Coaching', ro: 'Educație & Coaching' },
    nav: 'underlay', services: 'feature', gallery: 'fan', team: '.mc-roster', locations: 'atlas', footer: 'signature',
    service: 'Your first guitar lesson', member: 'Alex Marin',
  },
  {
    id: 'wellness', business: 'Serein Studio', hero: '.mc-herotb',
    title: { en: 'Spa & Wellness', ro: 'Spa & Wellness' },
    nav: 'split', services: 'grid', gallery: 'bento', team: '.mc-tmr', locations: 'cards', footer: 'directory',
    service: 'Relaxation massage', member: 'Elena Radu',
  },
  {
    id: 'automotive', business: 'Nord Auto', hero: '.mc-herodr',
    title: { en: 'Automotive', ro: 'Auto' },
    nav: 'editorial', services: 'grid', gallery: 'fan', team: '.mc-roster', locations: 'showcase', footer: 'marque',
    service: 'Oil & filter change', member: 'Radu Ionescu',
  },
] as const

const previewLink = (article: Locator, business: string, locale: 'en' | 'ro' = 'en') =>
  article.getByRole('link', { name: locale === 'ro' ? `Explorează site-ul ${business}` : `Explore the ${business} website`, exact: true })

async function expectReadablePreview(example: Locator, business: string, bookingLabel: string) {
  const content = example.locator('figure [inert]').first()
  await expect(content).toHaveCount(1)
  await expect(content).toHaveCSS('opacity', '1')
  // The real site's brand and booking action must fit the screen, including
  // rotated mockups. A visible figure alone does not detect clipped content.
  await expect.poll(() => content.evaluate((element, labels) => {
    const frame = element.parentElement!
    const scale = new DOMMatrixReadOnly(getComputedStyle(element).transform).a
    const hero = element.querySelector('[data-preview-section="hero"]')
    const booking = [...(hero?.querySelectorAll('span') ?? [])]
      .find(span => span.textContent?.trim() === labels.booking && span.getBoundingClientRect().width > 0)
    const nav = element.querySelector('[data-preview-section="nav"]')
    const brand = [...(nav?.querySelectorAll('span') ?? [])]
      .find(span => span.textContent?.trim() === labels.business && span.getBoundingClientRect().width > 0)
    if (!booking || !brand) return false
    const bounds = frame.getBoundingClientRect()
    const fits = (item: Element) => {
      const itemBounds = item.getBoundingClientRect()
      const style = getComputedStyle(item)
      return itemBounds.width > 0 && itemBounds.height > 0 && style.visibility !== 'hidden'
        && itemBounds.left >= bounds.left - 1 && itemBounds.right <= bounds.right + 1
        && itemBounds.top >= bounds.top - 1 && itemBounds.bottom <= bounds.bottom + 1
    }
    return scale > .01 && Math.abs((element as HTMLElement).offsetWidth * scale - frame.clientWidth) < 1.5
      && fits(booking) && fits(brand)
  }, { business, booking: bookingLabel })).toBe(true)
}

test.describe('Web Studio marketing', () => {
  test('explains the product with five canonical industries and links to the business trial', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/web-studio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A website that feels like your business.')
    await expect(page.getByText('Create a website with the services, team and photos in Zavoia. Choose its look and manage bookings in your Zavoia calendar.')).toBeVisible()
    const trial = page.getByRole('link', { name: 'Start a 14-day Base trial', exact: true })
    const url = new URL((await trial.getAttribute('href'))!)
    expect(url.origin).toBe('https://app.zavoia.com')
    expect(url.pathname).toBe('/register')
    expect(url.searchParams.get('lang')).toBe('en')
    await expect(page.locator('[aria-labelledby="web-studio-title"]').getByRole('link', { name: 'Try the demo', exact: true })).toHaveAttribute('href', '/web-studio/demo')

    const gallery = page.locator('[data-studio-gallery]')
    await expect(gallery.locator('article[data-example]')).toHaveCount(5)
    // Marketing presents the results; controls belong to the separate demo.
    await expect(gallery.getByRole('button')).toHaveCount(0)
    await expect(gallery.getByRole('tab')).toHaveCount(0)
    for (const example of examples) {
      const article = gallery.locator(`[data-example="${example.id}"]`)
      await expect(article).toBeVisible()
      await expect(article.getByRole('heading', { name: example.title.en, exact: true })).toBeVisible()
      await expectReadablePreview(article, example.business, 'Book now')
      await expect(article.locator('figure [inert]').first()).toContainText(example.business)
      // Each mockup is one named native link. Its real renderer remains
      // inert, so visitors never tab into nested demo controls on marketing.
      await expect(article.getByRole('link')).toHaveCount(example.id === 'automotive' ? 3 : 1)
      await expect(previewLink(article, example.business)).toBeVisible()
      await expect(previewLink(article, example.business)).toHaveText('')
      await expect(article.locator('[data-preview-section="nav"]').first()).toHaveAttribute('data-nav-variant', example.nav)
      if (example.id === 'automotive') {
        await expect(article.locator('[data-auto-scene]')).toHaveCount(3)
        await expect(article.locator('[data-auto-scene="gallery"] .mc-galfan-card')).toHaveCount(5)
        const cards = article.locator('[data-auto-scene="services"] .mc-services-card')
        await expect(cards).toHaveCount(3)
        for (const card of await cards.all()) await expect(card.locator('.mc-services-card-item')).toHaveCount(2)
      }
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    expect(errors).toEqual([])
  })

  test('each industry opens its corresponding complete website design in the separate demo', async ({ page }) => {
    const encodedLooks = new Set<string>()
    for (const example of examples) {
      await page.goto('/web-studio')
      const article = page.locator(`[data-studio-gallery] [data-example="${example.id}"]`)
      const demo = previewLink(article, example.business)
      const destination = new URL((await demo.getAttribute('href'))!, 'http://localhost')
      expect(destination.pathname).toBe('/web-studio/demo')
      expect(destination.searchParams.get('example')).toBe(example.id)
      expect(destination.searchParams.get('s')).toHaveLength(14)
      encodedLooks.add(destination.searchParams.get('s')!)
      expect(destination.searchParams.get('hide')?.split(',')).toEqual(expect.arrayContaining(['announcement', 'marquee', 'testimonials']))
      await demo.click()
      await expect(page).toHaveURL(/\/web-studio\/demo\?/)
      const stage = page.locator('[data-try-stage]:visible')
      await expect(stage).toContainText(example.business)
      await expect(stage.locator(`[data-preview-section="hero"] ${example.hero}`)).toHaveCount(1)
      await expect(stage.locator('[data-preview-section="nav"]')).toHaveAttribute('data-nav-variant', example.nav)

      // A handoff must retain the whole site, not just a different hero over
      // the same default services, gallery, team and location sections.
      for (const [section, variant] of [
        ['services', example.services], ['gallery', example.gallery], ['locations', example.locations],
      ]) {
        const rendered = stage.locator(`[data-preview-section="${section}"] [data-${section}="${variant}"]`)
        await rendered.scrollIntoViewIfNeeded()
        await expect(rendered).toBeVisible()
        await expect(rendered).toBeInViewport()
      }
      await expect(stage.locator('[data-preview-section="services"]')).toContainText(example.service)
      const team = stage.locator(`[data-preview-section="team"] ${example.team}`)
      await team.scrollIntoViewIfNeeded()
      await expect(team).toBeInViewport()
      await expect(team).toContainText(example.member)
      const footer = stage.locator(`[data-preview-section="footer"].mc-footer--${example.footer}`)
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toBeInViewport()
      expect(new URL(page.url()).searchParams.get('s')).toBe(destination.searchParams.get('s'))
      expect(new URL(page.url()).searchParams.get('example')).toBe(example.id)
      await expect(stage.locator('[data-preview-section="announcement"], [data-preview-section="marquee"], [data-preview-section="testimonials"]')).toHaveCount(0)
    }
    expect(encodedLooks.size).toBe(5)
  })

  test('Romanian examples, editor image and business signup use the selected language', async ({ page }) => {
    await page.goto('/ro/web-studio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Un site care îți reprezintă afacerea.')
    await expect(page.getByRole('img', { name: /Editorul real Zavoia Web Studio/ })).toHaveAttribute('src', /editor-ro/)
    const gallery = page.locator('[data-studio-gallery]')
    for (const example of examples) {
      const article = gallery.locator(`[data-example="${example.id}"]`)
      await expectReadablePreview(article, example.business, 'Programează acum')
      await expect(article.getByRole('heading', { name: example.title.ro, exact: true })).toBeVisible()
      const link = previewLink(article, example.business, 'ro')
      await expect(link).toHaveAttribute('href', new RegExp(`/ro/web-studio/demo\\?example=${example.id}&`))
    }
    const trialUrl = new URL((await page.getByRole('link', { name: 'Încearcă Base gratuit 14 zile', exact: true }).getAttribute('href'))!)
    expect(trialUrl.searchParams.get('lang')).toBe('ro')
    await page.getByText('Ce pot face în perioada de probă?', { exact: true }).click()
    await expect(page.getByText('Perioada de probă de 14 zile cu Base începe când îți creezi afacerea în Zavoia.', { exact: false })).toBeVisible()
  })

  test('keyboard users can enter a mockup without tabbing through its inert controls', async ({ page }) => {
    await page.goto('/web-studio')
    const gallery = page.locator('[data-studio-gallery]')
    const first = previewLink(gallery.locator('[data-example="fitness"]'), 'Forma Studio')
    const second = previewLink(gallery.locator('[data-example="pets"]'), 'Paw & Co')
    await first.focus()
    await expect(first).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(second).toBeFocused()
    const destination = await second.getAttribute('href')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === destination)
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Paw & Co')
  })

  test('mockup hover preserves its angle and respects reduced motion', async ({ page }) => {
    await page.goto('/web-studio')
    const link = previewLink(page.locator('[data-studio-gallery] [data-example="fitness"]'), 'Forma Studio')
    const transform = () => link.evaluate(element => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element.parentElement!).transform)
      return { scale: Math.hypot(matrix.a, matrix.b), angle: Math.atan2(matrix.b, matrix.a) }
    })
    await page.mouse.move(0, 0)
    const initial = await transform()
    expect(initial.scale).toBeCloseTo(1, 3)
    await link.hover()
    // The suite starts with reduced motion; a hover must not enlarge a frame.
    expect((await transform()).scale).toBeCloseTo(1, 3)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect.poll(async () => (await transform()).scale).toBeCloseTo(1.018, 3)
    expect((await transform()).angle).toBeCloseTo(initial.angle, 4)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(async () => (await transform()).scale).toBeCloseTo(1, 3)
    expect((await transform()).angle).toBeCloseTo(initial.angle, 4)

    const auto = page.locator('[data-studio-gallery] [data-example="automotive"]')
    const scales = () => auto.locator('[data-auto-scene] > div').evaluateAll(screens => screens.map(screen => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(screen).transform)
      return Number(Math.hypot(matrix.a, matrix.b).toFixed(3))
    }))
    await auto.locator('[data-auto-scene="gallery"] a').hover()
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect.poll(scales).toEqual([1, 1.018, 1])
    await auto.locator('[data-auto-scene="services"] a').hover()
    await expect.poll(scales).toEqual([1, 1, 1.018])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(scales).toEqual([1, 1, 1])
  })

  test('narrow screens show every industry without overflow or cropped booking actions', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/ro/web-studio')
      const gallery = page.locator('[data-studio-gallery]:visible')
      await expect(gallery.getByRole('button')).toHaveCount(0)
      for (const example of examples) {
        const article = gallery.locator(`[data-example="${example.id}"]`)
        await expect(article).toBeVisible()
        const previews = article.locator('[data-studio-preview]')
        if (example.id === 'automotive') {
          await expect(previews).toHaveCount(3)
          for (const preview of await previews.all()) {
            await expect(preview).toHaveAttribute('data-device', 'desktop')
            await expect(preview).toBeVisible()
          }
        } else {
          await expect(previews).toHaveAttribute('data-device', 'phone')
        }
        await expectReadablePreview(article, example.business, 'Programează acum')
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
    }
    expect(errors).toEqual([])
  })
})
