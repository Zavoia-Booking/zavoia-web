import type { Metadata } from "next";

const SITE_URL = "https://www.zavoia.com/";
const TITLE = "Zavoia — Coming Soon";
const DESCRIPTION =
  "Zavoia brings nearby services together, so the right choice feels closer.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Zavoia",
    type: "website",
    images: ["/brand/wordmark-cropped.png"],
  },
};

export default function ComingSoonPage() {
  return (
    <>
      <main className="stage">
        <header className="top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zavoia_logo.png"
            alt="Zavoia"
            width="300"
            height="100"
            fetchPriority="high"
          />
        </header>

        <div className="hero">
          <h1 className="typeblock" aria-label="Coming soon">
            <span className="coming-clip" aria-hidden="true">
              <span className="coming-parallax">
                <span className="coming">coming</span>
              </span>
            </span>
            <span className="soon-wrap" aria-hidden="true">
              <span className="soon-rot">
                <span className="soon-reveal">
                  <span className="soon-ink">soon</span>
                </span>
              </span>
            </span>
          </h1>

          <aside className="note" aria-label="About Zavoia">
            <p className="note-title">
              Good help shouldn&rsquo;t be hard to find.
            </p>
            <p className="note-copy">
              Zavoia brings nearby services together, so the right choice feels
              closer.
            </p>
          </aside>
        </div>

        <footer className="foot">
          <div
            className="loading-rail"
            role="progressbar"
            aria-label="Launch preparation"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={80}
            aria-valuetext="80 percent loaded"
          >
            <span className="loading-fill" aria-hidden="true" />
            <span className="loading-label" aria-hidden="true">
              <span className="loading-value">80</span>% loading
            </span>
            <span className="stay">Stay tuned</span>
          </div>
          <p className="meta">&copy; 2026 Zavoia. All rights reserved.</p>
        </footer>
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
