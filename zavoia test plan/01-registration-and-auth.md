# 01. Registration & Authentication — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile]
**Preconditions:**
- Staging API with inbox access for all test emails (verification / reset / link emails must be openable); `FRONTEND_URL` (dashboard) and `MARKETPLACE_FRONTEND_URL` (web) env vars set correctly.
- Google test account; `GOOGLE_CLIENT_ID` configured for web, dashboard, and mobile.
- Seed accounts: fresh unused emails; one owner with access to 2+ businesses; one email holding CUSTOMER + TEAM_MEMBER + OWNER roles; one Google-only account (no password).

## Customer registration & email verification

### 01.1 New customer registration + email verification [Web]
**Steps:**
1. Go to `/{locale}/register`, fill first/last name, email, phone, password; submit.
2. Confirm auto-login (redirect away from register, refresh cookie set).
3. Open inbox → verification email; confirm link is `{MARKETPLACE_FRONTEND_URL}/{locale}/auth/verify-email?token=...`.
4. Click link → verify page shows success and prompts sign-in.
5. Click the same link again.
6. On `/{locale}/register`, submit the same email again.
**Expected:** Registration returns tokens + `CUSTOMER_AUTH.S08`; verify page shows success. Reused link fails: `SYSTEM.E07` (token used) or `CUSTOMER_AUTH.E36` (already verified). Duplicate registration → 409 `CUSTOMER_AUTH.E14`, code `email_already_registered`, `suggestedNext: 'login'`.

### 01.2 Marketplace register/login with business-only email → enable marketplace access [Web]
**Steps:**
1. Use an email that has OWNER and/or TEAM_MEMBER role but no CUSTOMER role.
2. Attempt `/{locale}/register` (or `/{locale}/login` with the correct password).
3. Observe the enable-access panel (409 `account_exists_needs_marketplace_access`, message `CUSTOMER_AUTH.E15`/`E16`/`E17`/`E18` by role mix, `details.confirmationToken` present).
4. Click confirm → `POST /marketplace/auth/confirm-account-link`.
5. Repeat with an expired confirmationToken (wait >10 min) and use the "send link by email" fallback instead.
**Expected:** Confirm instantly adds CUSTOMER role and logs the user in (redirect). Expired token → `CUSTOMER_AUTH.E13`, panel shows email fallback; `send-account-link` always returns neutral `CUSTOMER_AUTH.S06`; the emailed link lands on `/{locale}/auth/verify-account-link?token=...`, which adds the role (no session — user must sign in). Re-requesting while a link is active → 429 `CUSTOMER_AUTH.E08`.

### 01.3 Mobile customer registration [Mobile]
**Steps:**
1. In the Expo app, open `/register`; fill form; submit (`POST /marketplace/auth/register`).
2. Confirm success alert + auto-login and navigation to `/(tabs)` (or recorded `returnTo` path, e.g. interrupted booking).
3. Log out; register again with an owner/team-member email.
4. In the EnableMarketplace modal, confirm marketplace access.
**Expected:** New user is auto-logged-in; conflict shows the dedicated modal (keyed on `details.confirmationToken`), not an inline error; confirming adds CUSTOMER role and signs in. Duplicate customer email shows generic registration-failed alert with the API message.

## Business-owner registration (Dashboard)

### 01.4 New business-owner registration [Dashboard]
**Steps:**
1. On dashboard `/register`, fill form and submit (`POST /auth/register-business-owner`).
2. Confirm auto-login lands in the setup wizard (OWNER role, no businessId, `wizardCompleted: false`).
3. Open inbox → verification email link `{FRONTEND_URL}/verify-email?token=...`; click it.
4. Register again with the same email.
**Expected:** Registration succeeds with `AUTH.S12` and auto-login; verify-email page marks email verified. Re-registration with an owner email → 409 `AUTH.E33`; without password → 400 "Password is required for email registration."

### 01.5 Owner registration conflict: existing customer/team-member email [Dashboard]
**Steps:**
1. On dashboard `/register`, submit with an email that has CUSTOMER (and/or TEAM_MEMBER) but not OWNER role.
2. Observe 409 `account_exists_needs_business_owner_account`, `suggestedNext: 'confirm_account_linking'` → account-linking modal.
3. Trigger the emailed link (`POST /auth/send-business-link-email`) → neutral `AUTH.S13` response.
4. Request the email again immediately.
5. Open the email; confirm link is `{FRONTEND_URL}/link-business-account?token=...`.
**Expected:** Same 409 also fires on dashboard `/login` with that account. Second email request while token active → 429 `token_already_sent` (`AUTH.S14`). Emails to unknown addresses or existing owners return the same neutral `AUTH.S13` (no enumeration).

