# Legal, privacy and cookies audit — pre-launch

**Date:** 12 November 2026 · **State:** before launch, nothing public · **Nature:** read-only audit. No code and no legal text was changed.

## How to read this

Four things were compared with each other:

1. The 12 legal documents in `zavoia-web/src/data/legal/` (English and Romanian).
2. What the product actually does where a document makes a claim: the website, the API, the business app and the mobile app.
3. What the law requires, read from the source texts.
4. What comparable platforms publish.

**Evidence rules.** Every statement about the product names the file I read. Every statement about the law names a text I fetched during this audit (appendix). Where I found only secondary sources, the text says so. Anything I could not verify is listed in section 10 instead of being assumed.

**Trees read:** zavoia-web `staging` with uncommitted changes (it was being edited while I worked, so dictionary line numbers may have moved); admin-api `staging` d3ae351; admin-dashboard `staging` 6b2c8d96 with 87 uncommitted files; marketplace-app `main` 73e1f0e.

**Earlier work this builds on:** the August 2026 blueprint, launch checklist, decisions document and capabilities audit in `admin-dashboard/docs/ZAVOIA_*.md`. Their gate numbers (D1–D17) are reused here.

This is an engineering audit of alignment, not legal advice. The questions that need a Romanian lawyer are named in section 9.

**Status codes used in the tables**

| Code | Meaning |
|---|---|
| OK | Aligned. Nothing to do. |
| TEXT | The wording is inaccurate or incomplete. Fix the text; no decision needed. |
| FILL | A placeholder waiting for a fact or a decision from you. |
| BUILD | The text describes something the product does not do. Build it or reword. |
| COUNSEL | A legal classification is open. |
| STALE | An internal drafting note no longer matches the code. |

---

## 1. Where we stand

**The set.** 12 documents, 107 sections, 28 unfilled `[placeholders]`, 47 internal drafting notes. English and Romanian are in parity. Every document is `status: "draft"`.

**Public exposure today: none.** `www.zavoia.com` serves only the coming-soon page: no cookies, no trackers, no links, and `/terms` returns 404. Staging is behind Vercel sign-in.

**The legal reasoning in the drafts holds up.** I checked about 35 citations against the source texts. All are right in substance. Four need rewording: two put a requirement under the wrong law or quote it incompletely, one overstates a provision, and one treats as open a question the text already answers (section 6).

**The problem is alignment between the documents and the product, in three directions.**

- *Documents promise what the product does not do.* Recording the accepted version of the terms; explicit acceptance of team invitations; business identity on listings; identity checks on businesses; review replies; a three-month review window; a named content-report route; reasons sent when content is removed; export and deletion at the end of a business contract.
- *The product does what the documents do not describe.* Google Analytics behind the banner; the web and API hosting providers; automatic IP geolocation on the home page; six browser-storage keys; a tax-reporting ledger that already records data; an optional personal ID number and date of birth for business owners; account deletion that erases bookings and reviews outright.
- *The drafting notes are stale.* Several notes dated 1 August say something "does not exist" that has since been built: the cookie banner, a terms-accepted timestamp, the checkbox gate on Google sign-up, and the in-app legal page.

**The sign-up screens do not present the documents the documents say are accepted.** Each of the three apps links a different set, and the Business Terms, Account Terms, Provider Terms and the data-processing addendum are not linked from any app (section 5).

**Compared with peers the set is at the heavy end.** Fresha publishes 8 documents, Treatwell about 10, Planity 4, and Booksy and the Romanian platform MERO 2–3 each on their consumer sites (section 7). Nothing forces you to cut documents, but nothing forces you to launch with 12 either.

---

## 2. The plan

Ordered by dependency. Items in 2.1 need no decision and can start now.

### 2.1 Fix now — no decision needed

| # | What | Where |
|---|---|---|
| 1 | **Stop showing internal notes to visitors and keep drafts out of search.** Every `note` block renders for every visitor, and the hub plus all 12 documents are in the sitemap with no `noindex`. The notes include admissions of gaps and a remark about a competitor. | `src/app/[locale]/terms/[document]/page.tsx:63`; `src/app/sitemap.ts:178` |
| 2 | **Rewrite the banner copy (EN and RO).** It reads "By using this website, you agree to our cookie policy". The mechanism is a real opt-in, so the sentence is false, and it never says what Accept switches on. Say that Accept allows Google Analytics measurement and that Reject keeps the site fully working. | `consent.body` in `src/i18n/dictionaries/en.ts` and `ro.ts` |
| 3 | **Rewrite the cookie notice to match the code.** Sections 2, 4 and 5 are wrong today; the tables can be filled from section 4 of this report. | `src/data/legal/cookie-policy.ts` |
| 4 | **Correct the privacy notice where the facts are already known** (section 3.2): analytics relies on consent; add Google Analytics and the hosting providers; fix the two IP-location sentences; add the three missing GDPR items; list what is collected from business owners. | `src/data/legal/privacy-policy.ts` |
| 5 | **Remove claims that are not true yet** until they are built: "identity-checked" in the help centre; "every listing shows the identity of the business"; "you may reply to reviews"; the `[3 months]` review window. | section 3, rows marked BUILD or TEXT |
| 6 | **Align the three ranking descriptions with the code** (text in section 3.6). | `customer-terms.ts`, `provider-terms.ts`, `privacy-policy.ts` |
| 7 | **Fix four legal attributions** (section 6). | `company-info.ts`, `provider-terms.ts`, `terms-of-use.ts` |
| 8 | **Update the stale notes** so the gate list is trustworthy again (section 3, rows marked STALE). | six files |
| 9 | **Turn off the map library's optional performance telemetry**: pass `performanceMetricsCollection={false}` to the map. It defaults to on. | `src/components/search/mapbox-surface.tsx:848` |
| 10 | **Two small additions to the data-processing addendum** that GDPR art. 28(3)(a) and 28(4) expect: instructions cover international transfers, and Zavoia stays liable for its sub-processors. | `src/data/legal/dpa.ts` |

### 2.2 Needs a fact or a decision from you

