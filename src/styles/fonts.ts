// Global font entry point — the SINGLE place fonts are declared.
//
// To change the global font, swap the next/font import + objects here;
// everything else reads var(--font-sans)/var(--font-mono) (see globals.css).
// Keep the `variable` names in sync with --font-geist-sans/--font-geist-mono
// referenced by --font-sans/--font-mono in globals.css.
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Apply to <html className={fontVariables}> so root font tokens resolve.
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;

// Handwritten accent for the one signature word in the business pages'
// headlines. Latin-ext carries Romanian diacritics. It is not in
// fontVariables: a surface applies `caveat.variable` itself, and with preload
// off no other route fetches the files.
export const caveat = localFont({
  src: [
    { path: "../app/fonts/caveat-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../app/fonts/caveat-latin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});
