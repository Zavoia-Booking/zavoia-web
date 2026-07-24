# 10. Reviews & Ratings — Test Scenarios

> **QA 2026-07-24 (API, fixtures +50/+51):** 10.1/10.3–10.6/10.8/10.9/10.11–10.15/10.18/10.19 all PASS — full review lifecycle live (completed-future status-wins ✓, one-per-appointment ✓, aggregates recompute ✓, platform-review slots for +50/+51 now permanently burned as `pending`). averageRating arrives as a NUMBER on listing detail but still a numeric STRING in the favorites payload. Owner-as-staff is NOT exposed via public team-member endpoints (404 — needs team_member role). Dashboard reviewWidget counts business reviews only; /review/stats overall combines professional. CRM/mobile scenarios still blocked.

> Verified on staging 2026-07-23 (10.1–10.15, 10.18–10.19 incl. the full web review modal end-to-end; CRM 10.16/10.17/10.20 need CRM creds; mobile + push delivery unverifiable headless).
> Fixed in zavoia-web the same day, retest after deploy: the appointment detail rail now treats `status === "completed"` as past regardless of slot time — a completed-but-future appointment shows "Leave a review"/"Book again" and never Reschedule/Cancel (previously the rail was purely time-gated via `deriveTense`).
> Notes: public listing `averageRating` now arrives as a number (the old numeric-string crash no longer reproduces — keep the `Number()` coercion as belt-and-braces). Submit body is `{appointmentUuid, locationRating?, locationComment?, professionalRatings?: [{professionalId, rating, comment?}]}`; customer cancel body is `{uuid}`.

**Covers:** [Dashboard] [Web] [Mobile] [CRM] — platform-review group is [API]-level (no UI built in any app yet)
**Preconditions:**
- Seeded business with a public location, ≥2 team members, and a marketplace customer holding one COMPLETED, one CANCELLED, and one upcoming (CONFIRMED) appointment at that location; no reviews yet.
- CRM super-admin login; API client (Postman/curl) with valid customer JWT and dashboard (owner / team_member / dashboard_user) JWTs.
- Mobile app logged in as the same customer, push permissions granted.

## Submitting business reviews (customer)

### 10.1 Leave business + professional review after completed appointment [Web]
**Steps:**
1. Log in as customer, open `/{locale}/appointments/{uuid}` of the COMPLETED appointment.
2. Verify the accent "Leave a review" rail button (star icon) is shown.
3. Click it → review modal opens ("How was it?") with a business block ("Rate {business}") plus one block per staff member on the appointment.
4. Set integer 1–5 stars on the business block and one professional block; add comments (≤2000 chars).
5. Submit.
**Expected:** POST `/marketplace/customer/reviews` returns `{ success: true }`; star toast shown; modal closes. Detail page re-fetches: CTA replaced by submitted review card(s); `reviews.canLeaveBusinessReview` now false.

### 10.2 Review request notification deep-links into review drawer [Mobile]
**Steps:**
1. As owner in Dashboard, mark the customer's appointment COMPLETED (calendar/appointment status change).
2. On the customer's phone, verify push "Leave a Review" (`pushType: review_request`) arrives; email "review request" also sent.
3. Tap the push → app opens `app/appointment/[id]` with `review=1` → review drawer auto-opens.
4. Rate venue + professional, submit.
**Expected:** Notification sent only once on transition to `completed` (API `appointment.controller.ts` guards `previousStatus !== COMPLETED`); deep link `zavoia://review/{uuid}`; submission succeeds and CTA disappears from list + detail after refetch.

### 10.3 No review CTA for cancelled / no-show / upcoming appointments [Web] [Mobile]
**Steps:**
1. Open the CANCELLED appointment detail on web and mobile.
2. Open the upcoming CONFIRMED appointment detail.
3. Inspect actions rail / drawer entry points.
**Expected:** "Leave a review" is absent in all cases — API detail payload sets `reviews.canLeaveBusinessReview` and `professionals[].canLeaveReview` true only when `status === 'completed'` and no review exists. Same for `no_show`. Conversely, a COMPLETED appointment shows the CTA even if its slot time is still in the future (status wins over time — post 2026-07-23 web fix).

### 10.4 One review per appointment — resubmission blocked [Web] [Mobile]
**Steps:**
1. After 10.1, re-POST `/marketplace/customer/reviews` for the same `appointmentUuid` with any rating (direct API call).
2. On web/mobile, confirm the CTA no longer renders for that appointment.
**Expected:** API 400 `"A review for this appointment already exists"` — the whole appointment locks once ANY review (location or professional) exists. UI never shows the CTA again.

### 10.5 Business-only or professionals-only submission [Web]
**Steps:**
1. On a fresh COMPLETED appointment, open the review modal.
2. Rate ONLY the professional block (leave business stars at 0) and submit.
3. On another fresh COMPLETED appointment, rate ONLY the business block and submit.
**Expected:** Both accepted — each target is optional, at least one required. Submit button stays disabled until ≥1 rendered target has rating > 0. Only the rated rows are created (professional_review vs business_review).

