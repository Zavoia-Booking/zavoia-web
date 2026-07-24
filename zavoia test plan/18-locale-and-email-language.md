# 18. Locale & Email Language — Test Scenarios

> **QA 2026-07-24 — MECHANISM IS DEPLOYED** (admin-api 7ced520 + zavoia-web 6684f72, live ~11:00; the header note above is now historical): x-locale transport found in the deployed web bundle (18.1 ✓); guest tickets accept ro/RO/fr/absent without 400s (18.2 ✓ API-side); forgot-password chain exercised live (18.8/18.9 — body-ro, body-en, header-only-ro, nothing → expected RO/EN/RO/EN emails to +51, human to confirm); dashboard header-less flows unchanged (18.13 ✓). **BLOCKED: all fresh-registration email evidence (18.3/18.4/18.5) — EMAIL_ALLOWLIST only delivers to +50/+51/base which are already registered; allowlist a +7x range to unlock.** 18.10 rate-limited (E08) this run; 18.11 skipped (would risk fixture email). Google/mobile/CRM branches blocked as usual.

**Covers:** [Web] [Mobile] [CRM]

> **Context (mechanism shipped 2026-07-24, uncommitted):** zavoia-web now sends the active UI language on **every** API call as the `x-locale: en|ro` header (read from `<html lang>`, pathname fallback; client-side only). admin-api reads it via the `@RequestLocale()` decorator and uses it as a fallback wherever a transactional email is sent or a user is created. Resolution order everywhere: **explicit body `locale` → `x-locale` header → persisted `user.locale` / derived business country → `en`**. Register (email + both Google flows) now persists the locale on the User row. Deploy **zavoia-web + admin-api together** before running this file (either alone is non-breaking but the bug stays).

**Preconditions:**
- Inbox access for all test emails; use plus-addressing (`you+ro1@…`) — registration scenarios burn addresses.
- Browser devtools (Network tab) and curl/Postman for the API-level cases.
- One **legacy** customer account created before this deploy (its `user.locale` is `'en'` regardless of how it registered; Google users from before have `NULL`).
- DB read access (`SELECT locale FROM "user" WHERE email = …`) is the fastest persistence check; where unavailable, use the downstream-email checks given per scenario.
- Register rate limit applies per IP — space out the registration scenarios or rotate IPs.

## Transport mechanism

### 18.1 `x-locale` header rides on every web API call [Web]
**Steps:**
1. Open the site on the RO locale (`/ro/...`), devtools Network open.
2. Browse: search, open a listing, log in, load `/marketplace/auth/me` — inspect several XHRs to the API.
3. Switch the language to EN via the site switcher (client-side nav) and repeat.
4. Register a fresh account from the RO UI; inspect the `POST /marketplace/auth/register` request.
**Expected:** Every `apiFetch` request carries `x-locale: ro` in step 2 and `x-locale: en` after the switch — including the retry after an expired-token 401 (only the dedicated token-refresh POST is exempt; it never sends email). The register request additionally carries `"locale": "ro"` in the **body** — the field that gets persisted. Header keeps tracking `<html lang>` after client-side language switches without a full reload.

### 18.2 Header validation: invalid values ignored, case-insensitive, absence safe (curl)
**Steps:**
1. `POST /marketplace/public/support/tickets` (guest ticket — unauthenticated, cheap probe) with body `{email, message, category:'bug'}` and **no** `locale` in the body, four times: (a) `x-locale: ro`, (b) `x-locale: RO`, (c) `x-locale: fr` (also try garbage/array values), (d) no header at all.
2. Check each confirmation email + the stored ticket (`details.guest.locale` in CRM).
**Expected:** (a) and (b) → Romanian confirmation, `details.guest.locale: 'ro'` (value is lowercased before validation). (c) and (d) → English, `'en'` — anything other than `en`/`ro` resolves to undefined and falls through, never a 400. Stay under the guest-ticket rate limit (counts successes only).

## Registration & verification email

### 18.3 RO registration → Romanian verification email [Web]
**Steps:**
1. Register a fresh account from the RO UI (`/{locale}/register`, locale = ro).
2. Open the verification email.
3. Click the link; complete verification.
**Expected:** Email subject + body in Romanian; link is `{MARKETPLACE_FRONTEND_URL}/ro/auth/verify-email?token=...` and lands on the RO verify page. `user.locale` persisted as `'ro'` (DB check). This was the originally reported bug — RO register must no longer produce an English email.

### 18.4 EN registration → `/en/` link survives the unprefix redirect [Web]
**Steps:**
1. Register a fresh account from the EN UI.
2. Open the verification email; inspect the link href before clicking.
3. Click it and watch the network: the web app 308-redirects `/en/...` to the unprefixed path.
**Expected:** Email in English with link `{MARKETPLACE_FRONTEND_URL}/en/auth/verify-email?token=...`; `src/proxy.ts` redirects it to `/auth/verify-email?token=...` with the **token query intact**, and verification succeeds. `user.locale` = `'en'`.

### 18.5 Precedence: body `locale` beats header; nothing at all → EN (curl)
**Steps:**
1. `POST /marketplace/auth/register` with body `locale: 'en'` **and** header `x-locale: ro` (fresh email).
2. `POST /marketplace/auth/register` with neither body `locale` nor `x-locale` header (fresh email — simulates the current native app and any pre-deploy web bundle).
**Expected:** Step 1 → English verification email, `user.locale` = `'en'` (explicit body always wins over transport). Step 2 → English email, `user.locale` = `'en'` (universal EN fallback — never assume RO). Both register successfully; the header/field are strictly optional.

