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

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;
  const redirectParam = Array.isArray(sp.redirect)
    ? sp.redirect[0]
    : sp.redirect;

  const query = new URLSearchParams();
  query.set("mode", "register");
  if (redirectParam) query.set("redirect", redirectParam);

  redirect(`${localeHref(locale, "auth")}?${query.toString()}`);
}
