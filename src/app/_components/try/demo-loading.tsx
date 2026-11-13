"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Shuffle } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { SECTION_TYPES } from "@/features/website/components/builder/sectionCatalog";
import controls from "./demo-controls.module.css";
import demo from "./demo.module.css";
import styles from "./demo-loading.module.css";

/** The renderer fills the measured stage, including scaled device previews. */
export function DemoPreviewSkeleton({ announce = true }: { announce?: boolean }) {
  const { dict } = useTranslation();
  return (
    <div aria-busy="true" data-demo-preview-loading="">
      {announce && <span className={demo.srOnly} role="status">{dict.language.loading}</span>}
      <div aria-hidden="true"><Skeleton h="var(--mc-vph, 100dvh)" r={0} /></div>
    </div>
  );
}

/** Match the demo's canvas and initial control state while the route resolves. */
export function DemoPageSkeleton() {
  const { dict } = useTranslation();
  return (
    <div className={`${demo.shell} ${styles.loading}`} aria-busy="true" data-demo-page-loading="">
      <span className={demo.srOnly} role="status">{dict.language.loading}</span>
      <div className={demo.canvas}>
        <div className={`${demo.viewport} ${styles.viewport}`}>
          <main className={`${demo.stage} ${styles.stage}`} aria-label={dict.tryStudio.previewLabel}>
            <DemoPreviewSkeleton announce={false} />
          </main>
        </div>
      </div>

      <div className={`${demo.floatingPanel} ${styles.panel}`} aria-hidden="true" inert>
        <div className={demo.panelHeader}>
          <span className={styles.rail} />
          <span className={demo.back}><Skeleton w={22} h={22} r={6} /></span>
          <span className={styles.title}>{dict.tryStudio.panelTitle}</span>
          <Skeleton w={40} h={40} r="50%" />
        </div>
        <div className={demo.panelBody}>
          <div className={demo.previewTools}>
            <Skeleton w={132} h={48} r={12} />
            <Skeleton w={160} h={40} r={8} />
          </div>
          <div className={controls.controls}>
            <div className={`${controls.scrollArea} ${styles.settings}`}>
              <div className={styles.example}>
                <Skeleton w={40} h={40} r={10} />
                <div className={styles.exampleCopy}><Skeleton w="65%" h={20} /><Skeleton w="45%" h={18} /></div>
              </div>
              <div className={styles.colours}>
                <Skeleton w={64} h={20} />
                <div className={styles.swatches}>{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} w={30} h={30} r="50%" />)}</div>
              </div>
              <div className={styles.font}><Skeleton w={48} h={20} /><Skeleton w={112} h={24} /></div>
              <Skeleton w={72} h={18} style={{ marginBlock: 16 }} />
              {SECTION_TYPES.map(type => <div key={type} className={styles.sectionRow}>
                <Skeleton w={19} h={19} r={4} />
                <Skeleton w="42%" h={18} />
                <Skeleton w={38} h={22} r={99} style={{ marginInlineStart: "auto" }} />
              </div>)}
            </div>
            <div className={controls.footer}>
              <div className={controls.keepGroup}>
                <Skeleton w="65%" h={18} style={{ marginBottom: 8 }} />
                <div className={controls.keepButtons}>{[0, 1, 2].map(index => <Skeleton key={index} h={42} r={8} />)}</div>
              </div>
              <div className={controls.footerActions}><Skeleton w="80%" h={20} /><Skeleton h={48} r={99} /></div>
              <Skeleton w="90%" h={30} />
            </div>
          </div>
        </div>
      </div>

      <div className={`${demo.launcher} ${styles.compact}`} aria-hidden="true" inert>
        <span className={styles.rail} />
        <span className={demo.back}><Skeleton w={22} h={22} r={6} /></span>
        <span className={styles.title}>Web Studio</span>
        <span className={demo.launcherShuffle}>{dict.tryStudio.shuffleCompact}<Shuffle size={16} /></span>
        <span className={`${demo.customize} ${demo.launcherCustomize}`}><Skeleton w={18} h={18} r={4} /></span>
      </div>
    </div>
  );
}
