import type { Metadata } from "next";
import Link from "next/link";

// Next.js already emits <meta name="robots" content="noindex"> for the
// not-found route, so we only add the title/description here.
export const metadata: Metadata = {
  title: "Page not found — Zavoia",
  description: "This page isn't available yet — Zavoia is coming soon.",
};

export default function NotFound() {
  return (
    <>
      <main className="stage error-stage">
        <header className="top error-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zavoia_logo.png"
            alt="Zavoia"
            width="300"
            height="100"
            fetchPriority="high"
          />
        </header>

        <div className="error-layout">
          <h1 className="error-art" aria-label="404: Page not found">
            <span className="error-code-clip" aria-hidden="true">
              <span className="error-code-drift">
                <span className="error-code">404</span>
              </span>
            </span>
            <span className="error-script-wrap" aria-hidden="true">
              <span className="error-script-rotate">
                <span className="error-script-reveal">
                  <span className="error-script">lost</span>
                </span>
              </span>
            </span>
          </h1>

          <div className="error-copy">
            <p className="error-copy-title">Page not found.</p>
            <p className="error-copy-body">
              The page you&rsquo;re looking for doesn&rsquo;t exist or may have
              moved.
            </p>
            <Link
              className="error-return"
              href="/"
              aria-label="Back to the Zavoia home page"
            >
              <span>Back to homepage</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </div>

        <footer className="error-footer">
          <span>&copy; 2026 Zavoia. All rights reserved.</span>
        </footer>
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
