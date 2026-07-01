"use client";

import { useRouter } from "next/navigation";
import { SectionTitle } from "@/components/ui/section-title";

export interface RelatedSectionTitleProps {
  kicker: string;
  title: string;
  action: string;
  href: string;
}

// Thin client wrapper around SectionTitle for the post page's "Related
// stories" header. SectionTitle is itself a client component whose `onAction`
// is a callback, so the navigation has to originate on the client — this lets
// the server BlogPost stay a server component while reusing SectionTitle as-is.
export function RelatedSectionTitle({
  kicker,
  title,
  action,
  href,
}: RelatedSectionTitleProps) {
  const router = useRouter();
  return (
    <SectionTitle
      kicker={kicker}
      title={title}
      action={action}
      onAction={() => router.push(href)}
    />
  );
}
