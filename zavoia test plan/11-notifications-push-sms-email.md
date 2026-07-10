# 11. Notifications (Push / SMS / Email) — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile] [CRM]
**Preconditions:**
- Business (countryCode RO) with active subscription, 1 owner + 1 team member; booking settings: `emailEnabled=true`, `smsEnabled=true`, `reminderHoursBefore=24`; `smsCredits` > 10 (Twilio configured; on staging the target phone must be in `SMS_WHITELIST_E164` or sends fail with "Number not in staging whitelist")
- Marketplace customer account with email + E.164 phone; marketplace app installed on a physical device (Expo push); dashboard native app (Capacitor/FCM) installed for owner
- Dashboard logged in as owner (web) for bell assertions

## Notification event reference (from API code)

- Business bell (`BusinessNotificationType`): `support_reply`, `appointment_status_review`, `appointment_rescheduled_by_customer`, `appointment_cancelled_by_customer`, `sms_credits_low`, `sms_credits_depleted`, `appointment_rescheduled_by_team_member`, `team_member_accepted_invitation`, `team_member_left_organisation`, `appointment_assigned`, `appointment_unassigned`, `appointment_rescheduled`, `appointment_cancelled`
- Customer notification events (`NotificationEventType`): `reminder`, `cancellation`, `reschedule`, `confirmation`, `review_request` — each fans out to channels `sms` / `push` / `email` with per-channel `notification_delivery` rows (`pending`/`sent`/`failed`/`skipped`)
- Customer push inbox types (`NotificationType`): `appointment_reminder`, `appointment_confirmed`, `appointment_cancelled`, `appointment_rescheduled`, `new_message`, `promotion`, `review_request`, `account_update`, `general`
- Business FCM push events (`AppointmentEventType`): `appointment.created`, `appointment.cancelled`, `appointment.rescheduled`, `appointment.confirmed`
- SMS usage types (`SmsUsageType`): `appointment_reminder`, `appointment_cancellation`, `appointment_rescheduled`, `appointment_confirmation`, `review_request`, `marketing`, `custom`

## Business-side notifications on customer actions

### 11.1 Customer books → business push + assigned-staff bell notification [Web] [Mobile] [Dashboard]
**Steps:**
1. As customer, book via web or app (POST `/marketplace/appointments/book`) selecting a service assigned to the team member
2. Check owner's dashboard native app for FCM push
3. Log in to dashboard as the assigned team member; open bell
**Expected:** FCM push `appointment.created` to owner + assigned staff — title "New booking", body "{customer} booked {service} on {date}" (always EN — business push locale is hardcoded; RO strings exist but are unreachable). Assigned staff get bell entry type `appointment_assigned`, title "New appointment assigned". Owner gets NO bell entry unless assigned as staff (only push).

### 11.2 Customer cancels → owner + staff bell entries, push, reminder cancelled [Web] [Mobile] [Dashboard]
**Steps:**
1. Customer cancels a confirmed appointment (POST `/marketplace/appointments/cancel`)
2. Open dashboard bell as owner, then as assigned team member
3. Check `notification_event` for the pending reminder
**Expected:** Owner bell: type `appointment_cancelled_by_customer`, title "Appointment cancelled by customer". Staff bell: type `appointment_cancelled`, title "Your appointment was cancelled". FCM push "Booking cancelled". Pending reminder event flips to status `cancelled` (Cloud Task cancelled).

### 11.3 Customer reschedules → business notified + customer reschedule notice [Web] [Mobile] [Dashboard]
**Steps:**
1. Customer reschedules (POST `/marketplace/appointments/reschedule`) to a new time
2. Check owner bell and staff bell
3. Check customer email/SMS/push
**Expected:** Owner bell `appointment_rescheduled_by_customer` "Appointment rescheduled by customer"; staff bell `appointment_rescheduled`; FCM push `appointment.rescheduled`. Customer receives reschedule notice on all enabled channels — SMS: "Your appointment at {business} has been rescheduled from {old} to {new}.", push title "Appointment Rescheduled", email `AppointmentReschedule`. Reminder is cancelled and re-scheduled for the new time.

