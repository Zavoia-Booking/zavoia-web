---
name: Zavoia Web
description: Warm-paper editorial marketplace for booking local services in Romania
colors:
  canvas: "#FAFAF7"
  shade: "#F0EEE4"
  mist: "#E8E3D8"
  ink: "#1C1C1A"
  terracotta: "oklch(53% 0.15 38)"
  terracotta-deep: "oklch(47% 0.15 38)"
  terracotta-text: "oklch(40% 0.14 38)"
  terracotta-tint: "oklch(94% 0.05 38)"
  text-strong: "oklch(15% 0.004 70)"
  text-body: "oklch(35% 0.006 70)"
  text-secondary: "oklch(48% 0.008 70)"
  text-faint: "oklch(62% 0.009 70)"
  hairline: "rgba(28,28,26,0.10)"
  success: "oklch(48% 0.10 158)"
  warning: "oklch(60% 0.13 76)"
  error: "oklch(58% 0.18 25)"
  info: "oklch(55% 0.13 259)"
typography:
  display:
    fontFamily: "Geist Sans, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(48px, 6.6vw, 88px)"
    fontWeight: 600
    lineHeight: 0.93
    letterSpacing: "-0.052em"
  headline:
    fontFamily: "Geist Sans, -apple-system, system-ui, sans-serif"
    fontSize: "clamp(22px, 2.4vw, 30px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist Sans, -apple-system, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Geist Sans, -apple-system, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.003em"
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  2xl: "28px"
  card: "18px"
  full: "9999px"
spacing:
  gutter: "28px"
  gutter-tablet: "20px"
  gutter-mobile: "16px"
  nav: "68px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  button-accent:
    backgroundColor: "{colors.terracotta}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-body}"
    rounded: "{rounded.full}"
    padding: "11px 20px"
  chip:
    backgroundColor: "#ffffff"
    textColor: "{colors.text-body}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.card}"
  card-overlay:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.card}"
---

# Design System: Zavoia Web

## Overview

**Creative North Star: "The Warm-Paper Shop Window"**

Zavoia's marketplace reads like an editorial magazine laid on warm paper. The
canvas is a warm off-white (`--c-canvas`), the entire neutral text ramp is a
warm gray built in OKLCH at hue 70, and every hard surface is either white
card stock or near-black ink (`--c-ink`). Terracotta is the single brand
accent — it marks ratings, active states, focus rings, and the "book" action,
and it stays rare enough that ink does most of the talking. Photography does
the selling: business cards are photo-forward (full-bleed images with gradient
scrims, or white cards with 16:10 photo headers), and the chrome around them
stays quiet — hairlines, frosted bars, mono eyebrows.

The system's voice is confident but unhurried: tight negative letter-spacing on
sans headings, a mono uppercase "kicker" eyebrow above every section, tabular
numerals for every number, and a single authored motion vocabulary (rise + fade
on entry, lift on hover, spring on delight moments). The code's own comment on
the newest surface records the commitment: "warm canvas, oklch warm-gray text
ramp, terracotta primary, Geist Sans, photo-forward cards with hover-lift +
zoom, stagger rise-in as the one authored motion."

There is no dark mode; the system is one light world. Pages and vertical
results panels use native scrollbars. Explore fills the viewport and hides its
results scrollbar while preserving scrolling; its map and sheet own the available
space. Horizontal carousels can hide their internal scrollbars. All copy exists
in both English and Romanian.

**Key Characteristics:**
- Warm paper canvas; white cards; ink pills; terracotta as the only accent
- One sans (Geist) for everything readable, one mono (Geist Mono) for labels, indices, and counts
- Photo-forward cards with dark scrims or frosted white overlays
- Hairline rules (`rgba(28,28,26,0.06–0.14)`) carry structure; heavy borders don't exist
- One motion grammar: rise-in with stagger, hover-lift, spring pops for delight

## Colors

A warm two-pole palette — paper to ink — with terracotta as the lone voice of
brand and a small status quartet that whispers through 6px dots.

### Primary
- **Terracotta** (`--p-500`, {colors.terracotta}): the brand accent. Star icons, focus rings (`:focus-visible` 2px outline), reading-progress fills, active TOC markers, the "accent" button (the book action), radar/pulse rings, hero underline draws.
- **Terracotta Deep** (`--p-600`, {colors.terracotta-deep}): drop caps, kicker default color, hover-darkened accent.
- **Terracotta Text** (`--p-700`, {colors.terracotta-text}): terracotta used *as text* on the canvas (inline links, hover color on question titles, "full link" affordances) — dark enough to pass contrast at small sizes.
- **Terracotta Tint** (`--p-100`, {colors.terracotta-tint}): focus glow halo (`box-shadow: 0 0 0 4px`), soft washes. Column highlights use `color-mix(in oklch, var(--p-500) 7–12%, transparent)`.

### Neutral
- **Canvas** ({colors.canvas}): the page background, always. White never backs the page itself.
- **Shade** ({colors.shade}) / **Mist** ({colors.mist}): resting fills for icon badges, pill segments, stripe placeholders. Shade is the hover fill for white pills.
- **Ink** ({colors.ink}): near-black. Primary buttons, active chips/tabs/pagination, toasts, tooltips, the overlay-card base, the "on" state of switches. Ink surfaces always carry pure white text.
- **Text Strong** (`--c-900`, {colors.text-strong}): headings, card names, active nav links.
- **Text Body** (`--c-700`, {colors.text-body}): long-form prose, card blurbs, secondary buttons' quieter sibling.
- **Text Secondary** (`--c-600`, {colors.text-secondary}): meta rows, captions, back links — the *floor* for body-size secondary text (see rule below).
- **Text Faint** (`--c-500`, {colors.text-faint}) and lighter (`--c-400`): decorative/non-essential only, such as dot separators. Meaningful hero copy, search prompts, review counts and status labels use `--c-600` or darker.
- **Hairline** ({colors.hairline}): dividers and quiet borders, always as ink at 6–14% alpha (`rgba(28,28,26,0.06)` card borders → `0.14` input strokes), never a gray hex.

### Status
Info {colors.info}, Success {colors.success}, Warning {colors.warning}, Error
{colors.error} — each with a 100-tint and 300-mid in the code (`--s-*-100/300/600`).
Status is delivered by a **6px dot + neutral label** (StatusPill, legal draft
badges), not by tinting whole surfaces; the warning callout (tinted panel) is
the one sanctioned exception. Category identity uses a separate 12-hue dot
palette (`--cat-hair` … `--cat-trades`) consumed dynamically as
`var(--cat-${cat})`, rendered only as small dots (CatDot), never as fills.

### Named Rules
**The c-600 Floor Rule.** Secondary text on the canvas must be `var(--c-600)`
or darker. `--c-500` fails the 4.5:1 contrast floor at body sizes — it is
reserved for decoration. Large meaningful text must still meet 3:1 contrast
against its actual background, including gradients; body text must meet 4.5:1.

**The One Voice Rule.** Terracotta is the only brand accent and it stays
scarce. Structure and state are carried by ink; terracotta marks *the* action
or *the* live thing on a screen — stars, book, focus, progress.

**The Dot-Not-Wash Rule.** Status and category color arrive as a 6px dot next
to neutral text, never as a tinted background behind content (warning callouts
excepted).

## Typography

**Display Font:** Geist Sans (with -apple-system, system-ui fallback)
**Body Font:** Geist Sans (same family — one sans for everything readable)
**Label/Mono Font:** Geist Mono (with ui-monospace, SFMono-Regular, Menlo fallback)

**Character:** One modern grotesque doing all the reading work, pulled tight —
letter-spacing goes *negative* as size goes up (−0.005em at meta size to
−0.052em at display size), line-height drops below 1 at display size. The mono
is the editorial counter-voice: always small (10–11.5px), always 600 weight,
usually uppercase with wide tracking (0.1–0.16em), used for kickers, section
indices, counts, and reading-time tags. Fonts load via `next/font` in
`src/styles/fonts.ts` — the single place fonts are declared.

### Hierarchy
- **Display** (600, clamp(48px, 6.6vw, 88px), lh 0.93, ls −0.052em): the home hero and the business pages' heroes. Its second line uses `--c-600` to retain contrast against the hero gradient on home; the business pages end on one handwritten signature word instead (see Business marketing pages).
- **Headline** (700, clamp(22px, 2.4vw, 30px), lh 1.06, ls −0.03em): SectionTitle's `h2`, always `txt-balance`, always `--c-900`, usually preceded by a Kicker with 8px gap.
- **Title** (600, 16–18px, lh 1.15–1.35, ls −0.016 to −0.022em): card names, row titles, question titles. Card titles truncate with ellipsis on one line.
- **Body** (400, 13.5–15.5px, lh 1.4–1.75, ls −0.003 to −0.005em, `--c-700`): prose at 15.5/1.75 in reading columns (58ch measure), card blurbs at 13.5/1.4. Reading columns cap at ~58ch/720px.
- **Label** (Geist Mono, 600, 10–11.5px, ls 0.1–0.16em, UPPERCASE): kickers (default color `--p-600`), meta strips, group headers, frosted image pills, pagination counts.

### Named Rules
**The Tabular Number Rule.** Every number that can change — ratings, counts,
prices, indices, pagination — sets `font-variant-numeric: tabular-nums`.

**The Mono Whisper Rule.** The mono never exceeds ~13px and never carries a
sentence. It labels, indexes, and counts; the sans speaks.

## Layout

A single centered container with **1400px of usable content** (`--content-max`),
applied via `.zw-container`. Its border-box maximum adds the two `28px` gutters
(`max-width: calc(var(--content-max) + 2 * var(--gutter))`). The gutter
compresses responsively (20px ≤920px, 16px ≤600px) and the sticky opaque nav is
`68px` tall (`--nav-h`, 60px ≤920px); sticky elements offset against
`calc(var(--nav-h) + N)`.

The dominant breakpoint is **920px** — two-column page grids (`[data-biz-cols]`,
feature/hero grids) collapse to one column, `.zw-only-desktop` /
`.zw-only-mobile` swap, and detail pages trade the sticky right booking rail
for a fixed frosted bottom bar. Other observed breakpoints are local: 1552px
(share rail appears only when true margin exists), 1080/540px (footer grid
4→2→1), 1024px (post/legal TOC rails drop), 980/640px (masonry and carousel
column counts), 880px (split spotlight stacks).

Horizontal rhythm on the home page comes from contained rails, not the page:
`.zw-carousel-rail` scrolls 3-up cards (2-up ≤980px, 86%-wide ≤640px) with
snap-proximity and hidden scrollbars; the split-spotlight rail scrolls within
the same 1400px content boundary. Offer grids are explicit 3→2→1 so a third
card never orphans. Reading surfaces (Journal posts, legal) drop to a narrower
measured column (58ch–760px) with a 196px sticky TOC rail — "legal reading
wants a centred column, not the full shop window."

Section entrance is choreographed once per page: `.zw-rise` sections rise 18px
and fade over 0.7s, staggered by `data-d` (0.10/0.22/0.34s); grid children
stagger via `.zw-stagger` (0.06s steps, 8 children deep). Both are gated behind
`prefers-reduced-motion: no-preference`.

