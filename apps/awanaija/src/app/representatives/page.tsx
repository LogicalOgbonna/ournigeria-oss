import { Suspense } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { RepresentativesClient } from "./_component/RepresentativesClient";
import { loadRepresentativesData } from "./utils";

export { metadata } from "./_seo/util";

export default async function RepresentativesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; stateName?: string; lga?: string; lgaName?: string; ward?: string; wardName?: string }>;
}) {
  const { initialChain, initialLocation, stateDetails, lgaDetails } = await loadRepresentativesData(await searchParams);
  return (
    <PageLayout bare className="bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.15_0.005_260)]">
      <Suspense fallback={<div className="flex-1 max-w-7xl mx-auto px-4 pt-24 pb-20 w-full" />}>
        <RepresentativesClient
          initialChain={initialChain}
          initialLocation={initialLocation}
          stateDetails={stateDetails}
          lgaDetails={lgaDetails}
        />
      </Suspense>
    </PageLayout>
  );
}
