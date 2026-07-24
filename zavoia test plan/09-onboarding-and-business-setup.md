# 09. Onboarding & Business Setup — Test Scenarios

> Verified on staging 2026-07-23 (full wizard with fresh owner → business 4 "QA Studio Gamma"); expectations updated to the actual implementation. Fixed in admin-api the same day, retest after deploy: `/wizard/complete` now validates its DTO (was unvalidated — a 1-char name created business 6 "Q"), and the category cap moved into `CategoryService.create` (raised to 50) with case-insensitive name reuse. Accepted as-is: `businessCurrency` allows any 3-letter code at API level (UI restricts; a Postman foot-gun we don't guard).
> DTO shapes: services use `price_amount_minor` / `duration` / `locations[]` / `category: {categoryId | name+color}`; bundles use lowercase `priceType: sum|fixed|discount` + `discountPercentage`.

**Covers:** [Dashboard] [Web] [Mobile]
**Preconditions:**
- Fresh OWNER account registered + email verified, `wizardCompleted: false` (lands on `/welcome`). A second, fully set-up OWNER business on an active STANDARD trial with a published marketplace listing (for cross-app checks).
- Plans `STANDARD` and `PLUS` seeded (wizard completion assigns a 14-day STANDARD trial); industries seeded.
- Marketplace web reachable (listing at `/{locale}/business/[slug]` — slug is the LOCATION slug) and mobile app pointed at the same API.

## Setup wizard (fresh business)

### 09.1 Full wizard run — all 3 steps happy path [Dashboard]
**Steps:**
1. Log in as fresh OWNER → `/dashboard` shows a "SETUP · REQUIRED" gate card; its CTA opens `/welcome` (SetupWizard, steps: Business Info → Location → Team).
2. Step 1: fill business name, business email, phone (E.164), pick industry, country, timezone, business currency; Continue.
3. Step 2: fill location name, address (autocomplete), confirm map pin, contact (or "use business contact"), set working hours; Continue.
4. Step 3: toggle "works solo" (no invites); click Finish Setup (`POST /wizard/complete`).
**Expected:** Response `"Business setup completed successfully!"` with `businessId`, `locationId`, `wizardCompleted: true`, new auth tokens. Launch page (StepLaunch) renders with business + location summary. Business created with 14-day STANDARD trial (`trialEndsAt` set), default booking settings row created, owner linked to the location.

### 09.2 Required-field validation on each wizard step [Dashboard]
**Steps:**
1. Step 1: try Continue with empty name / invalid phone / no industry / no currency / no country / no timezone.
2. Enter 1-char business name, then a name with `<>` characters.
3. Step 2: try Continue with empty location name, empty address, unconfirmed map pin, invalid email.
4. Bypass UI: `POST /wizard/complete` with 1-char name via API client.
**Expected:** Each field blocks progression with inline error (phone/currency/country/timezone required messages). API (post 2026-07-23 fix): `POST /wizard/complete` validates `CompleteWizardDTO` → 400 with `"Enter at least 2 characters"`, `"Maximum 70 characters allowed"`, `"Please remove special characters (only - ' & . ( ) allowed)"`, phone regex message; empty-string optional fields (social URLs, location contact when using business contact) are tolerated. No business created.

### 09.3 Abandon wizard mid-way and resume (draft persistence) [Dashboard]
**Steps:**
1. Complete step 1, fill half of step 2, click "Save & finish later".
2. Verify toast (progress saved) and redirect to `/dashboard`.
3. Log out, log back in → routed back to `/welcome`.
4. Observe hydration skeleton, then form state.
**Expected:** `POST /wizard/save-draft` persists `wizardData` (incl. `currentStep`) server-side on BusinessOwner; after re-login `GET /wizard/draft` rehydrates all entered values and the saved step. Draft survives browser/device change (server-side, not localStorage).

### 09.4 Wizard logo upload, replace and remove [Dashboard]
**Steps:**
1. Step 1: upload a logo > max size (`UPLOAD_CONFIG.MAX_LOGO_SIZE`), then an unsupported type (e.g. .txt).
2. Upload a valid PNG/SVG (`POST /wizard/upload-logo`), then upload a second one.
3. Remove the logo, save draft.
4. Re-add a logo and complete the wizard.
**Expected:** Oversize → 400 `"Logo file size exceeds maximum allowed size of XMB"`; bad type → 400 `"Invalid logo file type..."`. Replacement deletes the old `wizard-drafts/{uuid}/logo` file; removal + save-draft deletes it from storage. On completion the logo is copied to `businesses/{businessUuid}/profile` and shown on the Launch page and business profile.

### 09.5 Wizard team invites — self-invite blocked, invite emailed [Dashboard]
**Steps:**
1. On step 3 add your own account email as a team member.
2. Add a valid third-party email, finish setup.
3. Check invitee inbox and Launch page.
**Expected:** Self email rejected (UI blocks; API: `"You cannot invite your own email."`). Invitee gets a team invitation email with a `/team-invitation?token=` link; UserRole created with status `pending_acceptance`; Launch page lists the pending member.

### 09.6 Wizard cannot be re-run; non-owner cannot see it [Dashboard]
**Steps:**
1. As the just-completed OWNER, navigate to `/welcome`.
2. Via API client, `POST /wizard/complete` again with valid payload.
3. Log in as a TEAM_MEMBER and open `/welcome`.
**Expected:** Completed owner sees the Launch page (no wizard form). Repeat complete → 400 `"Wizard already completed."`. Team member is redirected to their role home route (wizard endpoints are `@Roles(OWNER)` → 403 `SYSTEM.E04` via API).

## Business profile & settings

### 09.7 Edit business profile — name, industry, phone [Dashboard] [Web]
**Steps:**
1. Go to `/account?tab=profile` (BusinessProfile).
2. Change business name, industry, phone; note business email and timezone are not part of this form (email changed via account security / `POST /auth/change-email`; timezone has no UI, API-only field).
3. Save (`POST /business/update`).
4. Open the published listing on web `/{locale}/business/[slug]`.
**Expected:** Success `BUSINESS.S01`; `GET /business/profile` returns updated fields incl. `industry {id, name}`. Clearing industry blocks save (industry required; unknown industryId → `BUSINESS.E04`). Web listing shows the new name after reload.

### 09.8 Business currency change reflects in prices [Dashboard] [Web]
**Steps:**
1. In `/account?tab=profile` change `businessCurrency` (e.g. eur → ron); save.
2. Open `/services` and check a service price display.
3. Open the web listing and the booking drawer price lines.
**Expected:** UI offers only whitelisted currencies (the API itself accepts any 3-letter code — accepted limitation, do not test via API). Services list and web booking display amounts formatted in the new currency (prices stored as `price_amount_minor`, no numeric conversion — same minor units, new symbol).

### 09.9 Dashboard language switcher (en/ro) [Dashboard]
**Steps:**
1. Open sidebar LanguageSwitcher, switch English → Română.
2. Navigate `/services`, `/locations`, `/account`; reload the page.
**Expected:** All labels render in Romanian; choice persists across reload; switching back to English restores. No mixed-language strings on wizard or settings pages.

## Locations

### 09.10 Add a location — happy path + plan limit [Dashboard]
**Steps:**
1. `/locations` → Add location (AddLocationSlider): name, address + confirm pin, contact, working hours; save (`POST /locations/create`).
2. Repeat adding locations until the plan's `maxLocations` is exceeded.
**Expected:** Success `LOCATION.S01`; creator auto-linked to the new location; list shows it with services/team counts. Over limit → 403 `SYSTEM.E04` with `{ limit }` details; UI blocks/upsell rather than creating.

### 09.11 Edit opening hours per weekday, closed days, 24/7 [Dashboard]
**Steps:**
1. `/locations` → edit working hours (EditWorkingHoursSlider).
2. Set per-day open/close times; "Mark as closed" for Sunday.
3. Toggle Open 24/7 on, save; then off, save (`PUT /locations/:id`).
**Expected:** Success `LOCATION.S02`; reload shows persisted per-day `{open, close, isOpen}`; closed day renders "Closed on Sunday" state; with `open247` the per-day grid is disabled. No remote/`isRemote` toggle anywhere on location forms (field removed).

### 09.12 Opening-hours change shifts booking slots [Dashboard] [Web] [Mobile]
**Steps:**
1. On the published business, note available slots on web booking drawer (`POST /marketplace/public/booking/slots`) for a weekday.
2. In dashboard, shorten that day's hours (e.g. close at 14:00) and mark another day closed; save.
3. Re-open web booking drawer for both days; repeat on mobile app booking screen (`app/booking.tsx`, same slots endpoint).
**Expected:** Slots after 14:00 disappear on web and mobile; fully closed day returns no slots and its calendar day is unavailable (`POST /marketplace/public/booking/calendar`). Forced booking at a removed time via API → `MARKETPLACE_BOOKING.E11` (outside working hours).

### 09.13 Delete location — guard when it has users/services/appointments [Dashboard]
**Steps:**
1. Try deleting a location that has assigned staff, services, and a future appointment (EditLocationSlider → delete, `DELETE /locations/:id`).
2. Note the blocking dialog contents.
3. Clear the location's staff links via `PUT /assignments/locations/:id` with `{services: [], bundles: [], userIds: []}` (note: `POST /team-members/:uid/unassign-location/:loc` refuses the OWNER with 403 `SYSTEM.E04`), resolve appointments, then delete again.
**Expected:** First attempt returns `canDelete: false`, message `LOCATION.E07`, with `activeUsersCount`, `pendingUsersCount`, `servicesCount`, `appointmentsCount`, `websiteGalleryImagesCount`; nothing deleted — a freshly created location always starts blocked because its creator is auto-linked. After unlinking → `canDelete: true`, `LOCATION.S03`; location gone from list and from web/mobile listing.

### 09.14 Multiple locations behave independently [Dashboard] [Web]
**Steps:**
1. With 2+ locations, give each different addresses and working hours; assign different service sets (`PUT /assignments/locations/:id`).
2. On web, open each location's listing via its own slug.
3. Book the same service at both locations at a time valid only for one.
**Expected:** Each `/business/[slug]` page shows its own address, hours, and services. Slot sets differ per location per its hours; the invalid-location attempt gets no such slot / `MARKETPLACE_BOOKING.E11`.

## Services & categories

### 09.15 Add a service — name, category, price, duration, locations, staff [Dashboard] [Web]
**Steps:**
1. `/services` → Add service (AddServiceSlider): name, pick/create category, price, duration, locations (pre-selected all); save (`POST /services/create`).
2. Assign staff to the service per location on `/assignments` (`PUT /assignments/locations/:id`).
3. Verify the service on the web listing and in the booking drawer with the assigned staff selectable.
**Expected:** Success `SERVICE.S01`. Create without category → 400 `CATEGORY.E05`. Foreign `locationIds` (another business) via API → 403 `SERVICE.E06`. Web shows the service grouped under its category with price in business currency; assigned staff appear as bookable.

### 09.16 Category CRUD via Manage categories + 25-cap [Dashboard]
**Steps:**
1. On `/services`, open Manage categories (in ServiceFilters/CategorySection): add a category, rename one inline, shuffle its color, delete an unused one; Apply.
2. Create a duplicate-named category (case-insensitive) from the service form.
3. Via API, create categories until 50 exist, then one more.
**Expected:** Apply batches create/update/delete (`POST /categories/create`, `PUT /categories/:id`, `DELETE /categories/:id`) then reloads list; services re-render with new names/colors. Duplicate name reuses the existing category (no dup row; returns the existing id). 51st → 403 `CATEGORY.E06` with `{maxCategories: 50, currentCount}` — enforced inside `CategoryService.create` so every path (categories/create, service form, bulk apply) hits it; being over the cap no longer blocks `POST /services/create` when no new category is being created. (Fixed 2026-07-23 — retest after deploy.)

### 09.17 Delete service with future appointments — guard [Dashboard]
**Steps:**
1. Book a future appointment for a service (web booking or dashboard calendar).
2. Delete that service (`DELETE /services/:id`).
3. Remove links (locations/staff) and cancel the appointment, delete again.
**Expected:** First attempt: `canDelete: false`, message `SERVICE.E08`, with `teamMembersCount`, `locationsCount`, `appointmentsCount`; service intact. The appointment count includes ALL appointments regardless of status or date — cancelled/past bookings still block, so a service that was ever booked stays undeletable (by design; history preservation). Only link cleanup reduces the other counts.

### 09.18 Role boundary — team member cannot mutate setup entities [Dashboard]
**Steps:**
1. Log in as TEAM_MEMBER of the business.
2. Via API client: `POST /locations/create`, `PUT /locations/:id`, `POST /services/create`, `DELETE /services/:id`, `POST /categories/create`, `POST /bundles/create`, `POST /business/update`.
3. In UI confirm no add/edit/delete affordances for these on team-member views.
**Expected:** All writes → 403 (`SYSTEM.E04` / roles guard); team member can only read lists (`POST /locations/list`, `GET /services/list`, `POST /categories/list` allow TEAM_MEMBER). UI hides owner-only actions.

## Bundles

### 09.19 Create bundle — FIXED and DISCOUNT pricing + validation [Dashboard]
**Steps:**
1. `/services?tab=bundles` → Add bundle (AddBundleSlider): name, pick 2+ services, priceType FIXED with a fixed price; save (`POST /bundles/create`).
2. Create a second bundle with priceType DISCOUNT and a percentage.
3. Via API: create with empty `serviceIds`; FIXED without `fixedPriceAmountMinor`; DISCOUNT with 150%.
**Expected:** Success `BUNDLE.S01`; list shows `calculatedPriceAmountMinor` (fixed amount, or summed service prices minus discount). Validation errors: `BUNDLE.E06` (≥1 service required), `BUNDLE.E07` (fixed price required), `BUNDLE.E08`/`BUNDLE.E09` (discount required / 0–100).

### 09.20 Book a bundle on web; delete guard [Dashboard] [Web]
**Steps:**
1. Assign the bundle to a location (`PUT /assignments/locations/:id/bundles`) and ensure it's marketplace-visible.
2. On web `/business/[slug]`, open booking drawer → bundles listed alongside services; pick the bundle, staff, and slot; confirm booking (payload uses `bundleId`, not `serviceId`).
3. Book with a staff member who can't perform all bundle services (API).
4. Delete the bundle with the future bundle appointment pending (`DELETE /bundles/:id`).
**Expected:** Booking succeeds → `MARKETPLACE_BOOKING.S01`, appointment spans all bundle services. Incapable staff → `MARKETPLACE_BOOKING.E17`. Delete → `canDelete: false`, message `BUNDLE.E10` with `locationsCount`/`appointmentsCount`. Unassigning clears `locationsCount`, but the appointment count includes cancelled/past bookings — a bundle that was ever booked stays undeletable (by design, same as services).
