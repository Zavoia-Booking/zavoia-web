# 06. Marketplace Page Management — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile] [CRM]
**Preconditions:**
- Owner account with active subscription; business with industry set, ≥2 locations, services/bundles + team members assigned to locations.
- Customer account logged in on web (`/{locale}/…`) and mobile app; at least one favorited professional.
- CRM admin account for the Business → Marketplace tab.

## Publish & listing content

### 06.1 First-time publish of the business listing [Dashboard]
**Steps:**
1. Log in as OWNER, open `/marketplace` (NotListedYetView shown when never listed).
2. Click Start Listing → configuration view with tabs `business | website | locations | reviews`.
3. On Business tab fill marketplace details, select ≥1 industry tag in IndustrySection.
4. Click Publish on the status strip.
**Expected:** `POST /marketplace-listing/publish` returns `MARKETPLACE_LISTING.S03`; `isListed=true`; a unique `businessSlug` is generated from the public name. No location becomes public automatically — each location must still be toggled public (06.11).

### 06.2 Publish button gating checklist [Dashboard]
**Steps:**
1. On `/marketplace?tab=business` clear all selected industry tags.
2. Observe status strip checklist and Publish button.
3. Re-select an industry tag; make no other change on an already-listed listing.
**Expected:** Publish disabled while `selectedIndustryTags.length === 0` (industryTag checklist item) or while validation errors exist; also disabled when already listed and form not dirty. Enabled only when dirty + valid. First publish is not dirty-gated.

### 06.3 Marketplace overrides vs business defaults [Dashboard] [Web]
**Steps:**
1. On Business tab switch OFF "use business name/description" (MarketplaceDetailsSection) and set marketplace overrides (name ≤200 chars).
2. Publish; open the location's public page `/{locale}/business/{locationSlug}` on web.
3. Retry publish with an invalid `marketplaceEmail` (e.g. "not-an-email").
**Expected:** Web page shows override name/description (effective values). Invalid email → 400 class-validator error (DTO `@IsEmail`); `brandColorHex` must match `#RRGGBB` or 400 "brandColorHex must be a 6-digit hex like #1B9C85".

## Photos, cover & hero image

### 06.4 Upload location portfolio photos — first becomes cover [Dashboard] [Web] [Mobile]
**Steps:**
1. Open `/marketplace?tab=locations`, pick a location with no photos.
2. Drag-and-drop 3 images into MarketplaceImagesSection.
3. Reload; open the location's public page on web and mobile listing screen (`app/listing/[id]`).
**Expected:** `POST /marketplace-listing/locations/:locationId/portfolio` per file; first uploaded image auto-set as `featuredImage` (cover). Photos persist immediately (no Publish needed) and appear in web/mobile galleries.

### 06.5 Upload validation and duplicate detection [Dashboard]
**Steps:**
1. Upload an image >10MB.
2. Upload a .gif or .pdf.
3. Re-upload an image with identical filename + size as an existing one.
**Expected:** 400 "Image file size exceeds maximum allowed size of 10MB"; 400 "Invalid image file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp, image/avif"; dashboard blocks the duplicate client-side (toast, no upload sent, no second copy in the grid) — the API's own dedup (`alreadyExisted: true` by matching filename+size) only fires on a direct call that bypasses this check.

### 06.6 Change cover, delete photos, cover promotion [Dashboard] [Web]
**Steps:**
1. Set a different photo as cover — `POST …/portfolio/featured { url }`.
2. Delete the current cover photo (`DELETE …/portfolio/{key}`), 2+ photos remaining.
3. Delete down to the last photo — dashboard disables its remove button (min 1 required); delete it via direct API call instead.
4. Call the featured endpoint with a URL not in the portfolio (API-level).
**Expected:** Cover switches instantly; deleting the cover promotes the first remaining image to cover. Dashboard UI never lets a location drop to zero photos; deleting the last one via the API leaves cover `null`. Foreign URL → 400 "Image not found in portfolio". Web card/detail reflects the new cover.

### 06.7 Hero image upload / replace / delete [Dashboard]
**Steps:**
1. On Business tab upload a hero image (HeroImageUpload) — `POST /marketplace-listing/hero`.
2. Upload a second hero image over it.
3. Delete the hero image (`DELETE /marketplace-listing/hero`).
**Expected:** Same 10MB/type validation as 06.5. Replace swaps `heroImageUrl` and best-effort deletes the old R2 object; delete nulls `heroImageUrl`/`heroImageKey`. Works even before first publish (listing row auto-created with `isListed=false`).

