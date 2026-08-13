"use client";

/*
 * DIRECTION CONTRACT — brand page (/[locale]/brand/[slug])
 * THESIS: the brand page opens on the choice itself — the brand's locations —
 *   with identity compressed into a single trust band; it refuses the
 *   category-default profile-hero-plus-tab-stack.
 * OWN-WORLD: zavoia-web incumbent — warm canvas (--c-canvas), oklch warm-gray
 *   text ramp, terracotta primary (--p-500/600), Geist Sans, photo-forward
 *   cards with hover-lift + zoom, stagger rise-in as the one authored motion.
 * STORY: visitor lands from a brand card → recognizes the brand and its
 *   credibility in one line (logo, rating, established, industry) → compares
 *   locations immediately → clicks one to book, or meets the team and jumps to
 *   a member's profile on their location page.
 * FIRST VIEWPORT: back link; identity band (logo avatar left; name; rating ·
 *   industry · city · since meta; tagline) directly above a full-width
 *   locations grid — one large photo card per location with name, address,
 *   rating, and the page's primary action ("View & book").
 * FORM: Location-first — candidate 3 of 7 grounded structures; seed a70871c2.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, and DESIGN.md.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, CatDot, Icon, Img, Rating } from "@/components/ui";
import {
  TeamMemberProfileModal,
  type TeamMemberSeed,
} from "@/app/[locale]/business/_components/team-member-profile-modal";
import { taxonomyLabel, toCat } from "@/lib/marketplace/card-mappers";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routes";
import type { Locale } from "@/i18n/locales";
import type {
  BrandDetail as BrandDetailData,
  BrandLocation,
  BrandTeamMember,
} from "@/lib/api/marketplace/types";

interface Props {
  brand: BrandDetailData;
  locale: Locale;
}

/** Location detail route href (slug preferred, numeric id fallback). */
function locationHref(locale: Locale, l: { slug: string | null; id: number }) {
  return localeHref(locale, "business", String(l.slug ?? l.id));
}

