import type { Locale } from "@/i18n/locales";
import { SITE_URL } from "@/lib/site";
import { organizationId, websiteId } from "./site-identity";

/** Preserve the merchant identity already shared by brand, branch and website pages. */
export const merchantId = (businessId: number) => `${SITE_URL}/#business-${businessId}`;
export const webPageId = (path: string) => `${SITE_URL}${path}#webpage`;

export type FaqItem = Readonly<{
  q: string;
  a: string;
  link?: { label: string; href: string };
}>;

/** Accept the final displayed answers, after locale selection and interpolation. */
export function faqQuestions(items: readonly FaqItem[]) {
  return items.flatMap(({ q, a, link }) => {
    const question = q.trim();
    const answer = a.trim();
    if (!question || !answer) return [];
    return [{
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: link ? `${answer}\n\n${link.label} (${new URL(link.href, SITE_URL).href})` : answer,
      },
    }];
  });
}

/** One page identity; articles, applications and merchants remain separate entities. */
export function webPageNode(input: {
  locale: Locale;
  path: string;
  name: string;
  description?: string;
  type?: "WebPage" | "CollectionPage" | "ProfilePage";
  mainEntityId?: string;
  breadcrumbId?: string;
  faqItems?: readonly FaqItem[];
  publisherId?: string;
}): Record<string, unknown> {
  const questions = faqQuestions(input.faqItems ?? []);
  return {
    "@type": questions.length ? "FAQPage" : input.type ?? "WebPage",
    "@id": webPageId(input.path),
    url: `${SITE_URL}${input.path}`,
    name: input.name,
    inLanguage: input.locale,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": input.publisherId ?? organizationId },
    ...(input.description?.trim() && { description: input.description.trim() }),
    ...(input.breadcrumbId && { breadcrumb: { "@id": input.breadcrumbId } }),
    ...(questions.length
      ? { mainEntity: questions, ...(input.mainEntityId && { about: { "@id": input.mainEntityId } }) }
      : input.mainEntityId ? { mainEntity: { "@id": input.mainEntityId } } : {}),
  };
}