### 01.6 /link-business-account requires password or Google confirmation [Dashboard]
**Steps:**
1. Open `{FRONTEND_URL}/link-business-account?token=...` from the email (page pre-validates via `GET /auth/link-business-account/validate`).
2. For a password account: submit a wrong password, then the correct one.
3. For a Google-only account (no password): confirm the page shows "Continue with Google" only; try `POST /auth/link-business-account` without password via devtools.
4. Reuse the consumed token; try a token for an account that already has OWNER.
**Expected:** Wrong password → 401 `AUTH.E28`; correct password adds OWNER role, marks email verified, auto-logs-in to the wizard (`AUTH.S15`). Google-only POST → 400 `google_login_required` (`AUTH.E16`). Used token → `SYSTEM.E07`; already-owner → 400 "This account already has owner access...".

### 01.7 Native app register is fully email-funneled [Dashboard]
**Steps:**
1. In the native (Capacitor) dashboard app, open register → email-only form (`POST /auth/mobile-register-request`).
2. Submit an unknown email; submit an existing customer/team-member email; submit an existing owner email.
3. Confirm the app shows the same "check your inbox" outcome (`AUTH.S23`) for all three — no in-app 409.
4. Open each email: (a) welcome link `{FRONTEND_URL}/register?welcomeToken=...`; (b) `link-business-account` link; (c) "already registered" pointing at `{FRONTEND_URL}/login`.
5. Follow the welcome link: email is pre-filled and locked; complete registration.
6. Tamper: change the email field value via devtools to a different address and submit.
**Expected:** Welcome-token registration skips the verification email (`email_verified: true`) and consumes the token. Token/email mismatch → 400 `AUTH.E26`. Repeated request for an existing link-eligible account does not churn the token (previous email still valid).

## Google OAuth

### 01.8 Google sign-in — new user auto-registers as customer [Web] [Mobile]
**Steps:**
1. On web `/{locale}/login` (or mobile login/register), use the Google button with a Google account whose email has no Zavoia account.
2. Complete Google auth (`POST /marketplace/auth/google` with idToken).
3. Check `/{locale}/account` (web) or profile (mobile).
**Expected:** Account is auto-created with CUSTOMER role regardless of login/register intent; user is logged in; email is treated as verified via Google. Dashboard Google register (`POST /auth/google/code/register`) similarly creates an OWNER and enters the wizard.

### 01.9 Google sign-in on existing unlinked account → verify-then-link [Web] [Mobile]
**Steps:**
1. Create a password-only customer account; sign out.
2. Sign in with Google using the same email.
3. Observe 409 `CUSTOMER_AUTH.E06` with `suggestedNext: 'verify_then_link'` and `tx_id` → web google-link-panel / mobile link screen.
4. Enter a wrong password, then the correct one (`POST /marketplace/auth/link/google/re-auth` → proof; `POST /marketplace/auth/link/google`).
**Expected:** Wrong password fails re-auth; correct password links Google (googleSub stored) and logs the user in. Subsequent Google sign-ins log straight in. Google email mismatch during link → `CUSTOMER_AUTH.E45`.

### 01.10 Password login on Google-only account — no account-existence leak [Web] [Mobile] [Dashboard]
**Steps:**
1. On web `/{locale}/login`, submit a Google-only account email + any password.
2. Compare with a wrong-password attempt on a normal account and a non-existent email.
3. On mobile login, repeat step 1.
4. On dashboard `/login`, submit the Google-only owner email + any password.
**Expected:** Marketplace returns the SAME generic 401 `CUSTOMER_AUTH.E38` ("Incorrect email or password") for all three cases; web additionally shows the neutral `googleAccountHint` under the error. Mobile shows `errors.invalidCredentials`. Dashboard (by design, different): 401 `AUTH.E16` with code `google_login_required`, `suggestedNext: 'login_with_google'`.

### 01.11 Link / unlink Google from account security [Web] [Mobile]
**Steps:**
1. Logged in with a password account, link Google (web account security section / mobile `/login-security`) via `POST /marketplace/auth/link/google/native`.
2. Unlink Google, providing the account password (`POST /marketplace/auth/unlink/google`).
3. Attempt unlink with a wrong password.
4. On a Google-only account, attempt to disconnect Google.
**Expected:** Link succeeds and `googleSub` appears on the profile. Unlink requires the correct password (missing → `CUSTOMER_AUTH.E28`; wrong → `CUSTOMER_AUTH.E48`). Google-only account cannot disconnect — mobile shows `auth.cannotDisconnectGoogleNoPassword` alert; password login remains impossible afterwards until one is set.

## Login, multi-role, multi-business, sessions