export function BrandDetail({ brand, locale }: Props) {
  const { dict } = useTranslation();
  const router = useRouter();
  const t = dict.brandPage;
  const tb = dict.business;

  // Back: in-session history when it exists, otherwise (shared/pasted URL in a
  // fresh tab) fall back to the explore home so the control is never dead.
  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push(localeHref(locale));
    }
  };

  const cat = toCat(brand.industry);
  const industryLabel = brand.industry
    ? taxonomyLabel(brand.industry, locale)
    : null;
  // One city when every location shares it, else the country as the umbrella.
  const cities = [
    ...new Set(brand.locations.map((l) => l.city).filter(Boolean)),
  ] as string[];
  const placeLabel = cities.length === 1 ? cities[0] : (brand.country ?? null);

  const aboutText = brand.aboutContent ?? brand.description;
  const multiLocation = brand.locations.length > 1;

  // Team member profile opens in place (favorites-flow modal: unscoped profile
  // + booking-context venues, so multi-location members get the venue picker).
  const [openMember, setOpenMember] = useState<TeamMemberSeed | null>(null);

  return (
    <main className="zw-container" style={{ paddingTop: 22, width: "100%" }}>
      {/* Back */}
      <button
        type="button"
        className="tap"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 20,
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontSize: 13.5,
          fontWeight: 600,
          color: "var(--c-600)",
          padding: "4px 0",
        }}
      >
        <Icon name="back" size={14} color="var(--c-600)" />
        {tb.back}
      </button>

      {/* Identity band — who this brand is, in one line */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(16px, 2.5vw, 26px)",
          flexWrap: "wrap",
        }}
      >
        <Avatar
          src={brand.logo ?? undefined}
          name={brand.name}
          size={84}
          ring
        />
        <div style={{ minWidth: 240, flex: 1 }}>
          <h1
            className="txt-balance"
            style={{
              margin: 0,
              fontSize: "clamp(28px, 3.4vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.04,
              color: "var(--c-900)",
            }}
          >
            {brand.name}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 9,
              rowGap: 6,
              marginTop: 10,
              fontSize: 14,
              color: "var(--c-600)",
            }}
          >
            {/* Each `·` trails its PRECEDING item in one nowrap span, so a
                wrapped line ends "…București ·" (continuation mark) and never
                opens with a stranded separator. */}
            {[
              brand.averageRating != null && (
                <Rating
                  rating={brand.averageRating}
                  reviews={brand.totalReviews}
                  size={14}
                />
              ),
              industryLabel && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CatDot cat={cat} size={8} />
                  {industryLabel}
                </span>
              ),
              placeLabel && <span>{placeLabel}</span>,
              brand.establishedYear != null && (
                <span>
                  {format(t.since, { year: String(brand.establishedYear) })}
                </span>
              ),
            ]
              .filter(Boolean)
              .map((item, i, arr) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                  {i < arr.length - 1 && (
                    <span aria-hidden="true" style={{ opacity: 0.45 }}>
                      ·
                    </span>
                  )}
                </span>
              ))}
          </div>
          {brand.tagline && (
            <p
              className="txt-pretty"
              style={{
                margin: "10px 0 0",
                fontSize: 15.5,
                lineHeight: 1.45,
                color: "var(--c-700)",
                maxWidth: 560,
              }}
            >
              {brand.tagline}
            </p>
          )}
        </div>
      </header>

      {/* Locations — the decision this page exists for */}
      {brand.locations.length > 0 && (
        <section style={{ marginTop: "clamp(30px, 4.5vw, 46px)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(20px, 2.2vw, 26px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--c-900)",
              }}
            >
              {brand.locationsCount === 1 ? t.locationsTitleOne : t.locationsTitle}
            </h2>
            {brand.locationsCount > 1 && (
              <span
                style={{ fontSize: 13.5, color: "var(--c-600)", flexShrink: 0 }}
              >
                {format(t.locationsCount, {
                  count: String(brand.locationsCount),
                })}
              </span>
            )}
          </div>
          <div
            className="zw-stagger"
            style={{
              display: "grid",
              gridTemplateColumns: multiLocation
                ? "repeat(auto-fit, minmax(min(300px, 100%), 1fr))"
                : "minmax(0, 640px)",
              gap: 18,
            }}
          >
            {brand.locations.map((l) => (
              <LocationCard key={l.id} l={l} locale={locale} cta={t.viewLocation} />
            ))}
          </div>
        </section>
      )}

      {/* Team — click a person → their profile modal over this page */}
      {brand.teamMembers.length > 0 && (
        <section style={{ marginTop: "clamp(38px, 5.5vw, 60px)" }}>
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: "clamp(20px, 2.2vw, 26px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--c-900)",
            }}
          >
            {t.teamTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {brand.teamMembers.map((m) => (
              <TeamMemberCard
                key={m.id}
                m={m}
                locationName={
                  multiLocation
                    ? (brand.locations.find((l) => l.id === m.locationId)
                        ?.name ?? null)
                    : null
                }
                worksAtLabel={t.worksAt}
                onOpen={() =>
                  setOpenMember({
                    id: m.id,
                    firstName: null,
                    lastName: null,
                    displayName: m.displayName,
                    profileImage: m.profileImage,
                    professionalTitle: m.professionalTitle,
                    averageRating: m.averageRating,
                    totalReviews: m.totalReviews,
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      {openMember && (
        <TeamMemberProfileModal
          member={openMember}
          businessId={brand.businessId}
          locale={locale}
          onClose={() => setOpenMember(null)}
        />
      )}

      {/* About — story and proof close the page */}
      {(aboutText || brand.heroImageUrl) && (
        <section
          style={{
            marginTop: "clamp(38px, 5.5vw, 60px)",
            marginBottom: "clamp(50px, 7vw, 90px)",
          }}
        >
          <h2
            style={{
              margin: "0 0 18px",
              fontSize: "clamp(20px, 2.2vw, 26px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--c-900)",
            }}
          >
            {format(t.aboutTitle, { name: brand.name })}
          </h2>
          {brand.heroImageUrl && (
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                marginBottom: aboutText ? 22 : 0,
                boxShadow: "var(--sh-md)",
              }}
            >
              <Img
                src={brand.heroImageUrl}
                alt={brand.name}
                label={cat}
                style={{
                  width: "100%",
                  height: "clamp(200px, 30vw, 340px)",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}
          {aboutText && (
            <p
              className="txt-pretty"
              style={{
                margin: 0,
                fontSize: 15.5,
                lineHeight: 1.65,
                color: "var(--c-700)",
                maxWidth: "68ch",
                whiteSpace: "pre-line",
              }}
            >
              {aboutText}
            </p>
          )}
        </section>
      )}
    </main>
  );
}

/**
 * One location = one photo-forward decision card. The whole card links to the
 * location's detail page (slug-first).
 */
function LocationCard({
  l,
  locale,
  cta,
}: {
  l: BrandLocation;
  locale: Locale;
  cta: string;
}) {
  return (
    <Link
      href={locationHref(locale, l)}
      className="zw-hover-lift zw-zoom-parent"
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        textDecoration: "none",
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div
        className="zw-zoom-wrap"
        style={{ aspectRatio: "16 / 9", overflow: "hidden" }}
      >
        <Img
          src={l.featuredImage ?? undefined}
          alt={l.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--c-900)",
            }}
          >
            {l.name}
          </h3>
          {l.averageRating != null && (
            <Rating rating={l.averageRating} reviews={l.totalReviews} size={13} />
          )}
        </div>
        {(l.address || l.city) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              fontSize: 13.5,
              color: "var(--c-600)",
              minWidth: 0,
            }}
          >
            <Icon name="pin" size={13} color="var(--c-500)" />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {l.address ?? l.city}
            </span>
          </div>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 14,
            fontSize: 14,
            fontWeight: 650,
            color: "var(--p-600)",
          }}
        >
          {cta}
          <Icon name="arrowR" size={14} color="var(--p-600)" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Team member card → opens the member's profile modal in place (favorites
 * flow: multi-location members get the venue picker). Same card grammar as
 * the location page's team tab.
 */
function TeamMemberCard({
  m,
  locationName,
  worksAtLabel,
  onOpen,
}: {
  m: BrandTeamMember;
  locationName: string | null;
  worksAtLabel: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="zw-hover-lift tap"
      style={{
        background: "#fff",
        border: "1px solid rgba(28,28,26,0.07)",
        borderRadius: 18,
        padding: "22px 16px 18px",
        textAlign: "center",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        boxShadow: "var(--sh-sm)",
      }}
    >
      <Avatar
        src={m.profileImage ?? undefined}
        name={m.displayName ?? ""}
        size={72}
        ring
      />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--c-900)",
          letterSpacing: "-0.015em",
          marginTop: 4,
        }}
      >
        {m.displayName}
      </div>
      {m.professionalTitle && (
        <div style={{ fontSize: 12.5, color: "var(--c-600)", marginTop: -4 }}>
          {m.professionalTitle}
        </div>
      )}
      {m.averageRating != null && (
        <Rating rating={m.averageRating} reviews={m.totalReviews} size={12.5} />
      )}
      {locationName && (
        <div style={{ fontSize: 12, color: "var(--c-600)" }}>
          {format(worksAtLabel, { location: locationName })}
        </div>
      )}
    </button>
  );
}
