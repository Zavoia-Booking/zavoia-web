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
| `/[locale]/business/[slug]`   | `revalidate = 600`, `generateStaticParams → []` | `getListing`, tagged `business` + `business:<slug>`                                 | `●` (ISR)¹    | `loading.tsx` |
| `/[locale]/brand/[slug]`      | `revalidate = 600`, `generateStaticParams → []` | `getBrand`, tagged `brand` + `brand:<slug>`                                         | `●` (ISR)¹    | `loading.tsx` |
| `/[locale]/[city]`            | `revalidate = 600`, `generateStaticParams → []` | `getPublicWebsite`, tagged `website` + `website:<slug>` — metadata **and** page      | `●` (ISR)¹    | none²         |
| `/[locale]/[city]/[industry]` | `dynamicParams=true`                            | none — `findCity`/`findIndustry` are local lookups                                  | `●` 126 paths | n/a           |

¹ No concrete path is prerendered — the slugs aren't enumerable — but all three
routes carry a `dynamicRoutes` manifest entry: the first request for a slug
renders and caches it, every later request is served from that cache. The empty
`generateStaticParams` is **required** — without it Next treats the route as
purely on-demand and never creates the cache entry at all.

² `/[city]` deliberately has no `loading.tsx`. It is the wildcard that catches
every unknown one-segment URL, and with nothing streamed the render completes
before headers go out — which is what lets `notFound()` answer a real 404 there
(see _404s_ below). The streamed shell buys little on a cached route: only the
first visitor to a slug ever waits on the backend.

### Listing cache invalidation

`/business/[slug]`, `/brand/[slug]` and the published microsite `/[city]` use a
**two-layer** freshness model: refreshed after ten minutes, or the moment
admin-api says something changed — whichever comes first.

**Layer 1 — time, the floor.** `revalidate = 600`. Every page self-heals within
ten minutes with no coordination from admin-api. If the webhook is never
wired, misfires, or a mutation path forgets to call it, the worst case is ten
minutes of drift. Nothing below is load-bearing.

**Layer 2 — tags, the accelerator.** One tag per entity, not per entity type:
services, team members, locations, photos and the Website Builder all render
the same URL, so they all invalidate `business:<slug>`. admin-api never needs
to know which sub-resource changed — only which business.

Three tag families, two payload keys. A `brands` entry flushes BOTH pages
addressed by a businessSlug: `brand:<slug>` (the marketplace brand page) and
`website:<slug>` (the published microsite at `zavoia.com/<slug>`). They share a
key by construction, so they can never drift apart and admin-api needs no third
array.

```
POST /api/revalidate/business
x-revalidate-secret: $REVALIDATE_SECRET
{ "locations": ["salon-x", "412"], "brands": ["glow-atelier"] }
```

`locations` are the LOCATION slugs (or numeric ids) in `/business/<slug>` URLs
— a business with three locations has three pages and should send all three.
`brands` are businessSlugs, and each flushes the brand page *and* the microsite.
`{ "all": true }` flushes all three coarse tags; use it for taxonomy-wide
changes, never per business. Slugs are lower-cased on both sides, since cache
tags are case-sensitive but URLs are not.

Invalidation uses the `"max"` profile — stale-while-revalidate. A publish marks
the entry stale and the next visitor is served the stale page instantly while
a refresh runs in the background, so a publish never causes a blocking rebuild
or a thundering herd.

**Which events actually need the webhook.** Publish and unpublish are the
SEO-critical pair: an unpublished business must stop being served promptly, and
a newly published one should be indexable immediately. On top of that, every
edit an owner makes to what the public pages actually *sell* — service price,
duration, the service menu itself, bundles, and who works where — is wired too,
because an owner who changes a price expects to see it. What remains on the
600s window is drift nobody is watching for.

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

