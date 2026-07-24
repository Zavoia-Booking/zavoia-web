# 05. Customer Booking Flow — Test Scenarios

**Covers:** [Web] [Mobile] [Dashboard]
**Preconditions:**
- Business with an active marketplace listing (`allowOnlineBooking` on), ≥2 services, ≥2 active staff assigned to them; dashboard owner login for cross-checks.
- Marketplace customer account logged in on web and mobile; a second customer account for conflict tests.
- Business BookingSettings known: `autoConfirmBookings`, `minAdvanceBookingMinutes`, `cancellationWindowMinutes`, `rescheduleWindowMinutes`, `allowCustomerCancellation`, `allowCustomerReschedule` (all business-wide settings, surfaced on the appointment's `location` object in API responses).

> **Change under test (2026-07-24): per-staff weekly schedules removed.** The `staff_schedule` concept was deleted from admin-api — it was never writable from any shipped UI, so every schedule check was already a no-op (prod table always empty). Customer-side availability is bounded ONLY by: location working hours (or 24/7), calendar blocks (business/location/staff scope), buffer time, existing appointments, and advance-booking limits. `MARKETPLACE_BOOKING.E15` ("staff not scheduled") is dead — no endpoint emits it anymore; per-staff constraints are exercised via STAFF-scope calendar blocks instead (05.7, 05.27).

## Booking drawer — web

### 05.1 Book from business detail, no preselected service [Web]
**Steps:**
1. Open `/{locale}/business/[slug]`, click the page-level "Book" CTA without selecting a service.
2. Drawer opens on Step 1 (choose services) rendered from the listing catalog; pick 1 service, Continue.
3. Step 2: pick date (calendar via `POST /marketplace/public/booking/calendar`), time slot (`POST /marketplace/public/booking/slots`), staff.
4. Step 3 Review: verify service names, total price/duration from the selected slot, cancellation/reschedule policy line.
5. Confirm.
**Expected:** `POST /marketplace/appointments/book` returns `MARKETPLACE_BOOKING.S01`; in-drawer success panel with "view appointment" link to `/{locale}/appointments/{uuid}`; status `confirmed` when `autoConfirmBookings` is on.

### 05.2 Book with a preselected service — drawer skips services step [Web]
**Steps:**
1. On `/{locale}/business/[slug]`, select a specific service in the on-page menu, then Book.
2. Observe drawer opens directly on the combined Date+Time+Staff step (Step 1 unreachable this session).
3. Press Back from the Review step.
**Expected:** No services step shown; Back from Review returns to Date+Time+Staff, where the back button is hidden (no Step 1 this session). Booking completes as in 05.1 with the preselected service.

### 05.3 Guest booking attempt — sign-in gate at confirm, flow resumes [Web]
**Steps:**
1. Signed out, open a business page and walk the drawer to Step 3 (calendar + slots load — public endpoints, no auth).
2. Confirm button shows the sign-in variant (`signInToBook`); click it.
3. Drawer hides (`closeForAuth`), auth modal opens; sign in.
**Expected:** After auth status flips to authenticated the drawer auto-reopens with the same in-progress state (date/slot/staff intact); Confirm now books normally. A plain dismiss (X) must NOT auto-reopen after a later login.

### 05.4 Staff selection including "any staff" default [Web] [Mobile]
**Steps:**
1. In the slot/staff step, pick a slot without touching the staff picker (web) / leave "Any available" (mobile StaffPicker).
2. Book; note assigned staff on the appointment detail.
3. Repeat, this time explicitly picking a specific staff member.
**Expected:** With no pick, staffId resolves to the slot item's `defaultStaffId` (else first of `availableStaffIds`) — a concrete staff is always sent. With an explicit pick, that exact staff appears on the appointment and in the dashboard calendar.

## Slot integrity & conflicts

### 05.5 Slot taken mid-flow — conflict at confirm, no double-book [Web]
**Steps:**
1. Customer A walks to Step 3 for slot X but does not confirm.
2. Customer B books slot X (same staff) and succeeds.
3. Customer A clicks Confirm.
**Expected:** 400 `MARKETPLACE_BOOKING.E10` (slot conflict); drawer shows the conflict message, returns to Step 2 and refetches slots (X gone); exactly one appointment exists in the dashboard calendar.

### 05.6 Advance-booking limits enforced at confirm [Web]
**Steps:**
1. Load slots, keep drawer open on Step 3.
2. In dashboard booking settings, raise `minAdvanceBookingMinutes` so the held slot is now too soon (or lower `maxAdvanceBookingMinutes` for the too-far case).
3. Confirm in the drawer.
**Expected:** `MARKETPLACE_BOOKING.E08` (too soon) / `MARKETPLACE_BOOKING.E09` (too far); user sent back to Step 2 with refreshed calendar/slots reflecting the new limits.

### 05.7 Slot list respects calendar blocks as the only per-staff constraint [Web] [Mobile] [Dashboard]
**Steps:**
1. In dashboard, on a location open 09:00–18:00, create a STAFF-scope calendar block for staff S covering 12:00–18:00 (S is now effectively free only 09:00–12:00 — per-staff weekly schedules no longer exist, blocks are the only way to constrain one person); add a second block (any scope) 10:00–11:00.
2. On web and mobile, load day slots for a service offered only by S.
3. Attempt to confirm a slot fetched BEFORE the second block was added (keep a stale drawer open, add block, confirm).
**Expected:** Slot list offers only 09:00–12:00 minus the blocked hour; nothing inside either block. Stale confirm fails with `MARKETPLACE_BOOKING.E14` (calendar block) and slots refresh. `MARKETPLACE_BOOKING.E15` must never appear (removed 2026-07-24 — the API cannot emit it).

### 05.8 Double-submit protection (idempotency key) [Web] [Mobile]
**Steps:**
1. Reach the confirm step, rapidly double-tap/click Confirm (throttle network to widen the window).
**Expected:** Exactly one appointment created — the retry with the same `idempotency-key` header returns the cached result (response still carries `MARKETPLACE_BOOKING.S01`; the server never emits the distinct `S02` code); dashboard calendar shows a single booking. Web mints a new key on slot/staff change; mobile's key persists until a failed submit.

### 05.9 Pending booking when auto-confirm is off [Web] [Mobile] [Dashboard]
**Steps:**
1. In dashboard, disable `autoConfirmBookings` for the business.
2. Book from web; book from mobile.
**Expected:** Appointments created with status `pending`; web success panel and mobile `/booking-success` both render the pending variant (not confirmed); dashboard shows the appointment as pending awaiting business confirmation.

## Mobile booking

### 05.10 Book from listing detail as logged-in customer [Mobile]
**Steps:**
1. Open `app/listing/[id]`, select a service — the floating `BookingBar` appears; tap its Book CTA (pushes straight to `app/booking`, no drawer).
2. `app/booking` screen: Step 1 Date → Step 2 Time → Step 3 Staff (single scroll), then confirm.
3. Land on `/booking-success`.
4. Tap "Add to calendar", then the CTA to view appointments.
**Expected:** Success screen lists each booked service with per-appointment time/price/duration in the venue timezone, total price/duration, cancellation policy; device calendar event created; CTA replaces route to `/(tabs)/appointments` where the booking is in Upcoming.

### 05.11 Guest booking attempt on mobile [Mobile]
**Steps:**
1. Signed out, browse a listing and walk `app/booking` to a fully selected date/slot/staff.
2. Tap confirm.
**Expected:** Auth gate triggers before booking (login sheet); selections persist in the in-memory booking store through the auth detour; after sign-in, confirming completes the same booking without re-picking.

### 05.12 Mobile conflict banner on stale slot [Mobile]
**Steps:**
1. Reach confirm on mobile for slot X; book X from another account.
2. Confirm on mobile.
**Expected:** No navigation to success; conflict banner appears above the slots list (booking store `conflictBanner`) for `E10`/`E14`, and also for `E08`/`E09` (same banner, different message text); refreshed slot list no longer offers X. (Clients may still map `E15`, but the API no longer emits it — it must never be observed.)

## Appointment lists & detail

### 05.13 Upcoming vs past lists and filters [Web] [Mobile]
**Steps:**
1. Seed: 1 upcoming, 1 completed, 1 cancelled, 1 no-show appointment for the customer.
2. Web: open `/{locale}/appointments`; cycle filter tabs `all | upcoming | past | cancelled | no_show`; with long history use load-more on the past section.
3. Mobile: `(tabs)/appointments` — same filter chips; also open the tab while signed out.
**Expected:** `GET /marketplace/appointments/list` (`APPOINTMENTS.S01`) scopes server-side per tab: upcoming = pending/confirmed future only; past bucket mixes completed/cancelled/no_show under "all"/"past". Past pagination appends (offset/limit), never blanks the list. Signed-out mobile shows the sign-in prompt ("Sign in to see your upcoming visits, history, and booking details.").

### 05.14 Appointment detail shows correct per-item price/duration [Web] [Mobile]
**Steps:**
1. Book 2 services in one flow (multi-item slot).
2. Open web `/{locale}/appointments/[uuid]` and mobile `app/appointment/[id]`.
**Expected:** Each line item renders its own price + duration from `appt.items[]`; subtotal = Σ item prices (minor units) and matches the appointment total; no `NaN`/crash when the API returns numeric strings (values are `Number()`-coerced). Detail returns `APPOINTMENTS.S02`.

## Cancel, reschedule & rebook

### 05.15 Customer cancels an upcoming appointment [Web] [Mobile] [Dashboard]
**Steps:**
1. Web: appointment detail → Cancel appointment → confirm in cancel modal (no reason field in the UI; the API accepts an optional `reason`, max 500 chars, but neither client sends one).
2. Mobile: `app/appointment/[id]` → cancel → "Appointment cancelled" toast.
3. Check the dashboard.
**Expected:** `POST /marketplace/appointments/cancel` returns `APPOINTMENTS.S03`; status flips to `cancelled` in customer lists; dashboard receives an `APPOINTMENT_CANCELLED_BY_CUSTOMER` notification and the calendar slot frees up.

### 05.16 Cancellation blocked by policy / state [Web] [Mobile]
**Steps:**
1. Set `cancellationWindowMinutes` = 1440; try cancelling an appointment <24h away.
2. Turn off business `allowCustomerCancellation` (booking settings, applies business-wide); open detail.
3. Attempt cancel on an already-cancelled, a past, and a completed appointment (second tab / direct API).
**Expected:** Window expired → `APPOINTMENTS.E07`; disabled → cancel button disabled in UI, API returns `APPOINTMENTS.E06`; already cancelled → `APPOINTMENTS.E03`; past → `APPOINTMENTS.E04`; completed/no_show → `APPOINTMENTS.E05`. No status change on any failure.

### 05.17 Customer reschedules an upcoming appointment [Web] [Mobile] [Dashboard]
**Steps:**
1. Web: detail → Reschedule → modal shows day slots constrained to the same services/staff; pick new slot; confirm.
2. Mobile: detail → Reschedule → reuses `app/booking` with `rescheduleUuid` (moves the existing appointment); pick new time; confirm.
3. Repeat with `rescheduleWindowMinutes` set so the original start is inside the window; and with `allowCustomerReschedule` off.
**Expected:** `POST /marketplace/appointments/reschedule` returns `APPOINTMENTS.S04`; the new time is validated like a booking (`MARKETPLACE_BOOKING.E08/E09/E11/E14/E10` — web modal refetches slots on `E10`/`E14`; `E15` no longer exists); window expired → `APPOINTMENTS.E12`; disabled or listing inactive → `APPOINTMENTS.E08`; dashboard calendar moves the appointment and the business is notified of the reschedule.

### 05.18 Rebook from a past appointment [Web] [Mobile]
**Steps:**
1. Web: past/cancelled appointment detail → Book again.
2. Verify the drawer opens on Date+Time+Staff prefilled with the same services at CURRENT prices (fresh `getListing(locationId)` supplies the booking `listingId`, `timezone`, policy).
3. Mobile: past appointment → "Book again" — booking screen preloads same services + staff, fresh date.
4. Retire (or hide) one of the original services in the dashboard, then rebook again.
**Expected:** Rebook creates a NEW appointment (original untouched). When no service maps to the live menu (retired / bundle-only items) or the listing fetch fails: web toasts the rebook error and navigates to the business page; mobile falls back to opening the venue listing.

## Timezone & cross-app

### 05.19 Business in another timezone books at correct local time [Web] [Mobile] [Dashboard]
**Steps:**
1. Use a business whose location timezone differs from the device (e.g. venue Europe/Bucharest, device UTC-5).
2. Book the "10:00" slot on web; repeat on mobile.
3. Inspect the `scheduledAt` sent (network tab) and the times shown on success screen, appointment detail, and dashboard calendar.
**Expected:** Slot wall-time is converted to UTC using the LOCATION timezone (web `zonedWallTimeToUtcISO`; API resolves `location.timezone` falling back to business timezone); success/detail render 10:00 venue time, not device time; dashboard calendar shows 10:00 at the venue. Policy deadline dates also use the venue timezone.

### 05.20 New booking appears instantly in the business dashboard [Web] [Dashboard]
**Steps:**
1. Keep the dashboard calendar open for the location.
2. Book from web as a customer (assigned staff member is a dashboard user).
3. Check dashboard notifications and the calendar day view.
**Expected:** Appointment appears in the calendar at the booked slot with source `marketplace`; assigned staff receive an `APPOINTMENT_ASSIGNED` notification (plus push if a token is registered); a marketplace customer record is created or merged with an existing manual customer by email.

## Booking settings & team availability

These exercise that customer-side availability and booking honor every relevant BookingSettings field, and that per–team-member availability is computed independently. Preconditions: a published listing with a public, bookable location, ≥2 active team members assigned to the same 2+ services, plus 2+ customer accounts. (Verified on staging 2026-07-23 where noted.)

### 05.21 Multi-service booking, one team member — composite [Web] [Mobile]
**Steps:**
1. Book 2 services in one flow, assigning the SAME team member to both.
2. Open the appointment detail; check the dashboard calendar.
**Expected:** ONE appointment, `bookingType: composite`; items chained sequentially (item 2 starts when item 1 ends); total duration = Σ item durations, total price = Σ item prices. `groupItemsIntoRuns` keeps consecutive same-staff items in one run. *(Verified 2026-07-23: Haircut + Coloring, same staff → one composite, items 30m/90m, total 170.00.)*

### 05.22 Multi-service booking, different team member per service — split rows [Web] [Mobile] [Dashboard]
**Steps:**
1. Book 2 services in one flow, assigning a DIFFERENT team member to each.
2. Inspect the created appointments and the dashboard calendar.
**Expected:** TWO independent appointments created back-to-back (the 2nd starts exactly when the 1st ends), one per team member, each with its own price/duration. `groupItemsIntoRuns` starts a new run on every staff change, so each single-item run is its own row. Cancelling one does not affect the other; each staff sees only their own on the dashboard. *(Verified 2026-07-23: Haircut/staff-A 09:00–09:30 + Coloring/staff-B 09:30–11:00 as two separate rows; cancelling one left the other confirmed.)*

### 05.23 Buffer time removes slots around an existing booking [Web] [Mobile]
**Steps:**
1. With `bufferTimeMinutes = 15`, book a 30-min service at 10:00 for staff A.
2. As another customer, reload the day's slots for the same staff/service.
**Expected:** 10:00 (taken), 10:15 (overlaps 10:00–10:30), 10:30 (inside the 15-min buffer), and 09:45 (would end 10:15, overlapping) are all absent; 10:45 is the next offered slot. Availability adds the buffer to each appointment end (`ends_at + buffer > new_start`). *(Verified 2026-07-23.)*

### 05.24 Per–team-member availability is independent; "any available" falls back [Web] [Mobile]
**Steps:**
1. Two staff (A, B) both perform service S. Book A at 10:00.
2. Reload slots for S: inspect the 10:00 slot's `availableStaffIds`/`defaultStaffId`.
3. Book "any available" at 10:00; then attempt to also book A at 10:00.
**Expected:** 10:00 still offered because B is free — the slot's `availableStaffIds` drops A but keeps B. "Any available" resolves to a free staff (`defaultStaffId`, else first of `availableStaffIds`) — never double-books A. Booking A directly at 10:00 fails with `MARKETPLACE_BOOKING.E10`. *(Verified 2026-07-23: after booking A@14:00 the slot's `availableStaffIds` dropped A but kept B; a parallel B booking at 14:00 succeeded; re-booking A@14:00 → E10.)*

