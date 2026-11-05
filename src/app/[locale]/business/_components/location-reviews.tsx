"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Avatar, Button, Icon, Skeleton, Spinner, Stars, useToast, type ToastHandle } from "@/components/ui";
import { format, formatCount } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { errorMessage } from "@/lib/api/error-messages";
import { getListingReviews } from "@/lib/api/marketplace/public";
import type { ListingDetail, ListingTeamMember, Review, ReviewPageParams } from "@/lib/api/marketplace/types";
import { professionalHref } from "@/lib/professionals/urls";
import { ProfessionalReviewsEmptyArt } from "./professional-reviews-empty-art";
import { TeamMemberProfileModal } from "./team-member-profile-modal";
import styles from "./location-reviews.module.css";

type Sort = "recent" | "high" | "low";
type RequestKind = "sort" | "more";
const SORT_PARAMS: Record<Sort, Pick<ReviewPageParams, "sortBy" | "sortOrder">> = {
  recent: { sortBy: "createdAt", sortOrder: "DESC" },
  high: { sortBy: "rating", sortOrder: "DESC" },
  low: { sortBy: "rating", sortOrder: "ASC" },
};
const reviewKey = (review: Review) => `${review.type}-${review.id}`;

type Visit = { key: string; reviews: Review[] };

/**
 * One submission rates the venue and its professionals together, so those
 * ratings share the reviewer and the exact time they were saved. The feed has
 * no visit id: anything short of an exact match stays its own entry. Star sorts
 * only join ratings with the same stars, so the order the visitor chose holds.
 */
function groupByVisit(reviews: Review[], sort: Sort): Visit[] {
  const visits: Visit[] = [];
  const byMatch = new Map<string, Visit>();
  for (const review of reviews) {
    const customer = review.customer;
    const match = customer?.firstName
      ? JSON.stringify([customer.firstName, customer.lastName, customer.profileImage, review.createdAt, sort === "recent" ? null : review.rating])
      : null;
    const visit = match ? byMatch.get(match) : undefined;
    if (visit) {
      visit.reviews.push(review);
      continue;
    }
    const next = { key: reviewKey(review), reviews: [review] };
    visits.push(next);
    if (match) byMatch.set(match, next);
  }
  // The venue's rating leads, as it does in the feed's own order.
  for (const visit of visits) {
    visit.reviews.sort((a, b) => Number(a.type !== "location") - Number(b.type !== "location"));
  }
  return visits;
}

// Keep long comments compact without removing their text from the initial HTML.
const COMMENT_LIMIT = 280;
const COMMENT_LINES = 5;

export function LocationReviews({ listing, locale, memberId, setMemberId }: {
  listing: ListingDetail;
  locale: Locale;
  memberId: number | null;
  setMemberId: (id: number | null) => void;
}) {
  const selected = listing.teamMembers.find((member) => member.id === memberId);
  return (
    <>
      <ReviewFeed key={listing.locationId} listing={listing} locale={locale} openMember={setMemberId} />
      {selected && (
        <TeamMemberProfileModal member={selected} listing={listing} locale={locale} locationTab="reviews" onClose={() => setMemberId(null)} />
      )}
    </>
  );
}