## Google sign-up

### 18.6 Google sign-up on the RO web persists `locale: 'ro'` [Web]
**Steps:**
1. From the RO UI, sign up with a Google account whose email has no Zavoia account (`POST /marketplace/auth/google/web`).
2. DB-check the new row.
3. Repeat from the EN UI with a second fresh Google account.
**Expected:** RO signup → `user.locale` = `'ro'`; EN signup → `'en'`. Before this change Google users were created with **no** locale at all — every later `resolveUserLocale` email fell through to English. No verification email is sent (Google emails arrive pre-verified) — the persisted locale is the observable, and it drives all future transactional emails (e.g. 18.9).

### 18.7 Google sign-up from the native app → EN (known limitation) [Mobile]
**Steps:**
1. In the marketplace mobile app, sign up with a fresh Google account (`POST /marketplace/auth/google` with idToken — the app sends no `x-locale` header).
**Expected:** Signup works unchanged; `user.locale` = `'en'` (fallback). This is a **documented open item**, not a bug: RO mobile users get EN transactional emails until the app is updated to send its UI locale (header or body). Log it as expected-fail if product wants RO here.

## Password reset

### 18.8 Forgot password follows the CURRENT UI language, not the stale persisted one [Web]
**Steps:**
1. Use the **legacy** account (persisted `locale: 'en'` from before the deploy).
2. From the **RO** UI, request a password reset (`POST /marketplace/auth/forgot-password` — web sends the UI locale in the body).
3. Open the email; follow the link; complete the reset.
4. Repeat from the EN UI.
**Expected:** Step 2/3 → Romanian email, link `/ro/auth/reset-password?token=...`, RO reset page. Step 4 → English. The language the user is looking at when they ask always wins (body locale, order body → header → persisted).

### 18.9 Forgot password with no client locale → persisted locale drives (curl)
**Steps:**
1. Take the account registered in 18.3 (`user.locale` = `'ro'`).
2. `POST /marketplace/auth/forgot-password` with body `{email}` only, **no** `x-locale` header (simulates native app / third-party client).
**Expected:** Romanian reset email with `/ro/auth/reset-password?token=...` link — resolution falls through body (absent) → header (absent) → **persisted `user.locale`**. This is the payoff of persisting at register: locale-less clients still get correctly localized emails. Response is the neutral no-enumeration message either way.

## Enable-marketplace-access link

### 18.10 send-account-link email localizes to the requesting UI [Web]
**Steps:**
1. Trigger the enable-access flow from the **RO** UI with a business-only email (owner/team-member without CUSTOMER role) — the panel calls `POST /marketplace/auth/send-account-link`.
2. Open the email; follow the link.
**Expected:** Romanian email; link `{MARKETPLACE_FRONTEND_URL}/ro/auth/verify-account-link?token=...` landing on the RO page. Response stays the neutral `CUSTOMER_AUTH.S06` regardless. (Business owners typically have no `user.locale` set for marketplace purposes — the header/body is what saves this flow from `resolveUserLocale`'s business-country fallback.)

## Change email

### 18.11 Change-email security notifications follow the live UI language [Web]
**Steps:**
1. Log in as the **legacy** EN-persisted account; switch the UI to RO **mid-session** (client-side, no reload).
2. In My Account, change the account email (`POST /marketplace/auth/change-email`).
3. Check both inboxes: the alert to the **old** address and the notification to the **new** address.
**Expected:** Both emails (`sendEmailChangedAlert` + `sendEmailChangeNotification`) arrive in **Romanian** — on this endpoint the `x-locale` header deliberately beats the stale persisted `'en'` (`requestLocale ?? deriveLocale(user.locale)`). This also proves the header tracks `<html lang>` across an in-session language switch.

## Guest tickets & CRM replies

### 18.12 Guest ticket locale sticks to the ticket and localizes CRM replies [Web] [CRM]
**Steps:**
1. From the RO `/help` "Report an issue" modal, submit a guest ticket.
2. Check the confirmation email; in CRM, open the ticket and confirm `details.guest.locale`.
3. As a CRM agent, reply to the ticket; check the guest's inbox.
4. Repeat via curl with no body `locale` but `x-locale: ro` (header-fallback path — same expectations).
**Expected:** Confirmation email in Romanian; `details.guest.locale: 'ro'` stored on the ticket. The CRM reply email to the guest is also Romanian — replies read the **stored** guest locale (`guest.locale ?? 'en'`), so the language captured at creation follows the whole thread. Extends 12.x guest coverage with the language dimension.

## Regression — clients that don't send the header

### 18.13 Dashboard and pre-deploy clients behave exactly as before [Dashboard] [Mobile]
**Steps:**
1. Run a quick pass of owner email flows from admin-dashboard (register-business-owner, forgot password, an appointment email) — the dashboard sends no `x-locale`.
2. From the current (not-yet-updated) mobile marketplace app: register, forgot password.
**Expected:** Zero behavior change anywhere: the header is optional at every endpoint, `@RequestLocale()` resolves to undefined and the pre-existing chain (persisted locale → business `deriveLocale(countryCode)` → `en`) applies untouched. Dashboard/business emails still localize by business country exactly as file 11 describes. No 400s, no CORS preflight failures (the API reflects requested headers).
