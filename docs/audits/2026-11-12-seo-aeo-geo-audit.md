# SEO / AEO / GEO audit — zavoia-web

Audit of the current working tree, 12–13 November 2026. Branch `staging`, HEAD `72bc5e9` plus your uncommitted work (143 modified and 64 untracked files, none of them touched by this audit).

**What was measured.** A production build of today's tree (Next.js 16.4.1, built 12 Nov 20:58; TypeScript passed; no source, public or config file has changed since, checked again on 13 Nov), served locally and fetched as Chrome, Googlebot (smartphone), GPTBot and Bingbot. That came to 624 URLs and 2,016 requests:

- every one of the 324 sitemap URLs
- 300 variants and probes (IDs, case, encodings, tabs, filters, missing pages, crawl files)

Alongside that:

- a link-graph crawl of 2,984 URLs
- a headless Chrome render of 330 pages
- a throttled lab-performance pass
- a dev-server comparison
- a read of the source behind every route

External rules come from three research files in `docs/audits/research_notes/SEO AEO GEO primary sources/`, summarised in `docs/audits/reports/SEO AEO GEO primary sources.md`. I re-fetched every cited page myself. 847 of 1,037 quotes match word for word, and the 35 rules this report relies on were checked one by one.

**Labels.**

- **Verified**: I saw it in the production build's output, or re-read the code at the cited `path:line`.
- **Not checkable locally**: needs something outside this machine. The check is listed in section 12.
- **Dropped**: could not be reproduced. Listed in section 15.

The raw capture files lived in the session's temporary folder, which the machine's restart on 13 Nov at 06:39 erased. The numbers in this report were read from those files before the restart, and every runtime fact can be reproduced with the commands in section 16. Code citations are to the files in your tree.

**Your fixed decisions were respected and are not re-proposed:**

- www canonical host
- English unprefixed with Romanian under `/ro`
- no ratings, `priceRange` or LocalBusiness subtypes in location markup
- no footer or home links to city pages
- location breadcrumb as markup only
- mockups before SEO-driven UI changes
- skeletons, never visible loading text

---

## Launch reading (added 13 November 2026)

This section re-reads the audit for the launch situation you described on 13 November. Where it sorts the work differently from section 2, follow this section. Item numbers (P0-1 to P2-12) are unchanged, so the evidence for each item is still in section 2.

**The situation.**

- Nothing is released. Production shows only the coming-soon page.
- The legal pages (terms, cookies, legal links) are still being written.
- All local data is seed data. On launch day the marketplace has no businesses, and that lasts until marketing brings them in.
- The test blog posts will be replaced by real posts before launch.

**What that changes.**

- **The audit measured a seeded marketplace. Launch day is a marketing site with a blog.** With zero businesses the sitemap holds 40 URLs plus two per blog post: home, industries, for-business, pricing, web-studio, help, the blog index and the legal pages, each in two languages. Findings on those pages come first (group A).
- **Location, brand, professional, category and microsite pages don't exist until businesses do.** Their findings are real, but the deadline is the day the first businesses go public, not launch day (group C).
- **Numbers taken from seed data describe the seed.** The mechanisms behind them are real, and one gets worse with real data: a single business makes its industry page and each of its service pages indexable, so the first businesses will produce single-listing, duplicate category pages faster than the seed did.
- **Legal and blog content are work you already have in hand.** The audit adds one code guard and a few rules for the people writing posts (groups A and B).

**How this section was checked.** I read the code behind every statement about the empty marketplace. Two checker agents, both read-only, then tried to disprove the result. One re-read the code for 19 claims: 16 were confirmed and 3 were corrected in a detail. The other compared this section with the rest of the audit for dropped or mis-sorted findings. Their corrections are included below.

### Launch day with zero businesses

The audit could not see this state, because every page it fetched had seed data behind it. The table below is read from the code on 13 November. No build was run against an empty database, so it says what the code does, not what was measured.

| Page | With zero businesses | Evidence |
|---|---|---|
| Home | The hero, the industry rail and the editorial bands (app, trust, Web Studio, for business) render as today. The website showcase and "Recently viewed" render nothing. "In your city" and "Nearby" are in the server HTML as a heading, a link to search and placeholder tiles; they disappear once the browser's location lookup finds nothing. The Brands section stays: its heading, a "See all" link to search, and the line "Brands will show up here soon — check back." | `src/app/_components/home-content.tsx:153`; `home/recently-viewed.tsx:171`; `home/in-your-city.tsx:29, 36-58`; `home/near-you-section.tsx:25, 32`; `home/use-home-coords.ts:19-21, 35`; `home/brands-section.tsx:17-29`; `en.ts:1820` |
| `/industries` | The directory renders from the industry list. The "Industries by city" section is absent. | `src/app/[locale]/industries/page.tsx:112-128, 194-196` |
| City category pages | None is indexable, none is in the sitemap and no page on the site links to one. Two ways in remain: outside links, and old category addresses that Google may still hold, which redirect to the current ones (`src/data/seo.ts:232-256`). An empty category page links to every other category and city without an inventory check, so one visit opens the whole grid of empty `noindex` pages (2,258 in the crawl). C3 closes that. | `[city]/[industry]/page.tsx:114`; `src/lib/seo/category-discovery.ts:37-53`; `category-content.tsx:230, 256`. Link sources on the site: `sitemap.ts:52-67`, `industries/page.tsx:208`, the category page itself, and the location page (`src/lib/seo/location-category.ts:59`) |
| Location, brand, professional, microsite | None exists. Unknown addresses behave as in rows 4 to 7. | — |
| `sitemap.xml` | Works. An empty feed is a normal answer and gives the 40 static URLs plus the posts. A failed marketplace request keeps the last good sitemap. A failed blog request drops the posts silently until the next regeneration, 10 minutes later. | `src/app/sitemap.ts:19-47, 214`; `src/lib/seo/sitemap-feed.server.ts:13-23` |
| `/search` | `noindex`; every search comes back empty. The home industry tiles and the `/industries` cards link to it. | rows 2 and 16 |
| App store badges | The home page and `/for-business` show them as labels, not links, until store addresses exist. | `home/editorial-bands.tsx:81-93`; `for-business/business-app-section.tsx:31-50` |

Nothing breaks, and no empty marketplace page reaches the index. The thin or unfinished pages that would be indexed on day one are in group A: the help page without its answers, and the draft legal documents.

Two things a visitor sees on day one:

- **The Brands line on the home page** (decision 2).
- **The home page still speaks to customers.** The search prompts ("balayage near me"), the industry tiles and the "Booking with Zavoia" band all lead to empty results (`en.ts:1790-1803, 1842-1857`). That is a product call, not an SEO defect, so it is noted here and nowhere else.

### A. Before launch: the pages that exist on day one

| # | Do | Why it matters at launch | Items | Effort |
|---|---|---|---|---|
| A1 | **Web Studio page.** Fix the doubled "… Zavoia \| Zavoia" title, add Open Graph and Twitter tags, and keep the fictional example businesses out of the text Google reads. | It sells to businesses, which is the launch goal. After JavaScript the page grows from 1,010 to 6,265 words, most of them invented business data. With no real businesses, that is the only business data on the site. | P1-8, P2-1 | S–M; mockup if the previews move |
| A2 | **Reading order on the blog index, blog posts and Web Studio.** This also removes the second h1 and the extra `<main>` elements those pages ship today. | The blog is your main search content at launch. Today a post's text sits after the footer in a hidden block, with the blog index skeleton in its place. Google recovers it; HTML-only AI fetchers may not. | P1-1 (three of its five routes), P2-12 (third bullet) | M, plus decision 1 |
| A3 | **Help answers in the HTML,** with the topic names as headings. | None of the 8 answers can be read by a crawler, and the page has 121 words. | P1-6; row 13 | S |
| A4 | **Language on the `/for-business` sign-up links.** | Sign-ups are the launch goal, and three of that page's buttons drop the language. | P2-11 | S |
| A5 | **Layout shift on `/pricing`.** | A sales page. Lab CLS 0.167 against a 0.1 threshold. | P2-6 | S |
| A6 | **Sharing tags.** A default share image and site name in the layout, tags on `/help`, `/terms` and the legal documents, the site name on blog posts. | Launch marketing means links pasted into chats and social posts. | P2-1 (launch part) | S |
| A7 | **Legal status guard.** Tie three things to each document's `status`: `noindex`, sitemap membership and whether drafting notes render. | A safety net for the switch: an unfinished document can't go public by accident. The documents themselves are group B. | P0-1 (code part) | S |
| A8 | **Blog set-up for the real posts.** See the list below. | The posts are about to be written, so the rules are cheapest to set now. | new; P2-5, P2-10 | S–M |
| A9 | **Zavoia's own Organization markup:** legal name, address, contact, profile links. | For a new brand this is the main statement of who Zavoia is, for Google and for AI engines. It needs the company facts from group B. | P1-5 (Organization part), P0-2 | S |
| A10 | **Small items.** Remove the README and scaffold files from `public/`, the `host` line from robots, and `changefreq` and `priority` from the sitemap. Server-render the 404 text, give `/blog/<missing>` and `/terms/<missing>` their own not-found title, and give dotted and unsupported-language addresses a title. Fix the English alt text on the Romanian share image. | Cheap. | P2-12, P2-5, P2-9; rows 1 and 23 | S |

Blog set-up (A8):

- **Both languages or neither.** A language version of a post exists as soon as its title and slug exist in that language. Body and excerpt are optional and don't fall back to the other language (`src/lib/blog/alternates.ts:10-14`; `src/app/_components/blog/blog-post.tsx:30, 43`). A post with a Romanian title and slug but no Romanian body becomes an indexable page with no article text. It also has no description unless the Romanian excerpt or SEO description is filled in (`src/app/[locale]/blog/[slug]/page.tsx:59-62`). Rule for writers: fill in title, slug, excerpt and body for a language, or leave that language's slug empty.
- **Paging and categories.** The index shows one featured post plus six, and the server always sends page 1 (`src/app/_components/blog/blog-list.tsx:17, 89-93`). From the eighth post on, older posts are linked only after JavaScript runs. Give pages real addresses before then. Category views work the same way and keep `/blog` as their canonical, which is fine.
- **Author and dates.** Posts carry no author and no modified date, because Sanity has no field for either (`src/lib/seo/page-structured-data.ts:140-142`). Google's article guidance lists both as recommended and nothing as required. Adding an author field before the real posts go out is decision 3.
- **Slugs are permanent.** Changing a published slug leaves the old address as a 404 (row 14).
- **Timing.** A scheduled post appears on the blog within the hour and in the sitemap within 10 minutes (row 14).
- **Unpublishing.** A cached page can outlive a post that is unpublished without the webhook firing (flow 18). Delete the test posts before the first production build, so no copy of them is ever cached.
- **Language link.** Blog pages have the other-language link only inside `<noscript>` (P2-10). The hreflang tags already cover discovery.
- **Sitemap date.** A post's `lastmod` is its publish date (P2-5). That is accurate unless you revise posts later.

**For AI answers at launch.** With no businesses, an AI engine can learn about Zavoia only from the marketing pages, the help page, the blog and the legal pages. Three items above decide how much it gets: A2 (post text in reading order), A3 (help answers in the HTML) and A9 (who Zavoia is). The fourth is the Cloudflare setting in group B.

