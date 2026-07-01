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

type Props = {
  /** Drives the GIS button label ("continue_with" works for both flows). */
  text?: GoogleButtonConfig["text"];
  /** GIS button locale ("en" | "ro"). */
  locale?: string;
  /** Receives the Google ID token (a JWT) from the credential callback. */
  onCredential: (idToken: string) => void;
};

/**
 * Renders the official "Sign in with Google" button via GIS and hands the
 * returned ID token up through `onCredential`. Renders nothing when
 * GOOGLE_CLIENT_ID is unset (feature flag). The GIS script is loaded once via
 * next/script with the default `afterInteractive` strategy (per
 * node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md):
 * next/script deduplicates by `src`, so multiple instances do not double-load.
 */
export function GoogleSignInButton({
  text = "continue_with",
  locale,
  onCredential,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.google?.accounts?.id),
  );
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
      width: 320,
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
        src={GSI_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
