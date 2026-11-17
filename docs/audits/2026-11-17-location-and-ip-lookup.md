# Location and IP lookup audit — 16–17 November 2026

This audit covers how the website, the app and the backend find a visitor's location, and what was fixed on 16 November. It explains why the home page shows loaders while the location prompt is unanswered. It also covers whether estimating location from the IP address is standard practice and GDPR-compliant, and whether Cloudflare can replace ipwho.is.

**Status on 17 November 2026**

- Nothing from this work is committed or deployed. The three fixes below exist only in the local working trees.
- Asking for location when the home, industries and business pages open is a deliberate product decision (16 November). It is recorded here, not reopened.
- The recommended next step is not decided yet. It is to take the approximate location from Cloudflare on the server and build "In your city" and "Nearby" there. It depends on a test that has not been run.

Uncommitted files from this work:

| Repository | File | Change |
| --- | --- | --- |
| zavoia-web | `src/app/_components/home/use-home-coords.ts` | Issue 3 |
| zavoia-web | `src/app/[locale]/search/_components/search-content.tsx` | Issue 2 |
| marketplace-app | `components/map-view.tsx`, `i18n/locales/en.json`, `i18n/locales/ro.json` | Issue 4 |
| zavoia-web | `src/lib/auth/session-store.ts` | Unrelated to location: retry backoff for the `/me` session check |

The rate limiting of the API is covered separately in `admin-api/docs/2026-11-17-rate-limiting-audit.md`.

## Scope and method

| What | How |
| --- | --- |
| Code | zavoia-web working tree (HEAD `e7857964` plus uncommitted changes), marketplace-app (`5fcc2aa`), admin-api (`38638de`). On 16 November two read-only reviewers audited the website with the backend, and the app. Their main claims were checked in the code. |
| Live behaviour | Response headers and timings of www.zavoia.com and api.zavoia.com. |
| Loader timings | Headless Chromium against the live site and the local build, 17 November. Geolocation was stubbed the way the project's e2e tests stub it: a `getCurrentPosition` that never answers, answers with an error, or answers after 300 ms. No clicks. |
| Analytics | The live Google Analytics container for `G-FFXW1QTJTS`, plus one test page load. Its Analytics requests were blocked before leaving the browser, so nothing was recorded. |
| Competitors | Headless browser, first 10 seconds, no clicks, Romanian language and time zone, two runs (16 November). |
| Sources | Every quote was checked at its source on the day. The GDPR part is a reading of the texts, not legal advice. |

Not covered:

- Real devices and the app builds in the stores.
- Google Cloud settings.
- Cloudflare settings other than the one switch reported below.

## How location works today

### Website

| Place | Behaviour | Code |
| --- | --- | --- |
| Home: "In your city", "Nearby" | Asks when the page opens and waits up to 8 s for an answer. Without one, it estimates from the IP via ipwho.is; a device position is turned into a city with MapTiler. Both sections show skeletons until location and results are in, and are hidden when empty. | `src/app/_components/home/use-home-coords.ts:39`, `:63`, `:81` |
| Home: "Recently viewed" | Makes its own location request when the page opens, only for "km" labels. The browser shows one dialog for both requests. | `src/app/_components/home/recently-viewed.tsx:222` |
| Industries | Uses the shared location and adds unrounded coordinates to the category links. | `src/app/[locale]/industries/industry-browser.tsx:46-47` |
| Business page | Asks on every visit, only to show "X km away". | `src/app/[locale]/business/_components/business-detail.tsx:610-615` |
| Header search | "Use my location" asks only on tap. It falls back to the IP estimate and labels it approximate. | `src/components/search/search-overlay.tsx:1352`, `:1372` |
| Search page | Shows its own explanation first; the browser asks only after the visitor taps "Allow". Remembers "Not now" (`zv-loc-skip`) and, since 16 November, "Use my location" (`zv-loc-allow`). Writes coordinates into the page address with 6 decimals. | `src/app/[locale]/search/_components/search-content.tsx:101-117`, `:673-674`, `:693-694`, `:843-844` |
| IP estimate | The visitor's browser calls `https://ipwho.is/`. | `src/lib/geocoding/maptiler.ts:251` |

### App

This describes the code at commit `5fcc2aa` plus the 16 November change; the store builds were not checked.

