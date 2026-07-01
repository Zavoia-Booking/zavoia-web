/**
 * Shared TypeScript interfaces for the customer-facing "marketplace" API.
 *
 * Conventions (verified against admin-api source):
 * - IDs are NUMBERS (int) for business / location / listing / service / bundle /
 *   teamMember / professional. Appointments are addressed by STRING uuid.
 * - `GET /marketplace/public/listing/:id` — :id is a LOCATION id. The booking body
 *   `listingId` is a DIFFERENT value (BusinessMarketplaceListing id). They are kept
 *   distinct in the types below.
 * - Money is integer minor units (cents). Kept as `number`, never divided. Field
 *   names mirror the API (basePrice, price, priceAmountMinor, totalPrice, …).
 * - Dates: calendar/slots/search use `YYYY-MM-DD` strings; booking `scheduledAt` +
 *   reschedule `newScheduledAt` are full ISO datetime strings; slot startTime/endTime
 *   are `HH:mm`. Availability is in the location's timezone (returned as `timezone`).
 *
 * Envelope handling is documented per endpoint in the client modules. Wrapped
 * endpoints return `{ message, data }`; clients unwrap and return `data` (T).
 */

// ============================================================================
// Envelope & pagination helpers
// ============================================================================

/** Standard wrapped response used by booking, appointments, support and push endpoints. */
export interface Envelope<T> {
  message: string;
  data: T;
}

/** List wrapper used by brands / latest-listings / nearby-locations. */
export interface OffsetPage<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Search relaxation flag attached to discovery results. */
export interface SearchFallback {
  applied: boolean;
  reason: string | null;
}

/** `{ data, pagination }` shape used by review feeds. */
export interface Pagination {
  offset: number;
  limit: number;
  total: number;
}

export interface PaginatedFeed<T> {
  data: T[];
  pagination: Pagination;
}

// ============================================================================
// Industries
// ============================================================================

