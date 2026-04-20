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

  const { isValidSignature, body } = await parseBody<WebhookPayload>(
    req,
    revalidateSecret,
  );

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
