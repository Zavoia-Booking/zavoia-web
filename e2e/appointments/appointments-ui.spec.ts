import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { AuthUser } from '../../src/lib/auth/types'
import { deriveTense, timeUntil } from '../../src/app/[locale]/appointments/_components/vm'
import type {
  AppointmentDetail,
  AppointmentListItem,
  BookingCalendar,
  BookingDaySlots,
  TeamMemberBookingContext,
  TeamMemberProfile,
} from '../../src/lib/api/marketplace/types'

const BRAND = 'Atelier Appointment Studio'
const VENUE = 'Appointment Old Town'
const PERSON = 'Mara Appointment'
const SERVICE = 'Precision appointment haircut'
const CONFIRMED = 'fixture-confirmed'
const CANCELLED = 'fixture-cancelled'
const COMPLETED = 'fixture-completed'
const RETIRED = 'fixture-retired'
const HISTORICAL = 'fixture-historical'
const REVIEWED = 'fixture-reviewed'
const zone = 'Europe/Bucharest'

test('scheduled chronology preserves pending and terminal states at start/end boundaries', () => {
  const start = '2026-10-23T10:00:00Z'
  const end = '2026-10-23T11:00:00Z'
  const during = new Date('2026-10-23T10:30:00Z')
  expect(deriveTense(start, end, 'pending', during, zone)).toBe('now')
  expect(timeUntil(start, 'pending', 'now', during, zone)).toEqual({ kind: 'pending' })
  expect(deriveTense(start, end, 'confirmed', new Date(end), zone)).toBe('past')
  for (const status of ['cancelled', 'no_show', 'completed'] as const) {
    expect(deriveTense(start, end, status, new Date('2026-10-23T09:00:00Z'), zone)).toBe('past')
  }
})

function addDays(date: string, count: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}

function dayFromNow(days: number) {
  return addDays(new Date().toISOString().slice(0, 10), days)
}

function detailFixture(uuid = CONFIRMED, overrides: Partial<AppointmentDetail> = {}): AppointmentDetail {
  const date = dayFromNow(5)
  return {
    uuid, bookedItemName: SERVICE, primaryItemName: SERVICE,
    additionalServices: [], additionalItemsCount: 0,
    items: [{ type: 'service', name: SERVICE, description: 'Saved haircut description',
      serviceId: 41, serviceUuid: 'fixture-service', duration: 60, price: 12000, startOffsetMinutes: 0 }],
    bookedItemDescription: 'Saved haircut description',
    scheduled_at: `${date}T12:00:00Z`, ends_at: `${date}T13:00:00Z`,
    status: 'confirmed', bookingType: 'single', bookingSource: 'marketplace',
    duration: 60, price: 12000, currency: 'RON', notes: 'Fixture appointment note',
    cancellation_reason: null, recurringGroupId: null, recurringIndex: null,
    isRecurringParent: false, bundleServicesSnapshot: null, bookingItemsSnapshot: null,
    staffSnapshot: [{ userId: 301, userUuid: 'fixture-mara', firstName: 'Mara', lastName: 'Appointment',
      profileImage: null, professionalTitle: 'Stylist' }],
    customerSnapshot: null,
    locationSnapshot: { locationId: 201, locationUuid: 'fixture-location',
      locationName: VENUE, address: 'Saved appointment address 12' },
    createdAt: `${dayFromNow(-10)}T10:00:00Z`, updatedAt: `${dayFromNow(-10)}T10:00:00Z`,
    reviews: {
      canLeaveBusinessReview: false, business: null,
      professionals: [{ staffId: 301, staffUuid: 'fixture-mara', canLeaveReview: false, review: null }],
    },
    business: { id: 101, uuid: 'fixture-business', businessSlug: 'fixture-brand', name: BRAND,
      logo: null, description: null, averageRating: null, totalReviews: 0,
      phone: '+40700000101', email: null, timezone: zone },
    location: { id: 201, uuid: 'fixture-location', slug: 'fixture-venue', name: VENUE,
      address: 'Appointment Street 12, Bucharest', phone: '+40700000201', email: null,
      profileImage: null, averageRating: null, totalReviews: 0, timezone: zone,
      allowCustomerCancellation: true, cancellationWindowMinutes: 60,
      allowCustomerReschedule: true, rescheduleWindowMinutes: 60 },
    service: { id: 41, uuid: 'fixture-service', name: SERVICE, description: null, category: null },
    bundle: null,
    staff_users: [{ teamMemberId: 301, uuid: 'fixture-mara', firstName: 'Mara', lastName: 'Appointment',
      profileImage: null, professionalTitle: 'Stylist', displayName: PERSON, averageRating: null, totalReviews: 0 }],
    ...overrides,
  }
}

function listItem(detail: AppointmentDetail): AppointmentListItem {
  return {
    uuid: detail.uuid, bookedItemName: detail.bookedItemName, primaryItemName: detail.primaryItemName,
    additionalItemsCount: detail.additionalItemsCount, bookingType: detail.bookingType,
    scheduledAt: detail.scheduled_at, endsAt: detail.ends_at, status: detail.status,
    duration: detail.duration, price: detail.price, currency: detail.currency,
    business: detail.business,
    location: { id: detail.location?.id ?? null, name: detail.location?.name ?? null,
      profileImage: null, timezone: zone },
    staff: { id: 301, firstName: 'Mara', lastName: 'Appointment', profileImage: null },
  }
}

function calendarFixture(startDate: string): BookingCalendar {
  const calendar = Array.from({ length: 30 }, (_, index) => ({
    date: addDays(startDate, index), dayOfWeek: 'Fixture day',
    status: 'available' as const, slotsCount: 2,
  }))
  return {
    businessId: 101, businessName: BRAND, locationId: 201, locationName: VENUE, timezone: zone,
    items: [], totalDuration: 60, totalPrice: 12000,
    bookingSettings: { minAdvanceBookingMinutes: 0, maxAdvanceBookingMinutes: null,
      slotIntervalMinutes: 30, bufferTimeMinutes: 0, cancellationWindowHours: 1, rescheduleWindowHours: 1 },
    calendar, nextAvailableDate: calendar[0].date,
  }
}

function slotsFixture(date: string, startTime = '10:00'): BookingDaySlots {
  return {
    businessId: 101, locationId: 201, date, dayOfWeek: 'Fixture day', items: [],
    totalDuration: 60, totalPrice: 12000, staffDirectory: { 301: { name: PERSON, image: null } },
    staffPricing: {}, slots: [{ startTime, endTime: '11:00', totalPriceAmountMinor: 12000,
      items: [{ type: 'service', serviceId: 41, serviceName: SERVICE, startTime, endTime: '11:00',
        durationMinutes: 60, priceAmountMinor: 12000, availableStaffIds: [301], defaultStaffId: 301 }] }],
  }
}

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => { release = resolve })
  return { promise, release }
}

const user: AuthUser = {
  uuid: 'appointments-browser-user', email: 'appointments-ui@example.invalid', firstName: 'Appointment',
  lastName: 'Fixture', profileImage: null, hasPassword: true, emailVerified: true, googleSub: null,
}

async function installAppointmentFixture(context: BrowserContext, baseURL: string) {
  const completed = detailFixture(COMPLETED, {
    status: 'completed', scheduled_at: `${dayFromNow(-3)}T12:00:00Z`, ends_at: `${dayFromNow(-3)}T13:00:00Z`,
    reviews: { canLeaveBusinessReview: true, business: null,
      professionals: [{ staffId: 301, staffUuid: 'fixture-mara', canLeaveReview: true, review: null }] },
  })
  const cancelled = detailFixture(CANCELLED, {
    status: 'cancelled', primaryItemName: 'Cancelled appointment fixture', bookedItemName: 'Cancelled appointment fixture',
    scheduled_at: `${dayFromNow(-2)}T12:00:00Z`, ends_at: `${dayFromNow(-2)}T13:00:00Z`,
  })
  const retired = detailFixture(RETIRED, {
    service: null, bundle: null,
    items: [{ type: 'service', name: SERVICE, serviceId: null, serviceUuid: null,
      duration: 60, price: 12000, startOffsetMinutes: 0 }],
  })
  const historical = detailFixture(HISTORICAL, {
    status: 'completed', business: null, location: null, staff_users: [],
    scheduled_at: completed.scheduled_at, ends_at: completed.ends_at,
  })
  const review = { id: 1, rating: 5, comment: 'Excellent saved venue review',
    createdAt: completed.scheduled_at, updatedAt: completed.scheduled_at }
  const reviewed = detailFixture(REVIEWED, {
    status: 'completed', scheduled_at: completed.scheduled_at, ends_at: completed.ends_at,
    reviews: { canLeaveBusinessReview: false, business: review, professionals: [{
      staffId: 301, staffUuid: 'fixture-mara', canLeaveReview: false,
      review: { ...review, id: 2, rating: 4, comment: 'Excellent saved professional review' },
    }] },
  })
  const state = {
    details: { [CONFIRMED]: detailFixture(), [CANCELLED]: cancelled, [COMPLETED]: completed,
      [RETIRED]: retired, [HISTORICAL]: historical, [REVIEWED]: reviewed } as Record<string, AppointmentDetail>,
    upcoming: [listItem(detailFixture())], past: [listItem(cancelled), listItem(completed)],
    failDetails: new Set<string>(), detailReads: [] as string[],
    detailGate: null as { uuid: string; value: AppointmentDetail; gate: ReturnType<typeof gate>; used: boolean } | null,
    mutations: [] as Array<{ path: string; body: Record<string, unknown> }>,
    blockedMutations: [] as string[], unmocked: [] as string[],
    calendars: [] as Array<{ uuid: string; startDate: string; daysToCheck?: number }>,
    slots: [] as Array<{ uuid: string; date: string }>,
    cancelGate: null as ReturnType<typeof gate> | null,
    reviewGate: null as ReturnType<typeof gate> | null,
    failReviews: false,
    reviewValidationMessages: [] as string[],
    reportGate: null as ReturnType<typeof gate> | null,
    failReports: false,
    reportValidationMessages: [] as string[],
    slotsGate: null as { date: string; gate: ReturnType<typeof gate>; startTime: string } | null,
    listGate: null as { filter: string; gate: ReturnType<typeof gate> } | null,
    failLists: false,
    failListOffsets: new Set<number>(),
    failAuthRefresh: false,
    authRefreshReads: 0,
    listReads: [] as Array<{ filter: string; offset: number; limit: number }>,
  }
  const token = ['eyJhbGciOiJub25lIn0',
    Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url'),
    'appointments-ui-fixture'].join('.')
  await context.addCookies([
    { name: 'zw-consent', value: 'denied', url: baseURL },
    { name: 'customerCsrfToken', value: 'appointments-ui-fixture', url: baseURL },
  ])
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    const json = (data: unknown, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(data),
    })
    const wrapped = (data: unknown, status = 200) => json({ message: 'Appointment fixture', data }, status)
    if (path.includes('/marketplace/')) {
      if (method === 'OPTIONS') return route.fulfill({ status: 204 })
      if (path.endsWith('/auth/refresh')) {
        state.authRefreshReads += 1
        if (state.failAuthRefresh) return json({ message: 'Fixture session verification unavailable' }, 503)
        return json({ accessToken: token, csrfToken: 'appointments-ui-fixture' })
      }
      if (path.endsWith('/auth/me')) return json({ user })
      if (path.endsWith('/appointments/list')) {
        const filter = url.searchParams.get('status') ?? 'all'
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? 20)
        state.listReads.push({ filter, offset, limit })
        if (state.listGate?.filter === filter) await state.listGate.gate.promise
        if (state.failLists || state.failListOffsets.has(offset)) {
          return json({ message: 'Fixture appointment list unavailable' }, 503)
        }
        const items = filter === 'cancelled' ? state.past.filter((item) => item.status === 'cancelled')
          : filter === 'no_show' ? state.past.filter((item) => item.status === 'no_show') : state.past
        return wrapped({ upcoming: ['all', 'upcoming'].includes(filter) ? state.upcoming : [],
          past: filter === 'upcoming' ? null : { items: items.slice(offset, offset + limit), total: items.length,
            limit, offset, hasMore: offset + limit < items.length } })
      }
      if (path.endsWith('/appointments/reschedule/calendar')) {
        const body = request.postDataJSON()
        state.calendars.push(body)
        return wrapped(calendarFixture(body.startDate))
      }
      if (path.endsWith('/appointments/reschedule/slots')) {
        const body = request.postDataJSON()
        state.slots.push(body)
        const held = state.slotsGate?.date === body.date ? state.slotsGate : null
        if (held) await held.gate.promise
        return wrapped(slotsFixture(body.date, held?.startTime))
      }
      if (path.endsWith('/appointments/cancel')) {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        if (state.cancelGate) await state.cancelGate.promise
        state.failDetails.add(body.uuid)
        return wrapped({ uuid: body.uuid, status: 'cancelled', cancellation_reason: null })
      }
      if (path.endsWith('/appointments/reschedule')) {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        const end = new Date(new Date(body.newScheduledAt).getTime() + 3600_000).toISOString()
        state.failDetails.add(body.uuid)
        return wrapped({ uuid: body.uuid, scheduledAt: body.newScheduledAt, endsAt: end,
          status: 'confirmed', serviceName: SERVICE, duration: 60 })
      }
      if (path.endsWith('/support/tickets') && method === 'POST') {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        if (state.reportGate) await state.reportGate.promise
        if (state.failReports) return json({ message: 'Fixture report submission unavailable' }, 503)
        if (state.reportValidationMessages.length) return json({ message: state.reportValidationMessages }, 400)
        return wrapped({ id: 701, uuid: 'fixture-ticket', title: body.title, status: 'open', messages: [] })
      }
      if (path.endsWith('/customer/reviews') && method === 'POST') {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        if (state.reviewGate) await state.reviewGate.promise
        if (state.failReviews) return json({ message: 'Fixture review submission unavailable' }, 503)
        if (state.reviewValidationMessages.length) return json({ message: state.reviewValidationMessages }, 400)
        return wrapped({ success: true })
      }
      const detail = path.match(/\/appointments\/([^/]+)$/)
      if (detail && method === 'GET') {
        state.detailReads.push(detail[1])
        const held = state.detailGate
        if (held?.uuid === detail[1] && !held.used) {
          held.used = true
          await held.gate.promise
          return wrapped(held.value)
        }
        if (state.failDetails.has(detail[1])) return json({ message: 'Fixture detail refresh unavailable' }, 500)
        const value = state.details[detail[1]]
        return value ? wrapped(value) : json({ message: 'Fixture appointment missing' }, 404)
      }
      if (path.endsWith('/notifications/unread-count')) return wrapped({ count: 0 })
      if (path.endsWith('/notifications/inbox')) {
        return wrapped({ notifications: [], unreadCount: 0, hasMore: false, nextCursor: null })
      }
      state.unmocked.push(`${method} ${path}`)
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) state.blockedMutations.push(`${method} ${path}`)
      return json({ message: `Unmocked fixture endpoint: ${path}` }, 404)
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      state.blockedMutations.push(`${method} ${path}`)
      return route.fulfill({ status: 403, body: 'Appointment fixture blocked unmatched mutation' })
    }
    if (url.origin !== new URL(baseURL).origin) return route.abort('blockedbyclient')
    return route.continue()
  })
  return state
}

