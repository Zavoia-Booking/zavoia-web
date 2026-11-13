import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import styles from "./blog-post.module.css";

export function RelatedSectionTitle({
  title,
  action,
  href,
}: {
  title: string;
  action: string;
  href: string;
}) {
  return (
    <div className={styles.relatedHeading}>
      <h2>{title}</h2>
      <Link href={href} className={styles.archiveLink}>
        {action}
        <Icon name="arrowR" size={16} />
      </Link>
    </div>
  );
}
