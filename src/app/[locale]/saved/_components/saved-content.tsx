"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import {
  Avatar,
  Button,
  Icon,
  Img,
  Kicker,
  SignedOutGate,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  addFavoriteBusiness,
  addFavoriteLocation,
  addFavoriteProfessional,
  getFavorites,
  removeFavoriteBusiness,
  removeFavoriteLocation,
  removeFavoriteProfessional,
} from "@/lib/api/marketplace/customer";
import type { AllFavorites } from "@/lib/api/marketplace/types";

type SavedDict = (typeof dictionaries)[Locale]["saved"];

type RowKind = "business" | "location" | "person";
type FilterKind = "all" | RowKind;

// One unified row model shared by businesses, locations and professionals so
// the editorial list never resolves a reference at render time.
interface SavedRow {
  kind: RowKind;
  /** Stable list key (kind-prefixed entity id). */
  key: string;
  /** ENTITY id used for add/remove mutations (NOT the favorite-row id). */
  entityId: number;
  media: string | null;
  /** Round avatar (person) vs. square thumb (business / location). */
  round: boolean;
  eyebrow: string;
  title: string;
  rating: number | null;
  subtitle: string;
  /** Show a pin glyph before the subtitle (locations only). */
  pinSubtitle: boolean;
  /** Detail-route href, or null for non-navigating rows. */
  href: string | null;
  /** ISO datetime (locations & professionals); null for businesses. */
  createdAt: string | null;
  /** Coordinates (locations only) for distance display; null otherwise. */
  lat?: number | null;
  lng?: number | null;
}

// Haversine distance in km between two {lat,lng} points.
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // Earth radius (km)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ─────────────────────────────────────────────
// Normalise the three favorite groups into one ordered SavedRow[].
// Order: businesses (API order) → locations (newest first) → professionals
// (newest first). Businesses carry no createdAt, so their API order is kept.
// ─────────────────────────────────────────────

