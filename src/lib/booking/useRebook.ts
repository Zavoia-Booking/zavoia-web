"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { localeHref } from "@/i18n/routes";
import { getListing } from "@/lib/api/marketplace/public";
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
 * Fallback: if the listing fetch fails OR no service maps to the current menu,
 * it navigates to the business detail page (mirroring the previous plain-link
 * behaviour) and toasts a short note so the user is never stranded. Bundles are
 * skipped — appointment items carry no `bundleId`, so they cannot be rebuilt.
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

        // Reconstruct each booked service from the CURRENT ServiceSummary so
        // pricing/duration are authoritative. Skip items without a serviceId or
        // whose service no longer exists in the live menu.
        const mapped: BookingSelectionItem[] = appt.items.flatMap((item) => {
          if (item.serviceId == null) return [];
          const s = servicesById.get(item.serviceId);
          return s
            ? [
                {
                  serviceId: s.id,
                  name: s.name,
                  priceAmountMinor: s.priceAmountMinor,
                  duration: s.duration,
                },
              ]
            : [];
        });

        if (mapped.length === 0) {
          // Nothing rebuildable (e.g. bundle-only, or all services retired).
          toast(dict.booking.rebookError, "warn");
          router.push(businessHref);
          return;
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
