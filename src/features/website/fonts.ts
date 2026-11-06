/** Self-hosted display faces for published websites, demos and marketing previews.
 * Original files and OFL notices: public/fonts/web-studio/manifest.json.
 * Separate calls preserve each upstream unicode range. Preloading is disabled:
 * declaring the catalogue does not download every font on a customer's site.
 */
import localFont from "next/font/local";
import { geistSans, geistMono } from "@/styles/fonts";

const classicExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/libre-caslon-display/libre-caslon-display-latin-ext-400-normal.7a17a86fb7c3.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const classicLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/libre-caslon-display/libre-caslon-display-latin-400-normal.84267e937417.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const elegantExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/bodoni-moda/bodoni-moda-latin-ext-opsz-normal.f156e4a7cef0.woff2", weight: "400 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/bodoni-moda/bodoni-moda-latin-ext-opsz-italic.4800c2afa7e5.woff2", weight: "400 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const elegantLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/bodoni-moda/bodoni-moda-latin-opsz-normal.c032219ef636.woff2", weight: "400 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/bodoni-moda/bodoni-moda-latin-opsz-italic.b737328c13b9.woff2", weight: "400 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const friendlyExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/bricolage-grotesque/bricolage-grotesque-latin-ext-opsz-normal.776f6dcaf036.woff2", weight: "200 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const friendlyLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/bricolage-grotesque/bricolage-grotesque-latin-opsz-normal.a79fdb52d4a5.woff2", weight: "200 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const playfairExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/playfair-display/playfair-display-latin-ext-wght-normal.42898ad49a6b.woff2", weight: "400 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/playfair-display/playfair-display-latin-ext-wght-italic.b9dff4aec6d8.woff2", weight: "400 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const playfairLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/playfair-display/playfair-display-latin-wght-normal.e0c764a8e9e1.woff2", weight: "400 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/playfair-display/playfair-display-latin-wght-italic.54af24bd0f91.woff2", weight: "400 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const cormorantExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/cormorant-garamond/cormorant-garamond-latin-ext-wght-normal.cfa9a397d86f.woff2", weight: "300 700", style: "normal" },
    { path: "../../../public/fonts/web-studio/cormorant-garamond/cormorant-garamond-latin-ext-wght-italic.cd5bf126b2c8.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const cormorantLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/cormorant-garamond/cormorant-garamond-latin-wght-normal.d80df8ff5aec.woff2", weight: "300 700", style: "normal" },
    { path: "../../../public/fonts/web-studio/cormorant-garamond/cormorant-garamond-latin-wght-italic.6f2f5c3b1abc.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const italianaLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/italiana/italiana-latin-400-normal.5079c87a4e86.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const marcellusExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/marcellus/marcellus-latin-ext-400-normal.1d5a9870851a.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const marcellusLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/marcellus/marcellus-latin-400-normal.8a539799d12e.woff2", weight: "400", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const dmserifExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/dm-serif-display/dm-serif-display-latin-ext-400-normal.3af47815d618.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/web-studio/dm-serif-display/dm-serif-display-latin-ext-400-italic.e026521e59b7.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const dmserifLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/dm-serif-display/dm-serif-display-latin-400-normal.fdf61e20fd2c.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/web-studio/dm-serif-display/dm-serif-display-latin-400-italic.ed8b291611e3.woff2", weight: "400", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const crimsonExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/crimson-pro/crimson-pro-latin-ext-wght-normal.ac89a08a6e02.woff2", weight: "200 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/crimson-pro/crimson-pro-latin-ext-wght-italic.01df7b443a6f.woff2", weight: "200 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const crimsonLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/crimson-pro/crimson-pro-latin-wght-normal.20ce4189b9e4.woff2", weight: "200 900", style: "normal" },
    { path: "../../../public/fonts/web-studio/crimson-pro/crimson-pro-latin-wght-italic.b3faa8f9ce36.woff2", weight: "200 900", style: "italic" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const groteskExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/space-grotesk/space-grotesk-latin-ext-wght-normal.952dddb45d2f.woff2", weight: "300 700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const groteskLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/space-grotesk/space-grotesk-latin-wght-normal.0640890476fc.woff2", weight: "300 700", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const soraExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/sora/sora-latin-ext-wght-normal.c163c536f68b.woff2", weight: "100 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const soraLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/sora/sora-latin-wght-normal.fa26406eeda9.woff2", weight: "100 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const manropeExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/manrope/manrope-latin-ext-wght-normal.3911b66d9f2e.woff2", weight: "200 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const manropeLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/manrope/manrope-latin-wght-normal.a30ddcd34970.woff2", weight: "200 800", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

const unboundedExtended = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/unbounded/unbounded-latin-ext-wght-normal.845e1c9fe2e9.woff2", weight: "200 900", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" }],
});

const unboundedLatin = localFont({
  src: [
    { path: "../../../public/fonts/web-studio/unbounded/unbounded-latin-wght-normal.22f9b928aa39.woff2", weight: "200 900", style: "normal" },
  ],
  display: "swap",
  preload: false,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" }],
});

/** Put every subset's real face before Next's metric-adjusted system fallbacks.
 * Otherwise a Latin-only fallback can swallow Romanian glyphs before Latin-ext.
 */
function familyStack(...fonts: { style: { fontFamily: string } }[]): string {
  const stacks = fonts.map(font => font.style.fontFamily.split(",").map(part => part.trim()));
  return [...new Set([...stacks.map(([face]) => face), ...stacks.flatMap(([, ...fallbacks]) => fallbacks)])].join(", ");
}

export const websiteSans = geistSans.style.fontFamily;
export const websiteMono = geistMono.style.fontFamily;

const displayFamilies: Record<string, string> = {
  modern: websiteSans,
  classic: familyStack(classicExtended, classicLatin),
  elegant: familyStack(elegantExtended, elegantLatin),
  friendly: familyStack(friendlyExtended, friendlyLatin),
  playfair: familyStack(playfairExtended, playfairLatin),
  cormorant: familyStack(cormorantExtended, cormorantLatin),
  // Italiana lacks some Romanian letters; use Bodoni Moda for those glyphs.
  italiana: familyStack(italianaLatin, elegantExtended, elegantLatin),
  // Marcellus lacks some Romanian letters; use Libre Caslon Display for those glyphs.
  marcellus: familyStack(marcellusExtended, marcellusLatin, classicExtended, classicLatin),
  dmserif: familyStack(dmserifExtended, dmserifLatin),
  crimson: familyStack(crimsonExtended, crimsonLatin),
  grotesk: familyStack(groteskExtended, groteskLatin),
  sora: familyStack(soraExtended, soraLatin),
  manrope: familyStack(manropeExtended, manropeLatin),
  unbounded: familyStack(unboundedExtended, unboundedLatin),
};

export function websiteFontFamily(key: string): string {
  return displayFamilies[key] ?? websiteSans;
}