### Layout and cursor rules

- Zavoia page shells, headers and footers share the 1400px content limit. Smaller
  prose columns, forms, dialogs and cards stay readable inside that boundary.
- Full-bleed backgrounds, the search map and customer website previews retain
  their own layout. Customer website templates and Sanity Studio are separate
  surfaces; do not impose marketplace containers on them.
- Use `minmax(min(Npx, 100%), 1fr)` for auto-fill card grids so their minimum
  cannot exceed the available mobile width. Preserve the existing breakpoints.
- Ordinary text inherits `cursor: default`, without disabling text selection.
  Enabled links, buttons, disclosures and other clickable controls use pointer.
  Editable fields keep the text cursor; disabled controls and draggable surfaces
  keep their state-specific cues. Customer `.mc-root` and `.mc-gallery-lbox`
  subtrees retain their own cursor rules.

## Elevation & Depth

Layered but quiet. Surfaces rest on hairlines and *small* ambient shadows
(cards ship with `--sh-sm` or `--sh-md` at rest); the bigger shadows are
reserved as a **response** — hover-lift raises a card 3px and swaps in
`--sh-lg`, buttons lift 1px with their own hover shadow, the pricing receipt
floats to `--sh-xl`. Depth is also conveyed materially: frosted overlays
(`.zv-frost` — 82% white + 20px blur + saturate(180%) for mobile tabs and
booking bars; 92% white + 10px blur for pills floating on photos) and gradient
scrims on photography (top-down 30% black for control legibility, bottom-up to
88% black under overlay-card text).

### Shadow Vocabulary
- **sh-sm** (`0 1px 2px rgba(28,28,26,0.04), 0 1px 1px rgba(28,28,26,0.03)`): resting white cards, chips, search fields.
- **sh-md** (`0 2px 6px rgba(28,28,26,0.05), 0 4px 16px rgba(28,28,26,0.04)`): overlay cards at rest, raised hover state for small elements.
- **sh-lg** (`0 6px 16px rgba(28,28,26,0.08), 0 18px 40px rgba(28,28,26,0.12)`): the hover-lift destination.
- **sh-xl** (`0 8px 24px rgba(28,28,26,0.10), 0 24px 64px rgba(28,28,26,0.18)`): modals, the floated receipt.
- **sh-up** (`0 -2px 8px rgba(28,28,26,0.04), 0 -8px 24px rgba(28,28,26,0.06)`): bars rising from the bottom edge.

All shadow color is ink (`rgba(28,28,26,…)`), never pure black — except under
photography, where scrims and text-shadows use true black.

### Named Rules
**The Earned Shadow Rule.** Big shadows are earned by state. Rest = hairline +
sh-sm/md; hover/lift = sh-lg; floating above the page (modal, receipt) = sh-xl.

## Shapes

Two silhouettes rule: the **pill** and the **soft rectangle**. Everything
interactive and small is a full pill (`--r-full`, 9999px): buttons, chips,
tags, pagination buttons, switches, frosted photo-pills. Circles are the
icon-action shape (heart buttons, share buttons, read-arrows, avatars, QA
disclosure icons). Containers are soft rectangles on a 6→28px radius ramp
(`--r-sm` 6 / `--r-md` 10 / `--r-lg` 14 / `--r-xl` 20 / `--r-2xl` 28), with
cards standardized at **18px** via `var(--card-r, 18px)`.

Borders are hairlines of ink alpha: 6% on white cards, 10% on dividers, 12–14%
on inputs and secondary buttons, rising toward 26% on hover. There are no 2px+
decorative borders; the only thick strokes are semantic (the 2px terracotta
top-border on the comparison table's highlighted column, the 2px TOC active
rail). Images are always clipped by their container (`overflow: hidden` +
`.zw-zoom-wrap`) so the 1.045× hover zoom never escapes the radius.

### Named Rules
**The Structural Hairline Rule.** A hairline may darken to 26% ink *at rest*
only where the rule itself is the structure — the top rule over each numbered
step column in Web Studio's "How it ships" (`1px solid rgba(28,28,26,0.26)`),
which has no card, no fill, and nothing else to hold it. Everything that merely
separates stays at the 6–10% divider strength; the same section keeps its own
group divider at 10%. Strength buys structure, never emphasis, and it never
buys a second pixel.

## Components

Component philosophy: quiet at rest, tactile on contact. Every pressable
carries `.tap` (scale 0.97 + slight fade on press); buttons add `.zw-btn`
(lift 1px + shadow + brightness 1.05 on hover, settle on press); cards add
`.zw-hover-lift` (rise 3px + sh-lg + image zoom).

### Buttons
- **Shape:** full pill (9999px); 600 weight; ls −0.01em; inline-flex with 8px icon gap.
- **Sizes:** sm `8px 14px`/13px · md `11px 20px`/14.5px · lg `15px 28px`/16px.
- **Primary:** ink fill, white text — the default. Used for commit actions.
- **Accent:** terracotta fill (`--p-500`), white text — reserved for the booking action.
- **Secondary:** white fill, `--c-900` text, `rgba(28,28,26,0.14)` hairline border.
- **Ghost:** transparent, `--c-800` text, no visible border.
- **Hover / Press:** translateY(−1px) + hover shadow + brightness(1.05); press scales to 0.975 and drops the shadow. Disabled = 45% opacity, no lift.
- **Focus:** global `:focus-visible` — 2px terracotta outline, 2px offset.

### Chips
- **Style:** white pill, hairline border (12% ink), 13.5px/600, optional leading 14px icon; `whiteSpace: nowrap`.
- **Active:** inverts to ink fill + white text + ink border (the same on/off grammar as tabs, pagination, help chips, and share buttons: *active = ink*).
- **Hover:** category/search chips use `.zw-chip-lift` (1px rise, no shadow).

### Cards / Containers
Three card families share `var(--card-r, 18px)` and `.zw-hover-lift`:
- **White card** (BusinessCard): white, 6%-ink hairline, sh-sm; 16:10 photo header with frosted category pill (94% white + blur, CatDot + 11px/600 label) and floating HeartButton; body `15px 17px 17px` with 18px/600 truncating name, Rating on the same baseline, 13.5px blurb, and a fused meta row.
- **Overlay card** (BusinessOverlayCard): 4:5 full-bleed photo on ink, dual scrims (top 30% black fading out; bottom rising to 88% black), magazine-bold white name (clamp 20–25px/700/−0.03em with text-shadow), city · distance line at 82% white, and a confident rating block — 31px/700 number beside fractional 12px stars and a 13px review count.
- **Content panels** (help cards, TOC disclosure, search fields): white, 8–12% hairline, `--r-lg`–`--r-xl`, sh-sm.

Skeleton states use `.zv-skel` (shimmering `--c-200`→`--c-300` gradient sweep,
1.4s); missing images fall back to `.zv-stripe` (45° ink-alpha stripes on mist)
with a mono uppercase label.

**Loading feedback:** reuse the existing `Skeleton` for initial page or section
content and the existing `Spinner` for pending actions. Pending buttons replace
their visible label with `Spinner` and remain disabled until the request settles.
Never use visible loading text such as "Loading...", "Loading details…", or
"Se încarcă…" as loading UI. Preserve loaded content and navigation during retries.
Keep accessible action names, `aria-busy`, and screen-reader-only status messages;
these do not replace the visual skeleton or spinner. Reuse the shared components
and their existing motion rules rather than introducing custom loaders.
Use the shared `Button` loading prop for pending actions; it keeps the normal
action name and its dimensions while showing the existing spinner.
Render resolved content directly in its reserved position: do not replay
entrance fades or stagger animations when it replaces a skeleton.
Keep known localized copy visible and share its layout with pending content.
Availability belongs to its selected date: pending or superseded results must
never remain selectable.
Reserve the final control footprint and match skeletons to the content's actual
responsive geometry. Keep unresolved data distinct from a successful empty or
zero result; a failed request must offer recovery instead of claiming either.

### Inputs / Fields
- **Style:** white, 12%-ink hairline, 14px radius, sh-sm; icon leading inside `6px 6px 6px 16px` padding (help search).
- **Focus:** container `:focus-within` — border warms to `--p-400`, glow `0 0 0 4px var(--p-100)`. Range sliders: 6px `--c-200` track, 26px ink circular thumb.
- **Switch:** 46×28px pill, `--c-300` off / ink on, white knob springs 18px (`--ease-spring`).
- **Error feedback:** use `PageError` when a failure prevents the page from being used, including initial loading, session-verification and render failures. Reuse its centered illustration, heading and description; choose actions from the actual failure. Retry transient failures, offer navigation out, and never offer Retry for a confirmed missing appointment. Keep successful data visible after background or action failures and announce those through the shared error toast. Repeated automatic failures in one outage must not queue duplicate notifications; explicit retries must report their result. Clear stale notifications after recovery or leaving the page. Appointment dialogs provide room for the shared toast below their controls, inside the keyboard focus scope, so feedback never covers an action or dismisses the form when clicked. Keep field validation inline rather than replacing it with a toast.
- **Inline errors:** use the shared `InlineError` component for field validation and field-specific API rejections. It uses a 14px `AlertCircle`, 12px/16px error text (`--s-error-text`), centered icon alignment and a 6px gap. Sign-in credential fields use its explicit `showIcon={false}` option to match the admin sign-in treatment. Field messages sit below the input with a 4px top margin; preserve their IDs and input associations. Render messages only when present so they grow the surrounding content; do not reserve an empty error row. Loading labels, status badges, toasts and full-page/structured failure states have their own presentations.
- **Textareas:** use `TextareaField` for every multiline plain-text field. Disable manual resizing, keep a fixed height with internal vertical scrolling, and show the localized character counter even at zero. Use a single 1px ink border on focus without another outline or ring. Require a visible associated label, a field-specific length cap, and `aria-describedby`/`aria-invalid` associations for errors. Reject HTML tags, script/iframe fragments, executable URI schemes, inline event assignments and unsupported control characters through `validatePlainText`, mirrored in API DTO validation. Preserve ordinary punctuation, diacritics, tabs and line breaks; never silently strip input. Show content/length errors immediately and missing required text after blur or a submit attempt. Revalidate at submission boundaries, retain drafts after failed requests, and use translated `InlineError` messages without an empty reserved error row.

