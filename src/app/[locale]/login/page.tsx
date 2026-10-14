import { notFound, redirect } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;
  const redirectParam = Array.isArray(sp.redirect)
    ? sp.redirect[0]
    : sp.redirect;

  const query = new URLSearchParams();
  query.set("mode", "login");
  if (redirectParam) query.set("redirect", redirectParam);
  for (const language of LOCALES) {
    const key = `redirect.${language}`;
    const value = Array.isArray(sp[key]) ? sp[key][0] : sp[key];
    if (value) query.set(key, value);
  }

  redirect(`${localeHref(locale, "auth")}?${query.toString()}`);
}
