"use client";

import Link from "next/link";
import { Img } from "@/components/ui/image";
import { Icon } from "@/components/ui/icon";
import { Rating } from "@/components/ui/rating";
import { HeartButton } from "@/components/ui/heart-button";
import { useTranslation } from "@/i18n/useTranslation";
import { industryAccent, industryIcon } from "@/lib/marketplace/industry-visuals";
import type { BusinessCardData } from "./types";
import styles from "./business-row.module.css";

export interface BusinessRowProps {
  b: BusinessCardData;
  onClick?: () => void;
  favorited?: boolean | null;
  /** Favorite handler — the heart only renders when provided. */
  onFavorite?: (id: BusinessCardData["id"]) => void;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "high" | "low" | "auto";
}

// Search result ticket: the location lives on its photo; the adjacent panel
// carries category, address, rating and a compact distance/status footer.
export function BusinessRow({
  b,
  onClick,
  favorited,
  onFavorite,
  imageLoading,
  imageFetchPriority,
}: BusinessRowProps) {
  const { dict } = useTranslation();
  const locationName = b.locationName?.trim() || b.name;
  const businessName = b.businessName?.trim();
  const showBusinessName = businessName && businessName.toLowerCase() !== locationName.toLowerCase();
  const cardName = [locationName, showBusinessName ? businessName : null, b.city].filter(Boolean).join(", ");
  const address = b.address?.trim() || b.blurb?.trim();
  const distanceOrCity = b.distance || b.city;
  const alwaysOpen = b.status === "24-7" || b.status === "24/7";
  const isOpen = b.status === "open" || alwaysOpen;
  const statusLabel = alwaysOpen ? dict.common.open247 : isOpen ? dict.common.open : dict.common.closed;

  return (
    <div className={styles.row}>
      <div className={styles.photo}>
        <Img data-result-photo src={b.image} alt={cardName} label={b.catLabel} sizes="120px" loading={imageLoading} fetchPriority={imageFetchPriority} className={styles.image} />
        <div className={styles.shade} aria-hidden="true" />
        <div className={styles.identity}>
          <span className={styles.name} title={locationName}>{locationName}</span>
          {showBusinessName && <span className={styles.businessName} title={businessName}>{businessName}</span>}
        </div>
      </div>
      <div className={styles.content}>
        {b.catLabel && (
          <div className={styles.category}>
            <Icon name={industryIcon(b.cat)} size={14} color={industryAccent(b.cat)} />
            <span title={b.catLabel}>{b.catLabel}</span>
          </div>
        )}
        {address && <div className={styles.address} title={address}>{address}</div>}
        {(b.rating != null || distanceOrCity || b.status) && (
          <div className={styles.metadata}>
            {b.rating != null && (
              <div className={styles.rating}><Rating rating={b.rating} reviews={b.reviews} size={12.5} /></div>
            )}
            {(distanceOrCity || b.status) && (
              <div className={styles.footer}>
                {distanceOrCity && <span className={styles.distance} title={distanceOrCity}>{distanceOrCity}</span>}
                {b.status && <span className={`${styles.status} ${isOpen ? styles.open : styles.closed}`}>{statusLabel}</span>}
              </div>
            )}
          </div>
        )}
      </div>
      {b.href ? (
        <Link href={b.href} title={cardName} aria-label={cardName} className={styles.action} />
      ) : onClick ? (
        <button type="button" onClick={onClick} aria-label={cardName} className={styles.action} />
      ) : null}
      {onFavorite && (
        <div className={styles.favorite}>
          <HeartButton active={favorited} onClick={() => onFavorite(b.id)} size={44} iconSize={18} floating={false} />
        </div>
      )}
    </div>
  );
}
