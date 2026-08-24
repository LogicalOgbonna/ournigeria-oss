import { Hero } from "@/components/sections/Hero";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";
import { PageLayout } from "@/components/layout/PageLayout";
import { StructuredData } from "@/app/_seo/structured-data";
import type { BallotRace } from "@/lib/election-ballot";

export function HomeContent({
  electionActive = false,
  electionState,
  initialBallot,
  officeYears,
}: {
  electionActive?: boolean;
  electionState?: string;
  initialBallot?: BallotRace[];
  officeYears?: { office: string; year: number }[];
}) {
  return (
    <PageLayout>
      <StructuredData />
      <WelcomeModalWrapper />
      <Hero
        electionActive={electionActive}
        electionState={electionState}
        initialBallot={initialBallot}
        officeYears={officeYears}
      />
      <PersonalizedData />
    </PageLayout>
  );
}