| Place | Behaviour | Code |
| --- | --- | --- |
| Launch | Never asks. If location is already allowed, it takes one GPS position. Otherwise it sends the phone's IP to ipwho.is. Neither lookup has a time limit. | `marketplace-app/features/location/hooks.ts:78`, `marketplace-app/features/location/api.ts:99-101` |
| Home | With no saved place it shows a "Choose location" card, not loaders. | `marketplace-app/app/(tabs)/index.tsx:585` |
| Map tab | The system dialog appears the first time the map opens in a session. Since 16 November no alert follows a "Don't Allow". | `marketplace-app/components/map-view.tsx:488-497` |
| Header label | Says "Current location" even when the place is an IP estimate or was saved weeks ago. It is never refreshed. | — |
| Map search with no place and no permission | Measures distances from a fixed point in Bucharest (44.4268, 26.1025). | `marketplace-app/app/(tabs)/search.tsx:740`, `:754` |
| iPhone permission text | The same English text for everyone; it says only "show your position on the map". | `marketplace-app/app.config.js:147-150` |
| On-tap flows | "Use my current location", the "Where" card and "My location" accept an approximate position and give up after a set time. They offer "Open settings" or "Choose a city". | — |

### Backend (admin-api)

- **Nothing kept and no third parties.** The API stores no visitor location, does no IP lookup, and has no analytics or error-tracking service.
- **Logs:**
  - The request log records each request's method, full address and status code (`admin-api/src/modules/app.module.ts:106-114`). Listing requests carry their coordinates in the address, so exact coordinates reach Google Cloud's logs.
  - For a signed-in user the log line also holds the user id (`:94`).
  - "Nearby" sends its coordinates in the request body, which is not logged.
  - Google Cloud keeps logs for 30 days by default; the project's own setting was not visible.
- **Location headers:** no code reads Cloudflare's or Vercel's location headers.

### Where a visitor's coordinates end up

- The search page's address, with 6 decimals.
- The industries page's category links, unrounded.
- Google Analytics page addresses, for visitors who accept cookies (issue 1).
- Browser storage, with no expiry, after "Use my location" in header search.
- The API's request logs.

### iPhone: why the prompt can appear twice

This was checked in WebKit and Chromium source on 16 November.

- **Two dialogs:** Chrome on iPhone runs on Apple's WKWebView. iOS may first ask whether Chrome itself may use location; then WebKit asks for the site.
- **Asks again:** WebKit's default rule for each site (`WKWebGeolocationPolicyDeciderIOS.mm`) keeps asking until the site has been allowed twice within 24 hours. The constants are `kGeolocationChallengeThreshold = 2` and a 24-hour `kGeolocationChallengeTimeout`.
- **Can't tell it was allowed:** Chrome on iPhone always reports the permission as "prompt" to `navigator.permissions.query`.
- **No extra dialogs:** location requests made at the same time on one page share one dialog.

Our code doesn't cause the second dialog. The only lever is to ask less often, which is a product choice (see "Other items reviewed").

## The four issues found on 16 November

| # | Issue | Status on 17 November |
| --- | --- | --- |
| 1 | Google Analytics receives exact coordinates in page addresses | Needs a Google Analytics setting; **not applied** |
| 2 | The search page pop-up shows on every visit on iPhone Chrome | Fixed locally, not committed |
| 3 | Home ignores an "Allow" given after the 8-second wait | Fixed locally, not committed |
| 4 | The app shows an OK-only alert every session after "Don't Allow" | Fixed locally, not committed |

### 1. Google Analytics receives exact coordinates

- **Where coordinates appear:** the search page and the industries page put the visitor's coordinates in the page address (`search-content.tsx:673-674`, `industry-browser.tsx:46-47`). Analytics loads only after cookie consent (`src/components/shell/analytics-gate.tsx:13-14`).
- **Why code can't fix it:**
  - The live container has enhanced measurement on. It records page views when the address changes, plus scroll, outbound-click, form, video and download events, each with the full page address.
  - Google's documentation says `send_page_view: false` does not stop page views triggered by address changes.
- **Google's rules:**
  - Location must not be "GPS or fine-grained", "including any lat/long data".
  - "Both the URL path and parameters must be free of PII."
