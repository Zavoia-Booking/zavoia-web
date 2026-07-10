# 02. Subscription & Plans — Test Scenarios

**Covers:** [Dashboard] [Web] [CRM]
**Preconditions:**
- Stripe test mode; STANDARD and PLUS plans exist in DB (created via CRM `/plans`) with Stripe monthly base+seat price IDs, plus per-country `plan_pricing` rows (RO → RON, default → EUR); `stripe listen` forwarding to POST `/billing/webhook`.
- Fresh owner account able to complete the setup wizard; a second business already subscribed (for downgrade/cancel cases); a non-owner team member account in the same business.
- CRM admin account for plan management; ability to fire Cloud Tasks webhooks (`/webhooks/trial-expiry`, `/webhooks/trial-email-reminder`).

## Trial

### 02.1 Fresh business lands in 14-day trial [Dashboard]
**Steps:**
1. Register a new owner and complete the setup wizard (`/welcome`).
2. Open Dashboard → `/account?tab=billing`.
3. Open `/team-members`.
**Expected:** Trial is 14 days (wizard passes `trialDays = 14`; STANDARD-tier plan assigned at signup). Billing tab shows "Trial" status pill (warn tone), remaining days and trial end date (`billing.ends {date}`), plus "trial ends in N days" banner. Team members page shows TrialBanner with days remaining.

### 02.2 What is usable during trial — website builder stays locked [Dashboard]
**Steps:**
1. On the trial business, use calendar, services, locations, team invites, marketplace listing publish.
2. Open Marketplace → Website builder tab.
3. Via API: POST `/website-variants/checkout` with any paid variant.
**Expected:** Standard features all work (entitled, status `trial`). Website builder shows `WebsiteBuilderLockedView` — trials get NO feature boost (signup plan is STANDARD, `websiteBuilder: false`). API checkout rejected 403 `WEBSITE_VARIANTS.E05` (Website builder is not available on the current plan).

### 02.3 Trial reminder emails at 7 and 3 days [Dashboard]
**Steps:**
1. Fire POST `/webhooks/trial-email-reminder` with `{businessId, daysBeforeExpiry: 7}` (valid OIDC token).
2. Repeat with `daysBeforeExpiry: 3`.
3. Subscribe the business, fire the reminder again.
**Expected:** Steps 1-2: "ending in N days" email to owner, CTA link `{FRONTEND_URL}/account?tab=billing`. Step 3: no email, response `{success: true, reason: 'not_on_trial'}`.

### 02.4 Expired trial with no purchase — account locks, listing hidden [Dashboard] [Web]
**Steps:**
1. Set `trialEndsAt` in the past on a trial business with a published marketplace listing.
2. Fire POST `/webhooks/trial-expiry` for the business.
3. Reload the dashboard; via API try a write (create a service) and a read (list).
4. Open the business public page on marketplace web.
**Expected:** Entitlement status `expired`; dashboard web shows full-screen SubscriptionBlocker. API: GET/HEAD pass; writes → HTTP 402, code `subscription_required`, reason "Your subscription has expired. Subscribe to continue using zavoia." Listing hidden on marketplace web; "free period has ended" email sent linking to `/account?tab=billing`.

## Purchase & upgrade

### 02.5 Upgrade from trial to Standard via Stripe Checkout [Dashboard]
**Steps:**
1. On trial business, open `/account?tab=billing`, pick the STANDARD plan card, set seats in the stepper.
2. Confirm → POST `/billing/checkout` redirects to Stripe Checkout; pay with test card 4242….
3. Return via success URL `/info?type=subscription-success`; let `checkout.session.completed` webhook process.
**Expected:** Subscription row created status `active`; `business.trialEndsAt` cleared (trial ends immediately on payment). Billing tab flips to "Active" pill with plan, seats, renewal. Currency matches business country (RON for RO, EUR otherwise).

### 02.6 Purchase PLUS — website builder unlocks [Dashboard] [Web]
**Steps:**
1. Repeat 02.5 choosing the PLUS plan.
2. After webhook, open Marketplace → Website builder tab.
3. Edit page layout/theme and publish; view the business page on marketplace web.
**Expected:** `planTier: PLUS` grants `websiteBuilder: true` — locked view replaced by the real builder. POST `/marketplace-listing/publish` saves `pageLayout`/`pageTheme`/`faq`/`announcement`; changes visible on the public web page.

### 02.7 Double-checkout guard [Dashboard]
**Steps:**
1. On a business with a live subscription, call POST `/billing/checkout` with any planId.
**Expected:** 400 "Business already has a subscription. Use plan change or seat updates instead; to resubscribe, cancel the current subscription first." No second Stripe subscription created.