### 01.12 Multi-business owner login → business selection [Dashboard]
**Steps:**
1. Log in on dashboard `/login` as a user with roles in 2+ businesses.
2. Observe status 300 `business_selection_required` with `selectionToken` + businesses list → BusinessSelectorModal.
3. Select a business (`POST /auth/select-business`).
4. Log in again and pick the other business; verify data (calendar/locations) belongs to the selected business.
5. Replay the consumed `selectionToken`; try a `businessId` the user has no role in.
**Expected:** Selection issues tokens scoped to the chosen business; switching businesses requires re-login through the selector. Consumed/expired token → 400 "Invalid or expired selection token."; foreign businessId → 403 "You do not have access to this business."

### 01.13 Multi-role account (customer + team member + owner) across apps [Web] [Dashboard] [Mobile]
**Steps:**
1. Build one email with all three roles (customer register on web → accept team invitation via `{FRONTEND_URL}/team-invitation?token=` → add OWNER via /link-business-account).
2. Log in on marketplace web and mobile → normal customer experience (appointments, favorites).
3. Log in on dashboard → business selector lists each business with its role (OWNER / TEAM_MEMBER).
4. Attempt marketplace register again → 409 `CUSTOMER_AUTH.E14` (login instead).
5. Attempt dashboard register again → 409 `AUTH.E33` (already has business access).
**Expected:** One user row, three roles; each app authenticates independently (separate cookies: dashboard vs `zavoia-customers` audience). No role bleed: marketplace shows only customer features; dashboard role per selected business is respected.

### 01.14 Logout and session expiry [Web] [Dashboard] [Mobile]
**Steps:**
1. Log in on web; confirm authenticated `/account`; `POST /marketplace/auth/logout`.
2. Verify refresh + CSRF cookies cleared and back-navigation shows logged-out UI; API calls return 401.
3. On mobile, log out from profile → push token unregistered, redirected to `/(tabs)`.
4. Leave a session idle past access-token expiry (60 min) and interact → silent refresh via `POST /marketplace/auth/refresh`.
5. Delete/expire the refresh token server-side and interact again.
**Expected:** Logout deletes access + refresh tokens server-side (revoked refresh token cannot be replayed). Access token expiry is transparent while refresh is valid (marketplace: 60min access/60-day refresh); invalid refresh → session ends, user lands on login. Same refresh mechanism on dashboard with its own cookies, but shorter-lived (15min access/7-day refresh).

## Forgot / reset password

### 01.15 Marketplace forgot password [Web] [Mobile]
**Steps:**
1. Go to `/{locale}/auth/forgot-password` (web) or `/forgot-password` (mobile); submit an existing customer email.
2. Submit a non-existent email.
3. Open the email; confirm link is `{MARKETPLACE_FRONTEND_URL}/{locale}/auth/reset-password?token=...` with locale matching the user's stored locale.
**Expected:** Both submissions return the same neutral success `CUSTOMER_AUTH.S15` (no enumeration; rate-limited by EmailSendRateLimitGuard). Email arrives only for real accounts; link opens the localized web reset page (mobile has no in-app reset screen).

### 01.16 Marketplace reset password — sessions revoked, token error codes [Web]
**Steps:**
1. Log the account in on two other devices/browsers.
2. Open the reset link, set a new valid password.
3. Verify the two other sessions are logged out (API returns 401 after refresh attempt).
4. Log in with old password, then with new password.
5. Reopen the same reset link and submit again; also try a tampered token and (if seedable) an expired one.
**Expected:** Reset returns `CUSTOMER_AUTH.S12`; ALL other sessions are revoked (`revokeOtherSessions(user.id, null)`). Old password → `CUSTOMER_AUTH.E38`; new password works. Token errors surface on the web form with a "request new link" path: invalid → `SYSTEM.E06`, already used → `SYSTEM.E07` (resetLinkInvalid copy), expired → `SYSTEM.E08` (resetLinkExpired copy).

### 01.17 Dashboard forgot/reset password [Dashboard]
**Steps:**
1. On dashboard `/login` → forgot password; submit an owner email (`POST /auth/forgot-password`).
2. Confirm neutral `AUTH.S08` for existing and unknown emails alike.
3. Open link `{FRONTEND_URL}/reset-password?token=...`; set a new password.
4. Log in with the new password; reuse the link.
**Expected:** Reset succeeds (`AUTH.S09`) and also sets `email_verified: true`. Reused token → `SYSTEM.E07`; missing token → `SYSTEM.E05`. (Note: unlike marketplace, dashboard reset does not revoke other sessions — verify current behavior matches product intent.)

## Change email / change password