**Smaller day-one observations.** These are in the audit, concern pages that exist at launch, and are not worth holding the launch for:

- **Home.** The industry rail and the Brands block still arrive in hidden blocks after the footer (row 1). The heading, the hero and the bands are in place, so the cost is small.
- **`/for-business` and `/pricing`.** The descriptions run to 173–216 characters, so Google will cut them (rows 8–9). `/pricing` has no `#plans` anchor, and nothing links to one.
- **`/help`.** "Report an issue" needs JavaScript, so there is no contact route without it until the company page carries a real contact (row 13). The title and the heading share few words, as on `/web-studio` (section 7).
- **Blog.** The share button uses the current address, not the canonical one (flow 21).
- **Legal pages.** The Romanian breadcrumb label is in English, the contents rail doesn't set the `#hash`, and an unknown document address gets a near-empty 404 that is cached for a year (row 15).
- **Redirects.** Two hops on `/en/` and on `/account` (rows 17–20 and 24).
- **Structured data on the marketing, help and legal pages.** There is none, and no action is needed, because no Google result type fits them (rows 8–9).
- **`/search`.** Unchanged, and low priority while it stays `noindex` (row 16).
- **Your documents and tests.** The stale statements in RENDERING.md and README.md, and the two e2e specs that contradict each other (section 11), are housekeeping with no effect on launch.

### B. Launch gates you already have in hand

These are content, data and configuration, not code findings. The audit's part is the reminder and the evidence.

- **Legal documents and company identity** (P0-1, P0-2). Three things from this audit for that work:
  - The help answer "Every business on Zavoia is identity-checked before it can accept appointments" (`en.ts:4017`), against the drafting note that says the flow isn't built yet (`src/data/legal/provider-terms.ts:76`).
  - The `ipwho.is` call before consent on the home and industries pages (flow 19).
  - The search page loads Mapbox (flow 19).
- **Blog.** Real posts in; the four test posts removed from the Sanity `production` dataset, which is the one this code reads (P0-3; `src/sanity/env.ts:4`).
- **Production database.** Reference data only: the industries, with their Romanian names (correction 1). No seed businesses, professionals or websites (P0-3, merchant part).
- **App store links**, once the apps are published.
- **Configuration at the switch:** site address, API address, asset host and Sanity dataset in the production build; login protection on preview deployments; the Cloudflare AI-crawler setting (section 12); the sitemap in Search Console.
- **After the switch:** the Search Console checks in section 12 (indexing, soft-404 classification, the AI-features setting) and the API-outage test.
- **Phone icons.** The coming-soon page declares an `apple-touch-icon` and a 96 px PNG; the marketplace declares only `favicon.ico` (`src/app/[locale]/layout.tsx:52-54`). The `.ico` holds 16 to 256 px images, which is enough for Google. Phones lose their home-screen icon.

### C. Before the first businesses are public

| # | Do | Why it matters once businesses arrive | Items | Effort |
|---|---|---|---|---|
| C1 | **Decide when a category page may be indexed.** | Today one listing is enough. That is a rule written into the code with its reason (`[city]/[industry]/page.tsx:110-114`), and one business qualifies its industry page and each of its service pages (`category-discovery.ts:44-51`). Early businesses arrive one per city and service, so nearly every indexable category page would list a single business and repeat another page. | P1-3 | S, decision 6 |
| C2 | **Decide which page represents a business, and tidy the numeric addresses.** Make the brand canonical the slug when one exists, or redirect the number to it. Decide whether brands without a slug belong in the sitemap. Optionally redirect `/business/{id}` to its slug. | A business with a published website has three indexable pages: its location page, its brand page and its microsite. The brand page and the microsite take title and description from the same two fields (`brand/[slug]/page.tsx:45-46`; `[city]/page.tsx:63-64`), and the brand page has no single-location case (`brand/_components/brand-detail.tsx:81`). Short addresses (slugs) are optional (`admin-api/src/modules/marketplace/public/marketplace-public.service.ts:553`), so a new brand starts at `/brand/{id}` and gains a second address when it picks one. | new; P1-4 | S for the P1-4 part; decision 7 |
| C3 | **Stop linking empty category combinations.** | The first indexable category page links to every other category and city, nearly all of them empty. | P1-2 | S–M, mockup |
| C4 | **Reading order on location and brand pages.** | The same fix as A2, on the two routes that hold the business content. The skeleton trade-off is the same too (decision 1). | P1-1 (its other two routes) | with A2 |
| C5 | **Business markup:** the name as brand plus branch, the country as `RO`, the phone with its country code. Also a description and a link to the site on the category page's markup. | It applies to every business page from the first one. The country is passed through from the address data as stored (`src/lib/locations/structured-data.ts:38`). The markup also publishes the email a business enters for its location (`:120`), so that field is public. | P1-5 | S |
| C6 | **Microsite:** structured data, real alt text, text that stays visible. | The first published websites are also your showcase for Web Studio. | P1-7 | M |
| C7 | **Location heading and description.** | The heading is the branch name alone. | P2-2 | S, mockup |
| C8 | **Re-test what this audit could not exercise:** Romanian category addresses (correction 1), a category with more than 24 results, and a location with booking switched off. | Local data had none of the three. | P2-4, re-scoped; section 12 | S |
| C9 | **Towns outside the 13 configured cities.** | A location anywhere else gets no category page, no category link and no breadcrumb markup (`src/lib/seo/location-category.ts:47-49`). It can end up with no internal link at all: the sitemap lists it, but the home Brands section shows only ten brands and search results aren't in the HTML. The seed's city-less test locations show exactly that (flow 1). The first businesses may well be in such towns. | new | decision 8 |
| C10 | **Small template items.** The "Other in Bucharest" title; the word "photo" inside the link text of cards without an image; professional titles that are only a name, with no `og:locale`; a brand without a description gets no meta description; location images without width and height; the other-language link on category pages. Category share images come with A6. | Each shows up on the first real pages. | rows 3, 5 and 6; section 7; P2-1, P2-10 | S |

### D. Seed-data artefacts: nothing to fix

- **The seed values themselves:** the personal Gmail, the Lorem-ipsum descriptions, and the images from `picsum.photos`, `i.pravatar.cc` and the staging asset host (P0-3; rows 6 and 21; section 9).
- **The test locations and the "assignments" test brand themselves.** The behaviour they exposed is real and sits in C9 and C10.
- **The exact counts for business pages:** 54 indexable categories, 50 duplicates, 44 single-listing pages, 2,258 empty pages, the word medians and the similarity scores. They describe the seed. The mechanisms behind them are in groups C and E.
- **P2-4 as first written** (correction 1).

### E. Later, with businesses and traffic

- Richer brand, professional and category pages (P2-3).
- A smaller translation payload per page (P2-7), and caching for the home, industries and professional pages (P2-8).
- Image performance and real-user speed, which can't be measured locally (section 12).

### Corrections to the audit from this re-read

1. **Romanian category addresses (P2-4).** The audit said all 91 industry and service entries lack a Romanian name, so Romanian category addresses use English words. That is true of the local database only (re-checked on 13 November: 0 of 14 industries and 0 of 77 services have one). The seed written for production sets a Romanian name on all 91 (`admin-api/scripts/supabase-seed-1-industries.sql`, section 3). With those names the addresses become, for example, `/ro/bucuresti/frizerie`. I computed all 91 Romanian slugs from that file: no two collide, and none equals another entry's English slug. Three stay the same in both languages (`spa-wellness`, `med-spa`, `yoga-pilates`). What remains is a test gap. Every Romanian category URL this audit fetched used English words, so alternates, redirects and the language switch were never exercised with Romanian slugs (C8). The warning about later renames still holds (`src/data/seo.ts:134-136`).
2. **Sitemap dates (P2-5).** The audit advised adding `lastmod` to locations, professionals and categories. The code leaves them out on purpose and says why: no single timestamp covers a page's services, team and reviews (`src/app/sitemap.ts:61-62, 249-251, 272-273`). That agrees with Google's rule to give `lastmod` only when it is accurate, so that advice is withdrawn. P2-5 and row 21 now say so. What is left of P2-5 is small: posts use their publish date, and `changefreq` and `priority` can go because Google ignores them.
3. **Help page (row 13).** The audit said the help page has no business answers. It has one business question out of eight, "How do I list my business?" (`en.ts:4024-4027`). Row 13 is corrected.
4. **Category indexing (P1-3).** Indexing a category page from its first listing is a documented rule, not an oversight (`[city]/[industry]/page.tsx:110-113`). Changing it is your decision (C1).
5. **Blog paging (section 3).** The audit said to add page addresses "before 7+ posts". The index shows a featured post plus six, so the limit is the eighth post. Section 3 is corrected.
6. **Coming-soon page (section 10).** Polishing its tags is only worth doing if the page stays up for more than a few weeks.

### Decisions, in launch order

Your answers of 13 November are recorded here.

**Before launch**

1. **Skeletons (A2, and later C4). Decided:** remove them on these routes. Fixing the reading order removes the instant full-page skeleton when someone navigates to those pages. You asked whether that is safe for SEO and AI search. It is the fix itself: the route-level loading file is what moves the text behind the footer, and every route without one has its content in order (P1-1). The blog and Web Studio pages are pre-built, so a visitor rarely waits. The same choice comes back for location and brand pages at C4, where DESIGN.md's location rule already asks for small boundaries.
2. **The Brands line on an empty home page. Decided:** hide the section while it is empty, as the website showcase already does.
3. **Blog author (A8). Decided:** "Carmen from Zavoia" as the byline. In the markup, Google asks for the person's name alone in `author.name`, so only the name goes there and Zavoia stays the publisher.
4. **AI-crawler policy. Decided:** allow them. Never choose "Block" in Cloudflare, which also blocks Google and Bing (section 12).
5. **Unknown one-word addresses answering 200. Decided:** keep it for now. The textbook answer is a real 404, but on these routes Next 16.4.1 sends a real 404 with an empty page until JavaScript runs (the open Next issue linked at `README.md:79`). The current full page with `noindex` is the better trade until that is fixed. Revisit on the Next upgrade.

**Before the first businesses**

6. **Category index rule (C1). Decided:** index a category page from two listings. Apply the same rule to the sitemap and to the "Industries by city" links. Still open, for when it is built: what to do when a service page and its industry page list the same businesses.
7. **Which page represents a business (C2). Decided:** all three stay indexable: the business's own website, its location page and its brand page. Two fixes keep them from competing. Give the brand page its own title and description, because today they are identical to the website's. Point `/brand/{id}` at the slug once one exists. A brand page with one location is thin (49 words at the median), so it gets more content (P2-3) instead of being hidden.
8. **Towns outside the 13 cities (C9). Decided:** add a city when its first business is approved.

**Not changing**

9. **Merchant text is not translated. Decided:** owners write their names and descriptions in the language they choose, and the pages show them as written.

**To see launch day rendered.** Point a local production build at an API with an empty database, then fetch the home page, `/industries` and `sitemap.xml`. That needs a build, so it was not done in this pass.

---

## 1. Where you stand

**Solid.**

