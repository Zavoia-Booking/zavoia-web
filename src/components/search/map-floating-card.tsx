"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { BusinessCardData } from "@/components/business";
import { HeartButton } from "@/components/ui/heart-button";
import { Img } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import styles from "./map-floating-card.module.css";

export interface MapFloatingCardProps {
  data: BusinessCardData | null;
  onClose: () => void;
  closeAria: string;
  favorited?: boolean | null;
  /** The heart only renders when a favorite action is available. */
  onFavorite?: (id: BusinessCardData["id"]) => void;
  /** Distance from the bottom of the map area. */
  bottomOffset?: number;
  /** Left inset of the card region (e.g. past the desktop results panel). */
  insetLeft?: string;
  /** Right inset of the card region. */
  insetRight?: string;
}

// Key the selection's lifecycle so dismissing and quickly choosing another pin
// cannot run an old close timer against the new card.
export function MapFloatingCard(props: MapFloatingCardProps) {
  if (!props.data) return null;
  return <SelectedLocationCard key={props.data.id} {...props} data={props.data} />;
}

function SelectedLocationCard({
  data,
  onClose,
  closeAria,
  favorited,
  onFavorite,
  bottomOffset = 28,
  insetLeft = "0px",
  insetRight = "0px",
}: Omit<MapFloatingCardProps, "data"> & { data: BusinessCardData }) {
  const { dict } = useTranslation();
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const locationName = data.locationName?.trim() || data.name;
  const businessName = data.businessName?.trim();
  const showBusinessName = businessName && businessName.toLowerCase() !== locationName.toLowerCase();
  const cardName = [locationName, showBusinessName ? businessName : null, data.city].filter(Boolean).join(", ");
  const metadata = [data.city, data.distance].filter(Boolean).join(" · ");
  const reviewLabel = data.reviews != null
    ? format(data.reviews === 1 ? dict.business.reviewsCountOne : dict.business.reviewsCount, { count: String(data.reviews) })
    : null;

  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    timerRef.current = window.setTimeout(onClose, 180);
  };

  return (
    <div
      className={styles.position}
      style={{ left: insetLeft, right: insetRight, bottom: bottomOffset }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={[styles.card, "zw-zoom-parent", closing && styles.closing].filter(Boolean).join(" ")}>
        <div className={`${styles.photo} zw-zoom-wrap`}>
          <Img
            src={data.image}
            alt={cardName}
            label=""
            loading="eager"
            sizes="(min-width: 921px) 520px, (max-width: 480px) calc(100vw - 32px), 430px"
            className={styles.image}
          />
        </div>
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.topShade} aria-hidden="true" />
        <div className={styles.info}>
          <p className={styles.name} title={locationName}>{locationName}</p>
          {showBusinessName && <p className={styles.businessName} title={businessName}>{businessName}</p>}
          {metadata && <p className={styles.meta} title={metadata}>{metadata}</p>}
          {data.rating != null && (
            <div className={styles.rating}>
              <span className={styles.ratingNumber}>{data.rating.toFixed(1)}</span>
              <div className={styles.ratingDetails}>
                <span className={styles.stars} aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const fraction = Math.max(0, Math.min(1, data.rating! - index));
                    return (
                      <span className={styles.star} key={index}>
                        <Icon name="star" size={12} color="rgba(255,255,255,.32)" />
                        <span className={styles.starFill} style={{ width: `${fraction * 100}%` }}>
                          <Icon name="star" size={12} color="#fff" />
                        </span>
                      </span>
                    );
                  })}
                </span>
                {reviewLabel && <span className={styles.reviewCount}>{reviewLabel}</span>}
              </div>
            </div>
          )}
        </div>
        {data.href && <Link href={data.href} title={cardName} aria-label={cardName} className={styles.action} />}
        <button type="button" className={`${styles.close} tap`} aria-label={closeAria} title={closeAria} onClick={close}>
          <Icon name="x" size={16} />
        </button>
        {onFavorite && (
          <div className={styles.favorite}>
            <HeartButton active={favorited} onClick={() => onFavorite(data.id)} size={44} iconSize={18} floating={false} />
          </div>
        )}
      </div>
    </div>
  );
}
