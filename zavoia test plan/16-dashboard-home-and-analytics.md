# 16. Dashboard Home & Analytics — Test Scenarios

**Covers:** [Dashboard]
**Preconditions:**
- Business with 2+ locations, each with `workingHours` + timezone set (e.g. Europe/Bucharest); optionally one location with `open247: true`. Seeded appointments at known prices/durations spread over today / this week / this month covering all 5 statuses (`pending`, `confirmed`, `completed`, `no_show`, `cancelled`).
- Owner account + active TEAM_MEMBER account assigned (user_x_location) to only ONE of the locations, with some appointments assigned to that member and some professional reviews (`professional_review`, `isVisible: true`) at that location.
- Visible business reviews (`business_review.isVisible: true`) with a known rating mix; a few past-due appointments still `pending`/`confirmed` (`ends_at < now`).

## Access & routing

### 16.1 Owner opens dashboard — redirect + full widget render [Dashboard]
**Steps:**
1. Log in as owner; open `/dashboard` (no locationId).
2. Confirm auto-redirect to `/dashboard/{firstLocationId}` (replace navigation).
3. Watch network: `GET /dashboard/{locationId}` fires once per location change.
4. Verify all 4 widgets render: Location+Capacity (full width), Appointment Breakdown (full width), Reviews (1 col), Needs Attention (2 col).
**Expected:** API returns 200 with `DASHBOARD.S01` and `data` containing `locationWidget`, `capacityUtilizationWidget`, `appointmentWidget`, `reviewWidget`, `needsAttentionWidget`. Skeleton shows while locations/dashboard load; no error state.

### 16.2 Per-location switching [Dashboard]
**Steps:**
1. On `/dashboard/{locA}`, note counts/revenue.
2. Use the LocationSelector (desktop: page header; mobile: app header) to pick location B.
3. Confirm URL changes to `/dashboard/{locB}` and a new `GET /dashboard/{locB}` fires.
4. Switch back; deep-link `/dashboard/{locA}` directly in a new tab.
**Expected:** Each location shows only its own appointments (API filters on `locationSnapshot ->> 'locationId'`), its own name/open badge/staff. Deep link renders location A without redirect.

### 16.3 No business context → 403 SYSTEM.E04; nonexistent location [Dashboard]
**Steps:**
1. Call `GET /dashboard/{locationId}` with a token whose user has no business (e.g. owner account that never completed business creation).
2. As a valid owner, call `GET /dashboard/999999` (nonexistent id).
3. As the owner, call `GET /dashboard/{otherBusinessLocationId}` (location of a different business).
**Expected:** Step 1 → 403 `SYSTEM.E04` (Forbidden). Step 2 → 200 with `locationWidget.name: 'Unknown Location'`, `isCurrentlyOpen: false`, zeroed widgets (no 404 defined). Step 3 must NOT return the foreign location's name/appointments/staff — the service looks up the location without a business filter, so any cross-tenant data returned is a security defect to file.

### 16.4 Role gate + expired-subscription read access [Dashboard]
**Steps:**
1. Call `GET /dashboard/{locationId}` with a marketplace CUSTOMER-only token.
2. On a business whose subscription is expired (past `trialEndsAt` / canceled beyond grace), load the dashboard.
**Expected:** Step 1 → 403 "You are not authorized to access this resource." (RolesGuard; route allows only OWNER + TEAM_MEMBER). Step 2: route is `@ReadOperation()` GET, so non-entitled businesses still get 200 (read-only mode) — dashboard data loads behind the subscription blocker UI.

## Location widget

### 16.5 Appointment counts and potential revenue vs seeded data [Dashboard]
**Steps:**
1. Seed for one location: today 3 appointments (1 confirmed 100 RON, 1 completed 50 RON, 1 cancelled 80 RON); more within this week and month.
2. Load the dashboard and compare `appointmentsToday/ThisWeek/ThisMonth` and `potentialRevenueToday/ThisWeek/ThisMonth`.
3. Cross-check ranges: today = server-local calendar day; week = Sunday–Saturday containing today; month = calendar month.
**Expected:** Counts include ALL statuses (cancelled counted: today = 3). Revenue EXCLUDES cancelled only (`pending`+`confirmed`+`completed`+`no_show` all sum): today = 150 RON. `price` is stored in minor units (cents) — UI formats via business currency (`businessCurrency`, fallback `eur`); 15000 renders as 150, not 15000.

