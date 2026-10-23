"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Skeleton, Stars } from "@/components/ui";
import { InlineError } from "@/components/ui/inline-error";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { errorMessage } from "@/lib/api/error-messages";
import { getListingReviews } from "@/lib/api/marketplace/public";
import type { ListingDetail, Review, ReviewPageParams } from "@/lib/api/marketplace/types";
import { EmptyState } from "./empty-state";
import styles from "./location-reviews.module.css";

type Sort = "recent" | "high" | "low";
type RequestKind = "sort" | "more";
const SORT_PARAMS: Record<Sort, Pick<ReviewPageParams, "sortBy" | "sortOrder">> = {
  recent: { sortBy: "createdAt", sortOrder: "DESC" },
  high: { sortBy: "rating", sortOrder: "DESC" },
  low: { sortBy: "rating", sortOrder: "ASC" },
};
const reviewKey = (review: Review) => `${review.type}-${review.id}`;

export function LocationReviews({ listing, locale }: { listing: ListingDetail; locale: Locale }) {
  return <ReviewFeed key={listing.locationId} listing={listing} locale={locale} />;
}

function ReviewFeed({ listing, locale }: { listing: ListingDetail; locale: Locale }) {
  const { dict } = useTranslation();
  const t = dict.business;
  const copy = dict.locationPage;
  const [reviews, setReviews] = useState(listing.reviews);
  const [offset, setOffset] = useState(listing.reviews.length);
  const [total, setTotal] = useState(listing.reviewStats.totalCount);
  const [sort, setSort] = useState<Sort>("recent");
  const [pending, setPending] = useState<{ kind: RequestKind; sort: Sort } | null>(null);
  const [failure, setFailure] = useState<{ kind: RequestKind; sort: Sort; message: string } | null>(null);
  const [updated, setUpdated] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

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
  const stats = listing.reviewStats;
  const distributionTotal = Object.values(stats.ratingDistribution).reduce((sum, value) => sum + value, 0);

  async function fetchReviews(nextSort: Sort, kind: RequestKind) {
    request.current?.abort();
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
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure({
          kind,
          sort: nextSort,
          message: errorMessage(error, dict.errors, kind === "sort" ? copy.reviewsLoadError : t.loadMoreReviewsError),
        });
      }
    } finally {
      if (!controller.signal.aborted) {
        setPending(null);
        request.current = null;
      }
    }
  }

  if (stats.totalCount === 0 && reviews.length === 0 && !pending && !failure) {
    return <EmptyState icon="starO" title={t.reviewsEmptyTitle} body={t.reviewsEmptyBody} />;
  }

  const sorts: { key: Sort; label: string }[] = [
    { key: "recent", label: copy.reviewsNewest },
    { key: "high", label: copy.reviewsHighest },
    { key: "low", label: copy.reviewsLowest },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        <div className={styles.aggregate}>
          <span className={styles.average}>
            {stats.averageRating == null ? "—" : new Intl.NumberFormat(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }).format(stats.averageRating)}
          </span>
          {stats.averageRating != null && <Stars value={stats.averageRating} size={16} />}
          <span className={styles.count}>
            {format(stats.totalCount === 1 ? t.reviewsCountOne : t.reviewsCount, {
              count: numberFormat.format(stats.totalCount),
            })}
          </span>
        </div>
        <dl className={styles.distribution}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] ?? 0;
            return (
              <div key={rating} className={styles.distributionRow}>
                <dt>
                  <span aria-hidden="true">{rating}</span>
                  <span className={styles.srOnly}>{format(copy.starsCount, { count: String(rating) })}</span>
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

      <div className={styles.sorts} role="group" aria-label={copy.sortReviews}>
        {sorts.map((option) => (
          <Button
            key={option.key}
            kind={sort === option.key ? "primary" : "secondary"}
            size="sm"
            aria-pressed={sort === option.key}
            loading={pending?.kind === "sort" && pending.sort === option.key}
            onClick={() => {
              if (option.key !== sort || pending || failure) void fetchReviews(option.key, "sort");
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {failure?.kind === "sort" && (
        <div className={styles.recovery}>
          <InlineError>{failure.message}</InlineError>
          <Button kind="secondary" size="sm" onClick={() => void fetchReviews(failure.sort, "sort")}>
            {dict.errors.retry}
          </Button>
        </div>
      )}

      <p className={styles.srOnly} role="status" aria-live="polite">
        {pending ? copy.reviewsUpdating : updated ? copy.reviewsUpdated : ""}
      </p>
      <div className={styles.reviews} aria-busy={pending != null}>
        {reviews.map((review) => {
          const name = [review.customer?.firstName, review.customer?.lastName].filter(Boolean).join(" ").trim();
          const member = review.teamMember;
          const memberName = member ? [member.firstName, member.lastName].filter(Boolean).join(" ").trim() : "";
          const date = new Date(review.createdAt);
          return (
            <article key={reviewKey(review)} className={styles.review} aria-label={name ? format(copy.reviewedBy, { name }) : undefined}>
              <header className={styles.reviewHeader}>
                <Avatar src={review.customer?.profileImage ?? undefined} name={name || "?"} size={40} />
                <div className={styles.reviewer}>
                  <span className={styles.name}>{name || "—"}</span>
                  <Stars value={review.rating} size={12} />
                </div>
                {Number.isFinite(date.getTime()) && <time dateTime={review.createdAt} className={styles.date}>{dateFormat.format(date)}</time>}
              </header>
              {review.comment && <p className={styles.comment}>{review.comment}</p>}
              <p className={styles.target}>
                {review.type === "location" ? copy.locationReview : memberName
                  ? format(copy.reviewFor, { name: memberName })
                  : copy.teamMemberReview}
              </p>
            </article>
          );
        })}
        {pending && reviews.length === 0 && (
          <div aria-hidden="true" className={styles.skeletons}>
            {[0, 1, 2].map((index) => (
              <div className={styles.review} key={index}>
                <div className={styles.reviewHeader}>
                  <Skeleton w={40} h={40} r="50%" />
                  <div className={styles.reviewer}><Skeleton w={140} h={16} /><Skeleton w={80} h={12} /></div>
                </div>
                <Skeleton w="88%" h={16} style={{ marginTop: 16 }} />
                <Skeleton w="60%" h={16} style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        )}
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
          {failure?.kind === "more" && <InlineError>{failure.message}</InlineError>}
        </div>
      )}
    </div>
  );
}
