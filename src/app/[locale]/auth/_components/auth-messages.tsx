"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { useTranslation } from "@/i18n/useTranslation";

export type AuthMessages = Pick<Dictionary, "auth" | "errors">;
const AuthMessagesContext = createContext<AuthMessages | null>(null);

// Google's registered callback is unprefixed; the saved OAuth context supplies
// its real language in the browser. Only this small message scope needs variants.
export function AuthMessagesProvider({ messages, children }: { messages: AuthMessages; children: ReactNode }) {
  return <AuthMessagesContext.Provider value={messages}>{children}</AuthMessagesContext.Provider>;
}

export function useAuthMessages(): AuthMessages {
  const override = useContext(AuthMessagesContext);
  const { dict } = useTranslation();
  return override ?? dict;
}