- **Head, canonicals and hreflang.**
  - Every indexable page returns 200 with exactly one `<title>` and a canonical in `<head>`.
  - The en/ro/x-default alternates are reciprocal; across all 324 sitemap URLs the only mismatch is `https://www.zavoia.com/` vs `https://www.zavoia.com` on the home page, which Google treats as the same URL.
  - All 395 HTML pages that return 200 have a valid `<head>`.
  - Robots meta tags match sitemap membership, and no sitemap URL is non-200 or noindex.
- **The same document for every crawler.** Only 13 of about 460 URLs differ between the four user agents, and none of them is an indexable page.
- **Status codes are honest for most shapes.** Missing locations, categories, professionals, blog posts and legal pages return real 404s. Legacy, `/en` and trailing-slash URLs return 308, and private pages are noindex, disallowed, or both.
- **The link graph is clean.** No internal link points to a redirect or a 404, and every important page sits within four clicks of the home page.
- **Marketing and legal pages work without JavaScript.** `/for-business`, `/pricing`, `/terms` and `/industries` are in order, in the HTML, and readable that way. Prices and FAQ answers are server text.
- **Lab performance is good apart from one spot.** LCP was 1.1–1.7 s on every family under 4× CPU slowdown and slow-network emulation. The exception is a layout shift on `/pricing`.

**Not solid.**

This list is the seeded marketplace as measured. Item 3 and the test posts in item 6 are work you already have in hand, and item 2's counts come from seed data. The launch reading above sorts all six by when they matter.

1. **The main content of location, brand, blog and Web Studio pages ships out of order** (98 sitemap URLs). The real page, its h1 and its JSON-LD sit in `<div hidden id="S:0">` after the footer. In place there is only a skeleton (median 23 words on a location page, 1 on a brand page). Google renders JavaScript and recovers the page. HTML-only AI fetchers (ChatGPT, Claude, Perplexity) get text that is detached from its heading and marked `hidden`, the attribute that the widely used Readability extractor deletes.
2. **Category pages generate thin and duplicate URLs at scale.**
   - 2,258 empty `noindex` category pages are reachable through internal links. Category pages carry 89,970 links to `noindex` pages in total (empty categories, search and account links).
   - Of the 54 indexable categories per language, 50 show exactly the same listings as another page in the same city (only 21 distinct sets).
   - 44 of them list a single location.
3. **The legal pages are not publishable.**
   - All 12 documents are drafts, yet indexable and in the sitemap.
   - They show 47 internal drafting notes per language as visible callouts (for example, "the Google-signup path bypasses the terms checkbox").
   - The company page shows `[COMPANY NAME S.R.L.]`.
4. **Thin entity pages.** Medians are 49 words in `<main>` on brand pages, 115 on professional pages and 119 on category pages. Merchant text is untranslated, so English and Romanian merchant pages are near-duplicates.
5. **Structured data is present but weak where it matters.**
   - The LocalBusiness `name` is the branch only, `addressCountry` is "Romania" instead of `RO`, and the `Organization` has only name, url and logo.
   - There is no markup on the microsite, `/help`, the legal pages or the marketing pages.
6. **Smaller head and content gaps.**
   - No Open Graph or Twitter tags on `/web-studio`, `/help` and all 26 legal URLs.
   - Help answers are absent from the HTML.
   - Blog test posts sit in the production Sanity dataset and the sitemap.

Prioritised actions follow in section 2.

---

## 2. What to do — prioritised

**Read the launch reading first.** It re-sorts these items for a launch with no businesses yet, withdraws part of P2-5 and corrects the premise of P2-4. The tables below are the audit as measured, in its original order.

Effort: S is under a day, M is 1–3 days, L is more. "Decision" means a trade-off only you can make. "Mockup" means a visible UI change, which needs a mockup first under your rules.

### P0 — before the marketplace launches

| # | Action | Why (evidence) | Where | Effort |
|---|---|---|---|---|
| P0-1 | Keep legal documents with `status: "draft"` out of the index and the sitemap (`noindex` plus a sitemap filter). Never render `kind: "note"` blocks on public pages; show them only in a draft preview. | 24 indexable sitemap URLs render 47 drafting notes per language, including "NONE of this flow exists in code yet — no CUI collection…" (`src/data/legal/provider-terms.ts:76`). That note contradicts the help answer "Every business on Zavoia is identity-checked" (`src/i18n/dictionaries/en.ts:4017`). Notes render unconditionally (`src/app/[locale]/terms/[document]/page.tsx:62-63`), although `src/data/legal/types.ts:18-20` says "while status=draft". The sitemap ignores status (`src/app/sitemap.ts:189-195`). | terms page, sitemap | S |
| P0-2 | Fill in the operator identity before publishing: legal name, registered office, contact. Then add it to the `Organization` markup (`legalName`, `address`, `contactPoint`). | `/terms/company-info` shows `[COMPANY NAME S.R.L.]`, `[full address]` and `[contact/support email address]` (`src/data/legal/company-info.ts:34, 38, 72`). The `Organization` node has only name, url and logo (`src/lib/seo/page-structured-data.ts:23`). | legal data, structured data | S (once the facts exist) |
| P0-3 | Clean the production datasets. Unpublish the four Sanity test posts (`test1`, `test2`, `test23`, `test233`). Make sure production merchant data has no test businesses, Lorem-ipsum descriptions or personal email addresses. | The Sanity `production` dataset (`src/sanity/env.ts:4`, `.env`) serves the four posts. They were prerendered in the build and are listed in the sitemap as 8 URLs with Lorem-ipsum bodies. Local seed data puts a developer's personal Gmail into public LocalBusiness `email` markup, because markup takes `listing.location.email` (`src/lib/locations/structured-data.ts:120`). | data, not code | S |

### P1 — high impact

| # | Action | Why (evidence) | Where | Effort / conflicts |
|---|---|---|---|---|
| P1-1 | **Put main content back in reading order** on location, brand, blog index, blog post and `/web-studio` pages. Replace the route-level `loading.tsx` with Suspense limited to the small client parts, which is what DESIGN.md's own location rule asks for. Keep navigation feedback with a pending state on the link instead of a full-page skeleton. | **The facts:** 98 sitemap URLs carry their h1, text and JSON-LD after the footer inside `<div hidden id="S:0">`.<br><br>**The cause:** each of the seven routes with a `loading.tsx` (`business/[slug]`, `brand/[slug]`, `blog`, `blog/[slug]`, `web-studio`, `web-studio/demo`, `search`) is out of order, and every route without one is in order. React writes a finished boundary out of line once the flushed bytes exceed `progressiveChunkSize` (12,800; `next/dist/compiled/react-dom/cjs/react-dom-server.node.production.js:4134-4141, 7017, 4192-4193`).<br><br>**What doesn't help:** the user agent makes no difference. A Bingbot cold render (`x-nextjs-cache: MISS`) had the same structure, so adding AI bots to `htmlLimitedBots` would not fix it. | `src/app/[locale]/{business/[slug],brand/[slug],blog,blog/[slug],web-studio}/loading.tsx` | M. **Decision:** you lose the instant skeleton on client-side navigation to these pages. DESIGN.md asks for skeletons on initial content; its location section (around lines 964–986) asks for small Suspense boundaries around query reading. |
| P1-2 | **Stop linking empty category combinations.** Filter "other industries", "services" and "other cities" with the same eligibility data the sitemap uses (`getCategoryDiscoveryGroups`). | 2,366 category URLs are reachable, 2,258 of them empty and `noindex`. Category pages carry 89,970 links to `noindex` pages in total (empty categories plus search and account links). The lists come from the full taxonomy and all 13 cities with no inventory check (`src/app/_components/category-content.tsx:42-99`). README.md:93 documents this. | category-content | S–M. **Mockup:** fewer visible links. |
| P1-3 | **Index only category pages that add something.** Keep a service-level page `noindex` and out of the sitemap when its listings equal its industry page's in that city, and/or require 2–3 listings. Change the indexing rule and the sitemap rule together. | One location makes its industry and every one of its tags indexable (`src/lib/seo/category-discovery.ts:44-51`; `src/app/[locale]/[city]/[industry]/page.tsx:114`). The one-listing threshold is a documented rule (`:110-113`), so changing it is a decision. Recomputed from the local API: 54 pages per language, only 21 distinct listing sets, 50 duplicating another page in the same city, 44 with one listing. For example, `cs-rapid-militari` alone fills `/bucharest/automotive`, `auto-repair-garage`, `tire-service` and `vehicle-inspection-itp`. | page.tsx, category-discovery, sitemap | S. No UI change. |
| P1-4 | **Consolidate duplicate entity URLs.** Make the brand canonical the brand's slug when one exists (or 308 the numeric ID to it). Decide whether brands without a slug (`/brand/{id}`) belong in the sitemap. Optionally 308 `/business/{id}` to its slug. | `/brand/59` (an alias of `/brand/cs-nova`) is 200, indexable and canonical to itself, because the canonical uses the requested slug (`src/app/[locale]/brand/[slug]/page.tsx:61`). `/brand/2, 3, 4, 5, 10, 11` are linked from brandless locations and indexable, but not in the sitemap. `/business/76` returns 200 with a canonical to `cs-nova-cluj` (works; Google calls a redirect the strong signal). | brand page, sitemap | S |
| P1-5 | **Fix the LocalBusiness and Organization markup.** <ul><li>`name` = brand plus branch.</li><li>`addressCountry` = `"RO"`.</li><li>Phone in E.164 (`+40…`).</li><li>Add `sameAs` for the Zavoia Organization once its profiles exist.</li><li>Give category `CollectionPage` a description and an `isPartOf` link to the WebSite.</li></ul> | The `name` is the branch only, e.g. "Centrul Vechi, salon de înfrumusețare și relaxare" (`src/lib/locations/structured-data.ts:104, 165`), while Google defines `name` as "the name of the business". `addressCountry` is "Romania" or "România" (`:38`); Google's Organization docs ask for ISO 3166-1 alpha-2, and schema.org V30.1 recommends it. One seed phone is `0748769719`. The category JSON-LD has no description or `isPartOf` (`category-content.tsx:73-80`). Closed days are already correct as `00:00`–`00:00`, per Google's rule (`structured-data.ts:76-77`). | structured-data.ts, category-content | S. Respects your fixed decisions: no ratings, priceRange or subtypes. |
| P1-6 | **Put the help answers in the HTML.** Render them in native `<details>`, as `/for-business` does (`src/app/_components/for-business/faq-section.tsx:74`). | None of the 8 answers is in the server HTML or the DOM until clicked, so `/help` has 121 words in `<main>`. The cause is `src/app/[locale]/help/_components/help-center.tsx` (`openId` starts `null`, and the answer renders only when open). Google indexes collapsed content that is in the page code, but not content loaded on click. | help-center | S. The look can stay the same. |
| P1-7 | **Microsite fixes.** <ul><li>Emit `LocalBusiness`/`Organization` JSON-LD.</li><li>Use a real alt fallback (business or location name) instead of the uploaded file name.</li><li>Make reveal animations independent of `<main>` scrolling, or give the text a visible default.</li></ul> | The microsite has no JSON-LD. 28 gallery alts are file names, because `alt: image.originalName` (`src/features/website/components/builder/gallerySelection.ts:43`). After JavaScript, 86 words stay at opacity 0: `<main>` scrolls internally (10,133 px inside a 915 px page; `src/app/[locale]/[city]/_components/business-microsite.tsx:175`), so the scroll reveals (`…/sections/faq/motion.ts:71`, `…/about/base.css:79-80`) never fire. | website renderer | M |
| P1-8 | **Web Studio: keep fictional businesses out of the indexable page's text.** Wrap the showcase in `data-nosnippet`, or move the live previews behind the noindex demo, and label them as examples. Also fix the title and add Open Graph tags. | After JavaScript, `/web-studio` grows from 1,010 to 6,265 words. Most of that is invented business data (addresses, prices "from 130 lei", opening hours, an `@…example.test` email), which Google's renderer reads as page content. The title is "Web Studio: your own website, connected to Zavoia \| Zavoia" (`en.ts:3226` plus the template at `src/app/[locale]/layout.tsx:47`). No OG or Twitter tags (`src/app/[locale]/web-studio/page.tsx:19-20`). | web-studio | S–M. **Mockup** if previews move. |

