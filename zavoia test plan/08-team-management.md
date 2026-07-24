# 08. Team Management — Test Scenarios

> Verified on staging 2026-07-23; expectations below updated to the actual implementation. The pending-duplicate-invite 500 was fixed in admin-api the same day (now 409 `AUTH.E03`) — retest after deploy. Invite-acceptance flows (08.6/08.7/08.8-accept/08.20) need inbox access for the emailed token; 08.21 is billing-mutating — run manually.

**Covers:** [Dashboard] [Web] [Mobile]
**Preconditions:**
- Owner account with active (or trial) subscription and at least 1 free team seat (`paidTeamSeats`); business with ≥2 locations, ≥2 services, published marketplace listing; a second active team member to use as reassignment target.
- Inbox access for all invited emails; `FRONTEND_URL` set so invite links resolve to the dashboard (`/team-invitation?token=...`, valid 168h / 7 days).
- Seed emails: one brand-new/unused; one with an existing marketplace CUSTOMER account; one that is OWNER of a second business.

## Inviting team members

### 08.1 Invite a brand-new email [Dashboard]
**Steps:**
1. Login as owner → `/team-members` → open Invite slider (InviteTeamMemberSlider).
2. Enter a fresh email, select ≥1 location, submit (`POST /auth/invite-team-member`).
3. Observe redirect to `/team-members/invitation-success`; go back to `/team-members`.
4. Open invited inbox and inspect the email link.
**Expected:** `AUTH.S01`; member listed in Pending section with `roleStatus: pending_acceptance` and fallback display name (placeholder user has empty first/last name); summary counts update (total/active/pending). Email link is `{FRONTEND_URL}/team-invitation?token=...`.

### 08.2 Invite validation errors [Dashboard]
**Steps:**
1. In the Invite slider, enter the owner's own email and submit.
2. Try submitting with no location selected.
3. Via API, send `locationIds: []`, then a locationId belonging to another business.
4. Invite an email that is already a pending or active team member of this business.
**Expected:** Own email → `AUTH.E02`. No location → UI blocks with location-required validation; API with `[]` → `AUTH.E04`; foreign locationId → 403 `AUTH.E07`. Duplicate of an ACTIVE member → 409 `AUTH.E01`; duplicate of a PENDING member → 409 `AUTH.E03` (fixed 2026-07-23 — previously 500 `AUTH.E06`).

### 08.3 Seat limit blocks invite [Dashboard]
**Steps:**
1. On an **active (post-payment) subscription**, fill all paid seats (active + pending members = `paidTeamSeats`).
2. Open the Invite slider.
3. Attempt the invite via API anyway.
**Expected:** Slider shows the no-seats state and its primary button routes to billing (`/account?tab=billing`) instead of inviting. API → 403 `AUTH.E05` with `details.limit`.
**Seat-cap basis (verified 2026-07-24, `entitlements.service.ts` `canInviteTeamMember`):** the effective cap depends on subscription state — **during trial it is the plan's `maxTeamMembers`** (e.g. 20 for STANDARD), NOT `paidTeamSeats`; **after subscription it is `min(paidTeamSeats, maxTeamMembers)`**. So a trial business with `paidTeamSeats: 0` **can still invite** up to `maxTeamMembers` — an invite on a 0-paid-seat STANDARD trial returns `AUTH.S01`, not `AUTH.E05` (this is intended: trial grants the plan's full seat ceiling; the paid-seat cap only bites once a paid subscription is active). To exercise `AUTH.E05` on trial you must reach `maxTeamMembers`; on an active subscription you reach `paidTeamSeats`.

### 08.4 Invite an email that already has a customer account [Dashboard] [Web]
**Steps:**
1. Invite the seeded marketplace-customer email (select 1 location).
2. Check `/team-members` pending list.
3. Before accepting, log that user into marketplace web (`/{locale}/login`).
**Expected:** No new account created — existing user gets a TEAM_MEMBER role with `pending_acceptance` status and is linked to the chosen locations immediately; `AUTH.S01`. CUSTOMER role untouched: web login and existing appointments still work while invite is pending.