- **Fix (needs Editor access in Google Analytics):**
  - Go to Admin → Data streams → web stream → Redact data → Query parameters, and add `lat` and `lng`.
  - Redaction happens in the browser. It covers `page_location`, `page_referrer`, `page_path`, `link_url`, `video_url` and `form_destination`.
- **Status:**
  - The setting was saved on 16 November in the afternoon.
  - On the morning of 17 November, about 17 hours later, the live container still redacted email addresses only.
  - The blocked test load showed the `page_view` and `scroll` events sending `dl=https://www.zavoia.com/search?lat=44.426800&lng=26.102500&radius=20`.
  - The likeliest cause is that the edited stream is not the one with measurement ID `G-FFXW1QTJTS`.
  - Once it applies, the container's `__ccd_auto_redact` tag will include a `redactQueryParams` value.

### 2. Search pop-up on every visit (iPhone Chrome): fixed locally

- **Cause:** the page skipped its explanation only when `navigator.permissions.query` said "granted", which Chrome on iPhone never says.
- **Change:**
  - The page now remembers "Use my location" in `localStorage` (`zv-loc-allow`, value `1`, never coordinates), the same way it already remembered "Not now" (`zv-loc-skip`).
  - If location later fails or is blocked, the remembered answer is forgotten (`search-content.tsx:101-127`, `:731`, `:742`, `:782-797`).
- **Side effect:** browsers that don't keep the permission show their own prompt when the page opens on later visits. The page shows all places meanwhile, with no loaders.
- **Open, waiting for a decision:**
  - The cookie policy should list `zv-loc-allow` next to `zv-loc-skip` (`src/data/legal/cookie-policy.ts`).
  - The second question is whether the effective date (15 November) moves.
  - Proposed rows:
    - EN: zv-loc-allow · local storage · Zavoia · remembers that you chose “Use my location” when asked for your location · until you clear your browser data
    - RO: zv-loc-allow · stocare locală · Zavoia · reține că ați ales „Folosește locația mea” când vi s-a cerut locația · până ștergeți datele browserului
- **Tests:** none cover this pop-up.

### 3. Home ignores a slow "Allow": fixed locally

- **Cause:** after the 8-second deadline, home used the IP estimate and ignored any later answer.
- **Change:** the location request stays open after the deadline. A later "Allow" replaces the estimate, and a slower IP answer can't overwrite it (`use-home-coords.ts:59-93`).
- **Checked:**
  - The real module ran in a scratch harness with faked timings, in 7 scenarios, before and after the change. Allowing after 10 seconds now switches to the device position; before, it stayed on the IP estimate. Instant allow, instant deny, a late deny, no answer and a failed city lookup behave as before.
  - In the real page locally on 17 November, results reloaded for the device position after about 0.1 s of loaders.

### 4. App alert after "Don't Allow": fixed locally

- **Change:** the OK-only alert on the first map visit of every session is gone. Its two strings, `search.map.permissionTitle` and `search.map.permissionMessage`, are removed in English and Romanian; nothing else used them (`marketplace-app/components/map-view.tsx:491-500`).
- **What still works:** the map works without the blue dot. "My location" still explains the problem and offers "Open settings" or "Choose a city".

### Checks run for the fixes

- **Website:** typecheck and lint pass.
- **App:** typecheck passes. Lint shows the 10 errors `map-view.tsx` already had at HEAD, none new.
- **Not run:** the Playwright and e2e suites, which are only run on request. The app has no tests.

## Other items reviewed

