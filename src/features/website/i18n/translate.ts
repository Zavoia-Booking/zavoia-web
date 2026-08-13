/**
 * Minimal i18next-compatible `t` for the copied microsite renderer.
 *
 * The admin-dashboard preview resolves copy through react-i18next's `website`
 * namespace; on the public site the same strings ship as the trimmed JSON files
 * in this folder and are resolved with the same semantics the preview relies on:
 * nested dot-path keys, `{{var}}` interpolation, and Intl.PluralRules-based
 * `_one` / `_few` / `_other` suffix selection for options carrying `count`.
 */
import websiteEn from "./website.en.json";
import websiteRo from "./website.ro.json";
import tagsEn from "./tags.en.json";
import tagsRo from "./tags.ro.json";
import type { T } from "../components/builder/preview/shared/types";

export type MicrositeLocale = "en" | "ro";

type Dict = Record<string, unknown>;

const WEBSITE_DICTS: Record<MicrositeLocale, Dict> = {
  en: websiteEn as Dict,
  ro: websiteRo as Dict,
};

const TAGS_DICTS: Record<MicrositeLocale, Dict> = {
  en: tagsEn as Dict,
  ro: tagsRo as Dict,
};

function lookup(dict: Dict, key: string): unknown {
  let current: unknown = dict;
  for (const part of key.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Dict)[part];
  }
  return current;
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();

function pluralRules(locale: MicrositeLocale): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale === "ro" ? "ro-RO" : "en");
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

function interpolate(template: string, options: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) =>
    name in options ? String(options[name]) : match,
  );
}

/** i18next-compatible `t` bound to the `website` namespace for `locale`. */
export function createWebsiteT(locale: MicrositeLocale): T {
  const dict = WEBSITE_DICTS[locale] ?? WEBSITE_DICTS.en;
  return (key: string, options?: Record<string, unknown>): string => {
    let raw: unknown;
    if (options && typeof options.count === "number") {
      const rule = pluralRules(locale).select(options.count);
      raw = lookup(dict, `${key}_${rule}`) ?? lookup(dict, `${key}_other`) ?? lookup(dict, key);
    } else {
      raw = lookup(dict, key);
    }
    // i18next falls back to the key itself when a string is missing.
    if (typeof raw !== "string") return key;
    return options ? interpolate(raw, options) : raw;
  };
}

/**
 * Localized display label for a marketplace tag — mirrors the dashboard's
 * `t("tags.<group>.<slug>", entry.name)` (localized value when present, else
 * the backend-provided canonical English name).
 */
export function resolveTagLabel(
  locale: MicrositeLocale,
  group: "amenities" | "paymentMethods" | "languages",
  slug: string,
  fallbackName: string,
): string {
  const dict = TAGS_DICTS[locale] ?? TAGS_DICTS.en;
  const raw = lookup(dict, `tags.${group}.${slug}`);
  return typeof raw === "string" ? raw : fallbackName;
}
