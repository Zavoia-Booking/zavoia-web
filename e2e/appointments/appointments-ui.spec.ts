import { mkdir, readFile } from 'node:fs/promises'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { AuthUser } from '../../src/lib/auth/types'
import type {
  AppointmentDetail,
  AppointmentListItem,
  BookingCalendar,
  BookingDaySlots,
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
    mutations: [] as Array<{ path: string; body: Record<string, unknown> }>,
    blockedMutations: [] as string[], unmocked: [] as string[],
    calendars: [] as Array<{ uuid: string; startDate: string; daysToCheck?: number }>,
    slots: [] as Array<{ uuid: string; date: string }>,
    cancelGate: null as ReturnType<typeof gate> | null,
    slotsGate: null as { date: string; gate: ReturnType<typeof gate>; startTime: string } | null,
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
      if (path.endsWith('/auth/refresh')) return json({ accessToken: token, csrfToken: 'appointments-ui-fixture' })
      if (path.endsWith('/auth/me')) return json({ user })
      if (path.endsWith('/appointments/list')) {
        const filter = url.searchParams.get('status') ?? 'all'
        const items = filter === 'cancelled' ? state.past.filter((item) => item.status === 'cancelled')
          : filter === 'no_show' ? state.past.filter((item) => item.status === 'no_show') : state.past
        return wrapped({ upcoming: ['all', 'upcoming'].includes(filter) ? state.upcoming : [],
          past: filter === 'upcoming' ? null : { items, total: items.length, limit: 20, offset: 0, hasMore: false } })
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
        return wrapped({ id: 701, uuid: 'fixture-ticket', title: body.title, status: 'open', messages: [] })
      }
      if (path.endsWith('/customer/reviews') && method === 'POST') {
        const body = request.postDataJSON()
        state.mutations.push({ path, body })
        return wrapped({ success: true })
      }
      const detail = path.match(/\/appointments\/([^/]+)$/)
      if (detail && method === 'GET') {
        state.detailReads.push(detail[1])
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
    if (process.env.APPOINTMENTS_CAPTURE_DIR) await mkdir(process.env.APPOINTMENTS_CAPTURE_DIR, { recursive: true })
    const state = await installAppointmentFixture(context, baseURL!)
    await provideFixture(state)
    state.cancelGate?.release()
    state.slotsGate?.gate.release()
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
    await expect(page.getByRole('link', { name: 'Call venue', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Call venue', exact: true })).toHaveAttribute('href', 'tel:+40700000201')
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
  await expect(page.getByText('Booked total', { exact: true })).toBeVisible()
})

appointmentTest('historic venue and professional snapshots remain visible after live records disappear', async ({ page }) => {
  await openDetail(page, HISTORICAL)
  await expect(page.getByText(VENUE, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Saved appointment address 12', { exact: true })).toBeVisible()
  await expect(page.getByText(PERSON, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Venue details saved with this appointment', { exact: true })).toBeVisible()
  await expect(page.getByText('Professional details saved with this appointment', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reschedule', exact: true })).toHaveCount(0)
})

appointmentTest('saved reviews identify their venue and professional subjects', async ({ page }) => {
  await openDetail(page, REVIEWED)
  await expect(page.getByText(`Venue · ${VENUE}`, { exact: true })).toBeVisible()
  await expect(page.getByText(`Professional · ${PERSON}`, { exact: true })).toBeVisible()
  await expect(page.getByText('Excellent saved venue review', { exact: true })).toBeVisible()
  await expect(page.getByText('Excellent saved professional review', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Leave a review', exact: true })).toHaveCount(0)
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

appointmentTest('rescheduling uses saved appointment UUIDs, paginates dates and exposes selected controls', async ({ page, appointments }) => {
  await openDetail(page, RETIRED)
  await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Reschedule', exact: true })
  await expect.poll(() => appointments.calendars.length).toBe(1)
  expect(appointments.calendars[0]).toMatchObject({ uuid: RETIRED })
  expect(appointments.calendars[0]).not.toHaveProperty('services')
  await dialog.getByRole('button', { name: 'Next dates', exact: true }).click()
  await expect.poll(() => appointments.calendars.length).toBe(2)
  expect(appointments.calendars[1].startDate > appointments.calendars[0].startDate).toBe(true)
  const dates = dialog.locator('button[aria-pressed]:not(.zv-slot)')
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

appointmentTest('reporting includes the appointment context in an intercepted support ticket', async ({ page, appointments }) => {
  await openDetail(page)
  await page.getByRole('button', { name: 'Report a problem', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Report an appointment problem', exact: true })
  await dialog.getByRole('textbox', { name: 'What happened?', exact: true }).fill('The appointment details need checking.')
  await dialog.getByRole('button', { name: 'Send report', exact: true }).click()
  await expect.poll(() => appointments.mutations.length).toBe(1)
  const body = JSON.stringify(appointments.mutations[0].body)
  expect(appointments.mutations[0].path).toMatch(/\/support\/tickets$/)
  for (const value of [CONFIRMED, VENUE, 'The appointment details need checking.']) expect(body).toContain(value)
  await expect(page.getByText('Your report was sent to support.', { exact: true })).toBeVisible()
})

appointmentTest('calendar download preserves the booked instant and appointment identity', async ({ page, appointments }) => {
  await openDetail(page)
  const pendingDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Add to calendar', exact: true }).click()
  const download = await pendingDownload
  expect(download.suggestedFilename()).toMatch(/\.ics$/)
  const file = await download.path()
  expect(file).not.toBeNull()
  const contents = await readFile(file!, 'utf8')
  const start = appointments.details[CONFIRMED].scheduled_at.replace(/[-:]/g, '')
  expect(contents).toContain('BEGIN:VCALENDAR')
  expect(contents).toContain('BEGIN:VEVENT')
  expect(contents).toContain(`DTSTART:${start}`)
  expect(contents).toContain(CONFIRMED)
  expect(contents).toContain(SERVICE)
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
  if (process.env.APPOINTMENTS_CAPTURE_DIR) {
    await reschedule.locator('.zw-scroll-y').evaluate((element) => { element.scrollTop = 0 })
    await page.screenshot({ path: `${process.env.APPOINTMENTS_CAPTURE_DIR}/implemented-ro-reschedule320.png` })
  }
  await page.keyboard.press('Escape')
  await expect(reschedule).toHaveCount(0)

  await page.getByRole('button', { name: 'Raportează o problemă', exact: true }).click()
  const report = page.getByRole('dialog', { name: 'Raportează o problemă cu programarea', exact: true })
  const message = report.getByRole('textbox', { name: 'Ce s-a întâmplat?', exact: true })
  await expectReachableControl(report.getByRole('combobox'), report)
  await message.fill('Detaliile acestei programări trebuie verificate.')
  await expectReachableControl(message, report)
  const sendReport = report.getByRole('button', { name: 'Trimite raportarea', exact: true })
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
  await expect(dialog.getByText('Poți trimite recenzii o singură dată pentru această programare.', { exact: false })).toBeVisible()
  const venue = dialog.getByRole('group', { name: `Evaluează ${VENUE}`, exact: true })
  const professional = dialog.getByRole('group', { name: `Evaluează ${PERSON}`, exact: true })
  const comment = venue.getByRole('textbox', { name: 'Adaugă o notă (opțional)', exact: true })
  await comment.fill('x'.repeat(2001))
  await expect(comment).toHaveValue('x'.repeat(2000))
  await expect(comment).toHaveAttribute('maxlength', '2000')
  await page.keyboard.press('Tab')
  await comment.focus()
  await expect(comment).toBeFocused()
  await expect(comment).toHaveCSS('outline-style', 'solid')
  await expectReachableControl(comment, dialog)
  await expectReachableControl(professional.getByRole('textbox', { name: 'Adaugă o notă (opțional)', exact: true }), dialog)
  const rating = venue.getByRole('button', { name: '5 stele', exact: true })
  await rating.click()
  await expect(rating).toHaveAttribute('aria-pressed', 'true')
  const publish = dialog.getByRole('button', { name: 'Publică recenzia', exact: true })
  await expect(publish).toBeEnabled()
  await expectReachableControl(publish, dialog)
  await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  if (process.env.APPOINTMENTS_CAPTURE_DIR) {
    await dialog.locator('.zw-scroll-y').evaluate((element) => { element.scrollTop = 0 })
    await page.screenshot({ path: `${process.env.APPOINTMENTS_CAPTURE_DIR}/implemented-ro-review320.png` })
  }
})