| # | Question | Why it matters |
|---|---|---|
| A | **Company identity** (gate D1): legal name, legal form, registered office, trade-register number, CUI, share capital; a contact email, a privacy email and a phone number. | Fills 9 placeholders in 4 documents. Law 365/2002 art. 5 and Law 31/1990 art. 74 require these on the company's website. |
| B | **Where the data lives.** Which provider and region host the Postgres database and the API. The API deploys to Google Cloud Run (`admin-api/cloudbuild.deploy.yaml`), the web app is on Vercel, and neither is in the vendor list. | GDPR art. 13(1)(e)–(f): recipients and transfers. |
| C | **Who accepts what, and where** (section 5). Either implement the model the drafts describe, or reduce the number of documents. | Today no surface matches the drafts. |
| D | **What account deletion should do.** Today it hard-deletes the customer's bookings and reviews, and also the business's appointment rows and its linked client record. A user who also holds a business role gets nothing deleted. Tax-ledger rows always stay. | The drafts call this "decision pending". The code already decided, and it contradicts the role model in the privacy notice and the addendum. |
| E | **Retention periods** for the privacy notice, and the post-termination window for business data. No scheduled deletion exists in the API today. | GDPR art. 13(2)(a) and art. 28(3)(g). |
| F | **Traders only, or individuals too?** The provider terms say registered businesses only. The code has a `natural_person` billing type with an optional personal ID number (CNP), and the August decision was "never collect CNP". | Three documents and one data model disagree. |
| G | **Keep the tax ledger running before the tax memo?** It already stores seller identity (owner name and email, date of birth) and per-appointment activity, and survives account deletion. | If it stays on, the privacy notice must describe it now. |
| H | **The small placeholders:** minimum age `[16/18]`; review window; appeal window `[14 days]`; price-change notice `[30]`; invoice-dispute `[10]`; the prohibited-services list; the provider-complaints contact; the content-report address. | Each blocks one section. |
| I | **Recent searches and recently viewed.** Describe them honestly as on-by-default convenience storage, or write them only after consent. | The cookie notice currently says only strictly necessary storage is active before consent. That is not true (section 4.3). |

### 2.3 Needs building

| # | What | Evidence that it is missing |
|---|---|---|
| 1 | **Acceptance that matches the documents:** the right documents on each surface; the accepted version, language and surface recorded; explicit acceptance for invitations, for the customer role and for new Google users on the sign-in tab; Business Terms at workspace creation; Provider Terms at listing activation. | Section 5. |
| 2 | **Marketing preferences default to off**, with a migration for existing rows. | `admin-api/src/entities/user.entity.ts:240-247` default `true`. Nothing sends marketing yet. |
| 3 | **A way to reopen cookie settings where the footer is hidden**, and legal links on business microsites. | Footer suppressed on `/search`, microsites, `/try`, `/web-studio/demo` (`conditional-footer.tsx:18`). Microsite footers carry contact, social and section links plus "© name · powered by Zavoia", and no privacy, cookie or terms link (`features/website/.../sections/footer/`). The platform banner and analytics gate do run on microsites, because both sit in the root layout. |
| 4 | **"How results are ordered" reachable from the results page, and "how reviews are verified" reachable where reviews are shown.** | No such link or string exists in the web app. |
| 5 | **A content-report route and a reasons-and-appeal routine.** The cheapest route is to extend the existing help-centre form with a "report content" category that asks for the four things art. 16(2) lists (reason, link, name and email, good-faith statement), name it in the policy, and add message templates for decisions. | The help centre has a general "Report an issue" form that works without an account (`help/_components/report-issue.tsx`); its only categories are bug and question, and nothing links to it from a review or a listing. Hiding a review or blocking a listing in the back-office notifies nobody (`review-admin.service.ts:418`, `admin-crm.service.ts:598`). |
| 6 | **Export and deletion at the end of a business contract.** | Lapse = read-only forever (`subscription.guard.ts:80`); no bulk export. |
| 7 | **Depending on decision F:** business verification and a trader label, or removal of those sections. | No tax-authority call anywhere in the API. |
| 8 | **Depending on counsel's answer on the booking model:** booking copy. Success still reads "You're booked". | `booking.successTitle` in `en.ts`. |
| 9 | **A runtime check of the deployed build** for cookies set by hosting and CDN (gate D14). Code reading cannot see those. | — |

### 2.4 Needs counsel

Section 9 lists the narrow questions. Two are new since August: the EU Data Act's switching rules for the business subscription, and the consumer "withdrawal function" that applies from 19 June 2026.

### 2.5 At publication

Resolve every note, set `status: "published"` and `effectiveDate`, put the legal URLs back in the sitemap, run the runtime check, and have the Romanian text reviewed.

---

## 3. Line by line — the 12 documents

### 3.1 Website Terms of Use — `terms-of-use.ts` (11 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | who-we-are | FILL | Depends on the company page (decision A). |
| 2 | acceptance-and-changes | BUILD · STALE | Says "you accept these terms through an explicit action at registration, and we keep a record of the version you accepted". The web sign-up checkbox links the Customer Terms, not this document; the mobile and business sign-ups link this one. The server stores `termsAccepted` and a timestamp for every new account, including Google sign-ins, but no document and no version (`admin-api/src/entities/user.entity.ts:182-197`). The note saying the record "does not exist in code" and that Google "bypasses the checkbox" is out of date: all three register forms now gate Google on the checkbox. The remaining gap is the sign-in tab, where a new Google user is created after a passive notice only (`auth-tabs.tsx`, login branch). |
| 3 | accounts | BUILD | "Each role is governed by its own document, which is presented to you when the role is activated." Nothing is presented when a business user adds the customer role (`confirm-access-panel.tsx` has no legal text) or when a listing is activated. "We tell you why" on suspension has no tooling behind it. |
| 4 | age-requirements | FILL | `[16/18]` (gate D11). No age or date-of-birth check exists at registration, so the clause is declaratory. GDPR art. 8(1) sets 16 unless national law lowers it. The note attributes 16 to Law 190/2018; I could not confirm that attribution. |
| 5 | acceptable-use | OK | — |
| 6 | user-content | OK | — |
| 7 | intellectual-property | OK | — |
| 8 | third-party-links | OK | — |
| 9 | disclaimers-liability | OK | — |
| 10 | governing-law | OK | Romanian law, consumer protections preserved, Romanian text prevails. No change. |
| 11 | contact-complaints | OK | The ANPC and SAL references match the current rule (section 8). |

