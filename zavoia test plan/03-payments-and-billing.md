# 03. Payments & Billing — Test Scenarios

**Covers:** [Dashboard] [CRM]
**Preconditions:**
- Stripe **test mode** keys; `stripe listen` (or configured endpoint) forwarding events to `POST /billing/webhook` with matching `STRIPE_WEBHOOK_SECRET`.
- OWNER account with a trial business, `countryCode: RO`; a second OWNER business with a non-RO country (e.g. DE). Plans `STANDARD` and `PLUS` seeded; a `plan_pricing` row whose `countryCodes` includes `RO` (RON price IDs); default plan prices in EUR.
- Oblio test credentials configured (`IS_VAT_PAYER = false` in code); website catalog seeded with ≥2 paid variants and ≥1 paid section unlock, at least one with a regional pricing row for RO.
- **Invoice billing details must be filled first.** The billing tab requires the owner to complete "Invoice billing details" (Company or Individual) before any checkout is allowed; otherwise Subscribe/Upgrade shows *"Please fill in your invoice billing details before paying."* Fill these once per business before running the checkout cases below.

## Subscription checkout (Stripe test mode)

> The subscribe happy-path (STANDARD via Stripe Checkout with `4242`) is covered by **02.5**. The cases below reuse that flow; "checkout as in 02.5" means: billing tab → pick plan → Subscribe → pay on Stripe Checkout. Note the dashboard has **no seat picker in the subscribe flow** — a business subscribes with 0 seats and adds seats afterward via the seat stepper (see 02.21).

### 03.2 3D-Secure card [Dashboard]
**Steps:**
1. Start checkout as in 02.5.
2. Pay with `4000 0025 0000 3155` → 3DS challenge appears.
3. Click "Complete authentication".
4. New checkout, same card, click "Fail authentication".
**Expected:** Complete → identical result to 02.5. Fail → error stays on Stripe Checkout; no `Subscription` row; business stays on trial.

### 03.3 Declined card [Dashboard]
**Steps:**
1. Start checkout as in 02.5.
2. Pay with `4000 0000 0000 0002`.
3. Use the back link → returns to cancel URL `/account`.
**Expected:** Stripe shows "Your card was declined."; no fulfillment webhook, no `Subscription` row, still trial. Billing tab unchanged.

### 03.4 Double-submit protection + duplicate-subscription guard [Dashboard]
**Steps:**
1. On billing tab, rapidly double-click Subscribe.
2. Complete the single checkout with 4242.
3. Via API client, POST `/billing/checkout` again as the now-subscribed OWNER.
**Expected:** Button disabled by `checkoutLoading`; saga holds it disabled ~5 s through the redirect — exactly one Stripe session. Step 3 → 400 `"Business already has a subscription. Use plan change or seat updates instead; to resubscribe, cancel the current subscription first."`

### 03.5 Role boundary: non-owner has no billing access [Dashboard]
**Steps:**
1. Log in as a TEAM_MEMBER of the business.
2. Open `/account?tab=billing` directly.
3. Via API client with the team member's token, POST `/billing/checkout` and GET `/billing/invoices`.
**Expected:** `/account` is owner-only (`ACCESS_SETTINGS`/`ACCESS_SETTINGS_BILLING`); `ProtectedRoute` redirects the team member straight to `/dashboard` before the page renders (their own account page is `/my-account`, no billing tab). Both API calls rejected by `RolesGuard` (`@Roles(UserRole.OWNER)`) — 403.

## Regional per-country pricing

### 03.6 Plan prices resolved per business country [Dashboard]
**Steps:**
1. As RO-business OWNER start a STANDARD checkout; note Stripe Checkout currency/amounts.
2. As DE-business OWNER start the same checkout.
**Expected:** RO business gets the `plan_pricing` row's price IDs (RON amounts); DE business gets the plan's default `stripeBasePriceIdMonthly` (EUR). Seat line uses the matching regional/default seat price. Billing tab price breakdown matches each.

### 03.7 Website catalog prices resolved per country [Dashboard]
**Steps:**
1. As PLUS RO-business OWNER open `/marketplace?tab=website` (website builder) — GET `/website-variants/catalog`.
2. Note price shown on a variant that has an RO pricing row.
3. Repeat as PLUS non-RO business.
4. Set `billingCountryCode` ≠ `countryCode` on one business and re-check.
**Expected:** RO business sees the regional row's `priceMinor`/`currency`; other country sees the variant default. `billingCountryCode` wins over `countryCode` (effective country = `billingCountryCode ?? countryCode`).

