import { dictionaries } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { RootNotFoundBoundary } from "@/app/_components/not-found/not-found-boundary";

// Request-independent fallback for failures outside a valid locale layout.
// Keep dictionary packs on the server and pass only the copy this page uses.
export default function NotFound() {
  const { notFound, nav, language, localeNames } = dictionaries[DEFAULT_LOCALE];

  return (
    <RootNotFoundBoundary
      dictionary={{ notFound, nav, language, localeNames }}
      locale={DEFAULT_LOCALE}
    />
  );
}