export interface IndustryTag {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Industry {
  id: number;
  name: string;
  slug: string;
  tags: IndustryTag[];
}

/** Minimal industry reference embedded in cards. */
export interface IndustryRef {
  id: number;
  name: string;
}

// ============================================================================
// Discovery cards (search / brands / latest / nearby)
// ============================================================================

/** One card per BUSINESS — homepage "Brands" list. */
export interface BrandCard {
  businessId: number;
  name: string;
  description: string | null;
  profileImage: string | null;
  industry: IndustryRef | null;
  averageRating: number | null;
  totalReviews: number;
}

/**
 * One card per BUSINESS — "Just joined" / business-name search hits.
 * `id` equals `businessId`. `primaryLocationId` is the detail-page nav target
 * (the /listing/:id route resolves :id as a LOCATION id). `listingId` is the
 * BusinessMarketplaceListing id (needed for booking).
 */
export interface BusinessCard {
  id: number;
  businessId: number;
  listingId: number | null;
  primaryLocationId: number | null;
  /** Non-enumerable slug of the primary location — detail-route nav target. */
  slug: string;
  name: string;
  businessName: string;
  city: string | null;
  country: string | null;
  logo: string | null;
  featuredImage: string | null;
  industry: IndustryRef | null;
  averageRating: number | null;
  totalReviews: number;
  locationsCount: number;
  createdAt: string;
}

/**
 * One card per public LOCATION — search/nearby results.
 * `id` is the location id (nav target). `listingId` is the BusinessMarketplaceListing
 * id (needed for booking). `distanceKm` / `nextAvailable*` are attached only on the
 * unified search/nearby path.
 */
export interface LocationCard {
  id: number;
  businessId: number;
  listingId: number | null;
  /** Non-enumerable location slug — detail-route nav target. */
  slug: string;
  name: string;
  locationName: string;
  businessName: string;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  workingHours: WorkingHours | null;
  open247: boolean;
  featuredImage: string | null;
  industry: IndustryRef;
  averageRating: number | null;
  totalReviews: number;
  /** Present on search/nearby results when lat/lng provided. */
  distanceKm?: number | null;
  /** Earliest day with capacity (YYYY-MM-DD), from the availability index. */
  nextAvailableDate?: string | null;
  /** Earliest free start instant (ISO datetime) on nextAvailableDate. */
  nextAvailableAt?: string | null;
}

// ============================================================================
// Working hours / address (shared)
// ============================================================================

export interface WorkingHoursDay {
  isOpen: boolean;
  open: string;
  close: string;
}

/** Keyed by weekday name (monday…sunday). Shape is loosely typed — read defensively. */
export type WorkingHours = Partial<Record<string, WorkingHoursDay>>;

/** Free-form address components stored as jsonb; only the known fields are typed. */
export interface AddressComponents {
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
}

// ============================================================================
// Reviews
// ============================================================================

export interface ReviewCustomer {
  firstName: string | null;
  /** Last-name initial only (e.g. "S."). */
  lastName: string | null;
  profileImage: string | null;
}

/** Team member referenced by a team-member review in a location feed. */
export interface ReviewTeamMember {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

/**
 * Merged location + team-member review feed item.
 * `type === 'team_member'` carries the reviewed `teamMember`; `'location'` has null.
 */
export interface Review {
  id: number;
  type: "location" | "team_member";
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer;
  teamMember: ReviewTeamMember | null;
}

/** Professional-scoped review (team-member reviews feed) — no `type`/`teamMember`. */
export interface ProfessionalReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer | null;
}

export interface ReviewStats {
  totalCount: number;
  averageRating: number | null;
  /** Counts keyed by star value (5→1). */
  ratingDistribution: Record<number, number>;
}

// ============================================================================
// Listing detail (GET /marketplace/public/listing/:id)
// ============================================================================

export interface ServiceCategoryRef {
  id: number;
  name: string;
  color: string;
}

export interface ServiceSummary {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  priceAmountMinor: number;
  duration: number;
  categoryId: number | null;
  category: ServiceCategoryRef | null;
  locationIds: number[];
}

export interface BundleSummary {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  priceType: string;
  priceAmountMinor: number;
  duration: number;
  locationIds: number[];
  services: Array<Omit<ServiceSummary, "locationIds">>;
}

export interface ListingTeamMember {
  id: number;
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  displayName: string | null;
  professionalTitle: string | null;
  averageRating: number | null;
  totalReviews: number;
  locationIds: number[];
}

export interface ListingServiceCategory {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

/** The single selected location embedded in the listing detail. */
export interface ListingLocation {
  id: number;
  uuid: string;
  /** Non-enumerable location slug — detail-route nav target. */
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  addressComponents: AddressComponents | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isRemote: boolean;
  timezone: string;
  workingHours: WorkingHours | null;
  open247: boolean;
  allowOnlineBooking: boolean;
}

export interface ListingPortfolioImage {
  url: string;
  [key: string]: unknown;
}

export interface OtherLocationRef {
  id: number;
  name: string;
}

/** Cancellation / reschedule policy for the selected location. */
export interface BookingPolicy {
  cancellationWindowMinutes: number;
  allowCustomerCancellation: boolean;
  rescheduleWindowMinutes: number;
  allowCustomerReschedule: boolean;
}

/**
 * Full listing payload. RAW (no envelope). `:id` in the route is a LOCATION id;
 * `locationId` mirrors it. `listingId` is the BusinessMarketplaceListing id used for
 * booking. `additionalSettings` is dynamic jsonb — typed as `unknown`.
 */
export interface ListingDetail {
  id: number;
  locationId: number;
  businessId: number;
  listingId: number;
  /** Non-enumerable location slug — also mirrored on `location.slug`. */
  slug: string;

  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
  country: string | null;
  businessCurrency: string;
  timezone: string;

  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  pinterestUrl: string | null;

  industry: Industry | IndustryRef | null;

  location: ListingLocation;

  featuredImage: string | null;
  portfolioImages: ListingPortfolioImage[];

  serviceCategories: ListingServiceCategory[];
  services: ServiceSummary[];
  bundles: BundleSummary[];
  teamMembers: ListingTeamMember[];
  reviews: Review[];
  reviewStats: ReviewStats;

  averageRating: number | null;
  totalReviews: number;
  allowOnlineBooking: boolean;
  /** Dynamic jsonb settings (location- or listing-level). */
  additionalSettings: unknown;

  /**
   * Cancellation / reschedule policy for the selected location. Consumed by a
   * LATER slice (cancellation text) — present here so the data is available.
   */
  bookingPolicy: BookingPolicy | null;

