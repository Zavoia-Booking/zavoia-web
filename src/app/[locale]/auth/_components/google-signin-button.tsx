"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/env";

// Minimal typing of the Google Identity Services (GIS) surface we use. GIS is
// loaded at runtime from https://accounts.google.com/gsi/client (no npm
// dependency), so we declare just the `window.google.accounts.id` shape that
// this component touches. See:
// https://developers.google.com/identity/gsi/web/reference/js-reference
type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};

type GoogleIdConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
};

type GoogleButtonConfig = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
  locale?: string;
};

type GoogleIdApi = {
  initialize: (config: GoogleIdConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdApi;
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

// The GIS-rendered button is capped at 400px wide and 40px tall (size:
// "large"). The visible custom button can be any size, so the hidden GIS
// button is scaled up to cover it and catch the clicks.
const GSI_WIDTH = 400;
const GSI_HEIGHT = 40;

type Props = {
  /** Drives the GIS button label ("continue_with" works for both flows). */
  text?: GoogleButtonConfig["text"];
  /** GIS button locale ("en" | "ro"). */
  locale?: string;
  /** Receives the Google ID token (a JWT) from the credential callback. */
  onCredential: (idToken: string) => void;
};

/** Google "G" mark, per brand guidelines — used on the visible custom button. */
function GoogleG() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Google sign-in button: a custom, full-width visual (matching the
 * admin-dashboard design — white outline button with the Google G) with the
 * REAL GIS-rendered button stretched invisibly on top to receive clicks.
 * The credential flow needs the genuine GIS button (a custom button cannot
 * trigger the ID-token picker), but the GIS iframe caps at 400px wide and
 * can't fill its parent — hence the overlay. Hands the returned ID token up
 * through `onCredential`. Renders nothing when GOOGLE_CLIENT_ID is unset
 * (feature flag). The GIS script is loaded once via next/script with the
 * default `afterInteractive` strategy (per
 * node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md):
 * next/script deduplicates by `src`, so multiple instances do not double-load.
 *
 * The script URL carries `?hl=<locale>`: GIS localizes the button from the
 * script's own language bundle (falling back to the browser language) and
 * ignores the `locale` field in renderButton once that bundle is loaded, so
 * the site locale must be pinned at script-load time.
 */
export function GoogleSignInButton({
  text = "continue_with",
  locale,
  onCredential,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [scriptReady, setScriptReady] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.google?.accounts?.id),
  );

  // Keep the invisible GIS button stretched over the visible one.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setScale({ x: rect.width / GSI_WIDTH, y: rect.height / GSI_HEIGHT });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Keep the latest callback without re-initializing GIS on every render.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const initAndRender = useCallback(() => {
    const idApi = window.google?.accounts?.id;
    const container = containerRef.current;
    if (!idApi || !container || !GOOGLE_CLIENT_ID) return;

    idApi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) {
          onCredentialRef.current(response.credential);
        }
      },
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    container.replaceChildren();
    idApi.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: GSI_WIDTH,
      locale,
    });
  }, [text, locale]);

  // (Re)render the button when the script becomes ready or label/locale change.
  useEffect(() => {
    if (scriptReady) {
      initAndRender();
    }
  }, [scriptReady, initAndRender]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src={locale ? `${GSI_SRC}?hl=${locale}` : GSI_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={wrapRef} className="group relative h-11 w-full md:h-11">
        {/* Visible skin — full width of the parent, admin-dashboard style.
            Purely decorative: the real interactive element is the GIS
            button stretched invisibly on top. */}
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center gap-3 rounded-[10px] border border-[rgba(28,28,26,0.14)] bg-white text-[15px] font-medium text-ink shadow-[var(--sh-sm)] transition-colors group-hover:bg-c-50"
        >
          <GoogleG />
          Google
        </div>
        {/* Real GIS button — rendered at its max size (400×40) and scaled
            to cover the skin so every pixel is clickable. */}
        <div className="absolute inset-0 overflow-hidden rounded-[10px] opacity-0">
          <div
            ref={containerRef}
            style={{
              width: GSI_WIDTH,
              height: GSI_HEIGHT,
              transform: `scale(${scale.x}, ${scale.y})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </>
  );
}
