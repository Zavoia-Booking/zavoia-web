# 15. Internal CRM Tools — Test Scenarios

**Covers:** [CRM] [Dashboard] [Web]
**Preconditions:**
- Platform admin account seeded (user with ADMIN role and no business); CRM reachable at `/login`
- At least one active business with plan, marketplace listing, locations, team members, and services
- Stripe test price IDs available; at least one FAILED Oblio invoice and one unused verification token (or generate via app flows)

Note: review moderation (business/location/team-member/platform reviews) is covered in file 10; support ticket handling in file 12 — not duplicated here.

## CRM access

### 15.1 Platform admin login [CRM]
**Steps:**
1. Open CRM `/login`
2. Enter platform admin email + password, submit
3. Observe redirect and header user info
**Expected:** `POST /admin-crm/login` returns `crmAccessToken`, `crmCsrfToken`, and `user` with `role: ADMIN`; `crmRefreshToken` + `crmCsrfToken` cookies set. Redirect to `/dashboard`; protected routes render inside layout. Login success is audit-logged.

### 15.2 Login rejected: non-admin and wrong password [CRM]
**Steps:**
1. On `/login`, attempt login with a business-owner account (valid dashboard credentials)
2. Attempt login with the admin email + wrong password
3. Attempt login with an unknown email
**Expected:** Owner → 403 "Access denied. Platform admin access required." (isPlatformAdmin check: ADMIN role with no business). Wrong password / unknown email → 401 "Invalid email or password.". Error shown in the login alert; each failure audit-logged with reason.

## Businesses

### 15.3 Browse/search businesses and view detail [CRM]
**Steps:**
1. Open `/business`; apply search/filters, paginate
2. Open a business row → `/business/:id`
3. Review Details tab: plan name, industry, trial end, LTD status, Stripe customer/subscription IDs, paid seats
4. Open Locations, Team Members, and Services tabs
5. Toggle the "LTD (Life Time Deal)" switch and confirm
**Expected:** `POST /admin-crm/business/list` returns filtered paginated rows. Detail (`GET /admin-crm/business/:id`) joins `plan.name` + `industry.name` and includes `isLtd`, `trialEndsAt`, `planOverrides`, `paidTeamSeats`, plus marketplace listing summary; tabs load via `/business/:id/locations/list`, `/team-members/list`, `/services/list`. LTD toggle (`PUT /business/:id/ltd`) flips `isLtd` and re-renders the green/grey LTD panel. Unknown id → 404 "Business not found".

### 15.4 Block business from marketplace [CRM] [Web]
**Steps:**
1. `/business/:id` → Marketplace tab; verify listing fields (isListed, hiddenBySystem, blockedByPlatform)
2. Click "Block from Marketplace"
3. On marketplace web, search/map for the business and open its old detail URL
4. Click "Unblock from Marketplace"; re-check web
**Expected:** `PUT /admin-crm/marketplace/:businessId/block` sets `blockedByPlatform=true` and syncs map_point rows (removed while blocked); business disappears from web search/map/public pages and new marketplace bookings are refused (listing lookups require `blockedByPlatform=false`). Unblock restores discovery. Business with no listing → 404 "Marketplace listing not found for this business".

## Owners and customers

### 15.5 Business owners management [CRM]
**Steps:**
1. Open `/businesses-owners`; apply filters
2. Open an owner → `/businesses-owners/:id`
3. Review linked user info and Wizard Data tab
**Expected:** List (`POST /admin-crm/business-owners/list`) shows `wizardCompleted`, `businessId`, `userId`, timestamps. Detail joins user (email, firstName, lastName, phone) and renders stored `wizardData`. Unknown id → 404 "Business owner not found".

### 15.6 Customers lookup [CRM]
**Steps:**
1. Open `/customers`
2. Search/filter by email or name; paginate and sort
**Expected:** `POST /admin-crm/customers/list` returns only users holding the CUSTOMER role (paginated, with status, provider, `email_verified`, customer-role rows). Dashboard-only owners/team members without a CUSTOMER role never appear.

## Taxonomy and plans

