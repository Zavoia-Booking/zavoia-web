// Global font entry point — the SINGLE place fonts are declared.
//
// To change the global font, swap the next/font import + objects here;
// everything else reads var(--font-sans)/var(--font-mono) (see globals.css).
// Keep the `variable` names in sync with --font-geist-sans/--font-geist-mono
// referenced by --font-sans/--font-mono in globals.css.
import { Geist, Geist_Mono } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Convenience: apply to <body className={`${fontVariables} antialiased`}>.
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
