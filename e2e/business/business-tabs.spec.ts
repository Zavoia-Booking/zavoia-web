import { expect, test } from '@playwright/test'
import { BusinessPage } from '../pages/BusinessPage'
import { DEMO, getUserIdByUuid } from '../fixtures/seed'

test.describe('Business detail — tab + team-member deep links', () => {
  test('BIZ-01 ?tab=team opens the Team tab on load; switching tabs moves ?tab= to the visible tab', async ({
    page,
  }) => {
    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru, { tab: 'team' })

    await expect(biz.teamTab).toHaveAttribute('aria-selected', 'true')
    await expect(biz.servicesTab).toHaveAttribute('aria-selected', 'false')

    const pathBefore = new URL(page.url()).pathname
    await biz.reviewsTab.click()
    await expect(biz.reviewsTab).toHaveAttribute('aria-selected', 'true')
    // The address follows the visible tab in place, so a refresh reopens it.
    await expect(page).toHaveURL(/[?&]tab=reviews(&|$)/)
    expect(new URL(page.url()).pathname).toBe(pathBefore)

    await page.reload()
    await expect(biz.reviewsTab).toHaveAttribute('aria-selected', 'true')
  })

  test('BIZ-02 ?tab=team&member=<id> auto-opens that member\'s profile modal; closing strips ?member= via history.replaceState', async ({
    page,
  }) => {
    const mariaId = await getUserIdByUuid(DEMO.staff.maria.uuid)

    const biz = new BusinessPage(page)
    await biz.goto(DEMO.locationSlugs.glowCentru, { tab: 'team', member: mariaId })

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`[?&]member=${mariaId}(&|$)`))

    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).toHaveCount(0)

    // The `member` param is stripped via history.replaceState on unmount —
    // `tab=team` stays.
    await expect(page).toHaveURL(/[?&]tab=team(&|$)/)
    await expect(page).not.toHaveURL(/[?&]member=/)
  })
})
