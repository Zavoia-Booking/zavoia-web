import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notFoundMetadata } from "@/app/_components/not-found/metadata";
import { ProfessionalProfile } from "@/app/[locale]/business/_components/professional-profile";
import { dictionaries } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";
import { OPEN_GRAPH_LOCALES, SITE_URL, defaultSocialImage } from "@/lib/site";
import { getProfessionalPageBookingContext, getProfessionalPageProfile } from "@/lib/professionals/server";
import { professionalHref } from "@/lib/professionals/urls";
import { format } from "@/i18n/format";
import { professionalStructuredData, serializeJsonLd } from "@/lib/seo/page-structured-data";

type Props = {
  params: Promise<{ locale: string; uuid: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, uuid } = await params;
  if (!isLocale(locale)) return {};

  try {
    const profile = await getProfessionalPageProfile(uuid);
    if (!profile) return notFoundMetadata(locale);

    const name = profile.about?.displayName?.trim()
      || [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim()
      || dictionaries[locale].saved.unnamedPerson;
    const title = profile.about?.professionalTitle?.trim();
    // The role is what people search with the name ("Ana Pop, hair stylist").
    const pageTitle = title ? `${name}, ${title}` : name;
    const description = profile.about?.aboutMe?.trim()
      || format(dictionaries[locale].business.memberMetaDescription, { name: pageTitle });
    const languages = Object.fromEntries(
      LOCALES.map((language) => [language, professionalHref(language, profile.uuid)]),
    );
    const url = `${SITE_URL}${professionalHref(locale, profile.uuid)}`;
    const image = profile.profileImage?.trim();
    const socialImage = image ? { url: image, alt: name } : defaultSocialImage(locale);

    return {
      title: pageTitle,
      description,
      alternates: {
        canonical: url,
        languages: { ...languages, "x-default": languages[DEFAULT_LOCALE] },
      },
      openGraph: {
        type: "website",
        siteName: "Zavoia",
        title: pageTitle,
        description,
        url,
        locale: OPEN_GRAPH_LOCALES[locale],
        alternateLocale: LOCALES.filter((language) => language !== locale).map((language) => OPEN_GRAPH_LOCALES[language]),
        images: [socialImage],
      },
      twitter: {
        card: image ? "summary" : "summary_large_image",
        title: pageTitle,
        description,
        images: [socialImage],
      },
    };
  } catch {
    // The page's error boundary owns operational recovery. Keep a transient
    // failure out of search results rather than publishing a misleading profile.
    return { robots: { index: false, follow: false } };
  }
}

export default async function ProfessionalPage({ params }: Props) {
  const { locale, uuid } = await params;
  if (!isLocale(locale)) notFound();

  const profile = await getProfessionalPageProfile(uuid);
  if (!profile) notFound();
  const bookingContext = await getProfessionalPageBookingContext(profile.id);
  // Employers come only from a loaded booking context; a failed one adds none.
  const jsonLd = professionalStructuredData(
    profile,
    locale,
    bookingContext.status === "ready" ? bookingContext.context.businesses : [],
  );

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      )}
      <ProfessionalProfile
        key={profile.uuid}
        presentation="page"
        initialProfile={profile}
        initialBookingContext={bookingContext}
        locale={locale}
        member={{
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.about?.displayName ?? null,
          profileImage: profile.profileImage,
          professionalTitle: profile.about?.professionalTitle ?? null,
          averageRating: profile.reviewStats.averageRating,
          totalReviews: profile.reviewStats.totalCount,
        }}
      />
    </>
  );
}
