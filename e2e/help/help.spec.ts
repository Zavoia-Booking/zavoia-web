import { expect, test } from '@playwright/test'

/**
 * /help — src/app/[locale]/help/_components/help-center.tsx (FAQ search) and
 * ./report-issue.tsx (guest ticket form). Zero data-testid: locators are the
 * exact visible English copy from src/i18n/dictionaries/en.ts.
 */

test.describe('Help centre', () => {
  test('HELP-01 the FAQ search box filters Q&A rows and shows a no-results state for a nonsense query', async ({ page }) => {
    await page.goto('/help')

    const search = page.getByPlaceholder('Search questions — cancel, deposit, reschedule…')
    await expect(page.getByRole('button', { name: 'How do I book an appointment?' })).toBeVisible()

    await search.fill('reschedule')
    await expect(page.getByRole('button', { name: 'Can I reschedule or cancel?' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'How do I leave a review?' })).toHaveCount(0)

    await search.fill('zzzzznonsensequery')
    await expect(page.getByText('No questions matched. Try different words.')).toBeVisible()
  })

  test('HELP-02 report an issue: submit gates on all three fields being valid, then creates a real guest ticket', async ({ page }) => {
    await page.goto('/help')

    await page.getByRole('button', { name: 'Report an issue', exact: true }).click()

    // Not scoped by name: the dialog's own aria-label changes to "Thanks —
    // we got your report" once the success state renders, so a locator
    // bound to the original "Report an issue" name would stop matching
    // anything after a successful submit. Only one dialog is ever open in
    // this flow, so an unscoped role query stays unambiguous throughout.
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

    await expect(dialog.getByText('Thanks — we got your report')).toBeVisible()
    await expect(dialog.getByText(/Reference:/)).toBeVisible()
  })
})
