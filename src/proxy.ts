import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { CSRF_COOKIE_NAME } from "@/lib/auth/cookies";

const PREFIXED = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

const ACCOUNT_PATH_RE = new RegExp(
  `^/(?:(${PREFIXED.join("|")})/)?account(?:/.*)?$`,
);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth gate for /account (and its locale-prefixed variants).
  // Cheap-deny only: presence of CSRF cookie is a hint, not proof of session.
  // Real session validation happens client-side via /refresh + /me.
  const accountMatch = pathname.match(ACCOUNT_PATH_RE);
  if (accountMatch && !request.cookies.get(CSRF_COOKIE_NAME)) {
    const locale = accountMatch[1] ?? DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = locale === DEFAULT_LOCALE ? "/login" : `/${locale}/login`;
    url.search = "";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url, 307);
  }

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