## Industry & marketplace tags

### 06.8 Industry tags saved and replaced on republish [Dashboard] [Web]
**Steps:**
1. Select 2 industry tags in IndustrySection, Publish.
2. Reload `/marketplace` — `GET /marketplace-listing` returns them in `selectedIndustryTags`.
3. Change selection to 1 different tag, Publish again.
**Expected:** `industryTagIds` fully replaces the previous set (old join rows deleted). Only tags of the business's own industry are offered.

### 06.9 Per-location marketplace tags (6 groups) [Dashboard]
**Steps:**
1. On the Business tab location list open the EditLocationMarketplaceDetailsSlider for a location.
2. Select chips across groups (amenities, audience, values, accessibility, paymentMethods, languages); Save.
3. Reopen slider — selections persisted (`GET /locations/:id/marketplace-tags`).
4. Clear one group entirely and Save; API-test a PATCH with a nonexistent/inactive tag id.
**Expected:** `PATCH /locations/:id/marketplace-tags` returns `LOCATION.S04`; omitted groups untouched, `[]` clears a group. Invalid tag id → 400 `LOCATION.E08` with `invalidIds`, and nothing from the request is applied (single transaction).

### 06.10 Bilingual tag search — RO and EN both match [Web] [Mobile]
**Steps:**
1. Ensure business is published with a tagged industry (e.g. tag with `nameRo` "Curățenie").
2. On web `/{locale}/search` (and mobile search) search "curatenie" (no diacritics).
3. Search the English tag `name`.
4. Search a partial prefix (e.g. "cura").
**Expected:** `GET /marketplace/public/listings?search=` resolves tag ids via `industry_tag.name` (similarity/ILIKE) and `unaccent(nameRo)` — diacritics optional; both RO and EN queries return the tagged business's public locations; partial typing matches via ILIKE.

## Location visibility & public reachability

### 06.11 Per-location public/booking toggles; new location defaults hidden [Dashboard] [Web] [Mobile]
**Steps:**
1. In LocationVisibilitySection toggle isPublic ON for location A — `PATCH /marketplace-listing/locations/:id/marketplace-flags`.
2. Verify location A appears in web/mobile search and `/{locale}/business/{slugOrId}` loads.
3. Toggle isPublic OFF; reload public page and search.
4. Create a brand-new location and recheck.
**Expected:** Toggle OFF → detail returns 404 "Listing not found" (web renders the business-not-found view) and the location drops from search/map (map_point sync). New locations default `isPublic=false`. `allowOnlineBooking` toggles independently.

### 06.12 Unpublished / never-listed business unreachable publicly [Web] [Mobile]
**Steps:**
1. Take a business with `isListed=false` but a location with `isPublic=true` (state before 06.1).
2. Open `/{locale}/business/{locationId}` (numeric id) and `/{locale}/business/{locationSlug}`.
3. Search for the business name on web/mobile.
4. Also try `/{locale}/business/{businessUuid}`.
**Expected:** All detail lookups → 404 "Listing not found" (gate: `isListed && !hiddenBySystem && !blockedByPlatform && location.isPublic && business.isActive`); business absent from search. A business UUID is never a valid identifier (route resolves numeric LOCATION id or location slug only) → not-found view.

### 06.13 CRM platform block hides the listing [CRM] [Web] [Dashboard]
**Steps:**
1. In CRM open the business → Marketplace tab, click "Block from Marketplace" (`blockedByPlatform=true`).
2. Open the public page and search on web.
3. Check the owner dashboard `/marketplace`.
4. Click "Unblock from Marketplace" and recheck.
**Expected:** Blocked → public detail 404 + removed from search/map (block re-syncs map points). Listing stays `isListed=true` for the owner. Unblock restores public visibility without republishing. (Same gate hides listings when `hiddenBySystem=true` on subscription expiry; restored on payment.)

### 06.14 Role and subscription boundaries [Dashboard] [API]
**Steps:**
1. As a TEAM_MEMBER, call `GET /marketplace-listing`, `POST /marketplace-listing/publish`, `PATCH /locations/:id/marketplace-tags`.
2. As OWNER, target another business's location on portfolio/flags/tag endpoints.
3. As OWNER with an expired subscription, call `POST /marketplace-listing/publish`, then a portfolio upload/delete and a tags PATCH.
**Expected:** Step 1 → 403 (all endpoints `@Roles(OWNER)`). Step 2 → 404 `MARKETPLACE_LISTING.E01` (foreign location) / `LOCATION.E01` (tags). Step 3 → publish rejected 402 `subscription_required`; hero/portfolio writes still succeed (`@AllowExpiredWrite`) and tag PATCH succeeds (`@ReadOperation` curation on lapsed subscription).

