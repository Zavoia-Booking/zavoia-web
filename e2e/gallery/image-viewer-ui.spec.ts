import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { AllFavorites, TeamMemberBookingContext, TeamMemberProfile } from '../../src/lib/api/marketplace/types'
import { SECTION_META, SECTION_TYPES } from '../../src/features/website/components/builder/sectionCatalog'

const PERSON = 'Mara Gallery'
const PHOTO = '/__gallery-fixtures__/'
const viewerFor = (page: Page) => page.locator('[data-image-viewer]')
const stageFor = (page: Page) => viewerFor(page).locator('[data-image-viewer-stage]')
const tilesFor = (page: Page) => page.locator('.zw-member-tile')
const viewerImage = (page: Page) => stageFor(page).locator('img').first()

async function installGalleryFixture(context: BrowserContext, baseURL: string) {
  const state = {
    portfolio: [`${PHOTO}one.svg`, `${PHOTO}two.svg`, `${PHOTO}three.svg`] as TeamMemberProfile['portfolio'],
    blockedMutations: [] as string[],
    apiReads: [] as string[],
  }
  const token = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'), 'gallery-fixture'].join('.')
  const favorites: AllFavorites = {
    locations: [],
    professionals: [{
      id: 1003,
      professional: { id: 301, uuid: 'gallery-professional-fixture', firstName: 'Mara', lastName: 'Gallery', displayName: PERSON, professionalTitle: 'Stylist', profileImage: `${PHOTO}portrait.svg`, averageRating: 4.8, totalReviews: 0 },
      createdAt: '2026-09-10T10:00:00Z',
    }],
  }
  const booking: TeamMemberBookingContext = {
    teamMember: { id: 301, firstName: 'Mara', lastName: 'Gallery', profileImage: `${PHOTO}portrait.svg` },
    businesses: [{
      id: 101, name: 'Atelier Gallery', listingId: 11, businessCurrency: 'RON', logo: null,
      locations: [{
        id: 201, name: 'Gallery Old Town', address: 'Strada Lipscani 5, București', latitude: 44.43, longitude: 26.10, timezone: 'Europe/Bucharest', featuredImage: `${PHOTO}venue.svg`, averageRating: 4.7, totalReviews: 12, allowOnlineBooking: true,
        services: [{ id: 401, uuid: 'gallery-service', name: 'Gallery haircut', description: null, priceAmountMinor: 12000, duration: 30, categoryId: null, category: null, displayOrder: 0 }],
      }],
    }],
  }
  await context.addCookies([{ name: 'zw-consent', value: 'denied', url: baseURL }, { name: 'customerCsrfToken', value: 'gallery-ui-fixture', url: baseURL }])
  await context.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.origin === new URL(baseURL).origin && path === '/__nextjs_original-stack-frames' && method === 'POST') return route.continue()
    if (path.includes('/marketplace/')) {
      state.apiReads.push(`${method} ${path}`)
      if (path.endsWith('/auth/refresh') && method === 'POST') return json({ accessToken: token, csrfToken: 'gallery-ui-fixture' })
      if (method === 'GET' && path.endsWith('/auth/me')) return json({ user: { uuid: 'gallery-user', email: 'gallery@example.invalid', firstName: 'Gallery', lastName: 'Fixture', profileImage: null, hasPassword: true, emailVerified: true, googleSub: null } })
      if (method === 'GET' && path.endsWith('/customer/favorites')) return json(favorites)
      if (method === 'GET' && path.endsWith('/customer/favorite/professionals')) return json(favorites.professionals)
      if (method === 'GET' && path.endsWith('/customer/favorite/locations')) return json([])
      if (method === 'GET' && path.endsWith('/team-member/301/booking-context')) return json({ data: booking })
      if (method === 'GET' && path.endsWith('/team-member/301')) {
        const profile: TeamMemberProfile = { id: 301, uuid: 'gallery-professional-fixture', firstName: 'Mara', lastName: 'Gallery', profileImage: `${PHOTO}portrait.svg`, yearsOfExperience: 5, visitsCompleted: 10, memberSince: '2024-01-01T10:00:00Z', about: { displayName: PERSON, professionalTitle: 'Stylist', aboutMe: 'A calm welcome, careful consultation and thoughtful professional care. '.repeat(12), interests: ['Hair care'], languages: ['Română', 'English'], socialLinks: {} }, services: [], portfolio: state.portfolio, reviews: [], reviewStats: { totalCount: 0, averageRating: null } }
        return json(profile)
      }
      if (method === 'GET' && path.endsWith('/notifications/unread-count')) return json({ data: { count: 0 } })
      if (method === 'GET' && path.endsWith('/notifications/inbox')) return json({ data: { notifications: [], unreadCount: 0, hasMore: false, nextCursor: null } })
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) state.blockedMutations.push(`${method} ${path}`)
      return json({ message: `Unmocked gallery fixture endpoint: ${path}` }, 404)
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      state.blockedMutations.push(`${method} ${path}`)
      return route.fulfill({ status: 403, body: 'Gallery fixture blocks unmatched mutations' })
    }
    if (path.endsWith('/broken.svg')) return route.fulfill({ status: 404, body: 'Missing fixture image' })
    if (path.startsWith(PHOTO) || url.origin !== new URL(baseURL).origin) {
      // Also isolate the Studio specimen's remote image requests. No API or
      // asset on another service is contacted by these browser checks.
      const size = path.endsWith('/tall.svg') ? { width: 600, height: 900 } : { width: 900, height: 600 }
      return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}"><rect width="100%" height="100%" fill="${path.includes('two') ? '#42686b' : '#b86a48'}"/></svg>` })
    }
    return route.continue()
  })
  return state
}

