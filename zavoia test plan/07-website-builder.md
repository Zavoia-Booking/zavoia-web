# 07. Website Builder & Variants — Test Scenarios

**Covers:** [Dashboard] [CRM] [Web]
**Preconditions:**
- Stripe **test mode** with webhooks forwarded to `POST /billing/webhook` (events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`).
- OWNER account A on a `PLUS` plan (active subscription), OWNER account B on `STANDARD` (or fresh trial — signup assigns STANDARD, builder stays locked); business A `countryCode: RO`.
- CRM admin account. Catalog seeded: active `website_section` rows for the builder section types (announcement, nav, hero, marquee, about, locations, gallery, team, interlude, testimonials, faq, footer), each with one free base variant (`isBase`, price 0) and ≥2 paid variants; ≥1 paid section unlock; ≥1 item with a regional pricing row for RO (RON).

## Builder access gating (Standard vs Plus)

### 07.1 Plus owner opens the website builder [Dashboard]
**Steps:**
1. Log in as OWNER A (PLUS) → `/marketplace?tab=website`.
2. Confirm the builder (`WebsiteBuilderTab`) renders: section list, style pickers, theme panel, live preview.
3. Check `GET /website-variants/catalog` fires on mount.
**Expected:** Builder editable (entitlements payload has `features.websiteBuilder: true`). Catalog returns `{sections, variants}` with `owned`/`isBase`/`priceMinor`/`currency` per entry.

### 07.2 Standard/trial owner sees locked upgrade view [Dashboard]
**Steps:**
1. Log in as OWNER B (STANDARD or trialing) → `/marketplace?tab=website`.
2. Observe the Website tab content.
3. Click the upgrade CTA.
**Expected:** `WebsiteBuilderLockedView` renders instead of the builder (feature list, teaser preview from saved values, "changes preserved" note). CTA navigates to `/account?tab=billing`. Trial businesses are locked too — trial gives NO feature boost.

### 07.3 Checkout API rejected without websiteBuilder feature [Dashboard]
**Steps:**
1. As OWNER B, call `POST /website-variants/checkout` directly with a valid paid `variantId` + `successUrl`/`cancelUrl`.
**Expected:** 403 `WEBSITE_VARIANTS.E05` ("Website builder is not available on the current plan"). No PENDING purchase row, no Stripe session.

### 07.4 Publish on non-entitled plan strips builder fields, preserves stored data [Dashboard]
**Steps:**
1. As OWNER A (PLUS), configure pageLayout/theme/FAQ/announcement and publish.
2. Downgrade the business to STANDARD (or expire the sub).
3. As OWNER B-state, publish again from the Business tab (full payload is always sent) with different builder values in the payload.
4. Re-upgrade to PLUS and reopen the builder.
**Expected:** Step 3 succeeds (no error): `pageLayout`, `pageTheme`, `faq`, `announcement` are STRIPPED server-side, other listing fields save normally. Step 4: previously stored builder config and owned variants are intact.

### 07.5 Non-owner role blocked from variant endpoints [Dashboard]
**Steps:**
1. Log in as a team member (non-OWNER dashboard user).
2. Call `GET /website-variants/catalog` and `POST /website-variants/checkout` with their token.
**Expected:** Both rejected by `RolesGuard` — controller is `@Roles(UserRole.OWNER)` only (403).

### 07.6 Native (Capacitor) build hides billing/purchase CTAs [Dashboard]
**Steps:**
1. Open the dashboard in the native business app as OWNER B (locked plan) → Website tab.
2. As OWNER A, open a locked paid variant's purchase dialog in the native app.
**Expected:** Locked view shows `nativeDescription` copy, NO "upgrade" billing button (no `/account?tab=billing` navigation). Purchase dialog shows the native hint instead of buy/cart actions; "in cart" badge suppressed on pills.

## Catalog & regional pricing

### 07.7 Catalog readable on any tier with owned/base flags [Dashboard]
**Steps:**
1. As OWNER B (STANDARD), call `GET /website-variants/catalog`.
2. Verify base variants and already-owned entries.
**Expected:** 200 regardless of tier (UI needs it for locked states). Each section's base variant has `isBase: true`, `priceMinor: 0`; owned entries `owned: true`. Only `isActive` catalog rows returned.

### 07.8 Regional price resolution by business country [Dashboard]
**Steps:**
1. As OWNER A (business `countryCode: RO`), open the builder and note the price pill of the variant with an RO pricing row.
2. Repeat with a business whose country matches no pricing row (e.g. DE).
3. Change business A's `billingCountryCode` and re-fetch the catalog.
**Expected:** RO business sees the RON row price; non-matching country sees the default `priceMinor`/`currency`. `billingCountryCode` takes precedence over `countryCode` (same rule as Oblio invoicing). First pricing row containing the country wins.

## Shopping cart (dashboard localStorage)

### 07.9 Add multiple items to cart; persists across refresh [Dashboard]
**Steps:**
1. As OWNER A, in the builder open two locked paid variants → "Add to cart"; add one paid section unlock.
2. Confirm the floating `VariantCartBar` shows 3 lines (sections listed first), per-line prices, and the summed total in one currency.
3. Hard-refresh the page and return to `/marketplace?tab=website`.
**Expected:** Cart hydrates from localStorage keys `zavoia.websiteVariantCart.{businessId}` / `zavoia.websiteSectionCart.{businessId}` — all 3 items still present. Pills show the "in cart" badge.

### 07.10 Remove item, clear cart, stale entries auto-dropped [Dashboard]
**Steps:**
1. With 3 items in the cart, click the X on one line.
2. Click "Clear".
3. Re-add an item, then (via CRM) deactivate that variant; reload the builder.
**Expected:** Remove drops only that line; total recalculates. Clear empties the cart and hides the bar (bar renders nothing when empty). Deactivated/owned/free ids are dropped from the cart on catalog load rather than silently skipped at checkout.

## Stripe checkout & ownership

### 07.11 Buy Now single variant end-to-end [Dashboard]
**Steps:**
1. As OWNER A, open a locked variant dialog → Buy (POST `/website-variants/checkout` with `variantId`).
2. Pay on Stripe Checkout with `4242 4242 4242 4242`.
3. Follow the redirect back.
**Expected:** Redirect lands on `/marketplace?tab=website&variantPurchase=success` → success toast, cart cleared, marker param stripped, catalog refetched (~3 s delay for the webhook). Purchase row goes PENDING → COMPLETED; variant pill flips to owned/selectable; appears in `GET /website-variants/purchases`.

### 07.12 Cart checkout — ONE Stripe session, amounts match [Dashboard]
**Steps:**
1. With 2 variants + 1 section unlock in the cart, click Checkout on the cart bar.
2. On the Stripe page, count the line items and compare each amount + currency to the cart bar.
3. Pay and return.
**Expected:** Single Stripe session (mode `payment`) with one line item per cart entry; line names `Zavoia Website Section: <name>`; amounts equal the country-resolved catalog prices, single currency. After the webhook, ALL items are owned (variant purchases + section unlock complete together).

### 07.13 Cancel / abandoned checkout [Dashboard]
**Steps:**
1. Start a cart checkout, then use Stripe's back link.
2. Start another checkout for the same items and let the first session expire (or expire it via Stripe CLI).
**Expected:** Back link returns to `/marketplace?tab=website` — no toast, nothing owned, cart intact (only success clears it). Creating a new checkout expires older open sessions holding the same items; `checkout.session.expired` marks their PENDING rows FAILED. No ownership without payment.

### 07.14 Already-owned and mixed-currency carts rejected [Dashboard]
**Steps:**
1. Via API, POST `/website-variants/checkout` including an already-owned `variantId`.
2. Repeat including an already-unlocked section in `sectionIds`.
3. Build a cart whose resolved prices span two currencies (RO-priced RON item + default EUR item) and checkout.
4. POST with a free (base) variant id.
**Expected:** 1 → 409 `WEBSITE_VARIANTS.E04`; 2 → 409 `WEBSITE_SECTIONS.E05`; 3 → 400 `WEBSITE_VARIANTS.E08` (one session = one currency); 4 → 400 `WEBSITE_VARIANTS.E03` ("Variant is free - nothing to purchase"). Unknown/inactive ids → 404 `WEBSITE_VARIANTS.E01` / `WEBSITE_SECTIONS.E01`.

### 07.15 Refund revokes ownership [Dashboard] [CRM]
**Steps:**
1. After 07.11, fully refund the payment intent in the Stripe test dashboard.
2. Wait for `charge.refunded`, refetch the catalog.
3. Attempt to publish a pageLayout still using the refunded variant.
**Expected:** Purchase status COMPLETED → REFUNDED; catalog shows the variant locked again. Publish is blocked with 403 `MARKETPLACE_LISTING.E18` until re-bought (already-published page keeps rendering).

## Configure, preview, publish

### 07.16 Edit sections and live preview [Dashboard]
**Steps:**
1. In the builder, reorder/hide sections, switch an owned variant style, edit hero/about/FAQ/announcement content and theme.
2. Watch the `LivePreview` (Microsite) pane; toggle the section preview visibility control.
3. Selecting a LOCKED variant's pill.
**Expected:** Preview re-renders edits immediately; preview visibility preference persists (localStorage). Clicking a locked style shows it preview-only and opens the purchase dialog — it does not become the saved selection.

### 07.17 Publish blocked by unowned paid variant/section [Dashboard]
**Steps:**
1. As OWNER A, craft a publish payload (`POST /marketplace-listing/publish`) whose `pageLayout` uses an unowned PAID variant (type+variant matching an active catalog entry with price > 0).
2. Repeat with a VISIBLE unowned paid section type.
3. Repeat with the same locked section present but `visible: false`.
**Expected:** 1 → 403 `MARKETPLACE_LISTING.E18` with `unownedVariants` detail; 2 → 403 `MARKETPLACE_LISTING.E19`; 3 → publish succeeds (hidden locked sections don't block). Uncatalogued/free/inactive-catalog variants always pass.

### 07.18 Publish happy path and public visibility [Dashboard] [Web]
**Steps:**
1. As OWNER A with all layout items owned, click Publish on the status strip (POST `/marketplace-listing/publish`).
2. Ensure ≥1 location is individually published (PATCH `/marketplace-listing/locations/:locationId/marketplace-flags`, `isPublic: true`).
3. Open the marketplace web location page `/{locale}/business/{location-slug}`.
**Expected:** Publish sets business-level `isListed: true` and regenerates `businessSlug` from the marketplace name (unchanged name → same slug). Location page renders on web. Publishing alone does NOT make locations public — each needs its own flag.

## CRM catalog management

### 07.19 Create a variant in CRM; appears purchasable in dashboard [CRM] [Dashboard]
**Steps:**
1. Log in to CRM → `/website-variants` → Add variant: pick a `sectionType` with an active section, unique `variantKey`, name, `priceMinor` > 0, currency, optional regional pricing rows (countryCodes → currency + priceMinor); save (POST `/admin-crm/website-variants`).
2. Try invalid combos: duplicate type+key; `isBase: true` with a price or pricing rows; second active base for the same type; non-base with price 0; a `sectionType` with no active section.
3. As OWNER A, refetch the dashboard catalog.
**Expected:** Valid create → 200; new variant shows LOCKED with its (country-resolved) price in the dashboard builder and can be bought. Invalid: dup key → 409 `WEBSITE_VARIANTS.E02`; base with price/pricing → 400 `WEBSITE_VARIANTS.E10`; dup active base → 409 `WEBSITE_VARIANTS.E09`; free non-base → 400 `WEBSITE_VARIANTS.E11`; unknown section → 400 `WEBSITE_SECTIONS.E07`.

### 07.20 CRM edit/deactivate constraints for purchased items [CRM] [Dashboard]
**Steps:**
1. In CRM, edit a variant with ≥1 COMPLETED purchase and try changing its `sectionType`/`variantKey` (PUT `/admin-crm/website-variants/:id`).
2. Edit price/pricing rows instead (pricing payload REPLACES the full row set) and save.
3. Delete the variant (DELETE `/admin-crm/website-variants/:id`); refetch dashboard catalog. Same flow on `/website-sections` for a purchased section's `sectionType` (PUT `/admin-crm/website-sections/:id`).
**Expected:** 1 → rejected `WEBSITE_VARIANTS.E07` ("Cannot change sectionType/variantKey of a purchased variant"); section counterpart → `WEBSITE_SECTIONS.E03`. 2 → succeeds; dashboard shows the new resolved price. 3 → SOFT delete (`isActive: false`): variant disappears from the dashboard catalog and CRM "active only" filter, but COMPLETED purchases/ownership history stay intact.
