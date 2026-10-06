"use client";

// Bundled faces match the builder preview.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { TeamMemberProfileModal, type TeamMemberSeed } from "@/app/[locale]/business/_components/team-member-profile-modal";
import { LivePreview } from "@/features/website/components/builder/preview/Microsite";
import { MicrositeActionsContext, type WebsiteBookIntent } from "@/features/website/components/builder/preview/shared/actions";
import { findScrollParent, prefersReducedMotion } from "@/features/website/components/builder/preview/shared/util";
import { resolvePreviewLocations } from "@/features/website/components/builder/locationSelection";
import { fontStylesheetFor } from "@/features/website/components/builder/theme";
import { buildMicrositeRender } from "@/features/website/publicWebsite";
import type { MicrositeLocale } from "@/features/website/i18n/translate";
import { getListing } from "@/lib/api/marketplace/public";
import { ApiError } from "@/lib/api/http";
import type { ListingDetail, PublicWebsite } from "@/lib/api/marketplace/types";
import { useBooking } from "@/lib/booking";
import type { BookingSelectionItem } from "@/lib/booking/types";

/** The public renderer supplies interactions; Studio previews never launch checkout. */
export function BusinessMicrosite({ site, locale }: { site: PublicWebsite; locale: MicrositeLocale }) {
  const { layout, data } = useMemo(() => buildMicrositeRender(site, locale), [site, locale]);
  const locations = useMemo(() => resolvePreviewLocations(layout, data.locations), [layout, data.locations]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? locations[0];
  const { openBooking } = useBooking();
  const toast = useToast();
  const { dict } = useTranslation();
  const [pending, setPending] = useState(false);
  const requestRef = useRef(false);
  const generationRef = useRef(0);
  const mainRef = useRef<HTMLElement>(null);
  const [profile, setProfile] = useState<{ member: TeamMemberSeed; listing: ListingDetail } | null>(null);

  // A request completed after navigation must not open a drawer on another page.
  useEffect(() => () => { generationRef.current += 1; }, [site.slug]);

  const showContact = useCallback(() => {
    // Let the existing footer consume the selected location before locating its contact links.
    window.requestAnimationFrame(() => {
      const main = mainRef.current;
      const footer = main?.querySelector<HTMLElement>('[data-preview-section="footer"]');
      if (!main || !footer) return;
      const scrollParent = findScrollParent(footer);
      if (!scrollParent) return;
      const contact = footer.querySelector<HTMLElement>('a[href^="tel:"], a[href^="mailto:"]')
        ?? footer.querySelector<HTMLElement>("[data-contact-trigger]");
      const target = contact ?? footer;
      const nav = main.querySelector<HTMLElement>(".mc-site-nav");
      const scrollRect = scrollParent.getBoundingClientRect();
      const scale = scrollParent.clientWidth > 0 ? scrollRect.width / scrollParent.clientWidth : 1;
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
      const maxTop = Math.max(0, scrollParent.scrollHeight - scrollParent.clientHeight);
      // The existing desktop Editorial footer is uncovered at the end of the page.
      const top = getComputedStyle(footer).position === "sticky"
        ? maxTop
        : scrollParent.scrollTop + (target.getBoundingClientRect().top - scrollRect.top) / safeScale - (nav?.offsetHeight ?? 0) - 12;
      contact?.focus({ preventScroll: true });
      scrollParent.scrollTo({
        top: Math.max(0, Math.min(top, maxTop)),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    });
  }, []);

  const book = useCallback(async (intent: WebsiteBookIntent = {}) => {
    if (requestRef.current) return;
    const location = intent.locationId != null
      ? data.locations.find((candidate) => candidate.id === intent.locationId)
      : selectedLocation;
    if (location) setSelectedLocationId(location.id);
    if (!location || !location.allowOnlineBooking) {
      showContact();
      return;
    }

    requestRef.current = true;
    setPending(true);
    const generation = generationRef.current;
    try {
      // Use the existing location catalog, including its current staff pricing,
      // duration spreads, packages, policy and Marketplace eligibility checks.
      const listing = await getListing(String(location.id));
      if (generation !== generationRef.current) return;
      if (!listing.allowOnlineBooking || (!listing.services.length && !listing.bundles.length)) {
        showContact();
        return;
      }
      if (intent.teamMemberId != null) {
        const member = listing.teamMembers.find((candidate) => candidate.id === intent.teamMemberId);
        if (!member) {
          showContact();
          return;
        }
        setProfile({ member, listing });
        return;
      }

      const services: BookingSelectionItem[] = [];
      if (intent.serviceId != null) {
        const service = listing.services.find((candidate) => candidate.id === intent.serviceId);
        if (!service) {
          showContact();
          return;
        }
        services.push({
          serviceId: service.id,
          name: service.name,
          priceAmountMinor: service.priceAmountMinor,
          duration: service.duration,
          priceFromMinor: service.priceFromMinor,
          priceVariesByStaff: service.priceVariesByStaff,
          durationMinMinutes: service.durationMinMinutes,
          durationMaxMinutes: service.durationMaxMinutes,
          durationVariesByStaff: service.durationVariesByStaff,
        });
      } else if (intent.bundleId != null) {
        const bundle = listing.bundles.find((candidate) => candidate.id === intent.bundleId);
        if (!bundle) {
          showContact();
          return;
        }
        services.push({
          bundleId: bundle.id,
          name: bundle.name,
          priceAmountMinor: bundle.priceAmountMinor,
          duration: bundle.duration,
          durationMinMinutes: bundle.durationMinMinutes,
          durationMaxMinutes: bundle.durationMaxMinutes,
          durationVariesByStaff: bundle.durationVariesByStaff,
        });
      }

      openBooking({
        websiteSlug: site.slug,
        businessId: listing.businessId,
        listingId: listing.listingId,
        locationId: listing.locationId,
        timezone: listing.timezone,
        currency: listing.businessCurrency,
        bookingPolicy: listing.bookingPolicy,
        services,
        catalog: {
          serviceCategories: listing.serviceCategories,
          services: listing.services,
          bundles: listing.bundles,
        },
      });
    } catch (error) {
      if (generation !== generationRef.current) return;
      if (error instanceof ApiError && error.status === 404) showContact();
      else toast(dict.booking.catalogLoadError, "warn");
    } finally {
      if (generation === generationRef.current) {
        requestRef.current = false;
        setPending(false);
      }
    }
  }, [data.locations, selectedLocation, site.slug, openBooking, showContact, toast, dict]);

  const actions = useMemo(() => ({ book: (intent?: WebsiteBookIntent) => { void book(intent); }, pending }), [book, pending]);
  const fontHref = fontStylesheetFor(data.fontKey);

  return (
    <>
      <main ref={mainRef} style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden" }}>
        {fontHref && (
          <>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={fontHref} precedence="default" />
          </>
        )}
        <MicrositeActionsContext.Provider value={actions}>
          <LivePreview
            layout={layout}
            data={data}
            chrome
            selectedLocationId={selectedLocation?.id ?? null}
            onSelectedLocationChange={setSelectedLocationId}
          />
        </MicrositeActionsContext.Provider>
      </main>
      {profile && (
        <TeamMemberProfileModal
          member={profile.member}
          listing={profile.listing}
          websiteSlug={site.slug}
          locale={locale}
          onClose={() => setProfile(null)}
        />
      )}
    </>
  );
}
