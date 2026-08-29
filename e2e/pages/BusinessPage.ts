import type { Locator, Page } from '@playwright/test'

/**
 * /business/[slug] — the location detail page. Selectors read directly off
 * src/app/[locale]/business/_components/business-detail.tsx. No
 * data-testid anywhere in this app — everything below is a role, aria-label
 * or the exact visible English copy.
 */
export class BusinessPage {
  readonly page: Page

  readonly tablist: Locator
  readonly servicesTab: Locator
  readonly teamTab: Locator
  readonly reviewsTab: Locator
  readonly aboutTab: Locator

  readonly shareButton: Locator
  readonly seeOnMapLink: Locator

  constructor(page: Page) {
    this.page = page
    this.tablist = page.getByRole('tablist')
    this.servicesTab = page.getByRole('tab', { name: 'Services' })
    this.teamTab = page.getByRole('tab', { name: 'Team' })
    this.reviewsTab = page.getByRole('tab', { name: 'Reviews' })
    this.aboutTab = page.getByRole('tab', { name: 'About' })
    this.shareButton = page.getByRole('button', { name: 'Share' })
    this.seeOnMapLink = page.getByRole('link', { name: 'See on map' })
  }

  async goto(locationSlug: string, opts?: { tab?: 'team' | 'reviews' | 'about'; member?: number }): Promise<void> {
    const params = new URLSearchParams()
    if (opts?.tab) params.set('tab', opts.tab)
    if (opts?.member) params.set('member', String(opts.member))
    const qs = params.toString()
    await this.page.goto(`/business/${locationSlug}${qs ? `?${qs}` : ''}`)
  }

  /** A service row's add/remove toggle — `aria-label="Add {name}" | "Remove {name}"`, `aria-pressed`. */
  serviceToggle(serviceName: string): Locator {
    return this.page.getByRole('button', { name: `Add ${serviceName}` }).or(
      this.page.getByRole('button', { name: `Remove ${serviceName}` }),
    )
  }

  async addService(serviceName: string): Promise<void> {
    await this.page.getByRole('button', { name: `Add ${serviceName}` }).click()
  }

  /**
   * Booking CTA — desktop rail or mobile bottom bar, both render the same
   * accessible name via bookLabel(): "Book now" (nothing selected),
   * "Book 1 service", "Book {n} services", or "Select a service to book"
   * equivalents inside the team-member modal (see BookingDrawer notes).
   * Pass the exact expected label; falls back to a name-agnostic match.
   */
  bookButton(label?: string): Locator {
    return label
      ? this.page.getByRole('button', { name: label, exact: true })
      : this.page.getByRole('button', { name: /^Book/ })
  }

  /** Team member card on the Team tab — role="button" tabIndex=0 divs, matched by their visible name text. */
  teamMemberCard(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(name) })
  }

  notFoundHeading(): Locator {
    // .first(): renders in both a mobile and a desktop layout node at once
    // (CSS-toggled, not unmounted) — a live run showed 2 identical <h1>s.
    return this.page.getByText("This place isn't on Zavoia.").first()
  }
}
