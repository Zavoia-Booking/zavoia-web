# 07. Website Builder & Variants — Test Scenarios

> Rewritten 2026-07-23 against the shipped implementation (dedicated `/website-builder` API + `/website` dashboard route). Scenarios marked ✅ were executed on staging that day. Refund-revocation testing was removed on purpose: website purchases are permanent by design and we don't do refunds.

**Covers:** [Dashboard] [CRM] [API]
**Preconditions:**
- Stripe **test mode**; webhook delivers `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` to `POST /billing/webhook`.
- OWNER A on `PLUS` (active sub, business `countryCode: RO`); OWNER B on `STANDARD` or fresh trial (builder locked either way — trial gives no feature boost).
- Catalog seeded: active `website_section` rows for all builder section types; variants per section (base free + premium paid); optionally paid section unlocks, paid theme assets (brand colors / fonts), and regional pricing rows.
- **Known staging seed gaps (2026-07-23):** no paid section unlocks (all sections price 0), announcement section has NO free base style (3 premium only), no RO regional pricing rows (all prices default EUR).

## Access gating

### 07.1 Plus owner opens the builder [Dashboard] ✅
**Steps:** log in as OWNER A → sidebar **Website** (`/website`); confirm the atelier renders (brand/theme pickers, PAGE SECTIONS list, live DRAFT PREVIEW); check `GET /website-builder` fires.
**Expected:** editable builder; response contains `identity`, `draft` (full layout + content), `locations`, `publish` state, and `access: { canEdit: true, canPurchase: true, canPublish: true, reason: "active", planTier: "PLUS" }`.

### 07.2 Standard/trial owner gets the locked view [Dashboard] ✅
**Steps:** log in as OWNER B → `/website`; click the upgrade CTA.
**Expected:** locked view with feature list, teaser preview built from saved values, and the "Your saved draft and unlocked premium styles stay available if you change plans." note. CTA navigates to `/account?tab=billing`. The locked view does not fetch the variants catalog.

### 07.3 Checkout rejected without the websiteBuilder feature [API] ✅
**Steps:** as OWNER B, `POST /website-variants/checkout` with a valid paid `variantId` + success/cancel URLs.
**Expected:** 403 `WEBSITE_VARIANTS.E05` (details include businessId). No pending purchase, no Stripe session.

### 07.4 Non-owner roles blocked [API] ✅
**Steps:** call `GET /website-variants/catalog`, `POST /website-variants/checkout`, and any `/website-builder` route with a team_member or dashboard_user token.
**Expected:** 403 RolesGuard ("You are not authorized…") — the controllers are `@Roles(OWNER)`.

### 07.5 Catalog readable on any owner tier [API] ✅
**Steps:** as OWNER B, `GET /website-variants/catalog`.
**Expected:** 200 with `{sections, variants, themeAssets}`; each variant has `isBase`, `priceMinor`, `currency`, `owned`, `available`; only `isActive` rows returned.

## Catalog & pricing

### 07.6 Regional price resolution by business country [API]
**Steps:** compare the catalog price of an item with a regional pricing row between an RO business and a DE business; change `billingCountryCode` and refetch.
**Expected:** matching country sees the regional row (currency + priceMinor); non-matching sees defaults; `billingCountryCode` beats `countryCode`; first row containing the country wins. *(Currently untestable on staging — no regional rows seeded; both RO and DE see EUR defaults.)*

## Draft editing & versioning

### 07.7 Draft save requires the full payload + optimistic version [API] ✅
**Steps:** `GET /website-builder` → mutate one field → `PUT /website-builder` with the ENTIRE draft (`tagline`, `aboutContent`, `establishedYear`, `brandColorHex/Key`, `pageLayout`, `pageTheme`, `faq`, `announcement`, `layoutVersion`) + `expectedVersion` = current draft version.
**Expected:** `WEBSITE_BUILDER.S02`, version increments. Partial payloads are rejected by DTO validation. Note: `GET` returns `pageTheme.brandColorKey` but `PUT` rejects it inside `pageTheme` (strip before resending — known round-trip asymmetry).

### 07.8 Stale expectedVersion is rejected [API]
**Steps:** save the draft twice with the same `expectedVersion`; also `POST /website-builder/publish` with a stale version.
**Expected:** second write → `WEBSITE_BUILDER.E02` (version conflict); no partial writes.

### 07.9 Locked style is preview-only in the UI; API may store it [Dashboard] [API] ✅
**Steps:** in a section editor click a premium (locked) style pill; refresh; then via API save the draft with the locked variant selected.
**Expected:** UI shows "Previewing" + "Premium style preview — Unlock this style to save it…" with **Add to unlocks** / **Unlock · price** buttons; the saved selection is unchanged after refresh. The API accepts an unowned variant into the draft (`S02`) — ownership is enforced at publish (07.18), not at save.

### 07.10 Hero image upload/replace/delete [Dashboard] [API]
**Steps:** `POST /website-builder/hero` (multipart, `expectedVersion`) with a valid image, an oversized file, and a wrong type; then `DELETE /website-builder/hero?expectedVersion=…`.
**Expected:** valid upload normalizes the image, stores it, bumps the version, `S03`; old object deleted on replace; bad size/type → 400; stale version → `E02`; delete → `S04`.

## Unlock cart & Stripe checkout

### 07.11 Add to unlocks + persistence [Dashboard] ✅
**Steps:** add 2–3 premium styles to unlocks from different sections; verify the header chip (count + total); hard-refresh; open the chip dialog.
**Expected:** cart persists via localStorage `zavoia.websiteVariantCart.{businessId}` / `zavoia.websiteSectionCart.{businessId}` / `zavoia.websiteThemeAssetCart.{businessId}`. Dialog "Unlock N premium options" lists each line (section · style, price) and the one-currency total.

