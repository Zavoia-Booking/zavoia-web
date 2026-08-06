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

There is no dark mode; the system is one light world. Scrollbars are hidden
site-wide (surfaces remain scrollable). All copy exists in both English and
Romanian.

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
- **Text Faint** (`--c-500`, {colors.text-faint}) and lighter (`--c-400`): decorative/non-essential only — dot separators, inactive tab labels at 600 weight, mono micro-counts, the hero's ghosted second line at display size.
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
reserved for decorative, large, or redundant text (dot separators, ghosted
display lines, counts that repeat information available elsewhere).

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
- **Display** (600, clamp(48px, 6.6vw, 88px), lh 0.93, ls −0.052em): the home hero only. Its second line ghosts to `--c-400`.
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

A single centered container: `max-width: 1232px` (`--content-max`) with a
`28px` gutter (`--gutter`), applied via the `.zw-container` utility. The gutter
compresses responsively (20px ≤920px, 16px ≤600px) and the fixed frosted nav is
`68px` tall (`--nav-h`, 60px ≤920px); sticky elements offset against
`calc(var(--nav-h) + N)`.

The dominant breakpoint is **920px** — two-column page grids (`[data-biz-cols]`,
feature/hero grids) collapse to one column, `.zw-only-desktop` /
`.zw-only-mobile` swap, and detail pages trade the sticky right booking rail
for a fixed frosted bottom bar. Other observed breakpoints are local: 1380px
(share rail appears only when true margin exists), 1080/540px (footer grid
4→2→1), 1024px (post/legal TOC rails drop), 980/640px (masonry and carousel
column counts), 880px (split spotlight stacks).

Horizontal rhythm on the home page comes from contained rails, not the page:
`.zw-carousel-rail` scrolls 3-up cards (2-up ≤980px, 86%-wide ≤640px) with
snap-proximity and hidden scrollbars; the split-spotlight rail intentionally
bleeds off the right screen edge. Offer grids are explicit 3→2→1 so a third
card never orphans. Reading surfaces (Journal posts, legal) drop to a narrower
measured column (58ch–760px) with a 196px sticky TOC rail — "legal reading
wants a centred column, not the full shop window."

Section entrance is choreographed once per page: `.zw-rise` sections rise 18px
and fade over 0.7s, staggered by `data-d` (0.10/0.22/0.34s); grid children
stagger via `.zw-stagger` (0.06s steps, 8 children deep). Both are gated behind
`prefers-reduced-motion: no-preference`.

## Elevation & Depth

Layered but quiet. Surfaces rest on hairlines and *small* ambient shadows
(cards ship with `--sh-sm` or `--sh-md` at rest); the bigger shadows are
reserved as a **response** — hover-lift raises a card 3px and swaps in
`--sh-lg`, buttons lift 1px with their own hover shadow, the pricing receipt
floats to `--sh-xl`. Depth is also conveyed materially: frosted overlays
(`.zv-frost` — 82% white + 20px blur + saturate(180%) for the nav and mobile
booking bar; 92% white + 10px blur for pills floating on photos) and gradient
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
- **Overlay card** (BusinessOverlayCard): 4:5 full-bleed photo on ink, dual scrims (top 30% black fading out; bottom rising to 88% black), magazine-bold white name (clamp 20–25px/700/−0.03em with text-shadow), city · distance line at 82% white, and a confident rating block — 31px/700 number beside fractional 10px stars.
- **Content panels** (help cards, TOC disclosure, search fields): white, 8–12% hairline, `--r-lg`–`--r-xl`, sh-sm.

Skeleton states use `.zv-skel` (shimmering `--c-200`→`--c-300` gradient sweep,
1.4s); missing images fall back to `.zv-stripe` (45° ink-alpha stripes on mist)
with a mono uppercase label.

