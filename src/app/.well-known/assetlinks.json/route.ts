import { ANDROID_ASSET_LINKS } from "@/lib/app-links";

export const dynamic = "force-static";

export function GET() {
  return Response.json(ANDROID_ASSET_LINKS);
}