| Item | Finding | Decision |
| --- | --- | --- |
| Asking for location as soon as home, industries and business pages open | General guidance says to ask after a tap (see "Best practice research"). For Zavoia, location drives these pages, and the IP estimate is only a fallback. | **Decided on 16 November: deliberate product choice, keep.** Not to be proposed again, including in a reduced form. |
| "Recently viewed" making its own location request | Harmless: the browser shows one dialog for both requests | Decided with the item above: keep |
| Backend logs exact coordinates, with the user id when signed in | Defensible. OWASP doesn't list location among data to keep out of logs, but advises removing personal data where identity is not needed. Google Cloud keeps logs 30 days by default, and the privacy policy says technical logs are kept for a limited period. | Optional: log the address without coordinates, or round them |
| iPhone permission text English-only and incomplete | App Review 5.1.1(ii) asks purpose strings to "clearly and completely" describe the use. Ours leaves out that location finds nearby businesses and is sent to our API and MapTiler. Expo can translate the text with `locales` in the app config. | Open; needs an app build |
| The app's "Current location" label | A new user whose phone hasn't allowed location starts from the IP estimate under this label. The estimate isn't replaced when they later allow location on the map. | Open; minor |
| Location stays on the phone after logout | A device feature, not account data. The cookie policies say it is kept until browser data is cleared (website) or the app is deleted (app). | Leave |
| Outdated backend docs and a wrong code comment | The backend docs give a 500 km maximum radius (the code allows 50) and page sizes of 1–100 (the code allows up to 500). They also list a removed route and leave out "Nearby". The comment at `search-content.tsx:825` wrongly says the search page follows the app's steps. | Leave; tidy any time |

## Home loaders while the prompt is unanswered (measured 17 November)

| What the visitor does with the prompt | Loaders end, live site | Local build |
| --- | --- | --- |
| Ignores it | 10.9 s after the page opens | about 10 s |
| Blocks location | 3.7 s | 2.7 s |
| Allows, or allowed earlier | 3.7 s | 2.5 s |

Requests on the live site, timed from the start of navigation:

- **Ignored:** ipwho.is at 10.6 s; the listings and nearby requests from 10.6 s to 10.9 s.
- **Blocked:** ipwho.is from 2.7 s to 2.8 s; listings and nearby from 2.8 s to 3.7 s.
- **Allowed:** MapTiler city lookup from 2.8 s to 3.0 s; listings and nearby from 2.8 s to 3.7 s.

What the measurements show:

- **Cause:** the 8-second wait before the IP fallback (`use-home-coords.ts:39`, `:63`). The IP lookup and both result requests follow it, all in the browser after the page has arrived.
- **Worst case:** 8 + 8 seconds, if the IP service also hangs.
- **Empty marketplace:** the live site has no businesses yet, so both sections disappear once the loaders end.
- **Search page, local build:** shows all 26 local places on a country-wide map, with no loaders, while location is undecided.
- **App home:** shows a "Choose location" card, not loaders.

Guidance:

- **Nielsen Norman Group:**
  - "skeleton screens should be used with a wait time that's under 10 seconds"
  - "10 seconds is about the limit for keeping the user's attention"
  - "1.0 second is about the limit for the user's flow of thought to stay uninterrupted"
- **People often don't answer:**
  - web.dev: people "will often dismiss or ignore permission prompts".
  - NN/g's store-finder study: "Some desktop users did not notice the browser popup".
- **Chrome Lighthouse:** "Assume users won't give you their locations." "Use a fallback if users don't grant geolocation permission."

Options considered:

- **Shorten the 8-second wait: a patch, not a fix.**
  - Even an instant answer leaves loaders until about 3.7 s on the live site, because location and results both resolve in the browser after the page arrives.
  - Visitors who answer late would also trigger an ipwho.is lookup they don't trigger today.
  - One home e2e test fast-forwards 8.1 s and would need updating (`e2e/home/home-failure-feedback-ui.spec.ts`).
- **Build the two sections on the server from an approximate location** (next sections). This is the only option that gets below a second.

## Best practice research (16–17 November)

### Location permission

- **Chrome Lighthouse:** "Always request geolocation permission after a user action, not on page load".
- **web.dev:**
  - "Never ask on page load or without user interaction."
  - On desktop, 77% of prompts are shown without user intent. These are allowed 12% of the time, against 30% after an interaction.
- **Chromium's automatic block:** a site's prompt is blocked for 7 days after 3 dismissals or 4 ignored prompts. With the quieter prompt style, 1 dismissal or 2 ignores are enough (`components/permissions/permission_decision_auto_blocker.cc`).
- **NN/g:**
  - People were "12% more likely to grant a permission request when they were given a reason".
  - Their store-finder study recommends "an explicit Use Current Location element".
- **Apple:**
  - "Ideally, wait to request permission until people actually use an app feature that requires access"
  - "Avoid requesting permission at launch unless the data or resource is required for your app to function"
  - App Review 5.1.1(iv): if someone declines location, "offer the ability to manually enter an address".
