---
version: 1
slug: "c-app-components-web-studio-web-studio-content-tsx"
primary_target: "src/app/_components/web-studio/web-studio-content.tsx"
related_targets: ["src/app/[locale]/web-studio/page.tsx","src/app/_components/web-studio/specimen-plate.tsx"]
---

# Surface: Web Studio (/[locale]/web-studio)

## Scope & mode
Persuade. The marketing page for Web Studio, the website builder sold on top of a Zavoia subscription. One page; the account menu's promoted accent row is its entry point.

## Audience, job, action
A Romanian service-business owner (salon, clinic, studio) who already keeps — or is about to keep — services, hours, team, photos and reviews in Zavoia, and is deciding whether the built-in website is worth publishing instead of commissioning one. Job: see what the finished site actually looks like and what it costs. Primary action: start the free trial → /register. Secondary: jump to the catalogue (#catalogue), or open the pricing page.

## Proof / content
The real microsite renderer (`LivePreview`) runs in-page inside every plate — the page shows the product, it does not screenshot it. Data strategy is showcase-with-fallback: `page.tsx` tries `WEB_STUDIO_SHOWCASE_SLUG`, then `demo-atelier-glow`, accepts a site only if it clears a content bar (≥1 location, ≥6 services, ≥3 team, ≥6 photos), and otherwise falls back to the authored "Studio Lumina" specimen — which every caption then labels as a demonstration. Route is `force-dynamic`; the backend may be down at build time. Counts and prices are derived (see the Derived Figure Rule); no figure on this page is typed by hand.

## Chosen direction (seed e0b2c650)
Specimen catalogue — candidate 7 of the grounded list. Refused: the SaaS-landing arrangement (hero screenshot → three feature cards → logos → pricing). The page *is* the catalogue of what you can build: numbered plates, museum captions, hairline spec strips, tabular figures. Story order is cover → wired to the data you already keep → the catalogue stage → type and colour → how it ships → price → questions → close.

Memorable moment: the index + stage. Picking a section from the numbered rail and then a style chip re-renders the actual product in front of the visitor, caption and style count updating with it — and the accent and typeface they choose on the type plate propagate to every other live specimen on the page.

## Constraints
- Incumbent world unchanged; no new colours, faces or tokens. Catalogue devices are composition-level only.
- Specimens are exhibits, never controls: `inert` + `aria-hidden`, so the mono caption (`aria-live="polite"` on the stage) is the only narration of a change.
- The section index must list every catalogued section — the page throws at module load if it drifts from the registry, because the spec strip's count would otherwise over-promise.
- The two theme knobs on the page are the product's own two knobs (accent, display face), not a decorative colour picker.
- Commercial figures we do not have are marked, not invented.
- en/ro dictionary strings only (`dict.webStudio`); premium style prices render in the locale's own currency.

## Unresolved
- The Plus tier price is an unconfirmed placeholder — the price plate ships a dashed "price to confirm" panel quoting only the base subscription. Replace it once the tier is priced.
- `WEB_STUDIO_SHOWCASE_SLUG` must point at a content-rich published business in production. If it (and the `demo-atelier-glow` fallback) fails the content bar, the page silently serves the authored demonstration — correct, but weaker proof.
- `NO_FREE_BASE` (announcement, marquee) is hardcoded to mirror the backend catalogue; it is not read from the entitlement source.