## Services & staff on the public page

### 06.15 showServices / showTeamMembers listing flags (API-level) [Web] [Mobile] [API]
**Steps:**
1. Set `showServices=false` on the business_marketplace_listing row (no dashboard UI — dashboard stamps these flags `true` on every publish).
2. Reload the public page (web + mobile).
3. Restore, set `showTeamMembers=false`; reload and open a team-member deep link (`GET /marketplace/public/listing/:listingId/team-member/:id`).
4. Republish from the dashboard and recheck.
**Expected:** Services OFF → `services` AND `bundles` arrays empty on the detail payload. Team OFF → `teamMembers` empty and the deep link returns 404 "Team members not available for this listing". A dashboard publish resets both flags to `true`.

### 06.16 Service/staff assignment changes propagate [Dashboard] [Web] [Mobile]
**Steps:**
1. Disable a service at location A (location-service assignment) and unassign one team member from location A.
2. Reload `/{locale}/business/{slugA}` and the mobile listing screen.
3. Re-enable/re-assign and recheck.
**Expected:** Public detail only returns location-enabled services (`isEnabled=true`) and active users assigned to that location; removed items disappear from Services/Team sections and the booking staff picker; restored items return. Team cards prefer marketplace-profile `displayName`/`professionalTitle`, falling back to the user's name.

## Team-member marketplace opt-out (hiddenFromMarketplace)

### 06.17 Orphaned dashboard user hides profile — filtered from customer favorites [Dashboard] [Web] [Mobile]
**Steps:**
1. As a customer, favorite a professional; then have that professional leave the business (no active team_member role → dashboard_user).
2. Confirm the pro still appears in customer favorites (web `/{locale}/saved`, mobile favorites) — orphaned pros stay visible in favorites.
3. As the pro, open dashboard `/my-profile` → MarketplaceVisibilitySection, toggle hidden ON.
4. Refresh customer favorites on web and mobile.
**Expected:** `POST /team-member-account/marketplace-visibility {hidden:true}` → `TEAM_MEMBER_ACCOUNT.S08`, `hiddenFromMarketplace=true`. Pro disappears from favorite-professionals lists (filter: active && !hiddenFromMarketplace && (visible-via-listing || no active team_member role)); the favorite row is kept in DB — toggle OFF makes them reappear.

### 06.18 Active team members cannot self-hide; flag resets on invite accept [Dashboard] [API]
**Steps:**
1. Log in as an ACTIVE team member → `/my-profile` shows no MarketplaceVisibilitySection (rendered for dashboard_user only).
2. API-call `POST /team-member-account/marketplace-visibility {hidden:true}` with a stale dashboard_user token whose user meanwhile has an active team_member role.
3. Take a hidden orphaned user (06.17) and have them accept a new business invitation.
4. Open the new business's public page Team section.
**Expected:** Step 2 → 400 `TEAM_MEMBER_ACCOUNT.E21` (DB re-check of active roles; active members are visible through their business listing). Invite accept removes the dashboard_user role and resets `hiddenFromMarketplace=false` — the member shows on the new listing immediately.

## Hours, address & map

### 06.19 Opening hours display and open/closed status [Dashboard] [Web] [Mobile]
**Steps:**
1. Edit location working hours in the dashboard `/locations` (EditWorkingHoursSlider): close Mondays, set Tue 09:00–20:00.
2. Open the web public page → About tab; check the open-status badge in the header.
3. Check the mobile listing screen hours section.
4. Set the location to 24/7 (`open247`) and recheck.
**Expected:** About tab lists per-day hours matching `workingHours` (Mon→Sun order); header open/closed status derived in the location's timezone (same derivation as map cards); closed day renders closed; `open247=true` hides the per-day hours list.

### 06.20 Address and map correctness [Dashboard] [Web] [Mobile]
**Steps:**
1. Update the location address (with map pin/coordinates) in the dashboard.
2. On web About tab check the displayed address and the directions link.
3. On mobile, open a listing whose location HAS coordinates, then one whose `addressComponents` lacks lat/lng.
4. Check the search map shows the pin at the new position.
**Expected:** Address text matches `location.address` (+city); directions URL built from lat/lng, falling back to the address string. Mobile hides the map/directions affordances when lat/lng are not numbers (no NaN URLs). Map pin position updates after the flags/publish map_point sync.
