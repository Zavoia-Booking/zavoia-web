import Image, { getImageProps } from "next/image";
import Link from "next/link";
import editorEn from "../../../../public/images/web-studio/setup-editor-en.webp";
import editorRo from "../../../../public/images/web-studio/setup-editor-ro.webp";
import detailEn from "../../../../public/images/web-studio/setup-detail-en.webp";
import detailRo from "../../../../public/images/web-studio/setup-detail-ro.webp";
import phoneEn from "../../../../public/images/web-studio/setup-phone-en.webp";
import phoneRo from "../../../../public/images/web-studio/setup-phone-ro.webp";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { SetupReveal } from "./setup-reveal";
import frame from "./preview-device.module.css";
import marketing from "@/app/_components/for-business/marketing.module.css";
import styles from "./setup-section.module.css";

const captures = {
  en: { editor: editorEn, detail: detailEn, phone: phoneEn },
  ro: { editor: editorRo, detail: detailRo, phone: phoneRo },
};

/** Static captures of the real dashboard. Editing remains in the separate demo. */
export function SetupSection({ locale, copy, pending }: {
  locale: Locale;
  copy: Dictionary["webStudio"]["setup"];
  pending: boolean;
}) {
  const capture = captures[locale];
  const editor = getImageProps({
    src: capture.editor,
    alt: copy.editorAlt,
    sizes: "(max-width: 1440px) 75vw, 1050px",
  }).props;
  const detail = getImageProps({
    src: capture.detail,
    alt: copy.editorAlt,
    sizes: "(max-width: 360px) calc(100vw - 42px), 320px",
  }).props;

  return (
    <section className={styles.section} aria-labelledby="setup-title" data-studio-setup="">
      <div className="zw-container">
        <header className={styles.header}>
          <h2 id="setup-title" className={marketing.h2}>{copy.title}</h2>
          <p>{copy.lead}</p>
        </header>
        <SetupReveal locale={locale}>
          <div className={styles.workspace}>
            <div className={styles.controlsCopy}>
              {copy.steps.slice(0, 2).map(step => (
                <div key={step.title} className={styles.caption}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
            <figure className={styles.editor} data-setup-visual="">
              {pending ? <Skeleton h="100%" r={0} className={styles.editorSkeleton} /> : (
                <picture>
                  <source media="(max-width: 1100px)" srcSet={detail.srcSet} sizes={detail.sizes} width={detail.width} height={detail.height} />
                  {/* getImageProps supplies Next's responsive optimization for both captures. */}
                  <img {...editor} alt={copy.editorAlt} />
                </picture>
              )}
            </figure>
          </div>
          <div className={styles.phoneStory}>
            <div className={styles.caption}>
              <h3>{copy.steps[2].title}</h3>
              <p>{copy.steps[2].body}</p>
            </div>
            <figure className={`${styles.phoneFigure} ${frame.preview}`} data-setup-visual="">
              <div className={frame.phone}>
                <div className={frame.glass}>
                  {pending ? <Skeleton h="100%" r={0} style={{ aspectRatio: `${capture.phone.width} / ${capture.phone.height}` }} /> : (
                    <Image src={capture.phone} alt={copy.phoneAlt} sizes="(max-width: 700px) 220px, 240px" />
                  )}
                </div>
              </div>
            </figure>
          </div>
        </SetupReveal>
        <div className={styles.footer}>
          <p className={styles.note}><Icon name="check" size={17} /><span>{copy.note}</span></p>
          <Link className={styles.demoLink} href={localeHref(locale, "web-studio", "demo")}>
            {copy.demoLink}<Icon name="arrowR" size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
