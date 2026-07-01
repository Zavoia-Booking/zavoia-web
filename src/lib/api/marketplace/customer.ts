/**
 * Marketplace CUSTOMER endpoints (`/marketplace/customer/*`).
 *
 * Auth: required (apiFetch attaches the Bearer token + handles 401 refresh).
 *
 * Envelope handling (per source — customer.service.ts):
 * - RAW (body IS the payload): profile, profile-summary, profile edit, image,
 *   change-password, notifications (get/update), reviews, ALL favorites (lists +
 *   mutations). These return their payloads directly (no { message, data }).
 * - The profile/image upload uses multipart FormData (field name `file`); do NOT
 *   set Content-Type — the browser adds the multipart boundary.
 */

import { apiFetch } from "@/lib/api/http";
import type {
  AllFavorites,
  ChangePasswordBody,
  CustomerProfile,
  CustomerProfileSummary,
  FavoriteBusiness,
  FavoriteLocation,
  FavoriteMutationResult,
  FavoriteProfessional,
  MessageResult,
  NotificationPreferences,
  SubmitReviewBody,
  SubmitReviewResult,
  UpdateNotificationPreferencesBody,
  UpdateProfileBody,
  UploadProfileImageResult,
} from "./types";

// --- Profile ---

/** GET /marketplace/customer/profile — RAW CustomerProfile. */
export function getProfile(): Promise<CustomerProfile> {
  return apiFetch<CustomerProfile>("/marketplace/customer/profile", {
    method: "GET",
  });
}

/** GET /marketplace/customer/profile-summary — RAW summary. */
export function getProfileSummary(): Promise<CustomerProfileSummary> {
  return apiFetch<CustomerProfileSummary>(
    "/marketplace/customer/profile-summary",
    { method: "GET" },
  );
}

/** POST /marketplace/customer/profile/edit — RAW; returns the updated profile. */
export function updateProfile(
  dto: UpdateProfileBody,
): Promise<CustomerProfile> {
  return apiFetch<CustomerProfile>("/marketplace/customer/profile/edit", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/**
 * POST /marketplace/customer/profile/image — multipart upload (field name `file`).
 * RAW; returns `{ profileImage }`. Content-Type is left unset so the browser
 * supplies the multipart boundary.
 */
export function uploadProfileImage(
  file: File,
): Promise<UploadProfileImageResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UploadProfileImageResult>(
    "/marketplace/customer/profile/image",
    {
      method: "POST",
      body: form,
    },
  );
}

/** POST /marketplace/customer/profile/change-password — RAW `{ message }`. */
export function changePassword(
  body: ChangePasswordBody,
): Promise<MessageResult> {
  return apiFetch<MessageResult>(
    "/marketplace/customer/profile/change-password",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** POST /marketplace/customer/delete — deletes the account. */
export function deleteAccount(): Promise<unknown> {
  return apiFetch<unknown>("/marketplace/customer/delete", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

// --- Notification preferences ---

/** GET /marketplace/customer/notifications — RAW preferences. */
export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(
    "/marketplace/customer/notifications",
    { method: "GET" },
  );
}

/** POST /marketplace/customer/notifications — RAW; returns the updated preferences. */
export function updateNotificationPreferences(
  dto: UpdateNotificationPreferencesBody,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>(
    "/marketplace/customer/notifications",
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
}

// --- Reviews ---

/** POST /marketplace/customer/reviews — RAW `{ success: true }`. */
export function submitReview(
  dto: SubmitReviewBody,
): Promise<SubmitReviewResult> {
  return apiFetch<SubmitReviewResult>("/marketplace/customer/reviews", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// --- Favorites (all RAW) ---

/** GET /marketplace/customer/favorites — RAW grouped payload. */
export function getFavorites(): Promise<AllFavorites> {
  return apiFetch<AllFavorites>("/marketplace/customer/favorites", {
    method: "GET",
  });
}

/** GET /marketplace/customer/favorite/businesses — RAW FavoriteBusiness[]. */
export function getFavoriteBusinesses(): Promise<FavoriteBusiness[]> {
  return apiFetch<FavoriteBusiness[]>(
    "/marketplace/customer/favorite/businesses",
    { method: "GET" },
  );
}

/** POST /marketplace/customer/favorite/business/:id — RAW mutation result. */
export function addFavoriteBusiness(
  businessId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/business/${businessId}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

/** DELETE /marketplace/customer/favorite/business/:id — RAW mutation result. */
export function removeFavoriteBusiness(
  businessId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/business/${businessId}`,
    { method: "DELETE" },
  );
}

/** GET /marketplace/customer/favorite/professionals — RAW FavoriteProfessional[]. */
export function getFavoriteProfessionals(): Promise<FavoriteProfessional[]> {
  return apiFetch<FavoriteProfessional[]>(
    "/marketplace/customer/favorite/professionals",
    { method: "GET" },
  );
}

/** POST /marketplace/customer/favorite/professional/:id — RAW mutation result. */
export function addFavoriteProfessional(
  professionalId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/professional/${professionalId}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

/** DELETE /marketplace/customer/favorite/professional/:id — RAW mutation result. */
export function removeFavoriteProfessional(
  professionalId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/professional/${professionalId}`,
    { method: "DELETE" },
  );
}

/** GET /marketplace/customer/favorite/locations — RAW FavoriteLocation[]. */
export function getFavoriteLocations(): Promise<FavoriteLocation[]> {
  return apiFetch<FavoriteLocation[]>(
    "/marketplace/customer/favorite/locations",
    { method: "GET" },
  );
}

/** POST /marketplace/customer/favorite/location/:id — RAW mutation result. */
export function addFavoriteLocation(
  locationId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/location/${locationId}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

/** DELETE /marketplace/customer/favorite/location/:id — RAW mutation result. */
export function removeFavoriteLocation(
  locationId: number,
): Promise<FavoriteMutationResult> {
  return apiFetch<FavoriteMutationResult>(
    `/marketplace/customer/favorite/location/${locationId}`,
    { method: "DELETE" },
  );
}