- **Android:** "Ask for a permission in context, when the user starts to interact with the feature that requires it."
- **USENIX Security 2021** (Elbitar et al., 473 participants): "no one-fits-all permission request strategy".
- **Chrome's `<geolocation>` element** (Chrome 144 and later):
  - The figures come from Chrome's trial of its earlier `<permission>` element (Chrome 126 to 143). In it, "Immobiliare.it saw a 20% increase in successful geolocation flows".
  - In the same trial, "ZapImóveis observed a 54.4% success rate in users recovering from a 'previously blocked' state when presented with the element".
  - Sites can adopt it "without breaking compatibility for users on other browsers", and a polyfill falls back to the regular Geolocation API.

The research can't say whether asking on arrival or after a tap gets more people to share their location on a site like this. That would need a test with real visitors.

### IP-based location

- **Accuracy:** MaxMind publishes how often its databases place an IP within 50 km of the real position, for Romania:

  | Connections | Paid database (GeoIP City) | Free database (GeoLite) |
  | --- | --- | --- |
  | All | 75% | 62% |
  | Mobile data | 53% | 43% |
  | Broadband | 85% | 72% |

  ipwho.is publishes no accuracy figures.
- **Baymard Institute:** ordering results by IP-estimated proximity "performed well".
- **Google:** "IP addresses are roughly based on geography. This means that any website you use, including google.com, may get some information about your general area."

### What comparable products do (16 November, first 10 seconds, no clicks)

| Site | Asks for location on load? | How a place is picked instead |
| --- | --- | --- |
| **zavoia.com (control)** | **Yes**, twice at about 2 s | — |
| Fresha (RO) | No | "Locația actuală" button |
| Booksy | No | "Where?" field pre-filled with a default city |
| Treatwell | No | "Enter postcode or area" field |
| Planity | No | IP estimate (Woosmap) plus an address field |
| MERO (RO) | No | "Alege orașul" city picker and city list |
| ClassPass | No | "Tell us where you're located" |
| **Glovo (RO)** | **Yes** | Address field plus "Utilizează locația curentă" |
| Wolt / Tazz (RO) | No; only checks whether location was already allowed | Delivery address and city list |
| Uber Eats | No; only checks whether location was already allowed | — |
| Airbnb, Booking | No | Place search |

Yelp, TheFork, Vagaro, OpenTable and Google Maps blocked the automated visit or stopped at a consent wall, so they are not counted.

## IP-based location and GDPR

This is a reading of the texts, not legal advice.

### Why an IP estimate doesn't need consent

- **No permission involved:** an approximate location from the IP address needs no browser permission, because every website receives the visitor's IP with each request.
- **Legal ground:**
  - IP addresses are online identifiers (GDPR recital 30).
  - The usual ground is legitimate interests: art. 6(1)(f), read with recital 47 on reasonable expectations.
  - The conditions are telling people (art. 13(1)) and their right to object (art. 21(1)).
- **Zavoia's privacy policy** (live, effective 15 November 2026) already covers it:
  - It says location is "precise if you allow it … otherwise approximate, estimated from your IP address".
  - It gives legitimate interest as the ground.
  - It names ipwho.is, Vercel and Cloudflare.
- **The cookie rule:**
  - ePrivacy art. 5(3) covers storing or reading information on the device, and an IP lookup stores nothing there.
  - The EDPB's Guidelines 2/2023 (version 2.0, final version published 16 October 2024) cover tracking based on IP only. They say the article "could apply", but that "the applicability of this article does not systematically mean that consent needs to be collected".

### The weak point: who does the lookup

The visitor's browser, and the app, call ipwho.is directly, so a third party receives the visitor's IP address.

- **ipwhois.io's documents:**
  - Their terms (21 May 2026) and privacy policy (18 January 2026) name no company, address, country or governing law. The only contact is an email address.
  - They offer no data-processing agreement; `/dpa` and `/gdpr` return 404.
  - Terms §8: "You are responsible for ensuring that your usage of our API complies with any applicable data privacy regulations in your jurisdiction".
  - Their privacy policy covers account holders, not the IP addresses that get looked up.
