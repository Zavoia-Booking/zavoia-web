# 04. Calendar & Appointments (Dashboard) — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile] — dashboard `/calendar` is primary; Web/Mobile only as customer-side cross-checks
**Preconditions:**
- Business with OWNER account + 1 TEAM_MEMBER account; location with working hours set (e.g. Mon–Fri 09:00–18:00, not open 24/7), 2+ active services and a bundle assigned to staff at that location.
- At least one existing business customer (manually added) and one marketplace-linked customer.
- BookingSettings at defaults (`bufferTimeMinutes=15`, `autoConfirmBookings=true`) unless a scenario says otherwise.

Appointment status enum: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`. Booking sources selectable in the add slider: `admin`, `phone`, `walk_in` (marketplace bookings arrive as `marketplace`). Dashboard create uses `POST /appointments/admin-create-group`; edit uses `PUT /appointments/:id`; cancel uses `POST /appointments/:id/cancel`.

> **Change under test (2026-07-23): location-only booking removed.** Staff is now required on EVERY admin booking path — `admin-create` requires `staffUserIds` (min 1), `admin-create-group` requires `staffUserId` on every item, and `PUT /appointments/:id` rejects `staffUserIds: []`. There is no longer any branch that books "the location" when it has zero team members; such a location is intentionally unbookable (see 04.5). Legacy staff-less appointment rows created before this change must remain viewable and reschedulable (see 04.31). Deploy note: admin-api and admin-dashboard must ship together — an old dashboard bundle can still send staff-less payloads, which the new API 400s.

## Appointment creation

### 04.1 Create single-service appointment for existing client [Dashboard]
**Steps:**
1. Owner → `/calendar` → Add appointment (AddAppointmentSlider).
2. Pick existing customer via search picker.
3. Add one service item + staff member; pick a date and an offered slot (from `POST /calendar/available-slots`).
4. Leave booking source `admin`, add a note, save.
**Expected:** "Booking created successfully." Appointment card appears at the chosen slot with status `confirmed` (dashboard-created appointments are always confirmed). Reminder is scheduled and assigned staff (excluding the creator) get an `APPOINTMENT_ASSIGNED` "New appointment assigned" notification.

### 04.2 Create appointment for a brand-new walk-in client [Dashboard]
**Steps:**
1. Add appointment → customer picker → quick-create form (first name required; last name, email, phone optional).
2. Submit quick-create (POST `/business-customers/add-manually`), then finish booking with source `walk_in`.
**Expected:** Customer is created and auto-selected; appointment saves with a `customerSnapshot` holding the entered name/contact. New client appears in Customers list with this appointment in their history.

### 04.3 Multi-service appointment, same staff — composite row and totals [Dashboard]
**Steps:**
1. Add appointment with 2+ service items all assigned to the same staff member.
2. Save, then open the appointment detail.
**Expected:** ONE appointment row with `bookingType: composite`; `items[]` (bookingItemsSnapshot) carries per-item `type`, `serviceId`, `name`, `duration`, `price`, `startOffsetMinutes`. Total duration = sum of item durations (ends_at = start + sum); total price = sum of per-item prices, including any staff-specific price/duration overrides shown in the slider summary.

### 04.4 Multi-service appointment with staff change mid-run splits rows [Dashboard]
**Steps:**
1. Add appointment: item 1 → staff A, item 2 → staff B.
2. Save.
**Expected:** TWO independent appointment rows created back-to-back (item 2 starts exactly when item 1 ends), one per staff member, each with its own price/duration. Both staff receive `APPOINTMENT_ASSIGNED` notifications. Cancelling one row does not affect the other.

### 04.5 Location with no team members is NOT bookable (location-only booking removed) [Dashboard]
**Steps:**
1. Use a location that has services assigned but zero team members.
2. Add appointment at that location: add a service item; observe the staff picker and the date/time step.
3. Request `POST /calendar/available-slots` for that location on any date.
4. Force creates via API: `POST /appointments/admin-create-group` with an item missing `staffUserId`; `POST /appointments/admin-create` with `staffUserIds` omitted and again with `staffUserIds: []`.
**Expected:** The staff picker always renders (it is no longer hidden for staff-less locations) but offers no candidates, so the item never validates, slots are never fetched, date/time stays locked, and submit stays disabled. Step 3 returns no available slots. Step 4: missing per-item staff → 400 "Staff member is required for each item."; `admin-create` with `staffUserIds` omitted or `[]` → 400 validation "At least one staff member is required." No appointment row is created by any of these attempts — the old behavior (appointment saved with no staff, location-level 409 on overlap) must NOT occur.

### 04.6 Past time and minimum-advance validation [Dashboard]
**Steps:**
1. Attempt to create an appointment starting earlier than now (e.g. via prefilled slot left open past its time).
2. Set BookingSettings `enforceMinAdvanceForAdmin=true` with `minAdvanceBookingMinutes=60`; try booking 10 min from now.
**Expected:** Step 1 → 400 "Cannot create an appointment in the past." Step 2 → 400 "Appointment must be scheduled at least 60 minutes in advance." Date picker also disables past days (min date computed in location timezone), and `available-slots` filters today's slots by the min-advance window.

### 04.7 Booking outside business hours / spanning closing time — out-of-hours override [Dashboard]
**Steps:**
1. Try to book before opening time, then on a closed day (type the time manually / use an out-of-hours prefill).
2. Book a service whose duration crosses closing time (e.g. 90-min service at 17:30 when closing is 18:00).
3. Decline the override dialog once, then retry and confirm with a reason.
**Expected:** Without override, API rejects 400 with the exact hours reason: "Appointment starts before opening time (09:00).", "Location is closed on {day}.", or "Appointment ends after closing time (18:00).". Confirming resends with `allowOutOfHours: true`; appointment saves and stores `overrideReason` + `overrideUsedAt`.

### 04.8 Multi-item run spanning midnight is rejected [Dashboard]
**Steps:**
1. On a location open late (or 24/7), stack enough items that the run ends after 00:00 next day.
2. Save.
**Expected:** 400 "Appointment cannot span across midnight. Please end by 00:00 and create a separate appointment for the next day." Not bypassable with the out-of-hours override.

### 04.9 Staff not qualified for the service [Dashboard]
**Steps:**
1. Craft a create-group payload pairing a service with a staff member who is NOT assigned to that service at that location (UI normally filters; use API or a stale tab).
**Expected:** 400 "Selected staff cannot perform this service at this location." (bundle variant: "Selected staff cannot perform this bundle at this location."). No appointment created.

## Double-booking & conflicts

### 04.10 Double-booking same staff, overlapping time [Dashboard]
**Steps:**
1. Create appointment for staff A at 10:00–11:00.
2. Attempt a second appointment for staff A at 10:30.
3. Cancel the first appointment, then retry the 10:30 booking.
**Expected:** Step 2 rejected 409 "Staff member (ID: {id}) has a conflicting appointment." (conflictType `staff_appointment`). Step 3 succeeds — only `confirmed`/`pending` appointments count as conflicts; cancelled ones free the slot.

### 04.11 Buffer-time conflict [Dashboard]
**Steps:**
1. Set `bufferTimeMinutes=15` and book staff A at 10:00–11:00. The default is zero.
2. Attempt a booking for staff A starting exactly 11:00 (inside the buffer window).
**Expected:** Rejected as a conflict — availability adds the buffer to appointment ends (`ends_at + buffer > new start`). DnD preview shows the buffer toast (`page.dnd.staffBufferConflict` with minutes). Booking at 11:15 succeeds.

### 04.12 Override a block while protecting staff availability [Dashboard]
**Steps**

1. Select an available time in Edit, add a block over it in another session, then save the edit from list and grid views. Enter a reason and choose “Reschedule anyway”.
2. Repeat with another appointment for the same staff member already occupying the target time. Also check the buffer across two locations in the same business.
3. For a time that needs both working-hours and block overrides, enter a reason in the first prompt and continue with it through the second.

**Expected**

- A block can be overridden with `overrideConflicts: true`. The final update saves `overrideReason` and `overrideUsedAt`.
- A staff overlap returns 409 with `conflictType: staff_appointment`. The original booking stays in place.

## Edit, reschedule, cancel & statuses

### 04.13 Reschedule to another day via edit slider [Dashboard] [Mobile]
**Steps:**
1. Open an upcoming appointment (EditAppointmentSlider) → change date + time → save.
2. Check the original day and the target day in the calendar.
**Expected:** `PUT /appointments/:id` succeeds; card moves; `ends_at` recomputed from the appointment's duration. Customer gets a reschedule notification, assigned staff get `APPOINTMENT_RESCHEDULED` ("Your appointment was rescheduled"), business push event `appointment.rescheduled` fires. Working-hours + conflict checks re-run, excluding the appointment itself (rescheduling within its own slot never self-conflicts).

### 04.14 Drag & drop reschedule — confirm dialog and client-side rejections [Dashboard]
**Steps:**
1. In Day GRID view, drag an appointment to a new slot → confirm in the drop dialog.
2. Try dropping onto: a past slot, the Unassigned column, a slot overlapping a block, a slot conflicting with another appointment of that staff, a staff column whose member can't perform the item, and a slot where the duration would cross midnight.
**Expected:** Step 1 reschedules after confirmation. Each bad drop in step 2 is rejected client-side with the matching toast (past time / unassigned / block overlap / staff conflict / ineligible staff "{staffLabel}" / past midnight) and no API call.

### 04.15 Reassign staff on an existing appointment [Dashboard]
**Steps:**
1. Edit appointment → change staff from A to B (B qualified for the service) → save.
2. Send `PUT /appointments/:id` with `staffUserIds: []` (API call).
**Expected:** Step 1: appointment moves to B's column; B gets `APPOINTMENT_ASSIGNED`, A gets `APPOINTMENT_UNASSIGNED` ("Appointment removed from your schedule"); staffSnapshot rebuilt; availability re-checked for B. Step 2: 400 "At least one staff member is required. Use a non-empty list to reassign." — this now applies at EVERY location; the old carve-out that accepted `[]` at a location with no team members ("This location has no team members; do not assign staff.") is gone, so stripping staff off an appointment is impossible.

### 04.16 Change booked services and bundles on an existing appointment [Dashboard] [Web] [Mobile]

1. Edit an upcoming single-service appointment and replace its service with one of a different price and duration. Repeat by swapping one whole bundle for another.
2. Open an upcoming appointment containing service, bundle, service in that order. Replace the middle bundle and remove one service. Add a service with a staff or location override. Reopen the same appointment after Save. Repeat on a phone.
3. Exercise conversions between one service, one bundle and several items. Reopen the same appointment in the customer web and mobile views and check the revised selection used by Book again.
4. Extend the booking at its original start until it reaches the next appointment or closing time. Try saving again after the appointment has started. Keep a second copy of Edit open, change the booked items in the first copy and submit the stale edit.
5. Send the legacy scalar `serviceId` field on a bundle and a multi-item appointment via API. Try an empty `items` list, mixing `items` with `serviceId`, and selecting an offering disabled at the venue.

**Expected**

- The same appointment ID and status are retained. Retained items keep their booked prices, durations and bundle contents. New items use the effective booking values at that location. The final order, total price and end time agree across Edit, the calendar and customer details. The professional can perform the full revised selection. Other professionals' appointments in the visit are independent.
- Staff overlap is refused. Existing working-hours and block confirmations use the revised interval without bypassing the staff conflict check. A started appointment or stale edit is refused. The original row stays intact on failure.
- An items-only save updates the existing pending customer reminder without immediate customer delivery. An actual move uses the existing reschedule notice. Completing an eligible marketplace booking reports the revised items and total.
- Scalar requests on bundle and multi-item appointments and invalid item-list requests return 400 without a save. Time-only edits and drag-and-drop continue to use their existing fields and behavior.

### 04.17 Status transitions — confirm, complete, no-show [Dashboard]
**Steps:**
1. Take a `pending` appointment (create via marketplace with `autoConfirmBookings=false`) and confirm it from the dashboard.
2. On a confirmed appointment, use "Mark as complete".
3. On another, use "No show" (confirm dialog).
4. Repeat confirmation as the assigned team member and as a colleague. Leave a confirmation open across the appointment end or cancel it in a second session, rebook the slot, and submit the stale confirmation. Check the final status and customer messages.
**Expected:** pending→`confirmed`: confirmation notification sent, reminder scheduled, push `appointment.confirmed`. →`completed`: review-request notification sent, each assigned staff's visits-completed counter incremented. →`no_show`: status set, pending reminders cancelled (terminal status). Status badge updates in list/grid. The owner and assigned team member can confirm a pending booking before it ends. A colleague, an ended booking, or a stale confirmation against a cancelled booking cannot confirm.

### 04.18 Cancel appointment with reason + customer notification [Dashboard] [Web] [Mobile]
**Steps:**
1. Cancel an upcoming appointment from the edit slider: enter reason, leave "notify customer" ON.
2. As the (marketplace-linked) customer, open web `/{locale}/appointments` and the mobile Appointments tab.
**Expected:** Status → `cancelled` with `cancellationReason` stored; response echoes them. Customer receives cancellation notification; staff get `APPOINTMENT_CANCELLED`; push `appointment.cancelled` fires; reminders cancelled. Customer sees the appointment as cancelled on web and mobile. With notify OFF, no customer notification is sent (staff fan-out still fires).

### 04.19 Cancel guards & terminal-state UI [Dashboard]
**Steps:**
1. Cancel an already-cancelled appointment (via API replay).
2. Attempt to cancel an appointment whose end time has passed.
3. Open a cancelled/completed/no-show appointment in the edit slider.
**Expected:** Step 1 → 400 "Appointment is already cancelled." Step 2 → 400 "Cannot cancel an appointment that has already ended." (UI also hides cancel for ended bookings). Step 3: terminal state shown (cancelled banner with reason); reschedule hidden and status-action buttons disabled.

### 04.20 Concurrent edit from two tabs [Dashboard]
**Steps:**
1. Open the same appointment in two tabs.
2. Tab 1: reschedule to 14:00, save. Tab 2: reschedule to 15:00, save.
3. Repeat with one tab moving the booking and the other changing the service to one with a longer duration. Test both commit orders.
4. Refresh both tabs. Check that the detail header and the Visit date, time and duration match the stored booking and that the end time uses the saved service duration.
**Expected:** No optimistic locking, but each save re-runs conflict/hours validation against the current DB state. When the two PUTs race, one succeeds and the other may return **409** (it validates against the state the first write just created) — this is acceptable and preferable to a silent double-write. Whichever save is applied last wins; there is no crash and no duplicate rows. Both tabs converge on the persisted time after refetch. (Verified 2026-07-23: concurrent 14:00/14:30 PUTs returned 200 + 409, final state clean.)

### 04.21 Delete a service that has appointments [Dashboard]
**Steps:**
1. Book a future appointment for service X.
2. Services → attempt to delete service X.
**Expected:** Delete refused: `DELETE /services/:id` returns `canDelete: false` with message code `SERVICE.E08` plus `upcomingAppointmentsCount`, `locationsCount`, `teamMembersCount`, and `bundleNames`; service remains and existing appointments are unaffected.

### 04.22 Offboard a team member with upcoming appointments [Dashboard]
**Steps:**
1. Book future appointments for staff A.
2. Team → remove/offboard staff A → review offboard preview (`GET /team/:id/offboard-preview`).
3. Reassign appointments to an eligible staff member and complete offboarding.
**Expected:** Preview lists A's upcoming appointments and, per service+location pair, only staff who `canPerform` as reassignment candidates (decision per appointment: reassign or cancel). After completion, appointments show the new staff member; none are orphaned. Reassignment here bypasses the normal update-appointment notification fan-out — the new assignee is NOT notified.

## Calendar blocks & time off

### 04.23 Staff time-off block removes availability [Dashboard]
**Steps:**
1. Calendar → create block (CreateBlockDrawer): scope Staff, staff A, reason `vacation`, tomorrow 09:00–13:00.
2. Check available slots for staff A tomorrow; attempt to book staff A at 10:00.
**Expected:** Block card renders in A's column; `available-slots` no longer returns morning slots for A. Booking attempt → 409 "Staff member (ID: {id}) is blocked: vacation" (conflictType `block`); other staff remain bookable.

### 04.24 Location-wide and recurring blocks [Dashboard]
**Steps:**
1. Owner creates a Location-scope block; verify no one at that location is bookable during it.
2. Owner re-creates with "apply to all locations" → saved as BUSINESS scope; verify a second location is also blocked ("Business is blocked: …").
3. Create a recurring weekly block (e.g. every Monday 12:00–13:00, lunch_break) and check next week's Monday.
**Expected:** Location block conflicts all bookings there ("Location is blocked: …"); business block conflicts across every location; recurring block reappears on each matching weekday and blocks those slots. Weekly/biweekly recurrence without `repeatDaysOfWeek` is rejected: "repeatDaysOfWeek is required for weekly and biweekly recurring blocks."

### 04.25 Block created over an existing appointment [Dashboard]
**Steps:**
1. Staff A has a confirmed appointment 10:00–11:00.
2. Create a staff block for A covering 09:00–12:00.
**Expected**

- The first save returns 409 with the affected appointment count and the first appointment. Confirm the override to save the block.
- The existing appointment stays in place and new bookings in the blocked window are rejected. A block whose end is at or before its start is rejected.

### 04.26 Team-member block permissions [Dashboard]
**Steps:**
1. As team member, try to create a Location-scope block.
2. With BookingSettings `allowStaffBlockCalendarWithoutConfirmation=false`, create a personal block.
3. Enable the setting but keep `staffBlockCalendarTypes` at default `holidays,timeOff,sickDays`; try reason `meeting`, then reason `vacation`.
**Expected:** Step 1 → 403 "Team members can only create staff-scoped (personal) blocks." (blocks for another user → "You can only create blocks for yourself."). Step 2 → 403 "Calendar blocking without approval is not allowed for your role." Step 3: `meeting` → 400 "This block reason is not allowed by your business settings."; `vacation` (maps from `timeOff`) succeeds. Team member can edit/delete only their own staff blocks.

## Roles, views & timezone

### 04.28 Team-member scoping and edit/cancel permission flags [Dashboard]

1. As a team member without access to location L, request L's calendar day data and try creating an appointment at L via API.
2. With `allowStaffRescheduleWithoutConfirmation=false`, try to reschedule or change the booked items on your own appointment. Turn it on and replace a service, swap a whole bundle, and edit a multi-item appointment assigned to you. Try a colleague's appointment and a combined items edit plus reassignment to the colleague. Also try changing the location via API.
3. With `allowStaffCancelWithoutConfirmation=false`, try to cancel.
4. Check the owner's bell after a same-time bundle swap, then change the time and multiple booked items in one save. Open both entries with the calendar on a different location. Check English and Romanian with the device in a different timezone from the venue.
5. At a venue with a three-professional booking, an unassigned appointment, and a day booked only with a colleague, compare the owner and member calendars in grid and list views. Open the member's own appointment, then follow a saved link to a booking the owner reassigned to someone else.

**Expected**

- Step 1 returns 403 for read and create. At an assigned location, Day, Week, Month, and the mini calendar show only appointments assigned to the signed-in member, including their part of a split booking. An unassigned booking or a colleague's separate appointment contributes no card, count, or preview. Opening a saved link after the appointment has been reassigned must not reveal its details. The owner sees all appointments, including unassigned ones, at every business location.
- With the reschedule setting off, the team member cannot change time or contents. With it on, the member can change the items of their own upcoming appointment when they can perform every item in the revised selection. Colleagues' appointments and reassignment to someone else are refused. Location changes remain owner-only. Step 3 returns 403.
- A genuine content edit creates one `APPOINTMENT_SERVICE_CHANGED_BY_TEAM_MEMBER` entry. Time plus contents creates that entry and `APPOINTMENT_RESCHEDULED_BY_TEAM_MEMBER`. Each opens the same appointment. Notes-only saves, unchanged selections and owner edits produce no team-member service-change entry.

### 04.29 Day / week / month views render correctly [Dashboard]
**Steps:**
1. Seed a day with appointments for 2 staff + 1 unassigned + a block.
2. Switch Month → Week → Day; toggle LIST vs GRID view types; resize to mobile width.
**Expected:** Month shows per-day indicators (appointment/block counts, closed days). Week grid shows all 7 days with cards at correct times; day GRID shows one column per staff plus Unassigned, overlapping cards side-by-side, block cards styled per reason. LIST views show the same data as rows; mobile layout (MobileViewRouter) renders day timeline/month grid without horizontal breakage. Staff/service/status/client filters narrow all views consistently.

### 04.30 Timezone correctness — business timezone vs browser timezone [Dashboard]
**Steps:**
1. Set location timezone to Europe/Bucharest; create an appointment at 10:00.
2. Change OS/browser timezone to e.g. America/New_York, reload `/calendar` (day and week views), and open the appointment detail.
3. Repeat with a device ahead of the venue and on a different calendar date. Compare the first day request, heading and rows. Pick a day and verify the saved wall date.
4. Leave the calendar open across venue midnight, then reopen the block form. Check Today in the start, end and repeat-until pickers.
5. Drag on a day when venue midnight differs from device midnight. Repeat across the spring and autumn clock changes.
**Expected:** Appointment still renders at 10:00 wall-clock — all calendar rendering, slot generation, day boundaries, and date pickers use the location timezone (resolved as location.timezone falling back to business timezone), never the browser's. The stored instant is unchanged; the day/summary buckets match the location's calendar day.

## Location-only booking removal — regression on existing flows

### 04.31 Legacy staff-less appointments still render and reschedule [Dashboard]
**Preconditions:** at least one appointment row created BEFORE 2026-07-23 with no assigned staff (empty `staffSnapshot`, no `appointment_staff_users` rows) — seed one directly in the DB if staging has none left.
**Steps:**
1. Open the day containing the legacy staff-less appointment in Day GRID and LIST views (also Week and Month).
2. Reschedule it via the edit slider — change only date/time, leave staff untouched — and save.
3. In Day GRID, drag it from the Unassigned column onto a qualified staff member's column and confirm; separately, try dropping any appointment onto the Unassigned column.
4. Edit it and assign a staff member via the edit slider.
**Expected:** The row renders in the Unassigned column with no crash and correct filtering (staff filters exclude it; "unassigned only" style filters still find it). Step 2 succeeds — with an empty staff list the conflict check degrades to business/location block validation only (no staff-conflict false positive, no 500, no resurrected location-level 409). Step 3: the drop onto a staff column sends `staffUserIds: [staffId]` and reassigns normally; any drop onto Unassigned is still rejected client-side with the "unassigned" toast (no API call) — DnD can never produce a staff-less payload. Step 4 assigns normally (staffSnapshot rebuilt, `APPOINTMENT_ASSIGNED` fires). Per 04.15, staff can never be stripped back off, so the row leaves the staff-less state permanently once reassigned.

### 04.32 Staffed-location flows are unaffected by the removal [Dashboard]
**Steps:**
1. At the normal precondition location (with team members), re-run the core happy paths as a smoke pass: 04.1 (single create), 04.3/04.4 (multi-item runs), 04.10 (staff conflict 409), 04.13 (reschedule), 04.23 (staff block).
2. While doing so, watch the network tab on create: every `admin-create-group` item must carry a `staffUserId`.
**Expected:** All referenced scenarios behave exactly as specified — the staff-requirement change must not alter behavior where staff already existed. Slot generation (`/calendar/available-slots`), conflict checks, notifications, and DnD are unchanged for staffed locations; no payload is ever sent without staff.