### 07.12 Remove lines; empty cart closes the dialog [Dashboard] ✅
**Steps:** remove one line via its ✕; remove the rest.
**Expected:** totals recalculate per removal; there is no separate "Clear" control — removing the last line empties localStorage, closes the dialog, and hides the header chip.

### 07.13 Buy Now single style end-to-end [Dashboard] ✅
**Steps:** section editor → **Unlock · price** → confirm dialog CTA → Stripe Checkout (`4242 4242 4242 4242`) → pay.
**Expected:** redirect to `/website?website_business_id={id}&session_id={cs_…}` (params stripped after processing); purchase row PENDING → COMPLETED (visible in `GET /website-variants/purchases`); style pill flips to owned/selectable after the webhook (~3 s).

### 07.14 Cart checkout — one session, matching line items [Dashboard] ✅
**Steps:** with 2+ unlocks, dialog CTA "Unlock N options · total" → inspect the Stripe page → pay.
**Expected:** a single `payment`-mode session; one line item per unlock named `Zavoia Website Section: <style name>`; amounts equal the country-resolved catalog prices in one currency. After the webhook ALL items are owned and the cart clears.

### 07.15 Cancel / abandoned checkout [Dashboard] ✅
**Steps:** start a checkout, use Stripe's back link; separately let a session expire (or expire via Stripe CLI).
**Expected:** back link returns to `/website` with no toast, nothing owned, cart intact. `checkout.session.expired` marks the PENDING purchase FAILED; creating a new checkout expires older open sessions holding the same items.

### 07.16 Checkout validation matrix [API] ✅
**Steps:** POST `/website-variants/checkout` with (a) an owned variantId, (b) a free/base variantId, (c) an unknown variantId, (d) a free sectionId, (e) an unknown sectionId, (f) a cart whose resolved prices span two currencies.
**Expected:** (a) 409 `WEBSITE_VARIANTS.E04` · (b) 400 `WEBSITE_VARIANTS.E03` · (c) 404 `WEBSITE_VARIANTS.E01` (details list missing ids) · (d) 400 `WEBSITE_SECTIONS.E04` · (e) 404 `WEBSITE_SECTIONS.E01` · (f) 400 `WEBSITE_VARIANTS.E08`. *(f untestable while all prices are EUR.)*

## Publish lifecycle

### 07.17 Publish blocked by unowned paid items [API] ✅
**Steps:** save a draft whose visible layout uses an unowned paid variant; `POST /website-builder/publish`; then hide that section and publish again.
**Expected:** visible unowned → 400 `WEBSITE_BUILDER.E07` with `{unownedVariants: [{sectionType, variantKey, name}], unownedSections, unownedThemeAssets}`. Hidden unowned selections do NOT block. Paid theme assets (brand color / font) are checked through the same gate.

### 07.18 Publish blocked by content readiness [API] ✅ (FAQ, gallery)
**Steps:** publish with each of these visible but under-filled: announcement (no message; CTA enabled without label/URL; schedule missing start or end), FAQ (no complete Q&A pair; an incomplete pair in either locale), marquee/Strip (too few service/category names), team (too few assigned members), testimonials/Reviews (too few customer reviews), gallery (fewer valid portfolio images than the style needs, e.g. bento wants 4).
**Expected:** 400 `WEBSITE_BUILDER.E03` with a specific `{reason, type, count, minimum}` per failure. Hiding the section always unblocks.

### 07.19 Publish happy path, dirty flag, unpublish [API] ✅
**Steps:** with a clean visible layout, `POST /website-builder/publish`; edit the draft; check `publish` state; `POST /website-builder/unpublish`.
**Expected:** publish → 201 `WEBSITE_BUILDER.S05`, `publish: {isPublished: true, publishedVersion, hasUnpublishedChanges: false}`; snapshot frozen into `websitePublishedSnapshot`; marketplace listing/slug/tags untouched (fully decoupled from `POST /marketplace-listing/publish`). Draft edit flips `hasUnpublishedChanges: true`. Unpublish → `S06`, `isPublished: false`. Publishing with no saved draft → `E08`. *(No public surface consumes the snapshot yet — verify via API state only.)*

### 07.20 Layout normalization [API]
**Steps:** save a layout with the marquee/Strip entry moved away from directly after hero; republish.
**Expected:** the service canonicalizes Strip to sit right after hero in the published snapshot; invalid section orderings are normalized rather than rejected.

## CRM catalog management — needs CRM admin credentials (not available to QA on 2026-07-23)

### 07.21 Create a variant in CRM; appears purchasable in dashboard [CRM] [Dashboard]
As before: valid create → new LOCKED style with country-resolved price in the builder; dup type+key → 409 `WEBSITE_VARIANTS.E02`; base with price/pricing → 400 `E10`; second active base → 409 `E09`; free non-base → 400 `E11`; unknown section → 400 `WEBSITE_SECTIONS.E07`.

### 07.22 CRM edit/deactivate constraints for purchased items [CRM] [Dashboard]
As before: changing `sectionType`/`variantKey` of a purchased variant → `WEBSITE_VARIANTS.E07` (sections: `WEBSITE_SECTIONS.E03`); price/pricing edits replace the row set and re-resolve in the dashboard; DELETE soft-deletes (`isActive: false`) — catalog hides it, completed purchases stay intact.
