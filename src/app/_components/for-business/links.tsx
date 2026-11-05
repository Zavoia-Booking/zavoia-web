import clsx from "clsx";
import { Icon } from "@/components/ui/icon";
import { BUSINESS_APP_URL } from "@/lib/env";
import type { Locale } from "@/i18n/locales";
import styles from "./marketing.module.css";

/** Business dashboard sign-up and sign-in, both on the business app. */
export const REGISTER_URL = `${BUSINESS_APP_URL}/register`;
export const SIGN_IN_URL = `${BUSINESS_APP_URL}/login`;

/** The dashboard validates this explicit language choice before rendering registration. */
export function registrationHref(locale: Locale): string {
  const url = new URL(REGISTER_URL);
  url.searchParams.set("lang", locale);
  return url.toString();
}

/** The free-trial action: a pill link to business sign-up. Ink is the
 * default; `line` is the quieter pill beside an ink one. */
export function TrialLink({
  label,
  tone = "ink",
  arrow = false,
  className,
  locale,
}: {
  label: string;
  tone?: "ink" | "line";
  arrow?: boolean;
  className?: string;
  locale?: Locale;
}) {
  return (
    <a
      href={locale ? registrationHref(locale) : REGISTER_URL}
      className={clsx(styles.button, tone === "ink" ? styles.buttonInk : styles.buttonLine, className)}
    >
      {label}
      {arrow && <Icon name="arrowR" size={16} />}
    </a>
  );
}