### 01.18 Change email [Web] [Mobile]
**Steps:**
1. Logged in as customer, open change-email (web account security / mobile `/change-email`); enter wrong "current email", then a new email already used by another account, then the same email.
2. Submit a valid change (`POST /marketplace/auth/change-email` — instant, no confirmation link).
3. Check both inboxes and other logged-in sessions.
4. Repeat for a business owner on the dashboard (`POST /auth/change-email`); check business + location contact email.
**Expected:** Errors: `CURRENT_EMAIL_MISMATCH` (400), `EMAIL_TAKEN` (409), `SAME_EMAIL` (400). Success swaps email immediately, revokes all OTHER sessions (current one survives; `revokedSessionCount` returned), sends alert to the OLD address and notification to the NEW one. For owners, business.email and locations with `useBusinessContact` sync to the new email. Old email logs in no more; new email does.

### 01.19 Change password (logged in) [Web] [Mobile] [Dashboard]
**Steps:**
1. As customer (web account / mobile `/change-password`), submit wrong current password, then correct (`POST /marketplace/customer/profile/change-password`).
2. On a Google-only customer account, attempt change password.
3. On dashboard, repeat via `POST /auth/change-password`.
4. Log in with the new password.
**Expected:** Wrong current password → 400 "Current password is incorrect" (dashboard: `AUTH.E37`). Google-only → 400 "Cannot change password for Google-linked accounts" (dashboard: `AUTH.E36`); Google-only users get set-password via `POST /auth/set-password` on dashboard (mobile shows "coming soon" placeholder). New password takes effect immediately.

## Emailed auth link routing (known risk area)

### 01.20 All emailed auth links land on live localized routes [Web] [Dashboard]
**Steps:**
1. Trigger every auth email against staging: customer verify-email, verify-account-link, password reset (EN and RO user locales), owner verify-email, business-account-link, mobile-register welcome/already-registered, team invitation.
2. Click each link and confirm it renders the correct page, not a 404.
**Expected:** Marketplace emails → `{MARKETPLACE_FRONTEND_URL}/{locale}/auth/verify-email|verify-account-link|reset-password?token=...` with the locale segment matching user.locale. Dashboard emails → `{FRONTEND_URL}/verify-email|reset-password|link-business-account|team-invitation|register?welcomeToken=...`. Every page consumes the token successfully; env vars must not point at stale hosts/paths.

## Rate limiting

### 01.21 Registration rate limit — 4th attempt in an hour blocked, window resets [Web] [Dashboard]
**Steps:**
1. From one IP, submit `POST /marketplace/auth/register` (or dashboard `/register`, or `/marketplace/auth/send-account-link`) 3 times within an hour, varying the email each time.
2. Submit a 4th request to the same endpoint within the hour.
3. Wait for the 1-hour window to fully elapse (or reset the clock on staging) and submit again.
4. Separately, confirm 3 successful registrations within the window all complete normally (tokens issued / emails sent).
**Expected:** Requests 1–3 succeed; the 4th returns 429 (`RegisterRateLimitGuard`, 3/hour per IP+path — `/register`, `/register-business-owner`, and `/send-account-link` are limited independently since the guard scopes by path). After the window resets, requests succeed again. Requests within the limit are unaffected regardless of email used.
**Note:** `LoginRateLimitGuard` exists in `rateLimit.guard.ts` (5/15min) but is currently commented out on all three `/login` endpoints (dashboard `auth.controller.ts`, marketplace `customer-auth.controller.ts`, admin-crm) — login is **not** rate-limited today; repeated failed logins should NOT return 429. (The same guard class IS active on the `/reset-password` endpoints, unrelated to login attempts.) Flag this against the intended 5-attempts/15-min login lockout; re-verify once/if the guard is re-enabled.

## Legal consent

### 01.22 Terms & privacy consent required on dashboard registration [Dashboard]
**Steps:**
1. On dashboard `/register`, fill all fields but leave the consent checkbox unchecked; confirm Submit stays disabled (`register.validation.termsRequired`).
2. Click the "Terms and Conditions", "Cookies Policy", and "Privacy Policy" inline links; confirm each opens `LegalContentDialog` with the right content, without leaving the page.
3. Check the box and submit successfully.
4. Navigate directly to `/terms` and `/privacy` (standalone pages) in both EN and RO locale.
5. Via devtools, POST directly to `/auth/register-business-owner` with a valid payload and no `acceptTerms` field at all.
**Expected:** Checkbox is required client-side only — unchecked blocks submit; dialog links show correct legal content per type. `/terms` and `/privacy` render with localized chrome (title/back button) in both EN and RO (body copy is a placeholder, English-only, per `legal.placeholderNotice`). Step 5 succeeds (201) — the API has no `acceptTerms`/terms field in `RegisterDTO` and does not enforce consent server-side; this is current behavior, not a bug, but worth flagging if legal requires server-side enforcement.
