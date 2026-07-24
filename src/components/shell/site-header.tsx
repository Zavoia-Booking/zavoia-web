"use client";

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth/useAuth";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import {
  useSearchOverlay,
  type OpenSearchOpts,
} from "@/components/search/search-overlay-provider";
import type {
  InitialQuery,
  SearchStep,
} from "@/components/search/search-overlay";
import { getIndustries } from "@/lib/api/marketplace/public";
import type { Industry } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { routeKey } from "./active-route";
import { AccountMenu } from "./account-menu";
import { NotifPanel } from "./notif-panel";

// Port of ZwTopNav + ZwNavSearchPill (docs/web-shell.jsx) on Next routing.
// Each pill segment opens the command-search overlay at the matching step.

const EXPLORE_KEYS = ["search", "businesses", "business", "l"];

function SearchPill({
  onOpen,
  active,
}: {
  onOpen: (step: SearchStep) => void;
  /** Live values from the current search query; placeholders when absent. */
  active?: { what?: string; where?: string; when?: string };
}) {
  const { dict } = useTranslation();
  const t = dict.searchPill;

  const seg = (label: string, value: string, grow: boolean, step: SearchStep) => (
    <button
      type="button"
      className="zw-pill-seg tap"
      onClick={() => onOpen(step)}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 1,
        background: "transparent",
        border: 0,
        cursor: "pointer",
        textAlign: "left",
        padding: "6px 16px",
        minWidth: 0,
        flex: grow ? "1 1 auto" : "0 1 auto",
        borderRadius: 999,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: "var(--c-500)",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
          color: "var(--c-600)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </span>
    </button>
  );

  const divider = (
    <span
      aria-hidden="true"
      style={{
        width: 1,
        height: 26,
        background: "rgba(28,28,26,0.10)",
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      className="zw-nav-pill"
      role="search"
      style={{
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        maxWidth: "min(100%, 460px)",
        height: 48,
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.10)",
        borderRadius: 999,
        paddingRight: 5,
        paddingLeft: 4,
        boxShadow:
          "0 1px 2px rgba(28,28,26,0.05), 0 4px 12px rgba(28,28,26,0.04)",
      }}
    >
      {seg(t.what, active?.what || t.anything, true, "what")}
      {divider}
      {seg(t.where, active?.where || t.defaultWhere, true, "where")}
      {divider}
      {seg(t.when, active?.when || t.anyTime, false, "when")}
      <button
        type="button"
        className="tap zw-pill-go"
        aria-label={t.searchAria}
        onClick={() => onOpen("what")}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--p-500)",
          border: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 6,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <Icon name="search" size={15} color="#fff" />
      </button>
    </div>
  );
}

