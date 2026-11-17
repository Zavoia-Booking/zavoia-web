# Structured data audit — 17 November 2026

The software errors in the supplied screenshots come from incomplete shared application nodes. The fixes add supported platforms and the actual displayed subscription offers, remove Web Studio's redundant parent application, and add the confirmed publisher postal code. The audit also improves discovery, merchant, service and article graphs.

Source inspection covers every JSON-LD emitter in the repository and both supported languages. The live crawl covers all 26 production sitemap URLs; the isolated production-rendering suite covers 30 documents, excluding populated article pages. Source changes are local; the live crawl records the deployed baseline before these changes.

## Follow-up review status

The second review found one additional content-parity defect: the Marque merchant footer does not display the official website contact link, but the schema included it. The helper now omits that link for Marque, with regression coverage for all five footer variants and the unknown-variant fallback. No further concrete defect was identified in the reviewed helpers and their consumers.

The local implementation passes the checks below on Next.js **16.4.6**. This does **not** establish that the live site is resolved: a repeat read-only crawl at **08:30 EET on 17 November 2026** found the same six incomplete application nodes across four URLs and the same eight article 404s in the sitemap. The live evidence includes that follow-up comparison. Deployment, sitemap/cache recovery, and Google's own post-deployment tests remain outstanding.

Two limits remain explicit: genuine app reviews/ratings are unavailable, so software rich-result eligibility is not established; and populated CMS article routes have source/helper coverage but have not been exercised by the isolated production-rendering suite.

## Live baseline

The [per-URL evidence](data/2026-11-17-structured-data-live.json) records the HTTP status, canonical, robots directives, entity types and findings for every sitemap URL. Checks inspected actual HTML script elements, rather than JSON-LD strings inside React's serialized props.

| Check | Observed result |
| --- | --- |
| Sitemap URLs fetched | 26 of 26 |
| HTTP responses | 18 successful pages; 8 article URLs returned 404 |
| Successful pages with parseable JSON-LD | 18 of 18 |
| Canonical mismatches on successful pages | 0 |
| Application nodes failing the property combination reported in the screenshots | 6 across 4 URLs: both languages of `/for-business` and `/web-studio` |
| Publisher addresses without a postal code | 16 |
| Official vocabulary checks | 298 typed nodes, 860 properties, 320 typed object ranges; no unknown terms or domain/range mismatches |

The deployed sitemap contains no business, brand, professional, generated merchant website or city/category URLs. Those templates are therefore covered through source inspection, real-data-shaped fixtures and the production HTML regression suite, rather than a claim that live examples were available.