const appointmentTest = test.extend<{ appointments: Awaited<ReturnType<typeof installAppointmentFixture>> }>({
  appointments: [async ({ context, baseURL }, provideFixture) => {
    const state = await installAppointmentFixture(context, baseURL!)
    await provideFixture(state)
    state.cancelGate?.release()
    state.reviewGate?.release()
    state.reportGate?.release()
    state.slotsGate?.gate.release()
    state.listGate?.gate.release()
    state.detailGate?.gate.release()
    expect(state.blockedMutations).toEqual([])
    expect(state.unmocked).toEqual([])
  }, { auto: true }],
})

async function openDetail(page: Page, uuid = CONFIRMED) {
  await page.goto(`/appointments/${uuid}`)
  await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
}

function filter(page: Page, name: string) {
  return page.locator('button[aria-pressed]').filter({ hasText: new RegExp(`^${name}`) })
}

async function expectReachableControl(control: Locator, dialog: Locator) {
  await control.scrollIntoViewIfNeeded()
  await expect(control).toBeVisible()
  const bounds = await control.boundingBox()
  const container = await dialog.boundingBox()
  expect(bounds).not.toBeNull()
  expect(container).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(container!.x - 1)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(container!.x + container!.width + 1)
  expect(bounds!.y).toBeGreaterThanOrEqual(container!.y - 1)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(container!.y + container!.height + 1)
  // Visibility alone permits a control underneath a fixed footer. Check that
  // its centre is actually available to the customer after scrolling.
  expect(await control.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
    return element === hit || (hit != null && element.contains(hit))
  })).toBe(true)
}

async function expectAssociatedFieldError(field: Locator, dialog: Locator, text: string) {
  const error = dialog.getByRole('alert').filter({ hasText: text })
  await expect(error).toBeVisible()
  await expect(field).toHaveAttribute('aria-invalid', 'true')
  const errorId = await error.getAttribute('id')
  expect(errorId).toBeTruthy()
  expect((await field.getAttribute('aria-describedby'))?.split(' ')).toContain(errorId)
}

appointmentTest('Past retains cancelled appointments and its accurate heading; empty filters retain the account context', async ({ page }) => {
  await page.goto('/appointments')
  await expect(page.getByRole('link', { name: new RegExp(SERVICE) }).first()).toBeVisible()
  await filter(page, 'Past').click()
  await expect(page.getByRole('link', { name: /Cancelled appointment fixture/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Past\b/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Completed\b/ })).toHaveCount(0)
  await filter(page, 'No-show').click()
  await expect(page.getByText('No appointments in this view', { exact: true })).toBeVisible()
  await expect(page.getByText('An empty schedule, for now.', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'View all appointments', exact: true }).click()
  await expect(page.getByRole('link', { name: /Cancelled appointment fixture/ })).toBeVisible()
})

