import { expect, type Locator, type Page } from '@playwright/test'

/**
 * The booking drawer (src/lib/booking/BookingDrawer.tsx) — a `role="dialog"
 * aria-label="Book an appointment"` sheet. Calendar buttons carry their ISO
 * date in `data-date`; slot buttons use `.zv-slot`. Both expose selection
 * through aria-pressed, so date selectors must always use data-date.
 *
 * Step 1 (services) only exists when the drawer was opened with an empty
 * selection (page-level "Book" with nothing pre-picked). Opening from a
 * preselected service, a team-member modal, or a rebook always skips
 * straight to Step 2 (date/time/staff) — `stepOneReached` tells you which
 * case you're in for a given test.
 */
export class BookingDrawer {
  readonly page: Page
  readonly root: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByRole('dialog', { name: 'Book an appointment' })
  }

  async waitForOpen(): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: 15_000 })
  }

  closeButton(): Locator {
    return this.root.getByRole('button', { name: 'Close' })
  }

  backButton(): Locator {
    return this.root.getByRole('button', { name: 'Back' })
  }

  stepLabel(n: 1 | 2 | 3): Locator {
    // Keep callers' logical step numbers when a preselected booking skips the
    // service picker and displays progress as 1 / 2 rather than 2 / 3.
    const names = { 1: 'Choose services', 2: 'Pick a date & time', 3: 'Review & confirm' }
    return this.root.getByRole('heading', { name: names[n], exact: true })
  }

  // --- Step 1: choose services (only when the drawer opened empty) ---

  /** Service rows here have NO aria-label — match on the row's own accessible name (its rendered text: name + duration/price). */
  serviceRow(serviceName: string): Locator {
    return this.root.getByRole('button').filter({ hasText: serviceName })
  }

  continueFromServicesButton(): Locator {
    return this.root.getByRole('button', { name: 'Continue' })
  }

  // --- Step 2: date, time, staff ---

  dayCell(opts: { dayNumber?: string } = {}): Locator {
    return opts.dayNumber
      ? this.root.locator('button[data-date]').filter({ has: this.page.getByText(String(Number(opts.dayNumber)), { exact: true }) })
      : this.root.locator('button[data-date]')
  }

  /**
   * Exact day-of-month match within the currently visible week. ISO-date
   * navigation below avoids ambiguity when a calendar spans two months.
   */
  exactDayCell(dayNumber: number): Locator {
    return this.dayCell({ dayNumber: String(dayNumber) })
  }

  /** Clicks the day matching `isoDate` (YYYY-MM-DD), then the slot labelled `timeLabel` on it. For use with a slot already located via a direct API query (see fixtures/availability.ts) — much faster and more reliable than scanning through the UI. */
  async goToDateAndSlot(isoDate: string, timeLabel: string): Promise<void> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error(`Invalid booking date: ${isoDate}`)
    await this.dayCell().first().waitFor({ state: 'visible', timeout: 15_000 })
    const visitedPages = new Set<string>()
    const day = this.root.locator(`button[data-date="${isoDate}"]`)
    while (!(await day.count())) {
      const firstDate = await this.dayCell().first().getAttribute('data-date')
      if (!firstDate || visitedPages.has(firstDate)) break
      visitedPages.add(firstDate)
      if (!(await this.changeDatePage(isoDate < firstDate ? 'previous' : 'next'))) break
    }
    if (!(await day.count())) throw new Error(`Booking date ${isoDate} is outside the loaded calendar.`)
    await day.click()
    const target = this.slot(timeLabel)
    await target.waitFor({ state: 'visible', timeout: 15_000 })
    await target.click()
  }

  /** A slot button — `.zv-slot`, labelled with the localized time e.g. "10:00 AM". Match by the exact visible time label. */
  slot(timeLabel: string): Locator {
    return this.root.locator('.zv-slot', { hasText: timeLabel })
  }

  anyAvailableStaffChip(): Locator {
    return this.root.getByRole('button', { name: 'Any available' })
  }

  /** Existing callers pass a first name; the redesigned cards display full names and optional figures. */
  staffChip(firstName: string): Locator {
    const escapedName = firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return this.root.getByRole('button', { name: new RegExp(`^${escapedName}(?:\\s|$)`) })
  }

  staffVariesNote(): Locator {
    return this.root.getByText('Price and time differ by professional — choose who you’d like.')
  }

  continueFromSlotButton(): Locator {
    return this.root.getByRole('button', { name: 'Continue' })
  }

  /**
   * Availability is computed per slot — a staff member offered on one slot
   * of the day is not guaranteed to be offered on every other (an earlier
   * booking, a calendar block, or — with a price/duration override active —
   * simply not enough room before the next commitment can all exclude them
   * from a given slot without excluding them from the day). Don't assume
   * slot #1 offers a specific person; scan forward until one does. If a
   * run happens to land late in the working day, "today" may have too
   * narrow a remaining window for a longer (overridden) service to fit
   * anywhere at all — fall through to the next enabled day in that case.
   * Clicks the first matching slot and returns its visible time label (for
   * `.slot(label)` lookups later, e.g. after a reload); throws if no slot
   * across the days tried offers this person.
   */
  async pickSlotOffering(firstName: string, opts: { maxDays?: number } = {}): Promise<string> {
    // 3 days proved too narrow in a live run: with ~95 tests sharing the
    // same handful of demo staff and booking real near-term slots
    // throughout a single run, the first few days can get contended before
    // a later test gets its turn (confirmed via a direct API check on a
    // clean DB — availableStaffIds was correct for every slot; the app/
    // backend logic isn't the issue here, shared-calendar contention is).
    const maxDays = opts.maxDays ?? 14
    await this.dayCell().first().waitFor({ state: 'visible', timeout: 15_000 })
    const previousPages = new Set<string>()
    while (true) {
      const firstDate = await this.dayCell().first().getAttribute('data-date')
      if (!firstDate || previousPages.has(firstDate)) break
      previousPages.add(firstDate)
      if (!(await this.changeDatePage('previous'))) break
    }
    const visitedPages = new Set<string>()
    const triedDates = new Set<string>()
    const triedCounts: number[] = []
    while (triedDates.size < maxDays) {
      const firstDate = await this.dayCell().first().getAttribute('data-date')
      if (!firstDate || visitedPages.has(firstDate)) break
      visitedPages.add(firstDate)
      const dates = await this.root.locator('button[data-date]:not(:disabled)').evaluateAll((days) =>
        days.map((day) => day.getAttribute('data-date')!),
      )
      for (const date of dates) {
        if (triedDates.size >= maxDays) break
        triedDates.add(date)
        await this.root.locator(`button[data-date="${date}"]`).click()
        const slots = this.root.locator('.zv-slot')
        await slots.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})
        const slotCount = await slots.count()
        triedCounts.push(slotCount)
        for (let i = 0; i < slotCount; i++) {
          const candidate = slots.nth(i)
          await candidate.click()
          if (await this.staffChip(firstName).isVisible().catch(() => false)) {
            return ((await candidate.textContent()) ?? '').trim()
          }
        }
      }
      if (triedDates.size >= maxDays || !(await this.changeDatePage('next'))) break
    }
    throw new Error(
      `pickSlotOffering: no slot across ${triedDates.size} day(s) (slot counts: ${triedCounts.join(', ')}) offers "${firstName}".`,
    )
  }

  /** Pages only through the already-loaded calendar; verifies progress so scans cannot loop indefinitely. */
  private async changeDatePage(direction: 'previous' | 'next'): Promise<boolean> {
    const button = this.root.getByRole('button', { name: direction === 'previous' ? 'Previous dates' : 'Next dates', exact: true })
    if (!(await button.count()) || !(await button.isEnabled())) return false
    const firstDate = await this.dayCell().first().getAttribute('data-date')
    await button.click()
    await expect(this.dayCell().first()).not.toHaveAttribute('data-date', firstDate ?? '')
    return true
  }

  // --- Step 3: review & confirm ---

  confirmButton(): Locator {
    // "Sign in to book" when signed out, "Confirm booking" when authenticated, "Booking…" while submitting (disabled).
    return this.root.getByRole('button', { name: /^(Confirm booking|Sign in to book|Booking…)$/ })
  }

  submitAlert(): Locator {
    return this.root.getByRole('alert')
  }

  // --- Success / blocked screens ---

  successHeading(): Locator {
    // "You're booked" when auto-confirmed, "Booking requested" when the business requires manual confirmation.
    return this.page.getByRole('heading', { name: /^(You.re booked|Booking requested)$/ })
  }

  viewAppointmentButton(): Locator {
    return this.page.getByRole('button', { name: 'View appointment' })
  }

  blockedHeading(): Locator {
    return this.page.getByRole('heading', {
      name: /^(Online booking unavailable|This business books by phone|Location unavailable|Service no longer offered|No professionals available|Professional unavailable)$/,
    })
  }

  bookWithAnyProfessionalButton(): Locator {
    return this.page.getByRole('button', { name: 'Book with any professional' })
  }
}
