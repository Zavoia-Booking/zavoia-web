# Rendering & caching map

Ground truth for how every route is rendered today, ahead of the Cache
Components migration. Regenerate the build markers with `npx next build` —
the legend at the bottom of its route table is the source for the **Build**
column.

Next.js 16.2.4. Cache Components (`cacheComponents: true`) is **not** enabled;
the app is entirely on the [previous caching model](https://nextjs.org/docs/app/guides/caching-without-cache-components)
(route-segment `dynamic` / `revalidate` exports).

**Build markers:** `○` static · `●` prerendered via `generateStaticParams` ·
`ƒ` server-rendered on demand.

**Boundary** = does the route flush a shell before its server data resolves?
`in-page` = `<Suspense>` inside the page · `loading.tsx` = route-segment
boundary · `n/a` = nothing suspends on the server.

---

## Marketplace core

| Route                         | Segment config                                  | Server data                                                                         | Build         | Boundary      |
| ----------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ------------- | ------------- |
| `/[locale]`                   | `force-dynamic`, `dynamicParams=false`          | `getIndustries`, `getLatestListings`, `getBrands` — parallel, passed down unawaited | `ƒ`           | in-page ×4    |
| `/[locale]/search`            | `force-dynamic`, `dynamicParams=false`          | `getIndustries` + `searchListings` (parallel)                                       | `ƒ`           | `loading.tsx` |
| `/[locale]/business/[slug]`   | `revalidate = 300`, `generateStaticParams → []` | `getListing`, tagged `business` + `business:<slug>`                                 | `ƒ` (ISR)¹    | `loading.tsx` |
| `/[locale]/brand/[slug]`      | `revalidate = 300`, `generateStaticParams → []` | `getBrand`, tagged `brand` + `brand:<slug>`                                         | `ƒ` (ISR)¹    | `loading.tsx` |
| `/[locale]/[city]`            | `force-dynamic`, `dynamicParams=true`           | `getPublicWebsite` — in `generateMetadata` **and** the page                         | `ƒ`           | `loading.tsx` |
| `/[locale]/[city]/[industry]` | `dynamicParams=true`                            | none — `findCity`/`findIndustry` are local lookups                                  | `●` 126 paths | n/a           |

¹ The build table shows `ƒ` because no path is prerendered, but both routes
carry a `dynamicRoutes` manifest entry: the first request for a slug renders
and caches it, every later request is served from that cache. The empty
`generateStaticParams` is **required** — without it Next treats the route as
purely on-demand and never creates the cache entry at all. (These previously
showed a misleading `●`: `generateStaticParams` returned only `{ locale }`,
leaving `[slug]` unresolved, so nothing was ever prerendered.)

### Listing cache invalidation

`/business/[slug]` and `/brand/[slug]` use a **two-layer** freshness model.

**Layer 1 — time, the floor.** `revalidate = 300`. Every page self-heals within
five minutes with no coordination from admin-api. If the webhook is never
wired, misfires, or a mutation path forgets to call it, the worst case is five
minutes of drift. Nothing below is load-bearing.

**Layer 2 — tags, the accelerator.** One tag per entity, not per entity type:
services, team members, locations, photos and the Website Builder all render
the same URL, so they all invalidate `business:<slug>`. admin-api never needs
to know which sub-resource changed — only which business.

```
POST /api/revalidate/business
x-revalidate-secret: $REVALIDATE_SECRET
{ "locations": ["salon-x", "412"], "brands": ["glow-atelier"] }
```

`locations` are the LOCATION slugs (or numeric ids) in `/business/<slug>` URLs
— a business with three locations has three pages and should send all three.
`brands` are businessSlugs. `{ "all": true }` flushes both coarse tags; use it
for taxonomy-wide changes, never per business. Slugs are lower-cased on both
sides, since cache tags are case-sensitive but URLs are not.

Invalidation uses the `"max"` profile — stale-while-revalidate. A publish marks
the entry stale and the next visitor is served the stale page instantly while
a refresh runs in the background, so a publish never causes a blocking rebuild
or a thundering herd.

**Which events actually need the webhook.** Publish and unpublish are the
SEO-critical pair: an unpublished business must stop being served promptly, and
a newly published one should be indexable immediately. Content edits (a price,
a new photo) are cosmetic drift that layer 1 absorbs on its own. Start with
publish/unpublish; adding more call sites later needs no frontend change.

`REVALIDATE_SECRET` must be set in the Vercel project (server-only — no
`NEXT_PUBLIC_` prefix). Unset means the endpoint refuses every request, which
is the safe default: pages still self-heal on the revalidate window.

It is read at **runtime**, not inlined at build — verified by starting a build
made without the variable and setting it only on `next start`. So it can be
added or rotated in Vercel without a redeploy.

**The admin-api side** lives in `src/modules/revalidation/` (`RevalidationService`).
It loads the business's location slugs and businessSlug, posts them, and
swallows every error — a failed cache ping must never fail the publish that
triggered it. It deliberately mirrors `MapPointService.syncForBusiness`: same
call sites, same fire-and-forget contract, so wire a new one in wherever that
one is wired in. Currently called from:

| Trigger                      | Site                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| Marketplace publish          | `marketplace-listing.service.ts` (`publishMarketplaceListing`)      |
| Location visibility toggle   | `marketplace-listing.service.ts` (`updateLocationMarketplaceFlags`) |
| Hide on subscription expiry  | `marketplace-listing.service.ts` (`hideListingOnExpiry`)            |
| Re-show on payment restored  | `marketplace-listing.service.ts` (`showListingOnPaymentRestored`)   |
| Unpublish / delist           | `marketplace-listing.service.ts` (`unpublishListing`)               |
| Platform block / unblock     | `admin-crm.service.ts` (`setMarketplaceListingBlockStatus`)         |
| Website publish / unpublish  | `website-builder.service.ts`                                        |
| Location services changed    | `assignments.service.ts` (`updateLocationServices`)                 |
| Location bundles changed     | `assignments.service.ts` (`updateLocationBundles`)                  |
| Unified location assignments | `assignments.service.ts` (`updateLocationAssignmentsUnified`)       |
| Staff services at a location | `assignments.service.ts` (`updateStaffServicesAtLocation`)          |

Both `MARKETPLACE_FRONTEND_URL` (already set) and `REVALIDATE_SECRET` must be
present on the admin-api side or the service no-ops with a debug log.

Website Builder _draft_ saves are intentionally NOT wired — they change the
brand page's content but happen constantly, and the 300s window absorbs them.

**Deliberately left to the 300s window** (decided 2026-08-21, not an
oversight): service create/update/delete, location create/update/delete,
team-member removal, and review-driven rating changes. All of them alter what
`/business/<slug>` renders, and each is a clean seam taking `businessId` — but
they are owner-facing edits where up to five minutes of drift is acceptable,
and the events that actually matter (publish, unpublish, visibility, platform
block, assignments) are already instant. This is layer 1 doing its job; wire
them only if the staleness turns out to bother owners in practice.

## Account & booking (authenticated)

Every one of these is a **client-rendered page**: the server component only
unwraps `params` and renders a `"use client"` component that fetches through
`apiFetch` in the browser. Effects don't run during SSR, so the server emits
the pre-fetch shell — byte-identical for every visitor, dependent on nothing
but the locale. `force-dynamic` was removed from all four (it forced a function
invocation to recompute a constant); they now prerender and serve from the CDN.

| Route                           | Segment config        | Server data                            | Build     | Boundary |
| ------------------------------- | --------------------- | -------------------------------------- | --------- | -------- |
| `/[locale]/account`             | `dynamicParams=false` | none (`AccountContent` is client)      | `●` en/ro | n/a      |
| `/[locale]/appointments`        | `dynamicParams=false` | none (`AppointmentsContent` is client) | `●` en/ro | n/a      |
| `/[locale]/appointments/[uuid]` | `dynamicParams=true`  | none (`DetailContent` is client)       | `●`²      | n/a      |
| `/[locale]/saved`               | `dynamicParams=false` | none (`SavedContent` is client)        | `●` en/ro | n/a      |

² The `uuid` isn't enumerable, so no concrete path is prerendered — but the
route now carries a `dynamicRoutes` manifest entry (it had none under
`force-dynamic`), so the shell is cacheable rather than re-rendered per
request. Verified: the prerendered `/en/account` HTML contains no user data,
only the loading skeleton.

## Auth

All six already wrap their client form in `<Suspense>` (they read
`useSearchParams`). No server data.

| Route                                | Segment config        | Build     | Boundary                                                  |
| ------------------------------------ | --------------------- | --------- | --------------------------------------------------------- |
| `/[locale]/auth`                     | `dynamicParams=false` | `●` en/ro | in-page (`AuthSkeleton`)                                  |
| `/[locale]/auth/callback`            | `dynamicParams=false` | `●` en/ro | in-page                                                   |
| `/[locale]/auth/forgot-password`     | `dynamicParams=false` | `●` en/ro | in-page                                                   |
| `/[locale]/auth/reset-password`      | `dynamicParams=false` | `●` en/ro | in-page                                                   |
| `/[locale]/auth/verify-account-link` | `dynamicParams=false` | `●` en/ro | in-page                                                   |
| `/[locale]/auth/verify-email`        | `dynamicParams=false` | `●` en/ro | in-page                                                   |
| `/[locale]/login`                    | `dynamicParams=false` | `ƒ`       | n/a — reads `searchParams`, then `redirect()`s to `/auth` |
| `/[locale]/register`                 | `dynamicParams=false` | `ƒ`       | n/a — same, plus `?src` campaign attribution              |

## Content (Sanity)

| Route                   | Segment config                         | Server data                                              | Build | Boundary      |
| ----------------------- | -------------------------------------- | -------------------------------------------------------- | ----- | ------------- |
| `/[locale]/blog`        | `revalidate = 0`                       | `listPosts()`                                            | `ƒ`   | `loading.tsx` |
| `/[locale]/blog/[slug]` | `revalidate = 0`, `dynamicParams=true` | `getPostBySlug` — in `generateMetadata` **and** the page | `ƒ`   | `loading.tsx` |

`revalidate = 0` opts these out of caching entirely, which also means the
existing `/api/revalidate` Sanity webhook has nothing to invalidate.

## Marketing & static

| Route                        | Segment config        | Server data                                                                                       | Build        | Boundary      |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- | ------------ | ------------- |
| `/[locale]/for-business`     | `dynamicParams=false` | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/help`             | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/pricing`          | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/terms`            | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/terms/[document]` | —                     | none                                                                                              | `●` 24 paths | n/a           |
| `/[locale]/try`              | `dynamicParams=false` | none — reads `?s` / `?src`                                                                        | `ƒ`          | n/a           |
| `/[locale]/web-studio`       | `force-dynamic`       | `loadShowcase` → `getPublicWebsite` for the first qualifying slug (≤2 candidates, short-circuits) | `ƒ`          | `loading.tsx` |

## Outside the locale tree

| Route                 | Segment config | Build | Notes                                              |
| --------------------- | -------------- | ----- | -------------------------------------------------- |
| `/studio/[[...tool]]` | `force-static` | `ƒ`   | Declared static but built dynamic — worth checking |
| `/api/revalidate`     | —              | `ƒ`   | Sanity webhook receiver                            |
| `/robots.txt`         | —              | `○`   |                                                    |
| `/sitemap.xml`        | —              | `○`   |                                                    |
| `/_not-found`         | —              | `○`   |                                                    |

`src/proxy.ts` (Routing Middleware) runs on every request — locale detection
and redirects (`/en` → `/`).

---

## Verified: streaming behaviour

Measured against a black-holed API URL (`http://10.255.255.1:9999`, drops
packets) so every server fetch hangs. Production build, `next start`:

| Route                 | TTFB       | Total  |
| --------------------- | ---------- | ------ |
| `/`                   | **0.088s** | 10.53s |
| `/business/some-slug` | **0.010s** | 10.50s |
| `/brand/some-brand`   | **0.008s** | 10.50s |
| `/search`             | **0.009s** | 10.50s |
| `/web-studio`         | **0.006s** | 10.32s |

The shell reaches the browser in under 90ms while the data takes 10.5s. Before
the boundaries were added, TTFB equalled total — a blank page for the entire
wait. Reproduce with:

```bash
NEXT_PUBLIC_API_URL=http://10.255.255.1:9999 npx next build
NEXT_PUBLIC_API_URL=http://10.255.255.1:9999 npx next start -p 3111
curl -s -o /dev/null -w 'TTFB=%{time_starttransfer}s total=%{time_total}s\n' http://localhost:3111/
```

Rebuild with the real env afterwards — `NEXT_PUBLIC_*` is inlined at build time.

### Verified: listing cache

Measured against a stub backend that counts upstream requests, production build
on `next start`:

| Step                                  | `x-nextjs-cache` | Upstream calls         |
| ------------------------------------- | ---------------- | ---------------------- |
| `next build`                          | —                | **0**                  |
| 1st request to `/business/salon-x`    | `MISS`           | 1                      |
| 2nd, 3rd request                      | `HIT`            | 0                      |
| after `POST /api/revalidate/business` | `STALE`          | 1 (background refresh) |
| next request                          | `HIT`            | 0                      |
| a slug that was **not** invalidated   | `HIT`            | 0                      |

A cache miss costs exactly one upstream call — confirmed across three fresh
slugs. `generateMetadata` and the page body both call `getListing`, and
request-scoped memoization collapses the identical GETs into one.

**The cache is shared across all visitors**, which is the entire point: it is
keyed by URL, not by identity, and nothing in the tree reads cookies or headers
server-side. Demonstrated with three distinct clients against one cold URL:

| Client                                         | `x-nextjs-cache` | Upstream calls |
| ---------------------------------------------- | ---------------- | -------------- |
| Customer A (own cookie jar + session cookie)   | `MISS`           | 1              |
| Customer B (different jar, cookie, user-agent) | `HIT`            | 0              |
| Googlebot (no cookies at all)                  | `HIT`            | 0              |

One visitor's miss warms the page for everyone, including crawlers. The
corollary is that the cached HTML is the **anonymous** view: `isFavorited` — the
only user-scoped field on `ListingDetail` — is absent from it. That was already
true before caching, because server-side calls never carried a token
(`setTokenStore` is only ever called from `AuthProvider`, a client component),
and `apiFetch` now strips cache hints from any request that does carry one so
this cannot silently change.

Invalidating `salon-x` left `other-slug` cached, so tags are per-business rather
than a global flush. Webhook auth returns 401 on a missing or wrong secret and
400 on an empty payload; a payload of `"Salon-X"` correctly produced the tag
`business:salon-x`.

### The 404 trade-off

Streamed responses return HTTP **200**, because headers are sent before the
data resolves and the status can no longer change. `/business/[slug]`,
`/brand/[slug]` and `/[city]` call `notFound()` on a missing record, so those
now stream a 200 instead of a 404. Next injects
`<meta name="robots" content="noindex">` into the streamed HTML, so the URLs
are still kept out of the index — but some crawlers will log them as soft
404s. If a real 404 status is needed for compliance or analytics, the
existence check has to move into `src/proxy.ts`, ahead of the response body.

---

## Open items for the Cache Components discussion

Ordered by value over risk. Items 1 and 2 are applied; the rest are untouched.

1. ~~**Drop `force-dynamic` from the four account routes.**~~ **Done.** All
   four now prerender per locale and serve from the CDN instead of costing a
   function invocation per request.

2. ~~**Cache the two SEO money pages.**~~ **Done.** `/business/[slug]` and
   `/brand/[slug]` are ISR with a 300s floor plus tag invalidation — see
   _Listing cache invalidation_ above. `next build` no longer calls admin-api
   for them at all (verified: zero upstream requests during a build).

3. **Tier the home feeds** instead of one blanket `force-dynamic`: industries
   change monthly (`days`), brands slowly (`hours`), latest listings fast
   (`minutes`). Each already sits behind its own boundary, so they can be
   tiered independently without touching layout.

4. **Blog `revalidate = 0` defeats the Sanity webhook.** Cache the posts and
   let `/api/revalidate` invalidate by tag — that is what the webhook is for.

5. ~~**Duplicate fetches in `generateMetadata` + page.**~~ **Not an issue for
   the detail routes** — measured at one upstream call per cache miss, so
   request-scoped memoization is collapsing the identical GETs. Worth a
   re-check only if a call ever stops being a plain GET (`getLatestListings`
   is a POST and is not memoized, but it is only called once).

6. **`unstable_instant`** validates that a route produces an instant static
   shell at every entry point, at dev and build time. Only meaningful once
   `cacheComponents` is on — but it is the guard rail that keeps boundaries
   correctly placed.

7. **`/studio` declares `force-static` but builds as `ƒ`.** Harmless if
   intentional; worth understanding before the migration changes defaults.

### Migration caveat

Enabling `cacheComponents` turns on React `<Activity>`: routes stay mounted on
navigation instead of unmounting, so component state survives going back and
forth. Dropdowns, dialogs and anything assuming unmount-on-navigate can behave
differently. Budget for a pass over those, and see the
`migrating-to-cache-components` guide in `node_modules/next/dist/docs/`.