| Trigger                         | Site                                                                |
| ------------------------------- | ------------------------------------------------------------------- |
| Marketplace publish             | `marketplace-listing.service.ts` (`publishMarketplaceListing`)      |
| Location visibility toggle      | `marketplace-listing.service.ts` (`updateLocationMarketplaceFlags`) |
| Hide on subscription expiry     | `marketplace-listing.service.ts` (`hideListingOnExpiry`)            |
| Re-show on payment restored     | `marketplace-listing.service.ts` (`showListingOnPaymentRestored`)   |
| Unpublish / delist              | `marketplace-listing.service.ts` (`unpublishListing`)               |
| Platform block / unblock        | `admin-crm.service.ts` (`setMarketplaceListingBlockStatus`)         |
| Website publish / unpublish     | `website-builder.service.ts`                                        |
| Location services changed       | `assignments.service.ts` (`updateLocationServices`)                 |
| Location bundles changed        | `assignments.service.ts` (`updateLocationBundles`)                  |
| Unified location assignments    | `assignments.service.ts` (`updateLocationAssignmentsUnified`)       |
| Staff services at a location    | `assignments.service.ts` (`updateStaffServicesAtLocation`)          |
| Service created                 | `service.service.ts` (`create`)                                     |
| Service price / duration / edit | `service.service.ts` (`update`)                                     |
| Service deleted                 | `service.service.ts` (`remove`)                                     |
| Bundle created                  | `bundle.service.ts` (`create`)                                      |
| Bundle price / composition      | `bundle.service.ts` (`update`)                                      |
| Bundle deleted                  | `bundle.service.ts` (`remove`)                                      |
| Team member removed             | `team.service.ts` (`remove`) — covers DELETE, offboard, bulk offboard |
| Staff unassigned from location  | `team.controller.ts` (`unassignFromLocation`)                       |
| Invitation accepted (staff live)| `auth.controller.ts` (`checkTeamInvitation`, invite completion)      |

Both `MARKETPLACE_FRONTEND_URL` (already set) and `REVALIDATE_SECRET` must be
present on the admin-api side or the service no-ops with a debug log.

Website Builder _draft_ saves are intentionally NOT wired — a draft isn't
published content, and the publish that makes it public is wired.

**Deliberately left to the 600s window**: location create/update/delete (name,
address, opening hours, photos), and review-driven rating changes. Both alter
what `/business/<slug>` renders, and each is a clean seam taking `businessId` —
but nobody is watching for them the way an owner watches a price change. Wire
them the same way if that turns out to be wrong.

**Every call site is fire-and-forget** (`void this.revalidationService…`): the
ping never blocks the mutation and never fails it. A dropped ping costs at most
one revalidate window.

## SEO: what is indexable

The three cached public pages were shipped with `robots: { index: false }` — the
caching bought latency and cost, nothing else. They are now indexable, and the
supporting pieces exist:

- **No blanket `noindex`.** `/business/<slug>`, `/brand/<slug>` and the
  microsite are indexable when they resolve. A page that does NOT resolve sets
  `robots: { index: false, follow: false }` from `generateMetadata` explicitly —
  it has to be explicit, because these routes answer their own misses in-page
  (see _404s_) and nothing throws `notFound()` to inject one.
- **Canonical + `hreflang`.** Each locale is canonical for its own URL and the
  two are declared as alternates, so `/business/x` and `/ro/business/x` are one
  page in two languages, not duplicates competing for one canonical.
- **OpenGraph** title/description/url plus the listing's featured image (brand:
  hero or logo; microsite: logo).
- **Sitemap.** `GET /marketplace/public/sitemap` (admin-api) returns the three
  URL families — public locations, brand pages, published websites — each gated
  by exactly the visibility rules the pages enforce, so the sitemap can never
  advertise a URL that 404s. `sitemap.xml` merges them with the marketing and
  blog URLs, caches for 600s, and carries all three coarse tags: a publish
  flushes the sitemap along with the pages.

