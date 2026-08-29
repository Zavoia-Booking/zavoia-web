import { revalidateTag } from "next/cache";
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

  if (!body?._type) {
    return new NextResponse("Bad request", { status: 400 });
  }

  revalidateTag("post", "max");

  for (const slugEntry of Object.values(body.slug ?? {})) {
    const current = slugEntry?.current;
    if (current) revalidateTag(`post:${current}`, "max");
  }

  return NextResponse.json({ revalidated: true, type: body._type });
}
