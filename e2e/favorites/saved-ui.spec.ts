import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import type { AuthUser } from '../../src/lib/auth/types'
import type {
  AllFavorites,
  BookingCalendar,
  BookingDaySlots,
  GetBookingCalendarBody,
  GetBookingSlotsBody,
  TeamMemberBookingContext,
  TeamMemberProfile,
} from '../../src/lib/api/marketplace/types'

const BUSINESS = 'Atelier Saved Studio'
const LOCATION = 'Saved Old Town'
const SECOND_LOCATION = 'Saved North Studio'
const PERSON = 'Mara Saved'
const LOGO = '/__saved-fixtures__/business-logo.svg'
const industry = { id: 1, name: 'Beauty', slug: 'beauty' }

function favoriteFixture(): AllFavorites {
  // Customers save locations and people only. Newest saved first:
  // LOCATION (Oct 10), PERSON (Sep 10), SECOND_LOCATION (Aug 10).
  return {
    locations: [{
      id: 1002,
      location: {
        id: 201, uuid: 'saved-location-fixture', name: LOCATION,
        address: 'A deliberately long street address, building seventy-five, apartment twenty, Bucharest',
        city: 'Bucharest', latitude: 44.43, longitude: 26.10,
        featuredImage: '/__saved-fixtures__/location.svg',
        averageRating: 4.6, totalReviews: 28, isPublic: true,
        business: { id: 101, name: BUSINESS, logo: LOGO, industry },
      },
      marketplace: { listingId: 11, isListed: true },
      createdAt: '2026-10-10T10:00:00Z',
    }, {
      id: 1004,
      location: {
        id: 202, uuid: 'saved-second-location-fixture', name: SECOND_LOCATION,
        address: 'Strada Nordului 3, Bucharest', city: 'Bucharest', latitude: null, longitude: null,
        featuredImage: null, averageRating: 4.4, totalReviews: 37, isPublic: true,
        business: { id: 102, name: 'North Studio Group', logo: null, industry },
      },
      marketplace: { listingId: 12, isListed: true },
      createdAt: '2026-08-10T10:00:00Z',
    }],
    professionals: [{
      id: 1003,
      professional: {
        id: 301, uuid: 'saved-professional-fixture', firstName: 'Mara', lastName: 'Saved',
        displayName: PERSON, professionalTitle: 'Stylist',
        profileImage: '/__saved-fixtures__/person.svg', averageRating: 4.8, totalReviews: 19,
      },
      createdAt: '2026-09-10T10:00:00Z',
    }],
  }
}

const user: AuthUser = {
  uuid: 'saved-ui-browser-fixture', email: 'saved-ui@example.invalid',
  firstName: 'Saved', lastName: 'Fixture', profileImage: null,
  hasPassword: true, emailVerified: true, googleSub: null,
}
const profile: TeamMemberProfile = {
  id: 301, uuid: 'saved-professional-fixture', firstName: 'Mara', lastName: 'Saved',
  profileImage: '/__saved-fixtures__/person.svg', yearsOfExperience: 5,
  visitsCompleted: 10, memberSince: '2024-01-01T10:00:00Z',
  about: {
    displayName: PERSON, professionalTitle: 'Stylist', aboutMe: null,
    interests: [], languages: [], socialLinks: {},
  },
  services: [], portfolio: [], reviews: [],
  reviewStats: { totalCount: 19, averageRating: 4.8 },
}
const bookingContext: TeamMemberBookingContext = {
  teamMember: { id: 301, firstName: 'Mara', lastName: 'Saved', profileImage: null },
  businesses: [],
}

type FixtureOptions = { signedOut?: boolean; failLoad?: boolean }
type Mutation = { method: string; kind: string; id: number }
type FixtureFailure = { status: number; code?: string } | null

async function installSavedFixture(context: BrowserContext, baseURL: string, options: FixtureOptions = {}) {
  const original = favoriteFixture()
  const state = {
    favorites: structuredClone(original),
    failLoad: options.failLoad ?? false,
    // Fail only this many favourites reads, then answer normally.
    failLoadCount: 0,
    failAuth: false,
    apiOffline: false,
    failNextDelete: false,
    profile: structuredClone(profile),
    bookingContext: structuredClone(bookingContext),
    profileFailure: null as FixtureFailure,
    contextFailure: null as FixtureFailure,
    professionalIdsOverride: null as AllFavorites['professionals'] | null,
    requests: [] as string[],
    availability: bookingAvailabilityFixture(),
    slotsByDate: {} as Record<string, BookingDaySlots>,
    slotsDelayByDate: {} as Record<string, number>,
    availabilityRequests: [] as Array<GetBookingCalendarBody | GetBookingSlotsBody>,
    mutations: [] as Mutation[],
    blockedMutations: [] as string[],
  }
  const token = [
    'eyJhbGciOiJub25lIn0',
    Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'),
    'saved-ui-fixture',
  ].join('.')

  await context.addCookies([
    { name: 'zw-consent', value: 'denied', url: baseURL },
    { name: 'customerCsrfToken', value: 'saved-ui-fixture', url: baseURL },
  ])
  // Count attempted browser permission requests without opening a real prompt.
  // A granted permission lookup is allowed; getCurrentPosition is not needed
  // when permission is "prompt" or when the visitor is signed out.
  await context.addInitScript(() => {
    const fixtureWindow = window as unknown as Window & { __savedGeoRequests: number }
    fixtureWindow.__savedGeoRequests = 0
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => { fixtureWindow.__savedGeoRequests += 1 },
        watchPosition: () => { fixtureWindow.__savedGeoRequests += 1; return 0 },
        clearWatch: () => {},
      },
    })
  })
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (body: unknown, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(body),
    })

    // Next dev POSTs stack data to resolve source frames. This is a diagnostic
    // read, not an application mutation; keep its exact same-origin endpoint
    // available so the fixture does not manufacture additional overlay errors.
    if (url.origin === new URL(baseURL).origin && path === '/__nextjs_original-stack-frames' && method === 'POST') {
      return route.continue()
    }
    if (path.startsWith('/__saved-fixtures__/') && method === 'GET') {
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#b94b2d"/></svg>',
      })
    }
    if (path.includes('/marketplace/')) {
      state.requests.push(`${method} ${path}`)
      if (state.apiOffline) return route.abort('internetdisconnected')
      if (path.endsWith('/auth/refresh') && method === 'POST') {
        if (state.failAuth) return json({ message: 'Fixture session verification unavailable' }, 503)
        return options.signedOut
          ? json({ message: 'No fixture session' }, 401)
          : json({ accessToken: token, csrfToken: 'saved-ui-fixture' })
      }
      if (path.endsWith('/auth/me') && method === 'GET') return json({ user })
      if (path.endsWith('/customer/favorites') && method === 'GET') {
        if (state.failLoad || state.failLoadCount > 0) {
          state.failLoadCount = Math.max(0, state.failLoadCount - 1)
          return json({ message: 'Fixture favorites unavailable' }, 503)
        }
        return json(state.favorites)
      }
      if (path.endsWith('/customer/favorite/locations') && method === 'GET') return json(state.favorites.locations)
      if (path.endsWith('/customer/favorite/professionals') && method === 'GET') return json(state.professionalIdsOverride ?? state.favorites.professionals)

      const mutation = path.match(/\/customer\/favorite\/(location|professional)\/(\d+)$/)
      if (mutation && (method === 'POST' || method === 'DELETE')) {
        const kind = mutation[1]
        const id = Number(mutation[2])
        state.mutations.push({ method, kind, id })
        if (method === 'DELETE' && state.failNextDelete) {
          state.failNextDelete = false
          return json({ message: 'Fixture removal failed' }, 503)
        }
        if (kind === 'location') {
          state.favorites.locations = state.favorites.locations.filter((item) => item.location.id !== id)
          if (method === 'POST') state.favorites.locations.push(...original.locations.filter((item) => item.location.id === id))
        } else {
          state.favorites.professionals = state.favorites.professionals.filter((item) => item.professional.id !== id)
          if (method === 'POST') state.favorites.professionals.push(...original.professionals.filter((item) => item.professional.id === id))
        }
        return json({ message: 'Fixture favorite changed' })
      }
      if (path.endsWith('/team-member/301/booking-context') && method === 'GET') {
        return state.contextFailure
          ? json({ message: 'Fixture booking context unavailable', code: state.contextFailure.code }, state.contextFailure.status)
          : json({ data: state.bookingContext })
      }
      if (path.endsWith('/team-member/301') && method === 'GET') {
        return state.profileFailure
          ? json({ message: 'Fixture profile unavailable', code: state.profileFailure.code }, state.profileFailure.status)
          : json(state.profile)
      }
      if (path.endsWith('/public/booking/calendar') && method === 'POST') {
        state.availabilityRequests.push(request.postDataJSON() as GetBookingCalendarBody)
        return json({ data: state.availability.calendar })
      }
      if (path.endsWith('/public/booking/slots') && method === 'POST') {
        const body = request.postDataJSON() as GetBookingSlotsBody
        state.availabilityRequests.push(body)
        const response = structuredClone(state.slotsByDate[body.date] ?? state.availability.slots)
        const delay = state.slotsDelayByDate[body.date] ?? 0
        if (delay) await new Promise(resolve => setTimeout(resolve, delay))
        return json({ data: response })
      }
      if (path.endsWith('/notifications/unread-count') && method === 'GET') return json({ data: { count: 0 } })
      if (path.endsWith('/notifications/inbox') && method === 'GET') {
        return json({ data: { notifications: [], unreadCount: 0, hasMore: false, nextCursor: null } })
      }
      // An unexpected API read fails locally. An unexpected mutation is also
      // recorded so a regression cannot silently broaden the tested actions.
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) state.blockedMutations.push(`${method} ${path}`)
      return json({ message: `Unmocked fixture endpoint: ${path}` }, 404)
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      state.blockedMutations.push(`${method} ${path}`)
      return route.fulfill({ status: 403, body: 'Saved UI fixture blocked unmatched mutation' })
    }
    if (url.origin !== new URL(baseURL).origin) return route.abort('blockedbyclient')
    return route.continue()
  })
  return state
}