### P2 — worthwhile

| # | Action | Evidence | Where |
|---|---|---|---|
| P2-1 | Add Open Graph and Twitter tags to `/web-studio`, `/help`, `/terms` and the legal documents. Add og:image and site_name to categories, `og:locale` to professionals, and site_name to blog posts. | Missing on 2 + 2 + 26 URLs, 108 categories (no og:image or site_name, and no Twitter image), 80 professional pages (no og:locale) and 8 posts (no site_name). The layout has no default `openGraph` (`src/app/[locale]/layout.tsx:51`). Causes: category `page.tsx:119-128`, help `page.tsx:31`, blog post `page.tsx:87`, professionals `page.tsx:41-57`. Google uses `og:image` as a preferred thumbnail (Discover docs). | metadata |
| P2-2 | Location h1: show brand plus branch (**mockup**). Location meta description: a template (brand, branch, industry, city) plus the merchant text, in the page language. | The h1 is `displayName`, the branch only, e.g. "Aviației" (`src/app/[locale]/business/_components/business-detail.tsx:371`). The description is raw merchant text, often Romanian on English pages and 27–51 characters long (`src/lib/locations/metadata.ts:55`). | location |
| P2-3 | Add real content to brand pages (median 49 words), professional pages (115) and category cards: hours, the services summary already in the payload, amenities. **Mockup.** | The thin-page counts are in section 7. Category intros promise "Check reviews and opening hours…" (`en.ts:1926`), yet cards show only name, business, address and rating (`src/components/business/business-card.tsx:254-258`). | entity pages |
| P2-4 | Romanian category slugs: set `nameRo` in the taxonomy, and add redirect entries when a Romanian slug changes. | **Corrected in the launch reading (correction 1): true of the local database only. The seed written for production has Romanian names for all 91.** All 91 taxonomy entries have `nameRo: null` in the local API, so `/ro/bucuresti/beauty` uses English industry slugs (`src/data/seo.ts:151-158`). Filling them later changes every Romanian URL; only the 13 legacy slugs redirect (`:240-279`). | taxonomy data, seo.ts |
| P2-5 | Sitemap: <ul><li>Withdrawn (launch reading, correction 2): adding `lastmod` for locations, professionals and categories. The code leaves these dates out on purpose (`src/app/sitemap.ts:61-62, 249-251, 272-273`).</li><li>Keep the publish date for posts, and add an "updated" date field if you start revising them.</li><li>Drop `changefreq` and `priority`, which Google ignores.</li></ul> | `lastmod` appears only on blog posts (= `publishedAt`, `src/app/sitemap.ts:160`), brands and the microsite. Google uses `lastmod` "if it's consistently and verifiably accurate", and ignores priority and changefreq (verified quotes). | sitemap.ts |
| P2-6 | `/pricing` layout shift: preload Caveat on the business pages that use it, or reserve the line box. | Lab CLS 0.167 (threshold 0.1) under throttling, 0 unthrottled. The one shift is the hero's Caveat "signature" word changing height (74 → 70 px) as the font swaps. Caveat loads with `display: "swap", preload: false` (`src/styles/fonts.ts:27-35`). | fonts |
| P2-7 | Ship only the dictionary namespaces each page needs. | The locale layout sends the whole dictionary to the client provider (`src/app/[locale]/layout.tsx:66`; the RO source alone is 108 KB). On the median page, 76% of HTML bytes are inline RSC data. The largest page is 460 KB (`/ro/for-business`), well under Googlebot's 2 MB read limit. | layout |
| P2-8 | Cache the home and professional pages (ISR or tagged fetches) instead of rendering every request. | Home is `force-dynamic` (`src/app/[locale]/page.tsx:34`), industries uses `connection()` (`src/app/[locale]/industries/page.tsx:73`), and professional profiles fetch with `cache: "no-store"` (`src/lib/api/marketplace/public.ts:252`). All send `private, no-cache, no-store`, so every bot request is a full render and an API call. | data layer |
| P2-9 | Server-render the 404 message; give `/blog/<missing>` and `/terms/<missing>` not-found metadata. | Real 404s have 6–7 words, no h1 and no `lang`. `[locale]/not-found.tsx` is a client component that reads the URL after hydration. `/professionals` and `/terms/<missing>` carry the home title. `/blog/<missing>` shows the blog index skeleton. Status is correct, so this is low impact. | not-found |
| P2-10 | Put a real `<a href>` to the other language in server HTML on category and blog pages (it is only in `<noscript>` there). | The header switcher treats two-segment paths as needing alternates (`src/i18n/locale-navigation.tsx:48-53`) and renders a disabled placeholder until hydration. hreflang tags still cover discovery. | locale-navigation |
| P2-11 | `/for-business` registration links: pass `?lang=`, as `/pricing` and `/web-studio` do. | The hero (`for-business-content.tsx:51`), the plus plan card (`plan-cards.tsx:56`) and the closing band (`closing-section.tsx:60`) use the bare `REGISTER_URL`. DESIGN.md (around lines 1846–1847) asks to carry the language into registration. | for-business |
| P2-12 | Housekeeping. <ul><li>Remove the `host:` line from robots.ts (Google ignores it).</li><li>Remove the README files and scaffold SVGs from `public/`.</li><li>Give the Studio skeletons no h1 (blog and web-studio ship two h1s and 2–3 `<main>` elements in server HTML).</li></ul> | Sources: `src/app/robots.ts`; `public/images/marketing/examples/README.md` and 3 more; `public/{next,vercel,file,globe,window}.svg`; `src/app/[locale]/web-studio/loading.tsx`; `src/components/ui/page-skeletons.tsx:172-175`. | misc |

**Decisions only you can make** (evidence is in the sections cited). You answered these on 13 November; the answers are in "Decisions, in launch order" in the launch reading:

- **The P1-1 skeleton trade-off.**
- **Unknown one-segment URLs answer 200 with `noindex`.** This is documented and deliberate (`[city]/page.tsx:31`). The measured cost:
  - Case variants of real pages (`/PRICING`) and typos are soft 404s.
  - Each one is rendered and cached as its own ISR entry.
  - Google now states URLs are case-sensitive.
- **Whether to translate merchant text.** English and Romanian merchant pages are near-duplicates: word-set similarity is 0.68 on brands, 0.60 on professionals and up to 0.80 on locations. Google says translating only the boilerplate "can create a bad user experience if the same content appears multiple times in search results".
- **AI-crawler policy.** It is currently allow-all, with no per-bot rules. Your Cloudflare zone setting matters most: since 15 Sep 2026, "Block" also blocks Googlebot, Bingbot and Applebot, while "Disallow AI Training" keeps search.

---

## 3. Index / noindex map

| URL family | Today (verified) | Recommended |
|---|---|---|
| `/`, `/ro` | index, sitemap | keep |
| `/industries` | index, sitemap | keep |
| `/{city}/{industry}` with listings (54 + 54) | index, sitemap | index only when the page adds a distinct listing set (P1-3) |
| `/{city}/{industry}` empty (2,258 reachable) | 200, `noindex, follow`, linked from category pages | stop linking (P1-2); keep `noindex` |
| `/bucharest/barbers` and other legacy slugs | 308 to the current slug | keep |
| `/business/{slug}` (27 + 27) | index, sitemap; 8 brandless seed locations are empty | keep; check production data has no empty listings |
| `/business/{id}`, `/business/00{id}` | 200 + canonical to slug; padded IDs 308 | optional 308 to slug |
| `/business/{slug}?tab=…&member=…` | 200, canonical clean | keep |
| `/brand/{slug}` (16 + 16) | index, sitemap | keep, enrich (P2-3) |
| `/brand/{id}` alias of a slugged brand (`/brand/59`) | 200, self-canonical | canonical or 308 to slug (P1-4) |
| `/brand/{id}` brand without slug (`/brand/2…11`) | index, linked, not in sitemap | decide: sitemap them or give them slugs |
| `/brand/<missing>`, `/brand/CASE` | 200 + `noindex, nofollow` (documented) | consider 404 |
| `/professionals/{id}` (40 + 40) | index, sitemap, dynamic | keep, enrich |
| `/professionals` | 404 (home title) | fine |
| `/{slug}` microsite | index, sitemap | keep; duplicates `/brand/{slug}` (same title and description) |
| `/{unknown}` one-segment, case variants | 200 + `noindex, nofollow` (documented) | consider 404 |
| `/for-business`, `/pricing`, `/web-studio`, `/help` | index, sitemap | keep |
| `/web-studio/demo` (+ 20 linked query variants) | `noindex, follow` | keep |
| `/try` | 308 to `/web-studio/demo` (keeps the query) | keep |
| `/blog`, `/blog/{slug}` | index, sitemap (includes 4 test posts × 2) | keep; remove test posts (P0-3) |
| `/blog?page=…`, `?category=…` | 200, canonical `/blog`, same HTML | fine today (4 posts); add linked page URLs before the eighth post |
| `/terms`, `/terms/{doc}` (13 + 13) | index, sitemap, all drafts | `noindex` and out of the sitemap until final (P0-1) |
| `/search…` (366 linked variants) | `noindex, follow`, not disallowed | keep |
| `/auth…` | `noindex, nofollow` | keep |
| `/login`, `/register` | 307 to `/auth?mode=…`; disallowed | keep |
| `/account` | 307 to `/login` (307 to `/auth`); disallowed | keep |
| `/saved`, `/appointments…` | `noindex, nofollow` | keep |
| `/studio` | `noindex, nofollow` + disallowed | keep |
| `/api/*` | disallowed; GET `/api/revalidate` is 405 | keep |
| `public/` README and scaffold files | 200, unlinked | remove (P2-12) |

---

## 4. How each page family is delivered (production build)

"In place" means words inside the visible `<main>` of the server HTML. "Hidden blocks" means words inside React's out-of-order `<div hidden id="S:n">` after the footer. Medians are over the sitemap URLs of each family.