### 10.6 API validation of malformed submissions [Web]
**Steps:**
1. POST `/marketplace/customer/reviews` with `appointmentUuid` only (no ratings).
2. POST with `professionalRatings: [{ professionalId: <staff not on this appointment>, rating: 5 }]`.
3. POST with an `appointmentUuid` belonging to another customer.
4. POST with `rating: 6` or `rating: 0`.
**Expected:** (1) 400 `"Provide a location rating, at least one professional rating, or both"`. (2) 400 `"Professional {id} did not serve this appointment"`. (3) 404 `"Appointment not found"` (lookup scoped to owner). (4) 400 class-validator error (`@Min(1)`/`@Max(5)`).

### 10.7 "Edit" entry point on an already-reviewed appointment [Web]
**Steps:**
1. Open the appointment detail from 10.1 — submitted review card shows an edit affordance (`onEdit` → review modal, pre-filled stars/comment).
2. Change the rating and submit.
**Expected:** Per current code the same POST is sent and the API rejects it: 400 `"A review for this appointment already exists"` → modal shows its inline error text and stays open. If it saves instead, an update endpoint exists that this plan must be corrected for (see open questions).

## Public display & aggregates

### 10.8 New review appears on web business page [Web]
**Steps:**
1. Open `/{locale}/business/{slug}` for the reviewed location; go to the Reviews tab.
2. Locate the reviews from 10.1 in the merged feed (GET `/marketplace/public/listing/{locationId}/reviews`, newest first).
3. Check reviewer identity and the team-member badge on the professional review entry.
**Expected:** Both location and team-member reviews appear in one feed; customer shown as first name + last-name initial ("Maria P."); comment text intact; "Load more" pages by offset/limit against `pagination.total`.

### 10.9 averageRating numeric-string renders without crash [Web] [Mobile]
**Steps:**
1. Confirm via API that listing `averageRating` arrives as a numeric string (e.g. `"4.5"`) despite `number` typings.
2. Load the business page header rating chip and the Reviews-tab summary (`(stats.averageRating ?? 0).toFixed(1)` + star row + distribution bars).
3. On mobile, open `app/listing/[id]` header rating and Reviews tab.
**Expected:** "4.5" renders (one decimal), stars fill correctly, no client exception. `Rating` component calls `rating.toFixed(1)` — a string here throws, so any crash/blank section is a bug. Mobile types warn "aggregates can arrive as strings — Number()-coerce before toFixed()".

### 10.10 Mobile listing Reviews tab [Mobile]
**Steps:**
1. Open the listing (`app/listing/[id]`), switch to the Reviews tab (tab shows `reviewStats.totalCount` badge).
2. Scroll/paginate the feed; verify the professional review carries the staff name.
3. Check team-member cards in the Team tab show `averageRating`/`totalReviews`.
**Expected:** Same merged feed as web (visible reviews only); counts match `reviewStats.totalCount`; zero-review listing shows no rating (rating hidden when `totalCount === 0`).

### 10.11 Aggregates recompute after each submission [Web] [Mobile] [Dashboard]
**Steps:**
1. Note current `averageRating`/`totalReviews` for location, business, and professional.
2. Submit a new review with a different rating (e.g. 2★) from a second customer's completed appointment.
3. Re-fetch listing detail and dashboard `/review/stats`.
**Expected:** `recalculateLocationRating` / `recalculateProfessionalRating` / `recalculateBusinessRating` run on submit — averages = ROUND(avg, 1) over VISIBLE reviews only, counts +1 everywhere (web card rails, listing header, dashboard hero).

### 10.12 Team-member review feed on profile surfaces [Web] [Mobile]
**Steps:**
1. Open the team member's profile from the business page (web) / `app/professional/[id]` or team-member-detail (mobile).
2. Verify their reviews list (GET `/marketplace/public/team-member/{id}/reviews`) and rating summary.
3. Try the endpoint with a customer's user id instead of a team member's.
**Expected:** Only that professional's visible reviews; 404 `"Team member not found"` for non-team-member ids (must hold `team_member` role, active).

## Business dashboard (owner / team member)

### 10.13 Owner Reviews tab — stats hero and breakdowns [Dashboard]
**Steps:**
1. Log in as owner, open `/marketplace?tab=reviews`.
2. Verify hero: overall average (business + professional reviews combined) and total count.
3. Check per-location cards and the team-member list with each member's own average/count and the 5→1 rating distribution bars.
**Expected:** Matches GET `/review/stats` (message `REVIEW.S02`): `overall`, `business`, `locations[]`, `teamMembers[]`; averages rounded to 1 decimal; a business with zero reviews shows the first-review/empty state, `averageRating: null` never renders as "NaN".

