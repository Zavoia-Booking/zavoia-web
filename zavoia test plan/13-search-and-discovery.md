# 13. Search & Discovery (Marketplace) — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile] [CRM]
**Preconditions:**
- ≥3 businesses with published marketplace listings (`isListed=true`, not `hiddenBySystem`/`blockedByPlatform`), each with ≥1 public location with coordinates + city, industry, and industry tags set; one business with 2 locations.
- One marketplace customer account (logged in on web + mobile); one business-owner dashboard account; one CRM admin.
- Industry tags seeded bilingually (`name` EN + `nameRo`, e.g. Hair Salon / Curățenie).

## Text search

### 13.1 Search by business name shows a brand group + its locations [Web]
**Steps:**
1. Open `/en/search`, type an exact business (brand) name in the search overlay and submit.
2. Inspect the results list.
3. Repeat with only a prefix of the name (e.g. first 4 letters).
**Expected:** GET `/marketplace/public/listings` returns the match in the `businesses` group (brand-name hits) and its public locations in the location list. Businesses without an active listing (`isListed=false`, hidden, blocked, inactive) never appear. Brand card navigates to the primary location's detail page.

### 13.2 Fuzzy location-name search tolerates typos [Web] [Mobile]
**Steps:**
1. Search a location name with one typo (e.g. "Padesu" → "Padesu Beuty").
2. On mobile Search tab, repeat the same query.
**Expected:** Trigram match (`locationName % :q`) still returns the location; exact-substring typing also matches. Only LOCATION names are matched — a sibling location of the same business with a different name is not returned by that text.

### 13.3 Bilingual industry-tag search (EN + RO, diacritics-free) + locale switch [Web] [Mobile]
**Steps:**
1. On `/en/search` search "hair salon" — no location is literally named that.
2. Search with a typo: "hair saln".
3. Search the Romanian tag name WITHOUT diacritics (e.g. "curatenie" for tag "Curățenie").
4. Switch language to RO via the footer language switch; re-run the search; check tag/industry chip labels.
**Expected:** All three queries resolve to tag ids (similarity > 0.55 / ILIKE / unaccent(nameRo)) and return businesses TAGGED with the matching tag; name matches rank before tag-only matches. In RO locale, industry/tag labels render `nameRo` (fallback to EN `name`), and results are unchanged.

## Filters & sorting

### 13.4 City filter + category/tag filters [Web]
**Steps:**
1. On `/en/search` set a city (URL param `city`), including a slightly misspelled one (e.g. "Bucurest").
2. Tap an industry chip in the filter row (sets `industry` slug param).
3. Open the search overlay → Browse by category → select tag chips under an industry (sets `tagIds` CSV param).
4. Combine city + industry + tags.
**Expected:** City matches by prefix + trigram similarity (>0.3) despite the typo. Filters AND-combine; only locations whose `industryTagIds` overlap the selected tags remain. URL params are shareable — reloading the URL reproduces the result.

### 13.5 Geo anchor, sort menu, Open-now chip [Web]
**Steps:**
1. Land on `/en/search` fresh; decline the location-permission modal ("Not now").
2. Re-open the page — modal must not reappear (localStorage `zv-loc-skip`).
3. Accept geolocation (or let IP-locate resolve); observe anchor; without any anchor the map centers on Bucharest fallback (44.4268, 26.1025).
4. Open sort menu: switch between Recommended / Top rated / Nearest.
5. Toggle the "Open now" chip.
**Expected:** With an anchor, requests use a fixed 20 km radius (`SEARCH_RADIUS_KM`) and cards show `distanceKm`. "Nearest" sort only offered when geo is present; rating/near sorts are client-side reorders (no refetch). Open-now is a client-side filter of the loaded set.

### 13.6 Availability date filter (Available today / date + service) [Web]
**Steps:**
1. Seed one listed location closed on the target weekday, one open with free staff capacity, one open but fully booked that day.
2. Apply the Available-today chip (sets `date` param, today ISO).
3. Via API, add `serviceId` of a long service to `GET /marketplace/public/listings?date=...`.
**Expected:** Closed-that-weekday locations are pruned (openDaysMask), fully-booked ones are excluded (no free gap in `staff_availability_day` ≥ shortest-service duration). With `serviceId`, the required gap becomes that service's duration and only capable staff count. Cards show a next-available hint (`nextAvailableDate`/`nextAvailableAt`).

### 13.7 No exact match → relaxation fallback, then empty state [Web]
**Steps:**
1. Search with constraints that match nothing exactly (e.g. real tag + date nobody is free, or a far-away anchor).
2. Read the notice above results.
3. Search something matching nothing at all (nonsense text, no tags/geo).
**Expected:** Fallback recommendations returned with `fallback.applied=true` and a coded reason — one of `NO_AVAILABILITY_ON_DATE`, `NO_MATCH_FOR_TAGS`, `EXPANDED_RADIUS`, `SAME_INDUSTRY_NEARBY`, `RECOMMENDED_NEARBY`, `RECOMMENDED`. Web shows "We widened your search to show more results ({reason}).". True zero → `NO_RESULTS` and empty state "No places match those filters".