### 16.6 isCurrentlyOpen derived in the location timezone [Dashboard]
**Steps:**
1. Set location workingHours for today (in location tz, e.g. Europe/Bucharest 09:00–17:00); set browser/OS timezone to something else (e.g. America/New_York).
2. Load dashboard inside the location's open window; then after `close` time in the location tz.
3. Set today's `isOpen: false` for the weekday; reload.
4. Clear the location timezone (keep business timezone set); reload.
**Expected:** "Open now" pill (pulsing green dot) only when current time in the LOCATION timezone is within `open`–`close` and `isOpen: true`; otherwise "Closed" (red). Browser tz is irrelevant. Timezone resolution falls back location → business → UTC.

### 16.7 open247 location [Dashboard]
**Steps:**
1. Mark a location `open247: true` (no matter the hour/day).
2. Load its dashboard at an hour outside any workingHours window.
**Expected:** `isCurrentlyOpen: true` always. Capacity denominators use 24h/day (week/month = full range hours), so filled % is lower than for a workingHours location with the same bookings.

### 16.8 Staff list on the location widget (owner only) [Dashboard]
**Steps:**
1. As owner, verify the Staff section lists active TEAM_MEMBER users assigned to this location (name, avatar, email/phone).
2. Click a staff row; click the invite button; click the assignments link.
3. Check a location with no assigned staff.
**Expected:** Only `userRole.status = 'active'` team members of this business+location appear (pending invites excluded). Row → `/calendar?staffEmail={email}`; invite → `/team-members?action=invite`; assignments → `/assignments?locationId={id}`. Team member users get `staff: null` (no list).

## Capacity utilization

### 16.9 Capacity percentages vs seeded calendar [Dashboard]
**Steps:**
1. Location open 8h today with 2 active staff; seed 4h of non-cancelled appointments today (plus one cancelled).
2. Load dashboard; check today/week/month gauges.
3. Recompute by hand: filled = min(100, round(bookedHours / (availableHours × staffCount) × 100)); booked excludes `cancelled`; available from `workingHours` (close − open per open weekday).
**Expected:** Today = round(4 / (8×2) × 100) = 25%. Week/month denominators sum open hours per day across the range. UI tiers: <25 "low" (warning), <50 "moderate" (info), <80 "healthy" (success), ≥80 "high" (error).

### 16.10 Capacity edge cases — zero capacity and >100% booked [Dashboard]
**Steps:**
1. Location with no `workingHours` (or all days `isOpen: false`); load dashboard.
2. Owner view of a location with zero active staff.
3. Seed booked hours exceeding capacity (e.g. 20h booked vs 8h × 1 staff).
**Expected:** Zero capacity (`totalCapacityHours <= 0`) → `{filledPercentage: 0, availablePercentage: 100}` — never NaN/negative. Overbooked → filled capped at 100, available 0.

## Appointment widget

### 16.11 Status distribution — today/week/month tabs [Dashboard]
**Steps:**
1. Seed a known status mix in each period (all 5 statuses).
2. On the Appointment Breakdown widget, flip tabs Today / Week / Month.
3. Compare each donut + legend against seeded counts per period.
**Expected:** Distribution buckets exactly `pending / confirmed / completed / no_show / cancelled` per period range. Period with zero appointments shows the empty placeholder donut. Week tab uses the Sunday-start week; month = calendar month.

### 16.12 Upcoming appointments list [Dashboard]
**Steps:**
1. Seed 7 future appointments: 5 pending/confirmed at different times, 1 completed, 1 cancelled; plus 1 pending in the past.
2. Load dashboard; inspect `appointmentWidget.upcoming` in the response and the widget list.
3. Click an upcoming row; click "see appointments".
**Expected:** API returns max 5, ascending by `scheduled_at`, only future (`scheduled_at > now`) `pending`/`confirmed` — completed/cancelled/past excluded. Widget renders the first 3; the soonest one also feeds the "next appointment" slot on the location widget. Row → `/calendar?appointmentUuid={uuid}`; link → `/calendar`. Guest bookings without customer names show the guest-customer label.

## Reviews widget

### 16.13 Owner — business-wide review stats [Dashboard]
**Steps:**
1. Seed visible business reviews, e.g. ratings [5,5,4,2]; plus one review with `isVisible: false`.
2. Load dashboard as owner; check gauge, total, distribution.
3. Click "see all".
**Expected:** Only visible reviews count: total 4, `averageRating` = 4.0 (rounded to 1 decimal), distribution as integer percentages ('5': 50, '4': 25, '2': 25). Stats are business-wide (NOT per selected location — same numbers on every location). Link → `/marketplace?tab=reviews`.