### 10.14 Reviews list filters and sorting [Dashboard]
**Steps:**
1. In the reviews list, switch between business-review and team-member-review sub-tabs.
2. Apply star filter (e.g. 5★), location filter, a date range, and "with comments only" from the filters sheet.
3. Sort by rating ASC/DESC and by date.
4. Filter team-member reviews by one member.
**Expected:** GET `/review/business-reviews` / `/review/team-member-reviews` re-query with `rating`, `locationId`, `startDate`, `endDate`, `withCommentsOnly`, `sortBy`, `sortOrder`; rating sort ties break by newest first; customer names come back privacy-trimmed ("Ana B."). Filtering with a `teamMemberId` of another business (API call) → 404 `REVIEW.E03`.

### 10.15 Team member "My Reviews" and role boundaries [Dashboard]
**Steps:**
1. Log in as a team member, open `/my-profile` → My Reviews tab.
2. Verify only reviews where they are the professional appear, with their own stats (GET `/review/my-reviews`, `/review/my-stats`).
3. As owner, call `/review/my-reviews` directly; as team member, call `/review/business-reviews`.
**Expected:** (2) list + distribution scoped to the logged-in professional, hidden reviews excluded. (3) owner on `my-reviews` → 403 (roles: TEAM_MEMBER, DASHBOARD_USER only); team member on `business-reviews` → allowed (roles include TEAM_MEMBER). All `/review/*` routes also sit behind SubscriptionGuard.

## CRM moderation of business reviews

### 10.16 Hide a location review — disappears everywhere, aggregates recalc [CRM] [Web] [Mobile] [Dashboard]
**Steps:**
1. In CRM open `/business/{id}` → "Business Review" tab; find the review (status chip Visible).
2. Toggle visibility off (row toggle or the drawer's Visibility switch) → PATCH `/admin-crm/location-review/{id}/visibility` `{ isVisible: false }`.
3. Re-load web business page Reviews tab, mobile listing Reviews tab, and dashboard reviews list/stats.
**Expected:** Review gone from all public feeds and dashboard lists (all query `isVisible = true`); location + business `averageRating`/`totalReviews` recomputed without it. CRM list still shows the row flagged "Hidden".

### 10.17 Hide/unhide a team-member review [CRM] [Web] [Dashboard]
**Steps:**
1. CRM `/business/{id}` → "Employee Review" tab; toggle a professional review hidden → PATCH `/admin-crm/team-member-review/{id}/visibility`.
2. Verify the professional's rating/count updates on web profile, dashboard stats, and team member's My Reviews.
3. Toggle it back on.
**Expected:** Hide removes it from every surface and recalculates the professional's aggregate (cascading to location/business); unhide restores the review and prior aggregates. CRM lists include hidden rows so they can be restored.

## Platform reviews (reviews of Zavoia itself)

### 10.18 Create platform review → pending, visible to author only [API]
**Steps:**
1. As customer: POST `/marketplace/platform-review` `{ rating: 5, comment: "..." }`.
2. GET `/marketplace/platform-review/me`.
3. GET `/platform-review/public` (unauthenticated).
4. As owner with an EXPIRED subscription: POST `/platform-review`.
**Expected:** (1) 201 `PLATFORM_REVIEW.S01`, `data.status: "pending"`. (2) `PLATFORM_REVIEW.S02` with own review any-status. (3) pending review NOT in the public list (approved only). (4) succeeds — `/platform-review` deliberately has no SubscriptionGuard; allowed roles OWNER/TEAM_MEMBER/DASHBOARD_USER.

### 10.19 One platform review per account — duplicate rejected across surfaces [API]
**Steps:**
1. Re-POST `/marketplace/platform-review` from the same customer.
2. Take a user who already reviewed via dashboard POST `/platform-review`; call the marketplace twin with the same account.
**Expected:** Both → 409 `PLATFORM_REVIEW.E01` ("already left a platform review") — same table + unique index on userId, race-safe; a dashboard review consumes the marketplace slot and vice versa.

### 10.20 CRM moderation: approve / reject / delete platform reviews [CRM] [API]
**Steps:**
1. POST `/admin-crm/platform-review/list` — pending review appears with author info; filter by `status`, `rating`, `authorRole`.
2. PATCH `/admin-crm/platform-review/{id}/status` `{ status: "approved" }` → GET `/platform-review/public`.
3. PATCH back to `"rejected"` → re-check public list; author's `/me` still returns the review with its status.
4. DELETE `/admin-crm/platform-review/{id}`, then have the author submit again.
**Expected:** (2) review appears publicly with `authorName` as "First L." (never full identity). (3) removed from public list; author cannot submit a new one while the rejected row exists. (4) delete frees the one-review slot — a fresh submission now succeeds (code comments recommend reject over delete to keep the slot burned). Unknown id → 404 `"Platform review not found"`.