### 02.8 Upgrade STANDARD → PLUS (immediate, prorated) [Dashboard]
**Steps:**
1. On an active STANDARD business, billing tab → PLUS card → upgrade CTA.
2. Confirm dialog (`billing.confirm.upgradePlanTitle`) → POST `/billing/change-plan`.
3. If SCA test card: complete the 3DS challenge (response has `requiresAction` + `clientSecret`).
**Expected:** Response `action: 'upgraded'`; prorated difference charged immediately (`always_invoice` + `pending_if_incomplete`). Redirect `/info?type=plan-upgrade-success`; plan syncs to PLUS via `customer.subscription.updated` webhook; website builder unlocks without waiting for period end.

### 02.9 Plan change blocked while a payment is pending [Dashboard]
**Steps:**
1. Create a pending payment (seat increase with SCA card, abandon the 3DS challenge → open invoice, PI `requires_action`).
2. POST `/billing/change-plan` to PLUS.
**Expected:** 400 "You have a pending payment. Complete or abort the payment before changing plans." Billing tab shows pending-payment state with abort option (POST `/billing/abort-pending-payment`).

## Downgrade & cancel

### 02.10 Downgrade PLUS → STANDARD is scheduled at period end [Dashboard]
**Steps:**
1. On an active PLUS business, billing tab → STANDARD card → downgrade CTA.
2. Read the confirm dialog, then confirm → POST `/billing/change-plan`.
**Expected:** Dialog warns: applies at period end, website builder will be lost, and it replaces any scheduled seat change. Response `action: 'downgrade_scheduled'` (Stripe subscription schedule). Summary shows `scheduledPlanChange` banner with plan name + effective date; PLUS features keep working until then.

### 02.11 Cancel a scheduled downgrade [Dashboard]
**Steps:**
1. With a downgrade scheduled (02.10), trigger cancel-plan-change → POST `/billing/cancel-plan-change`.
2. Reload billing tab.
**Expected:** Schedule released; `scheduledPlanChange` banner gone; business stays on PLUS with unchanged renewal.

### 02.12 After downgrade takes effect — builder locked, data preserved, API enforces [Dashboard] [Web]
**Steps:**
1. Let the scheduled downgrade take effect (advance test clock; `customer.subscription.updated` arrives with STANDARD prices).
2. Open Website builder tab; then POST `/website-variants/checkout` via API with the owner JWT.
3. Save the marketplace listing from the dashboard (full payload) → POST `/marketplace-listing/publish`.
4. Re-upgrade to PLUS.
**Expected:** Step 2: `WebsiteBuilderLockedView` in UI AND API → 403 `WEBSITE_VARIANTS.E05` (gating is not UI-only). Step 3: publish succeeds but `pageLayout`/`pageTheme`/`faq`/`announcement` are silently stripped — stored builder data and owned paid variants untouched; other listing fields save normally. Step 4: builder and previous data fully restored.

### 02.13 Cancel subscription — access until period end [Dashboard]
**Steps:**
1. Active business → billing tab → cancel → POST `/billing/modify-subscription?action=cancel`.
2. Reload; verify features still work.
3. Click keep/resume → POST `/billing/modify-subscription?action=keep`.
**Expected:** Stripe sub gets `cancel_at_period_end: true`; message "Subscription will be cancelled at the end of the current period". Status pill "Scheduled for cancellation" (warn); business stays entitled (local status still `active`) until period end. `action=keep` reverts to Active.

### 02.14 Post-cancel period end — no grace, account locks [Dashboard]
**Steps:**
1. After 02.13, let the period lapse (Stripe fires `customer.subscription.deleted`).
2. Reload dashboard; attempt a write via API.
**Expected:** Local status `canceled`; entitled = false with no grace period after deletion. SubscriptionBlocker shown; writes → 402 `subscription_required`; billing tab shows "Canceled" pill (business has history) with re-subscribe plan cards.

## Subscription statuses

### 02.15 past_due — failed renewal [Dashboard]
**Steps:**
1. Simulate failed renewal (Stripe test clock / `customer.subscription.updated` with status `past_due`).
2. Reload dashboard; attempt a write.
3. Open customer portal (POST `/billing/customer-portal`) and fix the payment method.
**Expected:** Entitled = false, status `past_due`, reason "Your payment is past due. Update your payment method to restore access." Billing tab "Past due" pill (danger tone). After payment succeeds and webhook flips status to `active`, access restores.

### 02.16 trialing and paused Stripe statuses [Dashboard]
**Steps:**
1. Put the subscription in status `trialing` (Stripe-side trial); reload and use the app.
2. Put the subscription in status `paused` (pause collection); reload and attempt a write.
**Expected:** `trialing` counts as a live sub — entitled, entitlement status `active`. `paused` is neither active/trialing nor past_due/unpaid → entitled = false (locks like expired). Webhook stores both without 500 (SubscriptionStatus enum covers all Stripe statuses).

## API enforcement & permissions