  otherLocations: OtherLocationRef[];

  createdAt: string;
  updatedAt: string;

  /** Present only for authenticated requests. */
  isFavorited?: boolean;
}

// ============================================================================
// Team member profile (GET .../team-member/:id)
// ============================================================================

export interface TeamMemberAbout {
  displayName: string | null;
  professionalTitle: string | null;
  aboutMe: string | null;
  interests: string[];
  languages: string[];
  socialLinks: Record<string, string>;
}

export interface TeamMemberProfile {
  id: number;
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  yearsOfExperience: number | null;
  visitsCompleted: number;
  memberSince: string;
  about: TeamMemberAbout | null;
  /** Services the member can perform; empty when fetched without a listing context. */
  services: Array<Omit<ServiceSummary, "locationIds">>;
  portfolio: string[];
  reviews: ProfessionalReview[];
  reviewStats: {
    totalCount: number;
    averageRating: number | null;
  };
}

// ============================================================================
// Team member booking context (GET .../team-member/:id/booking-context)
// ============================================================================

export interface TeamMemberBookingContextService {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  priceAmountMinor: number;
  duration: number;
  categoryId: number | null;
  category: ServiceCategoryRef | null;
  displayOrder: number;
}

export interface TeamMemberBookingLocation {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  featuredImage: string | null;
  averageRating: number | null;
  totalReviews: number;
  showPricing: boolean;
  allowOnlineBooking: boolean;
  services: TeamMemberBookingContextService[];
}

export interface TeamMemberBookingBusiness {
  id: number;
  name: string;
  listingId: number;
  businessCurrency: string;
  logo: string | null;
  locations: TeamMemberBookingLocation[];
}

export interface TeamMemberBookingContext {
  teamMember: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
  businesses: TeamMemberBookingBusiness[];
}

// ============================================================================
// Discovery request params
// ============================================================================

export type BrandSortBy = "rating" | "reviews" | "name" | "newest";

export interface GetBrandsParams {
  search?: string;
  industryId?: number;
  industrySlug?: string;
  minRating?: number;
  sortBy?: BrandSortBy;
  limit?: number;
  offset?: number;
}

export interface LatestListingsBody {
  industryId?: number;
  limit?: number;
  offset?: number;
}

export interface NearbyLocationsBody {
  lat: number;
  lng: number;
  radius?: number;
  industryId?: number;
  tagIds?: number[];
  limit?: number;
  offset?: number;
}

export interface SearchListingsParams {
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  industryId?: number;
  industrySlug?: string;
  /** Sent to the API as a CSV string. */
  tagIds?: number[];
  city?: string;
  date?: string;
  serviceId?: number;
  staffId?: number;
  limit?: number;
  offset?: number;
}

export interface SearchListingsResult {
  businesses: BusinessCard[];
  locations: LocationCard[];
  total: number;
  limit: number;
  offset: number;
  fallback: SearchFallback;
}

export interface NearbyLocationsResult {
  data: LocationCard[];
  total: number;
  limit: number;
  offset: number;
  fallback: SearchFallback;
}

export interface ReviewPageParams {
  offset?: number;
  limit?: number;
}

// ============================================================================
// Booking — calendar & slots (POST /marketplace/public/booking/*)
//
// NOTE: the live service (customer-booking.service.ts) returns a richer shape than
// the marketplace-booking-api.md sample. The types below follow the SERVICE source
// of truth (CalendarResponse / DaySlotsResponse).
// ============================================================================

/** Each selection item has either `serviceId` or `bundleId` (not both). */
export interface ServiceSelection {
  serviceId?: number;
  bundleId?: number;
  teamMemberId?: number;
}

export interface GetBookingCalendarBody {
  businessId: number;
  locationId: number;
  services: ServiceSelection[];
  /** YYYY-MM-DD */
  startDate: string;
  /** 1–60, defaults to 30. */
  daysToCheck?: number;
  teamMemberId?: number;
}

export interface GetBookingSlotsBody {
  businessId: number;
  locationId: number;
  services: ServiceSelection[];
  /** YYYY-MM-DD */
  date: string;
  teamMemberId?: number;
}

export type BookingDayStatus =
  | "available"
  | "closed"
  | "fully_booked"
  | "no_staff"
  | "blocked"
  | "too_early"
  | "too_late";

export interface BookingCalendarDay {
  /** YYYY-MM-DD */
  date: string;
  dayOfWeek: string;
  status: BookingDayStatus;
  reason?: string;
  /** Present only when status === "available". */
  slotsCount?: number;
}

/** A nested constituent service inside a bundle selection item. */
export interface SelectionItemService {
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  priceAmountMinor: number;
}

/** Top-level summary of one selected unit (service or bundle). */
export interface SelectionItem {
  type: "bundle" | "service";
  durationMinutes: number;
  priceAmountMinor: number;
  staffCount: number;
  serviceId?: number;
  serviceName?: string;
  bundleId?: number;
  bundleName?: string;
  /** Present for bundles. */
  services?: SelectionItemService[];
}

export interface BookingSettings {
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingMinutes: number | null;
  slotIntervalMinutes: number;
  bufferTimeMinutes: number;
  cancellationWindowHours: number;
  rescheduleWindowHours: number;
}

export interface BookingCalendar {
  businessId: number;
  businessName: string;
  locationId: number;
  locationName: string;
  timezone: string;
  items: SelectionItem[];
  totalDuration: number;
  totalPrice: number;
  bookingSettings: BookingSettings;
  calendar: BookingCalendarDay[];
  nextAvailableDate: string | null;
}

/** A constituent service within a slot item (HH:mm times). */
export interface SlotService {
  serviceId: number;
  serviceName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceAmountMinor: number;
}

/** A bookable unit within a slot (service or whole bundle). */
export interface SlotItem {
  type: "bundle" | "service";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceAmountMinor: number;
  availableStaffIds: number[];
  defaultStaffId: number;
  serviceId?: number;
  serviceName?: string;
  bundleId?: number;
  bundleName?: string;
  /** Present for bundles. */
  services?: SlotService[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  totalPriceAmountMinor: number;
  items: SlotItem[];
}

export interface StaffDirectoryEntry {
  name: string;
  image: string | null;
}

export interface StaffPricingEntry {
  price: number;
  duration: number;
}

export interface BookingDaySlots {
  businessId: number;
  locationId: number;
  /** YYYY-MM-DD */
  date: string;
  dayOfWeek: string;
  items: SelectionItem[];
  totalDuration: number;
  totalPrice: number;
  /** teamMemberId → display info. */
  staffDirectory: Record<number, StaffDirectoryEntry>;
  /** serviceId → (teamMemberId → price/duration override). */
  staffPricing: Record<number, Record<number, StaffPricingEntry>>;
  slots: TimeSlot[];
}

// ============================================================================
// Appointments (auth)
// ============================================================================

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentListFilter =
  | "all"
  | "upcoming"
  | "past"
  | "cancelled"
  | "no_show";

export interface ListAppointmentsParams {
  status?: AppointmentListFilter;
  limit?: number;
  offset?: number;
}

export interface AppointmentListItem {
  uuid: string;
  bookedItemName: string;
  primaryItemName: string;
  additionalItemsCount: number;
  /** e.g. "single" | "composite" | "bundle" — backend enum, kept as string. */
  bookingType: string;
  /** ISO datetime */
  scheduledAt: string;
  /** ISO datetime */
  endsAt: string;
  status: AppointmentStatus;
  duration: number;
  price: number;
  currency: string;
  location: {
    id: number | null;
    name: string | null;
    profileImage: string | null;
  };
  staff: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  } | null;
}

export interface PastAppointmentsGroup {
  items: AppointmentListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AppointmentList {
  upcoming: AppointmentListItem[];
  /** null when the `upcoming` filter is requested. */
  past: PastAppointmentsGroup | null;
}

/** One ordered item (service or expanded bundle) in an appointment breakdown. */
export interface AppointmentBreakdownItem {
  name: string;
  type?: "service" | "bundle";
  serviceId?: number | null;
  serviceUuid?: string | null;
  description?: string | null;
  duration?: number | null; // minutes
  price?: number | null; // integer MINOR units
  startOffsetMinutes?: number | null;
  [key: string]: unknown; // keep — payload may carry more
}

export interface AppointmentReviewSummary {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDetailBusiness {
  id: number;
  uuid: string;
  name: string;
  logo: string | null;
  description: string | null;
  averageRating: number | null;
  totalReviews: number;
  phone: string | null;
  email: string | null;
  timezone: string | null;
}

export interface AppointmentDetailLocation {
  id: number;
  uuid: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isRemote: boolean;
  profileImage: string | null;
  averageRating: number | null;
  totalReviews: number;
  allowCustomerCancellation: boolean;
  cancellationWindowMinutes: number;
  allowCustomerReschedule: boolean;
  rescheduleWindowMinutes: number;
}

export interface AppointmentDetailStaffMember {
  teamMemberId: number;
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  professionalTitle: string | null;
  displayName: string | null;
  averageRating: number | null;
  totalReviews: number;
}

/**
 * Full appointment detail. Several jsonb snapshot fields are kept as `unknown`
 * because their shape is dynamic / internal. Use the typed top-level fields.
 */
export interface AppointmentDetail {
  uuid: string;
  bookedItemName: string;
  primaryItemName: string;
  additionalServices: string[];
  additionalItemsCount: number;
  items: AppointmentBreakdownItem[];
  bookedItemDescription: string | null;
  /** ISO datetime */
  scheduled_at: string;
  /** ISO datetime */
  ends_at: string;
  status: AppointmentStatus;
  bookingType: string;
  bookingSource: string;
  duration: number;
  price: number;
  currency: string;
  notes: string | null;
  cancellation_reason: string | null;
  recurringGroupId: string | null;
  recurringIndex: number | null;
  isRecurringParent: boolean;
  bundleServicesSnapshot: unknown;
  bookingItemsSnapshot: unknown;
  staffSnapshot: unknown;
  customerSnapshot: unknown;
  locationSnapshot: unknown;
  createdAt: string;
  updatedAt: string;
  reviews: {
    canLeaveBusinessReview: boolean;
    business: AppointmentReviewSummary | null;
    professionals: Array<{
      staffId: number;
      staffUuid: string;
      canLeaveReview: boolean;
      review: AppointmentReviewSummary | null;
    }>;
  };
  business: AppointmentDetailBusiness | null;
  location: AppointmentDetailLocation | null;
  service: {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    category: { uuid: string; name: string; color: string } | null;
  } | null;
  bundle: {
    uuid: string;
    name: string;
    description: string | null;
  } | null;
  staff_users: AppointmentDetailStaffMember[] | undefined;
}

/** One item in the booking request `services` array (serviceId XOR bundleId + staffId). */
export interface BookingServiceItem {
  serviceId?: number;
  bundleId?: number;
  staffId: number;
}

export interface BookAppointmentBody {
  /** BusinessMarketplaceListing id (NOT a location id). */
  listingId: number;
  locationId: number;
  /** ISO datetime — start of the first service. */
  scheduledAt: string;
  services: BookingServiceItem[];
}

export interface BookedAppointment {
  appointmentId: number;
  appointmentUuid: string;
  /** ISO datetime */
  scheduledAt: string;
  /** ISO datetime */
  endsAt: string;
  status: AppointmentStatus;
  serviceName: string;
  duration: number;
  price: number;
  currency: string;
  /** Snapshot — internal shape; read defensively. */
  location: unknown;
  /** Snapshot — internal shape; read defensively. */
  staff: unknown;
}

export interface BookAppointmentResult {
  appointments: BookedAppointment[];
}

export interface CancelAppointmentBody {
  uuid: string;
  reason?: string;
}

export interface CancelAppointmentResult {
  uuid: string;
  status: AppointmentStatus;
  cancellation_reason: string | null;
}

export interface RescheduleAppointmentBody {
  uuid: string;
  /** ISO datetime */
  newScheduledAt: string;
}

export interface RescheduleAppointmentResult {
  uuid: string;
  /** ISO datetime */
  scheduledAt: string;
  /** ISO datetime */
  endsAt: string;
  status: AppointmentStatus;
  serviceName: string;
  duration: number;
}

// ============================================================================
// Customer (auth) — profile, preferences, reviews, favorites
// ============================================================================

export interface CustomerProfile {
  id: number;
  uuid: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  profileImage: string | null;
  /** ISO date or null. */
  dateOfBirth: string | null;
  email_verified: boolean;
  createdAt: string;
}

export interface CustomerProfileSummary {
  profileImage: string | null;
  /** ISO datetime (account creation). */
  memberSince: string;
  totalAppointments: number;
  totalBusinessReviews: number;
  totalProfessionalReviews: number;
}

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** ISO date (YYYY-MM-DD). */
  dateOfBirth?: string;
}

export interface UploadProfileImageResult {
  profileImage: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResult {
  message: string;
}

export interface NotificationChannelPrefs {
  push: boolean;
  sms: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  marketing: NotificationChannelPrefs;
  reminders: NotificationChannelPrefs;
}

export interface UpdateNotificationPreferencesBody {
  marketingPush?: boolean;
  marketingSms?: boolean;
  marketingEmail?: boolean;
  reminderPush?: boolean;
  reminderSms?: boolean;
  reminderEmail?: boolean;
}

export interface ProfessionalRatingInput {
  professionalId: number;
  rating: number;
  comment?: string;
}

export interface SubmitReviewBody {
  appointmentUuid: string;
  locationRating?: number;
  locationComment?: string;
  professionalRatings?: ProfessionalRatingInput[];
}

export interface SubmitReviewResult {
  success: true;
}

// --- Favorites ---

export interface FavoriteBusiness {
  id: number;
  business: {
    id: number;
    uuid: string;
    name: string;
    logo: string | null;
    averageRating: number | null;
    totalReviews: number;
    industry: { id: number; name: string; slug: string } | null;
  };
  marketplace: {
    listingId: number | null;
    primaryLocationId: number | null;
    isListed: boolean;
    featuredImage: string | null;
  };
}

export interface FavoriteLocation {
  id: number;
  location: {
    id: number;
    uuid: string;
    name: string;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    featuredImage: string | null;
    averageRating: number | null;
    totalReviews: number;
    isPublic: boolean;
    business: {
      id: number;
      name: string;
      logo: string | null;
      industry: { id: number; name: string; slug: string } | null;
    } | null;
  };
  marketplace: {
    listingId: number | null;
    isListed: boolean;
  };
  createdAt: string;
}

export interface FavoriteProfessional {
  id: number;
  professional: {
    id: number;
    uuid: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
    averageRating: number | null;
    totalReviews: number;
    displayName: string | null;
    professionalTitle: string | null;
  };
  createdAt: string;
}

export interface AllFavorites {
  businesses: FavoriteBusiness[];
  locations: FavoriteLocation[];
  professionals: FavoriteProfessional[];
}

export interface FavoriteMutationResult {
  message: string;
  favoriteId?: number;
}

// ============================================================================
// Support (auth)
// ============================================================================

export type TicketCategory = "bug" | "question";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED" | "REOPENED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketSourceType = "MARKETPLACE" | "DASHBOARD" | "GUEST";

export type TicketContextType = "appointment" | "listing" | "professional";

export interface TicketHistoryEntry {
  message: string;
  createdBy: string;
}

export interface TicketContext {
  type: TicketContextType;
  label: string;
  businessId?: number;
  locationId?: number;
  appointmentUuid?: string;
  listingId?: number;
  teamMemberId?: number;
}

export interface TicketDetails {
  history: TicketHistoryEntry[];
  context?: TicketContext;
}

export interface Ticket {
  id: number;
  uuid: string;
  sourceType: TicketSourceType;
  details: TicketDetails;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  /** False when admin replied and the customer has not opened the ticket since. */
  seen: boolean;
  seenByAdmin: boolean;
  createdBy?: string | null;
  priority: TicketPriority;
  category?: TicketCategory | null;
  status: TicketStatus;
  businessId: number | null;
}

/** Ticket list item — augmented with a per-ticket unread flag. */
export type TicketListItem = Ticket & { hasUnread: boolean };

/** Report-a-problem context attached when creating a ticket. */
export interface CreateTicketContext {
  type: TicketContextType;
  label: string;
  businessId?: number;
  locationId?: number;
  appointmentUuid?: string;
  listingId?: number;
  teamMemberId?: number;
}

export interface CreateTicketBody {
  category: TicketCategory;
  message: string;
  context?: CreateTicketContext;
}

export interface AddTicketMessageBody {
  message: string;
}
