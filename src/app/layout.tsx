import type { Viewport } from "next";
import localFont from "next/font/local";
import "./coming-soon.css";

const geistSans = localFont({
  src: "./fonts/geist-latin-variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin-variable.woff2",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
  // Only styles small below-the-fold footer labels — don't let its preload
  // compete with the LCP wordmark/hero fonts.
  preload: false,
});

const caveat = localFont({
  src: "./fonts/caveat-latin-700.woff2",
  variable: "--font-script",
  weight: "700",
  // Keep "swap" so the script word ALWAYS renders in Caveat once the font
  // loads (it's preloaded, so the swap is fast). "optional" was tried but on
  // a cold first load it permanently locks to the fallback for that page view.
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#fafaf7" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