## Website variant cart (multi-item one-session checkout)

### 03.8 Multi-variant cart → single Stripe session → one multi-line Oblio invoice [Dashboard]
**Steps:**
1. As PLUS OWNER in the builder, "Add to cart" 2 paid variants + 1 paid section unlock.
2. Reload the page — cart persists (localStorage keys `zavoia.websiteVariantCart.{businessId}` / `zavoia.websiteSectionCart.{businessId}`).
3. Cart bar → Checkout (POST `/website-variants/checkout` with `variantIds` + `sectionIds`) → pay with 4242.
4. Return to `/marketplace?tab=website&variantPurchase=success`.
**Expected:** ONE Stripe session with one line item per item (`metadata.type: 'website_variant_purchase'`). All purchase rows flip PENDING→COMPLETED; cart clears; items show owned. ONE Oblio invoice with one line per item (`Sectiune website: <name>` for RO / `Website Section: <name>` otherwise), total = sum of resolved prices; listed in GET `/billing/invoices` as type `website_variant_purchase`.

### 03.9 Variant checkout rejections [Dashboard]
**Steps:**
1. As STANDARD (non-PLUS) OWNER, POST `/website-variants/checkout` with a paid `variantIds`.
2. As PLUS OWNER, checkout an already-owned variant; then a free (base) variant.
3. Checkout a cart mixing two items whose resolved currencies differ (e.g. RON + EUR rows).
**Expected:** 1 → 403 `WEBSITE_VARIANTS.E05` (website builder not on plan; `SubscriptionGuard` itself passes — the business is still entitled, just missing the tier feature). 2 → 409 `WEBSITE_VARIANTS.E04` (owned) / 400 `WEBSITE_VARIANTS.E03` (free); sections: `WEBSITE_SECTIONS.E05`/`E04`. 3 → 400 `WEBSITE_VARIANTS.E08` (single currency per session).

### 03.10 Abandoned variant checkout expires; stale sessions killed on re-checkout [Dashboard]
**Steps:**
1. Start a variant checkout, do NOT pay; leave the Stripe tab open.
2. Start a second checkout for the same variant from a new tab.
3. Attempt to pay in the first (stale) tab.
4. Let a session expire naturally (or `stripe trigger checkout.session.expired` equivalent).
**Expected:** New checkout calls `checkout.sessions.expire` on the stale session — old tab can no longer pay. `checkout.session.expired` / `checkout.session.async_payment_failed` marks the session's PENDING purchases FAILED; no ownership granted.

## Webhook handling (`POST /billing/webhook`)

