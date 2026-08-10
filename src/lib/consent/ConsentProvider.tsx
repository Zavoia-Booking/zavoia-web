"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { readCookie } from "@/lib/auth/cookies";

// GDPR consent for analytics (Google Analytics is the only tracker).
// Opt-in model: GA is not loaded at all until the user grants consent —
// see AnalyticsGate. The choice is stored in a first-party cookie so it
// survives across visits and is shared by every page.

export const CONSENT_COOKIE_NAME = "zw-consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 12 months, then we re-ask

export type ConsentValue = "granted" | "denied";

interface ConsentContextValue {
  /** null = undecided (first visit) or not yet read on the client. */
  consent: ConsentValue | null;
  /** True once the cookie has been read client-side — gates the banner
   *  so returning visitors never see it flash during hydration. */
  ready: boolean;
  /** True when the banner was reopened via the footer "Cookies" link. */
  settingsOpen: boolean;
  grant: () => void;
  deny: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function writeConsentCookie(value: ConsentValue) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
}

// GA cookies (_ga, _ga_<stream>) are set on the registrable domain, so we
// expire each name against every ancestor domain — only the matching
// variant actually deletes anything, the rest are no-ops.
function clearAnalyticsCookies() {
  const names = document.cookie
    .split("; ")
    .map((pair) => pair.split("=")[0])
    .filter((name) => name === "_ga" || name === "_gid" || name.startsWith("_ga_"));
  const parts = window.location.hostname.split(".");
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const domain = parts.slice(i).join(".");
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}`;
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${domain}`;
    }
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Cookie must be read post-hydration: the server renders "undecided"
    // (no banner), so reading it during the first client render would
    // mismatch for returning visitors.
    const stored = readCookie(CONSENT_COOKIE_NAME);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "granted" || stored === "denied") setConsent(stored);
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    writeConsentCookie("granted");
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      // Lift GA's kill switch in case the user denied earlier this session.
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false;
    }
    setConsent("granted");
    setSettingsOpen(false);
  }, []);

  const deny = useCallback(() => {
    writeConsentCookie("denied");
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      // Official GA opt-out flag: if gtag.js is already loaded (user had
      // accepted earlier), this stops all further hits without a reload.
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
    }
    clearAnalyticsCookies();
    setConsent("denied");
    setSettingsOpen(false);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <ConsentContext.Provider
      value={{ consent, ready, settingsOpen, grant, deny, openSettings, closeSettings }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within <ConsentProvider>");
  return ctx;
}
