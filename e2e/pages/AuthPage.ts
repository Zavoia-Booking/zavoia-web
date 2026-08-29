import type { Locator, Page } from '@playwright/test'

/**
 * /auth?mode=login|register — selectors read directly off the rendered DOM
 * (src/app/[locale]/auth/_components/*). There are no data-testid attributes
 * anywhere in zavoia-web, so every locator below is a real id, role or the
 * exact visible English copy from src/i18n/dictionaries/en.ts.
 */
export class AuthPage {
  readonly page: Page

  // Register form (auth-tabs "Create account")
  readonly firstName: Locator
  readonly lastName: Locator
  readonly email: Locator
  readonly phone: Locator
  readonly password: Locator
  readonly acceptTerms: Locator
  readonly registerSubmit: Locator

  // Login form
  readonly loginEmail: Locator
  readonly loginPassword: Locator
  readonly loginSubmit: Locator
  readonly forgotPasswordLink: Locator

  // Tabs
  readonly signInTab: Locator
  readonly createAccountTab: Locator

  // Multi-role account-linking panels (auth-tabs.tsx swaps the whole card body)
  readonly enableAccessHeading: Locator
  readonly sendSecureLinkButton: Locator
  readonly backToSignInButton: Locator

  // /auth/verify-account-link (verify-account-link.tsx) — the emailed-link
  // landing page. Confirm state (password account): heading "Confirm it's
  // you", #password field, submit button "Enable marketplace access".
  readonly verifyLinkConfirmHeading: Locator
  readonly verifyLinkPassword: Locator
  readonly verifyLinkConfirmButton: Locator
  readonly verifyLinkWrongPasswordError: Locator
  readonly verifyLinkSuccessHeading: Locator
  readonly verifyLinkDeadHeading: Locator
  readonly verifyLinkBackToSignInLink: Locator

  // /auth/callback GoogleLinkPanel (google-link-panel.tsx) — shown on the
  // 409 `account_exists_unlinked_google` collision.
  readonly googleLinkHeading: Locator
  readonly googleLinkPassword: Locator
  readonly googleLinkSubmitButton: Locator

  constructor(page: Page) {
    this.page = page

    // .first(): a live run showed TWO #email/#password nodes simultaneously
    // present on /auth in some transitions (consistent with the mobile+
    // desktop CSS-toggled duplicate pattern seen elsewhere in this app,
    // e.g. the appointments status stamp) — only one is ever the visible,
    // interactive one, and .first() reaches it deterministically.
    this.firstName = page.locator('#firstName').first()
    this.lastName = page.locator('#lastName').first()
    this.email = page.locator('#email').first()
    this.phone = page.locator('#phone').first()
    this.password = page.locator('#password').first()
    this.acceptTerms = page.locator('#acceptTerms').first()
    this.registerSubmit = page.getByRole('button', { name: 'Create account', exact: true })

    this.loginEmail = page.locator('#email').first()
    this.loginPassword = page.locator('#password').first()
    this.loginSubmit = page.getByRole('button', { name: 'Sign in', exact: true })
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' })

    this.signInTab = page.getByRole('tab', { name: 'Sign in' })
    this.createAccountTab = page.getByRole('tab', { name: 'Create account' })

    this.enableAccessHeading = page.getByRole('heading', { name: 'Enable marketplace access' })
    this.sendSecureLinkButton = page.getByRole('button', { name: 'Email me the secure link' })
    this.backToSignInButton = page.getByRole('button', { name: 'Back to sign in' })

    this.verifyLinkConfirmHeading = page.getByRole('heading', { name: "Confirm it's you" })
    this.verifyLinkPassword = page.locator('#password')
    this.verifyLinkConfirmButton = page.getByRole('button', { name: 'Enable marketplace access' })
    this.verifyLinkWrongPasswordError = page.getByText('Incorrect password. Please try again.')
    this.verifyLinkSuccessHeading = page.getByRole('heading', { name: 'Marketplace access enabled' })
    this.verifyLinkDeadHeading = page.getByRole('heading', { name: "This link can't be used" })
    // A real <Link> (anchor, role=link) — distinct from EnableAccessPanel's
    // identically-worded "Back to sign in" <button>.
    this.verifyLinkBackToSignInLink = page.getByRole('link', { name: 'Back to sign in' })

    this.googleLinkHeading = page.getByRole('heading', { name: 'Link your Google account' })
    this.googleLinkPassword = page.locator('#google-link-password')
    this.googleLinkSubmitButton = page.getByRole('button', { name: 'Link account' })
  }

  async gotoLogin(redirect?: string): Promise<void> {
    const qs = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
    await this.page.goto(`/auth?mode=login${qs}`)
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto('/auth?mode=register')
  }

  /** /auth/verify-account-link?token=... — omit `token` to test the no-token dead end. */
  async gotoVerifyAccountLink(token?: string): Promise<void> {
    const qs = token ? `?token=${encodeURIComponent(token)}` : ''
    await this.page.goto(`/auth/verify-account-link${qs}`)
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmail.fill(email)
    await this.loginPassword.fill(password)
    await this.loginSubmit.click()
  }

  async register(user: { firstName: string; lastName: string; email: string; phone?: string; password: string }): Promise<void> {
    await this.firstName.fill(user.firstName)
    await this.lastName.fill(user.lastName)
    await this.email.fill(user.email)
    if (user.phone) await this.phone.fill(user.phone)
    await this.password.fill(user.password)
    await this.acceptTerms.check()
    await this.registerSubmit.click()
  }

  /** The generic 401 shown for both wrong password and an unknown email — identical copy either way (anti-enumeration). */
  incorrectCredentialsAlert(): Locator {
    return this.page.getByText('Incorrect email or password.')
  }

  formAlert(): Locator {
    return this.page.getByRole('alert')
  }
}