| Family | Sitemap URLs | Rendering | Cache-Control | Words in `<main>` in place → in hidden blocks | h1 inside a hidden block | JSON-LD placement | Words in `<main>` after JavaScript |
|---|---|---|---|---|---|---|---|
| home | 2 | dynamic (`force-dynamic`) | `private, no-cache, no-store` | 185 → 116 | 0/2 | body, in place | 269 |
| industries | 2 | dynamic (`connection()`) | `private, no-cache, no-store` | 307 → 0 | 0/2 | body, in place | 251 |
| category | 108 | ISR 600 s | `s-maxage=600, stale-while-revalidate=31535400` | 119 → 0 | 0/108 | body, in place | 94 |
| location `/business/*` | 54 | ISR 600 s | same | **23 → 353** | **54/54** | **hidden block** | 83 (inactive tabs hidden) |
| brand `/brand/*` | 32 | ISR 600 s | same | **1 → 49** | **32/32** | **hidden block** | 49 |
| professional | 80 | dynamic (`no-store` fetch) | `private, no-cache, no-store` | 115 → 0 | 0/80 | body, in place | 113 |
| microsite | 2 | ISR 600 s | same as ISR | 447 → 0 | 0/2 | none | 425 (86 at opacity 0) |
| for-business | 2 | static | `s-maxage=31536000` | 1,384 → 0 | 0/2 | none | 1,040 |
| pricing | 2 | static | same | 923 → 0 | 0/2 | none | 726 |
| web-studio | 2 | static | same | **197 → 813** | **2/2** | none | **6,265** |
| help | 2 | static | same | 121 → 0 | 0/2 | none | 121 |
| blog index | 2 | ISR 3600 s | `s-maxage=3600, …` | **25 → 95** | **2/2** | none | 95 |
| blog posts | 8 | ISR 3600 s | same | **25 → 150** | **8/8** | **hidden block** | 148 |
| terms hub | 2 | static | `s-maxage=31536000` | 335 → 0 | 0/2 | none | 335 |
| legal documents | 24 | static | same | 1,232 → 0 | 0/24 | none | 1,142 |

A rich location page (`/business/cs-nova-centru`) shows the pattern clearly:

| What | Position in the HTML |
|---|---|
| Words in place | 98 (23 of them in `<main>`) |
| Words in the hidden block | 2,145 |
| `<main>` starts | character 14,198 |
| Footer starts | character 23,105 |
| Hidden block starts | character 32,310 |
| h1 | character 38,860 |

After JavaScript every hidden block is swapped in, nothing moves into `<body>`, and title, canonical and robots stay the same as in the server HTML.

---

## 5. Page by page

Each block lists what was verified on the production build, then the issues, with links to section 2.

**Row 1 — `/`, `/ro`.**

- **Delivery.** 200, dynamic, `no-store`. One h1, "Local services. On your schedule.".
- **Head.** Title "Zavoia — Discover Local Services & Book Online" and description present. OG and Twitter complete. The Romanian og:image:alt is English (`src/lib/site.ts:43`).
- **Markup.** `Organization` (name, url, logo) and `WebSite` (`inLanguage` en and ro), in place.
- **Out of order.** Three feed sections (the industry rail, the website showcase and the brand cards) are out of order: 116 words in hidden blocks. Their Suspense boundaries are at `src/app/_components/home-content.tsx:81, 89, 93`, fed by unawaited promises at `src/app/[locale]/page.tsx:126-139`.
- **Client-only.** The geo sections "Near you", "In your city" and "Recently viewed".
- **Third party.** On load the page calls `ipwho.is` (IP geolocation) when geolocation isn't granted (`src/app/_components/home/use-home-coords.ts:68, 88`). This happens before any consent; the privacy policy names it (`src/data/legal/privacy-policy.ts:237`).
- **Issues:** P2-8 (no-store), P1-5 (thin Organization), P2-1 (Romanian alt).

**Row 2 — `/industries`.**

- **Delivery.** 200, dynamic (`connection()`), in order, 307 words.
- **Markup.** `BreadcrumbList` and `CollectionPage`.
- **Links.** The "Industries by city" section links only to category pages that have inventory (`src/app/[locale]/industries/page.tsx:112-128`). Industry cards link to `noindex` `/search?industry=…` (`:93`).
- **Third party.** It also calls `ipwho.is` (industry browser).
- **Issues:** P2-8.

**Row 3 — `/{city}/{industry}`.**

- **Delivery.** ISR, in order. JSON-LD (`BreadcrumbList` and `CollectionPage`) in place. Median 119 words in `<main>`.
- **Variants:**

  | Variant | Result |
  |---|---|
  | Zero results (`/constanta/beauty`, `/bucharest/barbershop`) | 200 + `noindex, follow` |
  | Legacy slug (`/bucharest/barbers`) | 308 |
  | Unknown city or industry (`/atlantis/beauty`, `/bucharest/not-an-industry`) | 404 |
  | Wrong-language city slug (`/bucuresti/beauty`, `/ro/bucharest/beauty`) | 404 |
  | Case variant (`/Bucharest/beauty`) | 404 |
  | `?page=2` and tracking queries | same HTML, canonical clean |
  | More than 24 results | not present in local data; from code, the page shows 24 and links "view all" to `noindex` `/search` (`src/app/[locale]/[city]/[industry]/page.tsx:39`; `category-content.tsx:187-194`), so listing 25+ is reachable only through other pages |

- **Head.** The title template produces "Hair Salon in Bucharest" and "Other in Bucharest" (`en.ts:1922-1925`). No og:image or site_name.
- **Card text.** A card without an image puts the word "photo"/"poză" into its link text (`src/components/ui/image.tsx:29-47`).
- **Issues:** P1-2, P1-3, P2-1, P2-3, P2-4.

**Row 4 — `/business/{slug}`.**

- **Status.** 200, ISR, out of order (see section 4). The missing-page shapes:

  | Variant | Status |
  |---|---|
  | Missing slug | 404 (`src/app/[locale]/business/[slug]/layout.tsx:33-34`) |
  | Case variant | 404 |
  | Dotted slug (`/business/a.b`) | 404 |
  | Numeric ID (`/business/76`) | 200, canonical `cs-nova-cluj` |
  | Padded ID (`/business/0076`) | 308 to `/business/76` (`src/proxy.ts:38-50`) |
  | Every `?tab=` value, `?tab=team&member=189`, tracking queries | canonical clean |

- **Tabs.** All four tab panels are in the HTML, with `hidden` on the inactive ones (`business-detail.tsx:410`). So services with prices, team, reviews and about are in the code, but inside the hidden block.
- **Markup.** `Organization` (Zavoia), `WebSite`, `Organization` (brand), `LocalBusiness` (address, geo, telephone, email, opening hours, images), `WebPage` and `BreadcrumbList`. Four pages have no `BreadcrumbList`: the two city-less test locations × 2 languages, because "only a confirmed parent page makes a trail" (`structured-data.ts:125-129`).
- **Two-language.** `WebPage.inLanguage` is the page locale while the merchant text is Romanian.
- **Head.** Title "Brand – Branch | Industry in City | Zavoia", up to 84 characters. Description is raw merchant text.
- **Outbound links.** Merchant links carry `rel="nofollow ugc noreferrer"` (`location-about.tsx:281`).
- **Share.** The share button shares the canonical path plus `?tab` (`business-detail.tsx:297-298`).
- **Not checkable locally.** All 27 local locations have booking on, so the "booking off" variant is source-only.
- **Issues:** P1-1, P1-5, P2-2, P0-3.

**Row 5 — `/brand/{slug}`.**

- **Delivery.** 200, ISR, out of order: 1 word in `<main>` in place.
- **Markup.** Brand `Organization`, `WebPage` and `WebSite`; no list of the brand's locations.
- **Variants:**

  | Variant | Result |
  |---|---|
  | `/brand/59` | 200, self-canonical |
  | `/brand/11` | 200, indexable, no description |
  | `/brand/CS-NOVA`, `/brand/does-not-exist` | 200 + `noindex, nofollow` + "404" title (in-page fallback, `brand/[slug]/page.tsx:84, 103-105`) |

- **Two-language.** Titles are identical in both languages.
- **Duplication.** `/brand/zed-dental` repeats the microsite's title and Lorem-ipsum description exactly.
- **Issues:** P1-1, P1-4, P2-3.

**Row 6 — `/professionals/{id}`.**

- **Delivery.** 200, dynamic, in order.
- **Markup.** `Person` and `ProfilePage` in place.
- **Head.** Title is the name only. No `og:locale`.
- **Variants.** 33 of 40 IDs are seeded `cs-u-*` IDs. A missing ID, a non-UUID or an uppercase UUID gives 404; the 404 title and robots tag land in `<body>` for some user agents (streaming metadata, `next/dist/server/lib/streaming-metadata.js:14-25`). `/professionals` is 404 (`src/app/[locale]/professionals/page.tsx`).
- **Third party.** Seed avatars come from `i.pravatar.cc` (92 brand and professional pages).
- **Issues:** P2-1, P2-3, P2-8.

**Row 7 — `/{business-slug}` microsite.**

- **Delivery.** `/zed-dental` and `/ro/zed-dental`: 200, ISR, in order, about 447 words. The canonical comes from the requested slug (`src/app/[locale]/[city]/page.tsx:66`).
- **Problems:** no JSON-LD; 28 file-name alts; 86 words at opacity 0 after JavaScript; text in the about section is split into `aria-hidden` word spans (`…/sections/about/parts.tsx:22`).
- **Code paths not observed in local data:**
  - A countdown that is computed on the server and cached into the HTML (`…/announcement/parts/AnnoCountdown.tsx:25`).
  - A placeholder that shows on public pages when an announcement bar is active but empty (`Announcement.tsx:99` with `showPlaceholder={chrome}`, `Microsite.tsx:197`).
- **Variants.** Case variants and unknown slugs return 200 + `noindex, nofollow` (documented, `[city]/page.tsx:31, 93-95, 117-118`).
- **Issues:** P1-7.

**Rows 8–9 — `/for-business`, `/pricing`.**

- **Delivery.** Static, in order.
- **Content.** Plans, prices (€20, €38, €7 and 99/189/35 RON) and all FAQ answers are server text in native `<details>`.
- **Head.** OG and Twitter complete. Descriptions are 189/213 and 173/216 characters (EN/RO): keys `forBusiness.pageDescription` and `pricing.pageDescription` (`en.ts:3446`, `ro.ts:1940`). Google sets no limit but truncates.
- **Markup.** None. No Google rich result clearly fits: FAQ ended 7 May 2026, and Product needs a single-product page.
- **Pricing CLS.** 0.167 in the lab (P2-6).
- **Registration links.** `/for-business` sends them without `?lang=` (P2-11). `/pricing` has no `#plans` anchor; the anchor exists only on `/for-business`.

**Row 10 — `/web-studio`.**

- **Delivery.** Static, out of order: 197 words in place, 813 hidden. Two h1s and two `<main>` elements in server HTML, from `loading.tsx`, which renders the real hero.
- **Head and content.** Title "… Zavoia | Zavoia", no OG. 6,265 words after JavaScript, mostly fictional businesses.
- **Issues:** P1-1, P1-8.

**Row 11 — `/web-studio/demo`.**

- **Delivery.** Dynamic, `noindex, follow`, canonical to itself, 1 word server-side (client-only).
- **Parameters.** `s`, `src`, `example`, `hide`, `device` and `returnTo` change only client state. 20 query variants are linked.
- **Content.** The fictional businesses are declared as such in code (`src/app/_components/web-studio/demo-examples.ts:8`). Fine as long as the page stays `noindex`.

