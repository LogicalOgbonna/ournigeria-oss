import { Suspense } from "react";
import { StructuredData } from "@/app/_seo/structured-data";
import { WelcomeModalWrapper } from "@/components/civic/WelcomeModalWrapper";
import { PageLayout } from "@/components/layout/PageLayout";
import { PersonalizedData } from "@/components/sections/PersonalizedData";
import {
  MOCK_LOCATION,
  MOCK_PARTY_SLATES,
  MOCK_RACES,
  MOCK_YEARS,
} from "@/lib/mock-home-ballot";
import { AskBlock } from "./_component/AskBlock";
import { HomeHero } from "./_component/HomeHero";

// ISR: the homepage's initial (pre-personalization) snapshot is cached and
// revalidated every 5 min instead of re-running the SSR API waterfall on every
// request. Per-user personalization stays fully live (client-side fetches in
// PersonalizedDataClient hit the DB in real time and are never cached).
//
// The hero's `?parties` / `?year` / `?party` filters are read on the client
// (see `_component/useHomeFilters`) so this page stays statically rendered.
export const revalidate = 300;

export default function Home() {
  return (
    <PageLayout>
      <StructuredData />
      <WelcomeModalWrapper />

      {/* Ballot data is a fixture today — swap these props for a
          `getElectionBallot()` + `pivotByParty()` fetch to go live. */}
      <Suspense fallback={<div className="h-225" />}>
        <HomeHero
          races={MOCK_RACES}
          slates={MOCK_PARTY_SLATES}
          location={MOCK_LOCATION}
          years={MOCK_YEARS}
        />
      </Suspense>

      <AskBlock />
      <PersonalizedData />
    </PageLayout>
  );
}
