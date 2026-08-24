import { BackButton } from "@/components/ui/BackButton";
import { PageLayout } from "@/components/layout/PageLayout";
import { notFound, permanentRedirect } from "next/navigation";
import { getStateDetails, ApiError } from "@/lib/api";
import { months } from "@/lib/utils";
import { StructuredData } from "./_seo/structured-data";
import { getElectionGate, isElectionEnabledFor } from "@/lib/election-gate";
import { ElectionSection } from "@/components/civic/ElectionSection";
import {
  StateHero,
  BudgetBreakdown,
  SectorAllocation,
  LocalGovernments,
  LatestUpdates,
  WhoGovernsYou,
  OfficialResources,
  ContactAccountability,
  OfficialSocials,
  StateStats,
  MissingDataCta,
} from "./_component";

export { generateMetadata } from "./_seo/util";

export const revalidate = 60; // Revalidate every 60 seconds

type Props = {
  params: Promise<{ state_slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StatePage({
  params,
  searchParams,
}: Props) {
  const { state_slug } = await params;
  const resolvedSearchParams = await searchParams;
  const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined;
  const month = typeof resolvedSearchParams.month === 'string' ? resolvedSearchParams.month : undefined;

  let state = null;
  try {
    state = await getStateDetails(state_slug, year, month);
  } catch (error) {
    // 404 = unknown state slug → fall through to the /states redirect below. Other errors
    // (5xx / network) keep the prior not-found behavior.
    if (!(error instanceof ApiError && error.status === 404)) {
      console.error("Exception fetching state details:", error);
      notFound();
    }
  }

  // Unknown / missing state → 308 to the states index. permanentRedirect MUST be outside the
  // try/catch (it throws, which the catch would swallow).
  if (!state || state.error) {
    permanentRedirect(`/states`);
  }

  const { governor, stats, economy } = state;
  const profile = state.profile ?? null;

  const gate = await getElectionGate();
  const showElection = isElectionEnabledFor(gate, { state: state_slug });

  return (
    <PageLayout navLabel={`${state.name} State`} className="bg-background" mainClassName="container max-w-6xl mx-auto px-4 pt-24 pb-20">
      <StructuredData state={state} state_slug={state_slug} year={year} month={month} months={months} />
      <BackButton fallbackHref="/states" fallbackLabel="States" className="mb-8" />
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0 space-y-16">
          {showElection && <ElectionSection scope="state" name={state.name} />}
          <StateHero state={state} governor={governor} stats={stats} profile={profile} year={year} month={month} months={months} />
          <BudgetBreakdown state={state} />
          <SectorAllocation state={state} year={year} />
          <LocalGovernments lgas={state.lgas} stateSlug={state_slug} year={year} month={month} />
          <LatestUpdates stateName={state.name} />
        </div>
        <div className="w-full lg:w-80 shrink-0 space-y-12">
          <WhoGovernsYou governor={governor} constituencies={state.constituencies} />
          <OfficialResources links={profile?.links} />
          <ContactAccountability contact={profile?.contact} />
          <OfficialSocials socials={profile?.socials} />
          <StateStats profile={profile} economy={economy} lgaCount={state.lgas.length} year={year} />
          <MissingDataCta stateName={state.name} />
        </div>
      </div>
    </PageLayout>
  );
}