### Navigation
- **Top bar:** sticky, `--nav-h` (68px), with an opaque `--c-canvas` background and a subtle bottom hairline. The background stays solid before and after scrolling, on desktop and mobile. Text links (`.zw-navlink`) are 14px/600 at `--c-600`; hover and active simply darken to `--c-900` — color alone carries the state, no underline or pill.
- **Header search:** a 52px segmented pill at viewport widths of 1200px and above, with a viewport-based width of 400–480px that stays consistent across English, Romanian and active query values. Three equal fields use 10px mono labels, 14px values, visible focus rings and ellipsis for long selections. The terracotta search action is 44px square. At 601–1199px, a compact labelled control (180–220px) opens the same search flow; phones up to 600px use a 44px search icon. On home, the control appears after the hero search scrolls away, with a short 180ms rise/fade when reduced motion is off. Field hover uses a faint inset highlight, without changing the outer shadow or showing native tooltips. Press feedback stays subtle; widths never animate. Styles live in `site-header.module.css`.
- **Language navigation:** reuse `LanguageSwitcher` in the header, beside the account controls. Show the current language name on desktop and its existing 44px globe trigger up to 920px. The menu opens below the trigger and preserves the existing route, query, hash and translated destinations. Search uses this same header control; the standalone 404 uses its own header. The footer's trailing slot holds the existing 250 × 50px ANPC/SAL badge, on a separate row on narrow screens.
- **Tabs** (Journal `.zw-jtab`, detail pages): 14.5px/600 quiet text (inactive `--c-500`, hover `--c-800`, active `--c-900`) over a 1px hairline rail, with a 2px ink indicator that springs (`0.42s var(--ease-spring)`) between tabs; mono micro-counts sit beside labels and turn terracotta when active. Tab panels enter with `.zv-tab-in` (6px rise + fade, 0.32s).
- **Pagination:** 42px mono pill buttons; active = ink; hover = shade + stronger hairline.
- **Service catalog:** homepage industry tiles, See all industries and the map's More action share `ServiceCatalogProvider`. Use a wide desktop dialog with a fixed industry sidebar and grouped service rows; up to 760px it becomes a full-height sheet with horizontal industry filters. Select exactly one industry or All industries; selecting the active industry again keeps it selected. Keep option positions and typography stable, and reset on each opening. The active option uses a neutral gray fill, a thin neutral outline, dark text and its canonical colored icon, with a neutral trailing chevron on desktop. Industry focus rings also stay neutral; do not use terracotta for catalog selection styling. Choosing a service applies immediately, preserving the map's place, date and refinements. Keep the homepage's real search and `/industries` links for direct navigation. Reuse loaded taxonomy; retain keyboard focus in view, restore opener focus on dismissal, and use the shared loading/error components for recovery.
- **Explore service rail:** an active industry, service or text query appears as one centered, clearable pill; hide suggestions and More until it is cleared. Pointer changes use a short rise/fade with the shared ease-out curve; keyboard and reduced-motion changes stay immediate. Inactive layers are inert and hidden from assistive technology. Move focus to the selected pill after choosing, and back to More after clearing; keep the 44px clear target and its focus ring within the rail.

### StatusPill
6px status dot + 600-weight label in the status color (`--s-success-600` open /
`--c-500` closed), followed by an optional `--c-600` "· closes {time}" suffix.
The whole pill is one 12.5px inline-flex span.

### Saved collections

Customers save locations and people only, as in the marketplace app; brand and
business surfaces carry no heart. Hearts show for everyone: signed out, a tap
shows "Sign in to save" with a Sign in action, and an unverifiable session shows
the heart as unavailable rather than "not saved".

Saved uses the account-page title scale also used by Appointments: a 36px/600 title
with no kicker above it and a mono "N saved" summary that hides at zero. Counted ink-active filter
pills (the Appointments filter grammar) offer All plus only the types you have;
a selected type that empties stays visible so the choice can be changed. Saved
sets both a step larger than Appointments: a 13px summary, and 46px pills with
15px labels and 12.5px counts. The All
view is one list, newest saved first. Use supplied public slugs, with the
existing numeric route fallback. There is no Refresh button: the list
revalidates on focus and reconnect, and Retry appears only with an error.

Places are the homepage's "Near you" tickets (BusinessFeedCard) with larger
type: 168px tall, white with a 6% hairline, sh-sm and the 18px card radius. A
150px photo on the left carries the white name (16px/700, two lines at most)
over the feed card's top and bottom fades, with the 13px brand under it
(location names are often neighbourhoods; the brand is omitted when it repeats
the name). A dashed seam leads to the details: the category in 12px/700 small
caps with its 16px industry icon in the industry accent, the address in
16px/500 (two lines at most), and the hairline footer with the shared 14px
rating ("★ 4.4 (17)"). Saved has no distance or opening hours to put beside it.
No saved dates, distance or map link.

People get their own card in the same frame. Profile photos are often small
avatars, so a person is a 112px circle portrait (or their initials on a
shade-to-mist gradient when there is no photo or it fails to load), framed by a
white gap, a hairline ring and a soft shadow. Beside it, vertically centred: the
name (19px/600, two lines at most), the role in 12px/700 small caps, and the
rating. The text starts where a place's details do, so mixed columns align.

The remove heart sits top right on every card as a 40px ringed chip, like the
location page's icon buttons (c-50 fill, 12% hairline, sh-sm; hover darkens it
to c-200 and a press settles it), with a 20px terracotta glyph. It is inset
11px from the corner and centred on the category line, its tooltip names the
action, and it is a sibling of the card link. The grid uses the feed's auto-fill 360px tracks with a 16px gap (12px on
phones); cards narrower than 340px slim the photo to 120px and the portrait to
96px. Hover lifts the card 3px and zooms the photo or portrait (pointer devices,
motion allowed); a press settles it. Skeletons are 168px tiles in the same grid.

With nothing saved, the page centers one vertical composition on its warm paper
canvas: a fine-line SVG of an empty heart-marked collection folder between
neighborhood buildings, the "Nothing saved yet" H1, guidance, and a compact
52px ink Explore places pill. The separate Saved header is hidden in this state.
The artwork is up to 440px wide and scales to fit phones; the title is 26–32px/600,
and the copy and action remain centered at every width. The composition centers
within the viewport below the site header and above the mobile tabs. The artwork
follows the marketplace app's homepage streetscape: rounded 1.4–1.7px strokes,
stone outlines, paper and mist fills, and terracotta reserved for the collection.
It uses web color tokens and is decorative, with no extra screen-reader
announcement. It renders in place on first load. Swapping between it and the
grid (removing the last item, or undoing that) settles in, and removing the last
item from the keyboard moves focus to Explore places.

Signed-out Saved uses the same centered composition and artwork scale, with a
companion SVG of a favorite storefront with an open door and a heart above its
striped awning. Its centered H1 is "Saved / Salvate", followed by "Sign in to see
what you’ve saved. / Conectează-te pentru a vedea ce ai salvat." The primary
"Sign in / Conectează-te" and secondary "Explore / Explorează" buttons sit
together below, wrapping as needed on narrow screens.

Signed-out Appointments uses the same centered layout with a companion studio
illustration: a clock above the entrance and a small calendar beside the door.
The H1 is "Appointments / Programări" and the description is "Sign in to see
your appointments. / Conectează-te pentru a vedea programările tale." Its sign-in
and explore labels match Saved. `SignedOutGate` supports this layout through an
optional decorative `artwork` prop; other consumers retain their icon layout.


Removal follows the app: the row hides at once and an Undo toast shows
immediately (it does not queue). The delete is sent when the 6s window closes,
when another item is removed, or when Saved unmounts; Undo is local, so it never
re-saves or changes the saved date. A failed delete restores the row with Retry.
Closing the tab inside the window leaves the item saved. Hearts elsewhere change
when the delete is sent.

Removal and Undo move one card at a time: the removed card fades out (180ms)
before it hides; cards in the same row slide into the gap (280ms), and a card
that changes rows settles in at its new place once the slide clears it (120ms
later) instead of sweeping across the grid. Undo settles the card back the same
way. Bulk changes (a filter switch, a refresh) render at once, reduced motion
skips every animation, and removing from the keyboard moves focus to the card
that took the removed one's place.

Keep raw favourite records in a browser-only, session-owned memory cache. Reuse
cached content during navigation and offline; revalidate on focus and reconnect,
and distinguish unresolved, failed and successful-empty responses. A first load
that fails on the network or with a server error retries twice before the error
shows. A session-verification outage offers retry, never a false sign-in claim.

Saved never asks for location. Missing hours, availability and prices remain
unknown. Professional profiles select a single venue automatically, require an
explicit choice for multiple venues, and clear service picks when that choice
changes. Missing currency/timezone blocks booking instead of guessing. Carry the
effective pricing visibility policy through the profile and booking drawer;
hidden amounts use the existing Request quote wording.

### Appointments

The signed-in list uses the account title without a repeated summary. Filters
share one underlined row with an ink active indicator, scrolling horizontally on
narrow screens. All, Upcoming and Past have count badges; Cancelled and No-show
omit partial or stale totals. Sections use plain H2s and remain expanded.
Cards follow marketplace-app's compact receipt:
a separate weekday/day/month date pill, time and stamp/countdown above the service
and duration/price, then a perforated seam with 9px side notches. The bottom stub
contains the location logo/name and professional avatar/first name. Location
names stay plain text, without hover underlines, tooltips or arrows; the whole
ticket links to appointment details. Center Load more beneath the history grid.
The status dot is centered inline with the time. Web cards use 19px service
titles, 15px times/venue names and 13px supporting details, with 20px vertical
top-zone padding and a 72px stub. Service titles can occupy two lines.
Upcoming and history use the same size. Three desktop columns become two on
smaller screens and a single dotted timeline below 840px. The date pill is ink
for future bookings, terracotta for today/in progress, and quiet for history;
cancelled/no-show tickets are muted. Preserve server ordering and statuses,
including past appointments whose recorded status is still confirmed. Full date,
status, service, venue and professional remain in the link's accessible name.

A successful empty account hides the filters and centers a large calendar
streetscape, one H1, direct guidance and an ink Explore action. The calendar uses
layered paper, rounded binding loops, a turned corner and a quiet seven-column
grid without selected dates. Its stone neighbors share Saved's fine ledges and
masonry details. Empty filters keep
the page heading and filters, with a View all appointments action. Session
verification failures offer retry, not a sign-in claim. Offline views retain
loaded content and disable requests until reconnection. Filter, loaded history count and scroll preferences are browser-memory only and owned by the
authenticated session; appointment records are not stored with those preferences.

Appointment detail uses the shared 1400px content boundary on a plain canvas.
Keep the warm gradient inside the booked-service receipt: a subtle horizontal
wash from `--c-50` to a 40% blend of `--c-shade`, continuous through its total.
An enlarged date pill anchors the service title and business identity; the full
date and prominent time range stay together beneath it. The recorded status sits
at the summary's top right in the list's dashed, slightly rotated mono stamp,
with relative-day text beneath it. Keep confirmed and completed labels visible;
only an in-progress confirmed visit gets the live dot. On narrow phones the title
uses the row beneath the stamp so they never overlap. Match the list's date
colors without deriving a new appointment status.
Venue and professional identity rows sit side by side where space permits,
with independently rounded photography and avatars. Separate the two sections
with a hairline and breathing room; use a horizontal divider when they stack,
and omit it when no professional is shown. View profile opens the shared
professional modal over the appointment without changing the URL. Keep booking
scoped to the appointment's business and location, selecting that single venue
automatically; if it is unavailable, retain the profile and explain that booking
is unavailable there without selecting another venue. Historical professionals
and missing live business/location identities remain noninteractive.
The lower business section is labeled
About / Despre, with a View brand / Vezi brandul action to its
brand page, distinct from the Where section's location link. Avoid stretching these
identities into empty white cards. The booked-service receipt is the principal
paper surface, with a perforated total divider and transparent side cutouts that
reveal the canvas even when the total wraps. Match the list ticket's 16px outer
corners, inset paper outline around each 9px notch, soft shadow and 2px/4px
perforation rhythm inset 14px from the edges. Use the list's 19px bold service
title and 13px mono metadata. Notes and business information
sit directly on the canvas. Section headings use readable 18px sans type.
The desktop management sidebar aligns with the summary inside a warm-paper
container with an 18px radius, hairline border, small shadow and 24px padding.
It groups actions with hairlines and is sticky only on tall viewports. Its loading skeleton uses
the same composition and shared loading primitives.

