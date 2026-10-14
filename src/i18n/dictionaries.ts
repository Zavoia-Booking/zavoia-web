import "server-only";
import type { Locale } from "./locales";
import { en } from "./dictionaries/en";
import { ro } from "./dictionaries/ro";

// English defines the shared shape; Romanian is checked against it.
// Runtime packs stay on the server. Client components receive the selected
// dictionary through I18nProvider; type-only imports remain safe anywhere.
export type Dictionary = typeof en;
export const dictionaries: Record<Locale, Dictionary> = { en, ro };
