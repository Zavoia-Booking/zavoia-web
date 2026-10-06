import { ArrowRight } from "lucide-react";
import { useMicrositeActions } from "../../../shared/actions";

function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

interface AnnoCtaProps {
  label: string;
  url: string;
  newTab: boolean;
  showArrow: boolean;
  appearance?: "bar" | "dialog";
}

/** Only published websites navigate, and only to valid HTTP(S) announcement links. */
export function AnnoCta({
  label,
  url,
  newTab,
  showArrow,
  appearance = "bar",
}: AnnoCtaProps) {
  const actions = useMicrositeActions();
  const href = safeExternalUrl(url);
  const content = <>{label}{showArrow && <ArrowRight className="mc-anno-arrow" strokeWidth={2} aria-hidden />}</>;
  const className = appearance === "dialog" ? "mc-anno-details-action" : "mc-anno-link";
  if (!href) return <span className={className}>{content}</span>;
  return (
    <a
      className={className}
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onClick={actions ? undefined : (event) => event.preventDefault()}
    >
      {content}
    </a>
  );
}