### 05.25 Slot interval granularity [Web] [Mobile] [Dashboard]
**Steps:**
1. Set `slotIntervalMinutes` to 15, then 30, then 60; reload the day's slots each time.
**Expected:** Slot start times space by the interval: 15 → :00/:15/:30/:45; 30 → :00/:30; 60 → hourly. Duration/availability otherwise unchanged. *(Verified 2026-07-23.)*

### 05.26 Working hours & closed days bound customer slots [Web] [Mobile]
**Steps:**
1. For a location open (e.g.) Mon–Fri 09:00–18:00, Sat 10:00–15:00, Sun closed, load slots for a weekday, a Saturday, and a Sunday.
2. Try a service whose duration would cross closing time at the last slot.
**Expected:** Weekday offers 09:00–17:30 starts (last start leaves room to end by 18:00); Saturday offers the shorter window; Sunday offers none (isOpen=false). A service that can't finish before closing isn't offered at the late slot. Slots are generated in the location timezone, not the device's. *(Verified 2026-07-23: weekday 35 slots 09:00–17:30, Saturday 19, Sunday 0.)*

### 05.27 A calendar block removes only the blocked team member's availability [Web] [Mobile] [Dashboard]
**Steps:**
1. Two staff (A, B) both perform service S. Create a STAFF-scope calendar block for B, e.g. 10:00–12:00.
2. Reload the day's slots for S; inspect a slot inside the block (e.g. 10:30).
3. Try to book B at 10:30, then book A at 10:30.
**Expected:** The block removes B (only) from `availableStaffIds` for slots overlapping 10:00–12:00 — A (and any other capable staff) stay bookable there; slots outside the block still list every staff. Booking B in the blocked window fails with `MARKETPLACE_BOOKING.E14` (calendar block); booking A at the same time succeeds. *(Verified 2026-07-23: 10:30 `availableStaffIds` went [A,B,other]→[A,other] under the block, 13:00 unchanged, B booking → E14, A booking → S01.)*