### 11.4 Owner mobile push preference gating (all / my / none) [Dashboard]
**Steps:**
1. As owner, PUT `/business-push/preference` = `my_notifications`; have customer book an appointment NOT assigned to owner
2. Book another appointment WITH owner as staff
3. Set preference = `no_notifications`; book again with owner as staff
4. As team member, call GET/PUT `/business-push/preference`
**Expected:** Step 1: no owner push (assigned staff still pushed). Step 2: owner pushed. Step 3: no push ever (opt-out enforced at the single FCM send point). Step 4: 403 — endpoints are `@Roles(OWNER)` only.

### 11.5 Team member bell scoping (role boundary) [Dashboard]
**Steps:**
1. Create a business-wide notification (e.g. customer cancels → `appointment_cancelled_by_customer` has `userId NULL`)
2. GET `/business-notifications/list` as team member
3. As team member, PATCH `/business-notifications/:id/read` and DELETE on that business-wide notification id
**Expected:** Team member list contains only rows targeted at their userId (business-wide `userId NULL` rows hidden); owner sees business-wide + own. Step 3: 404 `BUSINESS_NOTIFICATION.E01` (scoped update matches 0 rows).

## Customer instant notifications

### 11.6 Business confirms pending booking → customer confirmation on all channels [Dashboard] [Mobile]
**Steps:**
1. Set `autoConfirmBookings=false`; customer books → appointment status PENDING
2. In dashboard, set appointment status to CONFIRMED
3. Check customer email, SMS, app push + inbox
**Expected:** Email `AppointmentConfirmation` (provider/service/date/time/location rows + Google Maps "get directions" link); SMS "Your appointment at {business} on {date} at {time} has been confirmed." (1 credit deducted, usage `appointment_confirmation`); push "Appointment Confirmed" saved to inbox. Reminder scheduled; staff get FCM `appointment.confirmed`.

### 11.7 Business cancels with reason → customer cancellation notice (no quiet hours) [Dashboard] [Mobile]
**Steps:**
1. In dashboard, cancel a confirmed appointment providing a cancellation reason (after 22:00 business time if possible)
2. Check customer channels
**Expected:** SMS/push/email sent immediately (cancellation ignores quiet hours) — SMS: "Your appointment at {business} on {date} at {time} has been cancelled. Reason: {reason}"; email `AppointmentCancellation` includes the reason; push title "Appointment Cancelled". Reminder event cancelled.

### 11.8 Mark completed → review request only for marketplace customers [Dashboard] [Mobile]
**Steps:**
1. Mark a marketplace customer's appointment COMPLETED in dashboard
2. Tap the resulting push on the customer app
3. Repeat with a manually-created customer (no user account)
**Expected:** Push "Leave a Review" (type `review_request`); tapping opens `/appointment/[id]` (id = appointment uuid) with `review=1` (review flow auto-opens); email `ReviewRequest` with `reviewUrl` `zavoia://review/<uuid>`. Manual customer: review request skipped entirely (no user account).

## Appointment reminders

### 11.9 Reminder scheduling: lead time, fallback, too-soon skip, quiet hours [Dashboard] [Mobile]
**Steps:**
1. With `reminderHoursBefore=24`, book confirmed appointment 3 days out → inspect `notification_event` (type `reminder`, status `pending`)
2. Let it fire (or trigger the Cloud Task webhook)
3. Book appointment ~3h ahead (ideal reminder time already past)
4. Book appointment <2h ahead
5. Book appointment whose computed reminder lands between 22:00–07:00 business time
**Expected:** 1–2: reminder at T-24h on all enabled channels — SMS "Reminder: Your appointment at {business} is on {date} at {time}." (usage `appointment_reminder`), push "Appointment Reminder", email `AppointmentReminder`. 3: falls back to 2h before. 4: skipped ("too soon"). 5: shifted to 21:55 the prior evening if still future and before the appointment, else 07:05.