### 3.2 Privacy Notice — `privacy-policy.ts` (13 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | controller-contact | FILL | Company (A), privacy email, and the decision whether to appoint a data protection officer. GDPR art. 13(1)(a)–(b). |
| 2 | our-roles | TEXT (after decision D) | Says the business "is an independent controller of its copy" of a booking. Deleting a customer account deletes that copy too: the appointment rows and the linked client record (`account-deletion.service.ts`, `purgeUserRows`, lines 222 and 239). Text and code cannot both stand. |
| 3 | data-we-process | TEXT | (a) "approximate location if you use location-based search": IP location is looked up automatically on the home page whenever browser location is unavailable (`use-home-coords.ts:68` → `ipwho.is`). (b) Business users: the list omits billing identity (legal name, CUI, trade-register number, address) and, for individuals, the optional personal ID number and date of birth (`business.entity.ts:196-222`). (c) Add: data received from Google at sign-in (name, email, picture, Google account ID). The customer-account list itself matches the user record: name, email, phone, photo, date of birth and address are all real fields. |
| 4 | purposes-legal-bases | TEXT · FILL | Analytics: the placeholder should read "consent". The code already works that way and Law 506/2004 art. 4(5) requires it. Add the art. 13(2)(e) statement (which data is required to create an account or book, and what happens without it). Tax reporting is "deliberately not listed" while the ledger already runs (decision G). |
| 5 | health-related-bookings | COUNSEL | Gate D7. The sentence "notification and email content is being reviewed" describes unfinished internal work and cannot be published as is. |
| 6 | marketing | BUILD | "Only if you opted in." The three marketing flags default to `true` for every account (`user.entity.ts:240-247`) and show as on in account settings. No marketing sender exists yet, so nothing unlawful has been sent; flip the default before one is built. Law 365/2002 art. 6(1) requires prior express consent for commercial email. |
| 7 | ranking-profiling | TEXT | Align with the code (section 3.6). The automated-decision statement is fine. |
| 8 | sharing-vendors | TEXT · FILL | Missing: Google Analytics (after consent); the web host (Vercel); the API host (Google Cloud Run); the database host (decision B). "AWS" should say what it is used for: the code uses SES for email, and the S3 client talks to Cloudflare R2. The `ipwho.is` sentence says "used only to centre the map"; it also feeds the home-page "near you" lists. All other vendors named are present in the code. |
| 9 | international-transfers | OK | Meets art. 13(1)(f). The EU–US framework is in force; an appeal is pending (case C-703/25 P), so keeping the standard-clauses fallback in the sentence is right. |
| 10 | retention | FILL | Write what is true: I found no scheduled deletion job in the API; data is kept until the account is deleted; deletion is immediate and complete for the profile, bookings, reviews, favourites and tokens; the exceptions are in decision D. |
| 11 | your-rights | TEXT · FILL | GDPR art. 21(4) requires the right to object to be "presented clearly and separately from any other information". Give it its own paragraph. Fill the privacy email. "Use your account settings" is accurate for deletion; there is no export feature, so access and portability run by email. |
| 12 | complaints-authority | OK | The authority's address matches its own contact page. |
| 13 | changes | OK | — |
| + | (missing) | TEXT | Add a short "where we get your data" paragraph (art. 14): from Google at sign-in, and from a business that invites you to its team or records you as a client. |

### 3.3 Cookie & Storage Notice — `cookie-policy.ts` (6 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | what-we-use | OK | The framing is correct: ePrivacy art. 5(3) covers any storing of or access to information on the device. The runtime-audit note (D14) still applies to cookies set by hosting and CDN. |
| 2 | consent | TEXT · STALE | Says choices are "per category" and that "everything else loads only if you agree". The banner is a single Accept / Reject for analytics. The note says the banner "does not currently exist"; it does. Also true and worth stating: the "Cookie settings" control lives in the footer, and four route groups have no footer (build item 3). |
| 3 | strictly-necessary | FILL | Table rows are in section 4.1. "Load balancing and bot protection" can only be confirmed on the deployed site. |
| 4 | functional | TEXT | Names "language" as the example. That is true for the business app, which reads a stored language choice (`admin-dashboard/src/shared/lib/i18n.ts:176-179`); the consumer website keeps language in the URL and stores none. The functional keys the website does write are in section 4.1, and they are written without asking (decision I). |
| 5 | analytics | FILL | Name it: Google Analytics 4, loaded only after Accept (`analytics-gate.tsx:13`), cookies `_ga` and `_ga_<id>`, removed again on Reject (`ConsentProvider.tsx:46-60`). The Planet49 ruling requires the notice to state how long the cookies last and that a third party (Google) has access. |
| 6 | advertising | OK | "None" is accurate: no advertising or tracking SDK in the website, API, business app or mobile app. |
| + | (missing) | TEXT | The map library on `/search` writes its own entry to browser storage and sends usage events to its vendor (section 4.2). List it. |

### 3.4 Company Information — `company-info.ts` (3 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | identity | FILL · TEXT | Decision A. The note says Law 365/2002 art. 5 "makes each of them mandatory". Art. 5(1) covers name, registered office, contact details, trade-register number and tax code. Legal form and share capital come from Law 31/1990 art. 74(1), (3) and (5). VAT status is required by neither. |
| 2 | contact | FILL · TEXT | Art. 5(1)(c) lists "telephone numbers, fax, email address"; the section offers email only. Add a phone number, or have counsel confirm email is enough. Add the two contact points the Digital Services Act requires of every intermediary: one for authorities (art. 11) and one for users (art. 12), with the languages accepted. |
| 3 | consumer-protection | OK | Correct. The note can now be closed: the order was amended in 2026 and the EU platform reference removed (section 8). |

