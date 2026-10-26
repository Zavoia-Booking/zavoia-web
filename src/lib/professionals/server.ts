import "server-only";

import { cache } from "react";
import { ApiError } from "@/lib/api/http";
import { getProfessional, getTeamMemberBookingContext } from "@/lib/api/marketplace/public";
import type { TeamMemberProfile } from "@/lib/api/marketplace/types";
import { isProfessionalUnavailable, type ProfessionalBookingContextSeed } from "./booking-context";

/** Share the fresh public lookup between metadata and the page in one render. */
export const getProfessionalPageProfile = cache(async (
  uuid: string,
): Promise<TeamMemberProfile | null> => {
  // The existing identifier is a non-null varchar(64), including seeded IDs.
  if (!uuid || uuid.length > 64) return null;

  try {
    return await getProfessional(uuid);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
      return null;
    }
    // An outage must offer retry, never claim the professional is missing.
    throw error;
  }
});

/** Seed the existing public venue contract without making booking a page prerequisite. */
export async function getProfessionalPageBookingContext(memberId: number): Promise<ProfessionalBookingContextSeed> {
  try {
    return { memberId, status: "ready", context: await getTeamMemberBookingContext(memberId) };
  } catch (error) {
    if (isProfessionalUnavailable(error)) return { memberId, status: "unavailable" };
    return {
      memberId,
      status: "error",
      error: error instanceof ApiError
        ? { status: error.status, code: error.code, retryAfterSeconds: error.retryAfterSeconds }
        : { status: 0 },
    };
  }
}