On mobile detail, stack identity rows and show venue and booked services before the management panel.
A Manage appointment shortcut near the summary focuses that panel. Keep the
primary View map or Book again action in the existing bottom bar, with an
opaque canvas background so scrolling content cannot compete with its labels. Eligible
completed visits instead use Leave a review as the primary action and Book again
as secondary, on both desktop and mobile. The review action uses the primary
terracotta (`--p-500`) with no border and white-palette text and star (`--c-50`). Reuse the existing combined review
flow; a successful submission closes eligibility even if the refresh fails. Policy
explanations use the location's actual cancellation/rescheduling settings and
notice windows. Combine them only when both actions are enabled with equal
notice periods; show the actual duration, or the start-time cutoff when zero.
The map-search action reads View map / Vezi pe hartă on desktop and mobile.
Use Call / Sună and With / Cu cine. Preserve each booking's actual source after
Booked on / Programare făcută pe; only marketplace bookings say via Zavoia.
Pending requests retain backend-permitted actions and use
Cancel request wording. Within their scheduled window, unconfirmed visits remain
Pending, retain map/contact options, and explain that confirmation has
not been recorded. Past pending appointments say Appointment not confirmed /
Programare neconfirmată and describe their current status, using the business
name when available. Do not imply confirmation history, cancellation or a no-show,
or instruct the customer to check the outcome. Only confirmed visits show live progress. Time passing never
completes a visit or enables a review. Show a single live status, and suppress
countdowns on terminal states. Detail and list revalidate while visible and online.
Offline detail retains loaded information and disables network actions until
reconnection. Long provider names wrap within the page. Service details retain
their recorded prices and item breakdown. Label the receipt total Total, with
Price recorded for this appointment / Prețul înregistrat pentru această programare;
do not imply payment, balance due or an immutable original price. Emphasize the total,
keeping the heading focused on the service, date, time and duration.

Rescheduling displays seven dates at a time from the API's thirty-day windows,
with available times directly below. Times use the same venue-zone, 24-hour
format as the appointment. Match the other appointment dialogs' 540px width,
24px title, warm canvas and fixed header/actions with a scrollable body.
Keep the dialog height stable within the viewport when dates or slots change,
and preserve the date row's scroll position when clearing the previous week's
slots. Week changes use a short 220ms directional slide and fade; navigation
buttons stay mounted, and reduced motion removes the animation.
Use an unboxed booking summary with an 80px location image (64px on phones),
a 22px service title (20px on phones), and distinct brand/location text.
Show each named assigned professional in a separate row with the shared 44px
circular photo or initial, an 18px name and their returned professional title
when available. Preserve all named members and wrap long names. Separate the current
appointment time from date selection with a quiet hairline. Dates and time slots
use warm neutral surfaces, ink selections and dark keyboard focus; keep 44px
minimum date targets with internal horizontal scrolling on narrow screens.
The borderless terracotta confirmation action sits beside the selected new time
on desktop and below it on phones. Retain the accessible pending action name,
shared spinner and skeletons matching the date/slot geometry. Preserve the
existing availability, paging, selection and submission guards.
Reviews remain one combined submission: each comment
requires that subject's star rating and untouched subjects stay optional.
The close button, Escape and backdrop dismiss the review directly and discard
the unsent draft. Reopening starts a fresh review. Only the explicit Post review
action submits; dismissal remains blocked while that request is pending.
The review dialog is 540px wide on desktop, with a 24px title, a quiet booking
summary and one subject at a time. Eligible professionals come first, followed
by the location; show its branch name with the brand secondary. Multiple subjects
have a small step count and segmented progress, Back and Continue/Skip actions.
Location-only visits open directly into the review without step controls. Keep
all drafts when navigating, post once from the final step, and prevent a double
click on Continue from publishing. Use prominent subject imagery, visible neutral
star outlines and terracotta selected stars. Label the blank three-line field
Comment (optional) / Comentariu (opțional), with a 2,000-character cap and an
always-visible counter. Disable manual textarea resizing. On focus, darken the existing
1px border to ink, preserving its radius without an additional outline or ring.
Remove tap instructions and scripted comment placeholders.
Put the one-time submission notice and public identity disclosure immediately
before the publishing controls; the instruction to include everyone appears only
when professional targets exist. Notices scroll with the form so actions stay
reachable on short screens. Public reviews show the first name, surname initial
and profile photo when available. The final action is borderless terracotta with
white-palette text; pending requests reuse the shared spinner and retain its
accessible action name.

Cancellation uses the same 540px dialog and 24px title scale. Show the booked
service and additional service names with a larger location image, the distinct
brand/location names, the full date and 24-hour time range in the venue's zone,
and all named assigned professionals. Keep the summary unboxed, with a quiet
date badge and one divider before the schedule. Use equal-height Keep/Cancel
controls, side by side on desktop and full width on phones. Cancellation retains
the destructive red fill and white-palette text; pending appointments keep the
Cancel request heading, action and success copy. Preserve pending-action locks,
duplicate/closing guards, error toasts and the authoritative cancellation result.
Web appointment management has no external calendar export or download action.

Appointment support uses the same 540px dialog and 24px title scale, with an
unboxed booking summary, a 112px image (80px on phones) and a separate venue-local
date and time row. Two native radio choices,
Problem / Problemă and Question / Întrebare, replace the dropdown; Problem is the
default for the Report a problem action. A shared ink pill moves between the
two choices over 220ms with the existing ease-out curve; labels transition over
160ms. Keep native radio keyboard behavior and focus feedback, and switch
instantly when reduced motion is preferred. Explain that messages go to Zavoia
Support with the appointment context, and that replies are in Account → Support
/ Cont → Asistență. Label the blank field Message / Mesaj, preserving its
9,500-character limit and always showing the counter, including at zero.
Disable manual resize and use the review field's
single dark focus border. Close discards the draft without sending; only Send
message / Trimite mesajul posts. Use a borderless terracotta submit button with
white-palette text, shared pending spinner and duplicate/closing guards. Use
inline field validation and error toasts for request failures. Keep the header and actions fixed with the form scrollable on
short screens.


### Account-link confirmation

The emailed marketplace-access link uses a centered 420px content column without
a card, border or shadow. The full-width page reuses the home hero's
`--surface-warm` gradient and quiet terracotta radial glow, with a 30px heading.
Fade the page background back to `--c-canvas` over its final 220–360px so it
meets the existing footer surface without a hard color boundary.
A decorative streetscape with an arched doorway and a personal key leads the
confirmation and its loading state. Match Saved and Appointments' native SVG line work, stone
neighbors and terracotta focal object; keep it at most 336px wide and responsive.
Successful activation reuses the same artwork. Error and retry states retain
their compact status icons.
Show the validated account email as a separate identity row, keeping addresses
wrappable on phones. The password field is 52px high; the primary action is a
full-width ink pill at least 54px high, followed by a quiet return-to-sign-in link.
Use the shared AuthField, InlineError and Button loading behavior. Keep password
and Google actions unavailable while password confirmation is pending.
This verifies an existing password: require a value and preserve it without
trimming, Unicode normalization, sanitization or new-password strength checks.
Focus invalid fields, clear stale errors on edits, and preserve the form for
network, server and rate-limit failures. Only known token errors make a link unusable.
The route fallback and validation skeleton share the content geometry. Success,
unusable-link and retryable-check states use the same shell and their existing
copy/actions. Preserve the non-consuming token check, password verification,
Google handoff and localized success destination. The marketplace footer stays
outside this view and is unchanged.

### Detail-Page Grammar (signature)
Location (`/business/[slug]`) pages lead with a 44px back control and quiet
Share/save actions, then identity beside photography on desktop. Toolbar hover
and press feedback stays local: background/color changes, no transforms, filters
or hover shadows. Transform promotion here repaints a large Chromium page layer.
Keep the labeled Share action, its pending spinner, and the shared heart's
unresolved/unavailable/pending states. A failed native share offers an explicit
Copy link action, giving clipboard access a fresh user gesture.

Put the labeled See on map action immediately before Share in the toolbar. It
opens the existing Explore map focused on this venue. Preserve its wording on
phones: Share becomes a 44px icon control below 600px; below 370px, Back becomes
a 44px icon control and the map pin is omitted. Keep localized accessible names
on these compact controls and retain local background-only hover feedback.

Lead the identity with the canonical industry icon and localized industry label,
followed on the same eyebrow row by the opening status. Keep closing-time detail
after the status, allowing it to wrap when space is tight. Place the sole location
H1 beneath the eyebrow at 52–60px/600. Names longer than 24 Unicode characters
use a compact 38–44px title (36px on phones, 34px below 370px). Show the full name,
wrap at natural word boundaries, and allow emergency wrapping for unbroken text;
never truncate or clamp the title. Give the desktop overview a 360px identity
column, or 300px at 1100px, independently of the booking rail. Place the owning
brand last in the identity column, beneath the address, with a full-width divider
above it, 12px top padding, a 32px logo and a 17px/600 brand link.

Use a dedicated 44px review action with a 20px star, 28px score and 18px localized
written review count aligned to the score's typographic baseline. Keep optional
distance on a secondary line. Show the 15px full address as a wrapping Google Maps
place link with a 20px pin and quiet external-link arrow. Use the address as the
place query, falling back to its coordinates. Open it in a new tab. Keep the
address in the identity header on every tab, including About. Do not duplicate
it in Contact. The toolbar's See on map action remains in place.
A city without coordinates or a street address stays
static. Keep 12px between identity groups and local
color/underline hover feedback. At 920px the identity and gallery stack; phones
use a 40px short name. Use the professional page's
fine outer frame, inset content and faded dividers to connect header and catalog.
Confine warm material to the overview and keep the shared 1400px container.
Brand pages retain their own identity-led layout and location cards.

The location gallery is an asymmetric photo collage with a tall central image,
offset supporting photographs and a dedicated See all tile. A diffuse warm
gradient blends into the page behind the composition; avoid an enclosing card.
Show up to four distinct previews on desktop and three on phones. Adapt the
composition to two or three photos without duplicating images or empty tiles.
Use an 8px gap/corner radius (6px on phones), a 320px desktop height, 280px on
short laptops, 300px on tablets and 264px on phones. The localized ink See all tile
contains the full photo count and opens the shared ImageViewer. One photo fills
the gallery without a redundant See all tile; zero photos retains the compact,
noninteractive shared fallback. Every unique photo remains in the viewer,
including those omitted from the preview. Preserve thumbnails, keyboard/swipe
navigation and focus return to the originating photo or See all tile. Only
visible previews participate in image transitions; other photos fade. Hover
never lifts or zooms photographs or controls. Match image sizes and the route
skeleton to the collage's responsive geometry.

Between 921px and 1100px, place the fourth preview beneath the left supporting
photo and widen See all across the right cluster, keeping localized copy inside
the tile as the identity and collage share a narrower viewport.