const testSaved = test.extend<{ saved: Awaited<ReturnType<typeof installSavedFixture>> }>({
  saved: async ({ context, page, baseURL }, provideFixture) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const saved = await installSavedFixture(context, baseURL!)
    await provideFixture(saved)
    expect(saved.blockedMutations).toEqual([])
    expect(pageErrors, 'Saved must render without runtime or hydration errors').toEqual([])
  },
})

function removeButton(page: Page, name: string) {
  return page.getByRole('button', { name: `Remove ${name} from saved`, exact: true })
}

async function openSaved(page: Page) {
  await page.goto('/saved')
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible()
  await expect(removeButton(page, LOCATION)).toBeVisible()
}

const UNDO_WINDOW_MS = 6_000

async function openProfessional(page: Page) {
  await page.getByRole('button', { name: PERSON, exact: true }).click()
  const dialog = page.getByRole('dialog', { name: PERSON, exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

async function setBrowserOnline(page: Page, online: boolean) {
  // Keep the development shell reachable while modelling the browser's
  // connectivity signal. The fixture separately fails all API transport.
  await page.evaluate((value) => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value })
    window.dispatchEvent(new Event(value ? 'online' : 'offline'))
  }, online)
}

function venueFixture(count = 2): TeamMemberBookingContext {
  return {
    teamMember: structuredClone(bookingContext.teamMember),
    businesses: [{
      id: 101, name: BUSINESS, listingId: 11, businessCurrency: 'RON', logo: LOGO,
      locations: Array.from({ length: count }, (_, index) => ({
        id: 201 + index, name: index === 0 ? 'Old Town venue' : 'North venue',
        address: null, latitude: 44.43, longitude: 26.10, timezone: 'Europe/Bucharest',
        featuredImage: null, averageRating: null, totalReviews: 0, allowOnlineBooking: true,
        services: [{
          // Same service ID at both venues catches accidental selection carryover.
          id: 401, uuid: 'saved-service-fixture', name: 'Fixture haircut', description: null,
          priceAmountMinor: index === 0 ? 12000 : 18000,
          duration: index === 0 ? 30 : 45, categoryId: null, category: null, displayOrder: 0,
        }],
      })),
    }],
  }
}

function bookingAvailabilityFixture(): { calendar: BookingCalendar; slots: BookingDaySlots } {
  const date = '2030-10-22'
  const items: BookingCalendar['items'] = [{
    type: 'service', serviceId: 401, serviceName: 'Fixture haircut',
    durationMinutes: 30, priceAmountMinor: 12000, staffCount: 1,
  }]
  return {
    calendar: {
      businessId: 101, businessName: BUSINESS, locationId: 201, locationName: 'Old Town venue',
      timezone: 'Europe/Bucharest', items, totalDuration: 30, totalPrice: 12000,
      bookingSettings: {
        minAdvanceBookingMinutes: 0, maxAdvanceBookingMinutes: null, slotIntervalMinutes: 15,
        bufferTimeMinutes: 0, cancellationWindowHours: 24, rescheduleWindowHours: 24,
      },
      calendar: [{ date, dayOfWeek: 'Tuesday', status: 'available', slotsCount: 1 }],
      nextAvailableDate: date,
    },
    slots: {
      businessId: 101, locationId: 201, date, dayOfWeek: 'Tuesday', items,
      totalDuration: 30, totalPrice: 12000,
      staffDirectory: { 301: { name: PERSON, image: null } },
      staffPricing: { 401: { 301: { price: 12000, duration: 30 } } },
      slots: [{
        startTime: '10:00', endTime: '10:30', totalPriceAmountMinor: 12000,
        items: [{
          type: 'service', serviceId: 401, serviceName: 'Fixture haircut',
          startTime: '10:00', endTime: '10:30', durationMinutes: 30, priceAmountMinor: 12000,
          availableStaffIds: [301], defaultStaffId: 301,
        }],
      }],
    },
  }
}

const collectionRequests = (saved: Awaited<ReturnType<typeof installSavedFixture>>) =>
  saved.requests.filter((request) => request.endsWith('/customer/favorites')).length

testSaved('shows real identity and review counts for every saved entity', async ({ page, saved }) => {
  await openSaved(page)
  const main = page.getByRole('main')
  await expect(main).toHaveCount(1)
  await expect(main.getByRole('article')).toHaveCount(3)
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([LOCATION, PERSON, SECOND_LOCATION])
  await expect(main.locator('header')).toContainText('3 saved')
  const location = main.getByRole('article').filter({ has: removeButton(page, LOCATION) })
  await expect(location.getByRole('img', { name: '4.6 out of 5 stars, 28 reviews', exact: true })).toBeVisible()
  await expect(location.getByRole('link', { name: LOCATION, exact: true })).toHaveAttribute('href', '/business/201')
  const second = main.getByRole('article').filter({ has: removeButton(page, SECOND_LOCATION) })
  await expect(second).toContainText(/4[.,]4/)
  await expect(second.getByRole('img', { name: '4.4 out of 5 stars, 37 reviews', exact: true })).toBeVisible()
  await expect(main.getByRole('article').filter({ has: removeButton(page, PERSON) }).getByRole('img', { name: '4.8 out of 5 stars, 19 reviews', exact: true })).toBeVisible()
  // No saved dates or distance.
  await expect(main.locator('time')).toHaveCount(0)
  await expect(main.getByText(/\bkm\b/)).toHaveCount(0)
  await expect(main.getByRole('button', { name: 'Refresh', exact: true })).toHaveCount(0)
  expect(saved.mutations).toEqual([])
})

testSaved('real save dates order mixed entities newest first and API slugs drive navigation', async ({ page, saved }) => {
  saved.favorites.locations[0].location.slug = 'saved-old-town-official'
  saved.favorites.professionals[0].createdAt = '2026-10-20T10:00:00Z'
  await openSaved(page)
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([PERSON, LOCATION, SECOND_LOCATION])
  await expect(main.getByRole('link', { name: LOCATION, exact: true })).toHaveAttribute('href', '/business/saved-old-town-official')
  await expect(main.getByRole('link', { name: SECOND_LOCATION, exact: true })).toHaveAttribute('href', '/business/202')
})

