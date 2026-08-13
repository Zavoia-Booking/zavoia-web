"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
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
        // pricing/duration are authoritative. Skip items without a serviceId;
        // services gone from the live menu are collected by name so the user
        // gets an honest, named message instead of a vague one.
        const missingNames: string[] = [];
        const mapped: BookingSelectionItem[] = appt.items.flatMap((item) => {
          if (item.serviceId == null) return [];
          const s = servicesById.get(item.serviceId);
          if (!s) {
            if (item.name) missingNames.push(item.name);
            return [];
          }
          return [
            {
              serviceId: s.id,
              name: s.name,
              priceAmountMinor: s.priceAmountMinor,
              duration: s.duration,
            },
          ];
        });

        if (mapped.length === 0) {
          // Nothing rebuildable: name what disappeared when we can (single
          // retired service), fall back to honest generic copy otherwise
          // (several retired, or bundle-only appointments we can't rebuild).
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
