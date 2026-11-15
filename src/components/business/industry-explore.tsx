import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { IndustryVisual } from "@/lib/marketplace/industry-visuals";
import styles from "./industry-explore.module.css";

interface IndustryExploreProps {
  href: string;
  industry: string;
  visual: IndustryVisual;
  lead: string;
  action: string;
  bottomDivider?: boolean;
}

/** Shared closing link for location and brand profiles. */
export function IndustryExplore({
  href,
  industry,
  visual,
  lead,
  action,
  bottomDivider = true,
}: IndustryExploreProps) {
  return (
    <div className={styles.root}>
      <Link href={href} prefetch={false} className={styles.link} data-bottom-divider={bottomDivider}>
        <span className={styles.text}>
          <span className={styles.title}>
            <Icon name={visual.icon} color={visual.accent} size={26} />
            <span>{industry}</span>
          </span>
          <span className={styles.lead}>{lead}</span>
        </span>
        <span className={styles.action}>
          {action}
          <Icon name="arrowR" size={13} />
        </span>
      </Link>
    </div>
  );
}
