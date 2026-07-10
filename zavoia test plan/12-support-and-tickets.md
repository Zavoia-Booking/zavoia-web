# 12. Support & Tickets — Test Scenarios

**Covers:** [Dashboard] [Web] [Mobile] [CRM]
**Preconditions:**
- Seeded accounts: marketplace customer (web + mobile login), business owner with dashboard access, CRM agent (admin-crm login).
- Mail catcher / test inbox to verify guest confirmation and reply emails.
- API running with `RATE_LIMIT_DISABLED` unset for the rate-limit scenarios.

## Ticket creation — logged-in customer (marketplace)

### 12.1 Create ticket from mobile Get Help hub [Mobile]
**Steps:**
1. Log in, Profile tab → "Get help" → `/get-help`.
2. Tap "New ticket" — global composer bottom sheet opens.
3. Pick category chip ("Issue" = `bug` / "Question" = `question`), type a message, submit.
4. Return to hub list.
**Expected:** POST `/marketplace/support/tickets` → `SUPPORT.S01`; sheet shows "Sent" success state. Ticket appears in list with status pill OPEN, counted under the "Open" filter (filters: All / Open / Closed).

### 12.2 Create ticket from web account Support section [Web]
**Steps:**
1. Log in on web, go to `/{locale}/account` → "Support" section.
2. Click "New ticket"; inline form defaults category to `bug`; toggle between Bug/Question buttons.
3. Enter message, submit.
**Expected:** `SUPPORT.S01`; new ticket at top of list showing `#<id> · <category label>`, status OPEN, `sourceType MARKETPLACE`.

### 12.3 Contextual "Report a problem" attaches hidden context [Mobile] [CRM]
**Steps:**
1. On mobile, open an appointment detail (or `listing/[id]`, or `team-member-detail`) and tap Report a problem (`openReport`).
2. Composer opens pre-scoped: category `bug`, read-only "Reporting …" header with the human label only (no ids visible).
3. Submit; then in CRM open the ticket at `/tickets/:id`.
**Expected:** Ticket `details.context` stores `{ type: appointment|listing|professional, label, ids }`. CRM detail shows the "Reported item" panel with label plus Business ID / Location ID / Appointment UUID / Listing ID / Team member ID. Mobile ticket row shows the context line; customer never sees ids.

## Ticket creation — business dashboard

### 12.4 Owner creates ticket from dashboard Support [Dashboard]
**Steps:**
1. Log in as owner, sidebar → Support (`/support`, requires `Permission.ACCESS_SUPPORT`).
2. Open the new-ticket dialog (default category = Question), pick Bug/Question, enter message.
3. Submit.
**Expected:** POST `/support/tickets` → `SUPPORT.S01`; ticket `sourceType DASHBOARD` with `businessId` set; appears in dashboard list with status badge OPEN and category badge.