### 11.10 Reminder re-checks at send time (stale state) [Dashboard]
**Steps:**
1. Schedule a reminder, then cancel/complete the appointment WITHOUT the event being cancelled (e.g. mark COMPLETED right before fire time)
2. Fire the reminder task; inspect `notification_delivery` rows
3. Repeat with: business `smsCredits=0`; customer with no push tokens; business subscription expired
**Expected:** CANCELLED/COMPLETED/NO_SHOW appointment → nothing sent, event marked `done`. 0 credits → SMS channel skipped, email/push still sent. No tokens → push skipped. Expired subscription → whole reminder skipped (`subscription_expired`). Webhook always ACKs (never retriggers a crash loop).

### 11.11 End-of-day stale appointment summary [Dashboard]
**Steps:**
1. Leave 2 appointments for today in CONFIRMED past their end time
2. Wait for the EOD Cloud Task (latest location closing time + 30 min; 22:00 fallback)
3. Open owner bell
**Expected:** Single bell entry type `appointment_status_review`, title "2 appointments need status update", body listing "HH:mm - {customer} ({service})" per appointment and asking to update to Completed or No Show. No entry when nothing is stale.

## SMS credits and packages

### 11.12 SMS credit deduction + low/depleted alerts [Dashboard]
**Steps:**
1. Set business credits to 11; trigger an SMS (e.g. confirm a pending appointment)
2. Check bell after the send (credits now 10 — threshold `SMS_CREDITS_LOW_THRESHOLD = 10`)
3. Trigger sends down to 0 credits; check bell + owner email
4. Trigger one more SMS event
**Expected:** Each send deducts 1 credit (`smsCredits`, `smsTotalUsed`) and writes an `sms_usage` row. At ≤10: bell `sms_credits_low` "SMS credits running low" (deduped — max one per 24h). At 0: bell `sms_credits_depleted` + owner email `SmsOutOfCredits` (sent only if `smsEnabled=true`) linking to `/account?tab=billing#sms-credits`. Step 4: SMS fails with "Business has no SMS credits"; email/push channels unaffected.

### 11.13 SMS package purchase via Stripe [Dashboard]
**Steps:**
1. As owner: GET `/sms/packages` (region resolved from business countryCode) and GET `/sms/balance`
2. POST `/sms/checkout` `{packageId, successUrl, cancelUrl}` → complete Stripe Checkout
3. Verify webhook `checkout.session.completed` (payment_status `paid`) credited the business; GET `/sms/purchases`
4. Replay the same webhook event
5. Call any `/sms/*` endpoint as team member
**Expected:** Credits increase by package `smsQuantity`; purchase flips pending→completed. Duplicate webhook: no double credit ("not pending... skipping"). Unpaid/delayed payment methods not credited until `async_payment_succeeded`. Step 5: 403 — controller is `@Roles(OWNER)`. Business with countryCode outside any region gets `{ data: [], region: null }`.

## Preference toggles (off → nothing sent)

### 11.14 Customer turns a reminder channel off → that channel stays silent [Mobile] [Web]
**Steps:**
1. In app: Profile → Notifications (`/notifications` screen) toggle Reminders→Email off; on web use `/account` notifications section (POST `/marketplace/customer/notifications`, singular keys `reminderEmail`/`reminderSms`/`reminderPush`)
2. Trigger a confirmation (pending → CONFIRMED)
3. Toggle Reminders→Push off; trigger another event
4. GET `/marketplace/customer/notifications` to verify persistence
**Expected:** Step 2: no email; SMS + push still arrive. Step 3: no push and no new inbox row; SMS still arrives. GET returns groups `marketing` + `reminders` each with `push/sms/email` booleans matching toggles.

### 11.15 Business disables channels / reminders entirely [Dashboard]
**Steps:**
1. In dashboard calendar Advanced Settings, toggle SMS off (`smsEnabled=false`); trigger a confirmation for a customer with SMS pref on
2. Toggle Email off (`emailEnabled=false`); trigger again
3. Turn Reminders master toggle off (sets `reminderHoursBefore=0`); book a confirmed appointment
4. Trigger a confirmation for a MANUAL customer (phone+email, no account)
**Expected:** 1: no SMS (business setting gates customer pref). 2: no email. 3: no reminder event created ("Reminders disabled"). 4: manual customers get SMS/email per business settings but never push (`push: false`).