The vocabulary check used the [official Schema.org vocabulary](https://schema.org/version/latest/schemaorg-current-https.jsonld). It checks recognized terms and type compatibility; it does not certify factual correctness or Google eligibility. Cross-page `@id` references, such as an application's help page, are valid and are not treated as missing local entities.

## Page and entity coverage

| Surface | Markup and disposition |
| --- | --- |
| Shared site identity | `Organization`, `PostalAddress`, `ContactPoint`, `WebSite`; retained verified legal name, tax ID, support email and logo; added confirmed postcode `060023`. |
| Home, EN/RO | Added a localized `WebPage`, separate from the shared `WebSite` identity. |
| For business, EN/RO | One `SoftwareApplication`; added Android/iOS support, browser-access requirements and the displayed Base/Plus offers. |
| Pricing, EN/RO | Same business application; added platform information and embedded complete monthly offers directly under the app. |
| Web Studio, EN/RO | One `WebApplication`; added browser requirements, OS-independent access and the displayed Plus bundle offer. Removed the redundant second application node. |
| Help, EN/RO | Existing `FAQPage` answers match the visible accordion content. Kept the shared identity and actual answers. |
| Blog index and category archives | Existing `CollectionPage`, displayed `ItemList` slice and visible category breadcrumbs are appropriate. Empty archives do not invent article/list entries. |
| Articles | `BlogPosting`, localized page identity, real byline, cover variants, breadcrumbs and visible FAQ; added the displayed category and validated author URLs/publication timestamps. |
| Industries directory | Connected `CollectionPage`, breadcrumbs and actual displayed destinations. Added the previously missing definitions of referenced publisher/site entities. |
| City/category pages | Consistent `#webpage` identity, connected breadcrumbs and displayed result slice. Kept canonical destination links rather than inventing venue identities from cards. |
| Location pages | Retained `LocalBusiness`, parent merchant, accurate branch facts and breadcrumbs; added the actual service/package catalog. |
| Brand pages | Retained merchant `Organization`; added a connected list of the actual displayed branches. Empty branch collections keep a plain merchant page. |
| Professional pages | Retained `ProfilePage` and `Person`; added reciprocal page association, displayed description and deduplicated business affiliations. |
| Published merchant websites | Merchant now publishes its own page, while the hosting `WebSite` remains Zavoia. Added the merchant logo and official website only where displayed. |
| Search, authentication/account/booking pages, legal pages, demo and unavailable routes | No unrelated feature markup added. Reviewed emitter absence and applicable exclusions. `/professionals` itself returns 404; `/try` redirects to the demo. |

## Corrections and rationale

### Software applications and offers

The previous business app had `applicationCategory` but no operating system, offer or rating on the business overview. Studio repeated that incomplete parent app beside an equally incomplete `WebApplication`. Pricing alone attached offers. The common helper now supplies truthful platform information and visible offers consistently.

The amounts come from the same pricing source as the rendered plan cards:

| Locale | Base monthly | Plus monthly | Each extra team seat monthly |
| --- | --- | --- | --- |
| English | EUR 20 | EUR 38 | EUR 7 |
| Romanian | RON 99 | RON 189 | RON 35 |

Studio's offer is the Plus subscription that includes publishing, rather than an invented standalone Studio charge. Offers retain the monthly reference quantity, seller, currency, billing conditions and seat add-on. The 14-day trial is not represented as a permanently free subscription. Offer URLs lead to the actual pricing plan anchors.

These changes address the missing property combination in the screenshots. Google's current [software-app documentation](https://developers.google.com/search/docs/appearance/structured-data/software-app) separately lists a genuine rating or review as an eligibility requirement. The project has no verified, displayed app review data, so no rating is manufactured and Google app rich-result eligibility is not promised. `applicationSuite` preserves Studio's relationship to Zavoia without emitting another incomplete application.

### Publisher identity and postal address

The owner confirmed postal code `060023` during this audit. It is now in the shared publisher address and both languages of the published company information. The CUI remains `taxID`; it is not relabeled as a VAT registration.

The existing PNG logo is 440 × 145 pixels, above Google's minimum dimensions. No replacement was needed. The guidance recommends relevant, accurate administrative details and a crawlable logo. [Google Organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization).

### Local services and merchant identities

Location pages now describe displayed services and packages as `OfferCatalog` → `Offer` → `Service`. Monetary values are converted from the same minor-unit values used by the menu. Equal staff overrides take precedence over the base price; a displayed “from” figure becomes `PriceSpecification.minPrice`, rather than an exact-price claim. Unshown upper bounds, hidden prices, invalid money values and real-time availability claims stay absent. [Schema.org OfferCatalog](https://schema.org/OfferCatalog), [PriceSpecification](https://schema.org/PriceSpecification).

Existing branch-versus-brand distinctions, public photo filtering, finite coordinate validation, country normalization, explicit closed days, overnight opening intervals and 24-hour operation were retained. Stable merchant and branch identifiers remain shared across languages. Business cards and website projections without stable public branch UUIDs link to real pages instead of creating competing local-business identities. [Google LocalBusiness guidance](https://developers.google.com/search/docs/appearance/structured-data/local-business).

Venue/brand review totals combine venue and professional reviews. They cannot truthfully supply a venue-only `aggregateRating`. Generated websites also contain curated quotes rather than a suitable complete review aggregate. These remain excluded, along with unverified business subtypes and invented `priceRange` values. [Google review guidance](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

### Articles, directories and FAQ

Article schema now includes the visible localized category as `articleSection`. Author names are trimmed, unsafe or credential-bearing URLs are omitted, and publication/modification claims require valid elapsed timestamps. A modification must follow publication. UTC normalization preserves the original instant; CMS infrastructure timestamps are not substituted for substantive editorial dates. Existing real cover crops and byline attribution remain intact. [Google Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article), [publication dates](https://developers.google.com/search/docs/appearance/publication-dates).

Discovery graphs now consistently connect their page, website, publisher, breadcrumbs and displayed list. Counts describe the shown slice, without presenting the entire backend total as visible entries. Breadcrumbs follow the actual navigation trail. [Google breadcrumb guidance](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [Schema.org ItemList](https://schema.org/ItemList).

Visible FAQs remain useful Schema.org content. Google discontinued FAQ rich results on 7 May 2026 and removed the feature documentation on 15 June 2026; adding FAQ markup does not restore that search feature. [Google documentation changelog](https://developers.google.com/search/updates), [Schema.org FAQPage](https://schema.org/FAQPage).

### Stale article sitemap inventory

All eight deployed article URLs returned 404, while the archives reported zero articles. Read-only checks of both the public CMS API and CDN returned no post documents. The sitemap still advertised these removed URLs:

- `/blog/test2`, `/ro/blog/test2`
- `/blog/test23`, `/ro/blog/test23`
- `/blog/test1`, `/ro/blog/test1`
- `/blog/before-booking-a-local-service`, `/ro/blog/inainte-sa-rezervi-un-serviciu-local`

The 404 pages correctly omit article schema/canonicals and carry `noindex`. Restoring markup on a missing article would be incorrect. The discrepancy concerns publication/cache invalidation; the article lookup itself was checked against the public CMS and did not reveal a query failure.

The verified CMS webhook now expires post/slug caches immediately and explicitly invalidates `/sitemap.xml` for post events, including deletion payloads without a slug. Non-post events do not invalidate article caches. Six tests use the real signature verifier and body parser, covering valid post/deletion events, non-post events, invalid signatures, malformed signed JSON and an unconfigured secret. This closes a code-side invalidation gap; deployment verification is still needed to establish whether an additional live CDN cache rule contributes to the observed discrepancy.

## Validation and remaining limits

The regression suite checks actual production HTML for both languages: native JSON-LD script output, canonical/page identities, connected graphs, software offers/platforms, publisher address, service/branch/profile data, directory slices, hidden website fields, FAQ content and malicious merchant text. CMS access is deliberately disabled in that isolated build. Article helper tests cover field construction, and the live inventory audit covers missing posts; neither proves integration through a populated article route.

| Validation | Final result |
| --- | --- |
| Full unit suite | 21 test files passed, including six signed-webhook cases |
| Framework checks | Passed |
| TypeScript | Passed |
| ESLint on changed code | Passed |
| Production build and rendered HTML suite | 14 checks passed across both locales; 30 JSON-LD documents inspected |
| Updated rendered graphs against official vocabulary | 472 typed nodes, 1,602 properties and 512 typed object ranges; zero mismatches |
| Patch whitespace checks | Passed |

The [rendered vocabulary evidence](data/2026-11-17-structured-data-rendered.json) records each inspected page and its check counts. These are custom vocabulary checks, not a Google Rich Results Test or an official validator certification. The ad hoc vocabulary checker is not retained in the repository; the automated commands below reproduce the application checks. JSON-LD snapshots are also saved as Playwright artifacts under `/tmp/zavoia-structured-data-tests` when the suite runs.

Repeatable checks:

```sh
npm run test:unit
npm run test:framework
npx tsc --noEmit --incremental false
npm run test:e2e:structured-data
```

Missing real venue addresses/photos, a confirmed author profile URL and genuine app review data require authoritative content. They should not be filled with placeholders to remove optional warnings. General policy requires markup to match the page and avoid misleading claims. [Google structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Historical build note: the initial run used Next.js 16.4.1 and emitted an upgrade recommendation. That run completed through Next's documented retry flow; the test harness preserves only that retry receipt while still clearing application/build caches. The checkout has since been upgraded separately to **16.4.6**, and the follow-up validation was rerun on that version. The earlier recommendation is not being reported as a current 16.4.1 installation.

Deployment, any live cache refresh, and Google's Rich Results Test/URL Inspection after deployment remain separate from the local source validation. No production content or cache was mutated by this audit.
