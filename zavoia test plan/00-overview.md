# Zavoia Test Plan — Overview

Manual QA plan covering **admin-dashboard** (business app), **zavoia-web** (marketplace web), **marketplace-app** (mobile, Expo), **admin-crm** (internal), and **admin-api**. 345 scenarios across 17 files. Every scenario was written and fact-checked against the actual code (routes, error codes, enums quoted from source).

## Files

| # | File | Scenarios | Area |
|---|------|-----------|------|
| 01 | [registration-and-auth](01-registration-and-auth.md) | 22 | Register/login all apps, Google, multi-role accounts, password reset |
| 02 | [subscription-and-plans](02-subscription-and-plans.md) | 22 | Trial, Standard/Plus tiers, seats, LTD, entitlement enforcement |
| 03 | [payments-and-billing](03-payments-and-billing.md) | 20 | Stripe checkout, regional pricing, webhooks, Oblio invoices |
| 04 | [calendar-and-appointments](04-calendar-and-appointments.md) | 30 | Full appointment lifecycle, conflicts, blocks, schedules, timezones |
| 05 | [customer-booking-flow](05-customer-booking-flow.md) | 20 | Web 3-step drawer + mobile booking, rebook, cancel |
| 06 | [marketplace-page-management](06-marketplace-page-management.md) | 20 | Listing content, tags, staff visibility, propagation to web/mobile |
| 07 | [website-builder](07-website-builder.md) | 20 | Tier gating, variant catalog/cart, one-session checkout, publish |
| 08 | [team-management](08-team-management.md) | 21 | Invites (all email cases), roles, seat overflow gate, offboarding |
| 09 | [onboarding-and-business-setup](09-onboarding-and-business-setup.md) | 20 | Setup wizard, locations, services, categories, bundles, hours |
| 10 | [reviews-and-ratings](10-reviews-and-ratings.md) | 20 | Business reviews, aggregates, CRM moderation, platform reviews |
| 11 | [notifications-push-sms-email](11-notifications-push-sms-email.md) | 20 | Event → channel matrix, mobile push, inbox, preferences, locale |
| 12 | [support-and-tickets](12-support-and-tickets.md) | 20 | Tickets from every app, guest tickets, CRM replies |
| 13 | [search-and-discovery](13-search-and-discovery.md) | 21 | Search, bilingual tags, map, favorites, recents, SEO landing pages |
| 14 | [clients-and-customer-management](14-clients-and-customer-management.md) | 20 | Client list, manual vs marketplace clients, myCustomers scoping |
| 15 | [crm-internal-tools](15-crm-internal-tools.md) | 12 | CRM login, businesses, plans, industries, tokens, email-test |
| 16 | [dashboard-home-and-analytics](16-dashboard-home-and-analytics.md) | 20 | Home widgets: counts, revenue, capacity, open/closed state |
| 17 | [account-deletion](17-account-deletion.md) | 17 | Customer/owner/member self-deletion, orphan purge, blockers |

## Test accounts to prepare

Multi-role scenarios (file 01, 08, 17) need these upfront — use distinct inboxes you can read:

| ID | Roles | Notes |
|----|-------|-------|
| A | Customer only | Registered on web or mobile |
| B | Business owner only | Fresh business, in trial |
| C | Owner + customer, same email | Tests role linking/switching |
| D | Team member + customer, same email | Invited into business B |
| E | Owner of 2 businesses | Tests business switcher |
| F | Customer + team member + owner | The full multi-role case |
| G | Google-only customer | No password set (E38 scenarios) |
| — | Guest (no account) | Guest tickets, public browsing |
| — | CRM staff account | admin-crm login |

Plus one business each in: trial, active Standard, active Plus, expired trial, LTD (CRM `isLtd` toggle), and one non-RO country business (regional pricing).

## Environment prep

- **admin-api**: run `migration:run` and re-run seeds. Migrations that MUST be applied or whole files fail: trialing/paused subscription-status enum (file 02), `AddUserHiddenFromMarketplace` (file 06), `DropLocationIsRemote` (file 09 — deploy api + dashboard together), `User.locale`, industry taxonomy `nameRo` seed (file 13).
- **Stripe test mode** with CLI forwarding to `POST /billing/webhook`. Subscribed events must include `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `customer.subscription.updated/deleted` — the first two refund/async ones were flagged as missing from the deployed webhook config.
- **Oblio** test credentials wired, or invoice scenarios in 03/07 will silently no-op.
- **Email capture** (staging inbox/Mailhog) — registration, invites, guest-ticket replies, and reset flows are all email-driven.
- **Mobile**: real dev build (not Expo Go) for push scenarios in file 11; the WSL repo lives at `D:\programming\marketplace-app`.
- Uncommitted-at-time-of-writing features (platform reviews, guest tickets, marketplace opt-out, variant cart) must be deployed to the test environment before their files run.

## Suggested execution order

1. **Foundation:** 01 → 09 (accounts + a fully set-up business feed everything else)
2. **Money:** 02 → 03 → 07
3. **Core product:** 04 → 05 (the critical pair — test together, dashboard + customer side)
4. **Presence:** 06 → 13 → 16
5. **People:** 08 → 14 → 10
6. **Plumbing:** 11 → 12 → 15 → 17

## Cross-cutting checks (apply everywhere)

- **Locale:** web EN routes are unprefixed (`/ro/` keeps prefix, `/en/...` 308-redirects); emails/SMS/push should match recipient locale.
- **Timezones:** business timezone wins over browser timezone for all slot/appointment display.
- **Links:** business detail links use the location slug or numeric id — a business UUID 404s.
- **Entitlements:** blocked writes return HTTP **402 `subscription_required`**, not 403.
- **Rate limits:** login 5/15min per IP+user (429 on 6th), register 3/hour per IP.
- `averageRating` arrives as a **numeric string** — check every rating display for `.toFixed` crashes.

## Known quirks & suspected gaps (found while authoring — verify, likely bugs)

1. **Auto-confirmed marketplace bookings send no confirmation** to the customer (email/SMS/push) — `sendConfirmationNotification` only fires on a PENDING→CONFIRMED transition from the dashboard; with `autoConfirmBookings=true` (default) customers get only the later reminder.
2. **Mobile push may be unreachable:** `initializePushNotifications`/permission request is exported but has no call site in the app UI.
3. **Web notification bell is a stub** (`notif-panel.tsx` — TODO phase2, inbox not wired).
4. **Review API doesn't check appointment status server-side** — a direct `POST /marketplace/customer/reviews` can review a cancelled/no-show appointment; only the UI gates it.
5. **Web review "edit" affordance is dead** — no update endpoint; resubmit returns 400 "A review for this appointment already exists".
6. **CRM `email-test` endpoints have the auth guard commented out** — callable unauthenticated.
7. **CRM login rate-limit guard is commented out.**
8. **Dashboard terms checkbox is client-side only** — the register API accepts requests without it.
9. **Published builder sites have no public render surface yet** — `zavoia.com/b/{slug}` is display-only/"future"; only the marketplace location page is verifiable.
10. **SMS templates are English-only** (hardcoded en-US strings).
11. **Platform-review UIs are not built** in any app (API-level only; CRM reviews page is a placeholder).
12. **CRM industry popups don't expose `nameRo`** — RO names manageable only via seed/API despite bilingual search relying on them.