testSaved('Enter removes a saved location without following its primary link or deleting yet', async ({ page, saved }) => {
  await openSaved(page)
  await removeButton(page, LOCATION).focus()
  await page.keyboard.press('Enter')
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/saved$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // The delete waits for the Undo window.
  expect(saved.mutations).toEqual([])
})

testSaved('professional modal removal updates the Saved list and counts', async ({ page, saved }) => {
  await openSaved(page)
  await page.getByRole('button', { name: /^People\s*1$/ }).click()
  const opener = page.getByRole('button', { name: PERSON, exact: true })
  await opener.focus()
  await page.keyboard.press('Space')
  const dialog = page.getByRole('dialog', { name: PERSON, exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Remove from saved', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(removeButton(page, PERSON)).toHaveCount(0)
  // The selected type stays visible after it empties, and names what is missing.
  await expect(page.getByRole('button', { name: /^People\s*0$/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('No people saved yet.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  expect(saved.mutations).toEqual([{ method: 'DELETE', kind: 'professional', id: 301 }])
})

testSaved('a transient first-load failure recovers on its own', async ({ page, saved }) => {
  saved.failLoadCount = 1
  await openSaved(page)
  await expect(page.getByText("Couldn't load your saved items.", { exact: true })).toHaveCount(0)
  expect(collectionRequests(saved)).toBe(2)
})

testSaved('a failed initial request retries twice, then offers Retry without claiming the list is empty', async ({ page, saved }) => {
  saved.failLoad = true
  await page.goto('/saved')
  await expect(page.getByText("Couldn't load your saved items.", { exact: true })).toBeVisible()
  expect(collectionRequests(saved)).toBe(3)
  await expect(page.getByRole('heading', { name: 'Nothing saved yet', exact: true })).toHaveCount(0)
  saved.failLoad = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(removeButton(page, LOCATION)).toBeVisible()
  await expect(page.getByRole('button', { name: /^All\s*3$/ })).toBeVisible()
  await expect(page.getByText("Couldn't load your saved items.", { exact: true })).toHaveCount(0)
})

testSaved('the delete is sent only when the Undo window closes', async ({ page, saved }) => {
  await page.clock.install()
  await openSaved(page)
  await removeButton(page, LOCATION).click()
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  await page.clock.runFor(UNDO_WINDOW_MS - 500)
  expect(saved.mutations).toEqual([])
  await page.clock.runFor(1_000)
  await expect.poll(() => saved.mutations).toEqual([{ method: 'DELETE', kind: 'location', id: 201 }])
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0)
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
})

testSaved('a failed delete restores the saved item, and Retry sends it again', async ({ page, saved }) => {
  await page.clock.install()
  saved.failNextDelete = true
  await openSaved(page)
  await removeButton(page, LOCATION).click()
  await page.clock.runFor(UNDO_WINDOW_MS + 500)
  await expect.poll(() => saved.mutations.length).toBe(1)
  await expect(removeButton(page, LOCATION)).toBeVisible()
  await expect(page.getByRole('button', { name: /^All\s*3$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Locations\s*2$/ })).toBeVisible()
  // Next's route announcer is also role="alert", so find the toast by its text.
  const errorToast = page.getByRole('alert').filter({
    hasText: "We’re having a technical problem. Try again in a moment.",
  })
  await expect(errorToast).toBeVisible()
  expect(saved.favorites.locations).toHaveLength(2)
  await errorToast.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  await expect.poll(() => saved.mutations).toEqual([
    { method: 'DELETE', kind: 'location', id: 201 },
    { method: 'DELETE', kind: 'location', id: 201 },
  ])
})

testSaved('Undo is local: it restores the row without any request', async ({ page, saved }) => {
  await page.clock.install()
  await openSaved(page)
  await removeButton(page, LOCATION).click()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(removeButton(page, LOCATION)).toBeVisible()
  await expect(page.getByRole('button', { name: /^All\s*3$/ })).toBeVisible()
  await page.clock.runFor(UNDO_WINDOW_MS * 2)
  expect(saved.mutations).toEqual([])
})

testSaved('removing the last item shows the empty state, and Undo brings it back', async ({ page, saved }) => {
  saved.favorites.professionals = []
  saved.favorites.locations = saved.favorites.locations.slice(0, 1)
  await openSaved(page)
  await removeButton(page, LOCATION).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Nothing saved yet', exact: true, level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toHaveCount(0)
  // Keyboard focus moves on to the way forward instead of falling to the page.
  const explore = page.getByRole('link', { name: 'Explore places', exact: true })
  await expect(explore).toBeFocused()
  await expect(explore).toHaveAttribute('href', /\/search$/)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(removeButton(page, LOCATION)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nothing saved yet', exact: true })).toHaveCount(0)
  expect(saved.mutations).toEqual([])
})

testSaved('removing a second item sends the first at once and keeps one Undo', async ({ page, saved }) => {
  await openSaved(page)
  await removeButton(page, LOCATION).click()
  await removeButton(page, SECOND_LOCATION).click()
  await expect.poll(() => saved.mutations).toEqual([{ method: 'DELETE', kind: 'location', id: 201 }])
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(removeButton(page, SECOND_LOCATION)).toBeVisible()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  expect(saved.mutations).toEqual([{ method: 'DELETE', kind: 'location', id: 201 }])
})

testSaved('leaving Saved sends the pending removal', async ({ page, saved }) => {
  await openSaved(page)
  await removeButton(page, LOCATION).click()
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Zavoia home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => saved.mutations).toEqual([{ method: 'DELETE', kind: 'location', id: 201 }])
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(0)
  await page.goBack()
  await expect(removeButton(page, PERSON)).toBeVisible()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
})

testSaved('filters offer only the types you have, and the count hides at zero', async ({ page, saved }) => {
  saved.favorites.professionals = []
  await openSaved(page)
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Locations\s*2$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^People/ })).toHaveCount(0)
  saved.favorites.locations = []
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Nothing saved yet', exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Filter saved items' })).toHaveCount(0)
  await expect(page.getByRole('main').locator('header')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing saved yet')
})