### 08.5 Invite an email that owns another business [Dashboard]
**Steps:**
1. From Business A (owner), invite the email that is OWNER of Business B.
2. Verify the invite email arrives and Business A shows the user as pending.
3. Accept via the emailed link (existing active user → auto-accept, see 08.7).
4. Log in to the dashboard with that email.
**Expected:** Invite succeeds (`AUTH.S01`) — owning another business is not a conflict. After accept, login returns HTTP 300 `business_selection_required` (`AUTH.E17`) listing both businesses with roles `owner` (B) and `team_member` (A).

## Invite acceptance

### 08.6 New user accepts via registration form [Dashboard]
**Steps:**
1. Logged out, open the invite link → `/team-invitation?token=...` (calls `GET /auth/check-team-invitation`).
2. Verify the registration form shows the business name and locked invited email (`status: needs_registration`, `AUTH.S03`).
3. Fill first/last name, phone (E.164), password meeting policy; submit (`POST /auth/complete-team-invitation`).
4. Log in with the new credentials.
5. As owner, check notifications and `/team-members`.
**Expected:** Completion → `AUTH.S04`, "completed" screen with Go-to-login. Member is `active` (moves out of Pending), user `email_verified: true`. Owner gets `TEAM_MEMBER_ACCEPTED_INVITATION` notification ("has completed registration and joined your team"); member receives welcome email linking to `/dashboard`.

### 08.7 Existing active user auto-accepts; token is single-use and expires [Dashboard]
**Steps:**
1. As the existing-customer invitee (08.4), open the invite link (no login needed).
2. Observe the accepted screen (no registration form).
3. Open the same link again.
4. Repeat with a tampered token and (if feasible) a token older than 168h.
**Expected:** First open auto-accepts: `status: accepted`, `AUTH.S02`; role becomes `active`; owner notified. Reused link → error screen (token already used, `SYSTEM.E07`); missing token → `SYSTEM.E05`; tampered token (not found) → `SYSTEM.E06`; expired token → `SYSTEM.E08` — both show error screen with Go-to-login.

### 08.8 hiddenFromMarketplace resets to visible on accept [Dashboard] [Web]
**Steps:**
1. Precondition: a `dashboard_user` (previously removed member) who enabled the marketplace hide toggle (`POST /team-member-account/marketplace-visibility` `hidden: true`).
2. Invite that email and accept the invitation.
3. Call `GET /team-member-account/profile` + `/marketplace-profile` as the member.
4. As the member's current (post-accept) session, try `POST /team-member-account/marketplace-visibility` with `hidden: true`; repeat reusing the old pre-accept access token if still valid.
**Expected:** On accept the DASHBOARD_USER role is deleted and `hiddenFromMarketplace` resets to `false` (member visible again, e.g. in web favorites/professionals). The route requires the DASHBOARD_USER role, so a current team-member session gets a generic 403 (RolesGuard); replaying a stale pre-accept `dashboard_user` token instead surfaces the intended 400 `TEAM_MEMBER_ACCOUNT.E21`.

## Pending invite management

### 08.9 Resend a pending invitation (24h throttle) [Dashboard]
**Steps:**
1. On a pending member card, click Resend → confirm dialog → `POST /team-members/resend-invitation/:id`.
2. Open the OLD emailed link.
3. Open the NEW emailed link.
4. Resend again within 24h.
5. Via API, resend for an already-active member.
**Expected:** the 24h throttle counts the ORIGINAL invite email — any resend within 24h of inviting → `TEAM.E10` (i.e. `TEAM.S03` + old-token invalidation is only observable ≥24h after the invite). Active member → 403 `SYSTEM.E04`. Unknown user id → `TEAM.E05`.

### 08.10 Cancel (revoke) a pending invitation [Dashboard]
**Steps:**
1. On a pending member card, click Cancel invitation → confirm → `POST /team-members/cancel-invitation/:id`.
2. Open the emailed invite link.
3. If invitee was a brand-new placeholder: re-invite the same email. If invitee was an existing customer: log into marketplace web.
4. Via API, cancel for an active member.
**Expected:** `TEAM.S02`; member removed from pending list; link dead. Placeholder user with no other roles is fully deleted (fresh re-invite works); existing customer keeps CUSTOMER role and web login. Cancel on an active member and cross-business cancel both → 403 `TEAM.E06` (the lookup only matches pending roles, so a non-pending target reads as "not yours").