## Map view

### 13.8 Web map pins match the visible list [Web]
**Steps:**
1. Run a search returning several located results on `/en/search`.
2. Compare pin count vs list rows; note any row without coordinates.
3. Apply Open-now / a sort; hover a row; click a pin.
4. On a narrow window (<920px), toggle the mobile map/list views.
**Expected:** Pins = exactly the visible (filtered/sorted) locations that have coordinates; rows without coords stay in the list but get no pin. Pin click selects the card (floating card on map view). Filtering the list updates pins in sync.

### 13.9 Mobile map: pins are the results + "Search this area" [Mobile]
**Steps:**
1. Open the Search tab; let results load around the current anchor (header location / GPS).
2. Compare map pins to the drawer list (sorted closest-first).
3. Pan the map well beyond the re-anchor threshold; tap "Search this area".
4. Tap a pin.
**Expected:** Pins = loaded result locations with coordinates (pin.id = location id); panning alone never refetches. "Search this area" re-anchors the 20 km-radius query (capped at 300) without touching the saved header location. Pin tap shows the floating card from the loaded list (or a one-off detail fetch for out-of-area pins); re-tapping dismisses.

## Results → business detail

### 13.10 Card navigation uses location slug/id — never business UUID [Web]
**Steps:**
1. From search results, click a location card; check the URL.
2. Click a brand (business) card from the `businesses` group.
3. Manually open `/en/business/<business UUID>`.
4. Open `/en/business/<numeric location id>` for a valid public location.
**Expected:** Location cards link to `/{locale}/business/<location slug>`; brand cards use the slug or `primaryLocationId` fallback. All-digit param resolves as LOCATION id; both render the detail page. A business UUID resolves nothing → BusinessNotFound page (API 404 `Listing not found`).

## Visibility gating (cross-app)

### 13.11 Dashboard unpublish / non-public location removes from discovery [Dashboard] [Web] [Mobile]
**Steps:**
1. As owner, on dashboard `/marketplace`, unpublish the listing (`isListed=false`).
2. On web/mobile: search the name, check map pins, "Just joined"/latest rails, and the direct detail URL.
3. Re-publish; instead set one of the business's two locations non-public in Locations.
4. Re-check search/map.
**Expected:** Unpublish removes all the business's map points and it disappears from `GET /listings`, `POST /latest-listings`, `POST /nearby-locations`; direct detail URL 404s (`Listing not found`). With one location non-public, only that location's pin/card disappears — the sibling public location remains.

### 13.12 CRM "Block from Marketplace" excludes the business [CRM] [Web]
**Steps:**
1. In CRM, open the business → Marketplace tab → "Block from Marketplace" (`blockedByPlatform=true`).
2. On web, search the business; open its old detail URL.
3. Unblock and re-check.
**Expected:** Blocked business vanishes from search/map/rails and detail 404s ("Listing not found") even though the owner's `isListed` is still true; unblocking restores it (map points resync).

## Favorites

### 13.13 Add/remove favorite — auth gate, instant reflection, API errors [Web] [Mobile]
**Steps:**
1. Logged OUT on web: tap a heart on a home/search card.
2. Logged OUT on mobile listing screen: tap the header heart.
3. Log in; tap heart on mobile `/listing/[id]` → check the Favorites tab immediately.
4. Repeat POST `/marketplace/customer/favorite/business/:businessId` for the same business; then DELETE it twice.
**Expected:** Web shows the "Sign in to save" toast (no state change); mobile opens the auth sheet. Authenticated toggle is optimistic and the Favorites tab/saved page reflects instantly. Duplicate add → 400 "Business already in favorites"; unlisted business add → 400 "Business is not available on marketplace"; second delete → 404 "Favorite not found".

### 13.14 Favorites list filters + empty states [Mobile] [Web]
**Steps:**
1. Favorite one business, one location (POST `favorite/location/:locationId`), one professional (POST `favorite/professional/:professionalId`).
2. Open mobile Favorites tab (unified GET `/marketplace/customer/favorites`); switch the type chips (all / place / location / person).
3. Remove all favorites; view the tab again. On web open `/{locale}/saved` with no favorites.
4. On web `/saved`, remove an item and use Undo.
**Expected:** Each chip filters to its type, with a per-filter empty label when that type is empty; fully empty list shows the saved empty state on both apps. Web remove is instant with Undo restoring the row. Rows link to the entity's public LOCATION id/slug — never a listing id or business UUID.