testSaved('returning offline retains the cached collection and reconnect refreshes full metadata', async ({ page, saved }) => {
  await openSaved(page)
  await page.getByRole('link', { name: 'Zavoia home', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  saved.apiOffline = true
  await setBrowserOnline(page, false)
  const beforeReturn = collectionRequests(saved)
  await page.goBack()
  await expect(removeButton(page, LOCATION)).toBeVisible()
  await expect(page.getByText('You’re offline. Your saved items will refresh when you reconnect.', { exact: true })).toBeVisible()
  expect(collectionRequests(saved)).toBe(beforeReturn)

  const updatedName = 'Renamed after reconnect'
  saved.favorites.locations[0].location.name = updatedName
  saved.apiOffline = false
  await setBrowserOnline(page, true)
  await expect(removeButton(page, updatedName)).toBeVisible()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  await expect(page.getByText('You’re offline. Your saved items will refresh when you reconnect.', { exact: true })).toHaveCount(0)
})

testSaved('a focus refresh replaces metadata and counts without dropping the current filter', async ({ page, saved }) => {
  const startTime = Date.now()
  await page.clock.setFixedTime(new Date(startTime))
  await openSaved(page)
  await page.getByRole('button', { name: /^Locations\s*2$/ }).click()
  saved.favorites.locations[0].location.name = 'Updated saved location'
  saved.favorites.locations[0].location.totalReviews = 42
  saved.favorites.professionals = []
  await page.clock.setFixedTime(new Date(startTime + 65_000))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  const location = page.getByRole('article').filter({ has: removeButton(page, 'Updated saved location') })
  await expect(location.getByRole('img', { name: '4.6 out of 5 stars, 42 reviews', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Locations\s*2$/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^People/ })).toHaveCount(0)
})

testSaved('window focus revalidates the full saved records', async ({ page, saved }) => {
  const startTime = Date.now()
  // Install before app initialization so captured Date.now references also
  // observe the controlled clock used to cross the focus coalescing window.
  await page.clock.setFixedTime(new Date(startTime))
  await openSaved(page)
  const updatedName = 'Updated while another tab was active'
  saved.favorites.locations[0].location.name = updatedName
  // Advance the cache clock without running unrelated session/toast timers.
  await page.clock.setFixedTime(new Date(startTime + 65_000))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(removeButton(page, updatedName)).toBeVisible()
  await expect(removeButton(page, LOCATION)).toHaveCount(0)
  expect(collectionRequests(saved)).toBeGreaterThan(1)
})

testSaved('a failed refresh retains rows and offers recovery', async ({ page, saved }) => {
  const startTime = Date.now()
  await page.clock.setFixedTime(new Date(startTime))
  await openSaved(page)
  saved.failLoad = true
  await page.clock.setFixedTime(new Date(startTime + 65_000))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByText("Couldn't refresh your saved items. Your last saved list is still shown.", { exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Nothing saved yet', exact: true })).toHaveCount(0)
  saved.failLoad = false
  saved.favorites.locations[0].location.name = 'Recovered location'
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(removeButton(page, 'Recovered location')).toBeVisible()
  await expect(page.getByText("Couldn't refresh your saved items. Your last saved list is still shown.", { exact: true })).toHaveCount(0)
})

testSaved('session verification outages offer retry without a sign-in gate', async ({ page, saved }) => {
  saved.failAuth = true
  await page.goto('/saved')
  const main = page.getByRole('main')
  await expect(main.getByText('We couldn’t verify your session. Try again.', { exact: true })).toBeVisible()
  await expect(main.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0)
  await expect(main.getByText('Sign in to see what you’ve saved.', { exact: true })).toHaveCount(0)
  expect(collectionRequests(saved)).toBe(0)
  saved.failAuth = false
  await main.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(removeButton(page, LOCATION)).toBeVisible()
})

testSaved('a per-kind ID refresh reconciles the visible collection and modal heart', async ({ page, saved }) => {
  await openSaved(page)
  saved.professionalIdsOverride = []
  await page.clock.setFixedTime(new Date(Date.now() + 65_000))
  const dialog = await openProfessional(page)
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(removeButton(page, PERSON)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^People/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^All\s*2$/ })).toBeVisible()
  expect(saved.requests.some((request) => request.endsWith('/customer/favorite/professionals'))).toBe(true)
  expect(saved.mutations).toEqual([])
})

testSaved('cards name the category, brand, address and role, with no map shortcut', async ({ page, saved }) => {
  await openSaved(page)
  const location = page.getByRole('article').filter({ has: removeButton(page, LOCATION) })
  // Location names are neighbourhoods; the brand says whose they are.
  await expect(location.getByText(BUSINESS, { exact: true })).toBeVisible()
  await expect(location.getByText('Beauty', { exact: true })).toBeVisible()
  await expect(location).toContainText('A deliberately long street address')
  await expect(location.getByRole('img', { name: /4\.6/ })).toBeVisible()
  // The card link reads the name, then the brand and details.
  await expect(location.getByRole('link', { name: LOCATION, exact: true })).toHaveAccessibleDescription(/^Atelier Saved Studio Beauty A deliberately long street address/)
  await expect(page.getByRole('link', { name: /on map/ })).toHaveCount(0)
  await expect(page.getByRole('article').filter({ has: removeButton(page, PERSON) }).getByText('Stylist', { exact: true })).toBeVisible()
  expect(saved.mutations).toEqual([])
})

testSaved('multiple venues require a choice and switching resets shared service IDs', async ({ page, saved }) => {
  saved.bookingContext = venueFixture()
  await openSaved(page)
  const dialog = await openProfessional(page)
  await expect(dialog.getByText('Choose a location to see its services.', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toHaveCount(0)
  const firstVenue = dialog.getByRole('button', { name: /Atelier Saved Studio.*Old Town venue/ })
  const secondVenue = dialog.getByRole('button', { name: /Atelier Saved Studio.*North venue/ })
  await expect(firstVenue).toHaveAttribute('aria-pressed', 'false')
  await expect(secondVenue).toHaveAttribute('aria-pressed', 'false')
  await firstVenue.click()
  await expect(firstVenue).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Remove Fixture haircut', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toBeEnabled()
  await secondVenue.click()
  await expect(secondVenue).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toBeDisabled()
  await firstVenue.click()
  await expect(dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toHaveAttribute('aria-pressed', 'false')
  expect(saved.mutations).toEqual([])
})

testSaved('service rows toggle once from the name, empty space, icon and keyboard', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  await openSaved(page)
  const dialog = await openProfessional(page)
  const row = dialog.getByRole('button', { name: /^(?:Add|Remove) Fixture haircut$/ })
  const book = dialog.getByRole('button', { name: 'Book with Mara', exact: true })
  await expect(row).toHaveCount(1)
  await expect(row).toHaveAttribute('aria-pressed', 'false')
  // The complete row is one native control, including its decorative icon.
  expect(await row.evaluate((element) => element.tagName)).toBe('BUTTON')
  await expect(row.locator('button, a, input, [role="button"]')).toHaveCount(0)
  await expect(book).toBeDisabled()

  await row.getByText('Fixture haircut', { exact: true }).click()
  await expect(row).toHaveAttribute('aria-pressed', 'true')
  await expect(book).toBeEnabled()

  const bounds = await row.boundingBox()
  expect(bounds).not.toBeNull()
  await row.click({ position: { x: bounds!.width / 2, y: bounds!.height - 3 } })
  await expect(row).toHaveAttribute('aria-pressed', 'false')

  await row.locator('svg').click()
  await expect(row).toHaveAttribute('aria-pressed', 'true')
  await row.focus()
  await page.keyboard.press('Enter')
  await expect(row).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Space')
  await expect(row).toHaveAttribute('aria-pressed', 'true')

  await expect(page).toHaveURL(/\/saved$/)
  expect(saved.mutations).toEqual([])
  expect(saved.availabilityRequests).toEqual([])
})

testSaved('profile keyboard trap excludes a temporarily unavailable favorite control', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  saved.profile.reviewStats = { totalCount: 0, averageRating: null }
  await openSaved(page)
  const dialog = await openProfessional(page)
  const firstControl = dialog.getByRole('button', { name: 'Share', exact: true })
  const addService = dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true })
  await expect(addService).toBeVisible()
  // Saved seeds IDs before opening the modal. This shared modal also opens
  // elsewhere before IDs resolve; model that real HeartButton tab state here.
  await dialog.getByRole('button', { name: 'Remove from saved', exact: true }).evaluate((button) => {
    button.setAttribute('tabindex', '-1')
    button.setAttribute('aria-disabled', 'true')
  })
  await firstControl.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(addService).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(firstControl).toBeFocused()
  expect(saved.mutations).toEqual([])
})

testSaved('one venue selects automatically and an empty menu explains the unavailable booking', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  saved.bookingContext.businesses[0].locations[0].services = []
  await openSaved(page)
  const dialog = await openProfessional(page)
  await expect(dialog.getByRole('link', { name: /Atelier Saved Studio.*Old Town venue/ })).toHaveAttribute('href', '/business/201')
  await expect(dialog.getByText('Mara doesn’t offer any bookable services at this location yet.', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Try again', exact: true })).toHaveCount(0)
})

for (const outcome of ['empty', 'permanent', 'transient'] as const) {
  testSaved(`${outcome} booking context keeps the profile usable with the appropriate recovery`, async ({ page, saved }) => {
    if (outcome === 'permanent') saved.contextFailure = { status: 400, code: 'CUSTOMER_BOOKING.E17' }
    if (outcome === 'transient') saved.contextFailure = { status: 503 }
    await openSaved(page)
    const dialog = await openProfessional(page)
    await expect(dialog.getByRole('button', { name: 'Remove from saved', exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toHaveCount(0)
    const retry = dialog.getByRole('button', { name: 'Try again', exact: true })
    if (outcome === 'transient') {
      await expect(retry).toBeVisible()
      await expect(dialog.getByText("Online booking isn't available for this professional yet.", { exact: true })).toHaveCount(0)
      saved.contextFailure = null
      saved.bookingContext = venueFixture(1)
      await retry.click()
      await expect(dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true })).toBeVisible()
      await expect(retry).toHaveCount(0)
    } else {
      await expect(dialog.getByText("Online booking isn't available for this professional yet.", { exact: true })).toBeVisible()
      await expect(retry).toHaveCount(0)
    }
  })
}

for (const hidden of [false, true]) {
  testSaved(`${hidden ? 'hidden' : 'default visible'} venue pricing persists from profile through booking review`, async ({ page, saved }) => {
    saved.bookingContext = venueFixture(1)
    const services = saved.bookingContext.businesses[0].locations[0].services
    services.push({
      ...services[0], id: 402, uuid: 'saved-second-service-fixture',
      name: 'Fixture scalp care', priceAmountMinor: 8000,
    })
    const { calendar, slots } = saved.availability
    calendar.items.push({
      ...calendar.items[0], serviceId: 402, serviceName: 'Fixture scalp care', priceAmountMinor: 8000,
    })
    calendar.totalDuration = slots.totalDuration = 60
    calendar.totalPrice = slots.totalPrice = 20000
    slots.items = structuredClone(calendar.items)
    slots.staffPricing![402] = { 301: { price: 8000, duration: 30 } }
    const firstItem = slots.slots[0].items[0]
    const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    slots.slots = Array.from({ length: 25 }, (_, index) => {
      const start = 9 * 60 + index * 15
      return {
        startTime: clock(start), endTime: clock(start + 60), totalPriceAmountMinor: 20000,
        items: [{
          ...firstItem, startTime: clock(start), endTime: clock(start + 30),
        }, {
          ...firstItem, serviceId: 402, serviceName: 'Fixture scalp care',
          priceAmountMinor: 8000, startTime: clock(start + 30), endTime: clock(start + 60),
        }],
      }
    })
    calendar.calendar[0].slotsCount = slots.slots.length
    if (hidden) saved.bookingContext.businesses[0].locations[0].showPricing = false
    await page.setViewportSize({ width: 900, height: 640 })
    await openSaved(page)
    const dialog = await openProfessional(page)
    await dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click()
    await dialog.getByRole('button', { name: 'Add Fixture scalp care', exact: true }).click()
    if (hidden) {
      await expect(dialog.getByText(/Request quote/)).toHaveCount(3)
      await expect(dialog.getByText(/RON/)).toHaveCount(0)
    } else {
      await expect(dialog).toContainText('RON')
      await expect(dialog.getByText(/Request quote/)).toHaveCount(0)
    }
    await dialog.getByRole('button', { name: 'Book with Mara', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true })
    await expect(drawer).toBeVisible()
    await expect(drawer.locator('button[data-date="2030-10-22"]')).toBeVisible()
    const assertPricing = async () => {
      if (hidden) {
        await expect(drawer).toContainText('Request quote')
        await expect(drawer).not.toContainText('RON')
      } else {
        await expect(drawer).toContainText('RON')
        await expect(drawer).not.toContainText('Request quote')
      }
    }
    await assertPricing()
    await drawer.locator('button[data-date="2030-10-22"]').click()
    await drawer.getByRole('button', { name: /^10:00/ }).click()
    // A profile booking already identifies the professional. The picks remain
    // selected internally without repeating a card for each booked service.
    await expect(drawer.getByRole('heading', { name: /^Professional(?: ·|$)/ })).toHaveCount(0)
    await expect(drawer.getByRole('button', { name: PERSON, exact: true })).toHaveCount(0)
    const body = drawer.locator('[data-booking-body]')
    await expect(body).toHaveCSS('scrollbar-width', 'none')
    const scrolling = await body.evaluate(element => {
      const before = element.scrollTop
      element.scrollTop = before + 100
      return {
        scrollable: element.scrollHeight > element.clientHeight,
        moved: element.scrollTop > before,
        trackDisplay: getComputedStyle(element, '::-webkit-scrollbar').display,
      }
    })
    expect(scrolling).toEqual({ scrollable: true, moved: true, trackDisplay: 'none' })
    await assertPricing()
    await expect(drawer.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled()
    await drawer.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
    await expect(drawer).toContainText('Fixture haircut')
    await expect(drawer).toContainText('Fixture scalp care')
    await expect(drawer.getByText(PERSON, { exact: true })).toHaveCount(1)
    await assertPricing()
    // Availability preserves the selected professional; no appointment is
    // submitted. An accidental booking POST remains an unmatched mutation.
    expect(saved.availabilityRequests).toHaveLength(3)
    for (const request of saved.availabilityRequests) {
      expect(request).toMatchObject({
        businessId: 101, locationId: 201,
        services: [{ serviceId: 401, teamMemberId: 301 }, { serviceId: 402, teamMemberId: 301 }],
      })
    }
    expect(saved.mutations).toEqual([])
  })
}

function fillBookingCalendar(saved: Awaited<ReturnType<typeof installSavedFixture>>, count = 30) {
  saved.availability.calendar.bookingSettings.maxAdvanceBookingMinutes = Math.floor((Date.UTC(2030, 9, 21 + count, 12) - Date.now()) / 60000) - 1
  saved.availability.calendar.calendar = Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(2030, 9, 22 + offset, 12))
    return {
      date: date.toISOString().slice(0, 10),
      dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date),
      status: offset === 1 ? 'closed' as const : 'available' as const,
      slotsCount: offset === 1 ? undefined : 1,
    }
  })
}

