import { expect, test } from '@playwright/test'
import { signInAsFreshCustomer } from '../fixtures/customer-helpers'

test.describe('Account — personal info', () => {
  test('ACCT-02 editing the first name: Escape cancels, Enter commits and persists', async ({
    page,
  }) => {
    await signInAsFreshCustomer(page)
    await page.goto('/account')

    // Desktop default section is "Personal information"; the first-name row's
    // EditableRow (id="acct-firstName") is the first "Edit" button on the page
    // — see account-content.tsx SectionBody's "personal" branch, which renders
    // firstName, lastName, phone, dob, ChangeEmailRow, AddressRow in that
    // fixed order.
    const editButtons = page.getByRole('button', { name: 'Edit' })
    const firstNameInput = page.locator('#acct-firstName')

    // Escape cancels: type a bogus value, bail out, original value survives.
    await editButtons.first().click()
    await expect(firstNameInput).toBeVisible()
    const original = await firstNameInput.inputValue()
    await firstNameInput.fill('Temp')
    await firstNameInput.press('Escape')
    await expect(firstNameInput).toBeHidden()
    await expect(page.getByText(original, { exact: true }).first()).toBeVisible()

    // Enter commits: new value saves, toast confirms, value persists on reload.
    await editButtons.first().click()
    await firstNameInput.fill('UpdatedFirst')
    await firstNameInput.press('Enter')
    await expect(page.getByText('Profile updated')).toBeVisible()
    await expect(firstNameInput).toBeHidden()
    await expect(page.getByText('UpdatedFirst', { exact: true })).toBeVisible()

    await page.reload()
    await expect(page.getByText('UpdatedFirst', { exact: true })).toBeVisible({
      timeout: 15_000,
    })
  })
})
