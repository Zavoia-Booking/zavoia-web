import { expect, test } from '@playwright/test'
import { BookingDrawer } from '../pages/BookingDrawer'
import { BusinessPage } from '../pages/BusinessPage'
import { makeTestCustomer, registerCustomerViaApi, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getUserIdByEmail, seedAppointment, setBookingSettings } from '../fixtures/seed'

/**
 * Reschedule flow — src/app/[locale]/appointments/[uuid]/_components/sections.tsx
 * (ActionRail's "Reschedule" ManageRow) and
 * .../_components/actions/reschedule-modal.tsx (the modal itself).
 *
 * Copy verified straight from src/i18n/dictionaries/en.ts before writing any
 * assertion:
 *   - modal: role="dialog" aria-label="Reschedule" (ActionModal sets
 *     aria-label from `title`, no separate heading element)
 *   - footer confirm button: "Confirm new time"
 *   - ManageRow label when allowed: "Reschedule" (no hint span, so the
 *     button's accessible name is exactly that string)
 *   - ManageRow label when the business closed the window:
 *     "Online rescheduling window is closed by the business"
 *   - ManageRow label when the business disallows it outright:
 *     "Reschedule unavailable"
 *   - BOTH disabled cases share the SAME hint span underneath:
 *     "For urgent matters contact the business directly" (shared.ts's
 *     canReschedule() only returns a bool — sections.tsx's ManageRow always
 *     renders the identical hint whenever that bool is false, regardless of
 *     WHICH of the two reasons caused it). The task brief assumed the hint
 *     text differs per reason; reading the source shows it does not — the
 *     LABEL differs, the hint does not. Since the hint text lives inside the
 *     same <button>, its accessible name is the label + hint concatenated,
 *     so the disabled-row assertions below match by substring (no
 *     `exact: true`) rather than an exact name.
 */