### 16.14 Team member — personal my-reviews variant [Dashboard]
**Steps:**
1. Log in as the team member; open their assigned location's dashboard.
2. Compare `reviewWidget` with seeded professional reviews for that user at that location (join on `appointment.locationSnapshot ->> 'locationId'`).
3. Add a visible professional review for the SAME user at another location, and a business review; reload.
4. Click "see all".
**Expected:** Widget shows only the member's own visible `professional_review`s tied to appointments at the selected location — business reviews and other-location professional reviews excluded. Link → `/my-profile?tab=reviews` (owner variant links to marketplace reviews).

## Team-member scoping

### 16.15 Team member data scoping — own appointments, assigned locations only [Dashboard]
**Steps:**
1. Seed location appointments split between the team member and another staff user.
2. Log in as the team member; open the dashboard and the LocationSelector.
3. Compare counts/revenue/distribution/upcoming/unresolved against only the member's own appointments (`staff_users` join on own userId).
4. Attempt deep link `/dashboard/{unassignedLocationId}`.
**Expected:** Selector lists ONLY assigned locations (`POST /locations/list` scopes by user_x_location for TEAM_MEMBER). All widget numbers cover only appointments where the member is assigned staff; capacity uses `staffCount = 1`; `staff` is null. Note: `GET /dashboard/:locationId` itself has no per-location assignment guard — verify the deep link's own-appointment filters still hide other data, and file a defect if unassigned-location metadata (name/open state) leaks.

## Needs attention

### 16.16 Unresolved past-due appointments — list + quick resolve [Dashboard]
**Steps:**
1. Seed 6 appointments with `ends_at < now` still `pending`/`confirmed` (one >48h old, one >7 days old); plus a past `completed` one.
2. Load dashboard; check the Needs Attention list and `needsAttentionWidget[0]`.
3. Hover a row (desktop) / expand (mobile); click "Completed" on one, "No-show" on another.
**Expected:** Item `type: 'unresolved_appointments'` with `count: 6` (completed/cancelled past ones excluded), sorted by `ends_at` DESC, max 4 rows inline (limit 500 in API). Staleness dot: warning >48h, error >168h. Quick action calls `PUT /appointments/{id}` with `{status: 'completed'|'no_show'}`, row animates out, dashboard refetches; failure → "update failed" toast.

### 16.17 See-all dialog — filters and bulk resolve [Dashboard]
**Steps:**
1. Open "See all" on the unresolved item.
2. Filter by customer/staff name search, service chip, and date preset (7d/30d/90d/custom); clear filters.
3. Select-all → "Mark no-show" (or Completed) → confirm.
4. Repeat with a mix where one appointment was already resolved elsewhere (force a partial failure).
**Expected:** Filters are client-side over the fetched list; empty result shows the no-results state. Bulk confirm calls `PUT /appointments/bulk-status` `{ids, status}`; successes toast the bulk-success count and disappear; per-id failures toast the failed count separately. Dashboard refetches after success.

### 16.18 Pending bookings + SMS-low rows; all-clear state [Dashboard]
**Steps:**
1. Seed pending appointments today/this week; ensure an unread `sms_credits_low` notification exists.
2. Load dashboard; check the Needs Attention items and their CTA links.
3. Resolve everything (no unresolved, no pending, notification read); reload.
**Expected:** "Pending bookings" row shows today.pending + week.pending with "Review" → `/calendar`; SMS row (error dot) → `/account`. With nothing outstanding, widget shows the all-clear check state. SMS check is cached ~60s (remounts don't refire the request).

## Empty states & time boundaries

### 16.19 Brand-new business — empty dashboard [Dashboard]
**Steps:**
1. Fresh business, wizard completed, location created, zero appointments/reviews/staff.
2. Load `/dashboard`.
3. Also try an owner with zero locations (delete/never create).
**Expected:** All counts/revenue 0; capacity 0% filled / 100% available; donut shows empty placeholder; upcoming shows "no upcoming"; reviews gauge shows the no-reviews label; needs-attention all-clear. Zero locations → "no locations" page message (no API call, no crash). Incomplete wizard → BusinessSetupGate points to `/welcome`.

### 16.20 Day boundaries — browser timezone differs from the location's [Dashboard]
**Steps:**
1. Location tz Europe/Bucharest; seed an appointment at 00:30 location time "tomorrow" and one at 23:30 location time today.
2. Load the dashboard from a browser set to America/New_York (UTC-7h vs location) around the boundary.
3. Compare `appointmentsToday`, the Today distribution tab, and upcoming-row time labels.
**Expected:** Today/week/month ranges are computed in API SERVER-local time (`getTodayRange` uses `new Date()`), NOT the location or browser tz — document which day each seeded appointment lands in for the server tz and verify counts match that. UI renders times via browser locale, so the same appointment may display a different wall-clock day than it was bucketed under; flag as a defect if server tz ≠ location tz causes "today" counts to visibly disagree with the location's calendar day.
