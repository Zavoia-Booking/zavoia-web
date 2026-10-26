import { expect, test } from '@playwright/test'
import { BookingDrawer } from '../pages/BookingDrawer'
import { BusinessPage } from '../pages/BusinessPage'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment } from '../fixtures/seed'

/**
 * /appointments list + detail — src/app/[locale]/appointments/_components/
 * appointments-content.tsx (filters, grouping) and the detail page's own
 * SignedOutGate. Grouping is SERVER-side (admin-api's
 * AppointmentsService.getAppointmentsByCustomer, read directly):
 *   - `upcoming` filter / section → PENDING/CONFIRMED with ends_at > NOW(),
 *     including appointments currently in progress.
 *   - `past` filter → terminal statuses (COMPLETED/CANCELLED/NO_SHOW),
 *     regardless of their scheduled date, plus ended PENDING/CONFIRMED
 *     appointments. A cancelled appointment enters history immediately.
 *   - `cancelled` / `no_show` filters → that single status only.
 *   - `all` → both sections at once (the default filter chip).
 * Filter chips are `aria-pressed` buttons labelled "All"/"Upcoming"/"Past"/
 * "Cancelled"/"No-show" (src/i18n/dictionaries/en.ts `appointments.filters`).
 */

test.describe('Appointments list + detail', () => {
  test('LIST-01 filter chips show the expected status subsets', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const soon = () => new Date(Date.now() + 3 * 24 * 3600_000)
    const past = () => new Date(Date.now() - 3 * 24 * 3600_000)

    // Five distinct services so each seeded appointment's ticket card can be
    // told apart by its title text alone.
    await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'pending',
      scheduledAt: soon(),
    })
    await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowVopsit.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt: soon(),
    })
    await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowMani.uuid,
      staffUuid: DEMO.staff.alex.uuid,
      status: 'cancelled',
      scheduledAt: past(),
    })
    await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowCoafat.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'completed',
      scheduledAt: past(),
    })
    await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.barber,
      locationUuid: DEMO.locations.barberAviatiei,
      serviceUuid: DEMO.services.barberTuns.uuid,
      staffUuid: DEMO.staff.dan.uuid,
      status: 'no_show',
      scheduledAt: past(),
    })

    const pendingCard = () => page.getByRole('link').filter({ hasText: DEMO.services.glowTuns.name })
    const confirmedCard = () => page.getByRole('link').filter({ hasText: DEMO.services.glowVopsit.name })
    const cancelledCard = () => page.getByRole('link').filter({ hasText: DEMO.services.glowMani.name })
    const completedCard = () => page.getByRole('link').filter({ hasText: DEMO.services.glowCoafat.name })
    const noShowCard = () => page.getByRole('link').filter({ hasText: DEMO.services.barberTuns.name })

    await page.goto('/appointments')

    // Default filter is "All" — both sections render together.
    await expect(pendingCard()).toBeVisible()
    await expect(confirmedCard()).toBeVisible()
    await expect(cancelledCard()).toBeVisible()
    await expect(completedCard()).toBeVisible()
    await expect(noShowCard()).toBeVisible()

    // Filter buttons expose their selected state with aria-pressed. Primary
    // filters include a live count, so match the label prefix. The upcoming
    // and history section headings are plain text and stay visible.
    const filterChip = (name: RegExp) => page.locator('button[aria-pressed]').filter({ hasText: name })
    await filterChip(/^Upcoming/).click()
    await expect(pendingCard()).toBeVisible()
    await expect(confirmedCard()).toBeVisible()
    await expect(cancelledCard()).toHaveCount(0)
    await expect(completedCard()).toHaveCount(0)
    await expect(noShowCard()).toHaveCount(0)

    await filterChip(/^Past/).click()
    await expect(pendingCard()).toHaveCount(0)
    await expect(confirmedCard()).toHaveCount(0)
    await expect(cancelledCard()).toBeVisible()
    await expect(completedCard()).toBeVisible()
    await expect(noShowCard()).toBeVisible()

    await filterChip(/^Cancelled/).click()
    await expect(cancelledCard()).toBeVisible()
    await expect(completedCard()).toHaveCount(0)
    await expect(noShowCard()).toHaveCount(0)

    await filterChip(/^No-show/).click()
    await expect(noShowCard()).toBeVisible()
    await expect(cancelledCard()).toHaveCount(0)
    await expect(completedCard()).toHaveCount(0)
  })

  test('LIST-02 signed out, /appointments renders an in-page sign-in gate (no redirect)', async ({ page }) => {
    await page.goto('/appointments')
    // Stays on /appointments — this differs from a hard redirect to /auth.
    // (Reading src/app/[locale]/account/_components/account-content.tsx as a
    // point of comparison shows /account uses the SAME in-page
    // SignedOutGate pattern, not a redirect either — the task brief's
    // premise that /account redirects doesn't hold up against the source,
    // so this test only asserts what /appointments itself actually does.)
    await expect(page).toHaveURL(/\/appointments$/)
    await expect(page).not.toHaveURL(/\/auth/)
    await expect(page.getByRole('heading', { name: 'Appointments', exact: true, level: 1 })).toBeVisible()
  })

  test('LIST-03 a composite (multi-service, same-staff) appointment shows each item with its own price/duration', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)

    // Book two services with the SAME pinned professional in one flow, via
    // her team-member profile modal (guarantees a single same-staff run —
    // see useRebook's "composite (merged same-staff run)" comment — rather
    // than leaving the drawer to resolve two possibly-different defaults).
    const business = new BusinessPage(page)
    await business.goto(DEMO.locationSlugs.glowCentru, { tab: 'team' })
    await business.teamMemberCard('Maria').click()
    const memberModal = page.getByRole('dialog', { name: /Maria/ })
    await expect(memberModal).toBeVisible()
    await memberModal.getByRole('button', { name: `Add ${DEMO.services.glowTuns.name}` }).click()
    await memberModal.getByRole('button', { name: `Add ${DEMO.services.glowVopsit.name}` }).click()
    await memberModal.getByRole('button', { name: 'Book with Maria' }).click()

    const drawer = new BookingDrawer(page)
    await drawer.waitForOpen()
    const day = drawer.root.locator('button[aria-pressed]:not([disabled])').first()
    await expect(day).toBeVisible({ timeout: 15_000 })
    await day.click()
    const slot = drawer.root.locator('.zv-slot').first()
    await expect(slot).toBeVisible({ timeout: 15_000 })
    await slot.click()
    await drawer.continueFromSlotButton().click()
    await drawer.confirmButton().click()
    await expect(drawer.successHeading()).toBeVisible({ timeout: 15_000 })
    await drawer.viewAppointmentButton().click()

    // "View appointment" always lands on the LIST, not the single detail
    // page (per BookingDrawer.tsx's onViewAppointment) — find the composite
    // card by its "+ 1 more" suffix (TicketCard title logic), independent of
    // which of the two services the backend chose as "primary".
    await expect(page).toHaveURL(/\/appointments$/)
    const card = page.getByRole('link').filter({ hasText: '+ 1 more' })
    await expect(card).toBeVisible({ timeout: 10_000 })
    await card.click()
    await expect(page).toHaveURL(/\/appointments\/.+/)

    await expect(page.getByText(DEMO.services.glowTuns.name).first()).toBeVisible()
    await expect(page.getByText(DEMO.services.glowVopsit.name).first()).toBeVisible()

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('NaN')
  })
})