**Row 12 — `/try`.**

308 to `/web-studio/demo`, keeping the query (QR entry). Fine.

**Row 13 — `/help`.**

- **Delivery.** Static, in order.
- **Content.** 8 questions with no answers in the HTML. Topic groups aren't headings. Questions are buttons.
- **Head.** No OG.
- **Contact.** "Report an issue" is a JavaScript-only button (`report-issue.tsx:203`), so with JavaScript off there's no contact route. The business FAQs on `/for-business` and `/pricing` send readers here, but only one of its 8 questions is for businesses (`en.ts:4024-4027`).
- **Issues:** P1-6, P2-1.

**Row 14 — `/blog`, `/blog/{slug}`.**

- **Delivery.** ISR, out of order. On post pages the in-place part is the blog index skeleton (h1 "Notes from the neighbourhood"), because `blog/loading.tsx` also wraps the post segment. The article skeleton follows in `S:0` and the article in `S:1`, giving 3 `<main>` elements.
- **Markup.** `BlogPosting` in the hidden block. No author and no `dateModified` (deliberate, `page-structured-data.ts:140-142`). `FAQPage` on `test233`, which brings no Google feature since 7 May 2026 but is harmless.
- **Romanian posts.** No description (the Romanian excerpt is empty, `blog/[slug]/page.tsx:61-62`) and an English Lorem-ipsum body.
- **Index.** Pagination and categories are client buttons with `pushState`; the server always renders page 1 (latent with 4 posts).
- **Lifecycle.** A slug change leaves the old URL as 404 (`src/sanity/queries.ts:51`). A post scheduled for later appears only at the next hourly regeneration, and the sitemap only at the next 10-minute one.
- **Issues:** P0-3, P1-1, P2-1, P2-5.

**Row 15 — `/terms`, `/terms/{document}`.**

- **Delivery.** Static, in order, 1,232-word median. No OG.
- **Issues.** All drafts, drafting notes visible, placeholders on the company page (P0-1, P0-2). Unknown or wrong-case slugs give a near-empty 404 cached for a year (no `dynamicParams` limit, `terms/[document]/page.tsx:66`).
- **Accessibility.** On Romanian pages the breadcrumb landmark is labelled "Breadcrumb" in English (`src/components/ui/breadcrumb.tsx:18`).
- **Contents rail.** On desktop it scrolls with `window.scrollTo` and never writes the `#hash` (`legal-toc.tsx:49-53`).

**Row 16 — `/search`.**

- **Delivery.** Dynamic, `noindex, follow`, no canonical, no h1 server-side. About 5 words in place: results render after a client effect (`search-content.tsx:1238`).
- **Crawl.** Every variant runs a `no-store` backend search (limit 300, `src/components/search/constants.ts:5`). 366 variants are linked. Low priority while it stays `noindex`.

**Rows 17–20 — `/auth*`, `/login`, `/register`, `/account`, `/saved`, `/appointments*`, `/studio`.**

| Route | Behaviour |
|---|---|
| `/auth` and every subpage with any token, code or error | `noindex, nofollow` |
| `/login`, `/register` | 307 to `/auth?mode=…`, disallowed in robots |
| `/account` without the session cookie | 307 to `/login?redirect=…`, then 307 to `/auth`: two hops (`src/proxy.ts:56-64` plus `login/page.tsx:34`), disallowed |
| `/saved`, `/appointments` | 200 `noindex, nofollow` shells; "Loading your saved items…" is screen-reader-only (`saved-content.tsx:543-545`) |
| `/studio` | `noindex, nofollow` and disallowed |

**Row 21 — `robots.txt`, `sitemap.xml`.**

- **robots.txt.** One `*` group allowing `/`, disallowing Studio, API, login, register and account (EN and RO), plus a sitemap line and a `host` line that Google ignores (`src/app/robots.ts`).
- **sitemap.xml.** 324 URLs (162 + 162), all with en/ro/x-default. 112 image entries pointing at `picsum.photos` and `assets-staging.zavoia.com` (local seed data). `lastmod` appears only on posts, brands and microsites, which is by design (launch reading, correction 2).
- **Failure handling.** If the marketplace feed fails, it keeps the last good sitemap (cold request fails). If blog or industries fail, those parts silently drop (`src/app/sitemap.ts:20-46`). The business webhook expires the sitemap on website publish changes (`src/app/api/revalidate/business/route.ts:110-112`).
- **Scale.** One sitemap with no `generateSitemaps`, fine until 50,000 URLs.

**Row 22 — `/.well-known/*`, `/api/revalidate*`, icons, `public/`.**

- **App links.** `apple-app-site-association` and `assetlinks.json` are 200.
- **Webhook.** `/api/revalidate` answers GET with 405.
- **Icons.** Only `/favicon.ico`. No `apple-touch-icon`, web manifest, icon or opengraph-image routes, and no `llms.txt` (Google says it ignores it).
- **`public/`.** Serves `README.md` files (4), `fonts/web-studio/index.html` (meta noindex), licence files and the default scaffold SVGs. All unlinked (P2-12).

**Row 23 — 404 and error surfaces.**

| Shape | Behaviour |
|---|---|
| Missing location, category, professional or legal page | Real 404s with near-empty bodies (P2-9) |
| Dotted paths (`/llms.txt`) and unsupported locales (`/de/pricing`) | 404 with no title and no `lang`; in dev the same URLs show a full localized page |
| `/blog/<missing>` | 404 with the blog skeleton and the home title |
| One-segment unknowns and missing brands | 200 + `noindex` (documented) |
| API outage per page | Not checkable locally (`NEXT_PUBLIC_API_URL` is baked in at build). From code: the category route reaches `error.tsx` (README.md:80), and `error.tsx` exists for `[locale]`, `[city]`, `business/[slug]`, `professionals/[uuid]` and `appointments`, plus a `global-error` |

**Row 24 — Proxy.**

- **Redirects.**
  - `/en` → 308 `/`
  - `/en/` → 308 `/en` → 308 `/` (two hops)
  - `/pricing/` and `//pricing` → 308 `/pricing`
  - `/en/business/…` → 308
  - `/business/0076/` → 308 → 308 → `/business/76` (two hops, then a canonical)
- **Dotted paths** skip the language rewrite and become 404 (`src/proxy.ts:31`).
- **Case and encodings** (`/PRICING`, `/pricing%20`, `/%E2%9C%93`, `/_not-found`) reach the microsite route and become 200 + `noindex` soft 404s.

**Row 25 — Live `www.zavoia.com` (coming-soon page).**

- **Redirect and status.** The apex 308-redirects to www. The home page is 200: "Zavoia — Coming Soon", `lang="en"`, canonical `https://www.zavoia.com`.
- **Head.** OG title, description, url and image without width or height. No Twitter tags. Icons: `favicon.ico`, a 96 px PNG and `apple-touch-icon`. No JSON-LD.
- **robots.txt and sitemap.** Allow-all, with a sitemap of one URL. Other paths return 404.
- **Hosting.** Served through Cloudflare and Vercel (HSTS set).
- **Crawler access.** GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and Bingbot user agents all got the same 200 page from here. Real crawler IPs: not checkable.

---

## 6. Flow by flow

| # | Flow | Verdict | Evidence |
|---|---|---|---|
| 1 | Crawler path: robots → sitemap → families | Mostly OK | Every sitemap URL is 200 and indexable. Eight sitemap URLs (the city-less test locations, their brand, one professional) have no internal links. 12 indexable `/brand/{id}` URLs are linked but not in the sitemap. Category sprawl (P1-2). |
| 2 | Home search and overlay → `/search` → result → location | OK | The search page is client-rendered and `noindex`. Result cards are `<a href>` after JavaScript. |
| 3 | Home category rail → `/search?industry=…` | OK | Links go to the `noindex` search; city pages are reachable through `/industries` (your fixed decision). |
| 4 | Industries directory → search and city pages | OK | The city section is filtered by inventory (`industries/page.tsx:112-128`). |
| 5 | Category → location, other industries, services, other cities, map | Issue | Unfiltered cross-links (P1-2). "View all" goes to `noindex` `/search`. |
| 6 | Location page: tabs, team dialog, gallery, reviews, share, map, brand, siblings, category, report; booking → sign-in → confirmation | Mixed | Tabs and the member dialog keep a clean canonical. Share uses the canonical path. Content is out of order (P1-1). The booking drawer is client-only, which is expected. The category link appears only when the city and industry match a configured destination (README.md). |
| 7 | Brand → locations → team → profile | Issue | Thin, out of order, numeric aliases (P1-1, P1-4). |
| 8 | Professional profile → location → services → booking | OK with issues | In order. Thin. No `og:locale`. Dynamic. |
| 9 | Microsite navigation and hashes, booking, team dialog, profile link | Issue | Only `id="services"` exists as an anchor target, so other `#section` footer links have nowhere to go. Profile links have their click prevented (`shared/actions.tsx:59, 67`). No links to `/business/…` were found in the microsite HTML. Opacity-0 text. |
| 10 | Business acquisition: home → for-business → pricing → app register | Minor issue | `/for-business` drops `?lang=` (P2-11). `/try` 308s to the demo. |
| 11 | Blog: index → post → contents → related | Issue | Out of order. The post shows the index skeleton in place. Pagination is buttons only (latent). |
| 12 | Help: topics, search, answers, report dialog, legal links | Issue | Answers are click-only (P1-6). The report dialog works only with JavaScript. |
| 13 | Legal: hub → document → contents → related → print | Issue | Drafts and visible notes (P0-1). The desktop contents rail doesn't update the hash. |
| 14 | Auth: header dialog vs `/auth`, redirects, forgot → reset, verify, Google callback | OK | All `noindex` or disallowed. `redirect` and `redirect.<locale>` parameters pass through. |
| 15 | Private area: proxy gate → login chain, saved, appointments, app deep link | OK | Two-hop 307 chain on `/account`. `noindex`. |
| 16 | Language switch, including translated slugs | Minor issue | Location, pricing and home have a real link to the other language. Category and blog have it only in `<noscript>` (P2-10). `bucharest` ↔ `bucuresti` is handled. Industry slugs aren't translated (P2-4). |
| 17 | Missing and broken URLs, API outage, invalid locale | Mixed | See rows 23–24. Outage: not checkable. |
| 18 | Cache and revalidation | OK by design | Sanity webhook: `post` plus the current slug's tag. Business webhook: locations, brands (page + microsite), websites (+ sitemap), `all`. ISR responses carry `stale-while-revalidate=31535400` (one year): after an unpublish that isn't sent through the webhook, the CDN could keep serving a stale page. |
| 19 | Cookie consent and analytics | OK for analytics; note for legal | Google Analytics mounts only after consent (`src/components/shell/analytics-gate.tsx:6-13`). `ipwho.is` is called before consent on home and industries; seed avatars load from `i.pravatar.cc`; search loads Mapbox. |
| 20 | App handoff | OK as far as checkable | Both `.well-known` files are served. The custom scheme is used for appointment links. Real device behaviour: not checkable. |
| 21 | Sharing (Open Graph, Twitter, share button) | Issue | Gaps per family (P2-1). Location share URL is canonical. Blog share uses the current URL. |
| 22 | No-JavaScript reader (AI fetchers) | Issue | Out-of-order families give the text after the footer inside `hidden` (section 8). |

