import { BackButton } from "@/components/ui/BackButton";
import { PageLayout } from "@/components/layout/PageLayout";
import { getWardDetails, getWards, ApiError } from "@/lib/api";
import { RelatedLinks, type RelatedLink } from "@/components/civic/RelatedLinks";
import { notFound, permanentRedirect } from "next/navigation";
import { StructuredData } from "./_seo/structured-data";
import {
  WardHero,
  WardConstituencies,
  WhoIsResponsible,
  WardProjects,
  CommunityUpdates,
} from "./_component";

export { generateMetadata } from "./_seo/util";

export const revalidate = 60;

type Props = {
  params: Promise<{ state_slug: string; lga_slug: string; ward_slug: string }>;
};

export default async function WardPage({
  params,
}: Props) {
  const resolvedParams = await params;

  let ward = null;
  try {
    ward = await getWardDetails(resolvedParams.state_slug, resolvedParams.lga_slug, resolvedParams.ward_slug);
  } catch (error) {
    // A 404 means the ward was orphaned by the INEC ward resync → fall through to the LGA
    // redirect below. Any other error (5xx / network) keeps the prior not-found behavior.
    if (!(error instanceof ApiError && error.status === 404)) {
      notFound();
    }
  }

  // Ward missing / not found → 308 to the parent LGA page (which lists the current INEC
  // wards), preserving the old indexed URL's SEO equity instead of 404ing. permanentRedirect
  // MUST be outside the try/catch — it works by throwing, which the catch would swallow.
  if (!ward || ward.error) {
    permanentRedirect(`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`);
  }

  const { stateName, lgaName, name: wardName, code: wardCode, lgaCode } = ward;

  // Retention Phase 1 — give the one-shot ward visitor sibling wards to explore.
  // Best-effort: a failed sibling fetch must never break the page.
  let siblingWardLinks: RelatedLink[] = [];
  if (lgaCode) {
    try {
      const wards = await getWards(lgaCode);
      siblingWardLinks = (wards || [])
        .filter((w) => w.code !== wardCode)
        .map((w) => ({
          href: `/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${w.name
            .toLowerCase()
            .split("/")[0]
            .replace(/\s+/g, "-")}`,
          label: w.name,
        }));
    } catch {
      siblingWardLinks = [];
    }
  }

  return (
    <PageLayout navLabel={`${wardName} Ward`} className="bg-background" mainClassName="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-16">
      <StructuredData ward={ward} resolvedParams={resolvedParams} />
      <BackButton
        fallbackHref={`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`}
        fallbackLabel={`${lgaName} LGA`}
        className="mb-8"
      />
      <WardHero
        stateName={stateName}
        lgaName={lgaName}
        wardName={wardName}
        stateSlug={resolvedParams.state_slug}
        lgaSlug={resolvedParams.lga_slug}
      />
      <WhoIsResponsible ward={ward} />
      <WardConstituencies
        constituencies={ward.constituencies}
        wardName={wardName}
        stateCode={ward.stateCode}
      />
      <WardProjects wardName={wardName} />
      <CommunityUpdates updates={ward.civicUpdates ?? []} />
      <RelatedLinks title={`Other wards in ${lgaName}`} items={siblingWardLinks} />
    </PageLayout>
  );
}