async function openProfileBooking(page: Page, locale: 'en' | 'ro' = 'en') {
  await page.goto(locale === 'en' ? '/saved' : '/ro/saved')
  await page.getByRole('button', { name: PERSON, exact: true }).click()
  const profile = page.getByRole('dialog', { name: PERSON, exact: true })
  await expect(profile).toBeVisible()
  await profile.getByRole('button', { name: `${locale === 'en' ? 'Add' : 'Adaugă'} Fixture haircut`, exact: true }).click()
  await profile.getByRole('button', { name: locale === 'en' ? 'Book with Mara' : 'Programează-te la Mara', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: locale === 'en' ? 'Book an appointment' : 'Rezervă o programare', exact: true })
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('button[data-date="2030-10-22"]')).toBeVisible()
  return drawer
}

testSaved('booking redesign returns to the same profile with venue, service selection and focus preserved', async ({ page, saved }) => {
  saved.bookingContext = venueFixture()
  await openSaved(page)
  const profile = await openProfessional(page)
  const venue = profile.getByRole('button', { name: /Atelier Saved Studio.*Old Town venue/ })
  await venue.click()
  await profile.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click()
  const selectedService = profile.getByRole('button', { name: 'Remove Fixture haircut', exact: true })
  const book = profile.getByRole('button', { name: 'Book with Mara', exact: true })
  const scrollBefore = await profile.evaluate(el => [...el.querySelectorAll<HTMLElement>('*')]
    .filter(node => node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY === 'auto')
    .map(node => node.scrollTop))
  await book.click()
  const drawer = page.getByRole('dialog', { name: 'Book an appointment', exact: true })
  await expect(drawer).toBeVisible()
  await expect(profile).toBeHidden()
  await expect(drawer.getByRole('button', { name: 'Back to profile', exact: true })).toBeVisible()
  await drawer.getByRole('button', { name: 'Back to profile', exact: true }).click()
  await expect(drawer).toHaveCount(0)
  await expect(profile).toBeVisible()
  await expect(venue).toHaveAttribute('aria-pressed', 'true')
  await expect(selectedService).toHaveAttribute('aria-pressed', 'true')
  await expect(book).toBeFocused()
  const scrollAfter = await profile.evaluate(el => [...el.querySelectorAll<HTMLElement>('*')]
    .filter(node => node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY === 'auto')
    .map(node => node.scrollTop))
  expect(scrollAfter).toEqual(scrollBefore)

  // Step-3 Back returns to time selection, then Back to profile restores the
  // original profile. Nothing refetches or recreates its draft services.
  await book.click()
  await drawer.locator('button[data-date="2030-10-22"]').click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  const continueButton = drawer.getByRole('button', { name: 'Continue', exact: true })
  await continueButton.focus()
  await page.keyboard.press('Tab')
  await expect(drawer.getByRole('button', { name: 'Back to profile', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(continueButton).toBeFocused()
  await continueButton.click()
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
  await drawer.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(drawer.getByRole('button', { name: /^10:00/ })).toHaveAttribute('aria-pressed', 'true')
  await drawer.getByRole('button', { name: 'Back to profile', exact: true }).click()
  await expect(profile).toBeVisible()
  await expect(selectedService).toHaveAttribute('aria-pressed', 'true')
  expect(saved.requests.filter(request => request.endsWith('/team-member/301'))).toHaveLength(1)
  expect(saved.requests.filter(request => request.endsWith('/team-member/301/booking-context'))).toHaveLength(1)
  await book.click()
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await expect(profile).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden')
  expect(saved.mutations).toEqual([])
})

testSaved('booking redesign respects the business date horizon and preserves a chosen slot while browsing', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  fillBookingCalendar(saved)
  const drawer = await openProfileBooking(page)
  const firstDate = drawer.locator('button[data-date="2030-10-22"]')
  const disabledDate = drawer.locator('button[data-date="2030-10-23"]')
  await expect(disabledDate).toBeDisabled()
  await firstDate.click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  const continueButton = drawer.getByRole('button', { name: 'Continue', exact: true })
  await expect(continueButton).toBeEnabled()
  const shell = page.locator('[data-booking-dialog]')
  const bounds = await shell.boundingBox()
  const previous = drawer.getByRole('button', { name: 'Previous dates', exact: true })
  const next = drawer.getByRole('button', { name: 'Next dates', exact: true })
  await expect(previous).toBeDisabled()
  await next.click()
  await expect(drawer.locator('button[data-date="2030-10-29"]')).toBeVisible()
  await expect(drawer.getByRole('button', { name: /^10:00/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(continueButton).toBeEnabled()
  await previous.click()
  await expect(firstDate).toHaveAttribute('aria-pressed', 'true')
  expect((await shell.boundingBox())!.height).toBe(bounds!.height)
  for (let index = 0; index < 4; index += 1) await next.click()
  await expect(next).toBeDisabled()
  const dates = await drawer.locator('button[data-date]').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-date')))
  expect(dates).toEqual(['2030-11-19', '2030-11-20'])
  expect(saved.availabilityRequests).toHaveLength(2)
  expect(saved.availabilityRequests[0]).toMatchObject({ daysToCheck: 30 })
  expect(saved.availabilityRequests.every(request => request.services[0].teamMemberId === 301)).toBe(true)
  expect(saved.mutations).toEqual([])
})

testSaved('booking redesign never allows stale day slots to replace the current date selection', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  const secondDate = '2030-10-23'
  saved.availability.calendar.calendar.push({ date: secondDate, dayOfWeek: 'Wednesday', status: 'available', slotsCount: 1 })
  const secondSlots = structuredClone(saved.availability.slots)
  secondSlots.date = secondDate
  secondSlots.dayOfWeek = 'Wednesday'
  secondSlots.slots[0].startTime = secondSlots.slots[0].items[0].startTime = '14:00'
  secondSlots.slots[0].endTime = secondSlots.slots[0].items[0].endTime = '14:30'
  saved.slotsByDate[secondDate] = secondSlots
  const drawer = await openProfileBooking(page)
  const first = drawer.locator('button[data-date="2030-10-22"]')
  const second = drawer.locator(`button[data-date="${secondDate}"]`)
  const continueButton = drawer.getByRole('button', { name: 'Continue', exact: true })
  await first.click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  await expect(continueButton).toBeEnabled()
  saved.slotsDelayByDate['2030-10-22'] = 1_000
  const staleResponse = page.waitForResponse(response => response.url().endsWith('/public/booking/slots') && response.request().postDataJSON().date === '2030-10-22')
  await first.click()
  await expect(continueButton).toBeDisabled()
  await second.click()
  await expect(drawer.getByRole('button', { name: '2:00 PM', exact: true })).toBeVisible()
  await expect(continueButton).toBeDisabled()
  await staleResponse
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect(drawer.getByRole('button', { name: /^10:00/ })).toHaveCount(0)
  await expect(second).toHaveAttribute('aria-pressed', 'true')
  await drawer.getByRole('button', { name: '2:00 PM', exact: true }).click()
  await continueButton.click()
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
  await expect(drawer).toContainText('2:00 PM')
  expect(saved.mutations).toEqual([])
})

for (const [locale, viewport] of [
  ['en', { width: 1440, height: 1000 }],
  ['ro', { width: 320, height: 640 }],
  ['ro', { width: 844, height: 390 }],
] as const) {
  testSaved(`booking redesign ${locale} stays within ${viewport.width}×${viewport.height} with stable height and usable controls`, async ({ page, saved }) => {
    saved.bookingContext = venueFixture(1)
    fillBookingCalendar(saved)
    await page.setViewportSize(viewport)
    const drawer = await openProfileBooking(page, locale)
    const shell = page.locator('[data-booking-dialog]')
    await shell.evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)))
    })
    const bounds = (await shell.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const close = drawer.getByRole('button', { name: locale === 'en' ? 'Close' : 'Închide', exact: true })
    const closeBounds = (await close.boundingBox())!
    expect(closeBounds.width).toBeGreaterThanOrEqual(44)
    expect(closeBounds.height).toBeGreaterThanOrEqual(44)
    const continueButton = drawer.getByRole('button', { name: locale === 'en' ? 'Continue' : 'Continuă', exact: true })
    await expect(continueButton).toBeDisabled()
    if (locale === 'ro' && viewport.width === 320) {
      const firstDay = drawer.locator('button[data-date="2030-10-22"]')
      const scrollRight = await firstDay.evaluate(button => {
        const dateViewport = button.parentElement!.parentElement!
        dateViewport.scrollLeft = dateViewport.scrollWidth
        return dateViewport.scrollLeft
      })
      expect(scrollRight).toBeGreaterThan(0)
      const next = drawer.getByRole('button', { name: 'Datele următoare', exact: true })
      for (let index = 0; index < 4; index += 1) await next.click()
      await expect(next).toBeDisabled()
      const lastPageFirstDay = drawer.locator('button[data-date="2030-11-19"]')
      const finalPage = await lastPageFirstDay.evaluate(button => {
        const dateViewport = button.parentElement!.parentElement!
        const day = button.getBoundingClientRect()
        const bounds = dateViewport.getBoundingClientRect()
        return { scrollLeft: dateViewport.scrollLeft, dayLeft: day.left, dayRight: day.right, viewportLeft: bounds.left, viewportRight: bounds.right }
      })
      expect(finalPage.scrollLeft).toBe(0)
      expect(finalPage.dayLeft).toBeGreaterThanOrEqual(finalPage.viewportLeft)
      expect(finalPage.dayRight).toBeLessThanOrEqual(finalPage.viewportRight)
      const previous = drawer.getByRole('button', { name: 'Datele anterioare', exact: true })
      for (let index = 0; index < 4; index += 1) await previous.click()
      await expect(firstDay).toBeVisible()
    }
    const selectedDate = drawer.locator('button[data-date="2030-10-22"]')
    await selectedDate.click()
    const selectedSlot = drawer.getByRole('button', { name: /^10:00/ })
    await selectedSlot.click()
    await selectedSlot.hover()
    const selectedColors = await selectedDate.evaluate(element => ({
      background: getComputedStyle(element).backgroundColor,
      text: getComputedStyle(element).color,
    }))
    await expect(selectedSlot).toHaveCSS('background-color', selectedColors.background)
    await expect(selectedSlot).toHaveCSS('color', selectedColors.text)
    await expect(continueButton).toBeEnabled()
    const selectedBounds = (await shell.boundingBox())!
    expect(selectedBounds.height).toBe(bounds.height)
    expect(selectedBounds.y).toBe(bounds.y)
    await continueButton.click()
    const confirm = drawer.getByRole('button', { name: locale === 'en' ? 'Confirm appointment' : 'Confirmă programarea', exact: true })
    await expect(confirm).toBeEnabled()
    await expect(drawer.locator('[data-booking-body]')).toHaveJSProperty('scrollTop', 0)
    const reviewBounds = (await shell.boundingBox())!
    expect(reviewBounds.height).toBe(bounds.height)
    expect(reviewBounds.y).toBe(bounds.y)
    const confirmBounds = (await confirm.boundingBox())!
    expect(confirmBounds.y + confirmBounds.height).toBeLessThanOrEqual(viewport.height)
    expect(confirmBounds.x + confirmBounds.width).toBeLessThanOrEqual(viewport.width)
    await close.click()
    await expect(drawer).toHaveCount(0)
    await expect(page.getByRole('dialog', { name: PERSON, exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden')
    expect(saved.mutations).toEqual([])
  })
}

for (const locale of ['en', 'ro'] as const) {
for (const outcome of ['permanent', 'transient'] as const) {
  testSaved(`${locale}: ${outcome} full profile failure uses contained recovery without exposing a bookable menu`, async ({ page, saved }) => {
    saved.bookingContext = venueFixture(1)
    saved.profileFailure = outcome === 'permanent' ? { status: 404 } : { status: 503 }
    if (locale === 'ro') await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(locale === 'en' ? '/saved' : '/ro/saved')
    const dialog = await openProfessional(page)
    const title = outcome === 'permanent'
      ? locale === 'en' ? 'This profile is no longer available.' : 'Acest profil nu mai este disponibil.'
      : locale === 'en' ? "Couldn't load the full profile." : 'Profilul complet nu a putut fi încărcat.'
    const recovery = dialog.getByRole('region', { name: title, exact: true })
    await expect(recovery.getByRole('heading', { name: title, level: 2, exact: true })).toBeVisible()
    await expect(recovery.locator('svg').first()).toBeVisible()
    await expect(dialog.getByRole('main')).toHaveCount(0)
    await expect(recovery.getByRole('alert')).toHaveCount(0)
    const retry = recovery.getByRole('button', { name: locale === 'en' ? 'Try again' : 'Încearcă din nou', exact: true })
    if (outcome === 'permanent') {
      await expect(retry).toHaveCount(0)
    } else {
      await expect(retry).toBeVisible()
    }
    const addService = dialog.getByRole('button', { name: locale === 'en' ? 'Add Fixture haircut' : 'Adaugă Fixture haircut', exact: true })
    await expect(addService).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: locale === 'en' ? 'Book with Mara' : 'Programează-te la Mara', exact: true })).toHaveCount(0)
    await expect.poll(() => dialog.evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true)
    if (outcome === 'transient') {
      saved.profileFailure = null
      await retry.click()
      await expect(addService).toBeVisible()
      await expect(recovery).toHaveCount(0)
    } else {
      await recovery.getByRole('button', { name: locale === 'en' ? 'Close' : 'Închide', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    }
    expect(saved.mutations).toEqual([])
  })
}

for (const missing of ['timezone', 'currency'] as const) {
  testSaved(`${locale}: missing ${missing} uses a dismissible toast and keeps booking disabled`, async ({ page, saved }) => {
    saved.bookingContext = venueFixture(1)
    if (missing === 'timezone') saved.bookingContext.businesses[0].locations[0].timezone = null
    else saved.bookingContext.businesses[0].businessCurrency = ''
    await page.goto(locale === 'en' ? '/saved' : '/ro/saved')
    const dialog = await openProfessional(page)
    const message = locale === 'en'
      ? 'Booking details are unavailable for this location.'
      : 'Detaliile de programare nu sunt disponibile pentru această locație.'
    const notice = dialog.locator('[data-toast-host] [role="alert"]').filter({ hasText: message })
    await expect(notice).toBeVisible()
    await expect(dialog.getByText('Fixture haircut', { exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: locale === 'en' ? 'Add Fixture haircut' : 'Adaugă Fixture haircut', exact: true })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: locale === 'en' ? 'Book with Mara' : 'Programează-te la Mara', exact: true })).toHaveCount(0)
    await notice.getByRole('button').click()
    await expect(dialog.getByText(message, { exact: true })).toHaveCount(0)
    await expect(dialog.getByText('Fixture haircut', { exact: true })).toBeVisible()
    expect(saved.availabilityRequests).toEqual([])
    expect(saved.mutations).toEqual([])
  })
}
}