## Roles & permissions

### 08.11 Team member sees only their own pages [Dashboard]
**Steps:**
1. Log in as an active team member.
2. Inspect the sidebar.
3. Navigate directly to `/team-members`, `/assignments`, `/locations`, `/services`, `/marketplace`, `/account`.
4. Open `/my-assignments`, `/my-profile` (tabs profile/portfolio/reviews), `/my-account`, `/customers`, `/calendar`.
**Expected:** Sidebar shows only Dashboard, Calendar, Customers, My Assignments, My Profile, Support, My Settings — no Locations/Services/Assignments/Team Members/Marketplace/Settings (role→permission map: TEAM_MEMBER_PERMISSIONS). Owner-only URLs redirect to the role home (`/dashboard`); team-member routes load. Calendar shows only the member's own appointments (`VIEW_OWN_APPOINTMENTS`; API filters when `user.role === team_member`).

### 08.12 API role boundaries for team member [Dashboard]
**Steps:**
1. With a team-member access token, call: `GET /team-members/:id`, `PUT /team-members/:id`, `DELETE /team-members/:id`, `POST /team-members/resend-invitation/:id`, `GET /assignments/locations/:id/full`. (`GET /staff-schedule/business/:businessId` removed from this list 2026-07-24 — the staff-schedule module was deleted; the route was never mounted and now returns 404, not 403.)
2. Call `POST /team-members/list` and `GET /team-member-account/assigned-locations`.
**Expected:** All owner-only endpoints → 403 (RolesGuard, `@Roles(OWNER)`). `POST /team-members/list` and team-member-account endpoints → 200.

## Assignments & scheduling

### 08.13 Assign/unassign services controls bookable staff [Dashboard] [Web] [Mobile]
**Steps:**
1. As owner → `/assignments` → pick a location → open the member's services → enable Service X (`PUT /assignments/locations/:locationId/staff/:userId/services`, `canPerform: true`).
2. As the member, open `/my-assignments` → select the location.
3. On web `/{locale}/business/[slug]`, start booking Service X → reach the staff step; on mobile, open the listing → booking → StaffPicker.
4. Back as owner, disable Service X for the member; re-check web/mobile staff pickers (`POST /marketplace/public/booking/calendar` → `staffDirectory`).
**Expected:** After assign, member's My Assignments shows the location + Service X, and the member appears as selectable staff on web and mobile. After unassign, the member no longer appears in the staff picker for Service X (only `canPerform = true` staff are returned).

## Member profile

### 08.15 Member edits own profile, photo, and marketplace profile [Dashboard] [Web]
**Steps:**
1. As the member → `/my-account` → change first/last name + phone (`POST /team-member-account/profile`).
2. Upload a profile photo (`POST /team-member-account/upload-profile-image`); try an oversized file and a disallowed extension.
3. In `/my-profile`, save display name/professional title/about (`POST /team-member-account/marketplace-profile`).
4. As owner, check the member's card in `/team-members`; on web, open the listing's Team tab.
**Expected:** Profile update → `TEAM_MEMBER_ACCOUNT.S02`; photo → `S03` (bad size/type → 400 with size/type message). Marketplace profile → `S05`. New name/photo visible in the owner's team list and on the web business page Team tab. Email is NOT editable here (change-email flow only).

## Removal & offboarding

### 08.16 Remove a member with no linked data → becomes dashboard_user [Dashboard]
**Steps:**
1. Pick an active member with 0 locations, 0 services, 0 appointments (or unassign everything first).
2. Delete them (`DELETE /team-members/:id`).
3. Log in as the removed member.
4. Try removing a member who still has linked locations/services/appointments via plain DELETE.
**Expected:** Clean member → `canDelete: true`, `TEAM.S04`, removal notification email sent; user keeps their account as `dashboard_user` and login lands on `/my-profile` with `limitedAccess: true` (only My Profile/My Settings/Support). Linked member → `canDelete: false` + `TEAM.E15` with `locationsCount/servicesCount/appointmentsCount` (UI then routes through offboard).