Services / Team / Reviews / About tabs remain sticky beneath the site header,
with ink active rules, mono counts and native keyboard navigation. The service
menu has a 30px heading, compact search, category filters and 21px category
headings. Use 19px service names (18px on phones), readable descriptions and
mono durations, with prices aligned in their own desktop column. Phones place
price beneath the service details. Circular 44px plus/check indicators retain
the professional profile's selection grammar. Each bookable
row is one native toggle button; unavailable rows remain static. Search and
category filters preserve their state, as do service selections across tabs.
Team cards use portraits beside readable identity and a quiet profile link,
retaining grid/list views and contextual professional modals. Team-member
profiles preserve the `?tab=team&member=<id>` deep link.

The desktop booking rail follows the framed page grid: 360px, narrowing to
320px below 1440px and 280px below 1100px. Use the appointment receipt's two
paper halves, subtle warm shading, 9px side cutouts, inset hairline and
perforation before the total/actions. The receipt holds real ordered selections,
separate duration/prices and a prominent 28px total, without invented dates,
availability or confirmation states. Cap it to the viewport so long
selections leave the booking action reachable; short desktop viewports use
document scrolling. Below 920px, use an opaque canvas action bar above mobile
navigation with an expandable, height-bounded receipt. Keep ordered service
and package selections, staff-dependent price/duration ranges, hidden pricing,
and the existing call/contact fallbacks. The route skeleton mirrors this layout.

Reviews retain the merged feed, histogram, sorting and pagination. Failed actions
preserve successful content and use owned error toasts with Retry, cleared on
recovery or unmount. Empty reviews reuse the professional review illustration;
empty services, team and search use related warm-paper SVG linework. About uses
flat contact/hours sections, 18px headings, fine rules and 44px contact/social
targets, keeping unknown hours explicit and location/brand descriptions distinct.

About opens with a 30px/700 section title, reduced to 26-28px on phones, and the
optional location description beneath it at 16-17px. Contact and Opening hours
share two columns from 600px of content width; phones stack them. Contact contains
published phone/email details with plain 19px leading glyphs. Give the values
22px/700 type, reduced to 20px on phones, followed by quiet 14px action labels.
Keep full values wrappable. Align each icon with
the value's first line. Contact and hours content start 16px below their headings;
contact rows have no extra vertical padding and retain 48px minimum targets.
Do not put circles,
badges or separate icon buttons around these glyphs. Reuse the appointment
management rows' local background feedback and ink keyboard focus outlines.
Keep address and map navigation in the header on all tabs; render Contact only
when phone/email is published. Do not add a separate Directions action.
Supporting amenities, policy and brand headings retain the
readable 18px profile scale.

Opening hours sit directly on the page with no enclosing background, gradient,
border, radius or shadow. Use a 20px heading, compact 16px live status and quieter
next-opening detail. The stable seven-day list uses 15px tabular times and compact
36px rows. Stronger type, a quiet shade band and aria-current=date identify the
current weekday. The band extends 10px beyond the row without shifting its text;
do not add visible Today wording or badges. Align next-opening detail with its
status text. Use the shared Skeleton
in the status summary while the clock resolves, preserving its footprint. A
single shared clock refreshes the header and About on visibility and page
restoration. Reuse the validated interval parser for status, next opening and
displayed hours: normalize HH:mm, distinguish missing/invalid from closed, and
reserve all-day meaning for explicit 24/7. Label overnight endings as next day
and explain active hours carried from the previous weekday without rewriting
the published schedule.

The API resolves the venue timezone from location, business, then UTC and supplies
it in both detail timezone fields. Use that venue zone for status and Today, and
keep published weekly times as venue-local wall times. A differing visitor zone
adds a quiet localized timezone note; invalid supplied zones suppress derived
status/Today/context rather than falling back to the visitor's clock. Preserve
the web's 24-hour convention. Holiday hours and split shifts require additional
API data; opening hours never imply appointment availability.

The shared professional profile uses a 960px dialog with a warm content surface,
a 280px identity rail and a stable height capped by the viewport. A fixed toolbar
holds 44px save/close controls, and a separate footer holds the borderless
terracotta booking action with white-palette text. Use a 112px portrait and 26px
name on desktop, then an 80px portrait beside a 22px name on phones. Section
headings are readable 18px sans text; services use 16.5px names, quiet duration
and price details, and 44px ink selection indicators. Each bookable service is
one native toggle button across the whole row, including its text and indicator;
unavailable rows remain static. Show a single venue without a selection outline,
using a rectangular photo and separate business, location and address lines.
The single venue is a whole-row location link, including its photo, with a quiet
trailing chevron and an ink keyboard focus outline.
Group multiple venues under their business name and a localized location count.
Use “Location / Locație” for one venue and “Choose a location / Alege locația”
for multiple venues, without a repeated explanatory subtitle. The booking bar
says “Choose a service / Alege un serviciu” until it shows the selection summary.
Keep the personal “Book with {name} / Programează-te la {name}” action.
Spell out experience years and use “Since {year} / Din {year}” above the Zavoia
membership caption. Localize recognized language names and use locale-aware
count forms; preserve unfamiliar language values and all business-authored
biographies, service names, service categories and customer review text.
Use photo-led choices with 88px by 104px venue images, warm paper surfaces,
18px corners and fine borders. Business headers use a small logo or initials.
Keep whole-row selection and an ink outline and filled check for the selected
location. Keep the business and location in each choice's accessible name.
Changing venue clears service picks.
Reveal the selected location's service menu directly beneath that location,
before the next choice. Reuse the same menu and booking state; keep only the
selected menu interactive. In multi-location profiles, place a quiet
“View location / Vezi locația” link with a right arrow beside the selected
menu's Services heading. Use the existing location destination and normal link
behavior, including opening a new tab without dismissing the profile.
Keep the selection card focused on choosing the venue.
Use the shared disclosure timing for a downward
slide/fade and persistent grid expansion/collapse that moves following cards
smoothly in both directions. Retain the outgoing venue's exact menu until its
close finishes, immediately making it inert and hidden from assistive technology.
Transitions reverse from their current position during rapid switches; reduced
motion changes immediately. Preserve the open menu on return from booking.
Native choices expose their expanded state and controlled
panel; single-location navigation remains a link.
Professional reviews use bespoke warm-paper line artwork with terracotta and
neutral details, matching the appointments illustrations, beside neutral copy
on desktop and above it on phones. Avoid a generic icon tile or circle and do
not imply that a review can be submitted directly from the profile.
Keep only “No reviews yet / Nicio recenzie încă” beneath the section heading,
without an explanatory empty-state description.
Populated reviews use an aggregate score, readable stars/count, 40px reviewer
avatars, trailing dates and comments that preserve line breaks. Retain the
existing review pagination, pending feedback and toast recovery.
Keep long names and venue details wrappable. Phones use a rounded dialog inset 12px, one content scroller
and stacked booking controls. Hide the native scrollbar tracks in the rail,
content and mobile body while preserving native scrolling and keyboard access.
Retain the shared profile, venue-selection, pricing, favorite and booking logic.

The public professional route server-loads the existing profile and booking
context. Reuse that context during hydration; a context failure preserves the
profile and uses the existing toast/retry recovery. Render each venue's actual
menu in its own persistent accordion panel, with its own effective prices,
duration, currency and pricing visibility. Closed panels remain inert and hidden
from assistive technology. After a collapse finishes, replace the outgoing
selection snapshot with that venue's ordinary closed menu, rather than removing
the panel's content. This keeps the real services and location links in server
HTML while retaining explicit multi-location selection and the same motion.
Use stored location slugs for links, with numeric fallback. Location canonical,
language alternatives and Open Graph URLs use the resolved location's slug.
Public team cards link to the independent UUID route while ordinary navigation
retains contextual modals. Only advertise an independent link when the API marks
that profile available; the same eligibility controls profile sharing and the
modal's “View profile / Vezi profilul” link. Otherwise, keep the location card as a
contextual modal button. Place the modal link below the rating as quiet terracotta
text with a right arrow; same-tab navigation dismisses the modal, while opening a
new tab preserves it. Omit this link on the public profile page. Use the homepage's shared
Zavoia social artwork when the professional has no portrait. Give location links
localized accessible names that identify their business and venue. Keep Studio
specimens inactive. Keep the real location
Team panel mounted before it is visited. Isolate initial location query/deep-link
reading in its own small Suspense boundary so it cannot replace the full ISR
page with a loading fallback. Professional sitemap discovery follows
public team-listing visibility and deduplicates people across venues, without
changing direct-profile access. Do not invent profile modification dates or
image descriptions; portfolio controls use localized person/index labels.

The standalone professional page uses the shared 1400px usable-content container
and responsive gutters. Keep the 320px desktop identity rail balanced with a
64px gap and readable body copy; stack the identity on phones. A static, subtle
warm gradient and the existing homepage grain fade from the canvas beneath the
header and back into it below the identity. Fine ink rules frame the 1400px
content edges, divide the desktop columns and run above the sticky booking bar.
Inset content from the frame; use a horizontal column divider on phones.
Leave at least 64px gaps at the main divider junctions, including above the
sticky booking bar, and fade their ends over 32px. Keep compact stats separators
short and softly faded rather than applying the page-scale inset to them.
Keep decorative layers behind the content and outside pointer interaction.
The save, share and back controls provide hover and ink keyboard-focus feedback;
pending controls remain inactive, and reduced motion removes lifts and pops.
Retain document scrolling and the sticky booking bar above the mobile tabs.

The booking dialog uses the same 540px width, 24px title, warm body, 44px header
controls and borderless terracotta action as the appointment dialogs. Keep its
height stable at 780px, capped by the viewport, with a scrolling body between the
fixed header and actions. Phones use a 12px inset and stacked actions. Hide the
dialog's native scrollbar tracks while preserving body and state-screen scrolling.
For bookings started from a professional profile,
omit per-service professional cards once that professional is pinned and selected.
Keep their assignment and pricing intact, restore choices after explicit unpin
recovery, and list each selected professional once in the final review. Show the
actual reachable step count: two steps for preselected services, three when
service selection starts in the dialog. Date navigation pages seven dates from
the existing thirty-day response, with a short directional fade/slide. Browsing
dates never changes the selected date, time or professional. Preserve the venue
timezone, staff-dependent prices and durations, hidden-pricing policy, stale
request guards, authentication draft and submission contract. Selected dates,
times and services use ink; professional options show circular photos or initials,
full names and any differing price/duration. Use matching skeletons while content
loads, and shared toasts for failed actions that retain the current draft.
When a professional profile starts booking, the first booking step offers Back to
profile / Înapoi la profil. Returning restores that same profile's venue, service
selection, scroll and focus. Ordinary dismissal closes both surfaces. The profile
stays hidden and inert while booking; after an auth route unmounts the source,
omit the unavailable return action. Review's Back still returns to date and time.

Professional portfolios, location photos and Web Studio fullscreen galleries use
the shared `ImageViewer`. Keep the dark viewport surface, contained image, quiet
title, announced photo position and 48px close control consistent. Navigation is
bounded at the first/last image, with arrows, Home/End and horizontal swipe;
downward drag dismisses. Image clicks keep the viewer open. Location galleries
retain their horizontal thumbnail rail. Studio's Mosaic keeps its in-place
expansion rather than opening fullscreen.

