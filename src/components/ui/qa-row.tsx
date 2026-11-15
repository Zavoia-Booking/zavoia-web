import disclosure from "./disclosure-motion.module.css";
import faq from "@/app/_components/for-business/faq-section.module.css";
import styles from "./qa-row.module.css";

type QARowProps = {
  item: { q: string; a: string };
};

/** Shared Help/article disclosure. Answers are visible in the server HTML. */
export function QARow({ item }: QARowProps) {
  return (
    <details open className={`${faq.item} ${styles.item} ${disclosure.root} ${disclosure.native}`}>
      <summary className={`${faq.question} ${styles.question}`}>
        <h3>{item.q}</h3>
        <span className={faq.toggle} aria-hidden="true" />
      </summary>
      <div className={disclosure.body}>
        <div className={`${faq.answer} ${styles.answer}`}>
          {item.a.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </div>
    </details>
  );
}
