"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isBusinessMicrositePath } from "@/components/shell/active-route";
import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./locales";

export type LocaleAlternates = Partial<Record<Locale, string>>;

type Registration = {
  key: string;
  token: symbol;
  alternates: LocaleAlternates;
};

type LocaleNavigationContextValue = {
  registration: Registration | undefined;
  register: (pathname: string, alternates: LocaleAlternates) => () => void;
};

const LocaleNavigationContext = createContext<LocaleNavigationContextValue | null>(null);

/** Compare decoded route segments without confusing an encoded slash with a
 * segment separator. The English rewrite and its visible URL share one key.
 */
function routeIdentity(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === DEFAULT_LOCALE) segments.shift();
  return JSON.stringify(segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }));
}

/** Routes whose translated content can have different URL segments. A missing
 * page supplies explicit alternates instead; this function never guesses them.
 */
export function requiresLocaleAlternates(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] && isLocale(segments[0])) segments.shift();
  if (segments.length !== 2) return false;
  return segments[0] === "blog" || isBusinessMicrositePath(`/${segments[0]}`);
}

/** The URL remains the locale authority. This context only shares destinations
 * resolved by the active server page with the layout's navigation controls.
 */
export function LocaleNavigationProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<Registration>();
  const register = useCallback((pathname: string, alternates: LocaleAlternates) => {
    const token = Symbol("locale-alternates");
    setRegistration({ key: routeIdentity(pathname), token, alternates });
    return () => {
      setRegistration((current) => current?.token === token ? undefined : current);
    };
  }, []);
  const value = useMemo(() => ({ registration, register }), [registration, register]);

  return (
    <LocaleNavigationContext.Provider value={value}>
      {children}
    </LocaleNavigationContext.Provider>
  );
}

/** Server pages pass their authoritative alternatives across this small client
 * boundary. Until hydration registers them, consumers receive undefined rather
 * than links invented from an untranslated slug. An empty map is resolved.
 */
export function LocaleRouteAlternates({ pathname, alternates, currentLocale, label, localeNames }: {
  pathname: string;
  alternates: LocaleAlternates;
  currentLocale: Locale;
  label: string;
  localeNames: Record<Locale, string>;
}) {
  const register = useContext(LocaleNavigationContext)?.register;
  useEffect(() => register?.(pathname, alternates), [register, pathname, alternates]);
  const available = LOCALES.flatMap((locale) => {
    const href = alternates[locale];
    return href ? [{ locale, href }] : [];
  });

  if (!available.length) return null;
  return (
    <noscript>
      {/* Parent navigation cannot receive descendant route data during SSR.
          These exact server-provided destinations remain usable without JS. */}
      <nav
        className="zw-container"
        aria-label={label}
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15 }}
      >
        <span>{label}</span>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
          {available.map(({ locale, href }) => (
            <li key={locale}>
              <a
                href={href}
                hrefLang={locale}
                lang={locale}
                dir="auto"
                aria-current={locale === currentLocale ? "true" : undefined}
                className="zw-link"
                style={{ display: "inline-flex", alignItems: "center", minHeight: 44, textDecoration: "underline" }}
              >
                {localeNames[locale]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </noscript>
  );
}

/** Ignore a previous page's registration immediately after route navigation,
 * even before its effect cleanup runs. Global 404s need no provider.
 */
export function useLocaleAlternates(pathname: string): LocaleAlternates | undefined {
  const registration = useContext(LocaleNavigationContext)?.registration;
  return registration?.key === routeIdentity(pathname) ? registration.alternates : undefined;
}
