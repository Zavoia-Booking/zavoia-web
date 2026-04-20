import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

const PREFIXED = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === `/${DEFAULT_LOCALE}` ||
    pathname.startsWith(`/${DEFAULT_LOCALE}/`)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(`/${DEFAULT_LOCALE}`.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  for (const l of PREFIXED) {
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return;
    }
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/|api/|studio|sitemap\\.xml|robots\\.txt|favicon\\.ico|.*\\.[^/]+$).*)",
  ],
};
