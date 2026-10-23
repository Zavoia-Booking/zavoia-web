import { expect, test } from '@playwright/test'
import { API_URL, authHeader, signInAsFreshCustomer } from '../fixtures/customer-helpers'
import { DEMO, getLocationId, getUserIdByUuid } from '../fixtures/seed'

// Business detail page (src/app/[locale]/business/_components/business-detail.tsx)
// and /saved (src/app/[locale]/saved/_components/saved-content.tsx). No
// data-testid anywhere — every locator below is a role, aria-label or the
// exact visible English copy read straight off those components.

test.describe('Favorites — business page heart', () => {
  test('FAV-01 signed out: the heart shows and asks to sign in instead of saving', async ({ page }) => {
    await page.goto(`/business/${DEMO.locationSlugs.glowCentru}`)
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()

    // Like the marketplace app, the heart shows for everyone. Signed out it
    // saves nothing and offers sign-in instead.
    const heart = page.getByRole('button', { name: 'Save', exact: true })
    await expect(heart).toBeVisible()
    await heart.click()
    const prompt = page.getByRole('status').filter({ hasText: 'Sign in to save' })
    await expect(prompt).toBeVisible()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    await prompt.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page).toHaveURL(/\/auth\b/)
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

    // Removal hides the row at once; the delete waits for the Undo window,
    // so Undo simply brings the row back.
    await page.getByRole('button', { name: 'Remove Centrul Vechi from saved', exact: true }).click()
    const toast = page.getByRole('status').filter({ hasText: 'Removed · Centrul Vechi' })
    await expect(toast).toContainText('Removed · Centrul Vechi')
    await expect(page.getByText('Centrul Vechi', { exact: true })).toHaveCount(0)

    await toast.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Centrul Vechi', { exact: true })).toBeVisible()
    await expect(page.getByText('Atelier Glow', { exact: true })).toBeVisible()
  })
})

test.describe('Favorites — /saved filters', () => {
  test('FAV-03 filter chips (All/Locations/People) show the right subset, plus an empty-state for a chip with nothing left', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)

    // Customers save locations and people only. One of each, favorited
    // directly via the API (no single page path saves both kinds at once).
    const locationId = await getLocationId(DEMO.locations.zenDorobanti) // "Dorobanți"
    const professionalId = await getUserIdByUuid(DEMO.staff.dan.uuid) // "Dan Mureșan"

    // page.request shares cookies with `page` but never runs the app's own
    // JS, so it never attaches the in-memory access token these protected
    // endpoints need — mint one via the same silent-refresh dance the app uses.
    const headers = await authHeader(page)
    for (const res of await Promise.all([
      page.request.post(`${API_URL}/marketplace/customer/favorite/location/${locationId}`, { headers }),
      page.request.post(`${API_URL}/marketplace/customer/favorite/professional/${professionalId}`, { headers }),
    ])) {
      expect(res.ok()).toBeTruthy()
    }

    await page.goto('/saved')
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible()

    const locationRow = page.getByText('Dorobanți', { exact: true })
    const personRow = page.getByText('Dan Mureșan', { exact: true })

    // "All" — every kind visible. No Businesses filter exists.
    await expect(locationRow).toBeVisible()
    await expect(personRow).toBeVisible()
    await expect(page.getByRole('button', { name: /^Businesses/ })).toHaveCount(0)

    // "Locations" — only the location row.
    await page.getByRole('button', { name: /^Locations/ }).click()
    await expect(locationRow).toBeVisible()
    await expect(personRow).toHaveCount(0)

    // "People" — only the person row.
    await page.getByRole('button', { name: /^People/ }).click()
    await expect(personRow).toBeVisible()
    await expect(locationRow).toHaveCount(0)

    // Remove the only person in the selected filter. Its chip stays visible
    // and selected at zero while the selected type shows its empty state.
    await page.getByRole('button', { name: 'Remove Dan Mureșan from saved', exact: true }).click()
    await expect(page.getByText('No people saved yet.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^People\s*0$/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