### Inputs / Fields
- **Style:** white, 12%-ink hairline, 14px radius, sh-sm; icon leading inside `6px 6px 6px 16px` padding (help search).
- **Focus:** container `:focus-within` — border warms to `--p-400`, glow `0 0 0 4px var(--p-100)`. Range sliders: 6px `--c-200` track, 26px ink circular thumb.
- **Switch:** 46×28px pill, `--c-300` off / ink on, white knob springs 18px (`--ease-spring`).

### Navigation
- **Top bar:** fixed, `--nav-h` (68px), frosted (`.zv-frost`) with a `.zv-hair` inset hairline. Text links (`.zw-navlink`) are 14px/600 at `--c-600`; hover and active simply darken to `--c-900` — color alone carries the state, no underline or pill. A segmented Airbnb-style search pill (What/Where/When, shade-fill segments on hover, circular terracotta "go") pops into the bar (`.zw-pill-pop`, spring) after scrolling past the home hero.
- **Tabs** (Journal `.zw-jtab`, detail pages): 14.5px/600 quiet text (inactive `--c-500`, hover `--c-800`, active `--c-900`) over a 1px hairline rail, with a 2px ink indicator that springs (`0.42s var(--ease-spring)`) between tabs; mono micro-counts sit beside labels and turn terracotta when active. Tab panels enter with `.zv-tab-in` (6px rise + fade, 0.32s).
- **Pagination:** 42px mono pill buttons; active = ink; hover = shade + stronger hairline.

### StatusPill
6px status dot + 600-weight label in the status color (`--s-success-600` open /
`--c-500` closed), followed by an optional `--c-600` "· closes {time}" suffix.
The whole pill is one 12.5px inline-flex span.

### Detail-Page Grammar (signature)
Location (`/business/[slug]`) and brand (`/brand/[slug]`) pages share one
grammar: a quiet back control (13.5px/600 `--c-600`, `back` icon, history-aware);
an identity band (Avatar with ring, `txt-balance` name, tagline); **fused meta
rows** — segments joined by `--c-400` "·" separators via a `joinDot()` helper
that interleaves only present segments (no dangling dots), with each separator
kept in the same `nowrap` span as the item it introduces so a wrap never strands
a dot at line-end; a gallery grid (2fr/1fr + stacked, collapsing to a single
hero ≤920px, `clamp(280px, 36vw, 440px)` tall, 24px radius); tabs (Services /
Team / Reviews / About); a sticky booking rail on desktop that becomes a fixed
frosted bottom bar on mobile; and centered modals using `.zw-modal-in/out`
scale-fade. Team-member profiles open as modals on the team tab
(`?tab=team&member=<id>` deep link).

### Toast
Ink pill rising from the bottom (`.zv-toast`, spring), with a terracotta circle
icon and optional action button; holds 2600ms (4200ms with an action), exits
with a soft drop.

### Motion Vocabulary (applies across components)
Three eases: `--ease-out` (.2,.7,.3,1) for movement, `--ease-soft` (.4,0,.2,1)
for color/border, `--ease-spring` (.34,1.56,.64,1) for delight (heart pop,
toast, tab indicator, sheet cards, calendar pop). Durations run 0.15–0.3s for
state, 0.3–0.7s for entrances. Everything honors `prefers-reduced-motion:
reduce` via a global clamp.

## Do's and Don'ts

### Do:
- **Do** put every user-facing string in both dictionaries (`src/i18n/dictionaries/en.ts` and `ro.ts`); the `Dictionary` type enforces key parity — English first, then mirror in Romanian.
- **Do** keep secondary text at `var(--c-600)` or darker on the canvas (the c-600 Floor Rule); reserve `--c-500`/`--c-400` for decorative or large text.
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
- **Don't** show visible scrollbars, orphan a dot separator at a line end, or let a card grid orphan a lone third card (use the explicit 3→2→1 grid).
- **Don't** exceed the one authored motion grammar — no parallax, no continuous ambient animation beyond the sanctioned pulses (live dots, radar rings), nothing that ignores `prefers-reduced-motion`.
