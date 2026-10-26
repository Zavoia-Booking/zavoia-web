import { ApiError } from "@/lib/api/http";
import { mapBackendCode } from "@/lib/api/error-messages";
import type { TeamMemberBookingContext } from "@/lib/api/marketplace/types";

/** A public context failure must not make an otherwise available profile disappear. */
export type ProfessionalBookingContextSeed = { memberId: number } & (
  | { status: "ready"; context: TeamMemberBookingContext }
  | { status: "unavailable" }
  | { status: "error"; error: { status: number; code?: string; retryAfterSeconds?: number } }
);

const MEMBER_GONE_CODES = {
  "CUSTOMER_BOOKING.E16": true,
  "CUSTOMER_BOOKING.E17": true,
} as const;

export function isProfessionalUnavailable(error: unknown): boolean {
  return Boolean(mapBackendCode(error, MEMBER_GONE_CODES)) ||
    (error instanceof ApiError && (error.status === 404 || error.status === 410));
}