- **A promise we can't back up:** Zavoia's policy promises a legal safeguard for every vendor outside the European Economic Area. For ipwho.is none can be shown.
- **A German ruling on the same pattern:**
  - LG München I, 20 January 2022, 3 O 17493/20, the Google Fonts case.
  - A website automatically passed a visitor's dynamic IP address to a third party without consent. The court found no justification, because the site could have worked without it, and awarded €100 in damages.
  - It is a German lower court and not binding in Romania.

### ipwho.is limits

- **Free plan:**
  - 1,000 requests a day. For requests from a browser, their documentation says "requests are counted per domain, not per individual visitor IP. The daily limit is shared across all traffic from that domain."
  - Past the limit it answers HTTP 429. `ipLocate` then returns nothing, so home's two sections disappear for visitors who haven't shared their location.
  - "Standard" accuracy; "No SLA. Uptime is not guaranteed".
- **Paid plans:**
  - Basic: $19.99 a month for 600,000 requests, with a 99.9% uptime guarantee.
  - Business: $39.99 for 3,000,000.
  - Unlimited: $99.99.
- **Speed:** about 40 ms per request, measured from the development machine.
- **Where it's called:**
  - Website: home (`use-home-coords.ts:81`), the search page fallback (`search-content.tsx:711`), and the header search fallback, on tap only (`search-overlay.tsx:1354`).
  - App: first launch (`marketplace-app/features/location/hooks.ts:78`).

## Cloudflare instead of ipwho.is

### What Cloudflare provides

- **The switch:** the "Add visitor location headers" Managed Transform adds these headers to every request sent to the origin:
  - `cf-ipcity`, `cf-ipcountry`, `cf-ipcontinent`
  - `cf-iplongitude`, `cf-iplatitude`
  - `cf-region`, `cf-region-code`, `cf-metro-code`, `cf-postal-code`, `cf-timezone`

  Values with non-ASCII characters are sent as UTF-8.
- **Plans and accuracy:**
  - IP geolocation is available on the Free, Pro, Business and Enterprise plans.
  - Cloudflare: "IP geolocation is an estimate, not an exact science". There is no accuracy guarantee, and Cloudflare "cannot guarantee that its IP geolocation will align with other providers".
- **Where to find it:**
  - zavoia.com → Rules → Settings → Managed Transforms → HTTP request headers → "Add visitor location headers".
  - Direct link: `https://dash.cloudflare.com/?to=/:account/:zone/rules/settings`.
  - It is not under Zero Trust → DNS Locations, which is for office DNS filtering.
  - Network → "IP Geolocation" is a different switch and sends only `cf-ipcountry`.
- **State on 17 November: off.** This is from a screenshot of the Managed Transforms tab.
- **Safe to turn on:** the switch covers the whole domain, so www and api. It would not put location data in our logs:
  - The API's request log records only method, address and status code (`admin-api/src/modules/app.module.ts:106-114`).
  - No code in admin-api or zavoia-web logs request headers.
  - No error-tracking service is installed.

  Cloudflare still advises testing any Managed Transform before relying on it.

### Why Vercel matters

- **The request path:** visitor → Cloudflare → Vercel, where the Next.js code runs → API (Cloudflare → Google Cloud Run).
- **What Vercel's documents say:**
  - Vercel overwrites `X-Forwarded-For` behind a proxy.
  - It recognises Cloudflare through `CF-Connecting-IP` on all plans ("Verified Proxy Lite").
  - Keeping the original visitor location is Enterprise-only ("Verified Proxy Advanced"). Its guide (updated 13 November 2026) says "client-IP and geolocation information can reflect that proxy".
  - So the location has to come from Cloudflare's headers, not from Vercel's `x-vercel-ip-*` headers.
- **The gating test:** Vercel's documents don't say whether headers added by Cloudflare reach the application. If they don't, the server has no way to know the visitor's location short of Vercel Enterprise, and improving ipwho.is becomes the fallback plan.

### Can the home page use it? (17 November)

- **Live headers:**
  - www.zavoia.com answers with `server: cloudflare` and `x-vercel-id: fra1…`.
  - The home page HTML has `cache-control: private, no-cache, no-store`, `cf-cache-status: DYNAMIC` and `x-vercel-cache: MISS`.
  - api.zavoia.com also answers through Cloudflare.
