import { APPLE_APP_SITE_ASSOCIATION } from "@/lib/app-links";

export const dynamic = "force-static";

// Apple requires JSON at this exact, extensionless path, with no redirects.
export function GET() {
  return Response.json(APPLE_APP_SITE_ASSOCIATION);
}