The one deliberate gap: an unknown slug still answers **200 + noindex** rather
than a hard 404 on `/business` and `/brand`, because those routes stream (their
`loading.tsx` sends headers before the data resolves). Google excludes them
either way; Search Console will call them soft 404s. Removing `loading.tsx`
there would fix the status at the cost of the skeleton on client-side
navigation — the same trade `/[city]` takes in the other direction.

## 404s

Three faces, chosen by what the URL was asking for:

| URL                          | Shows                                          | Status |
| ---------------------------- | ---------------------------------------------- | ------ |
| `/<free-slug>`               | **claim page** — "this page could be yours",   | 200    |
|                              | the free address, trial CTA (`ClaimPage`)      | + noindex |
| `/business/<x>`, `/brand/<x>`| listing not-found (`BusinessNotFound`)         | 200 + noindex |
| anything else unmatched      | generic 404 (`src/app/not-found.tsx`)          | 404    |

Two Next constraints shaped this, both **measured on 16.2.4**, not assumed:

1. **Segment-level `not-found.tsx` is never reached.** The root layout is itself
   a dynamic segment (`app/[locale]/layout.tsx`) — the case the Next docs flag
   as making a composed 404 harder. A `not-found.tsx` in `[city]`, in
   `business/[slug]`, or in `[locale]` is dead: every `notFound()` in the tree
   lands on the root `app/not-found.tsx`.
