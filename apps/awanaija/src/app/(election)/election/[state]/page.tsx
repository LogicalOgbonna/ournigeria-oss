import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Legacy shape. `/election/<state>` was minted while an old rewrite was live and
// never had a page of its own; the section now lives at `/elections`, and the
// bare `/election` → `/elections` hop is a 308 in `next.config.ts`. There is
// still no state-scoped election view, so the state in the URL is dropped and
// the visitor lands on the section index rather than the homepage.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/elections" },
};

export default function LegacyElectionStatePage() {
  redirect("/elections");
}
