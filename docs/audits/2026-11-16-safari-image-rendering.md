# Safari image rendering audit — 16 November 2026

## Confirmed cause

The homepage Web Studio device illustration embedded two positioned HTML device
frames inside SVG `foreignObject` elements. Their fixed design-pixel dimensions
depended on the SVG viewBox scaling the complete composition.

WebKit paints these layered HTML descendants at the wrong scale. This reproduces
the oversized, cropped production artwork from the reported iPhone 14 screenshot,
even though `getBoundingClientRect()` reports the intended small device bounds.
The screen assets, responsive requests and intrinsic dimensions were correct.

The production page reproduces the failure in WebKit 26.5. The local replacement
renders correctly in the same engine. Chrome device emulation uses Chromium,
so it cannot detect this WebKit painting difference.

Primary reference: [WebKit bug 23113](https://bugs.webkit.org/show_bug.cgi?id=23113),
including the September 2026 reduction describing positioned HTML ignoring
viewBox scaling while retaining correct DOM measurements.

## Changes

| Area | Before | After |
| --- | --- | --- |
| Homepage Web Studio artwork | Large HTML frames inside a scaled SVG; incorrect WebKit paint | Ordinary HTML on a proportional CSS canvas; frame, screen and hardware details scale together |
| Responsive image delivery | Localized responsive captures with lazy loading | Same responsive sources, loading behavior and descriptions retained |
| Homepage app and business phone mockup components | Matching intrinsic-ratio captures relied on `height: 100%` inside ratio-only frames | Capture height follows its intrinsic ratio with `height: auto` |
| Shared eligible fill images | Optimizer failure removed fill positioning; final placeholder also lost that geometry | Original-source retry and final placeholder preserve the same fill styles |
| Web Studio Fan gallery | A transformed screen-height measurement was reused as logical layout pixels, shrinking preview cards | Both layout dimensions use untransformed client measurements |

The proportional canvas uses container query width units, supported from
[Safari 16](https://webkit.org/blog/13152/webkit-features-in-safari-16-0/).
The image-height changes harden related sizing paths; they are not evidence that
those sections reproduced the confirmed foreignObject painting bug.

Changed implementation:

- `src/app/_components/home/editorial-bands.tsx`
- `src/app/_components/home/editorial-bands.module.css`
- `src/app/_components/for-business/discovery-artwork.module.css`
- `src/app/_components/for-business/calendar-artwork.module.css`
- `src/app/_components/for-business/journey-section.module.css`
- `src/app/_components/for-business/studio-section.module.css`
- `src/components/ui/image.tsx`
- `src/features/website/components/builder/preview/sections/gallery/variants/Fan.tsx`

## Wider audit

- No `foreignObject` instances remain under `src` or `public`. The two homepage
  frames were the only occurrences of this confirmed pattern.
- Shared cards, location galleries, avatars and the image viewer use explicit
  parent frames or bounded contain/cover sizing; they do not use the faulty SVG
  structure. The shared image retry geometry issue above was corrected without
  changing natural-flow images, unsupported sources or caller-provided srcsets.
- Web Studio specimen plates and the homepage website preview use ordinary HTML,
  measured logical canvas widths and explicit clipping. Their measurements do
  not depend on the rotated painted rectangle. Their existing scaling is retained.
- The Fan gallery had a separate coordinate mismatch inside scaled previews.
  In the music example, both the preview and a real 430px demo had a 521px logical
  stage height, but the preview used its transformed 355px height and produced
  157px cards instead of approximately 231px. Measuring `stage.clientHeight`
  keeps its card calculation in the same coordinate system as `root.clientWidth`.
  Carousel, Deck and Bento visual-coordinate measurements were also reviewed;
  their explicit scale conversions are intentional and retained.
- Web Studio setup captures provide intrinsic dimensions and responsive sources.
  Public website images use the website renderer's responsive image helper and
  explicit section bounds, independently of the marketplace image wrapper.
- WebKit runtime checks cover `/web-studio` at 390, 768 and 1440 pixels, all nine
  gallery previews after hydration, the default and curated demo, and the actual
  homepage link to the published `/cs-nova` website. These showed loaded images,
  bounded layouts, no persistent broken previews, no horizontal overflow and no
  page errors. Checks made no backend writes.

## Verification

- Visually reproduced production failure in WebKit at 390 × 844, DPR 3.
- Visually inspected the corrected local composition in WebKit at 390 × 844,
  393 × 852 and 1440 × 1000; zero foreignObjects and no horizontal overflow.
- All six business-page phone captures load, preserve their intrinsic ratios and
  match their screen bounds in WebKit at 390, 768 and 1440 pixels (18 cases).
  Discovery, journey and Studio phone captures were also visually inspected.
- Browser-only request interception confirms that an optimizer 500 followed by
  a successful original image retains the shared fill frame. An optimizer 500
  followed by an original 404 gives an equally sized placeholder. Both remain
  absolutely positioned at 206.5 × 219px in the sampled mobile location gallery,
  with no page errors. Fresh browser contexts ensure image caching cannot bypass
  the intended failure responses.
- Chromium before/after measurements preserve device placement to within 0.02px
  at 393 and 1440 pixels. Responsive sources remain intact.
- Fan gallery WebKit checks: the scaled 430px logical preview and the matching
  unscaled demo both render 230.71875px cards after the correction. The desktop
  preview at 1240px retains its expected 291.4px cards; a fresh 1440px visible
  gallery renders the expected 330px cards.
- Marketing manifest check: all 18 captures pass file, format, locale, dimensions
  and stable-ratio checks.
- Existing marketing locale checks pass all 20 homepage/business-page cases at
  320, 390, 768, 1024 and 1440 pixels in EN/RO, plus both language-switch and
  back/forward runs at DPR 2. The Romanian phone composition was visually checked.
- Scoped ESLint, TypeScript and whitespace checks pass.

Screenshots and browser diagnostics are temporary artifacts under `/tmp`, not
new repository test files. Production-before examples:
`/tmp/zavoia-prod-webkit-home-studio-390.png`; local-after examples:
`/tmp/zavoia-local-webkit-home-studio-{390,393,1440}-after.png`.

These checks use Chromium and Linux WebKit, not a physical iPhone. Production is
unchanged until deployment. Authenticated account editing and publishing were
not exercised; the public demo, preview renderer and published-site flow were.
