# Self-hosted font assets

`public/fonts/web-studio/` contains unchanged WOFF2 binaries for the 13 Web Studio display families previously requested from Google Fonts at runtime. Its `manifest.json` records exact Fontsource package versions, tarball URLs and integrity, file SHA-256 checksums, upstream versions, original licence notices, and the preserved CSS Unicode ranges.

Geist and Geist Mono are declared in `src/styles/fonts.ts` through `next/font/google`: Next.js fetches them at build time and serves the generated font files from the app origin. Their exact generated version and filenames depend on the build; this manifest does not present installed Fontsource files as their runtime assets. Their original family licence notices are included under `bundledFamilies`. Caveat is an existing local marketing accent whose repository file checksums are recorded there. These three families’ binaries are not duplicated there. The `index.html` licence index is publicly accessible at `/fonts/web-studio/index.html`.

## Loading and coverage

- Load only the selected family; do not import every `family.css` globally.
- Each `family.css` retains upstream Latin and Latin-ext Unicode ranges and `font-display: swap`.
- Web Studio's Next.js renderer uses the same binaries through `next/font/local`. The dashboard preview uses these CSS files directly.
- Bodoni Moda preserves its weight and optical-size axes (6–96). Bricolage Grotesque preserves weight and optical size (12–96). Other variable families retain their available weight range. Static-only families remain static.
- Italiana is missing `ĂăȘșȚț`; its CSS also loads Bodoni Moda. The font stack must place Bodoni Moda immediately after Italiana.
- Marcellus is missing `ȘșȚț`; its CSS also loads Libre Caslon Display. The stack must place Libre Caslon Display immediately after Marcellus.
- These per-character fallbacks preserve the original font files without synthesizing or modifying glyphs. All other display families cover the Romanian letters `ĂăÂâÎîȘșȚț` in the union of Latin and Latin-ext assets.
- A file name change adds a content hash for caching; no font name table or binary data is edited.

## Updating a family

1. Review its upstream licence and copyright notices before replacing files. Preserve any Reserved Font Name statements.
2. Download the explicitly chosen version of the Fontsource package recorded in the manifest. Verify the npm integrity value. Keep package archives and temporary extraction files outside this repository.
3. Select upstream Latin and Latin-ext WOFF2 files and CSS matching the current styles and axes. Use variable files where available. Do not subset, merge, rename internal font names or otherwise modify the binaries.
4. Copy the original package licence to that family's `OFL.txt`. Give each binary a filename ending in the first 12 hexadecimal characters of its SHA-256 checksum.
5. Preserve the upstream Unicode ranges in `family.css`. Use the original family name expected by the app's font stack; keep `font-display: swap`. Preserve the explicit Italiana and Marcellus fallback imports.
6. Update `manifest.json`, including package version, upstream version, tarball integrity, source, checksums, size, styles, weights, actual axes and coverage. Update the licence index if a family changes.
7. Update the matching `next/font/local` source paths in the web app and copy the 13 display-family assets and notices to the dashboard's `public/fonts/web-studio` directory so both render the same display binaries. Preserve each app's own `bundledFamilies` provenance: web uses `next/font/google` for Geist/Geist Mono, while the dashboard bundles its installed Fontsource assets.
8. Verify hashes, font metadata, Romanian glyph coverage, normal/italic rendering and optical sizing. Check a cold page load and font changes in both apps with Google Fonts requests blocked. Confirm only the chosen family and required fallbacks load. Run the app's targeted checks/build.
9. Remove superseded binaries only after no loader, stylesheet or live deployment still references them.

All fonts are included under their original licences. They are not sold as standalone font products. Do not remove the accompanying notices when copying these assets between applications.