Use the Studio motion vocabulary: a transform-based thumbnail expansion at
560ms, return at 540ms and directional image changes at 550ms. Cancel active
motion on navigation/unmount and clean up clones. Reduced motion removes the
animations and direct drag effects. Respect safe areas and keep controls clear
of the image on phones. Reuse `Img` and `Skeleton` for image loading/fallback;
no visible loading text. Radix owns modal isolation; a parent profile is inert
while the viewer is open and its custom keyboard handlers are suspended. Return
focus without scrolling after the parent becomes active again. Studio-specific
thumbnail geometry, source synchronization and theme stay in its adapter.

### Toast
Ink toast rising from the bottom (`.zv-toast`, spring), with a terracotta circle
for ordinary feedback and a standalone 18px red warning triangle for errors.
Use separate icon, message and control columns, aligned to the first text line,
with 22px text line-height and 24px corners so multiline messages stay readable.
The close control has an 18px glyph, a 32px visual circle and a 44px hit target.
Keep action controls reachable and text wrapping inside the available width.
The fixed host uses the available width up to 460px. On phones, place it below
the header so it clears the bottom navigation and sticky appointment actions.
Holds 4000ms (6000ms with an action), then exits with a soft drop.

### Web Studio — specimen catalogue

The homepage website showcase uses published brand websites, one card per business.
Keep its optional band absent until the feed confirms at least one website. A
successful empty result renders nothing, including no section spacing or skeleton;
request failures retain the existing retry notice. Once websites are known, render
the actual card count, captions, intro and carousel controls immediately. Only the
preview assets use a skeleton, inside the same fixed frame as the rendered website.
Reuse the shared shimmer with dark neutral tokens scoped to this preview placeholder.
`WebsiteHeroPreview` reuses the real published website navigation, announcement
and hero renderers inside an inert, static preview with no browser decoration.
The 4:4.2 media frame matches its skeleton. Published layout controls the header
variant, visible section links and whether navigation is shown. The whole card
opens the localized published website. Use published configuration and the existing
website entitlement rules, never draft designs or location photos as website previews.
The caption places a single-line brand name on the left and the optional industry
on the right, below the name on narrow cards. Pair the industry label with its
canonical icon and accent from the shared industry registry, without a dot or icon
background. The whole card is the action; do not add a separate visible website CTA.
Use the existing industry dictionary fallback for missing translations. The caption
stays visible while preview assets load. Its compact footprint keeps long names and
absent industries from changing the card height; keep the full name in its title
and accessible link label.

Character: a museum plate, not a screenshot. Where a surface must *show* the
product rather than describe it, it runs the real renderer inside a numbered,
captioned plate and lets the inventory do the selling. Five devices, introduced
by `/web-studio` and reusable anywhere the product can be exhibited.

- **Specimen plate** (`SpecimenPlate`): the real renderer (`LivePreview`) laid
  out at a fixed *virtual* width (default 1240px) and CSS-scaled down to the
  plate's measured width — a browser-zoom, not a narrow container. The virtual
  width is keyed to the **viewport, not the plate**: a ~560px-wide desktop plate
  still shows the desktop arrangement, while ≤600px viewports switch to
  `max(plateWidth, 430)` so a phone renders near 1:1 and shows the true phone
  arrangement (hamburger nav and all). The box keeps a **stable frame** from
  first render: 16:10 for normal specimens and 8:1 for compact specimens,
  bounded by the caller’s minimum and maximum heights. Measuring the renderer
  updates its scale and crop treatment without resizing the frame.
  Only a specimen taller than its frame is cropped, and only then does an 84px
  bottom fade (transparent → 92% canvas) appear, so the crop reads as a
  deliberate catalogue detail rather than an accident. The plate rests on
  `--c-shade` (the specimen paints its own paper over it, keeping the first
  frame calm), and the subtree is **`inert` + `aria-hidden`** — the specimen
  contains real links and buttons that must never be reachable. `inert` is
  passed as a boolean; `inert=""` reads as false in React 19 and would leave
  them focusable. Plates are remounted (keyed on section+variant) rather than
  height-animated, so no layout property ever lands on the animation path.
- **Plate mark** (`№ NN`): the catalogue's index mark — Geist Mono, tabular
  figures, zero-padded to two digits, `--p-600` on canvas and 50% white on ink.
  It opens the caption; it never labels anything that isn't a plate.
- **Museum caption**: a mono strip under **every** plate — 10.5px/600,
  `0.13em` tracking, uppercase, tabular, `--c-600` on canvas / 52% white on ink,
  12px below the plate, wrapping with a `4px 10px` gap. Segments after the first
  are `CapSeg`: each fuses its introducing `·` (in `--c-400` / 28% white,
  `aria-hidden`) into the same `nowrap` span as the text it introduces, so a
  wrap can never strand a dot at line-end — the mono restatement of the
  `joinDot` rule. Because the plate is `aria-hidden`, the caption is the only
  thing that can narrate a change: the stage's caption carries
  `aria-live="polite"`, and the cover's leads with a 6px dot — `--s-success-600`
  for a live site, `--p-500` for the authored demonstration.
- **Spec strip**: the catalogue's own measurements, docking the ink cover. Four
  equal cells over a single `rgba(255,255,255,0.14)` top hairline, no fills and
  no boxes; each cell is a large white figure (`clamp(28px, 3.4vw, 40px)`, 600,
  `-0.04em`, lh 1, tabular) over an 8px gap and a mono uppercase label
  (10.5px/600, `0.14em`, 55% white). Folds 4→2 columns ≤760px.
- **Index + stage**: the signature pairing. Desktop is a `228px` rail beside the
  stage — a mono section header over a hairline, then a numbered list where each
  row is `NN · label · variant-count`, mono at both ends and 14.5px sans in the
  middle; the current row goes `--c-900`/600 with its number in `--p-600`, the
  rest sit at `--c-600` over 6% dividers. The stage carries the style chips
  (standard chip grammar: white pill, 12% hairline, **active = ink**), the
  plate, its caption and the section's description. At ≤920px the pairing folds
  to one column and the index **becomes a horizontal chip rail** above the stage
  (header hidden, `overflow-x: auto`, scrollbar hidden, rows become nowrap white
  pills, `aria-current` inverts to ink) so the live specimen keeps the full
  width on a phone — see the `[data-ws-*]` block in `globals.css`.

**Accent row** (account menu): the sanctioned way to mark exactly **one** offer
row inside a menu of destinations. Same row geometry as its siblings, but the
icon takes `--p-600` and the label takes `--p-700` at weight 600, against the
default `--c-600` icon / `--c-800` label at 500. Terracotta-as-text keeps it
legible at 14px; one row per menu keeps it an offer rather than a second
navigation level.

**The Derived Figure Rule.** A marketing surface never types a product count or
a price as a literal. Counts come from the real registry — Web Studio's 12
sections, 47 styles, 14 fonts and 30 accents are computed from `SECTION_META` /
`SECTION_TYPES`, `FONT_CATALOG` and `BRAND_ACCENT_CATALOG`, and the page throws
at module load if its reading order ever lists fewer sections than the registry
holds. Money comes from `src/lib/marketing/pricing.ts` (`getPlanPricing`,
`premiumStylePrices`, `formatPrice`, `TRIAL_DAYS`), never from the
dictionaries — the figure is interpolated into copy, in the locale's own
currency. Web Studio quotes the same Plus price and additional-member cost as
the business pages, and explains that the trial starts on Base. Every business
trial action, including Web Studio's, uses the shared business registration URL.
A commercial figure that does not yet exist is marked rather than invented.

### Business marketing pages (/for-business, /pricing)

Character: the shop window seen from behind the counter. The same warm paper,
ink and one terracotta, written for an owner deciding whether to list. Shared
pieces live in `src/app/_components/for-business/` (`marketing.module.css`).

- **Site chrome:** these pages keep the marketplace header, phone tab bar and
  footer like every other page. Business signup lives in the page's conversion
  sections as links to the business app. For Business keeps its hero focused on
  the trial and pricing; returning-business sign-in remains in the closing band.
- **Headlines:** the display H1 ends on one handwritten signature word: Caveat
  700 from `fonts.ts` (`caveat.variable` on the page root, latin-ext for
  Romanian), 1.2em, `--p-500`, rotated −4°. Closing bands may carry a second.
  The For Business hero uses a scoped two-line composition on desktop, with a
  smaller Romanian display scale and a deliberate three-line phone fallback.
  Give the signature a full line-height and descender clearance. Keep Next font
  variables on `html` so the root sans/mono aliases resolve; Tailwind font
  mappings reference the underlying font variables directly.
  Section titles follow the homepage editorial bands: 38–54px, 500, −0.045em,
  `txt-balance`; these pages carry no kickers.
- **Actions:** the bands' 54px pill (14px/550, 22px icon gap): ink for the
  trial, a white hairline pill for the second plan, hover #363630 plus a 1px
  lift, press 0.97. Secondary routes are underlined text links with 44px targets.
  Every trial action is a link to the business app's sign-up, never a button.
- **For Business conversion block:** separate the discovery benefit from its
  operational explanation with explicit localized strings. The benefit uses
  22-28px medium ink type with balanced wrapping; the supporting sentence uses
  17-18px secondary text. Pair a 64px ink trial pill and its circular arrow well
  with a plain underlined pricing link and a 44px target. Use a 60px trial action
  on phones/intermediate laptops; stack the actions on narrow phones. The hero's
  trial label includes the localized duration from the shared trial-day setting;
  keep its no-card reassurance in the illustrated benefits band. The pricing
  anchor smoothly scrolls to the plans below the sticky header, preserving the
  hash and moving focus to that section. Reduced motion makes the jump instant.
  The hero contains only the description and these two actions
  beside the headline, followed by the interactive street. Keep
  sign-in and trial-term artwork outside the hero.
- **Business benefits band:** immediately below the street, give
  the three trial promises their own full-width section with generous 56-64px
  vertical space, quiet hairline edges and three flat columns. Each has a
  bespoke warm-paper illustration around 228x152px, a 22-26px heading and a
  concise localized description. Use a tear-off calendar and clock with the
  derived trial-day count, a card tucked into a sleeve beside an access key,
  and a zero-commission receipt with coins. Keep the native SVG artwork
  decorative and static, using the same ink/mist/terracotta materials as the
  streetscape. Below 700px, stack compact artwork-and-text rows, retaining full
  readable labels and descriptions. No enclosing cards or additional CTAs.
