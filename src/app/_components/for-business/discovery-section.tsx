import Link from "next/link";
import clsx from "clsx";
import { Icon } from "@/components/ui/icon";
import { dictionaries } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { DiscoveryArtwork } from "./discovery-artwork";
import { DiscoveryBenefits } from "./discovery-benefits";
import m from "./marketing.module.css";
import styles from "./discovery-section.module.css";

/** Marketing benefits stay visible beside the mobile-led product illustration. */
export function DiscoverySection({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const t = dict.forBusiness.found;

  return (
    <section className={styles.section} aria-labelledby="found-title">
      <div className={clsx("zw-container", styles.layout)}>
        <div className={styles.intro}>
          <h2 className={m.h2} id="found-title">{t.title}</h2>
          <p className={clsx(m.lead, styles.lead)}>{t.lead}</p>
        </div>

        <div className={styles.artwork}>
          <DiscoveryArtwork locale={locale} />
        </div>

        <DiscoveryBenefits points={t.points} />

        <Link className={clsx(m.textLink, styles.explore, styles.action)} href={localeHref(locale, "search")}>
          {t.cta}<Icon name="arrowR" size={16} />
        </Link>
      </div>
    </section>
  );
}
