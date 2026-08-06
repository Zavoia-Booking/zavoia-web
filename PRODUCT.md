# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Romanian consumers discovering and booking local service appointments (beauty, barbering, spa, dental, and similar) on desktop and mobile web. Secondary audience reached through the same site: small service businesses evaluating Zavoia's business offering (separate /for-business surface).

## Product Purpose

zavoia-web is the public marketplace of the Zavoia platform: visitors browse listed businesses, their locations, services, prices, team members, and reviews, then book appointments online. Success = a visitor finds a trustworthy provider and completes a booking.

## Operating Context

- Backend is the Zavoia admin-api (NestJS + Postgres) at `/marketplace/public/*` and `/marketplace/*` endpoints; data (ratings, listings, team) is owner-managed in a separate admin dashboard.
- Businesses (brands) own one or more locations; team members are assigned per location. Marketplace visibility is business-level (`isListed`, hidden/blocked flags) plus per-location `isPublic`.
- Detail-page identity: LOCATION pages live at `/[locale]/business/<locationSlug>` (non-enumerable slugs; numeric id fallback). Brand pages live at `/[locale]/brand/<businessSlug>` (confirmed 2026-08-05).
- Home feeds: "Fresh on Zavoia" = newest LOCATIONS (one card per location); "Brands" = one card per BUSINESS (business identity + rating; capped locations/team lists in payload).
- Team member profiles open as a modal on the team tab of their location's page; brand-page team clicks deep-link there (`?tab=team&member=<id>`, confirmed 2026-08-05).

## Capabilities and Constraints

- i18n: `en` and `ro` locales via dictionary files (`src/i18n/dictionaries/{en,ro}.ts`); every user-facing string must exist in both.
- Home fetches are build-safe: every data call is wrapped so a down backend renders empty sections, never a crash (`force-dynamic`).
- Ratings/review counts are precomputed DB aggregates (business-, location-, and professional-level); never recompute client-side.
- Marketplace listing per business stores overrides (name/description) plus microsite content: heroImageUrl, tagline, aboutContent, establishedYear, brandColorHex. Brand page uses the full identity set (confirmed 2026-08-05).
- Business profile image = `business.logo`; brand cards must never substitute a location photo for it (confirmed 2026-08-05).
- No dedicated favorites for brands page yet; favorites exist for business + location entities.

## Evidence on Hand

- Live local stack: admin-api on :3000 (docker, watch mode), Postgres seeded via `admin-api/scripts/seed-demo-4-businesses.sql` (4 demo brands; Atelier Glow and Barber Bros have 2 locations each, location names deliberately exclude the brand name).
- Real review/rating aggregates in seed; no real customer testimonials — do not fabricate.

## Product Principles

- Location-led browsing, brand-led identity: locations are what you book; brands are who you trust.
- Every card links somewhere real; no dead-end surfaces.
- Payloads stay lean (capped nested lists with true counts); detail pages own the full data.
- Non-enumerable public identifiers (slugs) for all detail routes.
