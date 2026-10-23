"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { useAuth } from "@/lib/auth/useAuth";
import { useAuthModal } from "@/components/shell/auth-modal-provider";
import { InlineError } from "@/components/ui/inline-error";
import {
  Button,
  HeartButton,
  Icon,
  Img,
  Rating,
  Skeleton,
} from "@/components/ui";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { industryVisual } from "@/lib/marketplace/industry-visuals";
import {
  TeamMemberProfileModal,
  type TeamMemberSeed,
} from "@/app/[locale]/business/_components/team-member-profile-modal";
import type { SavedFilter, SavedItem, SavedKind } from "./saved-model";
import { useGridMotion } from "./use-grid-motion";
import { useSavedFavorites } from "./use-saved-favorites";
import { SavedCollectionArt } from "./saved-collection-art";
import { SavedSignInArt } from "./saved-sign-in-art";
import styles from "./saved-content.module.css";

type SavedDict = Dictionary["saved"];
type Counts = Record<SavedFilter, number>;
const KINDS: SavedKind[] = ["location", "person"];
const TAB_KEYS = {
  all: "all",
  location: "locations",
  person: "people",
} as const;

// The account-page header, shared with Appointments.
function SavedHeader({
  t,
  total,
  loading,
  locale,
}: {
  t: SavedDict;
  total: number | null;
  loading: boolean;
  locale: Locale;
}) {
  return (
    <header>
      <h1 className={styles.heading}>{t.heading}</h1>
      {(total === null ? loading : total > 0) && (
        <div className={styles.summary}>
          {total !== null ? (
            new Intl.NumberFormat(locale).format(total)
          ) : (
            <span aria-hidden="true">
              <Skeleton w="2ch" h={14} r={3} />
            </span>
          )}{" "}
          {t.countSuffix}
        </div>
      )}
    </header>
  );
}

