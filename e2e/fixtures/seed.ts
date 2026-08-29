/**
 * Marketplace fixtures on top of the demo-4-businesses baseline that
 * e2e/global-setup.ts loads before every run (admin-api/scripts/seed-demo-4-businesses.sql).
 *
 * Schema for every helper here was read directly from the matching admin-api
 * entity file, not guessed — if you add a new helper, do the same
 * (`admin-api/src/entities/<name>.entity.ts`) rather than assuming a column
 * name from this file's style.
 *
 * The demo baseline gives you, ready-made:
 *   - DEMO_OWNER: an OWNER-only account (no CUSTOMER role) — the exact
 *     precondition the multi-role account-linking suite needs. It is SHARED
 *     across the whole run, so only one spec may actually complete the
 *     link on it; every other auth-linking test should mint its own owner
 *     via registerBusinessOwnerViaApi in customer-helpers.ts instead.
 *   - 4 businesses / 6 locations / 13 services / 7 staff, all real rows —
 *     see the DEMO map below for uuids, slugs and base price/duration.
 */
import { randomUUID } from 'node:crypto'
import { withTestDb } from './test-db'

export const DEMO_OWNER = {
  email: 'andrei.sandica.94+demo@gmail.com',
  password: 'Parola123!',
}

// bcrypt(12) of 'Parola123!' — reuse this to hand-insert a "user" row with a
// known-working password without round-tripping through the register API.
export const DEMO_PASSWORD = 'Parola123!'
export const DEMO_PASSWORD_HASH =
  '$2b$12$B.T8QTnr.1jZXdyBFgyqUO4clnnE/bHTqeN8qBfMiK.mPW1PCq4au'

export const DEMO = {
  businesses: {
    glow: 'demo-b-glow',
    barber: 'demo-b-barber',
    zen: 'demo-b-zen',
    smile: 'demo-b-smile',
  },
  // uuid -> also the value seeded into location.uuid (NOT the public slug).
  locations: {
    glowCentru: 'demo-l-glow',
    glowBaneasa: 'demo-l-glow-2',
    barberAviatiei: 'demo-l-barber',
    barberMilitari: 'demo-l-barber-2',
    zenDorobanti: 'demo-l-zen',
    smileCluj: 'demo-l-smile',
  },
  // location.slug — what actually appears in a /business/<slug> URL.
  locationSlugs: {
    glowCentru: 'demo-atelier-glow-centru',
    glowBaneasa: 'demo-atelier-glow-baneasa',
    barberAviatiei: 'demo-barber-bros-aviatiei',
    barberMilitari: 'demo-barber-bros-militari',
    zenDorobanti: 'demo-zen-spa-dorobanti',
    smileCluj: 'demo-smile-dental-cluj',
  },
  // priceMinor/duration are the SERVICE-level defaults (no override applied).
  services: {
    glowTuns: { uuid: 'demo-s-glow-tuns', name: 'Tuns & styling', priceMinor: 12000, duration: 60 },
    glowVopsit: { uuid: 'demo-s-glow-vopsit', name: 'Vopsit complet', priceMinor: 28000, duration: 120 },
    glowMani: { uuid: 'demo-s-glow-mani', name: 'Manichiură clasică', priceMinor: 9000, duration: 45 },
    glowCoafat: { uuid: 'demo-s-glow-coafat', name: 'Coafat evenimente', priceMinor: 20000, duration: 90 },
    barberTuns: { uuid: 'demo-s-barber-tuns', name: 'Tuns clasic', priceMinor: 8000, duration: 45 },
    barberBarba: { uuid: 'demo-s-barber-barba', name: 'Barbă & contur', priceMinor: 5000, duration: 30 },
    barberPachet: { uuid: 'demo-s-barber-pachet', name: 'Pachet tuns + barbă', priceMinor: 12000, duration: 75 },
    zenRelax: { uuid: 'demo-s-zen-relax', name: 'Masaj de relaxare', priceMinor: 18000, duration: 60 },
    zenDeep: { uuid: 'demo-s-zen-deep', name: 'Masaj deep tissue', priceMinor: 25000, duration: 90 },
    zenReflexo: { uuid: 'demo-s-zen-reflexo', name: 'Reflexoterapie', priceMinor: 10000, duration: 30 },
    smileConsult: { uuid: 'demo-s-smile-consult', name: 'Consultație stomatologică', priceMinor: 15000, duration: 30 },
    smileDetartraj: { uuid: 'demo-s-smile-detartraj', name: 'Detartraj & periaj profesional', priceMinor: 25000, duration: 45 },
    smileAlbire: { uuid: 'demo-s-smile-albire', name: 'Albire dentară', priceMinor: 60000, duration: 60 },
  },
  // Who can perform what, per the seed's user_service_location rows — use
  // this to pick a service/location pair with the staff shape a test needs
  // (single-staff for an exact-price assertion, multi-staff to force a pick).
  staff: {
    maria: { uuid: 'demo-u-maria', canPerform: ['glowTuns', 'glowVopsit', 'glowCoafat'], at: ['glowCentru'] },
    alex: { uuid: 'demo-u-alex', canPerform: ['glowTuns', 'glowMani'], at: ['glowCentru', 'glowBaneasa'] },
    dan: { uuid: 'demo-u-dan', canPerform: ['barberTuns', 'barberBarba', 'barberPachet'], at: ['barberAviatiei'] },
    vlad: { uuid: 'demo-u-vlad', canPerform: ['barberTuns', 'barberBarba'], at: ['barberAviatiei', 'barberMilitari'] },
    ioana: { uuid: 'demo-u-ioana', canPerform: ['zenRelax', 'zenDeep', 'zenReflexo'], at: ['zenDorobanti'] },
    pop: { uuid: 'demo-u-pop', canPerform: ['smileConsult', 'smileDetartraj', 'smileAlbire'], at: ['smileCluj'] },
    elena: { uuid: 'demo-u-elena', canPerform: ['smileDetartraj'], at: ['smileCluj'] },
  },
} as const