### 12.5 Dashboard Support reachable with expired subscription [Dashboard]
**Steps:**
1. Log in as owner of a business with an expired subscription (SubscriptionBlocker active).
2. Navigate to `/support`.
3. Create a ticket and reply to an existing one.
**Expected:** `/support` is exempt from the subscription block (`@AllowExpiredWrite` on the controller; `/support` in the blocker's permitted paths); create/reply succeed.

## Guest report — web /help "Report an issue"

### 12.6 Guest submits a report signed out [Web]
**Steps:**
1. Signed out, open `/{locale}/help`; in the "Report an issue" card click the CTA — modal opens.
2. Fill title, email, message; submit.
3. Check the provided inbox.
**Expected:** POST `/marketplace/public/support/tickets` (no auth) → `SUPPORT.S01`; response contains only `{ uuid, createdAt }`. Modal success shows the email and the `uuid` as reference. Confirmation email arrives in the page locale (`en`/`ro`). Ticket saved as `sourceType GUEST`, `createdBy null`, contact in `details.guest`, category forced `bug`, title as first line of the message.

### 12.7 Guest modal client validation [Web]
**Steps:**
1. Open the report modal; leave all fields empty.
2. Fill only title; then enter invalid email `foo@bar`; then fix email but leave message empty.
3. Fill everything valid.
**Expected:** Submit stays disabled until title non-empty AND email matches the regex AND message non-empty; enabled only in step 3. Max lengths enforced: title 200, email 254, message 9500 (API cap 10000).

### 12.8 Guest endpoint rate limit [Web]
**Steps:**
1. Submit 3 guest tickets from the same IP within an hour.
2. Submit a 4th.
**Expected:** 4th returns HTTP 429 "Too many requests. Please try again later." (GuestTicketRateLimitGuard: 3/hour per IP). Modal shows the dedicated rate-limit copy (`t.modal.errorRateLimit`), not the generic error.

### 12.9 Guest submits with an email that has an account [Web] [CRM]
**Steps:**
1. Signed out, submit a report using the email of an existing customer account.
2. Log in to that account; open `/account` → Support and mobile `/get-help`.
3. In CRM open the ticket.
**Expected:** Still created as GUEST (`createdBy null` — no account lookup); the ticket does NOT appear in the account's in-app ticket list. CRM shows source "Guest" with contact from `details.guest`. Replies reach the person by email only.

### 12.10 Guest API validation [Web]
**Steps:**
1. POST `/marketplace/public/support/tickets` directly with: missing email; email > 254 chars; `category: "other"`; empty `message`; `locale: "fr"`.
**Expected:** 400 class-validator errors for each (`IsEmail`, `IsEnum(TicketCategory)` — only `bug`/`question`, `MinLength(1)`/`MaxLength(10000)` on message, locale limited to `en|ro`). No ticket row created, no email sent.

## Rate limits — authenticated create

### 12.11 Authenticated create rate limit [Web] [Mobile] [Dashboard]
**Steps:**
1. As the same logged-in user, create 3 tickets within 5 minutes (marketplace or dashboard endpoint).
2. Create a 4th.
**Expected:** 4th → HTTP 429 "Too many requests. Please try again later." (OTPRateLimitGuard: 3 per 5 min per IP+user). List/read/reply endpoints are not create-rate-limited.

## CRM queue & handling

### 12.12 Agent views queue with filters and unread badges [CRM]
**Steps:**
1. Log in to CRM, open `/tickets` (POST `/admin-crm/tickets/list`).
2. Apply filters: status (OPEN / IN_PROGRESS / CLOSED / REOPENED), priority (LOW / MEDIUM / HIGH / URGENT), read state ("Unread (need to read)").
**Expected:** List sorted by `createdAt` DESC; tickets the customer created/replied to since last agent read show unread (`hasUnreadForAdmin` = `!seenByAdmin`). Filters narrow correctly; guest tickets show source type `GUEST` in the Source Type column.

### 12.13 Agent opens ticket detail — read marker + creator info [CRM]
**Steps:**
1. Open an unread MARKETPLACE ticket at `/tickets/:id`.
2. Note the creator block; return to the queue.
3. Repeat with a GUEST ticket.
**Expected:** GET marks `seenByAdmin: true` (unread badge clears in queue). Logged-in tickets resolve creator name/email from the users table; guest tickets surface `details.guest` (name + email) as creator, source label "Guest".

### 12.14 Agent replies to a marketplace ticket → in-app notification [CRM] [Web] [Mobile]
**Steps:**
1. In CRM ticket detail, send a reply (POST `/admin-crm/tickets/:id/reply`, stored as `createdBy: "admin"`).
2. Reply a second time before the customer reads.
3. On mobile, open the notifications inbox; on web, open `/account` → Support.
**Expected:** Reply appended to `details.history`; ticket `seen` set false → customer list shows unread. One CustomerNotification "Support reply" created; the second reply does NOT create a duplicate while an unread one exists. Mobile notification tap deep-links to `/support-ticket/:id`.

### 12.15 Agent replies to a dashboard ticket → business notification [CRM] [Dashboard]
**Steps:**
1. Reply to a DASHBOARD-source ticket in CRM.
2. In the dashboard, open the notification bell and click the "Support reply" item.
**Expected:** BusinessNotification type `SUPPORT_REPLY` created (deduped while one is unread). Click navigates to `/support?ticketId=<id>` which auto-opens that ticket; opening it marks the ticket `seen` and the notification read.

### 12.16 Agent replies to a GUEST ticket → email only [CRM]
**Steps:**
1. Open a guest ticket (created with `locale: "ro"`), send a reply.
2. Check the guest inbox; confirm no in-app surface exists for guests.
**Expected:** Reply email (`sendGuestTicketReply`) sent to `details.guest.email` in the guest's locale with the reply text and the `uuid` reference. No notification rows created. If the email send fails, the reply is still saved on the thread (best-effort).

### 12.17 Agent edits status/priority/category; reopen; delete [CRM]
**Steps:**
1. In ticket detail, change status to IN_PROGRESS, priority to HIGH; save (PUT `/admin-crm/tickets/:id`).
2. Set a CLOSED ticket to REOPENED; have the customer reply from web/mobile.
3. Delete a ticket (DELETE `/admin-crm/tickets/:id`) and re-check the customer's list.
**Expected:** Edits persist (category lowercased server-side). REOPENED re-enables customer replies (in ACTIVE_STATUSES). Deleted ticket disappears everywhere; customer GET by id → 404 `SUPPORT.E03`.

## Thread lifecycle & access control

### 12.18 Customer reads reply and responds — read flags flip [Web] [Mobile]
**Steps:**
1. After a CRM reply, open the ticket thread (GET `/marketplace/support/tickets/:id`; mobile `/support-ticket/:id`).
2. Send a response (POST `/marketplace/support/tickets/:id/messages`).
3. Check the CRM queue.
**Expected:** Opening sets `seen: true` and marks that ticket's unread notifications read (unread dot clears). Reply → `SUPPORT.S04`, appended to history, and flips `seenByAdmin: false` so the CRM queue shows the ticket unread again.

### 12.19 Close ticket; replying to a closed ticket is blocked [Web] [Mobile] [Dashboard]
**Steps:**
1. As the creator, close the ticket (PUT `.../tickets/:id/close` — mobile/web: X/Close button with confirm modal; dashboard: Close button, no confirm).
2. Attempt to add a message via API to the closed ticket.
3. In CRM, send a reply to the same closed ticket.
**Expected:** Close → `SUPPORT.S05`, status CLOSED (dashboard close also sets `resolvedAt`); mobile/web composer disabled. Customer message on CLOSED → 400 `SUPPORT.E04`. CRM reply still succeeds (no status check) and notifies/emails — customer can read but cannot respond until REOPENED.

### 12.20 Ownership and auth boundaries [Web] [Mobile] [Dashboard]
**Steps:**
1. As customer A, GET/reply/close ticket ids belonging to customer B.
2. Call `/marketplace/support/tickets` without a token.
3. As a dashboard user, GET `/support/tickets/:id` for a MARKETPLACE-source ticket id.
**Expected:** Cross-user access → 404 `SUPPORT.E03` (queries scoped by `createdBy`). No token → 401. Dashboard endpoints additionally scope to `sourceType DASHBOARD`, so a marketplace ticket id → 404 `SUPPORT.E03`.
