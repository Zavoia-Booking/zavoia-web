"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Kicker } from "@/components/ui/kicker";
import { Button } from "@/components/ui/button";

// Journal subscription card. Ported from ZwNewsletter
// (docs/web-marketing.jsx:343-385). Presentational only — no network call.
// On submit the form is swapped for the success line. Reused by the post page
// in slice 3, hence kept self-contained (reads its own strings via i18n).
export function Newsletter() {
  const { dict } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section
      className="zw-container"
      style={{ marginTop: "clamp(56px, 7vw, 88px)" }}
    >
      <div
        style={{
          background: "var(--c-mist)",
          borderRadius: "var(--r-2xl)",
          padding: "clamp(30px, 4vw, 52px)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "clamp(24px, 3vw, 48px)",
          alignItems: "center",
        }}
        data-feature-grid=""
      >
        <div>
          <Kicker style={{ marginBottom: 10 }}>
            {dict.blog.newsletterKicker}
          </Kicker>
          <h2
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(22px, 2.4vw, 30px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--c-900)",
            }}
          >
            {dict.blog.newsletterHeading}
          </h2>
        </div>
        {submitted ? (
          <p
            style={{
              margin: 0,
              fontSize: 15.5,
              fontWeight: 600,
              color: "var(--c-900)",
              letterSpacing: "-0.01em",
            }}
          >
            {dict.blog.newsletterSuccess}
          </p>
        ) : (
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={email}
                required
                placeholder={dict.blog.newsletterPlaceholder}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={dict.blog.newsletterPlaceholder}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid rgba(28,28,26,0.14)",
                  borderRadius: 999,
                  padding: "13px 20px",
                  fontSize: 14.5,
                  background: "#fff",
                  color: "var(--c-900)",
                  outline: "none",
                  letterSpacing: "-0.01em",
                }}
              />
              <Button kind="primary" type="submit">
                {dict.blog.newsletterButton}
              </Button>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--c-500)",
              }}
            >
              {dict.blog.newsletterFine}
            </span>
          </form>
        )}
      </div>
    </section>
  );
}
