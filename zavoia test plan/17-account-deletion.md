# 17. Account Deletion — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile]
**Preconditions:**
- Seed users: customer-only; email with CUSTOMER + OWNER roles; owner with a full business (team members incl. a pending invite, appointments, customers, reviews, listing, logo + portfolio images, map point); team member with and without roles at other businesses.
- Stripe test subscriptions on one owner: one ACTIVE (non-cancelling), one cancel-at-period-end / trial; inbox access for the owner email.
- DB + R2 access to assert purges; `FRONTEND_URL` set (deletion-instructions email links to `{FRONTEND_URL}/account?tab=billing`).

## Customer self-deletion (marketplace)

### 17.1 Customer deletes account from web account page [Web]
**Steps:**
1. Log in as customer-only user; open `/{locale}/account` → Security section → danger zone "Delete account".
2. Confirm in the modal (`t.danger.confirmTitle` dialog) → `POST /marketplace/customer/delete`.
3. Observe toast + automatic logout + redirect to `/{locale}` home.
4. Attempt login again with the same credentials.
**Expected:** Response `{ userDeleted: true }` (only role was CUSTOMER → user row purged by `purgeUserIfOrphaned`). Success toast (`t.toasts.accountDeleted`), session ended, redirected home. Re-login fails with generic `CUSTOMER_AUTH.E38` (account no longer exists).

### 17.2 Customer deletes account from mobile Login & security [Mobile]
**Steps:**
1. In the Expo app, open `/login-security` → danger row "Delete account".
2. Confirm in the bottom drawer ("This will permanently delete your account and all your data.") → `POST /marketplace/customer/delete`.
3. Observe app behavior on success.
4. Repeat with API forced to fail (e.g. airplane mode mid-request).
**Expected:** On success the app logs out (`logoutMutation`) and returns to home tabs. On error: drawer closes and native Alert "Failed to delete your account. Please try again later." — account NOT deleted, session intact.

### 17.3 Customer deletion with other roles on the email — user row survives [Web] [Dashboard]
**Steps:**
1. Use the CUSTOMER + OWNER email; delete via web `/{locale}/account` danger zone.
2. Inspect response payload.
3. Log in to the business dashboard with the same email.
4. Attempt marketplace login/register on web with that email.
**Expected:** `{ userDeleted: false }` — only the CUSTOMER `user_role_entity` row is removed; user row kept (not orphaned). Dashboard login and the business are untouched. Marketplace login now returns the 409 enable-marketplace-access flow (`account_exists_needs_marketplace_access`, `CUSTOMER_AUTH.E15`–`E18`), and confirming re-adds the CUSTOMER role.

### 17.4 Orphaned customer purge — data and tokens fully removed [Web] [Mobile]
**Steps:**
1. Before deleting, seed the customer with: favorites, a business review, push token, upcoming appointment, profile image.
2. Delete the account (17.1); capture the pre-delete access + refresh tokens.
3. Replay an authenticated request with the old access token; call `POST /marketplace/auth/refresh` with the old refresh token.
4. Assert DB rows.
**Expected:** Both token calls → 401 (`auth_token` and `refresh_tokens` rows deleted; token-hash lookup fails). Purged: `customer_favorite_business`, `business_review`/`professional_review` written by the user, `customer_push_token`, `customer_notification`, appointments where `customerId` = user, and the profile image R2 key.

## Owner deletion (dashboard)

### 17.5 Owner blocked by active subscription → has_active_subscription [Dashboard]
**Steps:**
1. Log in as owner whose business has an ACTIVE, non-cancelling subscription.
2. Open dashboard `/account` (Settings → Advanced settings danger zone); note the amber subscription hint shown to owners.
3. Click Delete account → confirm dialog → `POST /auth/account/delete`.
4. In the blocker modal, click "Go to billing".
**Expected:** 400 `ACCOUNT.E09`, `code: 'has_active_subscription'` → subscription-blocker modal (not a toast). "Go to billing" navigates to `/account?tab=billing`. Nothing deleted.

### 17.6 Non-blocking subscription states — deletion proceeds and Stripe is cleaned up [Dashboard]
**Steps:**
1. Repeat deletion for owners whose only subscription is: (a) cancel-at-period-end (`cancelAtPeriodEnd: true`), (b) trial, (c) `past_due` / `canceled`.
2. Confirm and delete.
3. Inspect Stripe test dashboard.
**Expected:** No `ACCOUNT.E09` — `getBlockingSubscription` only matches `status: ACTIVE` + `cancelAtPeriodEnd: false`. Deletion succeeds; `purgeBusinessStripeResources` cancels every non-terminal Stripe subscription (releasing schedules) and deletes the Stripe customer. Stripe API failures are logged and swallowed — DB purge still completes.

### 17.7 Owner happy path — entire business purged in one transaction [Dashboard]
**Steps:**
1. Delete a fully seeded owner account (no blocking sub); confirm dialog lists appointments / team members / business data / marketplace bullets.
2. Inspect API response and dashboard behavior.
3. Assert DB: `appointment`, `business_customer`, `customer_favorite_business`, `review`/`business_review`/`professional_review`, `service*`, `location`, `business_marketplace_listing`, `map_point`, `subscription`, `oblio_invoice`, `sms_*`, `tickets`, `booking_settings`, `calendar_block`, `business_notification`, `business_owner`, `user_role_entity`, `business` — all rows for the businessId gone.
4. Check R2: business logo, location portfolio images, profile image keys deleted.
**Expected:** `{ message: ACCOUNT.S03, businessDeleted: true, userDeleted: true }`; dashboard shows success toast then dispatches logout. Purge runs in a single DB transaction (a mid-purge failure leaves nothing half-deleted). R2 deletion failures don't fail the request (`deleteR2KeysSafe` logs only).