export type DemoLocationKey = keyof typeof DEMO.locations
export type DemoServiceKey = keyof typeof DEMO.services
export type DemoStaffKey = keyof typeof DEMO.staff

async function idByUuid(table: 'business' | 'location' | 'service', uuid: string): Promise<number> {
  return withTestDb(async (client) => {
    const res = await client.query<{ id: number }>(`SELECT id FROM ${table} WHERE uuid = $1`, [uuid])
    if (res.rowCount === 0) {
      throw new Error(`${table} with uuid=${uuid} not found — did global-setup's demo seed run?`)
    }
    return res.rows[0].id
  })
}

export async function getUserIdByUuid(uuid: string): Promise<number> {
  return withTestDb(async (client) => {
    const res = await client.query<{ id: number }>('SELECT id FROM "user" WHERE uuid = $1', [uuid])
    if (res.rowCount === 0) throw new Error(`user with uuid=${uuid} not found`)
    return res.rows[0].id
  })
}

export async function getUserIdByEmail(email: string): Promise<number> {
  return withTestDb(async (client) => {
    const res = await client.query<{ id: number }>('SELECT id FROM "user" WHERE email = $1', [email])
    if (res.rowCount === 0) throw new Error(`user with email=${email} not found`)
    return res.rows[0].id
  })
}

export const getBusinessId = (uuid: string) => idByUuid('business', uuid)
export const getLocationId = (uuid: string) => idByUuid('location', uuid)
export const getServiceId = (uuid: string) => idByUuid('service', uuid)

/**
 * Upserts booking_settings for a business (schema: admin-api/src/entities/bookingSettings.entity.ts).
 * Only pass the fields your test cares about — every other column keeps its
 * DB default (autoConfirmBookings=true, cancellationWindowMinutes=1440, etc.)
 * on first insert, or its current value on a repeat call for the same business.
 */
export interface BookingSettingsOverrides {
  autoConfirmBookings?: boolean
  minAdvanceBookingMinutes?: number
  maxAdvanceBookingMinutes?: number | null
  slotIntervalMinutes?: number
  bufferTimeMinutes?: number
  cancellationWindowMinutes?: number
  rescheduleWindowMinutes?: number
  allowCustomerCancellation?: boolean
  allowCustomerReschedule?: boolean
}

