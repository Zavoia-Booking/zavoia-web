/**
 * Booking flow contract — shared between the business-detail page (which opens
 * the flow) and the BookingProvider (which owns the drawer state).
 *
 * IMPORTANT — `listingId` vs `locationId`:
 *   - `locationId` is the route id / favorites / recent-views / getListing id.
 *   - `listingId` is `ListingDetail.listingId` (BusinessMarketplaceListing id),
 *     the value the booking endpoints require. They are DIFFERENT — never
 *     conflate them. The Book CTAs pass both, distinctly.
 *
 * This slice ships the contract + a STUB drawer. The next slice replaces the
 * drawer body with the real calendar → slots → book flow using this payload.
 */

import type {
  BookingPolicy,
  BundleSummary,
  ListingServiceCategory,
  ServiceSummary,
} from "@/lib/api/marketplace/types";

/** One selected unit (a service or a bundle) carried into the booking flow. */
export interface BookingSelectionItem {
  /** Set for a service selection (mutually exclusive with `bundleId`). */
  serviceId?: number;
  /** Set for a bundle selection (mutually exclusive with `serviceId`). */
  bundleId?: number;
  name: string;
  /** Integer minor units (see formatMoney). */
  priceAmountMinor: number;
  /** Minutes. */
  duration: number;
  /** Optional pre-selected staff member. */
  teamMemberId?: number;
}

/** Everything the booking flow needs to start, handed over by the detail page. */
export interface OpenBookingPayload {
  businessId: number;
  /** BusinessMarketplaceListing id — required by the booking endpoints. */
  listingId: number;
  /** Location id — the route / getListing id (NOT the booking `listingId`). */
  locationId: number;
  timezone: string;
  /** ISO 4217 currency code (businessCurrency). */
  currency: string;
  /** The location's real cancellation/reschedule policy — the only authoritative
   *  source for whether the drawer may claim "free cancellation"/"free
   *  reschedule" and what the real window is. `null` when the location has no
   *  policy configured; the drawer must never fabricate a fallback window in
   *  that case. */
  bookingPolicy: BookingPolicy | null;
  /** Pre-selected items; MAY be empty — an empty list makes the drawer open on
   *  its own in-drawer "choose services" step (see `catalog`). */
  services: BookingSelectionItem[];
  /** Full service/bundle menu, needed only to render the in-drawer picker
   *  when `services` is empty. Omit when `services` is always non-empty
   *  (e.g. rebook). */
  catalog?: {
    serviceCategories: ListingServiceCategory[];
    services: ServiceSummary[];
    bundles: BundleSummary[];
  };
}

/** The imperative API exposed by `useBooking()`. */
export interface BookingApi {
  openBooking: (payload: OpenBookingPayload) => void;
  closeBooking: () => void;
  /** Hide the drawer for an auth detour (e.g. sign-in gate on Step 3), while
   *  remembering to automatically reopen it — with its in-progress state
   *  intact — once the user finishes signing in. Distinct from `closeBooking`,
   *  which is a normal dismiss and must NOT trigger a later auto-reopen. */
  closeForAuth: () => void;
}
