"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NotFoundPage } from "@/app/_components/not-found/not-found-page";
import { useTranslation } from "@/i18n/useTranslation";

// Request headers would opt cached routes into dynamic rendering. Read the
// visible URL after hydration instead: proxy rewrites can give the server a
// different pathname from the one in the address bar.
export default function LocaleNotFound() {
  const { locale, dict } = useTranslation();
  const routePathname = usePathname();
  const [pathname, setPathname] = useState<string>();

  useEffect(() => {
    // Stable initial markup follows Next's usePathname guidance for rewrites.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPathname(window.location.pathname);
  }, [routePathname]);

  return <NotFoundPage dictionary={dict} locale={locale} pathname={pathname} />;
}