- **Marketplace discovery:** show all four benefits as ordinary visible copy.
  This is a marketing section: services, availability, completed-visit reviews and
  sharing never sit behind tabs, accordions or another click. Keep one underlined
  link to marketplace search. Each benefit has a small paper-object illustration:
  service tickets, a planner and clock, a completed-visit review slip, and a public
  page with linked loops. Use the trial band's ink/mist/terracotta materials,
  layered edges and quiet ground shadows. Paper faces have soft warm shadows;
  raised details get smaller contact shadows and restrained edge highlights.
  Give each benefit its own full-width illustrated row, with the artwork beside
  one uninterrupted text column at every width. Avoid narrow two-column tiles
  that force titles and descriptions into competing wraps. Use 22px semibold
  headings (20px on narrow layouts), 16px muted body copy and a 10px title-to-body
  gap. Separate the rows with quiet hairlines, without enclosing cards. Use
  explicit grids and heading/list semantics.
  Keep illustrations decorative and text-free;
  fine-pointer lifts are disabled for reduced motion. Product mockups are
  noninteractive illustrations,
  with no fullscreen viewer, enlargement affordance, simulated controls or client
  state. Use the actual service-page capture and verified native map screenshot.
  The app phone is the larger foreground subject; the browser recedes behind it
  while keeping service names exposed. Match the homepage's device construction:
  narrow graphite edge planes, rim highlights, side buttons, shallow opposing
  angles and layered contact shadows. Keep native screen content intact and record
  example-data provenance with the assets. Select actual English/Romanian captures
  from `src/lib/marketing/mockups.ts` using the page locale. Capture both the
  interface and authored demonstration content in that language; never overlay
  translated text on a bitmap. On phones,
  retain a large app device and a smaller browser backdrop, then all four visible
  benefits. Fine-pointer hover may lift the hardware mounts a few pixels over
  320ms; reduced motion removes the lift. No autoplay or parallax. Describe
  services, durations and prices, retaining enabled online booking and
  completed-visit review rules. Do not promise an owner-controlled price-visibility
  choice until its dashboard control is verified; renderer/API support alone is
  insufficient.
- **Client journey:** follow marketplace discovery, before the business calendar.
  Pair the genuine consumer Schedule screen with five
  ordered, visible steps. On phones the order is introduction, phone, steps.
  This is the client's booking history, not a business calendar. Record example
  data in the capture manifest and use the matching localized native capture.
  Native status dots sit in the same centered row as each appointment's time
  range; capture the corrected app rendering rather than adjusting bitmap text.
  Give only the reminder step a quiet terracotta emphasis. Copy distinguishes automatic confirmation from
  owner review, configured reminders for confirmed bookings, direct payment,
  completed-visit reviews and a new booking from history.
- **Business calendar:** follow the client journey with one cohesive introduction
  above the working-day demonstration and six visible benefits. Capture the actual
  admin application's desktop day time-grid with staff columns; select the view
  and collapse its navigation and filter pane through the app's own controls.
  Show varied appointment lengths, a reserved break and localized illustrative
  data. Verify that the time pill and line share the same center in the real
  renderer before export; fix source geometry instead of compensating inside an
  image. Preserve product UI unchanged. Never use the consumer Schedule screen
  to represent the business calendar.
  Above 1176px, place the complete browser on the left and a 300px phone on the
  right, bottom-aligned with a real 32px gap. Cap the browser at 1040px and show
  the six illustrated benefits below in two broad columns. Neither screen covers
  the other. Between 761px and 1176px, place the introduction and all six benefit
  rows beside the phone, then show the complete browser below; center the phone
  vertically against the reading column. At 760px and below, use introduction,
  phone, browser, then one column of benefits. The phone reduces to 268px below
  361px. Its localized responsive-browser capture shows the actual default,
  unfiltered Day List, with location controls and the day summary visible.
  Keep both examples intact. Use narrow graphite edges, paper browser chrome and
  soft contact shadows rather than perspective on screen content.
  The benefits cover location/person calendars, booking rules and breaks,
  cancellation and rescheduling updates, team access, services/bundles and client
  history. Pair each with a small paper-object illustration beside one text
  column: a staff planner, blocked time and clock, previous and updated appointment
  slips, staff pass and key, bundled service tickets, and a client folder with an
  export sheet. Keep the previous slot visible and connect the two slips with a
  clear curved arrow above their paper edges. Reuse the discovery illustrations'
  shadows, highlights and 22px/16px text hierarchy; mobile headings are 20px.
  Benefits never require a click. There are no tabs, fullscreen controls, fake app
  interactions or autoplay. Fine-pointer hover may lift the browser by 1px over
  260ms, the phone by 3px over 260ms and the illustrations by 2px over 220ms;
  reduced motion removes these movements. Document source captures and
  illustrative fixture data beside the assets.
- **Business app:** follow the business calendar with a warm-ink section using
  the same full 1400px content width as its neighbours. Use Web Studio's static
  paper grain, ivory type and muted buff copy, with a stronger central terracotta haze.
  Share one continuous textured surface with the next Studio section; no canvas
  strip or separate background seam between them. Omit eyebrows and decorative
  step numbers. Keep the calendar's
  accepted desktop-and-phone pair unchanged. This section demonstrates two other
  owner workflows through genuine native screens: the Assignments page itself,
  showing a varied location service menu with category, price and duration (no
  drawer), and a
  location's marketplace photo portfolio. Assignments connect services, staff and locations;
  they do not delegate appointments. These management pages belong to the owner
  account, so do not imply that every team member can use them.
  Put the headline and lead across the top. Group the platform badges and web
  sign-in under an explicit download heading and a short explanation that the
  business app is separate from the client booking app. Keep this group alongside
  the introduction, moving below it at 920px. Above 1200px, centre two
  separate 340px and 316px phones between open benefit notes, with a 68px vertical
  stagger and opposing 2° rotations; neither screen overlaps the other. Notifications
  form a quiet full-width line beneath the stage. At 761–1200px, use 316px phones
  above their corresponding benefits. At 760px and below, pair each benefit with
  its full-size phone, then notifications. Keep each phone readable
  at 300px, reducing to 268px below 361px, rather than shrinking both into a narrow
  device pair. All benefits remain visible without tabs, carousels or disclosure.
  Use actual Android Capacitor captures, selected by page locale through the
  shared mockup inventory. Derive each screen ratio from its intrinsic dimensions
  and preserve genuine OS status/navigation chrome. Capture both app and Android
  locale correctly. Use real navigation and drawer controls to reach the intended
  state; never add synthetic system bars, reconstruct interface content or use a
  responsive browser capture as native-app evidence. Keep example-data provenance
  and native runtime evidence with the assets, without decorative captions below
  the phones. Do not imply offline support or guaranteed notification delivery.
  User-requested platform labels may match the homepage's store artwork as
  noninteractive spans. Turn them into download links only after their official
  destinations are verified; do not add availability or coming-soon claims
  without confirmation. The quiet web sign-in link identifies its actual
  destination. Devices are noninteractive, with no fullscreen action, simulated
  controls or autoplay. Reduced motion removes movement, and keyboard focus
  never animates the link's arrow. The device wrappers may enter once with an 18px rise over 480ms,
  staggered by 80ms. The server-rendered content remains visible without JavaScript;
  skip entrances for reduced motion, visible content on hydration and locale
  changes. Business-app devices and their benefit notes have no hover motion;
  preserve their static angles. Do not inherit the calendar phone’s hover styles,
  loop, autoplay or move screenshots independently of their hardware frames.
- **Web Studio interlude:** use the actual Lumi Beauty browser and Paw & Co
  phone captures, identifying both as separate examples. Keep the larger phone
  in the foreground on every screen size. Show all three benefits without
  interaction: existing content, design choices and Plus publishing. Drafts are
  available on any plan; premium styles cost extra. A dark paper surface and
  shallow warm haze separate the website offer from the business workflow.
  Replace small feature glyphs with three bespoke paper-object illustrations:
  a content folio with service/photo/team sheets, layout studies with colour
  swatches, and a published page with link and QR sharing. Use buff paper faces,
  darker side planes, fine rim highlights and quiet warm-black shadows so the
  objects belong on the ink surface. Keep them decorative and text-free, beside
  one uninterrupted title/body column. Use the discovery section's 22px semibold
  headings and 16px body text with a 10px gap; reduce headings to 20px on narrower
  layouts. Keep all three illustrated rows visible at every width, including
  tablets. Illustrations lift 2px over 220ms on fine-pointer hover; hardware keeps
  its small hover lift. Reduced motion disables both. Preserve the Plus label,
  underlined Studio link and optional premium-style note. Avoid auto-sync arrows,
  custom-domain imagery or an automatic-publishing implication.
- **Product capture localization:** the homepage and business sections share
  explicit EN/RO masters, including all consumer, business and Studio scenes.
  Generate responsive derivatives with Next Image or `getImageProps`; preserve
  each pair's intrinsic dimensions, framing and accessible descriptions. The
  website language control must switch the pixels inside the devices as well as
  surrounding text. Localize synthetic demo services, categories, descriptions,
  reviews and tags while preserving identities, prices, dates and geography.
  Real merchant-authored content remains unchanged. Finished captures live under
  `public/images/marketing/` and `public/images/for-business/calendar/`, selected
  through `src/lib/marketing/mockups.ts`. Run `node scripts/check-marketing-mockups.mjs`
  and `node scripts/check-marketing-locales.mjs`, then visually inspect the actual
  image text in both languages. A correct filename is not sufficient.
- **For Business plan comparison:** Base and Plus are static, server-rendered
  receipt tickets using the shared 1400px content width. `PlanCards` shares this
  presentation and copy with `/pricing`; section wrappers own their headings
  and background. Heading level and ID prefix follow each page’s hierarchy. No team counter, calculator
  provider, computed team totals, price animation, live announcement or sticky
  controls belong in this section. Show one fixed monthly plan price and owner
  inclusion on each ticket. State the monthly additional-member charge once above
  the cards. Base supports 20 additional members besides the owner; Plus has no
  customer-facing team-size limit. State these differences in the benefits, and
  charge each additional member on either plan. Capacity applies across the
  business's locations. Put each plan's location limit in its benefits.
  Derive prices, limits and trial days from `getPlanPricing`. Use
  28px plan names and 60px prices on desktop; phones use 28px names and 52px
  prices. Desktop benefit headings are 20px, with 16px capability labels and
  15px supporting text; phones use 18/16/15px. At desktop viewport heights up to
  820px, tighten spacing and use 26px names, 50px prices and 18px benefit headings,
  while retaining 15px body text and 52px actions. Fit the complete cards below
  the sticky header at common laptop sizes without fixed heights or clipped copy.
  Split desktop space 45/55:
  Both actions fill the available width. On fine-pointer card hover, gently
  scale its action to 1.015 over 240ms with the shared ease-out; return smoothly
  on exit. Keyboard focus uses the same emphasis; pressing retains the shared
  press feedback. Respect reduced motion and avoid hover scaling on touch.
  Base uses warm paper, no artwork and an
  outline action labelled with the free-trial duration. Plus uses warm ink, a broad
  terracotta glow, pronounced static paper grain and ivory pricing. Its flat ivory action has no
  dimensional rim or shadow and a 40px terracotta arrow well (36px on short
  desktops, 44px on phones). Label it “Get started” / “Începe acum” to cover the
  full plan and match the registration destination. A clear note below explains
  that the trial includes Base features and
  website publication requires subscribing to Plus. Plus has compact, layered
  website/link/QR artwork in its header, without a badge. Keep header
  artwork from creating a large gap above prices; use a 12px price margin on
  desktop, 8px on short desktops and 16px on phones. Align both plan names at the top. A faint grain
  gradient behind the section blends into the canvas; textures
  remain static. Two masked paper halves create genuinely transparent notches at
  the dotted tear seam, revealing the section gradient rather than painting pale
  discs over it. Nested CSS subgrids align prices, tear lines and actions; stretch
  the painted receipt halves to equal heights when the cards sit side by side.
  Keep benefit text readable and top-aligned. Let the three Plus rows share the
  available benefits height with automatic tracks, so spare space is spread
  across the rows without multiplying the height of the longer website row. Group
  Base's complete capabilities into four visible outcomes without a separate
  benefits heading; use the freed space for more breathing room between rows.
  Plus leads with
  “Everything in Base” with a green checkmark and three included upgrades: website
  publishing with link/QR sharing, unlimited team size, and more locations. Explain
  these in three rows, each with a shared terracotta plus icon. Make clear that
  unlimited capacity still uses paid additional-member places. Publishing and
  sharing are two uses of the same website entitlement.
  Place a quiet underlined Web Studio link with an arrow beneath the Plus website
  benefit, using a 44px target and the active locale's route. The full-width
  registration action remains visually primary.
  Below 961px, stack complete tickets at their natural heights so narrower
  translated benefit rows do not create large gaps. Keep the detailed comparison,
  currency, billing-country, cancellation, optional-extra and larger-team terms
  on `/pricing`; do not repeat a details block below these cards. Do not label
  the fixed subscription as a team total.
