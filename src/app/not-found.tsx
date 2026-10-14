import { dictionaries } from "@/i18n/dictionaries";
import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { NotFoundPage } from "@/app/_components/not-found/not-found-page";

// Last-resort boundary for misses outside a valid locale provider. Do not read
// headers/cookies here: this boundary can also be reached by cached routes.
// Unmatched URLs use global-not-found.tsx, which resolves their locale on the
// server; misses under a locale layout use that segment's contextual boundary.
export default function NotFound() {
  return (
    <div className={`${fontVariables} antialiased`}>
      <NotFoundPage dictionary={dictionaries[DEFAULT_LOCALE]} locale={DEFAULT_LOCALE} />
    </div>
  );
}
