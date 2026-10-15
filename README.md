# Zavoia Web

Next.js App Router marketplace, business pages and published Website Builder sites. The web app calls `admin-api`; website publication and subscription eligibility are enforced there.

## Local development

```bash
npm ci
npm run dev
```

Next.js, its ESLint configuration and `@next/third-parties` are pinned to stable 16.4.1. This release includes the upstream [request-driven server HMR change](https://github.com/vercel/next.js/pull/96566) and [persistent HMR state fix](https://github.com/vercel/next.js/pull/97146).

The app runs at http://localhost:3001. Set `NEXT_PUBLIC_API_URL` in `.env.local` for your API; the default is http://localhost:3000. See `src/lib/env.ts` for optional map, Google OAuth and business-dashboard configuration. `REVALIDATE_SECRET` is server-only and must match the backend's cache-invalidation integration. Never put it in a `NEXT_PUBLIC_` variable.

```bash
npm run build
npm run start
npm run lint
npx tsc --noEmit --incremental false
```

Existing Playwright scripts are in `package.json`. Read `playwright.config.ts` and the existing test setup before running them: they have backend and test-database requirements.

## Routes and language

- Route implementations live in `src/app/[locale]`. English URLs are unprefixed; Romanian URLs start with `/ro`. `src/proxy.ts` rewrites English requests internally and canonicalizes explicit `/en` URLs.
- The URL is the locale authority. Use `localeHref` for internal links and the shared language switcher for language navigation. It uses Next `Link`, preserving query parameters and fragments; a normal locale change can fetch an RSC response without reloading the document.
- Blog/category pages register their actual translated destinations through `LocaleRouteAlternates`. Do not invent translated slugs by replacing a prefix. An unavailable translation is disabled.
- Dictionary text and formatting belong to `src/i18n`. Do not cache rendered translations in data stores; translate raw data in the active view.

## State across language navigation

Locale layouts can remount. State that must survive is scoped to the browser tab, with immutable server snapshots through React's `useSyncExternalStore`:

- `src/lib/auth/session-store.ts` owns session bootstrap, token refresh and profile updates. Access tokens stay in memory. The existing display-name cache is cosmetic, never proof of authentication.
- An authenticated session ID stays stable through profile updates and changes on session replacement. Notifications and favorite IDs use it to reject stale results after logout or an account change.
- Home discovery and favorite IDs have a one-minute freshness window. Entry/focus can refresh stale data; locale navigation reuses fresh data. Discovery retains loaded pages and its shuffle seed. Cached availability is a display hint; booking endpoints remain authoritative.
- Verification and Google callback actions retain bounded, recent results in tab memory to avoid replaying consumed tokens during a locale remount. They do not survive a document reload; passwords are not retained.
- Refresh network errors, rate limits and infrastructure failures preserve a known session and retry with backoff. Definitive credential rejection ends it. An unresolved initial bootstrap uses the existing error gate while retrying.
- Native Web Locks serialize same-origin refresh rotations where supported. Other environments retain per-tab deduplication. This is not a lock for every login/logout operation or a guarantee against every cross-tab expired-token retry.

Private state must not enter server module caches. Public discovery may continue anonymously after refresh failure only for the explicitly audited read-only endpoints in `src/lib/api/http.ts`.

## Missing pages and caching

`src/app/_components/not-found/not-found-page.tsx` provides the shared unavailable-page design. It does not claim that a business address is free or reveal unpublished business state.

- Completely unmatched URLs use `global-not-found.tsx`, a localized full document returning HTTP 404. `experimental.globalNotFound` is enabled because the app has separate locale and Studio root layouts. The proxy supplies the real pathname for that boundary.
- Matched business, brand and website routes retain their existing HTTP 200 unavailable fallback with `noindex`; their metadata now uses the localized unavailable-page title and description.
- Route-level `notFound()` status depends on whether Next has started streaming. Do not infer HTTP status from the displayed 404 artwork. Next 16.4.1 also retains an [upstream SSR defect](https://github.com/vercel/next.js/issues/99287): some matched routes return HTTP 404 with an empty HTML body until JavaScript renders the fallback. This does not affect the complete document returned by the global unmatched-route fallback.
- Category API outages reach the existing error boundary instead of being rendered as missing categories or empty listings. A successful empty response retains the existing empty/noindex behavior.
- Public tagged responses must remain independent of authentication. The HTTP layer strips shared cache hints when attaching an access token.
- `/api/revalidate/business` receives authenticated backend invalidation requests. Publication lifecycle changes expire website data and locale paths; existing browser data still follows its own freshness policy.

The root and locale fallback boundaries load their presentation through `next/dynamic`, with SSR enabled. Web Studio specimens and the demo use the same supported split for the microsite renderer. This keeps their CSS out of unrelated route prefetches while preserving server-rendered previews and normal link prefetching.

## Local service links

- Footer service links use the existing `/{city}/{category}` landing pages and the live industry/tag taxonomy, including translated slugs. The six original service categories are retained; the old `/l/london/...` prototype URLs are gone.
- On a city/category route, that city's context wins. Elsewhere, the footer passively reads the existing home location store; it does not request location permission or make another geolocation call. Direct entry to another page may therefore have no location context.
- MapTiler/IP country codes are retained independently of UI language. A supported detected city must match its known country. If it has no landing page, `COUNTRY_FALLBACK_CITY_IDS` in `src/data/seo.ts` may supply a city **within that country**. Only `RO → bucharest` is configured. An unknown country, or a country with neither a matching city nor a configured fallback, gets the general business-search link, not a Romanian fallback.
- To add a country, declare its supported cities and explicitly choose its fallback. Country configuration alone is not international search support: the backend currently filters landing-page listings by free-text city, so cross-country city-name collisions also need backend handling before expansion.
- The footer's optional server taxonomy uses the existing 600-second/tagged cache. This also gives otherwise static locale pages a 600-second revalidation interval and may fetch during builds, even for routes whose client wrapper hides the footer. A failed lookup leaves general navigation usable. The current search map's separate Bucharest default is unchanged.
- Industry pages link to their child service pages in server-rendered HTML. Together with city/category cross-links and the industry sitemap, this preserves crawler discovery without depending on a visitor's geolocation. Empty landing pages retain `noindex,follow`. "See all" preserves the selected service tag when opening the map.

## Shared UI

Website preview code mirrors the corresponding renderer in `admin-dashboard`; preserve the web-specific adapters when synchronizing it. Its shared reduced-motion hook uses an SSR-stable snapshot and honors the dashboard's static preview modes. Appointment action dialogs use the installed Radix Dialog primitives; mutation handlers and each caller's dismissal policy remain separate.

The existing design playground is `public/playgrounds/claim-page.html`. Production behavior lives in the route/components above.

Framework references: [Next Link](https://nextjs.org/docs/app/api-reference/components/link), [not-found conventions](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), [React external stores](https://react.dev/reference/react/useSyncExternalStore), [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API). Check the installed Next version's `node_modules/next/dist/docs` before adopting newer APIs.