const galleryTest = test.extend<{ fixture: Awaited<ReturnType<typeof installGalleryFixture>> }>({
  fixture: async ({ context, page, baseURL }, provide) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const fixture = await installGalleryFixture(context, baseURL!)
    await provide(fixture)
    expect(fixture.blockedMutations).toEqual([])
    expect(errors, 'Gallery interactions must not cause runtime errors').toEqual([])
  },
})

async function openProfile(page: Page, path = '/saved') {
  await page.goto(path)
  await page.getByRole('button', { name: PERSON, exact: true }).click()
  const profile = page.locator('.zw-member-overlay')
  await expect(profile).toBeVisible()
  await expect(tilesFor(page).first()).toBeVisible()
  return profile
}

async function expectPhoto(page: Page, filename: string) {
  await expect(viewerImage(page)).toHaveAttribute('src', `${PHOTO}${filename}`)
}

async function expectFocusInside(viewer: Locator) {
  await expect.poll(() => viewer.evaluate(el => el.contains(document.activeElement))).toBe(true)
}

galleryTest('portfolio opens selected photo, bounds navigation, isolates focus and restores the unchanged profile', async ({ page, fixture }) => {
  void fixture
  const profile = await openProfile(page)
  await profile.getByRole('button', { name: 'Add Gallery haircut', exact: true }).click()
  const tile = tilesFor(page).nth(1)
  await tile.scrollIntoViewIfNeeded()
  const scrollBefore = await profile.evaluate(el => [...el.querySelectorAll<HTMLElement>('*')].filter(node => node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY === 'auto').map(node => node.scrollTop))
  await tile.focus()
  await page.keyboard.press('Enter')
  const viewer = viewerFor(page)
  await expect(viewer).toBeVisible()
  await expectPhoto(page, 'two.svg')
  await expectFocusInside(viewer)
  await viewerImage(page).click()
  await expect(viewer).toBeVisible()
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press('Tab')
    await expectFocusInside(viewer)
  }
  await page.keyboard.press('End')
  await expectPhoto(page, 'three.svg')
  await page.keyboard.press('ArrowRight')
  await expectPhoto(page, 'three.svg')
  await page.keyboard.press('Home')
  await expectPhoto(page, 'one.svg')
  await page.keyboard.press('ArrowLeft')
  await expectPhoto(page, 'one.svg')
  await page.keyboard.press('ArrowRight')
  await expectPhoto(page, 'two.svg')
  await page.keyboard.press('ArrowRight')
  await expectPhoto(page, 'three.svg')
  await page.keyboard.press('Escape')
  await expect(viewer).toHaveCount(0)
  await expect(profile).toBeVisible()
  await expect(tile).toBeFocused()
  await expect(profile.getByRole('button', { name: 'Remove Gallery haircut', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const scrollAfter = await profile.evaluate(el => [...el.querySelectorAll<HTMLElement>('*')].filter(node => node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY === 'auto').map(node => node.scrollTop))
  expect(scrollAfter).toEqual(scrollBefore)
  expect(new URL(page.url()).pathname).toBe('/saved')
  await page.keyboard.press('Escape')
  await expect(profile).toHaveCount(0)
})

galleryTest('single portfolio image hides navigation and failed images remain navigable', async ({ page, fixture }) => {
  fixture.portfolio = [`${PHOTO}tall.svg`]
  await openProfile(page)
  await tilesFor(page).first().click()
  await expect(viewerFor(page)).toBeVisible()
  await expectPhoto(page, 'tall.svg')
  await expect(viewerImage(page)).toHaveCSS('object-fit', 'contain')
  await expect.poll(() => viewerImage(page).evaluate(image => ({ width: (image as HTMLImageElement).naturalWidth, height: (image as HTMLImageElement).naturalHeight }))).toEqual({ width: 600, height: 900 })
  const portraitBounds = (await stageFor(page).boundingBox())!
  expect(portraitBounds.x).toBeGreaterThanOrEqual(0)
  expect(portraitBounds.y).toBeGreaterThanOrEqual(0)
  expect(portraitBounds.x + portraitBounds.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(portraitBounds.y + portraitBounds.height).toBeLessThanOrEqual(page.viewportSize()!.height)
  await expect(viewerFor(page).getByRole('button', { name: /previous|next|anterioar|următoar/i })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  fixture.portfolio = [`${PHOTO}broken.svg`, `${PHOTO}two.svg`]
  await page.reload()
  await page.getByRole('button', { name: PERSON, exact: true }).click()
  await tilesFor(page).first().click()
  await expect(viewerFor(page)).toBeVisible()
  await expect(stageFor(page).getByRole('img')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expectPhoto(page, 'two.svg')
  await page.keyboard.press('Escape')
  await expect(tilesFor(page).first()).toBeFocused()
})

for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  galleryTest(`Romanian gallery stays usable at ${viewport.width}×${viewport.height} with pointer navigation and downward dismissal`, async ({ page, fixture }) => {
    void fixture
    await page.setViewportSize(viewport)
    await openProfile(page, '/ro/saved')
    const tile = tilesFor(page).first()
    await tile.click()
    const viewer = viewerFor(page)
    await expect(viewer).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const close = viewer.getByRole('button', { name: /^Închide/ })
    await expect(close).toBeVisible()
    const closeBox = await close.boundingBox()
    expect(closeBox!.width).toBeGreaterThanOrEqual(44)
    expect(closeBox!.height).toBeGreaterThanOrEqual(44)
    expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(viewport.height)
    const box = (await stageFor(page).boundingBox())!
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    await expectPhoto(page, 'two.svg')
    const nextBox = (await stageFor(page).boundingBox())!
    await page.mouse.move(nextBox.x + nextBox.width / 2, nextBox.y + nextBox.height * 0.2)
    await page.mouse.down()
    await page.mouse.move(nextBox.x + nextBox.width / 2, Math.min(viewport.height - 20, nextBox.y + nextBox.height * 0.2 + 150), { steps: 8 })
    await page.mouse.up()
    await expect(viewer).toHaveCount(0)
    await expect(tile).toBeFocused()
    await tile.click()
    await expect(viewer).toBeVisible()
    const reopened = (await stageFor(page).boundingBox())!
    const portraitStage = reopened.height / reopened.width > 2 / 3
    // The fixture photo is 3:2. Its unused object-fit letterbox is backdrop,
    // even though the figure itself spans the whole canvas.
    await page.mouse.click(
      portraitStage ? reopened.x + reopened.width / 2 : reopened.x + 8,
      portraitStage ? reopened.y + 8 : reopened.y + reopened.height / 2,
    )
    await expect(viewer).toHaveCount(0)
    await expect(tile).toBeFocused()
  })
}

galleryTest('reduced motion avoids morph clones and navigation animation', async ({ page, fixture }) => {
  void fixture
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openProfile(page)
  await tilesFor(page).first().click()
  await expect(viewerFor(page)).toBeVisible()
  await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
  await page.keyboard.press('ArrowRight')
  await expectPhoto(page, 'two.svg')
  const running = await viewerFor(page).evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').map(animation => animation.effect?.getTiming().duration))
  expect(running.every(duration => typeof duration === 'number' && duration <= 1)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(viewerFor(page)).toHaveCount(0)
  await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
})

galleryTest('client navigation unmounts nested gallery and profile without leaving a page scroll lock', async ({ page, fixture }) => {
  void fixture
  const profile = await openProfile(page)
  await tilesFor(page).first().click()
  await expect(viewerFor(page)).toBeVisible()
  // A route transition can unmount both layers together (browser navigation,
  // application redirect). Invoke the real Next Link to exercise that cleanup.
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('a[href="/"]')!.click())
  await expect.poll(() => new URL(page.url()).pathname).toBe('/')
  await expect(viewerFor(page)).toHaveCount(0)
  await expect(profile).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => ({ overflow: document.body.style.overflow, radixLock: document.body.getAttribute('data-scroll-locked') }))).toEqual({ overflow: '', radixLock: null })
})

for (const variant of SECTION_META.gallery.variants.filter(entry => entry.id !== 'index')) {
  galleryTest(`Studio ${variant.id} uses the shared viewer and cleans up return motion`, async ({ page, fixture }) => {
    void fixture
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    // Valid catalogue-derived look with only the gallery variant varied.
    const digits = SECTION_TYPES.map(type => type === 'gallery' ? SECTION_META.gallery.variants.indexOf(variant).toString(36) : '0')
    await page.goto(`/try?s=${[...digits, '0', '0'].join('')}`)
    const gallery = page.locator(`.mc-gallery-section[data-gallery="${variant.id}"]`)
    const tile = gallery.locator('[data-gimg="0"]')
    await expect(tile).toBeAttached()
    await tile.scrollIntoViewIfNeeded()
    const focusTarget = variant.id === 'fan' ? gallery.getByRole('listbox') : tile
    await focusTarget.focus()
    if (variant.id === 'fan') {
      await page.keyboard.press('Home')
      await expect(tile).toHaveAttribute('aria-selected', 'true')
    }
    await page.keyboard.press('Enter')
    const viewer = viewerFor(page)
    await expect(viewer).toBeVisible()
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe('hidden')
    await expectFocusInside(viewer)
    await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
    const firstSrc = await viewerImage(page).getAttribute('src')
    await viewerImage(page).click()
    await expect(viewer).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(viewerImage(page)).not.toHaveAttribute('src', firstSrc!)
    await page.keyboard.press('Home')
    await expect(viewerImage(page)).toHaveAttribute('src', firstSrc!)
    await page.keyboard.press('ArrowLeft')
    await expect(viewerImage(page)).toHaveAttribute('src', firstSrc!)
    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
    await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
    await expect(focusTarget).toBeFocused()
    await expect.poll(() => tile.evaluate(el => getComputedStyle(el).visibility)).not.toBe('hidden')
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    if (variant.id === 'fan' || variant.id === 'carousel') {
      await page.keyboard.press('Enter')
      await expect(viewer).toBeVisible()
      await page.keyboard.press('ArrowRight')
      const currentTile = gallery.locator('[data-gimg="1"]')
      await expect(currentTile).toHaveAttribute(variant.id === 'fan' ? 'aria-selected' : 'data-active', variant.id === 'fan' ? 'true' : '1')
      await page.keyboard.press('Escape')
      await expect(viewer).toHaveCount(0)
      await expect(variant.id === 'fan' ? focusTarget : currentTile).toBeFocused()
    }
    // Closing before the initial expansion completes must cancel its clone.
    await page.keyboard.press('Enter')
    await expect(viewer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
    await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
    await expectFocusInside(gallery)
    if (variant.id === 'bento') {
      await page.keyboard.press('Enter')
      await expect(viewer).toBeVisible()
      await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
      await viewer.getByRole('button', { name: /close/i }).click()
      await expect(viewer).toHaveAttribute('data-closing', 'true')
      const alternate = gallery.locator('[data-gimg="1"]')
      await alternate.click()
      await expect(viewer).toHaveAttribute('data-closing', 'false')
      await expect(viewerImage(page)).not.toHaveAttribute('src', firstSrc!)
      await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
      await expect(viewer).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(viewer).toHaveCount(0)
      await expect(alternate).toBeFocused()
    }
  })
}

galleryTest('Studio Mosaic keeps its existing in-place expansion and Escape collapse', async ({ page, fixture }) => {
  void fixture
  const variant = SECTION_META.gallery.variants.find(entry => entry.id === 'index')!
  const digits = SECTION_TYPES.map(type => type === 'gallery' ? SECTION_META.gallery.variants.indexOf(variant).toString(36) : '0')
  await page.goto(`/try?s=${[...digits, '0', '0'].join('')}`)
  const gallery = page.locator('.mc-gallery-section[data-gallery="index"]')
  const tile = gallery.locator('[data-gimg="0"]')
  await expect(tile).toBeAttached()
  await tile.scrollIntoViewIfNeeded()
  await tile.focus()
  await page.keyboard.press('Enter')
  await expect(tile).toHaveAttribute('aria-expanded', 'true')
  await expect(viewerFor(page)).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(tile).toHaveAttribute('aria-expanded', 'false')
})

galleryTest('Studio completes closing when viewport or reduced-motion preference changes mid-return', async ({ page, fixture }) => {
  void fixture
  for (const interruption of ['resize', 'motion'] as const) {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`/try?s=${'0'.repeat(SECTION_TYPES.length + 2)}`)
    const tile = page.locator('.mc-gallery-section [data-gimg="0"]')
    await expect(tile).toBeAttached()
    await tile.scrollIntoViewIfNeeded()
    await tile.focus()
    await page.keyboard.press('Enter')
    const viewer = viewerFor(page)
    await expect(viewer).toBeVisible()
    await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
    await viewer.getByRole('button', { name: /close/i }).click()
    await expect(viewer).toHaveAttribute('data-closing', 'true')
    if (interruption === 'resize') await page.setViewportSize({ width: 1280, height: 760 })
    else await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(viewer).toHaveCount(0)
    await expect(page.locator('[data-image-viewer-morph]')).toHaveCount(0)
    await expect(tile).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  }
})
