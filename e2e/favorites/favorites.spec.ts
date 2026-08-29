import { expect, test } from '@playwright/test'
import { API_URL, authHeader, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getBusinessId, getLocationId, getUserIdByUuid } from '../fixtures/seed'

// Business detail page (src/app/[locale]/business/_components/business-detail.tsx)
// and /saved (src/app/[locale]/saved/_components/saved-content.tsx). No
// data-testid anywhere — every locator below is a role, aria-label or the
// exact visible English copy read straight off those components.

test.describe('Favorites — business page heart', () => {
  test('FAV-01 signed out: no favorite heart renders anywhere on the business page', async ({ page }) => {
    await page.goto(`/business/${DEMO.locationSlugs.glowCentru}`)
    // Wait for the page to actually be rendered before asserting an absence,
    // so a "count 0" pass can't just mean "nothing has painted yet".
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()

    // FavoriteHeart is proactively gated (`if (!canFavorite) return null`) —
    // there is no button to click and no "sign in" prompt to see, the heart
    // simply never exists in the DOM for a signed-out visitor.
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Remove from saved' })).toHaveCount(0)
  })

  test('FAV-02 toggle a location favorite from the business page, then manage it from /saved (incl. Undo)', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)
    await page.goto(`/business/${DEMO.locationSlugs.glowCentru}`)

    const heart = page.getByRole('button', { name: 'Save' })
    await expect(heart).toBeVisible()
    await heart.click()

    const removeHeart = page.getByRole('button', { name: 'Remove from saved' })
    await expect(removeHeart).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/saved')
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()
    // Row title = location name ("Centrul Vechi"), eyebrow = business name
    // ("Atelier Glow") — the business page's heart favorites the LOCATION.
    await expect(page.getByText('Centrul Vechi', { exact: true })).toBeVisible()
    await expect(page.getByText('Atelier Glow', { exact: true })).toBeVisible()

    // exact:true: the surrounding saved-item card is ITSELF a role="button"
    // whose accessible name concatenates its visible text plus this same
    // remove button's aria-label, so a substring match resolves to both.
    await page.getByRole('button', { name: 'Remove Centrul Vechi from saved', exact: true }).click()
    const toast = page.getByRole('status')
    await expect(toast).toContainText('Removed · Centrul Vechi')
    await expect(page.getByText('Centrul Vechi', { exact: true })).toHaveCount(0)

    await toast.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Centrul Vechi', { exact: true })).toBeVisible()
    await expect(page.getByText('Atelier Glow', { exact: true })).toBeVisible()
  })
})

test.describe('Favorites — /saved filters', () => {
  test('FAV-03 filter chips (All/Businesses/Locations/People) show the right subset, plus an empty-state for a chip with nothing left', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)

    // Three DIFFERENT entities, one of each kind, favorited directly via the
    // API (no single business-page path exercises all three kinds at once).
    const businessId = await getBusinessId(DEMO.businesses.barber) // "Barber Bros"
    const locationId = await getLocationId(DEMO.locations.zenDorobanti) // "Dorobanți"
    const professionalId = await getUserIdByUuid(DEMO.staff.dan.uuid) // "Dan Mureșan"

    // page.request shares cookies with `page` but never runs the app's own
    // JS, so it never attaches the in-memory access token these protected
    // endpoints need — mint one via the same silent-refresh dance the app uses.
    const headers = await authHeader(page)
    for (const res of await Promise.all([
      page.request.post(`${API_URL}/marketplace/customer/favorite/business/${businessId}`, { headers }),
      page.request.post(`${API_URL}/marketplace/customer/favorite/location/${locationId}`, { headers }),
      page.request.post(`${API_URL}/marketplace/customer/favorite/professional/${professionalId}`, { headers }),
    ])) {
      expect(res.ok()).toBeTruthy()
    }

    await page.goto('/saved')
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

    const businessRow = page.getByText('Barber Bros', { exact: true })
    const locationRow = page.getByText('Dorobanți', { exact: true })
    const personRow = page.getByText('Dan Mureșan', { exact: true })

    // "All" — every kind visible.
    await expect(businessRow).toBeVisible()
    await expect(locationRow).toBeVisible()
    await expect(personRow).toBeVisible()

    // "Businesses" — only the business row.
    await page.getByRole('button', { name: /^Businesses/ }).click()
    await expect(businessRow).toBeVisible()
    await expect(locationRow).toHaveCount(0)
    await expect(personRow).toHaveCount(0)

    // "Locations" — only the location row.
    await page.getByRole('button', { name: /^Locations/ }).click()
    await expect(locationRow).toBeVisible()
    await expect(businessRow).toHaveCount(0)
    await expect(personRow).toHaveCount(0)

    // "People" — only the person row.
    await page.getByRole('button', { name: /^People/ }).click()
    await expect(personRow).toBeVisible()
    await expect(businessRow).toHaveCount(0)
    await expect(locationRow).toHaveCount(0)

    // Remove the only row in the currently-selected "People" filter — the
    // chip itself disappears (its count drops to 0), but the filter
    // selection is unchanged, so the category is now empty under it.
    await page.getByRole('button', { name: 'Remove Dan Mureșan from saved', exact: true }).click()
    await expect(page.getByText('Nothing saved in this category yet.')).toBeVisible()
  })
})