- **No caching to lose:** home is already rendered for each request (`src/app/[locale]/page.tsx:66`, `force-dynamic`), so per-visitor data costs no caching. Next.js 16's `headers()` reads request headers in Server Components.
- **The patterns already exist:**
  - The search page fetches listings on the server (`src/app/[locale]/search/page.tsx:75`).
  - Home already streams three server-fetched sections through Suspense.
- **Live timings:**
  - Home HTML: first byte in about 0.3 s when warm, 1.8 s cold.
  - `GET /marketplace/public/listings` with coordinates: 0.15–0.42 s.
  - `POST /marketplace/public/nearby-locations`: about 0.15 s.
- **Accuracy sample:** for one connection (Digi, Bucharest), ipwho.is and Cloudflare both answered Bucharest at the same point (44.43225, 26.10626).

### Comparison

| | Improve the ipwho.is approach | Cloudflare, sections built on the server |
| --- | --- | --- |
| What changes | The lookup starts at once instead of after the 8 s wait | The server reads the location and builds "In your city" and "Nearby" itself |
| Loaders on home | About 3.7 s in every case (estimated from the measured timeline); today 3.7 s, or 10.9 s if the prompt is ignored | The sections arrive with the page |
| Daily limit | 1,000 lookups a day, shared by all website visitors | None |
| Who gets the visitor's IP | ipwho.is: no company named, no data-processing agreement | Nobody new |
| Reliability | Free plan: "Uptime is not guaranteed" | No extra service involved |
| Cost | Free up to the limit, then from $19.99 a month | Included; available on every plan |
| Size of the work | Small | Medium |

Cloudflare alone doesn't make the page faster. The time is lost because location and results are worked out in the browser after the page loads; the server building the sections is what removes it.

### Size of the change

- **Level A:**
  - The server passes only the approximate location; results still load in the browser.
  - Small: the home route and the shared location code.
  - Loaders still end about 3.5 s after opening.
- **Level B:**
  - The server also fetches the first results and streams both sections.
  - Medium: both sections, `use-home-feed`, failure handling, and the 16 home e2e tests (`e2e/home/home-near-you.spec.ts`, 1 test; `e2e/home/home-failure-feedback-ui.spec.ts`, 15 tests).
  - `e2e/favorites/saved-ui.spec.ts` and `src/app/_components/home/request-deadline.test.mjs` also depend on the browser-side lookup.
  - The loaders are gone when the server is warm.
- **In both levels:**
  - The precise location still replaces the estimate once the visitor allows it, through the 16 November fix.
  - Everyone first sees results for the estimated city. When the estimate is wrong, which is likelier on mobile data, the list changes once location is allowed.

### The shared API rate-limit counter

- **The limit:** `MarketplaceSearchRateLimitGuard` allows 120 requests a minute per caller address and endpoint, kept in memory in each API instance (`admin-api/src/guards/rateLimit.guard.ts:155-157`; key at `:94-99`).
- **Who the caller is:** requests made by the website's server come from Vercel's addresses, which are not fixed unless Vercel's paid "Static IPs" option is used. So all visitors share the server's counters.
- **Example:** 2 visitors refreshing home 10 times count as 20 of 120 on each of the two endpoints, not 2 of 120 and not 40 of 120.
- **Already the case:** the search page's first results already work this way; they are fetched on the server, with `force-dynamic`.
- **When it matters:** fine at launch. The shared counter fills at about 120 home page loads a minute. The rate-limiting audit proposes recognising the website's server.

### Other places that call ipwho.is

- **Where:** the search page fallback, the header search fallback and the app's first launch call ipwho.is from the browser or phone.
- **To drop ipwho.is entirely:** the API would answer "roughly where am I" from Cloudflare's headers. api.zavoia.com is behind Cloudflare, but nothing reads those headers today. Each visitor is their own caller there, so the shared counter doesn't apply.

### Suggested order (not decided)

1. Turn the switch on and run a small temporary check that Cloudflare's headers reach the Next.js server. This is a code change and needs a go.
2. Build "In your city" and "Nearby" on the server (level B).
3. Let the API answer "roughly where am I" for the search page, header search and the app.
4. Remove ipwho.is, and update the privacy policy to name Cloudflare for the estimate and drop ipwho.is.

## Not related: zavoia.com shows English to everyone