### 3.5 Reviews, Content & Moderation Policy — `content-policy.ts` (6 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | review-rules | BUILD · FILL | Completed-appointment rule: enforced (`customer.service.ts:102`). One review per appointment: enforced (`businessReview.entity.ts:17`). No editing: true. `[3 months]`: no time check exists. "Ask support to remove a review": manual. Worth adding: deleting your account removes your reviews. |
| 2 | review-verification | OK · BUILD | Accurate against the code, and it is the statement the unfair-practices rules require. It must also be reachable from where reviews are shown; today it is not. |
| 3 | prohibited-content | OK | — |
| 4 | moderation | OK | "Human review only" matches the code: the back-office can hide or show a review, and no automated filtering exists in the API. |
| 5 | reporting | FILL · BUILD | `[report channel]`. A general "Report an issue" form exists in the help centre and needs no account, but it has no content-report category and is not linked from reviews or listings. The four elements the draft lists for a useful report match art. 16(2) exactly. Art. 16 applies to every hosting service regardless of size. |
| 6 | decisions-appeals | FILL · BUILD | `[14 days]`. Promises reasons for every removal or restriction. The code sends none. Art. 17 applies regardless of size. The longer six-month complaint window of art. 20 applies only once you are no longer a micro or small enterprise. |

### 3.6 Marketplace Customer Terms — `customer-terms.ts` (13 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | roles | OK | "Zavoia never handles your money" is true: no payment step in the website or mobile app. |
| 2 | your-account | OK · BUILD | Free account, account required to book, deletion from settings: all true (web and mobile). "You will be asked to accept these terms" when the customer role is added: not built. |
| 3 | bookings | COUNSEL | Gate D3. The interface still says "Confirm appointment" and "You're booked", which the note itself says must change. |
| 4 | prices | OK | The price is stored with the booking (`appointment.entity.ts`, price snapshot). |
| 5 | providers | BUILD | "Every listing shows the identity of the business providing the services." Listings show the trading name only; the website consumes no legal-identity field. |
| 6 | ranking | TEXT | Code (`marketplace-public.service.ts:2219`): with a search term, name similarity first, then distance if a location is known, otherwise rating. Without a term: nearest first if a location is known, otherwise rating then newest. The home "in your city" list is a stable shuffle. Recency is not used for text searches; the shuffle is not mentioned. |
| 7 | cancellations | OK | The notice period is shown in the booking drawer before submit (`BookingDrawer.tsx:2516-2527`). |
| 8 | health-information | OK | Tied to gate D7. |
| 9 | reviews | OK | — |
| 10 | restrictions | BUILD (partly) | A "blocked" client status exists (`businessCustomer.entity.ts:110`); I did not trace whether it stops a booking. "We tell you the reasons and how to appeal" has no tooling. |
| 11 | liability | OK | — |
| 12 | complaints | OK | — |
| 13 | changes-law | OK | — |

### 3.7 Booking & Cancellation Policy — `booking-policy.ts` (5 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | how-booking-works | OK · COUNSEL | The review step and the pending and confirmed states exist. The copy issue is the same as 3.6 §3. |
| 2 | provider-policies | OK | Honest as written: the cancellation policy is not stored per booking; the price is. |
| 3 | cancelling | OK | — |
| 4 | no-shows | OK | A no-show status exists. No platform-level restriction mechanism was found; the sentence says "can", so it stands. |
| 5 | withdrawal-rights | COUNSEL | Gate D3. The note's "art. 11¹ withdrawal function" is real: the directive was transposed in Romania by OUG 18/2026 and applies from 19 June 2026. I confirmed the ordinance from one secondary source only and did not confirm the article number. |

### 3.8 Business Terms — `business-terms.ts` (12 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | parties-professional-use | BUILD | "The acceptance record captures which of the two applies." No such record exists. See decision F for individuals. |
| 2 | account-acceptance | BUILD · STALE | These terms are not linked or shown anywhere in the business app. The app's legal links cover three documents only: terms of use, cookies, privacy (`admin-dashboard/src/features/legal/legal-links.ts:10-14`). The note about Google bypassing the checkbox is out of date. |
| 3 | services-plans | OK | Standard, Plus and Custom match the code (`admin-api/src/types/plan.ts`). |
| 4 | billing | OK · FILL | The 14-day trial matches (`business.service.ts:53`). Stripe and the invoicing provider are integrated. `[30]` and `[10]` are open. |
| 5 | team-authorized-users | BUILD | "Each invitee accepts … through an explicit action." For an existing user, opening the link accepts and signs them in (`auth.controller.ts:1648`, `GET /check-team-invitation`). |
| 6 | content-ip | OK | — |
| 7 | data-protection | OK | — |
| 8 | suspension-termination | OK · FILL | Read-only after lapse is true (`subscription.guard.ts:80`). The retention window is open (decision E). |
| 9 | liability | COUNSEL | The cap needs professional drafting. |
| 10 | changes | OK | 15 days on a durable medium matches the platform-to-business regulation, art. 3(2). |
| 11 | general-provisions | OK | — |
| 12 | law | STALE | The note says the in-app legal screens are placeholder text. The in-app legal page now redirects to the public documents (`admin-dashboard/src/features/legal/pages/legal-page.tsx:19`). Law 365/2002 art. 8(3) lets businesses agree otherwise on the contracting formalities, so this is a contract-design choice, not a duty. |
| + | (missing) | COUNSEL | No clause on switching away or exporting data. See section 9, Data Act. |

### 3.9 Marketplace Provider Terms — `provider-terms.ts` (14 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | scope-acceptance | BUILD | "Binds when you activate a marketplace listing." Nothing is presented at activation; the business app never links this document. The regulation also wants the terms "easily available … including in the pre-contractual stage" (art. 3(1)(b)). |
| 2 | eligibility-verification | BUILD | None of the described verification exists. The API makes no call to the tax authority. See decision F. |
| 3 | listing-content | TEXT · BUILD | "Name and registration identity … an EU-law requirement (P2B art. 3(5))." Art. 3(5) requires that "the identity of the business user … is clearly visible". It does not mention registration data. Keep the commitment if you want it, but as your own policy. Today only the trading name is shown. |
| 4 | regulated-services | FILL | The prohibited-services list. |
| 5 | bookings-obligations | COUNSEL | Consistent with the recorded booking decision. |
| 6 | reviews | BUILD | "You may reply to reviews." No reply field or endpoint exists. |
| 7 | ranking | TEXT | Same alignment as 3.6 §6. Art. 5(1) also asks for "the reasons for the relative importance" of the parameters; add one sentence of reasons. |
| 8 | connected-records | OK | Interacts with decision D. |
| 9 | distribution-transparency | OK | Article references are correct (3(1)(d), 6, 7, 10). |
| 10 | tax-reporting | OK · COUNSEL | The description matches the directive. One nuance: the directive says to close the account or withhold payment after two reminders and 60 days; the draft says a listing "may be suspended". Gate D12. |
| 11 | restriction-suspension-termination | OK · BUILD | Matches art. 4. Blocking a listing in the back-office sends nothing to the business (`admin-crm.service.ts:598`). |
| 12 | changes | OK | — |
| 13 | data-access | OK · FILL | Matches art. 9 and art. 8(c). The retention window is open. |
| 14 | complaints-mediation | FILL | `[provider complaints contact]`. The small-enterprise exemption is stated correctly (art. 11(5), art. 12(7)); it needs the size evidence (gate D2). |