### 17.8 Owner purge orphan-checks every user who held a role on the business [Dashboard]
**Steps:**
1. Business has: team member A (no other roles), team member B (also TEAM_MEMBER at another business), team member C (also CUSTOMER), and a pending invitee who never accepted.
2. Owner deletes the account.
3. Check each user row and their R2 portfolio images.
**Expected:** A and the pending invitee are purged (orphaned); B and C survive with their remaining roles and sessions. Portfolio images (`team_member_marketplace_profile`) are deleted only for members with no roles elsewhere — B keeps theirs.

### 17.9 Native (Capacitor) dashboard: blocked deletion emails instructions → ACCOUNT.E10 [Dashboard]
**Steps:**
1. As the owner with an ACTIVE subscription, call deletion from the native app (or curl `POST /auth/account/delete` with header `x-native-app: capacitor`).
2. Observe the response and app UI.
3. Open the owner's inbox.
4. Re-test with the email provider forced to error.
**Expected:** 400 `ACCOUNT.E10`, `code: 'deletion_instructions_sent'` — no billing CTA in-app; the app shows the "instructions emailed" modal instead of the blocker. Email (localized) links to `{FRONTEND_URL}/account?tab=billing`. Email delivery failure is logged but the client still gets `ACCOUNT.E10`. Nothing deleted.

## Team member / dashboard_user deletion

### 17.10 Team member deletes account from My Account [Dashboard]
**Steps:**
1. Log in as a team member; open `/my-account` → danger zone → Delete account; confirm.
2. `POST /auth/account/delete` fires with role TEAM_MEMBER.
3. Assert `user_role_entity` rows.
**Expected:** ALL TEAM_MEMBER and DASHBOARD_USER rows for the user are deleted across every business (not just the current one). `{ message: ACCOUNT.S03, userDeleted: true }` when no other roles remain; toast + logout. Businesses themselves are untouched.

### 17.11 Team member deletion is NOT blocked by active appointments (unlike leave) [Dashboard]
**Steps:**
1. Give the team member pending/confirmed appointments.
2. First try "Leave organisation" (`POST /auth/account/leave-organisation`).
3. Then try Delete account instead.
**Expected:** Leave is blocked: 400 `ACCOUNT.E05`, `code: 'has_active_appointments'` with `details.activeAppointmentsCount`. Delete succeeds — no appointment check on the delete path; staff assignment rows are removed with the roles.

### 17.12 Team member with CUSTOMER role — marketplace identity survives [Dashboard] [Web]
**Steps:**
1. Delete a team member whose email also holds CUSTOMER.
2. Inspect response; log in on marketplace web/mobile.
3. Check business staff lists and booking staff pickers in every business they belonged to.
**Expected:** `{ userDeleted: false }`; marketplace login and customer data (appointments as customer, favorites) intact. The person no longer appears as staff anywhere; dashboard login now triggers the business-owner-linking 409 flow (no dashboard roles left).

## Role boundaries & error handling

### 17.13 Unsupported role / missing business → ACCOUNT.E03 / E02 [Dashboard]
**Steps:**
1. Call `POST /auth/account/delete` with a token whose role is neither OWNER nor TEAM_MEMBER/DASHBOARD_USER (e.g. marketplace CUSTOMER-context JWT).
2. Call it as an OWNER token with no `businessId` in context.
3. Call it unauthenticated.
**Expected:** (1) 400 `ACCOUNT.E03` ("Cannot perform this action on your account"). (2) 400 `ACCOUNT.E02` ("Account role not found"). (3) 401 from `JwtAuthGuard`. Unexpected internal failures surface as 500 `ACCOUNT.E01`.

### 17.14 /marketplace/customer/delete guard boundaries [Web] [Mobile]
**Steps:**
1. Call `POST /marketplace/customer/delete` unauthenticated.
2. Call it with a dashboard-context token (role OWNER/TEAM_MEMBER).
**Expected:** Both rejected by `CustomerJwtAuthGuard` — 401 Unauthorized; guard requires marketplace-context role CUSTOMER. No deletion occurs.

## Post-delete cross-app assertions

### 17.15 Public marketplace surfaces die after owner deletion [Web] [Mobile]
**Steps:**
1. Before deleting, note the business `/{locale}/business/{slug}` URL, its search/city-page presence, and its map pin.
2. Delete the owner account (17.7).
3. Reload the business page, search, city page, and map (web + mobile listing screen).
**Expected:** `/{locale}/business/{slug}` → 404 (`business_marketplace_listing` purged; `getListing` finds nothing). Business absent from search results and city pages; map pin gone (`map_point` purged). Mobile listing/booking screens for the old id fail gracefully (not-found), no crash.

### 17.16 Other customers' traces of the purged business disappear [Web] [Mobile]
**Steps:**
1. Before deletion, a different customer has: an upcoming appointment at the business, the business favorited, and a review on it.
2. Owner deletes the business.
3. As that customer, open `/{locale}/appointments`, saved/favorites, and their reviews.
**Expected:** The appointment, favorite (`customer_favorite_business`), and review rows are gone — lists render without errors. The customer account itself and data at other businesses are unaffected.

### 17.17 Owner sessions and login are dead after full purge [Dashboard]
**Steps:**
1. Capture the owner's access + refresh tokens before deletion; also keep a second logged-in browser session.
2. Delete the account; in the second session trigger any API call, then a token refresh.
3. Attempt dashboard login with the old credentials; then register the email again.
**Expected:** Old access token → 401 (`auth_token` purged, token-hash lookup fails); refresh → 401 (`refresh_tokens` purged). Login fails (user row gone). Re-registration via `/register` works as a brand-new account (no email conflict 409).
