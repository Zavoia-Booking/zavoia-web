import type { Locale } from "@/i18n/locales";
import { LanguageSwitcher } from "../language-switcher";
import styles from "./demo-language-picker.module.css";

/** Use the site's language navigation, sized for the floating controls. */
export function DemoLanguagePicker({ locale }: { locale: Locale }) {
  return (
    <div className={styles.picker} data-demo-language="">
      <LanguageSwitcher currentLocale={locale} alternates="same-path" placement="below" />
    </div>
  );
}
