import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { SITE_URL } from "@/lib/site";
import { LOCALES, isLocale } from "@/i18n/locales";
import { dictionaries } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ToastProvider, ToastHost } from "@/components/ui";
import { SearchOverlayProvider } from "@/components/search/search-overlay-provider";
import { SiteHeader } from "@/components/shell/site-header";
import { ConditionalFooter } from "@/components/shell/conditional-footer";
import { MobileTabs } from "@/components/shell/mobile-tabs";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AuthModalProvider } from "@/components/shell/auth-modal-provider";
import { BookingProvider } from "@/lib/booking";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = dictionaries[locale];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.home.title,
      template: "%s | Zavoia",
    },
    description: dict.home.description,
  };
}

export default async function LocaleRootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body className={`${fontVariables} antialiased`}>
        <AuthProvider>
          <I18nProvider locale={locale}>
            <ToastProvider>
              {/* The auth modal is owned once here so the header's "Sign in"
                  button and the booking drawer's sign-in gate can both open it
                  via useAuthModal(). It wraps the booking + header tree. */}
              <AuthModalProvider>
              {/* The booking flow is mounted once here (inside i18n + toast +
                  auth-modal) so any page's Book CTAs can open the drawer via
                  useBooking(); the drawer's sign-in gate uses useAuthModal(). */}
              <BookingProvider>
              {/* The command-search overlay is mounted once here (inside i18n +
                  toast) so the nav pill, home hero and search page can all open
                  it via useSearchOverlay(). It renders its own <SearchOverlay/>. */}
              <SearchOverlayProvider>
                <SiteHeader locale={locale} />
                {/* Each Phase-1 page renders its own <main> landmark, so this
                    content region is a plain wrapper to avoid nesting two
                    <main> elements (invalid HTML / duplicate landmark). */}
                <div className="zw-page-in">{children}</div>
                {/* Footer + mobile spacer are suppressed on the full-bleed
                    /search route (a nested layout can't remove parent chrome). */}
                <ConditionalFooter locale={locale} />
                <MobileTabs locale={locale} />
                <ToastHost />
              </SearchOverlayProvider>
              </BookingProvider>
              </AuthModalProvider>
            </ToastProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
