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
 *   credibility in one line (logo, rating, industry) → compares
 *   locations immediately → clicks one to book, or meets the team and jumps to
 *   a member's profile on their location page.
 * FIRST VIEWPORT: back link; identity band (logo avatar left; name; rating ·
 *   industry meta) directly above a full-width
 *   locations grid — one large photo card per location with name, address,
 *   rating, and the page's primary action ("View & book").
 * FORM: Location-first — candidate 3 of 7 grounded structures; seed a70871c2.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 *   finish review, the verdict, and DESIGN.md.
 */

import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Icon, Img, Rating } from "@/components/ui";
import { BusinessLinks } from "@/components/business/business-links";
import { IndustryExplore } from "@/components/business/industry-explore";
import {
  TeamMemberProfileModal,
  type TeamMemberSeed,
} from "@/app/[locale]/business/_components/team-member-profile-modal";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { industryVisual, knownIndustrySlugOf } from "@/lib/marketplace/industry-visuals";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { professionalHref } from "@/lib/professionals/urls";
import { SITE_HOST } from "@/lib/site";
import type { Locale } from "@/i18n/locales";
import type {
  BrandDetail as BrandDetailData,
  BrandLocation,
  BrandTeamMember,
} from "@/lib/api/marketplace/types";
import styles from "./brand-detail.module.css";

interface Props {
  brand: BrandDetailData;
  locale: Locale;
}

/** Location detail route href (slug preferred, numeric id fallback). */
function locationHref(locale: Locale, l: { slug: string | null; id: number }) {
  return localeHref(locale, "business", String(l.slug ?? l.id));
}

/** Match the location grid's 300px minimum, 18px gaps and shared gutters. */
function locationImageSizes(count: number): string {
  if (count <= 1) {
    return "(max-width: 600px) calc(100vw - 32px), (max-width: 680px) calc(100vw - 40px), 640px";
  }
  const columns = Math.min(count, 4);
  return [
    "(max-width: 600px) calc(100vw - 32px)",
    "(max-width: 657px) calc(100vw - 40px)",
    "(max-width: 920px) calc((100vw - 58px) / 2)",
    ...[[1039, 2], [1393, 3], [1556, 4]].map(([width, capacity]) => {
      const visibleColumns = Math.min(columns, capacity);
      return `(max-width: ${width}px) calc((90vw - ${18 * (visibleColumns - 1)}px) / ${visibleColumns})`;
    }),
    `${(1400 - 18 * (columns - 1)) / columns}px`,
  ].join(", ");
}

