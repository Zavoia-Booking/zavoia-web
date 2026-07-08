import type { Locale } from "@/i18n/locales";
import { dictionaries, format } from "@/i18n/dictionaries";
import { CtaBand, FaqList, PageHead, SectionTitle } from "@/components/ui";
import { getPricing } from "@/lib/marketing/pricing";
import { PricingCalc } from "./pricing-calc";
import { PricingCompare } from "./pricing-compare";

// Pricing page composition (server component). Mirrors ZwPricingPage
// (docs/web-pricing.jsx:252-272): page head → plan+calculator → "the
// difference" receipt → FAQ → CTA band. Prices come from the PRICING
// constant and are interpolated into the i18n copy.
export function PricingContent({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].pricing;
  const pricing = getPricing(locale);
  const trial = String(pricing.trialDays);

  const faqItems = t.faq.items.map((it) => ({
    q: it.q,
    a: format(it.a, { trial }),
  }));

  return (
    <main>
      <PageHead
        kicker={t.head.kicker}
        title={t.head.title}
        sub={format(t.head.sub, {
          monthly: String(pricing.monthly),
        })}
      />

      <PricingCalc copy={{ plan: t.plan, calc: t.calc }} />

      <PricingCompare copy={t.compare} />

      <section
        className="zw-container"
        style={{
          paddingTop: "clamp(64px, 8vw, 96px)",
          maxWidth: "min(var(--content-max), 860px)",
        }}
      >
        <SectionTitle kicker={t.faq.kicker} title={t.faq.title} />
        <FaqList items={faqItems} />
      </section>

      <CtaBand
        kicker={t.cta.kicker}
        title={t.cta.title}
        sub={format(t.cta.sub, { trial })}
        primaryLabel={t.cta.primary}
      />
    </main>
  );
}
