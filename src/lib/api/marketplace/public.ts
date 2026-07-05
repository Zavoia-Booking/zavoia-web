/**
 * Marketplace PUBLIC discovery endpoints (`/marketplace/public/*`).
 *
 * Auth: all public. `getListing` is optional-auth on the server — calling it
 * normally (apiFetch attaches the token when present) yields `isFavorited`.
 *
 * Envelope handling:
 * - RAW (body IS the payload): industries, listing detail, team-member profiles.
 * - OWN list wrapper: brands / latest / nearby / search return their own
 *   pagination object; review feeds return `{ data, pagination }`.
 * - WRAPPED `{ message, data }`: booking-context only (unwrapped here).
 */

import { apiFetch } from "@/lib/api/http";
import { buildQuery } from "./query";
import type {
  BrandCard,
  BusinessCard,
  Envelope,
  GetBrandsParams,
  Industry,
  LatestListingsBody,
  ListingDetail,
  ListingLightCard,
  NearbyLocationsBody,
  NearbyLocationsResult,
  OffsetPage,
  PaginatedFeed,
  ProfessionalReview,
  Review,
  ReviewPageParams,
  SearchListingsParams,
  SearchListingsResult,
  TeamMemberBookingContext,
  TeamMemberProfile,
} from "./types";

/** GET /marketplace/public/industries — RAW Industry[]. */
export function getIndustries(): Promise<Industry[]> {
  return apiFetch<Industry[]>("/marketplace/public/industries", {
    method: "GET",
  });
}

/** GET /marketplace/public/brands — own paginated wrapper. */
export function getBrands(
  params: GetBrandsParams = {},
): Promise<OffsetPage<BrandCard>> {
  const query = buildQuery({
    search: params.search,
    industryId: params.industryId,
    industrySlug: params.industrySlug,
    minRating: params.minRating,
    sortBy: params.sortBy,
    limit: params.limit,
    offset: params.offset,
  });
  return apiFetch<OffsetPage<BrandCard>>(`/marketplace/public/brands${query}`, {
    method: "GET",
  });
}

/** POST /marketplace/public/latest-listings — own paginated wrapper (BusinessCard). */
export function getLatestListings(
  body: LatestListingsBody = {},
): Promise<OffsetPage<BusinessCard>> {
  return apiFetch<OffsetPage<BusinessCard>>(
    "/marketplace/public/latest-listings",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** POST /marketplace/public/nearby-locations — own wrapper with fallback (LocationCard). */
export function getNearbyLocations(
  body: NearbyLocationsBody,
): Promise<NearbyLocationsResult> {
  return apiFetch<NearbyLocationsResult>(
    "/marketplace/public/nearby-locations",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** GET /marketplace/public/listings — unified search; own grouped wrapper. tagIds → CSV. */
export function searchListings(
  params: SearchListingsParams = {},
): Promise<SearchListingsResult> {
  const query = buildQuery({
    search: params.search,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    industryId: params.industryId,
    industrySlug: params.industrySlug,
    tagIds: params.tagIds,
    city: params.city,
    date: params.date,
    serviceId: params.serviceId,
    staffId: params.staffId,
    limit: params.limit,
    offset: params.offset,
  });
  return apiFetch<SearchListingsResult>(
    `/marketplace/public/listings${query}`,
    { method: "GET" },
  );
}

/**
 * GET /marketplace/public/listings/bulk — light cards for up to 10 LOCATION
 * ids, own `{ data }` wrapper (unwrapped here). The endpoint is optimistic:
 * ids past the first 10 and unknown/hidden ids are silently dropped, and the
 * response preserves the request order. Sliced client-side too so callers
 * never depend on the server cap.
 */
export async function getListingsBulk(
  ids: number[],
): Promise<ListingLightCard[]> {
  if (ids.length === 0) return [];
  const query = buildQuery({ ids: ids.slice(0, 10) });
  const res = await apiFetch<{ data: ListingLightCard[] }>(
    `/marketplace/public/listings/bulk${query}`,
    { method: "GET" },
  );
  return res.data;
}

/**
 * GET /marketplace/public/listing/:idOrSlug — RAW ListingDetail.
 * `slug` is a LOCATION slug (non-enumerable). The backend resolves either a
 * slug or a numeric id, so a string param is correct. Optional-auth: the token
 * is attached automatically when present, populating `isFavorited`.
 */
export function getListing(slug: string): Promise<ListingDetail> {
  return apiFetch<ListingDetail>(
    `/marketplace/public/listing/${encodeURIComponent(slug)}`,
    { method: "GET" },
  );
}

/** GET /marketplace/public/listing/:id/reviews — RAW `{ data, pagination }`. */
export function getListingReviews(
  locationId: number,
  params: ReviewPageParams = {},
): Promise<PaginatedFeed<Review>> {
  const query = buildQuery({ offset: params.offset, limit: params.limit });
  return apiFetch<PaginatedFeed<Review>>(
    `/marketplace/public/listing/${locationId}/reviews${query}`,
    { method: "GET" },
  );
}

/** GET /marketplace/public/team-member/:id — RAW TeamMemberProfile (no listing context). */
export function getTeamMember(
  teamMemberId: number,
): Promise<TeamMemberProfile> {
  return apiFetch<TeamMemberProfile>(
    `/marketplace/public/team-member/${teamMemberId}`,
    { method: "GET" },
  );
}

/** GET /marketplace/public/listing/:listingId/team-member/:id — RAW TeamMemberProfile. */
export function getTeamMemberInListing(
  listingId: number,
  teamMemberId: number,
): Promise<TeamMemberProfile> {
  return apiFetch<TeamMemberProfile>(
    `/marketplace/public/listing/${listingId}/team-member/${teamMemberId}`,
    { method: "GET" },
  );
}

/** GET /marketplace/public/team-member/:id/reviews — RAW `{ data, pagination }`. */
export function getTeamMemberReviews(
  teamMemberId: number,
  params: ReviewPageParams = {},
): Promise<PaginatedFeed<ProfessionalReview>> {
  const query = buildQuery({ offset: params.offset, limit: params.limit });
  return apiFetch<PaginatedFeed<ProfessionalReview>>(
    `/marketplace/public/team-member/${teamMemberId}/reviews${query}`,
    { method: "GET" },
  );
}

/** GET /marketplace/public/team-member/:id/booking-context — WRAPPED; returns data. */
export async function getTeamMemberBookingContext(
  teamMemberId: number,
): Promise<TeamMemberBookingContext> {
  const res = await apiFetch<Envelope<TeamMemberBookingContext>>(
    `/marketplace/public/team-member/${teamMemberId}/booking-context`,
    { method: "GET" },
  );
  return res.data;
}
