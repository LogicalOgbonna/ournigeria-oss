import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { parseRevalidateRequest } from "@/lib/revalidate-request";

/**
 * On-demand cache invalidation, called by the API's RevalidationService after
 * dashboard mutations (election publish/unpublish, ticket edits) so changes
 * appear on the next request instead of waiting out the ISR windows. The ISR
 * `revalidate` values stay in place as the fallback when this hook is never
 * called — pages remain fully static for crawlers either way.
 *
 * Auth: shared secret (`REVALIDATE_SECRET`) as a bearer token; the endpoint is
 * dead when the secret is unset. Tags are allowlisted in `revalidate-request`.
 */
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // parse failure handled below as "body required"
  }
  const parsed = parseRevalidateRequest(
    req.headers.get("authorization"),
    body,
    process.env.REVALIDATE_SECRET,
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  // Next 16 signature: the "max" cache-life profile = classic expire-now.
  for (const tag of parsed.request.tags) revalidateTag(tag, "max");
  for (const path of parsed.request.paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    tags: parsed.request.tags,
    paths: parsed.request.paths,
  });
}
