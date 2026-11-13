import { preload } from "react-dom";

// The files behind --font-caveat. Keep in sync with the @font-face rules in
// src/styles/globals.css.
const SIGNATURE_FONT_FILES = ["/fonts/caveat/caveat-latin-700.woff2", "/fonts/caveat/caveat-latin-ext-700.woff2"];

/**
 * Preloads the handwritten headline font for the page being rendered. The
 * business pages call it because the word is on their first screen: until
 * Caveat arrives, the wider stand-in font can push the word onto another line,
 * and the headline jumps back when Caveat swaps in. Both files load either
 * way (the faces have no unicode-range), so the preload adds no bytes.
 */
export function preloadSignatureFont() {
  for (const href of SIGNATURE_FONT_FILES) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
}
