"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/useTranslation";
import styles from "@/app/_components/web-studio/web-studio.module.css";
import gallery from "@/app/_components/web-studio/showcase.module.css";

/** Keep the introduction and industry examples in place while the route is pending. */
export default function Loading() {
  const { dict } = useTranslation();
  return (
    <main aria-busy="true">
      <span className="sr-only" role="status">{dict.language.loading}</span>
      <div className={styles.hero} aria-hidden="true">
        <div className={`zw-container ${styles.heroLayout}`}>
          <div className={styles.heroCopy}>
            <Skeleton w="72%" h={76} style={{ marginInline: "auto" }} />
            <Skeleton w="80%" h={76} style={{ margin: "10px auto 0" }} />
            <Skeleton w="60%" h={24} style={{ margin: "24px auto 0" }} />
            <Skeleton w={220} h={54} r={32} style={{ margin: "26px auto 0" }} />
            <Skeleton w="50%" h={16} style={{ margin: "14px auto 0" }} />
          </div>
          <div className={styles.designCanvas}>
            <div className={gallery.examples}>
              {[0, 1, 2].map(index => <div key={index} className={gallery.example}>
                <Skeleton h={480} r={12} />
                <Skeleton w="75%" h={26} style={{ marginTop: 24 }} />
                <Skeleton w="90%" h={16} style={{ marginTop: 14 }} />
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