// The API may return averageRating as a numeric string (e.g. "4.80") at
// runtime even though its type says number | null. Coerce to a real number
// so render code can safely call .toFixed.
function toRating(v: unknown): number | null {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

// Coordinates may likewise arrive as numeric strings at runtime; coerce so
// haversine math never receives a string.
function toNum(v: unknown): number | null {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function buildRows(fav: AllFavorites, locale: Locale): SavedRow[] {
  const businessRows: SavedRow[] = fav.businesses.map((f) => {
    const navigable =
      f.marketplace.primaryLocationId != null && f.marketplace.isListed;
    return {
      kind: "business",
      key: "b-" + f.business.id,
      entityId: f.business.id,
      media: f.marketplace.featuredImage,
      round: false,
      eyebrow: f.business.industry
        ? taxonomyLabel(f.business.industry, locale)
        : "",
      title: f.business.name,
      rating: toRating(f.business.averageRating),
      subtitle: "",
      pinSubtitle: false,
      href: navigable
        ? localeHref(
            locale,
            "business",
            String(f.marketplace.primaryLocationId),
          )
        : null,
      createdAt: null,
    };
  });

  const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const locationRows: SavedRow[] = [...fav.locations]
    .sort(byNewest)
    .map((f) => {
      const subtitle = f.location.address ?? f.location.city ?? "";
      return {
        kind: "location",
        key: "l-" + f.location.id,
        entityId: f.location.id,
        media: f.location.featuredImage,
        round: false,
        eyebrow: f.location.business?.name ?? "",
        title: f.location.name,
        rating: toRating(f.location.averageRating),
        subtitle,
        pinSubtitle: subtitle !== "",
        href: localeHref(locale, "business", String(f.location.id)),
        createdAt: f.createdAt,
        lat: toNum(f.location.latitude),
        lng: toNum(f.location.longitude),
      };
    });

  const personRows: SavedRow[] = [...fav.professionals]
    .sort(byNewest)
    .map((f) => {
      const p = f.professional;
      const title =
        p.displayName ??
        [p.firstName, p.lastName].filter(Boolean).join(" ");
      return {
        kind: "person",
        key: "p-" + p.id,
        entityId: p.id,
        media: p.profileImage,
        round: true,
        eyebrow: p.professionalTitle ?? p.displayName ?? "",
        title,
        rating: toRating(p.averageRating),
        subtitle: "",
        pinSubtitle: false,
        href: null,
        createdAt: f.createdAt,
      };
    });

  return [...businessRows, ...locationRows, ...personRows];
}

// ─────────────────────────────────────────────
// Locale-aware "saved … ago" stamp — largest of days / weeks / months.
// ─────────────────────────────────────────────

function savedAgo(locale: Locale, createdAt: string, now: number): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = now - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 7) return rtf.format(-Math.max(days, 0), "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  return rtf.format(-Math.floor(days / 30), "month");
}

// ─────────────────────────────────────────────
// Local skeleton loading state (mirrors account-content's LoadingState).
// ─────────────────────────────────────────────

function LoadingState({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div
      className="zw-container"
      style={{ paddingTop: 44, paddingBottom: 56, width: "100%" }}
      aria-busy="true"
    >
      <Skeleton w="40%" h={40} r={12} />
      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <Skeleton w="100%" h={88} r={16} />
        <Skeleton w="100%" h={88} r={16} />
        <Skeleton w="100%" h={88} r={16} />
      </div>
      <p className="sr-only">{loadingLabel}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Filter pills (All · Businesses · Locations · People) with live counts.
// ─────────────────────────────────────────────

function Filters({
  value,
  onChange,
  counts,
  t,
}: {
  value: FilterKind;
  onChange: (k: FilterKind) => void;
  counts: Record<FilterKind, number>;
  t: SavedDict;
}) {
  const allTabs: { id: FilterKind; label: string }[] = [
    { id: "all", label: t.tabs.all },
    { id: "business", label: t.tabs.businesses },
    { id: "location", label: t.tabs.locations },
    { id: "person", label: t.tabs.people },
  ];
  const tabs = allTabs.filter(
    (tab) => tab.id === "all" || counts[tab.id] > 0,
  );

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            className="tap"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 15px",
              borderRadius: 999,
              cursor: "pointer",
              background: active ? "var(--c-ink)" : "#fff",
              color: active ? "#fff" : "var(--c-700)",
              border:
                "1px solid " + (active ? "transparent" : "rgba(28,28,26,0.12)"),
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "-0.005em",
              transition:
                "background-color .2s var(--ease-soft), color .2s var(--ease-soft)",
            }}
          >
            {tab.label}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: active ? "rgba(255,255,255,0.6)" : "var(--c-500)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// One editorial row.
// ─────────────────────────────────────────────

function Row({
  row,
  locale,
  now,
  distance,
  onRemove,
  onOpen,
  t,
}: {
  row: SavedRow;
  locale: Locale;
  now: number;
  /** "X.X km" for location rows once geolocation resolves; else undefined. */
  distance?: string;
  onRemove: (row: SavedRow) => void;
  onOpen: (href: string) => void;
  t: SavedDict;
}) {
  const navigable = row.href != null;
  const mediaSize = row.round ? 60 : 64;
  const stamp = row.createdAt ? savedAgo(locale, row.createdAt, now) : null;

  const open = () => {
    if (row.href) onOpen(row.href);
  };

  return (
    <div
      role={navigable ? "button" : undefined}
      tabIndex={navigable ? 0 : undefined}
      onClick={navigable ? open : undefined}
      onKeyDown={
        navigable
          ? (e) => {
              if (e.key === "Enter") open();
            }
          : undefined
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 15,
        padding: "17px 8px",
        cursor: navigable ? "pointer" : "default",
        borderBottom: "1px solid rgba(28,28,26,0.08)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: mediaSize,
          height: mediaSize,
          borderRadius: row.round ? "50%" : 15,
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--c-300)",
          position: "relative",
          boxShadow: row.round
            ? "none"
            : "inset 0 0 0 1px rgba(28,28,26,0.07)",
        }}
      >
        {row.round ? (
          <Avatar src={row.media ?? undefined} name={row.title} size={mediaSize} />
        ) : (
          <Img
            src={row.media ?? undefined}
            alt={row.title}
            label={row.eyebrow || undefined}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {row.eyebrow && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "var(--c-500)",
              marginBottom: 5,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.eyebrow}
            </span>
          </div>
        )}
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: "var(--c-900)",
            letterSpacing: "-0.024em",
            lineHeight: 1.12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.title}
        </div>
        {(row.rating != null || row.subtitle) && (
          <div
            style={{
              marginTop: 5,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--c-600)",
              minWidth: 0,
            }}
          >
            {row.rating != null && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3.5,
                  fontWeight: 600,
                  color: "var(--c-800)",
                  flexShrink: 0,
                }}
              >
                <Icon name="star" size={11} color="var(--p-500)" />
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {row.rating.toFixed(1)}
                </span>
              </span>
            )}
            {row.rating != null && row.subtitle && (
              <span style={{ color: "var(--c-300)", flexShrink: 0 }}>·</span>
            )}
            {row.subtitle && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                {row.pinSubtitle && (
                  <Icon name="pin" size={11} color="var(--c-500)" />
                )}
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.subtitle}
                  {distance ? ` · ${distance}` : ""}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 9,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          className="tap"
          aria-label={format(t.removeAria, { name: row.title })}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(row);
          }}
          style={{
            display: "inline-flex",
            border: 0,
            background: "transparent",
            padding: 0,
            color: "var(--p-500)",
            cursor: "pointer",
          }}
        >
          <Icon name="heart" size={18} color="currentColor" />
        </button>
        {stamp && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "var(--c-400)",
              whiteSpace: "nowrap",
            }}
          >
            {stamp}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export function SavedContent({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].saved;
  const router = useRouter();
  const toast = useToast();
  const { status } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [favorites, setFavorites] = useState<AllFavorites | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Live working list — derived from `favorites`, then mutated by remove/undo.
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [kind, setKind] = useState<FilterKind>("all");
  // "now" is captured client-side once on mount so relative stamps are stable.
  const [now] = useState(() => Date.now());
  // Device coordinates for location-row distance. null = pending / denied /
  // unavailable. Purely optional — never blocks render.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const authed = status === "authenticated";

  // Ask for geolocation once. Optional — on denial/error/unavailable we keep
  // `coords` null and location rows simply omit the distance suffix.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        /* denied / unavailable → leave distance off */
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    getFavorites()
      .then((fav) => {
        if (!alive) return;
        setFavorites(fav);
        setRows(buildRows(fav, locale));
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [authed, locale]);

  const counts = useMemo<Record<FilterKind, number>>(() => {
    const c: Record<FilterKind, number> = {
      all: rows.length,
      business: 0,
      location: 0,
      person: 0,
    };
    for (const r of rows) c[r.kind] += 1;
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (kind === "all" ? rows : rows.filter((r) => r.kind === kind)),
    [rows, kind],
  );

  const openHref = useCallback(
    (href: string) => router.push(href),
    [router],
  );

  const removeApi = useCallback((row: SavedRow) => {
    if (row.kind === "business") return removeFavoriteBusiness(row.entityId);
    if (row.kind === "location") return removeFavoriteLocation(row.entityId);
    return removeFavoriteProfessional(row.entityId);
  }, []);

  const addApi = useCallback((row: SavedRow) => {
    if (row.kind === "business") return addFavoriteBusiness(row.entityId);
    if (row.kind === "location") return addFavoriteLocation(row.entityId);
    return addFavoriteProfessional(row.entityId);
  }, []);

  const handleRemove = useCallback(
    (row: SavedRow) => {
      // Remember the row's position so Undo restores original ordering.
      const index = rows.findIndex((r) => r.key === row.key);

      const undo = () => {
        setRows((prev) => {
          if (prev.some((r) => r.key === row.key)) return prev;
          const next = [...prev];
          next.splice(Math.min(index, next.length), 0, row);
          return next;
        });
        addApi(row).catch(() => {
          // Re-add failed → revert the optimistic restore.
          setRows((prev) => prev.filter((r) => r.key !== row.key));
          toast(t.removeError, "heartO");
        });
      };

      // Optimistic remove.
      setRows((prev) => prev.filter((r) => r.key !== row.key));

      removeApi(row)
        .then(() => {
          toast(format(t.removed, { name: row.title }), "heartO", {
            label: t.undo,
            onClick: undo,
          });
        })
        .catch(() => {
          // Revert the optimistic remove.
          setRows((prev) => {
            if (prev.some((r) => r.key === row.key)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, row);
            return next;
          });
          toast(t.removeError, "heartO");
        });
    },
    [rows, removeApi, addApi, toast, t],
  );

  // ── Auth gating ──
  if (status === "idle" || status === "loading") {
    return <LoadingState loadingLabel={t.loading} />;
  }

  if (status === "unauthenticated" || status === "error") {
    return (
      <SignedOutGate
        icon="heartO"
        title={t.gate.title}
        body={t.gate.body}
        onCta={() => openAuthModal("signin")}
        secondaryLabel={t.gate.secondary}
        onSecondary={() => router.push(localeHref(locale, "search"))}
      />
    );
  }

  if (loading) {
    return <LoadingState loadingLabel={t.loading} />;
  }

  const total = rows.length;

  const monoNum: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    color: "var(--c-800)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div
      className="zw-container zw-acct-in"
      style={{ paddingTop: 44, paddingBottom: 56, width: "100%" }}
    >
      <Kicker style={{ marginBottom: 10 }}>{t.kicker}</Kicker>
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.4vw, 40px)",
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color: "var(--c-900)",
        }}
      >
        {t.heading}
      </h1>
      <div style={{ marginTop: 9, fontSize: 13.5, color: "var(--c-600)" }}>
        <b style={monoNum}>{total}</b> {t.countSuffix}
      </div>

      {favorites === null && error ? (
        <div
          style={{
            marginTop: 28,
            padding: "22px 18px",
            background: "#fff",
            border: "1px solid rgba(28,28,26,0.08)",
            borderRadius: 16,
            boxShadow: "var(--sh-sm)",
            fontSize: 13.5,
            color: "var(--s-error-600)",
          }}
        >
          {t.sectionError}
        </div>
      ) : total === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px dashed rgba(28,28,26,0.16)",
            borderRadius: 22,
            padding: "60px 28px",
            textAlign: "center",
            marginTop: 28,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--c-shade)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Icon name="heartO" size={24} color="var(--c-600)" />
          </span>
          <div
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--c-900)",
              marginBottom: 8,
            }}
          >
            {t.empty.title}
          </div>
          <p
            className="txt-pretty"
            style={{
              margin: "0 auto 24px",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "var(--c-600)",
              maxWidth: 360,
            }}
          >
            {t.empty.body}
          </p>
          <Button
            kind="accent"
            size="lg"
            onClick={() => router.push(localeHref(locale, "search"))}
          >
            {t.empty.cta}
          </Button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 26,
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <Filters value={kind} onChange={setKind} counts={counts} t={t} />
          </div>

          {visible.length === 0 ? (
            <div
              style={{
                padding: "22px 18px",
                background: "#fff",
                border: "1px dashed rgba(28,28,26,0.14)",
                borderRadius: 14,
                fontSize: 13.5,
                color: "var(--c-600)",
                textAlign: "center",
                maxWidth: 460,
              }}
            >
              {t.filteredEmpty}
            </div>
          ) : (
            <div
              key={kind}
              className="zv-tab-in"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                columnGap: 40,
                rowGap: 0,
                paddingBottom: 10,
              }}
            >
              {visible.map((row) => {
                const distance =
                  coords && row.lat != null && row.lng != null
                    ? `${haversineKm(coords, {
                        lat: row.lat,
                        lng: row.lng,
                      }).toFixed(1)} km`
                    : undefined;
                return (
                  <Row
                    key={row.key}
                    row={row}
                    locale={locale}
                    now={now}
                    distance={distance}
                    onRemove={handleRemove}
                    onOpen={openHref}
                    t={t}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