### 3.10 Account & Authorized User Terms — `account-terms.ts` (6 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | scope | OK | — |
| 2 | acceptance | BUILD | "Opening an invitation link alone never constitutes acceptance." The code does the opposite for existing users (see 3.8 §5). "We record the accepted version" is not true. The business sign-up links the Website Terms of Use, not this document. |
| 3 | account-security | OK | — |
| 4 | roles | BUILD | Role documents are not presented at role activation. |
| 5 | acceptable-use | OK | — |
| 6 | offboarding | OK | Consistent with the deletion code: an account that still holds another role is kept. I did not trace the team-removal path itself. |

### 3.11 Data Processing Addendum — `dpa.ts` (10 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | scope-roles | OK | — |
| 2 | processing-details | TEXT | Art. 28(3)(a): instructions cover transfers to third countries, and the processor tells the controller when a law forces processing. Add both. |
| 3 | special-categories | COUNSEL | Gate D7. It refers to safeguards "described in the security annex", which does not exist yet. |
| 4 | security | FILL | The annex. |
| 5 | subprocessors | FILL · TEXT | The `[link]`. Add the art. 28(4) sentence that Zavoia remains liable for its sub-processors. |
| 6 | breach-assistance | OK | — |
| 7 | transfers | OK | — |
| 8 | audit | COUNSEL (minor) | On-site audits only for cause and at the customer's cost is common in software contracts. Art. 28(3)(h) says the processor must "allow for and contribute to audits, including inspections". Counsel should confirm the limits. |
| 9 | deletion-return | BUILD | Art. 28(3)(g): "at the choice of the controller, deletes or returns all the personal data … after the end of the provision of services". The product keeps everything readable indefinitely and offers no export. This is the largest gap in the addendum. |
| 10 | liability | OK | — |
| + | — | BUILD | The addendum is never presented or accepted in the business app. A processing contract is required whenever Zavoia processes client records for a business (art. 28(3)). |

### 3.12 DAC7 — Platform Tax Reporting — `dac7.ts` (8 sections)

| § | Section | Status | Finding and action |
|---|---|---|---|
| 1 | what-is-dac7 | OK | The definition of "personal service" matches the directive word for word. |
| 2 | does-it-apply | COUNSEL | Gate D12. The reasoning matches the directive. The note names two competitors and calls one position "aggressive"; it must never be public (plan item 1). |
| 3 | thresholds | OK | Correct: the 30-sales and EUR 2,000 exclusion is for goods only. |
| 4 | what-is-reported | OK | For individuals the draft names the personal ID number. The code has an optional field for it, against the August "never collect" decision (decision F). |
| 5 | where-and-when | OK | 31 January matches the directive. The form number is confirmed by secondary sources only. |
| 6 | what-you-do | OK | Two reminders and 60 days matches the directive. |
| 7 | privacy | TEXT (after decision G) | Says the data "is collected because the law requires it" while applicability is still open and the ledger already records it. |
| 8 | questions | OK | — |

---

## 4. Cookie banner and storage — what the code does

### 4.1 Inventory (website and API)

| Kind | Name | Set by | Holds | Lifetime | Written before any consent? |
|---|---|---|---|---|---|
| Cookie | `zw-consent` | website | `granted` or `denied` | 12 months | Yes — it records the choice |
| Cookie | `customerRefreshToken` | API, HttpOnly | sign-in session | cookie 1 day, renewed; token valid 60 days | Only after sign-in |
| Cookie | `customerCsrfToken` | API, readable by the page | request-forgery token | 1 day | Only after sign-in |
| Cookie | `_ga`, `_ga_<id>` | Google Analytics | analytics identifiers | set by Google; not checked here | **No — only after Accept** |
| localStorage | `zw-recent-searches` | website | last 6 searches: text, category, place and date labels | until cleared | Yes, automatically |
| localStorage | `zw-recent-locations`, `zw-recent-locations-v` | website | last 5 places with coordinates | until overwritten | Yes, automatically |
| localStorage | `zw-recent-views` | website | recently viewed venue IDs | until overwritten | Yes, automatically |
| localStorage | `zv-loc-skip` | website | "not now" on the location prompt | permanent | After the user's click |
| localStorage | `zv.auth.lastDisplayName:v1` | website | first name, last name, photo URL | removed at sign-out | After sign-in |
| localStorage | `mc-anno-dismissed` | microsites | which announcement was dismissed | permanent | After the user's click |
| sessionStorage | `googleOAuth` | website | sign-in flow state | removed after the callback | After the user's click |
| localStorage | `mapbox.eventData…` | map library on `/search` | the vendor's anonymous event data | set by the library | Yes, when the map loads |

Sources: `src/lib/consent/ConsentProvider.tsx`, `src/lib/search/recents.ts`, `src/lib/recent-views.ts`, `src/lib/auth/session-store.ts`, `src/lib/auth/google-oauth.ts`, `src/app/[locale]/search/_components/search-content.tsx:98`, `admin-api/src/utils/constants.ts:76-82` and the cookie option blocks below them, `customer-auth.controller.ts:46-47`.