### 13.15 Unlisted/hidden business is dropped from saved lists [Dashboard] [Web] [Mobile]
**Steps:**
1. Favorite a listed business as the customer.
2. Owner unpublishes the listing on dashboard `/marketplace` (or make its only location non-public).
3. Reload web `/saved` and the mobile Favorites tab.
4. Re-publish and re-check.
**Expected:** The favorite row is filtered out of GET `favorite/businesses` while inactive/unlisted/hidden/blocked or without any public location — but the DB row is kept, so it reappears when the business is visible again.

### 13.16 Professional "hide from marketplace" filters favorites only [Dashboard] [Mobile] [Web]
**Steps:**
1. Customer favorites a professional who is an orphaned `dashboard_user` (no active team_member role) → confirm they still appear in favorite professionals.
2. That user enables hide on dashboard `/my-profile` → Marketplace visibility (POST `/team-member-account/marketplace-visibility`).
3. Customer reloads favorites (web `/saved`, mobile Favorites tab).
4. User turns visibility back on; reload again.
**Expected:** Orphaned-but-visible professionals stay listed in favorites. Once `hiddenFromMarketplace=true` they are filtered from GET `favorite/professionals` (row kept in DB); they reappear after unhiding. Professionals attached to an active listing require `showTeamMembers=true` on the listing to surface.

## Recently visited / viewed

### 13.17 Mobile "Recently visited" home rail [Mobile]
**Steps:**
1. Open 3 different listings (`/listing/[id]`) and one team-member detail.
2. Return to the home tab; check the "Recently visited" section order.
3. Re-open the first listing; check order again.
4. Kill and relaunch the app.
**Expected:** Visits appear newest-first, deduped by kind+id, capped at 10; revisiting moves the entry to the front. List persists across restarts (AsyncStorage `recently-visited-storage`). History is on-device only.

### 13.18 Web "Recently viewed" rail hydrates via bulk endpoint and omits hidden [Web]
**Steps:**
1. Visit 2-3 business detail pages on web, then return to the home page.
2. Check the Recently viewed rail (localStorage trail → one GET `/marketplace/public/listings/bulk` call).
3. Unpublish one visited business from the dashboard; reload home.
**Expected:** Rail shows visited locations in visit order (max 10, one bulk request). Ids that are now unlisted/hidden/blocked/non-public are silently omitted from the bulk response — no broken card, no error.

## Home rails & limits

### 13.19 Mobile home rail sections [Mobile]
**Steps:**
1. Open the home tab with seeded data and location permission granted.
2. Verify sections: Recently visited, Discover, Editor's pick, Offers ("On Zavoia this month"), Brands, "Just joined", "Near you".
3. Tap a "Just joined" card and a "Near you" row.
**Expected:** "Just joined" = POST `/marketplace/public/latest-listings` (limit 10); "Near you" = POST `/marketplace/public/nearby-locations` (first 6 shown); Brands = GET `/marketplace/public/brands`. Cards navigate by `primaryLocationId`/location id to `/listing/[id]`. Note: Editor's pick and Offers currently render PLACEHOLDER data (no backend endpoint) — do not test their content against seeds.

### 13.20 Result-set caps and API pagination [Web] [Mobile]
**Steps:**
1. Call GET `/marketplace/public/listings?limit=2&offset=0`, then `offset=2` — compare pages and `total`.
2. Call with `limit=501` and `offset=-1`.
3. On web/mobile, run a broad search and scroll the whole list; watch the network panel.
**Expected:** API paginates via limit (1-500, default 50) / offset with a stable `total`; out-of-range values → 400 validation error. Web and mobile intentionally do NOT paginate: one request with limit 300 replaces the whole set (no infinite scroll, stale `offset` URL params stripped).

## SEO landing pages

### 13.21 City/industry landing pages: prerender, hreflang, cross-links, clean 404 [Web]
**Steps:**
1. Build the site; confirm every real `locale`×`city`×`industry` triple (`getAllLocaleCityIndustryTriples`) is statically generated, e.g. `/bucharest/barbers` (EN) and `/ro/bucuresti/frizerii` (RO).
2. Inspect `<head>` on both: title/description use the localized `category` templates; `canonical` + `alternates.languages` (en/ro/x-default) point to the matching localized slug pair.
3. Scroll to "Other cities" / "Other industries"; click one link from each list.
4. Request an unknown combo, e.g. `/bucharest/not-a-real-industry`.
5. Visit `/en/bucharest/barbers` directly.
**Expected:** Real triples render from static params; cross-links (`CategoryContent`) navigate within the same locale to the sibling city/industry page. Unknown combos hit `notFound()` (clean 404, not a 500) despite `dynamicParams=true`. `/en/...` 308-redirects to the bare path (proxy.ts) while `/ro/...` keeps its prefix.
