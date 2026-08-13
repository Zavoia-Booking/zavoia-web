"use client";

/*
  IMPECCABLE DIRECTION CONTRACT — /try (shaped directly from the brief)

  THESIS: The demo IS the page. A real Zavoia website fills the viewport and a
  single floating dock re-rolls it — so a business owner who scanned a flyer
  feels the range in one thumb-tap instead of reading about it. It refuses the
  "screenshot carousel" and the "feature list with a preview widget".

  OWN-WORLD: Zavoia's warm-paper system, but almost all of it recedes: the only
  Zavoia chrome on screen is one frosted ink dock. The site being shuffled owns
  the pixels; the dock owns one edge.

  STORY: This is a real website Zavoia builds → tap shuffle and watch it become
  a different one → freeze what you like, re-roll the rest → start a trial.

  FIRST VIEWPORT: A published microsite, full-bleed, opening on a chosen look
  (cinematic hero, terracotta, Playfair). A frosted dock floats over the bottom
  edge carrying the Zavoia mark, the current look's readout, three lock chips,
  the shuffle button and the trial CTA. A first-visit hint points at shuffle.

  FORM: full-bleed artifact + floating control dock; composition specified by
  the user's brief, so no structure roll was run.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, and DESIGN.md.
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/dictionaries";
import { useTranslation } from "@/i18n/useTranslation";
import { TRIAL_DAYS } from "@/lib/marketing/pricing";
import { Icon } from "@/components/ui/icon";
import { LivePreview } from "@/features/website/components/builder/preview/Microsite";
import { SECTION_META } from "@/features/website/components/builder/sectionCatalog";
import { createWebsiteT } from "@/features/website/i18n/translate";
import { specimenData } from "@/app/_components/web-studio/specimen-data";
import type { MicrositeLocale } from "@/features/website/i18n/translate";
import {
  COMBINATION_COUNT,
  NO_LOCKS,
  OPENING_LOOK,
  accentName,
  decodeLook,
  encodeLook,
  fontName,
  layoutFor,
  shuffleLook,
  type LockKey,
  type Locks,
  type Look,
} from "./shuffle-model";

const LOCK_KEYS: LockKey[] = ["layout", "colour", "type"];

export function ShuffleExperience({
  locale,
  initialCode,
  source,
}: {
  locale: Locale;
  /** Look encoded in the URL (?s=…) — lets a printed QR open on a set look. */
  initialCode: string | null;
  /** Scan source (?src=…) so flyer campaigns can be measured through signup. */
  source: string | null;
}) {
  const { dict } = useTranslation();
  const t = dict.tryStudio;

  const [look, setLook] = useState<Look>(
    () => (initialCode ? decodeLook(initialCode) : null) ?? OPENING_LOOK,
  );
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [shuffling, setShuffling] = useState(false);
  const [hinted, setHinted] = useState(true);
  const [shuffleCount, setShuffleCount] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // "3.2B" not "3,265,920,000": the dock has one line for it, and the exact
  // figure is the catalogue's job, not the demo's.
  const looks = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(COMBINATION_COUNT),
    [locale],
  );
  const websiteT = useMemo(() => createWebsiteT(locale as MicrositeLocale), [locale]);
  const heroStyle = useMemo(() => {
    const entry = SECTION_META.hero.variants.find(
      (v) => v.id === look.variants.hero,
    );
    return entry ? websiteT(entry.labelKey) : "";
  }, [look.variants.hero, websiteT]);

  const data = useMemo(
    () => specimenData(locale as MicrositeLocale, look.accent, look.fontKey),
    [locale, look.accent, look.fontKey],
  );
  const layout = useMemo(() => layoutFor(look), [look]);

  // The look lives in the URL so a visitor can share what they landed on, and
  // so a campaign QR can point at a specific one. replaceState keeps the back
  // button meaning "leave", not "undo one shuffle".
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", encodeLook(look));
    window.history.replaceState(null, "", url.toString());
  }, [look]);

  const onShuffle = useCallback(() => {
    setHinted(false);
    setShuffling(true);
    setLook((current) => shuffleLook(current, locks));
    setShuffleCount((n) => n + 1);
  }, [locks]);

  // The site dips and settles rather than hard-cutting, so the change reads as
  // one deliberate event. Purely visual — the new look is already rendered.
  useEffect(() => {
    if (!shuffling) return;
    const timer = window.setTimeout(() => setShuffling(false), 260);
    return () => window.clearTimeout(timer);
  }, [shuffling]);

  // "S" shuffles from the keyboard. Deliberately NOT the space bar: space
  // scrolls this page (it is a real, scrollable website) and space is also how
  // a keyboard user activates whichever button they have focused. The shortcut
  // also stands down whenever focus is on anything interactive.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "s") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.isContentEditable ||
          el.closest("a, button, input, textarea, select, [tabindex]"))
      ) {
        return;
      }
      event.preventDefault();
      onShuffle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onShuffle]);

  const toggleLock = (key: LockKey) =>
    setLocks((current) => ({ ...current, [key]: !current[key] }));

  const trialHref = `${localeHref(locale, "register")}${
    source ? `?src=${encodeURIComponent(source)}` : ""
  }`;

  return (
    <>
      {/* The site under test. It needs a scrollable ancestor: the renderer's
          nav frost, marquee glide and footer reveal all ride the nearest
          scroller, exactly as they do on a published site. */}
      <div ref={scrollerRef} data-try-stage="" className="zw-try-stage">
        <div
          data-try-shuffling={shuffling ? "1" : undefined}
          style={{ transformOrigin: "50% 0" }}
        >
          <LivePreview key={shuffleCount} layout={layout} data={data} chrome />
        </div>
      </div>

      <Dock
        t={t}
        look={look}
        heroStyle={heroStyle}
        looks={looks}
        locks={locks}
        hinted={hinted}
        shuffling={shuffling}
        onShuffle={onShuffle}
        onToggleLock={toggleLock}
        trialHref={trialHref}
      />
    </>
  );
}

