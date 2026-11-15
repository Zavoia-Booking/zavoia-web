# Zavoia Web

Next.js App Router marketplace, business pages and published Website Builder sites. The web app calls `admin-api`; website publication and subscription eligibility are enforced there.

## Local development

```bash
npm ci
npm run dev
```

Next.js, its ESLint configuration and `@next/third-parties` are pinned to stable 16.4.1. This release includes the upstream [request-driven server HMR change](https://github.com/vercel/next.js/pull/96566) and [persistent HMR state fix](https://github.com/vercel/next.js/pull/97146).

The tracked `patches/next+16.4.1.patch` backports the Next.js maintainers' [development manifest race fix](https://github.com/vercel/next.js/pull/100521). Concurrent route generation previously could corrupt `.next/dev/prerender-manifest.json` or lose routes. The fix completes each read/update/write synchronously, before another request can update that shared file. It changes development-server code only; routing, prefetching, and production rendering retain their normal behavior.

`npm ci` and `npm install` apply the patch through `postinstall` and fail if it cannot apply or the Next version no longer matches. Do not skip install scripts for a development checkout. `patch-package` is a regular dependency so the install hook also works with `npm ci --omit=dev`. When upgrading Next, verify the installed release includes the upstream fix, run `npm run test:framework`, then remove the patch, install hook, and patch tool if no other patches remain. Stable 16.4.5 was also inspected on 6 November 2026 and still contained the faulty asynchronous writer.

The app runs at http://localhost:3001. Set `NEXT_PUBLIC_API_URL` in `.env.local` for your API; the default is http://localhost:3000. See `src/lib/env.ts` for optional map, Google OAuth, Sign in with Apple (`NEXT_PUBLIC_APPLE_SERVICES_ID`, `NEXT_PUBLIC_APPLE_REDIRECT_URI`) and business-dashboard configuration. `REVALIDATE_SECRET` is server-only and must match the backend's cache-invalidation integration. Never put it in a `NEXT_PUBLIC_` variable.

```bash
npm run build
npm run start
npm run lint
npx tsc --noEmit --incremental false
```

## Tests

Run the unit regressions with Node 22.22.2, the version used to verify this setup. They use Node's built-in test runner and TypeScript support, without starting the app or accessing the database:

```bash
npm run test:unit
npm run test:framework
```

The framework regression invokes the installed Next development server's route-generation method with concurrent requests and temporary files. It checks both valid manifest JSON and retention of every generated route, including the old `/try` and current `/web-studio/demo` paths. It does not start the app or access the database.

Run browser UI suites through their dedicated configurations:

```bash
npx playwright test --config=playwright.appointments-ui.config.ts
npx playwright test --config=playwright.saved.config.ts
npx playwright test --config=playwright.auth-ui.config.ts
npx playwright test --config=playwright.forms-ui.config.ts
npx playwright test --config=playwright.gallery-ui.config.ts
npx playwright test --config=playwright.professionals-ui.config.ts
```

The first five use an already-running web server (localhost:3001 by default) and mock their API traffic. The professional suite starts its own web server on port 3012 and in-memory API on port 4317, including server-rendered requests. These configurations have no database seed/reset setup. Failure screenshots and traces go to ignored `test-results/` directories.

`npm run test:e2e` uses `playwright.config.ts` with a real test API and truncates/reseeds the configured test database. Read its setup before running it; its API port 3001 also conflicts with the normal web development port. Explore and the dedicated UI suites are excluded from that run. Use `--list` to inspect test discovery without starting servers or running setup.

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

The legal directory (`/terms`) and every legal or policy document (`/terms/<document>`) use `noindex,follow` in both languages and are excluded from the sitemap, including published documents. They remain accessible through the site's links and crawlable so search engines can read the indexing rule.

`src/app/_components/not-found/not-found-page.tsx` provides the shared unavailable-page design. It does not claim that a business address is free or reveal unpublished business state.

- Completely unmatched URLs use `global-not-found.tsx`, a localized full document returning HTTP 404. `experimental.globalNotFound` is enabled because the app has separate locale and Studio root layouts. The proxy supplies the real pathname for that boundary.
- Missing locations and brands are resolved in their route layouts before rendering and return HTTP 404 with localized unavailable-page metadata and `noindex`. Missing published websites call `notFound()` in the page's existing pre-stream lookup; their scoped fallback supplies the same localized metadata without gating sibling city/category routes.
- Route-level `notFound()` status depends on whether Next has started streaming. Do not infer HTTP status from the displayed 404 artwork. Next 16.4.1 also retains an [upstream SSR defect](https://github.com/vercel/next.js/issues/99287): some matched routes return HTTP 404 with an empty HTML body until JavaScript renders the fallback. This does not affect the complete document returned by the global unmatched-route fallback.
- Category API outages reach the existing error boundary instead of being rendered as missing categories or empty listings. A successful empty response retains the existing empty/noindex behavior.
- Public tagged responses must remain independent of authentication. The HTTP layer strips shared cache hints when attaching an access token.
- `/api/revalidate/business` receives authenticated backend invalidation requests. Publication lifecycle changes expire website data and locale paths; existing browser data still follows its own freshness policy.

The root and locale fallback boundaries load their presentation through `next/dynamic`, with SSR enabled. Web Studio specimens and the demo use the same supported split for the microsite renderer. This keeps their CSS out of unrelated route prefetches while preserving server-rendered previews and normal link prefetching.

Location and brand routes have no full-page `loading.tsx` boundary. Their primary content and structured data render in their normal position before the footer. The location page retains its small query/deep-link Suspense boundary. Uncached navigation waits for the page data instead of showing a full-page skeleton; the existing 600-second ISR cache and invalidation tags remain in use.

Published business websites emit server-rendered Organization and WebPage JSON-LD, reusing the merchant identity from brand and location pages. The Organization URL points to the published website in the default locale, since its marketplace brand page may not be public. Optional description and contact facts follow the visible About and footer configuration. About/Gallery text and images are visible before JavaScript; entrance effects opt in after setup. FAQ answers are all in the initial HTML, with native disclosures before hydration and the selected interactive treatment afterward. Gallery and About image descriptions use location/business names rather than upload filenames. Preserve these public-rendering guarantees when synchronizing the copied Studio renderer from the dashboard.

## Local service links

- The homepage footer links to the neutral industry directory without assigning visitors a city or country. The directory opens `/search` with industry/service filters and offers city/category landing links when public inventory supports them.
- The sitemap, industry directory and category-page discovery links use `getCategoryDiscoveryGroups` to include only configured city/category combinations with at least two searchable locations in the public sitemap feed. Missing category metadata, unknown cities and unmatched taxonomy IDs do not create destinations. Inventory data uses the shared 600-second/tagged cache. The directory and category pages omit optional discovery links when the feed fails or exceeds the existing two-second wait; the footer does not fetch inventory.
- The industry browser preserves detected coordinates and city names when opening search. It does not substitute a default city or automatically send a visitor to a geographic landing page. MapTiler/IP country codes remain independent of UI language; the current search map's separate initial camera default is unchanged.
- `CITY_ENTRIES` in `src/data/seo.ts` defines supported geographic landing routes. Its current cities are in Romania; this is route coverage, not a limit on the product's intended markets. Adding international routes also requires country-aware inventory and search matching: the current category feed contains a city but no country, and landing-page searches use free-text city names. Cross-country city-name collisions must be addressed before expanding that registry.
- Location detail pages link their existing industry/city label to the corresponding landing page when the location's own declared country and city match one configured destination, its industry exists in the live taxonomy, and a scoped public search confirms matching inventory. The localized link is rendered on the server. Unknown or missing location country/city, ambiguous taxonomy, empty results or optional lookup failures keep plain text; neither the business's registered country nor visitor geolocation supplies a substitute. The lookup uses the existing 600-second business/taxonomy cache tags and a two-second optional wait limit.
- City/category pages also remain reachable through direct URLs, external links, the sitemap and links within that page family. Related industries and services qualify in the current city; other-city links qualify for the current category. Empty related sections are omitted, including the entire discovery area when no destinations qualify. Direct visits to categories below the two-location threshold retain `noindex,follow`. The location label supplies a contextual industry-level entrance; it does not link every service/category directly. "See all" preserves the selected service tag when opening the map.

## Shared UI

`/help` contains seventeen bilingual Q&As in six topics, including business website creation and Base/Plus plans. It reuses the business FAQ's presentation on the shared site container. The title, lead and single report section stay sticky in the left column on desktop. The search field uses 60% of the right column's opening row beside the guide artwork; this adapts to narrower screens. The page retains warm paper, grain and the handwritten signature, without eyebrows or topic pills. All answers start expanded, remain individually collapsible and use 90% of their column (full width on phones). Search supports multiple keywords and Romanian text with or without diacritics. Useful links at the end lead to password reset, deletion information, Zavoia for business, Guides, Web Studio and Pricing. Answers contain plain text. The guest report form uses the shared action dialog with draft-preserving error feedback. Appointment payment copy directs users to the business for methods and timing.

`/web-studio` is the public website marketing page. `/web-studio/demo` runs the
actual website renderer with localized demonstration businesses and design controls.
The former `/try` URLs permanently redirect there, preserving design and campaign
query parameters. The demo stays `noindex`; trial actions go to business signup.

Website preview code mirrors the corresponding renderer in `admin-dashboard`; preserve the web-specific adapters when synchronizing it. Its shared reduced-motion hook uses an SSR-stable snapshot and honors the dashboard's static preview modes. Appointment action dialogs use the installed Radix Dialog primitives; mutation handlers and each caller's dismissal policy remain separate.

Web Studio's 14 display fonts are included. `src/features/website/fonts.ts` uses
`next/font/local` for the 13 optional families, with preloading disabled and
separate Latin/Latin-ext ranges. The renderer reuses the global Next.js Geist
and Geist Mono families, which are already self-hosted at build time. Published
sites, demos and marketing previews make no browser requests to Google Fonts.
The dashboard uses the same display binaries with local CSS loaders. Keep font
keys stable for saved designs and keep the Italiana/Bodoni and Marcellus/Libre
Caslon Romanian fallbacks in both apps. Asset provenance and update instructions
live in [docs/assets/web-studio-fonts.md](docs/assets/web-studio-fonts.md); the
original licences stay beside the fonts in `public/fonts/web-studio`, and the
public notice index is `/fonts/web-studio/index.html`. Browser regressions in
`e2e/web-studio/fonts.spec.ts` verify actual rendered glyphs and on-demand loading.

The existing design playground is `public/playgrounds/claim-page.html`. Production behavior lives in the route/components above.

Framework references: [Next Link](https://nextjs.org/docs/app/api-reference/components/link), [not-found conventions](https://nextjs.org/docs/app/api-reference/file-conventions/not-found), [React external stores](https://react.dev/reference/react/useSyncExternalStore), [Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API). Check the installed Next version's `node_modules/next/dist/docs` before adopting newer APIs.
