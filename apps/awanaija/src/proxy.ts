import { NextResponse, type NextRequest } from "next/server";
import { getViewerStateSlug } from "@/lib/viewer-region";
import { getElectionGate, isElectionEnabledFor } from "@/lib/election-gate";

// Next 16 renamed the "middleware" convention to "proxy" (file `proxy.ts`,
// exported `proxy` function). Runs per-request before the cache.
export async function proxy(req: NextRequest) {
  const stateSlug = getViewerStateSlug(req.headers, req.nextUrl.searchParams);
  if (!stateSlug) return NextResponse.next();

  const gate = await getElectionGate();
  if (isElectionEnabledFor(gate, { state: stateSlug })) {
    const url = req.nextUrl.clone();
    url.pathname = `/election/${stateSlug}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

// Homepage only. The matcher ensures the proxy never runs on the /election
// variant itself (no rewrite loop) or on any asset/API path.
export const config = {
  matcher: ["/"],
};