### 03.11 Handled event set + signature verification [Dashboard]
**Steps:**
1. Confirm the Stripe endpoint (or `stripe listen`) forwards: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`, `payment_intent.payment_failed`, `subscription_schedule.*` (created/updated/completed/released/canceled).
2. POST a raw event to `/billing/webhook` with a bogus `stripe-signature`.
**Expected:** All listed types are the exact cases handled in `BillingService.handleWebhook`. Bogus signature → request errors (`Invalid webhook signature`), nothing processed; Stripe would retry.

### 03.12 Webhook retry idempotency [Dashboard]
**Steps:**
1. Complete a subscription checkout (02.5).
2. Resend the same `checkout.session.completed` event (Stripe dashboard "Resend").
3. Resend the fulfillment event of a variant purchase (03.8).
**Expected:** No duplicate `Subscription` row (log: "already exists, skipping creation (webhook retry)"); variant purchases already COMPLETED are skipped; Oblio invoice not re-issued (idempotent on payment-intent key).

### 03.13 Delayed payment settles via async_payment_succeeded [Dashboard]
**Steps:**
1. Start a variant checkout and pay with a delayed method (Stripe test bank transfer/SEPA), so `checkout.session.completed` arrives with `payment_status: 'unpaid'`.
2. Observe purchase rows, then let the payment settle (`checkout.session.async_payment_succeeded`).
**Expected:** On `unpaid` completion: no ownership, log "awaiting async payment", no Oblio invoice. On `async_payment_succeeded`: purchases COMPLETED, ownership granted, Oblio invoice created. (Subscription-mode sessions ignore the async event.)

### 03.14 charge.refunded — full revokes, partial does not [Dashboard]
**Steps:**
1. In the Stripe test dashboard, fully refund the payment of a completed variant purchase.
2. In the builder, try to publish a page using that variant.
3. Refund another variant payment PARTIALLY.
**Expected:** Full refund → purchases flip COMPLETED→REFUNDED, ownership revoked; variant blocks next publish until re-bought. Partial refund → log "Partial refund … handle purchase records manually", records untouched. Subscription-invoice refunds match no purchase and are logged only.

## Failed renewal / dunning

### 03.15 Renewal payment fails → past_due, listing hidden [Dashboard]
**Steps:**
1. On an active subscription, attach failing card `4000 0000 0000 0341` as default (customer portal) and advance the billing cycle (Stripe test clock) — or trigger `invoice.payment_failed` + `customer.subscription.updated` (status `past_due`).
2. Check the business's marketplace listing and `/account?tab=billing`.
**Expected:** Subscription row status → `past_due`; marketplace listing hidden (`hideListingOnExpiry`, from both the `past_due`/`unpaid` update and `invoice.payment_failed`). Billing tab shows the past-due/pending-payment state.

### 03.16 Payment recovered → listing restored [Dashboard]
**Steps:**
1. From 03.15, update to a working card via customer portal and pay the open invoice.
2. Wait for `customer.subscription.updated` (status `active`) and `invoice.paid`.
**Expected:** Subscription back to `active`; marketplace listing restored (`showListingOnPaymentRestored`); an Oblio invoice is generated for the recovered invoice; billing tab shows Active.

### 03.17 Dunning exhausted → subscription deleted, plan cleared, email [Dashboard]
**Steps:**
1. Let Stripe cancel the past-due subscription (test clock through dunning, or cancel with reason `payment_failed`) → `customer.subscription.deleted`.
2. Check business record, billing tab, owner inbox.
3. Re-subscribe via the billing tab Renew/Subscribe flow.
**Expected:** Subscription row → `canceled`; business `plan` and `stripeSubscriptionId` nulled (`paidTeamSeats` kept for renewal UX); listing hidden. Owner receives the "payment failed / subscription paused" email (user-initiated cancels get the "sorry to see you go" variant; sent once — `terminationEmailSentAt`). Re-subscribe works because the old sub is `canceled`.

## Card update

### 03.18 Update card via Stripe customer portal [Dashboard]
**Steps:**
1. On `/account?tab=billing`, click "Payment Method" (POST `/billing/customer-portal`).
2. In the portal, add card `5555 5555 5555 4444` and set it default; remove old card.
3. Return to the dashboard (portal return URL) and advance/renew a cycle.
**Expected:** Portal opens for the business's `stripeCustomerId` (button disabled while `portalLoading`; 400 `"No Stripe customer found for business"` if never subscribed). Next renewal charges the new card; no state change in Zavoia besides normal webhook flow.

## Invoices (Oblio + CRM)

### 03.19 Oblio invoice with correct lines/VAT + dashboard visibility [Dashboard]
**Preconditions:** Invoice billing details filled (see file preconditions) — the Oblio invoice is issued to that entity. The Stripe webhook endpoint **must** forward `invoice.paid`; without it, subscription payments never generate an Oblio invoice (`/billing/invoices` stays empty for subscriptions). Seat-purchase proration invoices flow through the same `invoice.paid` path.
**Steps:**
1. Complete a subscription payment (02.5) → `invoice.paid` fires. (Alternatively, a seat increase via 02.21 produces a proration `invoice.paid`.)
2. Open billing tab invoice list (GET `/billing/invoices`) and the `oblioLink` PDF.
3. Compare a RO business vs an EU `COMPANY` (`billingEntityType`) vs a non-EU business.
**Expected:** `oblio_invoice` row status `success` with series+number; owner gets the "invoice ready" email. VAT (with `IS_VAT_PAYER=false`): RO → 0% rule `ro_non_vat_payer`; EU company → 0% reverse charge with mention "Taxare inversa conform art. 331 din Directiva 2006/112/CE"; non-EU → 0% `export_services`. Language RO for RO clients, EN otherwise.

### 03.20 CRM failed-invoice list and retry [CRM]
**Steps:**
1. Force an Oblio failure (e.g. invalid Oblio credentials or missing billing data), complete a payment → invoice row status `failed`.
2. In CRM open `/invoices` ("Oblio Invoices" page) — POST `/admin-crm/invoices/failed/list`.
3. Fix the cause, click Retry (POST `/admin-crm/invoices/:id/retry`).
**Expected:** Failed row listed with `errorMessage` and `retryCount`. Retry re-issues the Oblio invoice: row flips to `success` with series/number/link and disappears from the failed list; `retryCount`/`lastRetryAt` updated. GET `/admin-crm/business/:businessId/invoices` shows the full per-business history.