function ReviewFeed({ listing, locale, openMember }: { listing: ListingDetail; locale: Locale; openMember: (id: number) => void }) {
  const { dict } = useTranslation();
  const t = dict.business;
  const copy = dict.locationPage;
  const toast = useToast();
  const [reviews, setReviews] = useState(listing.reviews);
  const [offset, setOffset] = useState(listing.reviews.length);
  const [total, setTotal] = useState(listing.reviewStats.totalCount);
  const [sort, setSort] = useState<Sort>("recent");
  const [pending, setPending] = useState<{ kind: RequestKind; sort: Sort } | null>(null);
  const [failure, setFailure] = useState<{ kind: RequestKind; sort: Sort } | null>(null);
  const [updated, setUpdated] = useState(false);
  const request = useRef<AbortController | null>(null);
  const requestRevision = useRef(0);
  const loadToast = useRef<ToastHandle | null>(null);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
      loadToast.current?.dismiss();
    };
  }, []);

  const dateFormat = useMemo(() => {
    // Dates describe this venue's review history. Pin the zone so server and
    // browser render the same calendar day, even for visitors abroad.
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium", timeZone: listing.timezone || "UTC",
      });
    } catch {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
    }
  }, [locale, listing.timezone]);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const members = useMemo(() => new Map(listing.teamMembers.map((member) => [member.id, member])), [listing.teamMembers]);
  const visits = useMemo(() => groupByVisit(reviews, sort), [reviews, sort]);
  const stats = listing.reviewStats;
  const distributionTotal = Object.values(stats.ratingDistribution).reduce((sum, value) => sum + value, 0);

  function dismissLoadToast() {
    loadToast.current?.dismiss();
    loadToast.current = null;
  }

  async function fetchReviews(nextSort: Sort, kind: RequestKind) {
    if (!active.current) return;
    request.current?.abort();
    dismissLoadToast();
    const revision = ++requestRevision.current;
    const controller = new AbortController();
    request.current = controller;
    setPending({ kind, sort: nextSort });
    setFailure(null);
    try {
      const result = await getListingReviews(listing.locationId, {
        offset: kind === "more" ? offset : 0,
        limit: 10,
        ...SORT_PARAMS[nextSort],
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setReviews((previous) => {
        if (kind === "sort") return result.data;
        // Offset feeds can overlap after a new review arrives between requests.
        const known = new Set(previous.map(reviewKey));
        return [...previous, ...result.data.filter((review) => !known.has(reviewKey(review)))];
      });
      setOffset(result.pagination.offset + result.data.length);
      setTotal(result.pagination.total);
      setSort(nextSort);
      setUpdated(true);
      dismissLoadToast();
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure({ kind, sort: nextSort });
        loadToast.current = toast(
          errorMessage(error, dict.errors, kind === "sort" ? copy.reviewsLoadError : t.loadMoreReviewsError),
          "warn",
          {
            label: dict.errors.retry,
            onClick: () => {
              if (active.current && requestRevision.current === revision) void fetchReviews(nextSort, kind);
            },
          },
          "error",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setPending(null);
        request.current = null;
      }
    }
  }

  if (stats.totalCount === 0 && reviews.length === 0 && !pending && !failure) {
    return (
      <section className={styles.root}>
        <div className={styles.empty}>
          <div className={styles.emptyArt}><ProfessionalReviewsEmptyArt /></div>
          <p className={styles.emptyTitle}>{t.memberReviewsEmptyTitle}</p>
        </div>
      </section>
    );
  }

  const sorts: { key: Sort; label: string }[] = [
    { key: "recent", label: copy.reviewsNewest },
    { key: "high", label: copy.reviewsHighest },
    { key: "low", label: copy.reviewsLowest },
  ];

  return (
    <section className={styles.root}>
      {/* Two halves that line up with the review columns below. */}
      <div className={styles.summary}>
        <div className={styles.aggregate}>
          <span className={styles.average}>
            {stats.averageRating == null ? "—" : new Intl.NumberFormat(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }).format(stats.averageRating)}
          </span>
          <span className={styles.aggregateMeta}>
            {stats.averageRating != null && <Stars value={stats.averageRating} size={17} gap={2} />}
            <span className={styles.count}>
              {formatCount(stats.totalCount, locale, {
                one: t.reviewsCountOne,
                few: t.reviewsCount,
                other: t.reviewsCountMany,
              })}
            </span>
          </span>
        </div>
        <dl className={styles.distribution}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] ?? 0;
            return (
              <div key={rating} className={styles.distributionRow}>
                <dt>
                  {/* The star marks the row as a rating, so it doesn't read as a second count. */}
                  <span className={styles.distributionStar} aria-hidden="true">{rating}<Icon name="star" size={10} color="var(--c-500)" /></span>
                  <span className={styles.srOnly}>{formatCount(rating, locale, { one: copy.starsCountOne, few: copy.starsCount, other: copy.starsCount })}</span>
                </dt>
                <dd>
                  <span className={styles.track} aria-hidden="true">
                    <span style={{ width: `${distributionTotal ? (count / distributionTotal) * 100 : 0}%` }} />
                  </span>
                  <span className={styles.distributionCount}>{numberFormat.format(count)}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Laid out like the Team toolbar: a note on the left, the switch on the right. */}
      <div className={styles.toolbar}>
        {/* Reviews are only accepted for completed appointments. */}
        <p className={styles.verified}><Icon name="shield" size={16} color="var(--s-success-600)" />{copy.reviewsVerified}</p>
        <div className={styles.sorts} role="group" aria-label={copy.sortReviews}>
          {sorts.map((option) => {
            const loading = pending?.kind === "sort" && pending.sort === option.key;
            return (
              <button
                key={option.key}
                type="button"
                className={styles.sortOption}
                aria-pressed={sort === option.key}
                aria-busy={loading || undefined}
                onClick={() => {
                  if (loading) return;
                  if (option.key !== sort || pending || failure) void fetchReviews(option.key, "sort");
                }}
              >
                {/* Hidden, not removed, so the switch keeps its size and name while loading. */}
                <span style={{ opacity: loading ? 0 : 1 }}>{option.label}</span>
                {loading && <span className={styles.sortSpinner} aria-hidden="true"><Spinner size={16} color="currentColor" /></span>}
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.srOnly} role="status" aria-live="polite">
        {pending ? copy.reviewsUpdating : updated ? copy.reviewsUpdated : ""}
      </p>
      <div className={styles.reviews} aria-busy={pending != null} data-refreshing={pending?.kind === "sort" || undefined}>
        {visits.map((visit) => {
          const [first] = visit.reviews;
          const name = [first.customer?.firstName, first.customer?.lastName].filter(Boolean).join(" ").trim();
          const date = new Date(first.createdAt);
          const props = { members, locale, openMember, labelVenue: visit.reviews.length > 1 };
          return (
            <article key={visit.key} className={styles.review} aria-label={name ? format(copy.reviewedBy, { name }) : undefined}>
              <header className={styles.reviewHeader}>
                {/* The name follows in text; the photo would only repeat it. */}
                <span className={styles.reviewerPhoto} aria-hidden="true">
                  <Avatar src={first.customer?.profileImage ?? undefined} name={name || "?"} size={44} monogram loading="lazy" />
                </span>
                <span className={styles.reviewer}>
                  <span className={styles.name}>{name || "—"}</span>
                  {Number.isFinite(date.getTime()) && <time dateTime={first.createdAt} className={styles.date}>{dateFormat.format(date)}</time>}
                </span>
              </header>
              {visit.reviews.length > 1 ? (
                <ul className={styles.ratings}>
                  {visit.reviews.map((review) => (
                    <li key={reviewKey(review)} className={styles.rating}>
                      <ReviewRating review={review} {...props} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.ratings}>
                  <ReviewRating review={first} {...props} />
                </div>
              )}
            </article>
          );
        })}
        {pending && reviews.length === 0 && [0, 1, 2, 3].map((index) => (
          <div aria-hidden="true" className={styles.review} key={`skeleton-${index}`}>
            <div className={styles.reviewHeader}>
              <Skeleton w={44} h={44} r="50%" style={{ flexShrink: 0 }} />
              <div className={styles.reviewer}>
                <Skeleton w={120} h={16} />
                <Skeleton w={84} h={13} style={{ marginTop: 6 }} />
              </div>
            </div>
            <Skeleton w={84} h={14} style={{ marginTop: 16 }} />
            <Skeleton w="92%" h={15} style={{ marginTop: 10 }} />
            <Skeleton w="64%" h={15} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>

      {(offset < total || failure?.kind === "more") && (
        <div className={styles.more}>
          <Button
            kind="secondary"
            loading={pending?.kind === "more"}
            disabled={pending?.kind === "sort"}
            onClick={() => void fetchReviews(sort, "more")}
          >
            {t.loadMoreReviews}
          </Button>
        </div>
      )}
    </section>
  );
}

type RatingProps = {
  review: Review;
  members: Map<number, ListingTeamMember>;
  locale: Locale;
  openMember: (id: number) => void;
  /** Name the venue only beside a professional's rating from the same visit. */
  labelVenue: boolean;
};

/** One rating in a visit: its stars, who it is for, and its comment. */
function ReviewRating(props: RatingProps) {
  return (
    <>
      <div className={styles.ratingLine}>
        <Stars value={props.review.rating} size={14} gap={2} />
        <ReviewSubject {...props} />
      </div>
      {props.review.comment && <ReviewComment text={props.review.comment} />}
    </>
  );
}

/** The venue, or the professional; someone still on this team opens their profile here. */
function ReviewSubject({ review, members, locale, openMember, labelVenue }: RatingProps) {
  const { dict } = useTranslation();
  const copy = dict.locationPage;
  if (review.type === "location") {
    return labelVenue ? <span className={styles.subject}>{copy.reviewSubjectLocation}</span> : null;
  }
  const person = review.teamMember;
  const member = person ? members.get(person.id) : undefined;
  // The same name as their team card and profile, when they are still on the team.
  const name = (member && (member.displayName || [member.firstName, member.lastName].filter(Boolean).join(" ").trim()))
    || [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();
  const content = (
    <>
      <span className={styles.subjectMark} aria-hidden="true">
        {name
          ? <Avatar src={member?.profileImage ?? person?.profileImage ?? undefined} name={name} size={22} monogram loading="lazy" decorative />
          : <Icon name="user" size={13} />}
      </span>
      <span className={styles.subjectName}>{name || copy.reviewSubjectProfessional}</span>
    </>
  );
  if (!member) return <span className={styles.subject}>{content}</span>;
  const label = `${name || copy.reviewSubjectProfessional}, ${copy.viewProfile}`;
  return member.publicProfileAvailable === true && member.uuid ? (
    <Link href={professionalHref(locale, member.uuid)} prefetch={false} className={`${styles.subject} ${styles.subjectLink}`} aria-label={label}
      onNavigate={(event) => { event.preventDefault(); openMember(member.id); }}>
      {content}
    </Link>
  ) : (
    <button type="button" className={`${styles.subject} ${styles.subjectLink}`} aria-label={label} onClick={() => openMember(member.id)}>
      {content}
    </button>
  );
}

/** Long comments open in place, so one review never stretches its row of the grid. */
function ReviewComment({ text }: { text: string }) {
  const { dict } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(true);
  const commentRef = useRef<HTMLSpanElement>(null);
  const commentId = useId();
  const collapsible = text.length > COMMENT_LIMIT || text.split("\n").length > COMMENT_LINES;

  useEffect(() => {
    if (!collapsible || expanded) return;
    const comment = commentRef.current;
    if (!comment) return;
    const observer = new ResizeObserver(([entry]) => {
      // Reviews mount in a hidden tab. Measure once it has a real layout, and
      // again when its column width changes; a short comment needs no toggle.
      if (!entry || entry.contentRect.width === 0 || entry.contentRect.height === 0) return;
      setClipped(comment.scrollHeight > comment.clientHeight + 1);
    });
    observer.observe(comment);
    return () => observer.disconnect();
  }, [collapsible, expanded, text]);

  return (
    <p className={`txt-pretty ${styles.comment}`}>
      <span ref={commentRef} id={commentId} className={styles.commentText} data-collapsed={collapsible && !expanded || undefined}>{text}</span>
      {collapsible && (expanded || clipped) && (
        <button type="button" className={styles.commentToggle} aria-controls={commentId} aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>
          {expanded ? dict.locationPage.reviewLess : dict.locationPage.reviewMore}
        </button>
      )}
    </p>
  );
}
