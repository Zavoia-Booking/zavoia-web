# 14. Clients & Customer Management (Dashboard) — Test Scenarios

> **QA 2026-07-23 (API + dashboard; mobile + team-member-login + expired-sub skipped):**
> - **14.16 self-merge (fixed 2026-07-23):** `POST /business-customers/merge` blindly treated the passed id as the marketplace record, so resolving from the MANUAL side self-merged (manual→merged, marketplace stayed flagged). Fixed: `mergeDuplicates` now resolves the pair from the clicked record's `source` so the marketplace record always survives regardless of which id the UI passes, rejecting with `E01` when a valid pair can't be resolved. Retest after deploy.
> - **14.4 validation (fixed 2026-07-23):** `AddCustomerManuallyDTO` + both update DTOs now enforce firstName/lastName `@MinLength(2)`/`@MaxLength(50)`, notes `@MaxLength(500)`, email `@MaxLength(254)` — matching the UI. (Previously bare `@IsString()` accepted a 1-char name and 501-char notes.) Email + phone format validation already worked. Retest after deploy.
> - Drift: **14.15** merge success code is `BUSINESS_CUSTOMER.S02` (same as edit); `GET /business-customers/:id/history` returns a bare data array (not `{history, pagination}`); `mergedIntoCustomerId` is absent from the GET projection (confirms the plan's dead-redirect note). **14.18** dashboard_user → 403 RolesGuard generic (not `SYSTEM.E04`). DTO note: `add-manually` / `edit` succeed with `BUSINESS_CUSTOMER.S01`/`S02`.
> - Verified exactly: 14.1 (auto-create, no dup on 2nd booking), 14.5 (dup manual email diff-case → 409 E02), 14.6 (manual=mkt email allowed), 14.8 (edit lowercases email), 14.9 (mkt personal edit → 400 E03, notes-only → 201), 14.13 (search all fields + both name orders), 14.14 (booking flags duplicate_detected + duplicateOfId), 14.20 (unknown id → 404 E01, appointment SET NULL on remove).

**Covers:** [Dashboard] [Web] [Mobile]
**Preconditions:**
- Business owner account with entitled subscription, ≥1 location/service/staff bookable on marketplace; dashboard `/customers` reachable.
- A registered marketplace customer account (for web/mobile bookings) whose email you control.
- A team member account (`team_member` role) invited to the same business.

## Auto-creation from marketplace bookings

### 14.1 First marketplace booking auto-creates client [Dashboard] [Web]
**Steps:**
1. As a brand-new marketplace customer on web, book a service at the business (`POST /marketplace/appointments/book`).
2. As owner, open dashboard `/customers`.
3. Open the new client's details popup.
4. Book a second appointment with the same customer account; refresh `/customers`.
**Expected:** Client appears once with source badge "Marketplace" (`source: marketplace`), linked to the user account, `conflictStatus: none`. Recent activity shows the appointment plus "Became your customer" milestone. Second booking does NOT create a duplicate row (record found by `businessId + userId`).

### 14.2 First booking from mobile app auto-creates client [Dashboard] [Mobile]
**Steps:**
1. In the Expo marketplace app, log in as a fresh customer and complete a booking (`features/booking` → `POST /marketplace/appointments/book`).
2. As owner, open `/customers` in the dashboard.
**Expected:** Same behavior as 14.1 — one `marketplace`-source client created for the business.

### 14.3 Marketplace client data stays synced with their account [Dashboard] [Web]
**Steps:**
1. Have an existing marketplace-source client (from 14.1).
2. As that customer, change first name / phone in their marketplace account profile.
3. As owner, reload `/customers` and the client's details popup.
**Expected:** List and popup show the updated name/phone (API returns `user.*` fields whenever `userId` is set — local columns are ignored for linked clients).

## Manual (walk-in) clients

### 14.4 Add a walk-in client manually [Dashboard]
**Steps:**
1. On `/customers` click "Add customer" (opens AddCustomerSlider).
2. Submit with only First name filled — email/phone/last name/notes left empty.
3. Try invalid values: 1-char first name, malformed email, non-E.164 phone, 501-char notes.
4. Fix values and save.
**Expected:** Only first name is required (min 2 / max 50 chars); email must be valid format, phone must be E.164, notes ≤500 chars — inline validation blocks submit. On save: toast "Customer added successfully", `POST /business-customers/add-manually`, client appears in list with source badge "Manual".

### 14.5 Duplicate email among manual clients rejected [Dashboard]
**Steps:**
1. Add a manual client with email `walkin@test.com`.
2. Add another manual client with the same email (any case, e.g. `WALKIN@test.com`).
**Expected:** API returns 409 `BUSINESS_CUSTOMER.E02` (email lowercased before check; only compared against `source: manual` records of this business). UI shows toast "We couldn't add the customer" / "Please check your information and try again." Slider stays open.

### 14.6 Manual client with same email as an existing marketplace client is allowed [Dashboard]
**Steps:**
1. Ensure a marketplace-source client exists with email X (from 14.1).
2. Add a manual client with email X via "Add customer".
**Expected:** Creation succeeds (duplicate check only scans `source: manual`). Two rows now exist; no duplicate flag yet — the conflict is only detected at the customer's NEXT marketplace booking (see 14.14).

### 14.7 Quick-create client from calendar appointment slider [Dashboard]
**Steps:**
1. Open `/calendar` → add appointment → customer picker (CustomerSearchPicker).
2. Use the quick-create form (first name + optional email/phone), submit.
3. Finish creating the appointment; then open `/customers`.
**Expected:** Toast "Customer created" message; new client is auto-selected for the appointment. Client exists in `/customers` as `manual` source; the appointment appears in their history.

### 14.8 Edit a manual client's details [Dashboard]
**Steps:**
1. Open a manual client's details popup → "Edit" (EditCustomerSlider).
2. Change email, first/last name, phone, notes; save.
3. Reopen popup.
**Expected:** `POST /business-customers/edit/:customerId` succeeds, toast "Customer updated successfully", all fields persisted (email stored lowercased). List refreshes automatically.

### 14.9 Marketplace client's personal data is read-only [Dashboard]
**Steps:**
1. Open a marketplace-source client's details popup.
2. Confirm available actions.
3. (API check) Send `POST /business-customers/edit/:id` with `{"firstName":"Hacked"}` for that client.
**Expected:** No "Edit" pencil button in the popup (edit only rendered when `source === 'manual'` and not merged). API rejects personal-data changes with 400 `BUSINESS_CUSTOMER.E03`; only `notes`/`customFields` are accepted for linked clients.

## Client profile, history & export

### 14.10 Client details popup shows profile and recent activity [Dashboard]
**Steps:**
1. Create a client with ≥4 appointments (mix of statuses incl. a cancelled one).
2. Click the client card on `/customers`.
**Expected:** Popup shows email/phone as clickable `mailto:`/`tel:` links (or "not provided"), source badge, "Customer since" date, collapsible Notes section (only if notes exist), and Recent activity limited to 3 most recent items with status badges; milestone "Became your customer" appears when fewer than 3 appointments.

### 14.11 Full history slider with pagination [Dashboard]
**Steps:**
1. From the details popup click "See history" (CustomerHistorySlider).
2. Scroll/load more past 20 items (page size 20).
3. Inspect an appointment entry.
**Expected:** `GET /business-customers/:id/history` pages of 20; appointments sorted by `scheduled_at` DESC with "Became your customer" milestone as the last item; count label "shown of total" matches `pagination.total` (= appointments + 1). Entries show service name, status badge, location, duration and price in business currency.

### 14.12 Export client history as PDF [Dashboard]
**Steps:**
1. In the history slider click the Download button.
2. Open the downloaded file.
**Expected:** All history pages are fetched (loops until `hasMore: false`) and a PDF is generated client-side; filename is `FirstName-LastName.pdf` (falls back to `customer-<id>.pdf` when no name). PDF heading includes the client name and page numbering.

## Search & list

### 14.13 Search the client list [Dashboard]
**Steps:**
1. Seed manual + marketplace clients.
2. Type a partial first name, then a full name "First Last", then reversed "Last First", then a partial email, phone fragment and a word from notes.
3. Type a term with no matches; then clear it on an empty business.
**Expected:** Debounced search (`POST /business-customers/list` with `search`) matches case-insensitively across email, first/last name, phone, notes, and combined full name in both orders; for marketplace clients matching runs against the linked user's data. Matches highlighted in cards. No matches → "no results" empty state; no clients at all → "no customers" empty state with gated "Add customer" CTA.

## Duplicate detection & merge

### 14.14 Booking by a registered user flags an existing manual client as duplicate [Dashboard] [Web]
**Steps:**
1. Add a manual client with email X (walk-in).
2. Register/log in on the marketplace as a customer with email X and complete a booking at this business.
3. As owner, reload `/customers`.
**Expected:** A new `marketplace` client row is created AND both records get `conflictStatus: duplicate_detected` (marketplace row has `duplicateOfId` → manual row). "Duplicate detected" badge shows on the list card and in the details popup; `summary.duplicates` count increments. Note: registration alone does NOT claim the manual client — only a booking triggers linkage.

### 14.15 Resolve duplicate — merge into marketplace record [Dashboard]
**Steps:**
1. Open the duplicate MARKETPLACE client's popup → "Resolve duplicate" → confirm in the alert dialog.
2. After the toast, check the list and reopen the surviving client.
3. Open its history.
**Expected:** `POST /business-customers/merge` succeeds; toast "Customers merged successfully". Marketplace record survives (`conflictStatus: none`); manual record gets `status: merged`, `mergedIntoCustomerId`, `mergedAt`, `mergedByUserId` and disappears from the list (list filters `status != merged`). Notes are concatenated (marketplace notes first, then manual), customFields merged (manual wins on key conflict). History aggregates appointments from BOTH records (no appointment reassignment). Note: `GET /business-customers/:id` never returns `mergedIntoCustomerId` in its response, so the dashboard's merge-redirect effect is dead code — reopening the merged manual record directly shows it with `status: merged` instead of redirecting to the surviving customer.

### 14.16 Resolve duplicate initiated from the manual record [Dashboard]
**Steps:**
1. Recreate a duplicate pair (14.14).
2. Open the duplicate MANUAL client's popup (it also shows the badge + "Resolve duplicate").
3. Click resolve and confirm; inspect both records afterwards.
**Expected:** The MARKETPLACE record must survive and the manual one become `merged` — verify explicitly. Risk area: UI passes the opened record's id as `marketplaceCustomerId`, and the service looks the "manual" record up by that record's email — watch for a self-merge (manual record merged into itself, marketplace row still flagged). Any outcome other than 14.15's is a defect.

## Roles, permissions & subscription gating

### 14.17 Team member sees the business's full client list [Dashboard]
**Steps:**
1. Log in as a team member of the business.
2. Open sidebar → "Customers" (`/customers`).
3. Compare the list with the owner's view, including clients whose appointments are with OTHER staff.
4. Navigate manually to `/my-customers`.
**Expected:** Team member has `access:customers` and the API allows `team_member` on all `/business-customers/*` routes — the FULL business client list is visible and manageable (add/edit/merge), NOT restricted to their own appointment customers. A per-member "My Customers" page exists only as an unrouted "coming soon" placeholder; `/my-customers` hits the catch-all and redirects to `/calendar`.

### 14.18 No business context → customers API forbidden [Dashboard]
**Steps:**
1. Log in as a `dashboard_user` (orphaned ex-team-member with no business).
2. Confirm sidebar/nav has no "Customers" entry and `/customers` redirects to their home route (`/my-profile`).
3. (API check) Call `POST /business-customers/list` with that token.
**Expected:** UI blocks access (no `access:customers` permission for `dashboard_user`). API returns 403: `RolesGuard` rejects the `dashboard_user` role (controller only allows `OWNER`/`TEAM_MEMBER`) before the controller's `SYSTEM.E04` businessId check ever runs, so the response is RolesGuard's generic "not authorized" message, not `SYSTEM.E04`.

### 14.19 Expired subscription: reads allowed, customer writes blocked [Dashboard]
**Steps:**
1. Use a business whose subscription is expired (not entitled, past grace).
2. Open `/customers` — list and details/history.
3. Attempt "Add customer" (button is a GatedButton), and via API `POST /business-customers/add-manually`, `/merge`, `/remove/:id`.
4. Attempt `POST /business-customers/edit/:id` on a manual client.
**Expected:** List (`@ReadOperation`), GET detail and history still work read-only. Add/merge/remove return 402 `subscription_required`; UI gates the Add button. Edit is explicitly allowed while expired (`@AllowExpiredWrite`).

## Removing clients

### 14.20 Remove a client (API-only) and effect on appointments [Dashboard]
**Steps:**
1. Verify the details popup / edit slider offer NO delete button.
2. (API) `POST /business-customers/remove/:customerId` for a client with appointments.
3. Repeat with a non-existent/foreign-business id.
4. Check the client's past appointment in `/calendar`.
**Expected:** No delete UI exists in the dashboard (saga/action wired but unused). API hard-deletes the row and returns `BUSINESS_CUSTOMER.S03`; unknown id → 404 `BUSINESS_CUSTOMER.E01`. Appointments are NOT deleted: `businessCustomerId` is set NULL (FK `onDelete: SET NULL`) and the appointment still displays customer data from its `customerSnapshot`. No anonymization step exists.
