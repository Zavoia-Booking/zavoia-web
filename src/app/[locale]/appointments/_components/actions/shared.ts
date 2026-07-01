/**
 * Pure helpers shared by the appointment action modals — no React, no JSX.
 *
 * Centralizes the venue/service-line derivation used by the modal mini-header
 * (ported from `ZwApptMini` in web-appointment-actions.jsx:72-89) onto the live
 * `AppointmentDetail` shape, plus the staff display-name resolution used in the
 * mini sub-line and the per-professional review labels.
 */

import type {
  AppointmentDetail,
  AppointmentDetailStaffMember,
} from "@/lib/api/marketplace/types";

/** Human display name for a staff member, falling back across the API fields. */
export function staffDisplayName(
  staff: AppointmentDetailStaffMember | null | undefined,
): string | null {
  if (!staff) return null;
  if (staff.displayName) return staff.displayName;
  const full = [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim();
  return full || null;
}

/** First staff member on the appointment (the primary professional), if any. */
export function primaryStaff(
  appt: AppointmentDetail,
): AppointmentDetailStaffMember | null {
  return appt.staff_users?.[0] ?? null;
}

export interface ApptMiniData {
  photo: string | null;
  serviceLine: string;
  business: string;
  staffName: string | null;
  photoLabel?: string;
}

/**
 * Derive the props for the modal mini-header from an appointment.
 * - photo: location image, falling back to the business logo.
 * - serviceLine: `primaryItemName` (the booked headline), falling back to
 *   `bookedItemName`.
 * - business: the business name.
 * - staffName: the primary professional's display name.
 */
export function apptMiniProps(
  appt: AppointmentDetail,
  photoLabel?: string,
): ApptMiniData {
  const photo =
    appt.location?.profileImage ?? appt.business?.logo ?? null;
  const serviceLine =
    appt.primaryItemName || appt.bookedItemName || "";
  const business = appt.business?.name ?? "";
  const staffName = staffDisplayName(primaryStaff(appt));
  return { photo, serviceLine, business, staffName, photoLabel };
}
