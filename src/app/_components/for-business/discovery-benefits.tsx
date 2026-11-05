import { DiscoveryFeatureArt } from "./discovery-feature-art";
import styles from "./discovery-benefits.module.css";

const artwork = ["services", "availability", "reviews", "bookingLink"] as const;

/** Visible client benefits, with one reading column beside each illustration. */
export function DiscoveryBenefits({ points }: { points: readonly { title: string; body: string }[] }) {
  return (
    <ul className={styles.benefits} role="list">
      {points.map((point, index) => (
        <li className={styles.benefit} key={point.title} data-discovery-feature={artwork[index]}>
          <div className={styles.illustration} aria-hidden="true">
            <DiscoveryFeatureArt kind={artwork[index]} />
          </div>
          <div className={styles.copy}>
            <h3 className={styles.heading}>{point.title}</h3>
            <p className={styles.description}>{point.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