appointmentTest('a truly empty appointment list has one heading and a working Explore action', async ({ page, appointments }) => {
  appointments.upcoming = []
  appointments.past = []
  // Exercise the navigation boundary without starting the unrelated search
  // page's server/API requests; its destination is represented by this fixture.
  await page.route(/\/search(?:\?|$)/, (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<main><h1>Explore destination fixture</h1></main>',
  }))
  await page.goto('/appointments')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: 'No appointments yet', level: 1, exact: true })).toBeVisible()
  await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(main.locator('button[aria-pressed]')).toHaveCount(0)
  await main.getByRole('button', { name: 'Explore', exact: true }).click()
  await expect(page).toHaveURL(/\/search$/)
  await expect(page.getByRole('heading', { name: 'Explore destination fixture', exact: true })).toBeVisible()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('appointment links expose date, status and provider identity and work from the keyboard', async ({ page, appointments }) => {
  appointments.past = []
  await page.goto('/appointments')
  const card = page.getByRole('link', { name: new RegExp(SERVICE) })
  await expect(card).toBeVisible()
  await expect(card).toHaveAccessibleName(/Confirmed/)
  await expect(card).toHaveAccessibleName(new RegExp(String(new Date(appointments.upcoming[0].scheduledAt).getUTCFullYear())))
  await expect(card).toContainText(BRAND)
  await expect(card).toContainText(VENUE)
  await expect(card).toHaveAttribute('href', `/appointments/${CONFIRMED}`)
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/appointments/${CONFIRMED}$`))
  await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
})

appointmentTest('Romanian composite titles use Romanian additional-item copy', async ({ page, appointments }) => {
  appointments.upcoming[0].additionalItemsCount = 2
  appointments.past = []
  await page.goto('/ro/appointments')
  const card = page.getByRole('link', { name: new RegExp(SERVICE) })
  await expect(card).toContainText('+ încă 2')
  await expect(card).not.toContainText('more')
  await expect(card).toHaveAccessibleName(/Confirmată/)
})

appointmentTest('mobile and tablet expose cancellation, rescheduling, calling and reviews', async ({ page }) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await openDetail(page)
    await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reschedule', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Call', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Call', exact: true })).toHaveAttribute('href', 'tel:+40700000201')
    await openDetail(page, COMPLETED)
    await expect(page.getByRole('button', { name: 'Leave a review', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

appointmentTest('bundle details retain saved inclusions, descriptions and the recorded booking price', async ({ page, appointments }) => {
  appointments.details[CONFIRMED].items = [{
    type: 'bundle', name: 'Saved care package', description: 'Saved package description',
    bundleId: null, bundleUuid: null, duration: 60, price: 12000, startOffsetMinutes: 0,
    services: [{ name: 'Saved wash', duration: 20, price: 5000 }, { name: 'Saved cut', duration: 40, price: 10000 }],
  }]
  await openDetail(page)
  await expect(page.getByText('Included services', { exact: true })).toBeVisible()
  await expect(page.getByText('Saved wash', { exact: true })).toBeVisible()
  await expect(page.getByText('Saved cut', { exact: true })).toBeVisible()
  await expect(page.getByText('Saved package description', { exact: true })).toBeVisible()
  await expect(page.getByText('Total', { exact: true })).toBeVisible()
})

for (const locale of ['en', 'ro'] as const) {
  appointmentTest(`${locale} appointment policies combine only matching enabled rules`, async ({ page, appointments }) => {
    const copy = locale === 'ro' ? {
      combinedTitle: 'Anulare și reprogramare',
      combinedZero: 'Poți anula sau reprograma online până la ora programării.',
      combinedHour: 'Poți anula sau reprograma online cu cel puțin 1 oră înainte de programare.',
      cancellation: 'Anulare', rescheduling: 'Reprogramare',
      cancellationHour: 'Poți anula online cu cel puțin 1 oră înainte de programare.',
      rescheduleHour: 'Poți reprograma online cu cel puțin 1 oră înainte de programare.',
      rescheduleTwoHours: 'Poți reprograma online cu cel puțin 2 ore înainte de programare.',
      zero: 'Disponibilă online până la începerea programării.',
    } : {
      combinedTitle: 'Cancellation and rescheduling',
      combinedZero: 'You can cancel or reschedule online before your appointment starts.',
      combinedHour: 'You can cancel or reschedule online at least 1 hour before your appointment.',
      cancellation: 'Cancellation', rescheduling: 'Rescheduling',
      cancellationHour: 'Cancel online at least 1 hour before your appointment.',
      rescheduleHour: 'Reschedule online at least 1 hour before your appointment.',
      rescheduleTwoHours: 'Reschedule online at least 2 hours before your appointment.',
      zero: 'Available online until the appointment starts.',
    }
    const scenarios = [
      { name: 'equal zero notice', cancel: true, reschedule: true, cancellationMinutes: 0, rescheduleMinutes: 0,
        combined: copy.combinedZero, terms: [], definitions: [] },
      { name: 'equal positive notice', cancel: true, reschedule: true, cancellationMinutes: 60, rescheduleMinutes: 60,
        combined: copy.combinedHour, terms: [], definitions: [] },
      { name: 'different positive notice', cancel: true, reschedule: true, cancellationMinutes: 60, rescheduleMinutes: 120,
        terms: [copy.cancellation, copy.rescheduling], definitions: [copy.cancellationHour, copy.rescheduleTwoHours] },
      { name: 'zero differs from positive notice', cancel: true, reschedule: true, cancellationMinutes: 0, rescheduleMinutes: 60,
        terms: [copy.cancellation, copy.rescheduling], definitions: [copy.zero, copy.rescheduleHour] },
      { name: 'rescheduling disabled despite equal notice', cancel: true, reschedule: false, cancellationMinutes: 60, rescheduleMinutes: 60,
        terms: [copy.cancellation], definitions: [copy.cancellationHour] },
      { name: 'cancellation disabled despite equal notice', cancel: false, reschedule: true, cancellationMinutes: 60, rescheduleMinutes: 60,
        terms: [copy.rescheduling], definitions: [copy.rescheduleHour] },
      { name: 'both actions disabled', cancel: false, reschedule: false, cancellationMinutes: 60, rescheduleMinutes: 60,
        terms: [], definitions: [] },
      { name: 'location missing', cancel: true, reschedule: true, cancellationMinutes: 60, rescheduleMinutes: 60,
        missingLocation: true, terms: [], definitions: [] },
    ]
    for (const scenario of scenarios) {
      await test.step(scenario.name, async () => {
        const detail = detailFixture()
        if (scenario.missingLocation) detail.location = null
        else Object.assign(detail.location!, {
          allowCustomerCancellation: scenario.cancel,
          allowCustomerReschedule: scenario.reschedule,
          cancellationWindowMinutes: scenario.cancellationMinutes,
          rescheduleWindowMinutes: scenario.rescheduleMinutes,
        })
        appointments.details[CONFIRMED] = detail
        await page.goto(`${locale === 'ro' ? '/ro' : ''}/appointments/${CONFIRMED}`)
        await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
        const policies = page.locator('section[aria-labelledby="appointment-policy-title"]')
        if (scenario.missingLocation || (!scenario.cancel && !scenario.reschedule)) {
          await expect(policies).toHaveCount(0)
        } else if (scenario.combined) {
          await expect(policies.getByRole('heading', { name: copy.combinedTitle, exact: true })).toBeVisible()
          await expect(policies.getByText(scenario.combined, { exact: true })).toBeVisible()
          await expect(policies.getByRole('term')).toHaveCount(0)
        } else {
          await expect(policies.getByRole('term')).toHaveText(scenario.terms)
          await expect(policies.getByRole('definition')).toHaveText(scenario.definitions)
          await expect(policies.getByText(copy.combinedZero, { exact: true })).toHaveCount(0)
          await expect(policies.getByText(copy.combinedHour, { exact: true })).toHaveCount(0)
        }
      })
    }
    expect(appointments.mutations).toEqual([])
  })
}

appointmentTest('historic venue and professional snapshots remain visible after live records disappear', async ({ page }) => {
  await openDetail(page, HISTORICAL)
  await expect(page.getByText(VENUE, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Saved appointment address 12', { exact: true })).toBeVisible()
  await expect(page.getByText(PERSON, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Venue details saved with this appointment', { exact: true })).toBeVisible()
  await expect(page.getByText('Professional details saved with this appointment', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reschedule', exact: true })).toHaveCount(0)
})

const PROFILE_SERVICE = 'Current appointment-location service'
const OTHER_VENUE_SERVICE = 'Different-location service'
const OTHER_BUSINESS_SERVICE = 'Different-business service'

async function installAppointmentProfileRequests(context: BrowserContext) {
  const service = (name: string, priceAmountMinor: number) => ({
    id: 41, uuid: 'fixture-current-service', name, description: null,
    priceAmountMinor, duration: 45, categoryId: null, category: null, displayOrder: 0,
  })
  const location = (id: number, name: string, serviceName: string, price: number) => ({
    id, name, address: `Current ${name} address`, latitude: null, longitude: null,
    timezone: zone, featuredImage: null, averageRating: null, totalReviews: 0,
    allowOnlineBooking: true, services: [service(serviceName, price)],
  })
  // The professional works at multiple businesses and locations. Their menus
  // have different prices, and the appointment's venue is deliberately last.
  const bookingContext: TeamMemberBookingContext = {
    teamMember: { id: 301, firstName: 'Mara', lastName: 'Appointment', profileImage: null },
    businesses: [
      { id: 102, name: 'Other appointment business', listingId: 902, businessCurrency: 'EUR', logo: null,
        locations: [location(203, 'Other-business venue', OTHER_BUSINESS_SERVICE, 99000)] },
      { id: 101, name: BRAND, listingId: 901, businessCurrency: 'RON', logo: null,
        locations: [location(202, 'Other appointment location', OTHER_VENUE_SERVICE, 88000),
          location(201, VENUE, PROFILE_SERVICE, 15000)] },
    ],
  }
  const profile: TeamMemberProfile = {
    id: 301, uuid: 'fixture-mara', firstName: 'Mara', lastName: 'Appointment', profileImage: null,
    yearsOfExperience: 5, visitsCompleted: 12, memberSince: '2022-01-01T00:00:00Z',
    about: { displayName: PERSON, professionalTitle: 'Stylist', aboutMe: 'Current professional biography.',
      interests: [], languages: [], socialLinks: {} },
    services: [], portfolio: [], reviews: [], reviewStats: { totalCount: 0, averageRating: null },
  }
  const state = { bookingContext, profileReads: 0, contextReads: 0,
    calendars: [] as Record<string, unknown>[], businessNavigations: [] as string[] }
  await context.route('**/marketplace/public/team-member/301', (route) => {
    state.profileReads += 1
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(profile) })
  })
  await context.route('**/marketplace/public/team-member/301/booking-context', (route) => {
    state.contextReads += 1
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: state.bookingContext }) })
  })
  await context.route('**/marketplace/customer/favorite/professionals', (route) =>
    route.fulfill({ contentType: 'application/json', body: '[]' }))
  await context.route('**/marketplace/public/booking/calendar', (route) => {
    const body = route.request().postDataJSON()
    state.calendars.push(body)
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      data: { ...calendarFixture(body.startDate), totalDuration: 45, totalPrice: 15000 },
    }) })
  })
  // Fail locally before any location page can start its server-side fetch.
  await context.route('**/business/**', (route) => {
    state.businessNavigations.push(route.request().url())
    return route.abort('blockedbyclient')
  })
  return state
}

appointmentTest('appointment professional profile opens in place with its current venue and restores focus on close', async ({ page, context, appointments }) => {
  const profile = await installAppointmentProfileRequests(context)
  await openDetail(page)
  const originalUrl = page.url()
  const opener = page.getByRole('main').getByRole('button').filter({ hasText: PERSON })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: PERSON, exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Current professional biography.', { exact: true })).toBeVisible()
  await expect(dialog.getByText(PROFILE_SERVICE, { exact: true })).toBeVisible()
  await expect(dialog.getByText('RON 150.00', { exact: false }).first()).toBeVisible()
  await expect(dialog.getByRole('button', { name: new RegExp(`${BRAND}.*${VENUE}`) })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByText(OTHER_VENUE_SERVICE, { exact: true })).toHaveCount(0)
  await expect(dialog.getByText(OTHER_BUSINESS_SERVICE, { exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: /Other appointment|Other-business venue/ })).toHaveCount(0)
  expect(page.url()).toBe(originalUrl)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(page.url()).toBe(originalUrl)
  expect(profile.businessNavigations).toEqual([])
  expect(profile.calendars).toEqual([])
  expect(appointments.mutations).toEqual([])
})

appointmentTest('appointment professional booking starts a new booking for the same staff and current venue', async ({ page, context, appointments }) => {
  const profile = await installAppointmentProfileRequests(context)
  await openDetail(page)
  const originalUrl = page.url()
  await page.getByRole('main').getByRole('button').filter({ hasText: PERSON }).click()
  const dialog = page.getByRole('dialog', { name: PERSON, exact: true })
  await dialog.getByRole('button', { name: `Add ${PROFILE_SERVICE}`, exact: true }).click()
  await dialog.getByRole('button', { name: 'Book with Mara', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect.poll(() => profile.calendars.length).toBe(1)
  expect(profile.calendars[0]).toMatchObject({ businessId: 101, locationId: 201,
    services: [{ serviceId: 41, teamMemberId: 301 }] })
  expect(profile.calendars[0]).not.toHaveProperty('uuid')
  expect(appointments.calendars).toEqual([])
  expect(appointments.mutations).toEqual([])
  expect(profile.businessNavigations).toEqual([])
  expect(page.url()).toBe(originalUrl)
})

appointmentTest('appointment professional profile never substitutes another business or location when its venue is unavailable', async ({ page, context, appointments }) => {
  const profile = await installAppointmentProfileRequests(context)
  profile.bookingContext.businesses[1].locations = profile.bookingContext.businesses[1].locations.filter((venue) => venue.id !== 201)
  await openDetail(page)
  const originalUrl = page.url()
  await page.getByRole('main').getByRole('button').filter({ hasText: PERSON }).click()
  const dialog = page.getByRole('dialog', { name: PERSON, exact: true })
  await expect(dialog.getByText('Current professional biography.', { exact: true })).toBeVisible()
  await expect.poll(() => profile.contextReads).toBe(1)
  await expect(dialog.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(dialog.getByText("Online booking isn't available for this professional at this location.", { exact: true })).toBeVisible()
  await expect(dialog.getByText(OTHER_VENUE_SERVICE, { exact: true })).toHaveCount(0)
  await expect(dialog.getByText(OTHER_BUSINESS_SERVICE, { exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Book with Mara', exact: true })).toHaveCount(0)
  expect(profile.calendars).toEqual([])
  expect(profile.businessNavigations).toEqual([])
  expect(appointments.mutations).toEqual([])
  expect(page.url()).toBe(originalUrl)
})

appointmentTest('appointment professional snapshots and missing live locations do not offer profile actions', async ({ page, context, appointments }) => {
  const profile = await installAppointmentProfileRequests(context)
  await openDetail(page, HISTORICAL)
  await expect(page.getByText('Professional details saved with this appointment', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByRole('button').filter({ hasText: PERSON })).toHaveCount(0)
  appointments.details[CONFIRMED].location = null
  await openDetail(page)
  await expect(page.getByRole('main').getByText(PERSON, { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByRole('button').filter({ hasText: PERSON })).toHaveCount(0)
  await expect(page.getByRole('main').getByRole('link', { name: /View profile/ })).toHaveCount(0)
  expect(profile.profileReads).toBe(0)
  expect(profile.contextReads).toBe(0)
  expect(profile.businessNavigations).toEqual([])
  expect(appointments.mutations).toEqual([])
})

appointmentTest('saved reviews identify their venue and professional subjects', async ({ page }) => {
  await openDetail(page, REVIEWED)
  await expect(page.getByText(`Venue · ${VENUE}`, { exact: true })).toBeVisible()
  await expect(page.getByText(`Professional · ${PERSON}`, { exact: true })).toBeVisible()
  await expect(page.getByText('Excellent saved venue review', { exact: true })).toBeVisible()
  await expect(page.getByText('Excellent saved professional review', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Leave a review', exact: true })).toHaveCount(0)
})

for (const target of ['venue', 'professional'] as const) {
  appointmentTest(`review ${target} comments require their own rating before any review is submitted`, async ({ page, appointments }) => {
    await openDetail(page, COMPLETED)
    await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
    const venue = dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
    const professional = dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
    const comment = `Please preserve this ${target} feedback.`
    // Professional feedback is collected first, then location feedback.
    if (target === 'venue') {
      await professional.getByRole('button', { name: '5 stars', exact: true }).click()
      await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
    }
    const commentTarget = target === 'venue' ? venue : professional
    await commentTarget.getByRole('textbox', { name: 'Comment (optional)', exact: true }).fill(comment)
    await dialog.getByRole('button', { name: target === 'venue' ? 'Post review' : 'Continue', exact: true }).click()
    await expect(commentTarget.getByText('Choose a star rating for this comment.', { exact: true })).toBeVisible()
    await expect(commentTarget.getByRole('button', { name: '1 stars', exact: true })).toBeFocused()
    expect(appointments.mutations).toEqual([])
    await expect(commentTarget.getByRole('textbox')).toHaveValue(comment)

    await commentTarget.getByRole('button', { name: '4 stars', exact: true }).click()
    if (target === 'professional') {
      await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
      await venue.getByRole('button', { name: '5 stars', exact: true }).click()
    }
    await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations).toHaveLength(1)
    expect(appointments.mutations[0].path).toMatch(/\/customer\/reviews$/)
    expect(appointments.mutations[0].body).toEqual({
      appointmentUuid: COMPLETED,
      locationRating: target === 'venue' ? 4 : 5,
      ...(target === 'venue' ? { locationComment: comment } : {}),
      professionalRatings: [{ professionalId: 301, rating: target === 'professional' ? 4 : 5,
        ...(target === 'professional' ? { comment } : {}) }],
    })
  })
}

for (const locale of ['en', 'ro'] as const) {
  appointmentTest(`shared textarea ${locale} review comments reject markup on each subject before advancing or posting`, async ({ page, appointments }) => {
    const names = locale === 'ro'
      ? { open: 'Lasă o recenzie', title: 'Cum a fost?', rate: 'Evaluează', stars: 'stele',
          next: 'Continuă', back: 'Înapoi', post: 'Publică recenzia', counter: '0 / 2.000 de caractere',
          unsafe: 'Elimină codul HTML sau scripturile din text.' }
      : { open: 'Leave a review', title: 'How was it?', rate: 'Rate', stars: 'stars',
          next: 'Continue', back: 'Back', post: 'Post review', counter: '0 / 2,000 characters',
          unsafe: 'Remove HTML tags or scripts from your text.' }
    await page.goto(`/${locale}/appointments/${COMPLETED}`)
    await page.getByRole('button', { name: names.open, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: names.title, exact: true })
    const professional = dialog.getByRole('group', { name: `${names.rate} ${PERSON}`, exact: true })
    const venue = dialog.getByRole('group', { name: `${names.rate} ${VENUE}`, exact: true })
    const firstComment = professional.getByRole('textbox')
    await expect(dialog.getByText(names.counter, { exact: true })).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await professional.getByRole('button', { name: `4 ${names.stars}`, exact: true }).click()
    const unsafeProfessional = '<script>alert("not allowed")</script>'
    await firstComment.fill(unsafeProfessional)
    await expectAssociatedFieldError(firstComment, dialog, names.unsafe)
    await dialog.getByRole('button', { name: names.next, exact: true }).click()
    await expect(firstComment).toBeFocused()
    await expect(firstComment).toHaveValue(unsafeProfessional)
    await expect(venue).toHaveCount(0)
    expect(appointments.mutations).toEqual([])

    const professionalFeedback = '  Mulțumesc, Mara! 🙂\nFoarte atentă — 10/10.  '
    await firstComment.fill(professionalFeedback)
    await expect(firstComment).not.toHaveAttribute('aria-invalid', 'true')
    await dialog.getByRole('button', { name: names.next, exact: true }).click()
    const venueComment = venue.getByRole('textbox')
    await expect(dialog.getByText(names.counter, { exact: true })).toBeVisible()
    await venue.getByRole('button', { name: `5 ${names.stars}`, exact: true }).click()
    const unsafeVenue = 'javascript:alert("not allowed")'
    await venueComment.fill(unsafeVenue)
    await expectAssociatedFieldError(venueComment, dialog, names.unsafe)
    await dialog.getByRole('button', { name: names.post, exact: true }).click()
    await expect(venueComment).toBeFocused()
    await expect(venueComment).toHaveValue(unsafeVenue)
    expect(appointments.mutations).toEqual([])
    await dialog.getByRole('button', { name: names.back, exact: true }).click()
    await expect(firstComment).toHaveValue(professionalFeedback)
    await dialog.getByRole('button', { name: names.next, exact: true }).click()
    await expect(venueComment).toHaveValue(unsafeVenue)
    const venueFeedback = '  Spațiu plăcut & liniștit.\nPreț < 200 RON.  '
    await venueComment.fill(venueFeedback)
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await dialog.getByRole('button', { name: names.post, exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
      appointmentUuid: COMPLETED, locationRating: 5, locationComment: venueFeedback.trim(),
      professionalRatings: [{ professionalId: 301, rating: 4, comment: professionalFeedback.trim() }],
    }])
  })
}

for (const method of ['close button', 'Escape', 'backdrop'] as const) {
  appointmentTest(`review ${method} directly closes dirty first and final steps and clears drafts without posting`, async ({ page, appointments }) => {
    const romanian = method === 'Escape'
    const names = romanian
      ? { open: 'Lasă o recenzie', title: 'Cum a fost?', rate: 'Evaluează', stars: 'stele',
          next: 'Continuă', skip: 'Omite', post: 'Publică recenzia', close: 'Închide' }
      : { open: 'Leave a review', title: 'How was it?', rate: 'Rate', stars: 'stars',
          next: 'Continue', skip: 'Skip', post: 'Post review', close: 'Close' }
    await page.setViewportSize({ width: romanian ? 320 : 1440, height: 760 })

    for (const step of ['first', 'final'] as const) {
      await page.goto(`/${romanian ? 'ro' : 'en'}/appointments/${COMPLETED}`)
      const openReview = page.getByRole('button', { name: names.open, exact: true })
      await openReview.click()
      const dialog = page.getByRole('dialog', { name: names.title, exact: true })
      const professional = dialog.getByRole('group', { name: `${names.rate} ${PERSON}`, exact: true })
      const venue = dialog.getByRole('group', { name: `${names.rate} ${VENUE}`, exact: true })
      await professional.getByRole('button', { name: `5 ${names.stars}`, exact: true }).click()
      await professional.getByRole('textbox').fill('Unposted professional draft.')
      if (step === 'final') {
        await dialog.getByRole('button', { name: names.next, exact: true }).click()
        await venue.getByRole('button', { name: `4 ${names.stars}`, exact: true }).click()
        await venue.getByRole('textbox').fill('Unposted location draft.')
      }

      if (method === 'close button') {
        await dialog.getByRole('button', { name: names.close, exact: true }).click()
      } else if (method === 'Escape') {
        await page.keyboard.press('Escape')
      } else {
        await page.locator('.zv-sheet-backdrop').click({ position: { x: 5, y: 5 } })
      }
      await expect(page.getByRole('alertdialog')).toHaveCount(0)
      await expect(dialog).toHaveCount(0)
      await expect(page.locator('.zv-sheet-backdrop')).toHaveCount(0)
      await expect(openReview).toBeFocused()
      expect(appointments.mutations).toEqual([])

      // Reopening starts at the first professional with both drafts reset.
      await openReview.click()
      await expect(professional).toBeVisible()
      await expect(venue).toHaveCount(0)
      await expect(professional.getByRole('textbox')).toHaveValue('')
      await expect(professional.locator('button[aria-pressed="true"]')).toHaveCount(0)
      await dialog.getByRole('button', { name: names.skip, exact: true }).click()
      await expect(venue.getByRole('textbox')).toHaveValue('')
      await expect(venue.locator('button[aria-pressed="true"]')).toHaveCount(0)
      await expect(dialog.getByRole('button', { name: names.post, exact: true })).toBeDisabled()
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      expect(appointments.mutations).toEqual([])
    }
  })
}

appointmentTest('review Post during the close transition cannot submit the discarded final draft', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  const openReview = page.getByRole('button', { name: 'Leave a review', exact: true })
  await openReview.click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  await dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
    .getByRole('button', { name: '5 stars', exact: true }).click()
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
    .getByRole('button', { name: '4 stars', exact: true }).click()
  await dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
    .getByRole('textbox').fill('Final draft must be discarded when closing.')
  const publish = dialog.getByRole('button', { name: 'Post review', exact: true })
  await expect(publish).toBeEnabled()
  const publishNode = await publish.elementHandle()
  // Both events run in one task before React renders the closing state.
  await dialog.getByRole('button', { name: 'Close', exact: true }).evaluate((element, post) => {
    const closeButton = element as HTMLButtonElement
    const postButton = post as HTMLButtonElement
    closeButton.click()
    postButton.click()
  }, publishNode)
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(openReview).toBeFocused()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('review steps retain each subject draft when navigating back and submit together', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  const professional = dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
  const venue = dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
  await expect(professional).toBeVisible()
  await expect(venue).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Post review', exact: true })).toHaveCount(0)
  await professional.getByRole('button', { name: '4 stars', exact: true }).click()
  await professional.getByRole('textbox', { name: 'Comment (optional)', exact: true }).fill('  Professional feedback.  ')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(professional).toHaveCount(0)
  await venue.getByRole('button', { name: '5 stars', exact: true }).click()
  await venue.getByRole('textbox', { name: 'Comment (optional)', exact: true }).fill('  Location feedback.  ')

  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(professional.getByRole('textbox')).toHaveValue('  Professional feedback.  ')
  await expect(professional.getByRole('button', { name: '4 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(venue.getByRole('textbox')).toHaveValue('  Location feedback.  ')
  await expect(venue.getByRole('button', { name: '5 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(appointments.mutations).toEqual([])
  await expect(dialog.getByText('You can post reviews for this appointment only once.', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Include everyone you want to review before posting.', { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
    appointmentUuid: COMPLETED, locationRating: 5, locationComment: 'Location feedback.',
    professionalRatings: [{ professionalId: 301, rating: 4, comment: 'Professional feedback.' }],
  }])
})

appointmentTest('double-clicking review Continue reaches the location without posting until an intentional final click', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  await dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
    .getByRole('button', { name: '4 stars', exact: true }).click()
  await dialog.getByRole('button', { name: 'Continue', exact: true }).dblclick()

  await expect(dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })).toBeVisible()
  const publish = dialog.getByRole('button', { name: 'Post review', exact: true })
  await expect(publish).toBeVisible()
  await expect(publish).toBeEnabled()
  expect(appointments.mutations).toEqual([])

  await publish.click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
    appointmentUuid: COMPLETED,
    professionalRatings: [{ professionalId: 301, rating: 4 }],
  }])
})

appointmentTest('three-subject review keeps both professional drafts separate and posts them with the location once', async ({ page, appointments }) => {
  const secondPerson = 'Alex Appointment'
  const detail = appointments.details[COMPLETED]
  detail.reviews.professionals.push({ staffId: 302, staffUuid: 'fixture-alex', canLeaveReview: true, review: null })
  detail.staff_users!.push({ teamMemberId: 302, uuid: 'fixture-alex', firstName: 'Alex', lastName: 'Appointment',
    profileImage: null, professionalTitle: 'Colourist', displayName: secondPerson, averageRating: null, totalReviews: 0 })
  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  const first = dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
  const second = dialog.getByRole('group', { name: `Rate ${secondPerson}`, exact: true })
  const venue = dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
  await expect(first).toBeVisible()
  await expect(second).toHaveCount(0)
  await expect(venue).toHaveCount(0)
  await first.getByRole('button', { name: '3 stars', exact: true }).click()
  await first.getByRole('textbox').fill('Mara professional feedback.')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(second).toBeVisible()
  await expect(venue).toHaveCount(0)
  await second.getByRole('button', { name: '4 stars', exact: true }).click()
  await second.getByRole('textbox').fill('Alex professional feedback.')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await venue.getByRole('button', { name: '5 stars', exact: true }).click()
  await venue.getByRole('textbox').fill('Location feedback.')

  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(second.getByRole('textbox')).toHaveValue('Alex professional feedback.')
  await expect(second.getByRole('button', { name: '4 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(first.getByRole('textbox')).toHaveValue('Mara professional feedback.')
  await expect(first.getByRole('button', { name: '3 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(second.getByRole('textbox')).toHaveValue('Alex professional feedback.')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(venue.getByRole('textbox')).toHaveValue('Location feedback.')
  await expect(venue.getByRole('button', { name: '5 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(appointments.mutations).toEqual([])
  await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
    appointmentUuid: COMPLETED, locationRating: 5, locationComment: 'Location feedback.',
    professionalRatings: [
      { professionalId: 301, rating: 3, comment: 'Mara professional feedback.' },
      { professionalId: 302, rating: 4, comment: 'Alex professional feedback.' },
    ],
  }])
})

for (const target of ['venue', 'professional'] as const) {
  appointmentTest(`review steps can submit only the ${target} and omit an untouched subject`, async ({ page, appointments }) => {
    await openDetail(page, COMPLETED)
    await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
    if (target === 'professional') {
      await dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
        .getByRole('button', { name: '4 stars', exact: true }).click()
      await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
    } else {
      await dialog.getByRole('button', { name: 'Skip', exact: true }).click()
      await expect(dialog.getByRole('button', { name: 'Post review', exact: true })).toBeDisabled()
      await dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
        .getByRole('button', { name: '5 stars', exact: true }).click()
    }
    await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
      appointmentUuid: COMPLETED,
      ...(target === 'venue' ? { locationRating: 5 }
        : { professionalRatings: [{ professionalId: 301, rating: 4 }] }),
    }])
  })
}

appointmentTest('location-only reviews omit step controls and the professional submission instruction', async ({ page, appointments }) => {
  const detail = appointments.details[COMPLETED]
  detail.staff_users = []
  detail.staffSnapshot = []
  detail.reviews.professionals = []
  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  const venue = dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
  await expect(venue).toBeVisible()
  await expect(dialog.getByRole('button', { name: /^(Back|Continue|Skip)$/ })).toHaveCount(0)
  await expect(dialog.getByText('You can post reviews for this appointment only once.', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Include everyone you want to review before posting.', { exact: false })).toHaveCount(0)
  await expect(dialog.getByText('Reviews are public. Your first name, last initial and profile photo, if available, are shown.', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Tap to rate', { exact: true })).toHaveCount(0)
  const comment = venue.getByRole('textbox', { name: 'Comment (optional)', exact: true })
  expect(await comment.getAttribute('placeholder')).toBeNull()
  await expect(venue.getByText('0 / 2,000 characters', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Post review', exact: true })).toBeDisabled()
  await venue.getByRole('button', { name: '5 stars', exact: true }).click()
  await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations.map((mutation) => mutation.body)).toEqual([{
    appointmentUuid: COMPLETED, locationRating: 5,
  }])
})

appointmentTest('review posting blocks duplicate actions and dismissal, then preserves all drafts after failure', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  const professional = dialog.getByRole('group', { name: `Rate ${PERSON}`, exact: true })
  const venue = dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
  await professional.getByRole('button', { name: '4 stars', exact: true }).click()
  await professional.getByRole('textbox').fill('Professional draft survives.')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  await venue.getByRole('button', { name: '5 stars', exact: true }).click()
  await venue.getByRole('textbox').fill('Location draft survives.')
  appointments.reviewGate = gate()
  appointments.failReviews = true
  const publish = dialog.getByRole('button', { name: 'Post review', exact: true })
  // Two events in one task also exercise the synchronous in-flight guard.
  await publish.evaluate((element) => {
    const button = element as HTMLButtonElement
    button.click()
    button.click()
  })
  await expect.poll(() => appointments.mutations.length).toBe(1)
  await expect(publish).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Back', exact: true })).toBeDisabled()
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeDisabled()
  await expect(venue.getByRole('textbox')).toBeDisabled()
  await expect(venue.getByRole('button', { name: '5 stars', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.mouse.click(5, 5)
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  appointments.reviewGate.release()
  const failure = page.locator('[data-toast-host]').getByRole('alert').filter({ hasText: "We’re having a technical problem. Try again in a moment." })
  await expect(failure).toBeVisible()
  await expect(venue.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true')
  expect(await failure.evaluate((element) => element.closest('[aria-hidden="true"]'))).toBeNull()
  const dismiss = failure.getByRole('button', { name: 'Dismiss', exact: true })
  await dismiss.focus()
  await expect(dismiss).toBeFocused()
  await dismiss.click()
  await expect(failure).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(venue.getByRole('textbox')).toHaveValue('Location draft survives.')
  await expect(venue.getByRole('button', { name: '5 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(professional.getByRole('textbox')).toHaveValue('Professional draft survives.')
  await expect(professional.getByRole('button', { name: '4 stars', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click()
  appointments.reviewGate = null
  appointments.failReviews = false
  await publish.click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations).toHaveLength(2)
  expect(appointments.mutations[1].body).toEqual(appointments.mutations[0].body)
})

for (const path of ['/appointments', `/appointments/${CONFIRMED}`]) {
  appointmentTest(`session verification outages remain retryable on ${path}`, async ({ page, appointments }) => {
    appointments.failAuthRefresh = true
    await page.goto(path)
    const main = page.getByRole('main')
    await expect(main.getByText('We couldn’t verify your session. Try again.', { exact: true })).toBeVisible()
    await expect(main.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0)
    expect(appointments.listReads).toEqual([])
    expect(appointments.detailReads).toEqual([])
    appointments.failAuthRefresh = false
    await main.getByRole('button', { name: 'Try again', exact: true }).click()
    if (path === '/appointments') {
      await expect(main.getByRole('link', { name: new RegExp(SERVICE) }).first()).toBeVisible()
    } else {
      await expect(main.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
    }
    expect(appointments.authRefreshReads).toBeGreaterThan(1)
    await expect(main.getByText('We couldn’t verify your session. Try again.', { exact: true })).toHaveCount(0)
  })
}

appointmentTest('an initial detail failure uses the blocking page and Retry recovers the appointment', async ({ page, appointments }) => {
  appointments.failDetails.add(CONFIRMED)
  await page.goto(`/appointments/${CONFIRMED}`)
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: 'We couldn’t load this appointment', exact: true, level: 1 })).toBeVisible()
  await expect(main.getByText('Please try again in a moment.', { exact: true })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Back to appointments', exact: true })).toHaveAttribute('href', '/appointments')
  await expect(main.getByRole('heading', { name: SERVICE, exact: true })).toHaveCount(0)
  await expect(page.locator('[data-toast-host]').getByRole('alert')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expectReachableControl(main.getByRole('button', { name: 'Try again', exact: true }), main)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  appointments.failDetails.delete(CONFIRMED)
  await main.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(main.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
  await expect(main.getByRole('heading', { name: 'We couldn’t load this appointment', exact: true })).toHaveCount(0)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('a missing appointment uses the blocking page with a return action and no Retry', async ({ page, appointments }) => {
  await page.goto('/appointments/fixture-missing')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: 'Appointment not found', exact: true, level: 1 })).toBeVisible()
  await expect(main.getByRole('button', { name: 'Try again', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-toast-host]').getByRole('alert')).toHaveCount(0)
  await main.getByRole('link', { name: 'Back to appointments', exact: true }).click()
  await expect(main.getByRole('link', { name: new RegExp(SERVICE) }).first()).toBeVisible()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('detail refresh failures keep the appointment usable and announce each outage once', async ({ page, appointments }) => {
  await page.clock.install()
  await openDetail(page)
  const message = "We couldn’t refresh your appointment. The last saved details are shown."
  const failure = page.locator('[data-toast-host]').getByRole('alert').filter({ hasText: message })
  appointments.failDetails.add(CONFIRMED)
  let reads = appointments.detailReads.length
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => appointments.detailReads.length).toBeGreaterThan(reads)
  await expect(failure).toBeVisible()
  await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toBeEnabled()

  // A customer explicitly retrying needs fresh feedback if that retry also
  // fails, even though automatic requests in the same outage stay quiet.
  const firstNotice = await failure.elementHandle()
  reads = appointments.detailReads.length
  await failure.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect.poll(() => appointments.detailReads.length).toBeGreaterThan(reads)
  await expect.poll(() => firstNotice!.evaluate((element) => element.isConnected)).toBe(false)
  await expect(failure).toBeVisible()

  // Let the first notice finish, then fail another automatic read. Repeated
  // polling must not leave a queue of the same outage notification.
  await page.clock.runFor(6_500)
  await expect(failure).toHaveCount(0)
  reads = appointments.detailReads.length
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => appointments.detailReads.length).toBeGreaterThan(reads)
  await expect(failure).toHaveCount(0)

  appointments.failDetails.delete(CONFIRMED)
  appointments.details[CONFIRMED].primaryItemName = 'Recovered appointment details'
  appointments.details[CONFIRMED].bookedItemName = 'Recovered appointment details'
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('heading', { name: 'Recovered appointment details', exact: true, level: 1 })).toBeVisible()
  appointments.failDetails.add(CONFIRMED)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(failure).toBeVisible()
  appointments.failDetails.delete(CONFIRMED)
  await failure.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(failure).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Recovered appointment details', exact: true, level: 1 })).toBeVisible()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('initial list failures block the page while a failed refresh preserves loaded appointments', async ({ page, appointments }) => {
  await page.clock.install()
  appointments.failLists = true
  await page.goto('/appointments')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: 'We couldn’t load your appointments', exact: true, level: 1 })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Explore', exact: true })).toBeVisible()
  await expect(page.locator('[data-toast-host]').getByRole('alert')).toHaveCount(0)
  appointments.failLists = false
  await main.getByRole('button', { name: 'Try again', exact: true }).click()
  const card = main.getByRole('link', { name: new RegExp(SERVICE) }).first()
  await expect(card).toBeVisible()

  appointments.failLists = true
  const reads = appointments.listReads.length
  await page.clock.runFor(11_000)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => appointments.listReads.length).toBeGreaterThan(reads)
  const failure = page.locator('[data-toast-host]').getByRole('alert').filter({
    hasText: "We couldn’t refresh your appointments. The last saved details are shown.",
  })
  await expect(failure).toBeVisible()
  await expect(card).toBeVisible()
  await expect(filter(page, 'Past')).toBeEnabled()
  await expect(main.getByRole('heading', { name: 'We couldn’t load your appointments', exact: true })).toHaveCount(0)
  appointments.failLists = false
  await failure.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(failure).toHaveCount(0)
  await expect(card).toBeVisible()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('posting a review supersedes an older detail read even when the new refresh fails', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  appointments.detailGate = { uuid: COMPLETED, value: structuredClone(appointments.details[COMPLETED]), gate: gate(), used: false }
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect.poll(() => appointments.detailGate!.used).toBe(true)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'How was it?', exact: true })
  await dialog.getByRole('button', { name: 'Skip', exact: true }).click()
  await dialog.getByRole('group', { name: `Rate ${VENUE}`, exact: true })
    .getByRole('button', { name: '5 stars', exact: true }).click()
  appointments.failDetails.add(COMPLETED)
  await dialog.getByRole('button', { name: 'Post review', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => appointments.detailReads.filter((uuid) => uuid === COMPLETED).length).toBeGreaterThanOrEqual(3)
  await expect(page.getByRole('button', { name: 'Leave a review', exact: true })).toHaveCount(0)

  const staleResponse = page.waitForResponse((response) => response.url().endsWith(`/appointments/${COMPLETED}`) && response.status() === 200)
  appointments.detailGate.gate.release()
  await (await staleResponse).finished()
  // Let the stale JSON response reach React before asserting that its earlier
  // eligibility snapshot cannot undo the successful review submission.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect(page.getByRole('button', { name: 'Leave a review', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
  expect(appointments.mutations).toHaveLength(1)
})

appointmentTest('a failed history page keeps existing cards and lets the toast retry load the next page', async ({ page, appointments }) => {
  appointments.past = Array.from({ length: 24 }, (_, index) => listItem(detailFixture(`fixture-history-${index}`, {
    status: 'completed', primaryItemName: `History appointment ${index + 1}`, bookedItemName: `History appointment ${index + 1}`,
    scheduled_at: `${dayFromNow(-index - 1)}T12:00:00Z`, ends_at: `${dayFromNow(-index - 1)}T13:00:00Z`,
  })))
  appointments.failListOffsets.add(20)
  await page.goto('/appointments')
  await expect(page.getByRole('link', { name: /^History appointment 20,/ })).toBeVisible()
  await page.getByRole('button', { name: 'Load more', exact: true }).click()
  const failure = page.locator('[data-toast-host]').getByRole('alert').filter({ hasText: "We couldn’t load more appointments." })
  await expect(failure).toBeVisible()
  await expect(page.getByRole('link', { name: /^History appointment 20,/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toBeEnabled()
  appointments.failListOffsets.delete(20)
  await failure.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('link', { name: /^History appointment 24,/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0)
  expect(appointments.listReads.filter(({ offset }) => offset === 20)).toHaveLength(2)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('returning from a detail preserves the filter, loaded history and scroll with always-visible sections', async ({ page, appointments }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  appointments.past = Array.from({ length: 24 }, (_, index) => {
    const uuid = `fixture-past-${index}`
    const title = `Historic appointment ${index + 1}`
    const detail = detailFixture(uuid, { status: 'completed', primaryItemName: title, bookedItemName: title,
      scheduled_at: `${dayFromNow(-index - 1)}T12:00:00Z`, ends_at: `${dayFromNow(-index - 1)}T13:00:00Z` })
    appointments.details[uuid] = detail
    return listItem(detail)
  })
  await page.goto('/appointments')
  const main = page.getByRole('main')
  const upcomingHeading = main.getByRole('heading', { name: 'Upcoming', level: 2, exact: true })
  const pastHeading = main.getByRole('heading', { name: 'Past', level: 2, exact: true })
  await expect(upcomingHeading).toBeVisible()
  await expect(pastHeading).toBeVisible()
  await expect(upcomingHeading.getByRole('button')).toHaveCount(0)
  await expect(pastHeading.getByRole('button')).toHaveCount(0)
  await expect(main.locator('button[aria-controls="appointments-upcoming"], button[aria-controls="appointments-history"]')).toHaveCount(0)
  await filter(page, 'Past').click()
  await page.getByRole('button', { name: 'Load more', exact: true }).click()
  const lastCard = page.getByRole('link', { name: /^Historic appointment 24,/ })
  await expect(lastCard).toBeVisible()
  await lastCard.scrollIntoViewIfNeeded()
  const previousScroll = await page.evaluate(() => window.scrollY)
  expect(previousScroll).toBeGreaterThan(900)
  await lastCard.click()
  await expect(page.getByRole('heading', { name: 'Historic appointment 24', level: 1, exact: true })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Appointments', exact: true }).click()
  await expect(filter(page, 'Past')).toHaveAttribute('aria-pressed', 'true')
  await expect(lastCard).toBeVisible()
  await expect(page.getByRole('button', { name: 'Load more', exact: true })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(previousScroll, -1)
  await filter(page, 'All').click()
  await expect(upcomingHeading).toBeVisible()
  await expect(pastHeading).toBeVisible()
  await expect(main.getByRole('link', { name: new RegExp(SERVICE) })).toBeVisible()
  await expect(main.getByRole('link', { name: /^Historic appointment 1,/ })).toBeVisible()
  await expect(upcomingHeading.getByRole('button')).toHaveCount(0)
  await expect(pastHeading.getByRole('button')).toHaveCount(0)
})

appointmentTest('offline lists retain loaded history and stop pending filter loading until reconnection', async ({ page, context, appointments }) => {
  await page.goto('/appointments')
  await filter(page, 'Past').click()
  const main = page.getByRole('main')
  const cancelled = main.getByRole('link', { name: /Cancelled appointment fixture/ })
  await expect(cancelled).toBeVisible()
  const readsBeforeOffline = appointments.listReads.length
  await context.setOffline(true)
  await expect(page.getByRole('alert').filter({ hasText: "You’re offline. The appointments shown may not be up to date." })).toBeVisible()
  for (const name of ['All', 'Upcoming', 'Past', 'Cancelled', 'No-show']) await expect(filter(page, name)).toBeDisabled()
  await expect(cancelled).toBeVisible()
  await expect(main.locator('[aria-busy="true"]')).toHaveCount(0)
  expect(appointments.listReads).toHaveLength(readsBeforeOffline)

  await context.setOffline(false)
  await expect(filter(page, 'Cancelled')).toBeEnabled()
  await expect.poll(() => appointments.listReads.length).toBeGreaterThan(readsBeforeOffline)
  appointments.listGate = { filter: 'cancelled', gate: gate() }
  await filter(page, 'Cancelled').click()
  await expect.poll(() => appointments.listReads.some((request) => request.filter === 'cancelled')).toBe(true)
  await expect(main.locator('[aria-busy="true"]')).toBeVisible()
  await context.setOffline(true)
  await expect(main.getByRole('heading', { name: 'You’re offline', exact: true })).toBeVisible()
  await expect(main.getByText('Reconnect to load your appointments.', { exact: true })).toBeVisible()
  await expect(main.getByRole('button', { name: 'Try again', exact: true })).toBeDisabled()
  await expect(main.locator('button[aria-pressed]')).toHaveCount(0)
  await expect(main.locator('[aria-busy="true"]')).toHaveCount(0)
  await expect(main.getByText('Loading your appointments…', { exact: true })).toHaveCount(0)

  appointments.listGate.gate.release()
  appointments.listGate = null
  await context.setOffline(false)
  await expect(filter(page, 'Cancelled')).toBeEnabled()
  await expect(filter(page, 'Cancelled')).toHaveAttribute('aria-pressed', 'true')
  await expect(cancelled).toBeVisible()
})

test('appointment countdowns use the venue calendar across midnight and daylight-saving changes', () => {
  const now = new Date('2026-10-23T20:30:00Z') // Friday 23:30 in Bucharest.
  const start = '2026-10-24T22:30:00Z' // Sunday 01:30, two calendar days ahead.
  const end = '2026-10-24T23:30:00Z'
  expect(timeUntil(start, 'confirmed', deriveTense(start, end, 'confirmed', now, zone), now, zone))
    .toEqual({ kind: 'future', variant: 'days', value: 2 })

  const beforeDst = new Date('2026-10-24T12:00:00Z')
  const afterDst = '2026-10-25T13:00:00Z' // Same wall-clock time on the next day, 25 hours later.
  expect(timeUntil(afterDst, 'confirmed', 'future', beforeDst, zone))
    .toEqual({ kind: 'future', variant: 'tomorrow' })
  expect(timeUntil(start, 'confirmed', 'past', new Date(end), zone)).toBeNull()
})

appointmentTest('confirmed cancellation survives a failed background refresh and blocks pending dismissal', async ({ page, appointments }) => {
  appointments.cancelGate = gate()
  await openDetail(page)
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?', exact: true })
  await dialog.getByRole('button', { name: 'Cancel appointment', exact: true }).click()
  await expect.poll(() => appointments.mutations.length).toBe(1)
  await expect(dialog.getByRole('button', { name: 'Keep it', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  appointments.cancelGate.release()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Cancelled', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toHaveCount(0)
  await expect.poll(() => appointments.detailReads.filter((uuid) => uuid === CONFIRMED).length).toBeGreaterThan(1)
  await expect(page.getByRole('heading', { name: SERVICE, exact: true })).toBeVisible()
  expect(appointments.mutations[0].body).toEqual({ uuid: CONFIRMED })
})

appointmentTest('cancellation context shows the venue date and time across a UTC day boundary', async ({ page, appointments }) => {
  const detail = appointments.details[CONFIRMED]
  detail.scheduled_at = '2030-01-01T01:15:00Z'
  detail.ends_at = '2030-01-01T02:15:00Z'
  detail.business!.timezone = 'Europe/Bucharest'
  detail.location!.timezone = 'America/New_York'
  await openDetail(page)
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?', exact: true })
  await expect(dialog.getByText('Monday, December 31, 2029', { exact: true })).toBeVisible()
  await expect(dialog.getByText('20:15', { exact: true })).toBeVisible()
  await expect(dialog.getByText('21:15', { exact: true })).toBeVisible()
  await expect(dialog.getByText('01:15', { exact: true })).toHaveCount(0)
  await expect(dialog.getByText('03:15', { exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('Romanian cancellation shows full composite context and reachable controls at 320px', async ({ page, appointments }) => {
  const primary = 'Tratament profesional complet pentru îngrijirea și regenerarea părului'
  const additional = ['Consultație personalizată și analiză detaliată a scalpului',
    'Coafare de ocazie și finisare cu produse profesionale']
  const brand = 'Atelierul ExtraordinarPentruÎngrijirePersonalizatăȘiRăsfăț'
  const location = 'București CentrulIstoricȘiPiațaUniversității'
  const professionals = ['Maria Alexandra Popescu Ionescu', 'Alexandru Constantin Dumitrescu Georgescu']
  const detail = appointments.details[CONFIRMED]
  detail.primaryItemName = primary
  detail.bookedItemName = primary
  detail.bookingType = 'composite'
  detail.additionalServices = additional
  detail.additionalItemsCount = additional.length
  detail.items = [primary, ...additional].map((name, index) => ({ type: 'service', name,
    serviceId: 41 + index, serviceUuid: `fixture-composite-${index}`, duration: 20, price: 4000, startOffsetMinutes: index * 20 }))
  detail.business!.name = brand
  detail.location!.name = location
  detail.staff_users![0].displayName = professionals[0]
  detail.staff_users!.push({ teamMemberId: 302, uuid: 'fixture-second-cancellation-professional',
    firstName: 'Alexandru', lastName: 'Dumitrescu', profileImage: null, professionalTitle: 'Stylist',
    displayName: professionals[1], averageRating: null, totalReviews: 0 })
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto(`/ro/appointments/${CONFIRMED}`)
  await page.getByRole('button', { name: 'Anulează programarea', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Anulezi această programare?', exact: true })
  await expect(dialog.getByRole('heading', { name: primary, exact: true, level: 2 })).toBeVisible()
  await expect(dialog.getByRole('list', { name: 'Cu cine', exact: true })).toBeVisible()
  for (const text of [primary, ...additional.map((name) => `+ ${name}`), brand, location, ...professionals]) {
    const context = dialog.getByText(text, { exact: true })
    await context.scrollIntoViewIfNeeded()
    await expect(context).toBeVisible()
    const bounds = await context.boundingBox()
    const frame = await dialog.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(frame!.x)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(frame!.x + frame!.width)
  }
  await expectReachableControl(dialog.getByRole('button', { name: 'Păstreaz-o', exact: true }), dialog)
  await expectReachableControl(dialog.getByRole('button', { name: 'Anulează programarea', exact: true }), dialog)
  await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('cancellation Keep, X, Escape and backdrop preserve the appointment without an API request', async ({ page, appointments }) => {
  await openDetail(page)
  const openCancel = page.getByRole('button', { name: 'Cancel appointment', exact: true })
  for (const dismissal of ['Keep it', 'Close', 'Escape', 'backdrop']) {
    await openCancel.click()
    const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?', exact: true })
    await expect(dialog).toBeVisible()
    if (dismissal === 'Escape') await page.keyboard.press('Escape')
    else if (dismissal === 'backdrop') await page.locator('.zv-sheet-backdrop').click({ position: { x: 5, y: 5 } })
    else await dialog.getByRole('button', { name: dismissal, exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(openCancel).toBeFocused()
    await expect(openCancel).toBeEnabled()
    expect(appointments.mutations).toEqual([])
  }
})

appointmentTest('pending appointments use request wording throughout cancellation and keep the API contract', async ({ page, appointments }) => {
  appointments.details[CONFIRMED].status = 'pending'
  await openDetail(page)
  await page.getByRole('button', { name: 'Cancel request', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cancel this request?', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancel appointment', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Cancel request', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Your appointment request was cancelled.', { exact: true })).toBeVisible()
  expect(appointments.mutations).toHaveLength(1)
  expect(appointments.mutations[0].path).toMatch(/\/appointments\/cancel$/)
  expect(appointments.mutations[0].body).toEqual({ uuid: CONFIRMED })
})

appointmentTest('rescheduling uses saved appointment UUIDs, paginates dates and exposes selected controls', async ({ page, appointments }) => {
  await openDetail(page, RETIRED)
  await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Reschedule', exact: true })
  await expect.poll(() => appointments.calendars.length).toBe(1)
  expect(appointments.calendars[0]).toMatchObject({ uuid: RETIRED })
  expect(appointments.calendars[0]).not.toHaveProperty('services')
  const dates = dialog.locator('button[aria-pressed]:not(.zv-slot)')
  await expect(dates).toHaveCount(7)
  const firstPageDate = await dates.first().getAttribute('aria-label')
  await dialog.getByRole('button', { name: 'Next dates', exact: true }).click()
  await expect(dates.first()).not.toHaveAttribute('aria-label', firstPageDate!)
  expect(appointments.calendars).toHaveLength(1)
  // Four further local pages exhaust the 30-day availability range before
  // requesting another range from the appointment-based calendar endpoint.
  for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
    await dialog.getByRole('button', { name: 'Next dates', exact: true }).click()
  }
  await expect.poll(() => appointments.calendars.length).toBe(2)
  expect(appointments.calendars[1].startDate > appointments.calendars[0].startDate).toBe(true)
  await dates.first().click()
  await expect(dates.first()).toHaveAttribute('aria-pressed', 'true')
  const slot = dialog.locator('.zv-slot').first()
  await expect(slot).toBeVisible()
  await slot.click()
  await expect(slot).toHaveAttribute('aria-pressed', 'true')
  await dialog.getByRole('button', { name: 'Confirm new time', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => appointments.mutations.length).toBe(1)
  expect(appointments.mutations[0].body.uuid).toBe(RETIRED)
  expect(appointments.mutations[0].body.newScheduledAt).toEqual(expect.any(String))
  await expect(page.getByRole('heading', { name: SERVICE, exact: true })).toBeVisible()
})

appointmentTest('reschedule week changes preserve dialog geometry and inner scroll after selecting a time', async ({ page, appointments }) => {
  // Enough slots in all three periods to force the same overflow as a busy day.
  await page.route('**/appointments/reschedule/slots', async (route) => {
    const { date } = route.request().postDataJSON()
    const response = slotsFixture(date)
    response.slots = Array.from({ length: 45 }, (_, index) => {
      const minutes = 9 * 60 + index * 15
      const time = `${Math.floor(minutes / 60)}`.padStart(2, '0') + ':' + `${minutes % 60}`.padStart(2, '0')
      const end = `${Math.floor((minutes + 60) / 60)}`.padStart(2, '0') + ':' + `${(minutes + 60) % 60}`.padStart(2, '0')
      const slot = slotsFixture(date, time).slots[0]
      return { ...slot, endTime: end, items: slot.items.map((item) => ({ ...item, endTime: end })) }
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: response }) })
  })
  type Frame = { top: number; height: number; footerTop: number; arrowTop: number; datesTop: number; scrollTop: number }
  for (const viewport of [{ width: 1440, height: 1000, locale: 'en' }, { width: 320, height: 760, locale: 'ro' }, { width: 667, height: 375, locale: 'ro' }]) {
    await page.setViewportSize(viewport)
    await page.goto(`/${viewport.locale}/appointments/${RETIRED}`)
    const title = viewport.locale === 'ro' ? 'Reprogramează' : 'Reschedule'
    await page.getByRole('button', { name: title, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: title, exact: true })
    const dates = dialog.locator('button[aria-pressed]:not(.zv-slot)')
    const confirm = dialog.getByRole('button', { name: viewport.locale === 'ro' ? 'Confirmă noua oră' : 'Confirm new time', exact: true })
    await expect(dates).toHaveCount(7)
    for (const direction of viewport.locale === 'ro' ? ['Date următoare', 'Date anterioare'] : ['Next dates', 'Previous dates']) {
      await dates.nth(direction === 'Previous dates' || direction === 'Date anterioare' ? 0 : 1).click()
      await expect(dialog.locator('.zv-slot')).toHaveCount(45)
      await dialog.locator('.zv-slot').first().click()
      await expect(confirm).toBeEnabled()
      const arrow = dialog.getByRole('button', { name: direction, exact: true })
      await arrow.evaluate((element) => {
        const body = element.closest('[role=dialog]')!.querySelector('.zw-scroll-y')!
        body.scrollTop = Math.max(80, body.scrollTop + element.getBoundingClientRect().top - body.getBoundingClientRect().top - body.clientHeight / 2 + 22)
      })
      await expectReachableControl(arrow, dialog)
      await dialog.evaluate((element) => {
        const frames: Frame[] = []
        ;(window as unknown as { rescheduleFrames: Frame[] }).rescheduleFrames = frames
        const sample = () => {
          const box = element.getBoundingClientRect()
          frames.push({ top: box.top, height: box.height,
            footerTop: element.querySelector('[class*=footer]')!.getBoundingClientRect().top,
            arrowTop: element.querySelector('[class*=calendarNavigation]')!.getBoundingClientRect().top,
            datesTop: element.querySelector('[class*=weekViewport]')!.getBoundingClientRect().top,
            scrollTop: element.querySelector('.zw-scroll-y')!.scrollTop })
          if (frames.length < 30) requestAnimationFrame(sample)
        }
        sample()
      })
      // Click the visible arrow directly so the trace excludes test-runner scrolling.
      const box = (await arrow.boundingBox())!
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await expect.poll(() => page.evaluate(() => (window as unknown as { rescheduleFrames: Frame[] }).rescheduleFrames.length)).toBe(30)
      const frames = await page.evaluate(() => (window as unknown as { rescheduleFrames: Frame[] }).rescheduleFrames)
      expect(frames[0].scrollTop).toBeGreaterThan(0)
      for (const property of ['top', 'height', 'footerTop', 'arrowTop', 'datesTop', 'scrollTop'] as const) {
        const values = frames.map((frame) => frame[property])
        expect(Math.max(...values) - Math.min(...values), `${viewport.width}px ${direction}: ${property}`).toBeLessThanOrEqual(1)
      }
      await expect(confirm).toBeDisabled()
      await expect(dialog.locator('.zv-slot')).toHaveCount(0)
      await expect(dialog.locator('button[aria-pressed="true"]')).toHaveCount(0)
    }
  }
  expect(appointments.mutations).toEqual([])
})

appointmentTest('late slots for an older date cannot replace the current reschedule choice', async ({ page, appointments }) => {
  await openDetail(page, RETIRED)
  await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Reschedule', exact: true })
  await expect.poll(() => appointments.calendars.length).toBe(1)
  const startDate = appointments.calendars[0].startDate
  appointments.slotsGate = { date: addDays(startDate, 1), gate: gate(), startTime: '08:30' }
  const dates = dialog.locator('button[aria-pressed]:not(.zv-slot)')
  await dates.nth(1).click()
  await expect.poll(() => appointments.slots.some((request) => request.date === addDays(startDate, 1))).toBe(true)
  await expect(dialog.getByRole('button', { name: 'Confirm new time', exact: true })).toBeDisabled()
  await dates.nth(2).click()
  await expect(dialog.locator('.zv-slot').first()).toBeVisible()
  await dialog.locator('.zv-slot').first().click()
  appointments.slotsGate.gate.release()
  await expect(dates.nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('button', { name: /08:30/ })).toHaveCount(0)
  await expect(dialog.locator('.zv-slot').first()).toHaveAttribute('aria-pressed', 'true')
})

for (const locale of ['en', 'ro'] as const) {
  appointmentTest(`shared textarea ${locale} appointment report rejects unsafe text inline and sends corrected Unicode unchanged`, async ({ page, appointments }) => {
    const names = locale === 'ro'
      ? { open: 'Raportează o problemă', title: 'Contactează asistența', message: 'Mesaj',
          send: 'Trimite mesajul', counter: '0 / 9.500 de caractere',
          unsafe: 'Elimină codul HTML sau scripturile din text.' }
      : { open: 'Report a problem', title: 'Contact support', message: 'Message',
          send: 'Send message', counter: '0 / 9,500 characters',
          unsafe: 'Remove HTML tags or scripts from your text.' }
    await page.goto(`/${locale}/appointments/${CONFIRMED}`)
    await page.getByRole('button', { name: names.open, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: names.title, exact: true })
    const message = dialog.getByRole('textbox', { name: names.message, exact: true })
    const send = dialog.getByRole('button', { name: names.send, exact: true })
    const count = dialog.getByText(names.counter, { exact: true })
    await expect(count).toBeVisible()
    expect((await message.getAttribute('aria-describedby'))?.split(' ')).toContain(await count.getAttribute('id'))
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await expect(send).toBeDisabled()
    for (const unsafe of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'javascript:alert(1)']) {
      await message.fill(unsafe)
      await expectAssociatedFieldError(message, dialog, names.unsafe)
      await expect(message).toHaveValue(unsafe)
      await expect(send).toBeDisabled()
      expect(appointments.mutations).toEqual([])
    }
    const safeMessage = '  Întrebare despre programare 🙂\nPreț < 200 RON & durata > 30 min?  '
    await message.fill(safeMessage)
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await expect(message).not.toHaveAttribute('aria-invalid', 'true')
    await expect(send).toBeEnabled()
    await send.click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations).toHaveLength(1)
    expect(appointments.mutations[0].body).toMatchObject({
      category: 'bug', message: safeMessage.trim(),
      context: { type: 'appointment', appointmentUuid: CONFIRMED, businessId: 101, locationId: 201 },
    })
  })

  appointmentTest(`shared textarea ${locale} appointment report maps API validation to its field and permits a corrected retry`, async ({ page, appointments }) => {
    const names = locale === 'ro'
      ? { open: 'Raportează o problemă', title: 'Contactează asistența', message: 'Mesaj', send: 'Trimite mesajul',
          unsafe: 'Elimină codul HTML sau scripturile din text.' }
      : { open: 'Report a problem', title: 'Contact support', message: 'Message', send: 'Send message',
          unsafe: 'Remove HTML tags or scripts from your text.' }
    await page.goto(`/${locale}/appointments/${CONFIRMED}`)
    await page.getByRole('button', { name: names.open, exact: true }).click()
    const dialog = page.getByRole('dialog', { name: names.title, exact: true })
    const message = dialog.getByRole('textbox', { name: names.message, exact: true })
    await message.fill('Draft checked by the API validator.')
    appointments.reportValidationMessages = ['message.VALIDATION.PLAIN_TEXT_UNSAFE']
    await dialog.getByRole('button', { name: names.send, exact: true }).click()
    await expectAssociatedFieldError(message, dialog, names.unsafe)
    await expect(message).toBeFocused()
    await expect(message).toHaveValue('Draft checked by the API validator.')
    expect(appointments.mutations).toHaveLength(1)
    appointments.reportValidationMessages = []
    await message.fill('A corrected, plain-text support message.')
    await expect(dialog.getByRole('alert')).toHaveCount(0)
    await dialog.getByRole('button', { name: names.send, exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations).toHaveLength(2)
    expect(appointments.mutations[1].body.message).toBe('A corrected, plain-text support message.')
  })
}

appointmentTest('shared textarea appointment fields retain a fixed height and scroll long text internally', async ({ page, appointments }) => {
  await openDetail(page)
  await page.getByRole('button', { name: 'Report a problem', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Contact support', exact: true })
  const message = report.getByRole('textbox', { name: 'Message', exact: true })
  const reportHeight = (await message.boundingBox())!.height
  const longText = Array.from({ length: 70 }, (_, index) => `Message line ${index}: Mulțumesc!`).join('\n')
  await message.fill(longText)
  expect((await message.boundingBox())!.height).toBe(reportHeight)
  expect(await message.evaluate((element) => ({
    resize: getComputedStyle(element).resize, overflow: getComputedStyle(element).overflowY,
    scrolls: element.scrollHeight > element.clientHeight,
  }))).toEqual({ resize: 'none', overflow: 'auto', scrolls: true })
  await message.evaluate((element) => { element.scrollTop = element.scrollHeight })
  expect(await message.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  await report.getByRole('button', { name: 'Close', exact: true }).last().click()
  await expect(report).toHaveCount(0)

  await openDetail(page, COMPLETED)
  await page.getByRole('button', { name: 'Leave a review', exact: true }).click()
  const review = page.getByRole('dialog', { name: 'How was it?', exact: true })
  const comment = review.getByRole('textbox', { name: 'Comment (optional)', exact: true })
  await expect(review.getByText('0 / 2,000 characters', { exact: true })).toBeVisible()
  const reviewHeight = (await comment.boundingBox())!.height
  await comment.fill(longText.slice(0, 2000))
  expect((await comment.boundingBox())!.height).toBe(reviewHeight)
  expect(await comment.evaluate((element) => ({
    resize: getComputedStyle(element).resize, overflow: getComputedStyle(element).overflowY,
    scrolls: element.scrollHeight > element.clientHeight,
  }))).toEqual({ resize: 'none', overflow: 'auto', scrolls: true })
  await comment.evaluate((element) => { element.scrollTop = element.scrollHeight })
  expect(await comment.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
  expect(appointments.mutations).toEqual([])
})

for (const category of ['bug', 'question'] as const) {
  appointmentTest(`reporting ${category} sends the selected category, trimmed message and exact appointment context`, async ({ page, appointments }) => {
    const detail = appointments.details[CONFIRMED]
    detail.scheduled_at = '2030-01-01T01:15:00Z'
    detail.ends_at = '2030-01-01T02:15:00Z'
    detail.location!.timezone = 'America/New_York'
    detail.business!.timezone = 'Europe/Bucharest'
    await openDetail(page)
    await page.getByRole('button', { name: 'Report a problem', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Contact support', exact: true })
    const problem = dialog.getByRole('radio', { name: 'Problem', exact: true })
    const question = dialog.getByRole('radio', { name: 'Question', exact: true })
    const message = dialog.getByRole('textbox', { name: 'Message', exact: true })
    const send = dialog.getByRole('button', { name: 'Send message', exact: true })
    await expect(dialog.getByRole('group', { name: 'Topic', exact: true })).toBeVisible()
    await expect(dialog.getByText('Your message goes to Zavoia Support, with this appointment’s details.', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Find replies in Account → Support.', { exact: true })).toBeVisible()
    await expect(dialog.getByText('0 / 9,500 characters', { exact: true })).toBeVisible()
    await expect(problem).toBeChecked()
    await expect(question).not.toBeChecked()
    await expect(dialog.getByRole('combobox')).toHaveCount(0)
    expect(await message.getAttribute('placeholder')).toBeNull()
    await message.fill('  \n  ')
    await expect(send).toBeDisabled()
    if (category === 'question') {
      await problem.focus()
      await page.keyboard.press('ArrowRight')
      await expect(question).toBeChecked()
      await expect(question).toBeFocused()
    }
    await message.fill('  The appointment details need checking.  ')
    await send.click()
    await expect(dialog).toHaveCount(0)
    expect(appointments.mutations).toHaveLength(1)
    expect(appointments.mutations[0].path).toMatch(/\/support\/tickets$/)
    expect(appointments.mutations[0].body).toEqual({
      category, message: 'The appointment details need checking.',
      context: { type: 'appointment', appointmentUuid: CONFIRMED, businessId: 101, locationId: 201,
        label: `${SERVICE} · ${BRAND} · ${VENUE} · Dec 31, 2029, 8:15 PM` },
    })
  })
}

appointmentTest('reporting blocks duplicate actions and dismissal during posting and preserves the draft after failure', async ({ page, appointments }) => {
  await openDetail(page)
  await page.getByRole('button', { name: 'Report a problem', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Contact support', exact: true })
  const problem = dialog.getByRole('radio', { name: 'Problem', exact: true })
  const question = dialog.getByRole('radio', { name: 'Question', exact: true })
  const message = dialog.getByRole('textbox', { name: 'Message', exact: true })
  const send = dialog.getByRole('button', { name: 'Send message', exact: true })
  await question.locator('xpath=ancestor::label[1]').click()
  await message.fill('  Support draft survives a failed request.  ')
  appointments.reportGate = gate()
  appointments.failReports = true
  await send.evaluate((element) => {
    const button = element as HTMLButtonElement
    button.click()
    button.click()
  })
  await expect.poll(() => appointments.mutations.length).toBe(1)
  await expect(send).toBeDisabled()
  await expect(problem).toBeDisabled()
  await expect(question).toBeDisabled()
  await expect(message).toBeDisabled()
  const closeButtons = dialog.getByRole('button', { name: 'Close', exact: true })
  await expect(closeButtons).toHaveCount(2)
  for (const close of await closeButtons.all()) await expect(close).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.mouse.click(5, 5)
  await expect(dialog).toBeVisible()
  appointments.reportGate.release()
  const failure = page.locator('[data-toast-host]').getByRole('alert').filter({ hasText: "We couldn’t send your message. Try again." })
  await expect(failure).toBeVisible()
  await expect(message).not.toHaveAttribute('aria-invalid', 'true')
  expect(await failure.evaluate((element) => element.closest('[aria-hidden="true"]'))).toBeNull()
  await expect(page.locator('[data-toast-host]')).toHaveAttribute('aria-live', 'assertive')
  await expectReachableControl(send, dialog)
  await page.setViewportSize({ width: 390, height: 844 })
  await expectReachableControl(send, dialog)
  await expect(failure).toBeVisible()
  const dismiss = failure.getByRole('button', { name: 'Dismiss', exact: true })
  await dismiss.focus()
  await expect(dismiss).toBeFocused()
  await dismiss.click()
  await expect(failure).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(message).toHaveValue('  Support draft survives a failed request.  ')
  await expect(question).toBeChecked()
  await expect(send).toBeEnabled()
  appointments.reportGate = null
  appointments.failReports = false
  await send.click()
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations).toHaveLength(2)
  expect(appointments.mutations[1].body).toEqual(appointments.mutations[0].body)
})

appointmentTest('reporting footer Close prevents a same-task Send from posting the closed draft', async ({ page, appointments }) => {
  await openDetail(page)
  const openReport = page.getByRole('button', { name: 'Report a problem', exact: true })
  await openReport.click()
  const dialog = page.getByRole('dialog', { name: 'Contact support', exact: true })
  await dialog.getByRole('textbox', { name: 'Message', exact: true }).fill('This valid draft must be discarded on close.')
  const send = await dialog.getByRole('button', { name: 'Send message', exact: true }).elementHandle()
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().evaluate((element, sendElement) => {
    const closeButton = element as HTMLButtonElement
    const sendButton = sendElement as HTMLButtonElement
    closeButton.click()
    sendButton.click()
  }, send)
  await expect(dialog).toHaveCount(0)
  await expect(openReport).toBeFocused()
  expect(appointments.mutations).toEqual([])
})

appointmentTest('Romanian reporting retains bounded text and reachable choices and actions on narrow short screens', async ({ page, appointments }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto(`/ro/appointments/${CONFIRMED}`)
  await page.getByRole('button', { name: 'Raportează o problemă', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Contactează asistența', exact: true })
  const problem = dialog.getByRole('radio', { name: 'Problemă', exact: true })
  const question = dialog.getByRole('radio', { name: 'Întrebare', exact: true })
  const message = dialog.getByRole('textbox', { name: 'Mesaj', exact: true })
  await expect(dialog.getByRole('group', { name: 'Subiect', exact: true })).toBeVisible()
  await expect(problem).toBeChecked()
  expect(await message.getAttribute('placeholder')).toBeNull()
  await expect(dialog.getByText('0 / 9.500 de caractere', { exact: true })).toBeVisible()
  await message.fill('x'.repeat(9501))
  await expect(message).toHaveValue('x'.repeat(9500))
  await expect(message).toHaveAttribute('maxlength', '9500')
  await message.fill('Detaliile acestei programări trebuie verificate.')
  for (const viewport of [{ width: 320, height: 760 }, { width: 320, height: 375 }, { width: 667, height: 375 }]) {
    await page.setViewportSize(viewport)
    await expectReachableControl(problem.locator('xpath=ancestor::label[1]'), dialog)
    await expectReachableControl(question.locator('xpath=ancestor::label[1]'), dialog)
    await expectReachableControl(message, dialog)
    await expectReachableControl(dialog.getByRole('button', { name: 'Închide', exact: true }).last(), dialog)
    const send = dialog.getByRole('button', { name: 'Trimite mesajul', exact: true })
    await expect(send).toBeEnabled()
    await expectReachableControl(send, dialog)
    const bounds = await dialog.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height)
    await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('web appointment management has no external calendar export on desktop or mobile', async ({ page, appointments }) => {
  for (const scenario of [{ locale: 'en', width: 1440 }, { locale: 'ro', width: 320 }]) {
    await page.setViewportSize({ width: scenario.width, height: 760 })
    await page.goto(`/${scenario.locale}/appointments/${CONFIRMED}`)
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()
    await expect(main.getByRole('button', { name: /^(Add to calendar|Adaugă în calendar)$/ })).toHaveCount(0)
    await expect(main.getByRole('link', { name: /^(Add to calendar|Adaugă în calendar)$/ })).toHaveCount(0)
    await expect(main.getByRole('button', { name: scenario.locale === 'ro' ? 'Raportează o problemă' : 'Report a problem', exact: true })).toBeVisible()
    await expect(main.getByRole('button', { name: scenario.locale === 'ro' ? 'Reprogramează' : 'Reschedule', exact: true })).toBeVisible()
  }
  expect(appointments.mutations).toEqual([])
})

appointmentTest('Romanian management modals retain reachable fields and footers at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto(`/ro/appointments/${RETIRED}`)
  await expect(page.getByRole('heading', { name: SERVICE, exact: true, level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Anulează programarea', exact: true }).click()
  const cancel = page.getByRole('dialog', { name: 'Anulezi această programare?', exact: true })
  await expectReachableControl(cancel.getByRole('button', { name: 'Păstreaz-o', exact: true }), cancel)
  await expectReachableControl(cancel.getByRole('button', { name: 'Anulează programarea', exact: true }), cancel)
  await page.keyboard.press('Escape')
  await expect(cancel).toHaveCount(0)

  await page.getByRole('button', { name: 'Reprogramează', exact: true }).click()
  const reschedule = page.getByRole('dialog', { name: 'Reprogramează', exact: true })
  const day = reschedule.locator('button[aria-pressed]:not(.zv-slot)').nth(1)
  await day.click()
  await expect(day).toHaveAttribute('aria-pressed', 'true')
  const slot = reschedule.locator('.zv-slot').first()
  await slot.click()
  await expect(slot).toHaveAttribute('aria-pressed', 'true')
  const confirm = reschedule.getByRole('button', { name: 'Confirmă noua oră', exact: true })
  await expect(confirm).toBeEnabled()
  await expectReachableControl(confirm, reschedule)
  await expect.poll(() => reschedule.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(reschedule).toHaveCount(0)

  await page.getByRole('button', { name: 'Raportează o problemă', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Contactează asistența', exact: true })
  const message = report.getByRole('textbox', { name: 'Mesaj', exact: true })
  const problem = report.getByRole('radio', { name: 'Problemă', exact: true })
  const question = report.getByRole('radio', { name: 'Întrebare', exact: true })
  await expect(problem).toBeChecked()
  await problem.focus()
  await page.keyboard.press('ArrowRight')
  await expect(question).toBeChecked()
  await expect(question).toBeFocused()
  await message.fill('Detaliile acestei programări trebuie verificate.')
  await expectReachableControl(message, report)
  const sendReport = report.getByRole('button', { name: 'Trimite mesajul', exact: true })
  await expect(sendReport).toBeEnabled()
  await expectReachableControl(sendReport, report)
  await expect.poll(() => report.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

appointmentTest('Romanian review fields remain labelled, bounded and keyboard reachable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto(`/ro/appointments/${COMPLETED}`)
  await page.getByRole('button', { name: 'Lasă o recenzie', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cum a fost?', exact: true })
  await expect(dialog.getByText('Poți publica recenzii pentru această programare o singură dată.', { exact: false })).toHaveCount(0)
  const venue = dialog.getByRole('group', { name: `Evaluează ${VENUE}`, exact: true })
  const professional = dialog.getByRole('group', { name: `Evaluează ${PERSON}`, exact: true })
  const comment = professional.getByRole('textbox', { name: 'Comentariu (opțional)', exact: true })
  expect(await comment.getAttribute('placeholder')).toBeNull()
  await comment.fill('x'.repeat(2001))
  await expect(comment).toHaveValue('x'.repeat(2000))
  await expect(comment).toHaveAttribute('maxlength', '2000')
  await page.keyboard.press('Tab')
  await comment.focus()
  await expect(comment).toBeFocused()
  await expect(comment).toHaveCSS('border-color', 'rgb(28, 28, 26)')
  await expectReachableControl(comment, dialog)
  await professional.getByRole('button', { name: '5 stele', exact: true }).click()
  await expectReachableControl(dialog.getByRole('button', { name: 'Continuă', exact: true }), dialog)
  await dialog.getByRole('button', { name: 'Continuă', exact: true }).click()
  await expect(dialog.getByText('Poți publica recenzii pentru această programare o singură dată.', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Include toate persoanele pe care vrei să le evaluezi înainte de publicare.', { exact: false })).toBeVisible()
  await expectReachableControl(venue.getByRole('textbox', { name: 'Comentariu (opțional)', exact: true }), dialog)
  const rating = venue.getByRole('button', { name: '5 stele', exact: true })
  await rating.click()
  await expect(rating).toHaveAttribute('aria-pressed', 'true')
  const publish = dialog.getByRole('button', { name: 'Publică recenzia', exact: true })
  await expect(publish).toBeEnabled()
  await expectReachableControl(publish, dialog)
  await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})

appointmentTest('Romanian final review controls stay reachable on short mobile and landscape screens', async ({ page, appointments }) => {
  await page.setViewportSize({ width: 320, height: 375 })
  await page.goto(`/ro/appointments/${COMPLETED}`)
  await page.getByRole('button', { name: 'Lasă o recenzie', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Cum a fost?', exact: true })
  await dialog.getByRole('button', { name: 'Omite', exact: true }).click()
  const venue = dialog.getByRole('group', { name: `Evaluează ${VENUE}`, exact: true })
  const comment = venue.getByRole('textbox', { name: 'Comentariu (opțional)', exact: true })
  const publish = dialog.getByRole('button', { name: 'Publică recenzia', exact: true })
  const back = dialog.getByRole('button', { name: 'Înapoi', exact: true })

  for (const width of [320, 667]) {
    await page.setViewportSize({ width, height: 375 })
    await expectReachableControl(comment, dialog)
    await comment.fill('Comentariu accesibil pe un ecran scurt.')
    await expectReachableControl(publish, dialog)
    await expectReachableControl(back, dialog)
    const bounds = await dialog.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(375)
    await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  expect(appointments.mutations).toEqual([])
})


async function installRebookRequests(context: BrowserContext, options: {
  hold?: 'listing' | 'professional'; listingFails?: boolean;
} = {}) {
  const held = gate()
  const state = { listingReads: 0, professionalReads: 0, calendars: [] as Record<string, unknown>[], businessNavigations: [] as string[] }
  await context.route('**/marketplace/public/listing/201', async (route) => {
    state.listingReads += 1
    if (options.hold === 'listing') await held.promise
    return route.fulfill({ status: options.listingFails ? 503 : 200, contentType: 'application/json', body: JSON.stringify(options.listingFails
      ? { message: 'Fixture listing unavailable' }
      : { listingId: 901, locationId: 201, businessId: 101, timezone: zone, businessCurrency: 'RON', bookingPolicy: null,
        services: [{ id: 41, name: SERVICE, priceAmountMinor: 12000, duration: 60 }], bundles: [] }) })
  })
  await context.route('**/marketplace/public/listing/901/team-member/301*', async (route) => {
    state.professionalReads += 1
    if (options.hold === 'professional') await held.promise
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      services: [{ id: 41, priceAmountMinor: 15000, duration: 45 }],
    }) })
  })
  await context.route('**/marketplace/public/booking/calendar', (route) => {
    const body = route.request().postDataJSON()
    state.calendars.push(body)
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: calendarFixture(body.startDate) }) })
  })
  await context.route('**/marketplace/public/booking/slots', (route) => {
    const body = route.request().postDataJSON()
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: slotsFixture(body.date) }) })
  })
  // Observe a fallback without allowing a business page's server-side fetch.
  await context.route('**/business/201*', (route) => {
    state.businessNavigations.push(route.request().url())
    return route.abort('blockedbyclient')
  })
  return Object.assign(state, { release: held.release })
}

appointmentTest('rebooking preserves current staff pricing and ignores duplicate pending activation', async ({ page, context }) => {
  const rebook = await installRebookRequests(context, { hold: 'listing' })
  await openDetail(page, COMPLETED)
  const button = page.getByRole('complementary', { name: 'Manage appointment' }).getByRole('button', { name: 'Book again', exact: true })
  await button.evaluate((element: HTMLButtonElement) => { element.click(); element.click() })
  await expect(button).toBeDisabled()
  await expect.poll(() => rebook.listingReads).toBe(1)
  rebook.release()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await expect.poll(() => rebook.calendars.length).toBe(1)
  expect(rebook.calendars[0]).toMatchObject({ businessId: 101, locationId: 201, services: [{ serviceId: 41, teamMemberId: 301 }] })
  await expect(drawer.getByText('RON 150.00', { exact: false }).first()).toBeVisible()
})

for (const heldResponse of ['listing-success', 'listing-failure', 'professional-success'] as const) {
  appointmentTest(`rebooking ignores ${heldResponse} after returning to the appointment list`, async ({ page, context }) => {
    const professional = heldResponse === 'professional-success'
    const rebook = await installRebookRequests(context, { hold: professional ? 'professional' : 'listing', listingFails: heldResponse === 'listing-failure' })
    await openDetail(page, COMPLETED)
    const response = page.waitForResponse((response) => response.url().includes(professional ? '/team-member/301' : '/listing/201'))
    await page.getByRole('complementary', { name: 'Manage appointment' }).getByRole('button', { name: 'Book again', exact: true }).click()
    await expect.poll(() => professional ? rebook.professionalReads : rebook.listingReads).toBe(1)
    await page.getByRole('main').getByRole('link', { name: 'Appointments', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Appointments', level: 1, exact: true })).toBeVisible()
    rebook.release()
    await (await response).finished()
    // Flush the released response and its client continuation before asserting
    // the absence of drawer, navigation and the calendar request they cause.
    await page.waitForTimeout(150)
    await expect(page).toHaveURL(/\/appointments$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(rebook.businessNavigations).toEqual([])
    expect(rebook.calendars).toEqual([])
  })
}

appointmentTest('rebooking ignores an old session even when the same account signs in again', async ({ page, context, appointments }) => {
  const rebook = await installRebookRequests(context, { hold: 'listing' })
  await openDetail(page, COMPLETED)
  const button = page.getByRole('complementary', { name: 'Manage appointment' }).getByRole('button', { name: 'Book again', exact: true })
  const response = page.waitForResponse((response) => response.url().includes('/listing/201'))
  await button.click()
  await expect(button).toBeDisabled()
  await expect.poll(() => rebook.listingReads).toBe(1)
  const refreshes = appointments.authRefreshReads
  // Exercise the real cross-tab replacement signal, without changing cookies
  // or contacting the live API. The auth fixture returns the same account.
  await page.evaluate(() => {
    const channel = new BroadcastChannel('auth')
    channel.postMessage({ type: 'login' })
    channel.close()
  })
  await expect.poll(() => appointments.authRefreshReads).toBeGreaterThan(refreshes)
  await expect(button).toBeEnabled()
  rebook.release()
  await (await response).finished()
  await page.waitForTimeout(150)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(rebook.calendars).toEqual([])
  expect(rebook.businessNavigations).toEqual([])
})

appointmentTest('started pending stays unconfirmed with contact/map access and blocked customer changes', async ({ page, appointments }) => {
  const start = new Date(Date.now() - 20 * 60_000).toISOString()
  const end = new Date(Date.now() + 40 * 60_000).toISOString()
  appointments.details[CONFIRMED] = detailFixture(CONFIRMED, { status: 'pending', scheduled_at: start, ends_at: end })
  await openDetail(page)
  const main = page.getByRole('main')
  await expect(main.getByText('Pending', { exact: true })).toBeVisible()
  await expect(main.getByText('The scheduled start has passed, but the venue has not confirmed this appointment. Contact them to check before your visit.', { exact: true })).toBeVisible()
  await expect(main.getByRole('progressbar')).toHaveCount(0)
  await expect(main.getByText('In progress', { exact: true })).toHaveCount(0)
  await expect(main.getByRole('link', { name: 'View map', exact: true })).toBeVisible()
  await expect(main.getByRole('link', { name: 'Call', exact: true })).toBeVisible()
  await expect(main.getByRole('button', { name: /^Reschedule/ })).toBeDisabled()
  await expect(main.getByRole('button', { name: /^Cancel request/ })).toBeDisabled()
  await expect(main.getByRole('button', { name: 'Book again', exact: true })).toHaveCount(0)
  await expect(main.getByRole('button', { name: 'Leave a review', exact: true })).toHaveCount(0)
  expect(appointments.mutations).toEqual([])
})

appointmentTest('live detail has one status label and terminal appointments have no countdown', async ({ page, appointments }) => {
  const start = new Date(Date.now() - 20 * 60_000).toISOString()
  const end = new Date(Date.now() + 40 * 60_000).toISOString()
  appointments.details[CONFIRMED] = detailFixture(CONFIRMED, { scheduled_at: start, ends_at: end })
  await openDetail(page)
  await expect(page.getByRole('main').getByText('In progress', { exact: true })).toHaveCount(1)
  await expect(page.getByRole('progressbar')).toBeVisible()
  appointments.details[CONFIRMED].status = 'cancelled'
  appointments.details[CONFIRMED].scheduled_at = `${dayFromNow(1)}T12:00:00Z`
  appointments.details[CONFIRMED].ends_at = `${dayFromNow(1)}T13:00:00Z`
  await page.reload()
  await expect(page.getByRole('main').locator('header').getByText('Cancelled', { exact: true })).toBeVisible()
  await expect(page.getByRole('main').getByText('Tomorrow', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('progressbar')).toHaveCount(0)
})

appointmentTest('review is primary on desktop and Romanian mobile and closes eligibility after submission', async ({ page, appointments }) => {
  await openDetail(page, COMPLETED)
  const desktopReview = page.getByRole('button', { name: 'Leave a review', exact: true })
  const reviewAppearance = (button: Locator) => button.evaluate((element) => ({
    background: (element as HTMLElement).style.background,
    borderStyle: getComputedStyle(element).borderStyle,
    color: (element as HTMLElement).style.color,
    textColor: getComputedStyle(element).color,
    starColor: getComputedStyle(element.querySelector('svg')!).color,
    starFill: getComputedStyle(element.querySelector('svg path')!).fill,
  }))
  const desktopAppearance = await reviewAppearance(desktopReview)
  expect(desktopAppearance).toMatchObject({ background: 'var(--p-500)', borderStyle: 'none', color: 'var(--c-50)' })
  expect(desktopAppearance.starColor).toBe(desktopAppearance.textColor)
  expect(desktopAppearance.starFill).toBe(desktopAppearance.textColor)
  expect(await page.getByRole('button', { name: 'Book again', exact: true }).evaluate((element) => (element as HTMLElement).style.background)).not.toBe('var(--c-ink)')
  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto(`/ro/appointments/${COMPLETED}`)
  const mobileReview = page.getByRole('button', { name: 'Lasă o recenzie', exact: true })
  await expect(mobileReview).toBeVisible()
  expect(await reviewAppearance(mobileReview)).toEqual(desktopAppearance)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const bounds = await mobileReview.boundingBox()
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  appointments.failDetails.add(COMPLETED)
  await mobileReview.click()
  const dialog = page.getByRole('dialog', { name: 'Cum a fost?', exact: true })
  await dialog.getByRole('button', { name: 'Omite', exact: true }).click()
  await dialog.getByRole('group', { name: `Evaluează ${VENUE}`, exact: true }).getByRole('button', { name: '5 stele', exact: true }).click()
  await dialog.getByRole('button', { name: 'Publică recenzia', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Lasă o recenzie', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Programează-te din nou', exact: true })).toBeVisible()
})

appointmentTest('long business names stay within a narrow detail page', async ({ page, appointments }) => {
  appointments.details[CONFIRMED].business!.name = 'DenumireFirmă'.repeat(4)
  appointments.details[CONFIRMED].business!.description = 'A longer description of the venue, retained alongside the appointment details.'
  await page.setViewportSize({ width: 320, height: 760 })
  await openDetail(page)
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 760 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width <= 920) {
      await page.getByRole('link', { name: 'Manage appointment', exact: true }).click()
      await expect(page.getByRole('complementary', { name: 'Manage appointment' })).toBeFocused()
    }
  }
})

appointmentTest('offline detail preserves content and disables network actions until reconnection', async ({ page, appointments }) => {
  await openDetail(page)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false })
    window.dispatchEvent(new Event('offline'))
  })
  await expect(page.getByRole('alert').filter({ hasText: "You’re offline. You can view saved details, but can’t change this appointment." })).toBeVisible()
  await expect(page.getByRole('heading', { name: SERVICE, level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Reschedule', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Report a problem', exact: true })).toBeDisabled()
  const reads = appointments.detailReads.length
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
    window.dispatchEvent(new Event('online'))
  })
  await expect.poll(() => appointments.detailReads.length).toBeGreaterThan(reads)
  await expect(page.getByRole('button', { name: 'Cancel appointment', exact: true })).toBeEnabled()
  expect(appointments.mutations).toEqual([])
})