- **Dedicated pricing page:** `/pricing` uses fixed subscription prices and
  the same Base/Plus card design and localized copy as the business overview.
  Keep each full-width action and its Base-trial disclosure at the bottom of
  the card, beneath the benefits. Retain every benefit in view.
  On stacked layouts, offer compact Base/Plus price anchors above the receipts
  so either plan is immediately discoverable. Do not add a calculator, editable team count,
  estimated totals, or a collapsed calculator. State the additional-member
  charge and owner inclusion clearly; keep display-currency and billing-country
  information near the cards. State that additional staff require paid places
  even without appointments, and that one place covers the business's locations.
  Detailed purchased-capacity explanations stay in
  the pricing FAQ rather than repeating beneath the cards. Base supports 20
  additional members; Plus has no customer-facing team-size limit. An internal
  threshold must be expandable to support the public policy. The comparison
  describes features and capacity without repeating prices as team totals.
  Lead the comparison with website publishing, then location and team limits.
  Keep optional premium-style purchases in the extras section, with included
  website styles and email reminders stated clearly. Use clear numeric capacity
  values and plan labels. On phones, each feature labels adjacent Base
  and Plus values, retaining table semantics and requiring no sideways scrolling.
  Give shared capabilities the full available width with the established paper
  artwork, readable titles and green checks. Keep all core benefits visible and
  optional SMS/style purchases separate. Do not infer production Stripe prices
  from development seeds. On narrow phones, pair each extra's artwork with its
  title and let the body use the full width beneath. Pricing uses the standard
  site header, marketplace search and mobile tabs, matching the other pages.
  Retain in-page plan anchors, keyboard focus and reduced-motion scrolling.
  Carry the active language
  explicitly into web registration, where the dashboard validates the choice
  before rendering. Plan-click analytics require the existing analytics consent;
  never block navigation or claim a click is a completed registration.
- **Business exhibits:** captures sit in quiet browser frames or ink phone frames.
  Keep both device examples available on phones, with localized image descriptions.
  These business mockups have no visible explanatory or example-data captions.
  Keep synthetic-data provenance in the capture manifests and asset documentation.
  The separate Web Studio live-catalogue captions still provide preview-change
  announcements and retain their own rules.
- **FAQ:** native `<details>` sharing one `name`, so one answer is open at a
  time (the first starts open), with the disclosure motion module; works
  without JavaScript. Keyboard toggles are immediate. The help introduction
  remains sticky on desktop. Core benefits, pricing and plan terms stay visible
  above this section rather than depending on these disclosures.
  `MarketingFaq` shares the accepted presentation between For Business and
  pricing, with supplied localized copy and unique heading/disclosure IDs. Lead with the trial question, then
  commission, paid team capacity, website publishing and cancellation. Use a concise introduction,
  the paper guide/question-and-answer artwork and a 44px underlined link to the
  localized help centre. This destination provides help topics and issue
  reporting; do not imply a live chat or a sales conversation. At wide widths,
  pair a 280–360px sticky introduction with a single list of roomy question rows
  and a 32–64px column gap. Align question and answer text with the list's rules,
  without horizontal item insets. Open answers retain the page background;
  question text and the plus/minus indicator use terracotta when open.
  Question text is 20px/550, answer text 16px/1.65,
  with long answers split into short paragraphs. Native exclusive opening and
  closing retain the shared motion; all keyboard transitions are immediate.
  Below 921px, unstick the introduction. Phones use a 34px heading, compact
  artwork beside the help link, 17.5px questions and 15.5px answers. Avoid a
  large illustration-only gap before the questions. Keep all ten question
  labels visible without category filters or tabs. State that the Base trial
  begins when the business is created, that expired trial listings are hidden
  and scheduled client reminders stop. Existing appointments are not automatically
  cancelled; calendar reads remain available, while adding or changing appointments
  requires an active subscription. Do not describe the entire account as read-only
  or promise indefinite retention. Cancellation preserves the paid period. Explain
  that clients need an account to complete a booking, but do not need the app.
  Distinguish website drafts on either plan from Plus publishing and the locations'
  public Zavoia pages. Team charges follow purchased capacity; a member working
  across locations of the same business only needs one paid place. Interpolate
  approved prices, trial days and both location limits from the shared pricing data.
- **Closing section:** For Business uses a scoped `ClosingSection`: group the
  56–64px headline, approved setup explanation and trial action in one column,
  beside a single miniature storefront, paper appointment folio and planter.
  The open doorway and shallow paper depth echo the hero and earlier artwork.
  Use a 330px-wide, 64px ink trial action with a terracotta arrow well, deriving
  the duration in its label from pricing. Place no-card and no-commission
  reassurance with success-green checkmarks directly below, then a quieter 44px
  sign-in link. The appointment folio's confirmation check uses the same green.
  Use the plain page canvas with static fine grain fading at both edges;
  do not add a colored background gradient. Reduce bottom whitespace instead of
  adding a containing card. On
  phones, put the copy and 60px action before the compact 220–260px illustration;
  preserve natural reading order and full signature descender clearance. Fine
  pointer hover lifts the trial action 2px and its paper note 3px, with a 2px arrow
  movement; keyboard and reduced-motion actions remain immediate. Explain that
  owners publish their page and enable online booking; setup alone does not
  publish a listing. The pricing page ends with its billing FAQ, without a
  duplicated closing trial section.
- **Hero artwork:** eight storefronts represent beauty, automotive, health,
  creative services, fitness, wellness, pets and education. Preserve the fine
  rounded SVG linework, paper/mist surfaces and canonical industry colors. Each
  has a 48px HTML industry marker with a 24px glyph. The studio carries its
  camera marker; the hero has no booking receipt or separate industry list.
  Give the street shallow depth through narrow side walls, cornice undersides,
  recessed glazing, fine highlights and grounded contact shadows. Keep these
  tonal SVG planes static, without blur filters. The hero's warm gradient carries
  a dedicated, tiled paper-grain SVG using a transparent ink texture in multiply
  blending at 11% opacity. A shared isolated region lets the hero's decorative
  layers continue 220-280px into the benefits band. Both layers fade together,
  starting gently above the pavement and reaching the plain canvas partway
  through the next section. Keep the benefits background and top divider
  transparent so the transition has no horizontal seam.
  Keep geometry server-rendered and isolate discrete hover/focus/tap state in
  the small interaction leaf. One shared geometry table positions both drawing
  and controls. Below 920px, use a native horizontally scrollable 1120px street
  so all eight businesses remain readable and reachable with swipe or Tab.
  Native buttons cover each building and marker, with localized industry names
  and an explicit keyboard ring. A floating visual label repeats that name and
  stays hidden from assistive technology; do not duplicate it as an ARIA
  description or imply menu/selection semantics. Keep labels inside the rail's
  visible edges and bridge the hover gap. Tap/click toggles a label; Escape,
  outside interaction and leaving the group dismiss it without moving focus.
- **Motion:** hero copy uses `.zw-rise`; trial controls have no extra stagger.
  Pointer hover gently lifts the active building and marker over 220ms while
  its windows take a faint industry tint. No ongoing ambient animation.
  Keyboard interaction and reduced motion show labels and feedback immediately,
  without positional motion. Reduced motion also removes action-button
  hover/press transforms.

### Motion Vocabulary (applies across components)
Three eases: `--ease-out` (.2,.7,.3,1) for movement, `--ease-soft` (.4,0,.2,1)
for color/border, `--ease-spring` (.34,1.56,.64,1) for delight (heart pop,
toast, tab indicator, sheet cards, calendar pop). Durations run 0.15–0.3s for
state, 0.3–0.7s for entrances. Everything honors `prefers-reduced-motion:
reduce` via a global clamp.

## Do's and Don'ts

### Do:
- **Do** put every user-facing string in both dictionaries (`src/i18n/dictionaries/en.ts` and `ro.ts`); the `Dictionary` type enforces key parity — English first, then mirror in Romanian.
- **Do** keep secondary text at `var(--c-600)` or darker on the canvas (the c-600 Floor Rule); reserve `--c-500`/`--c-400` for decoration and verify large meaningful text meets 3:1 against its background.
- **Do** join meta segments with `--c-400` "·" separators, interleaving only the segments that exist (use the `joinDot` pattern), and keep each separator fused in a `nowrap` span with the item that follows it.
- **Do** use ink for structure and state (active chips/tabs/pagination invert to ink + white) and terracotta only for the accent action, ratings, focus, and live signals.
- **Do** give every card `var(--card-r, 18px)`, `.zw-hover-lift`, and a `.zw-zoom-wrap` around its image so hover = 3px rise + sh-lg + 1.045× zoom, together.
- **Do** set `tabular-nums` on every mutable number and use Geist Mono (≤13px, 600, wide-tracked uppercase) for kickers, indices, and counts.
- **Do** use non-enumerable slugs for detail routes (`/business/<locationSlug>`, `/brand/<businessSlug>`, numeric-id fallback) — never sequential IDs in URLs.
- **Do** gate entrance animation behind `prefers-reduced-motion: no-preference` and offset sticky elements against `calc(var(--nav-h) + N)`.

### Don't:
- **Don't** use `--c-500` for body-size secondary text — it fails the 4.5:1 contrast floor on the canvas.
- **Don't** back the page with white or tint content surfaces with status color; the page is `--c-canvas`, cards are white, and status arrives as a 6px dot.
- **Don't** introduce a second accent, gray-hex borders (hairlines are ink-alpha), pure-black shadows (shadow color is `rgba(28,28,26,…)`), or a dark mode.
- **Don't** hide native page scrollbars, orphan a dot separator at a line end, or let a card grid orphan a lone third card (use the explicit 3→2→1 grid).
- **Don't** exceed the one authored motion grammar — no parallax, no continuous ambient animation beyond the sanctioned pulses (live dots, radar rings), nothing that ignores `prefers-reduced-motion`.
