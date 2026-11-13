import {
  getAccountLinkNeededDetails,
  getAppleProfileRequiredDetails,
  getAppleUnlinkedDetails,
} from "@/lib/api/customer-auth";
import type {
  AccountLinkNeededDetails,
  AppleProfileRequiredDetails,
  AppleUnlinkedDetails,
} from "@/lib/auth/types";
import type { ConfirmAccessContext } from "./confirm-access-panel";

/**
 * A Sign in with Apple step that needs its own panel, from the API's 409s
 * (admin-api docs/sign-in-with-apple-plan.md, Phase 2 status, customer side).
 */
export type AppleOutcome =
  /** 409 `apple_profile_required`: Apple sent no usable name. */
  | { kind: "profile"; details: AppleProfileRequiredDetails }
  /** 409 `account_exists_unlinked_apple`: prove the existing account first. */
  | { kind: "link"; details: AppleUnlinkedDetails }
  /** 409 `account_exists_needs_marketplace_access`, Apple tx: confirm to add access. */
  | { kind: "confirmAccess"; context: ConfirmAccessContext }
  /** The same 409 without an Apple tx: the emailed-link flow. */
  | { kind: "enableAccess"; details: AccountLinkNeededDetails };

/** Maps an Apple endpoint error to its next step, or null for a plain error. */
export function appleOutcomeFromError(error: unknown): AppleOutcome | null {
  const profile = getAppleProfileRequiredDetails(error);
  if (profile) return { kind: "profile", details: profile };

  const unlinked = getAppleUnlinkedDetails(error);
  if (unlinked) return { kind: "link", details: unlinked };

  const access = getAccountLinkNeededDetails(error);
  if (access) {
    if (
      access.suggestedNext === "confirm_enable_marketplace" &&
      access.txId &&
      access.provider === "apple"
    ) {
      return {
        kind: "confirmAccess",
        context: {
          txId: access.txId,
          email: access.email,
          firstName: access.firstName,
        },
      };
    }
    return { kind: "enableAccess", details: access };
  }
  return null;
}
