"use client";

import { useTranslation } from "@/i18n/useTranslation";
import { usePathname } from "next/navigation";
import { isFullBleedPath } from "@/components/shell/active-route";
import { DemoPageSkeleton } from "@/app/_components/try/demo-loading";
import { WebStudioHero } from "@/app/_components/web-studio/web-studio-hero";
import { caveat } from "@/styles/fonts";
import styles from "@/app/_components/web-studio/web-studio.module.css";

/** Keep known copy and the actual responsive frames in place while previews load. */
export default function Loading() {
  const { dict, locale } = useTranslation();
  const pathname = usePathname();
  // This parent boundary can appear before the nested demo segment resolves.
  if (isFullBleedPath(pathname)) return <DemoPageSkeleton />;
  return (
    <main aria-busy="true" data-studio-loading="">
      <span className="sr-only" role="status">{dict.language.loading}</span>
      <div className={`${styles.page} ${caveat.variable}`} data-web-studio="" data-locale={locale}>
        <WebStudioHero locale={locale} hero={dict.webStudio.hero} showcase={dict.webStudio.showcase} industries={dict.industries} exampleNote={dict.marketingExamples.websites} pending />
      </div>
    </main>
  );
}