testSaved('booking metadata toast clears when selecting an eligible venue or closing the profile', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(3)
  saved.bookingContext.businesses[0].locations[0].timezone = null
  saved.bookingContext.businesses[0].locations[1].timezone = 'Invalid/Timezone'
  saved.bookingContext.businesses[0].locations[2].name = 'Healthy venue'
  await openSaved(page)
  const dialog = await openProfessional(page)
  const unavailable = dialog.getByRole('button', { name: /Atelier Saved Studio.*Old Town venue/ })
  const alsoUnavailable = dialog.getByRole('button', { name: /Atelier Saved Studio.*North venue/ })
  const eligible = dialog.getByRole('button', { name: /Atelier Saved Studio.*Healthy venue/ })
  const notice = page.locator('[data-toast-host] [role="alert"]').filter({ hasText: 'Booking details are unavailable for this location.' })
  await unavailable.click()
  await expect(notice).toBeVisible()
  await alsoUnavailable.click()
  await expect(notice).toBeVisible()
  await expect(notice).toHaveCount(1)
  await eligible.click()
  await expect(notice).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Add Fixture haircut', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toBeEnabled()
  await unavailable.click()
  await expect(notice).toBeVisible()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(notice).toHaveCount(0)
  expect(saved.availabilityRequests).toEqual([])
  expect(saved.mutations).toEqual([])
})

