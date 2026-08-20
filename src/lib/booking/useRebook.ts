"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import {
  getListing,
  getTeamMemberInListing,
} from "@/lib/api/marketplace/public";
import type { AppointmentDetail } from "@/lib/api/marketplace/types";
import { useBooking } from "./useBooking";
import type { BookingSelectionItem } from "./types";

/**
 * Reusable "rebook" launcher. Re-opens the existing booking drawer pre-populated
 * from a past / cancelled appointment by re-fetching the CURRENT listing (for
 * authoritative pricing + the booking `listingId`/`timezone` the appointment
 * payload does not carry) and mapping the appointment's services onto it.
 *
 * Not coupled to the detail page — anything with an `AppointmentDetail` can use it.
 *
 * The booked professional is PINNED onto every item, so the calendar and slots
 * come back as their availability and the customer only has to pick a date. If
 * they have since left (or stopped performing the service) the availability call
 * fails with CUSTOMER_BOOKING.E08, which the drawer classifies as a `staff-pin`
 * block and offers "book with any professional" — dropping the pin and
 * refetching. That recovery is why we pin optimistically instead of
 * pre-validating: pre-validation cannot distinguish "left the venue" from a
 * listing that simply hides its team.
 *
 * Fallback: if the listing fetch fails OR nothing maps to the current menu, it
 * navigates to the business detail page (mirroring the previous plain-link
 * behaviour) and toasts a short note so the user is never stranded.
 */
export function useRebook(): {
  rebook: (appt: AppointmentDetail) => Promise<void>;
  pending: boolean;
} {
  const router = useRouter();
  const toast = useToast();
  const { locale, dict } = useTranslation();
  const { openBooking } = useBooking();
  const [pending, setPending] = useState(false);

  const rebook = useCallback(
    async (appt: AppointmentDetail): Promise<void> => {
      const locationId = appt.location?.id;
      // No resolvable location → cannot fetch the listing nor navigate sensibly.
      if (locationId == null) {
        toast(dict.booking.rebookError, "warn");
        return;
      }
      const businessHref = localeHref(locale, "business", String(locationId));

      setPending(true);
      try {
        const listing = await getListing(String(locationId));
        const servicesById = new Map(listing.services.map((s) => [s.id, s]));
        const bundlesById = new Map(listing.bundles.map((b) => [b.id, b]));

        // The professional who served it. `teamMemberId` is the booking id space
        // the availability endpoints filter on (it is the staffer's User.id —
        // see the backend's staff_users mapper), so it can be pinned directly.
        // An appointment is a same-staff run, so one pin covers every item.
        const teamMemberId = appt.staff_users?.[0]?.teamMemberId;

        // With a pin the figures are NOT a venue-wide spread — they are one
        // professional's own rate and pace. The listing payload can't express
        // that (it only carries the min/max across everyone who performs the
        // service here), so pull their exact per-location figures and quote
        // those instead of a misleading "from €10.00 · 30m – 1h".
        // Best-effort: on failure we fall back to the spread, which is at
        // least an honest lower bound rather than a wrong exact number.
        const memberFigures =
          teamMemberId != null
            ? await getTeamMemberInListing(
                listing.listingId,
                teamMemberId,
                listing.locationId,
              )
                .then(
                  (profile) =>
                    new Map(profile.services.map((s) => [s.id, s])),
                )
                .catch(() => null)
            : null;

        // Reconstruct each booked item from the CURRENT menu so pricing and
        // duration are authoritative. Items whose service/package is gone from
        // the live menu are collected by name so the user gets an honest, named
        // message instead of a vague one.
        const missingNames: string[] = [];
        const mapped: BookingSelectionItem[] = appt.items.flatMap(
          (item): BookingSelectionItem[] => {
            const pin = teamMemberId != null ? { teamMemberId } : {};

            // A package rebooks as ONE bundled line-item, exactly as it was
            // booked — never expanded into its constituent services, which would
            // lose the package price.
            if (item.type === "bundle" || item.bundleId != null) {
              const b =
                item.bundleId != null
                  ? bundlesById.get(item.bundleId)
                  : undefined;
              if (!b) {
                if (item.name) missingNames.push(item.name);
                return [];
              }
              return [
                {
                  bundleId: b.id,
                  name: b.name,
                  priceAmountMinor: b.priceAmountMinor,
                  duration: b.duration,
                  // Package-priced, so only the duration can spread.
                  durationMinMinutes: b.durationMinMinutes,
                  durationMaxMinutes: b.durationMaxMinutes,
                  durationVariesByStaff: b.durationVariesByStaff,
                  ...pin,
                },
              ];
            }

            if (item.serviceId == null) {
              if (item.name) missingNames.push(item.name);
              return [];
            }
            const s = servicesById.get(item.serviceId);
            if (!s) {
              if (item.name) missingNames.push(item.name);
              return [];
            }
            // Pinned and we know their figures → quote them exactly. No spread
            // fields, so nothing downstream renders a "from" or a range for a
            // professional who has already been chosen.
            const exact = memberFigures?.get(s.id);
            if (exact) {
              return [
                {
                  serviceId: s.id,
                  name: s.name,
                  priceAmountMinor: exact.priceAmountMinor,
                  duration: exact.duration,
                  ...pin,
                },
              ];
            }
            return [
              {
                serviceId: s.id,
                name: s.name,
                priceAmountMinor: s.priceAmountMinor,
                duration: s.duration,
                // No pin (or their figures didn't load): the venue-wide spread
                // is the honest answer until the slots response narrows it.
                priceFromMinor: s.priceFromMinor,
                priceVariesByStaff: s.priceVariesByStaff,
                durationMinMinutes: s.durationMinMinutes,
                durationMaxMinutes: s.durationMaxMinutes,
                durationVariesByStaff: s.durationVariesByStaff,
                ...pin,
              },
            ];
          },
        );

        if (mapped.length === 0) {
          // Nothing rebuildable: name what disappeared when we can (a single
          // retired service/package), fall back to honest generic copy
          // otherwise (several retired, or a snapshot carrying no numeric ids).
          const message =
            missingNames.length === 1
              ? format(dict.booking.rebookServiceGone, {
                  service: missingNames[0],
                })
              : missingNames.length > 1
                ? dict.booking.rebookServicesGone
                : dict.booking.rebookError;
          toast(message, "warn");
          router.push(businessHref);
          return;
        }

        // Partial rebuild: open the drawer with what survives, but say what
        // was dropped rather than silently shrinking the booking.
        if (missingNames.length > 0) {
          toast(
            format(dict.booking.rebookPartialGone, {
              service: missingNames.join(", "),
            }),
            "warn",
          );
        }

        openBooking({
          businessId: listing.businessId,
          listingId: listing.listingId,
          locationId: listing.locationId,
          timezone: listing.timezone,
          currency: listing.businessCurrency,
          bookingPolicy: listing.bookingPolicy,
          services: mapped,
        });
      } catch {
        toast(dict.booking.rebookError, "warn");
        router.push(businessHref);
      } finally {
        setPending(false);
      }
    },
    [router, toast, locale, dict, openBooking],
  );

  return { rebook, pending };
}
