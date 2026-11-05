"use client";

import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { BookingSelectionItem } from "@/lib/booking";
import { formatSelectionSpread, formatServiceSpread } from "@/lib/format/money-time";
import styles from "./location-booking-summary.module.css";

interface Props {
  selectedItems: BookingSelectionItem[];
  removePick: (id: number) => void;
  removeBundle: (id: number) => void;
  onBook: () => void;
  canBook: boolean;
  hasCatalog: boolean;
  showPricing: boolean;
  phone: string | null;
  displayName: string;
  totals: ReturnType<typeof formatSelectionSpread>;
  currency: string;
  locale: Locale;
}

export function LocationBookingSummary(props: Props) {
  const { dict } = useTranslation();
  const t = dict.business;
  const copy = dict.locationPage;
  const count = props.selectedItems.length;
  const label = count === 0 ? t.bookNow : format(count === 1 ? t.bookNOne : t.bookN, { count: String(count) });
  const price = props.showPricing ? `${props.totals.priceVaries ? `${t.priceFrom} ` : ""}${props.totals.price}` : copy.requestQuote;
  const unavailable = props.hasCatalog ? copy.bookingUnavailable : copy.catalogUnavailable;
  const action = (mobile = false) => props.canBook
    ? <Button kind="accent" size={mobile ? "md" : "lg"} onClick={props.onBook} aria-label={label} className={styles.bookAction}>{mobile ? t.bookNow : label}</Button>
    : props.phone
      ? <a href={`tel:${props.phone}`} className={styles.callAction}><Icon name="phone" size={17} />{t.call}</a>
      : <span className={styles.unavailableAction}>{copy.contactLocation}</span>;

  return (
    <>
      <aside className={styles.bookingRail} aria-label={t.bookHeading}>
        <div className={styles.summary}>
          <div className={styles.summaryBody}>
            <SummaryHeader displayName={props.displayName} count={count} />
            {count > 0 ? (
              <SelectionList {...props} />
            ) : (
              <p className={styles.bookingIntro}>{props.canBook ? copy.bookingIntro : unavailable}</p>
            )}
          </div>
          <div className={styles.summaryFooter}>
            {count > 0 && <SelectionTotal {...props} />}
            {action()}
            {!props.canBook && props.phone && count > 0 && <p className={styles.bookingNotice}>{unavailable}</p>}
          </div>
        </div>
      </aside>

      <div className={`${styles.mobileBooking} zw-mobile-actionbar`}>
        {count > 0 ? (
          <details className={styles.selectionDisclosure}>
            <summary aria-label={`${copy.viewSelection}: ${price}, ${format(copy.selectionCount, { count: String(count) })}, ${props.totals.duration}`}>
              <span>
                <strong>{price}</strong>
                <span>{format(copy.selectionCount, { count: String(count) })} · {props.totals.duration}</span>
              </span>
              <Icon name="back" size={14} />
            </summary>
            <div className={`${styles.summary} ${styles.mobileSelection}`}>
              <div className={styles.summaryBody}>
                <SummaryHeader displayName={props.displayName} count={count} />
                <SelectionList {...props} />
              </div>
              <div className={`${styles.summaryFooter} ${styles.mobileSummaryFooter}`}>
                <SelectionTotal {...props} />
              </div>
            </div>
          </details>
        ) : (
          <div className={styles.mobileBookingPrompt}>
            <strong>{props.displayName}</strong>
            <span>{props.canBook ? dict.booking.stepServicesTitle : unavailable}</span>
          </div>
        )}
        {action(true)}
      </div>
    </>
  );
}

function SummaryHeader({ displayName, count }: { displayName: string; count: number }) {
  const { dict } = useTranslation();
  return (
    <header className={styles.identity}>
      <div className={styles.summaryLabel}>
        <h2>{dict.locationPage.selectionTitle}</h2>
        {count > 0 && <span>{format(dict.locationPage.selectionCount, { count: String(count) })}</span>}
      </div>
      <p className={styles.venueName}>{displayName}</p>
    </header>
  );
}

function SelectionTotal({ totals, showPricing }: Props) {
  const { dict } = useTranslation();
  return (
    <div className={styles.selectionTotal}>
      <span className={styles.totalLabel}>{dict.business.totalLabel}</span>
      {showPricing
        ? <strong className={styles.totalAmount}>{totals.priceVaries && <span className={styles.priceFrom}>{dict.business.priceFrom} </span>}{totals.price}</strong>
        : <strong className={`${styles.totalAmount} ${styles.quote}`}>{dict.locationPage.requestQuote}</strong>}
      <span className={styles.totalDuration}>{totals.duration}</span>
    </div>
  );
}

function SelectionList({ selectedItems, removePick, removeBundle, currency, locale, showPricing }: Props) {
  const { dict } = useTranslation();
  const indexed = selectedItems.length > 1;
  return (
    <ol className={styles.selectionList} data-indexed={indexed || undefined} role="list">
      {selectedItems.map((item, index) => {
        const meta = formatServiceSpread(item, currency, locale);
        return (
          <li key={item.serviceId != null ? `s-${item.serviceId}` : `b-${item.bundleId}`}>
            {indexed && <span className={styles.itemIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>}
            <strong className={styles.itemName}>{item.name}</strong>
            <button type="button" className={styles.itemRemove} aria-label={`${dict.business.remove} ${item.name}`} onClick={() => item.serviceId != null ? removePick(item.serviceId) : item.bundleId != null && removeBundle(item.bundleId)}>
              <Icon name="x" size={14} />
            </button>
            <span className={styles.itemMeta}>
              <span className={styles.itemDuration}>{meta.duration}</span>
              {showPricing && <span className={styles.itemPrice}>{meta.priceVaries && <span>{dict.business.priceFrom} </span>}{meta.price}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