Other surfaces: the business app sets `refreshToken` and `csrfToken`, keeps sign-in flow keys in sessionStorage, `theme` and a language choice in localStorage, and loads no analytics. The back-office sets `crmRefreshToken` and `crmCsrfToken`. The mobile app has no analytics or advertising SDK.

Requests to third parties that store nothing: `ipwho.is` (IP location, automatic on the home page when browser location is unavailable), MapTiler (the place names typed into search), the content CDN and the image host.

### 4.2 What is right

- Google Analytics does not load, set cookies or send anything before Accept (`analytics-gate.tsx:13`). The one custom event is also gated (`pricing-signup-link.tsx:26`).
- Reject is on the first layer, the same size as Accept, and nothing is pre-selected.
- Reject after Accept stops further hits and deletes the analytics cookies.
- The footer "Cookie settings" control reopens the banner.

### 4.3 What needs to change

1. **The copy** (plan 2.1 item 2). Law 506/2004 art. 4(5)(b) requires clear and complete information, including the purpose, before consent. The banner states no purpose.
2. **The notice** (plan 2.1 item 3).
3. **Reaching the settings where there is no footer** (build item 3). GDPR art. 7(3): "It shall be as easy to withdraw as to give consent."
4. **The convenience storage** (decision I). The law exempts only storage "strictly necessary" for a service "explicitly requested" (Law 506/2004 art. 4(6)(b)). The dismissal flags and the sign-in state fit. Recent searches, recent places and recently viewed are written automatically and are harder to fit. The practical risk is low: the data never leaves the device and tracks nobody. My recommendation is to keep the feature and make the notice true: describe a "functional" group that is on by default and can be cleared, and drop the sentence that only strictly necessary storage is active. If you want no ambiguity, write these three keys only after consent. That is a judgment call, not a verified legal conclusion.
5. **The map library.** List it in the notice, and switch off its optional performance telemetry (plan 2.1 item 9).

---

## 5. Who accepts what, where

### 5.1 Today

| Surface | What the person sees | Documents linked | What is stored |
|---|---|---|---|
| Website — register (email or Google) | Required checkbox, not pre-ticked: "I agree to the Terms and Conditions, Cookie Policy and Privacy Policy" | Customer Terms, Cookie Notice, Privacy Notice | `termsAccepted = true` and a timestamp, set by the server. No document, no version. The request carries no acceptance field. |
| Website — sign in with Google, new person | "By continuing, you agree to our Terms and Conditions and Privacy Policy" | Customer Terms, Privacy Notice | Same stamp, although nothing was ticked |
| Website — business user adds the customer role | No legal text | None | — |
| Mobile app — register | Required checkbox | **Website Terms of Use**, Cookie Notice, Privacy Notice | Same stamp |
| Business app — register (email or Google) | Required checkbox | **Website Terms of Use**, Cookie Notice, Privacy Notice | Same stamp |
| Business app — sign in | "By continuing, you agree…" | Terms, Privacy | — |
| Team invitation, existing user | Opening the link accepts | None | Role activated |
| Workspace creation, listing activation | Nothing found | None | — |

Sources: `zavoia-web/src/app/[locale]/auth/_components/register-form.tsx` and `auth-tabs.tsx`; `marketplace-app/utils/legal-links.ts`; `admin-dashboard/src/features/legal/legal-links.ts` and `features/auth/components/register-form.tsx`; `admin-api/src/modules/marketplace/auth/customer-auth.service.ts:182-185`.

### 5.2 What the drafts say

Terms of Use and Account Terms at sign-up. Customer Terms when the customer role is enabled. Business Terms and the addendum at workspace creation. Provider Terms at listing activation. The privacy notice is shown, not accepted. The version is recorded every time.

### 5.3 Two further points

- **The label asks people to agree to the privacy and cookie notices.** The August drafting rule was the opposite: terms are accepted, the privacy notice is presented. Split the sentence: "I agree to the [terms]. I have read the [Privacy Notice]."
- **The documents the checkbox points at say "draft … not yet a binding agreement".** That is fine before launch and cannot stay at launch.

---

## 6. Legal citations in the drafts, checked against the source texts

| Draft claim | Verdict | Source read |
|---|---|---|
| Storing or reading anything on the device needs consent after clear information, unless strictly necessary; Romanian law has no analytics exemption | Correct | Law 506/2004 art. 4(5)–(6); ePrivacy Directive art. 5(3) |
| Browser settings are a complement; the banner is the mechanism | Correct and cautious. Art. 4(5¹) says browser settings *may* express consent; the GDPR consent standard is stricter. | Law 506/2004 art. 4(5¹) |
| Withdrawing consent must be as easy as giving it | Correct | GDPR art. 7(3) |
| The notice must give cookie lifetime and third-party access | Correct | CJEU C-673/17, operative part 3 |
| Law 365/2002 art. 5 makes legal name, trade-register number, CUI, VAT status, registered office and share capital mandatory | **Partly.** Name, office, contacts, register number and tax code: yes. Legal form and share capital: Law 31/1990 art. 74. VAT status: neither. | Law 365/2002 art. 5(1); Law 31/1990 art. 74 |
| Art. 5 lit. c) requires contact details "including email" | **Incomplete.** The text lists telephone numbers, fax and email. | Law 365/2002 art. 5(1)(c) |
| P2B art. 3(5): name *and registration identity* must stay visible | **Overstated.** "The identity of the business user … is clearly visible." | Regulation (EU) 2019/1150 art. 3(5) |
| 15 days' notice of changes on a durable medium; longer when adaptation is needed; right to terminate; exceptions for legal duty or imminent danger | Correct | art. 3(2), 3(4) |
| Reasons at the latest when a restriction takes effect; 30 days before terminating the whole service | Correct | art. 4(1)–(2) |
| Ranking: main parameters and their relative importance | Correct, and add the *reasons* for the relative importance | art. 5(1) |
| Complaint system and mediators depend on enterprise size | Correct | art. 11(5), art. 12(7) |
| The content policy must describe moderation, including human versus algorithmic review | Correct | Regulation (EU) 2022/2065 art. 14(1) |
| An easy, electronic notice mechanism is required | Correct, at any size | art. 16(1) |
| Reasons must be given for removals and restrictions | Correct, at any size | art. 17(1) |
| Whether trader traceability (art. 30) applies needs a classification by counsel | **Simpler than stated.** Art. 29(1) exempts micro and small enterprises from the whole section. The size evidence answers it. | art. 29(1) |
| Marketplaces must state whether the seller is a trader, the ranking parameters and how duties are split | Correct at EU level. The Romanian article number (6¹) appears in a legislation index; I did not read its text. | Directive 2011/83/EU art. 6a |
| Dated leisure services are exempt from withdrawal under letter (l) | Correct at EU level | art. 16(l) |
| An "art. 11¹ withdrawal function" exists | Correct in substance: new art. 11a, applicable from 19 June 2026, transposed by OUG 18/2026 (secondary source). Article number not confirmed. | Directive (EU) 2023/2673 |
| How reviews are verified must be stated accurately | Correct | Directive 2005/29/EC art. 7(6), Annex I points on reviews |
| DAC7: personal services include offline work arranged online; no minimum for services; payment-only, listing-only and redirect-only tools are excluded; "known or reasonably knowable"; two reminders and 60 days; 31 January | All correct | Directive (EU) 2021/514, Annex V |
| DAC7 transposed by OG 16/2023; form F7000 | Confirmed by secondary sources only (Big Four tax alerts) | — |
| The EU dispute-resolution platform is discontinued | Correct: repealed with effect from 20 July 2025 | Regulation (EU) 2024/3228 |
| The supervisory authority's address | Correct | dataprotection.ro contact page |
| A data protection officer may be mandatory if health-venue bookings are large-scale special-category processing | The legal test is quoted correctly. Whether it is met is gate D7. | GDPR art. 37(1)(c) |
| Digital-consent age is 16 "under Law 190/2018" | 16 is the GDPR default. The attribution to Law 190/2018 is not confirmed. | GDPR art. 8(1) |