function BrandAbout({
  title,
  description,
  photoUrl,
}: {
  title: string;
  description: string | null;
  photoUrl: string | null;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photoSrc = photoFailed ? null : photoUrl;
  if (!description && !photoSrc) return null;

  const split = Boolean(description && photoSrc);

  return (
    <section
      className={styles.about}
      data-biz-cols
      style={{
        display: "grid",
        gridTemplateColumns: split ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
        alignItems: "center",
        gap: "clamp(20px, 4vw, 56px)",
        marginTop: "clamp(38px, 5.5vw, 60px)",
      }}
    >
      <div>
        <h2
          style={{
            margin: description ? "0 0 18px" : 0,
            fontSize: "clamp(20px, 2.2vw, 26px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--c-900)",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            className="txt-pretty"
            style={{
              margin: 0,
              fontSize: 15.5,
              lineHeight: 1.65,
              color: "var(--c-700)",
              maxWidth: "68ch",
              whiteSpace: "pre-line",
              overflowWrap: "anywhere",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {photoSrc && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 700,
            aspectRatio: "4 / 3",
            borderRadius: "var(--card-r, 18px)",
            backgroundColor: "var(--c-100)",
            overflow: "hidden",
          }}
        >
          <Img
            src={photoSrc}
            alt=""
            sizes={split
              ? "(max-width: 600px) calc(100vw - 32px), (max-width: 920px) calc(100vw - 40px), (max-width: 1556px) 45vw, 700px"
              : "(max-width: 600px) calc(100vw - 32px), (max-width: 740px) calc(100vw - 40px), 700px"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onFailure={() => setPhotoFailed(true)}
          />
        </div>
      )}
    </section>
  );
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

  const industrySlug = knownIndustrySlugOf(brand.industry);
  const visual = industryVisual(industrySlug);
  const industryLabel = brand.industry
    ? taxonomyLabel({ ...brand.industry, slug: industrySlug }, locale, dict.industries)
    : null;
  const industryExploreHref = industrySlug
    ? `${localeHref(locale, "search")}?${new URLSearchParams({ industry: industrySlug })}`
    : null;
  // The business's live Website Studio site, shown as its address (zavoia.com/<slug>).
  const websiteSlug = brand.website?.slug ?? null;
  const websiteLabel = websiteSlug ? `${SITE_HOST}/${websiteSlug}` : null;
  const websiteHintId = useId();

  const multiLocation = brand.locations.length > 1;
  const imageSizes = locationImageSizes(brand.locations.length);

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
          {/* Phones and tablets: the industry sits above the name (wider screens keep it in the meta line below). */}
          {industryLabel && (
            <div className={`zw-only-mobile ${styles.eyebrow}`}>
              <Icon name={visual.icon} color={visual.accent} size={18} />
              {industryLabel}
            </div>
          )}
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
            className="zw-only-desktop"
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
                wrapped line ends "…(10) ·" (continuation mark) and never
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
                    gap: 6,
                  }}
                >
                  <Icon name={visual.icon} color={visual.accent} size={18} />
                  {industryLabel}
                </span>
              ),
              // No city here: a brand's locations can be in different cities (the cards below show them).
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
          {/* Phones and tablets: only the rating stays under the name (the industry is above it). */}
          {brand.averageRating != null && (
            <div className={`zw-only-mobile ${styles.ratingMobile}`}>
              <Rating
                rating={brand.averageRating}
                reviews={brand.totalReviews}
                size={14}
              />
            </div>
          )}
        </div>
      </header>

      {/* Live Web Studio website: its own band between faded dividers */}
      {websiteSlug && websiteLabel && (
        <div className={styles.websiteSection}>
          <Link
            href={localeHref(locale, websiteSlug)}
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.websiteLink}
            aria-label={`${dict.homeSections.websiteShowcase.viewWebsite}: ${websiteLabel}`}
            aria-describedby={websiteHintId}
          >
            <Icon name="globe" size={20} color="var(--p-500)" />
            <span className={styles.websiteText}>{websiteLabel}</span>
            <Icon name="arrowUR" size={16} />
            <span id={websiteHintId} hidden>
              {dict.common.opensInNewTab}
            </span>
          </Link>
        </div>
      )}

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
            style={{
              display: "grid",
              gridTemplateColumns: multiLocation
                ? "repeat(auto-fit, minmax(min(300px, 100%), 1fr))"
                : "minmax(0, 640px)",
              gap: 18,
            }}
          >
            {brand.locations.map((l, index) => (
              <LocationCard key={l.id} l={l} locale={locale} cta={t.viewLocation} imageSizes={imageSizes} first={index === 0} />
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
          <div className={styles.teamGrid}>
            {brand.teamMembers.map((m) => (
              <TeamMemberCard
                key={m.id}
                m={m}
                locale={locale}
                locationName={
                  multiLocation
                    ? (brand.locations.find((l) => l.id === m.locationId)
                        ?.name ?? null)
                    : null
                }
                worksAtLabel={t.worksAt}
                viewProfileLabel={dict.locationPage.viewProfile}
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

      <BrandAbout
        key={brand.heroImageUrl}
        title={format(t.aboutTitle, { name: brand.name })}
        description={brand.description?.trim() || null}
        photoUrl={brand.heroImageUrl}
      />
      <BusinessLinks business={brand} className={styles.businessLinks} />
      {industryExploreHref && industryLabel && (
        <div style={{ marginTop: "clamp(32px, 4vw, 48px)", marginBottom: 24 }}>
          <IndustryExplore
            href={industryExploreHref}
            industry={industryLabel}
            visual={visual}
            lead={dict.locationPage.discoverLead}
            action={dict.locationPage.discoverAction}
            bottomDivider={false}
          />
        </div>
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
  imageSizes,
  first,
}: {
  l: BrandLocation;
  locale: Locale;
  cta: string;
  imageSizes: string;
  first: boolean;
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
        style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden" }}
      >
        <Img
          src={l.featuredImage ?? undefined}
          alt={l.name}
          sizes={imageSizes}
          loading={first ? "eager" : "lazy"}
          fetchPriority={first ? "high" : "auto"}
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
  locale,
  locationName,
  worksAtLabel,
  viewProfileLabel,
  onOpen,
}: {
  m: BrandTeamMember;
  locale: Locale;
  locationName: string | null;
  worksAtLabel: string;
  viewProfileLabel: string;
  onOpen: () => void;
}) {
  const cardProps = { className: `zw-hover-lift tap ${styles.teamCard}` };
  const content = (
    <>
      {/* The name follows in text; the photo would only repeat it. */}
      <span className={styles.teamPortrait} aria-hidden="true">
        <Avatar
          src={m.profileImage ?? undefined}
          name={m.displayName ?? ""}
          size={80}
          ring
          monogram
          loading="lazy"
          decorative
        />
      </span>
      <span className={styles.teamIdentity}>
        <strong>{m.displayName}</strong>
        {m.professionalTitle && <span>{m.professionalTitle}</span>}
        {m.averageRating != null && (
          <Rating rating={m.averageRating} reviews={m.totalReviews} size={13} />
        )}
        {locationName && (
          <span>{format(worksAtLabel, { location: locationName })}</span>
        )}
      </span>
      {/* The profile opens here, so a right arrow, not the leave-the-site one. */}
      <span className={styles.profileLink}>
        {viewProfileLabel}
        <Icon name="arrowR" size={14} />
      </span>
    </>
  );
  return m.publicProfileAvailable === true && m.uuid ? (
    <Link
      {...cardProps}
      href={professionalHref(locale, m.uuid)}
      prefetch={false}
      onNavigate={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      {content}
    </Link>
  ) : (
    <button {...cardProps} type="button" onClick={onOpen}>
      {content}
    </button>
  );
}