### 15.7 Industry taxonomy: add/edit industry and tags → cross-app [CRM] [Dashboard] [Web]
**Steps:**
1. `/industry` → "Create Industry": name, slug; save
2. Edit the industry name via the edit popup
3. Open the Tags tab, select the industry, add a tag (name, slug, description, icon, displayOrder)
4. In business dashboard, open the marketplace profile industry section
5. On marketplace web, check search filters / category rail
**Expected:** `POST /admin-crm/industry` creates and the row appears in the CRM table; edits persist via `PUT /admin-crm/industry/:id`. New industry is served to the dashboard picker and to web via `GET /marketplace/public/industries` (search `industryId` filter and category rail). Tag appears under the industry (`GET /admin-crm/industry/:industryId/tags`) and becomes usable as a `tagIds` search filter. Note: the CRM's "Active" toggle on the industry form has no backend effect — the `industry` table has no `isActive` column, so it never filters industries out of any picker.

### 15.8 Plans management: edit plan + regional pricing → new checkout [CRM] [Dashboard]
**Steps:**
1. `/plans` list; open Edit on a plan
2. Change name/tier/Max Locations/Max Team Members (leave a limit empty = unlimited) and Stripe base/seat monthly price IDs
3. In Pricing, "Add Region": countryCodes, region-specific Stripe price IDs, currency; save
4. From the dashboard, start a new subscription checkout for a business in that region's country
5. Repeat for a business in a country with no pricing row
**Expected:** `PUT /admin-crm/plans/:id` persists (tier must be a valid PlanTier enum; pricing rows need ≥1 country code). New checkout resolves the pricing row matching `business.countryCode` (uppercased, `ANY(countryCodes)`); no match → plan's base `stripeBasePriceIdMonthly`. Plan with blank base price at checkout → 500 "Stripe base price not configured for plan". Existing subscriptions are unaffected.

## Token administration

### 15.9 Verification tokens revoke/delete; refresh tokens list [CRM]
**Steps:**
1. Open `/verification-tokens`; filter by type/used
2. Revoke an unused token (confirm dialog "Are you sure you want to revoke this verification token (ID: n)?")
3. Try the token's emailed link (e.g. email verification / password reset)
4. Revoke the same token again
5. Delete another token (confirm "This action cannot be undone.")
6. Open `/refresh-tokens`; review the list
**Expected:** Revoke (`PUT /admin-crm/verification-tokens/:id/revoke`) sets `used=true` + `usedAt`; the emailed link is no longer redeemable. Second revoke → 400 "Verification token is already revoked/used". Delete → "Verification token deleted successfully"; unknown id → 404 "Verification token not found". Refresh tokens page is a read-only list (tokenId, userId, Revoked/Expired badges, user agent, IP) — no revoke action exists in UI or API.

## Invoices and utilities

### 15.10 Failed Oblio invoices list + retry [CRM]
**Steps:**
1. Open `/invoices` (failed invoice list)
2. Click "Retry" on a FAILED row; observe "Retrying..." spinner
3. Refresh the list
**Expected:** `POST /admin-crm/invoices/failed/list` returns paginated failed Oblio invoices with status badge and `retryCount`. Retry (`POST /admin-crm/invoices/:id/retry`) re-attempts issuance; on success the row leaves the failed list / status becomes SUCCESS and retryCount increments. Retry button renders only for status FAILED.

### 15.11 Email-test utility: preview and send [CRM]
**Steps:**
1. Open `/email-test`; pick a template from the grouped dropdown (e.g. verifyEmail, trialReminder, appointmentConfirmation)
2. Switch locale en ↔ ro; adjust template params (defaults prefilled)
3. Preview: toggle HTML/Text tabs and light/dark preview theme
4. Set recipient (defaults to logged-in admin email) and click Send
**Expected:** `GET /admin-crm/email-test/templates` lists template metadata; `POST /admin-crm/email-test/preview` renders subject + HTML + text in the chosen locale with locale-aware date/time formatting (Europe/Bucharest). `POST /admin-crm/email-test/send` delivers a real email via the production template builders and returns `{ ok: true }` (success toast). Unknown template → 400 "Unknown templateKey: <key>".

### 15.12 SMS admin: region pricing and packages [CRM]
**Steps:**
1. Open `/sms`; add a region pricing entry with country codes
2. Add an SMS package under that region; edit the package
3. Add a second region reusing a country code already assigned to the first
4. Attempt to delete the region that still has packages
5. Edit/delete a package with a bad id (stale row)
**Expected:** Region/package CRUD persists via `/admin-crm/sms/regions` and `/admin-crm/sms/packages`; lists default to active entries. Duplicate country code in another region → 409 `SMS.E01`. Deleting a region with packages → 409 `SMS.E03`. Unknown region → 404 `SMS.E02`; unknown package → 404 `SMS.E04`.
