import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { NewProposalContent } from "./_component/NewProposalContent";
import { proposalCardFromParams } from "@/lib/og-proposal";
import { ogIdentityHeadlineText } from "@/lib/og-identity";

/**
 * Only these params shape the link-preview card, so only these go into the
 * og:image URL. Forwarding everything (UTM tags especially) would mint a
 * distinct image URL per campaign variant and defeat crawler/CDN caching.
 */
const OG_PARAM_WHITELIST = [
  "role",
  "stateCode",
  "stateName",
  "lgaCode",
  "lgaName",
  "wardCode",
  "wardName",
  "constituencyCode",
] as const;

// The identify flow deep-links here with ward/LGA context in the query string,
// so Google discovers thousands of query variants of this one form. The
// canonical folds them all into the clean URL; the preview card, by contrast,
// is built FROM the variant so the share makes its specific ask.
export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const card = proposalCardFromParams(searchParams);

  const img = new URLSearchParams();
  for (const key of OG_PARAM_WHITELIST) {
    const v = searchParams[key];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) img.set(key, s);
  }
  // Deploy-scoped version param: X/WhatsApp cache image validation PER IMAGE
  // URL (including failures — a pre-release 404 sticks for days). Varying the
  // URL each deploy busts those caches; without this, a share that failed once
  // never recovers even with a cache-busted page URL.
  const ogVersion = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  if (ogVersion) img.set("v", ogVersion);
  const image = { url: `/og/proposal?${img.toString()}`, width: 1200, height: 630 };

  const title = `${ogIdentityHeadlineText(card.headline)} | OurNigeria`;
  const description = card.subline ?? "";

  return {
    title,
    description,
    alternates: { canonical: "/proposals/new" },
    openGraph: { title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function NewProposalPage() {
  return (
    <PageLayout bare navLabel="Proposal" className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <Suspense fallback={<div className="flex-grow pt-24" />}>
        <NewProposalContent />
      </Suspense>
    </PageLayout>
  );
}