testSaved('narrow layouts stay within the viewport without requesting location permission', async ({ page, saved }) => {
  saved.favorites.locations[1].location.name = `${SECOND_LOCATION} with a deliberately long location name`
  await page.setViewportSize({ width: 320, height: 850 })
  await page.goto('/saved')
  await expect(removeButton(page, LOCATION)).toBeVisible()
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 850 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  expect(await page.evaluate(() => (window as unknown as Window & { __savedGeoRequests: number }).__savedGeoRequests)).toBe(0)
})

for (const locale of ['en', 'ro'] as const) {
  testSaved(`${locale}: formats ratings and handles missing identity, zero ratings and invalid dates`, async ({ page, saved }) => {
    // Older API responses may encode an aggregate as a numeric string.
    saved.favorites.locations[1].location.averageRating = '4.40' as unknown as number
    const location = saved.favorites.locations[0]
    location.location.averageRating = 0
    location.location.totalReviews = 0
    location.location.address = '   '
    location.createdAt = 'not-a-date'
    const person = saved.favorites.professionals[0]
    person.professional.displayName = '   '
    person.professional.firstName = '   '
    person.professional.lastName = null
    person.professional.professionalTitle = '   '
    person.professional.averageRating = 0
    person.professional.totalReviews = 0
    person.createdAt = 'not-a-date'

    await page.goto(locale === 'en' ? '/saved' : '/ro/saved')
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Saved' : 'Salvate', exact: true })).toBeVisible()
    const main = page.getByRole('main')
    const secondCard = main.getByRole('article').filter({
      has: page.getByRole('heading', { name: SECOND_LOCATION, exact: true, level: 2 }),
    })
    await expect(secondCard.getByRole('img', { name: locale === 'en' ? /4\.4/ : /4,4/ })).toBeVisible()
    await expect(secondCard.getByRole('link', { name: SECOND_LOCATION, exact: true }))
      .toHaveAttribute('href', locale === 'en' ? '/business/202' : '/ro/business/202')

    const locationCard = main.getByRole('article').filter({
      has: page.getByRole('heading', { name: LOCATION, exact: true, level: 2 }),
    })
    await expect(locationCard.getByText('Bucharest', { exact: true })).toBeVisible()
    await expect(locationCard.getByRole('img')).toHaveCount(0)

    const fallbackName = locale === 'en' ? 'Professional' : 'Profesionist'
    const personCard = main.getByRole('article').filter({
      has: page.getByRole('heading', { name: fallbackName, exact: true, level: 2 }),
    })
    await expect(personCard.getByRole('button', { name: fallbackName, exact: true })).toBeVisible()
    await expect(personCard.getByRole('img')).toHaveCount(0)
    await expect(page.getByRole('button', { name: locale === 'en' ? /^All\s*3$/ : /^Toate\s*3$/ })).toBeVisible()
  })
}