test.describe('Reschedule', () => {
  test('RESCH-01 confirmed appointment can be rescheduled to a new time', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)

    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    // NOT `.zw-only-desktop` — that class is also on the header nav ("Explore"
    // etc.), and .first() picks the nav's instance (never changes) over the
    // appointment content's. The date/time block is the div right after the
    // service-name h1 (see the detail page's aria snapshot: heading "Tuns
    // clasic" [level=1] followed by a generic div "Fri, Sep 4 · 17:19 – 18:04").
    const dateTimeBlock = page.getByRole('heading', { level: 1 }).locator('xpath=following-sibling::div[1]')
    const before = await dateTimeBlock.innerText()

    await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Reschedule' })
    await expect(dialog).toBeVisible()

    // The date grid is the sibling directly under the literal "Date" label —
    // its buttons carry no aria-pressed/data-testid (see reschedule-modal.tsx
    // DateGrid), only a real `disabled` attribute on unavailable days.
    const dateContainer = dialog
      .getByText('Date', { exact: true })
      .locator('xpath=following-sibling::div[1]')
    const firstDay = dateContainer.locator('button:not([disabled])').first()
    await expect(firstDay).toBeVisible({ timeout: 15_000 })
    await firstDay.click()

    const firstSlot = dialog.locator('.zv-slot').first()
    await expect(firstSlot).toBeVisible({ timeout: 15_000 })
    await firstSlot.click()

    await dialog.getByRole('button', { name: 'Confirm new time' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Rescheduled to' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(dialog).toBeHidden()

    // Re-fetch and confirm the hero date+time actually changed.
    await page.reload()
    const after = await dateTimeBlock.innerText()
    expect(after).not.toBe(before)
  })

  test('RESCH-03a reschedule row is disabled once the business-set window has closed', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    // A huge window (relative to the seed's real defaults) plus an appointment
    // only 2h out guarantees minutesUntil() < rescheduleWindowMinutes.
    await setBookingSettings(DEMO.businesses.barber, {
      rescheduleWindowMinutes: 999_999,
      allowCustomerReschedule: true,
    })
    const scheduledAt = new Date(Date.now() + 2 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.barber,
      locationUuid: DEMO.locations.barberAviatiei,
      serviceUuid: DEMO.services.barberTuns.uuid,
      staffUuid: DEMO.staff.dan.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    // Scoped to this specific row, not a page-wide getByText: the hint span
    // "For urgent matters contact the business directly" is IDENTICAL for
    // every disabled ManageRow (reschedule and cancel both use it), so an
    // untargeted search is ambiguous whenever more than one row is disabled
    // at once — including via booking_settings state another spec left on
    // this same business (booking_settings is per-business, not per-test).
    const row = page.getByRole('button', { name: 'Online rescheduling window is closed by the business' })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    await expect(row).toContainText('For urgent matters contact the business directly')
  })

  test('RESCH-03b reschedule row is disabled when the business disallows online rescheduling entirely', async ({
    page,
  }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    await setBookingSettings(DEMO.businesses.zen, { allowCustomerReschedule: false })
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.zen,
      locationUuid: DEMO.locations.zenDorobanti,
      serviceUuid: DEMO.services.zenRelax.uuid,
      staffUuid: DEMO.staff.ioana.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    // Scoped to this row — see the comment on RESCH-03a for why an
    // untargeted page-wide getByText is ambiguous here.
    const row = page.getByRole('button', { name: 'Reschedule unavailable' })
    await expect(row).toBeVisible()
    await expect(row).toBeDisabled()
    // Same hint copy as the window-closed case (see the file-level note above).
    await expect(row).toContainText('For urgent matters contact the business directly')
  })

  test('RESCH-03c a cancelled appointment offers no reschedule action at all', async ({ page }) => {
    const customer = await signInAsFreshCustomer(page)
    const customerId = await getUserIdByEmail(customer.email)
    const scheduledAt = new Date(Date.now() + 4 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId,
      businessUuid: DEMO.businesses.smile,
      locationUuid: DEMO.locations.smileCluj,
      serviceUuid: DEMO.services.smileConsult.uuid,
      staffUuid: DEMO.staff.pop.uuid,
      status: 'cancelled',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await expect(page.getByRole('button', { name: 'Reschedule', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reschedule unavailable' })).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Online rescheduling window is closed by the business' }),
    ).toHaveCount(0)
  })

  test('RESCH-04 confirming a stale slot selection surfaces the conflict and clears the picked slot', async ({
    page,
    browser,
  }) => {
    const customerA = await signInAsFreshCustomer(page)
    const customerIdA = await getUserIdByEmail(customerA.email)
    const scheduledAt = new Date(Date.now() + 6 * 24 * 3600_000)
    const { uuid } = await seedAppointment({
      customerId: customerIdA,
      businessUuid: DEMO.businesses.glow,
      locationUuid: DEMO.locations.glowCentru,
      serviceUuid: DEMO.services.glowTuns.uuid,
      staffUuid: DEMO.staff.maria.uuid,
      status: 'confirmed',
      scheduledAt,
    })

    await page.goto(`/appointments/${uuid}`)
    await page.getByRole('button', { name: 'Reschedule', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Reschedule' })
    await expect(dialog).toBeVisible()

    const dateContainer = dialog
      .getByText('Date', { exact: true })
      .locator('xpath=following-sibling::div[1]')
    const dayA = dateContainer.locator('button:not([disabled])').first()
    await expect(dayA).toBeVisible({ timeout: 15_000 })
    await dayA.click()
    const slotA = dialog.locator('.zv-slot').first()
    await expect(slotA).toBeVisible({ timeout: 15_000 })
    await slotA.click()
    // Confirms a slot is actually picked (footer swaps from "Pick a slot to
    // continue" to the chosen-time summary) before we let a second customer
    // race it.
    await expect(dialog.getByText('New time', { exact: true })).toBeVisible()

    // Second customer, separate browser context (own cookie jar), books the
    // SAME staff member (Maria) for the SAME service via her team-member
    // modal — pinning teamMemberId the same way the reschedule modal did —
    // then picks "first available day, first available slot" exactly like
    // customer A did above. Since both flows query the identical
    // Maria-pinned availability within seconds of each other, this
    // deterministically lands on the same slot without needing to parse or
    // replicate any visible date/time text (which would be unreliable: e.g.
    // "2:30 PM" is a literal substring of "12:30 PM").
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    const customerB = makeTestCustomer()
    await registerCustomerViaApi(page2.request, customerB)

    const business2 = new BusinessPage(page2)
    await business2.goto(DEMO.locationSlugs.glowCentru, { tab: 'team' })
    await business2.teamMemberCard('Maria').click()
    const memberModal = page2.getByRole('dialog', { name: /Maria/ })
    await expect(memberModal).toBeVisible()
    await memberModal.getByRole('button', { name: `Add ${DEMO.services.glowTuns.name}` }).click()
    await memberModal.getByRole('button', { name: 'Book with Maria' }).click()

    const drawer2 = new BookingDrawer(page2)
    await drawer2.waitForOpen()
    const dayB = drawer2.root.locator('button[aria-pressed]:not([disabled])').first()
    await expect(dayB).toBeVisible({ timeout: 15_000 })
    await dayB.click()
    const slotB = drawer2.root.locator('.zv-slot').first()
    await expect(slotB).toBeVisible({ timeout: 15_000 })
    await slotB.click()
    await drawer2.continueFromSlotButton().click()
    await drawer2.confirmButton().click()
    await expect(drawer2.successHeading()).toBeVisible({ timeout: 15_000 })
    await context2.close()

    // Customer A confirms their now-stale selection.
    await dialog.getByRole('button', { name: 'Confirm new time' }).click()
    await expect(dialog.getByRole('alert')).toContainText('That slot was just taken', {
      timeout: 10_000,
    })
    // The picked slot was cleared and the day's slots refetched — footer
    // reverts to the "pick a slot" prompt.
    await expect(dialog.getByText('Pick a slot to continue', { exact: true })).toBeVisible()
  })
})