type T = ReturnType<typeof useTranslation>["dict"]["tryStudio"];

function Dock({
  t,
  look,
  heroStyle,
  looks,
  locks,
  hinted,
  shuffling,
  onShuffle,
  onToggleLock,
  trialHref,
}: {
  t: T;
  look: Look;
  heroStyle: string;
  looks: string;
  locks: Locks;
  hinted: boolean;
  shuffling: boolean;
  onShuffle: () => void;
  onToggleLock: (key: LockKey) => void;
  trialHref: string;
}) {
  return (
    <div data-try-dock="" className="zw-try-dock">
      {/* First-visit orientation. A flyer scan arrives with zero context, so
          the very first thing on screen names the product and the gesture. */}
      {hinted && (
        <div className="zw-try-hint" role="status">
          <Icon name="chevD" size={14} color="var(--p-400)" />
          {t.hint}
        </div>
      )}

      <div className="zw-try-dock-inner">
        <div className="zw-try-readout">
          <span className="zw-try-mark">
            {t.mark}
            <span aria-hidden="true" className="zw-try-sep">·</span>
            {t.demo}
            <span className="zw-try-looks">
              <span aria-hidden="true" className="zw-try-sep">·</span>
              {format(t.looks, { n: looks })}
            </span>
          </span>
          <span className="zw-try-look" aria-live="polite">
            <span
              aria-hidden="true"
              className="zw-try-swatch"
              style={{ background: look.accent }}
            />
            {heroStyle}
            <span aria-hidden="true" className="zw-try-sep">·</span>
            {accentName(look.accent)}
            <span aria-hidden="true" className="zw-try-sep">·</span>
            {fontName(look.fontKey)}
          </span>
        </div>

        <div className="zw-try-lockgroup" role="group" aria-label={t.locksLabel}>
          <span className="zw-try-lockcap">{t.locksLabel}</span>
          <div className="zw-try-locks">
            {LOCK_KEYS.map((key) => {
              const on = locks[key];
              return (
                <button
                  key={key}
                  type="button"
                  className="tap zw-try-lock"
                  data-on={on ? "1" : undefined}
                  aria-pressed={on}
                  aria-label={on ? t.locked[key] : t.lock[key]}
                  onClick={() => onToggleLock(key)}
                >
                  {/* One glyph that changes state — an open padlock at rest,
                      closed when frozen. Three unrelated icons read as three
                      unrelated actions. */}
                  <Icon name="lock" size={13} />
                  <span className="zw-try-lock-label">{t.dimension[key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="zw-try-actions">
          <button
            type="button"
            className="tap zw-btn zw-try-shuffle"
            onClick={onShuffle}
            data-spin={shuffling ? "1" : undefined}
          >
            <Icon name="rebook" size={18} />
            {t.shuffle}
          </button>
          <Link href={trialHref} className="tap zw-btn zw-try-cta">
            {format(t.cta, { days: String(TRIAL_DAYS) })}
            <Icon name="arrowR" size={16} />
          </Link>
        </div>
      </div>

    </div>
  );
}
