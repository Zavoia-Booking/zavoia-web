import clsx from "clsx";
import type { Locale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { formatPrice, getPlanPricing } from "@/lib/marketing/pricing";
import styles from "./team-seat-price.module.css";

/** Keep the paid-seat rate visible wherever a subscription price is presented. */
export function TeamSeatPrice({ locale, className }: { locale: Locale; className?: string }) {
  const t = dictionaries[locale].businessMarketing.plans.teamSeatPrice;
  const pricing = getPlanPricing(locale);

  return (
    <p className={clsx(styles.price, className)} data-team-seat-price="">
      <strong>{format(t.amount, { price: formatPrice(pricing.teamMember, pricing.currency) })}</strong>{" "}
      <span>{t.label}</span>
    </p>
  );
}
