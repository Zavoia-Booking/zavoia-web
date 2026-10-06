import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/studio$",
        "/studio/",
        "/studio?",
        "/api/",
        "/login$",
        "/login/",
        "/login?",
        "/register$",
        "/register/",
        "/register?",
        "/account$",
        "/account/",
        "/account?",
        "/ro/login$",
        "/ro/login/",
        "/ro/login?",
        "/ro/register$",
        "/ro/register/",
        "/ro/register?",
        "/ro/account$",
        "/ro/account/",
        "/ro/account?",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
