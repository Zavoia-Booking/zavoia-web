import { profileLinkHref } from "./profile-link";

const platforms = ["website", "instagram", "facebook", "tiktok", "pinterest"] as const;
export type BusinessLinkKey = (typeof platforms)[number];
export type BusinessProfileLinks = Partial<Record<`${BusinessLinkKey}Url`, string | null>>;

export function businessProfileLinks(profile: BusinessProfileLinks) {
  return platforms.flatMap(key => {
    const href = profileLinkHref(profile[`${key}Url`]);
    return href ? [{ key, href }] : [];
  });
}

export function businessSameAs(profile: BusinessProfileLinks) {
  return [...new Set(businessProfileLinks(profile).map(link => link.href))];
}