**One requirement the drafts do not mention and the product does not meet.** When a site lets consumers search offers from different traders, the main ranking parameters must be available "in a specific section of the online interface that is directly and easily accessible from the page where the query results are presented", "irrespective of where transactions are ultimately concluded" (Directive 2005/29/EC art. 7(4a)). This applies whatever the answer on the booking model. The search page has no footer and no such link.

---

## 7. How comparable platforms handle it

Read from each company's own pages on 12 November 2026. Consent banners load by script and could not be observed this way; the consent tool is named only where the page source shows it.

| Platform | Documents published | Notes |
|---|---|---|
| **Fresha** | Terms of use; Terms of service; Partner terms; Privacy policy; Data protection; Cookies; Review policy; Partner referral programme | The review policy says moderation is automated, that the author is told what was done and that the decision was automated, and gives 7 days to challenge by email. |
| **Treatwell** | Terms and conditions; Privacy and cookie policy with a partner data-processing agreement; Booking terms; User-generated-content policy; Partner terms of business; Rewards and referral terms; a GDPR-requests page; a legal-queries page; a Digital Services Act page | Consent tool: OneTrust. States it is a controller for its own processing and a processor when a partner holds the data. Gives a retention period per purpose, for example five years of account inactivity. Acts as the partners' "commercial agent" in concluding bookings — a different model from yours. |
| **Booksy** | Terms of service; Privacy policy (consumer site footer) | — |
| **MERO** (Romania) | Terms and conditions; Privacy policy; Cookie policy | States it operates "exclusively as an intermediary". Company identified with trade-register number and CUI inside the terms. The privacy policy names Google Analytics, Amplitude and Facebook Pixel, on consent. |
| **Planity** (France) | Legal notice; Privacy policy; Cookie policy; Accessibility statement | Consent tool: Didomi. |

**What this shows.**

- Every peer publishes consumer terms, a privacy notice and a cookie notice. The larger ones add partner terms, a review or content policy and a processing agreement.
- None publishes a separate account-terms document or a separate DAC7 page on these pages.
- Naming analytics tools and giving retention periods per purpose is normal.
- Telling a review's author what was done and how to challenge it is something a peer already does in writing.
- A Romanian competitor launches with three documents. Your 12 can be kept, but a smaller launch set is defensible: consumer terms including the booking policy, business terms including account terms and the addendum, provider terms, privacy, cookies, content policy, company page.

---

## 8. Checked and fine — no action