export async function setBookingSettings(
  businessUuid: string,
  overrides: BookingSettingsOverrides,
): Promise<void> {
  const businessId = await getBusinessId(businessUuid)
  const columns = Object.keys(overrides)
  if (columns.length === 0) return
  await withTestDb(async (client) => {
    const existing = await client.query('SELECT id FROM booking_settings WHERE "businessId" = $1', [businessId])
    if (existing.rowCount === 0) {
      const cols = ['"businessId"', ...columns.map((c) => `"${c}"`)]
      const params = [businessId, ...columns.map((c) => (overrides as Record<string, unknown>)[c])]
      const placeholders = params.map((_, i) => `$${i + 1}`)
      await client.query(
        `INSERT INTO booking_settings (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
        params,
      )
    } else {
      const sets = columns.map((c, i) => `"${c}" = $${i + 2}`)
      const params = [businessId, ...columns.map((c) => (overrides as Record<string, unknown>)[c])]
      await client.query(
        `UPDATE booking_settings SET ${sets.join(', ')} WHERE "businessId" = $1`,
        params,
      )
    }
  })
}

/**
 * Upserts a location-level price/duration override (location_service —
 * schema: admin-api/src/entities/locationService.entity.ts). Pass null to
 * clear an override back to "inherit from service default".
 */
export async function setLocationServiceOverride(
  locationUuid: string,
  serviceUuid: string,
  overrides: { customPrice?: number | null; customDuration?: number | null; isEnabled?: boolean },
): Promise<void> {
  const locationId = await getLocationId(locationUuid)
  const serviceId = await getServiceId(serviceUuid)
  await withTestDb(async (client) => {
    await client.query(
      `INSERT INTO location_service ("locationId","serviceId","customPrice","customDuration","isEnabled")
       VALUES ($1,$2,$3,$4,COALESCE($5, true))
       ON CONFLICT ("locationId","serviceId") DO UPDATE SET
         "customPrice" = COALESCE($3, location_service."customPrice"),
         "customDuration" = COALESCE($4, location_service."customDuration"),
         "isEnabled" = COALESCE($5, location_service."isEnabled")`,
      [locationId, serviceId, overrides.customPrice ?? null, overrides.customDuration ?? null, overrides.isEnabled ?? null],
    )
  })
}

/**
 * Upserts a staff-level price/duration override (user_service_location —
 * schema: admin-api/src/entities/userServiceLocation.entity.ts). The row
 * must already exist as a capability grant (seeded by the demo baseline for
 * every staff/service/location combo in DEMO.staff[x].canPerform) — this
 * only touches customPrice/customDuration/canPerform on top of it.
 */
export async function setStaffServiceOverride(
  staffUuid: string,
  serviceUuid: string,
  locationUuid: string,
  overrides: { customPrice?: number | null; customDuration?: number | null; canPerform?: boolean },
): Promise<void> {
  const userId = await getUserIdByUuid(staffUuid)
  const serviceId = await getServiceId(serviceUuid)
  const locationId = await getLocationId(locationUuid)
  await withTestDb(async (client) => {
    await client.query(
      `INSERT INTO user_service_location ("userId","serviceId","locationId","customPrice","customDuration","canPerform")
       VALUES ($1,$2,$3,$4,$5,COALESCE($6, true))
       ON CONFLICT ("userId","serviceId","locationId") DO UPDATE SET
         "customPrice" = COALESCE($4, user_service_location."customPrice"),
         "customDuration" = COALESCE($5, user_service_location."customDuration"),
         "canPerform" = COALESCE($6, user_service_location."canPerform")`,
      [userId, serviceId, locationId, overrides.customPrice ?? null, overrides.customDuration ?? null, overrides.canPerform ?? null],
    )
  })
}

/** Removes every staff capability for one service at one location — makes that service staffless there. */
export async function clearStaffForService(locationUuid: string, serviceUuid: string): Promise<void> {
  const locationId = await getLocationId(locationUuid)
  const serviceId = await getServiceId(serviceUuid)
  await withTestDb(async (client) => {
    await client.query(
      'DELETE FROM user_service_location WHERE "locationId" = $1 AND "serviceId" = $2',
      [locationId, serviceId],
    )
  })
}

export interface SeedAppointmentArgs {
  customerId: number
  businessUuid: string
  locationUuid: string
  serviceUuid: string
  staffUuid: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  scheduledAt: Date
  /** Defaults to the service's seed price/duration — pass to simulate a staff/location override that was active at booking time. */
  priceMinor?: number
  durationMinutes?: number
}

/**
 * Inserts a real `appointment` row (+ its `appointment_staff_users` join
 * row) bypassing the booking drawer/API entirely, for specs that need an
 * appointment already sitting in a specific status (completed, cancelled,
 * a past no-show, ...) rather than walking the UI to create one every time.
 * Schema: admin-api/src/entities/appointment.entity.ts.
 *
 * Do NOT use this for the actual booking-flow specs (BOOK-*, PRICE-*) —
 * those must exercise the real drawer end-to-end. Use it for the specs
 * that need a pre-existing appointment as a precondition (REV-*, RESCH-*,
 * CANC-*, LIST-*, REBK-*).
 */
export async function seedAppointment(args: SeedAppointmentArgs): Promise<{ id: number; uuid: string }> {
  return withTestDb(async (client) => {
    const business = await client.query<{ id: number; businessCurrency: string }>(
      'SELECT id, "businessCurrency" FROM business WHERE uuid = $1',
      [args.businessUuid],
    )
    const location = await client.query<{ id: number; uuid: string; name: string; address: string }>(
      'SELECT id, uuid, name, address FROM location WHERE uuid = $1',
      [args.locationUuid],
    )
    const service = await client.query<{ id: number; uuid: string; name: string; description: string | null; price_amount_minor: number; duration: number }>(
      'SELECT id, uuid, name, description, price_amount_minor, duration FROM service WHERE uuid = $1',
      [args.serviceUuid],
    )
    const staff = await client.query<{ id: number; uuid: string; firstName: string; lastName: string }>(
      'SELECT id, uuid, "firstName", "lastName" FROM "user" WHERE uuid = $1',
      [args.staffUuid],
    )
    const customer = await client.query<{ id: number; uuid: string; firstName: string; lastName: string; email: string | null; phone: string | null }>(
      'SELECT id, uuid, "firstName", "lastName", email, phone FROM "user" WHERE id = $1',
      [args.customerId],
    )
    if (business.rowCount === 0) throw new Error(`business uuid=${args.businessUuid} not found`)
    if (location.rowCount === 0) throw new Error(`location uuid=${args.locationUuid} not found`)
    if (service.rowCount === 0) throw new Error(`service uuid=${args.serviceUuid} not found`)
    if (staff.rowCount === 0) throw new Error(`staff uuid=${args.staffUuid} not found`)
    if (customer.rowCount === 0) throw new Error(`customer id=${args.customerId} not found`)

    const svc = service.rows[0]
    const loc = location.rows[0]
    const st = staff.rows[0]
    const cust = customer.rows[0]
    const duration = args.durationMinutes ?? svc.duration
    const price = args.priceMinor ?? svc.price_amount_minor
    const scheduledAt = args.scheduledAt
    const endsAt = new Date(scheduledAt.getTime() + duration * 60_000)
    const uuid = randomUUID()

    const staffSnapshot = [
      { userId: st.id, userUuid: st.uuid, firstName: st.firstName, lastName: st.lastName, profileImage: null, professionalTitle: null },
    ]
    const customerSnapshot = {
      userId: cust.id, userUuid: cust.uuid, firstName: cust.firstName, lastName: cust.lastName,
      email: cust.email, phone: cust.phone, profileImage: null,
    }
    const locationSnapshot = { locationId: loc.id, locationUuid: loc.uuid, locationName: loc.name, address: loc.address }

    const inserted = await client.query<{ id: number; uuid: string }>(
      `INSERT INTO appointment
        (uuid, "businessId", "customerId", "serviceId", "locationId",
         "bookingType", "bookingSource", "staffSnapshot", "customerSnapshot", "locationSnapshot",
         "bookedItemName", "bookedItemDescription", duration, price, currency,
         scheduled_at, ends_at, status)
       VALUES
        ($1, $2, $3, $4, $5,
         'service', 'marketplace', $6::jsonb, $7::jsonb, $8::jsonb,
         $9, $10, $11, $12, $13,
         $14, $15, $16)
       RETURNING id, uuid`,
      [
        uuid, business.rows[0].id, args.customerId, svc.id, loc.id,
        JSON.stringify(staffSnapshot), JSON.stringify(customerSnapshot), JSON.stringify(locationSnapshot),
        svc.name, svc.description, duration, price, business.rows[0].businessCurrency,
        scheduledAt.toISOString(), endsAt.toISOString(), args.status,
      ],
    )
    const appt = inserted.rows[0]
    await client.query(
      'INSERT INTO appointment_staff_users (appointment_id, user_id) VALUES ($1, $2)',
      [appt.id, st.id],
    )
    return appt
  })
}