### 02.17 Entitlement enforced at API level on a non-entitled account [Dashboard]
**Steps:**
1. On an expired-trial business, with the owner JWT call a normal write endpoint (e.g. create service/category — controllers guarded by `SubscriptionGuard`).
2. Call a GET on the same module.
3. Call POST `/billing/checkout` (BillingController never applies `SubscriptionGuard`).
**Expected:** Step 1: HTTP 402, code `subscription_required` — not just hidden UI. Step 2: 200 (reads always allowed, incl. `@ReadOperation` POSTs). Step 3: allowed, so the user can resubscribe.

### 02.18 Owner-only billing endpoints [Dashboard]
**Steps:**
1. With a non-owner team member JWT, call GET `/plans/list`, POST `/billing/checkout`, POST `/billing/change-plan`, GET `/billing/subscription-summary`.
**Expected:** All rejected 403 by RolesGuard (`@Roles(OWNER)`). Team member dashboard shows no billing management.

### 02.19 Native (Capacitor) dashboard hides billing [Dashboard]
**Steps:**
1. Log in on the native dashboard build as owner of a trial STANDARD business.
2. Open `/account`; try deep-linking `/account?tab=billing`.
3. Open Marketplace → Website builder tab.
**Expected:** Billing tab hidden on native (`canAccessBilling = !isNative && !isOwnerWithoutBusiness`); deep link falls back to profile tab. Locked view shows the native description without billing/upgrade CTA (no plan/upgrade wording in-app). TrialBanner also hidden on native.

## CRM plan management

### 02.20 CRM creates/edits plans and per-country pricing; checkout resolves it [CRM] [Dashboard]
**Steps:**
1. In CRM `/plans`, create a plan: name, tier (STANDARD/PLUS/CUSTOM), maxLocations, maxTeamMembers, Stripe monthly base+seat price IDs (POST `/admin-crm/plans/create`).
2. Add a pricing row scoped to country codes incl. RO with RON price IDs (POST `/admin-crm/plans/:planId/pricing`).
3. On a RO-country business, GET `/plans/list`; run checkout.
4. On a business whose plan has tier CUSTOM, attempt POST `/billing/change-plan`.
**Expected:** `/plans/list` returns only self-serve tiers (STANDARD then PLUS by tier order) with `features` (`websiteBuilder` true only on PLUS), `isCurrentPlan`, and RON pricing resolved from the country row; non-matching countries fall back to the plan's default price IDs. CUSTOM change rejected 400 "Plan changes for CUSTOM plans are handled manually — contact support."

## Seat changes

### 02.21 Seat increase applies immediately, decrease is scheduled for period end [Dashboard]
**Steps:**
1. On an active business, billing tab seat stepper → raise seats above the current paid count; GET `/billing/seat-change-preview` shows the exact proration due today.
2. Confirm → POST `/billing/update-seats`.
3. Lower seats below the current paid count; confirm → POST `/billing/update-seats` again.
4. Reload billing tab, then POST `/billing/cancel-removal`.
5. Re-schedule the same decrease, then downgrade the plan on top of it (PLUS → STANDARD, see 02.10).
**Expected:** Step 2: increase applies immediately — prorated invoice charged now (`always_invoice`/`pending_if_incomplete`), `paidTeamSeats` rises on webhook so more invites are allowed. Steps 3-4: decrease is never immediate — a Stripe subscription schedule takes effect at period end (`pending_dec`/"removing seats" banner, seats and limits unchanged until then), and `cancel-removal` releases that schedule to revert it. Step 5: the downgrade releases and recreates the schedule, but carries the already-scheduled seat count forward into the post-downgrade phase — so 02.10's "replaces any scheduled seat change" holds for the schedule object shown in the dialog, but the reduced seat count itself still lands, not just discarded.

## Lifetime deal (LTD) businesses

### 02.22 LTD business is always entitled; seats bought separately, plan change locked [CRM] [Dashboard]
**Steps:**
1. In CRM, open a business (any trial/subscription state) → Business Details tab → toggle "LTD" on (`PUT /admin-crm/business/:id/ltd`).
2. Set `trialEndsAt` in the past / clear the subscription on that business, then via API call a normal write endpoint (e.g. create service).
3. Open the dashboard billing tab; note the status pill and cost breakdown; attempt POST `/billing/change-plan`.
4. Use the extra-seats stepper → POST `/billing/ltd-seats-checkout`; pay; let the webhook process.
5. Reload billing tab; invite team members up to the new seat count.
**Expected:** Step 2: entitlement status `ltd`, entitled regardless of trial/subscription state (`entitlements.service.ts` checks `isLtd` before trial/past_due). Step 3: "Lifetime" status pill, seats priced 0 in the recurring breakdown, no plan picker shown; `change-plan` returns 400 "LTD businesses cannot change plans self-serve." Step 4-5: checkout succeeds even though not otherwise entitled (`@AllowExpiredWrite`, separate `ltdSeatStripeSubscriptionId`); webhook credits `business.paidTeamSeats`, unlocking that many additional invites.
