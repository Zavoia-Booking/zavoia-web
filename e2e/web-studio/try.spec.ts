import { expect, test } from '@playwright/test'

const DEMO = '/web-studio/demo'
const dock = (page: import('@playwright/test').Page) => page.locator('[data-try-dock]')

test.describe('Web Studio design demo', () => {
  test('a visitor can change a design, keep a dimension, undo and reset', async ({ page }) => {
    await page.goto(DEMO)
    const controls = dock(page)
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBeNull()
    const firstCode = new URL(page.url()).searchParams.get('s')
    await controls.getByRole('button', { name: 'Try another design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(firstCode)
    await controls.getByRole('button', { name: 'Previous design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(firstCode)

    await controls.getByRole('button', { name: 'Customize', exact: true }).click()
    await controls.getByRole('button', { name: 'Keep these layouts', exact: true }).click()
    const lockedCode = new URL(page.url()).searchParams.get('s')!
    await controls.getByRole('button', { name: 'Try another design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe(lockedCode)
    expect(new URL(page.url()).searchParams.get('s')!.slice(0, -2)).toBe(lockedCode.slice(0, -2))
    await controls.getByRole('button', { name: 'Reset design', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).toBe(firstCode)
  })

  test('all locked choices disable shuffle; explicit controls still change the preview', async ({ page }) => {
    await page.goto(DEMO)
    const controls = dock(page)
    await controls.getByRole('button', { name: 'Customize', exact: true }).click()
    for (const name of ['Keep these layouts', 'Keep this colour', 'Keep this font']) {
      await controls.getByRole('button', { name, exact: true }).click()
    }
    await expect(controls.getByRole('button', { name: 'Try another design', exact: true })).toBeDisabled()
    await expect(controls.getByRole('status').filter({ hasText: 'Unlock a choice' })).toBeVisible()
    await controls.getByRole('combobox', { name: 'Section', exact: true }).selectOption('services')
    await controls.getByRole('combobox', { name: 'Style', exact: true }).selectOption('bento')
    await expect(controls.locator('.zw-try-look')).toContainText('Bento')
    await controls.getByRole('combobox', { name: 'Font', exact: true }).selectOption('classic')
    await expect(controls.getByRole('combobox', { name: 'Font', exact: true })).toHaveValue('classic')
    await expect(controls.locator('.zw-try-look')).toContainText('Classic')
    await controls.getByRole('combobox', { name: 'Example business', exact: true }).selectOption('pets')
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Paw & Co')
    await expect(page.locator('[data-try-stage]:visible [data-preview-section="testimonials"]')).toHaveCount(0)
    await controls.getByRole('checkbox', { name: 'Show this section' }).uncheck()
    await expect(page.locator('[data-try-stage]:visible [data-preview-section="services"]')).toHaveCount(0)
    expect(new URL(page.url()).searchParams.get('hide')).toContain('services')
  })

  test('legacy links keep their locale, design and source; language changes keep the look', async ({ page }) => {
    const response = await page.request.get('/ro/try?s=00000000000000&src=flyer%20one&example=pets&tag=one&tag=two', { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const destination = new URL(response.headers().location, page.url() === 'about:blank' ? 'http://localhost' : page.url())
    expect(destination.pathname).toBe('/ro/web-studio/demo')
    expect(destination.searchParams.get('s')).toBe('00000000000000')
    expect(destination.searchParams.get('src')).toBe('flyer one')
    expect(destination.searchParams.get('example')).toBe('pets')
    expect(destination.searchParams.getAll('tag')).toEqual(['one', 'two'])

    await page.goto('/ro/web-studio/demo?s=00000000000000&src=flyer%20one&example=pets')
    await expect(page.locator('[data-try-stage]:visible')).toContainText('Paw & Co')
    const signup = new URL((await dock(page).getByRole('link', { name: 'Încearcă gratuit', exact: true }).getAttribute('href'))!)
    expect(signup.pathname).toBe('/register')
    expect(signup.origin).not.toBe(new URL(page.url()).origin)
    expect(signup.searchParams.get('lang')).toBe('ro')
    expect(signup.searchParams.get('src')).toBe('flyer one')
    await dock(page).getByRole('link', { name: 'English', exact: true }).click()
    await expect(page).toHaveURL(/\/web-studio\/demo\?/)
    await expect(dock(page).getByRole('link', { name: 'Start free trial', exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.get('s')).toBe('00000000000000')
    expect(new URL(page.url()).searchParams.get('example')).toBe('pets')
    expect(new URL(page.url()).searchParams.get('src')).toBe('flyer one')
  })

  test('invalid designs fall back and demo booking actions explain the limitation', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${DEMO}?s=invalid`)
    await expect(page.locator('[data-try-stage]:visible')).toBeVisible()
    await expect.poll(() => new URL(page.url()).searchParams.get('s')).not.toBe('invalid')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await page.locator('[data-try-stage]:visible').getByRole('button', { name: /Book now|Book an appointment/i }).first().click()
    await expect(page.locator('[data-toast-host]')).toContainText('This is a sample business.')
    await expect(page).toHaveURL(/\/web-studio\/demo/)
    expect(errors).toEqual([])
  })
})
