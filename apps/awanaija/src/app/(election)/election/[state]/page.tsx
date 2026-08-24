import type { Metadata } from "next";
import { redirect } from "next/navigation";

// There is no state-scoped election view yet — the hub itself is still a
// holding page. Links minted while the old rewrite was live land on /election
// rather than the homepage, so the state in the URL at least gets them to the
// right place.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: "/election" },
};

export default function ElectionStatePage() {
  redirect("/election");
}
