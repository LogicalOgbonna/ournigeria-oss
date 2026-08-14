import { BackButton } from "@/components/ui/BackButton";
import { PageLayout } from "@/components/layout/PageLayout";
import { months } from "@/lib/utils";
import { notFound, permanentRedirect } from "next/navigation";
import { getLgaDetails, getFaacPeriods, ApiError } from "@/lib/api";
import { getElectionGate, isElectionEnabledFor } from "@/lib/election-gate";
import { ElectionSection } from "@/components/civic/ElectionSection";
import { StructuredData } from "./_seo/structured-data";
import {
  LgaHero,
  ProjectsTracking,
  WardsDirectory,
  WhoGovernsYou,
  MissingDataCta,
} from "./_component";

export { generateMetadata } from "./_seo/util";

type Props = {
  params: Promise<{ state_slug: string; lga_slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LgaPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined;
  const month = typeof resolvedSearchParams.month === 'string' ? resolvedSearchParams.month : undefined;

  let faacPeriods: { years: number[]; monthsByYear: Record<number, number[]> } = { years: [], monthsByYear: {} };
  try {
    faacPeriods = await getFaacPeriods();
  } catch (err) {
    console.error("Failed to load FAAC periods:", err);
  }

  let lga = null;
  try {
    lga = await getLgaDetails(resolvedParams.state_slug, resolvedParams.lga_slug, year, month);
  } catch (error) {
    // 404 = LGA orphaned by the resync → fall through to the state redirect below. Other
    // errors (5xx / network) keep the prior not-found behavior.
    if (!(error instanceof ApiError && error.status === 404)) {
      console.error("Exception fetching LGA details:", error);
      notFound();
    }
  }

  // LGA missing / not found → 308 to the parent state page. permanentRedirect MUST be
  // outside the try/catch (it throws, which the catch would swallow).
  if (!lga || lga.error) {
    permanentRedirect(`/states/${resolvedParams.state_slug}`);
  }

  const gate = await getElectionGate();
  const showElection = isElectionEnabledFor(gate, {
    state: resolvedParams.state_slug,
    lga: resolvedParams.lga_slug,
  });

  const { stateName, name: lgaName, wards } = lga;

  return (
    <PageLayout navLabel={`${lgaName} LGA`} className="bg-background" mainClassName="container max-w-6xl mx-auto px-4 pt-24 pb-20">
      <StructuredData lga={lga} resolvedParams={resolvedParams} year={year} month={month} months={months} />
      <BackButton fallbackHref={`/states/${resolvedParams.state_slug}`} fallbackLabel={stateName} className="mb-8" />
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0 space-y-16">
          {showElection && <ElectionSection scope="lga" name={lgaName} />}
          <LgaHero lga={lga} stateSlug={resolvedParams.state_slug} faacPeriods={faacPeriods} year={year} month={month} />
          <ProjectsTracking lgaName={lgaName} />
          <WardsDirectory wards={wards} stateSlug={resolvedParams.state_slug} lgaSlug={resolvedParams.lga_slug} lgaName={lgaName} />
        </div>
        <div className="w-full lg:w-80 shrink-0 space-y-8">
          <WhoGovernsYou lga={lga} />
          <MissingDataCta lgaName={lgaName} />
        </div>
      </div>
    </PageLayout>
  );
}
