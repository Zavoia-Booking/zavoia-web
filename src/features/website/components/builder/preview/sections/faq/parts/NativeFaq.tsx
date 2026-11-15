import { Plus } from "lucide-react";
import { localized } from "../../../shared/util";
import type { FaqVariantProps } from "../types";

/** All answers are server-rendered and each disclosure works before hydration. */
export function NativeFaq({ items, locale }: Pick<FaqVariantProps, "items" | "locale">) {
  return (
    <div className="mc-faq">
      {items.map((item, index) => (
        <details key={index} className="mc-faq-item" open={index === 0}>
          <summary className="mc-faq-q">
            <span className="mc-faq-q-text">{localized(item.q, locale)}</span>
            <span className="mc-faq-ic" aria-hidden="true"><Plus size={16} strokeWidth={2} /></span>
          </summary>
          <div className="mc-faq-a-inner">{localized(item.a, locale)}</div>
        </details>
      ))}
    </div>
  );
}