2. **Inside that root boundary, client components are silently dropped** (the
   server half renders, the client half vanishes and the document falls back to
   Next's bare error shell), and any dynamic API — `headers()`, `cookies()` —
   throws _"Page changed from static to dynamic at runtime"_ when the miss
   happens inside a cached route. So the root 404 is plain server markup with
   plain anchors, and it cannot know the request's locale: it speaks the default.

That is why the two cases that matter answer **in-page** instead of through the
boundary: rendering from the page keeps the real design system, the right
locale, and the slug. The cost is the 200 status, and the explicit `noindex`
above is what pays for it. `/[city]` still returns a real 404 for anything the
router can't place at all (`/x/y/z`), and `/[city]/[industry]` — which has no
claim story — keeps its hard 404 through `notFound()`.

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
| `/[locale]/blog`        | `revalidate = 3600`                       | `listPosts()`, tagged `post`                             | `●` en/ro | `loading.tsx` |
| `/[locale]/blog/[slug]` | `revalidate = 3600`, `dynamicParams=true` | `getPostBySlug`, tagged `post` + `post:<slug>`           | `●` per post | `loading.tsx` |

Both were `revalidate = 0` — opted out of caching entirely, which left the
existing `/api/revalidate` Sanity webhook with nothing to invalidate. They now
carry an hour floor, and the queries were already tagged (`post`,
`post:<slug>`), so a publish in Sanity is live within seconds and the hour is
only the backstop. Posts prerender at build; one created later renders on first
request and caches from then on.

## Marketing & static

| Route                        | Segment config        | Server data                                                                                       | Build        | Boundary      |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- | ------------ | ------------- |
| `/[locale]/for-business`     | `dynamicParams=false` | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/help`             | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/pricing`          | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/terms`            | —                     | none                                                                                              | `●` en/ro    | n/a           |
| `/[locale]/terms/[document]` | —                     | none                                                                                              | `●` 24 paths | n/a           |
| `/[locale]/try`              | `dynamicParams=false` | none — reads `?s` / `?src`                                                                        | `ƒ`          | n/a           |
| `/[locale]/web-studio`       | `revalidate = 3600`   | `loadShowcase` → `getPublicWebsite` for the first qualifying slug, tagged `website`               | `●` en/ro    | `loading.tsx` |

## Outside the locale tree

| Route                 | Segment config | Build | Notes                                              |
| --------------------- | -------------- | ----- | -------------------------------------------------- |
| `/studio/[[...tool]]` | `force-static` | `ƒ`   | Declared static but built dynamic — worth checking |
| `/api/revalidate`     | —              | `ƒ`   | Sanity webhook receiver                            |
| `/robots.txt`         | —              | `○`   |                                                    |
| `/sitemap.xml`        | `revalidate = 600` | `○`   | Marketing URLs + `GET /marketplace/public/sitemap`, tagged `business`/`brand`/`website` |
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

### Verified: microsite cache (`/[city]`)

Same harness, same result — measured on the published-website route after it
moved off `force-dynamic`:

| Step                                            | `x-nextjs-cache` | Upstream calls |
| ----------------------------------------------- | ---------------- | -------------- |
| `next build`                                    | —                | **0**          |
| 1st request to `/salon-x`                       | `MISS`           | 1              |
| 2nd, 3rd request                                | `HIT`            | 0              |
| `POST /api/revalidate/business {brands:["Salon-X"]}` → next request | `STALE` | 1 (background) |
| the request after that                          | `HIT`            | 0              |
| an untouched slug during that flush             | `HIT`            | 0              |

The webhook answered `{"revalidated":["brand:salon-x","website:salon-x"]}` for
the mixed-case payload — one `brands` entry, both pages, correctly lower-cased.
The served HTML contains the rendered microsite body, not just a shell.

**Upstream `no-store` does not defeat the page cache.** admin-api sets
`Cache-Control: no-store, no-cache, must-revalidate, private` on *every*
response, including the public marketplace GETs. Re-running the whole harness
against a stub sending those exact headers: still `MISS → HIT → HIT` on one
upstream call, and `revalidateTag` still flips the entry to `STALE`. The route's
`revalidate` export governs the full-route cache regardless of what the upstream
says about its own body — worth knowing, because the earlier verification used a
stub that sent no cache headers at all.

**404 vs. outage.** Caching a wildcard route makes the two failure modes
different problems, so the page now tells them apart: an upstream **404** (no
such slug, or the site isn't published) is a real answer and is cached like any
other render; **anything else** (backend down, 500, timeout) is rethrown, so the
render fails, Next stores nothing, and the next request retries. Verified against the
real admin-api, stopped mid-test: a cold slug returns `500` twice in a row
(nothing poisoned into the cache), an already-cached slug keeps serving `200`
straight through the outage, and the moment the backend is back the same URLs
render normally. That 500 is bare — with no `loading.tsx` nothing has streamed
yet, so `[city]/error.tsx` only covers a failure during a client-side navigation
into the route.

### The 404 trade-off

Streamed responses return HTTP **200**: headers go out before the data resolves,
so the status can no longer change. `/business/[slug]` and `/brand/[slug]` keep
their `loading.tsx`, so a missing record answers 200 with an explicit `noindex`
(see _SEO_ and _404s_ above) — excluded from the index, logged by Search Console
as a soft 404. `/[city]` takes the opposite trade: no `loading.tsx`, so the
router's own misses there are hard 404s, and the claim page is the deliberate
200. Moving the existence check into `src/proxy.ts` is still the only way to get
a hard 404 *and* a streamed shell on the listing routes.

---

## Open items for the Cache Components discussion

Ordered by value over risk. Items 1 and 2 are applied; the rest are untouched.

1. ~~**Drop `force-dynamic` from the four account routes.**~~ **Done.** All
   four now prerender per locale and serve from the CDN instead of costing a
   function invocation per request.

2. ~~**Cache the two SEO money pages.**~~ **Done**, and since extended to the
   published microsite. `/business/[slug]`, `/brand/[slug]` and `/[city]` are
   ISR with a 600s floor plus tag invalidation — see _Listing cache
   invalidation_ above. `next build` no longer calls admin-api for any of them
   (verified: zero upstream requests during a build).

3. **Tier the home feeds** instead of one blanket `force-dynamic`: industries
   change monthly (`days`), brands slowly (`hours`), latest listings fast
   (`minutes`). Each already sits behind its own boundary, so they can be
   tiered independently without touching layout.

4. ~~**Blog `revalidate = 0` defeats the Sanity webhook.**~~ **Done.** Both blog
   routes are ISR with a 1h floor; the queries were already tagged, so
   `/api/revalidate` now has something to invalidate.

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