function Filters({
  value,
  onChange,
  counts,
  t,
  locale,
}: {
  value: SavedFilter;
  onChange: (value: SavedFilter) => void;
  counts: Counts | null;
  t: SavedDict;
  locale: Locale;
}) {
  // Like the app, only types you have are offered. A selected type that empties
  // stays visible, so the current choice can still be seen and changed.
  const kinds = (["all", ...KINDS] as SavedFilter[]).filter(
    (kind) => !counts || kind === "all" || counts[kind] > 0 || kind === value,
  );
  return (
    <div className={styles.filters} role="group" aria-label={t.filtersLabel}>
      {kinds.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`tap ${styles.filter}`}
          aria-pressed={value === kind}
          disabled={!counts}
          onClick={() => onChange(kind)}
        >
          {t.tabs[TAB_KEYS[kind]]}
          <span className={styles.filterCount}>
            {counts ? (
              new Intl.NumberFormat(locale).format(counts[kind])
            ) : (
              <span aria-hidden="true">
                <Skeleton w="2ch" h={14} r={4} />
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const ends = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return ends.map((word) => Array.from(word)[0]).join("").toUpperCase() || "?";
}

// Profile photos are often small avatars, so a framed circle keeps them crisp.
// The initials stand in when there is no photo or it fails to load.
function PersonAvatar({ item }: { item: SavedItem }) {
  const [failed, setFailed] = useState<string | null>(null);
  const initials = monogram(item.title);
  const photo = item.media !== failed ? item.media : null;
  return (
    <div className={styles.avatar} aria-hidden="true">
      {photo ? (
        <Img
          src={photo}
          alt=""
          sizes="112px"
          label={initials}
          onError={() => setFailed(photo)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <span className={styles.monogram}>{initials}</span>
      )}
    </div>
  );
}

// A person: the portrait, with their name, role and rating beside it.
function PersonContent({ item, id }: { item: SavedItem; id: string }) {
  const role = item.person?.professionalTitle;
  return (
    <>
      <PersonAvatar item={item} />
      <div className={styles.profile}>
        <h2 id={`${id}-name`} className={styles.profileName}>
          {item.title}
        </h2>
        <div id={`${id}-meta`}>
          {role && <p className={styles.role}>{role}</p>}
          {item.rating !== null && (
            <div className={styles.profileRating}>
              <Rating
                rating={item.rating}
                reviews={item.reviews || undefined}
                size={14}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// A place: the homepage "Near you" ticket. The name sits on the photo, then a
// dashed seam leads to the category, address and a footer with the rating;
// Saved has no distance or opening hours to put beside it.
function LocationContent({ item, id }: { item: SavedItem; id: string }) {
  const { dict, locale } = useTranslation();
  const industry = industryVisual(item.industry?.slug);
  return (
    <>
      <div className={styles.media}>
        <div className={styles.photo} aria-hidden="true">
          <Img
            src={item.media ?? undefined}
            alt=""
            sizes="150px"
            label={<Icon name={industry.icon} size={28} color="var(--c-600)" />}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className={styles.identity}>
          <h2 id={`${id}-name`} className={styles.name}>
            {item.title}
          </h2>
          {item.brand && (
            <p id={`${id}-brand`} className={styles.brand}>
              {item.brand}
            </p>
          )}
        </div>
      </div>
      <div id={`${id}-meta`} className={styles.details}>
        {item.industry && (
          <p className={styles.category}>
            <Icon name={industry.icon} size={16} color={industry.accent} />
            <span>{taxonomyLabel(item.industry, locale, dict.industries)}</span>
          </p>
        )}
        {item.subtitle && <p className={styles.address}>{item.subtitle}</p>}
        <div className={styles.footer}>
          {item.rating !== null && (
            <Rating
              rating={item.rating}
              reviews={item.reviews || undefined}
              size={14}
            />
          )}
        </div>
      </div>
    </>
  );
}

function SavedCard({
  item,
  pending,
  onRemove,
  onOpenPerson,
  t,
}: {
  item: SavedItem;
  pending: boolean;
  onRemove: (item: SavedItem) => void;
  onOpenPerson: (person: TeamMemberSeed) => void;
  t: SavedDict;
}) {
  const id = useId();
  const isPerson = item.kind === "person";
  const described = item.brand ? `${id}-brand ${id}-meta` : `${id}-meta`;
  const removeLabel = format(t.removeAria, { name: item.title });
  return (
    <article className={`${styles.card} ${isPerson ? styles.personCard : ""}`}>
      {isPerson ? (
        <PersonContent item={item} id={id} />
      ) : (
        <LocationContent item={item} id={id} />
      )}
      {item.href ? (
        <Link
          href={item.href}
          prefetch={false}
          title={item.title}
          className={styles.primaryAction}
          aria-labelledby={`${id}-name`}
          aria-describedby={described}
          data-primary
        />
      ) : item.person ? (
        <button
          type="button"
          title={item.title}
          className={styles.primaryAction}
          aria-labelledby={`${id}-name`}
          aria-describedby={described}
          data-primary
          onClick={() => onOpenPerson(item.person!)}
        />
      ) : null}
      {/* A sibling of the card link, so removing never opens the card. */}
      <span className={styles.heart} title={removeLabel}>
        <HeartButton
          active
          size={38}
          iconSize={20}
          floating={false}
          ariaLabel={removeLabel}
          loading={pending}
          onClick={() => onRemove(item)}
        />
      </span>
    </article>
  );
}

function CollectionSkeleton() {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} h={168} r={18} />
      ))}
    </div>
  );
}

/** The empty collection becomes the page's centered heading and next action. */
function SavedEmpty({
  t,
  locale,
  enter,
  actionRef,
}: {
  t: SavedDict;
  locale: Locale;
  enter: boolean;
  actionRef: Ref<HTMLAnchorElement>;
}) {
  const id = useId();
  return (
    <section
      className={styles.empty}
      aria-labelledby={id}
      data-enter={enter || undefined}
    >
      <div className={`zw-container ${styles.emptyInner}`}>
        <SavedCollectionArt className={styles.emptyArtwork} />
        <div className={styles.emptyCopy}>
          <h1 id={id}>{t.empty.title}</h1>
          <p>{t.empty.body}</p>
        </div>
        <Link
          ref={actionRef}
          href={localeHref(locale, "search")}
          className={styles.emptyAction}
        >
          {t.empty.cta}
          <Icon name="arrowR" size={18} />
        </Link>
      </div>
    </section>
  );
}

export function SavedContent({ locale }: { locale: Locale }) {
  const { user } = useAuth();
  return (
    <SavedSessionContent key={user?.uuid ?? "anonymous"} locale={locale} />
  );
}

function SavedSessionContent({ locale }: { locale: Locale }) {
  const { dict } = useTranslation();
  const t = dict.saved;
  const { status, refresh: refreshSession } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const {
    items,
    loading,
    error,
    retrying,
    retry,
    remove,
    pendingKeys,
    refreshing,
    offline,
  } = useSavedFavorites(locale);
  const [authRetrying, setAuthRetrying] = useState(false);
  const [kind, setKind] = useState<SavedFilter>("all");
  const [openPerson, setOpenPerson] = useState<TeamMemberSeed | null>(null);
  const authenticated = status === "authenticated";
  const counts = useMemo<Counts>(() => {
    const next: Counts = {
      all: items?.length ?? 0,
      location: 0,
      person: 0,
    };
    for (const item of items ?? []) next[item.kind]++;
    return next;
  }, [items]);
  const busy = status === "idle" || status === "loading" || loading;
  const empty = items?.length === 0;
  const initialOffline = authenticated && items === null && offline;
  const visible = useMemo(
    () => items?.filter((item) => kind === "all" || item.kind === kind) ?? [],
    [items, kind],
  );
  const keys = useMemo(() => visible.map((item) => item.key), [visible]);
  // Removing the last item, or undoing that, swaps the grid and the empty
  // state with a short settle. The first load and filter switches render at
  // once.
  const total = items === null ? null : counts.all;
  const [last, setLast] = useState({ total, kind, swapped: false });
  if (last.total !== total || last.kind !== kind) {
    setLast({
      total,
      kind,
      swapped:
        last.kind === kind &&
        last.total !== null &&
        total !== null &&
        (last.total === 0) !== (total === 0),
    });
  }
  const emptyAction = useRef<HTMLAnchorElement>(null);
  const { ref: gridRef, leave } = useGridMotion(keys, {
    appear: last.swapped,
    fallbackFocus: emptyAction,
  });
  const handleRemove = useCallback(
    (item: SavedItem) => leave(item.key, () => remove(item)),
    [leave, remove],
  );

  if (status === "unauthenticated")
    return (
      <main className={styles.empty}>
        <div className={`zw-container ${styles.emptyInner}`}>
          <SavedSignInArt className={styles.emptyArtwork} />
          <div className={styles.emptyCopy}>
            <h1>{t.gate.title}</h1>
            <p>{t.gate.body}</p>
          </div>
          <div className={styles.gateActions}>
            <Button kind="primary" size="lg" onClick={() => openAuthModal("signin")}>
              {t.gate.cta}
            </Button>
            <Button
              kind="secondary"
              size="lg"
              onClick={() => router.push(localeHref(locale, "search"))}
            >
              {t.gate.secondary}
            </Button>
          </div>
        </div>
      </main>
    );

  if (status === "error")
    return (
      <main className={`zw-container ${styles.page}`}>
        <SavedHeader t={t} total={null} loading={false} locale={locale} />
        <div className={styles.error}>
          <InlineError>{dict.accountMenu.sessionError}</InlineError>
          <Button
            kind="secondary"
            loading={authRetrying}
            onClick={async () => {
              if (authRetrying) return;
              setAuthRetrying(true);
              try {
                await refreshSession();
              } finally {
                setAuthRetrying(false);
              }
            }}
          >
            {dict.errors.retry}
          </Button>
        </div>
      </main>
    );

  return (
    <main
      className={styles.page}
      data-empty={empty || undefined}
      aria-busy={(busy && !initialOffline) || undefined}
    >
      <div className="zw-container">
        {!empty && (
          <SavedHeader
            t={t}
            total={items === null ? null : counts.all}
            loading={busy && !initialOffline}
            locale={locale}
          />
        )}
        {offline && authenticated && (
          <p role="status" className={styles.notice}>
            <Icon name="warn" size={16} color="var(--c-600)" />
            {initialOffline ? t.offlineEmpty : t.offline}
          </p>
        )}
        {((busy && !initialOffline) || !!items?.length) && (
          <Filters
            value={kind}
            onChange={setKind}
            counts={items === null ? null : counts}
            t={t}
            locale={locale}
          />
        )}
        {busy && items === null && !initialOffline ? (
          <CollectionSkeleton />
        ) : (
          <>
            {error && !offline && (
              <div className={styles.error}>
                <InlineError>
                  {items === null ? t.sectionError : t.refreshError}
                </InlineError>
                <Button
                  kind="secondary"
                  size="sm"
                  loading={retrying || refreshing}
                  onClick={retry}
                >
                  {dict.errors.retry}
                </Button>
              </div>
            )}
            {!!items?.length &&
              (visible.length === 0 && kind !== "all" ? (
                <p className={styles.filteredEmpty}>{t.filteredEmpty[kind]}</p>
              ) : (
                <ul ref={gridRef} className={styles.grid} aria-label={t.heading}>
                  {visible.map((item) => (
                    <li key={item.key} data-key={item.key} className={styles.item}>
                      <SavedCard
                        item={item}
                        pending={pendingKeys.has(item.key)}
                        onRemove={handleRemove}
                        onOpenPerson={setOpenPerson}
                        t={t}
                      />
                    </li>
                  ))}
                </ul>
              ))}
          </>
        )}
      </div>
      {empty && (
        <SavedEmpty
          t={t}
          locale={locale}
          enter={last.swapped}
          actionRef={emptyAction}
        />
      )}
      <span role="status" className="sr-only">
        {/* Background refreshes on return to the tab stay silent. */}
        {busy || retrying ? t.loading : ""}
      </span>
      {openPerson && (
        <TeamMemberProfileModal
          member={openPerson}
          locale={locale}
          onClose={() => setOpenPerson(null)}
        />
      )}
    </main>
  );
}