A card asked whether zavoia.com should send Romanian visitors to `/ro`. This is a separate issue:

- **No connection to the location work.** The location work neither causes nor fixes it.
- **How it works today:** the code never looks at the visitor's language or country. `/` always serves English and Romanian lives under `/ro` (`src/proxy.ts:87-90`).
- **Best practice:** language is normally chosen from the browser's language setting, not from location. Google advises: "Avoid automatically redirecting users from one language version of a site to a different language version of a site" and "Don't use IP analysis to adapt your content."
- **Decided earlier:** the address structure (English without a prefix, Romanian under `/ro`) is a fixed decision from 29 October 2026.

## Open items

| Item | Next step |
| --- | --- |
| Google Analytics redaction not applied to `G-FFXW1QTJTS` | Check the measurement ID on the stream that was edited, then re-check the live container |
| Cookie-policy row for `zv-loc-allow`, and the effective date | Yes or no on the proposed rows |
| The uncommitted files listed at the top | Commit when asked |
| Home loaders: Cloudflare level B, or shortening the wait | Decide; the Cloudflare route needs the header test first |
| Cloudflare header test | Needs a go (temporary code check) |
| iPhone permission text; the app's "Current location" label | Decide; both need an app build |

## Sources

- Chrome Lighthouse, geolocation on start: https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start
- web.dev, permissions best practices: https://web.dev/articles/permissions-best-practices
- Chromium permission auto-blocker: https://raw.githubusercontent.com/chromium/chromium/main/components/permissions/permission_decision_auto_blocker.cc
- Chrome `<geolocation>` element: https://developer.chrome.com/blog/geolocation-html-element
- NN/g, permission requests: https://www.nngroup.com/articles/permission-requests/
- NN/g, store finders: https://www.nngroup.com/articles/store-finders-and-locators/
- NN/g, skeleton screens: https://www.nngroup.com/articles/skeleton-screens/
- NN/g, response times: https://www.nngroup.com/articles/response-times-3-important-limits/
- Apple Human Interface Guidelines, privacy: https://developer.apple.com/design/human-interface-guidelines/privacy
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Android, requesting permissions: https://developer.android.com/training/permissions/requesting
- Expo, localization: https://docs.expo.dev/guides/localization/
- USENIX Security 2021, Elbitar et al.: https://www.usenix.org/conference/usenixsecurity21/presentation/elbitar
- Baymard Institute, address lookup: https://baymard.com/blog/automatic-address-lookup
- MaxMind accuracy, Romania: https://www.maxmind.com/en/geoip-accuracy-comparison?country=RO&resolution=50
- Google, how location is determined: https://support.google.com/websearch/answer/179386
- Google Analytics, avoiding PII: https://support.google.com/analytics/answer/6366371
- Google Analytics, data redaction: https://support.google.com/analytics/answer/13544947
- Google Analytics, page views: https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Google Cloud log retention: https://docs.cloud.google.com/logging/docs/buckets
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- ePrivacy Directive: https://eur-lex.europa.eu/eli/dir/2002/58/oj
- EDPB Guidelines 2/2023: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en
- LG München I, 3 O 17493/20: https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612
- ipwhois.io documentation: https://ipwhois.io/documentation
- ipwhois.io pricing: https://ipwhois.io/pricing
- ipwhois.io terms: https://ipwhois.io/terms
- ipwhois.io privacy policy: https://ipwhois.io/privacy
- Cloudflare IP geolocation: https://developers.cloudflare.com/network/ip-geolocation/
- Cloudflare Managed Transforms reference: https://developers.cloudflare.com/rules/transform/managed-transforms/reference/
- Cloudflare, configure Managed Transforms: https://developers.cloudflare.com/rules/transform/managed-transforms/configure/
- Cloudflare Self-Serve Subscription Agreement: https://www.cloudflare.com/terms/
- Cloudflare privacy policy: https://www.cloudflare.com/privacypolicy/
- Vercel, reverse proxy servers: https://vercel.com/docs/security/reverse-proxy
- Vercel, Cloudflare and other proxies: https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment
- Vercel, request headers: https://vercel.com/docs/headers/request-headers
- Vercel, Static IPs: https://vercel.com/docs/connectivity/static-ips
- Google Search Central, multi-regional and multilingual sites: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
