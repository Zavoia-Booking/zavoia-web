import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { revalidateSecret } from "@/sanity/env";

type WebhookPayload = {
  _type?: string;
  slug?: Record<string, { current?: string } | undefined>;
};

export async function POST(req: NextRequest) {
  if (!revalidateSecret) {
    return new NextResponse(
      "SANITY_REVALIDATE_SECRET not configured",
      { status: 500 },
    );
  }

  // `parseBody`'s internal `JSON.parse` is unguarded (see
  // next-sanity/dist/webhook), so a malformed payload — signed or not —
  // throws rather than returning a result. The sibling
  // /api/revalidate/business route guards its own `req.json()` the same way:
  // a bad body from a webhook is an expected 400, never an unhandled 500.
  let isValidSignature: boolean | null;
  let body: WebhookPayload | null;
  try {
    ({ isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      revalidateSecret,
    ));
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  if (!isValidSignature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  if (typeof body?._type !== "string" || !body._type.trim()) {
    return new NextResponse("Bad request", { status: 400 });
  }

  if (body._type !== "post") {
    return NextResponse.json({ revalidated: false, type: body._type });
  }

  // Publish, unpublish and delete events change both article markup and URL
  // inventory. Expire immediately: serving an old post collection while its
  // replacement loads can keep removed articles in an otherwise fresh sitemap.
  revalidateTag("post", { expire: 0 });

  for (const slugEntry of Object.values(body.slug ?? {})) {
    const current = slugEntry?.current;
    if (current) revalidateTag(`post:${current}`, { expire: 0 });
  }
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ revalidated: true, type: body._type });
}