/** "hair-salon" → "Hair salon" — readable fallback when only an industry slug is in the URL. */
function unslug(slug: string): string {
  const words = slug.replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Industries fetched once per session, only to resolve a `tagIds` URL param
// into the tag's display name for the pill. On failure the cache resets so a
// later mount can retry; callers fall back to the unslugged industry.
let industriesPromise: Promise<Industry[]> | null = null;
function loadIndustries(): Promise<Industry[]> {
  industriesPromise ??= getIndustries().catch(() => {
    industriesPromise = null;
    return [];
  });
  return industriesPromise;
}

/** Local (not UTC) YYYY-MM-DD, so "today"/"tomorrow" match the user's clock. */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * SearchPill fed with the live URL query on the search route. `useSearchParams`
 * confines the prerender bailout to this component — SiteHeader mounts it under
 * a Suspense boundary whose fallback is the placeholder pill, so the rest of
 * the header still prerenders statically.
 */
function LiveSearchPill({
  onOpen,
  onSearchRoute,
}: {
  onOpen: (step: SearchStep) => void;
  onSearchRoute: boolean;
}) {
  const sp = useSearchParams();
  const { dict, locale } = useTranslation();
  const to = dict.searchOverlay;

  // A tag search puts only ids in the URL (`tagIds`), so the first id is
  // resolved to its display name here; until then (or on failure) the pill
  // falls back to the industry label below.
  const firstTagId = onSearchRoute
    ? ((raw) => {
        const n = Number(raw?.split(",")[0]?.trim());
        return Number.isFinite(n) ? n : null;
      })(sp.get("tagIds") ?? undefined)
    : null;
  const [resolvedTag, setResolvedTag] = useState<{
    id: number;
    name: string;
  } | null>(null);
  useEffect(() => {
    if (firstTagId == null) return;
    let alive = true;
    loadIndustries().then((list) => {
      if (!alive) return;
      const tag = list
        .flatMap((i) => i.tags)
        .find((tg) => tg.id === firstTagId);
      setResolvedTag(
        tag ? { id: firstTagId, name: taxonomyLabel(tag, locale) } : null,
      );
    });
    return () => {
      alive = false;
    };
  }, [firstTagId, locale]);
  // The id check keeps a stale resolution (previous tag, or tag removed from
  // the URL) from being shown while the effect catches up.
  const tagName =
    firstTagId != null && resolvedTag?.id === firstTagId
      ? resolvedTag.name
      : undefined;

  let active: { what?: string; where?: string; when?: string } | undefined;
  if (onSearchRoute) {
    const search = sp.get("search")?.trim();
    const industry = sp.get("industry")?.trim();
    const city = sp.get("city")?.trim();
    const hasGeo = !!sp.get("lat") && !!sp.get("lng");
    const date = sp.get("date")?.trim();

    let when: string | undefined;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      if (date === localIso(now)) when = to.dateToday;
      else if (date === localIso(tomorrow)) when = to.dateTomorrow;
      else {
        const [y, m, d] = date.split("-").map(Number);
        when = new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
        }).format(new Date(y, m - 1, d));
      }
    }

    active = {
      what: search || tagName || (industry ? unslug(industry) : undefined),
      where: city || (hasGeo ? to.currentLocationFallback : undefined),
      when,
    };
  }

  return <SearchPill onOpen={onOpen} active={active} />;
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const { status, user, initializing, optimisticUser } = useAuth();
  const { dict } = useTranslation();
  const { openSearch } = useSearchOverlay();

  const key = routeKey(pathname);
  const onHome = key === "";
  const isAuthed = status === "authenticated" && !!user;
  // While the initial session check is in flight, a session hint
  // (optimisticUser) renders the authenticated corner with the cached
  // initials so a refresh doesn't flash the logged-out icon for ~1s; with no
  // hint yet (pre-hydration frame) a neutral circle is shown instead.
  const showAuthedCorner = isAuthed || (initializing && optimisticUser !== null);
  const showNeutralCorner = !showAuthedCorner && initializing;

  const [notifOpen, setNotifOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  // On the homepage the pill stays hidden until the hero search scrolls away,
  // then pops into the nav. On other routes it's always shown. The scroll
  // listener (and the rAF-deferred initial read) keep setState out of the
  // synchronous effect body.
  useEffect(() => {
    if (!onHome) return;
    const fn = () => setPastHero(window.scrollY > 440);
    const raf = requestAnimationFrame(fn);
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", fn);
    };
  }, [onHome]);

  // When not on home the pill is always visible regardless of pastHero, so we
  // never need to reset it on route change.
  const showPill = !onHome || pastHero;
  const exploreActive = EXPLORE_KEYS.includes(key);
  const forBusinessActive = key === "for-business" || key === "pricing";

  // On the search route, best-effort prefill the overlay from the current URL
  // params so editing preserves the active query; elsewhere open empty. Params
  // are read lazily from window.location at click time (not via
  // useSearchParams) so this handler doesn't force the whole header into the
  // pill's Suspense bailout (see LiveSearchPill).
  const open = (step: SearchStep, extra?: InitialQuery) => {
    let initial: InitialQuery | undefined;
    if (key === "search" && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tagsRaw = sp.get("tagIds");
      const lat = sp.get("lat");
      const lng = sp.get("lng");
      const date = sp.get("date");
      initial = {
        what: sp.get("search") ?? "",
        industry: sp.get("industry") ?? "",
        tagIds: tagsRaw
          ? tagsRaw
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => Number.isFinite(n))
          : [],
        city: sp.get("city") ?? "",
        when: date ? `date:${date}` : "",
        lat: lat != null && lat !== "" ? Number(lat) : undefined,
        lng: lng != null && lng !== "" ? Number(lng) : undefined,
      };
    }
    const opts: OpenSearchOpts = {
      step,
      initial: { ...initial, ...extra },
    };
    openSearch(opts);
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : optimisticUser
      ? `${optimisticUser.firstName} ${optimisticUser.lastName}`.trim()
      : "";

  const iconBtn: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: 0,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <header
      className="zv-frost"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 90,
        borderBottom: "1px solid rgba(28,28,26,0.06)",
      }}
    >
      <div
        className="zw-container"
        style={{
          height: "var(--nav-h)",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Link
          href={localeHref(locale)}
          aria-label={dict.nav.homeAria}
          style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/wordmark-cropped.png"
            alt="Zavoia"
            style={{ height: 28, width: "auto" }}
          />
        </Link>

        <nav
          className="zw-only-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            flexShrink: 0,
            marginLeft: 14,
          }}
        >
          <Link
            href={localeHref(locale, "search")}
            className={"zw-navlink" + (exploreActive ? " zw-navlink--on" : "")}
          >
            {dict.nav.explore}
          </Link>
        </nav>

        <div
          className="zw-only-desktop"
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {showPill && (
            <div
              className={onHome ? "zw-pill-pop" : ""}
              style={{
                minWidth: 0,
                maxWidth: "100%",
                display: "flex",
              }}
            >
              <Suspense fallback={<SearchPill onOpen={(step) => open(step)} />}>
                <LiveSearchPill
                  onOpen={(step) => open(step)}
                  onSearchRoute={key === "search"}
                />
              </Suspense>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} className="zw-only-mobile" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Link
            href={localeHref(locale, "for-business")}
            className={
              "zw-only-desktop zw-navlink" +
              (forBusinessActive ? " zw-navlink--on" : "")
            }
            style={{ marginRight: 12 }}
          >
            {dict.nav.forBusiness}
          </Link>

          <button
            type="button"
            className="tap zw-only-mobile"
            onClick={() => open("what")}
            aria-label={dict.nav.search}
            style={{ ...iconBtn, background: "transparent" }}
          >
            <Icon name="search" size={18} color="var(--c-800)" />
          </button>

          {showAuthedCorner ? (
            <>
              <button
                type="button"
                className="tap zw-hover-row zw-only-desktop"
                aria-label={dict.nav.notifications}
                onClick={() => {
                  setAcctOpen(false);
                  setNotifOpen((o) => !o);
                }}
                style={{
                  ...iconBtn,
                  background: notifOpen ? "var(--c-100)" : "transparent",
                  position: "relative",
                }}
              >
                <Icon name="bell" size={18} color="var(--c-700)" />
              </button>
              <button
                type="button"
                className="tap"
                aria-label={dict.nav.account}
                onClick={() => {
                  setNotifOpen(false);
                  setAcctOpen((o) => !o);
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: 0,
                  padding: 0,
                  marginLeft: 6,
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "var(--c-300)",
                  boxShadow: acctOpen
                    ? "0 0 0 2px var(--c-canvas), 0 0 0 4px var(--c-ink)"
                    : "0 0 0 1px rgba(28,28,26,0.08)",
                }}
              >
                {/* Cold optimistic cache has no name: keep the circle empty
                    rather than showing a "?" initial. */}
                {fullName ? <Avatar name={fullName} size={34} /> : null}
              </button>
            </>
          ) : showNeutralCorner ? (
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                marginLeft: 6,
                flexShrink: 0,
                background: "var(--c-300)",
                boxShadow: "0 0 0 1px rgba(28,28,26,0.08)",
              }}
            />
          ) : (
            <button
              type="button"
              className="tap"
              aria-label={dict.nav.account}
              onClick={() => {
                setNotifOpen(false);
                setAcctOpen((o) => !o);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: 0,
                padding: 0,
                marginLeft: 6,
                cursor: "pointer",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--c-300)",
                boxShadow: acctOpen
                  ? "0 0 0 2px var(--c-canvas), 0 0 0 4px var(--c-ink)"
                  : "0 0 0 1px rgba(28,28,26,0.08)",
              }}
            >
              <Icon name="user" size={18} color="var(--c-700)" />
            </button>
          )}
        </div>
      </div>

      {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
      {acctOpen && (
        <AccountMenu locale={locale} onClose={() => setAcctOpen(false)} />
      )}
    </header>
  );
}
