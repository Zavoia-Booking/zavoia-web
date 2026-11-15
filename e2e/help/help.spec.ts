import { expect, test } from '@playwright/test'

/**
 * /help — src/app/[locale]/help/_components/help-center.tsx (FAQ search) and
 * ./report-issue.tsx (guest ticket form). Zero data-testid: locators are the
 * exact visible English copy from src/i18n/dictionaries/en.ts.
 */

test.describe('Help centre', () => {
  test('HELP-01 the FAQ search box filters Q&A rows and shows a no-results state for a nonsense query', async ({ page }) => {
    await page.goto('/help')

    const search = page.getByRole('searchbox', { name: 'Search help questions' })
    await expect(page.locator('main summary').filter({ hasText: 'How do I book an appointment on Zavoia?' })).toBeVisible()

    await search.fill('reschedule')
    await expect(page.locator('main summary').filter({ hasText: 'How do I cancel or reschedule an appointment?' })).toBeVisible()
    await expect(page.locator('main summary').filter({ hasText: 'How do I leave a review after an appointment?' })).toHaveCount(0)

    await search.fill('zzzzznonsensequery')
    await expect(page.getByText('No questions matched. Try different words.')).toBeVisible()
  })

  test('HELP-02 report an issue: submit gates on all three fields being valid, then creates a real guest ticket', async ({ page }) => {
    await page.goto('/help')

    await page.getByRole('button', { name: 'Report an issue', exact: true }).first().click()

    // The accessible dialog name changes after success. Only one dialog
    // opens in this flow, so keep its locator independent of that name.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const titleInput = dialog.getByPlaceholder('A short summary of the issue')
    const emailInput = dialog.getByPlaceholder('you@example.com')
    const messageInput = dialog.getByPlaceholder('Describe the issue with as much detail as you can…')
    const submit = dialog.getByRole('button', { name: 'Send report' })

    await expect(submit).toBeDisabled()

    await titleInput.fill('Booking button does nothing')
    await expect(submit).toBeDisabled()

    // Invalid email format keeps submit disabled.
    await emailInput.fill('not-an-email')
    await expect(submit).toBeDisabled()

    await messageInput.fill('I tapped Confirm and the page just spun forever.')
    await expect(submit).toBeDisabled()

    await emailInput.fill('e2e-help-reporter@zavoia-test.dev')
    await expect(submit).toBeEnabled()

    // Hits the real, unauthenticated POST /marketplace/public/support/tickets.
    await submit.click()

    await expect(dialog.getByText('Report sent', { exact: true })).toBeVisible()
    await expect(dialog.getByText('e2e-help-reporter@zavoia-test.dev', { exact: true })).toBeVisible()
    await expect(dialog.getByText(/Reference:/)).toHaveCount(0)
  })
})
