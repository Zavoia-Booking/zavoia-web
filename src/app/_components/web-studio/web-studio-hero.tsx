import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import m from "@/app/_components/for-business/marketing.module.css";
import { WebsiteShowcase } from "./website-showcase";
import styles from "./web-studio.module.css";

/** One responsive opening for the authored page and its pending preview frames. */
export function WebStudioHero({ locale, hero, showcase, industries, exampleNote, pending = false }: {
  locale: Locale;
  hero: Dictionary["webStudio"]["hero"];
  showcase: Dictionary["webStudio"]["showcase"];
  industries: Dictionary["industries"];
  exampleNote: string;
  pending?: boolean;
}) {
  return (
    <section className={styles.hero} aria-labelledby="web-studio-title">
      <div className={`zw-container ${styles.heroLayout}`}>
        <div className={styles.heroCopy}>
          <h1 id="web-studio-title" className={styles.title}>
            <span>{hero.titleLead}</span>{" "}
            <span>{hero.titleBridge}{" "}<span className={m.signature}>{hero.titleAccent}</span></span>
          </h1>
          <p className={styles.heroLead}>{hero.lead}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href={localeHref(locale, "web-studio", "demo")}>{hero.demoCta}<span className={styles.heroArrow}><Icon name="arrowR" size={18} /></span></Link>
          </div>
        </div>
        <div className={styles.designCanvas} id="designs">
          <WebsiteShowcase locale={locale} copy={showcase} industries={industries} exampleNote={exampleNote} pending={pending} />
        </div>
      </div>
    </section>
  );
}