- **Accept and Reject styled differently.** The data-protection authorities agreed that "a general banner standard concerning colour and/or contrast cannot be imposed"; it is judged case by case, and the example they call misleading is an unreadable alternative button. Yours is readable and the same size.
- **Accept / Reject without per-category toggles.** There is one non-essential purpose. Say so in the notice instead of "per category".
- **Asking again after 12 months.** No binding period exists in the texts I read.
- **No banner in the business app or the mobile app.** Neither loads analytics or advertising code.
- **No link to the EU dispute-resolution platform.** Correct since 20 July 2025.
- **The footer.** ANPC link plus the 250×50 SAL pictogram linking to `reclamatiisal.anpc.ro` matches the rule as amended in 2026 (ANPC's announcement, reported by two outlets).
- **The 15-day and 30-day notice periods** for businesses.
- **Trader traceability, transparency reports, the formal complaint system and the other platform-only duties** of the Digital Services Act: exempt while you are a micro or small enterprise (arts. 15(2), 19(1), 29(1)). This needs the size evidence, not a build.
- **The international-transfer wording.** The EU–US framework is in force; the appeal is pending.
- **The EU cookie reform ("Digital Omnibus").** Not adopted. Nothing changes now.
- **"The Romanian text prevails"** while English is the default language. I found no rule against it.
- **"Verified reviews"** in the business marketing copy matches the content policy, as long as the policy stays reachable.

---

## 9. Still open for counsel and owners

Unchanged from the August checklist; this audit did not close them: the booking-model opinion (D3); the free-account classification (D5); the health-data assessment and the officer decision (D7); traders-only (D8); the telecoms-regulator notification (D9); the services-directive information duties (D10); minimum age (D11); the tax memo (D12); accessibility (D13); enterprise-size evidence (D2); the liability cap; the Romanian language review.

**New since August**

1. **EU Data Act, switching between "data processing services"** (Regulation (EU) 2023/2854, chapter VI, in application since 12 September 2025). The definition is the cloud-computing one, the recitals name software-as-a-service, and the only exemptions in art. 31 are custom-built and test versions. Art. 25 requires the customer contract to set out switching and exit rights: a notice period of at most two months, a 30-day transition, export of data, and erasure afterwards. Several law firms read ordinary software subscriptions as in scope. A proposed relief for small providers covers only contracts signed before that date, and is not adopted. **Question:** does the business subscription fall under chapter VI, and what must the Business Terms say? It points the same way as build item 6.
2. **The withdrawal function** (new art. 11a of the Consumer Rights Directive, from 19 June 2026). It applies to distance contracts concluded through an online interface where a withdrawal right exists. **Question:** if the free account is a contract (D5), does "delete account" need to be presented as a withdrawal function?
3. **Law 365/2002 art. 5(1)(c)**: is a phone number required, or is email plus the help centre enough?
4. **The acceptance design for the liability cap and automatic renewal.** The August documents flag Romanian Civil Code rules on unusual clauses. I did not verify them.

---

## 10. Not verified in this audit

- Anything about a deployed build, including cookies set by hosting or the CDN.
- The mobile app's stored keys, and the map SDK's telemetry setting on mobile.
- Whether any mechanism exists to notify users of changed terms.
- The statements in the Business Terms about SMS credits and website-builder purchases.
- Whether a "blocked" client is actually prevented from booking.
- The content of emails, texts and push messages (relevant to D7).
- The back-office front-end and the older `marketplace` repository.
- Official texts of: Law 190/2018; OUG 34/2014 (article numbers 6¹ and 11¹); OUG 18/2026; the 2026 ANPC order; OG 16/2023; the Romanian Civil Code.
- The EDPB consent guidelines and the EDPB guidelines on the scope of art. 5(3): the files could not be parsed here. I relied on the EDPB banner report, which I did read, and on law-firm summaries.
- The quality of the Romanian legal wording.
- Whether a company exists yet. If it does, the live coming-soon page should already carry its identification (Law 31/1990 art. 74(5)).

**Two observations outside the documents.** `app.zavoia.com` and `staging-app.zavoia.com` answer publicly. The build served at `app.zavoia.com` contains "By clicking continue, you agree to our Terms of Service and Privacy Policy" with both links pointing to `#`; it is older than the local tree. If sign-up is reachable there, protect it the way staging is protected until the documents are live.

---

## Appendix — sources

**EU texts** (EU Publications Office, by CELEX number): GDPR 32016R0679 · ePrivacy Directive 02002L0058-20091219 · Platform-to-business Regulation 32019R1150 · Digital Services Act 32022R2065 · Consumer Rights Directive 02011L0083-20220528 · Directive (EU) 2023/2673 32023L2673 · Unfair Commercial Practices Directive 02005L0029-20220528 · DAC7 32021L0514 · Data Act 32023R2854 · Regulation (EU) 2024/3228 32024R3228 · CJEU C-673/17 Planet49 62017CJ0673. Each is at `https://publications.europa.eu/resource/celex/<number>`.

**Romanian texts**
- Law 365/2002 — https://legislatie.just.ro/Public/DetaliiDocumentAfis/77218
- Law 506/2004 — https://legislatie.just.ro/Public/DetaliiDocument/214211
- Law 31/1990 art. 74 (unofficial mirror) — https://legeaz.net/legea-31-1990/art-74
- ANSPDCP contact page — https://www.dataprotection.ro/?page=contact
- OUG 18/2026 (press) — https://www.avocatnet.ro/articol_68289/
- ANPC order on the SAL pictogram, 2026 amendment (press quoting ANPC) — https://financialintelligence.ro/anpc-actualizeaza-sistemul-de-solutionare-alternativa-a-litigiilor-in-linie-cu-noile-reguli-europene/
- OG 16/2023 (tax alerts) — https://www.ey.com/en_ro/technical/tax-alerts/tax-alert-9-2023 · https://www.pwc.ro/en/tax-legal/alerts/changes-to-the-fiscal-procedure-code--og-no--16-2023.html

**Regulator guidance**
- EDPB cookie banner taskforce report, 17 January 2023 — https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf
- EDPB Guidelines 05/2020 on consent, through summaries — https://www.hunton.com/privacy-and-cybersecurity-law-blog/edpb-publishes-updated-guidelines-on-consent-under-the-gdpr · https://www.ropesgray.com/en/insights/alerts/2020/05/european-data-protection-board-updates-guidelines-on-gdpr-consent
- Article 29 Working Party Opinion 04/2012, through summaries — https://www.hoganlovells.com/en/publications/article-29-working-party-publishes-opinion-on-cookie-consent-exemptions · https://cms.law/en/gbr/legal-updates/cookies-the-new-article-29-working-party-recipe

**Status checks (secondary)**
- EU–US Data Privacy Framework appeal — https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework · https://connectontech.bakermckenzie.com/eu-us-data-privacy-framework-still-business-as-usual/
- Data Act and software subscriptions — https://www.cooley.com/news/insight/2025/2025-09-08-paas-iaas-or-saas-be-aware-new-switching-rules-will-become-applicable-in-eu · https://www.mishcon.com/news/eu-data-act-what-cloud-service-vendors-need-to-know-about-new-switching-rights · https://maples.com/knowledge/the-eu-data-acts-switching-framework-a-practical-overview
- Digital Omnibus cookie reform (weak sources; treat as indicative) — https://gdprlocal.com/?p=133868

**Competitor pages**
- Fresha — https://terms.fresha.com/ · https://terms.fresha.com/review-policy
- Treatwell — https://www.treatwell.co.uk/info/terms-of-use/ · https://www.treatwell.co.uk/info/privacy-policy/ · https://www.treatwell.co.uk/info/booking-terms-and-conditions/ · https://www.treatwell.co.uk/info/digital-services-act/
- Booksy — https://booksy.com/en-ie/
- MERO — https://mero.ro/termeni-si-conditii · https://mero.ro/politica-de-confidentialitate
- Planity — https://www.planity.com/

**Library behaviour:** `node_modules/mapbox-gl/dist/mapbox-gl.d.ts:19524` and `:19611` (`performanceMetricsCollection`, default `true`), version 3.25.0.