Additional flows found by the plan critic and checked:

| Flow | Result |
|---|---|
| Home feeds → destinations (editors' pick → microsite) | OK |
| Location → category and map links | OK; they appear only when the destination exists |
| Microsite outbound links (profile, merchant call to action) | See flow 9. Announcement call-to-action links use `rel="noopener noreferrer"` only in a new tab (`AnnoCta.tsx:42`) |
| Slug changes (category legacy map, blog, brand, location) | Category: 308 via the legacy map. Blog, brand and location: old URL 404s, with no history |
| Scheduled post go-live | Appears at the next hourly regeneration (`src/sanity/queries.ts:9`) |
| Redirect chains | Two hops for `/en/`, `/business/0076/` and `/account` |
| Language switch before JavaScript | `<noscript>` links on category and blog |
| Dotted last segment | 404 (proxy skips the rewrite) |
| Unknown one-segment URLs | 200 + `noindex` (documented) |

---

## 7. Site-wide comparisons (all 324 sitemap URLs)

**Duplicates.**

- 61 titles are shared by 128 URLs and 70 descriptions by 144 URLs. Almost all are English/Romanian pairs with identical merchant titles and descriptions; the exception is the microsite/brand pair below.
- `/zed-dental`, `/ro/zed-dental`, `/brand/zed-dental` and `/ro/brand/zed-dental` share one title and one Lorem-ipsum description: the same business at two addresses.
- No meta description on the "assignments" test brand (both languages) or on the four Romanian posts.

**Lengths.**

- Titles run from 12 to 84 characters; 28 are over 60 and 101 under 25 (mostly brand and professional names).
- 16 descriptions exceed 160 characters: for-business and pricing, the Lorem-ipsum ones, and one professional bio at 334.
- "Zavoia" appears twice in the `/web-studio` titles.

**Headings.**

- 312 pages have one h1 and 12 have two (web-studio, blog index, blog posts).
- 98 sitemap pages have their h1 inside a hidden block.
- 28 pages have a title and h1 that share fewer than 20% of their words. Mostly these are location pages whose h1 is a neighbourhood ("Băneasa", "Floreasca"), plus `/help` and `/web-studio`.

**Words in `<main>`** (in place plus hidden):

| Family | Min / median / max | Pages under 150 words |
|---|---|---|
| category | 107 / 119 / 181 | 102 of 108 |
| location | 125 / 376 / 2,174 | 16 of 54 |
| brand | 26 / 49 / 171 | 30 of 32 |
| professional | 34 / 115 / 777 | 70 of 80 |
| help | 117 / 121 / 121 | 2 of 2 |
| blog index | 100 / 120 / 120 | 2 of 2 |
| blog posts | 173 / 175 / 182 | 0 |
| legal documents | 457 / 1,232 / 2,405 | 0 |

**English vs Romanian similarity** (shared vocabulary; 1.0 means identical):

| Family | Similarity |
|---|---|
| terms | 0.05 |
| pricing | 0.04 |
| category | 0.23 |
| location | median 0.38, max 0.80 |
| blog posts | 0.56 |
| professional | 0.60 |
| microsite | 0.62 |
| brand | 0.68 |

Marketing and legal text is translated. Merchant text isn't.

**hreflang and canonical.** Reciprocal and self-canonical on every sitemap URL. `og:url` equals the canonical, and `lang` and `og:locale` match the locale. The only mismatch is the home page's trailing slash, which is equivalent.

**JSON-LD.** No parse errors.

| Family | Types |
|---|---|
| home | Organization, WebSite |
| industries, category | BreadcrumbList, CollectionPage |
| location | Organization ×2, WebSite, LocalBusiness, WebPage, BreadcrumbList (50 of 54) |
| brand | Organization ×2, WebSite, WebPage |
| professional | Organization, WebSite, Person, ProfilePage |
| blog posts | Organization, WebSite, BlogPosting (+ FAQPage on 2) |
| for-business, pricing, web-studio, help, blog index, terms, legal documents, microsite | none |

**Images.**

- Microsite: 28 file-name alts.
- Location pages: 268 empty alts (decorative) and 726 images without width and height.
- Professional pages: 86 empty alts.
- No image without an `alt` attribute anywhere.

**External links.**

- `app.zavoia.com`, `anpc.ro` and `reclamatiisal.anpc.ro` are linked from every page, with no `rel`, which is fine for your own and official sites.
- Google Maps links use `noreferrer`.
- Merchant links use `nofollow ugc noreferrer`.

---

## 8. AI search and answer engines (AEO / GEO)

What the vendors document (verified quotes; see the research report):

- **Google.** AI Overviews and AI Mode need nothing beyond normal indexing and snippet eligibility, and Google Search ignores `llms.txt`. Google renders JavaScript, so it sees the swapped-in content.
- **OpenAI, Anthropic, Perplexity.** Each documents separate search, training and user-fetch crawlers. Independent tests (Vercel/MERJ and later studies) found that their fetchers read raw HTML without running JavaScript.
- **What no vendor documents:** how a fetcher treats text placed after the footer inside `<div hidden>`. Mozilla Readability, a widely reused extractor, deletes elements with the `hidden` attribute.

What an HTML-only fetcher gets from your pages:

| Family | In reading order | After the footer, inside `hidden` |
|---|---|---|
| location (median) | header and skeleton, 23 words in `<main>` | 353 words, h1, all tabs, JSON-LD |
| brand | 1 word in `<main>` | 49 words, h1, JSON-LD |
| blog post | the blog index skeleton | the article and its JSON-LD |
| web-studio | the hero, 197 words | 813 words |
| home | hero, search and client-only geo headings | 116 words (industries, showcase, brands) |
| category, professional, industries, marketing, legal, microsite | everything | nothing |

Other AI-relevant findings:

- **Answer facts.** Prices, hours, address and services are present on location pages, but only inside the hidden block. Help answers are absent entirely.
- **Entity clarity.** The LocalBusiness name is the branch only, the Organization is thin, and the microsite has no markup.
- **Controls.** No `nosnippet` or `data-nosnippet` anywhere (`data-nosnippet` count was 0). robots.txt is allow-all with no per-bot groups.
- **The biggest switch is outside the code:** the Cloudflare zone's AI crawler policy (section 12).

---

## 9. Performance and weight (lab only)

Throttled pass: 4× CPU, 1.6 Mbps and 150 ms network emulation, 412×915 px, localhost.

| Page | LCP | CLS |
|---|---|---|
| `/` | 1.49 s | 0.006 |
| `/industries` | 1.10 s | 0 |
| `/bucharest/beauty` | 1.20 s | 0 |
| `/business/cs-nova-centru` | 1.66 s (the h1; images failed) | 0 |
| `/brand/cs-nova` | 1.10 s | 0 |
| a professional page | 1.51 s | 0 |
| `/zed-dental` | 1.49 s | 0.001 |
| `/for-business` | 1.66 s | 0 |
| **`/pricing`** | 1.46 s | **0.167** |
| `/web-studio` | 1.18 s | 0.001 |
| `/help` | 1.07 s | 0 |
| `/blog` | 1.20 s | 0 |
| `/blog/test2` | 1.58 s | 0 |
| `/terms/privacy-policy` | 1.12 s | 0 |

Page weight:

- HTML median is 189 KB and the largest page is 460 KB. 76% of a median page is inline RSC data.
- All pages are far below Googlebot's 2 MB read limit.

Why the image results don't count:

- The seed images on `picsum.photos` were unreachable from this machine, so the optimizer returned 504.
- 40 staging-asset images returned 404.

Image LCP and real-user Core Web Vitals are therefore not checkable here (section 12).

---

## 10. Live coming-soon site

See row 25. The first two are only worth doing if the coming-soon page stays up for more than a few weeks. The third applies at launch either way.

- Add `og:image:width`/`height` and a Twitter card to the coming-soon page.
- Add `Organization` and `WebSite` JSON-LD once the company facts exist (P0-2).
- Check the Cloudflare AI crawler policy (section 12).

---

## 11. Your documents vs reality

| Statement | Verdict | Evidence |
|---|---|---|
| RENDERING.md: written for "Next.js 16.2.4" | No longer holds | `package.json`: 16.4.1 |
| RENDERING.md: missing `/business/<x>` answers 200 + noindex | No longer holds | 404 (`business/[slug]/layout.tsx:33-34`) |
| RENDERING.md: `/[locale]` has 4 in-page boundaries | No longer holds | 3 hidden feed blocks |
| RENDERING.md: category route `●` with 126 prerendered paths | No longer holds | On-demand ISR, no paths at build |
| RENDERING.md: `/[city]/[industry]` keeps its hard 404 via `notFound()` | Holds | Unknown city/industry → 404 |
| RENDERING.md: `/<free-slug>` 200 + noindex "claim page" is deliberate | Holds | `[city]/page.tsx:31` |
| README.md: unmatched URLs get "a localized full document returning HTTP 404" | Holds in dev, not in production | Production: no title, no `lang`, almost no text |
| README.md: business, brand and website routes "retain their existing HTTP 200 unavailable fallback" | Holds for brand and website only | Business is 404 |
| README.md: upstream defect — some 404s have an empty body until JavaScript runs | Holds, and is broader | Every real 404 shape tested |
| README.md:88: the directory "currently has no city-list section" | No longer holds | `industries/page.tsx:196` renders one |
| README.md:93: unfiltered category links lead to empty `noindex,follow` pages | Holds | Quantified: 2,258 pages |
| README.md: category API outages reach the error boundary | Could not test | API URL baked in at build |
| DESIGN.md: never visible loading text | Holds | All "Loading…" text found is screen-reader-only |
| DESIGN.md: location rule to isolate query reading in a small Suspense boundary | Not followed | The route-level `loading.tsx` wraps the whole page |
| DESIGN.md ~1846: carry the language into web registration | Partly | `/pricing` and `/web-studio` yes, `/for-business` no |
| DESIGN.md: FAQ in native `<details>` that work without JavaScript | Holds | For-business and pricing; help doesn't use them |
| `src/data/legal/types.ts:18-20`: notes render "while status=draft" | Not enforced | No status check (`terms/[document]/page.tsx:62-63`) |
| `src/data/seo.ts:235`: legacy slugs "301" | Actually 308 | `permanentRedirect` |
| `src/data/seo.ts:134-136`: editing `nameRo` changes a live URL | Holds | Applies to every Romanian category URL once names are set |
| PRODUCT.md / code comments on home feeds and brand cards linking to locations | Out of date | Brand pages exist; the feed composition changed |
| Blog `loading.tsx`: "stands in for the page body while the post loads" | Partly | The parent blog boundary puts the index skeleton in place on posts |
| e2e: `business-not-found.spec.ts:10` expects 200, `locations-seo.spec.ts:84` expects 404 | The specs contradict each other | Production returns 404. Reported only, no test edited |
| e2e: `locations-seo.spec.ts:9` uses `https://zavoia.com` | Contradicts the www decision | `src/lib/site.ts:4` |

---

## 12. Not checkable locally — how to check

| Item | How to check |
|---|---|
| Real-user Core Web Vitals, image LCP | Search Console → Core Web Vitals, or PageSpeed Insights after launch |
| Indexing, canonical choice, soft-404 classification | Search Console → Pages and URL Inspection, after launch |
| AI crawler access from real crawler IPs | Cloudflare → Security → Settings → filter "Bot traffic" → "AI Crawler and Agent access policies". Prefer "Disallow AI Training" over "Block": since 15 Sep 2026, "Block" also blocks Googlebot, Bingbot and Applebot |
| Google AI features opt-out state | Search Console → Settings → "Search generative AI" (inclusion is the default) |
| Staging and preview exposure | Confirm Vercel deployment protection covers every preview URL. robots.ts has no environment branch, and canonicals always point to www |
| API outage behaviour per page | Stop the API, run a production build with it down, and fetch each family |
| Category with more than 24 results; location with booking off | Needs data; the code path is in sections 5 and 6 |
| Production data quality (descriptions, translations, images, emails) | Review the production database and Sanity before launch |
| How AI fetchers treat text inside `<div hidden>` after the footer | No vendor documents it and no public test covers it. Avoid the question by fixing P1-1 |

---

## 13. Research basis

Primary-source research is in `docs/audits/reports/SEO AEO GEO primary sources.md`; the notes are in `docs/audits/research_notes/SEO AEO GEO primary sources/`.

How the quotes were checked:

- I re-fetched all 157 cited pages myself: 847 of 1,037 quotes match word for word.
- 24 quotes are on pages that can't be fetched as plain HTML: Bing's guidelines (client-rendered), OpenAI's help centre (403) and GitHub.
- The rest are mostly my parser pairing quote marks around short quotes.
- I corrected one claim in that report. It said Next's "HTML-limited bots" get a fully assembled page. My captures show the out-of-order body is the same for every user agent, including Bingbot on a cold render.

The rules this audit relies on, each checked on the live page:

- **Crawling and indexing:**
  - Googlebot reads the first 2 MB of HTML.
  - Canonicals count only in `<head>`.
  - Robots meta tags in `<body>` are honoured.
  - `noindex` pages may not be rendered.
  - Redirects are a strong canonical signal.
  - Link internally to canonical URLs.
  - Canonicalization happens before and after rendering.
  - Links must be `<a href>`.
- **Pagination, errors and language versions:**
  - Paginated pages need unique URLs; "load more" isn't followed.
  - The soft-404 definition.
  - hreflang pairs must point to each other.
  - Don't redirect visitors by language.
  - Boilerplate-only translation creates duplicates.
- **Sitemaps and robots.txt:**
  - `lastmod` is used only if accurate; priority and changefreq are ignored.
  - Only user-agent, allow, disallow and sitemap are supported fields.
- **Search appearance:**
  - FAQ rich results ended (Search Central updates).
  - The self-serving review policy.
  - Structured data must match visible content.
  - Meta descriptions have no length limit.
  - Avoid boilerplate in titles.
  - Core Web Vitals definitions.
  - `og:image` is used for thumbnails.
  - ISO 3166-1 alpha-2 for `addressCountry` (Google and schema.org).
  - LocalBusiness `name` and closed-day hours.
- **AI search and crawlers:**
  - Google AI features need only indexing and snippet eligibility.
  - Google Search ignores `llms.txt`.
  - OpenAI, Anthropic and Perplexity crawler documentation.
  - Cloudflare's "Block" covers mixed-use crawlers.
  - Mozilla Readability removes `hidden` elements.
  - Vercel/MERJ: AI crawlers don't render JavaScript.

---

## 14. Coverage ledger

**Key.** ✔ verified OK · ✖ verified issue · ◐ verified, partly OK · NC not checkable locally · – not applicable.

**Checks.**

1. Reachability and indexability
2. Delivery
3. Head
4. Structured data
5. Content and semantics
6. Answer-engine readiness
7. Weight
8. Two-language integrity
9. Site-wide comparisons
10. Mobile and trust

| # | Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/`, `/ro` | ✔ | ◐ | ◐ | ◐ | ✔ | ◐ | ◐ | ✔ | ✔ | ◐ |
| 2 | `/industries` | ✔ | ◐ | ✔ | ✔ | ✔ | ◐ | ◐ | ✔ | ✔ | ✔ |
| 3 | `/{city}/{industry}` | ✖ | ✔ | ◐ | ◐ | ◐ | ✖ | ◐ | ◐ | ✖ | ✔ |
| 4 | `/business/{slug}` | ◐ | ✖ | ◐ | ◐ | ◐ | ◐ | NC | ◐ | ◐ | ✔ |
| 5 | `/brand/{slug}` | ✖ | ✖ | ◐ | ◐ | ✖ | ✖ | ✔ | ✖ | ✖ | ◐ |
| 6 | `/professionals/{id}` | ✔ | ◐ | ◐ | ✔ | ◐ | ◐ | ◐ | ✖ | ◐ | ✔ |
| 7 | `/{slug}` microsite | ◐ | ◐ | ◐ | ✖ | ✖ | ◐ | ✔ | ◐ | ✖ | ◐ |
| 8 | `/for-business` | ✔ | ✔ | ◐ | – | ✔ | ✔ | ◐ | ✔ | ✔ | ◐ |
| 9 | `/pricing` | ✔ | ✔ | ◐ | – | ✔ | ✔ | ✖ | ✔ | ✔ | ✔ |
| 10 | `/web-studio` | ✔ | ✖ | ✖ | – | ◐ | ✖ | ◐ | ✔ | ◐ | ✔ |
| 11 | `/web-studio/demo` | ✔ | – | ✔ | – | – | – | – | – | – | – |
| 12 | `/try` | ✔ | ✔ | – | – | – | – | – | – | – | – |
| 13 | `/help` | ✔ | ✔ | ✖ | – | ✖ | ✖ | ◐ | ✔ | ✔ | ◐ |
| 14 | `/blog`, posts | ✖ | ✖ | ◐ | ◐ | ◐ | ◐ | ✔ | ✖ | ◐ | ◐ |
| 15 | `/terms`, documents | ✖ | ✔ | ✖ | – | ✖ | ◐ | ◐ | ✔ | ✔ | ✖ |
| 16 | `/search` | ✔ | ◐ | ✔ | – | – | – | ◐ | – | – | – |
| 17 | `/auth*` | ✔ | ✔ | ✔ | – | – | – | – | – | – | – |
| 18 | `/login`, `/register` | ✔ | ✔ | – | – | – | – | – | – | – | – |
| 19 | private area | ✔ | ✔ | ✔ | – | ✔ | – | – | – | – | – |
| 20 | `/studio` | ✔ | ✔ | – | – | – | – | – | – | – | – |
| 21 | robots.txt, sitemap.xml | ◐ | ✔ | – | – | – | ◐ | ✔ | ✔ | ◐ | – |
| 22 | `.well-known`, API, icons, `public/` | ◐ | ✔ | ◐ | – | – | – | – | – | – | NC |
| 23 | 404 and error surfaces | ◐ | ◐ | ◐ | – | ◐ | – | – | ◐ | – | NC |
| 24 | proxy | ◐ | ✔ | – | – | – | – | – | – | – | – |
| 25 | live coming-soon | ✔ | ✔ | ◐ | ✖ | ✔ | ◐ | NC | – | – | NC |

The flows are in section 6: 22 planned plus 9 added by the critic, each with a verdict.

**Counts.**

| Ledger | Cells | ✔ | ◐ | ✖ | NC | – |
|---|---|---|---|---|---|---|
| Page × check | 250 | 68 | 68 | 29 | 5 | 80 |

These counts were taken from the table above by script, not by hand.

The 22 planned flows in section 6 break down as:

- 9 OK (flows 1–4, 14, 15, 18–20)
- 5 mixed or minor (flows 6, 8, 10, 16, 17)
- 8 with issues (flows 5, 7, 9, 11–13, 21, 22)

Flows 17 and 20 also contain parts that are not checkable locally (API outage; app links on a device). The 9 flows added by the critic are listed with their results below the main table.

**Deviation from the plan.** The plan called for a separate critic agent to review this ledger. After the usage-limit failures on 12 Nov I did that gap pass myself: every page row and flow above has a verdict.

---

## 15. Dropped claims (could not be reproduced)

| Claim | Source | Why dropped |
|---|---|---|
| `blog-post.tsx:28` says "no author data exists in Sanity" | plan critic | The line was changed during the audit (15:23 on 12 Nov). The underlying fact (no author) is verified elsewhere |
| `blog-list.tsx:47` `useState(0)` pagination | plan critic | Changed to URL-driven pagination on 12 Nov |
| Next.js sends "HTML-limited bots" a fully assembled page | AI-crawler researcher and report writer | Contradicted by captures; corrected in the research report |
| Home canonical changes after JavaScript | me | An artefact of reading the DOM `href` property, which adds `/` |
| 308 legacy redirects send the `Location` header twice on a cache miss | discovery reader | Raw captures lost in the restart; not re-run |
| Home and directory timings (42–95 ms warm, 304–380 ms cold) | discovery reader | Raw captures lost |
| 3,790 category cross-links of which 2,602 lead to `noindex` pages | discovery reader | Raw captures lost; the crawl figures stand (2,258 reachable empty pages; 89,970 links from category pages to any `noindex` page) |
| Exact Sanity test post titles | marketing reader | Raw captures lost; the slugs and Lorem-ipsum bodies stand |

The 6 Nov first-pass findings were all re-checked against today's build. Where they changed (for example, missing locations now 404), this report states the current behaviour.

---

## 16. Method, evidence and how to reproduce

**Build.**

```
NEXT_TELEMETRY_DISABLED=1 NEXT_DIST_DIR=.next-seo-audit npx next build
NEXT_DIST_DIR=.next-seo-audit npx next start -p 3055 -H localhost
```

The build appends two lines to `tsconfig.json` and rewrites `next-env.d.ts`. This audit restored both byte for byte, and deleted `.next-seo-audit/` (19,945 files) on 13 Nov.

**Fetch.**

```
curl -s -D - -o page.html -A "<UA>" http://localhost:3055/<path>
```

User agents:

- Chrome
- Googlebot smartphone ("… (compatible; Googlebot/2.1; …)")
- GPTBot/1.2
- bingbot/2.0

For ISR pages, the first request after a fresh `next start` is the cold render; `x-nextjs-cache` shows MISS, then HIT.

**What to look for.**

- Out-of-order content: `grep -b '<footer\|<div hidden id="S:\|<h1' page.html`.
- JSON-LD: `grep -o 'application/ld+json' page.html`.
- Metadata in `<body>`: compare the offset of `<meta name="description"` with `</head>`.

**Other passes.**

- Crawl: breadth-first from `/` and `/ro`, following only `<a href>` in server HTML.
- Render: headless Chrome 147, Googlebot UA, 412×915, third-party requests blocked and logged.
- Lab performance: CDP CPU throttling ×4 and network 1.6 Mbps / 150 ms.

**What this audit changed in the repo.** Only `docs/audits/2026-11-12-seo-aeo-geo-audit.md` (this file) and `docs/audits/reports/SEO AEO GEO primary sources.md` plus its three notes files. Your tracked files and untracked work are untouched. The file `docs/audits/reports/Legal privacy cookies audit.md` belongs to another session and was not touched.