test('signed-out Saved does not request browser geolocation or favorites', async ({ context, page, baseURL }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const saved = await installSavedFixture(context, baseURL!, { signedOut: true })
  const favoritesRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/customer/favorites')) favoritesRequests.push(request.url())
  })
  await page.goto('/saved')
  await expect(page.getByRole('heading', { name: 'Saved', exact: true, level: 1 })).toBeVisible()
  expect(await page.evaluate(() => (window as unknown as Window & { __savedGeoRequests: number }).__savedGeoRequests)).toBe(0)
  expect(favoritesRequests).toEqual([])
  expect(saved.blockedMutations).toEqual([])
  expect(pageErrors, 'Signed-out Saved must render without runtime or hydration errors').toEqual([])
})


async function reachBookingReview(page: Page, saved: Awaited<ReturnType<typeof installSavedFixture>>) {
  saved.bookingContext = venueFixture(1)
  const drawer = await openProfileBooking(page)
  await drawer.locator('button[data-date="2030-10-22"]').click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
  return drawer
}

testSaved('booking contract preserves an unknown-outcome request through Back and unchanged retry', async ({ page, saved }) => {
  const attempts: Array<{ body: unknown; key: string | undefined }> = []
  await page.route('**/appointments/book', async route => {
    attempts.push({ body: route.request().postDataJSON(), key: route.request().headers()['idempotency-key'] })
    return route.fulfill({ status: attempts.length === 1 ? 500 : 200, contentType: 'application/json',
      body: JSON.stringify(attempts.length === 1 ? { message: 'fixture unknown outcome' } : { data: { appointments: [] } }) })
  })
  const drawer = await reachBookingReview(page, saved)
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click()
  await expect.poll(() => attempts.length).toBe(1)
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
  const checksAfterAttempt = saved.availabilityRequests.length
  // The first POST may have booked the slot. An unchanged retry must not ask it to be free again.
  saved.availability.slots.slots = []
  await drawer.getByRole('button', { name: 'Back', exact: true }).click()
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click()
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click()
  await expect.poll(() => attempts.length).toBe(2)
  expect(saved.availabilityRequests).toHaveLength(checksAfterAttempt)
  expect(attempts[0]).toEqual(attempts[1])
  expect(attempts[0].key).toBeTruthy()
  expect(attempts[0].body).toMatchObject({ listingId: 11, locationId: 201, services: [{ serviceId: 401, staffId: 301 }] })
  await expect(drawer).toContainText("You're booked")
})

testSaved('booking contract closing during validation prevents a late booking submission', async ({ page, saved }) => {
  let posts = 0
  await page.route('**/appointments/book', route => { posts += 1; return route.fulfill({ json: { data: { appointments: [] } } }) })
  const drawer = await reachBookingReview(page, saved)
  saved.slotsDelayByDate['2030-10-22'] = 600
  const delayedCheck = page.waitForResponse(response => response.url().endsWith('/public/booking/slots'))
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click()
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeDisabled()
  await drawer.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(drawer).toHaveCount(0)
  await delayedCheck
  await page.waitForTimeout(150)
  expect(posts).toBe(0)
})

testSaved('booking contract requires confirmation of a changed quote and shows effective policy', async ({ page, saved }) => {
  let posts = 0
  await page.route('**/appointments/book', route => { posts += 1; return route.fulfill({ json: { data: { appointments: [] } } }) })
  saved.availability.slots.bookingPolicy = { allowCustomerCancellation: false, allowCustomerReschedule: true,
    cancellationWindowMinutes: 0, rescheduleWindowMinutes: 90 }
  const drawer = await reachBookingReview(page, saved)
  await expect(drawer).toContainText('This appointment cannot be cancelled online.')
  await expect(drawer).toContainText('90 minutes')
  saved.availability.slots.staffPricing[401][301].price = 15000
  saved.availability.slots.slots[0].items[0].priceAmountMinor = 15000
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click()
  await expect(drawer).toContainText('The price or duration has changed.')
  expect(posts).toBe(0)
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toBeEnabled()
  await drawer.getByRole('button', { name: 'Confirm appointment', exact: true }).click()
  await expect.poll(() => posts).toBe(1)
})

testSaved('booking contract rejects an unavailable chosen sequence before review', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  const drawer = await openProfileBooking(page)
  await drawer.locator('button[data-date="2030-10-22"]').click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  saved.availability.slots.slots = []
  await drawer.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(drawer).toContainText("That professional isn't available then.")
  await expect(drawer.getByRole('button', { name: 'Confirm appointment', exact: true })).toHaveCount(0)
  await expect(drawer.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled()
})

testSaved('booking contract loads beyond thirty dates without clearing the selected slot', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  fillBookingCalendar(saved)
  saved.availability.calendar.bookingSettings.maxAdvanceBookingMinutes = null
  const requests: GetBookingCalendarBody[] = []
  await page.route('**/public/booking/calendar', async route => {
    const body = route.request().postDataJSON() as GetBookingCalendarBody
    requests.push(body)
    const calendar = structuredClone(saved.availability.calendar)
    if (requests.length > 1) {
      const start = new Date(`${body.startDate}T12:00:00Z`)
      calendar.calendar = Array.from({ length: 30 }, (_, index) => ({ date: new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10),
        dayOfWeek: 'Monday', status: 'available', slotsCount: 1 }))
    }
    return route.fulfill({ json: { data: calendar } })
  })
  const drawer = await openProfileBooking(page)
  await drawer.locator('button[data-date="2030-10-22"]').click()
  await drawer.getByRole('button', { name: /^10:00/ }).click()
  for (let index = 0; index < 4; index += 1) await drawer.getByRole('button', { name: 'Next dates', exact: true }).click()
  await expect(drawer.locator('button[data-date="2030-11-21"]')).toBeVisible()
  expect(requests).toHaveLength(2)
  expect(requests[1]).toMatchObject({ startDate: '2030-11-21', daysToCheck: 30, services: [{ serviceId: 401, teamMemberId: 301 }] })
  await expect(drawer.getByRole('button', { name: /^10:00/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(drawer.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled()
})


testSaved('booking contract keeps navigation available when the first thirty days have no slots', async ({ page, saved }) => {
  saved.bookingContext = venueFixture(1)
  fillBookingCalendar(saved)
  saved.availability.calendar.bookingSettings.maxAdvanceBookingMinutes = null
  for (const day of saved.availability.calendar.calendar) { day.status = 'closed'; delete day.slotsCount }
  const requests: GetBookingCalendarBody[] = []
  await page.route('**/public/booking/calendar', async route => {
    const body = route.request().postDataJSON() as GetBookingCalendarBody
    requests.push(body)
    const calendar = structuredClone(saved.availability.calendar)
    if (requests.length > 1) calendar.calendar = Array.from({ length: 30 }, (_, index) => ({
      date: new Date(new Date(`${body.startDate}T12:00:00Z`).getTime() + index * 86400000).toISOString().slice(0, 10),
      dayOfWeek: 'Monday', status: 'available', slotsCount: 1,
    }))
    return route.fulfill({ json: { data: calendar } })
  })
  const drawer = await openProfileBooking(page)
  await expect(drawer).toContainText('No availability in this date range.')
  for (let index = 0; index < 4; index += 1) await drawer.getByRole('button', { name: 'Next dates', exact: true }).click()
  await expect(drawer.locator('button[data-date="2030-11-21"]')).toBeEnabled()
  expect(requests).toHaveLength(2)
})
