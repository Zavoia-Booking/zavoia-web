import localFont from "next/font/local";

// Exact asset from coming_soon. Not-found boundaries can be included in
// otherwise healthy routes; disable eager preloading so the accent font is
// fetched when its styled text is actually rendered.
export const caveat = localFont({
  src: "../../fonts/caveat-latin-700.woff2",
  variable: "--font-caveat",
  weight: "700",
  display: "swap",
  preload: false,
});
