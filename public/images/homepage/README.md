# Homepage showcase assets

These are the approved static captures used by the app and Web Studio homepage sections. All screen content remains English when the surrounding page language changes. Device frames, lighting and shadows are CSS; they are not part of the image files.

## App screenshots

`aligned-schedule-en.webp` and `native-map-en.webp` are direct **Android** screenshots from a local build of the actual Zavoia marketplace app, captured on 20 October 2026 at 1080 × 2424. The user approved this screen content inside iPhone presentation frames; these assets do not establish native iOS rendering equivalence. The lossless WebP masters were checked pixel for pixel against their source PNGs.

The Schedule capture contains one explicitly approved change in the isolated capture build: appointment status dots are placed immediately before the time in the centered time row, with a 6dp gap. The original app checkout was not modified. SystemUI rendered the fixed 9:41 clock and status indicators. There is no reconstructed or retouched app interface.

The map is the app's actual native Mapbox view, centered on illustrative Amsterdam coordinates (4.8897, 52.3705). The `-540` and `-810` map variants are proportional responsive exports, encoded at WebP quality 94. The homepage displays a static screenshot; it does not initialize a map or request map tiles. Map imagery sources: [Mapbox](https://www.mapbox.com/about/maps) and [OpenStreetMap](https://www.openstreetmap.org/copyright).

Appointments, business identities, prices and map locations use synthetic local fixture data. They are not live inventory, customer records or launch-market claims.

## Web Studio screenshots

These are captures of Zavoia's actual production `LivePreview` renderer with fictional business data, captured on 21 October 2026. The native renderer and its styles were unchanged; only proportional resizing and WebP encoding were applied.

| Asset | Content | Export dimensions |
| --- | --- | --- |
| `beauty-desktop.webp` | Lumi Beauty, native Gallery **Carousel**, second slide selected; Default navigation, Geist, Blush accent | 1440 × 960 |
| `beauty-desktop-1120.webp` | Same gallery | 1120 × 747 |
| `beauty-desktop-560.webp` | Same gallery | 560 × 373 |
| `pet-phone.webp` | Paw & Co, native **Cinematic** hero; Default navigation, Geist, Forest accent; full 390 × 760 website viewport at 2× | 780 × 1520 |
| `pet-phone-390.webp` | Same pet-care hero | 390 × 760 |

The phone capture excludes browser chrome, the OS status area and the home indicator. The homepage supplies its own static iPhone frame. Website controls pictured inside these images are screenshots, not interactive booking controls.

Lumi Beauty and Paw & Co are illustrative businesses. No real customers, ratings, testimonials, staff identities or availability are asserted. Stock photographs illustrate industries and do not imply that the people or venues endorse Zavoia.

Photo sources, verified when captured:

- Salon stations — [Max Vakhtbovych, Pexels](https://www.pexels.com/photo/photo-of-a-hair-salon-7750115/).
- Hair washing — [cottonbro studio, Pexels](https://www.pexels.com/photo/person-washing-woman-s-hair-3993449/).
- Manicure — [cottonbro studio, Pexels](https://www.pexels.com/photo/client-in-a-beauty-salon-3997379/).
- Salon interior, included in the gallery's four-photo source set — [Barney Goodman, Unsplash](https://unsplash.com/photos/a-modern-hair-salon-interior-with-stylish-chairs-and-mirrors-_Fy7Kq0w6OI).
- Dog being bathed — [Tima Miroshnichenko, Pexels](https://www.pexels.com/photo/close-up-photo-of-bathing-of-dog-6131165/).

Photos use the [Pexels License](https://www.pexels.com/license/) or [Unsplash License](https://unsplash.com/license), respectively. The production renderer applies its normal image crop and cover scrim; the underlying photographs were not retouched.

## Icons, font and texture

- `apple.svg` and `google-play.svg` are Ionicons brand icons. Their exact MIT notice is retained in `ionicons-LICENSE.txt`; brand names and marks remain their owners' property.
- The Caveat Latin and Latin Extended font files are in `src/app/fonts/`. The existing complete license in `src/app/fonts/CAVEAT-LICENSE.txt` covers both files (Copyright 2014 The Caveat Project Authors; SIL Open Font License 1.1). The Latin Extended subset supplies Romanian diacritics.
- `studio-grain.svg` is the static, code-authored SVG noise texture for the terracotta background. It contains no third-party imagery.
