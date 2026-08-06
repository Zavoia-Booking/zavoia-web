---
version: 1
slug: "src-app-locale-brand"
primary_target: "src/app/[locale]/brand"
related_targets: ["src/app/[locale]/brand/[slug]/page.tsx","src/app/[locale]/brand/_components/brand-detail.tsx"]
---

# Surface: Brand page (/[locale]/brand/[slug])

## Scope & mode
Persuade. The brand's public profile on the marketplace; the visitor decides which location (or professional) to engage.

## Audience, job, action
A consumer who clicked a brand card on the home "Brands" feed (or received a shared link). Job: judge whether this brand is trustworthy, then pick a location. Primary action: a location card's "View & book" → /business/<locationSlug>. Secondary: a team member card → their profile modal on their location page (?tab=team&member=<id>).

## Proof / content
All live API data (GET /marketplace/public/brand/:idOrSlug): business identity + rating aggregates, listing microsite fields (tagline, aboutContent, establishedYear, heroImageUrl — each nullable), uncapped public locations, deduped team members. No fabricated content; business logos may be null → letter avatar.

## Chosen direction (seed a70871c2)
Location-first — candidate 3 of 7 grounded structures. Identity is one compressed trust band (avatar · name · rating · industry · place · since · tagline); the locations grid is the first content block and carries the page's primary action; team second; About (hero image + long-form) closes. Refused: profile-hero-plus-tab-stack (the category default and the sibling location page's own grammar). Memorable moment: the stagger rise-in of the location cards — the decision surface literally presents itself.

## Constraints
- Incumbent zavoia-web world only (warm canvas, warm-gray ramp, terracotta accent, Geist); no new tokens.
- Singular copy variant when locationsCount === 1 ("The location" / "Locația", count label dropped).
- Meta separators are fused nowrap spans (no orphaned "·" on wrap).
- Secondary meta text floor: var(--c-600) minimum on canvas (--c-500 fails 4.5:1).
- en/ro dictionary strings only (dict.brandPage).

## Unresolved
- Brand-level favorite heart (favorites exist for business entity; not surfaced here yet).
- Reviews feed on the brand page (aggregates only for now).
- Broken site-wide mobile bottom-nav chrome (pre-existing, outside this surface).