## Mobile push mechanics and inbox

### 11.16 Push permission prompt and token registration [Mobile]
**Steps:**
1. Fresh install, log in, reach the point that calls `initializePushNotifications` (see open question) — OS permission prompt appears
2. Grant → app fetches Expo push token and POSTs `/marketplace/customer/push-token` `{token, platform, deviceId}`
3. Deny on another device/reinstall
4. Log out
**Expected:** Grant: token row stored (re-registering same token updates ownership/lastUsedAt, no duplicate). Deny: no token registered, no crash; simulator/emulator always treated as denied ("Push notifications require a physical device"). Logout: DELETE `/marketplace/customer/push-token` and local push state reset.

### 11.17 Receiving push foreground/background/killed + tap deep links [Mobile]
**Steps:**
1. With app foregrounded, trigger a confirmation push
2. Background the app; trigger a cancellation push; tap it
3. Kill the app; trigger a review-request push; tap it (cold start)
4. Send a push whose data has only `businessId`; and one with no target data
**Expected:** Foreground: banner still shown (handler `shouldShowAlert: true`) and unread badge increments. Tap routing: `data.screen` → that screen; `appointmentUuid` → `/appointment/[id]` (plus `review=1` for `review_request`); `businessId` → `/listing/[id]`; nothing resolvable → `/notifications-inbox`. Cold start handled via `getLastNotificationResponseAsync`. Every tap also marks the inbox row read via `notificationId` in the payload.

### 11.18 Notifications inbox: unread state, mark all read, badge, pagination [Mobile]
**Steps:**
1. Accumulate 3+ unread notifications; tap bell on any tab (home/appointments/favorites/profile) → `/notifications-inbox`
2. Tap one unread row
3. Tap "Mark all as read"
4. Pull-to-refresh; scroll past 20 items
**Expected:** Unread rows show highlight + dot; header bell shows unread count. Step 2: POST `/marketplace/customer/notifications/:id/read`, row un-highlights, deep-links per its data. Step 3: button only visible when `unreadCount > 0`; POST `.../read-all` → all read, app icon badge cleared (`setBadgeCount(0)`). Step 4: cursor pagination (`limit` capped at 50), `hasMore`/`nextCursor` respected.

## Dashboard notification bell

### 11.19 Bell badge, list, mark read / mark all / delete [Dashboard]
**Steps:**
1. With unread notifications, check the header bell badge; click it
2. On `/notifications`, click a notification item
3. Click "Mark all as read"; then "Delete all loaded" and confirm the dialog
4. PATCH `/business-notifications/99999/read`
**Expected:** Badge shows unread count, "99+" cap; click navigates to `/notifications`. Item click marks read and navigates to `/calendar?appointmentId={id}` when the payload carries an appointment. Mark all → PATCH `/business-notifications/read-all` returns `BUSINESS_NOTIFICATION.S03` with updated count; delete returns `S04` per row. Step 4: 404 `BUSINESS_NOTIFICATION.E01`.

## Email localization

### 11.20 Email templates render in RO/EN with correct links [CRM] [Dashboard]
**Steps:**
1. Trigger confirmation + reminder + cancellation emails for an RO-country business, then for a non-RO business
2. In CRM, open the Email Test page: GET `/admin-crm/email-test/templates`, POST `/admin-crm/email-test/preview` with `locale: 'ro'` and `'en'` for AppointmentConfirmation/Reminder/Cancellation/Reschedule/ReviewRequest/SmsOutOfCredits
3. Deplete SMS credits for an owner whose resolved locale is RO
4. Inspect links in received emails
**Expected:** Appointment emails localize by business country (`deriveLocale`: `ro` only for countryCode RO, else `en`); dates/times formatted in the business timezone with the same locale. `SmsOutOfCredits` localizes per owner (`resolveUserLocale`) and links to `{FRONTEND_URL}/account?tab=billing#sms-credits`. Confirmation email location block links to Google Maps directions for the snapshot address. HTML and plain-text parts both render (no raw `{placeholders}`).
