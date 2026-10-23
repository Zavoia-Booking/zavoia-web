"use client";

import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { BookingSelectionItem } from "@/lib/booking";
import { formatSelectionSpread, formatServiceSpread } from "@/lib/format/money-time";
import styles from "./business-detail.module.css";

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

  return <>
    <aside className={styles.bookingRail} aria-label={t.bookHeading}>
      <div className={styles.railIdentity}><span className={styles.eyebrow}>{copy.selectionTitle}</span><h2>{props.displayName}</h2></div>
      {count > 0 ? <SelectionList {...props} /> : <p className={styles.bookingIntro}>{props.canBook ? copy.bookingIntro : unavailable}</p>}
      {count > 0 && <div className={styles.selectionTotal}><span>{props.totals.duration} {t.totalLabel}</span><strong>{price}</strong></div>}
      {action()}
      {!props.canBook && props.phone && <p className={styles.bookingNotice}>{unavailable}</p>}
    </aside>
    <div className={`${styles.mobileBooking} zw-mobile-actionbar`}>
      {count > 0 ? <details className={styles.selectionDisclosure}>
        <summary aria-label={`${copy.viewSelection}: ${price}, ${format(copy.selectionCount, { count: String(count) })}, ${props.totals.duration}`}><span><strong>{price}</strong><span>{format(copy.selectionCount, { count: String(count) })} · {props.totals.duration}</span></span><Icon name="back" size={14} /></summary>
        <div className={styles.mobileSelection}><h2>{copy.selectionTitle}</h2><SelectionList {...props} /></div>
      </details> : <div className={styles.mobileBookingPrompt}><strong>{props.displayName}</strong><span>{props.canBook ? dict.booking.stepServicesTitle : unavailable}</span></div>}
      {action(true)}
    </div>
  </>;
}

function SelectionList({ selectedItems, removePick, removeBundle, currency, locale, showPricing }: Props) {
  const { dict } = useTranslation();
  return <ul className={styles.selectionList}>{selectedItems.map(item => {
    const meta = formatServiceSpread(item, currency, locale);
    return <li key={item.serviceId != null ? `s-${item.serviceId}` : `b-${item.bundleId}`}>
      <span><strong>{item.name}</strong><span>{meta.duration}{showPricing && <> · {meta.priceVaries ? `${dict.business.priceFrom} ` : ""}{meta.price}</>}</span></span>
      <button type="button" aria-label={`${dict.business.remove} ${item.name}`} onClick={() => item.serviceId != null ? removePick(item.serviceId) : item.bundleId != null && removeBundle(item.bundleId)}><Icon name="x" size={15} /></button>
    </li>;
  })}</ul>;
}