### 08.17 Offboard a member with upcoming appointments [Dashboard] [Web]
**Steps:**
1. Ensure the member has ≥2 upcoming appointments; open their profile slider → Remove.
2. Review offboard preview (`GET /team-members/:id/offboard-preview`): appointments list + `eligibleStaffMap` + `orphanedAppointmentIds`.
3. Reassign one appointment to the eligible second member, cancel the other; submit `POST /team-members/:id/offboard` (body field is `appointmentActions`).
4. As the affected customer on web `/{locale}/appointments`, check both appointments.
5. Negative: submit a reassignment to the removed member themselves, then to a non-eligible staff; try the endpoints with the owner's own id.
**Expected:** `TEAM.S05`; member removed (role deleted, removal email), reassigned appointment shows new staff, the other is cancelled. Reassign-to-removed → `TEAM.E18`; ineligible/unavailable target → `TEAM.E19`. Note (verified 2026-07-23): `DELETE /team-members/:id` and `offboard-preview` accept the owner's own id — the owner is only protected by the linked-data guard (`TEAM.E15` + counts), no dedicated `TEAM.E16` fires on these paths.

### 08.18 Unassign a member from a single location [Dashboard]
**Steps:**
1. Member assigned to 2 locations with upcoming appointments at Location 1.
2. Owner → unassign from Location 1 → preview (`GET /team-members/:userId/unassign-location/:locationId/preview`) shows only Location 1 appointments.
3. Provide an action for every listed appointment; submit `POST /team-members/:userId/unassign-location/:locationId`.
4. Retry once with one appointment's action omitted.
**Expected:** `TEAM.S06`; member STAYS in the team but loses Location 1 services + location link; Location 2 assignments intact. Missing action → 409 `TEAM.E17`; duplicate/unrelated appointment actions → 400 `TEAM.E17`.

### 08.19 Member leaves the organisation themselves [Dashboard]
**Steps:**
1. As a member with an upcoming (pending/confirmed) appointment → `/my-account` → Leave organisation (`POST /auth/account/leave-organisation`).
2. Cancel/complete the appointments, then leave again.
3. Check owner notifications and the member's next login.
**Expected:** With active appointments → 400 `ACCOUNT.E05`, code `has_active_appointments` (count in details). After clearing → `ACCOUNT.S05`; owner gets `TEAM_MEMBER_LEFT_ORGANISATION` notification; member receives leave-confirmation email and becomes `dashboard_user` on next login.

### 08.21 Seat-overflow reconciliation gate force-opens after a seat decrease [Dashboard]
**Steps:**
1. As owner with active seats = active/pending members, schedule a seat decrease that takes effect below current `usedSeats` (or otherwise get `usedSeats > paidTeamSeats`).
2. Log in as owner and navigate across dashboard routes (`/dashboard`, `/team-members`, `/calendar`, etc.).
3. Navigate to `/account`, `/support`, `/my-profile`, `/my-account`.
4. From the gate, pick a member and offboard via the bulk preview (reassign one appointment, cancel another), OR go to billing and buy more seats.
5. Log in as an active team member and browse the dashboard.
**Expected:** Modal force-opens undismissable (no Esc/outside-close) on every route except the 4 exempt paths, where it's hidden so the owner can act. Bulk offboard / SeatPayBranch purchase resolves the overflow and the gate stops reopening once `usedSeats <= paidTeamSeats`; team members never see the gate (owner-only check).

## Multi-business membership

### 08.20 One person in two businesses — selection and switching [Dashboard]
**Steps:**
1. Have Business A and Business B both hold the same email as active team member (or owner+member per 08.5).
2. Log in → observe HTTP 300 `business_selection_required` (`AUTH.E17`) with `selectionToken` + businesses array → BusinessSelectorModal.
3. Pick Business A (`POST /auth/select-business`); verify Calendar, `/my-assignments`, Customers show only Business A data.
4. Log out, log in again, pick Business B; re-verify scoping.
5. Replay `select-business` with the used/expired selectionToken or a businessId the user lacks.
**Expected:** Token is scoped to the selected business (role per business — owner UI in B, team-member UI in A). Data fully isolated per selection; switching requires logout + re-login (no in-app switcher). Reused/invalid selection token → 400 "Invalid or expired selection token."; inaccessible businessId → 403.
